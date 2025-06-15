// src/components/Markers/StepBox.tsx
// Renders translucent box for Escalator Step patterns
// Shows floor/ceiling boundaries with hover tooltips

import React, { useState } from 'react';
import { Candle } from '../../types';

interface StepBoxData {
  stepRef: string;
  direction: 'RISING' | 'FALLING';
  floor: number;
  ceiling: number;
  height: number;
}

interface StepBoxProps {
  step: StepBoxData;
  startIndex: number;
  endIndex: number;
  candles: Candle[];
  xScale: (index: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
}

export const StepBox: React.FC<StepBoxProps> = ({
  step,
  startIndex,
  endIndex,
  candles,
  xScale,
  yScale,
  width,
  height
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Calculate box boundaries
  const startX = xScale(startIndex);
  const endX = xScale(endIndex);
  
  // Use floor and ceiling for Y boundaries
  const topY = yScale(step.ceiling);
  const bottomY = yScale(step.floor);
  
  // Choose color based on direction
  const fillColor = step.direction === 'RISING' 
    ? 'rgba(59, 130, 246, 0.15)'  // Blue for RISING
    : 'rgba(239, 68, 68, 0.15)';   // Red for FALLING
    
  const strokeColor = step.direction === 'RISING'
    ? 'rgba(59, 130, 246, 0.6)'   // Blue border
    : 'rgba(239, 68, 68, 0.6)';    // Red border
  
  // Don't render if out of view
  if (endX < 0 || startX > width) {
    return null;
  }
  
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
  
  return (
    <g>
      <rect
        x={Math.max(0, startX)}
        y={Math.max(0, topY)}
        width={Math.min(width - startX, endX - startX)}
        height={Math.min(height - topY, bottomY - topY)}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={1}
        strokeDasharray="2,2"
        pointerEvents="all"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      />
      
      {showTooltip && (
        <g transform={`translate(${mousePos.x + 10}, ${mousePos.y - 10})`}>
          <rect
            x={0}
            y={-60}
            width={140}
            height={80}
            fill="rgba(0, 0, 0, 0.8)"
            rx={4}
            ry={4}
          />
          <text x={10} y={-40} fill="white" fontSize="12" fontWeight="bold">
            Escalator Step
          </text>
          <text x={10} y={-25} fill="white" fontSize="11">
            Direction: {step.direction}
          </text>
          <text x={10} y={-10} fill="white" fontSize="11">
            Height: {step.height.toFixed(2)}
          </text>
          <text x={10} y={5} fill="white" fontSize="11">
            Floor: {step.floor.toFixed(2)}
          </text>
          <text x={10} y={20} fill="white" fontSize="11">
            Ceiling: {step.ceiling.toFixed(2)}
          </text>
        </g>
      )}
    </g>
  );
};
