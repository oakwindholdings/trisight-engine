import { CandlestickData } from '../../models/ChartTypes';
import { RocketmanPattern, PatternType, ThrustDirection, RocketmanSignalStrength } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Rocketman patterns
 * These are characterized by rapid acceleration in price with increasing momentum
 * Similar to a parabolic move or blow-off top/bottom
 */
export class RocketmanDetector {
  private readonly MIN_CANDLES = 5; // Minimum candles to form a rocketman pattern
  private readonly MIN_PRICE_CHANGE = 3.0; // Minimum price change percentage
  private readonly MIN_ACCELERATION = 1.5; // Minimum acceleration factor
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  
  /**
   * Detect Rocketman patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): RocketmanPattern[] {
    if (data.length < this.MIN_CANDLES) {
      return []; // Not enough data
    }
    
    const patterns: RocketmanPattern[] = [];
    
    // Check for rocketman patterns at different window sizes
    for (let windowSize = this.MIN_CANDLES; windowSize <= Math.min(20, data.length); windowSize++) {
      // Slide the window through the data
      for (let i = 0; i <= data.length - windowSize; i++) {
        const windowData = data.slice(i, i + windowSize);
        const pattern = this.detectInWindow(windowData, i);
        
        if (pattern) {
          // Add pattern if it's valid
          patterns.push(pattern);
        }
      }
    }
    
    // Filter out overlapping patterns, keeping the ones with highest confidence
    return this.filterOverlappingPatterns(patterns);
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
   * Detect a Rocketman pattern in a specific window of data
   */
  private detectInWindow(
    windowData: CandlestickData[], 
    startIndex: number
  ): RocketmanPattern | null {
    // Calculate price changes for each candle
    const priceChanges = this.calculatePriceChanges(windowData);
    
    // Check for acceleration pattern
    const { hasAcceleration, accelerationRate, peakIndex } = this.checkAcceleration(priceChanges);
    
    if (!hasAcceleration) {
      return null;
    }
    
    // Calculate total price change in the window
    const startPrice = windowData[0].close;
    const endPrice = windowData[windowData.length - 1].close;
    const totalPriceChange = Math.abs((endPrice - startPrice) / startPrice) * 100;
    
    if (totalPriceChange < this.MIN_PRICE_CHANGE) {
      return null;
    }
    
    // Calculate peak details
    const peakCandle = windowData[peakIndex];
    const peakTime = new Date(peakCandle.timestamp);
    const peakPrice = priceChanges[peakIndex] > 0 ? peakCandle.high : peakCandle.low;
    
    // Calculate intensity based on acceleration and price change
    const accelerationFactor = Math.min(accelerationRate / 3, 1); // Normalize
    const priceChangeFactor = Math.min(totalPriceChange / 15, 1); // Normalize (max at 15%)
    const intensity = (accelerationFactor * 0.6) + (priceChangeFactor * 0.4);
    
    // Calculate confidence based on:
    // 1. Acceleration rate and consistency
    // 2. Total price change
    // 3. Volume confirmation
    const volumeConfirmation = this.checkVolumeConfirmation(windowData, priceChanges);
    
    const confidence = (
      accelerationFactor * 0.5 +
      priceChangeFactor * 0.3 +
      volumeConfirmation * 0.2
    );
    
    if (confidence < this.MIN_CONFIDENCE) {
      return null;
    }
    
    // Determine high and low prices within the pattern
    const highPrice = Math.max(...windowData.map(d => d.high));
    const lowPrice = Math.min(...windowData.map(d => d.low));
    
    // Calculate direction based on price movement
    const isPriceIncreasing = windowData[peakIndex].close > windowData[0].close;
    const direction = isPriceIncreasing ? ThrustDirection.BULLISH : ThrustDirection.BEARISH;
    
    // Create additional properties required by the RocketmanPattern interface
    const volumeChanges = windowData.slice(1).map((candle, i) => 
      (candle.volume - windowData[i].volume) / Math.max(1, windowData[i].volume)
    );
    
    // Calculate momentum score
    const momentumScore = accelerationRate * intensity;
    
    // Determine signal strength based on confidence and momentum
    const signalStrength = confidence > 0.8 ? RocketmanSignalStrength.VERY_STRONG : 
                         confidence > 0.7 ? RocketmanSignalStrength.STRONG : 
                         confidence > 0.6 ? RocketmanSignalStrength.MODERATE : RocketmanSignalStrength.WEAK;
                         
    // Create the pattern with all required properties
    const pattern: RocketmanPattern = {
      id: uuidv4(),
      type: PatternType.ROCKETMAN,
      startTime: new Date(windowData[0].timestamp),
      endTime: new Date(windowData[windowData.length - 1].timestamp),
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      accelerationRate,
      peakTime,
      peakPrice,
      intensity,
      direction,
      priceChanges,
      volumeChanges,
      momentumScore,
      volumeConfirmation,
      signalStrength,
      adaptiveThreshold: this.MIN_ACCELERATION,
      relatedPatternIds: []
    };
    
    return pattern;
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
   * Check for price acceleration pattern
   */
  private checkAcceleration(priceChanges: number[]): { 
    hasAcceleration: boolean; 
    accelerationRate: number;
    peakIndex: number; 
  } {
    if (priceChanges.length < 4) {
      return { hasAcceleration: false, accelerationRate: 0, peakIndex: 0 };
    }
    
    // Convert to absolute values to detect both upward and downward acceleration
    const absChanges = priceChanges.map(Math.abs);
    
    // Find segments with increasing change (acceleration)
    let maxAccelerationRate = 0;
    let maxAccelerationLength = 0;
    let peakIndex = 0;
    
    for (let i = 2; i < absChanges.length; i++) {
      let segmentLength = 1;
      let accelerating = true;
      
      // Check if we have at least 3 consecutive increasing changes
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
    
    // Consider it a valid acceleration if the rate is sufficient
    const hasAcceleration = maxAccelerationRate >= this.MIN_ACCELERATION && maxAccelerationLength >= 2;
    
    return { 
      hasAcceleration, 
      accelerationRate: maxAccelerationRate,
      peakIndex
    };
  }
  
  /**
   * Check for volume confirmation of the price move
   * (Increasing volume with increasing price is a stronger pattern)
   */
  private checkVolumeConfirmation(data: CandlestickData[], priceChanges: number[]): number {
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
}
