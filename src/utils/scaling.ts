// src/utils/scaling.ts
// Chart scale utilities
// Builds time and price scales
import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import { CandlestickData } from '../models/ChartTypes';

/**
 * Creates a time scale for mapping dates to x-axis pixel positions
 */
export function createTimeScale(
  canvasWidth: number,
  dataRange: [Date, Date],
  pixelRange: [number, number] = [0, canvasWidth]
): {
  scale: (date: Date) => number;
  invert: (pixel: number) => Date;
  ticks: (count?: number) => Date[];
} {
  // Create the D3 time scale
  const scale = d3Scale.scaleTime()
    .domain(dataRange)
    .range(pixelRange)
    .clamp(true);

  return {
    // Maps a date to a pixel position
    scale: (date: Date): number => scale(date),
    
    // Maps a pixel position back to a date
    invert: (pixel: number): Date => scale.invert(pixel),
    
    // Generate evenly spaced tick marks
    ticks: (count = 10): Date[] => scale.ticks(count)
  };
}

/**
 * Creates a custom band scale for discrete x-axis values in the chart
 */
export function createBandScale(
  canvasWidth: number,
  dataLength: number,
  pixelRange: [number, number] = [0, canvasWidth]
) {
  const scale = d3Scale.scaleBand()
    .domain(Array.from({ length: dataLength }, (_, i) => i.toString()))
    .range(pixelRange)
    .paddingInner(0.2)
    .paddingOuter(0.3);

  return {
    scale: (index: number): number => {
      const position = scale(index.toString());
      return position !== undefined ? position : 0;
    },
    bandwidth: (): number => scale.bandwidth()
  };
}

/**
 * Creates a price scale for mapping prices to y-axis pixel positions
 */
export function createPriceScale(
  canvasHeight: number,
  priceRange: [number, number],
  pixelRange: [number, number] = [canvasHeight, 0],
  logScale: boolean = false
): {
  scale: (price: number) => number;
  invert: (pixel: number) => number;
  ticks: (count?: number) => number[];
} {
  // Either create a linear or logarithmic scale based on the logScale parameter
  const scale = logScale
    ? d3Scale.scaleLog()
        .domain([Math.max(0.1, priceRange[0]), priceRange[1]])
        .range(pixelRange)
        .clamp(true)
    : d3Scale.scaleLinear()
        .domain(priceRange)
        .range(pixelRange)
        .clamp(true);

  return {
    // Maps a price to a pixel position
    scale: (price: number): number => scale(price),
    
    // Maps a pixel position back to a price
    invert: (pixel: number): number => scale.invert(pixel),
    
    // Generate evenly spaced tick marks
    ticks: (count = 5): number[] => scale.ticks(count)
  };
}

/**
 * Calculates the visible range of data based on the current view
 */
export function calculateVisibleRange(
  data: Array<{ timestamp: number; high: number; low: number }>,
  startIndex: number,
  endIndex: number
): {
  startTime: Date;
  endTime: Date;
  minPrice: number;
  maxPrice: number;
} {
  if (data.length === 0 || startIndex >= data.length || endIndex < 0) {
    return {
      startTime: new Date(),
      endTime: new Date(),
      minPrice: 0,
      maxPrice: 100
    };
  }

  // Ensure indices are within bounds
  const validStartIndex = Math.max(0, startIndex);
  const validEndIndex = Math.min(data.length - 1, endIndex);

  // Extract visible data
  const visibleData = data.slice(validStartIndex, validEndIndex + 1);

  // Calculate time range
  const startTime = new Date(visibleData[0].timestamp);
  const endTime = new Date(visibleData[visibleData.length - 1].timestamp);

  // Calculate price range with padding
  const minPrice = d3Array.min(visibleData, (d: { low: number }) => d.low) || 0;
  const maxPrice = d3Array.max(visibleData, (d: { high: number }) => d.high) || 100;
  
  // Add padding to price range (5% on top and bottom)
  const pricePadding = (maxPrice - minPrice) * 0.05;
  
  return {
    startTime,
    endTime,
    minPrice: Math.max(0, minPrice - pricePadding),
    maxPrice: maxPrice + pricePadding
  };
}

/**
 * Helper function to get domain extent from data
 */
