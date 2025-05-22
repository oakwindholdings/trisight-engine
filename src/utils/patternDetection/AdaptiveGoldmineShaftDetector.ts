// src/utils/patternDetection/AdaptiveGoldmineShaftDetector.ts
// Adaptive detector for GoldmineShaft pattern
// Uses market context thresholds
import { CandlestickData } from '../../models/ChartTypes';
import { GoldmineShaftPattern, PatternType, ThrustDirection } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { 
  BasePatternDetector, 
  DetectionOptions 
} from './core/BasePatternDetector';
import { 
  MarketContext, 
  ThresholdConfig,
  Channel
} from './core/MarketContext';

/**
 * Goldmine Shaft-specific threshold configuration
 */
interface ShaftThresholdConfig extends ThresholdConfig {
  minThrustLength: number;          // Minimum number of candles for thrust phase
  minRetracementLength: number;     // Minimum number of candles for retracement
  maxRetracementLength: number;     // Maximum number of candles for retracement
  idealRetracementPercent: number;  // Ideal retracement percentage (e.g., 50%)
  retracementTolerance: number;     // Tolerance around ideal retracement
  maxVolatilityMultiplier: number;  // Max volatility for clean retracement
}

/**
 * Enhanced options for shaft detection
 */
interface ShaftDetectionOptions extends DetectionOptions {
  detectBullishShafts: boolean;
  detectBearishShafts: boolean;
  requireChannelContext: boolean;   // Whether to require channel context for detection
  preferChannelBoundaryShafts: boolean; // Prioritize shafts that start/end at channel boundaries
}

/**
 * Default shaft detection options
 */
const DEFAULT_SHAFT_OPTIONS: ShaftDetectionOptions = {
  minimumConfidence: 0.35,
  adaptiveThresholds: true,
  maxPatterns: 100,
  enableLogging: true,
  detectBullishShafts: true,
  detectBearishShafts: true,
  requireChannelContext: false,
  preferChannelBoundaryShafts: true
};

/**
 * Advanced Goldmine Shaft Detector that identifies thrust-retracement patterns
 * adapting to market conditions and context from channel structures
 */
export class AdaptiveGoldmineShaftDetector extends BasePatternDetector<GoldmineShaftPattern> {
  protected options: ShaftDetectionOptions;
  
  constructor(options: Partial<ShaftDetectionOptions> = {}) {
    super();
    this.options = { ...DEFAULT_SHAFT_OPTIONS, ...options };
  }
  
  /**
   * Returns the pattern type
   */
  public getPatternType(): PatternType {
    return PatternType.GOLDMINE_SHAFT;
  }
  
  /**
   * Returns default threshold values
   */
  protected getDefaultThresholds(): ShaftThresholdConfig {
    return {
      thrustPercentMin: 0.75,       // Minimum thrust move (%)
      retracementMin: 23.6,         // Minimum retracement (Fibonacci 23.6%)
      retracementMax: 78.6,         // Maximum retracement (Fibonacci 78.6%)
      confidenceThreshold: 0.35,    // Minimum confidence
      minThrustLength: 2,           // Minimum 2 candles for thrust
      minRetracementLength: 1,      // Minimum 1 candle for retracement
      maxRetracementLength: 10,     // Maximum 10 candles for retracement
      idealRetracementPercent: 50.0, // 50% is the ideal retracement
      retracementTolerance: 15.0,   // +/- 15% from ideal is still good
      maxVolatilityMultiplier: 1.5  // Max 1.5x volatility during retracement
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): ShaftThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    
    // Adjust based on timeframe
    let timeframeAdjust = 1.0;
    switch (context.timeframe) {
      case '1min':
        timeframeAdjust = 0.8; // Lower threshold for 1-min candles
        break;
      case '5min':
        timeframeAdjust = 0.9; // Slightly lower for 5-min
        break;
      case '1hour':
        timeframeAdjust = 1.2; // Higher for 1-hour
        break;
      case '1day':
        timeframeAdjust = 1.5; // Much higher for daily
        break;
    }
    
    // Adjust based on volatility
    const volatilityFactor = Math.max(0.5, Math.min(2.0, context.volatility / 1.0));
    
    // Adjust thrust percent based on overall context
    let thrustAdjust = timeframeAdjust * volatilityFactor;
    
    // If we have channel context, adjust based on channel width
    if (context.activeChannels.length > 0) {
      const channelWidthPercent = context.channelWidthPercentage;
      
      // Scale thrust requirement relative to channel width
      // For wider channels, we expect larger thrust moves
      const channelFactor = channelWidthPercent / 5.0; // Normalize to 5% width
      thrustAdjust *= channelFactor;
      
      // If we're near a channel boundary, lower the threshold to catch breakouts early
      if (context.currentPositionInChannel < 0.2 || context.currentPositionInChannel > 0.8) {
        thrustAdjust *= 0.8;
      }
      
      // If breakout potential is high, be more sensitive
      if (context.breakoutPotential > 0.7) {
        thrustAdjust *= 0.9;
      }
    }
    
    // Adjust retracement bounds based on market phase
    let retracementMinAdjust = 1.0;
    let retracementMaxAdjust = 1.0;
    
    switch (context.phase) {
      case 'CHANNEL_BREAKOUT' as any:
        // In breakouts, expect shallower retracements
        retracementMinAdjust = 0.9; // Lower minimum
        retracementMaxAdjust = 0.85; // Lower maximum even more
        break;
      case 'CHANNEL_CONTRACTION' as any:
        // In contractions, expect deeper retracements
        retracementMinAdjust = 1.1; // Higher minimum
        retracementMaxAdjust = 1.05; // Higher maximum
        break;
    }
    
    return {
      ...baseThresholds,
      thrustPercentMin: baseThresholds.thrustPercentMin * thrustAdjust,
      retracementMin: baseThresholds.retracementMin * retracementMinAdjust,
      retracementMax: baseThresholds.retracementMax * retracementMaxAdjust,
      minThrustLength: context.timeframe === '1min' ? 2 : 3,
      maxVolatilityMultiplier: baseThresholds.maxVolatilityMultiplier * (1 / volatilityFactor)
    };
  }
  
