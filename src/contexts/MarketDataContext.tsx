// src/contexts/MarketDataContext.tsx
// Context providing market data
// Wraps useMarketData hook
import React, { createContext, useContext, ReactNode } from 'react';
import { CandlestickData, Timeframe } from '../models/ChartTypes';
import useMarketData from '../hooks/useMarketData';

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
  marketStatus: {
    isOpen: boolean;
    timeToOpen?: string;
    timeToClose?: string;
  };
}

// Create the context with initial values
const initialMarketDataContext: MarketDataContextType = {
  data: [],
  loading: false,
  error: null,
  symbol: 'AAPL',
  setSymbol: () => {},
  timeframe: '5min',
  setTimeframe: () => {},
  refresh: async () => {},
  fetchSpecificDay: async () => {},
  marketStatus: { isOpen: false }
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
  initialSymbol = 'AAPL',
  initialTimeframe = '5min'
}) => {
  const marketData = useMarketData(initialSymbol, initialTimeframe);
  
  return (
    <MarketDataContext.Provider value={marketData}>
      {children}
    </MarketDataContext.Provider>
  );
};

// Custom hook for using the market data context
export const useMarketDataContext = () => useContext(MarketDataContext);

export default MarketDataProvider;
