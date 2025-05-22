// src/utils/patternDetection/GoldmineShaftDetector.ts
// Detector for GoldmineShaft pattern
// Identifies occurrences in price data
import { CandlestickData } from '../../models/ChartTypes';
import { GoldmineShaftPattern, PatternType, ThrustDirection } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Goldmine Shaft patterns
 * These are characterized by strong directional price moves followed by measured retracements
 * 
 * A Goldmine Shaft consists of:
 * 1. An initial strong thrust move in either direction (bullish or bearish)
 * 2. A retracement of that move of a certain percentage
 * 3. Potential continuation in the original direction
 */
class GoldmineShaftDetector {
  private readonly MIN_THRUST_LENGTH = 3; // Minimum candles for thrust phase
  private readonly MIN_RETRACEMENT_LENGTH = 2; // Minimum candles for retracement
  private readonly MIN_THRUST_PERCENT = 2.0; // Minimum % change to consider as thrust
  private readonly VALID_RETRACEMENT_MIN = 30.0; // Min retracement % (of thrust)
  private readonly VALID_RETRACEMENT_MAX = 70.0; // Max retracement % (of thrust)
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  
  /**
   * Detect Goldmine Shaft patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): GoldmineShaftPattern[] {
    if (data.length < this.MIN_THRUST_LENGTH + this.MIN_RETRACEMENT_LENGTH) {
      return []; // Not enough data
    }
    
    const patterns: GoldmineShaftPattern[] = [];
    
    // Process the data in windows of varying sizes
    for (let thrustLength = this.MIN_THRUST_LENGTH; thrustLength <= Math.min(15, data.length - this.MIN_RETRACEMENT_LENGTH); thrustLength++) {
      for (let i = 0; i <= data.length - (thrustLength + this.MIN_RETRACEMENT_LENGTH); i++) {
        // Extract thrust window
        const thrustWindow = data.slice(i, i + thrustLength);
        
        // Check both bullish and bearish patterns
        const bullishPattern = this.detectThrust(data, i, thrustLength, ThrustDirection.BULLISH);
        if (bullishPattern) patterns.push(bullishPattern);
        
        const bearishPattern = this.detectThrust(data, i, thrustLength, ThrustDirection.BEARISH);
        if (bearishPattern) patterns.push(bearishPattern);
      }
    }
    
    // Filter out overlapping patterns
    return this.filterOverlappingPatterns(patterns);
  }
  
  /**
   * Filter out overlapping patterns, keeping only the higher confidence ones
   */
  private filterOverlappingPatterns(patterns: GoldmineShaftPattern[]): GoldmineShaftPattern[] {
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
  private patternsOverlap(pattern1: GoldmineShaftPattern, pattern2: GoldmineShaftPattern): boolean {
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
   * Detect a thrust pattern of specified direction in the data
   */
  private detectThrust(
    data: CandlestickData[], 
    startIndex: number,
    thrustLength: number,
    direction: ThrustDirection
  ): GoldmineShaftPattern | null {
    // Extract the thrust window
    const thrustWindow = data.slice(startIndex, startIndex + thrustLength);
    
    // Calculate thrust characteristics
    const thrustStartPrice = thrustWindow[0].close;
    const thrustEndPrice = thrustWindow[thrustWindow.length - 1].close;
    const thrustChange = ((thrustEndPrice - thrustStartPrice) / thrustStartPrice) * 100;
    
    // For bullish patterns, we need a positive thrust change; for bearish, negative
    if ((direction === ThrustDirection.BULLISH && thrustChange <= this.MIN_THRUST_PERCENT) || 
        (direction === ThrustDirection.BEARISH && thrustChange >= -this.MIN_THRUST_PERCENT)) {
      return null; // Not a valid thrust
    }
    
    // Look for retracement following the thrust
    const maxRetracementLength = Math.min(thrustLength * 2, data.length - (startIndex + thrustLength));
    if (maxRetracementLength < this.MIN_RETRACEMENT_LENGTH) {
      return null; // Not enough data for retracement
    }
    
    // Find the best retracement
    let bestRetracementLength = 0;
    let bestRetracementPercentage = 0;
    let bestConfidence = 0;
    
    for (let retracementLength = this.MIN_RETRACEMENT_LENGTH; retracementLength <= maxRetracementLength; retracementLength++) {
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
      if (retracementPercentage >= this.VALID_RETRACEMENT_MIN && 
          retracementPercentage <= this.VALID_RETRACEMENT_MAX) {
        
        // Calculate confidence based on clean retracement (less volatility = higher confidence)
        const retracementWindow = data.slice(startIndex + thrustLength, retracementEnd);
        const retracementVolatility = this.calculateVolatility(retracementWindow);
        
        // Calculate confidence factors
        const strengthFactor = Math.min(Math.abs(thrustChange) / 10, 1); // Normalize strength to max 1
        const retracementFactor = 1 - (Math.abs(retracementPercentage - 50) / 50); // Best at 50% retracement
        const volatilityFactor = 1 - Math.min(retracementVolatility / 3, 1); // Lower volatility is better
        
        // Combined confidence
        const confidence = (
          strengthFactor * 0.4 + 
          retracementFactor * 0.4 + 
          volatilityFactor * 0.2
        );
        
        if (confidence > bestConfidence) {
          bestRetracementLength = retracementLength;
          bestRetracementPercentage = retracementPercentage;
          bestConfidence = confidence;
        }
      }
    }
    
    // If we didn't find a valid retracement
    if (bestRetracementLength === 0 || bestConfidence < this.MIN_CONFIDENCE) {
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
}

export default GoldmineShaftDetector;