  /**
   * Detect shaft patterns in the given data
   */
  protected detectPatterns(
    data: CandlestickData[],
    context: MarketContext,
    thresholds: ShaftThresholdConfig
  ): GoldmineShaftPattern[] {
    if (data.length < thresholds.minThrustLength + thresholds.minRetracementLength) {
      console.log('Insufficient data for shaft detection');
      return [];
    }
    
    const patterns: GoldmineShaftPattern[] = [];
    
    // If channel context is required but missing, return empty
    if (this.options.requireChannelContext && context.activeChannels.length === 0) {
      console.log('No channel context available, skipping shaft detection');
      return [];
    }
    
    // Process the data in windows of varying sizes
    for (let thrustLength = thresholds.minThrustLength; 
         thrustLength <= Math.min(15, data.length - thresholds.minRetracementLength); 
         thrustLength++) {
      
      for (let i = 0; i <= data.length - (thrustLength + thresholds.minRetracementLength); i++) {
        // Only detect patterns enabled in options
        if (this.options.detectBullishShafts) {
          const bullishPattern = this.detectThrust(
            data, i, thrustLength, ThrustDirection.BULLISH, context, thresholds
          );
          
          if (bullishPattern) {
            this.detectionStats.candidatesEvaluated++;
            patterns.push(bullishPattern);
          }
        }
        
        if (this.options.detectBearishShafts) {
          const bearishPattern = this.detectThrust(
            data, i, thrustLength, ThrustDirection.BEARISH, context, thresholds
          );
          
          if (bearishPattern) {
            this.detectionStats.candidatesEvaluated++;
            patterns.push(bearishPattern);
          }
        }
      }
    }
    
    // Filter overlapping patterns
    return this.filterOverlappingPatterns(patterns, context);
  }
  
  /**
   * Post-process detected shafts
   */
  protected postProcessPatterns(
    patterns: GoldmineShaftPattern[], 
    context: MarketContext
  ): GoldmineShaftPattern[] {
    if (patterns.length === 0) return patterns;
    
    // Apply channel-aware confidence boost if requested
    if (this.options.preferChannelBoundaryShafts && context.activeChannels.length > 0) {
      patterns = patterns.map(pattern => {
        // Check if pattern starts/ends near channel boundaries
        const boundaryAdjustedPattern = this.applyChannelBoundaryBoost(pattern, context.activeChannels);
        return boundaryAdjustedPattern;
      });
    }
    
    // Continue with standard filtering
    return super.postProcessPatterns(patterns, context);
  }
  
