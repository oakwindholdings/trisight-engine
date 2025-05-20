import { CandlestickData } from '../../models/ChartTypes';
import { GoldmineChannelPattern, PatternType, ChannelDirection } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { 
  BasePatternDetector, 
  DetectionOptions 
} from './core/BasePatternDetector';
import { 
  MarketContext, 
  ThresholdConfig 
} from './core/MarketContext';
import {
  ChannelDetectionUtils,
  TouchPoint,
  RegressionResult,
  BoundaryLine
} from './helper/ChannelDetectionUtils';

/**
 * Convert datetime string to Date object
 */
function parseDatetime(datetime: string): Date {
  return new Date(datetime);
}

/**
 * Channel-specific threshold configuration
 */
interface ChannelThresholdConfig extends ThresholdConfig {
  minChannelWidth: number;        // Minimum width as percentage of price
  maxChannelWidth: number;        // Maximum width as percentage of price
  minTouchPoints: number;         // Minimum number of touches to establish a channel
  minChannelDuration: number;     // Minimum duration in candles
  bounceDetectionThreshold: number; // How close price must come to boundary to count as touch
  linearityThreshold: number;     // How closely boundaries must follow straight lines
}

/**
 * Type of channel detection algorithm
 */
enum ChannelDetectionAlgorithm {
  REGRESSION = 'REGRESSION',
  SWING = 'SWING',
  VOLATILITY = 'VOLATILITY'
}

/**
 * Enhanced options for channel detection
 */
interface ChannelDetectionOptions extends DetectionOptions {
  /**
   * Minimum length required for pattern detection
   */
  minPatternLength?: number;
  detectionAlgorithms: ChannelDetectionAlgorithm[];
  prioritizeHorizontalChannels: boolean;
  detectTrendingChannels: boolean;
}

/**
 * Default channel detection options
 */
const DEFAULT_CHANNEL_OPTIONS: ChannelDetectionOptions = {
  minimumConfidence: 0.4,
  adaptiveThresholds: true,
  maxPatterns: 50,
  enableLogging: false,
  detectionAlgorithms: [
    ChannelDetectionAlgorithm.REGRESSION, 
    ChannelDetectionAlgorithm.SWING,
    ChannelDetectionAlgorithm.VOLATILITY
  ],
  prioritizeHorizontalChannels: true,
  detectTrendingChannels: true
};

/**
 * Advanced Goldmine Channel Detector that identifies price channels
 * using multiple detection algorithms and adapts to market conditions
 */
export class AdaptiveGoldmineChannelDetector extends BasePatternDetector<GoldmineChannelPattern> {
  protected options: ChannelDetectionOptions;
  
  constructor(options: Partial<ChannelDetectionOptions> = {}) {
    super();
    this.options = { ...DEFAULT_CHANNEL_OPTIONS, ...options };
  }
  
  /**
   * Returns the pattern type
   */
  public getPatternType(): PatternType {
    return PatternType.GOLDMINE_CHANNEL;
  }
  
