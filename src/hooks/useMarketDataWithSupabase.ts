// src/hooks/useMarketDataWithSupabase.ts
// Enhanced market data hook with Supabase caching
// Drop-in replacement for useMarketData with improved performance

import { useState, useCallback, useEffect, useRef } from 'react';
import { CandlestickData, Timeframe } from '../models/ChartTypes';
import { fetchMarketData, getCachedSymbols, clearSymbolCache } from '../utils/supabase/marketDataService';
import { logDebug } from '../utils/debug';
import { timeframeToInterval } from '../api/marketApi';

interface UseMarketDataWithSupabaseReturn {
  data: CandlestickData[];
  loading: boolean;
  error: Error | null;
  symbol: string;
  setSymbol: (symbol: string) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  refresh: () => Promise<void>;
  fetchSpecificDay: (date: Date) => Promise<void>;
  fetchDateRange: (startDate: Date, endDate: Date, interval?: string) => Promise<void>;
  clearData: () => void;
  marketStatus: {
    isOpen: boolean;
    timeToOpen?: string;
    timeToClose?: string;
  };
  isUsingCustomRange: boolean;
  setIsUsingCustomRange: (value: boolean) => void;
  cachedSymbols: string[];
  isUsingCache: boolean;
}

/**
 * Enhanced market data hook with Supabase caching
 * Provides the same interface as useMarketData but with automatic caching
 */
export function useMarketDataWithSupabase(): UseMarketDataWithSupabaseReturn {
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [cachedSymbols, setCachedSymbols] = useState<string[]>([]);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [timeframe, setTimeframe] = useState<Timeframe>('1min'); // Match what's shown in UI
  const [isUsingCustomRange, setIsUsingCustomRange] = useState(false);
  const [marketStatus] = useState({ isOpen: false });

  // Create service wrapper for consistent interface
  const marketDataService = {
    fetchWithCache: fetchMarketData,
    getCachedSymbols,
    clearSymbolCache
  };

  // Load cached symbols on mount
  useEffect(() => {
    getCachedSymbols().then(setCachedSymbols).catch(console.error);
  }, []);

  /**
   * Clear all data
   */
  const clearData = useCallback(() => {
    setData([]);
    setError(null);
    setIsUsingCustomRange(false);
  }, []);

  /**
   * Fetch data for a symbol with default date range
   */
  const fetchData = useCallback(async (symbolParam?: string, intervalParam?: string) => {
    const targetSymbol = symbolParam || symbol;
    const targetInterval = intervalParam || timeframeToInterval(timeframe);

    setLoading(true);
    setError(null);
    setIsUsingCustomRange(false);

    try {
      // Calculate proper date range based on timeframe
      const now = new Date();
      let startDate: Date;
      
      // Determine how far back to fetch based on interval
      switch (targetInterval) {
        case '1min':
        case '5min':
        case '15min':
          // For intraday, fetch last 5 days
          startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
          break;
        case '1h':
          // For hourly, fetch last 30 days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '1day':
        case '5day':
          // For daily/weekly, fetch last year
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          // Default to 30 days
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      logDebug('DEBUG_SUPABASE', `Fetching data for ${targetSymbol}/${targetInterval}`, {
        startDate: startDate.toISOString(),
        endDate: now.toISOString()
      });

      // Fetch with automatic caching
      const result = await fetchMarketData({
        symbol: targetSymbol,
        interval: targetInterval,
        startDate,
        endDate: now,
        forceRefresh: false
      });

      if (result && result.length > 0) {
        console.log('[DEBUG_SUPABASE] Setting data in state:', result.length, 'candles');
        console.log('[DEBUG_SUPABASE] First candle:', result[0]);
        console.log('[DEBUG_SUPABASE] Last candle:', result[result.length - 1]);
        setData(result);
        setIsUsingCache(true);
        setError(null); // Clear any previous errors
        logDebug('DEBUG_SUPABASE', `Successfully fetched ${result.length} candles for ${targetSymbol}`);
      } else {
        console.error('[DEBUG_SUPABASE] No data received from market data service');
        throw new Error('No data received from market data service');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(new Error(errorMessage));
      // Don't clear data on error - keep existing data if available
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  /**
   * Fetch data for a specific date range
   */
  const fetchDateRange = useCallback(
    async (startDate: Date, endDate: Date, interval?: string) => {
      const targetInterval = interval || timeframeToInterval(timeframe);
      
      setLoading(true);
      setError(null);
      setIsUsingCustomRange(true);
      
      try {
        logDebug('DEBUG_SUPABASE', `Fetching date range for ${symbol}/${targetInterval}`, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });
        
        const result = await fetchMarketData({
          symbol,
          interval: targetInterval,
          startDate,
          endDate,
          forceRefresh: false
        });
        
        console.log('[DEBUG_SUPABASE] fetchDateRange result:', result.length, 'candles');
        setData(result);
        setIsUsingCache(true);
        
        logDebug('DEBUG_SUPABASE', `Fetched ${result.length} candles for date range`);
      } catch (err) {
        console.error('Error fetching date range:', err);
        setError(err instanceof Error ? err : new Error(err instanceof Error ? err.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    },
    [marketDataService, symbol, timeframe]
  );

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const fetchSpecificDay = useCallback(async (date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    await fetchDateRange(startOfDay, endOfDay);
  }, [fetchDateRange]);

  // Store fetchData in a ref to avoid dependency issues
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  });

  // Auto-fetch data when symbol or timeframe changes
  // DISABLED: This causes infinite loop with ChartWithContext which manages its own fetching
  // Components using this hook should explicitly call fetchData, fetchDateRange, or fetchSpecificDay
  /*
  useEffect(() => {
    // Only fetch if we have a valid symbol and we're not using a custom date range
    if (symbol && timeframe && !isUsingCustomRange) {
      // Clear any stale errors before fetching
      setError(null);
      fetchDataRef.current();
    }
  }, [symbol, timeframe, isUsingCustomRange]);
  */

  return {
    data,
    loading,
    error,
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    refresh,
    fetchSpecificDay,
    fetchDateRange,
    clearData,
    marketStatus,
    isUsingCustomRange,
    setIsUsingCustomRange,
    cachedSymbols,
    isUsingCache
  };
}

// Export a migration helper
export function migrateToSupabaseHook() {
  console.log(`
    Migration Guide: useMarketData → useMarketDataWithSupabase
    
    1. Replace import:
       - import { useMarketData } from './hooks/useMarketData';
       + import { useMarketDataWithSupabase } from './hooks/useMarketDataWithSupabase';
    
    2. Update hook usage:
       - const { data, loading, error, fetchData, fetchDateRange, clearData } = useMarketData();
       + const { data, loading, error, fetchData, fetchDateRange, clearData, cachedSymbols, isUsingCache } = useMarketDataWithSupabase();
    
    3. New features available:
       - cachedSymbols: Array of symbols that have cached data
       - isUsingCache: Boolean indicating if current data is from cache
    
    4. Performance benefits:
       - Automatic caching of fetched data
       - Incremental updates (only fetches new data)
       - Fallback to cache if API fails
       - Pre-computed Heikin-Ashi values
  `);
}
