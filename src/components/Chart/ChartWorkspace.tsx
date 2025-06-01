// src/components/Chart/ChartWorkspace.tsx
// Container for chart and its controls
// Manages chart workspace layout

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import TriSightChart from './TriSightChart';
import ChartControlBar from './ChartControlBar';
import InfiniteZoomChartWithContext from './InfiniteZoomChartWithContext';
import { InfiniteZoomChartRef } from './InfiniteZoomChart';
import { ThemeTokens } from '../../styles/theme';
import { TimeRangeOption } from './TimeRangeSelector';

const WorkspaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: ${ThemeTokens.colors.background};
`;

const ChartContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  /* Maintain original chart sizing behavior while adding new container */
`;

const ToggleButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 1000;
  padding: 8px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  pointer-events: auto;
  
  &:hover {
    background-color: #1976d2;
  }
  
  &:active {
    background-color: #1565c0;
  }
`;

interface ChartWorkspaceProps {
  data: any;
  patterns: any[];
  width: number;
  height: number;
  onPatternSelect: (pattern: any) => void;
  selectedPattern: any | null;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  showTradingHoursOnly: boolean;
  onTradingHoursToggle: () => void;
  onAutoScale: () => void;
  onResetView: () => void;
  autoScale?: boolean; // Add autoScale prop
  // Add time range selector props
  activeTimeRange: TimeRangeOption;
  onTimeRangeSelect: (range: TimeRangeOption, startDate: Date, endDate: Date) => void;
}

const ChartWorkspace: React.FC<ChartWorkspaceProps> = ({
  data,
  patterns,
  width,
  height,
  onPatternSelect,
  selectedPattern,
  timeframe,
  onTimeframeChange,
  showTradingHoursOnly,
  onTradingHoursToggle,
  onAutoScale,
  onResetView,
  autoScale = false,
  activeTimeRange,
  onTimeRangeSelect
}) => {
  const [useInfiniteZoom, setUseInfiniteZoom] = useState(false);
  const chartRef = useRef<InfiniteZoomChartRef>(null);
  const [selectedDate] = useState(() => new Date());

  const handleZoomToFit = () => {
    if (chartRef.current?.zoomToFit) {
      chartRef.current.zoomToFit();
    }
  };

  const handleToggleChart = () => {
    console.log('Toggle button clicked! Current state:', useInfiniteZoom, '-> New state:', !useInfiniteZoom);
    setUseInfiniteZoom(!useInfiniteZoom);
  };

  return (
    <WorkspaceContainer>
      {/* Chart Controls - top area */}
      <ChartControlBar 
        timeframe={timeframe}
        onTimeframeChange={onTimeframeChange}
        showTradingHoursOnly={showTradingHoursOnly}
        onTradingHoursToggle={onTradingHoursToggle}
        onAutoScale={onAutoScale}
        onResetView={onResetView}
        onZoomToFit={useInfiniteZoom ? handleZoomToFit : undefined}
        activeTimeRange={activeTimeRange}
        onTimeRangeSelect={onTimeRangeSelect}
      />
      
      {/* Main Chart Area */}
      <ChartContainer>
        <ToggleButton onClick={handleToggleChart}>
          {useInfiniteZoom ? 'Standard Chart' : 'Infinite Zoom'}
        </ToggleButton>
        {useInfiniteZoom ? (
          <InfiniteZoomChartWithContext
            ref={chartRef}
            width={width}
            height={height}
            onPatternSelect={onPatternSelect}
            selectedPattern={selectedPattern}
            selectedDate={selectedDate}
            timeframe={timeframe}
            activeTimeRange={activeTimeRange}
            onTimeRangeSelect={onTimeRangeSelect}
          />
        ) : (
          <TriSightChart
            data={data}
            patterns={patterns}
            width={width}
            height={height}
            onPatternSelect={onPatternSelect}
            selectedPattern={selectedPattern}
            timeframe={timeframe} /* Pass timeframe prop to chart */
            autoScale={autoScale} /* Pass autoScale prop to chart */
          />
        )}
      </ChartContainer>
    </WorkspaceContainer>
  );
};

export default ChartWorkspace;
