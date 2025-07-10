// src/utils/supabase/marketDataService.ts
// Service layer for market data with Supabase caching
// Implements cache-first strategy with TwelveData fallback

import { supabase, supabaseQuery, batchInsertOHLCV, isSupabaseConfigured } from './client';
import { OHLCVData, ApiCacheStatus, INTERVAL_MAP, IntervalKey } from './types';
import { CandlestickData } from '../../models/ChartTypes';

// TwelveData API configuration
const TWELVE_DATA_API_KEY = process.env.REACT_APP_TWELVE_DATA_API_KEY || '';
const TWELVE_DATA_BASE_URL = 'https://api.twelvedata.com';

interface FetchOptions {
  symbol: string;
  interval: IntervalKey | string;
  startDate: Date;
  endDate: Date;
  forceRefresh?: boolean;
}

interface CacheCheckResult {
  hasData: boolean;
  isComplete: boolean;
  lastTimestamp?: Date;
  firstTimestamp?: Date;
  needsUpdate: boolean;
}

/**
 * Check if we have cached data for the requested symbol/interval/date range
 */
async function checkCacheStatus(
  symbol: string,
  interval: string,
  startDate: Date,
  endDate: Date
): Promise<CacheCheckResult> {
  if (!isSupabaseConfigured()) {
    return { hasData: false, isComplete: false, needsUpdate: true };
  }

  // Check cache status
  const { data: cacheStatus, error } = await supabaseQuery<ApiCacheStatus>(() =>
    supabase
      .from('api_cache_status')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .eq('interval', interval)
      .single()
  );

  if (error || !cacheStatus) {
    return { hasData: false, isComplete: false, needsUpdate: true };
  }

  const firstTimestamp = new Date(cacheStatus.first_timestamp);
  const lastTimestamp = new Date(cacheStatus.last_timestamp);

  // Check if we have data covering the requested range
  const hasStartData = firstTimestamp <= startDate;
  const hasEndData = lastTimestamp >= endDate;
  const hasData = hasStartData && hasEndData;

  // Check if we need to update (data older than 1 day for daily, 1 hour for intraday)
  const now = new Date();
  const lastFetch = new Date(cacheStatus.last_fetch_at);
  const hoursSinceLastFetch = (now.getTime() - lastFetch.getTime()) / (1000 * 60 * 60);
  
  const needsUpdate = interval === '1day' 
    ? hoursSinceLastFetch > 24 
    : hoursSinceLastFetch > 1;

  return {
    hasData,
    isComplete: cacheStatus.is_complete,
    lastTimestamp,
    firstTimestamp,
    needsUpdate: needsUpdate && !cacheStatus.is_complete,
  };
}

/**
 * Fetch data from Supabase cache
 */
export async function fetchFromCache(
  symbol: string,
  interval: string,
  startDate: Date,
  endDate: Date
): Promise<CandlestickData[]> {
  console.log('[DEBUG_SUPABASE] fetchFromCache called:', { symbol, interval, startDate, endDate });
  const { data, error } = await supabaseQuery<OHLCVData[]>(() =>
    supabase
      .from('ohlcv_data')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .eq('interval', interval)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true })
  );

  if (error || !data) {
    console.error('Error fetching from cache:', error);
    return [];
  }

  return data.map(row => {
    const date = new Date(row.timestamp);
    return {
      datetime: row.timestamp, // Use ISO string from DB
      timestamp: date.getTime(), // Convert to Unix timestamp
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
      ha_open: row.ha_open ? Number(row.ha_open) : undefined,
      ha_high: row.ha_high ? Number(row.ha_high) : undefined,
      ha_low: row.ha_low ? Number(row.ha_low) : undefined,
      ha_close: row.ha_close ? Number(row.ha_close) : undefined,
    };
  });
}

/**
 * Fetch data from TwelveData API
 */
async function fetchFromTwelveData(
  symbol: string,
  interval: string,
  startDate: Date,
  endDate?: Date
): Promise<CandlestickData[]> {
  if (!TWELVE_DATA_API_KEY) {
    throw new Error('TwelveData API key not configured');
  }

  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    apikey: TWELVE_DATA_API_KEY,
    start_date: startDate.toISOString().split('T')[0],
    format: 'JSON',
    outputsize: '5000', // Maximum allowed
  });

  if (endDate) {
    params.append('end_date', endDate.toISOString().split('T')[0]);
  }

  const url = `${TWELVE_DATA_BASE_URL}/time_series?${params}`;
  console.log('Fetching from TwelveData:', url);

  const response = await fetch(url);
  const data = await response.json();

  if (data.status === 'error' || data.code) {
    throw new Error(data.message || 'TwelveData API error');
  }

  if (!data.values || !Array.isArray(data.values)) {
    return [];
  }

  return data.values
    .map((candle: any) => ({
      datetime: candle.datetime,
      timestamp: new Date(candle.datetime).getTime(),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseInt(candle.volume, 10),
    }))
    .reverse(); // TwelveData returns newest first, we want oldest first
}

/**
 * Store fetched data in Supabase
 */