  /**
   * Returns default threshold values
   */
  protected getDefaultThresholds(): ChannelThresholdConfig {
    return {
      thrustPercentMin: 0, // Not used for channels
      retracementMin: 0,   // Not used for channels
      retracementMax: 0,   // Not used for channels
      confidenceThreshold: 0.4,
      minChannelWidth: 1.0,    // 1% minimum width
      maxChannelWidth: 15.0,   // 15% maximum width
      minTouchPoints: 3,       // At least 3 touches to establish a channel
      minChannelDuration: 10,  // At least 10 candles
      bounceDetectionThreshold: 0.2, // 0.2% from boundary to count as touch
      linearityThreshold: 0.8  // 0.8 minimum R² for linear regression fit
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): ChannelThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    
    // Adjust based on volatility
    const volatilityFactor = context.volatility / 1.5; // Normalize to 1.5% volatility
    const volAdjust = Math.max(0.5, Math.min(2.0, volatilityFactor));
    
    // Adjust channel width based on volatility
    const minWidth = baseThresholds.minChannelWidth * volAdjust;
    const maxWidth = baseThresholds.maxChannelWidth * volAdjust;
    
    // Adjust bounce threshold based on volatility
    const bounceThreshold = baseThresholds.bounceDetectionThreshold * volAdjust;
    
    // Adjust linearity requirement based on market phase
    let linearityThreshold = baseThresholds.linearityThreshold;
    if (context.phase === 'CHANNEL_FORMATION' as any) {
      // Less strict during formation phase
      linearityThreshold *= 0.9;
    } else if (context.phase === 'CHANNEL_EXPANSION' as any) {
      // Less strict during expansion
      linearityThreshold *= 0.85;
    }
    
    // Adjust touch point requirement based on available data
    let minTouchPoints = baseThresholds.minTouchPoints;
    if (context.timeframe === '1min') {
      // Require more touches on lower timeframes
      minTouchPoints += 1;
    } else if (['1hour', '1day'].includes(context.timeframe)) {
      // Accept fewer touches on higher timeframes
      minTouchPoints = Math.max(2, minTouchPoints - 1);
    }
    
    return {
      ...baseThresholds,
      minChannelWidth: minWidth,
      maxChannelWidth: maxWidth,
      minTouchPoints,
      bounceDetectionThreshold: bounceThreshold,
      linearityThreshold
    };
  }
  
  /**
   * Detect channel patterns in the given data
   */
  protected detectPatterns(
    data: CandlestickData[],
    context: MarketContext
  ): GoldmineChannelPattern[] {
    if (data.length < (this.options.minPatternLength || 20)) {
      return [];
    }

    // Calculate adaptive thresholds
    const thresholds = this.calculateThresholds(context);
    
    // Get channels using all enabled algorithms
    const allChannels: GoldmineChannelPattern[] = [];
    
    if (this.options.detectionAlgorithms.includes(ChannelDetectionAlgorithm.REGRESSION)) {
      const regressionChannels = this.detectRegressionChannels(data, context, thresholds);
      allChannels.push(...regressionChannels);
    }
    
    if (this.options.detectionAlgorithms.includes(ChannelDetectionAlgorithm.SWING)) {
      const swingChannels = this.detectSwingChannels(data, context, thresholds);
      allChannels.push(...swingChannels);
    }
    
    if (this.options.detectionAlgorithms.includes(ChannelDetectionAlgorithm.VOLATILITY)) {
      const volatilityChannels = this.detectVolatilityChannels(data, context, thresholds);
      allChannels.push(...volatilityChannels);
    }
    
    // Filter out low confidence patterns
    const filteredChannels = allChannels.filter(
      channel => channel.confidence >= thresholds.confidenceThreshold
    );
    
    // Merge overlapping channels
    const mergedChannels = this.mergeOverlappingChannels(filteredChannels);
    
    // Sort by confidence (highest first)
    mergedChannels.sort((a, b) => b.confidence - a.confidence);
    
    // Limit number of patterns returned
    const maxPatterns = this.options.maxPatterns || 10;
    return mergedChannels.slice(0, maxPatterns);
  }
  
  /**
   * Post-process detected channels
   */
  protected postProcessPatterns(
    patterns: GoldmineChannelPattern[], 
    context: MarketContext
  ): GoldmineChannelPattern[] {
    if (patterns.length === 0) return patterns;
    
    // Filter by confidence
    let filtered = patterns.filter(p => p.confidence >= this.options.minimumConfidence);
    
    // Prioritize horizontal channels if configured
    if (this.options.prioritizeHorizontalChannels && filtered.length > 1) {
      // Sort by a combination of confidence and channel type
      filtered = filtered.sort((a, b) => {
        // Higher confidence score
        const confidenceDiff = b.confidence - a.confidence;
        
        // If confidence is similar, prioritize horizontal channels
        if (Math.abs(confidenceDiff) < 0.1) {
          if (a.direction === ChannelDirection.HORIZONTAL && 
              b.direction !== ChannelDirection.HORIZONTAL) {
            return -1;
          }
          if (b.direction === ChannelDirection.HORIZONTAL && 
              a.direction !== ChannelDirection.HORIZONTAL) {
            return 1;
          }
        }
        
        return confidenceDiff;
      });
    } else {
      // Regular sort by confidence
      filtered = filtered.sort((a, b) => b.confidence - a.confidence);
    }
    
    // Limit to maximum patterns
    if (this.options.maxPatterns && filtered.length > this.options.maxPatterns) {
      filtered = filtered.slice(0, this.options.maxPatterns);
    }
    
    return filtered;
  }
  
