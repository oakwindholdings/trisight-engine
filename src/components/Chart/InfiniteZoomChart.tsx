// src/components/Chart/InfiniteZoomChart.tsx
// Enhanced chart with infinite zoom capabilities
// Dynamically loads and displays data at appropriate resolutions

import React, { useState, useRef, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { CandlestickData } from '../../models/ChartTypes';
import { Pattern } from '../../models/PatternTypes';
import { useInfiniteZoomController } from '../../hooks/useInfiniteZoomController';
import { usePanController, PanState } from '../../hooks/usePanController';
import { renderChart } from './RenderOrchestrator';
import ResolutionIndicator from './ResolutionIndicator';
import { ResolutionConfig, getOptimalResolution } from '../../utils/dataResolution';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import { createPriceScale } from '../../utils/scaling';
import { ChartPatternLayer } from './ChartPatternLayer';
import { PatternProvider, usePatternContext } from '../../contexts/PatternContext';
import { useHoverMetrics } from '../../hooks/useHoverMetrics';
import { MetricPopover } from './MetricPopover';
import { usePatternBus } from '../../hooks/usePatternBus';
import './InfiniteZoomChart.css';

interface InfiniteZoomChartProps {
  symbol: string;
  patterns?: Pattern[];
  width: number;
  height: number;
  onPatternSelect?: (pattern: Pattern | null) => void;
  selectedPattern?: Pattern | null;
  startDate?: Date;
  endDate?: Date;
}

export interface InfiniteZoomChartRef {
  zoomToFit: () => void;
}

const CHART_MARGIN = { top: 20, right: 60, bottom: 40, left: 60 };

// Inner component that uses pattern context
const InfiniteZoomChartInner = forwardRef<InfiniteZoomChartRef, InfiniteZoomChartProps>(({
  symbol,
  patterns = [],
  width,
  height,
  onPatternSelect,
  selectedPattern: selectedPatternProp,
  startDate,
  endDate
}, ref) => {
  if (process.env.NODE_ENV === 'development') {
    // console.log('InfiniteZoomChart Component Render:', {
    //   symbol,
    //   startDate: startDate?.toISOString(),
    //   endDate: endDate?.toISOString(),
    //   width,
    //   height,
    //   patternsCount: patterns.length
    // });
  }
  
  // Canvas refs
  const mainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Chart state
  const [visibleRange, setVisibleRange] = useState({
    startTime: startDate || new Date(),
    endTime: endDate || new Date(),
    minPrice: 180,  // More reasonable default
    maxPrice: 220   // More reasonable default
  });
  const [visibleDataIndices, setVisibleDataIndices] = useState({ start: 0, end: 0 });
  const [initialVisibleIndices, setInitialVisibleIndices] = useState({ start: 0, end: 0 });

  // Pan state
  const [panState, setPanState] = useState<PanState>({
    isPanning: false,
    startX: 0,
    previousTranslateX: 0,
    translateX: 0,
    momentum: 0
  });

  // Chart data state
  const [error, setError] = useState<Error | null>(null);
  const dataGenerationRef = useRef(0);
  const [currentDataHash, setCurrentDataHash] = useState<string>('');

  // Get pattern context to trigger detection
  const patternContext = usePatternContext();

  // Handle data updates from zoom controller
  const handleDataUpdate = useCallback((data: CandlestickData[], resolution: ResolutionConfig) => {
    dataGenerationRef.current += 1;
    const generation = dataGenerationRef.current;
    
    // Create a hash to identify this specific dataset
    const dataHash = data.length > 0 ? 
      `${data[0].datetime}_${data[data.length - 1].datetime}_${data.length}` : 
      'no_data';
    setCurrentDataHash(dataHash);
    
    console.log('[InfiniteZoomChart] handleDataUpdate called:', {
      generation,
      dataHash,
      dataLength: data.length,
      resolution: resolution.interval,
      firstCandle: data[0] ? { time: data[0].datetime, close: data[0].close } : null,
      lastCandle: data[data.length - 1] ? { time: data[data.length - 1].datetime, close: data[data.length - 1].close } : null
    });
    
    // Update visible indices
    if (data.length > 0) {
      const endIndex = data.length - 1;
      const startIndex = Math.max(0, endIndex - 100);
      
      console.log('[InfiniteZoomChart] Updating visible indices:', {
        start: startIndex,
        end: endIndex,
        dataLength: data.length
      });
      
      setVisibleDataIndices(prev => {
        // Only update if indices actually changed
        if (prev.start !== startIndex || prev.end !== endIndex) {
          return { start: startIndex, end: endIndex };
        }
        return prev;
      });
      
      // Also update initial indices if not set
      setInitialVisibleIndices(prev => {
        if (prev.start === 0 && prev.end === 0) {
          return { start: startIndex, end: endIndex };
        }
        return prev;
      });
    }
    // console.log('[InfiniteZoomChart] Data updated:', {
    //   dataLength: data.length,
    //   resolution,
    //   firstCandle: data[0],
    //   lastCandle: data[data.length - 1]
    // });
    
    // Trigger pattern detection on the new data
    if (patternContext.detectPatterns && data.length > 0) {
      // console.log('[InfiniteZoomChart] Triggering pattern detection on new data');
      patternContext.detectPatterns(data);
    }
  }, [patternContext]);

  // Handle zoom state changes
  const handleZoomChange = useCallback((state: any) => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - handleZoomChange called with state:', state);
    }
    // Reset pan when zooming
    setPanState(prev => ({ 
      ...prev,
      translateX: 0, 
      momentum: 0,
      isPanning: false
    }));
  }, []);

  // Initialize zoom controller
  const zoomController = useInfiniteZoomController({
    interactionCanvasRef,
    width,
    height,
    margin: CHART_MARGIN,
    symbol,
    onDataUpdate: handleDataUpdate,
    onZoomChange: handleZoomChange,
    setPanState,
    startDate,
    endDate
  });

  const { 
    data: chartData, 
    loading: isLoading, 
    zoomLevel,
    targetCandles,
    currentResolution,
    isTransitioning,
    zoomToFit: zoomToFitController,
    resetZoom
  } = zoomController;

  // Use pattern bus to populate arrays with the chart data
  const { isPatternDetectionComplete, processedDataHash } = usePatternBus(chartData);
  
  // Check if pattern data is synchronized with chart data
  const isPatternDataSynchronized = isPatternDetectionComplete && processedDataHash === currentDataHash;
  
  // Calculate candle width based on chart dimensions and target candles
  const candleWidth = useMemo(() => {
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    return chartWidth / targetCandles;
  }, [width, targetCandles]);

  // Use hover metrics hook - now inside PatternProvider context
  const { hoverData, HoverMetricsProvider } = useHoverMetrics(
    containerRef, 
    candleWidth, 
    visibleDataIndices.start
  );
  
  // Log when pattern detection state changes
  useEffect(() => {
    console.log('[InfiniteZoomChart] Pattern synchronization:', {
      isPatternDetectionComplete,
      isPatternDataSynchronized,
      currentDataHash,
      processedDataHash,
      matches: processedDataHash === currentDataHash
    });
  }, [isPatternDetectionComplete, isPatternDataSynchronized, currentDataHash, processedDataHash]);

  // Dynamic pattern detection state
  const [localPatterns, setLocalPatterns] = useState<Pattern[]>([]);
  const [isDetectingPatterns, setIsDetectingPatterns] = useState(false);

  // Initialize pattern detection service
  // const patternDetectorRef = useRef(new any());

  // Create ref for chart data to avoid stale closures
  const chartDataRef = useRef<CandlestickData[]>([]);
  const visibleDataIndicesRef = useRef({ start: 0, end: 0 });

  // Update refs when values change
  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  useEffect(() => {
    visibleDataIndicesRef.current = visibleDataIndices;
  }, [visibleDataIndices]);

  // Detect patterns on visible data after zoom/pan completes
  const detectPatternsForVisibleData = useCallback(async () => {
    if (!chartData.length || isDetectingPatterns) return;
    
    // Get the visible data slice
    const visibleData = chartData.slice(
      visibleDataIndices.start,
      visibleDataIndices.end + 1
    );
    
    if (visibleData.length < 10) {
      // Not enough data for pattern detection
      setLocalPatterns([]);
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Detecting patterns for visible data:', {
      //   visibleDataLength: visibleData.length,
      //   visibleIndices: visibleDataIndices
      // });
    }
    
    setIsDetectingPatterns(true);
    
    try {
      // Run pattern detection on visible data
      const detectedPatterns: Pattern[] = [];
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - Patterns detected:', detectedPatterns.length);
      }
      setLocalPatterns(detectedPatterns);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // console.error('InfiniteZoomChart - Pattern detection error:', error);
      }
      setLocalPatterns([]);
    } finally {
      setIsDetectingPatterns(false);
    }
  }, [chartData, visibleDataIndices, isDetectingPatterns]);

  // Debounce pattern detection to avoid too many calls during rapid zoom/pan
  const debouncedPatternDetection = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        detectPatternsForVisibleData();
      }, 500); // Wait 500ms after last zoom/pan action
    };
  }, [detectPatternsForVisibleData]);

  // Trigger pattern detection when visible data changes
  useEffect(() => {
    if (chartData.length > 0 && !isLoading) {
      debouncedPatternDetection();
    }
  }, [visibleDataIndices, chartData.length, isLoading, debouncedPatternDetection]);

  // Update visible indices when zoom level changes
  useEffect(() => {
    if (chartData.length === 0) return;
    
    // Calculate new visible indices based on targetCandles
    const endIndex = chartData.length - 1;
    const startIndex = Math.max(0, endIndex - targetCandles + 1);
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('Zoom changed - updating visible indices:', {
      //   targetCandles,
      //   startIndex,
      //   endIndex,
      //   dataLength: chartData.length
      // });
    }
    
    setVisibleDataIndices({ start: startIndex, end: endIndex });
    
    // Update visible range for price scaling
    const visibleData = chartData.slice(startIndex, endIndex + 1);
    if (visibleData.length > 0) {
      const prices = visibleData.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices) * 0.99;
      const maxPrice = Math.max(...prices) * 1.01;
      
      setVisibleRange({
        startTime: new Date(visibleData[0].timestamp),
        endTime: new Date(visibleData[visibleData.length - 1].timestamp),
        minPrice,
        maxPrice
      });
    }
  }, [targetCandles, chartData]);

  // Update visible range and data indices when data or zoom changes
  useEffect(() => {
    const hasData = chartData.length > 0;
    if (!hasData) return;

    // For infinite zoom, we use the visible indices from the zoom controller
    const visibleData = chartData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    if (visibleData.length > 0) {
      // Get first and last candle times
      const firstCandle = visibleData[0];
      const lastCandle = visibleData[visibleData.length - 1];
      const startTime = new Date(firstCandle.timestamp);
      const endTime = new Date(lastCandle.timestamp);
      
      setVisibleRange(prev => ({
        ...prev,
        startTime,
        endTime
      }));
    }
  }, [chartData, visibleDataIndices]);

  // Update visible range from pan
  const updateVisibleRangeFromPan = useCallback((translateX: number) => {
    const data = chartDataRef.current;
    if (data.length === 0) return;
    
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const candleWidth = chartWidth / targetCandles;
    
    // Apply damping factor to reduce sensitivity (0.3 = 30% of actual movement)
    const dampingFactor = 0.3;
    const dampedTranslateX = translateX * dampingFactor;
    
    const candleShift = Math.round(-dampedTranslateX / candleWidth);
    
    // When panning starts, store the initial indices
    if (panState.isPanning && !visibleDataIndices.start && !visibleDataIndices.end) {
      setVisibleDataIndices({ 
        start: visibleDataIndicesRef.current.start, 
        end: visibleDataIndicesRef.current.end 
      });
    }
    
    // Use initial indices as base for calculation
    const baseStart = panState.isPanning ? visibleDataIndices.start : visibleDataIndicesRef.current.start;
    const baseEnd = panState.isPanning ? visibleDataIndices.end : visibleDataIndicesRef.current.end;
    
    let startIndex = baseStart + candleShift;
    let endIndex = baseEnd + candleShift;
    
    // Clamp to data bounds
    if (endIndex >= data.length) {
      endIndex = data.length - 1;
      startIndex = Math.max(0, endIndex - targetCandles);
    }
    if (startIndex < 0) {
      startIndex = 0;
      endIndex = Math.min(data.length - 1, startIndex + targetCandles);
    }
    
    if (startIndex !== visibleDataIndicesRef.current.start || endIndex !== visibleDataIndicesRef.current.end) {
      setVisibleDataIndices({ start: startIndex, end: endIndex });
      
      // Update visible range for price scaling
      const visibleData = data.slice(startIndex, endIndex + 1);
      if (visibleData.length > 0) {
        const prices = visibleData.flatMap(d => [d.high, d.low]);
        const minPrice = Math.min(...prices) * 0.99;
        const maxPrice = Math.max(...prices) * 1.01;
        
        setVisibleRange({
          startTime: new Date(visibleData[0].timestamp),
          endTime: new Date(visibleData[visibleData.length - 1].timestamp),
          minPrice,
          maxPrice
        });
      }
    }
  }, [width, targetCandles, panState.isPanning, visibleDataIndices.start, visibleDataIndices.end]);

  // Initialize pan controller
  const panController = usePanController(
    panState,
    setPanState,
    updateVisibleRangeFromPan
  );

  // Handle pattern selection
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Canvas clicked at:', { x, y });
    }
    
    if (chartData.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - No chart data available');
      }
      return;
    }
    
    // Create scales for pattern detection
    const visibleData = chartData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    const timeScale = createSequentialTimeScale(
      width - CHART_MARGIN.left - CHART_MARGIN.right,
      visibleData,
      [0, visibleData.length - 1]
    );
    const priceScale = createPriceScale(
      height - CHART_MARGIN.top - CHART_MARGIN.bottom,
      [visibleRange.minPrice, visibleRange.maxPrice]
    );
    
    // Find pattern label at click position
    let clickedPattern: Pattern | null = null;
    const allPatterns = [...patterns, ...localPatterns];
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Checking patterns:', allPatterns.length, 'patterns');
    }
    
    // Check each pattern directly
    for (const pattern of allPatterns) {
      // Simple bounds check for pattern area (can be enhanced later)
      const startIndex = chartData.findIndex(c => new Date(c.timestamp) >= pattern.startTime);
      const endIndex = chartData.findIndex(c => new Date(c.timestamp) >= pattern.endTime);
      
      if (startIndex >= 0 && endIndex >= 0) {
        const xStart = timeScale.scale(pattern.startTime);
        const xEnd = timeScale.scale(pattern.endTime);
        
        // Check if click is within pattern horizontal bounds
        if (x >= xStart && x <= xEnd) {
          clickedPattern = pattern;
          break;
        }
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Click result:', clickedPattern ? 'Pattern found' : 'No pattern found');
    }
    
    if (clickedPattern && onPatternSelect) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - Calling onPatternSelect with pattern:', clickedPattern.type);
      }
      onPatternSelect(clickedPattern);
    }
  }, [patterns, localPatterns, chartData, visibleDataIndices, visibleRange, onPatternSelect, width, height]);

  // Render chart when data or view changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart render effect:', {
      //   dataLength: chartData.length,
      //   visibleDataIndices,
      //   isLoading,
      //   currentResolution
      // });
    }
    
    if (chartData.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - No data to render');
      }
      // Clear the canvases when there's no data
      const canvases = [mainCanvasRef, patternsCanvasRef];
      canvases.forEach(ref => {
        if (ref.current) {
          const ctx = ref.current.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, width, height);
          }
        }
      });
      return;
    }
    
    const visiblePatterns = [...patterns, ...localPatterns].filter(pattern => {
      const patternStart = pattern.startTime.getTime();
      const patternEnd = pattern.endTime.getTime();
      const visibleStart = chartData[visibleDataIndices.start]?.timestamp || 0;
      const visibleEnd = chartData[visibleDataIndices.end]?.timestamp || 0;
      
      return patternStart <= visibleEnd && patternEnd >= visibleStart;
    });
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Rendering with data:', {
      //   dataLength: chartData.length,
      //   visibleIndices: visibleDataIndices,
      //   visiblePatternsCount: visiblePatterns.length
      // });
    }
    
    renderChart({
      mainCanvasRef,
      bufferCanvasRef,
      patternsCanvasRef,
      filteredData: chartData,
      visibleDataIndices,
      visibleRange,
      width,
      height,
      margin: CHART_MARGIN,
      visiblePatterns,
      selectedPattern: selectedPatternProp || null,
      timeframe: currentResolution?.timeframe || '1min',
      showOnlyTradingHours: false
    });
  }, [chartData, visibleDataIndices, visibleRange, width, height, patterns, selectedPatternProp, currentResolution, localPatterns, isLoading]);

  // Setup canvas dimensions
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Setting up canvas dimensions:', { width, height });
    }
    const canvases = [mainCanvasRef, bufferCanvasRef, patternsCanvasRef, interactionCanvasRef];
    canvases.forEach(ref => {
      if (ref.current) {
        ref.current.width = width;
        ref.current.height = height;
        
        // Draw a background on main canvas to make it visible
        if (ref === mainCanvasRef) {
          const ctx = ref.current.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#f9fafb';
            ctx.fillRect(0, 0, width, height);
          }
        }
      }
    });
  }, [width, height]);

  // Expose zoomToFit to parent components
  useImperativeHandle(ref, () => ({
    zoomToFit: () => {
      if (zoomToFitController) {
        zoomToFitController();
      }
    }
  }), [zoomToFitController]);

  // Auto-scale when data is first loaded or changes significantly
  useEffect(() => {
    if (chartData.length > 0 && zoomToFitController) {
      // Small delay to ensure chart is rendered
      const timer = setTimeout(() => {
        zoomToFitController();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [chartData.length > 0, zoomToFitController, startDate, endDate]);

  // Update visible range when date props change
  useEffect(() => {
    if (startDate && endDate) {
      setVisibleRange(prev => ({
        ...prev,
        startTime: startDate,
        endTime: endDate
      }));
      
      // Reset zoom and pan when date range changes
      if (resetZoom) {
        resetZoom();
      }
      setPanState({
        isPanning: false,
        startX: 0,
        previousTranslateX: 0,
        translateX: 0,
        momentum: 0
      });
    }
  }, [startDate, endDate, resetZoom]);

  return (
    <HoverMetricsProvider value={hoverData}>
      <div className="infinite-zoom-chart-container" ref={containerRef}>
        <MetricPopover />
        <div className="canvas-stack" style={{ width, height }}>
          <canvas ref={mainCanvasRef} className="main-canvas" />
          <canvas ref={bufferCanvasRef} className="buffer-canvas" style={{ display: 'none' }} />
          <canvas ref={patternsCanvasRef} className="patterns-canvas" />
          <canvas 
            ref={interactionCanvasRef} 
            className="interaction-canvas"
            onClick={handleCanvasClick}
            onMouseDown={panController.handleMouseDown}
            onMouseMove={panController.handleMouseMove}
            onMouseUp={panController.handleMouseUp}
            onMouseLeave={panController.handleMouseLeave}
            onWheel={zoomController.handleWheel}
            onTouchStart={panController.handleTouchStart}
            onTouchMove={(e) => {
              panController.handleTouchMove(e);
              zoomController.handlePinch(e);
            }}
            onTouchEnd={panController.handleTouchEnd}
            style={{ cursor: panState.isPanning ? 'grabbing' : 'crosshair' }}
          />
          
          {/* Pattern overlay */}
          <svg className="pattern-overlay">
            <g transform={`translate(${CHART_MARGIN.left}, ${CHART_MARGIN.top})`}>
              <ChartPatternLayer
                candles={chartData}
                xScale={(index: number) => {
                  const visibleData = chartData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
                  const timeScale = createSequentialTimeScale(
                    width - CHART_MARGIN.left - CHART_MARGIN.right,
                    visibleData,
                    [0, visibleData.length - 1]
                  );
                  const candle = chartData[index];
                  if (!candle) return 0;
                  return timeScale.scale(new Date(candle.timestamp));
                }}
                yScale={(price: number) => {
                  const priceScale = createPriceScale(
                    height - CHART_MARGIN.top - CHART_MARGIN.bottom,
                    [visibleRange.minPrice, visibleRange.maxPrice]
                  );
                  return priceScale.scale(price);
                }}
                width={width - CHART_MARGIN.left - CHART_MARGIN.right}
                height={height - CHART_MARGIN.top - CHART_MARGIN.bottom}
              />
            </g>
          </svg>
          
          {currentResolution && (
            <ResolutionIndicator
              resolution={currentResolution}
              zoomLevel={zoomLevel}
              candleCount={targetCandles}
              isTransitioning={isTransitioning}
            />
          )}
          
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <div className="loading-text">Loading {currentResolution?.label} data...</div>
            </div>
          )}
          
          {error && (
            <div className="error-overlay">
              <div className="error-message">{error.message}</div>
            </div>
          )}
          
          {!isLoading && !error && chartData.length === 0 && (
            <div className="error-overlay">
              <div className="error-message">No data available. Please check symbol and date range.</div>
            </div>
          )}
        </div>
        
        <div className="zoom-controls">
          <button 
            className="zoom-button"
            onClick={() => zoomController.zoomTo(zoomLevel * 1.5)}
            title="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 9a1 1 0 100 2h10a1 1 0 100-2H5z" />
            </svg>
          </button>
          
          <button 
            className="zoom-button"
            onClick={() => zoomController.resetZoom()}
            title="Reset Zoom"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3a6 6 0 11-4.84 9.5 1 1 0 011.68-1.09A4 4 0 109 5a1 1 0 100-2zm-2 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
            </svg>
          </button>
          
          <button 
            className="zoom-button"
            onClick={() => zoomController.zoomTo(zoomLevel * 0.67)}
            title="Zoom In"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          </button>
        </div>
      </div>
    </HoverMetricsProvider>
  );
});

InfiniteZoomChartInner.displayName = 'InfiniteZoomChartInner';

// Main component - no need for PatternProvider wrapper since it's already in AppProviders
const InfiniteZoomChart = forwardRef<InfiniteZoomChartRef, InfiniteZoomChartProps>((props, ref) => {
  return <InfiniteZoomChartInner {...props} ref={ref} />;
});

InfiniteZoomChart.displayName = 'InfiniteZoomChart';

export default InfiniteZoomChart;
