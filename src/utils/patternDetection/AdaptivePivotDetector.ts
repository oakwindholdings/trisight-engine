import { CandlestickData } from '../../models/ChartTypes';
import { 
  PivotPattern, 
  PatternType, 
  PivotType
} from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { BasePatternDetector, DetectionOptions } from './core/BasePatternDetector';
import { MarketContext, ThresholdConfig, MarketPhase } from './core/MarketContext';
import PivotDetectionUtils from './helper/PivotDetectionUtils';

/**
 * Custom Pivot Pattern threshold configuration
 */
export interface PivotThresholdConfig extends ThresholdConfig {
  touchPointThreshold: number;
  priceTolerance: number;
  confidenceThreshold: number;
  volumeReactionThreshold: number;
  minimumTouchGap: number;
  detectSupport: boolean;
  detectResistance: boolean;
  // These are required by ThresholdConfig
  thrustPercentMin: number;
  retracementMin: number;
  retracementMax: number;
}

/**
 * Adaptive detector for Pivot patterns
 * 
 * This implementation adds several enhancements:
 * 1. Adjusts detection parameters based on market volatility
 * 2. Calculates confidence scores using multiple factors
 * 3. Uses adaptive zone width based on price action
 * 4. Measures volume and price reactions at pivot points
 * 5. Can identify relationships with other patterns
 */
class AdaptivePivotDetector extends BasePatternDetector<PivotPattern> {
  private readonly BASE_MIN_TOUCH_POINTS = 2; // Minimum number of touches to identify a pivot
  private readonly BASE_PRICE_TOLERANCE = 0.25; // Base percentage tolerance for price level
  private readonly BASE_MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  private readonly MAX_LOOKBACK_PERIODS = 150; // Maximum periods to analyze

  constructor(options: Partial<DetectionOptions> = {}) {
    super(options);
  }
  
  /**
   * Returns the pattern type this detector is responsible for
   */
  public getPatternType(): PatternType {
    return PatternType.PIVOT;
  }
  
  /**
   * Returns default threshold values for this pattern type
   */
  protected getDefaultThresholds(): PivotThresholdConfig {
    return {
      touchPointThreshold: 3,
      priceTolerance: 0.3,
      confidenceThreshold: 0.6,
      volumeReactionThreshold: 1.2,
      minimumTouchGap: 3,
      detectSupport: true,
      detectResistance: true,
      // Required by ThresholdConfig interface
      thrustPercentMin: 0,
      retracementMin: 0,
      retracementMax: 0
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): PivotThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    const volatilityFactor = context.getVolatilityFactor();
    
    return {
      ...baseThresholds,
      // Adjust price tolerance based on volatility
      priceTolerance: baseThresholds.priceTolerance * volatilityFactor,
      // Keep the rest of the thresholds unchanged
    };
  }

  /**
   * Implementation of pattern detection logic for Pivot patterns
   */
  protected detectPatterns(
    data: CandlestickData[], 
    context: MarketContext,
    thresholds: PivotThresholdConfig
  ): PivotPattern[] {
    // Ensure we have enough data
    if (data.length < thresholds.touchPointThreshold * 2) {
      return []; // Not enough data
    }

    // Limit the data to analyze to improve performance
    const analysisData = data.slice(-Math.min(data.length, this.MAX_LOOKBACK_PERIODS));
    
    // Calculate adaptive parameters based on market volatility
    const volatilityFactor = context.getVolatilityFactor();
    const adaptivePriceTolerance = thresholds.priceTolerance * volatilityFactor;
    const adaptiveMinTouches = Math.max(
      this.BASE_MIN_TOUCH_POINTS,
      Math.floor(thresholds.touchPointThreshold / Math.max(0.5, volatilityFactor))
    );
    
    const patterns: PivotPattern[] = [];
    
    // Detect support and resistance pivot levels with adaptive parameters
    const supportLevels = thresholds.detectSupport !== false ? 
      this.detectAdaptivePivotLevels(analysisData, PivotType.SUPPORT, adaptivePriceTolerance, adaptiveMinTouches, context) : [];
    
    const resistanceLevels = thresholds.detectResistance !== false ? 
      this.detectAdaptivePivotLevels(analysisData, PivotType.RESISTANCE, adaptivePriceTolerance, adaptiveMinTouches, context) : [];
    
    // Combine all pivot patterns
    patterns.push(...supportLevels, ...resistanceLevels);
    
    // Filter out redundant patterns
    const filteredPatterns = this.filterRedundantPivots(patterns, adaptivePriceTolerance);
    
    // Sort by strength score
    filteredPatterns.sort((a: PivotPattern, b: PivotPattern) => b.strengthScore - a.strengthScore);
    
    return filteredPatterns;
  }
  
