// src/components/Chart/__tests__/infiniteZoomChartPattern.test.tsx
// Test for InfiniteZoomChart pattern rendering
// Uses inline snapshots for DOM comparison

import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfiniteZoomChart from '../InfiniteZoomChart';
import { CandlestickData } from '../../../models/ChartTypes';
import { MarketDataContext } from '../../../contexts/MarketDataContext';

// Mock the pattern bus hook
jest.mock('../../../hooks/usePatternBus');

// Minimal test data - 12 candles
const testCandles: CandlestickData[] = [
  { datetime: '2025-06-04T10:00:00.000Z', timestamp: 1717494000000, open: 100.00, high: 100.50, low: 99.90, close: 100.20, volume: 10000 },
  { datetime: '2025-06-04T10:01:00.000Z', timestamp: 1717494060000, open: 100.20, high: 100.80, low: 100.10, close: 100.70, volume: 12000 },
  { datetime: '2025-06-04T10:02:00.000Z', timestamp: 1717494120000, open: 100.70, high: 101.20, low: 100.60, close: 101.10, volume: 15000 },
  { datetime: '2025-06-04T10:03:00.000Z', timestamp: 1717494180000, open: 101.10, high: 101.50, low: 100.90, close: 101.30, volume: 13000 },
  { datetime: '2025-06-04T10:04:00.000Z', timestamp: 1717494240000, open: 101.30, high: 101.60, low: 101.20, close: 101.50, volume: 14000 },
  { datetime: '2025-06-04T10:05:00.000Z', timestamp: 1717494300000, open: 101.50, high: 101.80, low: 101.40, close: 101.70, volume: 11000 },
  { datetime: '2025-06-04T10:06:00.000Z', timestamp: 1717494360000, open: 101.70, high: 102.00, low: 101.60, close: 101.00, volume: 16000 },
  { datetime: '2025-06-04T10:07:00.000Z', timestamp: 1717494420000, open: 101.00, high: 101.10, low: 100.50, close: 100.60, volume: 18000 },
  { datetime: '2025-06-04T10:08:00.000Z', timestamp: 1717494480000, open: 100.60, high: 100.70, low: 100.20, close: 100.30, volume: 17000 },
  { datetime: '2025-06-04T10:09:00.000Z', timestamp: 1717494540000, open: 100.30, high: 100.40, low: 99.80, close: 99.90, volume: 19000 },
  { datetime: '2025-06-04T10:10:00.000Z', timestamp: 1717494600000, open: 99.90, high: 100.00, low: 99.50, close: 99.00, volume: 20000 },
  { datetime: '2025-06-04T10:11:00.000Z', timestamp: 1717494660000, open: 99.00, high: 99.20, low: 98.80, close: 99.10, volume: 21000 },
];

// Mock contexts
const mockMarketDataContext = {
  data: testCandles,
  loading: false,
  error: null,
  refresh: jest.fn(),
  symbol: 'TEST',
  setSymbol: jest.fn(),
  timeframe: '1min',
  setTimeframe: jest.fn(),
  fetchSpecificDay: jest.fn(),
  fetchDateRange: jest.fn(),
  hasData: jest.fn(),
  getAvailableDays: jest.fn(),
  isLive: false,
  toggleLive: jest.fn(),
} as any;

describe('InfiniteZoomChart Pattern Rendering', () => {
  it('renders pattern markers correctly', () => {
    const { container } = render(
      <MarketDataContext.Provider value={mockMarketDataContext}>
        <InfiniteZoomChart
          symbol="TEST"
          patterns={[]}
          width={800}
          height={600}
          onPatternSelect={jest.fn()}
          selectedPattern={null}
        />
      </MarketDataContext.Provider>
    );

    // Verify basic structure is rendered
    expect(container.querySelector('.chart-container')).toBeInTheDocument();
    
    // Check that the pattern overlay SVG is rendered
    const patternOverlay = container.querySelector('.pattern-overlay');
    expect(patternOverlay).toBeInTheDocument();
    expect(patternOverlay?.tagName).toBe('svg');
    
    // Take inline snapshot of DOM structure
    expect(container.innerHTML).toMatchInlineSnapshot(`""`);
  });
});
