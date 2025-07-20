// src/utils/patternDetection/core/BasePatternDetector.ts
// Detector for BasePattern pattern
// Identifies occurrences in price data
import { CandlestickData } from '../../../models/ChartTypes';
import { Pattern, PatternType } from '../../../models/PatternTypes';
import { MarketContext, ThresholdConfig } from './MarketContext';
import { logDebug } from '../../debug';

/**
 * Detection statistics for diagnostic and performance tracking
 */
export interface DetectionStats {
  processedCandles: number;
  candidatesEvaluated: number;
  patternsDetected: number;
  detectionTimeMs: number;
  avgConfidence: number;
  thresholds: ThresholdConfig;
}

/**
 * Configuration options for pattern detection
 */
export interface DetectionOptions {
  minimumConfidence: number;
  adaptiveThresholds: boolean;
  maxPatterns?: number;
  enableLogging?: boolean;
}

/**
 * Base class for all pattern detectors that implements adaptive threshold management
 * and context-aware pattern detection
 * NOTE: TriSight uses Canvas, not SVG. Supports DEBUG_PATTERN_DETECT channel via logDebug.
 */
export abstract class BasePatternDetector<T extends Pattern> {
  protected detectionStats: DetectionStats;
  protected options: DetectionOptions;
  
  constructor(options: Partial<DetectionOptions> = {}) {
    this.options = {
      minimumConfidence: 0.4,
      adaptiveThresholds: true,
      maxPatterns: 100,
      enableLogging: false,
      ...options
    };
    
    this.detectionStats = {
      processedCandles: 0,
      candidatesEvaluated: 0,
      patternsDetected: 0,
      detectionTimeMs: 0,
      avgConfidence: 0,
      thresholds: this.getDefaultThresholds()
    };
  }
  
  /**
   * Main method to detect patterns in the given data with market context
   */
  public detect(data: CandlestickData[], context?: MarketContext): T[] {
    /*
     * PatternDetectorDiagnostics: Entry-point log so we can verify that every
     * detector is actually invoked during a chart load / scroll.
     * We attempt to resolve the currently viewed symbol from the same
     * localStorage location used by the navigation bar.
     */
    let currentSymbol: string = 'UNKNOWN';
    try {
      // The navbar persists symbol info under this key
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem('trisight_navbar_symbol_info');
        if (saved) {
          const parsed = JSON.parse(saved);
          currentSymbol = parsed?.symbol || 'UNKNOWN';
        }
      }
    } catch {
      /* Ignore JSON parsing / storage access errors – fallback to UNKNOWN */
    }

    // Always emit this diagnostic – independent of enableLogging flag
    // so that even “silent” detectors surface in the console.
    // Format: [DEBUG] Running <PatternType> detector for <SYMBOL>
    // Example: [DEBUG] Running ROCKETMAN detector for AAPL
    console.log(`[DEBUG] Running ${this.getPatternType()} detector for`, currentSymbol);

    const startTime = performance.now();
    
    // Use provided context or create a minimal default one
    const effectiveContext = context || this.createMinimalContext(data);
    
    // Calculate adaptive thresholds based on current market context
    const thresholds = this.options.adaptiveThresholds 
      ? this.calculateThresholds(effectiveContext)
      : this.getDefaultThresholds();
    
    this.detectionStats.thresholds = thresholds;
    
    if (this.options.enableLogging) {
      logDebug('DEBUG_PATTERN_DETECT', `[${this.getPatternType()}] Detecting with thresholds:`, thresholds);
    }
    
    // Perform the actual pattern detection (implemented by specific detectors)
    const patterns = this.detectPatterns(data, effectiveContext, thresholds);
    
    // Apply post-processing (filtering, deduplication, etc.)
    const processedPatterns = this.postProcessPatterns(patterns, effectiveContext);
    
    // Update detection statistics
    this.detectionStats.processedCandles = data.length;
    this.detectionStats.patternsDetected = processedPatterns.length;
    this.detectionStats.detectionTimeMs = performance.now() - startTime;
    this.detectionStats.avgConfidence = processedPatterns.length > 0
      ? processedPatterns.reduce((sum, p) => sum + p.confidence, 0) / processedPatterns.length
      : 0;
    
