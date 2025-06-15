// src/hooks/useInfiniteZoomController.ts
// Handles infinite zoom interactions and dynamic data loading
// Manages resolution changes based on zoom level

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { fetchCandlestickData } from '../api/twelveDataApi';
import { ResolutionConfig, getOptimalResolution, InfiniteZoomState, VisibleRange, RESOLUTION_CONFIGS } from '../utils/dataResolution';
import { PanState } from './usePanController';
import { useSmoothZoom } from './useSmoothZoom';

interface UseInfiniteZoomControllerOptions {
  interactionCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  symbol: string;
  onDataUpdate: (data: CandlestickData[], resolution: ResolutionConfig) => void;
  onZoomChange: (state: InfiniteZoomState) => void;
  setPanState: React.Dispatch<React.SetStateAction<PanState>>;
  startDate?: Date;
  endDate?: Date;
}

interface DataCache {
  [key: string]: {
    data: CandlestickData[];
    timestamp: number;
  };
}

interface UseInfiniteZoomControllerReturn {
  data: CandlestickData[];
  loading: boolean;
  error: Error | null;
  zoomLevel: number;
  targetCandles: number;
  currentResolution: ResolutionConfig;
  isTransitioning: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomTo: (targetLevel: number) => void;
  zoomToFit: () => void;
  handleWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  handlePinch: (e: React.TouchEvent<HTMLCanvasElement>) => void;
  setPanState: React.Dispatch<React.SetStateAction<PanState>>;
}