  /**
   * Detects channels using linear regression
   */
  private detectRegressionChannels(
    data: CandlestickData[],
    context: MarketContext,
    thresholds: ChannelThresholdConfig
  ): GoldmineChannelPattern[] {
    if (data.length < thresholds.minChannelDuration * 2) {
      return []; // Not enough data
    }
    
    const channels: GoldmineChannelPattern[] = [];
    
    // Window sizes to try (as percentage of total data)
    const windowSizes = [0.3, 0.5, 0.7];
    
    // Look at different window sizes to find channels of different durations
    for (const windowSizeFactor of windowSizes) {
      const minWindowSize = Math.max(thresholds.minChannelDuration, 10);
      const maxWindowSize = Math.min(Math.round(data.length * windowSizeFactor), data.length);
      
      // Scan for channels of different lengths
      for (let windowSize = minWindowSize; windowSize <= maxWindowSize; windowSize = windowSize + 5) {
        // Slide the window through the data
        for (let startIdx = 0; startIdx + windowSize <= data.length; startIdx += Math.ceil(windowSize / 3)) {
          const window = data.slice(startIdx, startIdx + windowSize);
          
          // Extract highs and lows for this window
          const highs = window.map(candle => ({ time: parseDatetime(candle.datetime), price: candle.high }));
          const lows = window.map(candle => ({ time: parseDatetime(candle.datetime), price: candle.low }));
          
          // Perform linear regression on highs and lows
          const highRegression = ChannelDetectionUtils.linearRegression(highs);
          const lowRegression = ChannelDetectionUtils.linearRegression(lows);
          
          if (!highRegression || !lowRegression) continue;
          
          // Get data for full channel duration
          const channelData = data.filter(candle => {
            const candleTime = parseDatetime(candle.datetime).getTime();
            return candleTime >= parseDatetime(window[0].datetime).getTime() && 
                  candleTime <= parseDatetime(window[window.length - 1].datetime).getTime();
          });
          
          // Channel start and end points
          const startTimeMs = parseDatetime(window[0].datetime).getTime();
          const endTimeMs = parseDatetime(window[window.length - 1].datetime).getTime();
          const upperStartY = highRegression.slope * 0 + highRegression.intercept;
          const upperEndY = highRegression.slope * (endTimeMs - startTimeMs) + highRegression.intercept;
          const lowerStartY = lowRegression ? lowRegression.slope * 0 + lowRegression.intercept : window[0].low;
          const lowerEndY = lowRegression ? lowRegression.slope * (endTimeMs - startTimeMs) + lowRegression.intercept : window[window.length - 1].low;
          
          // Average channel values
          const upperBoundary = (upperStartY + upperEndY) / 2;
          const lowerBoundary = (lowerStartY + lowerEndY) / 2;
          
          // Calculate channel width as percentage of price
          const avgPrice = (upperBoundary + lowerBoundary) / 2;
          const channelWidth = ((upperBoundary - lowerBoundary) / avgPrice) * 100;
          
          // Channel detection thresholds
          if (channelWidth < thresholds.minChannelWidth || channelWidth > thresholds.maxChannelWidth) {
            continue; // Channel too narrow or too wide
          }
          
          // Validate linearity
          if (highRegression.r2 < thresholds.linearityThreshold || lowRegression.r2 < thresholds.linearityThreshold) {
            continue; // Lines not linear enough
          }
          
          // Determine direction based on slope
          const averageSlope = (highRegression.slope + lowRegression.slope) / 2;
          let direction = ChannelDirection.HORIZONTAL;
          
          // Convert slope to a percentage change
          const slopeAsPct = (averageSlope * (endTimeMs - startTimeMs) / avgPrice) * 100;
          
          if (slopeAsPct > 0.5) {
            direction = ChannelDirection.ASCENDING;
          } else if (slopeAsPct < -0.5) {
            direction = ChannelDirection.DESCENDING;
          }
          
          // Skip non-trending channels if not enabled
          if (!this.options.detectTrendingChannels && direction !== ChannelDirection.HORIZONTAL) {
            continue;
          }
          
          // Find touch points where price came close to boundaries
          const touchPoints = ChannelDetectionUtils.findTouchPoints(window, upperBoundary, lowerBoundary, thresholds.bounceDetectionThreshold);
          
          // Need minimum number of touch points
          if (touchPoints.length < thresholds.minTouchPoints) {
            continue;
          }
          
          // Calculate confidence based on:
          // 1. Linearity (R² values)
          // 2. Number of touch points beyond minimum
          // 3. Duration
          // 4. Consistent width
          const linearityFactor = (highRegression.r2 + lowRegression.r2) / 2;
          const touchPointFactor = Math.min(1, touchPoints.length / (thresholds.minTouchPoints * 2));
          const durationFactor = Math.min(1, window.length / (thresholds.minChannelDuration * 3));
          
          // Bonus for horizontal channels if prioritized
          const horizontalBonus = (this.options.prioritizeHorizontalChannels && direction === ChannelDirection.HORIZONTAL) ? 0.1 : 0;
          
          let confidence = (
            linearityFactor * 0.4 +
            touchPointFactor * 0.3 +
            durationFactor * 0.2
          ) + horizontalBonus;
          
          // Adjust for context
          if (context.phase === 'SIDEWAYS' as any && direction === ChannelDirection.HORIZONTAL) {
            confidence *= 1.2; // Boost for horizontal channels in sideways market
          }
          
          confidence = Math.min(1.0, Math.max(thresholds.confidenceThreshold, confidence));
          
          // Create channel pattern
          channels.push({
            id: uuidv4(),
            type: PatternType.GOLDMINE_CHANNEL,
            startTime: parseDatetime(window[0].datetime),
            endTime: parseDatetime(window[window.length - 1].datetime),
            highPrice: Math.max(...window.map(c => c.high)),
            lowPrice: Math.min(...window.map(c => c.low)),
            confidence,
            hasReceivedFeedback: false,
            
            direction,
            upperBoundary,
            lowerBoundary,
            touchPoints
          });
        }
      }
    }
    
    return channels;
  }
  
