import { scaleTime } from 'd3-scale';
import { extent } from 'd3-array';
import { filterTradingHoursData } from './marketHours';
import { CandlestickData } from '../models/ChartTypes';

/**
 * Creates a time scale that properly handles trading hours
 * @param data The candlestick data
 * @param range The pixel range to map to
 * @param showOnlyTradingHours Whether to skip non-trading hours
 */
// Define our own interface for time scale to avoid d3 type issues
export interface TimeScale {
  (date: Date): number;
  domain(): [Date, Date];
  domain(domain: [Date, Date]): TimeScale;
  range(): [number, number];
  range(range: [number, number]): TimeScale;
  nice(): TimeScale;
  copy(): TimeScale;
  ticks(count?: number): Date[];
  tickFormat(count?: number, specifier?: string): (date: Date) => string;
  invert(pixel: number): Date;
}

export function createTradingTimeScale(
  data: CandlestickData[],
  range: [number, number],
  showOnlyTradingHours: boolean
): TimeScale {
  if (data.length === 0) {
    // Default scale if no data
    return scaleTime()
      .domain([new Date(), new Date()])
      .range(range);
  }

  // Filter data if needed
  const filteredData = showOnlyTradingHours 
    ? filterTradingHoursData(data)
    : data;
  
  // Get time domain from data
  const timeExtent = extent(filteredData, (d: { timestamp: number }) => new Date(d.timestamp)) as [Date, Date];
  
  // Create the scale
  return scaleTime()
    .domain(timeExtent)
    .range(range)
    .nice();
}
