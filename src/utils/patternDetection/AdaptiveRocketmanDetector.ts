import { CandlestickData } from '../../models/ChartTypes';
import { 
  RocketmanPattern, 
  PatternType, 
  ThrustDirection,
  RocketmanSignalStrength
} from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { BasePatternDetector, DetectionOptions } from './core/BasePatternDetector';
import { MarketContext, ThresholdConfig, MarketPhase, MarketTrend } from './core/MarketContext';

/**
 * Custom Rocketman Pattern threshold configuration
 */
export interface RocketmanThresholdConfig extends ThresholdConfig {
  minAcceleration: number;
  minPriceChange: number;
  volumeConfirmationThreshold: number;
  minAccelerationLength: number;
  detectBullish: boolean;
  detectBearish: boolean;
  // These are required by ThresholdConfig
  thrustPercentMin: number;
  retracementMin: number;
  retracementMax: number;
}

/**
 * Adaptive detector for Rocketman patterns
 * 
 * These are characterized by rapid acceleration in price with increasing momentum,
 * similar to a parabolic move or blow-off top/bottom.
 * 
 * This implementation adds several enhancements:
 * 1. Adjusts detection parameters based on market volatility
 * 2. Calculates confidence scores using multiple factors
 * 3. Classifies signal strength based on momentum and volume
 * 4. Detects both bullish and bearish patterns
 * 5. Can identify relationships with other patterns
 */
class AdaptiveRocketmanDetector extends BasePatternDetector<RocketmanPattern> {
  private readonly BASE_MIN_CANDLES = 5; // Minimum candles to form a rocketman pattern
  private readonly BASE_MIN_PRICE_CHANGE = 3.0; // Minimum price change percentage
  private readonly BASE_MIN_ACCELERATION = 1.5; // Minimum acceleration factor
  private readonly BASE_MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  private readonly MAX_LOOKBACK_PERIODS = 200; // Maximum periods to analyze

  constructor(options: Partial<DetectionOptions> = {}) {
    super(options);
  }
  
  /**
   * Returns the pattern type this detector is responsible for
   */
  public getPatternType(): PatternType {
    return PatternType.ROCKETMAN;
  }
  
  /**
   * Returns default threshold values for this pattern type
   */
  protected getDefaultThresholds(): RocketmanThresholdConfig {
    return {
      minAcceleration: 1.5,
      minPriceChange: 3.0,
      volumeConfirmationThreshold: 0.6,
      minAccelerationLength: 3,
      detectBullish: true,
      detectBearish: true,
      // Required by ThresholdConfig interface
      thrustPercentMin: 1.5,
      retracementMin: 0,
      retracementMax: 0,
      confidenceThreshold: this.BASE_MIN_CONFIDENCE
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): RocketmanThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    const volatilityFactor = context.getVolatilityFactor();
    
    // Adjust thresholds based on market volatility
    return {
      ...baseThresholds,
      // Higher volatility means we need more acceleration to confirm a pattern
      minAcceleration: baseThresholds.minAcceleration * Math.max(0.8, volatilityFactor),
      // Higher volatility means we need more price change to confirm a pattern
      minPriceChange: baseThresholds.minPriceChange * Math.max(0.8, volatilityFactor),
      // Keep other thresholds constant
    };
  }

