// src/utils/patternDetection/helper/EscalatorDetectionUtils.ts
// Helper utilities for Escalator detection
// Shared by detectors
import { CandlestickData } from '../../../models/ChartTypes';
import { EscalatorSignalStrength, ThrustDirection } from '../../../models/PatternTypes';

/**
 * Utility class for adaptive Escalator pattern detection
 */
export class EscalatorDetectionUtils {
  /**
   * Calculate step scores based on price movements and volatility
   * @param data Candlestick data
   * @param steps The identified escalator steps
   * @param priceChangeThreshold Minimum threshold for significant price change
   * @param volumeChangeThreshold Minimum threshold for significant volume change
   * @param direction The direction of the escalator (BULLISH or BEARISH)
   * @returns Array of scores for each step
   */
  static calculateStepScores(
    data: CandlestickData[],
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>,
    priceChangeThreshold: number,
    volumeChangeThreshold: number,
    direction: ThrustDirection
  ): number[] {
    const stepScores: number[] = [];
    
    // Calculate scores for each step
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      
      // Skip consolidation steps when calculating scores
      if (step.isConsolidation) {
        stepScores.push(0); // Neutral score for consolidation
        continue;
      }
      
      // Find candles within this step
      const stepCandles = data.filter(candle => {
        const candleTime = new Date(candle.timestamp);
        return candleTime >= step.startTime && candleTime <= step.endTime;
      });
      
      if (stepCandles.length < 2) {
        stepScores.push(0);
        continue;
      }
      
      // Calculate price change percentage
      const startPrice = stepCandles[0].open;
      const endPrice = stepCandles[stepCandles.length - 1].close;
      const priceChange = (endPrice - startPrice) / startPrice;
      
      // Calculate volume change
      const prevStepIndex = Math.max(0, i - 2); // Compare to previous non-consolidation step
      const prevStepCandles = data.filter(candle => {
        const candleTime = new Date(candle.timestamp);
        return candleTime >= steps[prevStepIndex].startTime && 
               candleTime <= steps[prevStepIndex].endTime;
      });
      
      let volumeChange = 0;
      if (prevStepCandles.length > 0) {
        const prevAvgVolume = prevStepCandles.reduce((sum, candle) => sum + candle.volume, 0) / prevStepCandles.length;
        const currentAvgVolume = stepCandles.reduce((sum, candle) => sum + candle.volume, 0) / stepCandles.length;
        volumeChange = (currentAvgVolume - prevAvgVolume) / prevAvgVolume;
      }
      
      // Score is based on price change direction and magnitude relative to threshold
      let score = 0;
      
      // For bullish escalator, positive price change is good
      // For bearish escalator, negative price change is good
      const directedPriceChange = direction === ThrustDirection.BULLISH ? priceChange : -priceChange;
      
      if (directedPriceChange > 0) {
        // Calculate step score based on price change relative to threshold
        score = Math.min(directedPriceChange / priceChangeThreshold * 2, 3);
        
        // Boost score if volume is also increasing
        if (volumeChange > volumeChangeThreshold) {
          score += Math.min(volumeChange / volumeChangeThreshold, 1);
        }
      } else {
        // Negative score for steps moving against the escalator direction
        score = Math.max(directedPriceChange / priceChangeThreshold * 2, -2);
      }
      
      stepScores.push(score);
    }
    