  /**
   * Detect a thrust pattern of specified direction in the data
   */
  private detectThrust(
    data: CandlestickData[], 
    startIndex: number,
    thrustLength: number,
    direction: ThrustDirection,
    context: MarketContext,
    thresholds: ShaftThresholdConfig
  ): GoldmineShaftPattern | null {
    // Extract the thrust window
    const thrustWindow = data.slice(startIndex, startIndex + thrustLength);
    
    // Calculate thrust characteristics
    const thrustStartPrice = thrustWindow[0].close;
    const thrustEndPrice = thrustWindow[thrustWindow.length - 1].close;
    
    // Calculate the thrust move as a percentage
    let thrustChange: number;
    if (direction === ThrustDirection.BULLISH) {
      thrustChange = ((thrustEndPrice - thrustStartPrice) / thrustStartPrice) * 100;
      // For bullish, we need a positive thrust change
      if (thrustChange <= 0) return null;
    } else {
      thrustChange = ((thrustStartPrice - thrustEndPrice) / thrustStartPrice) * 100;
      // For bearish, we need a positive thrust change (price went down)
      if (thrustChange <= 0) return null;
    }
    
    // Check if thrust is strong enough
    if (thrustChange < thresholds.thrustPercentMin) {
      return null;
    }
    
    // Find the retracement
    let bestRetracementLength = 0;
    let bestRetracementPercentage = 0;
    let bestConfidence = 0;
    
    // Adapted retracement analysis that considers:
    // 1. Fibonacci retracement levels
    // 2. Volatility context
    // 3. Channel boundary alignment
    
    for (let retracementLength = thresholds.minRetracementLength; 
         retracementLength <= Math.min(thresholds.maxRetracementLength, 
                                    data.length - startIndex - thrustLength); 
         retracementLength++) {
      
      const retracementEnd = startIndex + thrustLength + retracementLength;
      const retracementEndPrice = data[retracementEnd - 1].close;
      
      // Calculate retracement percentage
      let retracementPercentage: number;
      if (direction === ThrustDirection.BULLISH) {
        retracementPercentage = ((thrustEndPrice - retracementEndPrice) / (thrustEndPrice - thrustStartPrice)) * 100;
      } else {
        retracementPercentage = ((retracementEndPrice - thrustEndPrice) / (thrustStartPrice - thrustEndPrice)) * 100;
      }
      
      // If the retracement is within our valid range
      if (retracementPercentage >= thresholds.retracementMin && 
          retracementPercentage <= thresholds.retracementMax) {
        
        // Calculate confidence based on multiple factors
        
        // 1. Retracement quality (how close to ideal 50% retracement)
        const retracementFactor = 1 - (Math.abs(retracementPercentage - thresholds.idealRetracementPercent) / 
                                     thresholds.idealRetracementPercent);
        
        // 2. Thrust strength relative to requirements
        const strengthFactor = Math.min(thrustChange / (thresholds.thrustPercentMin * 2), 1);
        
        // 3. Volatility during retracement (lower is better)
        const retracementWindow = data.slice(startIndex + thrustLength, retracementEnd);
        const retracementVolatility = this.calculateVolatility(retracementWindow);
        const volatilityFactor = Math.max(0, 1 - (retracementVolatility / (context.volatility * thresholds.maxVolatilityMultiplier)));
        
        // 4. Channel alignment factor (if channels exist)
        let channelFactor = 0.5; // Neutral default
        if (context.activeChannels.length > 0) {
          channelFactor = this.calculateChannelAlignmentFactor(
            data, startIndex, thrustLength, retracementLength, 
            direction, context.activeChannels
          );
        }
        
        // 5. Market phase alignment
        let phaseFactor = 0.5; // Default neutral
        if (context.phase) {
          const isBreakoutPhase = context.phase === 'CHANNEL_BREAKOUT' as any;
          const isContinuationPhase = context.phase === 'CHANNEL_CONTINUATION' as any;
          
          // Access trend through structure property
          const marketTrend = context.structure?.trend || 'NEUTRAL';
          const isUptrend = marketTrend === 'MODERATE_UPTREND' || marketTrend === 'STRONG_UPTREND';
          const isDowntrend = marketTrend === 'MODERATE_DOWNTREND' || marketTrend === 'STRONG_DOWNTREND';
          
          if (isBreakoutPhase ||
            (isContinuationPhase && 
              ((direction === ThrustDirection.BULLISH && isUptrend) ||
               (direction === ThrustDirection.BEARISH && isDowntrend)))) {
            phaseFactor = 0.8; // Higher for aligned conditions
          }
        }
        
        // Combined confidence with weighted factors
        const confidence = (
          strengthFactor * 0.25 + 
          retracementFactor * 0.30 + 
          volatilityFactor * 0.15 +
          channelFactor * 0.20 +
          phaseFactor * 0.10
        );
        
        if (confidence > bestConfidence) {
          bestRetracementLength = retracementLength;
          bestRetracementPercentage = retracementPercentage;
          bestConfidence = confidence;
        }
      }
    }
    
    // If we didn't find a valid retracement
    if (bestRetracementLength === 0 || bestConfidence < thresholds.confidenceThreshold) {
      return null;
    }
    
    // Pattern boundaries
    const patternStartIndex = startIndex;
    const patternEndIndex = startIndex + thrustLength + bestRetracementLength;
    
    const startTime = new Date(data[patternStartIndex].timestamp);
    const endTime = new Date(data[patternEndIndex - 1].timestamp);
    const thrustStartTime = new Date(data[startIndex].timestamp);
    const thrustEndTime = new Date(data[startIndex + thrustLength - 1].timestamp);
    
    // Get overall high and low prices in the pattern
    const prices = data.slice(patternStartIndex, patternEndIndex).map(d => [d.high, d.low]).flat();
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    
    // Get thrust high and low
    const thrustPrices = thrustWindow.map(d => [d.high, d.low]).flat();
    const thrustHighPrice = Math.max(...thrustPrices);
    const thrustLowPrice = Math.min(...thrustPrices);
    
    // Construct the pattern
    const pattern: GoldmineShaftPattern = {
      id: uuidv4(),
      type: PatternType.GOLDMINE_SHAFT,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence: bestConfidence,
      hasReceivedFeedback: false,
      direction,
      thrustStartTime,
      thrustEndTime,
      thrustHighPrice,
      thrustLowPrice,
      retracementPercentage: bestRetracementPercentage
    };
    
    return pattern;
  }
  
