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
  data?: CandlestickData[];  // Add data prop to receive candles from parent
}

export interface InfiniteZoomChartRef {
  zoomToFit: () => void;
}

const CHART_MARGIN = { top: 20, right: 60, bottom: 40, left: 60 };

// Inner component that uses pattern context
const InfiniteZoomChartInner: React.ForwardRefRenderFunction<InfiniteZoomChartRef, InfiniteZoomChartProps> = (
  {
    symbol,
    patterns = [],
    width,
    height,
    onPatternSelect,
    selectedPattern: selectedPatternProp,
    startDate,
    endDate,
    data: dataProp
  },
  ref
) => {
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

  // Track if indices have been initialized
  const indicesInitializedRef = useRef(false);

  // Track previous date range to detect actual changes
  const previousDateRangeRef = useRef<{ start?: Date; end?: Date }>({});

  // Reset initialization flag when symbol changes
  useEffect(() => {
    indicesInitializedRef.current = false;
  }, [symbol]);

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
    
    // Store data hash to detect changes
    const newHash = `${data.length}_${data[0]?.timestamp}_${data[data.length - 1]?.timestamp}`;
    if (newHash !== currentDataHash) {
      setCurrentDataHash(newHash);
      
      // Trigger pattern detection on the new data
      // This ensures pattern arrays are synchronized with the displayed data
      if (patternContext && typeof patternContext.detectPatterns === 'function') {
        console.log('[InfiniteZoomChart] Calling detectPatterns with', data.length, 'candles');
        patternContext.detectPatterns(data);
      } else {
        console.log('[InfiniteZoomChart] Pattern context not available:', {
          patternContext: !!patternContext,
          hasDetectPatterns: patternContext && typeof patternContext.detectPatterns === 'function'
        });
      }
    }
    
    // Don't update indices here - let them be updated by the effect
  }, [currentDataHash, patternContext]);

  // Initialize zoom controller
  const zoomController = useInfiniteZoomController({
    interactionCanvasRef,
    width,
    height,
    margin: CHART_MARGIN,
    symbol,
    onDataUpdate: handleDataUpdate,
    onZoomChange: (state) => {
      // Zoom state changes are now handled by the controller
    },
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
    resetZoom: resetZoomController
  } = zoomController;

  // Combine the data source - prefer dataProp from parent over chartData
  const dataToUse = dataProp || chartData;

  // Debug: Check data alignment
  useEffect(() => {
    if (dataToUse.length > 0) {
      console.log('[InfiniteZoomChart] Data alignment check:', {
        dataLength: dataToUse.length,
        firstCandle: { 
          time: dataToUse[0].datetime, 
          close: dataToUse[0].close 
        },
        lastCandle: { 
          time: dataToUse[dataToUse.length - 1].datetime, 
          close: dataToUse[dataToUse.length - 1].close 
        },
        visibleIndices: visibleDataIndices,
        visibleCandles: visibleDataIndices.end > 0 ? {
          start: dataToUse[visibleDataIndices.start],
          end: dataToUse[visibleDataIndices.end]
        } : null
      });
    }
  }, [dataToUse.length, visibleDataIndices.start, visibleDataIndices.end]);

  // Log when pattern detection state changes
  useEffect(() => {
    // console.log('[InfiniteZoomChart] Pattern synchronization:', {
    //   isPatternDetectionComplete,
    //   isPatternDataSynchronized,
    //   currentDataHash,
    //   processedDataHash,
    //   matches: processedDataHash === currentDataHash
    // });
  }, [currentDataHash]);

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
    chartDataRef.current = dataToUse;
  }, [dataToUse]);

  useEffect(() => {
    visibleDataIndicesRef.current = visibleDataIndices;
  }, [visibleDataIndices]);

  // Detect patterns on visible data after zoom/pan completes
  const detectPatternsForVisibleData = useCallback(async () => {
    if (!dataToUse.length || isDetectingPatterns) return;
    
    // Get the visible data slice
    const visibleData = dataToUse.slice(
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
  }, [dataToUse, visibleDataIndices, isDetectingPatterns]);

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
    if (dataToUse.length > 0 && !isLoading) {
      debouncedPatternDetection();
    }
  }, [visibleDataIndices, dataToUse.length, isLoading, debouncedPatternDetection]);

  // Update visible range when visible data indices change
  useEffect(() => {
    const hasData = dataToUse.length > 0;
    if (!hasData) return;

    // For infinite zoom, we use the visible indices from the zoom controller
    const visibleData = dataToUse.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    if (visibleData.length > 0) {
      // Get first and last candle times
      const firstCandle = visibleData[0];
      const lastCandle = visibleData[visibleData.length - 1];
      const startTime = new Date(firstCandle.timestamp);
      const endTime = new Date(lastCandle.timestamp);
      
      // Calculate price range with some padding
      let minPrice = Number.MAX_VALUE;
      let maxPrice = Number.MIN_VALUE;
      
      for (const candle of visibleData) {
        minPrice = Math.min(minPrice, candle.low);
        maxPrice = Math.max(maxPrice, candle.high);
      }
      
      // Add 5% padding to price range
      const pricePadding = (maxPrice - minPrice) * 0.05;
      minPrice -= pricePadding;
      maxPrice += pricePadding;
      
      setVisibleRange(prev => {
        // Only update if values actually changed
        if (prev.startTime?.getTime() === startTime.getTime() &&
            prev.endTime?.getTime() === endTime.getTime() &&
            prev.minPrice === minPrice &&
            prev.maxPrice === maxPrice) {
          return prev;
        }
        return {
          startTime,
          endTime,
          minPrice,
          maxPrice
        };
      });
    }
  }, [dataToUse.length, visibleDataIndices.start, visibleDataIndices.end]);

  // Update visible indices when data first loads or changes
  useEffect(() => {
    if (dataToUse.length > 0 && targetCandles > 0) {
      // Only initialize indices if they haven't been set yet
      // or if the data has completely changed (different length)
      const needsInitialization = !indicesInitializedRef.current || 
                                  visibleDataIndicesRef.current.end >= dataToUse.length ||
                                  visibleDataIndicesRef.current.end === 0;
      
      if (needsInitialization) {
        // Initialize to show the most recent data
        const endIndex = dataToUse.length - 1;
        const startIndex = Math.max(0, endIndex - targetCandles + 1);
        
        setVisibleDataIndices({ start: startIndex, end: endIndex });
        visibleDataIndicesRef.current = { start: startIndex, end: endIndex };
        indicesInitializedRef.current = true;
        
        console.log('[InfiniteZoomChart] Initialized visible indices:', {
          start: startIndex,
          end: endIndex,
          targetCandles,
          dataLength: dataToUse.length
        });
      }
    }
  }, [dataToUse.length]); // Remove targetCandles from dependencies to prevent re-centering on zoom

  // Handle zoom changes - update visible indices while maintaining focus
  useEffect(() => {
    if (dataToUse.length > 0 && targetCandles > 0 && indicesInitializedRef.current) {
      const currentStart = visibleDataIndicesRef.current.start;
      const currentEnd = visibleDataIndicesRef.current.end;
      const currentRange = currentEnd - currentStart + 1;
      
      // Only update if the range has changed (zoom occurred)
      if (currentRange !== targetCandles) {
        // Calculate the center point of the current view
        const currentCenter = (currentStart + currentEnd) / 2;
        
        // Calculate new indices centered on the current center
        const halfRange = targetCandles / 2;
        let newStart = Math.round(currentCenter - halfRange);
        let newEnd = Math.round(currentCenter + halfRange - 1);
        
        // Clamp to data bounds
        if (newEnd >= dataToUse.length) {
          newEnd = dataToUse.length - 1;
          newStart = Math.max(0, newEnd - targetCandles + 1);
        }
        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(dataToUse.length - 1, newStart + targetCandles - 1);
        }
        
        // Update indices
        setVisibleDataIndices({ start: newStart, end: newEnd });
        visibleDataIndicesRef.current = { start: newStart, end: newEnd };
        
        console.log('[InfiniteZoomChart] Zoom update - visible indices adjusted:', {
          oldRange: currentRange,
          newRange: targetCandles,
          oldIndices: { start: currentStart, end: currentEnd },
          newIndices: { start: newStart, end: newEnd },
          center: currentCenter
        });
      }
    }
  }, [targetCandles, dataToUse.length]);

  // Update visible range from pan
  const updateVisibleRangeFromPan = useCallback((translateX: number) => {
    const data = chartDataRef.current;
    if (data.length === 0) return;
    
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const candleWidth = chartWidth / targetCandles;
    
    // Apply damping based on zoom level
    const baseDamping = 0.3;
    const zoomDamping = Math.min(100 / targetCandles, 2);
    const dampingFactor = baseDamping / zoomDamping;
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
  }, [width, targetCandles, visibleDataIndices.start, visibleDataIndices.end]);

  // Initialize pan controller
  const panController = usePanController(
    panState,
    setPanState,
    updateVisibleRangeFromPan,
    targetCandles
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
    
    if (dataToUse.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - No chart data available');
      }
      return;
    }
    
    // Create scales for pattern detection
    const visibleData = dataToUse.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
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
      const startIndex = dataToUse.findIndex(c => new Date(c.timestamp) >= pattern.startTime);
      const endIndex = dataToUse.findIndex(c => new Date(c.timestamp) >= pattern.endTime);
      
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
  }, [patterns, localPatterns, dataToUse, visibleDataIndices, visibleRange, onPatternSelect, width, height]);

  // Render chart when data or view changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart render effect:', {
      //   dataLength: dataToUse.length,
      //   visibleDataIndices,
      //   isLoading,
      //   currentResolution
      // });
    }
    
    if (dataToUse.length === 0) {
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
      const visibleStart = dataToUse[visibleDataIndices.start]?.timestamp || 0;
      const visibleEnd = dataToUse[visibleDataIndices.end]?.timestamp || 0;
      
      return patternStart <= visibleEnd && patternEnd >= visibleStart;
    });
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Rendering with data:', {
      //   dataLength: dataToUse.length,
      //   visibleIndices: visibleDataIndices,
      //   visiblePatternsCount: visiblePatterns.length
      // });
    }
    
    renderChart({
      mainCanvasRef,
      bufferCanvasRef,
      patternsCanvasRef,
      filteredData: dataToUse,
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
  }, [dataToUse, visibleDataIndices, visibleRange, width, height, patterns, selectedPatternProp, currentResolution, localPatterns, isLoading]);

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
    if (dataToUse.length > 0 && zoomToFitController && !indicesInitializedRef.current) {
      // Small delay to ensure chart is rendered
      const timer = setTimeout(() => {
        zoomToFitController();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [dataToUse.length, zoomToFitController]);

  // Update visible range when date props change
  useEffect(() => {
    if (startDate && endDate) {
      // Check if dates actually changed
      const prevStart = previousDateRangeRef.current.start;
      const prevEnd = previousDateRangeRef.current.end;
      
      const datesChanged = !prevStart || !prevEnd || 
        prevStart.getTime() !== startDate.getTime() || 
        prevEnd.getTime() !== endDate.getTime();
      
      if (datesChanged) {
        previousDateRangeRef.current = { start: startDate, end: endDate };
        
        setVisibleRange(prev => ({
          ...prev,
          startTime: startDate,
          endTime: endDate
        }));
        
        // Reset zoom and pan when date range changes
        if (resetZoomController) {
          resetZoomController();
        }
        setPanState({
          isPanning: false,
          startX: 0,
          previousTranslateX: 0,
          translateX: 0,
          momentum: 0
        });
      }
    }
  }, [startDate, endDate, resetZoomController, setPanState]);

  // Use hover metrics with the same data we're rendering
  const timeScale = useMemo(() => {
    const visibleData = dataToUse.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    if (!visibleData.length) {
      return createSequentialTimeScale(
        width - CHART_MARGIN.left - CHART_MARGIN.right,
        dataToUse,
        [0, dataToUse.length - 1]
      );
    }
    
    console.log('[InfiniteZoomChart] Creating timeScale for visible data:', {
      visibleDataLength: visibleData.length,
      visibleStart: visibleDataIndices.start,
      visibleEnd: visibleDataIndices.end,
      firstVisible: visibleData[0]?.datetime,
      lastVisible: visibleData[visibleData.length - 1]?.datetime
    });
    
    return createSequentialTimeScale(
      width - CHART_MARGIN.left - CHART_MARGIN.right,
      visibleData,
      [0, visibleData.length - 1]
    );
  }, [width, visibleDataIndices.start, visibleDataIndices.end, dataToUse]);
  
  const { hoverData, HoverMetricsProvider } = useHoverMetrics(
    containerRef, 
    timeScale,  // Use the same timeScale we calculated above
    dataToUse,  // Pass the same data we're rendering
    CHART_MARGIN,
    visibleDataIndices
  );

  // Debug hover data
  useEffect(() => {
    if (hoverData) {
      console.log('[InfiniteZoomChart] Hover data:', {
        hoverIndex: hoverData.idx,
        hoverCandle: hoverData.candle,
        expectedCandle: dataToUse[hoverData.idx],
        match: hoverData.candle === dataToUse[hoverData.idx]
      });
    }
  }, [hoverData, dataToUse]);

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
                candles={dataToUse}
                xScale={(index: number) => {
                  const visibleData = dataToUse.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
                  const timeScale = createSequentialTimeScale(
                    width - CHART_MARGIN.left - CHART_MARGIN.right,
                    visibleData,
                    [0, visibleData.length - 1]
                  );
                  const candle = dataToUse[index];
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
          
          {!isLoading && !error && dataToUse.length === 0 && (
            <div className="error-overlay">
              <div className="error-message">No data available. Please check symbol and date range.</div>
            </div>
          )}
        </div>
        
        <div className="zoom-controls">
          <button 
            className="zoom-button"
            onClick={() => {
              zoomController.zoomTo(zoomLevel * 1.5);
            }}
            title="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 9a1 1 0 100 2h10a1 1 0 100-2H5z" />
            </svg>
          </button>
          
          <button 
            className="zoom-button"
            onClick={() => {
              resetZoomController();
            }}
            title="Reset Zoom"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3a6 6 0 11-4.84 9.5 1 1 0 011.68-1.09A4 4 0 109 5a1 1 0 100-2zm-2 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
            </svg>
          </button>
          
          <button 
            className="zoom-button"
            onClick={() => {
              zoomController.zoomTo(zoomLevel * 0.67);
            }}
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
};

const InfiniteZoomChartInnerWithRef = forwardRef(InfiniteZoomChartInner);
InfiniteZoomChartInnerWithRef.displayName = 'InfiniteZoomChartInner';

// Main component - no need for PatternProvider wrapper since it's already in AppProviders
const InfiniteZoomChart = forwardRef<InfiniteZoomChartRef, InfiniteZoomChartProps>((props, ref) => {
  return <InfiniteZoomChartInnerWithRef {...props} ref={ref} />;
});

InfiniteZoomChart.displayName = 'InfiniteZoomChart';

export default InfiniteZoomChart;
