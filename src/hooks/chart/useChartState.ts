// src/hooks/chart/useChartState.ts
// Manages chart visible range and zoom/pan state
// Centralizes chart-related state updates
import { useState, useEffect } from 'react';
import { VisibleRange, ZoomState, zoomLevels, CandlestickData } from '../../models/ChartTypes';

export function useChartState(timeframe: string) {
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({
    startTime: new Date(),
    endTime: new Date(),
    minPrice: 0,
    maxPrice: 100
  });

  const [panState, setPanState] = useState({
    isPanning: false,
    startX: 0,
    previousTranslateX: 0,
    translateX: 0,
    momentum: 0
  });

  const [zoomState, setZoomState] = useState<ZoomState>({
    level: zoomLevels.find(l => l.name === 'trading_day_view') || zoomLevels[5],
    factor: 1.0,
    isCustomZoom: false
  });

  const effectiveCandleCount = Math.round(zoomState.level.candleCount * zoomState.factor);

  const [visibleDataIndices, setVisibleDataIndices] = useState({ start: 0, end: 0 });
  const [filteredData, setFilteredData] = useState<CandlestickData[]>([]);

  const [showOnlyTradingHours, setShowOnlyTradingHours] = useState<boolean>(() => {
    const saved = localStorage.getItem('showOnlyTradingHours');
    return saved !== null ? saved === 'true' : true;
  });

  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);

  useEffect(() => {
    if (timeframe !== currentTimeframe) {
      setCurrentTimeframe(timeframe);
      setZoomState({
        level: zoomLevels[3],
        factor: 1.0,
        isCustomZoom: false
      });
    }
  }, [timeframe, currentTimeframe]);

  return {
    visibleRange,
    setVisibleRange,
    panState,
    setPanState,
    zoomState,
    setZoomState,
    effectiveCandleCount,
    visibleDataIndices,
    setVisibleDataIndices,
    filteredData,
    setFilteredData,
    showOnlyTradingHours,
    setShowOnlyTradingHours,
    currentTimeframe,
    setCurrentTimeframe
  };
}
