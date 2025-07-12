// src/utils/mockData.ts
// Mock market data generator for testing and fallback scenarios
// NOTE: Debug channel support - DEBUG_DATA_FETCH

import { CandlestickData } from '../models/ChartTypes';
import { logDebug } from './debug';

export const generateMockCandlestickData = (count: number = 100): CandlestickData[] => {
  const now = new Date();
  const data: CandlestickData[] = [];
  
  // Start from 'count' periods ago
  const startTime = new Date(now.getTime() - count * 5 * 60 * 1000); // 5 minutes per candle
  
  let prevClose = 150; // Starting price
  
  for (let i = 0; i < count; i++) {
    const time = new Date(startTime.getTime() + i * 5 * 60 * 1000);
    
    // Generate realistic price movements
    const change = (Math.random() - 0.5) * 2; // +/- $1 change
    const open = prevClose;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 500000;
    
    data.push({
      datetime: time.toISOString(),
      timestamp: time.getTime(),
      open,
      high,
      low,
      close,
      volume
    });
    
    prevClose = close;
  }
  
  return data;
};

export const getMockMarketData = (): CandlestickData[] => {
  logDebug('DEBUG_DATA_FETCH', '[MockData] Generating 200 mock candles for testing');
  return generateMockCandlestickData(200);
};
