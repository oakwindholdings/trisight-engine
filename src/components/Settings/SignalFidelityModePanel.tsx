// src/components/Settings/SignalFidelityModePanel.tsx
// Signal Fidelity Mode Control Panel
// Provides UI controls for enabling and configuring signal fidelity mode

import React, { useState, useEffect } from 'react';
import { applyFidelityModePatches, FIDELITY_MODE_SETTINGS, patternEngineTracker, dataAnalysisLock, LifecycleInstrumentation } from '../../utils/signalFidelityPatch';

interface SignalFidelityModePanelProps {
  onModeChange?: (enabled: boolean) => void;
}

export const SignalFidelityModePanel: React.FC<SignalFidelityModePanelProps> = ({ onModeChange }) => {
  const [fidelityModeEnabled, setFidelityModeEnabled] = useState(true);
  const [engineStatus, setEngineStatus] = useState<Record<string, boolean>>({});
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  useEffect(() => {
    // Apply fidelity mode patches on component mount
    applyFidelityModePatches();
    
    // Set up status monitoring
    const interval = setInterval(() => {
      setEngineStatus(patternEngineTracker.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleFidelityMode = (enabled: boolean) => {
    setFidelityModeEnabled(enabled);
    onModeChange?.(enabled);

    if (enabled) {
      applyFidelityModePatches();
      addDebugMessage(`[Fidelity] Signal Fidelity Mode ENABLED`);
    } else {
      addDebugMessage(`[Fidelity] Signal Fidelity Mode DISABLED`);
    }
  };

  const addDebugMessage = (message: string) => {
    setDebugOutput(prev => [
      ...prev.slice(-9), // Keep last 9 messages
      `${new Date().toLocaleTimeString()}: ${message}`
    ]);
  };

  const handleResetTrackers = () => {
    patternEngineTracker.reset();
    dataAnalysisLock.reset();
    setEngineStatus({});
    addDebugMessage('[Fidelity] All trackers reset');
  };

  const handleStartAnalysisDemo = () => {
    dataAnalysisLock.startAnalysis();
    LifecycleInstrumentation.startTimer("Demo Analysis");
    addDebugMessage('[Fidelity] Demo analysis started');
    
    // Mark engines as ready in sequence to demonstrate tracking
    const engines = ['ESCALATOR', 'BLACKJACK', 'BREAKOUT_BOX', 'GOLDMINE', 'ROCKETMAN', 'PIVOT', 'GOLDMINE_CHANNEL', 'GOLDEN_CANDLE'];
    engines.forEach((engine, index) => {
      setTimeout(() => {
        patternEngineTracker.markEngineReady(engine);
        addDebugMessage(`[Fidelity] ${engine} engine ready`);
        
        if (index === engines.length - 1) {
          setTimeout(() => {
            dataAnalysisLock.completeAnalysis();
            LifecycleInstrumentation.endTimer("Demo Analysis");
            addDebugMessage('[Fidelity] All pattern engines ready');
          }, 500);
        }
      }, index * 200);
    });
  };

  const getEngineStatusIcon = (ready: boolean) => ready ? '✅' : '⏳';

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Signal Fidelity Mode</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={fidelityModeEnabled}
            onChange={(e) => handleToggleFidelityMode(e.target.checked)}
            className="form-checkbox h-4 w-4 text-emerald-600"
          />
          <span className="text-white text-sm">Enable</span>
        </label>
      </div>

      {fidelityModeEnabled && (
        <>
          <div className="bg-slate-700 p-3 rounded space-y-2">
            <h4 className="text-sm font-medium text-white mb-2">Fidelity Settings</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Debounce Signals:</span>
                <span className={FIDELITY_MODE_SETTINGS.debounceSignals ? "text-red-400" : "text-emerald-400"}>
                  {FIDELITY_MODE_SETTINGS.debounceSignals ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Suppress Overlaps:</span>
                <span className={FIDELITY_MODE_SETTINGS.suppressOverlaps ? "text-red-400" : "text-emerald-400"}>
                  {FIDELITY_MODE_SETTINGS.suppressOverlaps ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Render All Patterns:</span>
                <span className={FIDELITY_MODE_SETTINGS.renderAllPatterns ? "text-emerald-400" : "text-red-400"}>
                  {FIDELITY_MODE_SETTINGS.renderAllPatterns ? "ON" : "OFF"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Always Render STOP_EXIT:</span>
                <span className={FIDELITY_MODE_SETTINGS.alwaysRenderStopExit ? "text-emerald-400" : "text-red-400"}>
                  {FIDELITY_MODE_SETTINGS.alwaysRenderStopExit ? "ON" : "OFF"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700 p-3 rounded space-y-2">
            <h4 className="text-sm font-medium text-white mb-2">Pattern Engine Status</h4>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {Object.entries(engineStatus).map(([engine, ready]) => (
                <div key={engine} className="flex justify-between items-center">
                  <span className="text-gray-300">{engine}:</span>
                  <span className="flex items-center space-x-1">
                    <span>{getEngineStatusIcon(ready)}</span>
                    <span className={ready ? "text-emerald-400" : "text-yellow-400"}>
                      {ready ? "READY" : "WAIT"}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            
            <div className="pt-2 space-x-2">
              <button
                onClick={handleResetTrackers}
                className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white text-xs rounded"
              >
                Reset
              </button>
              <button
                onClick={handleStartAnalysisDemo}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded"
              >
                Demo Analysis
              </button>
            </div>
          </div>

          <div className="bg-slate-700 p-3 rounded space-y-2">
            <h4 className="text-sm font-medium text-white mb-2">Debug Output</h4>
            <div className="bg-black p-2 rounded text-xs font-mono h-32 overflow-y-auto">
              {debugOutput.length === 0 ? (
                <div className="text-gray-500">No debug messages...</div>
              ) : (
                debugOutput.map((message, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {message}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="text-xs text-gray-400 border-t border-slate-600 pt-2">
        <strong>Signal Fidelity Mode:</strong> Disables all debouncing and overlap suppression, ensures complete signal processing before chart rendering, and enforces STOP_EXIT signal visibility.
      </div>
    </div>
  );
};
