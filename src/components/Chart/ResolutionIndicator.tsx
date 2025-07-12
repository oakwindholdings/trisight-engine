// src/components/Chart/ResolutionIndicator.tsx
// Displays current chart resolution and zoom level
// Shows smooth transitions between resolution levels

import React from 'react';
import { ResolutionConfig } from '../../utils/dataResolution';
import './ResolutionIndicator.css';

interface ResolutionIndicatorProps {
  resolution: ResolutionConfig;
  zoomLevel: number;
  candleCount: number;
  isTransitioning: boolean;
  onClose?: () => void;
}

const ResolutionIndicator: React.FC<ResolutionIndicatorProps> = ({
  resolution,
  zoomLevel,
  candleCount,
  isTransitioning,
  onClose
}) => {
  // Format zoom level as percentage
  const zoomPercentage = Math.round(zoomLevel * 100);
  
  // Determine zoom state description
  const getZoomDescription = () => {
    if (zoomLevel < 0.1) return 'Macro View';
    if (zoomLevel < 0.5) return 'Weekly View';
    if (zoomLevel < 1) return 'Daily View';
    if (zoomLevel < 5) return 'Intraday View';
    if (zoomLevel < 20) return 'Micro View';
    return 'Tick View';
  };

  return (
    <div className={`resolution-indicator ${isTransitioning ? 'transitioning' : ''}`}>
      {onClose && (
        <button 
          className="resolution-close-btn" 
          onClick={onClose}
          aria-label="Close resolution indicator"
          title="Close"
        >
          ×
        </button>
      )}
      <div className="resolution-info">
        <span className="resolution-label">Resolution:</span>
        <span className="resolution-value">{resolution.label}</span>
      </div>
      
      <div className="zoom-info">
        <span className="zoom-label">Zoom:</span>
        <span className="zoom-value">{zoomPercentage}%</span>
      </div>
      
      <div className="candle-info">
        <span className="candle-label">Visible:</span>
        <span className="candle-value">{candleCount} candles</span>
      </div>
      
      <div className="zoom-description">
        {getZoomDescription()}
      </div>
      
      {isTransitioning && (
        <div className="transition-indicator">
          <div className="transition-bar" />
        </div>
      )}
    </div>
  );
};

export default ResolutionIndicator;
