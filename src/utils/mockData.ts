// src/utils/mockData.ts
// Mock market data for testing chart rendering
// Provides sample candlestick data when API is unavailable

import { CandlestickData } from '../models/ChartTypes';

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
  console.log('[MockData] Generating 200 mock candles for testing');
  return generateMockCandlestickData(200);
};
