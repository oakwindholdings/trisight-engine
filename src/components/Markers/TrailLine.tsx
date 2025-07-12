// src/components/Markers/TrailLine.tsx
// Renders dashed trailing stop line
// Updates dynamically based on position and candles

import React, { useMemo } from 'react';
import { Candle } from '../../types';
import { Position } from '../../hooks/usePatternBus';

interface TrailLineProps {
  position: Position;
  candles: Candle[];
  xScale: (index: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
}

export const TrailLine: React.FC<TrailLineProps> = ({
  position,
  candles,
  xScale,
  yScale,
  width,
  height
}) => {
  const trailPath = useMemo(() => {
    const { side, openIndex } = position;
    
    if (candles.length < openIndex + 3) {
      return null;
    }
    
    const points: { x: number; y: number }[] = [];
    let previousTrail: number | null = null;
    
    // Calculate trail levels from position open
    for (let i = openIndex + 2; i < candles.length; i++) {
      const trailCandle = candles[i - 2];
      
      let trailLevel: number;
      if (side === 'LONG') {
        trailLevel = previousTrail !== null 
          ? Math.max(trailCandle.low, previousTrail)
          : trailCandle.low;
      } else {
        trailLevel = previousTrail !== null
          ? Math.min(trailCandle.high, previousTrail)
          : trailCandle.high;
      }
      
      const x = xScale(i);
      const y = yScale(trailLevel);
      
      // Add point if in view
      if (x >= -50 && x <= width + 50) {
        points.push({ x, y });
      }
      
      previousTrail = trailLevel;
    }
    
    if (points.length < 2) return null;
    
    // Create SVG path
    return points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x},${point.y}` : ` L ${point.x},${point.y}`);
    }, '');
  }, [position, candles, xScale, yScale, width]);
  
  if (!trailPath) return null;
  
  return (
    <path
      d={trailPath}
      fill="none"
      stroke="rgba(255, 0, 0, 0.6)"
      strokeWidth="2"
      strokeDasharray="5,5"
      pointerEvents="none"
    />
  );
};
