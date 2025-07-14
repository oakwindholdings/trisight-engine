// src/utils/patternDetection/AdaptiveBlackjackDetector.ts
// Adaptive detector for Blackjack pattern
// Uses market context thresholds
import { CandlestickData } from '../../models/ChartTypes';
import { 
  BlackjackPattern, 
  PatternType, 
  BlackjackSignalStrength 
} from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { 
  BasePatternDetector, 
  DetectionOptions 
} from './core/BasePatternDetector';
import { 
  MarketContext, 
  ThresholdConfig 
} from './core/MarketContext';
import { BlackjackDetectionUtils } from './helper/BlackjackDetectionUtils';
import { logDebug } from '../../utils/debug';

/**
 * Convert datetime string to Date object
 */
function parseDatetime(datetime: string): Date {
  return new Date(datetime);
}

/**
 * BlackJack-specific threshold configuration
 */
interface BlackjackThresholdConfig extends ThresholdConfig {
  minCumulativeScore: number;        // Minimum score to generate a signal
  lookbackPeriods: number;           // Number of periods for cumulative scoring
  contextTimeframeMultiplier: number; // Multiplier for context timeframe
  volumeChangeThreshold: number;      // Minimum % change to count volume movements
  priceChangeThreshold: number;       // Minimum % change to count price movements
  // Required from ThresholdConfig but not used for BlackJack
  thrustPercentMin: number;          // Not used for BlackJack
  retracementMin: number;            // Not used for BlackJack
  retracementMax: number;            // Not used for BlackJack
}

/**
 * Configuration options for BlackJack pattern detection
 */
interface BlackjackDetectionOptions extends DetectionOptions {
  /**
   * Minimum pattern length for valid detection
   */
  minPatternLength?: number;
  
  /**
   * Number of periods for lookback scoring (default: 7)
   */
  lookbackPeriods: number;
  
  /**
   * Whether to use context scoring from higher timeframe
   */
  useContextTimeframe: boolean;
  
  /**
   * Multiplier for context timeframe (e.g. 5 = 5x longer timeframe)
   */
  contextTimeframeMultiplier: number;
  
  /**
   * Min percentage change to count as price movement
   */
  basePriceChangeThreshold: number;
  
  /**
   * Min percentage change to count as volume movement
   */
  baseVolumeChangeThreshold: number;
}

/**
 * Default BlackJack detection options
 */
const DEFAULT_BLACKJACK_OPTIONS: BlackjackDetectionOptions = {
  minimumConfidence: 0.5,
  adaptiveThresholds: true,
  maxPatterns: 50,
  enableLogging: false,
  lookbackPeriods: 7,
  useContextTimeframe: true,
  contextTimeframeMultiplier: 5,
  basePriceChangeThreshold: 0.1,  // 0.1% price change
  baseVolumeChangeThreshold: 0.5  // 0.5% volume change
};

/**
 * Adaptive BlackJack pattern detector that identifies price-volume correlation patterns
 * using multiple detection algorithms and adapting to market conditions
 */
export class AdaptiveBlackjackDetector extends BasePatternDetector<BlackjackPattern> {
  protected options: BlackjackDetectionOptions;
  
  constructor(options: Partial<BlackjackDetectionOptions> = {}) {
    super();
    this.options = { ...DEFAULT_BLACKJACK_OPTIONS, ...options };
  }
  
  /**
   * Returns the pattern type
   */
  public getPatternType(): PatternType {
    return PatternType.BLACKJACK;
  }
  
  /**
   * Returns default threshold values
   */
  protected getDefaultThresholds(): BlackjackThresholdConfig {
    return {
      confidenceThreshold: 0.5,
      minCumulativeScore: 2,
      lookbackPeriods: this.options.lookbackPeriods,
      contextTimeframeMultiplier: this.options.contextTimeframeMultiplier,
      volumeChangeThreshold: this.options.baseVolumeChangeThreshold,
      priceChangeThreshold: this.options.basePriceChangeThreshold,
      // These are required by ThresholdConfig but not used for BlackJack
      thrustPercentMin: 0,
      retracementMin: 0,
      retracementMax: 0
    };
  }
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected calculateThresholds(context: MarketContext): BlackjackThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    
    // Adjust based on volatility
    const volatilityFactor = context.volatility / 1.5; // Normalize to 1.5% volatility
    const volAdjust = Math.max(0.5, Math.min(2.0, volatilityFactor));
    
    // In high volatility, require higher score and adjust sensitivity
    const thresholds = {
      ...baseThresholds,
      minCumulativeScore: context.volatility > 2.0 
        ? Math.min(4, baseThresholds.minCumulativeScore + 1) 
        : baseThresholds.minCumulativeScore,
      priceChangeThreshold: baseThresholds.priceChangeThreshold * volAdjust,
      volumeChangeThreshold: baseThresholds.volumeChangeThreshold * volAdjust
    };
    
