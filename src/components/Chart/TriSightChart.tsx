// src/components/Chart/TriSightChart.tsx
// Main candlestick chart component
// Handles zoom and pattern overlay
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { CandlestickData, zoomLevels } from '../../models/ChartTypes';
import { Pattern, PatternType, GoldmineChannelPattern, PivotPattern, RocketmanPattern, EscalatorPattern, ChannelDirection, ThrustDirection } from '../../models/PatternTypes';
import { createTimeScale, createPriceScale, calculateVisibleRange, calculateTradingHoursVisibleRange } from '../../utils/scaling';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { createTimeScaleWithCompression } from '../../utils/compressedTimeScale';
// Only using filterTradingHoursData from this import
import { filterTradingHoursData } from '../../utils/marketHours';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { usePatternContext } from '../../contexts/PatternContext';
import { isFeatureEnabled } from '../../utils/featureFlags';

// Import chart components
import CandlestickRenderer from './CandlestickRenderer';
import PatternRenderer from './PatternRenderer';
import TimeAxis from './TimeAxis';
import PriceAxis from './PriceAxis';

// Type definitions for scales and patterns
type TimeScaleType = ReturnType<typeof createTimeScale>;
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
  // Refs for different canvases (using double buffering)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternsCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Variables for momentum-based panning
  const momentumRAF = useRef<number>(0); // RequestAnimationFrame ID
  const panTimeStamp = useRef<number>(0); // For tracking pan timing
  const previousPanX = useRef<number>(0); // For calculating momentum
  const currentMomentumRef = useRef(0); // Current momentum value
  const currentTranslateXRef = useRef(0); // Current translate position for momentum
  
  // State for visible range, pan, and zoom
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
  
  // Current active timeframe resolution
  const [activeTimeframe, setActiveTimeframe] = useState(timeframe);
  
  const [zoomState, setZoomState] = useState<ZoomState>({
    // Default to a wider view showing more candles (trading day view)
    // Find the trading day view zoom level
    level: zoomLevels.find(level => level.name === 'trading_day_view') || zoomLevels[5],
    factor: 1.0, // No additional zoom
    isCustomZoom: false
  });
  
  // Computed effective zoom level (considering the zoom factor)
  const effectiveCandleCount = Math.round(zoomState.level.candleCount * zoomState.factor);
  const [visibleDataIndices, setVisibleDataIndices] = useState({ start: 0, end: 0 });
  const [filteredData, setFilteredData] = useState<CandlestickData[]>([]);
  // Initialize from localStorage or default to true
  const [showOnlyTradingHours, setShowOnlyTradingHours] = useState<boolean>(() => {
    const saved = localStorage.getItem('showOnlyTradingHours');
    return saved !== null ? saved === 'true' : true;
  });
  
  // Track the current active timeframe
  const [currentTimeframe, setCurrentTimeframe] = useState(timeframe);
  
  // Update internal state when prop changes
  useEffect(() => {
    if (timeframe !== currentTimeframe) {
      setCurrentTimeframe(timeframe);
      console.log(`Timeframe changed to: ${timeframe}`);
      // Reset zoom state when changing timeframe
      setZoomState({
        level: zoomLevels[3], // Default level
        factor: 1.0,
        isCustomZoom: false
      });
    }
  }, [timeframe, currentTimeframe]);

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
      // First filter by trading hours if needed
      const hoursFilteredData = showOnlyTradingHours ? filterTradingHoursData(data) : data;
      
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
    
    // Update visible range
    if (startIndex < filteredData.length && endIndex < filteredData.length) {
      const newVisibleRange = calculateVisibleRange(
        filteredData.slice(startIndex, endIndex + 1),
        0.1, // Padding percentage
        0 // Third parameter as a number instead of boolean
      );
      setVisibleRange(newVisibleRange);
    }
  }, [filteredData, visibleDataIndices, setVisibleDataIndices, setVisibleRange]);

  // Create a ref for the mousedown handler
  const handleMouseDownRef = useRef<((e: React.MouseEvent<HTMLCanvasElement>) => void) | null>(null);
  
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only respond to left mouse button
    if (e.button !== 0) return;
    
    // Get mouse position
    const mouseX = e.clientX;
    
    // Stop any ongoing momentum
    if (momentumRAF.current) {
      cancelAnimationFrame(momentumRAF.current);
      momentumRAF.current = 0;
    }
    
    // Start panning
    setPanState(prev => ({
      ...prev,
      isPanning: true,
      startX: mouseX,
      previousTranslateX: prev.translateX,
      momentum: 0
    }));
    
    // Record time for momentum calculation
    panTimeStamp.current = Date.now();
    previousPanX.current = mouseX;
    
    // Add event listeners for mousemove and mouseup outside canvas
    document.addEventListener('mousemove', handleDocumentMouseMoveRef.current!);
    document.addEventListener('mouseup', handleMouseUpRef.current!);
    
    // Prevent text selection during drag
    e.preventDefault();
  }, [setPanState]);
  
  // Assign the mousedown ref
  useEffect(() => {
    handleMouseDownRef.current = handleMouseDown;
  }, [handleMouseDown]);



  // Calculate candle width based on chart dimensions and zoom level
  const candleWidth = useMemo(() => {
    return Math.max(2, chartWidth / effectiveCandleCount);
  }, [chartWidth, effectiveCandleCount]);
  
  // Create refs to avoid circular dependencies
  const applyPanMomentumRef = useRef<(() => void) | null>(null);
  const handleDocumentMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const handleMouseUpRef = useRef<(() => void) | null>(null);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Function to apply momentum-based scrolling
  const applyPanMomentum = useCallback(() => {
    // Decay momentum over time
    currentMomentumRef.current *= 0.95;
    
    // Apply momentum to translate position
    currentTranslateXRef.current += currentMomentumRef.current;
    
    // Update pan state with new translate position
    setPanState(prev => ({
      ...prev,
      translateX: currentTranslateXRef.current,
      momentum: currentMomentumRef.current
    }));
    
    // Update visible range based on pan position
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    
    // Continue animation if momentum is significant
    if (Math.abs(currentMomentumRef.current) > 0.1) {
      momentumRAF.current = requestAnimationFrame(() => {
        if (applyPanMomentumRef.current) {
          applyPanMomentumRef.current();
        }
      });
    } else {
      // Stop animation when momentum is negligible
      momentumRAF.current = 0;
    }
  }, [setPanState, updateVisibleRangeFromPan]);
  
  // Assign the ref to the current function
  useEffect(() => {
    applyPanMomentumRef.current = applyPanMomentum;
  }, [applyPanMomentum]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Mouse move handler during panning
  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!panState.isPanning) return;
    
    const x = e.clientX;
    const dx = x - panState.startX;
    currentTranslateXRef.current = panState.previousTranslateX + dx;
    const now = Date.now();
    const dt = now - panTimeStamp.current;
    if (dt > 0) {
      const velocity = (x - previousPanX.current) / dt;
      currentMomentumRef.current = velocity * 15; // Amplify the momentum a bit
    }
    panTimeStamp.current = now;
    previousPanX.current = x;
    
    // Update pan state
    setPanState(prev => ({
      ...prev,
      translateX: currentTranslateXRef.current,
      momentum: currentMomentumRef.current
    }));
    
    // Update visible range based on pan
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    
    // Prevent default behavior to avoid browser drag operations
    e.preventDefault();
  }, [panState, updateVisibleRangeFromPan, setPanState]);
  
  // Assign the mousemove ref
  useEffect(() => {
    handleDocumentMouseMoveRef.current = handleDocumentMouseMove;
  }, [handleDocumentMouseMove]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Mouse up handler (completes panning action)
  const handleMouseUp = useCallback(() => {
    // End panning state
    setPanState(prev => ({
      ...prev,
      isPanning: false
    }));
    
    // Apply momentum if it's significant
    if (Math.abs(panState.momentum) > 1) {
      currentMomentumRef.current = panState.momentum;
      currentTranslateXRef.current = panState.translateX;
      if (applyPanMomentumRef.current) {
        applyPanMomentumRef.current();
      }
    }
    
    // Remove event listeners when mouse is released
    document.removeEventListener('mousemove', handleDocumentMouseMoveRef.current!);
    document.removeEventListener('mouseup', handleMouseUpRef.current!);
  }, [panState, setPanState]);
  
  // Helper function to find a pattern at a specific position
  const findPatternAtPosition = useCallback((x: number, y: number, patterns: Pattern[], timeScale: TimeScaleType, priceScale: PriceScaleType) => {
    // If no patterns, return null
    if (!patterns || patterns.length === 0) return null;
    
    // First check for clicks on pattern labels
    const labelPositions = patterns.map(pattern => {
      // Calculate pattern midpoint for label positioning
      // Use let instead of const since we may need to modify this for some patterns
      let xMid = timeScale.scale(new Date((pattern.startTime.getTime() + pattern.endTime.getTime()) / 2));
      
      // Determine the appropriate y-position based on pattern type
      let yMid;
      if (pattern.type === PatternType.GOLDMINE_CHANNEL) {
        // Type assertion to access Goldmine Channel properties
        const goldminePattern = pattern as GoldmineChannelPattern;
        yMid = priceScale.scale((goldminePattern.upperBoundary + goldminePattern.lowerBoundary) / 2);
      } else if (pattern.type === PatternType.PIVOT) {
        // For Pivot patterns, use the pivot level for accurate label positioning
        const pivotPattern = pattern as PivotPattern;
        yMid = priceScale.scale(pivotPattern.pivotLevel);
      } else if (pattern.type === PatternType.ROCKETMAN) {
        // For Rocketman patterns, use peak time and acceleration for best label placement
        const rocketmanPattern = pattern as RocketmanPattern;
        
        // Calculate position at peak of the pattern
        const peakX = timeScale.scale(rocketmanPattern.peakTime);
        
        // Use peak of acceleration for y-positioning
        const peakY = priceScale.scale(
          Math.max(
            rocketmanPattern.highPrice - (rocketmanPattern.highPrice - rocketmanPattern.lowPrice) * 0.15,
            (rocketmanPattern.highPrice + rocketmanPattern.lowPrice) / 2
          )
        );
        
        // Adjust xMid to use peak time instead of midpoint
        xMid = peakX;
        yMid = peakY;
      } else if (pattern.type === PatternType.ESCALATOR) {
        // For Escalator patterns, place labels at a logical point along the trend
        const escalatorPattern = pattern as EscalatorPattern;
        
        // Place the label at about 2/3 into the pattern for ascending trends, 1/3 for descending
        let timeRatio = 0.5; // default midpoint
        
        if (escalatorPattern.direction) {
          if (escalatorPattern.direction === ThrustDirection.BULLISH) {
            timeRatio = 0.67; // 2/3 into the pattern for bullish trends
          } else if (escalatorPattern.direction === ThrustDirection.BEARISH) {
            timeRatio = 0.33; // 1/3 into the pattern for bearish trends
          }
        }
        
        // Calculate time at the specified ratio
        const timeAtRatio = new Date(
          pattern.startTime.getTime() + 
          (pattern.endTime.getTime() - pattern.startTime.getTime()) * timeRatio
        );
        
        xMid = timeScale.scale(timeAtRatio);
        
        // Use the highPrice/lowPrice ratio that mirrors the time ratio for y-positioning
        const priceRange = pattern.highPrice - pattern.lowPrice;
        const targetPrice = pattern.lowPrice + priceRange * timeRatio;
        yMid = priceScale.scale(targetPrice);
      } else {
        // Default for other patterns
        yMid = priceScale.scale((pattern.highPrice + pattern.lowPrice) / 2);
      }
      
      // Estimated label dimensions - these should match what's used in PatternRenderer
      const labelWidth = 80;
      const labelHeight = 24;
      
      return {
        pattern,
        x: xMid - labelWidth / 2,
        y: yMid - labelHeight / 2,
        width: labelWidth,
        height: labelHeight
      };
    });
    
    // Check if we clicked on any label first (they're more important than patterns)
    for (const label of labelPositions) {
      const padding = 5; // 5px padding for easier selection
      if (
        x >= label.x - padding &&
        x <= label.x + label.width + padding &&
        y >= label.y - padding &&
        y <= label.y + label.height + padding
      ) {
        return label.pattern;
      }
    }
    
    // Loop through patterns in reverse order (top-most drawn last)
    for (let i = patterns.length - 1; i >= 0; i--) {
      const pattern = patterns[i];
      
      // Check if the point is within the pattern's bounding box
      const startX = timeScale.scale(pattern.startTime);
      const endX = timeScale.scale(pattern.endTime);
      
      // For Goldmine Channels, use upperBoundary/lowerBoundary instead of highPrice/lowPrice
      let topY, bottomY;
      if (pattern.type === PatternType.GOLDMINE_CHANNEL) {
        // Type assertion to access Goldmine Channel properties
        const goldminePattern = pattern as GoldmineChannelPattern;
        topY = priceScale.scale(goldminePattern.upperBoundary);
        bottomY = priceScale.scale(goldminePattern.lowerBoundary);
      } else {
        topY = priceScale.scale(pattern.highPrice);
        bottomY = priceScale.scale(pattern.lowPrice);
      }
      
      // Check if point is inside pattern bounds (with some padding)
      const padding = 5; // 5px padding for easier selection
      if (
        x >= startX - padding &&
        x <= endX + padding &&
        y >= topY - padding &&
        y <= bottomY + padding
      ) {
        return pattern;
      }
    }
    
    // If no pattern was found, return null
    return null;
  }, []);
  
  // Assign the mouseup ref
  useEffect(() => {
    handleMouseUpRef.current = handleMouseUp;
  }, [handleMouseUp]);

  useEffect(() => {
    if (panState.isPanning) {
      document.addEventListener('mousemove', handleDocumentMouseMoveRef.current!);
      document.addEventListener('mouseup', handleMouseUpRef.current!);
      
      return () => {
        document.removeEventListener('mousemove', handleDocumentMouseMoveRef.current!);
        document.removeEventListener('mouseup', handleMouseUpRef.current!);
      };
    }
    
    // Clean up any animation frame when component unmounts
    return () => {
      if (momentumRAF.current) {
        cancelAnimationFrame(momentumRAF.current);
        momentumRAF.current = 0;
      }
    };
  }, [panState.isPanning, handleDocumentMouseMove, handleMouseUp]);

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

  // Properly handle wheel events with non-passive listener
  useEffect(() => {
    const wheelHandler = (e: WheelEvent) => {
      // Only handle wheel events inside the chart
      if (!interactionCanvasRef.current) return;
      if (!interactionCanvasRef.current.contains(e.target as Node)) return;
      
      // Prevent default browser behavior (page scrolling)
      e.preventDefault();
      
      // Apply wheel zoom directly
      if (filteredData.length === 0) return;
      
      // Get mouse position to zoom toward that point
      const rect = interactionCanvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      
      // Calculate chart dimensions accounting for margins
      const chartAreaWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;
      
      // Calculate which candle is under the mouse pointer
      const candleWidth = chartAreaWidth / effectiveCandleCount;
      const candleIndex = Math.floor((mouseX - CHART_MARGIN.left) / candleWidth) + visibleDataIndices.start;
      
      // Calculate zoom factor change - negative deltaY means zoom in, positive means zoom out
      const zoomDirection = e.deltaY > 0 ? 'out' : 'in';
      const zoomChange = zoomDirection === 'out' ? 1.1 : 0.9;
      const newFactor = Math.max(0.1, Math.min(5.0, zoomState.factor * zoomChange));
      
      // Apply the new zoom factor
      setZoomState(prev => ({
        ...prev,
        factor: newFactor,
        isCustomZoom: true
      }));
      
      // Stop any ongoing momentum
      if (momentumRAF.current) {
        cancelAnimationFrame(momentumRAF.current);
        momentumRAF.current = 0;
      }
      
      // Reset the pan position to maintain the mouse point
      setPanState(prev => ({
        ...prev,
        translateX: 0,
        previousTranslateX: 0,
        momentum: 0
      }));
      
      // Update visible range based on the new zoom level
      if (filteredData.length > 0) {
        const newCandleCount = Math.round(zoomState.level.candleCount * newFactor);
        const startIndex = Math.max(0, candleIndex - Math.floor(newCandleCount / 2));
        const endIndex = Math.min(filteredData.length - 1, startIndex + newCandleCount);
        
        setVisibleDataIndices({ start: startIndex, end: endIndex });
        const newVisibleRange = showOnlyTradingHours
          ? calculateTradingHoursVisibleRange(filteredData, startIndex, endIndex)
          : calculateVisibleRange(filteredData, startIndex, endIndex);
        setVisibleRange(newVisibleRange);
      }
    };
    
    // Add a non-passive wheel event listener
    const canvas = interactionCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', wheelHandler, { passive: false });
    }
    
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', wheelHandler);
      }
    };
  }, [filteredData, width, CHART_MARGIN.left, CHART_MARGIN.right, effectiveCandleCount, visibleDataIndices, zoomState, showOnlyTradingHours, setZoomState, setPanState, setVisibleDataIndices, setVisibleRange]);

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
      setZoomState({
        level: selectedLevel,
        factor: 1.0,
        isCustomZoom: false
      });
    }
  }, []);
  
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
    
    // Create time scale using visible range
    const timeScale = createTimeScale(
      width - CHART_MARGIN.left - CHART_MARGIN.right,
      [visibleRange.startTime, visibleRange.endTime],
      [CHART_MARGIN.left, width - CHART_MARGIN.right]
    );
    
    const priceScale = createPriceScale(
      height - CHART_MARGIN.top - CHART_MARGIN.bottom,
      [visibleRange.minPrice, visibleRange.maxPrice],
      [height - CHART_MARGIN.bottom, CHART_MARGIN.top]
    );
    
    // Find the pattern at the clicked position
    const clickedPattern = findPatternAtPosition(x, y, visiblePatterns, timeScale, priceScale);
    // Only call onPatternSelect if we have a pattern (handle null case)
    if (clickedPattern) {
      onPatternSelect(clickedPattern);
    }
  }, [visiblePatterns, visibleRange, width, height, onPatternSelect, panState, CHART_MARGIN]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Mouse move handler for the canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!panState.isPanning) return;
    
    const x = e.clientX;
    const dx = x - panState.startX;
    currentTranslateXRef.current = panState.previousTranslateX + dx; // Update the current translate position for momentum
    
    // Update time and position for momentum calculation
    const now = Date.now();
    const dt = now - panTimeStamp.current;
    if (dt > 0) {
      const velocity = (x - previousPanX.current) / dt;
      currentMomentumRef.current = velocity * 15; // Amplify the momentum a bit
    }
    panTimeStamp.current = now;
    previousPanX.current = x;
    
    // Update pan state
    setPanState(prev => ({
      ...prev,
      translateX: currentTranslateXRef.current,
      momentum: currentMomentumRef.current
    }));
    
    // Update visible range based on pan
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    
    // Prevent default behavior
    e.preventDefault();
  }, [panState, panState.previousTranslateX, panState.startX, updateVisibleRangeFromPan, setPanState]);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Handle mouse leave events
  const handleMouseLeave = useCallback(() => {
    // We don't want to end panning when the mouse leaves the canvas
    // since we've attached global document handlers
  }, []);
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Main render function
  const renderChart = useCallback(() => {
    const mainCanvas = mainCanvasRef.current;
    const bufferCanvas = bufferCanvasRef.current;
    const patternsCanvas = patternsCanvasRef.current;
    
    if (!mainCanvas || !bufferCanvas || !patternsCanvas || filteredData.length === 0) return;
    
    // Set up canvases
    const mainCtx = mainCanvas.getContext('2d');
    const bufferCtx = bufferCanvas.getContext('2d');
    const patternsCtx = patternsCanvas.getContext('2d');
    
    if (!mainCtx || !bufferCtx || !patternsCtx) return;
    
    // Clear all canvases
    mainCtx.clearRect(0, 0, width, height);
    bufferCtx.clearRect(0, 0, width, height);
    patternsCtx.clearRect(0, 0, width, height);
    
    // Get visible data
    const visibleData = filteredData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
    
    // Create time scale and price scale
    const timeScale = createTimeScale(
      width - CHART_MARGIN.left - CHART_MARGIN.right,
      [visibleRange.startTime, visibleRange.endTime],
      [CHART_MARGIN.left, width - CHART_MARGIN.right]
    );
    
    const priceScale = createPriceScale(
      height - CHART_MARGIN.top - CHART_MARGIN.bottom,
      [visibleRange.minPrice, visibleRange.maxPrice],
      [height - CHART_MARGIN.bottom, CHART_MARGIN.top]
    );
    
    // Render candlesticks
    CandlestickRenderer.render(bufferCtx, visibleData, timeScale, priceScale, {
      width,
      height,
      margin: CHART_MARGIN
    });
    
    // Copy from buffer to main canvas
    mainCtx.drawImage(bufferCanvas, 0, 0);
    
    // Render patterns
    PatternRenderer.render(
      patternsCtx,
      visiblePatterns, 
      timeScale,
      priceScale, 
      {
        width,
        height,
        margin: CHART_MARGIN
      },
      selectedPattern || null
    );
    
    // Render axes
    TimeAxis.render(mainCtx, timeScale, {
      width, 
      height,
      margin: CHART_MARGIN
    }, timeframe, showOnlyTradingHours);
    
    PriceAxis.render(mainCtx, priceScale, {
      width,
      height,
      margin: CHART_MARGIN
    });
  }, [filteredData, visibleDataIndices, visibleRange, width, height, CHART_MARGIN, visiblePatterns, selectedPattern]);
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pan with arrow keys
      if (e.key === 'ArrowLeft') {
        // Pan right (shows older data)
        setPanState(prev => {
          const newTranslateX = prev.translateX - 50;
          updateVisibleRangeFromPan(newTranslateX);
          return {
            ...prev,
            translateX: newTranslateX,
            previousTranslateX: newTranslateX
          };
        });
      } else if (e.key === 'ArrowRight') {
        // Pan left (shows newer data)
        setPanState(prev => {
          const newTranslateX = prev.translateX + 50;
          updateVisibleRangeFromPan(newTranslateX);
          return {
            ...prev,
            translateX: newTranslateX,
            previousTranslateX: newTranslateX
          };
        });
      } else if (e.key === 'ArrowUp' || e.key === '+') {
        // Zoom in
        const newFactor = Math.max(0.1, zoomState.factor * 0.9);
        setZoomState(prev => ({
          ...prev,
          factor: newFactor,
          isCustomZoom: true
        }));
        
        // Update visible range for keyboard zoom in
        if (filteredData.length > 0) {
          const visibleCandleCount = Math.round(zoomState.level.candleCount * newFactor);
          const endIndex = filteredData.length - 1;
          const startIndex = Math.max(0, endIndex - visibleCandleCount);
          
          setVisibleDataIndices({ start: startIndex, end: endIndex });
          setVisibleRange(
            showOnlyTradingHours
              ? calculateTradingHoursVisibleRange(filteredData, startIndex, endIndex)
              : calculateVisibleRange(filteredData, startIndex, endIndex)
          );
        }
      } else if (e.key === 'ArrowDown' || e.key === '-') {
        // Zoom out
        const newFactor = Math.min(5.0, zoomState.factor * 1.1);
        setZoomState(prev => ({
          ...prev,
          factor: newFactor,
          isCustomZoom: true
        }));
        
        // Update visible range for keyboard zoom out
        if (filteredData.length > 0) {
          const visibleCandleCount = Math.round(zoomState.level.candleCount * newFactor);
          const endIndex = filteredData.length - 1;
          const startIndex = Math.max(0, endIndex - visibleCandleCount);
          
          setVisibleDataIndices({ start: startIndex, end: endIndex });
          setVisibleRange(
            showOnlyTradingHours
              ? calculateTradingHoursVisibleRange(filteredData, startIndex, endIndex)
              : calculateVisibleRange(filteredData, startIndex, endIndex)
          );
        }
      } else if (e.key === 'Home') {
        // Reset to most recent data
        setPanState({
          isPanning: false,
          startX: 0,
          previousTranslateX: 0,
          translateX: 0,
          momentum: 0
        });
      }
    };

    // Only add keyboard listeners when the chart container is focused
    const chartElement = interactionCanvasRef.current;
    if (chartElement) {
      chartElement.tabIndex = 0; // Make canvas focusable
      chartElement.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (chartElement) {
        chartElement.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [zoomState, updateVisibleRangeFromPan, filteredData, showOnlyTradingHours, setVisibleDataIndices, setVisibleRange]);

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
