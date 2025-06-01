// src/utils/dataResolution.ts
// Manages data resolution based on zoom level
// Fetches and aggregates data dynamically

import { CandlestickData, Timeframe } from '../models/ChartTypes';
import { fetchTimeSeries } from '../api/twelveDataApi';

export interface ResolutionConfig {
  timeframe: Timeframe;
  interval: string; // TwelveData API interval
  minCandles: number;
  maxCandles: number;
  label: string;
  fetchSize: number;
  daysPerCandle: number; // Approximate days per candle for data fetching
}

export interface InfiniteZoomState {
  zoomLevel: number;
  resolution: ResolutionConfig;
  isTransitioning: boolean;
  targetCandles: number;
}

export interface VisibleRange {
  startTime: Date;
  endTime: Date;
  minPrice: number;
  maxPrice: number;
}

// Define resolution levels from finest to coarsest
export const RESOLUTION_CONFIGS: ResolutionConfig[] = [
  // Tick-level data (would require websocket implementation)
  { timeframe: '1min', interval: '1min', minCandles: 1, maxCandles: 60, label: 'Tick', fetchSize: 500, daysPerCandle: 1/390 },
  
  // Intraday resolutions
  { timeframe: '1min', interval: '1min', minCandles: 60, maxCandles: 390, label: '1min', fetchSize: 500, daysPerCandle: 1/390 },
  { timeframe: '5min', interval: '5min', minCandles: 78, maxCandles: 156, label: '5min', fetchSize: 500, daysPerCandle: 1/78 },
  { timeframe: '15min', interval: '15min', minCandles: 52, maxCandles: 104, label: '15min', fetchSize: 500, daysPerCandle: 1/26 },
  { timeframe: '30min', interval: '30min', minCandles: 26, maxCandles: 52, label: '30min', fetchSize: 500, daysPerCandle: 1/13 },
  { timeframe: '1hour', interval: '1h', minCandles: 13, maxCandles: 26, label: '1hr', fetchSize: 500, daysPerCandle: 1/6.5 },
  
  // Daily and above
  { timeframe: 'daily', interval: '1day', minCandles: 20, maxCandles: 100, label: '1D', fetchSize: 500, daysPerCandle: 1 },
  { timeframe: 'weekly', interval: '1week', minCandles: 52, maxCandles: 156, label: '1W', fetchSize: 500, daysPerCandle: 7 },
  { timeframe: 'monthly', interval: '1month', minCandles: 12, maxCandles: 60, label: '1M', fetchSize: 500, daysPerCandle: 30 },
];

// Calculate the appropriate resolution based on visible candle count
export function getOptimalResolution(visibleCandleCount: number): ResolutionConfig {
  // Find the resolution that best fits the visible candle count
  for (let i = 0; i < RESOLUTION_CONFIGS.length; i++) {
    const config = RESOLUTION_CONFIGS[i];
    if (visibleCandleCount <= config.maxCandles) {
      return config;
    }
  }
  
  // Default to the coarsest resolution
  return RESOLUTION_CONFIGS[RESOLUTION_CONFIGS.length - 1];
}

// Cache for different resolutions of the same symbol
interface DataCache {
  [key: string]: {
    data: CandlestickData[];
    timestamp: number;
    resolution: string;
  };
}

const dataCache: DataCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get cache key for a symbol and resolution
function getCacheKey(symbol: string, resolution: string): string {
  return `${symbol}_${resolution}`;
}

// Fetch data with the appropriate resolution
export async function fetchDataWithResolution(
  symbol: string,
  visibleCandleCount: number,
  centerTimestamp?: number
): Promise<{ data: CandlestickData[]; resolution: ResolutionConfig }> {
  const resolution = getOptimalResolution(visibleCandleCount);
  const cacheKey = getCacheKey(symbol, resolution.timeframe);
  
  // Check cache first
  const now = Date.now();
  const cached = dataCache[cacheKey];
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return { data: cached.data, resolution };
  }
  
  // Fetch new data
  try {
    const data = await fetchTimeSeries(symbol, resolution.timeframe, resolution.fetchSize);
    
    // Update cache
    dataCache[cacheKey] = {
      data,
      timestamp: now,
      resolution: resolution.timeframe
    };
    
    return { data, resolution };
  } catch (error) {
    console.error('Failed to fetch data with resolution:', error);
    throw error;
  }
}

// Aggregate fine-grained data into coarser timeframes
export function aggregateCandles(
  candles: CandlestickData[],
  targetCandlesCount: number
): CandlestickData[] {
  if (candles.length <= targetCandlesCount) {
    return candles;
  }
  
  const aggregationFactor = Math.ceil(candles.length / targetCandlesCount);
  const aggregated: CandlestickData[] = [];
  
  for (let i = 0; i < candles.length; i += aggregationFactor) {
    const group = candles.slice(i, Math.min(i + aggregationFactor, candles.length));
    if (group.length === 0) continue;
    
    const aggregatedCandle: CandlestickData = {
      datetime: group[0].datetime,
      timestamp: group[0].timestamp,
      open: group[0].open,
      high: Math.max(...group.map(c => c.high)),
      low: Math.min(...group.map(c => c.low)),
      close: group[group.length - 1].close,
      volume: group.reduce((sum, c) => sum + c.volume, 0)
    };
    
    aggregated.push(aggregatedCandle);
  }
  
  return aggregated;
}

// Interpolate between data points for smooth transitions
export function interpolateCandles(
  candles: CandlestickData[],
  targetCount: number
): CandlestickData[] {
  if (candles.length >= targetCount || candles.length < 2) {
    return candles;
  }
  
  const interpolated: CandlestickData[] = [];
  const step = (candles.length - 1) / (targetCount - 1);
  
  for (let i = 0; i < targetCount; i++) {
    const position = i * step;
    const index = Math.floor(position);
    const fraction = position - index;
    
    if (index >= candles.length - 1) {
      interpolated.push(candles[candles.length - 1]);
    } else {
      const current = candles[index];
      const next = candles[index + 1];
      
      // Linear interpolation
      const interpolatedCandle: CandlestickData = {
        datetime: current.datetime,
        timestamp: Math.round(current.timestamp + fraction * (next.timestamp - current.timestamp)),
        open: current.open + fraction * (next.open - current.open),
        high: Math.max(current.high, next.high), // Use max for high
        low: Math.min(current.low, next.low),    // Use min for low
        close: current.close + fraction * (next.close - current.close),
        volume: Math.round(current.volume + fraction * (next.volume - current.volume))
      };
      
      interpolated.push(interpolatedCandle);
    }
  }
  
  return interpolated;
}

// Clear cache for a specific symbol or all symbols
export function clearDataCache(symbol?: string): void {
  if (symbol) {
    Object.keys(dataCache).forEach(key => {
      if (key.startsWith(symbol + '_')) {
        delete dataCache[key];
      }
    });
  } else {
    Object.keys(dataCache).forEach(key => delete dataCache[key]);
  }
}
