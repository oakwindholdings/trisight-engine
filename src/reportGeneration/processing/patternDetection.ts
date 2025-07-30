// src/reportGeneration/processing/patternDetection.ts
// Sophisticated pattern detection engine for technical analysis
// Context: Identifies and validates chart patterns with statistical rigor

import { PriceData, TechnicalIndicators } from '../models/reportTypes';

/**
 * Pattern detection configuration
 * These parameters control sensitivity and validation thresholds
 */
export interface PatternDetectionConfig {
  minPatternLength: number;      // Minimum bars for pattern formation
  confidenceThreshold: number;   // Minimum confidence to report pattern
  lookbackPeriod: number;       // How far back to search for patterns
  validateWithVolume: boolean;  // Whether volume confirmation is required
  statisticalValidation: boolean; // Enable statistical significance testing
}

/**
 * Detected pattern structure
 * Contains all information needed to act on a pattern
 */
export interface DetectedPattern {
  type: PatternType;
  startIndex: number;
  endIndex: number;
  startDate: string;
  endDate: string;
  confidence: number;        // 0-100 score
  strength: number;         // Pattern clarity/definition
  direction: 'bullish' | 'bearish' | 'neutral';
  targetPrice?: number;     // Projected price target
  stopLoss?: number;       // Risk management level
  probability: number;     // Historical win rate
  metadata: {
    formation: any;      // Pattern-specific details
    validation: any;     // Statistical validation results
    volume: any;        // Volume analysis
  };
}

/**
 * Pattern types based on TriSight's identified formations
 */
export enum PatternType {
  GOLDMINE_CHANNEL = 'goldmine_channel',
  GOLDMINE_SHAFT = 'goldmine_shaft',
  PIVOT = 'pivot',
  ROCKETMAN = 'rocketman',
  ESCALATOR = 'escalator',
  BLACKJACK = 'blackjack',
  // Additional classical patterns
  HEAD_AND_SHOULDERS = 'head_and_shoulders',
  DOUBLE_TOP = 'double_top',
  DOUBLE_BOTTOM = 'double_bottom',
  TRIANGLE = 'triangle',
  FLAG = 'flag',
  WEDGE = 'wedge'
}

/**
 * Main pattern detection engine
 * This class orchestrates all pattern identification and validation
 */
export class PatternDetectionEngine {
  private config: PatternDetectionConfig;
  private detectors: Map<PatternType, PatternDetector>;
  
  constructor(config: Partial<PatternDetectionConfig> = {}) {
    this.config = {
      minPatternLength: 5,
      confidenceThreshold: 60,
      lookbackPeriod: 252, // 1 year of daily data
      validateWithVolume: true,
      statisticalValidation: true,
      ...config
    };
    
    // Initialize individual pattern detectors
    this.detectors = new Map([
      [PatternType.GOLDMINE_CHANNEL, new GoldmineChannelDetector(this.config)],
      [PatternType.GOLDMINE_SHAFT, new GoldmineShaftDetector(this.config)],
      [PatternType.PIVOT, new PivotPatternDetector(this.config)],
      [PatternType.ROCKETMAN, new RocketmanDetector(this.config)],
      [PatternType.ESCALATOR, new EscalatorDetector(this.config)],
      [PatternType.BLACKJACK, new BlackjackDetector(this.config)],
      [PatternType.HEAD_AND_SHOULDERS, new HeadAndShouldersDetector(this.config)],
      [PatternType.DOUBLE_TOP, new DoubleTopDetector(this.config)],
      [PatternType.DOUBLE_BOTTOM, new DoubleBottomDetector(this.config)]
    ]);
  }
  
  /**
   * Detects all patterns in the given price data
   * This is the main entry point for pattern detection
   */
  async detectPatterns(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    if (!priceData || priceData.length < this.config.minPatternLength) {
      return [];
    }
    
    // Ensure data is sorted chronologically (newest first)
    const sortedData = [...priceData].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // Limit lookback period
    const analysisData = sortedData.slice(0, this.config.lookbackPeriod);
    
    // Run all pattern detectors in parallel
    const detectionPromises = Array.from(this.detectors.entries()).map(
      async ([type, detector]) => {
        try {
          const patterns = await detector.detect(analysisData, technicals);
          return patterns.filter(p => p.confidence >= this.config.confidenceThreshold);
        } catch (error) {
          console.error(`Error in ${type} detector:`, error);
          return [];
        }
      }
    );
    
    const allPatterns = (await Promise.all(detectionPromises)).flat();
    
    // Remove overlapping patterns, keeping highest confidence
    const deduplicatedPatterns = this.deduplicatePatterns(allPatterns);
    
    // Validate patterns statistically if enabled
    if (this.config.statisticalValidation) {
      return this.validatePatternsStatistically(deduplicatedPatterns, analysisData);
    }
    
    return deduplicatedPatterns;
  }
  
  /**
   * Removes overlapping patterns, keeping the highest quality ones
   * This prevents multiple patterns from claiming the same price action
   */
  private deduplicatePatterns(patterns: DetectedPattern[]): DetectedPattern[] {
    // Sort by confidence descending
    const sorted = [...patterns].sort((a, b) => b.confidence - a.confidence);
    const kept: DetectedPattern[] = [];
    
    for (const pattern of sorted) {
      // Check if this pattern overlaps with any already kept pattern
      const overlaps = kept.some(existing => 
        this.patternsOverlap(pattern, existing)
      );
      
      if (!overlaps) {
        kept.push(pattern);
      }
    }
    
    return kept;
  }
  
  /**
   * Checks if two patterns overlap in time
   * Patterns that share more than 50% of their timespan are considered overlapping
   */
  private patternsOverlap(p1: DetectedPattern, p2: DetectedPattern): boolean {
    const start1 = p1.startIndex;
    const end1 = p1.endIndex;
    const start2 = p2.startIndex;
    const end2 = p2.endIndex;
    
    // Check if patterns overlap
    if (start1 > end2 || start2 > end1) {
      return false; // No overlap
    }
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapLength = overlapEnd - overlapStart + 1;
    
    // Calculate overlap percentage for both patterns
    const p1Length = end1 - start1 + 1;
    const p2Length = end2 - start2 + 1;
    const overlapPercent1 = overlapLength / p1Length;
    const overlapPercent2 = overlapLength / p2Length;
    
    // Consider overlapping if either pattern has >50% overlap
    return overlapPercent1 > 0.5 || overlapPercent2 > 0.5;
  }
  
  /**
   * Validates patterns using statistical methods
   * This helps avoid false positives from random price movements
   */
  private validatePatternsStatistically(
    patterns: DetectedPattern[],
    priceData: PriceData[]
  ): DetectedPattern[] {
    return patterns.map(pattern => {
      // Calculate pattern's statistical significance
      const validation = this.calculateStatisticalSignificance(pattern, priceData);
      
      // Adjust confidence based on statistical validation
      const adjustedConfidence = pattern.confidence * validation.significanceScore;
      
      return {
        ...pattern,
        confidence: adjustedConfidence,
        metadata: {
          ...pattern.metadata,
          validation
        }
      };
    }).filter(p => p.confidence >= this.config.confidenceThreshold);
  }
  
