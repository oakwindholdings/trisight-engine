// src/utils/patternDetection/helper/PivotDetectionUtils.ts
// Helper utilities for Pivot detection
// Shared by detectors
import { CandlestickData } from '../../../models/ChartTypes';
import { PivotType } from '../../../models/PatternTypes';

/**
 * Utility class for Pivot pattern detection
 * Contains helper methods for calculating scores, touch strengths,
 * and pattern metrics for Pivot patterns
 */
class PivotDetectionUtils {
  /**
   * Calculate the price range of the dataset
   */
  static calculatePriceRange(data: CandlestickData[]): number {
    const highPrices = data.map(d => d.high);
    const lowPrices = data.map(d => d.low);
    
    const highestPrice = Math.max(...highPrices);
    const lowestPrice = Math.min(...lowPrices);
    
    return highestPrice - lowestPrice;
  }
  
  /**
   * Find all touches of a specific price level
   */
  static findPriceTouches(
    data: CandlestickData[], 
    pivotPrice: number, 
    tolerance: number,
    pivotType: PivotType,
    minimumTouchGap: number
  ): Array<{ time: Date; price: number; index: number }> {
    const touches: Array<{ time: Date; price: number; index: number }> = [];
    
    for (let i = 0; i < data.length; i++) {
      const candle = data[i];
      let touchPrice: number;
      
      if (pivotType === PivotType.SUPPORT) {
        // For support, check if price got close to the support level
        if (Math.abs(candle.low - pivotPrice) <= tolerance) {
          touchPrice = candle.low;
        } else {
          continue;
        }
      } else {
        // For resistance, check if price got close to the resistance level
        if (Math.abs(candle.high - pivotPrice) <= tolerance) {
          touchPrice = candle.high;
        } else {
          continue;
        }
      }
      
      // Check if we have a valid touch
      touches.push({
        time: new Date(candle.timestamp),
        price: touchPrice,
        index: i
      });
    }
    
    // Optimize touches by removing those too close together
    return this.optimizeTouches(touches, minimumTouchGap);
  }
  
  /**
   * Optimize touches by removing those that are too close together in time
   */
  static optimizeTouches(
    touches: Array<{ time: Date; price: number; index: number }>,
    minimumTouchGap: number
  ): Array<{ time: Date; price: number; index: number }> {
    if (touches.length <= 1) return touches;
    
    // Sort by index (time)
    touches.sort((a, b) => a.index - b.index);
    
    const optimized: Array<{ time: Date; price: number; index: number }> = [touches[0]];
    
    for (let i = 1; i < touches.length; i++) {
      const prevTouch = optimized[optimized.length - 1];
      
      // Only add touches that are separated by at least MIN_TOUCHES_APART
      if (touches[i].index - prevTouch.index >= minimumTouchGap) {
        optimized.push(touches[i]);
      }
    }
    
    return optimized;
  }
  
  /**
   * Calculate the strength of touches based on price reactions
   */
  static calculateTouchStrength(
    data: CandlestickData[],
    touches: Array<{ time: Date; price: number; index: number }>,
    pivotType: PivotType,
    priceRange: number
  ): number {
    if (touches.length === 0) return 0;
    
    let totalStrength = 0;
    
    for (const touch of touches) {
      const touchIndex = touch.index;
      
      // Check for valid indices to look ahead
      if (touchIndex + 1 >= data.length) continue;
      
      // Look at the next few candles after the touch
      const lookAhead = Math.min(5, data.length - touchIndex - 1);
      let maxReaction = 0;
      
      for (let i = 1; i <= lookAhead; i++) {
        const candleAfter = data[touchIndex + i];
        
        if (pivotType === PivotType.SUPPORT) {
          // For support, look for price bounce up
          const bounce = (candleAfter.high - touch.price) / touch.price * 100;
          maxReaction = Math.max(maxReaction, bounce);
        } else {
          // For resistance, look for price bounce down
          const bounce = (touch.price - candleAfter.low) / touch.price * 100;
          maxReaction = Math.max(maxReaction, bounce);
        }
      }
      
      // Normalize the reaction relative to overall price range
      const normalizedReaction = Math.min(maxReaction / (priceRange / touch.price * 100) * 10, 1);
      totalStrength += normalizedReaction;
    }
    
    return totalStrength / touches.length;
  }
  