  /**
   * Detects channels using swing highs and lows
   */
  private detectSwingChannels(
    data: CandlestickData[],
    context: MarketContext,
    thresholds: ChannelThresholdConfig
  ): GoldmineChannelPattern[] {
    if (data.length < thresholds.minChannelDuration) {
      return []; // Not enough data
    }
    
    const channels: GoldmineChannelPattern[] = [];
    
    // Find swing points
    const swingHighs = ChannelDetectionUtils.findSwingHighs(data, 5); // Look for swing highs using 5-candle lookback
    const swingLows = ChannelDetectionUtils.findSwingLows(data, 5);   // Look for swing lows using 5-candle lookback
    
    if (swingHighs.length < 3 || swingLows.length < 3) {
      return []; // Need at least 3 swing points for each boundary
    }
    
    // Find potential upper boundaries (connect swing highs)
    const upperBoundaries = ChannelDetectionUtils.findPotentialBoundaries(swingHighs, thresholds.linearityThreshold);
    
    // Find potential lower boundaries (connect swing lows)
    const lowerBoundaries = ChannelDetectionUtils.findPotentialBoundaries(swingLows, thresholds.linearityThreshold);
    
    // Pair upper and lower boundaries to form channels
    for (const upper of upperBoundaries) {
      const upperStartTime = upper.startTime.getTime();
      const upperEndTime = upper.endTime.getTime();
    
      for (const lower of lowerBoundaries) {
        // Check for similar slopes (parallelism)
        const slopeDiff = Math.abs(upper.slope - lower.slope);
        const avgSlope = (Math.abs(upper.slope) + Math.abs(lower.slope)) / 2;
        
        // Slope difference should be less than 20% of average slope
        // This ensures boundaries are roughly parallel
        if (slopeDiff > 0.2 * avgSlope && avgSlope > 0.0001) {
          continue; // Boundaries not parallel enough
        }
        
        // Find overlap in time range
        const startTime = new Date(Math.max(upperStartTime, lower.startTime.getTime()));
        const endTime = new Date(Math.min(upperEndTime, lower.endTime.getTime()));
        
        if (endTime.getTime() - startTime.getTime() < thresholds.minChannelDuration * 60000) {
          continue; // Not enough overlap
        }
        
        // Get actual boundary values in the middle of the overlap period
        const midTimeMs = (startTime.getTime() + endTime.getTime()) / 2;
        const timeOffset = midTimeMs - upperStartTime;
        
        const upperBoundary = upper.slope * timeOffset + upper.intercept;
        const lowerBoundary = lower.slope * timeOffset + lower.intercept;
        
        // Calculate channel width as percentage of price
        const avgPrice = (upperBoundary + lowerBoundary) / 2;
        const channelWidth = ((upperBoundary - lowerBoundary) / avgPrice) * 100;
        
        if (channelWidth < thresholds.minChannelWidth || channelWidth > thresholds.maxChannelWidth) {
          continue; // Channel too narrow or too wide
        }
        
        // Determine direction
        let direction = ChannelDirection.HORIZONTAL;
        if (upper.slope > 0.0001) {
          direction = ChannelDirection.ASCENDING;
        } else if (upper.slope < -0.0001) {
          direction = ChannelDirection.DESCENDING;
        }
        
        // Skip non-trending channels if not enabled
        if (!this.options.detectTrendingChannels && direction !== ChannelDirection.HORIZONTAL) {
          continue;
        }
        
        // Filter to data within overlap timeframe
        const channelData = data.filter(
          candle => new Date(candle.timestamp).getTime() >= startTime.getTime() && new Date(candle.timestamp).getTime() <= endTime.getTime()
        );
        
        // Find touch points
        const touchPoints = ChannelDetectionUtils.findTouchPoints(
          channelData, upperBoundary, lowerBoundary, thresholds.bounceDetectionThreshold
        );
        
        if (touchPoints.length < thresholds.minTouchPoints) {
          continue; // Not enough touch points
        }
        
        // Calculate confidence
        const swingStrengthUpper = upper.swingStrength;
        const swingStrengthLower = lower.swingStrength;
        const swingStrength = (swingStrengthUpper + swingStrengthLower) / 2;
        
        const touchQuality = Math.min(1, touchPoints.length / (thresholds.minTouchPoints * 2));
        const durationQuality = Math.min(1, channelData.length / (thresholds.minChannelDuration * 3));
        
        // Bonus for horizontal channels if prioritized
        const horizontalBonus = (this.options.prioritizeHorizontalChannels && direction === ChannelDirection.HORIZONTAL) ? 0.1 : 0;
        
        let confidence = (
          swingStrength * 0.4 +
          touchQuality * 0.4 +
          durationQuality * 0.1
        ) + horizontalBonus;
        
        // Adjust for market context
        if (context.phase === 'SIDEWAYS' as any && direction === ChannelDirection.HORIZONTAL) {
          confidence *= 1.2; // Boost confidence for horizontal channels in sideways markets
        }
        
        confidence = Math.min(1.0, Math.max(thresholds.confidenceThreshold, confidence));
        
        // Create channel pattern
        channels.push({
          id: uuidv4(),
          type: PatternType.GOLDMINE_CHANNEL,
          startTime,
          endTime,
          highPrice: Math.max(...channelData.map(c => c.high)),
          lowPrice: Math.min(...channelData.map(c => c.low)),
          confidence,
          hasReceivedFeedback: false,
          
          direction,
          upperBoundary,
          lowerBoundary,
          touchPoints
        });
      }
    }
    
    return channels;
  }
  