export function getDataExtent<T extends { timestamp: number }>(data: T[]): [Date, Date] {
  if (data.length === 0) {
    const now = new Date();
    return [now, now];
  }
  
  const timestamps = data.map(item => new Date(item.timestamp));
  const minTime = d3Array.min(timestamps) || new Date();
  const maxTime = d3Array.max(timestamps) || new Date();
  
  return [minTime, maxTime];
}

/**
 * Creates a special time scale that collapses non-trading hours
 */
export function createTradingHoursTimeScale(
  canvasWidth: number,
  data: CandlestickData[],
  pixelRange: [number, number] = [0, canvasWidth],
  showOnlyTradingHours: boolean = false
): {
  scale: (date: Date) => number;
  invert: (pixel: number) => Date;
  ticks: (count?: number) => Date[];
} {
  // If we're showing only trading hours, filter the data
  const filteredData = showOnlyTradingHours ? data : data;
  
  // If there's no data after filtering, return a default scale
  if (filteredData.length === 0) {
    const now = new Date();
    const scale = d3Scale.scaleTime()
      .domain([now, now])
      .range(pixelRange);
      
    return {
      scale: (date: Date): number => scale(date),
      invert: (pixel: number): Date => scale.invert(pixel),
      ticks: (count = 10): Date[] => scale.ticks(count)
    };
  }
  
  // Get the time domain from filtered data
  const timeExtent = d3Array.extent(filteredData, (d: CandlestickData) => new Date(d.timestamp)) as [Date, Date];
  
  // Create the time scale
  const scale = d3Scale.scaleTime()
    .domain(timeExtent)
    .range(pixelRange)
    .clamp(true);
    
  return {
    scale: (date: Date): number => scale(date),
    invert: (pixel: number): Date => scale.invert(pixel),
    ticks: (count = 10): Date[] => scale.ticks(count)
  };
}

/**
 * Calculates the visible data range for current view parameters with trading hours support
 */
export function calculateTradingHoursVisibleRange<T extends { timestamp: number, low?: number, high?: number, close?: number }>(data: T[], startIndex: number, endIndex: number) {
  if (data.length === 0 || startIndex < 0 || endIndex >= data.length || startIndex > endIndex) {
    return {
      startTime: new Date(),
      endTime: new Date(),
      minPrice: 0,
      maxPrice: 100
    };
  }

  const visibleData = data.slice(startIndex, endIndex + 1);
  
  const timestamps = visibleData.map(item => new Date(item.timestamp));
  
  // For price data, we need to extract from candlestick format
  const priceLow = d3Array.min(visibleData, (d: T) => d.low !== undefined ? d.low : (d.close || 0)) || 0;
  const priceHigh = d3Array.max(visibleData, (d: T) => d.high !== undefined ? d.high : (d.close || 100)) || 100;
  
  // Add some padding to the price range (5%)
  const pricePadding = (priceHigh - priceLow) * 0.05;
  
  return {
    startTime: d3Array.min(timestamps) || new Date(),
    endTime: d3Array.max(timestamps) || new Date(),
    minPrice: Math.max(0, priceLow - pricePadding),
    maxPrice: priceHigh + pricePadding
  };
}

/**
 * Formats a date for display on the x-axis
 */
export function formatDateForAxis(date: Date, timeframe: string): string {
  switch (timeframe) {
    case '1min':
    case '5min':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '15min':
    case '1hour':
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    case '1day':
    case '5day':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    default:
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

/**
 * Formats a price for display on the y-axis
 */
export function formatPriceForAxis(price: number): string {
  // Format based on price ranges
  if (price < 0.01) {
    return price.toFixed(6);
  } else if (price < 1) {
    return price.toFixed(4);
  } else if (price < 100) {
    return price.toFixed(2);
  } else if (price < 10000) {
    return price.toFixed(1);
  } else {
    return Math.round(price).toString();
  }
}

/**
 * Adjusts color saturation based on confidence
 */
export function adjustColorSaturation(hexColor: string, saturationFactor: number): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);
  
  // Convert RGB to HSL
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Adjust saturation
  const newS = Math.min(1, Math.max(0, s * saturationFactor));
  
  // Convert back to RGB
  const [newR, newG, newB] = hslToRgb(h, newS, l);
  
  // Convert to hex
  return rgbToHex(newR, newG, newB);
}

/**
 * Adds opacity to a hex color
 */
export function adjustOpacityHex(opacity: number): string {
  const alpha = Math.round(opacity * 255);
  return alpha.toString(16).padStart(2, '0');
}

// Helper functions for color conversions
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    
    h /= 6;
  }

  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
