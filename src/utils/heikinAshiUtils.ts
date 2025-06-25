// src/utils/heikinAshiUtils.ts
// Pure utility functions for Heikin-Ashi candlestick calculations
// Smooths price data by averaging candlestick components to highlight trends

import { CandlestickData } from '../models/ChartTypes';

/**
 * Represents a Heikin-Ashi transformed candlestick
 */
export interface HeikinAshiCandle {
  datetime: string;
  timestamp: number;
  ha_open: number;
  ha_high: number;
  ha_low: number;
  ha_close: number;
  volume: number;
}

/**
 * Calculates a single Heikin-Ashi candle from OHLC data and previous HA candle
 * @param current Current OHLC candle
 * @param previous Previous Heikin-Ashi candle (null for first candle)
 * @returns Transformed Heikin-Ashi candle
 */
export function calculateHeikinAshiCandle(
  current: CandlestickData,
  previous: HeikinAshiCandle | null
): HeikinAshiCandle {
  // HA Close = (Open + High + Low + Close) / 4
  const ha_close = (current.open + current.high + current.low + current.close) / 4;
  
  // HA Open = (Previous HA Open + Previous HA Close) / 2
  // For first candle, use current OHLC open
  const ha_open = previous 
    ? (previous.ha_open + previous.ha_close) / 2 
    : current.open;
  
  // HA High = max(High, HA Open, HA Close)
  const ha_high = Math.max(current.high, ha_open, ha_close);
  
  // HA Low = min(Low, HA Open, HA Close)
  const ha_low = Math.min(current.low, ha_open, ha_close);

  return {
    datetime: current.datetime,
    timestamp: current.timestamp,
    ha_open,
    ha_high,
    ha_low,
    ha_close,
    volume: current.volume
  };
}

/**
 * Transforms an array of OHLC candles to Heikin-Ashi format
 * @param candles Array of standard OHLC candlestick data
 * @returns Array of Heikin-Ashi transformed candles
 */
export function transformToHeikinAshi(candles: CandlestickData[]): HeikinAshiCandle[] {
  if (!candles || candles.length === 0) {
    return [];
  }

  const heikinAshiCandles: HeikinAshiCandle[] = [];
  
  for (let i = 0; i < candles.length; i++) {
    const current = candles[i];
    const previous = i > 0 ? heikinAshiCandles[i - 1] : null;
    
    const haCandle = calculateHeikinAshiCandle(current, previous);
    heikinAshiCandles.push(haCandle);
  }
  
  return heikinAshiCandles;
}

/**
 * Converts Heikin-Ashi candle back to standard CandlestickData format for rendering
 * @param haCandle Heikin-Ashi candle
 * @returns Standard CandlestickData structure
 */
export function heikinAshiToCandlestickData(haCandle: HeikinAshiCandle): CandlestickData {
  return {
    datetime: haCandle.datetime,
    timestamp: haCandle.timestamp,
    open: haCandle.ha_open,
    high: haCandle.ha_high,
    low: haCandle.ha_low,
    close: haCandle.ha_close,
    volume: haCandle.volume
  };
}

/**
 * Determines if a Heikin-Ashi candle is bullish (close >= open)
 * @param haCandle Heikin-Ashi candle
 * @returns True if bullish, false if bearish
 */
export function isHeikinAshiBullish(haCandle: HeikinAshiCandle): boolean {
  return haCandle.ha_close >= haCandle.ha_open;
}

/**
 * Calculates the trend strength based on consecutive bullish/bearish HA candles
 * @param haCandles Array of Heikin-Ashi candles
 * @param index Current candle index
 * @param lookback Number of previous candles to check
 * @returns Trend strength: positive for bullish, negative for bearish, 0 for mixed
 */
export function calculateTrendStrength(
  haCandles: HeikinAshiCandle[], 
  index: number, 
  lookback: number = 3
): number {
  if (index < lookback || !haCandles || haCandles.length === 0) {
    return 0;
  }

  let bullishCount = 0;
  let bearishCount = 0;

  for (let i = index - lookback + 1; i <= index; i++) {
    if (isHeikinAshiBullish(haCandles[i])) {
      bullishCount++;
    } else {
      bearishCount++;
    }
  }

  // Return net trend strength
  return bullishCount - bearishCount;
}