  /**
   * Detects channels using volatility bands
   */
  private detectVolatilityChannels(
    data: CandlestickData[],
    context: MarketContext,
    thresholds: ChannelThresholdConfig
  ): GoldmineChannelPattern[] {
    if (data.length < thresholds.minChannelDuration + 14) {
      return []; // Need additional data for calculations
    }
    
    const channels: GoldmineChannelPattern[] = [];
    
    // Calculate ATR (Average True Range) for volatility measure
    const atrPeriod = 14;
    const atr = ChannelDetectionUtils.calculateATR(data, atrPeriod);
    
    // Calculate Simple Moving Average
    const smaPeriod = 20;
    const sma = ChannelDetectionUtils.calculateSMA(data.map(d => d.close), smaPeriod);
    
    // Minimum window size for channel detection
    const minChannelLength = Math.max(thresholds.minChannelDuration, smaPeriod);
    
    // Scan for stable volatility periods of different lengths
    const windowSizes = [minChannelLength, minChannelLength * 1.5, minChannelLength * 2];
    
    for (const windowSize of windowSizes) {
      const windowLength = Math.round(windowSize);
      
      // Slide window through data
      for (let startIdx = atrPeriod; startIdx + windowLength < data.length; startIdx += Math.max(5, Math.floor(windowLength / 4))) {
        const windowData = data.slice(startIdx, startIdx + windowLength);
        const windowSMA = sma.slice(startIdx - smaPeriod + 1, startIdx + windowLength - smaPeriod + 1);
        const windowATR = atr.slice(startIdx - atrPeriod + 1, startIdx + windowLength - atrPeriod + 1);
        
        if (windowSMA.length < windowLength || windowATR.length < windowLength) continue;
        
        // Calculate average ATR for the window
        const avgATR = windowATR.reduce((sum, val) => sum + val, 0) / windowATR.length;
        
        // Calculate ATR standard deviation to measure volatility stability
        const atrStdDev = Math.sqrt(
          windowATR.reduce((sum, val) => sum + Math.pow(val - avgATR, 2), 0) / windowATR.length
        );
        
        // Skip if volatility is too unstable
        if (atrStdDev / avgATR > 0.3) continue; // More than 30% variation
        
        // Calculate volatility multiplier based on overall market context
        let upperMultiplier = 2.0;
        let lowerMultiplier = 2.0;
        
        if (context.volatility > 2.0) {
          // Increase band width in high volatility
          upperMultiplier = 2.5;
          lowerMultiplier = 2.5;
        } else if (context.volatility < 1.0) {
          // Decrease band width in low volatility
          upperMultiplier = 1.5;
          lowerMultiplier = 1.5;
        }
        
        // Calculate upper and lower bands
        const bands = windowSMA.map((val, i) => ({
          middle: val,
          upper: val + (windowATR[i] * upperMultiplier),
          lower: val - (windowATR[i] * lowerMultiplier)
        }));
        
        // Calculate average band values
        const upperBoundary = bands.reduce((sum, b) => sum + b.upper, 0) / bands.length;
        const lowerBoundary = bands.reduce((sum, b) => sum + b.lower, 0) / bands.length;
        
        // Calculate band trend
        const firstMiddle = bands[0].middle;
        const lastMiddle = bands[bands.length - 1].middle;
        const middleSlope = (lastMiddle - firstMiddle) / windowLength;
        
        // Determine direction
        let direction = ChannelDirection.HORIZONTAL;
        if (middleSlope > 0.0001) {
          direction = ChannelDirection.ASCENDING;
        } else if (middleSlope < -0.0001) {
          direction = ChannelDirection.DESCENDING;
        }
        
        // Skip non-trending channels if not enabled
        if (!this.options.detectTrendingChannels && direction !== ChannelDirection.HORIZONTAL) {
          continue;
        }
        
        // Calculate channel width as percentage of price
        const avgPrice = (upperBoundary + lowerBoundary) / 2;
        const channelWidth = ((upperBoundary - lowerBoundary) / avgPrice) * 100;
        
        if (channelWidth < thresholds.minChannelWidth || channelWidth > thresholds.maxChannelWidth) {
          continue; // Channel too narrow or too wide
        }
        
        // Find touch points
        const touchPoints = ChannelDetectionUtils.findTouchPoints(
          windowData, upperBoundary, lowerBoundary, thresholds.bounceDetectionThreshold
        );
        
        if (touchPoints.length < thresholds.minTouchPoints) {
          continue; // Not enough touch points
        }
        
        // Calculate confidence
        const stabilityFactor = 1 - (atrStdDev / avgATR); // Higher when volatility is stable
        const touchQuality = Math.min(1, touchPoints.length / (thresholds.minTouchPoints * 2));
        const containmentFactor = ChannelDetectionUtils.calculateContainmentFactor(windowData, upperBoundary, lowerBoundary);
        
        // Bonus for horizontal channels if prioritized
        const horizontalBonus = (this.options.prioritizeHorizontalChannels && direction === ChannelDirection.HORIZONTAL) ? 0.1 : 0;
        
        let confidence = (
          stabilityFactor * 0.3 +
          touchQuality * 0.4 +
          containmentFactor * 0.2
        ) + horizontalBonus;
        
        // Adjust for market context
        if (context.phase === 'SIDEWAYS' as any && direction === ChannelDirection.HORIZONTAL) {
          confidence *= 1.2; // Boost confidence for horizontal channels in sideways markets
        }
        
        confidence = Math.min(1.0, Math.max(thresholds.confidenceThreshold, confidence));
        
        // Create channel pattern
        channels.push({
          id: uuidv4(),
          type: PatternType.GOLDMINE_CHANNEL,
          startTime: parseDatetime(windowData[0].datetime),
          endTime: parseDatetime(windowData[windowData.length - 1].datetime),
          highPrice: Math.max(...windowData.map(c => c.high)),
          lowPrice: Math.min(...windowData.map(c => c.low)),
          confidence,
          hasReceivedFeedback: false,
          
          direction,
          upperBoundary,
          lowerBoundary,
          touchPoints
        });
      }
    }
    
    return channels;
  }
  
