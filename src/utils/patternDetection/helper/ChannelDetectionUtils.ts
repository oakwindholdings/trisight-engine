// src/utils/patternDetection/helper/ChannelDetectionUtils.ts
// Helper utilities for Channel detection
// Shared by detectors
import { CandlestickData } from '../../../models/ChartTypes';

/**
 * Convert datetime string to Date object
 */
function parseDatetime(datetime: string): Date {
  return new Date(datetime);
}

/**
 * Point with time and price
 */
export interface TimePoint {
  time: Date;
  price: number;
}

/**
 * Touch point on a channel boundary
 */
export interface TouchPoint {
  time: Date;
  price: number;
  isUpper: boolean; // true if touches upper boundary, false for lower
}

/**
 * Linear regression result
 */
export interface RegressionResult {
  slope: number;       // m in y = mx + b
  intercept: number;   // b in y = mx + b
  r2: number;          // R-squared (coefficient of determination)
}

/**
 * Boundary line definition
 */
export interface BoundaryLine {
  startTime: Date;
  endTime: Date;
  slope: number;
  intercept: number;
  swingStrength: number; // Measure of how significant the swing points are
}

/**
 * Utility class with helper methods for channel detection
 */
export class ChannelDetectionUtils {
  /**
   * Perform linear regression on time-price data
   */
  static linearRegression(points: TimePoint[]): RegressionResult | null {
    if (points.length < 2) return null;
    
    const baseTime = points[0].time.getTime();
    
    // Convert to x (time offset in ms) and y (price) arrays
    const xVals = points.map(p => p.time.getTime() - baseTime);
    const yVals = points.map(p => p.price);
    
    // Calculate means
    const n = xVals.length;
    const sumX = xVals.reduce((sum, val) => sum + val, 0);
    const sumY = yVals.reduce((sum, val) => sum + val, 0);
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = xVals[i] - meanX;
      const yDiff = yVals[i] - meanY;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    if (denominator === 0) return null;
    
    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;
    
    // Calculate R-squared
    let sumSquaredResiduals = 0;
    let sumSquaredTotal = 0;
    
    for (let i = 0; i < n; i++) {
      const yPred = slope * xVals[i] + intercept;
      sumSquaredResiduals += Math.pow(yVals[i] - yPred, 2);
      sumSquaredTotal += Math.pow(yVals[i] - meanY, 2);
    }
    
    const r2 = sumSquaredTotal === 0 ? 0 : 1 - (sumSquaredResiduals / sumSquaredTotal);
    
    return { slope, intercept, r2 };
  }
  
  /**
   * Find swing highs in candlestick data
   */
  static findSwingHighs(data: CandlestickData[], lookback: number = 3): TimePoint[] {
    if (data.length < (lookback * 2) + 1) return [];
    
    const swingHighs: TimePoint[] = [];
    
    // Start at lookback to have enough previous candles
    // End at length - lookback to have enough future candles
    for (let i = lookback; i < data.length - lookback; i++) {
      const currentHigh = data[i].high;
      let isSwingHigh = true;
      
      // Check if higher than all candles in lookback window (before and after)
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue; // Skip the current candle
        
        if (data[j].high >= currentHigh) {
          isSwingHigh = false;
          break;
        }
      }
      
      if (isSwingHigh) {
        swingHighs.push({
          time: parseDatetime(data[i].datetime),
          price: currentHigh
        });
      }
    }
    
