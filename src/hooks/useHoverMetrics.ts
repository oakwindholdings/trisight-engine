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
}

const HoverMetricsContext = createContext<HoverMetrics | null>(null);

export function useHoverMetricsContext() {
  return useContext(HoverMetricsContext);
}

export function useHoverMetrics(
  ref: React.RefObject<HTMLDivElement | null>, 
  candleWidth: number = 10,
  visibleStartIndex: number = 0
) {
  const { bjCounts, escalatorDir } = usePatternContext();
  const [hoverData, setHoverData] = useState<HoverMetrics | null>(null);
  
  console.log('[useHoverMetrics] Hook called with:', {
    candleWidth,
    visibleStartIndex,
    escalatorDirLength: escalatorDir?.length,
    bjCountsLength: bjCounts?.length,
    patternDataHash: escalatorDir && escalatorDir.length > 0 ? 
      `${escalatorDir.length}_${escalatorDir[0]}_${escalatorDir[escalatorDir.length - 1]}` : 
      'no_data'
  });
  
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    
    const handler = (ev: MouseEvent) => {
      const relativeIdx = Math.floor(ev.offsetX / candleWidth);
      const absoluteIdx = relativeIdx + visibleStartIndex;
      
      // Safety check: Don't access pattern arrays if they seem out of sync
      const isPatternDataValid = escalatorDir && escalatorDir.length > 0 && absoluteIdx < escalatorDir.length;
      
      console.log('[useHoverMetrics] Mouse event:', {
        offsetX: ev.offsetX,
        candleWidth,
        relativeIdx,
        visibleStartIndex,
        absoluteIdx,
        bjCountsLength: bjCounts?.length || 0,
        escalatorDirLength: escalatorDir?.length || 0,
        escalatorAtAbsIdx: isPatternDataValid ? escalatorDir[absoluteIdx] : 'OUT_OF_BOUNDS',
        escalatorAroundIdx: isPatternDataValid ? escalatorDir.slice(Math.max(0, absoluteIdx - 2), absoluteIdx + 3) : [],
        isPatternDataValid
      });
      
      console.log('[useHoverMetrics] Calculated index:', {
        relativeIdx,
        visibleStartIndex,
        absoluteIdx
      });
      
      const bj = bjCounts[absoluteIdx] ?? 'n/a';
      setHoverData({
        idx: absoluteIdx,  // Use absolute index
        x: ev.clientX,
        y: ev.clientY,
        bj
      });
      console.log('[Hover]', 'relative:', relativeIdx, 'absolute:', absoluteIdx, 'BJ', bj, 'offsetX', ev.offsetX, 'candleWidth', candleWidth, 'visibleStart:', visibleStartIndex);
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
  }, [ref, bjCounts, candleWidth, visibleStartIndex, escalatorDir]);
  
  return { hoverData, HoverMetricsProvider: HoverMetricsContext.Provider };
}