  /**
   * Merge overlapping channels
   */
  private mergeOverlappingChannels(channels: GoldmineChannelPattern[]): GoldmineChannelPattern[] {
    if (channels.length <= 1) return channels;
    
    const result: GoldmineChannelPattern[] = [];
    const processed = new Set<string>();
    
    // Sort channels by confidence
    const sortedChannels = [...channels].sort((a, b) => b.confidence - a.confidence);
    
    for (let i = 0; i < sortedChannels.length; i++) {
      if (processed.has(sortedChannels[i].id)) continue;
      
      const current = sortedChannels[i];
      const overlapping: GoldmineChannelPattern[] = [current];
      
      // Find all channels that overlap significantly with current
      for (let j = 0; j < sortedChannels.length; j++) {
        if (i === j || processed.has(sortedChannels[j].id)) continue;
        
        const other = sortedChannels[j];
        if (this.channelsOverlapSignificantly(current, other)) {
          overlapping.push(other);
          processed.add(other.id);
        }
      }
      
      if (overlapping.length === 1) {
        // No overlaps, add as is
        result.push(current);
      } else {
        // Merge overlapping channels
        result.push(this.mergeChannels(overlapping));
      }
      
      processed.add(current.id);
    }
    
    return result;
  }
  
  /**
   * Checks if two channels overlap significantly
   */
  private channelsOverlapSignificantly(
    channel1: GoldmineChannelPattern, 
    channel2: GoldmineChannelPattern
  ): boolean {
    // Check time overlap
    const start1 = channel1.startTime.getTime();
    const end1 = channel1.endTime.getTime();
    const start2 = channel2.startTime.getTime();
    const end2 = channel2.endTime.getTime();
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Calculate overlap percentage relative to the shorter pattern
    const duration1 = end1 - start1;
    const duration2 = end2 - start2;
    const minDuration = Math.min(duration1, duration2);
    const overlapPercentage = overlapDuration / minDuration;
    
    // Price range overlap
    const upperMin = Math.min(channel1.upperBoundary, channel2.upperBoundary);
    const upperMax = Math.max(channel1.upperBoundary, channel2.upperBoundary);
    const lowerMin = Math.min(channel1.lowerBoundary, channel2.lowerBoundary);
    const lowerMax = Math.max(channel1.lowerBoundary, channel2.lowerBoundary);
    
    const upperOverlap = upperMin / upperMax;
    const lowerOverlap = lowerMin / lowerMax;
    const priceOverlap = (upperOverlap + lowerOverlap) / 2;
    
    // Consider channels overlapping if they overlap significantly in both time and price
    return overlapPercentage > 0.5 && priceOverlap > 0.8;
  }
  
