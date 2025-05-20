export interface CandlestickData {
  datetime: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = '1min' | '5min' | '15min' | '30min' | '60min' | '1hour' | 'daily' | 'weekly' | 'monthly' | '1day' | '5day';

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface VisibleRange {
  startTime: Date;
  endTime: Date;
  minPrice: number;
  maxPrice: number;
}

export interface ZoomLevel {
  name: string;
  timeframe: Timeframe;
  candleCount: number;
  label: string;
}

// Zoom factor for mouse wheel zooming (1.0 = 100% = no change)
export interface ZoomState {
  level: ZoomLevel;
  factor: number; // Multiplier for candleCount (e.g., 0.5 = zoom in, 2.0 = zoom out)
  isCustomZoom: boolean; // True if using a custom zoom factor
}

export const zoomLevels: ZoomLevel[] = [
  // Detailed timeframes with 1-minute candles
  { name: '5m_detail', timeframe: '1min', candleCount: 5, label: '5m (1min)' },
  { name: '15m_detail', timeframe: '1min', candleCount: 15, label: '15m (1min)' },
  { name: '30m_detail', timeframe: '1min', candleCount: 30, label: '30m (1min)' },
  { name: '1h_detail', timeframe: '1min', candleCount: 60, label: '1h (1min)' },
  { name: '2h_detail', timeframe: '1min', candleCount: 120, label: '2h (1min)' },
  { name: 'trading_day_view', timeframe: '1min', candleCount: 390, label: 'Trading Day (1min)' },
  
  // Medium timeframes with 5-minute candles
  { name: '1h_medium', timeframe: '5min', candleCount: 12, label: '1h (5min)' },
  { name: '4h_medium', timeframe: '5min', candleCount: 48, label: '4h (5min)' },
  { name: '1d_medium', timeframe: '5min', candleCount: 78, label: '1d (5min)' },
  
  // Broader timeframes with 15-minute candles
  { name: '4h_broad', timeframe: '15min', candleCount: 16, label: '4h (15min)' },
  { name: '1d_broad', timeframe: '15min', candleCount: 26, label: '1d (15min)' },
  { name: '1w_broad', timeframe: '15min', candleCount: 130, label: '1w (15min)' },
  
  // Extended view
  { name: '1month', timeframe: '1hour', candleCount: 160, label: '1M' }
];
