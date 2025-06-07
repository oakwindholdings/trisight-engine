// src/components/Chart/MetricPopover.tsx
// Popover component that displays hover metrics at cursor position
// Shows all registered metrics for the hovered candle

import React from 'react';
import { useHoverMetricsContext } from '../../hooks/useHoverMetrics';
import { usePatternContext } from '../../contexts/PatternContext';
import { MetricRegistry } from '../../metrics/registry';

export function MetricPopover() {
  const pop = useHoverMetricsContext();
  const context = usePatternContext();
  
  if (!pop) return null;
  
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
      {Object.values(MetricRegistry).map(metric => (
        <div key={metric.id}>
          {metric.label}: <b>{metric.calc(pop.idx, context)}</b>
        </div>
      ))}
    </div>
  );
}
