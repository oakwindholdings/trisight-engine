// src/components/Markers/GoldmineArrow.tsx
// Renders entry arrow for Goldmine signal
// ▲ for LONG, ▼ for SHORT

import React from 'react';
import { GoldmineSignal } from '../../patternEngine/goldmine';

interface GoldmineArrowProps {
  signal: GoldmineSignal;
  xScale: (index: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
}

export const GoldmineArrow: React.FC<GoldmineArrowProps> = ({
  signal,
  xScale,
  yScale,
  width,
  height
}) => {
  const x = xScale(signal.entryIndex);
  const y = yScale(signal.entryPrice);
  
  // Don't render if out of view
  if (x < 0 || x > width || y < 0 || y > height) {
    return null;
  }
  
  const arrowSize = 12;
  const arrowColor = '#FFD700'; // Gold
  
  if (signal.side === 'LONG') {
    // Upward arrow (triangle pointing up)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <polygon
          points={`0,-${arrowSize} -${arrowSize/2},0 ${arrowSize/2},0`}
          fill={arrowColor}
          stroke={arrowColor}
          strokeWidth="1"
        />
        <text
          x="0"
          y={arrowSize + 10}
          textAnchor="middle"
          fill={arrowColor}
          fontSize="10"
          fontWeight="bold"
        >
          BUY
        </text>
      </g>
    );
  } else {
    // Downward arrow (triangle pointing down)
    return (
      <g transform={`translate(${x}, ${y})`}>
        <polygon
          points={`0,${arrowSize} -${arrowSize/2},0 ${arrowSize/2},0`}
          fill={arrowColor}
          stroke={arrowColor}
          strokeWidth="1"
        />
        <text
          x="0"
          y={-arrowSize - 5}
          textAnchor="middle"
          fill={arrowColor}
          fontSize="10"
          fontWeight="bold"
        >
          SELL
        </text>
      </g>
    );
  }
};
