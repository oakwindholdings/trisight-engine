import axios from 'axios';
import { logDebug } from './debug';
import { CandlestickData } from '../models/ChartTypes';

const API_KEY = 'proxy-managed';
const BASE_URL = '/api/market/time_series';

export async function fetchPriceNDayChange(symbol: string, daysAgo: number): Promise<number> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - daysAgo);

    const params = {
      symbol,
      interval: '1day',
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      apikey: API_KEY
    };

    if (!API_KEY) {
      console.warn('[TwelveData] API key not configured, returning 0');
      return 0;
    }

    const { data } = await axios.get(BASE_URL, { params });
    
    if (!data.values || data.values.length < 2) {
      console.warn(`[TwelveData] Insufficient data for ${symbol} (${daysAgo}d change)`);
      return 0;
    }

    const prices = data.values.map((row: any) => parseFloat(row.close)).reverse();
    const pctChange = ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100;
    
    logDebug('DEBUG_DATA_FETCH', `${symbol} ${daysAgo}d change: ${pctChange.toFixed(2)}%`);
    return Math.round(pctChange * 100) / 100; // round to 2 decimal places
  } catch (error) {
    console.error(`[TwelveData] Error fetching ${daysAgo}d change for ${symbol}:`, error);
    return 0; // Fallback to 0 on error
  }
}

// Batch fetch multiple symbols for better performance
export async function fetchMultipleSymbolChanges(symbols: string[], daysAgo: number): Promise<Record<string, number>> {
  const results: Record<string, number> = {};
  
  // Process symbols in batches to avoid API rate limits
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(symbol => 
      fetchPriceNDayChange(symbol, daysAgo)
        .then(change => ({ symbol, change }))
        .catch(error => {
          console.error(`[TwelveData] Batch error for ${symbol}:`, error);
          return { symbol, change: 0 };
        })
    );
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ symbol, change }) => {
      results[symbol] = change;
    });
    
    // Add delay between batches to respect API rate limits
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

export async function fetchOHLCV(symbol: string, interval: string, count: number): Promise<CandlestickData[]> {
  try {
    const params = {
      symbol,
      interval,
      outputsize: count,
      apikey: API_KEY
    };
    const { data } = await axios.get(BASE_URL, { params });
    if (!data.values) return [];
    return data.values.reverse().map((row: any) => ({
      timestamp: new Date(row.datetime).getTime(),
      open: parseFloat(row.open),
      high: parseFloat(row.high),
      low: parseFloat(row.low),
      close: parseFloat(row.close),
      volume: parseInt(row.volume) || 0
    }));
  } catch (error) {
    console.error('[TwelveData] Error fetching OHLCV:', error);
    return [];
  }
}
