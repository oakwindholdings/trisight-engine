// src/utils/aiMetrics/AIHoverMetrics.ts
// AI-aware metrics layer for enhanced hover tooltip intelligence
// Provides forecast bias, anomaly detection, and meta-confidence scoring

import { CandlestickData } from '../../models/ChartTypes';

export interface AIMetrics {
  forecastBias: {
    score: number; // -1 to 1 (bearish to bullish bias)
    confidence: number; // 0 to 1
    reasoning: string;
  };
  anomalyFlag: {
    isAnomaly: boolean;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    type: 'VOLUME' | 'PRICE' | 'PATTERN' | 'TIMING';
    description: string;
  };
  metaConfidence: {
    overallScore: number; // 0 to 100
    factors: {
      dataQuality: number;
      patternStrength: number;
      marketConditions: number;
      historicalAccuracy: number;
    };
  };
}

export class AIHoverMetricsCalculator {
  
  /**
   * Calculate AI-aware metrics for a specific candle
   */
  static calculateAIMetrics(
    candleIndex: number,
    candles: CandlestickData[],
    patternContext: any
  ): AIMetrics {
    const candle = candles[candleIndex];
    if (!candle) {
      return this.getDefaultAIMetrics();
    }

    return {
      forecastBias: this.calculateForecastBias(candleIndex, candles, patternContext),
      anomalyFlag: this.detectAnomalies(candleIndex, candles, patternContext),
      metaConfidence: this.calculateMetaConfidence(candleIndex, candles, patternContext)
    };
  }

  /**
   * Calculate forecast bias based on pattern strength and market momentum
   */
  private static calculateForecastBias(
    candleIndex: number,
    candles: CandlestickData[],
    patternContext: any
  ) {
    const windowSize = Math.min(10, candleIndex);
    const recentCandles = candles.slice(candleIndex - windowSize, candleIndex + 1);
    
    // Calculate price momentum
    const priceChange = recentCandles.length > 1 ? 
      (recentCandles[recentCandles.length - 1].close - recentCandles[0].close) / recentCandles[0].close : 0;
    
    // Calculate volume trend
    const avgVolume = recentCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / recentCandles.length;
    const currentVolume = recentCandles[recentCandles.length - 1]?.volume || 0;
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
    
    // Bias calculation (-1 to 1)
    let bias = Math.tanh(priceChange * 5); // Sigmoid-like scaling
    bias *= Math.min(volumeRatio, 2); // Volume confirmation
    
    // Pattern influence
    const hasRisingPattern = this.hasRisingPatterns(candleIndex, patternContext);
    const hasFallingPattern = this.hasFallingPatterns(candleIndex, patternContext);
    
    if (hasRisingPattern) bias += 0.3;
    if (hasFallingPattern) bias -= 0.3;
    
    bias = Math.max(-1, Math.min(1, bias));
    
    const confidence = Math.min(0.9, Math.abs(bias) + volumeRatio * 0.1);
    
    return {
      score: parseFloat(bias.toFixed(3)),
      confidence: parseFloat(confidence.toFixed(3)),
      reasoning: this.getForecastReasoning(bias, hasRisingPattern, hasFallingPattern, volumeRatio)
    };
  }

  /**
   * Detect anomalies in price, volume, or pattern behavior
   */
  private static detectAnomalies(
    candleIndex: number,
    candles: CandlestickData[],
    patternContext: any
  ) {
    const candle = candles[candleIndex];
    const windowSize = Math.min(20, candleIndex);
    const recentCandles = candles.slice(candleIndex - windowSize, candleIndex);
    
    if (recentCandles.length < 5) {
      return { isAnomaly: false, severity: 'LOW' as const, type: 'PRICE' as const, description: 'Insufficient data' };
    }
    
    // Volume anomaly detection
    const avgVolume = recentCandles.reduce((sum, c) => sum + (c.volume || 0), 0) / recentCandles.length;
    const currentVolume = candle.volume || 0;
    const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;
    
    if (volumeRatio > 3) {
      return {
        isAnomaly: true,
        severity: 'HIGH' as const,
        type: 'VOLUME' as const,
        description: `Volume spike ${(volumeRatio * 100).toFixed(0)}% above average`
      };
    }
    
    // Price gap detection
    const prevClose = recentCandles[recentCandles.length - 1]?.close || candle.open;
    const gapSize = Math.abs(candle.open - prevClose) / prevClose;
    
    if (gapSize > 0.02) { // 2% gap
      const severity: 'HIGH' | 'MEDIUM' = gapSize > 0.05 ? 'HIGH' : 'MEDIUM';
      return {
        isAnomaly: true,
        severity,
        type: 'PRICE' as const,
        description: `Price gap ${(gapSize * 100).toFixed(1)}%`
      };
    }
    
    return { isAnomaly: false, severity: 'LOW' as const, type: 'PRICE' as const, description: 'Normal behavior' };
  }