  /**
   * Implementation of pattern detection logic for Rocketman patterns
   */
  protected detectPatterns(
    data: CandlestickData[], 
    context: MarketContext,
    thresholds: RocketmanThresholdConfig
  ): RocketmanPattern[] {
    // Ensure we have enough data
    if (data.length < this.BASE_MIN_CANDLES) {
      return []; // Not enough data
    }
    
    // Limit the data to analyze to improve performance
    const analysisData = data.slice(-Math.min(data.length, this.MAX_LOOKBACK_PERIODS));
    
    const patterns: RocketmanPattern[] = [];
    
    // Check for rocketman patterns at different window sizes
    for (let windowSize = this.BASE_MIN_CANDLES; windowSize <= Math.min(20, analysisData.length); windowSize++) {
      // Slide the window through the data
      for (let i = 0; i <= analysisData.length - windowSize; i++) {
        const windowData = analysisData.slice(i, i + windowSize);
        const pattern = this.detectInWindow(windowData, i, context, thresholds);
        
        if (pattern) {
          // Add pattern if it's valid
          patterns.push(pattern);
        }
      }
    }
    
    // Filter out overlapping patterns, keeping the ones with highest confidence
    const filteredPatterns = this.filterOverlappingPatterns(patterns);
    
    // Sort by confidence
    return filteredPatterns.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * Detect a Rocketman pattern in a specific window of data
   */
  private detectInWindow(
    windowData: CandlestickData[], 
    startIndex: number,
    context: MarketContext,
    thresholds: RocketmanThresholdConfig
  ): RocketmanPattern | null {
    // Calculate price changes for each candle
    const priceChanges = this.calculatePriceChanges(windowData);
    
    // Determine if we're looking at bullish or bearish patterns
    const isPositiveAcceleration = priceChanges.reduce((sum, change) => sum + change, 0) > 0;
    const direction = isPositiveAcceleration ? ThrustDirection.BULLISH : ThrustDirection.BEARISH;
    
    // Skip if we're not detecting this direction
    if ((direction === ThrustDirection.BULLISH && !thresholds.detectBullish) ||
        (direction === ThrustDirection.BEARISH && !thresholds.detectBearish)) {
      return null;
    }
    
    // Check for acceleration pattern
    const accelerationResult = this.checkAcceleration(priceChanges, thresholds.minAcceleration, thresholds.minAccelerationLength);
    
    if (!accelerationResult.hasAcceleration) {
      return null;
    }
    
    // Calculate total price change in the window
    const startPrice = windowData[0].close;
    const endPrice = windowData[windowData.length - 1].close;
    const totalPriceChange = Math.abs((endPrice - startPrice) / startPrice) * 100;
    
    if (totalPriceChange < thresholds.minPriceChange) {
      return null;
    }
    
    // Calculate volume changes for each candle
    const volumeChanges = this.calculateVolumeChanges(windowData);
    
    // Check for volume confirmation
    const volumeConfirmation = this.checkVolumeConfirmation(windowData, priceChanges);
    
    // Calculate peak details
    const peakIndex = accelerationResult.peakIndex;
    const peakTime = new Date(windowData[peakIndex]?.timestamp || windowData[windowData.length - 1].timestamp);
    const peakPrice = isPositiveAcceleration ? 
      Math.max(...windowData.map(d => d.high)) : 
      Math.min(...windowData.map(d => d.low));
    
    // Calculate momentum score based on acceleration, length and consistency
    const momentumScore = this.calculateMomentumScore(
      accelerationResult.accelerationRate,
      accelerationResult.accelerationLength,
      priceChanges
    );
    
    // Determine signal strength based on scores
    const signalStrength = this.determineSignalStrength(momentumScore, volumeConfirmation, totalPriceChange);
    
    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(
      momentumScore, 
      volumeConfirmation, 
      totalPriceChange,
      context
    );
    
    // Only create patterns that meet minimum confidence
    if (confidence < thresholds.confidenceThreshold) {
      return null;
    }
    
    // Calculate intensity (0-1) based on normalized momentum and price change
    const intensity = Math.min(1, (momentumScore * 0.7 + (totalPriceChange / 20) * 0.3));
    
    // Calculate highest and lowest prices in the pattern
    const highPrice = Math.max(...windowData.map(d => d.high));
    const lowPrice = Math.min(...windowData.map(d => d.low));
    
    // Create the enhanced pattern
    const pattern: RocketmanPattern = {
      id: uuidv4(),
      type: PatternType.ROCKETMAN,
      startTime: new Date(windowData[0].timestamp),
      endTime: new Date(windowData[windowData.length - 1].timestamp),
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      accelerationRate: accelerationResult.accelerationRate,
      peakTime,
      peakPrice,
      intensity,
      direction,
      priceChanges,
      volumeChanges,
      momentumScore,
      volumeConfirmation,
      signalStrength,
      adaptiveThreshold: thresholds.minAcceleration
    };
    
    return pattern;
  }
  
  /**
   * Filter out overlapping patterns, keeping the ones with highest confidence
   */
  private filterOverlappingPatterns(patterns: RocketmanPattern[]): RocketmanPattern[] {
    if (patterns.length <= 1) return patterns;
    
    // Sort by confidence, descending
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    const filtered: RocketmanPattern[] = [];
    
    for (const pattern of patterns) {
      // Check if this pattern overlaps with any already in the filtered list
      const isOverlapping = filtered.some(p => this.patternsOverlap(p, pattern));
      
      if (!isOverlapping) {
        filtered.push(pattern);
      }
    }
    
    return filtered;
  }
  
  /**
   * Check if two patterns overlap significantly
   */
  private patternsOverlap(pattern1: RocketmanPattern, pattern2: RocketmanPattern): boolean {
    const start1 = pattern1.startTime.getTime();
    const end1 = pattern1.endTime.getTime();
    const start2 = pattern2.startTime.getTime();
    const end2 = pattern2.endTime.getTime();
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Calculate overlap percentage relative to the shorter pattern
    const duration1 = end1 - start1;
    const duration2 = end2 - start2;
    const minDuration = Math.min(duration1, duration2);
    const overlapPercentage = overlapDuration / minDuration;
    
    // Consider patterns overlapping if they overlap by more than 40%
    return overlapPercentage > 0.4;
  }
  
  /**
   * Calculate percentage price changes for consecutive candles
   */
  private calculatePriceChanges(data: CandlestickData[]): number[] {
    const changes: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currClose = data[i].close;
      const percentChange = ((currClose - prevClose) / prevClose) * 100;
      changes.push(percentChange);
    }
    
    // Add a leading 0 to match the original data length
    return [0, ...changes];
  }
  
