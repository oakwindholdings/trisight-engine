// src/hooks/useMarketData.ts
// Hook for retrieving market data
// Wraps TwelveData API calls
import { useState, useEffect, useCallback } from 'react';
import { fetchTimeSeries, fetchTradingDay, checkMarketStatus, fetchCandlestickData } from '../api/twelveDataApi';
import { CandlestickData, Timeframe } from '../models/ChartTypes';
import { getMockMarketData } from '../utils/mockData';
import { logDebug } from '../utils/debug';

/**
 * Hook for fetching and managing market data from TwelveData API
 */
export const useMarketData = (initialSymbol = 'AAPL', initialTimeframe: Timeframe = '5min') => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [marketStatus, setMarketStatus] = useState<{
    isOpen: boolean;
    timeToOpen?: string;
    timeToClose?: string;
  }>({ isOpen: false });
  const [isUsingCustomRange, setIsUsingCustomRange] = useState(false);

  // Convert timeframe to interval for API
  const timeframeToInterval = (tf: Timeframe): string => {
    const mapping: Record<string, string> = {
      '1min': '1min',
      '5min': '5min',
      '15min': '15min',
      '30min': '30min',
      '60min': '1h',
      '1hour': '1h',
      'daily': '1day',
      'weekly': '1week',
      'monthly': '1month',
      '1day': '1day',
      '5day': '5day',
    };
    return mapping[tf] || '5min';
  };

  // Fetch market data
  const fetchData = useCallback(async () => {
    logDebug('DEBUG_DATA_FETCH', `useMarketData - fetchData called for symbol: ${symbol}, timeframe: ${timeframe}`);
    
    setLoading(true);
    setError(null);
    setIsUsingCustomRange(false);
    
    try {
      const marketStatusData = await checkMarketStatus();
      setMarketStatus(marketStatusData);
      
      const candlestickData = await fetchTimeSeries(symbol, timeframe, 500);
      logDebug('DEBUG_DATA_FETCH', `[useMarketData] fetchData - received ${candlestickData.length} candles for ${symbol}/${timeframe}`);
      
      // If no data received, use mock data for testing
      if (!candlestickData || candlestickData.length === 0) {
        logDebug('DEBUG_DATA_FETCH', '[useMarketData] No data from API, using mock data for testing');
        const mockData = getMockMarketData();
        setData(mockData);
      } else {
        setData(candlestickData);
      }
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
      
      // Use mock data on error for testing
      logDebug('DEBUG_DATA_FETCH', '[useMarketData] API error, using mock data for testing');
      const mockData = getMockMarketData();
      setData(mockData);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Fetch data for a specific date range
  const fetchDateRange = useCallback(async (startDate: Date, endDate: Date, customInterval?: string) => {
    logDebug('DEBUG_DATA_FETCH', '[DIAGNOSTIC] fetchDateRange CALLED with:', {
      symbol,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentTimeframe: timeframe,
      customInterval,
      timestamp: new Date().toISOString()
    });
    
    logDebug('DEBUG_DATA_FETCH', `[useMarketData] fetchDateRange called with:`, {
      symbol,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      currentTimeframe: timeframe,
      customInterval,
      willUseInterval: customInterval || timeframeToInterval(timeframe)
    });
    
    setLoading(true);
    setError(null);
    setIsUsingCustomRange(true); // Prevent automatic refetch
    
    try {
      // Use custom interval if provided, otherwise use the interval based on current timeframe
      const interval = customInterval || timeframeToInterval(timeframe);
      logDebug('DEBUG_DATA_FETCH', `fetchDateRange using interval: ${interval} for range ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Debug log for 15min specifically
      if (timeframe === '15min' || interval === '15min') {
        logDebug('DEBUG_DATA_FETCH', '[useMarketData] DEBUG 15min: timeframe =', timeframe, ', interval =', interval);
      }
      
      const candlestickData = await fetchCandlestickData(symbol, interval, startDate, endDate);
      logDebug('DEBUG_DATA_FETCH', `[useMarketData] fetchDateRange - received ${candlestickData.length} candles for ${symbol}/${interval} from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // DIAGNOSTIC: Log detailed response structure
      logDebug('DEBUG_DATA_FETCH', '[DIAGNOSTIC] API Response Structure:', {
        dataType: Array.isArray(candlestickData) ? 'array' : typeof candlestickData,
        length: candlestickData.length,
        firstCandle: candlestickData[0] ? {
          ...candlestickData[0],
          timestampType: typeof candlestickData[0].timestamp,
          timestampValue: candlestickData[0].timestamp,
          timestampDate: new Date(candlestickData[0].timestamp).toISOString()
        } : null,
        lastCandle: candlestickData[candlestickData.length - 1] ? {
          ...candlestickData[candlestickData.length - 1],
          timestampType: typeof candlestickData[candlestickData.length - 1].timestamp,
          timestampValue: candlestickData[candlestickData.length - 1].timestamp,
          timestampDate: new Date(candlestickData[candlestickData.length - 1].timestamp).toISOString()
        } : null
      });
      
      // Log first few candles to check interval
      if (candlestickData.length > 0) {
        logDebug('DEBUG_DATA_FETCH', '[useMarketData] First 3 candles:', candlestickData.slice(0, 3).map(c => ({
          datetime: c.datetime,
          open: c.open,
          close: c.close
        })));
      }
      
      setData(candlestickData);
      logDebug('DEBUG_DATA_FETCH', '[DIAGNOSTIC] Data set to state:', {
        dataLength: candlestickData.length,
        stateUpdated: true
      });
    } catch (err) {
      console.error('Error fetching market data for date range:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Refresh data
  const refresh = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  // Fetch data for a specific trading day (9:30 AM - 4:00 PM, 5-minute candles)
  const fetchSpecificDay = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    setIsUsingCustomRange(true); // Prevent automatic refetch
    
    try {
      // Force timeframe to 5-minute for better overview
      setTimeframe('5min');
      
      // Fetch data for the specific trading day
      const candlestickData = await fetchTradingDay(symbol, date);
      logDebug('DEBUG_DATA_FETCH', `[useMarketData] fetchSpecificDay - received ${candlestickData.length} candles for ${symbol} on ${date.toISOString()}`);
      setData(candlestickData);
    } catch (err) {
      console.error('Error fetching data for specific day:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data for specific day'));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Initialize data on mount and when symbol/timeframe changes (unless using custom range)
  useEffect(() => {
    // Only auto-fetch if not using custom range (prevents interference with manual date selections)
    if (!isUsingCustomRange) {
      logDebug('DEBUG_DATA_FETCH', '[useMarketData] Auto-initializing data for:', { symbol, timeframe, isUsingCustomRange });
      fetchData();
    } else {
      logDebug('DEBUG_DATA_FETCH', '[useMarketData] Skipping auto-fetch due to custom range:', { symbol, timeframe, isUsingCustomRange });
    }
  }, [symbol, timeframe, fetchData, isUsingCustomRange]);

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
    marketStatus,
    isUsingCustomRange,
    setIsUsingCustomRange
  };
};

export default useMarketData;
