// src/components/Chart/MetricPopover.tsx
// Popover component that displays hover metrics at cursor position
// Shows all registered metrics for the hovered candle

import React from 'react';
import { useHoverMetricsContext } from '../../hooks/useHoverMetrics';
import { usePatternContext } from '../../contexts/PatternContext';
import { MetricRegistry } from '../../metrics/registry';
import { useUIState } from '../../contexts/UIStateContext';
import { useMarketDataContext } from '../../contexts/MarketDataContext';

export function MetricPopover() {
  const patternContext = usePatternContext();
  const { data: candles } = useMarketDataContext();
  const pop = useHoverMetricsContext();
  const { isDatePickerOpen } = useUIState();
  
  // Hide popover when date picker is open or no hover data
  if (!pop || isDatePickerOpen) return null;
  
  // Debug: Log what data we're using for metrics
  console.log('[MetricPopover] Debug:', {
    hoverIndex: pop.idx,
    hoverCandle: pop.candle ? {
      datetime: pop.candle.datetime,
      open: pop.candle.open,
      high: pop.candle.high,
      low: pop.candle.low,
      close: pop.candle.close
    } : null,
    contextCandle: candles?.[pop.idx] ? {
      datetime: candles[pop.idx].datetime,
      open: candles[pop.idx].open,
      high: candles[pop.idx].high,
      low: candles[pop.idx].low,
      close: candles[pop.idx].close
    } : null,
    candlesLength: candles?.length,
    patternArrays: {
      bjIntrinsic: patternContext.bjIntrinsic ? `Array(${patternContext.bjIntrinsic.length})` : 'undefined',
      bjCumulative: patternContext.bjCumulative ? `Array(${patternContext.bjCumulative.length})` : 'undefined',
      stepIndex: patternContext.stepIndex ? `Array(${patternContext.stepIndex.length})` : 'undefined',
      escalatorDir: patternContext.escalatorDir ? `Array(${patternContext.escalatorDir.length})` : 'undefined',
      escalatorLength: patternContext.escalatorLength ? `Array(${patternContext.escalatorLength.length})` : 'undefined',
      goldmineQual: patternContext.goldmineQual ? `Array(${patternContext.goldmineQual.length})` : 'undefined',
      trailStop: patternContext.trailStop ? `Array(${patternContext.trailStop.length})` : 'undefined',
      distToStopPct: patternContext.distToStopPct ? `Array(${patternContext.distToStopPct.length})` : 'undefined'
    },
    sampleValues: {
      bjIntrinsic: patternContext.bjIntrinsic?.[pop.idx],
      bjCumulative: patternContext.bjCumulative?.[pop.idx],
      stepIndex: patternContext.stepIndex?.[pop.idx],
      escalatorDir: patternContext.escalatorDir?.[pop.idx],
      escalatorLength: patternContext.escalatorLength?.[pop.idx]
    }
  });
  
  // Create combined context for metric calculations
  // Use the full candles array for pattern metrics to work
  const combinedContext = {
    ...patternContext,
    candles: candles || []
  };
  
  // The hover index (pop.idx) is absolute
  // Use the index directly but ensure it's within bounds of the candles array
  const candleIndex = pop.idx;
  
  const metrics = Object.values(MetricRegistry).map(metric => {
    // For OHLC metrics, use the candle from hover context if available
    if (['open', 'high', 'low', 'close', 'volume'].includes(metric.id) && pop.candle) {
      const value = metric.calc(candleIndex, { 
        ...combinedContext,
        candles: { [candleIndex]: pop.candle } 
      });
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
            <span className={stepData.direction === 'RISING' ? 'text-blue-400' : 'text-red-400'}>
              {stepData.direction}
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
        </>
      )}
    </div>
  );
}
