// src/utils/sequentialScale.ts
// Sequential scale for contiguous chart display
// Maps data indices to pixel positions without time gaps
import { scaleLinear } from 'd3-scale';
import { CandlestickData } from '../models/ChartTypes';

interface SequentialTimeScale {
  scale: (date: Date) => number;
  invert: (pixel: number) => Date;
  ticks: (count?: number) => Date[];
}

/**
 * Creates a sequential scale that maps candlesticks to positions
 * based on their index rather than their timestamp, ensuring
 * contiguous display without any gaps
 */
export function createSequentialTimeScale(
  width: number,
  data: CandlestickData[],
  pixelRange: [number, number] = [0, width]
): SequentialTimeScale {
  // Create a map from timestamp to index
  const timestampToIndex: Map<number, number> = new Map<number, number>();
  const indexToTimestamp: Map<number, number> = new Map<number, number>();
  
  data.forEach((candle, index) => {
    timestampToIndex.set(candle.timestamp, index);
    indexToTimestamp.set(index, candle.timestamp);
  });
  
  // Create a linear scale based on indices
  const indexScale = scaleLinear()
    .domain([0, Math.max(0, data.length - 1)])
    .range(pixelRange);
  
  return {
    // Map a date to a pixel position using its index
    scale: (date: Date): number => {
      const timestamp = date.getTime();
      const index = timestampToIndex.get(timestamp);
      
      if (index === undefined) {
        // If exact timestamp not found, find the closest one
        let closestIndex = 0;
        let minDiff = Infinity;
        
        for (let i = 0; i < data.length; i++) {
          const diff = Math.abs(data[i].timestamp - timestamp);
          if (diff < minDiff) {
            minDiff = diff;
            closestIndex = i;
          }
        }
        
        return indexScale(closestIndex);
      }
      
      return indexScale(index);
    },
    
    // Map a pixel position back to a date
    invert: (pixel: number): Date => {
      const index = Math.round(indexScale.invert(pixel));
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      const timestamp = indexToTimestamp.get(clampedIndex) || Date.now();
      return new Date(timestamp);
    },
    
    // Generate evenly spaced tick marks based on indices
    ticks: (count: number = 10): Date[] => {
      const tickIndices = indexScale.ticks(count);
      return tickIndices
        .map((i: number) => {
          const index = Math.round(i);
          if (index >= 0 && index < data.length) {
            return new Date(data[index].timestamp);
          }
          return null;
        })
        .filter(isNotNull);
    }
  };
}

function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

/**
 * Creates a sequential scale for a visible range of data
 * This is used when panning/zooming to maintain contiguous display
 */
export function createSequentialTimeScaleForRange(
  width: number,
  data: CandlestickData[],
  startIndex: number,
  endIndex: number,
  pixelRange: [number, number] = [0, width]
): SequentialTimeScale {
  // Extract the visible portion of data
  const visibleData = data.slice(startIndex, endIndex + 1);
  
  // Create scale for the visible data
  return createSequentialTimeScale(width, visibleData, pixelRange);
}
