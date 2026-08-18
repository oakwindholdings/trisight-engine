// src/utils/supabase/marketDataService.ts
// Service layer for market data with server-side (Postgres-backed REST API) caching
// Implements cache-first strategy with TwelveData fallback

import { OHLCVData, ApiCacheStatus, INTERVAL_MAP, IntervalKey } from './types';
import { CandlestickData } from '../../models/ChartTypes';
import { logDebug } from '../debug';

// TwelveData API configuration
const MARKET_API_BASE = '/api/market';

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
 * Thin fetch wrapper for the /api/data endpoints. Mirrors the old supabaseQuery
 * shape ({ data, error }) so callers below didn't need to change their branching.
 */
async function apiRequest<T = any>(
  path: string,
  init?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const response = await fetch(path, {
      ...init,
      headers: init?.body
        ? { 'Content-Type': 'application/json', ...(init?.headers || {}) }
        : init?.headers,
    });
    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message = (json && (json as any).error) || `Request failed with status ${response.status}`;
      return { data: null, error: message };
    }

    return { data: json ? (json as any).data : null, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : String(error) };
  }
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
  // Check cache status
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
  });

  const { data: cacheStatus, error } = await apiRequest<ApiCacheStatus | null>(
    `/api/data/cache-status?${params.toString()}`
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
 * Fetch data from server cache
 */
export async function fetchFromCache(
  symbol: string,
  interval: string,
  startDate: Date,
  endDate: Date
): Promise<CandlestickData[]> {
  logDebug('DEBUG_DATA_FETCH', 'fetchFromCache called:', { symbol, interval, startDate, endDate });

  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  });

  const { data, error } = await apiRequest<OHLCVData[]>(`/api/data/ohlcv?${params.toString()}`);

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
  const params = new URLSearchParams({
    symbol: symbol.toUpperCase(),
    interval,
    start_date: startDate.toISOString().split('T')[0],
    format: 'JSON',
    outputsize: '5000', // Maximum allowed
  });

  if (endDate) {
    params.append('end_date', endDate.toISOString().split('T')[0]);
  }

  const url = `${MARKET_API_BASE}/time_series?${params}`;
  logDebug('DEBUG_DATA_FETCH', `Fetching from TwelveData: ${url}`);

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
 * Store fetched data in the server cache
 */
async function storeInCache(
  symbol: string,
  interval: string,
  data: CandlestickData[]
): Promise<void> {
  logDebug('DEBUG_DATA_FETCH', 'storeInCache called:', { symbol, interval, dataLength: data.length });

  if (data.length === 0) {
    logDebug('DEBUG_DATA_FETCH', 'No data to store');
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

  logDebug('DEBUG_DATA_FETCH', `Prepared ${ohlcvData.length} records for insertion`);
  logDebug('DEBUG_DATA_FETCH', 'Sample record:', ohlcvData[0]);

  // In storeInCache, chunk ohlcvData into batches of 100 and insert with retries.
  const batchSize = 100;
  for (let i = 0; i < ohlcvData.length; i += batchSize) {
    const batch = ohlcvData.slice(i, i + batchSize);
    await insertWithRetry(batch);
  }

  // Update cache status
  const timestamps = data.map(d => d.timestamp); // Already Unix timestamps
  const firstTimestamp = new Date(Math.min(...timestamps));
  const lastTimestamp = new Date(Math.max(...timestamps));

  await apiRequest('/api/data/cache-status', {
    method: 'POST',
    body: JSON.stringify({
      symbol: symbol.toUpperCase(),
      interval,
      first_timestamp: firstTimestamp.toISOString(),
      last_timestamp: lastTimestamp.toISOString(),
      last_fetch_at: new Date().toISOString(),
      fetch_count: 1,
      is_complete: false, // Will be set to true when we have all historical data
    }),
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
    logDebug('DEBUG_DATA_FETCH', 'Returning data from cache');
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

    logDebug('DEBUG_DATA_FETCH', `Returning ${uniqueData.length} unique data points`);
    return uniqueData;
  } catch (error) {
    console.error('Error fetching from TwelveData:', error);

    // Fall back to cache if available
    if (cacheStatus.hasData) {
      logDebug('DEBUG_DATA_FETCH', 'Falling back to cached data');
      return fetchFromCache(symbol, interval, startDate, endDate);
    }

    throw error;
  }
}

/**
 * Get cached symbols list
 *
 * NOTE: the /api/data/cache-status endpoint requires both `symbol` and `interval`
 * query params (the server 400s without them) — there is no REST route exposed
 * that lists distinct cached symbols across the whole table the way the old
 * unfiltered Supabase `.select('symbol')` query did. Preserved as a safe no-op
 * (matching the previous "not configured" fallback of returning []) until a
 * dedicated listing endpoint exists server-side.
 */
export async function getCachedSymbols(): Promise<string[]> {
  try {
    const res = await fetch('/api/data/cached-symbols');
    if (!res.ok) return [];
    const body = await res.json();
    return Array.isArray(body.data) ? body.data : [];
  } catch {
    return [];
  }
}

/**
 * Clear cache for a specific symbol
 */
export async function clearSymbolCache(symbol: string): Promise<void> {
  // Server deletes ohlcv_data, api_cache_status, and pattern_cache rows for the symbol in one call.
  await apiRequest(`/api/data/cache/${encodeURIComponent(symbol.toUpperCase())}`, {
    method: 'DELETE',
  });
}

async function insertWithRetry(batch: any[]) {
  let tries = 3;
  while (tries--) {
    try {
      const { error } = await apiRequest('/api/data/ohlcv/batch', {
        method: 'POST',
        body: JSON.stringify(batch),
      });
      if (error) throw new Error(error);
      return;
    } catch (e) {
      if (tries) await new Promise(r => setTimeout(r, 1000));
      else throw e;
    }
  }
}