  /**
   * Detect pivot levels of a specific type with adaptive parameters
   */
  private detectAdaptivePivotLevels(
    data: CandlestickData[], 
    pivotType: PivotType, 
    priceTolerance: number,
    minTouches: number,
    context?: MarketContext
  ): PivotPattern[] {
    const pivots: PivotPattern[] = [];
    const priceRange = PivotDetectionUtils.calculatePriceRange(data);
    const adaptiveZoneWidth = priceRange * (priceTolerance / 100);
    
    // Get potential pivot levels using local maxima/minima 
    const pivotLevels = this.identifyPotentialPivotLevels(data, pivotType);
    
    // Analyze each potential pivot level
    for (const pivotLevel of pivotLevels) {
      // Get optimized touches at this level
      const pivotTouches = PivotDetectionUtils.findPriceTouches(
        data,
        pivotLevel,
        adaptiveZoneWidth,
        pivotType,
        this.getDefaultThresholds().minimumTouchGap
      );
      
      if (pivotTouches.length >= minTouches) {
        // Create an enhanced pivot pattern with adaptive scoring
        const pivotPattern = this.createAdaptivePivotPattern(
          data, 
          pivotLevel, 
          pivotTouches, 
          pivotType, 
          priceRange,
          adaptiveZoneWidth,
          context
        );
        
        // Add to list if it meets confidence threshold
        if (pivotPattern.confidence >= Math.min(this.options.minimumConfidence, this.BASE_MIN_CONFIDENCE)) {
          pivots.push(pivotPattern);
        }
      }
    }
    
    return pivots;
  }

  /**
   * Identify potential pivot levels based on local maxima/minima
   */
  private identifyPotentialPivotLevels(data: CandlestickData[], pivotType: PivotType): number[] {
    const potentialLevels: number[] = [];
    const lookbackWindow = Math.min(10, Math.floor(data.length / 10));
    
    if (data.length < lookbackWindow * 2) {
      return []; // Not enough data
    }
    
    // For support, we analyze price lows; for resistance, price highs
    const prices = data.map(d => pivotType === PivotType.SUPPORT ? d.low : d.high);
    
    // Find local minima/maxima as potential pivot points
    for (let i = lookbackWindow; i < data.length - lookbackWindow; i++) {
      const currentPrice = prices[i];
      
      // For support, find local minima
      if (pivotType === PivotType.SUPPORT) {
        let isLocalMin = true;
        
        // Check if current price is lower than surrounding prices
        for (let j = i - lookbackWindow; j <= i + lookbackWindow; j++) {
          if (j !== i && prices[j] < currentPrice) {
            isLocalMin = false;
            break;
          }
        }
        
        if (isLocalMin) {
          potentialLevels.push(currentPrice);
        }
      } 
      // For resistance, find local maxima
      else {
        let isLocalMax = true;
        
        // Check if current price is higher than surrounding prices
        for (let j = i - lookbackWindow; j <= i + lookbackWindow; j++) {
          if (j !== i && prices[j] > currentPrice) {
            isLocalMax = false;
            break;
          }
        }
        
        if (isLocalMax) {
          potentialLevels.push(currentPrice);
        }
      }
    }
    
    // If no local extrema found, add some price levels based on quartiles
    if (potentialLevels.length === 0) {
      prices.sort((a, b) => a - b);
      
      // Add quartile levels
      const q1Index = Math.floor(prices.length * 0.25);
      const q2Index = Math.floor(prices.length * 0.5);
      const q3Index = Math.floor(prices.length * 0.75);
      
      potentialLevels.push(
        prices[q1Index],
        prices[q2Index],
        prices[q3Index]
      );
    }
    
    // Remove duplicates by grouping similar price levels
    const priceRange = Math.max(...prices) - Math.min(...prices);
    const similarityThreshold = priceRange * 0.02; // 2% of range
    
    const uniqueLevels: number[] = [];
    potentialLevels.sort((a, b) => a - b);
    
    for (const level of potentialLevels) {
      // Check if this level is similar to any existing unique level
      const isSimilar = uniqueLevels.some(
        uniqueLevel => Math.abs(level - uniqueLevel) < similarityThreshold
      );
      
      if (!isSimilar) {
        uniqueLevels.push(level);
      }
    }
    
    return uniqueLevels;
  }
  
