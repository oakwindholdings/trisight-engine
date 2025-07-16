// src/api/twelveDataApi.ts
// TwelveData HTTP client
// Fetches market data and symbols
import axios from 'axios';
import { CandlestickData, Timeframe } from '../models/ChartTypes';

// TwelveData API configuration
// Start with API key from environment variable but allow runtime override
let API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || '';

// Log initial API key state - only in development
if (process.env.NODE_ENV === 'development') {
  console.log('[TwelveData API] Initial API key from env:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'empty');
}

// Encryption helpers
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('saltysalt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    encoder.encode(data)
  );
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  return btoa(String.fromCharCode(...Array.from(combined)));
}

async function decrypt(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    data
  );
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

const PASSWORD = 'trisight-secret'; // In production, derive from user session

export const setApiKey = async (key: string) => {
  const derivedKey = await deriveKey(PASSWORD);
  const encryptedKey = await encrypt(key, derivedKey);
  localStorage.setItem('twelvedata_api_key_enc', encryptedKey);
  if (process.env.NODE_ENV === 'development') {
    console.log('[TwelveData API] Set encrypted key');
  }
  API_KEY = key; // Keep in memory
};

export const getApiKey = async () => {
  const stored = localStorage.getItem('twelvedata_api_key_enc');
  if (stored) {
    const derivedKey = await deriveKey(PASSWORD);
    API_KEY = await decrypt(stored, derivedKey);
  }
  if (process.env.NODE_ENV === 'development') {
    console.log('[TwelveData API] Got key:', API_KEY ? 'set' : 'empty');
  }
  return API_KEY;
};

const BASE_URL = 'https://api.twelvedata.com';
const MAX_REQUESTS_PER_MINUTE = 8;
const CACHE_EXPIRY = 60 * 1000; // 1 minute in milliseconds

// Request tracking for throttling
let requestTimestamps: number[] = [];

