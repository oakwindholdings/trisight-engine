// src/utils/candleTransform.ts
// Candle transformation utilities for TriSight
// Converts standard OHLC candles to Heikin-Ashi format for pattern detection

import { CandlestickData } from '../models/ChartTypes';
import { logDebug } from './debug';

/**
 * Converts standard OHLC candles to Heikin-Ashi format
 * Heikin-Ashi candles smooth price action and reduce noise, improving:
 * - Trend identification accuracy
 * - Breakout detection reliability  
 * - Pattern signal quality
 * 
 * @param candles - Array of standard OHLC candlestick data
 * @returns Array of Heikin-Ashi transformed candlestick data
 */
export function convertToHeikinAshi(candles: CandlestickData[]): CandlestickData[] {
  if (!candles || candles.length === 0) {
    logDebug('DEBUG_PATTERN_DETECT', '[HA_TRANSFORM] No candles provided for Heikin-Ashi conversion');
    return [];
  }

  logDebug('DEBUG_PATTERN_DETECT', '[HA_TRANSFORM] Converting', candles.length, 'OHLC candles to Heikin-Ashi');

  const haCandles: CandlestickData[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const currentCandle = candles[i];
    const prevHACandle = haCandles[i - 1];
    
    // Heikin-Ashi calculations:
    // HA_Close = (O + H + L + C) / 4
    // HA_Open = (prev_HA_Open + prev_HA_Close) / 2 (or current Open for first candle)
    // HA_High = max(H, HA_Open, HA_Close)
    // HA_Low = min(L, HA_Open, HA_Close)
    
    const haClose = (currentCandle.open + currentCandle.high + currentCandle.low + currentCandle.close) / 4;
    
    let haOpen: number;
    if (i === 0) {
      // For the first candle, use the original open
      haOpen = currentCandle.open;
    } else {
      // For subsequent candles, use average of previous HA open and close
      haOpen = (prevHACandle.open + prevHACandle.close) / 2;
    }
    
    const haHigh = Math.max(currentCandle.high, haOpen, haClose);
    const haLow = Math.min(currentCandle.low, haOpen, haClose);
    
    const haCandle: CandlestickData = {
      datetime: currentCandle.datetime,
      timestamp: currentCandle.timestamp,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: currentCandle.volume // Volume remains unchanged
    };
    
    haCandles.push(haCandle);
    
    // Debug logging for first few candles
    if (i < 3) {
      logDebug('DEBUG_PATTERN_DETECT', `[HA_TRANSFORM] Candle ${i}:`, {
        original: {
          open: currentCandle.open.toFixed(2),
          high: currentCandle.high.toFixed(2),
          low: currentCandle.low.toFixed(2),
          close: currentCandle.close.toFixed(2)
        },
        heikinAshi: {
          open: haOpen.toFixed(2),
          high: haHigh.toFixed(2),
          low: haLow.toFixed(2),
          close: haClose.toFixed(2)
        }
      });
    }
  }

  logDebug('DEBUG_PATTERN_DETECT', '[HA_TRANSFORM] Heikin-Ashi conversion complete. Generated', haCandles.length, 'HA candles');
  
  return haCandles;
}

/**
 * Calculates the body size of a Heikin-Ashi candle
 * @param haCandle - Heikin-Ashi candle data
 * @returns Absolute body size
 */
export function getHABodySize(haCandle: CandlestickData): number {
  return Math.abs(haCandle.close - haCandle.open);
}

/**
 * Calculates the upper wick size of a Heikin-Ashi candle
 * @param haCandle - Heikin-Ashi candle data
 * @returns Upper wick size
 */
export function getHAUpperWick(haCandle: CandlestickData): number {
  const bodyTop = Math.max(haCandle.open, haCandle.close);
  return haCandle.high - bodyTop;
}

/**
 * Calculates the lower wick size of a Heikin-Ashi candle
 * @param haCandle - Heikin-Ashi candle data
 * @returns Lower wick size
 */
export function getHALowerWick(haCandle: CandlestickData): number {
  const bodyBottom = Math.min(haCandle.open, haCandle.close);
  return bodyBottom - haCandle.low;
}

/**
 * Determines if a Heikin-Ashi candle is bullish
 * @param haCandle - Heikin-Ashi candle data
 * @returns True if bullish (close > open)
 */
export function isHABullish(haCandle: CandlestickData): boolean {
  return haCandle.close > haCandle.open;
}

/**
 * Determines if a Heikin-Ashi candle is a doji (very small body)
 * @param haCandle - Heikin-Ashi candle data
 * @param dojiThreshold - Body size threshold as percentage of total range (default 0.1 = 10%)
 * @returns True if doji
 */
export function isHADoji(haCandle: CandlestickData, dojiThreshold: number = 0.1): boolean {
  const bodySize = getHABodySize(haCandle);
  const totalRange = haCandle.high - haCandle.low;
  
  if (totalRange === 0) return true; // Zero range is considered doji
  
  return (bodySize / totalRange) <= dojiThreshold;
}