  /**
   * Filter overlapping patterns, keeping only the higher confidence ones
   */
  private filterOverlappingPatterns(
    patterns: GoldmineShaftPattern[],
    context: MarketContext
  ): GoldmineShaftPattern[] {
    if (patterns.length <= 1) return patterns;
    
    // Sort by confidence, descending
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    const result: GoldmineShaftPattern[] = [];
    
    for (const pattern of patterns) {
      // Check if this pattern overlaps with any already in the result
      const isOverlapping = result.some(p => this.patternsOverlap(p, pattern));
      
      if (!isOverlapping) {
        result.push(pattern);
      }
    }
    
    return result;
  }
  
  /**
   * Check if two patterns overlap significantly
   */
  private patternsOverlap(
    pattern1: GoldmineShaftPattern, 
    pattern2: GoldmineShaftPattern
  ): boolean {
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
    
    // Consider patterns overlapping if they overlap by more than 30%
    return overlapPercentage > 0.3;
  }
  
  /**
   * Calculate price volatility in a window
   */
  private calculateVolatility(windowData: CandlestickData[]): number {
    if (windowData.length <= 1) return 0;
    
    // Calculate daily percentage changes
    const changes: number[] = [];
    for (let i = 1; i < windowData.length; i++) {
      const prevClose = windowData[i - 1].close;
      const currClose = windowData[i].close;
      const percentChange = Math.abs((currClose - prevClose) / prevClose) * 100;
      changes.push(percentChange);
    }
    
    // Calculate average change (simple volatility measure)
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }
  