async function storeInCache(
  symbol: string,
  interval: string,
  data: CandlestickData[]
): Promise<void> {
  console.log('[DEBUG_SUPABASE] storeInCache called:', { symbol, interval, dataLength: data.length });
  
  if (!isSupabaseConfigured()) {
    console.error('[DEBUG_SUPABASE] Supabase not configured, skipping cache storage');
    return;
  }
  
  if (data.length === 0) {
    console.log('[DEBUG_SUPABASE] No data to store');
    return;
  }

  // Prepare data for insertion
  const ohlcvData = data.map(candle => ({
    symbol: symbol.toUpperCase(),
    interval,
    timestamp: new Date(candle.timestamp).toISOString(),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
  }));

  console.log('[DEBUG_SUPABASE] Prepared', ohlcvData.length, 'records for insertion');
  console.log('[DEBUG_SUPABASE] Sample record:', ohlcvData[0]);
  
  // Batch insert with upsert to handle duplicates
  const results = await batchInsertOHLCV(ohlcvData);
  
  const failedBatches = results.filter(r => !r.success);
  if (failedBatches.length > 0) {
    console.error('[DEBUG_SUPABASE] Failed to insert some batches:', failedBatches);
  } else {
    console.log('[DEBUG_SUPABASE] All batches inserted successfully');
  }

  // Update cache status
  const timestamps = data.map(d => d.timestamp); // Already Unix timestamps
  const firstTimestamp = new Date(Math.min(...timestamps));
  const lastTimestamp = new Date(Math.max(...timestamps));

  await supabase
    .from('api_cache_status')
    .upsert({
      symbol: symbol.toUpperCase(),
      interval,
      first_timestamp: firstTimestamp.toISOString(),
      last_timestamp: lastTimestamp.toISOString(),
      last_fetch_at: new Date().toISOString(),
      fetch_count: 1,
      is_complete: false, // Will be set to true when we have all historical data
    }, {
      onConflict: 'symbol,interval',
    });
}

/**
 * Main function to fetch market data with caching
 */
export async function fetchMarketData(options: FetchOptions): Promise<CandlestickData[]> {
  const { symbol, interval: rawInterval, startDate, endDate, forceRefresh = false } = options;
  
  // Normalize interval
  const interval = INTERVAL_MAP[rawInterval as IntervalKey] || rawInterval;

  // Check cache status
  const cacheStatus = await checkCacheStatus(symbol, interval, startDate, endDate);

  // If we have complete data and don't need update, return from cache
  if (cacheStatus.hasData && !cacheStatus.needsUpdate && !forceRefresh) {
    console.log('Returning data from cache');
    return fetchFromCache(symbol, interval, startDate, endDate);
  }

  // Determine what data we need to fetch
  let fetchStartDate = startDate;
  let cachedData: CandlestickData[] = [];

  if (cacheStatus.hasData && cacheStatus.lastTimestamp && !forceRefresh) {
    // Incremental update: fetch only new data
    fetchStartDate = new Date(cacheStatus.lastTimestamp.getTime() + 1);
    cachedData = await fetchFromCache(symbol, interval, startDate, cacheStatus.lastTimestamp);
    
    if (fetchStartDate >= endDate) {
      // All requested data is already cached
      return cachedData;
    }
  }

  try {
    // Fetch new data from TwelveData
    const newData = await fetchFromTwelveData(symbol, interval, fetchStartDate, endDate);
    
    // Store in cache
    if (newData.length > 0) {
      await storeInCache(symbol, interval, newData);
    }

    // Combine cached and new data
    const combinedData = [...cachedData, ...newData];

    // Filter out any data outside requested range
    const filteredData = combinedData.filter(d => 
      d.timestamp >= startDate.getTime() && 
      d.timestamp <= endDate.getTime()
    );
    
    // Sort by timestamp
    filteredData.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove duplicates (prefer newer data)
    const uniqueData = filteredData.reduce((acc, curr) => {
      const existing = acc.find(d => d.timestamp === curr.timestamp);
      if (!existing) {
        acc.push(curr);
      }
      return acc;
    }, [] as CandlestickData[]);

    console.log('[DEBUG_SUPABASE] Returning', uniqueData.length, 'unique data points');
    return uniqueData;
  } catch (error) {
    console.error('Error fetching from TwelveData:', error);
    
    // Fall back to cache if available
    if (cacheStatus.hasData) {
      console.log('Falling back to cached data');
      return fetchFromCache(symbol, interval, startDate, endDate);
    }
    
    throw error;
  }
}

/**
 * Get cached symbols list
 */
export async function getCachedSymbols(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data } = await supabaseQuery<{ symbol: string }[]>(() =>
    supabase
      .from('api_cache_status')
      .select('symbol')
      .order('symbol')
  );

  return data ? Array.from(new Set(data.map(item => item.symbol))) : [];
}

/**
 * Clear cache for a specific symbol
 */
export async function clearSymbolCache(symbol: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  // Delete OHLCV data
  await supabase
    .from('ohlcv_data')
    .delete()
    .eq('symbol', symbol.toUpperCase());

  // Delete cache status
  await supabase
    .from('api_cache_status')
    .delete()
    .eq('symbol', symbol.toUpperCase());

  // Delete patterns
  await supabase
    .from('pattern_cache')
    .delete()
    .eq('symbol', symbol.toUpperCase());
}
