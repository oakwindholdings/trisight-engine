// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/components/Chart/MetricPopover.tsx
// Popover component that displays hover metrics at cursor position
// Shows all registered metrics for the hovered candle

import React from 'react';
import { useHoverMetricsContext } from '../../hooks/useHoverMetrics';
import { usePatternContext } from '../../contexts/PatternContext';
import { MetricRegistry } from '../../metrics/registry';
import { useUIState } from '../../contexts/UIStateContext';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { patternStyles, PatternType } from '../../models/PatternTypes';

export function MetricPopover() {
  const patternContext = usePatternContext();
  const { data: candles } = useMarketDataContext();
  const pop = useHoverMetricsContext();
  const { isDatePickerOpen } = useUIState();
  
  // Hide popover when date picker is open or no hover data
  if (!pop || isDatePickerOpen) return null;
  
  // Create combined context for metric calculations
  // Use the full candles array for pattern metrics to work
  const combinedContext = {
    ...patternContext,
    candles: candles || []
  };
  
  // The hover index (pop.idx) is absolute
  // Use the index directly but ensure it's within bounds of the candles array
  const candleIndex = pop.idx;
  
  // CRITICAL FIX: Pattern arrays are built from visible candles only
  // Use visibleIndex for accessing pattern arrays, not the absolute index
  const patternArrayIndex = pop.visibleIndex;
  
  const metrics = Object.values(MetricRegistry).map(metric => {
    // For OHLC metrics, use the candle from hover context if available
    if (['open', 'high', 'low', 'close', 'volume'].includes(metric.id) && pop.candle) {
      const value = metric.calc(candleIndex, { 
        ...combinedContext,
        candles: { [candleIndex]: pop.candle } 
      });
      return { label: metric.label, value };
    }
    
    // For pattern metrics (BJ, Escalator, etc), use visibleIndex to access arrays
    if (['bjIntrinsic', 'bjCumulative', 'stepNumber', 'escalatorDir', 'escalatorLength', 'goldmineQual', 'trailStop', 'distToStopPct'].includes(metric.id)) {
      const value = metric.calc(patternArrayIndex, combinedContext);
      return { label: metric.label, value };
    }
    
    // For other metrics, use the combined context with full candles array
    const value = metric.calc(candleIndex, combinedContext);
    
    return {
      label: metric.label,
      value
    };
  });

  // Check if we're hovering over an escalator step
  const hoveredStep = patternContext.escalatorSteps?.find(event => {
    if (event.type === 'ESCALATOR_STEP' && event.data) {
      const stepData = event.data as { stepRef: string; direction: string; floor: number; ceiling: number; height: number };
      const [startStr, endStr] = stepData.stepRef.split('-');
      const startIndex = parseInt(startStr);
      const endIndex = parseInt(endStr);
      return pop.idx >= startIndex && pop.idx <= endIndex;
    }
    return false;
  });

  const stepData = hoveredStep?.data as { stepRef: string; direction: string; floor: number; ceiling: number; height: number } | undefined;

  // Lookup Target Blackjack Score for this step
  const targetBjEntry = stepData ? (patternContext.bjTargetScores || []).find(e => e.stepRef === stepData.stepRef) : undefined;

  // Check if we're hovering over a breakout box
  const hoveredBreakoutBox = patternContext.breakoutBoxes?.find(event => {
    if (event.type === 'BREAKOUT_BOX' && event.data) {
      const boxData = event.data as { startIndex: number; endIndex: number; blackjackScore?: number; qualifiesForGoldmine?: boolean };
      return pop.idx >= boxData.startIndex && pop.idx <= boxData.endIndex;
    }
    return false;
  });

  const breakoutBoxData = hoveredBreakoutBox?.data as { 
    stepRef: string; 
    direction: string; 
    floor: number; 
    ceiling: number; 
    blackjackScore?: number; 
    qualifiesForGoldmine?: boolean;
    boxType?: string;
  } | undefined;

  return (
    <div
      style={{ 
        position: 'fixed',
        left: pop.x + 10, 
        top: pop.y + 10,
        pointerEvents: 'none',
        backgroundColor: 'rgba(30, 41, 59, 0.85)', // slate-900 with 85% opacity
        color: 'white',
        fontSize: '12px',
        borderRadius: '6px',
        padding: '4px 8px',
        zIndex: 10,  // Reduced from 50 to avoid interfering with datepicker
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* Metrics */}
      {metrics.map((metric, i) => (
        <div key={i} className="flex justify-between items-center text-xs">
          <span className="text-gray-500">{metric.label}:</span>
          <b className={`${
            typeof metric.value === 'number' && metric.value < 0 ? 'text-red-500' : 'text-green-500'
          }`}>{(() => {
            if (typeof metric.value === 'number') {
              const val = Math.round(metric.value * 100) / 100;
              return metric.value < 0 ? val : '+' + val;
            }
            return metric.value;
          })()}</b>
        </div>
      ))}
      
      {/* Escalator Step Details */}
      {stepData && (
        <>
          <div className="border-t border-gray-600 mt-2 pt-2 mb-1"></div>
          <div className="flex items-center text-xs mb-1">
            <span className="text-gray-500 mr-2">Escalator Step:</span>
            <span 
              className="font-medium"
              style={{ color: stepData.direction === 'RISING' ? patternStyles[PatternType.ESCALATOR].color : '#EF4444' }}
            >
              ESC {stepData.direction === 'RISING' ? '↑' : '↓'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Step Reference:</span>
            <span className="text-gray-300">{stepData.stepRef}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Duration:</span>
            <span className="text-gray-300">
              {(() => {
                const [startStr, endStr] = stepData.stepRef.split('-');
                const duration = parseInt(endStr) - parseInt(startStr) + 1;
                return `${duration} candles`;
              })()}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Floor:</span>
            <span className="text-gray-300">{stepData.floor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Ceiling:</span>
            <span className="text-gray-300">{stepData.ceiling.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Height:</span>
            <span className="text-gray-300">{stepData.height.toFixed(2)}</span>
          </div>
          {targetBjEntry && (
            <>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Blackjack Score:</span>
                <span className={targetBjEntry.score >= 21 ? 'text-emerald-400' : (targetBjEntry.score < 0 ? 'text-red-400' : 'text-slate-300')}>
                  {targetBjEntry.score >= 0 ? '+' : ''}{targetBjEntry.score}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Goldmine:</span>
                <span className={targetBjEntry.qualifiesForGoldmine ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
                  {targetBjEntry.qualifiesForGoldmine ? 'YES ' : 'NO'}
                </span>
              </div>
            </>
          )}
        </>
      )}
      
      {/* BreakoutBox Details */}
      {breakoutBoxData && (
        <>
          <div className="border-t border-gray-600 mt-2 pt-2 mb-1"></div>
          <div className="flex items-center text-xs mb-1">
            <span className="text-gray-500 mr-2">BreakoutBox:</span>
            <span 
              className="font-medium"
              style={{ color: patternStyles[PatternType.BREAKOUTBOX].color }}
            >
              BREAKOUT {breakoutBoxData.direction === 'RISING' ? '↑' : '↓'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Step Reference:</span>
            <span className="text-gray-300">{breakoutBoxData.stepRef}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Floor:</span>
            <span className="text-gray-300">{breakoutBoxData.floor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Ceiling:</span>
            <span className="text-gray-300">{breakoutBoxData.ceiling.toFixed(2)}</span>
          </div>
          {breakoutBoxData.blackjackScore !== undefined && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500">Blackjack Score:</span>
              <span className={breakoutBoxData.blackjackScore < 0 ? 'text-red-400' : 'text-green-400'}>
                {breakoutBoxData.blackjackScore}
              </span>
            </div>
          )}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500">Goldmine:</span>
            <span className={breakoutBoxData.qualifiesForGoldmine ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
              {breakoutBoxData.qualifiesForGoldmine ? 'YES 🔶' : 'NO'}
            </span>
          </div>
        </>
      )}
      
      <div className="text-xs text-slate-300">Idx {pop.idx}</div>
      <div className="text-xs text-slate-300">BJ Cnt : {pop.bj ?? 0}</div>
      {/* NOTE: Displays Blackjack scores from PatternEvent data */}
      {/* TODO: Add pattern-specific scores when hovering over pattern zones */}
    </div>
  );
}
