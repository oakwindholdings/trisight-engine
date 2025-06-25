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
  
  // DIAGNOSTIC: Log context data
  console.log('[DIAGNOSTIC] ChartPatternLayer context:', {
    breakoutBoxesLength: breakoutBoxes.length,
    eventsLength: events.length,
    totalEvents: allEvents.length,
    breakoutBoxEvents: breakoutBoxes.slice(0, 3).map(e => ({
      type: e.type,
      stepRef: e.data?.stepRef,
      indices: e.data ? `${e.data.startIndex}-${e.data.endIndex}` : 'no data'
    }))
  });
  
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
    
    // Log deduplication results
    console.log('[ChartPatternLayer] StepBox deduplication:', {
      unique: uniqueSteps.size,
      duplicatesSkipped: duplicates.length,
      duplicateKeys: duplicates
    });
    
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
    
    // Log deduplication results
    console.log('[ChartPatternLayer] BreakoutBox deduplication:', {
      unique: uniqueBoxes.size,
      duplicatesSkipped: duplicates.length,
      duplicateKeys: duplicates,
      uniqueKeys: Array.from(uniqueBoxes.keys()).slice(0, 5),
      eventsFiltered: allEvents.filter(e => e.type === 'BREAKOUT_BOX').length
    });
    
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
          
          // DIAGNOSTIC: Log escalator render
          console.log('[DIAGNOSTIC] Rendering ESCALATOR:', {
            index,
            startIndex: escalator.startIndex,
            endIndex: escalator.endIndex
          });
          
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
          
          // DIAGNOSTIC: Log step render
          console.log('[DIAGNOSTIC] Rendering ESCALATOR_STEP:', {
            index,
            stepRef: stepData.stepRef,
            startIndex: stepData.startIndex,
            endIndex: stepData.endIndex
          });
          
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
            
            // Only log first step to avoid spam
            if (index === 0) {
              console.log('[ChartPatternLayer] StepBox calculation:', {
                indices: { startIndex, endIndex },
                timestamps: {
                  start: new Date(candles[visibleStartIndex].timestamp).toISOString(),
                  end: new Date(candles[visibleEndIndex].timestamp).toISOString()
                },
                coordinates: { startX, endX, width: endX - startX }
              });
            }
            
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
          
          // DIAGNOSTIC: Log breakout box render attempt
          console.log('[DIAGNOSTIC] Attempting to render BREAKOUT_BOX:', {
            index,
            stepRef: boxData.stepRef,
            key,
            isDeduplicated: breakoutBoxDeduplication.has(key),
            boxData: {
              startIndex: boxData.startIndex,
              endIndex: boxData.endIndex,
              floor: boxData.floor,
              ceiling: boxData.ceiling,
              height: boxData.height
            }
          });
          
          // Skip if this is a duplicate
          if (!breakoutBoxDeduplication.has(key)) {
            console.log('[DIAGNOSTIC] Skipping duplicate BREAKOUT_BOX:', key);
            return null;
          }

          // Validate data before rendering
          if (!boxData.startIndex === undefined || !boxData.endIndex === undefined) {
            console.error('[ChartPatternLayer] Invalid BreakoutBox data:', boxData);
            return null;
          }

          // DIAGNOSTIC: Log geometry calculations
          const x1 = xScale(boxData.startIndex);
          const x2 = xScale(boxData.endIndex);
          const y1 = yScale(boxData.ceiling);
          const y2 = yScale(boxData.floor);
          const width = x2 - x1;
          const height = y2 - y1;
          
          console.log('[DIAGNOSTIC] BREAKOUT_BOX geometry:', {
            stepRef: boxData.stepRef,
            x1, x2, y1, y2,
            width, height,
            isValid: {
              x1: !isNaN(x1) && isFinite(x1),
              x2: !isNaN(x2) && isFinite(x2),
              y1: !isNaN(y1) && isFinite(y1),
              y2: !isNaN(y2) && isFinite(y2),
              width: width > 0,
              height: height > 0
            }
          });

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
        // DIAGNOSTIC: Log unhandled event type
        console.log('[DIAGNOSTIC] Unhandled event type in render:', event.type);
        return null;
      })}
    </>
  );
};
