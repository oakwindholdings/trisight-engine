// src/components/Chart/ChartWithContext.tsx
// Wrapper around InfiniteZoomChart with context
// Handles data fetching and loading overlay
import React, { useEffect, useMemo, forwardRef } from 'react';
import InfiniteZoomChart from './InfiniteZoomChart';
import { InfiniteZoomChartRef } from './InfiniteZoomChart';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { usePatternContext } from '../../contexts/PatternContext';
import { Pattern } from '../../models/PatternTypes';
import { TimeRangeOption } from './TimeRangeSelector';

interface ChartWithContextProps {
  width: number;
  height: number;
  onPatternSelect: (pattern: Pattern | null) => void;
  selectedPattern: Pattern | null;
  selectedDate: Date;
  timeframe?: string;
  activeTimeRange: TimeRangeOption;
  selectedSymbol?: string;
}

export const ChartWithContext = forwardRef<InfiniteZoomChartRef, ChartWithContextProps>(({
  width,
  height,
  onPatternSelect,
  selectedPattern,
  selectedDate,
  timeframe,
  activeTimeRange = '1D',
  selectedSymbol = 'AAPL'
}, ref) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`ChartWithContext rendering with activeTimeRange: ${activeTimeRange}`);
    console.log(`ChartWithContext selectedSymbol: ${selectedSymbol}`);
  }
  
  const { data, fetchSpecificDay, fetchDateRange, loading, error, setIsUsingCustomRange } = useMarketDataContext();
  const { patterns } = usePatternContext();

  // Debug prop changes
  if (process.env.NODE_ENV === 'development') {
    console.log(`ChartWithContext render - activeTimeRange prop: ${activeTimeRange}`);
    console.log(`ChartWithContext render - data length: ${data?.length || 0}, loading: ${loading}, error: ${error?.message || 'none'}`);
  }

  // Fetch data based on the active time range
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('ChartWithContext useEffect - Running');
      console.log(`ChartWithContext useEffect triggered - activeTimeRange: ${activeTimeRange}, selectedDate: ${selectedDate.toISOString()}`);
    }
    
    if (!activeTimeRange) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ChartWithContext useEffect - No activeTimeRange, skipping');
      }
      return;
    }
    
    const fetchDataForRange = async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`ChartWithContext - fetchDataForRange called for ${activeTimeRange}`);
      }
      
      let endDate = new Date();
      
      // If today is weekend, use last Friday
      const dayOfWeek = endDate.getDay();
      if (dayOfWeek === 0) { // Sunday
        endDate.setDate(endDate.getDate() - 2);
      } else if (dayOfWeek === 6) { // Saturday
        endDate.setDate(endDate.getDate() - 1);
      }
      
      // Set to market close time (4:00 PM ET)
      endDate.setHours(16, 0, 0, 0);
      
      const startDate = new Date();
      let interval: string | undefined;
      
      switch (activeTimeRange) {
        case '1D':
          // For 1D, use fetchSpecificDay for the selected date
          if (process.env.NODE_ENV === 'development') {
            console.log(`Fetching 1D data for selected date: ${selectedDate.toISOString()}`);
          }
          setIsUsingCustomRange(false);
          await fetchSpecificDay(selectedDate);
          return;
        case '1W':
          // Last 7 days - use 15min interval
          startDate.setDate(endDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          interval = '30min'; // Reduced from 15min to stay under limit
          break;
        case '1M':
          // Last 30 days - use 1h interval
          startDate.setDate(endDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          interval = '1h'; // Reduced to stay under limit
          break;
        case '3M':
          // Last 90 days - use 1h interval
          startDate.setDate(endDate.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          interval = '2h'; // Reduced to stay under limit
          break;
        case 'YTD':
          // From January 1st to now - use 1day interval
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          interval = '1day';
          break;
        default:
          // Default to 1D behavior
          setIsUsingCustomRange(false);
          await fetchSpecificDay(selectedDate);
          return;
      }
      
      // Fetch data for the calculated date range
      if (process.env.NODE_ENV === 'development') {
        console.log(`Fetching ${activeTimeRange} data from ${startDate.toISOString()} to ${endDate.toISOString()} with interval ${interval}`);
      }
      setIsUsingCustomRange(true); // Prevent automatic refetch
      await fetchDateRange(startDate, endDate, interval!);
    };
    
    fetchDataForRange();
  }, [activeTimeRange, selectedDate, fetchSpecificDay, fetchDateRange, setIsUsingCustomRange]);

  // Calculate date range from activeTimeRange
  const [startDate, endDate] = useMemo(() => {
    // Get the most recent trading day (skip weekends)
    const getLastTradingDay = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      
      // If it's Monday morning, use last Friday
      if (day === 1 && d.getHours() < 10) {
        d.setDate(d.getDate() - 3);
      } else if (day === 0) { // Sunday
        d.setDate(d.getDate() - 2);
      } else if (day === 6) { // Saturday
        d.setDate(d.getDate() - 1);
      }
      
      // Always go back one more day to ensure data availability
      d.setDate(d.getDate() - 1);
      
      // Skip weekend again if we landed on one
      const adjustedDay = d.getDay();
      if (adjustedDay === 0) { // Sunday
        d.setDate(d.getDate() - 2);
      } else if (adjustedDay === 6) { // Saturday
        d.setDate(d.getDate() - 1);
      }
      
      // Set to market close time (4 PM EST)
      d.setHours(16, 0, 0, 0);
      return d;
    };
    
    const endDate = getLastTradingDay(new Date());
    let startDate: Date;
    
    switch (activeTimeRange) {
      case '1D':
        // For 1 day, show the last trading day
        startDate = new Date(endDate);
        startDate.setHours(9, 30, 0, 0); // Market open
        break;
      case '1W':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        startDate = getLastTradingDay(startDate);
        startDate.setHours(9, 30, 0, 0);
        break;
      case '1M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate = getLastTradingDay(startDate);
        startDate.setHours(9, 30, 0, 0);
        break;
      case '3M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        startDate = getLastTradingDay(startDate);
        startDate.setHours(9, 30, 0, 0);
        break;
      case 'YTD':
        startDate = new Date(endDate.getFullYear(), 0, 2); // Jan 2 to avoid New Year's Day
        startDate = getLastTradingDay(startDate);
        startDate.setHours(9, 30, 0, 0);
        break;
      case 'Custom':
        // For custom, use selected date
        const customEnd = getLastTradingDay(selectedDate);
        startDate = new Date(customEnd);
        startDate.setHours(9, 30, 0, 0);
        return [startDate, customEnd];
      default:
        startDate = new Date(endDate);
        startDate.setHours(9, 30, 0, 0);
    }
    
    return [startDate, endDate];
  }, [activeTimeRange, selectedDate]);

  return (
    <>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          Loading data...
        </div>
      )}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'red',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.9)',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          Error: {error.message}
        </div>
      )}
      <InfiniteZoomChart
        ref={ref}
        symbol={selectedSymbol}
        startDate={startDate}
        endDate={endDate}
        patterns={patterns}
        width={width}
        height={height}
        onPatternSelect={onPatternSelect}
        selectedPattern={selectedPattern}
        data={data}
      />
    </>
  );
});

ChartWithContext.displayName = 'ChartWithContext';

export default ChartWithContext;
