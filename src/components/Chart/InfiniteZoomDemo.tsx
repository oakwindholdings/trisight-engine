// src/components/Chart/InfiniteZoomDemo.tsx
// Demo component showcasing infinite zoom capabilities
// Replace TriSightChart with this to enable infinite zoom

import React, { useState, useEffect } from 'react';
import InfiniteZoomChart from './InfiniteZoomChart';
import { Pattern } from '../../models/PatternTypes';
import { useTwelveDataApiKey } from '../../hooks/useTwelveDataApiKey';
import './InfiniteZoomDemo.css';

interface InfiniteZoomDemoProps {
  width?: number;
  height?: number;
  symbol?: string;
  patterns?: Pattern[];
}

const InfiniteZoomDemo: React.FC<InfiniteZoomDemoProps> = ({
  width = 1200,
  height = 600,
  symbol = 'AAPL',
  patterns = []
}) => {
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const { apiKey } = useTwelveDataApiKey();

  // Auto-hide instructions after a delay
  useEffect(() => {
    if (showInstructions) {
      const timer = setTimeout(() => setShowInstructions(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showInstructions]);

  if (!apiKey) {
    return (
      <div className="demo-error">
        <h3>API Key Required</h3>
        <p>Please configure your TwelveData API key in Settings to use the infinite zoom chart.</p>
      </div>
    );
  }

  return (
    <div className="infinite-zoom-demo">
      <div className="demo-header">
        <h2>Infinite Zoom Chart - {symbol}</h2>
        <button 
          className="help-button"
          onClick={() => setShowInstructions(!showInstructions)}
          title="Show/Hide Instructions"
        >
          ?
        </button>
      </div>

      {showInstructions && (
        <div className="demo-instructions">
          <h4>Zoom Controls:</h4>
          <ul>
            <li><strong>Mouse Wheel:</strong> Zoom in/out at cursor position</li>
            <li><strong>Pinch:</strong> Touch zoom on mobile devices</li>
            <li><strong>Drag:</strong> Pan across time</li>
            <li><strong>Click:</strong> Select patterns</li>
            <li><strong>Buttons:</strong> Quick zoom controls</li>
          </ul>
          <p className="demo-note">
            Chart automatically adjusts data resolution from tick-level to monthly as you zoom!
          </p>
        </div>
      )}

      <div className="chart-wrapper">
        <InfiniteZoomChart
          symbol={symbol}
          patterns={patterns}
          width={width}
          height={height}
          selectedPattern={selectedPattern}
          onPatternSelect={setSelectedPattern}
        />
      </div>

      {selectedPattern && (
        <div className="pattern-info">
          <h4>Selected Pattern</h4>
          <div className="pattern-details">
            <p><strong>Type:</strong> {selectedPattern.type}</p>
            <p><strong>Start:</strong> {selectedPattern.startTime.toLocaleString()}</p>
            <p><strong>End:</strong> {selectedPattern.endTime.toLocaleString()}</p>
            <p><strong>Confidence:</strong> {(selectedPattern.confidence * 100).toFixed(1)}%</p>
          </div>
          <button 
            className="clear-selection"
            onClick={() => setSelectedPattern(null)}
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default InfiniteZoomDemo;
