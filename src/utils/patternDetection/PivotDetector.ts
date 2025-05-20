import { CandlestickData } from '../../models/ChartTypes';
import { PivotPattern, PatternType, PivotType } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Pivot patterns
 * These are characterized by significant support or resistance levels
 * where price tends to reverse or bounce multiple times
 */
class PivotDetector {
  private readonly MIN_TOUCH_POINTS = 3; // Minimum number of touches to confirm a pivot
  private readonly PRICE_TOLERANCE = 0.3; // Percentage tolerance for price level (as % of range)
  private readonly MAX_PIVOT_RANGE = 5.0; // Maximum range of pivot zone (%)
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  
  /**
   * Detect Pivot patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): PivotPattern[] {
    if (data.length < this.MIN_TOUCH_POINTS * 2) {
      return []; // Not enough data
    }
    
    const patterns: PivotPattern[] = [];
    
    // Detect support and resistance pivot levels
    const supportLevels = this.detectPivotLevels(data, PivotType.SUPPORT);
    const resistanceLevels = this.detectPivotLevels(data, PivotType.RESISTANCE);
    
    // Combine all pivot patterns
    patterns.push(...supportLevels, ...resistanceLevels);
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    // Filter out overlapping or redundant pivots (keep strongest ones)
    return this.filterRedundantPivots(patterns);
  }
  
  /**
   * Detect pivot levels of a specific type (support or resistance)
   */
  private detectPivotLevels(data: CandlestickData[], pivotType: PivotType): PivotPattern[] {
    const pivots: PivotPattern[] = [];
    const priceRange = this.calculatePriceRange(data);
    const priceTolerance = priceRange * (this.PRICE_TOLERANCE / 100);
    
    // For support, we look at low prices; for resistance, high prices
    const prices = data.map(d => pivotType === PivotType.SUPPORT ? d.low : d.high);
    
    // Analyze each potential pivot level
    for (let i = 0; i < data.length; i++) {
      const pivotPrice = prices[i];
      const pivotTouches = this.findPriceTouches(data, pivotPrice, priceTolerance, pivotType);
      
      if (pivotTouches.length >= this.MIN_TOUCH_POINTS) {
        const pivotPattern = this.createPivotPattern(data, pivotPrice, pivotTouches, pivotType, priceRange);
        
        // Add to list if it meets confidence threshold
        if (pivotPattern.confidence >= this.MIN_CONFIDENCE) {
          pivots.push(pivotPattern);
        }
      }
    }
    
    return pivots;
  }
  
  /**
   * Find all touches of a specific price level
   */
  private findPriceTouches(
    data: CandlestickData[], 
    pivotPrice: number, 
    tolerance: number,
    pivotType: PivotType
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
    return this.optimizeTouches(touches);
  }
  
  /**
   * Optimize touches by removing those that are too close together in time
   */
  private optimizeTouches(
    touches: Array<{ time: Date; price: number; index: number }>
  ): Array<{ time: Date; price: number; index: number }> {
    if (touches.length <= 1) return touches;
    
    // Sort by time
    touches.sort((a, b) => a.time.getTime() - b.time.getTime());
    
    const optimized: Array<{ time: Date; price: number; index: number }> = [touches[0]];
    const MIN_TOUCHES_APART = 3; // Minimum candles between touches
    
    for (let i = 1; i < touches.length; i++) {
      const prevTouch = optimized[optimized.length - 1];
      
      // Only add touch if it's far enough from the previous one
      if (touches[i].index - prevTouch.index >= MIN_TOUCHES_APART) {
        optimized.push(touches[i]);
      }
    }
    
    return optimized;
  }
  
