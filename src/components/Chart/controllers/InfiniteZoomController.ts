// src/components/Chart/controllers/InfiniteZoomController.ts
// Advanced zoom controller with infinite zoom capabilities
// Dynamically adjusts data resolution based on zoom level

import { useEffect, useCallback, useRef, useState } from 'react';
import { CandlestickData, VisibleRange } from '../../../models/ChartTypes';
import { PanState } from './PanController';
import { 
  fetchDataWithResolution, 
  getOptimalResolution, 
  ResolutionConfig,
  interpolateCandles,
  aggregateCandles 
} from '../../../utils/dataResolution';
import { calculateVisibleRange } from '../../../utils/scaling';

export interface InfiniteZoomState {
  zoomLevel: number;  // 0.001 to 1000 (log scale)
  resolution: ResolutionConfig;
  isTransitioning: boolean;
  targetCandles: number;
}

export interface InfiniteZoomOptions {
  interactionCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  symbol: string;
  startDate?: Date;
  endDate?: Date;
  targetCandles?: number;
  externalData?: CandlestickData[];
  disableAutoFetch?: boolean;
  
  onDataUpdate: (data: CandlestickData[], resolution: ResolutionConfig, fullData?: CandlestickData[]) => void;
  onZoomChange: (state: InfiniteZoomState) => void;
  setPanState: React.Dispatch<React.SetStateAction<PanState>>;
  setVisibleRange: React.Dispatch<React.SetStateAction<VisibleRange>>;
}

// Zoom constraints
const MIN_ZOOM = 0.001;  // Show thousands of candles
const MAX_ZOOM = 1000;   // Show single candle in detail
const ZOOM_SPEED = 0.002; // Sensitivity of zoom
const SMOOTH_ZOOM_DURATION = 150; // milliseconds

