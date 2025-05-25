// src/api/twelveDataApi.ts
// TwelveData HTTP client
// Fetches market data and symbols
import axios from 'axios';
import { CandlestickData, Timeframe } from '../models/ChartTypes';

// TwelveData API configuration
// Start with API key from environment variable but allow runtime override
let API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || '';

export const setApiKey = (key: string) => {
  API_KEY = key;
};

export const getApiKey = () => API_KEY;
const BASE_URL = 'https://api.twelvedata.com';
const MAX_REQUESTS_PER_MINUTE = 8;
const CACHE_EXPIRY = 60 * 1000; // 1 minute in milliseconds

// Request tracking for throttling
let requestTimestamps: number[] = [];

// Simple localStorage cache implementation
const getFromCache = (key: string): any | null => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;

    const parsedItem = JSON.parse(item);
    const now = new Date().getTime();

    if (now > parsedItem.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedItem.value;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const saveToCache = (key: string, value: any, ttl = CACHE_EXPIRY): void => {
  try {
    const now = new Date().getTime();
    const item = {
      value,
      expiry: now + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to cache:', error);
  }
};

// Request throttling mechanism
const checkRequestThrottling = (): boolean => {
  const now = Date.now();
  const minuteAgo = now - 60000;
  
  // Clean up old requests
  requestTimestamps = requestTimestamps.filter(timestamp => timestamp > minuteAgo);
  
  // Check if we're over the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }
  
  // Add new request timestamp
  requestTimestamps.push(now);
  return true;
};

// Wait for a specified delay
const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// API request with throttling and caching
const apiRequest = async <T>(
  endpoint: string,
  params: Record<string, string>,
  cacheKey?: string,
  retryCount = 3
): Promise<T> => {
  // Check cache if cache key provided
  if (cacheKey) {
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return cachedData as T;
    }
  }

  // Check throttling
  if (!checkRequestThrottling()) {
    // Wait a bit and retry if we're being throttled
    await wait(5000);
    return apiRequest(endpoint, params, cacheKey, retryCount);
  }

  try {
    const response = await axios.get<T>(`${BASE_URL}${endpoint}`, {
      params: {
        ...params,
        apikey: API_KEY,
      },
      timeout: 10000, // 10 second timeout
    });

    // Cache the response if cache key is provided
    if (cacheKey) {
      saveToCache(cacheKey, response.data);
    }

    return response.data;
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error);
    
    if (retryCount > 0) {
      console.log(`Retrying... (${retryCount} attempts left)`);
      await wait(2000);
      return apiRequest(endpoint, params, cacheKey, retryCount - 1);
    }
    
    throw error;
  }
};

// Time series response interface
interface TimeSeriesResponse {
  meta: {
    symbol: string;
    interval: string;
    currency: string;
    exchange_timezone: string;
    exchange: string;
    type: string;
  };
  values: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume: string;
  }>;
  status: string;
}

// Symbol search response interface
interface SymbolSearchResponse {
  data: Array<{
    symbol: string;
    instrument_name: string;
    exchange: string;
    currency: string;
    type: string;
  }>;
  status: string;
}

// Market status response interface
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface MarketStatusResponse {
  markets: Array<{
    market: string;
    name: string;
    code: string;
    country: string;
    is_open: boolean;
    time_to_open: string;
    time_to_close: string;
  }>;
}

// Convert TwelveData timeframe to API interval
const timeframeToInterval = (timeframe: Timeframe): string => {
  switch (timeframe) {
    case '1min': return '1min';
    case '5min': return '5min';
    case '15min': return '15min';
    case '1hour': return '1h';
    case '1day': return '1day';
    case '5day': return '5day';
    default: return '5min';
  }
};

// Fetch candlestick data
export const fetchTimeSeries = async (
  symbol: string,
  timeframe: Timeframe,
  outputsize = 150
): Promise<CandlestickData[]> => {
  const interval = timeframeToInterval(timeframe);
  const cacheKey = `timeseries_${symbol}_${interval}_${outputsize}`;
  
  const response = await apiRequest<TimeSeriesResponse>(
    '/time_series',
    {
      symbol,
      interval,
      outputsize: outputsize.toString(),
    },
    cacheKey
  );
  
  // Transform API response to app data model
  return response.values.map(item => ({
    datetime: item.datetime,
    timestamp: new Date(item.datetime).getTime(),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    volume: parseFloat(item.volume),
  })).reverse(); // Reverse to get oldest to newest
};

