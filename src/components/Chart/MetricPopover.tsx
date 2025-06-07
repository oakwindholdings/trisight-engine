// src/components/Chart/MetricPopover.tsx
// Popover component that displays hover metrics at cursor position
// Shows all registered metrics for the hovered candle

import React from 'react';
import { useHoverMetricsContext } from '../../hooks/useHoverMetrics';
import { usePatternContext } from '../../contexts/PatternContext';
import { MetricRegistry } from '../../metrics/registry';

export function MetricPopover() {
  const context = usePatternContext();
  const pop = useHoverMetricsContext();
  
  if (!pop) return null;
  
  // Debug log to help trace the escalator direction issue
  // const escDir = context.escalatorDir?.[pop.idx];
  // if (escDir !== undefined) {
  //   console.log('[MetricPopover] idx:', pop.idx, 'escalatorDir:', escDir, 'all dirs:', context.escalatorDir);
  // }
  
  // Additional debug: log the first time we render to see what's in the context
  // console.log('[MetricPopover] Rendering with context:', {
  //   idx: pop.idx,
  //   escalatorDirLength: context.escalatorDir?.length,
  //   escalatorDirSample: context.escalatorDir?.slice(0, 10),
  //   escalatorDirAtIdx: context.escalatorDir?.[pop.idx]
  // });
  
  const metrics = Object.values(MetricRegistry).map(metric => ({
    label: metric.label,
    value: metric.calc(pop.idx, context)
  }));

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
        zIndex: 50,
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
      
      {/* Escalator Direction */}
      <div className="flex items-center text-xs">
        <div className="mr-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 13L13 3M13 3H7M13 3V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-gray-500 mr-2">Escalator:</span>
        {(() => {
          const { escalatorDir } = context;
          const absoluteIndex = pop.idx; // idx is already absolute per useHoverMetrics
          
          // Extract candle values from metrics for debugging
          const openMetric = metrics.find(m => m.label === 'Open');
          const closeMetric = metrics.find(m => m.label === 'Close');
          const open = parseFloat(openMetric?.value?.toString() || '0');
          const close = parseFloat(closeMetric?.value?.toString() || '0');
          
          // Add detailed debugging
          console.log('[MetricPopover] Escalator direction debug:', {
            absoluteIndex,
            open,
            close,
            isBullish: close > open,
            escalatorDirection: escalatorDir?.[absoluteIndex],
            nearbyDirections: escalatorDir?.slice(
              Math.max(0, absoluteIndex - 2), 
              Math.min(escalatorDir?.length || 0, absoluteIndex + 3)
            ),
            escalatorDirLength: escalatorDir?.length
          });
          
          // Check if we have valid escalator data for this index
          if (!escalatorDir || absoluteIndex < 0 || absoluteIndex >= escalatorDir.length) {
            return <span className="text-amber-500">Loading...</span>;
          }
          
          const direction = escalatorDir?.[absoluteIndex];
          
          if (direction === null || direction === undefined) {
            return <span className="text-gray-400">No Pattern</span>;
          }
          
          const directionDisplay = direction === 'RISING' ? 'RISING' : 
                                 direction === 'FALLING' ? 'FALLING' : 
                                 'No Pattern';
          const directionClass = direction === 'RISING' ? 'text-green-500' : 
                               direction === 'FALLING' ? 'text-red-500' : 
                               'text-gray-400';
          
          return <span className={directionClass}>{directionDisplay}</span>;
        })()}
      </div>
    </div>
  );
}