    // Exit-point summary – always emit if no patterns were found so we can
    // identify detectors that are returning empty silently. When patterns are
    // found we defer to the existing enableLogging guard to avoid spamming.
    if (processedPatterns.length === 0) {
      console.log(`[DEBUG] ${this.getPatternType()} detector returned 0 patterns for`, currentSymbol);
    } else if (this.options.enableLogging) {
      logDebug('DEBUG_PATTERN_DETECT', `[${this.getPatternType()}] Detected ${processedPatterns.length} patterns. `
       + `Avg confidence: ${this.detectionStats.avgConfidence.toFixed(2)}`);
    }
    
    return processedPatterns;
  }
  
  /**
   * Returns the current detection statistics
   */
  public getDetectionStats(): DetectionStats {
    return { ...this.detectionStats };
  }
  
  /**
   * Update detector options
   * Provides a public method to update options from outside the class hierarchy
   */
  public updateOptions(newOptions: Partial<DetectionOptions>): void {
    this.options = {
      ...this.options,
      ...newOptions
    };
    
    if (this.options.enableLogging) {
      logDebug('DEBUG_PATTERN_DETECT', `[${this.getPatternType()}] Options updated:`, this.options);
    }
  }
  
  /**
   * Returns the pattern type this detector is responsible for
   */
  public abstract getPatternType(): PatternType;
  
  /**
   * Returns default threshold values for this pattern type
   */
  protected abstract getDefaultThresholds(): ThresholdConfig;
  
  /**
   * Calculate adaptive thresholds based on market context
   */
  protected abstract calculateThresholds(context: MarketContext): ThresholdConfig;
  
  /**
   * Implement pattern-specific detection logic
   */
  protected abstract detectPatterns(
    data: CandlestickData[], 
    context: MarketContext,
    thresholds: ThresholdConfig
  ): T[];
  
  /**
   * Post-process detected patterns (filtering, deduplication, etc.)
   */
  protected postProcessPatterns(patterns: T[], context: MarketContext): T[] {
    if (patterns.length === 0) return patterns;
    
    // Filter by minimum confidence
    let filtered = patterns.filter(p => p.confidence >= this.options.minimumConfidence);
    
    // Sort by confidence (descending)
    filtered = filtered.sort((a, b) => b.confidence - a.confidence);
    
    // Limit to maximum number of patterns if specified
    if (this.options.maxPatterns && filtered.length > this.options.maxPatterns) {
      filtered = filtered.slice(0, this.options.maxPatterns);
    }
    
    return filtered;
  }
  
  /**
   * Creates a minimal market context when none is provided
   */
  private createMinimalContext(data: CandlestickData[]): MarketContext {
    return {
      activeChannels: [],
      channelWidthPercentage: 0,
      currentPositionInChannel: 0.5,
      breakoutPotential: 0.5,
      
      // Minimal structure
      structure: {
        channels: [],
        priceLevels: [],
        currentPhase: 'BETWEEN_CHANNELS' as any,
        trend: 'NEUTRAL' as any,
        volatility: this.calculateBasicVolatility(data),
        averageChannelWidth: 0,
        currentPriceLocation: {
          relativeToChannels: 0.5,
          nearestLevel: null as any,
          distanceToNearestLevel: 100
        }
      },
      
      timeframe: '1min',
      volatility: this.calculateBasicVolatility(data),
      volumeProfile: {
        averageVolume: data.reduce((sum, d) => sum + d.volume, 0) / data.length,
        volumeTrend: 'FLAT',
        relativeVolume: 1.0,
        volumeSpikes: []
      },
      
      phase: 'BETWEEN_CHANNELS' as any,
      
      detectedPatternDensity: new Map(),
      recentPatterns: [],
      
      // Implement the getVolatilityFactor method required by the MarketContext interface
      getVolatilityFactor: function() {
        // Scale volatility to a reasonable factor between 0.5 and 2.0
        // Higher volatility = higher factor = wider thresholds
        const baseVolatility = 0.01; // 1% as a baseline normal volatility
        const volatilityRatio = this.volatility / baseVolatility;
        return Math.max(0.5, Math.min(2.0, volatilityRatio));
      }
    };
  }
  
  /**
   * Calculates basic volatility from price data
   */
  private calculateBasicVolatility(data: CandlestickData[]): number {
    if (data.length < 10) return 0;
    
    const window = data.slice(-20);
    const returns: number[] = [];
    
    for (let i = 1; i < window.length; i++) {
      const percentChange = (window[i].close - window[i-1].close) / window[i-1].close * 100;
      returns.push(percentChange);
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
}
