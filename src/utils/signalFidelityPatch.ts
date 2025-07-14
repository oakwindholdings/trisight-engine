// src/utils/signalFidelityPatch.ts
// Signal Fidelity Mode: Enforce No Debounce, No Premature Render
// Implements ui.patch.fidelity_mode for complete signal processing

import { logDebug } from './debug';

/**
 * Signal Renderer Settings with Fidelity Mode
 */
export interface FidelitySignalRenderSettings {
  debounceSignals: boolean;
  suppressOverlaps: boolean;
  renderAllPatterns: boolean;
  alwaysRenderStopExit: boolean;
  waitForPatternEngines: boolean;
}

/**
 * Default Fidelity Mode Settings - All protections disabled
 */
export const FIDELITY_MODE_SETTINGS: FidelitySignalRenderSettings = {
  debounceSignals: false,        // DISABLED: No signal debouncing
  suppressOverlaps: false,       // DISABLED: Render overlapping signals
  renderAllPatterns: true,       // ENABLED: Show all detected patterns
  alwaysRenderStopExit: true,    // ENABLED: Always render STOP_EXIT signals
  waitForPatternEngines: true    // ENABLED: Wait for pattern analysis completion
};

/**
 * Pattern Engine Readiness Tracker
 */
class PatternEngineReadinessTracker {
  private engineStatus = new Map<string, boolean>();
  private requiredEngines = [
    'ESCALATOR',
    'BLACKJACK', 
    'GOLDMINE',
    'BREAKOUT_BOX',
    'ROCKETMAN',
    'PIVOT',
    'GOLDMINE_CHANNEL',
    'GOLDEN_CANDLE'
  ];

  markEngineReady(engineName: string): void {
    this.engineStatus.set(engineName, true);
    logDebug('DEBUG_FIDELITY', '[Fidelity] Pattern engine ready', {
      engine: engineName,
      readyCount: this.getReadyCount(),
      totalRequired: this.requiredEngines.length
    });
  }

  markEngineProcessing(engineName: string): void {
    this.engineStatus.set(engineName, false);
    logDebug('DEBUG_FIDELITY', '[Fidelity] Pattern engine processing', {
      engine: engineName
    });
  }

  areAllEnginesReady(): boolean {
    const allReady = this.requiredEngines.every(engine => 
      this.engineStatus.get(engine) === true
    );
    
    if (!allReady) {
      const notReady = this.requiredEngines.filter(engine => 
        this.engineStatus.get(engine) !== true
      );
      logDebug('DEBUG_FIDELITY', '[Fidelity] Waiting for pattern engines', {
        notReady,
        readyCount: this.getReadyCount(),
        totalRequired: this.requiredEngines.length
      });
    }
    
    return allReady;
  }

  getReadyCount(): number {
    return this.requiredEngines.filter(engine => 
      this.engineStatus.get(engine) === true
    ).length;
  }

  reset(): void {
    this.engineStatus.clear();
    logDebug('DEBUG_FIDELITY', '[Fidelity] Pattern engine status reset', {});
  }

  getStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.requiredEngines.forEach(engine => {
      status[engine] = this.engineStatus.get(engine) || false;
    });
    return status;
  }
}

/**
 * Global pattern engine readiness tracker
 */
export const patternEngineTracker = new PatternEngineReadinessTracker();

/**
 * Data Analysis Lock Manager
 */
class DataAnalysisLockManager {
  private isAnalysisComplete = false;
  private analysisStartTime: number | null = null;

  startAnalysis(): void {
    this.isAnalysisComplete = false;
    this.analysisStartTime = Date.now();
    console.time("API → Chart Ready");
    logDebug('DEBUG_FIDELITY', '[Fidelity] Data analysis started', {
      timestamp: new Date().toISOString()
    });
  }

  completeAnalysis(): void {
    this.isAnalysisComplete = true;
    if (this.analysisStartTime) {
      const duration = Date.now() - this.analysisStartTime;
      console.timeEnd("API → Chart Ready");
      logDebug('DEBUG_FIDELITY', '[Fidelity] Data analysis completed', {
        duration,
        timestamp: new Date().toISOString()
      });
    }
  }

  isAnalysisReady(): boolean {
    return this.isAnalysisComplete;
  }

  reset(): void {
    this.isAnalysisComplete = false;
    this.analysisStartTime = null;
  }
}

/**
 * Global data analysis lock manager
 */
export const dataAnalysisLock = new DataAnalysisLockManager();

/**
 * Signal Fidelity Validator
 */
export class SignalFidelityValidator {
  static shouldRenderSignal(
    signal: any,
    settings: FidelitySignalRenderSettings
  ): boolean {
    // In Fidelity Mode, STOP_EXIT signals are ALWAYS rendered
    if (settings.alwaysRenderStopExit && 
        (signal.signalType === "STOP_EXIT" || 
         signal.action === "SELL" || 
         signal.action === "COVER")) {
      logDebug('DEBUG_FIDELITY', '[Fidelity] STOP_EXIT signal always rendered', {
        signalType: signal.signalType,
        action: signal.action,
        timestamp: signal.timestamp
      });
      return true;
    }

    // In Fidelity Mode, render all patterns regardless of overlaps
    if (settings.renderAllPatterns) {
      return true;
    }

    // Standard rendering logic (fallback)
    return true;
  }

