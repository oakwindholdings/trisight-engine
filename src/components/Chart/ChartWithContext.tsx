// src/components/Chart/ChartWithContext.tsx
// Chart component with context integration
// Loads data and renders TriSightChart
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
  onTimeRangeSelect: (
    range: TimeRangeOption,
    startDate: Date,
    endDate: Date
  ) => void;
}

const ChartWithContext: React.FC<ChartWithContextProps> = ({
  width,
  height,
  onPatternSelect,
  selectedPattern,
  selectedDate,
  timeframe = '1min',
  activeTimeRange,
  onTimeRangeSelect
}) => {
  const { data, fetchSpecificDay, loading } = useMarketDataContext();
  const { patterns } = usePatternContext();

  useEffect(() => {
    fetchSpecificDay(selectedDate);
  }, [selectedDate, fetchSpecificDay]);

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
          <div>Loading market data for {selectedDate.toLocaleDateString()}...</div>
        </div>
      )}
      <TriSightChart
        data={data}
        patterns={patterns}
        width={width}
        height={height}
        onPatternSelect={onPatternSelect}
        selectedPattern={selectedPattern}
        timeframe={timeframe}
      />
    </>
  );
};

export default ChartWithContext;
