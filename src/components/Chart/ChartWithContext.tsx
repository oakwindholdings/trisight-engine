// src/components/Chart/ChartWithContext.tsx
// Wrapper around TriSightChart with context
// Handles data fetching and loading overlay
import React, { useEffect } from 'react';
import TriSightChart from './TriSightChart';
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
}

export const ChartWithContext: React.FC<ChartWithContextProps> = ({
  width,
  height,
  onPatternSelect,
  selectedPattern,
  selectedDate,
  timeframe,
  activeTimeRange = '1D'
}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`ChartWithContext rendering with activeTimeRange: ${activeTimeRange}`);
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

  return (
    <>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div>Loading market data...</div>
        </div>
      )}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div>Error loading market data: {error.message}</div>
        </div>
      )}
      <TriSightChart
        data={data}
        patterns={patterns}
        width={width}
        height={height}
        onPatternSelect={onPatternSelect}
        selectedPattern={selectedPattern}
        timeframe={timeframe || '1min'}
        autoScale={true} /* Enable auto-scale for better visibility */
      />
    </>
  );
};

export default ChartWithContext;