// Fetch data for a specific trading day (9:30 AM - 4:00 PM)
export const fetchTradingDay = async (
  symbol: string,
  date: Date
): Promise<CandlestickData[]> => {
  // Format as YYYY-MM-DD
  const dateStr = date.toISOString().split('T')[0];
  
  // For 5-minute candles, a full trading day (9:30 AM - 4:00 PM = 6.5 hours) has 78 intervals
  // We'll request more to ensure we have enough data (some might be pre/post market)
  const outputsize = 200;
  
  // Use 5-minute interval for better overview
  const interval = '5min';
  const cacheKey = `tradingday_${symbol}_${dateStr}_${interval}`;
  
  const response = await apiRequest<TimeSeriesResponse>(
    '/time_series',
    {
      symbol,
      interval,
      outputsize: outputsize.toString(),
    },
    cacheKey
  );
  
  // Transform and filter to only include data from the requested date during trading hours
  const allData = response.values.map(item => ({
    datetime: item.datetime,
    timestamp: new Date(item.datetime).getTime(),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    volume: parseFloat(item.volume),
  })).reverse();
  
  // Filter to only include candles from the specified date
  // and within trading hours (9:30 AM - 4:00 PM ET)
  return allData.filter(candle => {
    const candleDate = new Date(candle.timestamp);
    const candleYear = candleDate.getFullYear();
    const candleMonth = candleDate.getMonth();
    const candleDay = candleDate.getDate();
    
    // Check if the candle is from the requested date
    const isRequestedDate = (
      candleYear === date.getFullYear() &&
      candleMonth === date.getMonth() &&
      candleDay === date.getDate()
    );
    
    if (!isRequestedDate) return false;
    
    // Check if within trading hours (9:30 AM - 4:00 PM ET)
    const hours = candleDate.getHours();
    const minutes = candleDate.getMinutes();
    
    // Convert to Eastern Time (rough approximation)
    const etHours = (hours - 4 + 24) % 24; // Assuming UTC-4 for simplicity
    
    // Check if within trading hours (9:30 AM - 4:00 PM ET)
    return (
      (etHours === 9 && minutes >= 30) || // 9:30 AM or later
      (etHours > 9 && etHours < 16) ||     // 10 AM - 3:59 PM
      (etHours === 16 && minutes === 0)    // 4:00 PM exactly
    );
  });
};

// Search for symbols
export const searchSymbols = async (query: string): Promise<Array<{
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}>> => {
  const cacheKey = `symbol_search_${query}`;
  
  const response = await apiRequest<SymbolSearchResponse>(
    '/symbol_search',
    {
      symbol: query,
      outputsize: '10',
    },
    cacheKey
  );
  
  return response.data.map(item => ({
    symbol: item.symbol,
    name: item.instrument_name,
    exchange: item.exchange,
    type: item.type,
  }));
};

// Check market status (mock implementation as market_status endpoint seems to be unavailable)
export const checkMarketStatus = async (): Promise<{
  isOpen: boolean;
  timeToOpen?: string;
  timeToClose?: string;
}> => {
  // Get current time to determine if markets are open
  // US markets are typically open 9:30 AM - 4:00 PM ET on weekdays
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Check if it's a weekday
  const isWeekday = day >= 1 && day <= 5;
  
  // Convert to Eastern Time (rough approximation, ignoring DST for simplicity)
  // Assuming server is in UTC, Eastern Time is UTC-4 or UTC-5
  const etHour = (hour - 4 + 24) % 24; // Simplified to UTC-4 for summer
  
  // Check if within market hours (9:30 AM - 4:00 PM ET)
  const isMarketHours = (etHour > 9 || (etHour === 9 && minute >= 30)) && etHour < 16;
  
  const isOpen = isWeekday && isMarketHours;
  
  // Calculate time to open/close
  let timeToOpen, timeToClose;
  
  if (isOpen) {
    // Calculate time until 4:00 PM ET
    const minutesToClose = (15 - etHour) * 60 + (60 - minute);
    timeToClose = `${Math.floor(minutesToClose / 60)}h ${minutesToClose % 60}m`;
  } else if (isWeekday) {
    // If it's a weekday but markets are closed, calculate time until next open
    if (etHour < 9 || (etHour === 9 && minute < 30)) {
      // Calculate time until 9:30 AM today
      const minutesToOpen = (9 - etHour) * 60 + (30 - minute);
      timeToOpen = `${Math.floor(minutesToOpen / 60)}h ${minutesToOpen % 60}m`;
    } else {
      // After market hours, calculate time until 9:30 AM tomorrow
      const minutesToOpen = (24 - etHour + 9) * 60 + (30 - minute);
      timeToOpen = `${Math.floor(minutesToOpen / 60)}h ${minutesToOpen % 60}m`;
    }
  } else {
    // Calculate days until Monday
    const daysUntilMonday = day === 0 ? 1 : 8 - day;
    timeToOpen = `${daysUntilMonday}d`;
  }
  
  return {
    isOpen,
    timeToOpen: !isOpen ? timeToOpen : undefined,
    timeToClose: isOpen ? timeToClose : undefined,
  };
};
