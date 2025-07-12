// src/hooks/useHeikinAshiTransform.ts
// Hook that conditionally transforms OHLCV data to Heikin-Ashi format
// Intercepts raw candle array before rendering based on user settings

import { useMemo } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { 
  transformToHeikinAshi, 
  heikinAshiToCandlestickData,
  HeikinAshiCandle 
} from '../utils/heikinAshiUtils';
import { logDebug } from '../utils/debug';

export type CandleType = 'ohlc' | 'heikin_ashi';

interface UseHeikinAshiTransformOptions {
  candleType: CandleType;
  data: CandlestickData[];
}

interface UseHeikinAshiTransformResult {
  transformedData: CandlestickData[];
  isHeikinAshi: boolean;
  heikinAshiData: HeikinAshiCandle[] | null;
}

/**
 * Hook that conditionally applies Heikin-Ashi transformation to candlestick data
 * @param options Configuration object with candle type and data
 * @returns Object containing transformed data and metadata
 */
export function useHeikinAshiTransform({
  candleType,
  data
}: UseHeikinAshiTransformOptions): UseHeikinAshiTransformResult {
  
  const result = useMemo(() => {
    logDebug('DEBUG_DATA_FETCH', '[useHeikinAshiTransform] Processing data:', {
      candleType,
      dataLength: data?.length || 0,
      firstCandle: data?.[0]?.datetime || 'none'
    });

    // Early return for empty data
    if (!data || data.length === 0) {
      return {
        transformedData: [],
        isHeikinAshi: false,
        heikinAshiData: null
      };
    }

    // Standard OHLC mode - pass through unchanged
    if (candleType === 'ohlc') {
      logDebug('DEBUG_DATA_FETCH', '[useHeikinAshiTransform] Using standard OHLC candles');
      return {
        transformedData: data,
        isHeikinAshi: false,
        heikinAshiData: null
      };
    }

    // Heikin-Ashi mode - transform the data
    logDebug('DEBUG_DATA_FETCH', '[useHeikinAshiTransform] Transforming to Heikin-Ashi candles');
    
    try {
      const heikinAshiCandles = transformToHeikinAshi(data);
      
      // Convert back to CandlestickData format for rendering compatibility
      const transformedData = heikinAshiCandles.map(haCandle => 
        heikinAshiToCandlestickData(haCandle)
      );

      logDebug('DEBUG_DATA_FETCH', '[useHeikinAshiTransform] HA transformation complete:', {
        originalCount: data.length,
        transformedCount: transformedData.length,
        firstOriginal: {
          open: data[0].open,
          high: data[0].high,
          low: data[0].low,
          close: data[0].close
        },
        firstTransformed: {
          open: transformedData[0].open,
          high: transformedData[0].high,
          low: transformedData[0].low,
          close: transformedData[0].close
        }
      });

      return {
        transformedData,
        isHeikinAshi: true,
        heikinAshiData: heikinAshiCandles
      };
    } catch (error) {
      logDebug('DEBUG_DATA_FETCH', '[useHeikinAshiTransform] Error during HA transformation:', error);
      
      // Fallback to original data on error
      return {
        transformedData: data,
        isHeikinAshi: false,
        heikinAshiData: null
      };
    }
  }, [candleType, data]);

  return result;
}

/**
 * Simple hook version that just returns transformed data
 * @param candleType Current candle display type
 * @param data Original OHLCV data
 * @returns Transformed candlestick data (HA if enabled, original if not)
 */
export function useTransformedCandleData(
  candleType: CandleType,
  data: CandlestickData[]
): CandlestickData[] {
  const { transformedData } = useHeikinAshiTransform({ candleType, data });
  return transformedData;
}
