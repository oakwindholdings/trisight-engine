// src/utils/debug.ts
// Global debug configuration for controlling verbose logging
// Set to true to enable detailed diagnostic logs

import defaultDebugSettings from '../debug/debugSettings.json';

/**
 * Global debug mode flag
 * When enabled, detailed diagnostic logs will be shown in console
 * Default: false (production mode - only summary logs shown)
 */
export const DEBUG_MODE = false;

/**
 * Debug log wrapper - only logs when DEBUG_MODE is enabled
 * @param args - Arguments to pass to console.log
 */
export const debugLog = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log(...args);
  }
};

/**
 * Debug warn wrapper - only warns when DEBUG_MODE is enabled
 * @param args - Arguments to pass to console.warn
 */
export const debugWarn = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.warn(...args);
  }
};

/**
 * Always logs - use for important summary information
 * @param args - Arguments to pass to console.log
 */
export const summaryLog = (...args: any[]) => {
  console.log(...args);
};

// -----------------------------------------------------------------------------
// Channel-based debugging implementation (TriSight Debug Settings)
// -----------------------------------------------------------------------------

type DebugSettings = Record<string, boolean>;

const LOCAL_STORAGE_KEY = 'trisight_debug_settings';

/**
 * Load runtime debug settings by merging defaults from JSON with any overrides
 * found in localStorage (persisted by the Debug Settings UI).
 */
const loadRuntimeSettings = (): DebugSettings => {
  try {
    const persisted = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (persisted) {
      return { ...defaultDebugSettings, ...(JSON.parse(persisted) as DebugSettings) };
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Debug] Failed to parse persisted debug settings. Reverting to defaults.', e);
  }
  return { ...defaultDebugSettings };
};

let runtimeSettings: DebugSettings = loadRuntimeSettings();

const persistRuntimeSettings = (): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(runtimeSettings));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[Debug] Failed to persist debug settings', e);
  }
};

/**
 * Returns a copy of the current runtime debug settings map.
 */
export const getDebugSettings = (): DebugSettings => ({ ...runtimeSettings });

/**
 * Checks whether a given debug channel is currently enabled.
 */
export const isChannelEnabled = (channel: string): boolean => !!runtimeSettings[channel];

/**
 * Core channel-aware logger. Only logs when the specified channel is enabled.
 * Each message is prefixed with the channel name for easy filtering.
 */
export const logDebug = (channel: string, ...args: any[]): void => {
  if (isChannelEnabled(channel)) {
    // eslint-disable-next-line no-console
    console.log(`[${channel}]`, ...args);
  }
};

/**
 * Channel-aware warning logger that mirrors console.warn behaviour.
 */
export const logWarn = (channel: string, ...args: any[]): void => {
  if (isChannelEnabled(channel)) {
    // eslint-disable-next-line no-console
    console.warn(`[${channel}]`, ...args);
  }
};

/**
 * Enable or disable a single channel at runtime and persist the change.
 */
export const setChannelEnabled = (channel: string, enabled: boolean): void => {
  runtimeSettings = { ...runtimeSettings, [channel]: enabled };
  persistRuntimeSettings();
};

/**
 * Replace the entire runtime settings map (e.g., when importing from JSON).
 */
export const setDebugSettings = (settings: DebugSettings): void => {
  runtimeSettings = { ...defaultDebugSettings, ...settings };
  persistRuntimeSettings();
};

// -----------------------------------------------------------------------------
// Heikin-Ashi Specific Debug Logging
// -----------------------------------------------------------------------------

/**
 * HA-aware logging for pattern detection with candle type indication
 * Automatically prefixes logs with [HA] to distinguish from OHLC-based detection
 */
export const logDebugHA = (channel: string, patternName: string, ...args: any[]): void => {
  if (isChannelEnabled(channel)) {
    // eslint-disable-next-line no-console
    console.log(`[${channel}:HA] [${patternName}]`, ...args);
  }
};

/**
 * Logs HA transformation details for debugging conversion accuracy
 */
