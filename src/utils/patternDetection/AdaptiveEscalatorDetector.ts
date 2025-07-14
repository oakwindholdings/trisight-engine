// src/utils/patternDetection/AdaptiveEscalatorDetector.ts
// Adaptive detector for Escalator pattern
// Uses market context thresholds
import { CandlestickData } from '../../models/ChartTypes';
import { 
  EscalatorPattern, 
  PatternType, 
  ThrustDirection,
  EscalatorSignalStrength
} from '../../models/PatternTypes';
import { BasePatternDetector, DetectionOptions } from './core/BasePatternDetector';
import { MarketContext, ThresholdConfig } from './core/MarketContext';
import { EscalatorDetectionUtils } from './helper/EscalatorDetectionUtils';
import { v4 as uuidv4 } from 'uuid';
import { logDebug } from '../../utils/debug';

/**
 * Options for the AdaptiveEscalatorDetector
 */
export interface EscalatorDetectionOptions extends DetectionOptions {
  minSteps?: number;                  // Minimum number of steps to form an escalator
  minStepSize?: number;               // Minimum % change to consider as a step
  maxConsolidationVolatility?: number; // Max % volatility during consolidation
  basePriceChangeThreshold?: number;   // Base threshold for price changes
  baseVolumeChangeThreshold?: number;  // Base threshold for volume changes
  lookbackPeriods?: number;            // Number of periods to look back for context
  useContextTimeframe?: boolean;       // Whether to use higher timeframe context
  contextTimeframeMultiplier?: number; // Multiplier for context timeframe
  minScore?: number;                   // Minimum score to consider a valid pattern
}

/**
 * Adaptive detector for Escalator patterns
 * Implements improved detection using scoring system and adaptive thresholds
 */
export class AdaptiveEscalatorDetector extends BasePatternDetector<EscalatorPattern> {
  // Default options
  private readonly DEFAULT_MIN_STEPS = 3;
  private readonly DEFAULT_MIN_STEP_SIZE = 0.5;
  private readonly DEFAULT_MAX_CONSOLIDATION_VOLATILITY = 1.0;
  private readonly DEFAULT_BASE_PRICE_CHANGE_THRESHOLD = 0.01; // 1%
  private readonly DEFAULT_BASE_VOLUME_CHANGE_THRESHOLD = 0.05; // 5%
  private readonly DEFAULT_LOOKBACK_PERIODS = 5;
  private readonly DEFAULT_USE_CONTEXT_TIMEFRAME = true;
  private readonly DEFAULT_CONTEXT_TIMEFRAME_MULTIPLIER = 3;
  private readonly DEFAULT_MIN_SCORE = 2.0;
  
  // Initialize with options
  constructor(options: Partial<EscalatorDetectionOptions> = {}) {
    super(options);
  }
  
  /**
   * Returns the pattern type this detector is responsible for
   */
  public getPatternType(): PatternType {
    return PatternType.ESCALATOR;
  }
  
  /**
   * Returns default threshold values for this pattern type
   */
  protected getDefaultThresholds(): ThresholdConfig {
    return {
      thrustPercentMin: 0.5,
      retracementMin: 0.2,
      retracementMax: 0.6,
      confidenceThreshold: 0.4,
      minPatternDuration: 3,
      maxPatternDuration: 20,
      minTouchPoints: 3,
      volumeConfirmationThreshold: 1.1
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): ThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    
    // Safely handle the case when getVolatilityFactor might not be defined
    let volatilityFactor = 1.0;
    try {
      // Check if the function exists before calling it
      if (typeof context.getVolatilityFactor === 'function') {
        volatilityFactor = context.getVolatilityFactor();
      } else {
        // Fallback calculation based on context volatility
        const baseVolatility = 0.01; // 1% as baseline
        volatilityFactor = Math.max(0.5, Math.min(2.0, (context.volatility || 0.01) / baseVolatility));
        
        // Log warning only if logging is enabled
        if (this.options.enableLogging) {
          logDebug('DEBUG_PATTERN_DETECT', 'Warning: getVolatilityFactor not found on context, using fallback calculation.');
        }
      }
    } catch (error) {
      // If anything goes wrong, use a default volatility factor
      volatilityFactor = 1.0;
      if (this.options.enableLogging) {
        logDebug('DEBUG_PATTERN_DETECT', 'Error calculating volatilityFactor:', error);
      }
    }
    
    return {
      ...baseThresholds,
      thrustPercentMin: baseThresholds.thrustPercentMin * volatilityFactor,
      retracementMin: baseThresholds.retracementMin * (1 + (volatilityFactor - 1) * 0.5),
      retracementMax: baseThresholds.retracementMax * (1 + (volatilityFactor - 1) * 0.5),
      confidenceThreshold: baseThresholds.confidenceThreshold
    };
  }
  
  /**
   * Implement pattern-specific detection logic
   */
  protected detectPatterns(
    data: CandlestickData[], 
    context: MarketContext,
    thresholds: ThresholdConfig
  ): EscalatorPattern[] {
    return this.detectEscalatorPatterns(data, context);
  }
  