  /**
   * Create an enhanced pivot pattern with adaptive scoring
   */
  private createAdaptivePivotPattern(
    data: CandlestickData[],
    pivotLevel: number,
    touches: Array<{ time: Date; price: number; index: number }>,
    pivotType: PivotType,
    priceRange: number,
    adaptiveZoneWidth: number,
    context?: MarketContext
  ): PivotPattern {
    // Determine start and end times
    const startTime = touches[0].time;
    const endTime = touches[touches.length - 1].time;
    
    // Calculate touch strength based on price reaction at pivot
    const touchStrength = PivotDetectionUtils.calculateTouchStrength(data, touches, pivotType, priceRange);
    
    // Calculate temporal distribution - how evenly spaced are the touches?
    const temporalDistribution = PivotDetectionUtils.calculateTemporalDistribution(touches);
    
    // Calculate price consistency - how close are the touch points to the pivot level?
    const priceConsistency = PivotDetectionUtils.calculatePriceConsistency(touches, pivotLevel);
    
    // Calculate volume reactions at touch points
    const volumeReactions = PivotDetectionUtils.calculateVolumeReactions(
      data, touches, this.getDefaultThresholds().volumeReactionThreshold
    );
    
    // Calculate price reactions at touch points
    const priceReactions = PivotDetectionUtils.calculatePriceReactions(data, touches, pivotType);
    
    // Calculate overall strength score
    const strengthScore = this.calculateStrengthScore(
      touchStrength,
      temporalDistribution,
      priceConsistency,
      volumeReactions,
      context
    );
    
    // Adjust confidence based on market context if available
    let confidenceAdjustment = 1.0;
    if (context?.phase) {
      // Adjust based on market phase
      if ((pivotType === PivotType.SUPPORT && 
           (context.phase === MarketPhase.CHANNEL_FORMATION || context.phase === MarketPhase.CHANNEL_CONTRACTION)) ||
          (pivotType === PivotType.RESISTANCE && 
           (context.phase === MarketPhase.CHANNEL_BREAKOUT || context.phase === MarketPhase.CHANNEL_EXPANSION))) {
        confidenceAdjustment = 1.2; // Boost confidence in favorable phases
      }
    }
    
    // Calculate high and low prices for visualization
    const highPrice = pivotType === PivotType.RESISTANCE ? 
      pivotLevel + (adaptiveZoneWidth / 2) : 
      Math.max(...data
        .filter(d => d.timestamp >= startTime.getTime() && d.timestamp <= endTime.getTime())
        .map(d => d.high)
      );
    
    const lowPrice = pivotType === PivotType.SUPPORT ? 
      pivotLevel - (adaptiveZoneWidth / 2) : 
      Math.min(...data
        .filter(d => d.timestamp >= startTime.getTime() && d.timestamp <= endTime.getTime())
        .map(d => d.low)
      );
    
    // Create the enhanced pivot pattern object
    const pivotPattern: PivotPattern = {
      id: uuidv4(),
      type: PatternType.PIVOT,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence: Math.min(1.0, strengthScore * confidenceAdjustment),
      hasReceivedFeedback: false,
      pivotType,
      pivotLevel,
      touchPoints: touches.map(t => ({ time: t.time, price: t.price })),
      touchStrength,
      temporalDistribution,
      priceConsistency,
      volumeReactions,
      priceReactions,
      strengthScore,
      adaptiveZoneWidth
    };
    
    return pivotPattern;
  }

  private calculateStrengthScore(
    touchStrength: number,
    temporalDistribution: number,
    priceConsistency: number,
    volumeReactions: number[],
    context?: MarketContext
  ): number {
    // Weights for each factor
    const weights = {
      touchStrength: 0.4,
      distribution: 0.2,
      consistency: 0.3,
      volumeReaction: 0.1
    };
    
    // Calculate average volume reaction
    const avgVolumeReaction = volumeReactions.length > 0 ?
      volumeReactions.reduce((sum: number, val: number) => sum + val, 0) / volumeReactions.length : 0;
    
    // Adjust weights based on market context if available
    if (context) {
      // Increase importance of volume in high volume environments
      if (context.volumeProfile.relativeVolume > 1.2) {
        weights.volumeReaction += 0.1;
        weights.touchStrength -= 0.1;
      }
      
      // Increase importance of consistency in accumulation/distribution phases
      if (context.phase === MarketPhase.CHANNEL_FORMATION) {
        weights.consistency += 0.1;
        weights.distribution -= 0.1;
      } else if (context.phase === MarketPhase.CHANNEL_BREAKOUT) {
        weights.consistency += 0.1;
        weights.touchStrength -= 0.1;
      }
    }
    
    // Calculate overall strength score
    const strengthScore = (
      touchStrength * weights.touchStrength +
      temporalDistribution * weights.distribution +
      priceConsistency * weights.consistency +
      avgVolumeReaction * weights.volumeReaction
    );
    
    return strengthScore;
  }
  
  /**
   * Filter out redundant pivot levels that are too close to each other
   */
  private filterRedundantPivots(pivots: PivotPattern[], adaptiveTolerance: number): PivotPattern[] {
    if (pivots.length <= 1) return pivots;
    
    const result: PivotPattern[] = [];
    const maxPivotPercentage = adaptiveTolerance * 2; // Maximum distance as percentage
    
    // Sort by strength score in descending order
    pivots.sort((a, b) => b.strengthScore - a.strengthScore);
    
    for (const pivot of pivots) {
      // Check if this pivot is too close to any already in the result
      const isTooClose = result.some(p => 
        p.pivotType === pivot.pivotType && 
        Math.abs(p.pivotLevel - pivot.pivotLevel) / Math.max(p.pivotLevel, pivot.pivotLevel) < (maxPivotPercentage / 100)
      );
      
      if (!isTooClose) {
        result.push(pivot);
      }
    }
    
    return result;
  }

}

export default AdaptivePivotDetector;
