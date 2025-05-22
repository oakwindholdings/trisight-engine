// src/utils/patternDetection/helper/BlackjackDetectionUtils.ts
// Helper utilities for Blackjack detection
// Shared by detectors
import { CandlestickData } from '../../../models/ChartTypes';

/**
 * Convert datetime string to Date object
 */
function parseDatetime(datetime: string): Date {
  return new Date(datetime);
}

/**
 * Utility class with helper methods for BlackJack signal detection
 */
export class BlackjackDetectionUtils {
  /**
   * Calculates price change percentage between two candles
   * @param previousCandle Previous candle
   * @param currentCandle Current candle
   * @returns Percentage change in price
   */
  static calculatePriceChange(
    previousCandle: CandlestickData, 
    currentCandle: CandlestickData
  ): number {
    return ((currentCandle.close - previousCandle.close) / previousCandle.close) * 100;
  }
  
  /**
   * Calculates volume change percentage between two candles
   * @param previousCandle Previous candle
   * @param currentCandle Current candle
   * @returns Percentage change in volume
   */
  static calculateVolumeChange(
    previousCandle: CandlestickData, 
    currentCandle: CandlestickData
  ): number {
    if (previousCandle.volume === 0) return 0;
    return ((currentCandle.volume - previousCandle.volume) / previousCandle.volume) * 100;
  }
  
  /**
   * Calculates intrinsic BlackJack scores for an array of candlestick data
   * @param data Candlestick data
   * @param priceChangeThreshold Minimum price change % to be considered significant
   * @param volumeChangeThreshold Minimum volume change % to be considered significant
   * @returns Array of intrinsic scores (0 for first candle, +1/-1/0 for subsequent candles)
   */
  static calculateIntrinsicScores(
    data: CandlestickData[],
    priceChangeThreshold: number,
    volumeChangeThreshold: number
  ): number[] {
    const scores: number[] = [0]; // First candle has no score (reference point)
    
    for (let i = 1; i < data.length; i++) {
      const priceChange = this.calculatePriceChange(data[i - 1], data[i]);
      const volumeChange = this.calculateVolumeChange(data[i - 1], data[i]);
      
      // Price up and volume up = +1
      if (priceChange >= priceChangeThreshold && volumeChange >= volumeChangeThreshold) {
        scores.push(1);
      }
      // Price down and volume up = -1
      else if (priceChange <= -priceChangeThreshold && volumeChange >= volumeChangeThreshold) {
        scores.push(-1);
      }
      // Price up/down and volume down or unchanged = 0
      else {
        scores.push(0);
      }
    }
    
    return scores;
  }
  
  /**
   * Calculates cumulative BlackJack scores based on a rolling window of intrinsic scores
   * @param intrinsicScores Array of intrinsic scores
   * @param lookbackPeriods Number of periods to look back for calculating cumulative score
   * @returns Array of cumulative scores
   */
  static calculateCumulativeScores(
    intrinsicScores: number[],
    lookbackPeriods: number
  ): number[] {
    const cumulativeScores: number[] = [];
    
    // Fill with zeros until we have enough data
    for (let i = 0; i < lookbackPeriods - 1 && i < intrinsicScores.length; i++) {
      cumulativeScores.push(0);
    }
    
    // Calculate cumulative scores with rolling window
    for (let i = lookbackPeriods - 1; i < intrinsicScores.length; i++) {
      let sum = 0;
      for (let j = 0; j < lookbackPeriods; j++) {
        sum += intrinsicScores[i - j];
      }
      cumulativeScores.push(sum);
    }
    
    return cumulativeScores;
  }
  
  /**
   * Calculates consistency score of BlackJack signals
   * Higher score when signals are consistently in the same direction
   * @param scores Array of intrinsic scores
   * @returns Consistency score between 0 and 1
   */
  static calculateConsistency(scores: number[]): number {
    const positives = scores.filter(s => s > 0).length;
    const negatives = scores.filter(s => s < 0).length;
    const zeros = scores.filter(s => s === 0).length;
    const total = scores.length;
    
    if (total === 0) return 0;
    
    const nonZeroCount = total - zeros;
    if (nonZeroCount === 0) return 0;
    
    // Determine dominant direction
    const dominantCount = Math.max(positives, negatives);
    
    // Calculate consistency (higher when most scores are in the same direction)
    return (dominantCount / nonZeroCount) * 0.8 + 0.2;
  }
  