  /**
   * Detect Escalator patterns in the given market data
   * This is the main implementation used by the detectPatterns method
   */
  protected detectEscalatorPatterns(data: CandlestickData[], context: MarketContext): EscalatorPattern[] {
    const startTime = performance.now();
    
    if (data.length < this.getOption('minSteps', this.DEFAULT_MIN_STEPS) * 2) {
      this.logInfo('Escalator detection', `Not enough data: ${data.length} candles`);
      return []; // Not enough data
    }
    
    // Detect potential escalator formations
    const bullishPatterns = this.detectByDirection(data, context, ThrustDirection.BULLISH);
    const bearishPatterns = this.detectByDirection(data, context, ThrustDirection.BEARISH);
    
    // Combine and filter all patterns
    const patterns = [...bullishPatterns, ...bearishPatterns];
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    // Filter out patterns below minimum confidence threshold
    const filteredPatterns = patterns.filter(p => 
      p.confidence >= this.getOption('minimumConfidence', 0.5) &&
      Math.abs(p.cumulativeScore) >= this.getOption('minScore', this.DEFAULT_MIN_SCORE)
    );
    
    this.logInfo('Escalator detection', `Detected ${filteredPatterns.length} escalator patterns`);
    return filteredPatterns;
  }
  
  /**
   * Detect escalator patterns in a specific direction
   */
  private detectByDirection(
    data: CandlestickData[], 
    context: MarketContext,
    direction: ThrustDirection
  ): EscalatorPattern[] {
    const patterns: EscalatorPattern[] = [];
    const minSteps = this.getOption('minSteps', this.DEFAULT_MIN_STEPS);
    
    // Use original EscalatorDetector logic to identify steps
    const steps = this.identifySteps(data, direction);
    
    if (steps.length >= minSteps) {
      // Create the pattern with adaptive scoring
      const pattern = this.createAdaptiveEscalatorPattern(data, steps, direction, context);
      patterns.push(pattern);
    }
    
    return patterns;
  }
  
  /**
   * Identify step formations in the price data
   */
  private identifySteps(
    data: CandlestickData[], 
    direction: ThrustDirection
  ): Array<{
    startTime: Date;
    endTime: Date;
    level: number;
    isConsolidation: boolean;
  }> {
    const steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }> = [];
    
    const minStepSize = this.getOption('minStepSize', this.DEFAULT_MIN_STEP_SIZE);
    const maxConsolidationVolatility = this.getOption(
      'maxConsolidationVolatility', 
      this.DEFAULT_MAX_CONSOLIDATION_VOLATILITY
    );
    
    // Determine if we're looking for rising or falling stairsteps
    const isBullish = direction === ThrustDirection.BULLISH;
    
    // Function to calculate volatility in a window
    const calcVolatility = (start: number, end: number): number => {
      const prices = data.slice(start, end + 1).map(d => d.close);
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const deviations = prices.map(p => Math.abs(p - avg) / avg * 100);
      return deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    };
    
    // Function to check if we have a significant price move
    const hasSignificantMove = (start: number, end: number): boolean => {
      if (start >= end) return false;
      
      const startPrice = data[start].close;
      const endPrice = data[end].close;
      const percentChange = (endPrice - startPrice) / startPrice * 100;
      
      return isBullish 
        ? percentChange >= minStepSize // For bullish, needs positive change
        : percentChange <= -minStepSize; // For bearish, needs negative change
    };
    
    // State tracking
    let inConsolidation = false;
    let consolidationStart = 0;
    let stepStart = 0;
    
    // Scan through data looking for steps and consolidations
    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currClose = data[i].close;
      const priceMove = (currClose - prevClose) / prevClose * 100;
      