    return stepScores;
  }
  
  /**
   * Calculate the cumulative score from step scores
   * @param stepScores Array of individual step scores
   * @returns Cumulative score
   */
  static calculateCumulativeScore(stepScores: number[]): number {
    // More weight to recent steps (exponential weighting)
    let cumulativeScore = 0;
    const nonZeroScores = stepScores.filter(score => score !== 0);
    
    if (nonZeroScores.length === 0) {
      return 0;
    }
    
    for (let i = 0; i < stepScores.length; i++) {
      // Exponential weight - more recent steps have higher impact
      const weight = Math.exp((i - stepScores.length + 1) / 3);
      cumulativeScore += stepScores[i] * weight;
    }
    
    return cumulativeScore;
  }
  
  /**
   * Calculate price changes for each step
   * @param data Candlestick data
   * @param steps The identified escalator steps
   * @returns Array of price changes for each step
   */
  static calculatePriceChanges(
    data: CandlestickData[],
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>
  ): number[] {
    const priceChanges: number[] = [];
    
    for (const step of steps) {
      const stepCandles = data.filter(candle => {
        const candleTime = new Date(candle.timestamp);
        return candleTime >= step.startTime && candleTime <= step.endTime;
      });
      
      if (stepCandles.length < 2) {
        priceChanges.push(0);
        continue;
      }
      
      const startPrice = stepCandles[0].open;
      const endPrice = stepCandles[stepCandles.length - 1].close;
      const priceChange = (endPrice - startPrice) / startPrice;
      
      priceChanges.push(priceChange);
    }
    
    return priceChanges;
  }
  
  /**
   * Calculate volume changes for each step
   * @param data Candlestick data
   * @param steps The identified escalator steps
   * @returns Array of volume changes for each step
   */
  static calculateVolumeChanges(
    data: CandlestickData[],
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>
  ): number[] {
    const volumeChanges: number[] = [];
    let prevAvgVolume = 0;
    
    for (const step of steps) {
      const stepCandles = data.filter(candle => {
        const candleTime = new Date(candle.timestamp);
        return candleTime >= step.startTime && candleTime <= step.endTime;
      });
      
      if (stepCandles.length === 0) {
        volumeChanges.push(0);
        continue;
      }
      
      const currentAvgVolume = stepCandles.reduce((sum, candle) => sum + candle.volume, 0) / stepCandles.length;
      
      if (prevAvgVolume === 0) {
        volumeChanges.push(0);
      } else {
        volumeChanges.push((currentAvgVolume - prevAvgVolume) / prevAvgVolume);
      }
      
      prevAvgVolume = currentAvgVolume;
    }
    
    return volumeChanges;
  }
  
  /**
   * Calculate the step consistency score based on the regularity of step heights
   * @param steps The identified escalator steps
   * @returns Consistency score from 0 to 1
   */
  static calculateStepConsistency(
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>
  ): number {
    const thrustSteps = steps.filter(step => !step.isConsolidation);
    
    if (thrustSteps.length < 2) {
      return 0;
    }
    
    // Calculate step heights
    const stepHeights: number[] = [];
    for (let i = 0; i < thrustSteps.length - 1; i++) {
      const height = Math.abs(thrustSteps[i + 1].level - thrustSteps[i].level);
      stepHeights.push(height);
    }
    
    // Calculate mean step height
    const meanHeight = stepHeights.reduce((sum, height) => sum + height, 0) / stepHeights.length;
    
    // Calculate standard deviation
    const squaredDifferences = stepHeights.map(height => Math.pow(height - meanHeight, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / stepHeights.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate coefficient of variation (CV) - lower means more consistent
    const cv = meanHeight > 0 ? stdDev / meanHeight : 1;
    
    // Convert to 0-1 scale where 1 is most consistent
    return Math.max(0, Math.min(1, 1 - cv));
  }
  
  /**
   * Calculate the average height of steps
   * @param steps The identified escalator steps
   * @returns Average step height
   */
  static calculateAverageStepHeight(
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>
  ): number {
    const thrustSteps = steps.filter(step => !step.isConsolidation);
    
    if (thrustSteps.length < 2) {
      return 0;
    }
    
    // Calculate step heights
    const stepHeights: number[] = [];
    for (let i = 0; i < thrustSteps.length - 1; i++) {
      const height = Math.abs(thrustSteps[i + 1].level - thrustSteps[i].level);
      stepHeights.push(height);
    }
    
    // Calculate mean step height
    return stepHeights.reduce((sum, height) => sum + height, 0) / stepHeights.length;
  }
  
  /**
   * Calculate context score based on higher timeframe trends
   * @param cumulativeScore The base cumulative score
   * @param data Candlestick data
   * @param direction The direction of the escalator
   * @returns Context-adjusted score
   */
  static calculateContextScore(
    cumulativeScore: number,
    data: CandlestickData[],
    direction: ThrustDirection
  ): number {
    if (data.length < 10) {
      return cumulativeScore;
    }
    
    // Calculate the overall trend in this window
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const trendPercent = (lastPrice - firstPrice) / firstPrice;
    
    // Calculate trend strength (magnitude of the trend)
    const trendStrength = Math.abs(trendPercent);
    
    // Calculate trend alignment (positive if trend aligns with escalator direction)
    const trendAlignment = direction === ThrustDirection.BULLISH ? 
      (trendPercent > 0 ? 1 : -1) : 
      (trendPercent < 0 ? 1 : -1);
    
    // Adjust score based on trend alignment and strength
    const contextScore = cumulativeScore * (1 + (trendAlignment * trendStrength * 0.5));
    
    return contextScore;
  }
  
  /**
   * Determine the signal strength based on cumulative score
   * @param cumulativeScore The cumulative score
   * @returns Signal strength classification
   */
  static determineSignalStrength(cumulativeScore: number): EscalatorSignalStrength {
    const absScore = Math.abs(cumulativeScore);
    
    if (absScore >= 6) {
      return EscalatorSignalStrength.VERY_STRONG;
    } else if (absScore >= 4) {
      return EscalatorSignalStrength.STRONG;
    } else if (absScore >= 2) {
      return EscalatorSignalStrength.MODERATE;
    } else {
      return EscalatorSignalStrength.WEAK;
    }
  }
}
