// src/hooks/useHoverMetrics.ts
// Hook to track mouse hover position and display corresponding metrics
// Returns hover data including index, coordinates, and blackjack count

import { useEffect, useState, createContext, useContext } from 'react';
import { usePatternContext } from '../contexts/PatternContext';
import { getSignalAtPoint, getSignalTooltip } from '../components/Chart/SignalRenderer';
import { TradeActionSignal } from '../utils/trading/TradeActionSignal';
import { getSignalValidation } from '../framework/tradeActionEmitter';
import { logDebugHover } from '../utils/debug';

interface HoverMetrics {
  idx: number;
  x: number;
  y: number;
  bj: number | string;
  candle?: any;
  visibleIndex: number;
  // NEW: Canvas signal detection
  signal?: {
    tradeActionSignal: TradeActionSignal;
    tooltip: string;
    validation?: any;
    isHovered: boolean;
  };
}

const HoverMetricsContext = createContext<HoverMetrics | null>(null);

export function useHoverMetricsContext() {
  return useContext(HoverMetricsContext);
}

export function useHoverMetrics(
  ref: React.RefObject<HTMLDivElement | null>, 
  timeScale?: { invert: (pixel: number) => Date },
  data?: any[],
  margin?: { left: number; top: number; right?: number; bottom?: number },
  visibleDataIndices?: { start: number; end: number },
  // NEW: Canvas signal detection parameters
  signals?: TradeActionSignal[],
  canvasTimeScale?: any,
  canvasPriceScale?: any
) {
  const { bjCounts, escalatorDir } = usePatternContext();
  const [hoverData, setHoverData] = useState<HoverMetrics | null>(null);
  
  useEffect(() => {
    const node = ref.current;
    if (!node || !timeScale || !data) return;
    
    const handleMouseMove = (ev: MouseEvent) => {
      if (!node || !timeScale || !data?.length || !visibleDataIndices) return;
      
      const rect = node.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      
      const chartLeft = margin?.left || 0;
      const chartRight = rect.width - (margin?.right || 0);
      const chartWidth = chartRight - chartLeft;
      
      // If outside chart area, clear hover
      if (x < chartLeft || x > chartRight) {
        setHoverData(null);
        return;
      }
      
      // Get the pixel position relative to the chart area
      const relativeX = x - chartLeft;
      
      // Use the timeScale to get the index directly
      // Since timeScale is created from visible data, invert will give us a date
      // But we need the index within the visible range
      const visibleDataLength = visibleDataIndices.end - visibleDataIndices.start + 1;
      const visibleIndex = Math.round((relativeX / chartWidth) * (visibleDataLength - 1));
      
      // Clamp to valid range
      const clampedVisibleIndex = Math.max(0, Math.min(visibleDataLength - 1, visibleIndex));
      
      // Convert to absolute index in the full dataset
      const absoluteIndex = visibleDataIndices.start + clampedVisibleIndex;
      
      if (absoluteIndex >= 0 && absoluteIndex < data.length) {
        const bj = bjCounts[absoluteIndex] ?? 'n/a';
        
        // NEW: Canvas signal detection
        let hoveredSignal = null;
        if (signals && signals.length > 0 && canvasTimeScale && canvasPriceScale) {
          try {
            const signal = getSignalAtPoint(
              signals,
              x, // Use absolute mouse X coordinate
              ev.clientY - rect.top, // Mouse Y relative to container
              canvasTimeScale,
              canvasPriceScale,
              12 // Larger hit radius for better UX
            );
            
            if (signal) {
              const validation = getSignalValidation(signal);
              hoveredSignal = {
                tradeActionSignal: signal,
                tooltip: getSignalTooltip(signal),
                validation: validation,
                isHovered: true
              };
              
              logDebugHover?.('useHoverMetrics', 'signal_detected', {
                action: signal.action,
                price: signal.price,
                validation: validation?.validationFlag
              });
            }
          } catch (error) {
            console.warn('[useHoverMetrics] Signal detection error:', error);
          }
        }
        
        setHoverData({
          idx: absoluteIndex,
          x: ev.clientX,
          y: ev.clientY,
          bj,
          visibleIndex: clampedVisibleIndex, 
          candle: data[absoluteIndex],
          signal: hoveredSignal || undefined
        });
      } else {
        setHoverData(null);
      }
    };
    
    const handleMouseLeave = () => {
      setHoverData(null);
    };
    
    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, bjCounts, timeScale, data, margin, escalatorDir, visibleDataIndices]);
  
  return { hoverData, HoverMetricsProvider: HoverMetricsContext.Provider };
}
