// src/components/Chart/InfiniteZoomChart.tsx
// Enhanced chart with infinite zoom capabilities
// Dynamically loads and displays data at appropriate resolutions
// CRITICAL: We use CANVAS for all rendering, NEVER SVG or other technologies.
// Pattern rendering happens via RenderOrchestrator -> PatternRenderer using Canvas 2D context.

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
import { Candle } from '../../types';
import { logDebug } from '../../utils/debug';
import { useHeikinAshiTransform } from '../../hooks/useHeikinAshiTransform';
import { useChartSettings } from '../../contexts/ChartSettingsContext';
import './InfiniteZoomChart.css';

// TradeActionSignal Integration
import { TradeActionBus } from '../../utils/trading/TradeActionSignal';
import { getTradeActionSignals } from '../../framework/tradeActionEmitter';

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
  timeframe?: string;  // Add timeframe prop to control candle display
}

export interface InfiniteZoomChartRef {
  zoomToFit: () => void;
  autoScale: () => void;
  resetView: () => void;
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
    data: dataProp,
    timeframe
  },
  ref
) => {
  if (process.env.NODE_ENV === 'development') {
    logDebug('DEBUG_RENDER_FLOW', '[InfiniteZoomChart] Component Render:', {
      symbol,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      width,
      height,
      patternsCount: patterns.length,
      hasDataProp: !!dataProp,
      dataPropLength: dataProp?.length || 0,
      timeframe
    });
    
    // DIAGNOSTIC: Log detailed data structure
    if (dataProp && dataProp.length > 0) {
      logDebug('DEBUG_RENDER_FLOW', '[DIAGNOSTIC] InfiniteZoomChart received data:', {
        totalCandles: dataProp.length,
        firstCandle: {
          ...dataProp[0],
          timestampCheck: {
            value: dataProp[0].timestamp,
            type: typeof dataProp[0].timestamp,
            asDate: new Date(dataProp[0].timestamp).toISOString(),
            isValidDate: !isNaN(new Date(dataProp[0].timestamp).getTime())
          }
        },
        lastCandle: {
          ...dataProp[dataProp.length - 1],
          timestampCheck: {
            value: dataProp[dataProp.length - 1].timestamp,
            type: typeof dataProp[dataProp.length - 1].timestamp,
            asDate: new Date(dataProp[dataProp.length - 1].timestamp).toISOString(),
            isValidDate: !isNaN(new Date(dataProp[dataProp.length - 1].timestamp).getTime())
          }
        }
      });
    } else {
      logDebug('DEBUG_RENDER_FLOW', '[DIAGNOSTIC] InfiniteZoomChart NO DATA received:', {
        hasDataProp: !!dataProp,
        dataPropType: dataProp === null ? 'null' : dataProp === undefined ? 'undefined' : Array.isArray(dataProp) ? 'empty array' : typeof dataProp
      });
    }
  }
  
  // Get pattern context
  const { 
    selectedPattern: selectedPatternFromContext
  } = usePatternContext();
  
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
  const [showResolutionIndicator, setShowResolutionIndicator] = useState(true);
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

  // Initialize zoom controller first
  const controller = useInfiniteZoomController({
    interactionCanvasRef,
    width,
    height,
    margin: CHART_MARGIN,
    symbol,
    timeframe, // Pass the user's selected timeframe
    onDataUpdate: (data, resolution) => {
      dataGenerationRef.current += 1;
      const generation = dataGenerationRef.current;
      
      // Store data hash to detect changes
      const newHash = `${data.length}_${data[0]?.timestamp}_${data[data.length - 1]?.timestamp}`;
      if (newHash !== currentDataHash) {
        setCurrentDataHash(newHash);
        
        // Trigger pattern detection on the new data
        // This ensures pattern arrays are synchronized with the displayed data
        if (patternContext && typeof patternContext.detectPatterns === 'function') {
          // console.log('[InfiniteZoomChart] Calling detectPatterns with', data.length, 'candles');
          patternContext.detectPatterns(data);
        } else {
          // console.log('[InfiniteZoomChart] Pattern context not available:', {
          //   patternContext: !!patternContext,
          //   hasDetectPatterns: patternContext && typeof patternContext.detectPatterns === 'function'
          // });
        }
      }
      
      // Don't update indices here - let them be updated by the effect
    },
    onZoomChange: (state) => {
      // Zoom state changes are now handled by the controller
    },
    setPanState,
    startDate,
    endDate,
    externalData: dataProp, // Pass external data to prevent duplicate fetches
    disableAutoFetch: !!dataProp // Disable auto-fetch when we have external data
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
  } = controller;

  // Combine the data source - prefer dataProp from parent over chartData
  const dataToUse = dataProp || chartData;
  
  // DIAGNOSTIC: Log data combination result
  if (process.env.NODE_ENV === 'development') {
    logDebug('DEBUG_RENDER_FLOW', '[DIAGNOSTIC] Data source selection:', {
      hasDataProp: !!dataProp,
      dataPropLength: dataProp?.length || 0,
      hasChartData: !!chartData,
      chartDataLength: chartData?.length || 0,
      usingDataProp: !!dataProp,
      dataToUseLength: dataToUse?.length || 0
    });
  }

  // Apply Heikin-Ashi transform to chart data
  const { candleType, showVolume, showGrid } = useChartSettings();
  const { transformedData } = useHeikinAshiTransform({
    candleType,
    data: dataToUse
  });

  // Convert current data to Candle format for pattern bus
  const candles: Candle[] = useMemo(() => {
    return transformedData.map((d: CandlestickData) => ({
      datetime: new Date(d.timestamp).toISOString(),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume || 0,
      timestamp: d.timestamp
    }));
  }, [transformedData]);

  // Convert visible data to Candle format for pattern bus
  const visibleCandles: Candle[] = useMemo(() => {
    const visibleData = transformedData.slice(
      visibleDataIndices.start, 
      visibleDataIndices.end + 1
    );
    return visibleData.map((d: CandlestickData) => ({
      datetime: new Date(d.timestamp).toISOString(),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume || 0,
      timestamp: d.timestamp
    }));
  }, [transformedData, visibleDataIndices.start, visibleDataIndices.end]);

  // Debug: Log visible data info when it changes
  useEffect(() => {
    if (visibleCandles.length > 0) {
      // console.log('[InfiniteZoomChart] Visible data info:', {
      //   visibleCount: visibleCandles.length,
      //   visibleIndices: { start: visibleDataIndices.start, end: visibleDataIndices.end },
      //   firstVisible: {
      //     index: 0,
      //     timestamp: new Date(visibleCandles[0].timestamp).toISOString()
      //   },
      //   lastVisible: {
      //     index: visibleCandles.length - 1,
      //     timestamp: new Date(visibleCandles[visibleCandles.length - 1].timestamp).toISOString()
      //   },
      //   totalDataLength: transformedData.length
      // });
    }
  }, [visibleCandles.length, visibleDataIndices.start, visibleDataIndices.end]);

  // Use pattern bus to detect patterns on visible candles
  // console.log('[InfiniteZoomChart] About to call usePatternBus with', candles.length, 'candles (full dataset)');
  const patternBusState = usePatternBus(candles);

  // Sync pattern bus events to pattern context
  useEffect(() => {
    if (patternBusState.events.length > 0) {
      // Debug: Log first pattern event details
      const firstStepEvent = patternBusState.events.find(e => e.type === 'ESCALATOR_STEP');
      if (firstStepEvent && firstStepEvent.data) {
        const stepData = firstStepEvent.data as any;
        // console.log('[InfiniteZoomChart] First ESCALATOR_STEP event debug:', {
        //   stepRef: stepData.stepRef,
        //   indices: { start: stepData.startIndex, end: stepData.endIndex },
        //   timestamps: { start: stepData.startTime, end: stepData.endTime },
        //   visibleCandlesLength: visibleCandles.length,
        //   visibleCandleTimestamps: {
        //     first: visibleCandles[0]?.timestamp,
        //     atStartIndex: visibleCandles[stepData.startIndex]?.timestamp,
        //     atEndIndex: visibleCandles[stepData.endIndex]?.timestamp,
        //     last: visibleCandles[visibleCandles.length - 1]?.timestamp
        //   }
        // });
      }
      
      // Pattern detection runs on visible candles, indices are already slice-relative
      const adjustedEvents = patternBusState.events.map(event => {
        if (event.type === 'ESCALATOR_STEP' && event.data) {
          const stepData = event.data as any;
          
          // Verify indices are within bounds
          if (stepData.startIndex >= 0 && stepData.startIndex < visibleCandles.length &&
              stepData.endIndex >= 0 && stepData.endIndex < visibleCandles.length) {
            // Update timestamps to match visible candles
            return {
              ...event,
              data: {
                ...stepData,
                // Ensure timestamps match the visible candles at these indices
                startTime: new Date(visibleCandles[stepData.startIndex].timestamp),
                endTime: new Date(visibleCandles[stepData.endIndex].timestamp)
              }
            };
          }
        }
        return event;
      });
      
      // Update pattern context with events - REPLACE, don't append
      if (patternContext.setEvents) {
        patternContext.setEvents(adjustedEvents);
      }
      
      // Extract escalator step events for the context - REPLACE, don't append
      const stepEvents = adjustedEvents.filter(e => e.type === 'ESCALATOR_STEP');
      if (patternContext.setEscalatorSteps) {
        patternContext.setEscalatorSteps(stepEvents);
      }
      
      // Extract breakout box events for the context - REPLACE, don't append
      const breakoutBoxEvents = adjustedEvents.filter(e => e.type === 'BREAKOUT_BOX');
      if (patternContext.setBreakoutBoxes) {
        patternContext.setBreakoutBoxes(breakoutBoxEvents);
        // console.log('[InfiniteZoomChart] Syncing BreakoutBox events to context:', {
        //   totalEvents: adjustedEvents.length,
        //   breakoutBoxEvents: breakoutBoxEvents.length,
        //   sampleBoxes: breakoutBoxEvents.slice(0, 3).map(e => e.data)
        // });
      }
    } else {
      // Clear events when there are none
      if (patternContext.setEvents) {
        patternContext.setEvents([]);
      }
      if (patternContext.setEscalatorSteps) {
        patternContext.setEscalatorSteps([]);
      }
      if (patternContext.setBreakoutBoxes) {
        patternContext.setBreakoutBoxes([]);
      }
    }
  }, [patternBusState.events, patternContext.setEvents, patternContext.setEscalatorSteps, patternContext.setBreakoutBoxes, visibleCandles]);

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
    chartDataRef.current = transformedData;
  }, [transformedData]);

  useEffect(() => {
    visibleDataIndicesRef.current = visibleDataIndices;
  }, [visibleDataIndices]);

  // Detect patterns on visible data after zoom/pan completes
  const detectPatternsForVisibleData = useCallback(async () => {
    if (!transformedData.length || isDetectingPatterns) return;
    
    // Get the visible data slice
    const visibleData = transformedData.slice(
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
        logDebug('DEBUG_RENDER_FLOW', 'InfiniteZoomChart - Pattern detection error:', error);
      }
      setLocalPatterns([]);
    } finally {
      setIsDetectingPatterns(false);
    }
  }, [transformedData, visibleDataIndices, isDetectingPatterns]);

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
    if (transformedData.length > 0 && !isLoading) {
      debouncedPatternDetection();
    }
  }, [visibleDataIndices, transformedData.length, isLoading, debouncedPatternDetection]);

  // Update visible range when visible data indices change
  useEffect(() => {
    const hasData = transformedData.length > 0;
    if (!hasData) return;

    // For infinite zoom, we use the visible indices from the zoom controller
    const visibleData = transformedData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
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
  }, [transformedData.length, visibleDataIndices.start, visibleDataIndices.end]);

  // Update visible indices when data first loads or changes
  useEffect(() => {
    if (transformedData.length > 0 && targetCandles > 0) {
      // Only initialize indices if they haven't been set yet
      // or if the data has completely changed (different length)
      const needsInitialization = !indicesInitializedRef.current || 
                                  visibleDataIndicesRef.current.end >= transformedData.length ||
                                  visibleDataIndicesRef.current.end === 0;
      
      if (needsInitialization) {
        // Initialize to show the most recent data
        const endIndex = transformedData.length - 1;
        const startIndex = Math.max(0, endIndex - targetCandles + 1);
        
        setVisibleDataIndices({ start: startIndex, end: endIndex });
        visibleDataIndicesRef.current = { start: startIndex, end: endIndex };
        indicesInitializedRef.current = true;
        
        // console.log('[InfiniteZoomChart] Initialized visible indices:', {
        //   start: startIndex,
        //   end: endIndex,
        //   targetCandles,
        //   dataLength: transformedData.length
        // });
      }
    }
  }, [transformedData.length]); // Remove targetCandles from dependencies to prevent re-centering on zoom

  // Handle zoom changes - update visible indices while maintaining focus
  useEffect(() => {
    if (transformedData.length > 0 && targetCandles > 0 && indicesInitializedRef.current) {
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
        if (newEnd >= transformedData.length) {
          newEnd = transformedData.length - 1;
          newStart = Math.max(0, newEnd - targetCandles + 1);
        }
        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(transformedData.length - 1, newStart + targetCandles - 1);
        }
        
        // Update indices
        setVisibleDataIndices({ start: newStart, end: newEnd });
        visibleDataIndicesRef.current = { start: newStart, end: newEnd };
        
        // console.log('[InfiniteZoomChart] Zoom update - visible indices adjusted:', {
        //   oldRange: currentRange,
        //   newRange: targetCandles,
        //   oldIndices: { start: currentStart, end: currentEnd },
        //   newIndices: { start: newStart, end: newEnd },
        //   center: currentCenter
        // });
      }
    }
  }, [targetCandles, transformedData.length]);

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
    
    if (transformedData.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        // console.log('InfiniteZoomChart - No chart data available');
      }
      return;
    }
    
    // Create scales for pattern detection
    const visibleData = transformedData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
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
    const allPatterns = [...patterns];
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Checking patterns:', allPatterns.length, 'patterns');
    }
    
    // Check each pattern directly
    for (const pattern of allPatterns) {
      // Simple bounds check for pattern area (can be enhanced later)
      const startIndex = transformedData.findIndex(c => new Date(c.timestamp) >= pattern.startTime);
      const endIndex = transformedData.findIndex(c => new Date(c.timestamp) >= pattern.endTime);
      
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
  }, [patterns, transformedData, visibleDataIndices, visibleRange, onPatternSelect, width, height]);

  // Render chart when data or view changes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logDebug('DEBUG_RENDER_FLOW', '[InfiniteZoomChart] Triggering renderChart:', { 
        width, 
        height, 
        dataLength: transformedData.length,
        visibleIndices: visibleDataIndices 
      });
    }
    
    if (transformedData.length === 0) {
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
    
    const visibleData = transformedData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    if (process.env.NODE_ENV === 'development') {
      logDebug('DEBUG_RENDER_FLOW', '[DIAGNOSTIC] Rendering with visible data:', {
        totalData: dataToUse?.length || 0,
        visibleDataLength: visibleData.length,
        visibleIndices: visibleDataIndices,
        firstVisibleCandle: visibleData[0] ? {
          timestamp: visibleData[0].timestamp,
          date: new Date(visibleData[0].timestamp).toISOString(),
          close: visibleData[0].close
        } : null,
        lastVisibleCandle: visibleData[visibleData.length - 1] ? {
          timestamp: visibleData[visibleData.length - 1].timestamp,
          date: new Date(visibleData[visibleData.length - 1].timestamp).toISOString(),
          close: visibleData[visibleData.length - 1].close
        } : null
      });
    }
    
    const visiblePatterns = patterns.filter(pattern => {
      const patternStart = pattern.startTime.getTime();
      const patternEnd = pattern.endTime.getTime();
      const visibleStart = transformedData[visibleDataIndices.start]?.timestamp || 0;
      const visibleEnd = transformedData[visibleDataIndices.end]?.timestamp || 0;
      
      return patternStart <= visibleEnd && patternEnd >= visibleStart;
    });
    
    if (process.env.NODE_ENV === 'development') {
      // console.log('InfiniteZoomChart - Rendering with data:', {
      //   dataLength: transformedData.length,
      //   visibleIndices: visibleDataIndices,
      //   visiblePatternsCount: visiblePatterns.length
      // });
    }
    
    // Get escalator steps from pattern context
    const escalatorSteps = patternContext.escalatorSteps || [];
    
    // Filter escalator steps to visible time range and deduplicate by stepRef
    const visibleTimeStart = transformedData[visibleDataIndices.start]?.timestamp || 0;
    const visibleTimeEnd = transformedData[visibleDataIndices.end]?.timestamp || 0;
    
    const stepMap = new Map();
    escalatorSteps.forEach(event => {
      if (event.data && event.data.stepRef) {
        const stepData = event.data as any;
        
        // Use the timestamps directly from the pattern event
        // These are already calculated during pattern detection
        const stepStartTime = stepData.startTime ? new Date(stepData.startTime).getTime() : 0;
        const stepEndTime = stepData.endTime ? new Date(stepData.endTime).getTime() : 0;
        
        // Only include steps that overlap with visible time range
        if (stepStartTime <= visibleTimeEnd && stepEndTime >= visibleTimeStart) {
          // Keep the original step data with its timestamps
          // Don't try to recalculate from indices
          stepMap.set(stepData.stepRef, stepData);
        }
      }
    });
    
    // Merge Target Blackjack Scores (TBS) and Goldmine flags into step objects
    const bjTargetLookup = new Map(
      (patternContext.bjTargetScores || []).map(entry => [entry.stepRef, entry])
    );

    const visibleEscalatorSteps = Array.from(stepMap.values())
      .filter(step => step && step.startTime && step.endTime)
      .map(step => {
        const target = bjTargetLookup.get(step.stepRef);
        if (target) {
          (step as any).blackjackScore = target.score;
          (step as any).qualifiesForGoldmine = target.qualifiesForGoldmine;
        }
        return step;
      });
    
    // Debug escalator steps
    if (visibleEscalatorSteps.length > 0) {
      // console.log('[InfiniteZoomChart] Passing escalator steps to renderChart:', {
      //   originalCount: escalatorSteps.length,
      //   visibleCount: visibleEscalatorSteps.length,
      //   timeRange: {
      //     visible: { start: new Date(visibleTimeStart), end: new Date(visibleTimeEnd) },
      //     firstStep: {
      //       start: new Date(visibleEscalatorSteps[0].startTime),
      //       end: new Date(visibleEscalatorSteps[0].endTime)
      //     }
      //   }
      // });
    }
    
    const breakoutBoxes = patternContext.breakoutBoxes || []; // Get breakoutBoxes from context
    
    // Debug breakoutBoxes
    if (breakoutBoxes.length > 0) {
      logDebug('DEBUG_RENDER_FLOW', '[DIAGNOSTIC] [InfiniteZoomChart] Passing breakoutBoxes to renderChart:', {
        boxCount: breakoutBoxes.length,
        boxes: breakoutBoxes.slice(0, 3).map(box => ({
          startIndex: box.data.startIndex,
          endIndex: box.data.endIndex,
          high: box.data.high,
          low: box.data.low,
          type: box.data.type
        }))
      });
    }
    
    // DIAGNOSTIC: verify BJ scores merged into steps
    if (process.env.NODE_ENV === 'development' && visibleEscalatorSteps.length) {
      logDebug('DEBUG_RENDER_FLOW', '[InfiniteZoomChart] visibleEscalatorSteps sample (with BJ):', visibleEscalatorSteps.slice(0,3).map(s => ({ stepRef: s.stepRef, bj: s.blackjackScore, gm: s.qualifiesForGoldmine })));
    }

    // Get TradeActionSignals from both bus implementations for debugging
    const classBasedSignals = TradeActionBus.getSignals();
    const arrayBasedSignals = getTradeActionSignals();
    
    // Debug logging to identify which bus has signals
    console.log(`[InfiniteZoomChart] TradeActionSignal sources:`, {
      classBasedCount: classBasedSignals.length,
      arrayBasedCount: arrayBasedSignals.length,
      classSignals: classBasedSignals.slice(0, 2), // First 2 for debugging
      arraySignals: arrayBasedSignals.slice(0, 2)   // First 2 for debugging
    });
    
    // Use whichever bus has signals (prefer class-based for consistency)
    // Convert readonly array to mutable array to match expected type
    const allSignals = classBasedSignals.length > 0 ? classBasedSignals : [...arrayBasedSignals];
    
    // 🔴 CRITICAL FIX: Filter to ENTRY signals ONLY (exclude exit signals)
    const tradeActionSignals = allSignals.filter(signal => 
      signal.signalType === 'LONG_ENTRY' || signal.signalType === 'SHORT_ENTRY'
    );
    
    // Debug logging for signal filtering
    console.log(`[InfiniteZoomChart] Signal filtering:`, {
      totalSignals: allSignals.length,
      entrySignals: tradeActionSignals.length,
      exitSignalsFiltered: allSignals.length - tradeActionSignals.length,
      entrySignalTypes: tradeActionSignals.map(s => ({ pattern: s.pattern, action: s.action, type: s.signalType }))
    });
    
    renderChart({
      mainCanvasRef,
      bufferCanvasRef,
      patternsCanvasRef,
      filteredData: transformedData,
      visibleDataIndices,
      visibleRange,
      width,
      height,
      margin: CHART_MARGIN,
      visiblePatterns,
      selectedPattern: selectedPatternFromContext || null,
      timeframe: timeframe || '1min', // Always use the timeframe prop with a fallback
      showOnlyTradingHours: false,
      escalatorSteps: visibleEscalatorSteps,
      escalatorSettings: patternContext.escalatorSettings,
      breakoutBoxes, // Pass breakoutBoxes to renderChart
      breakoutBoxSettings: patternContext.breakoutBoxSettings, // Add breakoutBoxSettings
      blackjackSettings: patternContext.blackjackSettings, // Add BlackJack settings for label toggle
      goldenCandleSettings: patternContext.goldenCandleSettings, // Golden Candle settings with near-miss toggle
      goldenNearMisses: patternContext.goldenNearMisses || [], // Golden Candle near-miss overlays
      // 🔗 TradeActionSignal Integration - CRITICAL FIX
      tradeActionSignals: tradeActionSignals,
      tradeActionSettings: { showLabels: true, showIcons: true },
      chartSettings: {
        isHeikinAshi: candleType === 'heikin_ashi',
        showVolume: showVolume,
        showGrid: showGrid
      }
    });
  }, [transformedData, visibleDataIndices, visibleRange, width, height, patterns, selectedPatternProp, currentResolution, isLoading, patternContext.escalatorSteps, patternContext.escalatorSettings, patternContext.breakoutBoxes, timeframe, candleType, showVolume, showGrid]);

  // Setup canvas dimensions
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logDebug('DEBUG_RENDER_FLOW', '[InfiniteZoomChart] Canvas dimension update triggered:', { width, height });
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

  // Expose chart control methods to parent components
  useImperativeHandle(ref, () => ({
    zoomToFit: () => {
      if (controller?.zoomToFit) {
        controller.zoomToFit();
      }
    },
    autoScale: () => {
      // Auto-scale is essentially the same as zoom to fit for now
      if (controller?.zoomToFit) {
        controller.zoomToFit();
      }
    },
    resetView: () => {
      if (controller?.resetZoom) {
        controller.resetZoom();
      }
    }
  }), [controller]);

  // Auto-scale when data is first loaded or changes significantly
  useEffect(() => {
    if (transformedData.length > 0 && zoomToFitController && !indicesInitializedRef.current) {
      // Small delay to ensure chart is rendered
      const timer = setTimeout(() => {
        zoomToFitController();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [transformedData.length, zoomToFitController]);

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
    const visibleData = transformedData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    if (!visibleData.length) {
      return createSequentialTimeScale(
        width - CHART_MARGIN.left - CHART_MARGIN.right,
        transformedData,
        [0, transformedData.length - 1]
      );
    }
    
    // console.log('[InfiniteZoomChart] Creating timeScale for visible data:', {
    //   visibleDataLength: visibleData.length,
    //   visibleStart: visibleDataIndices.start,
    //   visibleEnd: visibleDataIndices.end,
    //   firstVisible: visibleData[0]?.datetime,
    //   lastVisible: visibleData[visibleData.length - 1]?.datetime
    // });
    
    return createSequentialTimeScale(
      width - CHART_MARGIN.left - CHART_MARGIN.right,
      visibleData,
      [0, width - CHART_MARGIN.left - CHART_MARGIN.right] // We're in transformed space, so range starts at 0
    );
  }, [width, visibleDataIndices.start, visibleDataIndices.end, transformedData]);
  
  const { hoverData, HoverMetricsProvider } = useHoverMetrics(
    containerRef, 
    timeScale,  // Use the same timeScale we calculated above
    transformedData,  // Pass the same data we're rendering
    CHART_MARGIN,
    visibleDataIndices
  );

  // Debug hover data
  useEffect(() => {
    if (hoverData) {
      // console.log('[InfiniteZoomChart] Hover data:', {
      //   hoverIndex: hoverData.idx,
      //   hoverCandle: hoverData.candle,
      //   expectedCandle: transformedData[hoverData.idx],
      //   match: hoverData.candle === transformedData[hoverData.idx]
      // });
    }
  }, [hoverData, transformedData]);

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
            onWheel={controller.handleWheel}
            onTouchStart={panController.handleTouchStart}
            onTouchMove={(e) => {
              panController.handleTouchMove(e);
              controller.handlePinch(e);
            }}
            onTouchEnd={panController.handleTouchEnd}
            style={{ cursor: panState.isPanning ? 'grabbing' : 'crosshair' }}
          />
          
          {currentResolution && showResolutionIndicator && (
            <ResolutionIndicator
              resolution={currentResolution}
              zoomLevel={zoomLevel}
              candleCount={targetCandles}
              isTransitioning={isTransitioning}
              onClose={() => setShowResolutionIndicator(false)}
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
          
          {!isLoading && !error && transformedData.length === 0 && (
            <div className="error-overlay">
              <div className="error-message">No data available. Please check symbol and date range.</div>
            </div>
          )}
        </div>
        
        <div className="zoom-controls">
          <button 
            className="zoom-button" 
            onClick={() => controller.zoomOut()}
            disabled={zoomLevel >= 5 || isTransitioning}
            title="Zoom Out"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 9a1 1 0 100 2h10a1 1 0 100-2H5z" />
            </svg>
          </button>
          <button 
            className="zoom-button" 
            onClick={() => controller.zoomIn()}
            disabled={zoomLevel <= 0.1 || isTransitioning}
            title="Zoom In"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
            </svg>
          </button>
          <button 
            className="zoom-button" 
            onClick={resetZoomController}
            disabled={isTransitioning}
            title="Reset Zoom"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 3a6 6 0 11-4.84 9.5 1 1 0 011.68-1.09A4 4 0 109 5a1 1 0 100-2zm-2 7a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" />
            </svg>
          </button>
          <button 
            className="zoom-button" 
            onClick={zoomToFitController}
            disabled={isTransitioning}
            title="Fit to Screen"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 9a1 1 0 100 2h10a1 1 0 100-2H5z" />
            </svg>
          </button>
        </div>
        
        <div className="resolution-info">
          {currentResolution && (
            <span>{currentResolution.timeframe}</span>
          )}
        </div>
        
        <div className="data-info">
          {transformedData.length > 0 && (
            <span>{transformedData.length} candles</span>
          )}
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