  /**
   * Calculate meta-confidence based on multiple factors
   */
  private static calculateMetaConfidence(
    candleIndex: number,
    candles: CandlestickData[],
    patternContext: any
  ) {
    const dataQuality = this.assessDataQuality(candleIndex, candles);
    const patternStrength = this.assessPatternStrength(candleIndex, patternContext);
    const marketConditions = this.assessMarketConditions(candleIndex, candles);
    const historicalAccuracy = 0.75; // Placeholder for historical model accuracy
    
    const overallScore = (dataQuality * 0.2 + patternStrength * 0.3 + marketConditions * 0.3 + historicalAccuracy * 0.2) * 100;
    
    return {
      overallScore: Math.round(overallScore),
      factors: {
        dataQuality: Math.round(dataQuality * 100),
        patternStrength: Math.round(patternStrength * 100),
        marketConditions: Math.round(marketConditions * 100),
        historicalAccuracy: Math.round(historicalAccuracy * 100)
      }
    };
  }

  // Helper methods
  private static hasRisingPatterns(candleIndex: number, patternContext: any): boolean {
    return patternContext?.escalatorSteps?.some((step: any) => 
      step.data?.direction === 'RISING' && this.isPatternActive(step, candleIndex)
    ) || false;
  }

  private static hasFallingPatterns(candleIndex: number, patternContext: any): boolean {
    return patternContext?.escalatorSteps?.some((step: any) => 
      step.data?.direction === 'FALLING' && this.isPatternActive(step, candleIndex)
    ) || false;
  }

  private static isPatternActive(pattern: any, candleIndex: number): boolean {
    if (!pattern.data?.stepRef) return false;
    const [start, end] = pattern.data.stepRef.split('-').map(Number);
    return candleIndex >= start && candleIndex <= end;
  }

  private static getForecastReasoning(bias: number, rising: boolean, falling: boolean, volumeRatio: number): string {
    if (Math.abs(bias) < 0.1) return 'Neutral outlook with balanced signals';
    if (bias > 0.5) return `Strong bullish bias${rising ? ' with rising pattern confirmation' : ''}`;
    if (bias < -0.5) return `Strong bearish bias${falling ? ' with falling pattern confirmation' : ''}`;
    if (bias > 0) return 'Mild bullish tendency';
    return 'Mild bearish tendency';
  }

  private static assessDataQuality(candleIndex: number, candles: CandlestickData[]): number {
    const windowSize = Math.min(10, candleIndex + 1);
    const recentCandles = candles.slice(candleIndex - windowSize + 1, candleIndex + 1);
    
    const hasVolumeData = recentCandles.some(c => c.volume && c.volume > 0);
    const hasCompleteOHLC = recentCandles.every(c => c.open && c.high && c.low && c.close);
    
    let quality = 0.5; // Base quality
    if (hasCompleteOHLC) quality += 0.3;
    if (hasVolumeData) quality += 0.2;
    
    return Math.min(1, quality);
  }

  private static assessPatternStrength(candleIndex: number, patternContext: any): number {
    let strength = 0.5; // Base strength
    
    // Check for active patterns
    if (patternContext?.escalatorSteps?.some((s: any) => this.isPatternActive(s, candleIndex))) {
      strength += 0.2;
    }
    if (patternContext?.breakoutBoxes?.some((b: any) => b.index === candleIndex)) {
      strength += 0.3;
    }
    
    return Math.min(1, strength);
  }

  private static assessMarketConditions(candleIndex: number, candles: CandlestickData[]): number {
    const windowSize = Math.min(20, candleIndex + 1);
    const recentCandles = candles.slice(candleIndex - windowSize + 1, candleIndex + 1);
    
    if (recentCandles.length < 5) return 0.5;
    
    // Calculate volatility
    const returns = recentCandles.slice(1).map((c, i) => 
      Math.log(c.close / recentCandles[i].close)
    );
    const volatility = Math.sqrt(returns.reduce((sum, r) => sum + r * r, 0) / returns.length);
    
    // Normalize volatility (lower is better for confidence)
    const normalizedVolatility = Math.max(0.1, Math.min(0.9, 1 - volatility * 50));
    
    return normalizedVolatility;
  }

  private static getDefaultAIMetrics(): AIMetrics {
    return {
      forecastBias: { score: 0, confidence: 0, reasoning: 'No data available' },
      anomalyFlag: { isAnomaly: false, severity: 'LOW', type: 'PRICE', description: 'No data' },
      metaConfidence: {
        overallScore: 50,
        factors: { dataQuality: 50, patternStrength: 50, marketConditions: 50, historicalAccuracy: 50 }
      }
    };
  }
}
