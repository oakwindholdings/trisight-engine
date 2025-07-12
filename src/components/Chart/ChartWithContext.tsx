// src/components/Chart/ChartWithContext.tsx
// Wrapper around InfiniteZoomChart with context
// Handles data fetching and loading overlay
import React, { useEffect, useMemo, forwardRef, useState } from 'react';
import InfiniteZoomChart from './InfiniteZoomChart';
import { InfiniteZoomChartRef } from './InfiniteZoomChart';
import { SignalEngineHUD } from './SignalEngineHUD';
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
  showTradingHoursOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export const ChartWithContext = forwardRef<InfiniteZoomChartRef, ChartWithContextProps>(({
  width,
  height,
  onPatternSelect,
  selectedPattern,
  selectedDate,
  timeframe,
  activeTimeRange = '1D',
  selectedSymbol = 'AAPL',
  showTradingHoursOnly = true,
  startDate,
  endDate
}, ref) => {
  const { data, fetchSpecificDay, fetchDateRange, loading, error, setIsUsingCustomRange } = useMarketDataContext();
  const { patterns } = usePatternContext();
  const [showEngineHUD, setShowEngineHUD] = useState(false);
  
  // Check if Signal Engine HUD should be shown
  useEffect(() => {
    const hudEnabled = localStorage.getItem('signalEngineHUD') === 'true';
    setShowEngineHUD(hudEnabled);
    
    // Listen for changes to HUD setting
    const handleStorageChange = () => {
      const enabled = localStorage.getItem('signalEngineHUD') === 'true';
      setShowEngineHUD(enabled);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // CRITICAL DIAGNOSTIC: Log data immediately after getting from context
  console.log('[DIAGNOSTIC] ChartWithContext - Data from useMarketDataContext:', {
    data,
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataLength: data?.length || 0,
    dataIsNull: data === null,
    dataIsUndefined: data === undefined,
    hasData: !!data && data.length > 0,
    firstItem: data?.[0],
    loading,
    error
  });

  // Add debug logging for props
  console.log('[ChartWithContext] Component rendered with props:', {
    activeTimeRange,
    selectedSymbol,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    hasCustomDates: !!(startDate && endDate),
    startDateValue: startDate,
    endDateValue: endDate
  });

  // DIAGNOSTIC: Log data from context
  console.log('[DIAGNOSTIC] ChartWithContext data from MarketDataContext:', {
    dataType: Array.isArray(data) ? 'array' : typeof data,
    dataLength: data?.length || 0,
    hasData: !!data && data.length > 0,
    loading,
    error: error?.message || null,
    firstCandle: data && data[0] ? {
      ...data[0],
      timestampValue: data[0].timestamp,
      timestampType: typeof data[0].timestamp,
      timestampAsDate: new Date(data[0].timestamp).toISOString()
    } : null,
    lastCandle: data && data[data.length - 1] ? {
      ...data[data.length - 1],
      timestampValue: data[data.length - 1].timestamp,
      timestampType: typeof data[data.length - 1].timestamp,
      timestampAsDate: new Date(data[data.length - 1].timestamp).toISOString()
    } : null
  });

  if (process.env.NODE_ENV === 'development') {
    console.log(`ChartWithContext rendering with activeTimeRange: ${activeTimeRange}`);
    console.log(`ChartWithContext selectedSymbol: ${selectedSymbol}`);
  }
  
  // Filter data based on trading hours if enabled
  const filteredData = useMemo(() => {
    if (!showTradingHoursOnly || !data) {
      return data;
    }
    
    // Filter to only include candles during regular trading hours (9:30 AM - 4:00 PM ET)
    return data.filter(candle => {
      const date = new Date(candle.datetime);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const totalMinutes = hours * 60 + minutes;
      
      // Trading hours: 9:30 AM - 4:00 PM ET (570 - 960 minutes from midnight)
      return totalMinutes >= 570 && totalMinutes <= 960;
    });
  }, [data, showTradingHoursOnly]);

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
      console.log(`ChartWithContext useEffect - Custom dates:`, { startDate, endDate });
    }
    
    // If we have custom dates, use them directly
    if (startDate && endDate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('ChartWithContext useEffect - Using custom date range');
      }
      setIsUsingCustomRange(true);
      
      // Determine interval based on date range
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / msPerDay);
      
      let interval: string;
      if (daysDiff <= 1) {
        interval = '1min';
      } else if (daysDiff <= 7) {
        interval = '15min';
      } else if (daysDiff <= 60) {
        interval = '60min';
      } else {
        interval = '1day';
      }
      
      fetchDateRange(startDate, endDate, interval);
      return;
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
  }, [activeTimeRange, selectedDate, fetchSpecificDay, fetchDateRange, setIsUsingCustomRange, startDate, endDate]);

  // Calculate date range from activeTimeRange
  const [chartStartDate, chartEndDate] = useMemo(() => {
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
      {loading ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: '#666'
        }}>
          Loading chart data...
        </div>
      ) : (
        <>
          {console.log('[ChartWithContext] Passing data to InfiniteZoomChart:', {
            symbol: selectedSymbol,
            dataLength: data?.length || 0,
            startDate: (startDate || chartStartDate)?.toISOString(),
            endDate: (endDate || chartEndDate)?.toISOString(),
            hasData: !!data,
            firstCandle: data?.[0]?.timestamp,
            lastCandle: data?.[data.length - 1]?.timestamp
          })}
          
          {/* DIAGNOSTIC: Log detailed data being passed */}
          {console.log('[DIAGNOSTIC] ChartWithContext passing to InfiniteZoomChart:', {
            dataLength: data?.length || 0,
            hasData: !!data && data.length > 0,
            symbol: selectedSymbol,
            startDate: (startDate || chartStartDate)?.toISOString(),
            endDate: (endDate || chartEndDate)?.toISOString(),
            width,
            height,
            timeframe,
            loading,
            patternsCount: patterns.length,
            firstFilteredCandle: data && data[0] ? {
              timestamp: data[0].timestamp,
              timestampType: typeof data[0].timestamp,
              date: new Date(data[0].timestamp).toISOString()
            } : null,
            lastFilteredCandle: data && data[data.length - 1] ? {
              timestamp: data[data.length - 1].timestamp,
              timestampType: typeof data[data.length - 1].timestamp,
              date: new Date(data[data.length - 1].timestamp).toISOString()
            } : null
          })}
          
          {/* Signal Engine HUD Overlay */}
          <SignalEngineHUD 
            show={showEngineHUD} 
            onHide={() => setShowEngineHUD(false)}
          />
          
          <InfiniteZoomChart
            ref={ref}
            symbol={selectedSymbol}
            startDate={startDate || chartStartDate}
            endDate={endDate || chartEndDate}
            patterns={patterns}
            width={width}
            height={height}
            onPatternSelect={onPatternSelect}
            selectedPattern={selectedPattern}
            data={data}
            timeframe={timeframe}
          />
        </>
      )}
    </>
  );
});

ChartWithContext.displayName = 'ChartWithContext';

export default ChartWithContext;