  /**
   * Resample candlestick data to a higher timeframe for context scoring
   * @param data Original candlestick data
   * @param resampleFactor Factor to resample by (e.g., 5 for converting 1min to 5min)
   * @returns Resampled candlestick data
   */
  static resampleData(
    data: CandlestickData[],
    resampleFactor: number
  ): CandlestickData[] {
    if (resampleFactor <= 1 || data.length < resampleFactor) return data;
    
    const resampled: CandlestickData[] = [];
    
    for (let i = 0; i < data.length; i += resampleFactor) {
      const chunk = data.slice(i, Math.min(i + resampleFactor, data.length));
      
      if (chunk.length < 2) continue;
      
      const open = chunk[0].open;
      const close = chunk[chunk.length - 1].close;
      const high = Math.max(...chunk.map(c => c.high));
      const low = Math.min(...chunk.map(c => c.low));
      const volume = chunk.reduce((sum, c) => sum + c.volume, 0);
      const datetime = chunk[0].datetime; // Use first datetime as reference
      
      resampled.push({
        datetime,
        timestamp: new Date(datetime).getTime(),
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return resampled;
  }
  
  /**
   * Calculates BlackJack context score based on higher timeframe analysis
   * @param data Original candlestick data
   * @param lookbackPeriods Number of periods to look back for regular scoring
   * @param contextMultiplier Multiplier for context timeframe (e.g., 5 = 5x longer timeframe)
   * @param priceChangeThreshold Minimum price change % for context timeframe
   * @param volumeChangeThreshold Minimum volume change % for context timeframe
   * @returns Context score or undefined if not enough data
   */
  static calculateContextScore(
    data: CandlestickData[],
    lookbackPeriods: number,
    contextMultiplier: number,
    priceChangeThreshold: number,
    volumeChangeThreshold: number
  ): number | undefined {
    // Need enough data for resampling
    if (data.length < lookbackPeriods * contextMultiplier) {
      return undefined;
    }
    
    // Resample data to context timeframe
    const resampledData = this.resampleData(data, contextMultiplier);
    
    if (resampledData.length < lookbackPeriods) {
      return undefined;
    }
    
    // Calculate scores on resampled data
    const contextIntrinsicScores = this.calculateIntrinsicScores(
      resampledData,
      priceChangeThreshold * Math.sqrt(contextMultiplier), // Scale threshold with timeframe
      volumeChangeThreshold * Math.sqrt(contextMultiplier)
    );
    
    const contextLookback = Math.max(3, Math.floor(lookbackPeriods / 2));
    const contextCumulativeScores = this.calculateCumulativeScores(
      contextIntrinsicScores,
      contextLookback
    );
    
    // Return the most recent context score
    return contextCumulativeScores.length > 0 ? 
      contextCumulativeScores[contextCumulativeScores.length - 1] : 
      undefined;
  }
  
  /**
   * Calculates price trend strength over a window of candles
   * @param data Window of candlestick data
   * @returns Trend strength score between 0 and 1
   */
  static calculatePriceTrendStrength(data: CandlestickData[]): number {
    if (data.length < 2) return 0;
    
    const prices = data.map(d => d.close);
    
    let sumSquares = 0;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXSquare = 0;
    
    for (let i = 0; i < prices.length; i++) {
      const x = i;
      const y = prices[i];
      
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXSquare += x * x;
    }
    
    const n = prices.length;
    const denominator = n * sumXSquare - sumX * sumX;
    
    if (denominator === 0) return 0;
    
    // Calculate linear regression slope
    const slope = (n * sumXY - sumX * sumY) / denominator;
    
    // Calculate R-squared value
    const meanY = sumY / n;
    let totalSS = 0;
    let residualSS = 0;
    
    for (let i = 0; i < n; i++) {
      const x = i;
      const y = prices[i];
      const yPred = (sumXY - sumX * sumY) / denominator * x + (sumY * sumXSquare - sumX * sumXY) / denominator;
      
      totalSS += Math.pow(y - meanY, 2);
      residualSS += Math.pow(y - yPred, 2);
    }
    
    const rSquared = Math.max(0, Math.min(1, 1 - (residualSS / totalSS)));
    
    // Combine magnitude of slope and r-squared for trend strength
    const normalizedSlope = Math.min(1, Math.abs(slope) * 100 / meanY);
    return (normalizedSlope * 0.7) + (rSquared * 0.3);
  }
}