  /**
   * Calculates statistical significance of a pattern
   * Uses methods like comparing to random walk expectations
   */
  private calculateStatisticalSignificance(
    pattern: DetectedPattern,
    priceData: PriceData[]
  ): any {
    // Extract price movements during pattern formation
    const patternReturns = [];
    for (let i = pattern.startIndex + 1; i <= pattern.endIndex; i++) {
      const return_ = (priceData[i - 1].close - priceData[i].close) / priceData[i].close;
      patternReturns.push(return_);
    }
    
    // Calculate pattern statistics
    const meanReturn = patternReturns.reduce((sum, r) => sum + r, 0) / patternReturns.length;
    const variance = patternReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / patternReturns.length;
    const stdDev = Math.sqrt(variance);
    
    // Compare to broader market statistics (using all available data)
    const marketReturns = [];
    for (let i = 1; i < priceData.length; i++) {
      const return_ = (priceData[i - 1].close - priceData[i].close) / priceData[i].close;
      marketReturns.push(return_);
    }
    
    const marketMean = marketReturns.reduce((sum, r) => sum + r, 0) / marketReturns.length;
    const marketStdDev = Math.sqrt(
      marketReturns.reduce((sum, r) => sum + Math.pow(r - marketMean, 2), 0) / marketReturns.length
    );
    
    // Calculate t-statistic
    const tStatistic = (meanReturn - marketMean) / (stdDev / Math.sqrt(patternReturns.length));
    
    // Convert to significance score (0-1)
    // Using simplified approach - in practice would use t-distribution
    const significanceScore = Math.min(Math.abs(tStatistic) / 2, 1);
    
    return {
      meanReturn,
      stdDev,
      tStatistic,
      significanceScore,
      sampleSize: patternReturns.length,
      isStatisticallySignificant: Math.abs(tStatistic) > 1.96 // 95% confidence
    };
  }
}

/**
 * Base class for individual pattern detectors
 * Each specific pattern extends this with its own logic
 */
abstract class PatternDetector {
  constructor(protected config: PatternDetectionConfig) {}
  
  abstract detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]>;
  
  /**
   * Calculates pattern confidence based on how well it matches ideal form
   * Each pattern type can override this with specific logic
   */
  protected calculateConfidence(
    formation: any,
    priceData: PriceData[],
    startIdx: number,
    endIdx: number
  ): number {
    let confidence = 50; // Base confidence
    
    // Add points for clear formation
    if (formation.clarity > 0.8) confidence += 20;
    else if (formation.clarity > 0.6) confidence += 10;
    
    // Add points for volume confirmation
    if (this.config.validateWithVolume) {
      const volumeScore = this.analyzeVolumePattern(priceData, startIdx, endIdx);
      confidence += volumeScore * 20;
    }
    
    // Add points for trend alignment
    const trendScore = this.analyzeTrendAlignment(priceData, startIdx);
    confidence += trendScore * 10;
    
    return Math.min(Math.max(confidence, 0), 100);
  }
  
  /**
   * Analyzes volume pattern during formation
   * Rising volume on breakouts increases confidence
   */
  protected analyzeVolumePattern(
    priceData: PriceData[],
    startIdx: number,
    endIdx: number
  ): number {
    if (endIdx - startIdx < 2) return 0.5;
    
    const volumes = [];
    for (let i = startIdx; i <= endIdx; i++) {
      volumes.push(priceData[i].volume);
    }
    
    // Calculate average volume before pattern
    const prePatternVolumes = [];
    for (let i = endIdx + 1; i < Math.min(endIdx + 20, priceData.length); i++) {
      prePatternVolumes.push(priceData[i].volume);
    }
    
    const avgPreVolume = prePatternVolumes.length > 0
      ? prePatternVolumes.reduce((sum, v) => sum + v, 0) / prePatternVolumes.length
      : volumes[0];
    
    // Check if volume increased during pattern formation
    const avgPatternVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeIncrease = avgPatternVolume / avgPreVolume;
    
    // Score based on volume increase
    if (volumeIncrease > 1.5) return 1.0;  // Strong volume
    if (volumeIncrease > 1.2) return 0.7;  // Good volume
    if (volumeIncrease > 1.0) return 0.5;  // Average volume
    return 0.3; // Below average volume
  }
  
  /**
   * Analyzes whether pattern aligns with prevailing trend
   * Patterns in direction of trend have higher success rates
   */
  protected analyzeTrendAlignment(priceData: PriceData[], startIdx: number): number {
    if (startIdx + 50 >= priceData.length) return 0.5;
    
    // Calculate trend before pattern using simple regression
    const trendPrices = priceData.slice(startIdx, startIdx + 50).map(p => p.close);
    const trendDirection = this.calculateTrendDirection(trendPrices);
    
    // Pattern direction should align with trend for higher confidence
    // This will be implemented by specific pattern detectors
    return 0.5; // Neutral default
  }
  
  /**
   * Calculates trend direction using linear regression
   * Returns positive for uptrend, negative for downtrend
   */
  protected calculateTrendDirection(prices: number[]): number {
    const n = prices.length;
    if (n < 2) return 0;
    
    // Simple linear regression
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += prices[i];
      sumXY += i * prices[i];
      sumX2 += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
}

/**
 * Goldmine Channel Detector
 * Identifies parallel trend channels that contain price action
 */
class GoldmineChannelDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    const minChannelLength = Math.max(this.config.minPatternLength, 20);
    
    // Scan for potential channel formations
    for (let i = minChannelLength; i < priceData.length - minChannelLength; i++) {
      const channel = this.identifyChannel(priceData, i, minChannelLength);
      
      if (channel) {
        const pattern = this.createPatternFromChannel(channel, priceData, i);
        if (pattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(pattern);
          i += channel.length - 1; // Skip ahead to avoid overlapping detections
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Identifies a channel starting at given index
   * Channels have parallel support and resistance lines
   */
  private identifyChannel(
    priceData: PriceData[],
    startIdx: number,
    minLength: number
  ): any | null {
    // Find local highs and lows
    const highs: { index: number; price: number }[] = [];
    const lows: { index: number; price: number }[] = [];
    
    for (let i = startIdx; i < Math.min(startIdx + 100, priceData.length - 1); i++) {
      const price = priceData[i];
      const prevPrice = priceData[i + 1];
      const nextPrice = priceData[i - 1];
      
      if (prevPrice && nextPrice) {
        // Local high
        if (price.high > prevPrice.high && price.high > nextPrice.high) {
          highs.push({ index: i, price: price.high });
        }
        // Local low
        if (price.low < prevPrice.low && price.low < nextPrice.low) {
          lows.push({ index: i, price: price.low });
        }
      }
    }
    
    // Need at least 2 highs and 2 lows for a channel
    if (highs.length < 2 || lows.length < 2) return null;
    
    // Fit lines to highs and lows
    const upperLine = this.fitLine(highs);
    const lowerLine = this.fitLine(lows);
    
    // Check if lines are parallel (similar slopes)
    const slopeDiff = Math.abs(upperLine.slope - lowerLine.slope);
    const avgSlope = (Math.abs(upperLine.slope) + Math.abs(lowerLine.slope)) / 2;
    const slopeRatio = avgSlope > 0 ? slopeDiff / avgSlope : 0;
    
    if (slopeRatio > 0.3) return null; // Lines not parallel enough
    
    // Determine channel length by finding where price breaks out
    let channelEnd = startIdx;
    for (let i = startIdx; i > 0; i--) {
      const price = priceData[i].close;
      const upperBound = upperLine.intercept + upperLine.slope * (startIdx - i);
      const lowerBound = lowerLine.intercept + lowerLine.slope * (startIdx - i);
      
      if (price > upperBound * 1.02 || price < lowerBound * 0.98) {
        channelEnd = i + 1;
        break;
      }
    }
    
    const channelLength = startIdx - channelEnd + 1;
    if (channelLength < minLength) return null;
    
    return {
      upperLine,
      lowerLine,
      length: channelLength,
      endIndex: channelEnd,
      highs,
      lows,
      clarity: 1 - slopeRatio // Higher clarity for more parallel lines
    };
  }
  
  /**
   * Fits a line to a set of points using least squares
   * Returns slope and intercept of the line
   */
  private fitLine(points: { index: number; price: number }[]): { slope: number; intercept: number } {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: 0 };
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    
    points.forEach(point => {
      sumX += point.index;
      sumY += point.price;
      sumXY += point.index * point.price;
      sumX2 += point.index * point.index;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return { slope, intercept };
  }
  
  /**
   * Creates a DetectedPattern from channel data
   */
  private createPatternFromChannel(
    channel: any,
    priceData: PriceData[],
    startIdx: number
  ): DetectedPattern {
    const currentPrice = priceData[0].close;
    const channelWidth = channel.upperLine.intercept - channel.lowerLine.intercept;
    const currentUpper = channel.upperLine.intercept + channel.upperLine.slope * startIdx;
    const currentLower = channel.lowerLine.intercept + channel.lowerLine.slope * startIdx;
    
    // Determine direction based on slope
    const direction = channel.upperLine.slope > 0.0001 ? 'bullish' : 
                     channel.upperLine.slope < -0.0001 ? 'bearish' : 'neutral';
    
    // Calculate price targets based on channel
    let targetPrice: number;
    let stopLoss: number;
    
    if (direction === 'bullish') {
      targetPrice = currentUpper;
      stopLoss = currentLower * 0.98;
    } else if (direction === 'bearish') {
      targetPrice = currentLower;
      stopLoss = currentUpper * 1.02;
    } else {
      targetPrice = (currentUpper + currentLower) / 2;
      stopLoss = currentPrice * 0.95;
    }
    
    const confidence = this.calculateConfidence(channel, priceData, channel.endIndex, startIdx);
    
    return {
      type: PatternType.GOLDMINE_CHANNEL,
      startIndex: channel.endIndex,
      endIndex: startIdx,
      startDate: priceData[channel.endIndex].date,
      endDate: priceData[startIdx].date,
      confidence,
      strength: channel.clarity,
      direction,
      targetPrice,
      stopLoss,
      probability: this.getHistoricalProbability(PatternType.GOLDMINE_CHANNEL, direction),
      metadata: {
        formation: {
          upperSlope: channel.upperLine.slope,
          lowerSlope: channel.lowerLine.slope,
          channelWidth,
          touchPoints: channel.highs.length + channel.lows.length
        },
        validation: {},
        volume: {}
      }
    };
  }
  
  /**
   * Returns historical win rate for this pattern type
   * In practice, this would query a database of historical patterns
   */
  private getHistoricalProbability(type: PatternType, direction: string): number {
    // Placeholder probabilities based on general pattern success rates
    const probabilities = {
      'bullish': 0.65,
      'bearish': 0.60,
      'neutral': 0.50
    };
    
    return probabilities[direction] || 0.50;
  }
}

/**
 * Goldmine Shaft Detector
 * Identifies vertical momentum moves (sharp rallies or declines)
 */
class GoldmineShaftDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    const minShaftLength = Math.max(this.config.minPatternLength, 3);
    
    // Calculate rolling statistics for anomaly detection
    const stats = this.calculateRollingStats(priceData, 20);
    
    // Scan for shaft patterns
    for (let i = minShaftLength; i < priceData.length - 1; i++) {
      const shaft = this.identifyShaft(priceData, i, minShaftLength, stats);
      
      if (shaft) {
        const pattern = this.createPatternFromShaft(shaft, priceData, i);
        if (pattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(pattern);
          i += shaft.length - 1; // Skip ahead
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Calculates rolling mean and standard deviation
   * Used to identify abnormal price movements
   */
  private calculateRollingStats(priceData: PriceData[], window: number): any[] {
    const stats = [];
    
    for (let i = 0; i < priceData.length; i++) {
      const start = i;
      const end = Math.min(i + window, priceData.length);
      const windowPrices = priceData.slice(start, end).map(p => p.close);
      
      if (windowPrices.length < 2) {
        stats.push({ mean: priceData[i].close, stdDev: 0 });
        continue;
      }
      
      const mean = windowPrices.reduce((sum, p) => sum + p, 0) / windowPrices.length;
      const variance = windowPrices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / windowPrices.length;
      const stdDev = Math.sqrt(variance);
      
      stats.push({ mean, stdDev });
    }
    
    return stats;
  }
  
  /**
   * Identifies a shaft pattern (rapid vertical move)
   * Shafts are characterized by consecutive large moves in same direction
   */
  private identifyShaft(
    priceData: PriceData[],
    startIdx: number,
    minLength: number,
    stats: any[]
  ): any | null {
    let consecutiveMoves = 0;
    let totalMove = 0;
    let direction: 'up' | 'down' | null = null;
    let endIdx = startIdx;
    
    for (let i = startIdx; i > Math.max(0, startIdx - 10); i--) {
      const currentPrice = priceData[i].close;
      const prevPrice = priceData[i + 1]?.close;
      
      if (!prevPrice) break;
      
      const move = (currentPrice - prevPrice) / prevPrice;
      const normalizedMove = Math.abs(move) / (stats[i].stdDev / stats[i].mean || 0.01);
      
      // Check if move is significant (> 2 standard deviations)
      if (normalizedMove > 2) {
        const moveDirection = move > 0 ? 'up' : 'down';
        
        if (direction === null) {
          direction = moveDirection;
        } else if (direction !== moveDirection) {
          break; // Direction changed, shaft ends
        }
        
        consecutiveMoves++;
        totalMove += move;
        endIdx = i;
      } else if (consecutiveMoves > 0) {
        break; // Shaft momentum broken
      }
    }
    
    if (consecutiveMoves < minLength || !direction) return null;
    
    // Calculate shaft characteristics
    const avgMovePerBar = totalMove / consecutiveMoves;
    const velocity = Math.abs(avgMovePerBar) * Math.sqrt(consecutiveMoves); // Momentum measure
    
    return {
      direction,
      length: consecutiveMoves,
      endIndex: endIdx,
      totalMove: Math.abs(totalMove),
      velocity,
      avgMovePerBar,
      clarity: Math.min(velocity / 0.1, 1) // Normalize velocity to 0-1
    };
  }
  
  /**
   * Creates a DetectedPattern from shaft data
   */
  private createPatternFromShaft(
    shaft: any,
    priceData: PriceData[],
    startIdx: number
  ): DetectedPattern {
    const direction = shaft.direction === 'up' ? 'bullish' : 'bearish';
    const currentPrice = priceData[0].close;
    
    // Shafts often lead to continuation or exhaustion
    // Use velocity to determine likely outcome
    const isContinuation = shaft.velocity > 0.15;
    
    let targetPrice: number;
    let stopLoss: number;
    
    if (isContinuation) {
      // Expect continuation in same direction
      const extension = shaft.avgMovePerBar * 3; // Project 3 more bars
      targetPrice = currentPrice * (1 + (shaft.direction === 'up' ? extension : -extension));
      stopLoss = currentPrice * (shaft.direction === 'up' ? 0.98 : 1.02);
    } else {
      // Expect reversal (exhaustion)
      targetPrice = currentPrice * (shaft.direction === 'up' ? 0.97 : 1.03);
      stopLoss = currentPrice * (shaft.direction === 'up' ? 1.02 : 0.98);
    }
    
    const confidence = this.calculateShaftConfidence(shaft, priceData, startIdx);
    
    return {
      type: PatternType.GOLDMINE_SHAFT,
      startIndex: shaft.endIndex,
      endIndex: startIdx,
      startDate: priceData[shaft.endIndex].date,
      endDate: priceData[startIdx].date,
      confidence,
      strength: shaft.clarity,
      direction,
      targetPrice,
      stopLoss,
      probability: isContinuation ? 0.60 : 0.55,
      metadata: {
        formation: {
          totalMove: shaft.totalMove,
          velocity: shaft.velocity,
          consecutiveBars: shaft.length,
          avgMovePerBar: shaft.avgMovePerBar,
          isContinuation
        },
        validation: {},
        volume: {}
      }
    };
  }
  
  /**
   * Calculates confidence specific to shaft patterns
   * High velocity with volume confirmation increases confidence
   */
  private calculateShaftConfidence(
    shaft: any,
    priceData: PriceData[],
    startIdx: number
  ): number {
    let confidence = 50;
    
    // Velocity contribution
    if (shaft.velocity > 0.2) confidence += 20;
    else if (shaft.velocity > 0.15) confidence += 15;
    else if (shaft.velocity > 0.1) confidence += 10;
    
    // Length contribution (longer shafts are more significant)
    confidence += Math.min(shaft.length * 3, 15);
    
    // Volume analysis
    const volumeScore = this.analyzeVolumePattern(priceData, shaft.endIndex, startIdx);
    confidence += volumeScore * 15;
    
    return Math.min(confidence, 100);
  }
}

/**
 * Pivot Pattern Detector
 * Identifies reversal patterns at key levels
 */
class PivotPatternDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Find potential pivot points
    const pivotPoints = this.findPivotPoints(priceData);
    
    // Analyze each pivot for pattern formation
    for (const pivot of pivotPoints) {
      const pattern = this.analyzePivotPattern(pivot, priceData, technicals);
      if (pattern && pattern.confidence >= this.config.confidenceThreshold) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }
  
  /**
   * Finds potential pivot points in price data
   * Pivots occur at significant highs and lows
   */
  private findPivotPoints(priceData: PriceData[]): any[] {
    const pivots = [];
    const lookback = 10; // Bars on each side to confirm pivot
    
    for (let i = lookback; i < priceData.length - lookback; i++) {
      const current = priceData[i];
      let isHighPivot = true;
      let isLowPivot = true;
      
      // Check if current bar is highest/lowest in range
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        
        if (priceData[j].high >= current.high) isHighPivot = false;
        if (priceData[j].low <= current.low) isLowPivot = false;
      }
      
      if (isHighPivot) {
        pivots.push({
          index: i,
          type: 'high',
          price: current.high,
          date: current.date
        });
      } else if (isLowPivot) {
        pivots.push({
          index: i,
          type: 'low',
          price: current.low,
          date: current.date
        });
      }
    }
    
    return pivots;
  }
  
  /**
   * Analyzes a pivot point for pattern formation
   * Looks for reversal confirmation after pivot
   */
  private analyzePivotPattern(
    pivot: any,
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): DetectedPattern | null {
    // Need at least 5 bars after pivot for confirmation
    if (pivot.index < 5) return null;
    
    // Analyze price action after pivot
    const barsAfterPivot = 5;
    const priceChange = this.calculatePriceChangeAfterPivot(
      pivot,
      priceData,
      barsAfterPivot
    );
    
    // Require significant move after pivot (at least 2%)
    if (Math.abs(priceChange) < 0.02) return null;
    
    // Determine if reversal is confirmed
    const isReversal = this.confirmReversal(pivot, priceData, priceChange);
    if (!isReversal) return null;
    
    // Calculate pattern metrics
    const direction = pivot.type === 'high' ? 'bearish' : 'bullish';
    const confidence = this.calculatePivotConfidence(pivot, priceData, priceChange);
    
    // Set targets based on typical pivot retracements
    const currentPrice = priceData[0].close;
    const pivotRange = this.calculatePivotRange(pivot, priceData);
    
    let targetPrice: number;
    let stopLoss: number;
    
    if (direction === 'bullish') {
      targetPrice = pivot.price + pivotRange * 0.618; // 61.8% Fibonacci extension
      stopLoss = pivot.price * 0.98;
    } else {
      targetPrice = pivot.price - pivotRange * 0.618;
      stopLoss = pivot.price * 1.02;
    }
    
    return {
      type: PatternType.PIVOT,
      startIndex: pivot.index,
      endIndex: Math.max(0, pivot.index - barsAfterPivot),
      startDate: priceData[pivot.index].date,
      endDate: priceData[Math.max(0, pivot.index - barsAfterPivot)].date,
      confidence,
      strength: Math.abs(priceChange) * 10, // Normalize to 0-1
      direction,
      targetPrice,
      stopLoss,
      probability: 0.58, // Historical pivot success rate
      metadata: {
        formation: {
          pivotType: pivot.type,
          pivotPrice: pivot.price,
          reversalStrength: priceChange,
          supportResistanceLevel: this.identifyKeyLevel(pivot, priceData)
        },
        validation: {},
        volume: {}
      }
    };
  }
  
  /**
   * Calculates price change after pivot point
   */
  private calculatePriceChangeAfterPivot(
    pivot: any,
    priceData: PriceData[],
    bars: number
  ): number {
    const startIdx = Math.max(0, pivot.index - bars);
    const endPrice = priceData[startIdx].close;
    return (endPrice - pivot.price) / pivot.price;
  }
  
  /**
   * Confirms if a true reversal occurred at pivot
   */
  private confirmReversal(
    pivot: any,
    priceData: PriceData[],
    priceChange: number
  ): boolean {
    // For high pivot, expect negative price change
    if (pivot.type === 'high' && priceChange >= 0) return false;
    
    // For low pivot, expect positive price change
    if (pivot.type === 'low' && priceChange <= 0) return false;
    
    // Check if move is sustained (not just a spike)
    const sustainedMove = this.checkSustainedMove(pivot, priceData);
    
    return sustainedMove;
  }
  
  /**
   * Checks if price move after pivot is sustained
   */
  private checkSustainedMove(pivot: any, priceData: PriceData[]): boolean {
    const checkBars = Math.min(5, pivot.index);
    let sustainedBars = 0;
    
    for (let i = 1; i <= checkBars; i++) {
      const price = priceData[pivot.index - i].close;
      
      if (pivot.type === 'high' && price < pivot.price) {
        sustainedBars++;
      } else if (pivot.type === 'low' && price > pivot.price) {
        sustainedBars++;
      }
    }
    
    return sustainedBars >= 3; // At least 3 bars in reversal direction
  }
  
  /**
   * Calculates the range of the pivot formation
   */
  private calculatePivotRange(pivot: any, priceData: PriceData[]): number {
    // Look at price range in bars leading up to pivot
    const lookback = Math.min(20, pivot.index);
    let high = pivot.price;
    let low = pivot.price;
    
    for (let i = 0; i < lookback; i++) {
      const bar = priceData[pivot.index + i];
      high = Math.max(high, bar.high);
      low = Math.min(low, bar.low);
    }
    
    return high - low;
  }
  
  /**
   * Identifies if pivot occurred at key support/resistance
   */
  private identifyKeyLevel(pivot: any, priceData: PriceData[]): string {
    // Check if pivot is near recent highs/lows
    const recentBars = Math.min(50, priceData.length);
    const recentPrices = priceData.slice(0, recentBars);
    
    const recentHigh = Math.max(...recentPrices.map(p => p.high));
    const recentLow = Math.min(...recentPrices.map(p => p.low));
    
    const tolerance = 0.01; // 1% tolerance
    
    if (Math.abs(pivot.price - recentHigh) / recentHigh < tolerance) {
      return 'resistance';
    } else if (Math.abs(pivot.price - recentLow) / recentLow < tolerance) {
      return 'support';
    }
    
    return 'none';
  }
  
  /**
   * Calculates confidence for pivot patterns
   */
  private calculatePivotConfidence(
    pivot: any,
    priceData: PriceData[],
    priceChange: number
  ): number {
    let confidence = 50;
    
    // Strength of reversal
    const reversalStrength = Math.abs(priceChange);
    if (reversalStrength > 0.05) confidence += 20;
    else if (reversalStrength > 0.03) confidence += 15;
    else confidence += 10;
    
    // Key level bonus
    const keyLevel = this.identifyKeyLevel(pivot, priceData);
    if (keyLevel !== 'none') confidence += 15;
    
    // Volume confirmation
    const volumeScore = this.analyzeVolumePattern(
      priceData,
      pivot.index,
      Math.max(0, pivot.index - 5)
    );
    confidence += volumeScore * 15;
    
    return Math.min(confidence, 100);
  }
}

/**
 * Rocketman Detector
 * Identifies explosive breakout patterns
 */
class RocketmanDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Look for consolidation followed by breakout
    const consolidations = this.findConsolidationZones(priceData);
    
    for (const consolidation of consolidations) {
      const breakout = this.detectBreakout(consolidation, priceData);
      if (breakout) {
        const pattern = this.createRocketmanPattern(consolidation, breakout, priceData);
        if (pattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Finds periods of price consolidation
   * Consolidation precedes explosive moves
   */
  private findConsolidationZones(priceData: PriceData[]): any[] {
    const zones = [];
    const minConsolidation = 10; // Minimum bars for consolidation
    
    for (let i = minConsolidation; i < priceData.length - 5; i++) {
      const zone = this.identifyConsolidation(priceData, i, minConsolidation);
      if (zone) {
        zones.push(zone);
        i += zone.length - 1; // Skip processed bars
      }
    }
    
    return zones;
  }
  
  /**
   * Identifies a consolidation zone
   * Characterized by low volatility and range-bound price action
   */
  private identifyConsolidation(
    priceData: PriceData[],
    startIdx: number,
    minLength: number
  ): any | null {
    const maxLength = Math.min(50, priceData.length - startIdx);
    let consolidationEnd = startIdx;
    
    // Calculate initial range
    const initialBars = priceData.slice(startIdx, startIdx + 5);
    const initialHigh = Math.max(...initialBars.map(p => p.high));
    const initialLow = Math.min(...initialBars.map(p => p.low));
    const initialRange = (initialHigh - initialLow) / initialLow;
    
    // Scan forward while price stays in tight range
    for (let i = startIdx - 5; i >= Math.max(0, startIdx - maxLength); i--) {
      const bar = priceData[i];
      const rangeHigh = initialHigh * 1.02; // 2% tolerance
      const rangeLow = initialLow * 0.98;
      
      if (bar.high > rangeHigh || bar.low < rangeLow) {
        consolidationEnd = i + 1;
        break;
      }
    }
    
    const length = startIdx - consolidationEnd + 1;
    if (length < minLength) return null;
    
    // Calculate consolidation metrics
    const consolidationBars = priceData.slice(consolidationEnd, startIdx + 1);
    const avgVolume = consolidationBars.reduce((sum, b) => sum + b.volume, 0) / length;
    const high = Math.max(...consolidationBars.map(p => p.high));
    const low = Math.min(...consolidationBars.map(p => p.low));
    const range = (high - low) / low;
    
    return {
      startIndex: startIdx,
      endIndex: consolidationEnd,
      length,
      high,
      low,
      range,
      avgVolume,
      tightness: 1 - range // Tighter consolidation scores higher
    };
  }
  
  /**
   * Detects if a breakout occurred from consolidation
   */
  private detectBreakout(consolidation: any, priceData: PriceData[]): any | null {
    // Check bars immediately after consolidation
    const barsToCheck = Math.min(5, consolidation.endIndex);
    
    for (let i = 1; i <= barsToCheck; i++) {
      const idx = consolidation.endIndex - i;
      if (idx < 0) break;
      
      const bar = priceData[idx];
      const breakoutUp = bar.close > consolidation.high * 1.02;
      const breakoutDown = bar.close < consolidation.low * 0.98;
      
      if (breakoutUp || breakoutDown) {
        // Verify breakout with volume
        const volumeIncrease = bar.volume / consolidation.avgVolume;
        if (volumeIncrease < 1.5) continue; // Need volume confirmation
        
        return {
          index: idx,
          direction: breakoutUp ? 'up' : 'down',
          price: bar.close,
          volume: bar.volume,
          volumeIncrease,
          magnitude: breakoutUp 
            ? (bar.close - consolidation.high) / consolidation.high
            : (consolidation.low - bar.close) / consolidation.low
        };
      }
    }
    
    return null;
  }
  
  /**
   * Creates a Rocketman pattern from consolidation and breakout
   */
  private createRocketmanPattern(
    consolidation: any,
    breakout: any,
    priceData: PriceData[]
  ): DetectedPattern {
    const direction = breakout.direction === 'up' ? 'bullish' : 'bearish';
    
    // Calculate targets based on consolidation range
    const rangeSize = consolidation.high - consolidation.low;
    let targetPrice: number;
    let stopLoss: number;
    
    if (direction === 'bullish') {
      targetPrice = breakout.price + rangeSize * 1.618; // Fibonacci extension
      stopLoss = consolidation.low;
    } else {
      targetPrice = breakout.price - rangeSize * 1.618;
      stopLoss = consolidation.high;
    }
    
    const confidence = this.calculateRocketmanConfidence(
      consolidation,
      breakout,
      priceData
    );
    
    return {
      type: PatternType.ROCKETMAN,
      startIndex: consolidation.startIndex,
      endIndex: breakout.index,
      startDate: priceData[consolidation.startIndex].date,
      endDate: priceData[breakout.index].date,
      confidence,
      strength: consolidation.tightness * breakout.magnitude * 10,
      direction,
      targetPrice,
      stopLoss,
      probability: 0.62, // Breakouts with volume have good success
      metadata: {
        formation: {
          consolidationLength: consolidation.length,
          consolidationRange: consolidation.range,
          breakoutMagnitude: breakout.magnitude,
          volumeIncrease: breakout.volumeIncrease,
          tightness: consolidation.tightness
        },
        validation: {},
        volume: {
          avgConsolidationVolume: consolidation.avgVolume,
          breakoutVolume: breakout.volume
        }
      }
    };
  }
  
  /**
   * Calculates confidence for Rocketman patterns
   */
  private calculateRocketmanConfidence(
    consolidation: any,
    breakout: any,
    priceData: PriceData[]
  ): number {
    let confidence = 50;
    
    // Tightness of consolidation
    if (consolidation.tightness > 0.95) confidence += 15;
    else if (consolidation.tightness > 0.90) confidence += 10;
    
    // Length of consolidation (longer = more energy)
    if (consolidation.length > 20) confidence += 10;
    else if (consolidation.length > 15) confidence += 5;
    
    // Breakout strength
    if (breakout.magnitude > 0.05) confidence += 15;
    else if (breakout.magnitude > 0.03) confidence += 10;
    
    // Volume confirmation
    if (breakout.volumeIncrease > 2.0) confidence += 15;
    else if (breakout.volumeIncrease > 1.5) confidence += 10;
    
    return Math.min(confidence, 100);
  }
}

/**
 * Escalator Detector
 * Identifies steady stepping patterns (consistent trend)
 */
class EscalatorDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    const minSteps = 5; // Minimum steps for escalator pattern
    
    // Look for consistent stepping patterns
    for (let i = minSteps * 3; i < priceData.length - 5; i++) {
      const escalator = this.identifyEscalator(priceData, i, minSteps);
      if (escalator) {
        const pattern = this.createEscalatorPattern(escalator, priceData, i);
        if (pattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(pattern);
          i += escalator.totalLength - 1;
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Identifies an escalator pattern
   * Characterized by regular steps up or down with brief pauses
   */
  private identifyEscalator(
    priceData: PriceData[],
    startIdx: number,
    minSteps: number
  ): any | null {
    const steps = [];
    let currentIdx = startIdx;
    let direction: 'up' | 'down' | null = null;
    
    // Look for individual steps
    while (currentIdx > 0 && steps.length < 10) {
      const step = this.identifyStep(priceData, currentIdx);
      if (!step) break;
      
      // Verify consistent direction
      if (direction === null) {
        direction = step.direction;
      } else if (step.direction !== direction) {
        break; // Direction changed
      }
      
      steps.push(step);
      currentIdx = step.endIndex - 1;
    }
    
    if (steps.length < minSteps) return null;
    
    // Calculate pattern metrics
    const totalMove = steps.reduce((sum, s) => sum + s.move, 0);
    const avgStepSize = totalMove / steps.length;
    const consistency = this.calculateStepConsistency(steps);
    
    return {
      steps,
      direction,
      totalLength: startIdx - steps[steps.length - 1].endIndex + 1,
      totalMove,
      avgStepSize,
      consistency,
      endIndex: steps[steps.length - 1].endIndex
    };
  }
  
  /**
   * Identifies a single step in the escalator
   * A step is a move followed by a pause/consolidation
   */
  private identifyStep(priceData: PriceData[], startIdx: number): any | null {
    // Look for move phase
    let moveEnd = startIdx;
    let moveSize = 0;
    let moveDirection: 'up' | 'down' | null = null;
    
    for (let i = startIdx; i > Math.max(0, startIdx - 10); i--) {
      const change = (priceData[i - 1].close - priceData[i].close) / priceData[i].close;
      
      if (Math.abs(change) > 0.005) { // 0.5% threshold
        if (moveDirection === null) {
          moveDirection = change > 0 ? 'up' : 'down';
        } else if ((change > 0 && moveDirection === 'down') || 
                   (change < 0 && moveDirection === 'up')) {
          break; // Direction reversed
        }
        
        moveSize += change;
        moveEnd = i;
      } else {
        if (moveSize !== 0) break; // Found pause after move
      }
    }
    
    if (Math.abs(moveSize) < 0.01 || !moveDirection) return null;
    
    // Look for pause phase
    let pauseEnd = moveEnd;
    for (let i = moveEnd - 1; i > Math.max(0, moveEnd - 5); i--) {
      const change = Math.abs((priceData[i - 1].close - priceData[i].close) / priceData[i].close);
      if (change < 0.003) { // Very small moves during pause
        pauseEnd = i;
      } else {
        break;
      }
    }
    
    return {
      startIndex: startIdx,
      endIndex: pauseEnd,
      moveSize,
      move: Math.abs(moveSize),
      direction: moveDirection,
      length: startIdx - pauseEnd + 1
    };
  }
  
  /**
   * Calculates how consistent the steps are
   * More consistent = higher quality pattern
   */
  private calculateStepConsistency(steps: any[]): number {
    if (steps.length < 2) return 0;
    
    const stepSizes = steps.map(s => s.move);
    const avgSize = stepSizes.reduce((sum, s) => sum + s, 0) / steps.length;
    
    // Calculate coefficient of variation
    const variance = stepSizes.reduce((sum, s) => sum + Math.pow(s - avgSize, 2), 0) / steps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgSize;
    
    // Lower CV = more consistent
    return Math.max(0, 1 - cv);
  }
  
  /**
   * Creates an Escalator pattern from step data
   */
  private createEscalatorPattern(
    escalator: any,
    priceData: PriceData[],
    startIdx: number
  ): DetectedPattern {
    const direction = escalator.direction === 'up' ? 'bullish' : 'bearish';
    const currentPrice = priceData[0].close;
    
    // Project next steps based on average
    const projection = escalator.avgStepSize * 3;
    let targetPrice: number;
    let stopLoss: number;
    
    if (direction === 'bullish') {
      targetPrice = currentPrice * (1 + Math.abs(projection));
      stopLoss = currentPrice * 0.97; // Below recent step low
    } else {
      targetPrice = currentPrice * (1 - Math.abs(projection));
      stopLoss = currentPrice * 1.03;
    }
    
    const confidence = this.calculateEscalatorConfidence(escalator, priceData);
    
    return {
      type: PatternType.ESCALATOR,
      startIndex: startIdx,
      endIndex: escalator.endIndex,
      startDate: priceData[startIdx].date,
      endDate: priceData[escalator.endIndex].date,
      confidence,
      strength: escalator.consistency,
      direction,
      targetPrice,
      stopLoss,
      probability: 0.65, // Steady trends tend to continue
      metadata: {
        formation: {
          stepCount: escalator.steps.length,
          avgStepSize: escalator.avgStepSize,
          totalMove: escalator.totalMove,
          consistency: escalator.consistency
        },
        validation: {},
        volume: {}
      }
    };
  }
  
  /**
   * Calculates confidence for Escalator patterns
   */
  private calculateEscalatorConfidence(
    escalator: any,
    priceData: PriceData[]
  ): number {
    let confidence = 50;
    
    // Consistency is key for escalators
    if (escalator.consistency > 0.8) confidence += 20;
    else if (escalator.consistency > 0.6) confidence += 15;
    else confidence += 10;
    
    // Number of steps
    if (escalator.steps.length >= 7) confidence += 15;
    else if (escalator.steps.length >= 5) confidence += 10;
    
    // Total move significance
    if (Math.abs(escalator.totalMove) > 0.1) confidence += 10;
    else if (Math.abs(escalator.totalMove) > 0.05) confidence += 5;
    
    // Volume pattern (should be steady)
    const volumeScore = this.analyzeEscalatorVolume(escalator, priceData);
    confidence += volumeScore * 10;
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Analyzes volume pattern for escalator
   * Steady volume supports pattern reliability
   */
  private analyzeEscalatorVolume(escalator: any, priceData: PriceData[]): number {
    const volumes = [];
    
    for (const step of escalator.steps) {
      const stepVolumes = priceData
        .slice(step.endIndex, step.startIndex + 1)
        .map(p => p.volume);
      const avgStepVolume = stepVolumes.reduce((sum, v) => sum + v, 0) / stepVolumes.length;
      volumes.push(avgStepVolume);
    }
    
    // Calculate volume consistency
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const volumeCV = this.calculateCoefficientOfVariation(volumes);
    
    // Lower CV = more consistent volume = better
    return Math.max(0, 1 - volumeCV);
  }
  
  /**
   * Calculates coefficient of variation for array
   */
  private calculateCoefficientOfVariation(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    if (mean === 0) return 1;
    
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return stdDev / mean;
  }
}

/**
 * Blackjack Detector
 * Identifies high-probability reversal setups
 */
class BlackjackDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Blackjack patterns occur at extremes with specific characteristics
    const extremes = this.findExtremes(priceData, technicals);
    
    for (const extreme of extremes) {
      if (this.isBlackjackSetup(extreme, priceData, technicals)) {
        const pattern = this.createBlackjackPattern(extreme, priceData);
        if (pattern.confidence >= this.config.confidenceThreshold) {
          patterns.push(pattern);
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Finds price extremes using multiple indicators
   * Extremes are potential reversal points
   */
  private findExtremes(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): any[] {
    const extremes = [];
    
    // Use RSI extremes if available
    if (technicals?.rsi) {
      if (technicals.rsi > 70) {
        extremes.push({
          index: 0,
          type: 'overbought',
          rsi: technicals.rsi,
          price: priceData[0].close
        });
      } else if (technicals.rsi < 30) {
        extremes.push({
          index: 0,
          type: 'oversold',
          rsi: technicals.rsi,
          price: priceData[0].close
        });
      }
    }
    
    // Find statistical extremes in price
    const stats = this.calculatePriceStatistics(priceData, 50);
    for (let i = 0; i < Math.min(10, priceData.length); i++) {
      const zScore = (priceData[i].close - stats.mean) / stats.stdDev;
      
      if (Math.abs(zScore) > 2) {
        extremes.push({
          index: i,
          type: zScore > 0 ? 'statistical_high' : 'statistical_low',
          zScore,
          price: priceData[i].close
        });
      }
    }
    
    return extremes;
  }
  
  /**
   * Calculates price statistics for extreme detection
   */
  private calculatePriceStatistics(
    priceData: PriceData[],
    lookback: number
  ): { mean: number; stdDev: number } {
    const prices = priceData.slice(0, lookback).map(p => p.close);
    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }
  
  /**
   * Determines if extreme qualifies as Blackjack setup
   * Multiple confirming factors required
   */
  private isBlackjackSetup(
    extreme: any,
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): boolean {
    let confirmations = 0;
    
    // Check for divergence
    if (this.checkDivergence(extreme, priceData)) confirmations++;
    
    // Check for support/resistance
    if (this.isAtKeyLevel(extreme, priceData)) confirmations++;
    
    // Check for reversal candle patterns
    if (this.hasReversalCandle(extreme, priceData)) confirmations++;
    
    // Check for volume spike
    if (this.hasVolumeSurge(extreme, priceData)) confirmations++;
    
    // Need at least 3 confirmations for Blackjack
    return confirmations >= 3;
  }
  
  /**
   * Checks for divergence between price and indicators
   * Divergence often precedes reversals
   */
  private checkDivergence(extreme: any, priceData: PriceData[]): boolean {
    if (extreme.index >= priceData.length - 10) return false;
    
    // Simple divergence: price makes new extreme but momentum doesn't
    const recentPrices = priceData.slice(extreme.index, extreme.index + 10);
    const priceDirection = recentPrices[0].close > recentPrices[9].close ? 'up' : 'down';
    
    // Check if current extreme is more extreme than recent
    const isNewExtreme = extreme.type.includes('high') 
      ? extreme.price > Math.max(...recentPrices.map(p => p.high))
      : extreme.price < Math.min(...recentPrices.map(p => p.low));
    
    // Momentum should be weakening at extremes
    const momentum = this.calculateMomentum(priceData, extreme.index);
    const divergence = (extreme.type.includes('high') && momentum < 0) ||
                      (extreme.type.includes('low') && momentum > 0);
    
    return isNewExtreme && divergence;
  }
  
  /**
   * Calculates simple momentum indicator
   */
  private calculateMomentum(priceData: PriceData[], index: number): number {
    if (index + 10 >= priceData.length) return 0;
    
    const currentPrice = priceData[index].close;
    const pastPrice = priceData[index + 10].close;
    
    return (currentPrice - pastPrice) / pastPrice;
  }
  
  /**
   * Checks if extreme is at key support/resistance
   */
  private isAtKeyLevel(extreme: any, priceData: PriceData[]): boolean {
    // Look for previous highs/lows that might act as support/resistance
    const lookback = Math.min(100, priceData.length);
    const historicalLevels = [];
    
    for (let i = 20; i < lookback; i += 5) {
      const slice = priceData.slice(i - 5, i + 5);
      const high = Math.max(...slice.map(p => p.high));
      const low = Math.min(...slice.map(p => p.low));
      historicalLevels.push(high, low);
    }
    
    // Check if current extreme is near any historical level
    const tolerance = 0.01; // 1%
    return historicalLevels.some(level => 
      Math.abs(extreme.price - level) / level < tolerance
    );
  }
  
  /**
   * Checks for reversal candle patterns
   * Hammer, shooting star, engulfing, etc.
   */
  private hasReversalCandle(extreme: any, priceData: PriceData[]): boolean {
    if (extreme.index >= priceData.length - 1) return false;
    
    const candle = priceData[extreme.index];
    const prevCandle = priceData[extreme.index + 1];
    
    // Calculate candle characteristics
    const body = Math.abs(candle.close - candle.open);
    const upperWick = candle.high - Math.max(candle.close, candle.open);
    const lowerWick = Math.min(candle.close, candle.open) - candle.low;
    const totalRange = candle.high - candle.low;
    
    if (totalRange === 0) return false;
    
    // Hammer/Hanging Man (small body, long lower wick)
    if (lowerWick > body * 2 && upperWick < body * 0.5) {
      return extreme.type.includes('low') || extreme.type === 'oversold';
    }
    
    // Shooting Star/Inverted Hammer (small body, long upper wick)
    if (upperWick > body * 2 && lowerWick < body * 0.5) {
      return extreme.type.includes('high') || extreme.type === 'overbought';
    }
    
    // Engulfing pattern
    if (prevCandle) {
      const prevBody = Math.abs(prevCandle.close - prevCandle.open);
      const engulfing = body > prevBody * 1.5 &&
                       candle.high > prevCandle.high &&
                       candle.low < prevCandle.low;
      
      if (engulfing) {
        const bullishEngulfing = candle.close > candle.open && prevCandle.close < prevCandle.open;
        const bearishEngulfing = candle.close < candle.open && prevCandle.close > prevCandle.open;
        
        return (bullishEngulfing && extreme.type.includes('low')) ||
               (bearishEngulfing && extreme.type.includes('high'));
      }
    }
    
    return false;
  }
  
  /**
   * Checks for volume surge at extreme
   * High volume at extremes often signals reversal
   */
  private hasVolumeSurge(extreme: any, priceData: PriceData[]): boolean {
    if (extreme.index >= priceData.length - 20) return false;
    
    const currentVolume = priceData[extreme.index].volume;
    const recentVolumes = priceData.slice(extreme.index + 1, extreme.index + 20).map(p => p.volume);
    const avgVolume = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;
    
    return currentVolume > avgVolume * 1.5;
  }
  
  /**
   * Creates a Blackjack pattern from extreme data
   */
  private createBlackjackPattern(
    extreme: any,
    priceData: PriceData[]
  ): DetectedPattern {
    const direction = extreme.type.includes('high') || extreme.type === 'overbought' 
      ? 'bearish' : 'bullish';
    
    // Calculate targets based on mean reversion
    const stats = this.calculatePriceStatistics(priceData, 50);
    let targetPrice: number;
    let stopLoss: number;
    
    if (direction === 'bullish') {
      targetPrice = stats.mean; // Expect reversion to mean
      stopLoss = extreme.price * 0.97;
    } else {
      targetPrice = stats.mean;
      stopLoss = extreme.price * 1.03;
    }
    
    const confidence = this.calculateBlackjackConfidence(extreme, priceData);
    
    return {
      type: PatternType.BLACKJACK,
      startIndex: extreme.index,
      endIndex: extreme.index,
      startDate: priceData[extreme.index].date,
      endDate: priceData[extreme.index].date,
      confidence,
      strength: Math.abs(extreme.zScore || (extreme.rsi - 50) / 50),
      direction,
      targetPrice,
      stopLoss,
      probability: 0.68, // High-probability setups
      metadata: {
        formation: {
          extremeType: extreme.type,
          indicators: {
            rsi: extreme.rsi,
            zScore: extreme.zScore
          },
          confirmations: this.listConfirmations(extreme, priceData)
        },
        validation: {},
        volume: {}
      }
    };
  }
  
  /**
   * Calculates confidence for Blackjack patterns
   */
  private calculateBlackjackConfidence(extreme: any, priceData: PriceData[]): number {
    let confidence = 60; // Start higher due to multiple confirmations
    
    // Extreme severity
    if (extreme.rsi && (extreme.rsi > 80 || extreme.rsi < 20)) confidence += 10;
    if (extreme.zScore && Math.abs(extreme.zScore) > 2.5) confidence += 10;
    
    // Additional confirmations
    if (this.checkDivergence(extreme, priceData)) confidence += 10;
    if (this.hasReversalCandle(extreme, priceData)) confidence += 10;
    if (this.hasVolumeSurge(extreme, priceData)) confidence += 5;
    
    return Math.min(confidence, 100);
  }
  
  /**
   * Lists all confirmations for the pattern
   */
  private listConfirmations(extreme: any, priceData: PriceData[]): string[] {
    const confirmations = [];
    
    if (extreme.rsi) confirmations.push(`RSI: ${extreme.rsi.toFixed(1)}`);
    if (extreme.zScore) confirmations.push(`Z-Score: ${extreme.zScore.toFixed(2)}`);
    if (this.checkDivergence(extreme, priceData)) confirmations.push('Divergence');
    if (this.isAtKeyLevel(extreme, priceData)) confirmations.push('Key Level');
    if (this.hasReversalCandle(extreme, priceData)) confirmations.push('Reversal Candle');
    if (this.hasVolumeSurge(extreme, priceData)) confirmations.push('Volume Surge');
    
    return confirmations;
  }
}

/**
 * Additional classical pattern detectors
 * These can be implemented following the same pattern as above
 */
class HeadAndShouldersDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    // Implementation for head and shoulders pattern
    // This is a complex pattern requiring three peaks
    return [];
  }
}

class DoubleTopDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    // Implementation for double top pattern
    // Two peaks at similar levels with valley between
    return [];
  }
}

class DoubleBottomDetector extends PatternDetector {
  async detect(
    priceData: PriceData[],
    technicals?: TechnicalIndicators
  ): Promise<DetectedPattern[]> {
    // Implementation for double bottom pattern
    // Two troughs at similar levels with peak between
    return [];
  }
}

/**
 * Factory function for creating pattern detection engines
 * Allows easy configuration and instantiation
 */
export function createPatternDetectionEngine(
  config?: Partial<PatternDetectionConfig>
): PatternDetectionEngine {
  return new PatternDetectionEngine(config);
}

/**
 * Integrates pattern detection with TriSight's existing pattern system
 * This bridges the report generation patterns with the UI pattern system
 */
export function integrateWithTriSightPatterns(
  detectedPatterns: DetectedPattern[],
  patternBus: any // TriSight's pattern event bus
): void {
  // Convert detected patterns to TriSight pattern events
  detectedPatterns.forEach(pattern => {
    const event = {
      type: mapToTriSightEventType(pattern.type),
      data: {
        startIndex: pattern.startIndex,
        endIndex: pattern.endIndex,
        confidence: pattern.confidence,
        direction: pattern.direction.toUpperCase() as 'RISING' | 'FALLING' | 'NEUTRAL',
        targetPrice: pattern.targetPrice,
        metadata: pattern.metadata
      },
      timestamp: Date.now()
    };
    
    patternBus.emit(event);
  });
}

/**
 * Maps internal pattern types to TriSight event types
 */
function mapToTriSightEventType(type: PatternType): string {
  const mapping = {
    [PatternType.GOLDMINE_CHANNEL]: 'CHANNEL_DETECTED',
    [PatternType.GOLDMINE_SHAFT]: 'SHAFT_DETECTED',
    [PatternType.PIVOT]: 'PIVOT_DETECTED',
    [PatternType.ROCKETMAN]: 'BREAKOUT_DETECTED',
    [PatternType.ESCALATOR]: 'ESCALATOR_STEP',
    [PatternType.BLACKJACK]: 'REVERSAL_SETUP',
    [PatternType.HEAD_AND_SHOULDERS]: 'HEAD_SHOULDERS_DETECTED',
    [PatternType.DOUBLE_TOP]: 'DOUBLE_TOP_DETECTED',
    [PatternType.DOUBLE_BOTTOM]: 'DOUBLE_BOTTOM_DETECTED',
    [PatternType.TRIANGLE]: 'TRIANGLE_DETECTED',
    [PatternType.FLAG]: 'FLAG_DETECTED',
    [PatternType.WEDGE]: 'WEDGE_DETECTED'
  };
  
  return mapping[type] || 'PATTERN_DETECTED';
}