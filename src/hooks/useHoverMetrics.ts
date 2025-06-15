// src/hooks/useHoverMetrics.ts
// Hook to track mouse hover position and display corresponding metrics
// Returns hover data including index, coordinates, and blackjack count

import { useEffect, useState, createContext, useContext } from 'react';
import { usePatternContext } from '../contexts/PatternContext';

interface HoverMetrics {
  idx: number;
  x: number;
  y: number;
  bj: number | string;
  candle?: any;
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
  visibleDataIndices?: { start: number; end: number }
) {
  const { bjCounts, escalatorDir } = usePatternContext();
  const [hoverData, setHoverData] = useState<HoverMetrics | null>(null);
  
  useEffect(() => {
    const node = ref.current;
    if (!node || !timeScale || !data) return;
    
    const handler = (ev: MouseEvent) => {
      const rect = node.getBoundingClientRect();
      const offsetX = ev.clientX - rect.left - (margin?.left || 0);
      
      // Check if mouse is within the plot area (excluding margins)
      const mouseX = ev.clientX - rect.left;
      const mouseY = ev.clientY - rect.top;
      const plotLeft = margin?.left || 0;
      const plotTop = margin?.top || 0;
      const plotRight = rect.width - (margin?.right || 0);
      const plotBottom = rect.height - (margin?.bottom || 0);
      
      if (mouseX < plotLeft || mouseX > plotRight || mouseY < plotTop || mouseY > plotBottom) {
        setHoverData(null);
        return;
      }
      
      if (!timeScale || !data || data.length === 0) {
        return;
      }
      
      // Use timeScale.invert to get the date at this pixel position
      const date = timeScale.invert(offsetX);
      
      // Find the closest candle to this date
      let closestIndex = 0;
      let minDiff = Infinity;
      
      // If we have visible indices, search within the visible slice
      const searchStart = visibleDataIndices?.start || 0;
      const searchEnd = visibleDataIndices?.end || data.length - 1;
      
      for (let i = searchStart; i <= searchEnd; i++) {
        const diff = Math.abs(data[i].timestamp - date.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      // Safety check: Don't access pattern arrays if they seem out of sync
      const isPatternDataValid = escalatorDir && escalatorDir.length > 0 && closestIndex < escalatorDir.length;
      
      const bj = bjCounts[closestIndex] ?? 'n/a';
      setHoverData({
        idx: closestIndex,
        x: ev.clientX,
        y: ev.clientY,
        bj,
        candle: data[closestIndex] // Include the actual candle data for accurate OHLC display
      });
    };
    
    const handleMouseLeave = () => {
      setHoverData(null);
    };
    
    node.addEventListener('mousemove', handler);
    node.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      node.removeEventListener('mousemove', handler);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [ref, bjCounts, timeScale, data, margin, escalatorDir, visibleDataIndices]);
  
  return { hoverData, HoverMetricsProvider: HoverMetricsContext.Provider };
}
