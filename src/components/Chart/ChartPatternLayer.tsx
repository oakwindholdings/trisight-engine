// src/components/Chart/ChartPatternLayer.tsx
// Chart-agnostic pattern layer that renders pattern markers
// Uses pattern context to receive and visualize pattern events

import React from 'react';
import { Candle } from '../../types';
import { usePatternContext } from '../../contexts/PatternContext';
import { EscalatorBand } from '../Markers/EscalatorBand';
import { GoldmineArrow } from '../Markers/GoldmineArrow';
import { TrailLine } from '../Markers/TrailLine';
import { StepBox } from '../Markers/StepBox';
import { EscalatorRun } from '../../types';
import { GoldmineSignal } from '../../patternEngine/goldmine';
import { StopLossEvent } from '../../riskEngine/trailingStop';

interface ChartPatternLayerProps {
  candles: Candle[];
  width?: number;
  height?: number;
  xScale?: (index: number) => number;
  yScale?: (price: number) => number;
}

export const ChartPatternLayer: React.FC<ChartPatternLayerProps> = ({
  candles,
  width = 800,
  height = 400,
  xScale = (index: number) => index * 10,
  yScale = (price: number) => height - price
}) => {
  // Debug logging
  console.log('[ChartPatternLayer] Rendering with candles:', {
    candleCount: candles?.length || 0,
    firstCandle: candles?.[0]?.datetime,
    lastCandle: candles?.[candles.length - 1]?.datetime
  });

  // Get pattern events from context
  const { events } = usePatternContext();

  if (!candles.length || !events.length) {
    return null;
  }

  return (
    <svg
      width={width}
      height={height}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      {events.map((event, idx) => {
        if (event.type === 'ESCALATOR') {
          const escalator = event.data as EscalatorRun;
          return (
            <EscalatorBand
              key={`escalator-${idx}`}
              escalator={escalator}
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        } else if (event.type === 'ESCALATOR_STEP') {
          const stepData = event.data as {
            stepRef: string;
            direction: 'RISING' | 'FALLING';
            floor: number;
            ceiling: number;
            height: number;
          };
          
          // Parse stepRef to get start and end indices
          const [startIndex, endIndex] = stepData.stepRef.split('-').map(Number);
          
          return (
            <StepBox
              key={`step-${stepData.stepRef}`}
              step={stepData}
              startIndex={startIndex}
              endIndex={endIndex}
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        } else if (event.type === 'GOLDMINE') {
          const signal = event.data as GoldmineSignal;
          return (
            <GoldmineArrow
              key={`goldmine-${idx}`}
              signal={signal}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        } else if (event.type === 'STOP_EVENT') {
          const stop = event.data as StopLossEvent;
          // For TrailLine, we need to create a position object
          // This is a simplified approach - in production, you'd track active positions
          const position = {
            side: 'LONG' as const,
            openIndex: Math.max(0, stop.index - 10),
            step: {}
          };
          return (
            <TrailLine
              key={`stop-${idx}`}
              position={position}
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        }
        return null;
      })}
    </svg>
  );
};