      if (inConsolidation) {
        // Check if consolidation is broken with a significant move
        if ((isBullish && priceMove > minStepSize) || 
            (!isBullish && priceMove < -minStepSize)) {
          
          // End consolidation, add to steps
          steps.push({
            startTime: new Date(data[consolidationStart].timestamp),
            endTime: new Date(data[i - 1].timestamp),
            level: data[consolidationStart].close,
            isConsolidation: true
          });
          
          // Start new step
          stepStart = i;
          inConsolidation = false;
        }
        // Continue in consolidation
      } else {
        // In directional move - check if momentum wanes
        const priceAlignment = isBullish ? priceMove >= 0 : priceMove <= 0;
        
        if (!priceAlignment || Math.abs(priceMove) < minStepSize * 0.2) {
          // Check if we've made a significant move since step start
          if (hasSignificantMove(stepStart, i - 1)) {
            // Completed a step, add it
            steps.push({
              startTime: new Date(data[stepStart].timestamp),
              endTime: new Date(data[i - 1].timestamp),
              level: data[stepStart].close,
              isConsolidation: false
            });
            
            // Start consolidation
            consolidationStart = i;
            inConsolidation = true;
          }
          // If no significant move yet, continue in current state
        }
      }
    }
    
    // Handle the last segment
    if (stepStart < data.length - 1 && !inConsolidation && 
        hasSignificantMove(stepStart, data.length - 1)) {
      steps.push({
        startTime: new Date(data[stepStart].timestamp),
        endTime: new Date(data[data.length - 1].timestamp),
        level: data[stepStart].close,
        isConsolidation: false
      });
    } else if (consolidationStart < data.length - 1 && inConsolidation) {
      steps.push({
        startTime: new Date(data[consolidationStart].timestamp),
        endTime: new Date(data[data.length - 1].timestamp),
        level: data[consolidationStart].close,
        isConsolidation: true
      });
    }
    
    return steps;
  }
  
  /**
   * Create an escalator pattern with adaptive scoring
   */
  private createAdaptiveEscalatorPattern(
    data: CandlestickData[],
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>,
    direction: ThrustDirection,
    context: MarketContext
  ): EscalatorPattern {
    // Determine pattern boundaries
    const startTime = steps[0].startTime;
    const endTime = steps[steps.length - 1].endTime;
    
    // Calculate high and low prices
    const relevantData = data.filter(d => {
      const time = new Date(d.timestamp);
      return time >= startTime && time <= endTime;
    });
    
    const highPrice = Math.max(...relevantData.map(d => d.high));
    const lowPrice = Math.min(...relevantData.map(d => d.low));
    
    // Get price change thresholds, potentially adjusting based on market volatility
    const basePriceChangeThreshold = this.getOption(
      'basePriceChangeThreshold', 
      this.DEFAULT_BASE_PRICE_CHANGE_THRESHOLD
    );
    const baseVolumeChangeThreshold = this.getOption(
      'baseVolumeChangeThreshold',
      this.DEFAULT_BASE_VOLUME_CHANGE_THRESHOLD
    );
    
    // Adjust thresholds based on market volatility if adaptive thresholds enabled
    const volatilityAdjustment = this.getOption('adaptiveThresholds', true)
      ? context.getVolatilityFactor()
      : 1.0;
    
    const adjustedPriceThreshold = basePriceChangeThreshold * volatilityAdjustment;
    const adjustedVolumeThreshold = baseVolumeChangeThreshold * volatilityAdjustment;
    
    // Calculate step scores using our utility
    const stepScores = EscalatorDetectionUtils.calculateStepScores(
      data,
      steps,
      adjustedPriceThreshold,
      adjustedVolumeThreshold,
      direction
    );
    
    // Calculate cumulative score
    const cumulativeScore = EscalatorDetectionUtils.calculateCumulativeScore(stepScores);
    
    // Calculate price and volume changes
    const priceChanges = EscalatorDetectionUtils.calculatePriceChanges(data, steps);
    const volumeChanges = EscalatorDetectionUtils.calculateVolumeChanges(data, steps);
    
    // Calculate average step height and consistency
    const averageStepHeight = EscalatorDetectionUtils.calculateAverageStepHeight(steps);
    const stepConsistency = EscalatorDetectionUtils.calculateStepConsistency(steps);
    
    // Calculate context score if enabled
    let contextScore = undefined;
    if (this.getOption('useContextTimeframe', this.DEFAULT_USE_CONTEXT_TIMEFRAME)) {
      contextScore = EscalatorDetectionUtils.calculateContextScore(
        cumulativeScore,
        data,
        direction
      );
    }
    
    // Determine signal strength based on cumulative score
    const signalStrength = EscalatorDetectionUtils.determineSignalStrength(cumulativeScore);
    
    // Calculate confidence based on scores
    const baseConfidence = Math.min(Math.abs(cumulativeScore) / 10, 0.9);
    const stepCountFactor = Math.min((steps.length / 3) * 0.1, 0.3);
    const consistencyFactor = stepConsistency * 0.1;
    
    // Higher confidence for higher scores and more consistent steps
    const confidence = baseConfidence + stepCountFactor + consistencyFactor;
    
    // Create the enhanced escalator pattern
    const pattern: EscalatorPattern = {
      id: uuidv4(),
      type: PatternType.ESCALATOR,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      detectionVersion: '2.0-adaptive',
      steps,
      direction,
      // Enhanced adaptive properties
      stepScores,
      cumulativeScore,
      contextScore,
      signalStrength,
      priceChanges,
      volumeChanges,
      averageStepHeight,
      stepConsistency,
      // Extra field for future relationship tracking
      relatedPatternIds: []
    };
    
    return pattern;
  }
  
  /**
   * Helper to get typed options with defaults
   */
  private getOption<T>(key: keyof EscalatorDetectionOptions, defaultValue: T): T {
    return ((this.options as any)[key] as T) ?? defaultValue;
  }
  
  /**
   * Helper for logging detection information
   */
  private logInfo(category: string, message: string): void {
    if (this.options.enableLogging) {
      logDebug('DEBUG_PATTERN_DETECT', `[${category}] ${message}`);
    }
  }
}

export default AdaptiveEscalatorDetector;
