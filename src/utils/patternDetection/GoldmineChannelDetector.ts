// src/utils/patternDetection/GoldmineChannelDetector.ts
// Detector for GoldmineChannel pattern
// Identifies occurrences in price data
import { CandlestickData } from '../../models/ChartTypes';
import { GoldmineChannelPattern, PatternType, ChannelDirection } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Goldmine Channel patterns
 * These are characterized by parallel lines connecting highs and lows
 */
class GoldmineChannelDetector {
  private readonly MIN_CHANNEL_LENGTH = 5; // Minimum candles to form a channel
  private readonly MIN_TOUCH_POINTS = 3; // Minimum number of price touches to channel boundaries
  private readonly DIRECTION_THRESHOLD = 0.05; // % slope to determine direction
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence to report a pattern
  
  /**
   * Detect Goldmine Channel patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): GoldmineChannelPattern[] {
    if (data.length < this.MIN_CHANNEL_LENGTH) {
      return []; // Not enough data
    }
    
    const patterns: GoldmineChannelPattern[] = [];
    
    // Check for channels at different window sizes
    for (let windowSize = this.MIN_CHANNEL_LENGTH; windowSize <= Math.min(30, data.length); windowSize += 2) {
      // Slide the window through the data
      for (let i = 0; i <= data.length - windowSize; i++) {
        const windowData = data.slice(i, i + windowSize);
        const pattern = this.detectInWindow(windowData, i);
        
        if (pattern) {
          // Check for overlapping patterns and only keep the highest confidence one
          const isOverlapping = patterns.some(existingPattern => 
            this.patternsOverlap(existingPattern, pattern) && 
            existingPattern.confidence >= pattern.confidence
          );
          
          if (!isOverlapping) {
            // Remove any lower confidence overlapping patterns
            const nonOverlappingPatterns = patterns.filter(existingPattern => 
              !this.patternsOverlap(existingPattern, pattern) || 
              existingPattern.confidence > pattern.confidence
            );
            
            patterns.length = 0;
            patterns.push(...nonOverlappingPatterns, pattern);
          }
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Check if two patterns overlap significantly
   */
  private patternsOverlap(pattern1: GoldmineChannelPattern, pattern2: GoldmineChannelPattern): boolean {
    const start1 = pattern1.startTime.getTime();
    const end1 = pattern1.endTime.getTime();
    const start2 = pattern2.startTime.getTime();
    const end2 = pattern2.endTime.getTime();
    
    const duration1 = end1 - start1;
    const duration2 = end2 - start2;
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Calculate overlap percentage relative to the shorter pattern
    const minDuration = Math.min(duration1, duration2);
    const overlapPercentage = overlapDuration / minDuration;
    
    // Consider patterns overlapping if they overlap by more than 50%
    return overlapPercentage > 0.5;
  }
  
  /**
   * Detect a Goldmine Channel pattern in a specific window of data
   */
  private detectInWindow(
    windowData: CandlestickData[], 
    startIndex: number
  ): GoldmineChannelPattern | null {
    // Find upper and lower boundaries of the channel
    const { upperBoundary, lowerBoundary, direction, touchPoints, confidence } = this.calculateChannelBoundaries(windowData);
    
    if (confidence < this.MIN_CONFIDENCE) {
      return null;
    }
    
    const startTime = new Date(windowData[0].timestamp);
    const endTime = new Date(windowData[windowData.length - 1].timestamp);
    
    // Determine high and low prices within the pattern
    const highPrice = Math.max(...windowData.map(d => d.high));
    const lowPrice = Math.min(...windowData.map(d => d.low));
    
    // Construct the GoldmineChannelPattern
    const pattern: GoldmineChannelPattern = {
      id: uuidv4(),
      type: PatternType.GOLDMINE_CHANNEL,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      direction,
      upperBoundary,
      lowerBoundary,
      touchPoints,
      hasReceivedFeedback: false
    };
    
    return pattern;
  }
  
