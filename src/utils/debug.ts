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
