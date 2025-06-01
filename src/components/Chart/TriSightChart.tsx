// src/components/Chart/TriSightChart.tsx
// Main candlestick chart component
// Handles zoom and pattern overlay
import React, { useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { CandlestickData, zoomLevels } from '../../models/ChartTypes';
import { Pattern, PatternType, GoldmineChannelPattern, PivotPattern, RocketmanPattern, EscalatorPattern, ChannelDirection, ThrustDirection } from '../../models/PatternTypes';
import { createPriceScale, calculateVisibleRange, calculateTradingHoursVisibleRange } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import { applyTradingHoursFilter } from '../../utils/chart/tradingHoursFilter';
import { useChartState } from '../../hooks/chart/useChartState';
import { useCanvasManager } from './CanvasManager';
import { useZoomController } from './controllers/ZoomController';
import { usePanController } from './controllers/PanController';
import { renderChart as orchestrateRender } from './RenderOrchestrator';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { usePatternContext } from '../../contexts/PatternContext';
import { isFeatureEnabled } from '../../utils/featureFlags';

// Import chart components
import CandlestickRenderer from './CandlestickRenderer';
import PatternRenderer from './PatternRenderer';
import TimeAxis from './TimeAxis';
import PriceAxis from './PriceAxis';

// Type definitions for scales and patterns
type TimeScaleType = ReturnType<typeof createSequentialTimeScale>;
type PriceScaleType = ReturnType<typeof createPriceScale>;

interface TriSightChartProps {
  data: CandlestickData[];
  patterns: Pattern[];
  width: number;
  height: number;
  onPatternSelect?: (pattern: Pattern) => void;
  selectedPattern?: Pattern | null;
  timeframe: string;
  autoScale?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface PanState {
  isPanning: boolean;
  startX: number;
  previousTranslateX: number;
  translateX: number;
  momentum: number;
}

interface ZoomState {
  level: ZoomLevel;
  factor: number;
  isCustomZoom: boolean;
}

interface ZoomLevel {
  name: string;
  label: string;
  candleCount: number;
}

interface VisibleRange {
  startTime: Date;
  endTime: Date;
  minPrice: number;
  maxPrice: number;
}

const ChartContainer = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  position: relative;
  background-color: #fafafa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`;

// Margin for axes
const CHART_MARGIN = {
  top: 20,
  right: 60,
  bottom: 30,
  left: 60
};

// Calculate candle width based on chart dimensions and visible data
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const calculateCandleWidth = (chartWidth: number, totalCandles: number): number => {
  // Ensure a minimum width to prevent candles from becoming too small
  return Math.max(2, chartWidth / totalCandles);
};

const TriSightChart: React.FC<TriSightChartProps> = ({
  data,
  patterns: allPatterns, // Rename to avoid confusion with context patterns
  width,
  height,
  onPatternSelect,
  selectedPattern,
  timeframe = '1min', // Default to 1-minute candles
  autoScale = false // Default to false for auto-scale
}) => {
  // Access market data context for refresh functionality
  const { refresh: refreshData, loading: dataLoading } = useMarketDataContext();
  
  // Access the pattern context to get filtered (visible) patterns
  const { visiblePatterns } = usePatternContext();
  const {
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
  } = useChartState(timeframe);

  const { mainCanvasRef, bufferCanvasRef, patternsCanvasRef, interactionCanvasRef } = useCanvasManager(width, height);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (autoScale) {
      // Auto-scale logic here
    }
  }, [autoScale]);

  // Compute chart dimensions
  const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
  const chartHeight = height - CHART_MARGIN.top - CHART_MARGIN.bottom;
  
  // Function to aggregate data based on timeframe
  const aggregateData = useCallback((rawData: CandlestickData[], tf: string): CandlestickData[] => {
    if (!rawData || rawData.length === 0) return [];
    
    // If timeframe is 1min, return the raw data (filtered by trading hours if needed)
    if (tf === '1min') {
      return rawData;
    }
    
    const aggregatedData: CandlestickData[] = [];
    let periodStart: Date | null = null;
    let periodTimestamp = 0;
    let currentDatetime = '';
    let high = -Infinity;
    let low = Infinity;
    let open = 0;
    let close = 0;
    let volume = 0;
    
    // Determine the period in minutes based on timeframe
    let periodMinutes = 1;
    if (tf === '5min') periodMinutes = 5;
    else if (tf === '15min') periodMinutes = 15;
    else if (tf === '30min') periodMinutes = 30;
    else if (tf === '60min' || tf === '1hour') periodMinutes = 60;
    else if (tf === 'daily') periodMinutes = 60 * 24;
    else if (tf === 'weekly') periodMinutes = 60 * 24 * 7;
    else if (tf === 'monthly') periodMinutes = 60 * 24 * 30;
    
    rawData.forEach((candle) => {
      const candleTime = new Date(candle.datetime);
      
      if (!periodStart) {
        // Start a new period
        periodStart = new Date(candleTime);
        periodTimestamp = candle.timestamp;
        currentDatetime = candle.datetime;
        high = candle.high;
        low = candle.low;
        open = candle.open;
        volume = candle.volume || 0;
      } else {
        const diffInMinutes = (candleTime.getTime() - periodStart.getTime()) / (1000 * 60);
        
        if (diffInMinutes < periodMinutes) {
          // Add to current period
          high = Math.max(high, candle.high);
          low = Math.min(low, candle.low);
          volume += candle.volume || 0;
        } else {
          // End current period and start a new one
          aggregatedData.push({
            datetime: currentDatetime,
            timestamp: periodTimestamp,
            open,
            high,
            low,
            close,
            volume
          });
          
          periodStart = new Date(candleTime);
          periodTimestamp = candle.timestamp;
          currentDatetime = candle.datetime;
          high = candle.high;
          low = candle.low;
          open = candle.open;
          volume = candle.volume || 0;
        }
      }
      
      // Always update close to the latest candle in the period
      close = candle.close;
    });
    
    // Add the final period
    if (periodStart) {
      aggregatedData.push({
        datetime: currentDatetime,
        timestamp: periodTimestamp,
        open,
        high,
        low,
        close,
        volume
      });
    }
    
    return aggregatedData;
  }, []);
  
  // Apply data processing based on timeframe and trading hours filter
  useEffect(() => {
    if (data && data.length > 0) {
      const hoursFilteredData = applyTradingHoursFilter(data, showOnlyTradingHours);
      
      // Then aggregate based on timeframe
      const processedData = aggregateData(hoursFilteredData, currentTimeframe);
      
      setFilteredData(processedData);
    } else {
      setFilteredData([]);
    }
  }, [data, showOnlyTradingHours, currentTimeframe, aggregateData]);
  
  // Update visible range based on translate position
  const updateVisibleRangeFromPan = useCallback((translateX: number) => {
    if (filteredData.length === 0) return;
    
    // Calculate how many candles to shift based on the pan amount
    const candleWidth = (width - CHART_MARGIN.left - CHART_MARGIN.right) / effectiveCandleCount;
    const shiftCandles = Math.round(translateX / candleWidth);
    
    // Calculate base indices
    const baseEndIndex = Math.min(filteredData.length - 1, visibleDataIndices.end);
    const baseStartIndex = Math.max(0, baseEndIndex - effectiveCandleCount);
    
    // Calculate new indices with shift
    let endIndex = baseEndIndex - shiftCandles;
    let startIndex = baseStartIndex - shiftCandles;
    
    // Clamp indices to valid range
    if (endIndex > filteredData.length - 1) {
      endIndex = filteredData.length - 1;
      startIndex = Math.max(0, endIndex - effectiveCandleCount);
    } else if (startIndex < 0) {
      startIndex = 0;
      endIndex = Math.min(filteredData.length - 1, startIndex + effectiveCandleCount);
    }
    
    // Update visible indices
    setVisibleDataIndices({ start: startIndex, end: endIndex });
    
    // Update visible range with the actual time range of visible data
    if (startIndex < filteredData.length && endIndex < filteredData.length) {
      const visibleData = filteredData.slice(startIndex, endIndex + 1);
      
      // Calculate the actual time range from the visible data
      const startTime = new Date(visibleData[0].timestamp);
      const endTime = new Date(visibleData[visibleData.length - 1].timestamp);
      
      // Calculate price range from visible data
      const prices = visibleData.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Add padding to price range
      const priceRange = maxPrice - minPrice;
      const paddedMinPrice = minPrice - priceRange * 0.1;
      const paddedMaxPrice = maxPrice + priceRange * 0.1;
      
      setVisibleRange({
        startTime,
        endTime,
        minPrice: paddedMinPrice,
        maxPrice: paddedMaxPrice
      });
    }
  }, [filteredData, visibleDataIndices, setVisibleDataIndices, setVisibleRange, width, effectiveCandleCount]);
  
  // Helper method to find pattern at click position
  const findPatternAtPosition = useCallback((x: number, y: number, patterns: Pattern[]): Pattern | null => {
    console.log('TriSightChart - findPatternAtPosition called with:', { x, y, patternCount: patterns.length });
    
    // If no patterns, return null
    if (!patterns || patterns.length === 0) {
      console.log('TriSightChart - No patterns to check');
      return null;
    }
    
    // Use PatternRenderer to get actual label positions after collision resolution
    const patternRenderer = PatternRenderer;
    const labelPositions = patternRenderer.placePatternLabels(
      patterns,
      {
        width: width,
        height: height
      },
      [
        patterns[0].startTime,
        patterns[patterns.length - 1].endTime
      ],
      createSequentialTimeScale(
        width - CHART_MARGIN.left - CHART_MARGIN.right,
        filteredData.slice(visibleDataIndices.start, visibleDataIndices.end + 1),
        [CHART_MARGIN.left, width - CHART_MARGIN.right]
      ),
      createPriceScale(
        height - CHART_MARGIN.top - CHART_MARGIN.bottom,
        [visibleRange.minPrice, visibleRange.maxPrice],
        [height - CHART_MARGIN.bottom, CHART_MARGIN.top]
      )
    );
    
    console.log('TriSightChart - Label positions after collision resolution:', labelPositions.map(l => {
      const pattern = patterns.find(p => p.id === l.patternId);
      return {
        type: pattern?.type,
        x: l.x,
        y: l.y,
        width: l.width,
        height: l.height
      };
    }));
    
    // Check if we clicked on any label
    for (const label of labelPositions) {
      const pattern = patterns.find(p => p.id === label.patternId);
      if (!pattern) continue;
      
      const padding = 5; // 5px padding for easier selection
      if (
        x >= label.x - padding &&
        x <= label.x + label.width + padding &&
        y >= label.y - padding &&
        y <= label.y + label.height + padding
      ) {
        console.log('TriSightChart - Found pattern label click:', pattern.type);
        return pattern;
      }
    }
    
    console.log('TriSightChart - No pattern label found at click position');
    return null;
  }, [width, height, filteredData, visibleDataIndices, visibleRange]);
  
  // Set visible range whenever filtered data or zoom level changes
  useEffect(() => {
    if (!filteredData || filteredData.length === 0) return;
    
    // Set the visible range based on the current zoom level
    const endIndex = filteredData.length - 1;
    const startIndex = Math.max(0, endIndex - effectiveCandleCount);
    
    setVisibleDataIndices({ start: startIndex, end: endIndex });
    
    const range = showOnlyTradingHours
      ? calculateTradingHoursVisibleRange(filteredData, startIndex, endIndex)
      : calculateVisibleRange(filteredData, startIndex, endIndex);
    setVisibleRange(range);
  }, [filteredData, showOnlyTradingHours, zoomState, setVisibleDataIndices, setVisibleRange]);


  
  // Find the nearest zoom level based on candle count
  const findNearestZoomLevel = useCallback((targetCandleCount: number) => {
    return zoomLevels.reduce((prev, curr) => {
      return Math.abs(curr.candleCount - targetCandleCount) < Math.abs(prev.candleCount - targetCandleCount) 
        ? curr : prev;
    });
  }, []);


  // For handling trading hours toggle
  const handleTradingHoursToggle = useCallback(() => {
    setShowOnlyTradingHours(prev => {
      const newValue = !prev;
      localStorage.setItem('showOnlyTradingHours', String(newValue));
      return newValue;
    });
  }, []);
  
  // Handle zoom level changes from dropdown
  const handleZoomChange = useCallback((zoomLevelName: string) => {
    const selectedLevel = zoomLevels.find(level => level.name === zoomLevelName);
    if (selectedLevel) {
      // Reset pan state when zooming
      setPanState(prev => ({ 
        ...prev, 
        translateX: 0, 
        previousTranslateX: 0,
        momentum: 0
      }));
      
      setZoomState({
        level: selectedLevel,
        factor: 1.0,
        isCustomZoom: false
      });
    }
  }, [setPanState]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Handle pattern selection from clicks
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Math.abs(panState.translateX - panState.previousTranslateX) > 5) {
      // This was a drag, not a click
      return;
    }
    
    const canvas = interactionCanvasRef.current;
    if (!canvas || !onPatternSelect) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find the pattern at the clicked position
    const clickedPattern = findPatternAtPosition(x, y, visiblePatterns);
    // Only call onPatternSelect if we have a pattern (handle null case)
    if (clickedPattern) {
      onPatternSelect(clickedPattern);
    }
  }, [visiblePatterns, visibleRange, width, height, onPatternSelect, panState, CHART_MARGIN, filteredData, visibleDataIndices]);
  
  const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave } =
    usePanController(panState, setPanState, updateVisibleRangeFromPan);

  useZoomController({
    interactionCanvasRef,
    width,
    height,
    margin: CHART_MARGIN,
    effectiveCandleCount,
    visibleDataIndices,
    zoomState,
    setZoomState,
    setPanState,
    filteredData,
    showOnlyTradingHours,
    setVisibleDataIndices,
    setVisibleRange,
    updateVisibleRangeFromPan
  });
  
  const renderChart = useCallback(() => {
    orchestrateRender({
      mainCanvasRef,
      bufferCanvasRef,
      patternsCanvasRef,
      filteredData,
      visibleDataIndices,
      visibleRange,
      width,
      height,
      margin: CHART_MARGIN,
      visiblePatterns,
      selectedPattern: selectedPattern || null,
      timeframe,
      showOnlyTradingHours
    });
  }, [filteredData, visibleDataIndices, visibleRange, width, height, CHART_MARGIN, visiblePatterns, selectedPattern, timeframe, showOnlyTradingHours]);
  


  // Render on changes to relevant state
  useEffect(() => {
    renderChart();
  }, [renderChart]);
  
  return (
    <ChartContainer width={width} height={height}>
      {/* Main canvas for price data */}
      <Canvas
        ref={mainCanvasRef}
        width={width}
        height={height}
      />
      
      {/* Buffer canvas for double buffering */}
      <Canvas
        ref={bufferCanvasRef}
        width={width}
        height={height}
        style={{ display: 'none' }}
      />
      
      {/* Patterns overlay canvas */}
      <Canvas
        ref={patternsCanvasRef}
        width={width}
        height={height}
      />
      
      {/* Interaction canvas for handling events */}
      <Canvas
        ref={interactionCanvasRef}
        width={width}
        height={height}
        style={{ opacity: 0 }}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Timeframe selector and refresh button */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '6px 8px',
          borderRadius: 4,
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)',
          zIndex: 10,
          fontSize: 12
        }}
      >
        {!isFeatureEnabled('NEW_LAYOUT') && (
          <>
            <label
              htmlFor="timeframe-select"
              style={{
                fontWeight: 'bold',
                color: '#424242',
                whiteSpace: 'nowrap'
              }}
            >
              Timeframe:
            </label>
            <select
              id="timeframe-select"
              style={{
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: 12,
                minWidth: 120
              }}
              value={zoomState.isCustomZoom ? '' : zoomState.level.name}
              onChange={(e) => handleZoomChange(e.target.value)}
            >
              {zoomState.isCustomZoom && (
                <option value="" disabled>Custom zoom ({Math.round(zoomState.level.candleCount * zoomState.factor)} candles)</option>
              )}
              
              <optgroup label="1-minute candles">
                {zoomLevels.slice(0, 4).map(zoom => (
                  <option key={zoom.name} value={zoom.name}>
                    {zoom.label}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label="5-minute candles">
                {zoomLevels.slice(4, 7).map(zoom => (
                  <option key={zoom.name} value={zoom.name}>
                    {zoom.label}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label="15-minute candles">
                {zoomLevels.slice(7, 10).map(zoom => (
                  <option key={zoom.name} value={zoom.name}>
                    {zoom.label}
                  </option>
                ))}
              </optgroup>
              
              <optgroup label="Hourly view">
                {zoomLevels.slice(10).map(zoom => (
                  <option key={zoom.name} value={zoom.name}>
                    {zoom.label}
                  </option>
                ))}
              </optgroup>
            </select>
            
            {/* Refresh data button */}
            <button
              onClick={() => refreshData()}
              disabled={dataLoading}
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                border: '1px solid #e0e0e0',
                backgroundColor: '#fff',
                cursor: dataLoading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: '#424242',
                opacity: dataLoading ? 0.7 : 1,
                transition: 'all 0.2s ease'
              }}
              title="Refresh chart data"
            >
              {dataLoading ? (
                'Loading...'
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M23 4V10H17" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M1 20V14H7" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20.49 8.99999C19.2993 6.56779 17.2899 4.65085 14.8009 3.64761C12.3119 2.64437 9.52871 2.62367 7.02696 3.58931C4.5252 4.55495 2.49362 6.44226 1.27476 8.85891C0.0558974 11.2756 -0.302864 14.0559 0.258849 16.7132L1 20M23 4L22.259 7.28679C21.8562 9.17728 20.9868 10.9374 19.73 12.4" stroke="#424242" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Trading hours toggle */}
      {!isFeatureEnabled('NEW_LAYOUT') && (
        <div style={{
          position: 'absolute',
          top: 50,
          left: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '4px 8px',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          zIndex: 10
        }}>
          <input
            type="checkbox"
            id="trading-hours-toggle"
            checked={showOnlyTradingHours}
            onChange={handleTradingHoursToggle}
            style={{ cursor: 'pointer' }}
          />
          <label 
            htmlFor="trading-hours-toggle"
            style={{ 
              fontSize: '12px', 
              color: '#424242',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Show only trading hours
          </label>
        </div>
      )}
    </ChartContainer>
  );
};

export default TriSightChart;
