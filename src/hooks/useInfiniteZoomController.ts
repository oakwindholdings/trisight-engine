// src/hooks/useInfiniteZoomController.ts
// Handles infinite zoom interactions and dynamic data loading
// Manages resolution changes based on zoom level

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { fetchCandlestickData } from '../api/twelveDataApi';
import { ResolutionConfig, getOptimalResolution, InfiniteZoomState, VisibleRange, RESOLUTION_CONFIGS } from '../utils/dataResolution';
import { PanState } from './usePanController';

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
    console.log('useInfiniteZoomController - Clearing lastFetchParams due to symbol change or mount');
    lastFetchParams.current = '';
  }, [symbol]);

  // Clear lastFetchParams when date range changes
  useEffect(() => {
    console.log('useInfiniteZoomController - Clearing lastFetchParams due to date range change');
    lastFetchParams.current = '';
  }, [startDate?.getTime(), endDate?.getTime()]);

  // Helper function to get resolution that's appropriate for the date range
  const getAppropriateResolution = useCallback((targetCandles: number, dateRange?: { start: Date; end: Date }) => {
    if (!dateRange || !dateRange.start || !dateRange.end) {
      console.log('getAppropriateResolution - No date range provided, using default resolution selection');
      return getOptimalResolution(targetCandles);
    }

    // Calculate the date range in days
    const rangeInMs = dateRange.end.getTime() - dateRange.start.getTime();
    const rangeInDays = rangeInMs / (1000 * 60 * 60 * 24);
    
    console.log('getAppropriateResolution - Date range:', {
      start: dateRange.start.toISOString(),
      end: dateRange.end.toISOString(),
      rangeInDays,
      targetCandles
    });
    
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

    console.log('getAppropriateResolution - Appropriate configs:', appropriateConfigs.map(c => c.interval));

    // Find the best resolution from the appropriate ones
    for (const config of appropriateConfigs) {
      if (targetCandles <= config.maxCandles) {
        console.log('getAppropriateResolution - Selected resolution:', config.interval);
        return config;
      }
    }
    
    // Default to the finest appropriate resolution
    const defaultResolution = appropriateConfigs[0] || RESOLUTION_CONFIGS[0];
    console.log('getAppropriateResolution - Using default resolution:', defaultResolution.interval);
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
    console.log('fetchDataAtResolution called with:', {
      resolution: resolution.interval,
      symbol,
      isLoadingData: isLoadingData.current,
      currentDataLength: data.length
    });
    
    if (isLoadingData.current || !symbol) {
      console.log('fetchDataAtResolution - Skipping:', {
        isLoadingData: isLoadingData.current,
        hasSymbol: !!symbol
      });
      return;
    }
    
    // Include date range in cache key to avoid serving wrong cached data
    const dateRangeKey = startDate && endDate 
      ? `_${startDate.getTime()}_${endDate.getTime()}`
      : '_default';
    const cacheKey = `${symbol}_${resolution.interval}${dateRangeKey}`;
    
    console.log('fetchDataAtResolution - Cache key:', cacheKey);
    console.log('fetchDataAtResolution - Last fetch params:', lastFetchParams.current);
    
    // Check if we're trying to fetch the same data
    if (lastFetchParams.current === cacheKey) {
      console.log('fetchDataAtResolution - Skipping: same params as last fetch');
      return;
    }
    
    const cached = dataCache.current[cacheKey];
    console.log('fetchDataAtResolution - Cached data:', cached ? 'found' : 'not found');
    
    // Use cache if data is less than 1 minute old
    if (cached && Date.now() - cached.timestamp < 60000) {
      console.log('fetchDataAtResolution - Using cached data');
      onDataUpdate(cached.data, resolution);
      setData(cached.data);
      lastFetchParams.current = cacheKey;
      return;
    }
    
    console.log('fetchDataAtResolution - Proceeding with API fetch');
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
        console.log(`useInfiniteZoomController - Using provided date range: ${fetchStartDate.toISOString()} to ${fetchEndDate.toISOString()}`);
      } else {
        // Calculate date range based on resolution if not provided
        fetchEndDate = new Date();
        fetchStartDate = new Date();
        const daysToFetch = resolution.daysPerCandle * 200; // 200 candles worth
        fetchStartDate.setDate(fetchStartDate.getDate() - Math.max(7, daysToFetch));
        console.log(`useInfiniteZoomController - Using calculated date range: ${fetchStartDate.toISOString()} to ${fetchEndDate.toISOString()}`);
      }
      
      console.log(`useInfiniteZoomController - Fetching ${symbol} data with interval ${resolution.interval}`);
      console.log(`Fetching data from ${fetchStartDate.toISOString()} to ${fetchEndDate.toISOString()}`);
      
      const fetchedData = await fetchCandlestickData(
        symbol,
        resolution.interval,
        fetchStartDate,
        fetchEndDate
      );
      
      console.log(`useInfiniteZoomController - Fetched ${fetchedData.length} data points`);
      
      // Cache the data
      dataCache.current[cacheKey] = {
        data: fetchedData,
        timestamp: Date.now()
      };
      
      onDataUpdate(fetchedData, resolution);
      setData(fetchedData);
      lastFetchParams.current = cacheKey;
    } catch (error) {
      console.error('Failed to fetch data:', error);
      console.error('Error details:', {
        symbol,
        interval: resolution.interval,
        startDate: fetchStartDate.toISOString(),
        endDate: fetchEndDate.toISOString(),
        error: error instanceof Error ? error.message : String(error)
      });
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
    
    console.log('useInfiniteZoomController - handleZoomChange:', {
      newZoom,
      newTargetCandles,
      currentResolution: currentResolution.interval,
      newResolution: newResolution.interval,
      willChangeResolution: newResolution.interval !== currentResolution.interval
    });
    
    // Store zoom origin for maintaining focus
    if (originX !== undefined) {
      const chartWidth = width - margin.left - margin.right;
      zoomOrigin.current = {
        x: originX - margin.left,
        ratio: (originX - margin.left) / chartWidth
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
    
    // Reset pan when zooming
    setPanState((prev: PanState) => ({ 
      ...prev,
      translateX: 0, 
      momentum: 0,
      isPanning: false
    }));
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
    endDate
  ]);

  // Handle wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const delta = e.deltaY;
    const scaleFactor = delta > 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.1, Math.min(10, zoomLevel * scaleFactor));
    
    console.log('useInfiniteZoomController - handleWheel:', {
      delta,
      scaleFactor,
      currentZoom: zoomLevel,
      newZoom,
      willUpdate: newZoom !== zoomLevel
    });
    
    handleZoomChange(newZoom);
  }, [zoomLevel, handleZoomChange]);

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
        console.log('Date range changed, updating resolution from', currentResolution.interval, 'to', newResolution.interval);
        setCurrentResolution(newResolution);
      }
    }
  }, [startDate, endDate, targetCandles, currentResolution.interval, getAppropriateResolution]);

  // Fetch data when resolution or date range changes
  useEffect(() => {
    console.log('useInfiniteZoomController - Data fetch useEffect triggered');
    console.log('Params:', {
      symbol,
      interval: currentResolution.interval,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      isLoadingData: isLoadingData.current
    });
    
    // Skip if we're already loading
    if (isLoadingData.current) {
      console.log('useInfiniteZoomController - Skipping fetch, already loading');
      return;
    }
    
    // Create a key to check if params actually changed
    const paramsKey = `${symbol}_${currentResolution.interval}_${startDate?.getTime() || 'none'}_${endDate?.getTime() || 'none'}`;
    
    console.log('useInfiniteZoomController - Current params key:', paramsKey);
    console.log('useInfiniteZoomController - Last params key:', lastFetchParams.current);
    
    // Skip if nothing changed
    if (lastFetchParams.current === paramsKey) {
      console.log('useInfiniteZoomController - Skipping fetch, params unchanged');
      return;
    }
    
    console.log('useInfiniteZoomController - Calling fetchDataAtResolution');
    fetchDataAtResolution(currentResolution);
  }, [symbol, currentResolution.interval, startDate?.getTime(), endDate?.getTime(), fetchDataAtResolution]);

  // Public methods
  const [transition, setTransition] = useState(false);

  const zoomTo = useCallback((targetLevel: number) => {
    const newLevel = Math.max(0.1, Math.min(100, targetLevel));
    setZoomLevel(newLevel);
    
    // Calculate new target candles based on zoom level
    const newTargetCandles = Math.round(100 / newLevel);
    setTargetCandles(newTargetCandles);
    
    // Reset pan when zooming
    setPanState((prev: PanState) => ({ 
      ...prev,
      translateX: 0, 
      momentum: 0,
      isPanning: false
    }));
    
    setTransition(true);
    setTimeout(() => setTransition(false), 300);
  }, [setPanState]);

  const zoomIn = useCallback(() => {
    zoomTo(zoomLevel * 0.67);
  }, [zoomLevel, zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(zoomLevel * 1.5);
  }, [zoomLevel, zoomTo]);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setTransition(true);
    setTimeout(() => setTransition(false), 300);
    const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined;
    const newResolution = getAppropriateResolution(100, dateRange);
    setCurrentResolution(newResolution);
    fetchDataAtResolution(newResolution);
  }, [fetchDataAtResolution, startDate, endDate, getAppropriateResolution]);

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
    
    console.log(`Zoom to fit: data length=${data.length}, chart width=${chartWidth}, optimal zoom=${optimalZoomLevel}`);
    
    zoomTo(optimalZoomLevel);
  }, [data.length, width, margin, zoomTo]);

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