    return swingHighs;
  }
  
  /**
   * Find swing lows in candlestick data
   */
  static findSwingLows(data: CandlestickData[], lookback: number = 3): TimePoint[] {
    if (data.length < (lookback * 2) + 1) return [];
    
    const swingLows: TimePoint[] = [];
    
    // Start at lookback to have enough previous candles
    // End at length - lookback to have enough future candles
    for (let i = lookback; i < data.length - lookback; i++) {
      const currentLow = data[i].low;
      let isSwingLow = true;
      
      // Check if lower than all candles in lookback window (before and after)
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue; // Skip the current candle
        
        if (data[j].low <= currentLow) {
          isSwingLow = false;
          break;
        }
      }
      
      if (isSwingLow) {
        swingLows.push({
          time: parseDatetime(data[i].datetime),
          price: currentLow
        });
      }
    }
    
    return swingLows;
  }
  
  /**
   * Connect swing points to form potential boundaries
   */
  static findPotentialBoundaries(points: TimePoint[], linearityThreshold: number): BoundaryLine[] {
    if (points.length < 3) return [];
    
    const boundaries: BoundaryLine[] = [];
    
    // Try to connect different swing points
    for (let i = 0; i < points.length - 2; i++) {
      for (let j = i + 1; j < points.length - 1; j++) {
        // Create initial line with 2 points
        const initialPoints = [points[i], points[j]];
        const regression = this.linearRegression(initialPoints);
        
        if (!regression) continue;
        
        // Find additional points that align with this potential line
        const alignedPoints = [points[i], points[j]];
        
        // Check if other points align with this line
        for (let k = 0; k < points.length; k++) {
          if (k === i || k === j) continue; // Skip points already in line
          
          const timeMs = points[k].time.getTime() - points[i].time.getTime();
          const expectedPrice = regression.slope * timeMs + regression.intercept;
          const priceDiff = Math.abs(points[k].price - expectedPrice);
          
          // If point is close to line, add it
          // Adjust tolerance based on price level (0.1% of price)
          const tolerance = points[k].price * 0.001;
          
          if (priceDiff <= tolerance) {
            alignedPoints.push(points[k]);
          }
        }
        
        // Need at least 3 points for a good boundary
        if (alignedPoints.length < 3) continue;
        
        // Re-calculate regression with all aligned points
        const finalRegression = this.linearRegression(alignedPoints);
        
        if (!finalRegression) continue;
        
        // Check if line is linear enough
        if (finalRegression.r2 < linearityThreshold) continue;
        
        // Calculate swing strength (higher for more points and better fit)
        const swingStrength = finalRegression.r2 * (alignedPoints.length / 10);
        
        // Sort points by time for proper start/end times
        alignedPoints.sort((a, b) => a.time.getTime() - b.time.getTime());
        
        // Add to potential boundaries
        boundaries.push({
          startTime: alignedPoints[0].time,
          endTime: alignedPoints[alignedPoints.length - 1].time,
          slope: finalRegression.slope,
          intercept: finalRegression.intercept,
          swingStrength
        });
      }
    }
    
    return boundaries;
  }
  
  /**
   * Find touch points where price comes close to channel boundaries
   */
  static findTouchPoints(
    data: CandlestickData[],
    upperBoundary: number,
    lowerBoundary: number,
    threshold: number
  ): TouchPoint[] {
    const touchPoints: TouchPoint[] = [];
    
    for (const candle of data) {
      // Check for upper boundary touches (high price near upper boundary)
      const upperDiff = Math.abs(candle.high - upperBoundary);
      const upperThreshold = upperBoundary * (threshold / 100); // Convert % to absolute value
      
      if (upperDiff <= upperThreshold) {
        touchPoints.push({
          time: parseDatetime(candle.datetime),
          price: candle.high,
          isUpper: true
        });
      }
      
      // Check for lower boundary touches (low price near lower boundary)
      const lowerDiff = Math.abs(candle.low - lowerBoundary);
      const lowerThreshold = lowerBoundary * (threshold / 100); // Convert % to absolute value
      
      if (lowerDiff <= lowerThreshold) {
        touchPoints.push({
          time: parseDatetime(candle.datetime),
          price: candle.low,
          isUpper: false
        });
      }
    }
    
    return touchPoints;
  }
  
  /**
   * Calculate Average True Range (ATR)
   */
  static calculateATR(data: CandlestickData[], period: number): number[] {
    if (data.length < period) return [];
    
    const trValues: number[] = [];
    const atrValues: number[] = [];
    
    // Calculate True Range for each candle
    for (let i = 0; i < data.length; i++) {
      let tr: number;
      
      if (i === 0) {
        // First candle: TR = High - Low
        tr = data[i].high - data[i].low;
      } else {
        // TR = max(high - low, |high - prevClose|, |low - prevClose|)
        const highLow = data[i].high - data[i].low;
        const highPrevClose = Math.abs(data[i].high - data[i-1].close);
        const lowPrevClose = Math.abs(data[i].low - data[i-1].close);
        
        tr = Math.max(highLow, highPrevClose, lowPrevClose);
      }
      
      trValues.push(tr);
      
      // Calculate ATR once we have enough TR values
      if (i >= period - 1) {
        if (i === period - 1) {
          // First ATR is simple average of TR values
          const sum = trValues.slice(0, period).reduce((sum, val) => sum + val, 0);
          atrValues.push(sum / period);
        } else {
          // Subsequent ATRs use smoothing formula: ATR = ((period-1) * previousATR + currentTR) / period
          const prevATR = atrValues[atrValues.length - 1];
          const currentATR = ((period - 1) * prevATR + tr) / period;
          atrValues.push(currentATR);
        }
      }
    }
    
    return atrValues;
  }
  
  /**
   * Calculate Simple Moving Average (SMA)
   */
  static calculateSMA(data: number[], period: number): number[] {
    if (data.length < period) return [];
    
    const smaValues: number[] = [];
    
    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((sum, val) => sum + val, 0);
      smaValues.push(sum / period);
    }
    
    return smaValues;
  }
  
  /**
   * Calculate how well price is contained within channel boundaries
   */
  static calculateContainmentFactor(
    data: CandlestickData[],
    upperBoundary: number,
    lowerBoundary: number
  ): number {
    let outsideCount = 0;
    
    for (const candle of data) {
      if (candle.high > upperBoundary || candle.low < lowerBoundary) {
        outsideCount++;
      }
    }
    
    // Return percentage of candles contained within the channel
    return 1 - (outsideCount / data.length);
  }
}
