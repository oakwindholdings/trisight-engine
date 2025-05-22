// src/utils/patternDetection/BlackjackDetector.ts
// Detector for Blackjack pattern
// Identifies occurrences in price data
import { CandlestickData } from '../../models/ChartTypes';
import { BlackjackPattern, PatternType, BlackjackSignalStrength } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Blackjack patterns - scoring based on price and volume correlation
 * As described in requirements:
 * - When price goes up and volume goes up: +1
 * - When price goes up and volume goes down: 0
 * - When price goes down and volume goes up: -1
 * - When price goes down and volume goes down: 0
 * - Score is calculated by summing values over a designated time frame (default: 7 periods)
 */
class BlackjackDetector {
  private readonly DEFAULT_PERIODS = 7;
  private readonly MIN_SCORE = 1; // Minimum score to consider as a pattern
  private readonly MAX_SCORE = 21; // Maximum possible score (like Blackjack)
  private readonly MIN_CONFIDENCE = 0.4; // Minimum confidence threshold
  
  /**
   * Detect Blackjack patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): BlackjackPattern[] {
    if (data.length < this.DEFAULT_PERIODS + 1) {
      return []; // Not enough data
    }
    
    const patterns: BlackjackPattern[] = [];
    
    // Process the data in sliding windows of DEFAULT_PERIODS + 1 (need 1 extra for comparison)
    for (let i = 0; i <= data.length - (this.DEFAULT_PERIODS + 1); i++) {
      const windowData = data.slice(i, i + this.DEFAULT_PERIODS + 1);
      const pattern = this.detectInWindow(windowData, i);
      
      if (pattern) {
        patterns.push(pattern);
      }
    }
    
    return patterns;
  }
  
  /**
   * Detect a Blackjack pattern in a specific window of data
   */
  private detectInWindow(
    windowData: CandlestickData[], 
    startIndex: number
  ): BlackjackPattern | null {
    const correlations = this.calculateCorrelations(windowData);
    const cumulativeScore = this.calculateCumulativeScore(correlations);
    
    // Only consider windows where the final score is meaningful
    const finalScore = cumulativeScore[cumulativeScore.length - 1];
    
    if (Math.abs(finalScore) < this.MIN_SCORE) {
      return null;
    }
    
    // Calculate the confidence based on score magnitude
    const absoluteScore = Math.abs(finalScore);
    const scoreConfidence = Math.min(absoluteScore / this.MAX_SCORE, 1);
    
    // Calculate confidence based on consistency of correlations
    const consistencyConfidence = this.calculateConsistencyConfidence(correlations);
    
    // Combined confidence
    const confidence = (scoreConfidence * 0.7) + (consistencyConfidence * 0.3);
    
    if (confidence < this.MIN_CONFIDENCE) {
      return null;
    }
    
    // Determine high and low prices within the pattern
    const startTime = new Date(windowData[0].timestamp);
    const endTime = new Date(windowData[windowData.length - 1].timestamp);
    
    const prices = windowData.map(d => [d.high, d.low]).flat();
    const highPrice = Math.max(...prices);
    const lowPrice = Math.min(...prices);
    
    // Determine signal strength based on final score
    let signalStrength = BlackjackSignalStrength.WEAK;
    if (Math.abs(finalScore) >= 6) {
      signalStrength = BlackjackSignalStrength.VERY_STRONG;
    } else if (Math.abs(finalScore) >= 4) {
      signalStrength = BlackjackSignalStrength.STRONG;
    } else if (Math.abs(finalScore) >= 2) {
      signalStrength = BlackjackSignalStrength.MODERATE;
    }
    
    // Construct the BlackjackPattern using proper property names from the interface
    const pattern: BlackjackPattern = {
      id: uuidv4(),
      type: PatternType.BLACKJACK,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      intrinsicScores: cumulativeScore, // Changed from 'score' to match interface
      cumulativeScore: finalScore,      // Final cumulative score
      signalStrength,                   // Added signal strength
      priceChange: windowData.map((_, i) => i > 0 ? (windowData[i].close - windowData[i-1].close) / windowData[i-1].close * 100 : 0), // Price change percentages
      volumeChange: windowData.map((_, i) => i > 0 ? (windowData[i].volume - windowData[i-1].volume) / windowData[i-1].volume * 100 : 0), // Volume change percentages
      relatedPatternIds: [], // This would be filled in by a higher-level system that links patterns
      hasReceivedFeedback: false,
      detectionVersion: '1.0-legacy'
    };
    
    return pattern;
  }
  
  /**
   * Calculate price-volume correlations for each candle in the window
   */
  private calculateCorrelations(windowData: CandlestickData[]): Array<{
    time: Date;
    priceMovement: 'up' | 'down';
    volumeMovement: 'up' | 'down';
    value: -1 | 0 | 1;
  }> {
    const correlations: Array<{
      time: Date;
      priceMovement: 'up' | 'down';
      volumeMovement: 'up' | 'down';
      value: -1 | 0 | 1;
    }> = [];
    
    // Skip the first candle as it's the reference point
    for (let i = 1; i < windowData.length; i++) {
      const currentCandle = windowData[i];
      const previousCandle = windowData[i - 1];
      
      // Determine price movement
      const priceMovement = currentCandle.close > previousCandle.close ? 'up' : 'down';
      
      // Determine volume movement
      const volumeMovement = currentCandle.volume > previousCandle.volume ? 'up' : 'down';
      
      // Calculate the correlation value based on the rules
      let value: -1 | 0 | 1;
      
      if (priceMovement === 'up' && volumeMovement === 'up') {
        value = 1; // Positive correlation
      } else if (priceMovement === 'down' && volumeMovement === 'up') {
        value = -1; // Negative correlation
      } else {
        value = 0; // No significant correlation
      }
      
      correlations.push({
        time: new Date(currentCandle.timestamp),
        priceMovement,
        volumeMovement,
        value
      });
    }
    
    return correlations;
  }
  
  /**
   * Calculate cumulative score over the window
   */
  private calculateCumulativeScore(correlations: Array<{
    value: -1 | 0 | 1;
  }>): number[] {
    let cumulativeScore = 0;
    return correlations.map(corr => {
      cumulativeScore += corr.value;
      return cumulativeScore;
    });
  }
  
  /**
   * Calculate confidence based on consistency of correlations
   */
  private calculateConsistencyConfidence(correlations: Array<{
    value: -1 | 0 | 1;
  }>): number {
    // Count non-zero values
    const significantCorrelations = correlations.filter(c => c.value !== 0).length;
    
    // Calculate as a percentage of total correlations
    return significantCorrelations / correlations.length;
  }
}

export default BlackjackDetector;
