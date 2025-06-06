// src/hooks/useHoverMetrics.ts
// Hook to track mouse hover position and display corresponding metrics
// Returns hover data including index, coordinates, and blackjack count

import { useEffect, useState, createContext, useContext } from 'react';
import { usePatternContext } from '../context/PatternContext';

interface HoverMetrics {
  idx: number;
  x: number;
  y: number;
  bj: number | string;
}

const HoverMetricsContext = createContext<HoverMetrics | null>(null);

export function useHoverMetricsContext() {
  return useContext(HoverMetricsContext);
}

export function useHoverMetrics(ref: React.RefObject<HTMLDivElement | null>) {
  const { bjCounts } = usePatternContext();
  const [hoverData, setHoverData] = useState<HoverMetrics | null>(null);
  
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    
    const handler = (ev: MouseEvent) => {
      const idx = Math.floor(ev.offsetX / 10);   // temporary scale
      const bj = bjCounts[idx] ?? 'n/a';
      setHoverData({
        idx,
        x: ev.clientX,
        y: ev.clientY,
        bj
      });
      console.log('[Hover]', idx, 'BJ', bj);
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
  }, [ref, bjCounts]);
  
  return { hoverData, HoverMetricsProvider: HoverMetricsContext.Provider };
}
