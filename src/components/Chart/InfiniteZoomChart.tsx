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
import { ResolutionConfig } from '../../utils/dataResolution';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import { createPriceScale } from '../../utils/scaling';
import { useHoverMetrics } from '../../hooks/useHoverMetrics';
import { HoverTooltipZones } from './HoverTooltipZones';
import { UnifiedHoverProvider } from '../../contexts/UnifiedHoverContext';
import { usePatternBus } from '../../hooks/usePatternBus';
import { usePatternContext } from '../../contexts/PatternContext';
import { Candle } from '../../types';
import { logDebug } from '../../utils/debug';
import { useHeikinAshiTransform } from '../../hooks/useHeikinAshiTransform';
import { useChartSettings } from '../../contexts/ChartSettingsContext';
import { getPatternAtPoint } from '../../utils/patternHitDetection';
import './InfiniteZoomChart.css';


// TradeActionSignal Integration
import { TradeActionBus } from '../../utils/trading/TradeActionSignal';
import { getTradeActionSignals } from '../../framework/tradeActionEmitter';

// ConvictionCloud & TargetReportTable Integration
import { ConvictionCloudItem, defaultConvictionCloudSettings } from './ConvictionCloudRenderer';


import ExportControls from './ExportControls';
import DevHUD from './DevHUD';
import { PatternType } from '../../models/PatternTypes';

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

  // Track previous targetCandles to prevent unnecessary updates
  const previousTargetCandlesRef = useRef<number>(0);

  // Add separate debouncing for click and double-click to prevent conflicts
  const lastClickTimeRef = useRef<number>(0);
  const lastDoubleClickTimeRef = useRef<number>(0);
  const clickDebounceMs = 100; // Reduced to allow double-clicks

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

  // Add state:
  const [isInteracting, setIsInteracting] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [pixelOffset, setPixelOffset] = useState(0);
  
  // Add ref to store zoom state before pattern analysis
  const prePatternZoomStateRef = useRef<{
    zoomLevel: number;
    visibleIndices: { start: number; end: number };
  } | null>(null);

  // Chart data state
  const [error, setError] = useState<Error | null>(null);
  const dataGenerationRef = useRef(0);
  const [currentDataHash, setCurrentDataHash] = useState<string>('');
  
  // DevHUD visibility state
  const [showDevHUD, setShowDevHUD] = useState(false);

  // Get pattern context to trigger detection
  const patternContext = usePatternContext();

  // Create throttled pattern detection to prevent excessive calls
  const throttledDetectPatterns = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (data: CandlestickData[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (patternContext && typeof patternContext.detectPatterns === 'function') {
          patternContext.detectPatterns(data);
        }
      }, 250); // Throttle to max once per 250ms
    };
  }, [patternContext]);

  // Initialize zoom controller first
  const controller = useInfiniteZoomController({
    interactionCanvasRef,
    width,
    height,
    margin: CHART_MARGIN,
    symbol,
    timeframe, // Pass the user's selected timeframe
    onDataUpdate: (data: CandlestickData[], resolution: ResolutionConfig, fullData?: CandlestickData[]) => {
      dataGenerationRef.current += 1;
      const generation = dataGenerationRef.current;
      
      // Store data hash to detect changes - use fullData for comprehensive detection
      const dataForHashing = fullData || data;
      const newHash = `${dataForHashing.length}_${dataForHashing[0]?.timestamp}_${dataForHashing[dataForHashing.length - 1]?.timestamp}`;
      if (newHash !== currentDataHash) {
        setCurrentDataHash(newHash);
        
        // CRITICAL FIX: Use fullData for pattern detection to ensure patterns across entire chart
        // If fullData is available, use it for pattern detection; otherwise fall back to processed data
        const dataForPatternDetection = fullData || data;
        
        // Use throttled pattern detection to prevent excessive calls
        throttledDetectPatterns(dataForPatternDetection);
      }
      
      // Don't update indices here - let them be updated by the effect
    },
    onZoomChange: (state) => {
      // Handle zoom centering on the hovered candle
      if (state.centerCandleRatio !== undefined && transformedData.length > 0) {
        // Calculate which candle the cursor is over
        const currentVisibleCandles = visibleDataIndices.end - visibleDataIndices.start + 1;
        const hoveredCandleOffset = Math.floor(state.centerCandleRatio * currentVisibleCandles);
        const hoveredCandleIndex = visibleDataIndices.start + hoveredCandleOffset;
        
        // Clamp to valid range
        const centerCandleIndex = Math.max(0, Math.min(transformedData.length - 1, hoveredCandleIndex));
        
        // Calculate new range with the hovered candle at the CENTER
        const newVisibleCandles = state.targetCandles;
        const halfCandles = Math.floor(newVisibleCandles / 2);
        
        // Center the view on the hovered candle
        let newStartIndex = centerCandleIndex - halfCandles;
        let newEndIndex = centerCandleIndex + (newVisibleCandles - halfCandles - 1);
        
        // Adjust for boundaries
        if (newStartIndex < 0) {
          newStartIndex = 0;
          newEndIndex = Math.min(transformedData.length - 1, newVisibleCandles - 1);
        } else if (newEndIndex >= transformedData.length) {
          newEndIndex = transformedData.length - 1;
          newStartIndex = Math.max(0, newEndIndex - newVisibleCandles + 1);
        }
        
        // Update visible indices to center on the hovered candle
        setVisibleDataIndices({ start: newStartIndex, end: newEndIndex });
      }
      setIsZooming(true);
      setTimeout(() => setIsZooming(false), 300);
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

  // Note: panController will be instantiated after transformedData is available

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

  // REMOVED: Auto-hydrate patterns - This was causing excessive re-renders
  // Pattern detection is already handled by the zoom controller's onDataUpdate callback

  // DISABLED: Enable live polling for automatic pattern updates
  // Live polling is already handled at the App level to prevent duplicate pattern evaluations
  // useLivePolling(true);

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
  }, [patternBusState.events, patternContext.setEvents, patternContext.setEscalatorSteps, patternContext.setBreakoutBoxes]); // Removed visibleCandles dependency

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

  // DISABLED: Trigger pattern detection when visible data changes
  // This is redundant as pattern detection is already handled by:
  // 1. The zoom controller's onDataUpdate callback
  // 2. The live polling mechanism
  // useEffect(() => {
  //   if (transformedData.length > 0 && !isLoading) {
  //     debouncedPatternDetection();
  //   }
  // }, [visibleDataIndices, transformedData.length, isLoading, debouncedPatternDetection]);

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
    // Only proceed if targetCandles actually changed
    if (previousTargetCandlesRef.current === targetCandles) {
      return;
    }
    previousTargetCandlesRef.current = targetCandles;
    
    if (transformedData.length > 0 && targetCandles > 0 && indicesInitializedRef.current) {
      const currentStart = visibleDataIndicesRef.current.start;
      const currentEnd = visibleDataIndicesRef.current.end;
      const currentRange = currentEnd - currentStart + 1;
      
      // Update if the range is different from targetCandles
      // This ensures we respond to zoom changes
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
        
        console.log('[InfiniteZoomChart] Zoom applied:', {
          oldRange: currentRange,
          newRange: targetCandles,
          newIndices: { start: newStart, end: newEnd }
        });
      }
    }
  }, [targetCandles, transformedData.length]);

  // Update visible range from pan
  const updateVisibleRangeFromPan = useCallback((translateX: number) => {
    const data = transformedData;
    if (data.length === 0) return;
    
    const chartWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const candleWidth = chartWidth / targetCandles;
    
    const baseDamping = 0.1;
    const zoomDamping = Math.min(100 / targetCandles, 2);
    const dampingFactor = baseDamping / zoomDamping;
    const dampedTranslateX = translateX * dampingFactor * 50; // Increased from 10
    const candleShift = Math.round(-dampedTranslateX / candleWidth);
    
    // Always use ref for current indices to avoid stale state
    const baseStart = visibleDataIndicesRef.current.start;
    const baseEnd = visibleDataIndicesRef.current.end;
    
    let startIndex = baseStart + candleShift;
    let endIndex = baseEnd + candleShift;
    
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
  }, [width, targetCandles, transformedData]);

  // Initialize pan controller
  const panController = usePanController(
    panState,
    setPanState,
    updateVisibleRangeFromPan,
    targetCandles
  );

  // Handle pattern selection
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < clickDebounceMs) {
      return;
    }
    lastClickTimeRef.current = now;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    logDebug('chart.interaction', '[InfiniteZoomChart] Canvas clicked at:', { x, y, event: 'click' });
    
    // Check if a pattern was clicked using hit detection
    const hitPattern = getPatternAtPoint(x, y, CHART_MARGIN);
    
    if (hitPattern && patternContext) {
      // Use setTimeout to defer state updates and prevent blocking
      setTimeout(() => {
        logDebug('chart.interaction', 'Pattern clicked via hit detection:', {
          pattern: hitPattern,
          type: hitPattern.type,
          confidence: hitPattern.confidence,
          feedbackEnabled: (hitPattern as any).feedbackEnabled
        });
        
        // Check if pattern has feedback enabled
        if ((hitPattern as any).feedbackEnabled) {
          // Open feedback modal for this pattern
          patternContext.setSelectedPatternForFeedback?.(hitPattern);
        } else {
          // Set selected pattern to open normal pattern details modal
          patternContext.setSelectedPattern(hitPattern);
        }
      }, 0);
      return; // Exit early if pattern was clicked
    }
    
    // No pattern was clicked - do nothing
    logDebug('chart.interaction', '[InfiniteZoomChart] No pattern at click location');
  }, [patternContext]);

  const handleCanvasDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    // Debounce rapid double-clicks with separate timer
    const now = Date.now();
    if (now - lastDoubleClickTimeRef.current < 200) {
      return;
    }
    lastDoubleClickTimeRef.current = now;

    // CRITICAL: Ensure pan state is cleared on double-click
    if (panController?.endPan) {
      panController.endPan();
    }

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    console.log('[InfiniteZoomChart] Canvas double-clicked at:', { x, y });
    logDebug('chart.interaction', '[InfiniteZoomChart] Canvas double-clicked at:', { x, y, event: 'doubleClick' });
    
    const hitPattern = getPatternAtPoint(x, y, CHART_MARGIN);
    console.log('[InfiniteZoomChart] Hit pattern:', hitPattern ? {
      type: hitPattern.type,
      id: hitPattern.id,
      confidence: hitPattern.confidence,
      feedbackEnabled: (hitPattern as any).feedbackEnabled
    } : 'none');
    
    if (hitPattern && patternContext) {
      console.log('[InfiniteZoomChart] Before setTimeout - patternContext methods:', {
        hasSetSelectedPattern: !!patternContext.setSelectedPattern,
        hasSetSelectedPatternForFeedback: !!patternContext.setSelectedPatternForFeedback,
        currentSelectedPattern: patternContext.selectedPattern?.type,
        currentSelectedPatternForFeedback: patternContext.selectedPatternForFeedback?.type
      });

      // Use setTimeout to defer state updates
      setTimeout(() => {
        if (hitPattern.type === PatternType.BLACKJACK) {
          console.log('[InfiniteZoomChart] Opening Blackjack modal');
          console.log('[InfiniteZoomChart] patternContext.setSelectedPattern:', typeof patternContext.setSelectedPattern);
          console.log('[InfiniteZoomChart] Calling setSelectedPattern with:', hitPattern);
          patternContext.setSelectedPattern(hitPattern);
        } else {
          // For all other patterns, use the feedback modal
          console.log('[InfiniteZoomChart] Opening feedback modal for:', hitPattern.type);
          console.log('[InfiniteZoomChart] patternContext.setSelectedPatternForFeedback:', typeof patternContext.setSelectedPatternForFeedback);
          console.log('[InfiniteZoomChart] Calling setSelectedPatternForFeedback with:', hitPattern);
          
          if (patternContext.setSelectedPatternForFeedback) {
            patternContext.setSelectedPatternForFeedback(hitPattern);
            console.log('[InfiniteZoomChart] Called setSelectedPatternForFeedback successfully');
        } else {
            console.error('[InfiniteZoomChart] setSelectedPatternForFeedback is not available!');
          }
        }
      }, 0);
    }
  }, [patternContext, panController]);

  // Verify double-click handler is attached
  useEffect(() => {
    if (interactionCanvasRef.current) {
      console.log('[InfiniteZoomChart] Interaction canvas ready, double-click handler attached');
      
      // Add a test listener to verify events are reaching the canvas
      const testListener = (e: MouseEvent) => {
        console.log('[InfiniteZoomChart] TEST: Native double-click event received');
      };
      
      interactionCanvasRef.current.addEventListener('dblclick', testListener);
      
      return () => {
        if (interactionCanvasRef.current) {
          interactionCanvasRef.current.removeEventListener('dblclick', testListener);
        }
      };
    }
  }, []);

  // Add non-passive wheel event listener for zooming
  useEffect(() => {
    const canvas = interactionCanvasRef.current;
    if (!canvas || !controller.handleWheel) return;

    // Create a native event handler that calls the controller's handleWheel
    const handleNativeWheel = (e: WheelEvent) => {
      // Create a React synthetic event-like object
      const syntheticEvent = {
        ...e,
        currentTarget: canvas,
        preventDefault: () => e.preventDefault(),
        stopPropagation: () => e.stopPropagation(),
        nativeEvent: e,
        deltaY: e.deltaY,
        deltaX: e.deltaX,
        clientX: e.clientX,
        clientY: e.clientY
      } as unknown as React.WheelEvent<HTMLCanvasElement>;
      
      controller.handleWheel(syntheticEvent);
    };

    // Add non-passive wheel listener
    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleNativeWheel);
    };
  }, [controller.handleWheel]);

  // Render chart when data or view changes
  useEffect(() => {
    // Skip rendering only during pure hover (not zoom/pan)
    // This prevents the 600ms+ re-renders when hovering over labels

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
    
    // Include all patterns within the full data range, not just visible viewport
    // This ensures patterns appear across the entire chart, not just the left portion
    const fullDataStart = transformedData[0]?.timestamp || 0;
    const fullDataEnd = transformedData[transformedData.length - 1]?.timestamp || 0;
    
    const visiblePatterns = patterns.filter(pattern => {
      const patternStart = pattern.startTime.getTime();
      const patternEnd = pattern.endTime.getTime();
      
      // Use full data range instead of visible range to show patterns across entire chart
      return patternStart <= fullDataEnd && patternEnd >= fullDataStart;
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
    
    // Get full data range for pattern detection (don't restrict to visible range)
    const fullTimeStart = transformedData[0]?.timestamp || 0;
    const fullTimeEnd = transformedData[transformedData.length - 1]?.timestamp || 0;
    
    // Current visible range for debugging
    const visibleTimeStart = transformedData[visibleDataIndices.start]?.timestamp || 0;
    const visibleTimeEnd = transformedData[visibleDataIndices.end]?.timestamp || 0;
    
    const stepMap = new Map();
    escalatorSteps.forEach(event => {
      if (event.data && event.data.stepRef) {
        const stepData = event.data as any;
        
        // Use the timestamps directly from the pattern event
        const stepStartTime = stepData.startTime ? new Date(stepData.startTime).getTime() : 0;
        const stepEndTime = stepData.endTime ? new Date(stepData.endTime).getTime() : 0;
        
        // Include all patterns within the full data range, not just visible range
        // This ensures patterns appear across the entire chart, not just the left portion
        if (stepStartTime <= fullTimeEnd && stepEndTime >= fullTimeStart) {
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
    
    // Signal Fidelity Mode: Include SELL/COVER signals when fidelity mode is enabled
    const isFidelityMode = (window as any).signalFidelityPatch?.isFidelityModeOn?.() || false;
    const tradeActionSignals = isFidelityMode ? 
      allSignals : // Show ALL signals in fidelity mode
      allSignals.filter(signal => 
        signal.signalType === 'LONG_ENTRY' || 
        signal.signalType === 'SHORT_ENTRY' ||
        signal.action === 'SELL' || 
        signal.action === 'COVER' // ALWAYS show STOP_EXIT signals
      );
    
    // URGENT DEBUG: Comprehensive signal tracing for SELL/COVER signals
    const sellSignals = allSignals.filter(s => s.action === 'SELL');
    const coverSignals = allSignals.filter(s => s.action === 'COVER');
    const visibleSellSignals = tradeActionSignals.filter(s => s.action === 'SELL');
    const visibleCoverSignals = tradeActionSignals.filter(s => s.action === 'COVER');
    
    console.log(`🚨 [STOP_EXIT_DEBUG] Signal pipeline analysis:`, {
      totalSignals: allSignals.length,
      totalSellSignals: sellSignals.length,
      totalCoverSignals: coverSignals.length,
      fidelityModeEnabled: isFidelityMode,
      visibleSignals: tradeActionSignals.length,
      visibleSellSignals: visibleSellSignals.length,
      visibleCoverSignals: visibleCoverSignals.length,
      exitSignalsFiltered: isFidelityMode ? 0 : (allSignals.length - tradeActionSignals.length),
      allSignalActions: allSignals.map(s => s.action),
      visibleSignalActions: tradeActionSignals.map(s => s.action),
      sellSignalDetails: sellSignals.map(s => ({ 
        pattern: s.pattern, 
        action: s.action, 
        signalType: s.signalType, 
        timestamp: s.timestamp,
        price: s.price 
      })),
      coverSignalDetails: coverSignals.map(s => ({ 
        pattern: s.pattern, 
        action: s.action, 
        signalType: s.signalType, 
        timestamp: s.timestamp,
        price: s.price 
      }))
    });
    
    // 🔄 Transform tradeActionSignals for ConvictionCloud with REAL calculated values (NO MOCK DATA)
    const transformedConvictionCloudItems: ConvictionCloudItem[] = tradeActionSignals.map((signal, index): ConvictionCloudItem => {
      // Find associated patterns for this signal to get real data
      const associatedPatterns = patterns?.filter(pattern => 
        pattern.type === signal.pattern || 
        Math.abs(pattern.startTime.getTime() - signal.timestamp.getTime()) < 60000
      ) || [];
      
      // **REAL CALCULATED VALUES - NO DUMMY DATA**
      // Use same formulas as TargetReportTable for consistency
      const confidence = signal.confidence || 0;
      const convictionRating = Math.round(confidence * 100); // 0-100 scale
      
      // Real traction calculation based on pattern confidence and count
      const traction = associatedPatterns.length > 0 
        ? Math.round(associatedPatterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / associatedPatterns.length * 100)
        : Math.round(confidence * 100);
      
      // Real timing calculation based on pattern recency
      const timing = signal.timestamp 
        ? Math.max(0, Math.min(100, 100 - (Date.now() - signal.timestamp.getTime()) / (1000 * 60 * 60 * 24))) // Fresher = higher score
        : 50;
      
      // Real risk calculation based on confidence (higher confidence = lower risk)
      const riskRating = Math.round((1 - confidence) * 100); // Inverted: low confidence = high risk
      
      return {
        symbol: signal.pattern || `SIGNAL_${index + 1}`,
        convictionRating,
        traction: Math.round(traction),
        timing: Math.round(timing),
        riskRating,
        confidenceLevel: confidence,
        signalCount: associatedPatterns.length || 1,
        patternTypes: [signal.pattern || 'UNKNOWN'],
        lastUpdated: signal.timestamp || new Date()
      };
    });

    // Update state with transformed data
    setConvictionCloudItems(transformedConvictionCloudItems);
    
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
      tradeActionSettings: { showAggressive: true, showLabels: true, showIcons: true },
      // 🌟 ConvictionCloud Integration - Transform tradeActionSignals to ConvictionCloud
      convictionCloudItems: transformedConvictionCloudItems,
      convictionCloudSettings: defaultConvictionCloudSettings,
      hoveredConvictionItem: null,
      chartSettings: {
        isHeikinAshi: candleType === 'heikin_ashi',
        showVolume: showVolume,
        showGrid: showGrid
      },
      pixelOffset,
    });
  }, [transformedData, visibleDataIndices, visibleRange, width, height, patterns, selectedPatternProp, currentResolution, isLoading, patternContext.escalatorSteps, patternContext.escalatorSettings, patternContext.breakoutBoxes, timeframe, candleType, showVolume, showGrid, isZooming, pixelOffset]);

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

  // Keyboard handler for F12 to toggle DevHUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        setShowDevHUD(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for zoom-to-pattern events dispatched by FeedSidebar Analyze
  useEffect(() => {
    console.log('[InfiniteZoomChart] Setting up zoom-to-pattern listener');
    
    function handleZoomToPattern(e: CustomEvent<{ patternId: string; pattern?: any }>) {
      console.log('[InfiniteZoomChart] handleZoomToPattern received event:', e.detail);
      const { patternId, pattern: eventPattern } = e.detail || {};
      if (!patternId) return;
      
      // First try to use the pattern passed in the event
      let pat = eventPattern;
      
      // If no pattern in event, look it up in context
      if (!pat && patternContext.patterns?.length) {
        console.log('[InfiniteZoomChart] Looking for pattern with id:', patternId);
        console.log('[InfiniteZoomChart] Available patterns:', patternContext.patterns.length);
        pat = patternContext.patterns.find(p => p.id === patternId);
      }
      
      if (!pat) {
        console.warn('[InfiniteZoomChart] Pattern not found with id:', patternId);
        return;
      }
      
      console.log('[InfiniteZoomChart] Pattern found:', pat);
      
      // Save current zoom state before changing
      if (controller) {
        prePatternZoomStateRef.current = {
          zoomLevel: controller.zoomLevel,
          visibleIndices: { ...visibleDataIndices }
        };
        console.log('[InfiniteZoomChart] Saved pre-pattern zoom state:', prePatternZoomStateRef.current);
      }

      // Determine index range in transformedData
      let startIdx = -1;
      let endIdx = -1;
      
      // Use pattern's time boundaries to find indices
      if (pat.startTime && pat.endTime) {
        const startTimeMs = pat.startTime instanceof Date ? pat.startTime.getTime() : new Date(pat.startTime).getTime();
        const endTimeMs = pat.endTime instanceof Date ? pat.endTime.getTime() : new Date(pat.endTime).getTime();
        
        console.log('[InfiniteZoomChart] Looking for time range:', {
          startTime: new Date(startTimeMs).toISOString(),
          endTime: new Date(endTimeMs).toISOString(),
          dataRange: transformedData.length > 0 ? {
            firstCandle: new Date(transformedData[0].timestamp).toISOString(),
            lastCandle: new Date(transformedData[transformedData.length - 1].timestamp).toISOString()
          } : 'No data'
        });
        
        startIdx = transformedData.findIndex(c => c.timestamp >= startTimeMs);
        endIdx = transformedData.findIndex(c => c.timestamp >= endTimeMs);
        
        // If endIdx is the same as startIdx, look for the last candle within the pattern time range
        if (endIdx === startIdx || endIdx === -1) {
          endIdx = transformedData.findIndex((c, i) => i > startIdx && c.timestamp > endTimeMs) - 1;
          if (endIdx < 0) endIdx = transformedData.length - 1;
        }
        
        // If we still don't have valid indices, try a more flexible approach
        if (startIdx === -1 || endIdx === -1) {
          console.log('[InfiniteZoomChart] Exact time match failed, trying nearest candles');
          
          // Find the nearest candles to the pattern times
          let nearestStartIdx = -1;
          let nearestEndIdx = -1;
          let minStartDiff = Infinity;
          let minEndDiff = Infinity;
          
          transformedData.forEach((candle, idx) => {
            const startDiff = Math.abs(candle.timestamp - startTimeMs);
            const endDiff = Math.abs(candle.timestamp - endTimeMs);
            
            if (startDiff < minStartDiff) {
              minStartDiff = startDiff;
              nearestStartIdx = idx;
            }
            
            if (endDiff < minEndDiff) {
              minEndDiff = endDiff;
              nearestEndIdx = idx;
            }
          });
          
          if (nearestStartIdx !== -1 && nearestEndIdx !== -1) {
            startIdx = Math.min(nearestStartIdx, nearestEndIdx);
            endIdx = Math.max(nearestStartIdx, nearestEndIdx);
            console.log('[InfiniteZoomChart] Using nearest candles:', { startIdx, endIdx });
          }
        }
      }
      
      console.log('[InfiniteZoomChart] Index range:', { startIdx, endIdx });
      
      if (startIdx === -1 || endIdx === -1) {
        console.warn('[InfiniteZoomChart] Could not find pattern time range in data - attempting zoom anyway');
        // Use a default range around the current view
        const currentCenter = Math.floor((visibleDataIndices.start + visibleDataIndices.end) / 2);
        startIdx = Math.max(0, currentCenter - 10);
        endIdx = Math.min(transformedData.length - 1, currentCenter + 10);
      }

      // Zoom to show the pattern with some padding
      const padding = 10; // Show 10 candles before and after
      const newStartIdx = Math.max(0, startIdx - padding);
      const newEndIdx = Math.min(transformedData.length - 1, endIdx + padding);
      const visibleCandles = newEndIdx - newStartIdx + 1;
      
      // Update visible indices directly
      setVisibleDataIndices({
        start: newStartIdx,
        end: newEndIdx
      });
      
      // Calculate and set appropriate zoom level
      const newZoomLevel = 100 / visibleCandles;
      if (controller?.zoomTo) {
        console.log('[InfiniteZoomChart] Zooming to level:', newZoomLevel);
        controller.zoomTo(newZoomLevel);
      }
    }

    window.addEventListener('trisight-zoom-to-pattern', handleZoomToPattern as EventListener);
    console.log('[InfiniteZoomChart] Zoom listener added');
    
    return () => {
      window.removeEventListener('trisight-zoom-to-pattern', handleZoomToPattern as EventListener);
    };
  }, [transformedData, patternContext.patterns, controller, visibleDataIndices]);
  
  // Listen for restore-zoom events when modal closes
  useEffect(() => {
    function handleRestoreZoom() {
      console.log('[InfiniteZoomChart] handleRestoreZoom received event');
      
      if (prePatternZoomStateRef.current && controller) {
        const { zoomLevel, visibleIndices } = prePatternZoomStateRef.current;
        console.log('[InfiniteZoomChart] Restoring zoom state:', { zoomLevel, visibleIndices });
        
        // Restore visible indices
        setVisibleDataIndices(visibleIndices);
        
        // Restore zoom level
        controller.zoomTo(zoomLevel);
        
        // Clear the saved state
        prePatternZoomStateRef.current = null;
      }
    }
    
    window.addEventListener('trisight-restore-zoom', handleRestoreZoom);
    
    return () => {
      window.removeEventListener('trisight-restore-zoom', handleRestoreZoom);
    };
  }, [controller]);

  // Listen for zoom-to-indices events for synthetic patterns
  useEffect(() => {
    function handleZoomToIndices(e: CustomEvent<{ startIndex: number; endIndex: number }>) {
      console.log('[InfiniteZoomChart] handleZoomToIndices received event:', e.detail);
      const { startIndex, endIndex } = e.detail || {};
      
      if (startIndex == null || endIndex == null) {
        console.warn('[InfiniteZoomChart] Cannot zoom - missing indices');
        return;
      }
      
      // Save current zoom state before changing
      if (controller) {
        prePatternZoomStateRef.current = {
          zoomLevel: controller.zoomLevel,
          visibleIndices: { ...visibleDataIndices }
        };
        console.log('[InfiniteZoomChart] Saved pre-pattern zoom state:', prePatternZoomStateRef.current);
      }
      
      // Calculate the zoom level needed to show ~21 candles
      const rangeSize = endIndex - startIndex + 1;
      const targetCandleCount = Math.max(21, rangeSize + 10); // Show pattern with some padding
      const newZoomLevel = 100 / targetCandleCount;
      
      console.log('[InfiniteZoomChart] Calculated zoom:', {
        rangeSize,
        targetCandleCount,
        newZoomLevel,
        startIndex,
        endIndex
      });
      
      // Apply zoom
      if (controller?.zoomTo) {
        controller.zoomTo(newZoomLevel);
      }
      
      // Calculate pan to center the pattern
      const centerIndex = (startIndex + endIndex) / 2;
      const visibleCount = Math.round(100 / newZoomLevel);
      const newStartIndex = Math.max(0, Math.round(centerIndex - visibleCount / 2));
      
      // Update visible indices
      if (setVisibleDataIndices) {
        setVisibleDataIndices({
          start: newStartIndex,
          end: Math.min(transformedData.length - 1, newStartIndex + visibleCount - 1)
        });
      }
       
      // Force redraw
      indicesInitializedRef.current = false;
    }

    window.addEventListener('trisight-zoom-to-indices', handleZoomToIndices as EventListener);
    
    return () => {
      window.removeEventListener('trisight-zoom-to-indices', handleZoomToIndices as EventListener);
    };
  }, [transformedData, controller, visibleDataIndices]);

  // Add keyboard handler for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // Pan left
        panController.handlePanLeft();
      } else if (e.key === 'ArrowRight') {
        // Pan right
        panController.handlePanRight();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [panController]);

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

  // 📤 CSV Export State
  const [showExportControls, setShowExportControls] = useState(false);
  
  // 🔄 State for transformed data (will be updated in useEffect)
  const [convictionCloudItems, setConvictionCloudItems] = useState<ConvictionCloudItem[]>([]);

  return (
    <HoverMetricsProvider value={hoverData}>
      <UnifiedHoverProvider>
        <div className="infinite-zoom-chart-container" ref={containerRef}>
          <DevHUD visible={showDevHUD} />
          <HoverTooltipZones />
        <div className="canvas-stack" style={{ width, height }}>
          <canvas ref={mainCanvasRef} className="main-canvas" />
          <canvas ref={bufferCanvasRef} className="buffer-canvas" style={{ display: 'none' }} />
          <canvas ref={patternsCanvasRef} className="patterns-canvas" />
          <canvas 
            ref={interactionCanvasRef} 
            className="interaction-canvas"
            width={width}
            height={height}
            onMouseDown={panController.handleMouseDown}
            onMouseMove={panController.handleMouseMove}
            onMouseUp={panController.handleMouseUp}
            onMouseLeave={(e) => {
              panController.handleMouseLeave(e);
              setIsInteracting(false); // Clear interaction flag when leaving
            }}
            onMouseEnter={() => {
              setIsInteracting(true); // Set interaction flag to prevent re-renders while hovering
            }}
            onClick={handleCanvasClick}
            onDoubleClick={handleCanvasDoubleClick}
            onTouchStart={panController.handleTouchStart}
            onTouchMove={panController.handleTouchMove}
            onTouchEnd={panController.handleTouchEnd}
            style={{ cursor: panState.isPanning ? 'grabbing' : 'crosshair', pointerEvents: 'all' }}
            aria-label="Interactive stock chart"
          />
          
          {/* 📤 CSV Export Controls */}
          {showExportControls && (
            <ExportControls
              convictionCloudItems={convictionCloudItems}
              targetReportRows={[]} // Empty since we're using DOM table now
              position="floating"
              className="z-50"
            />
          )}
          
          {/* 📤 Export Toggle Button */}
          <button
            onClick={() => setShowExportControls(!showExportControls)}
            className={`
              fixed top-4 right-4 z-40 px-3 py-2 text-sm font-medium rounded-lg shadow-lg
              transition-all duration-200 border-2
              ${
                showExportControls
                  ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }
            `}
            title="Toggle CSV Export Controls"
          >
            📊 {showExportControls ? 'Hide' : 'Export'}
          </button>
          
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
            <div className="loading-overlay" style={{ pointerEvents: 'none' }}>
              <div className="loading-spinner" />
              <div className="loading-text">Loading {currentResolution?.label} data...</div>
            </div>
          )}
          
          {error && (
            <div className="error-overlay" style={{ pointerEvents: 'none' }}>
              <div className="error-message">{error.message}</div>
            </div>
          )}
          
          {!isLoading && !error && transformedData.length === 0 && (
            <div className="error-overlay" style={{ pointerEvents: 'none' }}>
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
      </UnifiedHoverProvider>
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
