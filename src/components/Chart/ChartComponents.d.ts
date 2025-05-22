// src/components/Chart/ChartComponents.d.ts
// Shared chart component types
// Used for canvas renderers
import { CandlestickData } from '../../models/ChartTypes';
import { Pattern } from '../../models/PatternTypes';
import React from 'react';

// Common interfaces
export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showingTradingHoursOnly?: boolean;
}

// Common type definitions for chart scales
export interface TimeScaleType {
  scale: (date: Date) => number;
  invert: (pixel: number) => Date;
  ticks: (count?: number) => Date[];
}

export interface PriceScaleType {
  scale: (price: number) => number;
  invert: (pixel: number) => number;
  ticks: (count?: number) => number[];
}

// ======= COMPONENT PROPS INTERFACES ONLY =======

// Export interfaces only, not the component implementations
export interface CandlestickRendererProps {
  data: CandlestickData[];
  timeScale: TimeScaleType;
  priceScale: PriceScaleType;
  dimensions: ChartDimensions;
}

export interface PatternRendererProps {
  patterns: Pattern[];
  timeScale: TimeScaleType;
  priceScale: PriceScaleType;
  dimensions: ChartDimensions;
  selectedPattern: Pattern | null;
}

export interface PriceAxisProps {
  priceScale: PriceScaleType;
  dimensions: ChartDimensions;
}

export interface TimeAxisProps {
  timeScale: TimeScaleType;
  dimensions: ChartDimensions;
  timeframe: string;
  showOnlyTradingHours?: boolean;
}