    // Adjust thresholds based on market phase
    if (context.phase === 'SIDEWAYS' as any || context.phase === 'CONSOLIDATION' as any) {
      thresholds.minCumulativeScore = Math.max(1, thresholds.minCumulativeScore - 1);
      thresholds.priceChangeThreshold *= 0.8; // More sensitive to small price moves in sideways markets
    } else if (context.phase === 'TRENDING' as any) {
      thresholds.volumeChangeThreshold *= 0.9; // More sensitive to volume in trending markets
    }
    
    return thresholds;
  }
  
  /**
   * Detects BlackJack patterns in the given data
   */
  protected detectPatterns(
    data: CandlestickData[],
    context: MarketContext
  ): BlackjackPattern[] {
    logDebug('DEBUG_PATTERN_DETECT', `[BlackjackDetector] Invoked with ${data.length} candles`);
    
    if (data.length < (this.options.minPatternLength || 20)) {
      logDebug('DEBUG_PATTERN_DETECT', `[BlackjackDetector] Not enough data: ${data.length} < ${this.options.minPatternLength || 20}`);
      return [];
    }
    
    // Calculate adaptive thresholds
    const thresholds = this.calculateThresholds(context);
    
    // Calculate intrinsic and cumulative BlackJack scores
    const intrinsicScores = BlackjackDetectionUtils.calculateIntrinsicScores(
      data,
      thresholds.priceChangeThreshold,
      thresholds.volumeChangeThreshold
    );
    
    const cumulativeScores = BlackjackDetectionUtils.calculateCumulativeScores(
      intrinsicScores,
      thresholds.lookbackPeriods
    );
    
    // Calculate context score if enabled
    let contextScore: number | undefined = undefined;
    if (this.options.useContextTimeframe) {
      contextScore = BlackjackDetectionUtils.calculateContextScore(
        data,
        thresholds.lookbackPeriods,
        thresholds.contextTimeframeMultiplier,
        thresholds.priceChangeThreshold,
        thresholds.volumeChangeThreshold
      );
    }
    
    // Generate patterns where score exceeds threshold
    const patterns: BlackjackPattern[] = [];
    
    for (let i = thresholds.lookbackPeriods; i < data.length; i++) {
      const score = cumulativeScores[i];
      const absScore = Math.abs(score);
      
      // Skip if score doesn't meet threshold
      if (absScore < thresholds.minCumulativeScore) {
        continue;
      }
      
      // Calculate signal strength
      const signalStrength = this.calculateSignalStrength(
        score,
        contextScore,
        intrinsicScores.slice(i - thresholds.lookbackPeriods + 1, i + 1)
      );
      
      // Calculate price and volume changes for visualization
      const volumeChanges: number[] = [];
      const priceChanges: number[] = [];
      
      for (let j = i - thresholds.lookbackPeriods + 1; j <= i; j++) {
        if (j <= 0) continue;
        
        volumeChanges.push(
          BlackjackDetectionUtils.calculateVolumeChange(data[j - 1], data[j])
        );
        priceChanges.push(
          BlackjackDetectionUtils.calculatePriceChange(data[j - 1], data[j])
        );
      }
      
      // Calculate confidence score
      const consistency = BlackjackDetectionUtils.calculateConsistency(
        intrinsicScores.slice(i - thresholds.lookbackPeriods + 1, i + 1)
      );
      
      const trendStrength = BlackjackDetectionUtils.calculatePriceTrendStrength(
        data.slice(i - thresholds.lookbackPeriods + 1, i + 1)
      );
      
      const contextAlignment = contextScore !== undefined ? 
        (Math.sign(score) === Math.sign(contextScore) ? 1.2 : 0.8) : 1.0;
      
      const baseConfidence = 0.5 + 
        (absScore / (thresholds.lookbackPeriods * 2)) * 0.3 + 
        consistency * 0.2 + 
        trendStrength * 0.2;
      
      const confidence = Math.min(1.0, baseConfidence * contextAlignment);
      
      // Only include patterns with sufficient confidence
      if (confidence >= thresholds.confidenceThreshold) {
        patterns.push({
          id: uuidv4(),
          type: PatternType.BLACKJACK,
          startTime: parseDatetime(data[i - thresholds.lookbackPeriods + 1].datetime),
          endTime: parseDatetime(data[i].datetime),
          highPrice: Math.max(...data.slice(i - thresholds.lookbackPeriods + 1, i + 1).map(d => d.high)),
          lowPrice: Math.min(...data.slice(i - thresholds.lookbackPeriods + 1, i + 1).map(d => d.low)),
          confidence,
          hasReceivedFeedback: false,
          
          intrinsicScores: intrinsicScores.slice(i - thresholds.lookbackPeriods + 1, i + 1),
          cumulativeScore: score,
          contextScore,
          signalStrength,
          volumeChange: volumeChanges,
          priceChange: priceChanges
        });
      }
    }
    
    logDebug('DEBUG_PATTERN_DETECT', `[BlackjackDetector] Found ${patterns.length} raw patterns before filtering`);
    
    // Filter out overlapping patterns, keeping the strongest ones
    const filteredPatterns = this.filterOverlappingPatterns(patterns);
    
    logDebug('DEBUG_PATTERN_DETECT', `[BlackjackDetector] ${filteredPatterns.length} patterns after overlap filtering`);
    
    // Apply post-processing
    const finalPatterns = this.postProcessPatterns(filteredPatterns, context);
    
    logDebug('DEBUG_PATTERN_DETECT', `[BlackjackDetector] Returning ${finalPatterns.length} final patterns`);
    
    return finalPatterns;
  }
  
  /**
   * Calculate signal strength based on score magnitude and context
   */
  private calculateSignalStrength(
    score: number,
    contextScore: number | undefined,
    recentScores: number[]
  ): BlackjackSignalStrength {
    const absScore = Math.abs(score);
    
    // Very strong: High score OR moderate score with aligned context
    if (absScore >= 5 || 
        (absScore >= 3 && contextScore !== undefined && 
         Math.sign(score) === Math.sign(contextScore) && 
         Math.abs(contextScore) >= 2)) {
      return BlackjackSignalStrength.VERY_STRONG;
    } 
    // Strong: Good score OR moderate score with aligned context
    else if (absScore >= 3 || 
            (absScore >= 2 && contextScore !== undefined && 
             Math.sign(score) === Math.sign(contextScore) && 
             Math.abs(contextScore) >= 1)) {
      return BlackjackSignalStrength.STRONG;
    }
    // Moderate: Meets minimum threshold
    else if (absScore >= 2) {
      return BlackjackSignalStrength.MODERATE;
    }
    // Weak: Just barely meets criteria
    else {
      return BlackjackSignalStrength.WEAK;
    }
  }
  
  /**
   * Post-process detected patterns to enhance metadata
   */
  protected postProcessPatterns(
    patterns: BlackjackPattern[], 
    context: MarketContext
  ): BlackjackPattern[] {
    if (patterns.length === 0) {
      return patterns;
    }
    
    return patterns.map(pattern => {
      // Adjust confidence based on market conditions
      let adjustedConfidence = pattern.confidence;
      
      // Boost confidence of strong signals in aligned market conditions
      if ((pattern.cumulativeScore > 0 && context.phase === 'BULLISH' as any) ||
          (pattern.cumulativeScore < 0 && context.phase === 'BEARISH' as any)) {
        adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.1);
      }
      
      // Reduce confidence of contradicting signals
      if ((pattern.cumulativeScore > 0 && context.phase === 'BEARISH' as any) ||
          (pattern.cumulativeScore < 0 && context.phase === 'BULLISH' as any)) {
        adjustedConfidence = Math.max(0.0, adjustedConfidence * 0.9);
      }
      
      return {
        ...pattern,
        confidence: adjustedConfidence
      };
    });
  }
  
  /**
   * Filter out overlapping patterns, keeping only the strongest ones
   */
  private filterOverlappingPatterns(patterns: BlackjackPattern[]): BlackjackPattern[] {
    if (patterns.length <= 1) {
      return patterns;
    }
    
    // Sort by confidence (highest first)
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    const result: BlackjackPattern[] = [];
    const overlappingGroups = new Map<string, string[]>();
    
    // First pass: identify overlapping patterns
    for (let i = 0; i < patterns.length; i++) {
      const patternA = patterns[i];
      const overlapGroup: string[] = [patternA.id];
      
      for (let j = i + 1; j < patterns.length; j++) {
        const patternB = patterns[j];
        
        if (this.patternsOverlap(patternA, patternB)) {
          overlapGroup.push(patternB.id);
        }
      }
      
      if (overlapGroup.length > 1) {
        overlappingGroups.set(patternA.id, overlapGroup);
      }
    }
    
    // Second pass: keep only the strongest pattern from each group
    const processedIds = new Set<string>();
    
    for (const pattern of patterns) {
      if (processedIds.has(pattern.id)) {
        continue;
      }
      
      const overlapGroup = overlappingGroups.get(pattern.id);
      
      if (overlapGroup) {
        // This is the highest confidence pattern in its group (due to sorting)
        result.push(pattern);
        
        // Mark all overlapping patterns as processed
        overlapGroup.forEach(id => processedIds.add(id));
      } else {
        // Pattern has no overlaps
        result.push(pattern);
        processedIds.add(pattern.id);
      }
    }
    
    return result;
  }
  
  /**
   * Check if two patterns overlap in time
   */
  private patternsOverlap(
    patternA: BlackjackPattern,
    patternB: BlackjackPattern
  ): boolean {
    // Time overlap - consider overlapping if more than 50% overlap
    const startA = patternA.startTime.getTime();
    const endA = patternA.endTime.getTime();
    const startB = patternB.startTime.getTime();
    const endB = patternB.endTime.getTime();
    
    const overlapStart = Math.max(startA, startB);
    const overlapEnd = Math.min(endA, endB);
    
    if (overlapStart > overlapEnd) {
      return false; // No time overlap
    }
    
    const overlapDuration = overlapEnd - overlapStart;
    const durationA = endA - startA;
    const durationB = endB - startB;
    
    // Consider overlapping if overlap is at least 50% of either pattern
    const overlapRatio = overlapDuration / Math.min(durationA, durationB);
    return overlapRatio > 0.5;
  }
}
