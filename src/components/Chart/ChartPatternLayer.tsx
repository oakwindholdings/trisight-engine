// src/components/Chart/ChartPatternLayer.tsx
// Renders pattern overlays on top of the main chart canvas
// Handles StepBox, BreakoutBox, and EscalatorBand components

// NOTE: TriSight renders to Canvas, not SVG. ChartPatternLayer is the root pattern rendering layer.

import React, { useMemo } from 'react';
import { Candle } from '../../types';
import { usePatternContext } from '../../contexts/PatternContext';
import { EscalatorBand } from '../Markers/EscalatorBand';
import { GoldmineArrow } from '../Markers/GoldmineArrow';
import { TrailLine } from '../Markers/TrailLine';
import { StepBox } from '../Markers/StepBox';
import { BreakoutBox } from '../Markers/BreakoutBox';
import { EscalatorRun } from '../../types';
import { GoldmineSignal } from '../../patternEngine/goldmine';
import { StopLossEvent } from '../../riskEngine/trailingStop';

interface ChartPatternLayerProps {
  candles: Candle[];
  width?: number;
  height?: number;
  xScale?: (timestamp: number) => number;
  yScale?: (price: number) => number;
}

export const ChartPatternLayer: React.FC<ChartPatternLayerProps> = ({
  candles,
  width = 800,
  height = 400,
  xScale = (timestamp: number) => timestamp * 10,
  yScale = (price: number) => height - price
}) => {
  // Get pattern events from context
  const { events, escalatorSettings, breakoutBoxes } = usePatternContext();
  
  // Merge all event types into a single array for rendering
  const allEvents = useMemo(() => {
    return [...events, ...breakoutBoxes];
  }, [events, breakoutBoxes]);
  
  // Performance: Logging disabled during render
  
  // Track unique StepBoxes to avoid duplicates
  const stepBoxDeduplication = useMemo(() => {
    const uniqueSteps = new Map<string, any>();
    const duplicates: string[] = [];
    
    allEvents.forEach((event) => {
      if (event.type === 'ESCALATOR_STEP' && event.data) {
        const stepData = event.data as any;
        const { startIndex, endIndex } = stepData;
        const key = `${startIndex}-${endIndex}`;
        
        if (uniqueSteps.has(key)) {
          duplicates.push(key);
        } else {
          uniqueSteps.set(key, { event, stepData });
        }
      }
    });
    
    // Performance: Logging disabled during render
    
    return uniqueSteps;
  }, [allEvents]);
  
  // Process breakout boxes to deduplicate by stepRef
  const breakoutBoxDeduplication = useMemo(() => {
    const uniqueBoxes = new Map<string, { event: any; boxData: any }>();
    const duplicates: string[] = [];
    
    // Build map of unique boxes by key
    allEvents.forEach((event) => {
      if (event.type === 'BREAKOUT_BOX' && event.data) {
        const boxData = event.data as any;
        const { startIndex, endIndex } = boxData;
        const key = `${startIndex}-${endIndex}`;
        
        if (uniqueBoxes.has(key)) {
          duplicates.push(key);
        } else {
          uniqueBoxes.set(key, { event, boxData });
        }
      }
    });
    
    // Performance: Logging disabled during render
    
    return uniqueBoxes;
  }, [allEvents]);
  
  if (!candles.length || !allEvents.length) {
    return null;
  }

  // NOTE: Component mappings:
  // ESCALATOR → EscalatorBand
  // ESCALATOR_STEP → StepBox
  // BREAKOUT_BOX → BreakoutBox

  return (
    <>
      {allEvents.map((event, index) => {
        if (event.type === 'ESCALATOR') {
          const escalator = event.data as EscalatorRun;
          
          return (
            <EscalatorBand
              key={`escalator-${index}`}
              escalator={escalator}
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        } else if (event.type === 'ESCALATOR_STEP' && event.data) {
          const stepData = event.data as any;
          const { startIndex, endIndex } = stepData;
          const stepKey = `${startIndex}-${endIndex}`;
          
          // Skip if this is a duplicate
          if (!stepBoxDeduplication.has(stepKey) || stepBoxDeduplication.get(stepKey).event !== event) {
            return null;
          }
          
          // These indices should already be relative to visible data
          const visibleStartIndex = startIndex;
          const visibleEndIndex = endIndex;
          
          // Debug: Check if indices are valid
          if (visibleStartIndex >= 0 && visibleStartIndex < candles.length && 
              visibleEndIndex >= 0 && visibleEndIndex < candles.length) {
            const startX = xScale(candles[visibleStartIndex].timestamp);
            const endX = xScale(candles[visibleEndIndex].timestamp);
            
            // Performance: Logging disabled during render
            
            return (
              <StepBox
                key={`step-${stepKey}`}
                step={stepData}
                startIndex={visibleStartIndex}
                endIndex={visibleEndIndex}
                candles={candles}
                xScale={xScale}
                yScale={yScale}
                width={width}
                height={height}
              />
            );
          }
          
          return null;
        } else if (event.type === 'BREAKOUT_BOX' && event.data) {
          const boxData = event.data as any;
          const key = `${boxData.startIndex}-${boxData.endIndex}`;
          
          // Performance: Logging disabled during render
          
          // Skip if this is a duplicate
          if (!breakoutBoxDeduplication.has(key)) {
            // Performance: Logging disabled during render
            return null;
          }

          // Validate data before rendering
          if (!boxData.startIndex === undefined || !boxData.endIndex === undefined) {
            // Performance: Logging disabled during render
            return null;
          }

          // Performance: Logging disabled during render
          const x1 = xScale(boxData.startIndex);
          const x2 = xScale(boxData.endIndex);
          const y1 = yScale(boxData.ceiling);
          const y2 = yScale(boxData.floor);
          const width = x2 - x1;
          const height = y2 - y1;

          return (
            <BreakoutBox
              key={`breakout-${boxData.stepRef || index}`}
              box={boxData}
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
              key={`goldmine-${index}`}
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
              key={`stop-${index}`}
              position={position}
              candles={candles}
              xScale={xScale}
              yScale={yScale}
              width={width}
              height={height}
            />
          );
        }
        // Performance: Logging disabled during render
        return null;
      })}
    </>
  );
};