  /**
   * Create a pivot pattern from detected touches
   */
  private createPivotPattern(
    data: CandlestickData[],
    pivotLevel: number,
    touches: Array<{ time: Date; price: number; index: number }>,
    pivotType: PivotType,
    priceRange: number
  ): PivotPattern {
    // Determine start and end times
    const startTime = touches[0].time;
    const endTime = touches[touches.length - 1].time;
    
    // Calculate high and low prices
    const highPrice = pivotType === PivotType.RESISTANCE ? 
      pivotLevel + (priceRange * 0.01) : // Slightly above resistance level
      Math.max(...data
        .filter(d => d.timestamp >= startTime.getTime() && d.timestamp <= endTime.getTime())
        .map(d => d.high)
      );
    
    const lowPrice = pivotType === PivotType.SUPPORT ? 
      pivotLevel - (priceRange * 0.01) : // Slightly below support level
      Math.min(...data
        .filter(d => d.timestamp >= startTime.getTime() && d.timestamp <= endTime.getTime())
        .map(d => d.low)
      );
    
    // Calculate confidence based on:
    // 1. Number of touches (more is better)
    // 2. Distribution of touches over time
    // 3. Consistency of touch prices
    
    // Touch count factor
    const touchCountFactor = Math.min(touches.length / 5, 1); // Cap at 5 touches for max score
    
    // Time distribution factor
    const timeSpan = endTime.getTime() - startTime.getTime();
    const expectedGapTime = timeSpan / (touches.length - 1);
    
    let timeDistributionScore = 0;
    for (let i = 1; i < touches.length; i++) {
      const actualGap = touches[i].time.getTime() - touches[i-1].time.getTime();
      const gapRatio = Math.min(actualGap / expectedGapTime, 2); // Cap at 2x expected
      timeDistributionScore += (1 - Math.abs(1 - gapRatio)) / (touches.length - 1);
    }
    
    // Price consistency factor
    const touchPrices = touches.map(t => t.price);
    const meanPrice = touchPrices.reduce((sum, p) => sum + p, 0) / touchPrices.length;
    const priceDeviations = touchPrices.map(p => Math.abs(p - meanPrice) / meanPrice);
    const priceConsistencyFactor = 1 - Math.min(
      priceDeviations.reduce((sum, d) => sum + d, 0) / touchPrices.length,
      0.2 // Cap at 20% deviation for 0 score
    ) / 0.2;
    
    // Combine factors for overall confidence
    const confidence = (
      touchCountFactor * 0.5 +
      timeDistributionScore * 0.3 +
      priceConsistencyFactor * 0.2
    );
    
    // Create the pivot pattern object
    const pivotPattern: PivotPattern = {
      id: uuidv4(),
      type: PatternType.PIVOT,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      pivotType,
      pivotLevel,
      touchPoints: touches.map(t => ({ time: t.time, price: t.price })),
      // Add the additional required properties for the enhanced PivotPattern
      touchStrength: touchCountFactor,
      temporalDistribution: timeDistributionScore,
      priceConsistency: priceConsistencyFactor,
      volumeReactions: touches.map(() => 0), // Default values, would need actual volume analysis
      priceReactions: touches.map(() => 0), // Default values, would need actual price reaction analysis
      strengthScore: confidence,
      adaptiveZoneWidth: priceRange * (this.PRICE_TOLERANCE / 100)
    };
    
    return pivotPattern;
  }
  
  /**
   * Filter out redundant pivot levels that are too close to each other
   */
  private filterRedundantPivots(pivots: PivotPattern[]): PivotPattern[] {
    if (pivots.length <= 1) return pivots;
    
    const result: PivotPattern[] = [];
    
    for (const pivot of pivots) {
      // Check if this pivot is too close to any already in the result
      const isTooClose = result.some(p => 
        p.pivotType === pivot.pivotType && 
        Math.abs(p.pivotLevel - pivot.pivotLevel) / Math.max(p.pivotLevel, pivot.pivotLevel) < (this.MAX_PIVOT_RANGE / 100)
      );
      
      if (!isTooClose) {
        result.push(pivot);
      }
    }
    
    return result;
  }
  
  /**
   * Calculate overall price range in the data
   */
  private calculatePriceRange(data: CandlestickData[]): number {
    const highPrices = data.map(d => d.high);
    const lowPrices = data.map(d => d.low);
    
    const highestPrice = Math.max(...highPrices);
    const lowestPrice = Math.min(...lowPrices);
    
    return highestPrice - lowestPrice;
  }
}

export default PivotDetector;