export function useInfiniteZoomController(opts: InfiniteZoomOptions) {
  const {
    interactionCanvasRef,
    width,
    height,
    margin,
    symbol,
    onDataUpdate,
    onZoomChange,
    setPanState,
    setVisibleRange
  } = opts;

  const [zoomState, setZoomState] = useState<InfiniteZoomState>({
    zoomLevel: 1,
    resolution: getOptimalResolution(100),
    isTransitioning: false,
    targetCandles: 100
  });

  const animationRef = useRef<number | null>(null);
  const targetZoomRef = useRef<number>(1);
  const currentZoomRef = useRef<number>(1);
  const zoomOriginRef = useRef<{ x: number; timestamp: number } | null>(null);
  const lastFetchRef = useRef<{ resolution: string; timestamp: number } | null>(null);

  // Calculate visible candle count based on zoom level
  const calculateVisibleCandles = useCallback((zoomLevel: number): number => {
    // Logarithmic scale: zoom 1 = 100 candles, zoom 0.1 = 1000 candles, zoom 10 = 10 candles
    return Math.round(100 / zoomLevel);
  }, []);

  // Smooth zoom animation
  const animateZoom = useCallback(() => {
    const diff = targetZoomRef.current - currentZoomRef.current;
    
    if (Math.abs(diff) < 0.001) {
      currentZoomRef.current = targetZoomRef.current;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Final update
      const targetCandles = calculateVisibleCandles(currentZoomRef.current);
      const resolution = getOptimalResolution(targetCandles);
      
      setZoomState(prev => ({
        ...prev,
        zoomLevel: currentZoomRef.current,
        resolution,
        isTransitioning: false,
        targetCandles
      }));
      
      return;
    }
    
    // Smooth interpolation
    currentZoomRef.current += diff * 0.15;
    
    // Update state during animation
    const targetCandles = calculateVisibleCandles(currentZoomRef.current);
    const resolution = getOptimalResolution(targetCandles);
    
    setZoomState(prev => ({
      ...prev,
      zoomLevel: currentZoomRef.current,
      resolution,
      isTransitioning: true,
      targetCandles
    }));
    
    animationRef.current = requestAnimationFrame(animateZoom);
  }, [calculateVisibleCandles]);

  // Fetch data when resolution changes
  useEffect(() => {
    const fetchData = async () => {
      const { resolution } = zoomState;
      
      // Avoid redundant fetches
      if (lastFetchRef.current && 
          lastFetchRef.current.resolution === resolution.timeframe &&
          Date.now() - lastFetchRef.current.timestamp < 1000) {
        return;
      }
      
      try {
        const { data, resolution: fetchedResolution } = await fetchDataWithResolution(
          symbol,
          zoomState.targetCandles
        );
        
        lastFetchRef.current = {
          resolution: fetchedResolution.timeframe,
          timestamp: Date.now()
        };
        
        // Apply data smoothing for transitions
        let processedData = data;
        
        // If we have too many candles, aggregate them FOR UI RENDERING ONLY
        if (data.length > zoomState.targetCandles * 2) {
          processedData = aggregateCandles(data, zoomState.targetCandles);
        }
        // If we have too few candles, interpolate (for smooth visualization)
        else if (data.length < zoomState.targetCandles / 2 && data.length > 1) {
          processedData = interpolateCandles(data, Math.min(zoomState.targetCandles, data.length * 2));
        }
        
        // CRITICAL FIX: Pass both full data for pattern detection AND processed data for UI
        // This ensures pattern detection always gets the complete, unaggregated dataset
        onDataUpdate(processedData, fetchedResolution, data); // Pass original full data as third parameter
        
        // Update visible range
        if (processedData.length > 0) {
          const endIndex = processedData.length - 1;
          const startIndex = Math.max(0, endIndex - zoomState.targetCandles);
          const visibleRange = calculateVisibleRange(processedData, startIndex, endIndex);
          setVisibleRange(visibleRange);
        }
      } catch (error) {
        console.error('Failed to fetch data for resolution:', error);
      }
    };

    // Debounce data fetching during transitions
    const timer = setTimeout(fetchData, zoomState.isTransitioning ? 100 : 0);
    return () => clearTimeout(timer);
  }, [symbol, zoomState.resolution.timeframe, zoomState.targetCandles, zoomState.isTransitioning, onDataUpdate, setVisibleRange]);

  // Handle wheel events for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!interactionCanvasRef.current || !interactionCanvasRef.current.contains(e.target as Node)) {
      return;
    }
    
    e.preventDefault();
    
    // Calculate zoom origin (mouse position relative to chart)
    const rect = interactionCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const chartWidth = width - margin.left - margin.right;
    const normalizedX = mouseX / chartWidth;
    
    // Store zoom origin for maintaining focus point
    zoomOriginRef.current = {
      x: normalizedX,
      timestamp: Date.now()
    };
    
    // Calculate zoom change
    const delta = -e.deltaY * ZOOM_SPEED;
    const zoomFactor = Math.exp(delta);
    
    // Apply zoom with constraints
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, targetZoomRef.current * zoomFactor));
    targetZoomRef.current = newZoom;
    
    // Reset pan when zooming
    setPanState(prev => ({ 
      ...prev, 
      translateX: 0, 
      previousTranslateX: 0,
      momentum: 0
    }));
    
    // Start animation if not already running
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(animateZoom);
    }
    
    // Notify zoom change
    onZoomChange({
      ...zoomState,
      zoomLevel: newZoom,
      targetCandles: calculateVisibleCandles(newZoom)
    });
  }, [interactionCanvasRef, width, margin, setPanState, animateZoom, onZoomChange, zoomState, calculateVisibleCandles]);

  // Handle pinch zoom for touch devices
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Store initial pinch distance
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      (e.target as any)._pinchStart = {
        distance,
        zoom: currentZoomRef.current
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && (e.target as any)._pinchStart) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const pinchStart = (e.target as any)._pinchStart;
      const scale = distance / pinchStart.distance;
      
      // Apply pinch zoom
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, pinchStart.zoom * scale));
      targetZoomRef.current = newZoom;
      
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animateZoom);
      }
    }
  }, [animateZoom]);

  // Setup event listeners
  useEffect(() => {
    const canvas = interactionCanvasRef.current;
    if (!canvas) return;

    // Mouse wheel
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    // Touch events for pinch zoom
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [interactionCanvasRef, handleWheel, handleTouchStart, handleTouchMove]);

  // Public API
  return {
    zoomState,
    zoomTo: (level: number) => {
      targetZoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animateZoom);
      }
    },
    resetZoom: () => {
      targetZoomRef.current = 1;
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animateZoom);
      }
    },
    zoomToIndices: (startIdx: number, endIdx: number, totalCandles: number) => {
      // Calculate zoom level needed to fit range
      const rangeCandleCount = endIdx - startIdx + 1;
      const targetCandleCount = Math.max(21, rangeCandleCount + 20); // Pad with 10 on each side
      const newZoom = totalCandles / targetCandleCount;
      
      // Set zoom
      targetZoomRef.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
      
      // Calculate pan offset to center the range
      const centerIdx = (startIdx + endIdx) / 2;
      const centerRatio = centerIdx / totalCandles;
      const panOffset = -(centerRatio - 0.5) * (width - margin.left - margin.right) * newZoom;
      
      // Apply pan
      setPanState({
        isPanning: false,
        startX: 0,
        previousTranslateX: panOffset,
        translateX: panOffset,
        momentum: 0
      });
      
      // Start animation
      if (!animationRef.current) {
        animationRef.current = requestAnimationFrame(animateZoom);
      }
    }
  };
}