// Hook for managing zoom state and data fetching at different resolutions
export const useInfiniteZoomController = (
  options: UseInfiniteZoomControllerOptions
): UseInfiniteZoomControllerReturn => {
  const { 
    interactionCanvasRef, 
    width, 
    height, 
    margin, 
    symbol, 
    onDataUpdate,
    onZoomChange = () => {},
    setPanState,
    startDate,
    endDate
  } = options;

  const [zoomLevel, setZoomLevel] = useState(1);
  const [targetCandles, setTargetCandles] = useState(100);
  const [currentResolution, setCurrentResolution] = useState<ResolutionConfig>(getOptimalResolution(100));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [data, setData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const dataCache = useRef<DataCache>({});
  const zoomOrigin = useRef<{ x: number; ratio: number } | null>(null);
  const isLoadingData = useRef(false);
  const pinchStartDistance = useRef<number | null>(null);
  const lastFetchParams = useRef<string>('');

  // Clear lastFetchParams when symbol changes or on mount
  useEffect(() => {
    lastFetchParams.current = '';
  }, [symbol]);

  // Clear lastFetchParams when date range changes
  useEffect(() => {
    lastFetchParams.current = '';
  }, [startDate, endDate]);

  // Helper function to get resolution that's appropriate for the date range
  const getAppropriateResolution = useCallback((targetCandles: number, dateRange?: { start: Date; end: Date }) => {
    if (!dateRange || !dateRange.start || !dateRange.end) {
      return getOptimalResolution(targetCandles);
    }

    // Calculate the date range in days
    const rangeInMs = dateRange.end.getTime() - dateRange.start.getTime();
    const rangeInDays = rangeInMs / (1000 * 60 * 60 * 24);
    
    // Don't use intervals that are larger than the date range
    // For example, don't use monthly intervals for a 1-week range
    const appropriateConfigs = RESOLUTION_CONFIGS.filter(config => {
      // Skip monthly resolution if range is less than 30 days
      if (config.interval === '1month' && rangeInDays < 30) return false;
      // Skip weekly resolution if range is less than 7 days
      if (config.interval === '1week' && rangeInDays < 7) return false;
      // Skip daily resolution if range is less than 1 day
      if (config.interval === '1day' && rangeInDays < 1) return false;
      return true;
    });

    // Find the best resolution from the appropriate ones
    for (const config of appropriateConfigs) {
      if (targetCandles <= config.maxCandles) {
        return config;
      }
    }
    
    // Default to the finest appropriate resolution
    const defaultResolution = appropriateConfigs[0] || RESOLUTION_CONFIGS[0];
    return defaultResolution;
  }, []);

  // Calculate visible candle count based on zoom level
  const calculateTargetCandles = useCallback((zoom: number) => {
    // Logarithmic scale for natural zoom feel
    const minCandles = 20;
    const maxCandles = 500;
    const logMin = Math.log(minCandles);
    const logMax = Math.log(maxCandles);
    
    // Invert zoom level (higher zoom = fewer candles)
    const normalized = 1 - Math.max(0, Math.min(1, (zoom - 0.1) / 10));
    const logValue = logMin + normalized * (logMax - logMin);
    
    return Math.round(Math.exp(logValue));
  }, []);

  // Fetch data at the appropriate resolution
  const fetchDataAtResolution = useCallback(async (resolution: ResolutionConfig) => {
    if (isLoadingData.current || !symbol) {
      return;
    }
    
    // Include date range in cache key to avoid serving wrong cached data
    const dateRangeKey = startDate && endDate 
      ? `_${startDate.getTime()}_${endDate.getTime()}`
      : '_default';
    const cacheKey = `${symbol}_${resolution.interval}${dateRangeKey}`;
    
    // Check if we're trying to fetch the same data
    if (lastFetchParams.current === cacheKey) {
      return;
    }
    
    const cached = dataCache.current[cacheKey];
    
    // Use cache if data is less than 1 minute old
    if (cached && Date.now() - cached.timestamp < 60000) {
      onDataUpdate(cached.data, resolution);
      setData(cached.data);
      lastFetchParams.current = cacheKey;
      return;
    }
    
    isLoadingData.current = true;
    setIsTransitioning(true);
    setLoading(true);
    
    let fetchStartDate: Date = new Date();
    let fetchEndDate: Date = new Date();
    
    try {
      if (startDate && endDate) {
        // Use the exact date range provided
        fetchStartDate = new Date(startDate);
        fetchEndDate = new Date(endDate);
      } else {
        // Calculate date range based on resolution if not provided
        fetchEndDate = new Date();
        fetchStartDate = new Date();
        const daysToFetch = resolution.daysPerCandle * 200; // 200 candles worth
        fetchStartDate.setDate(fetchStartDate.getDate() - Math.max(7, daysToFetch));
      }
      
      let fetchedData: CandlestickData[] = [];
      let retryWithPreviousDay = false;
      
      try {
        fetchedData = await fetchCandlestickData(
          symbol,
          resolution.interval,
          fetchStartDate,
          fetchEndDate
        );
      } catch (error) {
        // Check if this is a "no data available" error for today's data
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isNoDataError = errorMessage.includes('No data is available') || 
                            errorMessage.includes('no data available');
        const isToday = fetchEndDate.toDateString() === new Date().toDateString();
        
        if (isNoDataError && isToday && startDate && endDate) {
          retryWithPreviousDay = true;
          
          // Get previous trading day
          const prevDay = new Date(fetchEndDate);
          prevDay.setDate(prevDay.getDate() - 1);
          
          // Skip weekends
          const day = prevDay.getDay();
          if (day === 6) { // Saturday
            prevDay.setDate(prevDay.getDate() - 1);
          } else if (day === 0) { // Sunday
            prevDay.setDate(prevDay.getDate() - 2);
          }
          
          // Update dates for retry
          fetchStartDate = new Date(prevDay);
          fetchEndDate = new Date(prevDay);
          fetchStartDate.setHours(0, 0, 0, 0);
          fetchEndDate.setHours(23, 59, 59, 999);
          
          try {
            fetchedData = await fetchCandlestickData(
              symbol,
              resolution.interval,
              fetchStartDate,
              fetchEndDate
            );
          } catch (retryError) {
            throw retryError;
          }
        } else {
          throw error;
        }
      }
      
      // Cache the data
      dataCache.current[cacheKey] = {
        data: fetchedData,
        timestamp: Date.now()
      };
      
      onDataUpdate(fetchedData, resolution);
      setData(fetchedData);
      lastFetchParams.current = cacheKey;
    } catch (error) {
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isLoadingData.current = false;
      setIsTransitioning(false);
      setLoading(false);
    }
  }, [symbol, onDataUpdate, startDate, endDate]);

  // Handle zoom changes
  const handleZoomChange = useCallback((newZoom: number, originX?: number) => {
    const newTargetCandles = calculateTargetCandles(newZoom);
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
    const newResolution = getAppropriateResolution(newTargetCandles, dateRange);
    
    // Calculate pan offset to keep cursor position stable
    let panOffset = 0;
    let debugInfo: any = { originX, panOffset: 0 };
    
    if (originX !== undefined && width > 0) {
      const chartWidth = width - margin.left - margin.right;
      const cursorX = originX - margin.left;
      const cursorRatio = cursorX / chartWidth;
      
      // Calculate how many candles we're zooming in/out by
      const oldCandles = targetCandles;
      const newCandles = newTargetCandles;
      const candleDiff = oldCandles - newCandles;
      
      // Calculate pan offset in pixels to keep cursor position stable
      // When zooming in (fewer candles), we need to pan to keep the cursor position
      const candleWidth = chartWidth / newCandles;
      panOffset = candleDiff * candleWidth * (cursorRatio - 0.5);
      
      debugInfo = {
        originX,
        panOffset,
        candleDiff,
        candleWidth,
        cursorRatio,
        oldCandles,
        newCandles,
        chartWidth
      };
      
      // Store zoom origin for maintaining focus
      zoomOrigin.current = {
        x: cursorX,
        ratio: cursorRatio
      };
    }
    
    setZoomLevel(newZoom);
    setTargetCandles(newTargetCandles);
    
    // Check if resolution needs to change
    if (newResolution.interval !== currentResolution.interval) {
      setCurrentResolution(newResolution);
      fetchDataAtResolution(newResolution);
    }
    
    // Update zoom state
    onZoomChange({
      zoomLevel: newZoom,
      resolution: newResolution,
      isTransitioning,
      targetCandles: newTargetCandles
    });
    
    // Apply pan offset to keep cursor position stable
    setPanState((prev: PanState) => { 
      const newState = {
        ...prev,
        translateX: panOffset, 
        momentum: 0,
        isPanning: false,
        previousTranslateX: panOffset
      };
      return newState;
    });
  }, [
    calculateTargetCandles,
    width,
    margin,
    currentResolution,
    fetchDataAtResolution,
    onZoomChange,
    setPanState,
    isTransitioning,
    startDate,
    endDate,
    getAppropriateResolution,
    targetCandles
  ]);

  // Initialize smooth zoom
  const { handleWheel: smoothHandleWheel, zoomTo: smoothZoomTo } = useSmoothZoom(zoomLevel, {
    minZoom: 0.1,
    maxZoom: 10,
    zoomSensitivity: 0.002,
    smoothingFactor: 0.15,
    onZoomChange: handleZoomChange
  });

  // Handle wheel zoom - just delegate to smooth zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    smoothHandleWheel(e);
  }, [smoothHandleWheel]);

  // Handle pinch zoom
  const handlePinch = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 2) return;
    
    e.preventDefault();
    
    // Calculate distance between touches
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];
    const distance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (!pinchStartDistance.current) {
      pinchStartDistance.current = distance;
      return;
    }
    
    // Calculate zoom based on pinch distance change
    const scale = distance / pinchStartDistance.current;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel * scale));
    
    handleZoomChange(newZoom);
    pinchStartDistance.current = distance;
  }, [zoomLevel, handleZoomChange]);

  // Reset pinch state on touch end
  useEffect(() => {
    const handleTouchEnd = () => {
      pinchStartDistance.current = null;
    };
    
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [interactionCanvasRef]);

  // Update resolution when date range changes
  useEffect(() => {
    if (startDate && endDate) {
      const dateRange = { start: startDate, end: endDate };
      const newResolution = getAppropriateResolution(targetCandles, dateRange);
      
      // Only update if resolution actually changed
      if (newResolution.interval !== currentResolution.interval) {
        setCurrentResolution(newResolution);
      }
    }
  }, [startDate, endDate, targetCandles, currentResolution.interval, getAppropriateResolution]);

  // Fetch data when resolution or date range changes
  useEffect(() => {
    // Skip if we're already loading
    if (isLoadingData.current) {
      return;
    }
    
    // Create a key to check if params actually changed
    const paramsKey = `${symbol}_${currentResolution.interval}_${startDate?.getTime() || 'none'}_${endDate?.getTime() || 'none'}`;
    
    // Skip if nothing changed
    if (lastFetchParams.current === paramsKey) {
      return;
    }
    
    fetchDataAtResolution(currentResolution);
  }, [symbol, currentResolution.interval, startDate, endDate, fetchDataAtResolution]);

  // Public methods
  const [transition, setTransition] = useState(false);

  const zoomIn = useCallback(() => {
    smoothZoomTo(zoomLevel * 0.67);
  }, [zoomLevel, smoothZoomTo]);

  const zoomOut = useCallback(() => {
    smoothZoomTo(zoomLevel * 1.5);
  }, [zoomLevel, smoothZoomTo]);

  const resetZoom = useCallback(() => {
    // Use smooth zoom to animate back to 1
    smoothZoomTo(1, true); // true for immediate reset
    
    setTransition(true);
    setTimeout(() => setTransition(false), 300);
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
    const newResolution = getAppropriateResolution(100, dateRange);
    setCurrentResolution(newResolution);
    fetchDataAtResolution(newResolution);
  }, [fetchDataAtResolution, startDate, endDate, getAppropriateResolution, smoothZoomTo]);

  // Zoom to fit all data in viewport
  const zoomToFit = useCallback(() => {
    if (data.length === 0) return;
    
    // Calculate the optimal zoom level based on data length and viewport width
    const chartWidth = width - margin.left - margin.right;
    const idealCandlesPerPixel = 0.02; // Show about 50 candles per 1000 pixels
    const idealTotalCandles = chartWidth * idealCandlesPerPixel;
    
    // Calculate zoom level that would show this many candles
    // targetCandles = 100 / zoomLevel, so zoomLevel = 100 / targetCandles
    const optimalZoomLevel = Math.max(0.1, Math.min(10, 100 / idealTotalCandles));
    
    smoothZoomTo(optimalZoomLevel);
  }, [data.length, width, margin, smoothZoomTo]);
  
  // Create zoomTo wrapper function
  const zoomTo = useCallback((targetLevel: number) => {
    smoothZoomTo(targetLevel);
  }, [smoothZoomTo]);

  return {
    data,
    loading,
    error,
    zoomLevel,
    targetCandles,
    currentResolution,
    isTransitioning: transition,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomTo,
    zoomToFit,
    handleWheel,
    handlePinch,
    setPanState
  };
};

export type { UseInfiniteZoomControllerOptions };