  /**
   * Calculate percentage volume changes for consecutive candles
   */
  private calculateVolumeChanges(data: CandlestickData[]): number[] {
    const changes: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const prevVolume = data[i - 1].volume;
      const currVolume = data[i].volume;
      const percentChange = prevVolume > 0 ? ((currVolume - prevVolume) / prevVolume) * 100 : 0;
      changes.push(percentChange);
    }
    
    // Add a leading 0 to match the original data length
    return [0, ...changes];
  }
  
  /**
   * Check for price acceleration pattern
   */
  private checkAcceleration(
    priceChanges: number[], 
    minAccelerationRate: number,
    minLength: number
  ): { 
    hasAcceleration: boolean; 
    accelerationRate: number;
    accelerationLength: number;
    peakIndex: number; 
  } {
    if (priceChanges.length < 4) {
      return { 
        hasAcceleration: false, 
        accelerationRate: 0, 
        accelerationLength: 0,
        peakIndex: 0 
      };
    }
    
    // Convert to absolute values to detect both upward and downward acceleration
    const absChanges = priceChanges.map(Math.abs);
    
    // Find segments with increasing change (acceleration)
    let maxAccelerationRate = 0;
    let maxAccelerationLength = 0;
    let peakIndex = 0;
    
    for (let i = 2; i < absChanges.length; i++) {
      let segmentLength = 1;
      
      // Check if we have consecutive increasing changes
      while (i + segmentLength < absChanges.length && 
             absChanges[i + segmentLength] > absChanges[i + segmentLength - 1]) {
        segmentLength++;
      }
      
      if (segmentLength >= 2) {
        // Calculate acceleration rate (average increase between consecutive changes)
        let totalAcceleration = 0;
        
        for (let j = i + 1; j < i + segmentLength; j++) {
          const acceleration = absChanges[j] / Math.max(0.1, absChanges[j - 1]); // Avoid division by zero
          totalAcceleration += acceleration;
        }
        
        const accelerationRate = totalAcceleration / (segmentLength - 1);
        
        if (accelerationRate > maxAccelerationRate) {
          maxAccelerationRate = accelerationRate;
          maxAccelerationLength = segmentLength;
          peakIndex = i + segmentLength - 1; // The last index in the acceleration sequence
        }
      }
    }
    
    // Consider it a valid acceleration if the rate and length are sufficient
    const hasAcceleration = maxAccelerationRate >= minAccelerationRate && maxAccelerationLength >= minLength;
    
    return { 
      hasAcceleration, 
      accelerationRate: maxAccelerationRate,
      accelerationLength: maxAccelerationLength,
      peakIndex
    };
  }
  
  /**
   * Check for volume confirmation of the price move
   */
  private checkVolumeConfirmation(data: CandlestickData[], priceChanges: number[]): number {
    if (data.length <= 1) return 0;
    
    let volumeConfirmationCount = 0;
    
    for (let i = 1; i < data.length; i++) {
      const prevVolume = data[i - 1].volume;
      const currVolume = data[i].volume;
      
      // Volume should increase with price in the same direction
      const volumeIncreased = currVolume > prevVolume;
      const priceChangePos = priceChanges[i] > 0;
      
      // +1 for confirmation (both increase or both decrease)
      if ((volumeIncreased && priceChangePos) || (!volumeIncreased && !priceChangePos)) {
        volumeConfirmationCount++;
      }
    }
    
    // Return as a ratio of confirmations to total comparisons
    return volumeConfirmationCount / (data.length - 1);
  }
  
  /**
   * Calculate momentum score based on acceleration rate, length and consistency
   */
  private calculateMomentumScore(
    accelerationRate: number,
    accelerationLength: number,
    priceChanges: number[]
  ): number {
    // Normalize acceleration rate (above 3.0 is very strong)
    const normalizedRate = Math.min(1, accelerationRate / 3.0);
    
    // Normalize acceleration length (above 5 periods is very strong)
    const normalizedLength = Math.min(1, accelerationLength / 5.0);
    
    // Calculate consistency (how uniform the acceleration is)
    const absChanges = priceChanges.map(Math.abs);
    const nonZeroChanges = absChanges.filter(c => c > 0);
    
    // Standard deviation of changes (lower is more consistent)
    const mean = nonZeroChanges.reduce((sum, val) => sum + val, 0) / nonZeroChanges.length;
    const squareDiffs = nonZeroChanges.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Coefficient of variation (normalized standard deviation)
    const cv = mean > 0 ? stdDev / mean : 1;
    const consistency = Math.max(0, 1 - Math.min(1, cv));
    
    // Weighted combination of factors
    return (
      normalizedRate * 0.4 +
      normalizedLength * 0.4 +
      consistency * 0.2
    );
  }
  
  /**
   * Determine signal strength based on momentum and volume confirmation
   */
  private determineSignalStrength(
    momentumScore: number,
    volumeConfirmation: number,
    priceChange: number
  ): RocketmanSignalStrength {
    // Combined score with weights
    const combinedScore = 
      momentumScore * 0.5 + 
      volumeConfirmation * 0.3 + 
      Math.min(1, priceChange / 10) * 0.2;
    
    if (combinedScore >= 0.8) {
      return RocketmanSignalStrength.VERY_STRONG;
    } else if (combinedScore >= 0.6) {
      return RocketmanSignalStrength.STRONG;
    } else if (combinedScore >= 0.4) {
      return RocketmanSignalStrength.MODERATE;
    } else {
      return RocketmanSignalStrength.WEAK;
    }
  }
  
  /**
   * Calculate confidence score for the pattern
   */
  private calculateConfidence(
    momentumScore: number,
    volumeConfirmation: number,
    priceChange: number,
    context?: MarketContext
  ): number {
    // Base confidence from pattern metrics
    let confidence = 
      momentumScore * 0.5 + 
      volumeConfirmation * 0.3 + 
      Math.min(1, priceChange / 10) * 0.2;
    
    // Apply context adjustments if available
    if (context) {
      // Market trend adjustments
      if (context.structure?.trend) {
        const trend = context.structure.trend;
        
        // Boost confidence for trends matching pattern direction
        if ((trend === MarketTrend.STRONG_UPTREND || trend === MarketTrend.MODERATE_UPTREND) && 
            momentumScore > 0.5) {
          confidence *= 1.1; // 10% boost
        } else if ((trend === MarketTrend.STRONG_DOWNTREND || trend === MarketTrend.MODERATE_DOWNTREND) && 
                    momentumScore > 0.5) {
          confidence *= 1.1; // 10% boost
        }
      }
      
      // Volume profile adjustments
      if (context.volumeProfile?.relativeVolume > 1.2) {
        confidence *= 1.1; // 10% boost for high relative volume
      }
      
      // Phase adjustments
      if (context.phase === MarketPhase.CHANNEL_BREAKOUT && momentumScore > 0.6) {
        confidence *= 1.15; // 15% boost for breakout phases
      }
    }
    
    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }
}

export default AdaptiveRocketmanDetector;
