// src/components/Chart/DevHUD.tsx
// Developer HUD overlay for chart performance telemetry
// Displays FPS, render times, and dropped frame statistics

import React, { useEffect, useState } from 'react';
import { getChartPerformanceMetrics } from './RenderOrchestrator';

interface DevHUDProps {
  visible: boolean;
}

const DevHUD: React.FC<DevHUDProps> = ({ visible }) => {
  const [metrics, setMetrics] = useState({
    fps: '0',
    avgRenderTime: '0',
    droppedFrames: 0,
    droppedFramePercentage: '0'
  });

  useEffect(() => {
    if (!visible) return;

    // Update metrics every 250ms
    const interval = setInterval(() => {
      const performanceMetrics = getChartPerformanceMetrics();
      setMetrics(performanceMetrics);
    }, 250);

    return () => clearInterval(interval);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="absolute top-2 left-2 bg-slate-900/90 text-white text-xs font-mono p-3 rounded-md shadow-lg z-50 min-w-[200px]">
      <div className="text-emerald-400 font-semibold mb-2">Chart Performance</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">FPS:</span>
          <span className={parseFloat(metrics.fps) < 30 ? 'text-red-400' : 'text-green-400'}>
            {metrics.fps}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Render:</span>
          <span className={parseFloat(metrics.avgRenderTime) > 16.67 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.avgRenderTime}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dropped:</span>
          <span className={metrics.droppedFrames > 0 ? 'text-orange-400' : 'text-green-400'}>
            {metrics.droppedFrames} ({metrics.droppedFramePercentage}%)
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
        Press <kbd className="px-1 py-0.5 bg-gray-800 rounded">F12</kbd> to toggle
      </div>
    </div>
  );
};

export default DevHUD;
