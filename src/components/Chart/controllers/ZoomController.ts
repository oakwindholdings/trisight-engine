// src/components/Chart/controllers/ZoomController.ts
// Encapsulates wheel and keyboard zoom logic
// Provides reusable handlers for zoom calculations
import { useEffect, useCallback } from 'react';
import { unstable_batchedUpdates } from 'react-dom';
import { calculateVisibleRange, calculateTradingHoursVisibleRange } from '../../../utils/scaling';
import { zoomLevels, ZoomState, VisibleRange, CandlestickData } from '../../../models/ChartTypes';
import { PanState } from './PanController';

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

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!interactionCanvasRef.current) return;
    if (!interactionCanvasRef.current.contains(e.target as Node)) return;
    e.preventDefault();
    if (filteredData.length === 0) return;
    const rect = interactionCanvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const chartAreaWidth = width - margin.left - margin.right;
    const candleWidth = chartAreaWidth / effectiveCandleCount;
    const candleIndex = Math.floor((mouseX - margin.left) / candleWidth) + visibleDataIndices.start;
    const zoomDirection = e.deltaY > 0 ? 'out' : 'in';
    // Increase zoom sensitivity - was 1.1/0.9 (10%), now 1.3/0.7 (30%)
    const zoomChange = zoomDirection === 'out' ? 1.3 : 0.7;
    const newFactor = Math.max(0.1, Math.min(5.0, zoomState.factor * zoomChange));

    // Batch all state updates together to prevent flickering
    unstable_batchedUpdates(() => {
      setZoomState((prev: ZoomState) => ({ ...prev, factor: newFactor, isCustomZoom: true }));
      setPanState((prev: PanState) => ({ ...prev, translateX: 0, previousTranslateX: 0, momentum: 0 }));

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
    });
  }, [interactionCanvasRef, filteredData, width, margin, effectiveCandleCount, visibleDataIndices, zoomState, setZoomState, setPanState, showOnlyTradingHours, setVisibleDataIndices, setVisibleRange]);

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
      // Match scroll wheel zoom sensitivity
      const newFactor = Math.max(0.1, zoomState.factor * 0.7);
      
      // Batch state updates for zoom in
      unstable_batchedUpdates(() => {
        setZoomState((prev: ZoomState) => ({ ...prev, factor: newFactor, isCustomZoom: true }));
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
      });
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      // Match scroll wheel zoom sensitivity  
      const newFactor = Math.min(5.0, zoomState.factor * 1.3);
      
      // Batch state updates for zoom out
      unstable_batchedUpdates(() => {
        setZoomState((prev: ZoomState) => ({ ...prev, factor: newFactor, isCustomZoom: true }));
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
      });
    } else if (e.key === 'Home') {
      setPanState({ isPanning: false, startX: 0, previousTranslateX: 0, translateX: 0, momentum: 0 });
    }
  }, [setPanState, updateVisibleRangeFromPan, zoomState, filteredData, showOnlyTradingHours, setVisibleDataIndices, setVisibleRange, setZoomState]);

  useEffect(() => {
    const canvas = interactionCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      canvas.tabIndex = 0;
      canvas.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
        canvas.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [interactionCanvasRef, handleWheel, handleKeyDown]);
}
