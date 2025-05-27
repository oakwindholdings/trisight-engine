// src/components/Chart/ChartWorkspace.tsx
// Layout wrapper for chart area
// Combines chart and controls
import React from 'react';
import styled from 'styled-components';
import TriSightChart from './TriSightChart';
import ChartControlBar from './ChartControlBar';
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
        activeTimeRange={activeTimeRange}
        onTimeRangeSelect={onTimeRangeSelect}
      />
      
      {/* Main Chart Area */}
      <ChartContainer>
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
      </ChartContainer>
    </WorkspaceContainer>
  );
};

export default ChartWorkspace;