  /**
   * Calculate how evenly distributed the touches are over time
   */
  static calculateTemporalDistribution(
    touches: Array<{ time: Date; price: number; index: number }>
  ): number {
    if (touches.length <= 1) return 0;
    
    // Calculate the time span and expected gaps
    const timeSpan = touches[touches.length - 1].index - touches[0].index;
    const expectedGap = timeSpan / (touches.length - 1);
    
    let distributionScore = 0;
    for (let i = 1; i < touches.length; i++) {
      const actualGap = touches[i].index - touches[i-1].index;
      const gapRatio = Math.min(actualGap / expectedGap, 2); // Cap at 2x expected
      distributionScore += (1 - Math.abs(1 - gapRatio)) / (touches.length - 1);
    }
    
    return distributionScore;
  }
  
  /**
   * Calculate how consistent the price touches are
   */
  static calculatePriceConsistency(
    touches: Array<{ time: Date; price: number; index: number }>,
    pivotLevel: number
  ): number {
    if (touches.length === 0) return 0;
    
    // Calculate deviation from the pivot level
    const deviations = touches.map(t => 
      Math.abs(t.price - pivotLevel) / pivotLevel
    );
    
    // Calculate the mean deviation as a percentage
    const meanDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    
    // Convert to a score (0-1), where lower deviation means higher consistency
    // Anything below 0.5% deviation is considered very consistent
    const consistencyScore = 1 - Math.min(meanDeviation * 200, 1);
    
    return consistencyScore;
  }
  
  /**
   * Calculate volume reactions at touch points
   */
  static calculateVolumeReactions(
    data: CandlestickData[],
    touches: Array<{ time: Date; price: number; index: number }>,
    volumeThreshold: number
  ): number[] {
    const volumeReactions: number[] = [];
    
    for (const touch of touches) {
      const touchIndex = touch.index;
      
      // Check for valid indices
      if (touchIndex < 5 || touchIndex + 3 >= data.length) {
        volumeReactions.push(0);
        continue;
      }
      
      // Calculate average volume before the touch
      const preVolumes = data.slice(touchIndex - 5, touchIndex).map(d => d.volume);
      const avgPreVolume = preVolumes.reduce((sum, vol) => sum + vol, 0) / preVolumes.length;
      
      // Calculate average volume after the touch
      const postVolumes = data.slice(touchIndex, touchIndex + 3).map(d => d.volume);
      const avgPostVolume = postVolumes.reduce((sum, vol) => sum + vol, 0) / postVolumes.length;
      
      // Calculate volume reaction ratio
      const volumeRatio = avgPreVolume > 0 ? avgPostVolume / avgPreVolume : 0;
      
      // Score based on volume increase
      const volumeReaction = volumeRatio >= volumeThreshold ? 
        Math.min((volumeRatio - 1) / (volumeThreshold - 1), 1) : 0;
      
      volumeReactions.push(volumeReaction);
    }
    
    return volumeReactions;
  }
  
  /**
   * Calculate price reactions at touch points
   */
  static calculatePriceReactions(
    data: CandlestickData[],
    touches: Array<{ time: Date; price: number; index: number }>,
    pivotType: PivotType
  ): number[] {
    const priceReactions: number[] = [];
    
    for (const touch of touches) {
      const touchIndex = touch.index;
      
      // Check for valid indices
      if (touchIndex + 3 >= data.length) {
        priceReactions.push(0);
        continue;
      }
      
      // Look at candles after the touch to calculate the price reaction
      let maxReaction = 0;
      const touchPrice = touch.price;
      
      for (let i = 1; i <= 3; i++) {
        const candleAfter = data[touchIndex + i];
        
        if (pivotType === PivotType.SUPPORT) {
          // For support, measure bounce upward
          const reaction = (candleAfter.high - touchPrice) / touchPrice * 100;
          maxReaction = Math.max(maxReaction, reaction);
        } else {
          // For resistance, measure drop downward
          const reaction = (touchPrice - candleAfter.low) / touchPrice * 100;
          maxReaction = Math.max(maxReaction, reaction);
        }
      }
      
      priceReactions.push(maxReaction);
    }
    
    return priceReactions;
  }
}

export default PivotDetectionUtils;