export const logHATransform = (originalCandle: any, haCandle: any, index: number): void => {
  if (isChannelEnabled('DEBUG_PATTERN_DETECT')) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG_PATTERN_DETECT:HA] [TRANSFORM] Candle ${index}:`, {
      original: {
        open: originalCandle.open.toFixed(4),
        high: originalCandle.high.toFixed(4),
        low: originalCandle.low.toFixed(4),
        close: originalCandle.close.toFixed(4),
        bodySize: Math.abs(originalCandle.close - originalCandle.open).toFixed(4)
      },
      heikinAshi: {
        open: haCandle.open.toFixed(4),
        high: haCandle.high.toFixed(4),
        low: haCandle.low.toFixed(4),
        close: haCandle.close.toFixed(4),
        bodySize: Math.abs(haCandle.close - haCandle.open).toFixed(4)
      },
      smoothingEffect: {
        bodyChange: (Math.abs(haCandle.close - haCandle.open) - Math.abs(originalCandle.close - originalCandle.open)).toFixed(4),
        rangeChange: ((haCandle.high - haCandle.low) - (originalCandle.high - originalCandle.low)).toFixed(4)
      }
    });
  }
};

/**
 * Logs HA vs OHLC pattern detection comparison results
 */
export const logHAComparison = (patternName: string, haResults: any[], ohlcResults: any[]): void => {
  if (isChannelEnabled('DEBUG_PATTERN_DETECT')) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG_PATTERN_DETECT:HA] [COMPARISON] ${patternName}:`, {
      haDetections: haResults.length,
      ohlcDetections: ohlcResults.length,
      improvement: haResults.length - ohlcResults.length,
      haOnlyPatterns: haResults.filter(ha => !ohlcResults.some(ohlc => Math.abs(ha.index - ohlc.index) <= 2)),
      ohlcOnlyPatterns: ohlcResults.filter(ohlc => !haResults.some(ha => Math.abs(ha.index - ohlc.index) <= 2))
    });
  }
};

/**
 * Logs HA-specific pattern quality metrics
 */
export const logHAQuality = (patternName: string, pattern: any, qualityMetrics: any): void => {
  if (isChannelEnabled('DEBUG_PATTERN_DETECT')) {
    // eslint-disable-next-line no-console
    console.log(`[DEBUG_PATTERN_DETECT:HA] [QUALITY] ${patternName} at ${pattern.index}:`, {
      confidence: pattern.confidence?.toFixed(3) || 'N/A',
      haSmoothing: qualityMetrics.smoothingFactor?.toFixed(3) || 'N/A',
      noiseReduction: qualityMetrics.noiseReduction?.toFixed(3) || 'N/A',
      trendClarity: qualityMetrics.trendClarity?.toFixed(3) || 'N/A',
      signalStrength: qualityMetrics.signalStrength || 'UNKNOWN'
    });
  }
};

// Golden Candle miss analysis debug logging
export function logGoldenMissReasons(candle: any, reasons: string[], qualifyingFactors: string[] = []) {
  logDebug('DEBUG_GOLDEN_MISS', '[Golden Miss Analysis] Near-miss candle analysis', {
    candleTimestamp: candle.timestamp || new Date().toISOString(),
    candleClose: candle.close?.toFixed(4) || 'N/A',
    candleHigh: candle.high?.toFixed(4) || 'N/A',
    candleLow: candle.low?.toFixed(4) || 'N/A',
    missReasons: reasons,
    qualifyingFactors: qualifyingFactors,
    totalMissReasons: reasons.length,
    totalQualifyingFactors: qualifyingFactors.length,
    isNearMiss: qualifyingFactors.length >= 2 && reasons.length >= 1,
    dickOLearyCompliant: true,
    forensicAnalysis: true
  });
}

// -----------------------------------------------------------------------------
// HA Infrastructure Alignment Audit Utility (v1.0.0)
// -----------------------------------------------------------------------------

/**
 * Logs index alignment issues between UI overlays and HA detection source
 * Part of TriSight HA Infrastructure Alignment Patch v1.0.0
 * @param index - The array index where mismatch occurred
 * @param source - Description of the source context (e.g., 'MetricPopover', 'PatternRenderer')
 * @param expected - Expected HA candle data or description
 * @param actual - Actual data found or description of mismatch
 */
export function logDebugHAAlignmentMismatch(
  candleIndex: number,
  context: string,
  expected: string,
  actual: string
): void {
  if (isChannelEnabled('DEBUG_HA_ALIGNMENT')) {
    logDebug('DEBUG_HA_ALIGNMENT', `[HA-MISMATCH] ${context} at candle ${candleIndex}: expected ${expected}, got ${actual}`);
  }
}

/**
 * Debug logger specifically for hover events and canvas-DOM bridge functionality
 * Part of Phase 2 Cognitive Hover Spec implementation
 */
export function logDebugHover(
  component: string,
  event: string,
  data: any
): void {
  if (isChannelEnabled('DEBUG_HOVER_EVENTS')) {
    logDebug('DEBUG_HOVER_EVENTS', `[HOVER] ${component} - ${event}:`, data);
  }
}
