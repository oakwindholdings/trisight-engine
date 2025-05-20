import { CandlestickData } from '../../../models/ChartTypes';
import { RocketmanSignalStrength, ThrustDirection } from '../../../models/PatternTypes';

/**
 * Utility functions for Rocketman pattern detection
 */
export class RocketmanDetectionUtils {
  /**
   * Calculate percentage price changes for consecutive candles
   */
  static calculatePriceChanges(data: CandlestickData[]): number[] {
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
   * Calculate percentage volume changes for consecutive candles
   */
  static calculateVolumeChanges(data: CandlestickData[]): number[] {
    const changes: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const prevVolume = data[i - 1].volume;
      const currVolume = data[i].volume;
      const percentChange = prevVolume > 0 ? ((currVolume - prevVolume) / prevVolume) * 100 : 0;
      changes.push(percentChange);
    }
    
    // Add a leading 0 to match the original data length
    return [0, ...changes];
  }
  
  /**
   * Check for price acceleration pattern
   */
  static checkAcceleration(
    priceChanges: number[], 
    minAccelerationRate: number,
    minLength: number
  ): { 
    hasAcceleration: boolean; 
    accelerationRate: number;
    accelerationLength: number;
    peakIndex: number; 
    direction: ThrustDirection;
  } {
    if (priceChanges.length < 4) {
      return { 
        hasAcceleration: false, 
        accelerationRate: 0, 
        accelerationLength: 0,
        peakIndex: 0,
        direction: ThrustDirection.BULLISH
      };
    }
    
    // Determine overall direction (bullish or bearish)
    const sumChanges = priceChanges.reduce((sum, val) => sum + val, 0);
    const direction = sumChanges >= 0 ? ThrustDirection.BULLISH : ThrustDirection.BEARISH;
    
    // Convert to absolute values to detect both upward and downward acceleration
    const absChanges = priceChanges.map(Math.abs);
    
    // Find segments with increasing change (acceleration)
    let maxAccelerationRate = 0;
    let maxAccelerationLength = 0;
    let peakIndex = 0;
    
    for (let i = 2; i < absChanges.length; i++) {
      let segmentLength = 1;
      
      // Check if we have consecutive increasing changes
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
    
    // Consider it a valid acceleration if the rate and length are sufficient
    const hasAcceleration = maxAccelerationRate >= minAccelerationRate && maxAccelerationLength >= minLength;
    
    return { 
      hasAcceleration, 
      accelerationRate: maxAccelerationRate,
      accelerationLength: maxAccelerationLength,
      peakIndex,
      direction
    };
  }
  
  /**
   * Check for volume confirmation of the price move
   */
  static checkVolumeConfirmation(data: CandlestickData[], priceChanges: number[]): number {
    if (data.length <= 1) return 0;
    
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
  
  /**
   * Calculate momentum score based on acceleration rate, length and consistency
   */
  static calculateMomentumScore(
    accelerationRate: number,
    accelerationLength: number,
    priceChanges: number[]
  ): number {
    // Normalize acceleration rate (above 3.0 is very strong)
    const normalizedRate = Math.min(1, accelerationRate / 3.0);
    
    // Normalize acceleration length (above 5 periods is very strong)
    const normalizedLength = Math.min(1, accelerationLength / 5.0);
    
    // Calculate consistency (how uniform the acceleration is)
    const absChanges = priceChanges.map(Math.abs);
    const nonZeroChanges = absChanges.filter(c => c > 0);
    
    // Skip consistency calculation if not enough data points
    if (nonZeroChanges.length < 2) {
      return (normalizedRate * 0.5 + normalizedLength * 0.5);
    }
    
    // Standard deviation of changes (lower is more consistent)
    const mean = nonZeroChanges.reduce((sum, val) => sum + val, 0) / nonZeroChanges.length;
    const squareDiffs = nonZeroChanges.map(val => Math.pow(val - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Coefficient of variation (normalized standard deviation)
    const cv = mean > 0 ? stdDev / mean : 1;
    const consistency = Math.max(0, 1 - Math.min(1, cv));
    
    // Weighted combination of factors
    return (
      normalizedRate * 0.4 +
      normalizedLength * 0.4 +
      consistency * 0.2
    );
  }
  
  /**
   * Determine signal strength based on momentum and volume confirmation
   */
  static determineSignalStrength(
    momentumScore: number,
    volumeConfirmation: number,
    priceChange: number
  ): RocketmanSignalStrength {
    // Combined score with weights
    const combinedScore = 
      momentumScore * 0.5 + 
      volumeConfirmation * 0.3 + 
      Math.min(1, priceChange / 10) * 0.2;
    
    if (combinedScore >= 0.8) {
      return RocketmanSignalStrength.VERY_STRONG;
    } else if (combinedScore >= 0.6) {
      return RocketmanSignalStrength.STRONG;
    } else if (combinedScore >= 0.4) {
      return RocketmanSignalStrength.MODERATE;
    } else {
      return RocketmanSignalStrength.WEAK;
    }
  }
  
  /**
   * Calculate volatility-adjusted adaptive threshold
   * 
   * @param data Array of candlestick data
   * @param baseThreshold Base threshold value
   * @returns Adjusted threshold value
   */
  static calculateAdaptiveThreshold(data: CandlestickData[], baseThreshold: number): number {
    if (data.length < 10) {
      return baseThreshold; // Not enough data for calculation
    }
    
    // Calculate average true range as a volatility measure
    const atr = RocketmanDetectionUtils.calculateATR(data, 14);
    
    // Calculate average price
    const avgPrice = data.reduce((sum, candle) => sum + candle.close, 0) / data.length;
    
    // Calculate normalized volatility (ATR as percentage of average price)
    const normalizedVolatility = (atr / avgPrice) * 100;
    
    // Adjust threshold based on volatility
    // Higher volatility = higher threshold (more stringent)
    // Lower volatility = lower threshold (more sensitive)
    const volatilityFactor = Math.max(0.8, Math.min(1.5, normalizedVolatility / 2));
    
    return baseThreshold * volatilityFactor;
  }
  
  /**
   * Calculate Average True Range (ATR)
   * 
   * @param data Array of candlestick data
   * @param period Period for ATR calculation
   * @returns ATR value
   */
  private static calculateATR(data: CandlestickData[], period: number): number {
    if (data.length < period + 1) {
      return 0;
    }
    
    const trValues: number[] = [];
    
    // Calculate True Range for each candle
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;
      
      const tr1 = high - low; // Current high - current low
      const tr2 = Math.abs(high - prevClose); // Current high - previous close
      const tr3 = Math.abs(low - prevClose); // Current low - previous close
      
      const trueRange = Math.max(tr1, tr2, tr3);
      trValues.push(trueRange);
    }
    
    // Calculate average of the true range values for the specified period
    if (trValues.length < period) {
      return trValues.reduce((sum, tr) => sum + tr, 0) / trValues.length;
    }
    
    // Use simple moving average for ATR
    const periodTrValues = trValues.slice(-period);
    return periodTrValues.reduce((sum, tr) => sum + tr, 0) / period;
  }
}

export default RocketmanDetectionUtils;
