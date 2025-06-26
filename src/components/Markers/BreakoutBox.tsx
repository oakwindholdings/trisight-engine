// src/components/Markers/BreakoutBox.tsx
// Renders BreakoutBox overlay for floor-ceiling breakout patterns
// Independent from StepBox - shows true breakout zones

import React, { useState } from 'react';
import { Candle } from '../../types/pattern';
import { usePatternContext } from '../../contexts/PatternContext';

interface BreakoutBoxProps {
  box: {
    stepRef: string;
    direction: 'RISING' | 'FALLING';
    floor: number;
    ceiling: number;
    height: number;
    startIndex: number;
    endIndex: number;
  };
  candles: Candle[];
  xScale: (timestamp: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
  isActive?: boolean;
  showLabel?: boolean;
}

export const BreakoutBox: React.FC<BreakoutBoxProps> = ({
  box,
  candles,
  xScale,
  yScale,
  width,
  height,
  isActive = true,
  showLabel = true
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { goldmineQual } = usePatternContext();

  if (!candles.length || box.startIndex >= candles.length || box.endIndex >= candles.length) {
    return null;
  }

  // Get the actual candles at start and end indices
  const startCandle = candles[box.startIndex];
  const endCandle = candles[box.endIndex];
  
  if (!startCandle || !endCandle) {
    return null;
  }

  // GOLDMINE suppression logic - hide breakout box if any candle in range is a Golden Candle
  if (goldmineQual?.length) {
    for (let i = box.startIndex; i <= box.endIndex; i++) {
      if (i < goldmineQual.length && goldmineQual[i]) {
        return null; // Skip drawing breakout box if it contains Golden Candles
      }
    }
  }

  // Calculate x positions
  const startX = xScale(startCandle.timestamp);
  const endX = xScale(endCandle.timestamp);
  
  // Calculate candle width
  const candleWidth = candles.length > 1 && box.startIndex < candles.length - 1
    ? Math.abs(xScale(candles[box.startIndex + 1].timestamp) - xScale(startCandle.timestamp)) * 0.8
    : 10;
  
  // Adjust box boundaries
  const adjustedStartX = startX - candleWidth / 2;
  const adjustedEndX = endX + candleWidth / 2;
  
  // Use floor and ceiling for Y boundaries
  const topY = yScale(box.ceiling);
  const bottomY = yScale(box.floor);
  
  // Don't render if out of view
  if (adjustedEndX < 0 || adjustedStartX > width) {
    return null;
  }

  // Determine if zoomed out
  const pixelsPerCandle = candleWidth;
  const isZoomedOut = pixelsPerCandle < 6;
  
  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
    setShowTooltip(true);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({ 
      x: e.clientX - rect.left, 
      y: e.clientY - rect.top 
    });
  };
  
  // Zoomed out view
  if (isZoomedOut) {
    const centerX = (startX + endX) / 2;
    return (
      <g>
        {/* Vertical line indicator */}
        <line
          x1={centerX}
          y1={topY}
          x2={centerX}
          y2={bottomY}
          stroke={box.direction === 'RISING' ? '#22C55E' : '#EF4444'}
          strokeWidth={3}
          strokeDasharray="4,2"
          opacity={0.8}
        />
        
        {/* Label */}
        <g transform={`translate(${centerX}, ${Math.max(15, topY - 15)})`}>
          <rect
            x={-35}
            y={-14}
            width={70}
            height={24}
            fill="white"
            stroke={box.direction === 'RISING' ? '#22C55E' : '#EF4444'}
            strokeWidth={1.5}
            rx={4}
            opacity={0.9}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={box.direction === 'RISING' ? '#16A34A' : '#DC2626'}
            fontSize="12"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            style={{ userSelect: 'none' }}
          >
            STEP {box.direction === 'RISING' ? 'UP' : 'DOWN'}
          </text>
        </g>
      </g>
    );
  }
  
  // Zoomed in view
  return (
    <g>
      <rect
        x={adjustedStartX}
        y={topY}
        width={adjustedEndX - adjustedStartX}
        height={bottomY - topY}
        fill={box.direction === 'RISING' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
        stroke={box.direction === 'RISING' ? '#22C55E' : '#EF4444'}
        strokeWidth={2}
        strokeDasharray="none"
        opacity={0.85}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      />
      
      {/* Label at top-left */}
      {showLabel && (
        <g>
          <rect
            x={adjustedStartX + 8}
            y={topY + 8}
            width={85}
            height={24}
            fill="white"
            opacity={0.9}
            rx={3}
          />
          <text
            x={adjustedStartX + 50}
            y={topY + 20}
            textAnchor="middle"
            dominantBaseline="central"
            fill={box.direction === 'RISING' ? '#16A34A' : '#DC2626'}
            fontSize="12"
            fontWeight="600"
            fontFamily="Inter, sans-serif"
            style={{ userSelect: 'none' }}
          >
            STEP {box.direction === 'RISING' ? 'UP' : 'DOWN'}
          </text>
        </g>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <g transform={`translate(${mousePos.x + 10}, ${mousePos.y - 10})`}>
          <rect
            x={0}
            y={0}
            width={150}
            height={75}
            fill="rgba(0, 0, 0, 0.9)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            rx={4}
          />
          <text x={10} y={20} fill="white" fontSize="12" fontFamily="monospace">
            BREAKOUT {box.direction}
          </text>
          <text x={10} y={35} fill="white" fontSize="11" fontFamily="monospace">
            {box.endIndex - box.startIndex + 1} candles
          </text>
          <text x={10} y={50} fill="white" fontSize="11" fontFamily="monospace">
            Floor: {box.floor.toFixed(2)}
          </text>
          <text x={10} y={65} fill="white" fontSize="11" fontFamily="monospace">
            Ceiling: {box.ceiling.toFixed(2)}
          </text>
        </g>
      )}
    </g>
  );
};