  /**
   * Calculate the upper and lower boundaries of the channel
   */
  private calculateChannelBoundaries(windowData: CandlestickData[]): {
    upperBoundary: number;
    lowerBoundary: number;
    direction: ChannelDirection;
    touchPoints: Array<{ time: Date; price: number; isUpper: boolean }>;
    confidence: number;
  } {
    // Find local highs and lows
    const highs: { index: number; price: number }[] = [];
    const lows: { index: number; price: number }[] = [];
    
    // Identify potential touch points (local maxima and minima)
    for (let i = 1; i < windowData.length - 1; i++) {
      const prev = windowData[i - 1];
      const curr = windowData[i];
      const next = windowData[i + 1];
      
      // Local high
      if (curr.high > prev.high && curr.high > next.high) {
        highs.push({ index: i, price: curr.high });
      }
      
      // Local low
      if (curr.low < prev.low && curr.low < next.low) {
        lows.push({ index: i, price: curr.low });
      }
    }
    
    // Add first and last points if they're extremes
    if (windowData[0].high > windowData[1].high) {
      highs.push({ index: 0, price: windowData[0].high });
    }
    
    if (windowData[0].low < windowData[1].low) {
      lows.push({ index: 0, price: windowData[0].low });
    }
    
    const lastIndex = windowData.length - 1;
    if (windowData[lastIndex].high > windowData[lastIndex - 1].high) {
      highs.push({ index: lastIndex, price: windowData[lastIndex].high });
    }
    
    if (windowData[lastIndex].low < windowData[lastIndex - 1].low) {
      lows.push({ index: lastIndex, price: windowData[lastIndex].low });
    }
    
    // Need at least 2 highs and 2 lows to form a channel
    if (highs.length < 2 || lows.length < 2) {
      return {
        upperBoundary: 0,
        lowerBoundary: 0,
        direction: ChannelDirection.HORIZONTAL,
        touchPoints: [],
        confidence: 0
      };
    }
    
    // Calculate linear regression for highs and lows to determine channel boundaries
    const highsRegression = this.linearRegression(
      highs.map(h => ({ x: h.index, y: h.price }))
    );
    
    const lowsRegression = this.linearRegression(
      lows.map(l => ({ x: l.index, y: l.price }))
    );
    
    // Check if slopes are roughly parallel (within tolerance)
    const slopeDifference = Math.abs(highsRegression.slope - lowsRegression.slope);
    const averageSlope = (highsRegression.slope + lowsRegression.slope) / 2;
    
    // If slopes differ too much, not a valid channel
    if (slopeDifference > Math.abs(averageSlope * 0.2)) {
      return {
        upperBoundary: 0,
        lowerBoundary: 0,
        direction: ChannelDirection.HORIZONTAL,
        touchPoints: [],
        confidence: 0
      };
    }
    
    // Use the average slope to define the channel direction
    let direction: ChannelDirection;
    if (Math.abs(averageSlope) < this.DIRECTION_THRESHOLD) {
      direction = ChannelDirection.HORIZONTAL;
    } else if (averageSlope > 0) {
      direction = ChannelDirection.ASCENDING;
    } else {
      direction = ChannelDirection.DESCENDING;
    }
    
    // Calculate channel boundaries at the end of the window
    const upperBoundary = highsRegression.slope * (windowData.length - 1) + highsRegression.intercept;
    const lowerBoundary = lowsRegression.slope * (windowData.length - 1) + lowsRegression.intercept;
    
    // Collect touch points for visualization
    const touchPoints: Array<{ time: Date; price: number; isUpper: boolean }> = [
      ...highs.map(h => ({
        time: new Date(windowData[h.index].timestamp),
        price: h.price,
        isUpper: true
      })),
      ...lows.map(l => ({
        time: new Date(windowData[l.index].timestamp),
        price: l.price,
        isUpper: false
      }))
    ];
    
    // Calculate confidence based on:
    // 1. Number of touch points relative to window size
    // 2. How well the points fit the regression lines
    // 3. Channel width relative to price range
    
    const touchPointRatio = (highs.length + lows.length) / windowData.length;
    const highsRSquared = highsRegression.r2;
    const lowsRSquared = lowsRegression.r2;
    
    const priceRange = Math.max(...windowData.map(d => d.high)) - Math.min(...windowData.map(d => d.low));
    const channelWidth = upperBoundary - lowerBoundary;
    const channelWidthRatio = channelWidth / priceRange;
    
    // Combine factors for overall confidence
    let confidence = (
      touchPointRatio * 0.3 +
      ((highsRSquared + lowsRSquared) / 2) * 0.4 +
      (1 - Math.abs(channelWidthRatio - 0.5)) * 0.3
    );
    
    // Adjust confidence based on number of touch points
    if (touchPoints.length < this.MIN_TOUCH_POINTS) {
      confidence *= 0.5;
    }
    
    return {
      upperBoundary,
      lowerBoundary,
      direction,
      touchPoints,
      confidence
    };
  }
  
  /**
   * Simple linear regression calculation
   */
  private linearRegression(data: Array<{ x: number; y: number }>): {
    slope: number;
    intercept: number;
    r2: number; // R-squared (coefficient of determination)
  } {
    const n = data.length;
    if (n < 2) return { slope: 0, intercept: 0, r2: 0 };
    
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;
    let sumYY = 0;
    
    for (const point of data) {
      sumX += point.x;
      sumY += point.y;
      sumXY += point.x * point.y;
      sumXX += point.x * point.x;
      sumYY += point.y * point.y;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    let totalVariation = 0;
    let explainedVariation = 0;
    
    for (const point of data) {
      const predicted = slope * point.x + intercept;
      totalVariation += Math.pow(point.y - yMean, 2);
      explainedVariation += Math.pow(predicted - yMean, 2);
    }
    
    const r2 = explainedVariation / totalVariation;
    
    return { slope, intercept, r2 };
  }
}

export default GoldmineChannelDetector;