// Simple localStorage cache implementation
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
  retryCount = 3,
  signal?: AbortSignal
): Promise<T> => {
  // Check throttling
  if (!checkRequestThrottling()) {
    // Wait a bit and retry if we're being throttled
    await wait(5000);
    return apiRequest(endpoint, params, cacheKey, retryCount, signal);
  }

  try {
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('API key not found. Please add it to localStorage with key "twelvedata_api_key"');
    }

    const url = `${BASE_URL}${endpoint}`;
    const fullParams = { ...params, apikey: apiKey };
    
    // Add comprehensive logging
    console.log('[TwelveData API] Making request:', {
      endpoint,
      url,
      params: fullParams,
      cacheKey
    });
    
    // Build full URL with params for logging
    const fullUrl = `${url}?${new URLSearchParams({ ...params, apikey: 'YOUR_API_KEY_HIDDEN' }).toString()}`;
    console.log(`API Request URL: ${fullUrl}`);
    
    console.log('API call to endpoint:', endpoint, 'with params keys:', Object.keys(params));

    // Avoid logging full params if sensitive
    
    console.log(`Actual API URL: ${url}?${new URLSearchParams(fullParams).toString()}`);
    
    const response = await axios.get<T>(url, {
      params: fullParams,
      timeout: 10000, // 10 second timeout
      signal,
    });
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    
    const data = response.data;
    
    // Log raw response for debugging
    console.log('API Raw Response (first 500 chars):', JSON.stringify(data).substring(0, 500));
    
    // Handle API errors
    if ((data as Record<string, unknown>).status === 'error') {
      const errorMessage = (data as Record<string, unknown>).message || 'Unknown API error';
      console.error(`API Error: ${errorMessage}`);
      throw new Error(`TwelveData API Error: ${errorMessage}`);
    }
    
    // Check if response contains expected data structure
    // Symbol search endpoint returns {data: [...]} instead of {values: [...], meta: {...}}
    if (endpoint === '/symbol_search') {
      if (!(data as Record<string, unknown>).data) {
        console.error('Unexpected symbol search response structure:', data);
        throw new Error('Invalid symbol search response structure');
      }
    } else if (!(data as Record<string, unknown>).values && !(data as Record<string, unknown>).meta) {
      console.error('Unexpected API response structure:', data);
      throw new Error('Invalid API response structure');
    }
    
    // Cache successful responses
    if (cacheKey && data) {
      saveToCache(cacheKey, data);
    }

    return data as T;
  } catch (error: any) {
    if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
      console.log(`Request to ${endpoint} aborted`);
      return { data: [], status: 'aborted' } as T;
    }
    if (axios.isAxiosError(error) && error.response?.status === 429 && retryCount > 0) {
      const backoff = 1000 * Math.pow(2, 3 - retryCount);
      console.log(`Rate limited, backing off for ${backoff}ms`);
      await wait(backoff);
      return apiRequest(endpoint, params, cacheKey, retryCount - 1, signal);
    }
    console.error(`API request failed: ${endpoint}`, error);
    
    if (retryCount > 0) {
      console.log(`Retrying... (${retryCount} attempts left)`);
      await wait(2000);
      return apiRequest(endpoint, params, cacheKey, retryCount - 1, signal);
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
    mic_code?: string;
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
export const timeframeToInterval = (timeframe: Timeframe): string => {
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
  // Create start and end dates for the trading day
  const startDate = new Date(date);
  startDate.setHours(9, 30, 0, 0); // 9:30 AM
  
  const endDate = new Date(date);
  endDate.setHours(16, 0, 0, 0); // 4:00 PM
  
  // Use fetchCandlestickData with the specific date range
  const result = await fetchCandlestickData(symbol, '5min', startDate, endDate);
  
  return result;
};

// Fetch candlestick data with a specific interval
export const fetchCandlestickData = async (
  symbol: string,
  interval: string,
  start: Date,
  end: Date
): Promise<CandlestickData[]> => {
  // Format dates based on interval type
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // For daily/weekly/monthly intervals, use date-only format
    if (interval === '1day' || interval === '1week' || interval === '1month') {
      return `${year}-${month}-${day}`;
    }
    
    // For intraday intervals, include time
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  
  console.log(`[fetchCandlestickData] Called with:`, {
    symbol,
    interval,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    startStr,
    endStr
  });

  const cacheKey = `candlestick_${symbol}_${interval}_${start.getTime()}_${end.getTime()}`;
  
  const params = {
    symbol,
    interval,
    start_date: startStr,
    end_date: endStr,
    format: 'JSON',
    timezone: 'America/New_York'
  };
  
  console.log(`[fetchCandlestickData] Requesting:`, {
    symbol,
    interval,
    start_date: startStr,
    end_date: endStr,
    timezone: 'America/New_York'
  });
  
  const response = await apiRequest<TimeSeriesResponse>(
    '/time_series',
    params,
    cacheKey
  );
  
  console.log(`[fetchCandlestickData] Response metadata:`, {
    symbol: response.meta?.symbol,
    interval: response.meta?.interval,
    requestedInterval: interval,
    mismatch: response.meta?.interval !== interval,
    valuesCount: response.values?.length || 0
  });
  
  console.log(`fetchCandlestickData response: ${response.values?.length || 0} candles`);
  
  if (!response.values || response.values.length === 0) {
    return [];
  }
  
  console.log(`[fetchCandlestickData] API Response for ${interval}:`, {
    status: response.status,
    metaInfo: response.meta,
    valuesCount: response.values?.length || 0,
    firstThreeValues: response.values?.slice(0, 3)
  });
  
  // Parse the response
  const candles = response.values.map(item => ({
    datetime: item.datetime,
    timestamp: new Date(item.datetime).getTime(),
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.close),
    volume: parseFloat(item.volume),
  })).reverse();
  
  // Log first few candles for daily interval
  if (interval === '1day') {
    console.log(`[fetchCandlestickData] DAILY INTERVAL DEBUG:`, {
      requestedInterval: interval,
      apiResponseInterval: response.meta?.interval,
      firstFiveCandles: candles.slice(0, 5).map(c => ({
        datetime: c.datetime,
        timestamp: new Date(c.datetime).getTime(),
        date: new Date(c.datetime).toLocaleDateString(),
        time: new Date(c.datetime).toLocaleTimeString(),
        close: c.close
      }))
    });
    
    // Check if we're getting hourly data instead of daily
    if (candles.length > 1) {
      const timeDiff = new Date(candles[1].datetime).getTime() - new Date(candles[0].datetime).getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      console.log(`[fetchCandlestickData] Time difference between first two candles: ${hoursDiff} hours`);
      if (hoursDiff < 24) {
        console.error(`[fetchCandlestickData] WARNING: Requested daily candles but got ${hoursDiff}-hour candles!`);
      }
    }
  }
  
  return candles;
};

// Search for symbols
export const searchSymbols = async (query: string, signal?: AbortSignal): Promise<Array<{
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
    cacheKey,
    3,
    signal
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
