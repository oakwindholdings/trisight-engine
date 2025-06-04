// src/components/Chart/controllers/ZoomController.ts
// Encapsulates wheel and keyboard zoom logic
// Provides reusable handlers for zoom calculations
import { useEffect, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { calculateVisibleRange, calculateTradingHoursVisibleRange } from '../../../utils/scaling';
import { zoomLevels, ZoomState, VisibleRange, CandlestickData } from '../../../models/ChartTypes';
import { PanState } from './PanController';
import { useSmoothZoom } from '../../../hooks/useSmoothZoom';

interface ZoomOptions {
  interactionCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  effectiveCandleCount: number;
  visibleDataIndices: { start: number; end: number };
  zoomState: ZoomState;
  setZoomState: React.Dispatch<React.SetStateAction<ZoomState>>;
  setPanState: React.Dispatch<React.SetStateAction<PanState>>;
  filteredData: CandlestickData[];
  showOnlyTradingHours: boolean;
  setVisibleDataIndices: React.Dispatch<React.SetStateAction<{ start: number; end: number }>>;
  setVisibleRange: React.Dispatch<React.SetStateAction<VisibleRange>>;
  updateVisibleRangeFromPan: (tx: number) => void;
}

export function useZoomController(opts: ZoomOptions) {
  const {
    interactionCanvasRef,
    width,
    height,
    margin,
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
  } = opts;

  // Handle zoom changes from smooth zoom
  const handleSmoothZoomChange = useCallback((newFactor: number, originX?: number) => {
    if (filteredData.length === 0) return;

    // Batch all state updates together to prevent flickering
    unstable_batchedUpdates(() => {
      setZoomState((prev: ZoomState) => ({ ...prev, factor: newFactor, isCustomZoom: true }));
      setPanState((prev: PanState) => ({ ...prev, translateX: 0, previousTranslateX: 0, momentum: 0 }));

      const newCandleCount = Math.round(zoomState.level.candleCount * newFactor);
      
      // Calculate zoom origin if provided
      let candleIndex = visibleDataIndices.start + Math.floor(effectiveCandleCount / 2);
      if (originX !== undefined) {
        const chartAreaWidth = width - margin.left - margin.right;
        const candleWidth = chartAreaWidth / effectiveCandleCount;
        candleIndex = Math.floor((originX - margin.left) / candleWidth) + visibleDataIndices.start;
      }
      
      // Keep the candle under cursor in the same position
      const startIndex = Math.max(0, candleIndex - Math.floor(newCandleCount / 2));
      const endIndex = Math.min(filteredData.length - 1, startIndex + newCandleCount);
      
      setVisibleDataIndices({ start: startIndex, end: endIndex });
      
      const newVisibleRange = showOnlyTradingHours
        ? calculateTradingHoursVisibleRange(filteredData, startIndex, endIndex)
        : calculateVisibleRange(filteredData, startIndex, endIndex);
      setVisibleRange(newVisibleRange);
    });
  }, [filteredData, width, margin, effectiveCandleCount, visibleDataIndices, zoomState.level.candleCount, setZoomState, setPanState, showOnlyTradingHours, setVisibleDataIndices, setVisibleRange]);

  // Initialize smooth zoom
  const { handleWheel, zoomTo } = useSmoothZoom(zoomState.factor, {
    minZoom: 0.1,
    maxZoom: 5.0,
    zoomSensitivity: 0.0015, // Fine-grained control
    smoothingFactor: 0.2, // Smooth interpolation
    onZoomChange: handleSmoothZoomChange
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setPanState((prev: PanState) => {
        const newTranslateX = prev.translateX - 50;
        updateVisibleRangeFromPan(newTranslateX);
        return { ...prev, translateX: newTranslateX, previousTranslateX: newTranslateX };
      });
    } else if (e.key === 'ArrowRight') {
      setPanState((prev: PanState) => {
        const newTranslateX = prev.translateX + 50;
        updateVisibleRangeFromPan(newTranslateX);
        return { ...prev, translateX: newTranslateX, previousTranslateX: newTranslateX };
      });
    } else if (e.key === 'ArrowUp' || e.key === '+') {
      // Smooth zoom in
      zoomTo(zoomState.factor * 0.8);
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      // Smooth zoom out
      zoomTo(zoomState.factor * 1.25);
    } else if (e.key === 'Home') {
      setPanState({ isPanning: false, startX: 0, previousTranslateX: 0, translateX: 0, momentum: 0 });
      zoomTo(1, true); // Reset zoom immediately
    }
  }, [setPanState, updateVisibleRangeFromPan, zoomState.factor, zoomTo]);

  useEffect(() => {
    const canvas = interactionCanvasRef.current;
    if (canvas) {
      // Remove native wheel handler - we'll use React's onWheel prop instead
      canvas.tabIndex = 0;
      canvas.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [interactionCanvasRef, handleKeyDown]);

  return {
    handleWheel,
    zoomTo
  };
}
