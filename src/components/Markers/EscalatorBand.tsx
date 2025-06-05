// src/components/Markers/EscalatorBand.tsx
// Renders semi-transparent band for Escalator pattern
// Green for RISING, red for FALLING

import React from 'react';
import { EscalatorRun, Candle } from '../../types';
import { ThrustDirection } from '../../models/PatternTypes';

interface EscalatorBandProps {
  escalator: EscalatorRun;
  candles: Candle[];
  xScale: (index: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
}

export const EscalatorBand: React.FC<EscalatorBandProps> = ({
  escalator,
  candles,
  xScale,
  yScale,
  width,
  height
}) => {
  // Calculate band boundaries
  const startX = xScale(escalator.startIndex);
  const endX = xScale(escalator.endIndex);
  
  // Get min/max prices within the escalator range
  const escalatorCandles = candles.slice(escalator.startIndex, escalator.endIndex + 1);
  if (escalatorCandles.length === 0) return null;
  
  const minPrice = Math.min(...escalatorCandles.map(c => c.low));
  const maxPrice = Math.max(...escalatorCandles.map(c => c.high));
  
  const topY = yScale(maxPrice);
  const bottomY = yScale(minPrice);
  
  // Choose color based on direction
  const fillColor = escalator.direction === ThrustDirection.BULLISH 
    ? 'rgba(80, 200, 120, 0.12)'  // Green
    : 'rgba(200, 80, 80, 0.12)';  // Red
  
  // Don't render if out of view
  if (endX < 0 || startX > width) {
    return null;
  }
  
  return (
    <rect
      x={Math.max(0, startX)}
      y={Math.max(0, topY)}
      width={Math.min(width - startX, endX - startX)}
      height={Math.min(height - topY, bottomY - topY)}
      fill={fillColor}
      pointerEvents="none"
    />
  );
};
