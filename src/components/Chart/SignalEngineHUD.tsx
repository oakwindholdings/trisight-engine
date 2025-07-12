// src/components/Chart/SignalEngineHUD.tsx
// Signal Engine HUD overlay displaying real-time pattern engine status
// Front-and-center overlay for debugging and monitoring

import React, { useEffect, useState } from 'react';
import { patternEngineTracker } from '../../utils/signalFidelityPatch';

interface SignalEngineHUDProps {
  show: boolean;
  onHide?: () => void;
}

export const SignalEngineHUD: React.FC<SignalEngineHUDProps> = ({ show, onHide }) => {
  const [engineStatus, setEngineStatus] = useState<Record<string, boolean>>({});
  const [allReady, setAllReady] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      const status = patternEngineTracker.getStatus();
      setEngineStatus(status);
      const ready = patternEngineTracker.areAllEnginesReady();
      setAllReady(ready);
      
      // Auto-hide after 2 seconds when all engines are ready
      if (ready && onHide) {
        setTimeout(() => onHide(), 2000);
      }
    };

    // Update status immediately
    updateStatus();
    
    // Set up polling to update status
    const interval = setInterval(updateStatus, 500);
    return () => clearInterval(interval);
  }, [onHide]);

  if (!show) return null;

  return (
    <div 
      id="SignalEngineOverlayHUD"
      style={{
        position: 'absolute',
        top: '50px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#111',
        color: '#eee',
        fontSize: '0.95rem',
        padding: '1rem',
        borderRadius: '0.5rem',
        zIndex: 1001,
        boxShadow: '0 0 6px rgba(0,0,0,0.5)',
        minWidth: '300px',
        fontFamily: 'Inter, sans-serif'
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem 0', color: allReady ? '#10b981' : '#f59e0b' }}>
        {allReady ? '✅ Signal Engines Ready' : '⏳ Signal Engine Booting…'}
      </h3>
      
      <div id="SignalHUDContent">
        {Object.entries(engineStatus).map(([engine, ready]) => (
          <div 
            key={engine}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              margin: '0.25rem 0',
              padding: '0.25rem 0.5rem',
              backgroundColor: ready ? '#065f46' : '#451a03',
              borderRadius: '0.25rem',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>{engine}</span>
            <span style={{ fontSize: '1.1rem' }}>
              {ready ? '✅' : '🔄'}
            </span>
          </div>
        ))}
      </div>
      
      {allReady && (
        <div style={{ 
          textAlign: 'center', 
          marginTop: '0.5rem', 
          fontSize: '0.8rem',
          color: '#9ca3af'
        }}>
          Auto-hiding in 2 seconds...
        </div>
      )}
    </div>
  );
};
