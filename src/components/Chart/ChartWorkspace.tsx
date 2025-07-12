// src/components/Chart/ChartWorkspace.tsx
// Container for chart and its controls
// Manages chart workspace layout
// NOTE: supports DEBUG_UI channel (TriSight canvas logging system)

import React, { useState, useRef, useMemo, useEffect } from 'react';
import styled from 'styled-components';
import InfiniteZoomChart, { InfiniteZoomChartRef } from './InfiniteZoomChart';
import ChartControlBar from './ChartControlBar';
import { ThemeTokens } from '../../styles/theme';
import { TimeRangeOption } from './TimeRangeSelector';
import { usePatternContext } from '../../contexts/PatternContext';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { logDebug } from '../../utils/debug';

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
  data: any[];
  patterns: any[];
  width: number;
  height: number;
  onPatternSelect: (pattern: any) => void;
  selectedPattern?: any;
  timeframe: string;
  onTimeframeChange: (timeframe: string) => void;
  showTradingHoursOnly: boolean;
  onTradingHoursToggle: () => void;
  onAutoScale: () => void;
  onResetView: () => void;
  autoScale?: boolean;
  activeTimeRange: TimeRangeOption;
  onTimeRangeSelect: (range: TimeRangeOption, startDate: Date, endDate: Date) => void;
  selectedSymbol: string;
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
  onTimeRangeSelect,
  selectedSymbol
}) => {
  const chartRef = useRef<InfiniteZoomChartRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedDate] = useState(() => new Date());
  const { data: marketData } = useMarketDataContext();

  // Track actual container dimensions
  const [containerDimensions, setContainerDimensions] = useState({ width, height });

  // Use ResizeObserver to detect container size changes
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        logDebug('DEBUG_UI', '[ChartWorkspace] Container resized:', { newWidth, newHeight });
        setContainerDimensions({ width: newWidth, height: newHeight });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleZoomToFit = () => {
    if (chartRef.current?.zoomToFit) {
      chartRef.current.zoomToFit();
    }
  };

  // Calculate date range from activeTimeRange
  const [startDate, endDate] = useMemo(() => {
    const endDate = new Date();
    let startDate: Date;

    switch (activeTimeRange) {
      case '1D':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate = new Date(endDate);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'YTD':
        startDate = new Date(endDate.getFullYear(), 0, 1);
        break;
      case 'Custom':
        // For custom, default to last day
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
        break;
      default:
        startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 1);
    }

    return [startDate, endDate];
  }, [activeTimeRange]);

  return (
    <WorkspaceContainer>
      {/* Main Chart Area */}
      <ChartContainer ref={containerRef}>
        <InfiniteZoomChart
          ref={chartRef}
          symbol={selectedSymbol || 'AAPL'}
          startDate={startDate}
          endDate={endDate}
          width={containerDimensions.width}
          height={containerDimensions.height}
          patterns={patterns}
          onPatternSelect={onPatternSelect}
          data={marketData}
        />
      </ChartContainer>
    </WorkspaceContainer>
  );
};

export default ChartWorkspace;
