// src/utils/compressedTimeScale.ts
// Time scale skipping gaps
// Compresses non-trading hours
import { scaleTime } from 'd3-scale';
import { min, max, extent } from 'd3-array';
import { CandlestickData } from '../models/ChartTypes';
import { isDuringTradingHours } from './marketHours';

// Define a custom scale type that will handle our compressed time
interface CompressedTimeScale {
  (date: Date): number;
  domain(): [Date, Date];
  domain(domain: [Date, Date]): CompressedTimeScale;
  range(): [number, number];
  range(range: [number, number]): CompressedTimeScale;
  nice(): CompressedTimeScale;
  copy(): CompressedTimeScale;
  scale(date: Date): number;
  invert(pixel: number): Date; // Add this to match TimeScaleType
  ticks(count?: number): Date[];
  tickFormat(count?: number, specifier?: string): (date: Date) => string;
}

/**
 * Creates a custom domain mapping that compresses time by 
 * removing gaps for non-trading hours
 * 
 * @param data Original candlestick data
 * @returns Array of [original timestamp, compressed timestamp] pairs
 */
export function createCompressedTimestamps(data: CandlestickData[]): [number, number][] {
  if (data.length === 0) return [];
  
  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  // Array to hold [original, compressed] timestamp pairs
  const timestampPairs: [number, number][] = [];
  
  // Start with the first timestamp
  let compressedTime = sortedData[0].timestamp;
  timestampPairs.push([sortedData[0].timestamp, compressedTime]);
  
  // Process the rest of the timestamps
  for (let i = 1; i < sortedData.length; i++) {
    const current = sortedData[i];
    const prev = sortedData[i - 1];
    
    const currentDate = new Date(current.timestamp);
    const prevDate = new Date(prev.timestamp);
    
    // Is this a trading hours transition?
    const currentIsTradingHours = isDuringTradingHours(currentDate);
    const prevIsTradingHours = isDuringTradingHours(prevDate);
    
    // Real time difference
    const realDiff = current.timestamp - prev.timestamp;
    
    // Apply aggressive compression to non-trading hours
    // This is the key parameter that controls how much we compress non-trading hours
    const COMPRESSION_FACTOR = 50; // Higher value means more compression
    
    if (currentIsTradingHours && prevIsTradingHours) {
      // Both in trading hours - keep the real time difference
      compressedTime += realDiff;
    } else if (!currentIsTradingHours && !prevIsTradingHours) {
      // Both outside trading hours - compress significantly
      compressedTime += Math.max(realDiff / COMPRESSION_FACTOR, 60 * 1000); // At least 1 minute
    } else {
      // Transition between trading/non-trading - add a small gap
      compressedTime += Math.max(realDiff / (COMPRESSION_FACTOR / 5), 5 * 60 * 1000); // At least 5 minutes
    }
    
    timestampPairs.push([current.timestamp, compressedTime]);
  }
  
  return timestampPairs;
}

/**
 * Creates a scale that maps original timestamps to compressed timestamps
 * 
 * @param data Original candlestick data
 * @param range Output pixel range
 * @param compressed Whether to use compressed time (remove non-trading gaps)
 */
export function createTimeScaleWithCompression(
  data: CandlestickData[],
  range: [number, number],
  compressed: boolean = false
): CompressedTimeScale {
  if (data.length === 0) {
    // Default scale if no data
    return scaleTime()
      .domain([new Date(), new Date()])
      .range(range);
  }
  
  // If not using compression, create a regular time scale
  if (!compressed) {
    const dates = data.map(d => new Date(d.timestamp));
    const timeExtent = extent(dates) as [Date, Date];
    
    return scaleTime()
      .domain(timeExtent)
      .range(range)
      .nice();
  }
  
  // Create the compressed timestamps
  const timestampPairs = createCompressedTimestamps(data);
  
  // Find min/max compressed timestamps
  const minCompressed = min(timestampPairs, (d: [number, number]) => d[1]) || 0;
  const maxCompressed = max(timestampPairs, (d: [number, number]) => d[1]) || 0;
  
  // Create the scale using compressed timestamps
  const scale = scaleTime()
    .domain([new Date(minCompressed), new Date(maxCompressed)])
    .range(range)
    .nice();
  
  // Create a lookup map for faster access
  const timestampMap = new Map<number, number>();
  timestampPairs.forEach(([original, compressed]) => {
    timestampMap.set(original, compressed);
  });
  
  // Return a wrapped scale that maps through our compression
  return {
    ...scale,
    // Override the scale method to use our compressed mapping
    scale: function(date: Date): number {
      const originalTimestamp = date.getTime();
      const compressedTimestamp = timestampMap.get(originalTimestamp) || originalTimestamp;
      return scale(new Date(compressedTimestamp));
    },
    // Add invert method to fulfill the TimeScaleType interface
    invert: function(pixel: number): Date {
      // Use the base scale's invert method
      return scale.invert(pixel);
    }
  } as CompressedTimeScale;
}
