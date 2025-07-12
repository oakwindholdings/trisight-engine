// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/components/Markers/StepBox.tsx
// Renders StepBox overlay for escalator step patterns
// Zoom-aware: shows labels when zoomed out, full boxes when zoomed in

import React, { useState } from 'react';
import { usePatternContext } from '../../contexts/PatternContext';
import { StepBox as StepBoxType, Candle } from '../../types/pattern';
import { patternStyles, PatternType } from '../../models/PatternTypes';

interface StepBoxProps {
  step: {
    stepRef: string;
    direction: 'RISING' | 'FALLING';
    floor: number;
    ceiling: number;
    height: number;
  };
  startIndex: number;
  endIndex: number;
  candles: Candle[];
  xScale: (timestamp: number) => number;
  yScale: (price: number) => number;
  width: number;
  height: number;
  isActive?: boolean;
  showLabel?: boolean;
}

// Direction arrow symbols matching unified labeling
const DIRECTION_ARROWS = {
  RISING: '↑',
  FALLING: '↓'
};

// Unified label font specification
const LABEL_FONT = 'bold 11px sans-serif';

export const StepBox: React.FC<StepBoxProps> = ({
  step,
  startIndex,
  endIndex,
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

  // Blackjack Target Score lookup for this step
  const { bjTargetScores } = usePatternContext();
  const tbsEntry = bjTargetScores.find(s => s.stepRef === step.stepRef);
  const tbsScore = tbsEntry ? tbsEntry.score : null;
  const qualifiesGoldmine = tbsEntry ? Boolean(tbsEntry.qualifiesForGoldmine) : false;

  console.log('[Blackjack SVG Overlay] StepBox TBS:', { stepRef: step.stepRef, score: tbsScore, qualifiesForGoldmine: qualifiesGoldmine });

  if (!candles.length || startIndex >= candles.length || endIndex >= candles.length) {
    return null;
  }

  // Get the actual candles at start and end indices
  const startCandle = candles[startIndex];
  const endCandle = candles[endIndex];
  
  if (!startCandle || !endCandle) {
    return null;
  }

  // Calculate x positions directly from xScale without any adjustments
  const startX = xScale(startCandle.timestamp);
  const endX = xScale(endCandle.timestamp);
  const centerX = (startX + endX) / 2;
  
  // Calculate candle width based on distance between candles
  const candleWidth = candles.length > 1 && startIndex < candles.length - 1
    ? Math.abs(xScale(candles[startIndex + 1].timestamp) - xScale(startCandle.timestamp)) * 0.8
    : 10; // Default width
  
  // Adjust box boundaries to include half candle width on each side
  const adjustedStartX = startX - candleWidth / 2;
  const adjustedEndX = endX + candleWidth / 2;
  
  // Dynamically compute floor and ceiling from actual candle wicks
  const relevantCandles = candles.slice(startIndex, endIndex + 1);
  const calculatedFloor = Math.min(...relevantCandles.map(c => c.low));
  const calculatedCeiling = Math.max(...relevantCandles.map(c => c.high));
  
  // Use calculated values for Y boundaries
  const topY = yScale(calculatedCeiling);
  const bottomY = yScale(calculatedFloor);
  const centerY = (topY + bottomY) / 2;
  
  // Choose color based on direction - use pattern styles for consistency
  const escalatorStyle = patternStyles[PatternType.ESCALATOR];
  const fillColor = step.direction === 'RISING' 
    ? 'rgba(142, 36, 170, 0.2)'   // Purple for RISING (using escalator color)
    : 'rgba(239, 68, 68, 0.2)';   // Red for FALLING
    
  const strokeColor = step.direction === 'RISING'
    ? escalatorStyle.color   // Use unified escalator color
    : '#EF4444';  // Red border

  // Border becomes gold when Goldmine qualifies
  const borderColor = qualifiesGoldmine ? '#FFD700' : strokeColor;

  // Color rules for BJ label
  const bjTextColor = tbsScore !== null && tbsScore >= 21 ? '#10b981' : '#374151';
  const goldmineStarColor = '#FFD700';
    
  const textColor = step.direction === 'RISING'
    ? '#2563EB'   // Darker blue for text
    : '#DC2626';  // Darker red for text
  
  // Don't render if out of view
  if (adjustedEndX < 0 || adjustedStartX > width) {
    return null;
  }
  
  // Determine if we should show simplified view (when zoomed out)
  const pixelsPerCandle = candleWidth;
  const isZoomedOut = pixelsPerCandle < 6;
  
  // Label dimensions and positioning
  const labelWidth = 90;
  const labelHeight = 40;
  const labelPadding = 8;  // Padding from edges
  const labelX = adjustedStartX + labelPadding;
  const labelY = topY + labelPadding;
  
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
  
  // Zoomed out view: show label and pointer
  if (isZoomedOut) {
    return (
      <g>
        {/* Vertical line indicator - increased stroke width */}
        <line
          x1={centerX}
          y1={topY}
          x2={centerX}
          y2={bottomY}
          stroke={strokeColor}
          strokeWidth={4}  // Increased from 3
          strokeDasharray="none"
          opacity={0.9}    // Increased from 0.8
        />
        
        {/* Label with background - positioned above the line */}
        <g transform={`translate(${centerX}, ${Math.max(15, topY - 15)})`}>
          <rect
            x={-30}
            y={-14}
            width={60}
            height={24}
            fill="white"
            stroke={strokeColor}
            strokeWidth={2}
            rx={4}
            opacity={0.95}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
            style={{ userSelect: 'none' }}
          >
            ESC {DIRECTION_ARROWS[step.direction]}
          </text>
        </g>
      </g>
    );
  }
  
  // Zoomed in view: show full box with label in top-left
  return (
    <g>
      <rect
        x={adjustedStartX}
        y={topY}
        width={adjustedEndX - adjustedStartX}
        height={bottomY - topY}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={2.5}  // Increased from 2
        strokeDasharray={isActive ? 'none' : '4,2'}
        opacity={0.9}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
      />
      
      {/* Single label positioned at top-left with padding */}
      {showLabel && (
        <g>
          {/* White background for text readability */}
          <rect
            x={labelX}
            y={labelY}
            width={labelWidth}
            height={labelHeight}
            fill="white"
            opacity={0.9}
            rx={3}
          />
          <text
            x={labelX + labelWidth / 2}
            y={labelY + 14}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize="11"
            fontWeight="bold"
            fontFamily="sans-serif"
            style={{ userSelect: 'none' }}
          >
            ESC {DIRECTION_ARROWS[step.direction]}
          </text>
          {tbsScore !== null && (
            <text
              x={labelX + labelWidth / 2}
              y={labelY + labelHeight - 12}
              textAnchor="middle"
              dominantBaseline="central"
              fill={bjTextColor}
              fontSize="12"
              fontWeight="600"
              fontFamily="Inter, sans-serif"
              style={{ userSelect: 'none' }}
            >
              BJ: {tbsScore >= 0 ? `+${tbsScore}` : tbsScore}
            </text>
          )}
          {qualifiesGoldmine && (
            <text
              x={labelX + labelWidth - 12}
              y={labelY + 12}
              textAnchor="end"
              dominantBaseline="central"
              fill={goldmineStarColor}
              fontSize="14"
              fontWeight="900"
              fontFamily="Inter, sans-serif"
              style={{ userSelect: 'none' }}
            >
              ★
            </text>
          )}
        </g>
      )}
      
      {showTooltip && (
        <g transform={`translate(${mousePos.x + 10}, ${mousePos.y - 10})`}>
          <rect
            x={0}
            y={0}
            width={140}
            height={60}
            fill="rgba(0, 0, 0, 0.9)"
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth={1}
            rx={4}
          />
          <text x={10} y={20} fill="white" fontSize="12" fontFamily="monospace">
            {step.direction} STEP
          </text>
          <text x={10} y={35} fill="white" fontSize="11" fontFamily="monospace">
            {endIndex - startIndex + 1} candles
          </text>
          <text x={10} y={50} fill="white" fontSize="11" fontFamily="monospace">
            {step.floor.toFixed(2)} - {step.ceiling.toFixed(2)}
          </text>
        </g>
      )}
    </g>
  );
};