  static canEmitSignal(
    patternType: string,
    settings: FidelitySignalRenderSettings
  ): boolean {
    // In Fidelity Mode, debouncing is disabled
    if (!settings.debounceSignals) {
      logDebug('DEBUG_FIDELITY', '[Fidelity] Signal emission allowed (debounce disabled)', {
        pattern: patternType,
        timestamp: new Date().toISOString()
      });
      return true;
    }

    // Standard debounce logic (fallback)
    return true;
  }

  static shouldWaitForEngines(
    settings: FidelitySignalRenderSettings
  ): boolean {
    if (!settings.waitForPatternEngines) {
      return false;
    }

    const allReady = patternEngineTracker.areAllEnginesReady();
    const analysisReady = dataAnalysisLock.isAnalysisReady();
    
    if (!allReady || !analysisReady) {
      logDebug('DEBUG_TRADE_SIGNALS', 'Waiting for pattern analysis to complete...', { pendingEngines: patternEngineTracker.getStatus() });
      return true;
    }

    return false;
  }
}

/**
 * Lifecycle Instrumentation
 */
export class LifecycleInstrumentation {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, Date.now());
    console.time(label);
    logDebug('DEBUG_FIDELITY', `[Fidelity] Timer started: ${label}`, {
      timestamp: new Date().toISOString()
    });
  }

  static endTimer(label: string): void {
    const startTime = this.timers.get(label);
    if (startTime) {
      const duration = Date.now() - startTime;
      console.timeEnd(label);
      logDebug('DEBUG_FIDELITY', `[Fidelity] Timer ended: ${label}`, {
        duration,
        timestamp: new Date().toISOString()
      });
      this.timers.delete(label);
    }
  }

  static logMilestone(milestone: string, data?: any): void {
    logDebug('DEBUG_TRADE_SIGNALS', `${milestone}`, data || {});
    logDebug('DEBUG_FIDELITY', `[Fidelity] Milestone: ${milestone}`, {
      data,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Global Signal Fidelity Mode State Manager
 */
class SignalFidelityModeManager {
  private fidelityModeEnabled = false;

  enableFidelityMode(): void {
    this.fidelityModeEnabled = true;
    localStorage.setItem('signalFidelityMode', 'true');
    logDebug('DEBUG_TRADE_SIGNALS', '[FIDELITY] Signal Fidelity Mode ENABLED');
    logDebug('DEBUG_FIDELITY', '[Fidelity] Mode enabled', {
      enabled: true,
      timestamp: new Date().toISOString()
    });
  }

  disableFidelityMode(): void {
    this.fidelityModeEnabled = false;
    localStorage.setItem('signalFidelityMode', 'false');
    logDebug('DEBUG_TRADE_SIGNALS', '[FIDELITY] Signal Fidelity Mode DISABLED');
    logDebug('DEBUG_FIDELITY', '[Fidelity] Mode disabled', {
      enabled: false,
      timestamp: new Date().toISOString()
    });
  }

  isFidelityModeOn(): boolean {
    // Check localStorage for persistence
    const stored = localStorage.getItem('signalFidelityMode');
    if (stored !== null) {
      this.fidelityModeEnabled = stored === 'true';
    }
    return this.fidelityModeEnabled;
  }

  toggleFidelityMode(): boolean {
    if (this.fidelityModeEnabled) {
      this.disableFidelityMode();
    } else {
      this.enableFidelityMode();
    }
    return this.fidelityModeEnabled;
  }

  getStatus(): {
    enabled: boolean;
    settings: FidelitySignalRenderSettings;
    engineStatus: Record<string, boolean>;
  } {
    return {
      enabled: this.fidelityModeEnabled,
      settings: FIDELITY_MODE_SETTINGS,
      engineStatus: patternEngineTracker.getStatus()
    };
  }
}

/**
 * Global fidelity mode manager
 */
export const fidelityModeManager = new SignalFidelityModeManager();

/**
 * Apply Fidelity Mode Patches
 */
export function applyFidelityModePatches(): void {
  logDebug('DEBUG_TRADE_SIGNALS', 'Signal Fidelity Mode patches applied', { settings: FIDELITY_MODE_SETTINGS, timestamp: new Date().toISOString() });

  // Reset all trackers
  patternEngineTracker.reset();
  dataAnalysisLock.reset();

  // Initialize window object for global access
  if (typeof window !== 'undefined') {
    (window as any).signalFidelityPatch = {
      isFidelityModeOn: () => fidelityModeManager.isFidelityModeOn(),
      enableFidelityMode: () => fidelityModeManager.enableFidelityMode(),
      disableFidelityMode: () => fidelityModeManager.disableFidelityMode(),
      toggleFidelityMode: () => fidelityModeManager.toggleFidelityMode(),
      setFidelityMode: (enabled: boolean) => {
        if (enabled) {
          fidelityModeManager.enableFidelityMode();
        } else {
          fidelityModeManager.disableFidelityMode();
        }
        return fidelityModeManager.isFidelityModeOn();
      },
      getStatus: () => fidelityModeManager.getStatus(),
      settings: FIDELITY_MODE_SETTINGS,
      patternEngineTracker,
      dataAnalysisLock
    };

    logDebug('DEBUG_TRADE_SIGNALS', '[FIDELITY] Window object initialized', { isFidelityModeOn: (window as any).signalFidelityPatch?.isFidelityModeOn, windowObjectExists: !!(window as any).signalFidelityPatch });
  }

  logDebug('DEBUG_FIDELITY', '[Fidelity] Fidelity Mode activated', {
    settings: FIDELITY_MODE_SETTINGS
  });
}

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  applyFidelityModePatches();
}