  /**
   * Merges multiple overlapping channels into a single consensus channel
   */
  private mergeChannels(channels: GoldmineChannelPattern[]): GoldmineChannelPattern {
    // Create a weighted average of the channels based on confidence
    const totalConfidence = channels.reduce((sum, ch) => sum + ch.confidence, 0);
    
    // Get weighted values
    let upperBoundary = 0;
    let lowerBoundary = 0;
    let startTime = new Date(0);
    let endTime = new Date(0);
    let highPrice = 0;
    let lowPrice = 0;
    
    // Weighted average of channel parameters
    for (const ch of channels) {
      const weight = ch.confidence / totalConfidence;
      
      upperBoundary += ch.upperBoundary * weight;
      lowerBoundary += ch.lowerBoundary * weight;
      
      if (startTime.getTime() === 0 || ch.startTime < startTime) {
        startTime = ch.startTime;
      }
      
      if (endTime.getTime() === 0 || ch.endTime > endTime) {
        endTime = ch.endTime;
      }
      
      highPrice = Math.max(highPrice, ch.highPrice);
      lowPrice = Math.min(lowPrice, ch.lowPrice);
    }
    
    // Determine direction based on majority vote weighted by confidence
    let directionVotes = {
      [ChannelDirection.HORIZONTAL]: 0,
      [ChannelDirection.ASCENDING]: 0,
      [ChannelDirection.DESCENDING]: 0
    };
    
    for (const ch of channels) {
      directionVotes[ch.direction] += ch.confidence;
    }
    
    const direction = Object.entries(directionVotes)
      .sort((a, b) => b[1] - a[1])[0][0] as ChannelDirection;
    
    // Merge touch points
    const allTouchPoints = channels.flatMap(ch => ch.touchPoints);
    
    // Remove duplicates (touch points very close in time)
    const uniqueTouchPoints: typeof allTouchPoints = [];
    const touchPointMap = new Map<number, typeof allTouchPoints[0]>();
    
    for (const point of allTouchPoints) {
      const timeKey = Math.floor(point.time.getTime() / 60000); // Round to minute
      
      if (!touchPointMap.has(timeKey) || 
          touchPointMap.get(timeKey)!.price < point.price) {
        touchPointMap.set(timeKey, point);
      }
    }
    
    touchPointMap.forEach(point => uniqueTouchPoints.push(point));
    
    // Calculate max confidence from component channels, plus a bonus for agreement
    const maxConfidence = Math.max(...channels.map(ch => ch.confidence));
    const consensusBonus = (channels.length > 1) ? 0.1 : 0;
    const confidence = Math.min(1.0, maxConfidence + consensusBonus);
    
    return {
      id: uuidv4(),
      type: PatternType.GOLDMINE_CHANNEL,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      
      direction,
      upperBoundary,
      lowerBoundary,
      touchPoints: uniqueTouchPoints
    };
  }
}