  /**
   * Calculate how well a pattern aligns with channel boundaries
   * Returns a factor from 0.0 to 1.0 (higher = better alignment)
   */
  private calculateChannelAlignmentFactor(
    data: CandlestickData[],
    startIndex: number,
    thrustLength: number,
    retracementLength: number,
    direction: ThrustDirection,
    channels: Channel[]
  ): number {
    // No channels, neutral alignment
    if (channels.length === 0) return 0.5;
    
    const thrustStartTime = new Date(data[startIndex].timestamp);
    const thrustEndTime = new Date(data[startIndex + thrustLength - 1].timestamp);
    const retracementEndTime = new Date(data[startIndex + thrustLength + retracementLength - 1].timestamp);
    
    const thrustStartPrice = data[startIndex].close;
    const thrustEndPrice = data[startIndex + thrustLength - 1].close;
    const retracementEndPrice = data[startIndex + thrustLength + retracementLength - 1].close;
    
    // Find channels that overlap with our pattern time
    const relevantChannels = channels.filter(ch => 
      thrustStartTime >= ch.startTime && retracementEndTime <= ch.endTime
    );
    
    if (relevantChannels.length === 0) return 0.5;
    
    // Use the most confident channel
    const channel = relevantChannels.sort((a, b) => b.confidence - a.confidence)[0];
    
    // Check if pattern starts or ends near channel boundaries
    const boundaryThreshold = 0.3; // % of channel width
    const channelWidth = channel.upperBoundary - channel.lowerBoundary;
    const thresholdDistance = channelWidth * boundaryThreshold;
    
    // Calculate distances to boundaries at key points
    const thrustStartUpperDist = Math.abs(channel.upperBoundary - thrustStartPrice);
    const thrustStartLowerDist = Math.abs(thrustStartPrice - channel.lowerBoundary);
    const thrustEndUpperDist = Math.abs(channel.upperBoundary - thrustEndPrice);
    const thrustEndLowerDist = Math.abs(thrustEndPrice - channel.lowerBoundary);
    const retracementEndUpperDist = Math.abs(channel.upperBoundary - retracementEndPrice);
    const retracementEndLowerDist = Math.abs(retracementEndPrice - channel.lowerBoundary);
    
    // Check if pattern aligns with channel boundaries
    let alignmentFactor = 0.5; // Start with neutral
    
    // Scenarios that increase confidence:
    
    // 1. Thrust starts at one boundary and ends near opposite boundary
    if ((thrustStartUpperDist < thresholdDistance && thrustEndLowerDist < thresholdDistance) ||
        (thrustStartLowerDist < thresholdDistance && thrustEndUpperDist < thresholdDistance)) {
      alignmentFactor = 0.9; // Strong channel boundary to boundary move
    }
    // 2. Thrust starts at boundary and retracement ends back at same boundary
    else if ((thrustStartUpperDist < thresholdDistance && retracementEndUpperDist < thresholdDistance) ||
             (thrustStartLowerDist < thresholdDistance && retracementEndLowerDist < thresholdDistance)) {
      alignmentFactor = 0.85; // Strong return to boundary
    }
    // 3. Thrust breaks out of channel and retracement returns to boundary
    else if ((thrustStartUpperDist < thresholdDistance && thrustEndPrice > channel.upperBoundary && 
              retracementEndUpperDist < thresholdDistance) ||
             (thrustStartLowerDist < thresholdDistance && thrustEndPrice < channel.lowerBoundary && 
              retracementEndLowerDist < thresholdDistance)) {
      alignmentFactor = 0.8; // Breakout and return
    }
    // 4. Any pattern that starts at a boundary
    else if (thrustStartUpperDist < thresholdDistance || thrustStartLowerDist < thresholdDistance) {
      alignmentFactor = 0.7; // Started at boundary
    }
    // 5. Any pattern that ends at a boundary
    else if (retracementEndUpperDist < thresholdDistance || retracementEndLowerDist < thresholdDistance) {
      alignmentFactor = 0.65; // Ended at boundary
    }
    
    return alignmentFactor;
  }
  
  /**
   * Boost confidence of patterns that align with channel boundaries
   */
  private applyChannelBoundaryBoost(
    pattern: GoldmineShaftPattern,
    channels: Channel[]
  ): GoldmineShaftPattern {
    // Find channels that overlap with the pattern
    const relevantChannels = channels.filter(ch => 
      pattern.startTime >= ch.startTime && pattern.endTime <= ch.endTime
    );
    
    if (relevantChannels.length === 0) return pattern;
    
    // Use the most confident channel
    const channel = relevantChannels.sort((a, b) => b.confidence - a.confidence)[0];
    
    // Check proximity to boundaries
    const boundaryThreshold = 0.15; // % of channel width
    const channelWidth = channel.upperBoundary - channel.lowerBoundary;
    const thresholdDistance = channelWidth * boundaryThreshold;
    
    // Key prices
    const thrustStartPrice = pattern.direction === ThrustDirection.BULLISH 
      ? pattern.thrustLowPrice : pattern.thrustHighPrice;
    
    const thrustEndPrice = pattern.direction === ThrustDirection.BULLISH 
      ? pattern.thrustHighPrice : pattern.thrustLowPrice;
    
    // Distance to boundaries
    const startUpperDist = Math.abs(channel.upperBoundary - thrustStartPrice);
    const startLowerDist = Math.abs(thrustStartPrice - channel.lowerBoundary);
    const endUpperDist = Math.abs(channel.upperBoundary - thrustEndPrice);
    const endLowerDist = Math.abs(thrustEndPrice - channel.lowerBoundary);
    
    // Check for boundary alignment
    const startAtBoundary = startUpperDist < thresholdDistance || startLowerDist < thresholdDistance;
    const endAtBoundary = endUpperDist < thresholdDistance || endLowerDist < thresholdDistance;
    
    // Apply confidence boost for channel alignment
    let confidenceBoost = 0;
    
    if (startAtBoundary && endAtBoundary) {
      // Pattern goes from one boundary to another - strongest case
      confidenceBoost = 0.15;
    } else if (startAtBoundary || endAtBoundary) {
      // Pattern starts or ends at a boundary
      confidenceBoost = 0.08;
    }
    
    // Create a new pattern with boosted confidence
    return {
      ...pattern,
      confidence: Math.min(1.0, pattern.confidence + confidenceBoost)
    };
  }
}
