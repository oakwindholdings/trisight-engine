import { useState, useEffect, useCallback } from 'react';
import { fetchTimeSeries, fetchTradingDay, checkMarketStatus } from '../api/twelveDataApi';
import { CandlestickData, Timeframe } from '../models/ChartTypes';

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

  // Fetch market data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const marketStatusData = await checkMarketStatus();
      setMarketStatus(marketStatusData);
      
      const candlestickData = await fetchTimeSeries(symbol, timeframe);
      setData(candlestickData);
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch market data'));
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  // Refresh data
  const refresh = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  // Fetch data when symbol or timeframe changes
  useEffect(() => {
    fetchData();
  }, [symbol, timeframe, fetchData]);

  // Fetch data for a specific trading day (9:30 AM - 4:00 PM, 5-minute candles)
  const fetchSpecificDay = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      // Force timeframe to 5-minute for better overview
      setTimeframe('5min');
      
      // Fetch data for the specific trading day
      const candlestickData = await fetchTradingDay(symbol, date);
      setData(candlestickData);
    } catch (err) {
      console.error('Error fetching data for specific day:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch data for specific day'));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

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
    marketStatus
  };
};

export default useMarketData;
