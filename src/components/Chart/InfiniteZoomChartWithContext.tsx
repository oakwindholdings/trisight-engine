// src/components/Chart/InfiniteZoomChartWithContext.tsx
// Wrapper around InfiniteZoomChart with context
// Handles symbol and pattern context integration

import React from 'react';
import InfiniteZoomChart, { InfiniteZoomChartRef } from './InfiniteZoomChart';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { usePatternContext } from '../../contexts/PatternContext';
import { Pattern } from '../../models/PatternTypes';
import { TimeRangeOption } from './TimeRangeSelector';

interface InfiniteZoomChartWithContextProps {
  width: number;
  height: number;
  onPatternSelect: (pattern: Pattern | null) => void;
  selectedPattern: Pattern | null;
  selectedDate: Date;
  timeframe?: string;
  activeTimeRange: TimeRangeOption;
  onTimeRangeSelect: (range: TimeRangeOption, startDate: Date, endDate: Date) => void;
}

const InfiniteZoomChartWithContext = React.forwardRef<InfiniteZoomChartRef, InfiniteZoomChartWithContextProps>(({
  width,
  height,
  onPatternSelect,
  selectedPattern,
  selectedDate,
  timeframe = '1min',
  activeTimeRange,
  onTimeRangeSelect
}, ref) => {
  const { symbol: selectedSymbol } = useMarketDataContext();
  const { patterns } = usePatternContext();

  console.log('InfiniteZoomChartWithContext - selectedSymbol:', selectedSymbol);
  console.log('InfiniteZoomChartWithContext - patterns from context:', patterns.length);

  // Calculate date range from activeTimeRange
  const [startDate, endDate] = React.useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    console.log('InfiniteZoomChartWithContext - Current date:', new Date().toISOString());
    console.log('InfiniteZoomChartWithContext - Initial endDate:', endDate.toISOString());
    
    // Helper to get last trading day
    const getLastTradingDay = (date: Date): Date => {
      const day = date.getDay();
      const result = new Date(date);
      
      // If Saturday (6), go back to Friday
      if (day === 6) {
        result.setDate(result.getDate() - 1);
      }
      // If Sunday (0), go back to Friday  
      else if (day === 0) {
        result.setDate(result.getDate() - 2);
      }
      
      return result;
    };
    
    switch (activeTimeRange) {
      case '1D':
        // For 1D, use the last trading day
        const lastTradingDay = getLastTradingDay(endDate);
        startDate.setTime(lastTradingDay.getTime());
        endDate.setTime(lastTradingDay.getTime());
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case '1W':
        // Last 7 days
        startDate.setDate(endDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        // Ensure end date is not in the future
        const now = new Date();
        if (endDate > now) {
          endDate.setTime(now.getTime());
        }
        break;
      case '1M':
        // Last 30 days
        startDate.setDate(endDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        // Ensure end date is not in the future
        if (endDate > new Date()) {
          endDate.setTime(new Date().getTime());
        }
        break;
      case '3M':
        // Last 90 days
        startDate.setDate(endDate.getDate() - 90);
        startDate.setHours(0, 0, 0, 0);
        // Ensure end date is not in the future
        if (endDate > new Date()) {
          endDate.setTime(new Date().getTime());
        }
        break;
      case 'YTD':
        // From January 1st to now
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        // Ensure end date is not in the future
        if (endDate > new Date()) {
          endDate.setTime(new Date().getTime());
        }
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    console.log(`Date range for ${activeTimeRange}: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    return [startDate, endDate];
  }, [activeTimeRange]);

  if (!selectedSymbol) {
    return <div>Please select a symbol from the pattern list</div>;
  }

  return (
    <InfiniteZoomChart
      ref={ref}
      symbol={selectedSymbol}
      patterns={patterns}
      width={width}
      height={height}
      onPatternSelect={onPatternSelect}
      selectedPattern={selectedPattern}
      startDate={startDate}
      endDate={endDate}
    />
  );
});

InfiniteZoomChartWithContext.displayName = 'InfiniteZoomChartWithContext';

export default InfiniteZoomChartWithContext;
