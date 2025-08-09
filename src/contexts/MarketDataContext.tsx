// src/contexts/MarketDataContext.tsx
// Context providing market data with Supabase caching
// Wraps useMarketDataWithSupabase hook for global cache-first strategy
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { CandlestickData, Timeframe } from '../models/ChartTypes';
import { useMarketDataWithSupabase } from '../hooks/useMarketDataWithSupabase';
import useTwelveDataApiKey from '../hooks/useTwelveDataApiKey';

// Define the context type
interface MarketDataContextType {
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
  // Supabase-specific additions
  cachedSymbols: string[];
  isUsingCache: boolean;
}

// Create the context with initial values
const initialMarketDataContext: MarketDataContextType = {
  data: [],
  loading: false,
  error: null,
  symbol: '',
  setSymbol: () => {},
  timeframe: '5min',
  setTimeframe: () => {},
  refresh: async () => {},
  fetchSpecificDay: async () => {},
  fetchDateRange: async () => {},
  clearData: () => {},
  marketStatus: { isOpen: false },
  isUsingCustomRange: false,
  setIsUsingCustomRange: () => {},
  // Supabase-specific defaults
  cachedSymbols: [],
  isUsingCache: false
};

export const MarketDataContext = createContext<MarketDataContextType>(initialMarketDataContext);

// Provider component
interface MarketDataProviderProps {
  children: ReactNode;
  initialSymbol?: string;
  initialTimeframe?: Timeframe;
}

export const MarketDataProvider: React.FC<MarketDataProviderProps> = ({
  children,
  initialSymbol = '', // Rule: LockTicker — remove default 'AAPL'
  initialTimeframe = '5min'
}) => {
  // Hydrate TwelveData API key before market data hook triggers requests
  useTwelveDataApiKey();
  
  // Use Supabase-integrated hook for cache-first data fetching
  // This provides automatic caching, incremental updates, and better performance
  const marketData = useMarketDataWithSupabase();
  
  // Expose current symbol globally for feed fallback
  useEffect(() => {
    if (typeof window !== 'undefined' && marketData.symbol) {
      (window as any).trisightSymbol = marketData.symbol;
    }
  }, [marketData.symbol]);

  // Note: initialSymbol and initialTimeframe are handled by the context consumer
  // The hook uses the context values set by components like ContextBar
  
  return (
    <MarketDataContext.Provider value={marketData}>
      {children}
    </MarketDataContext.Provider>
  );
};

// Custom hook for using the market data context
export const useMarketDataContext = () => useContext(MarketDataContext);

export default MarketDataProvider;
