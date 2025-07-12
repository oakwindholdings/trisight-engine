// src/utils/patternDebounceManager.ts
// Pattern debounce and staging state management for signal emission control
// Implements Dick O'Leary compliance: prevents premature emissions and controls frequency

import { debounceConfig, DEFAULT_DEBOUNCE_MS, PatternState } from '../config/debounceConfig';
import { logDebug, DEBUG_MODE } from './debug';
import { SignalFidelityValidator, FIDELITY_MODE_SETTINGS } from './signalFidelityPatch';

/**
 * Map to track last emission timestamp for each pattern
 */
const lastEmitMap = new Map<string, number>();

/**
 * Map to track pattern staging states
 */
const patternStateMap = new Map<string, PatternState>();

/**
 * Checks if a signal can be emitted based on debounce configuration
 * @param patternType - Pattern type (e.g., 'ESCALATOR', 'ROCKETMAN')
 * @param now - Current timestamp in milliseconds
 * @returns True if signal can be emitted, false if still in cooldown
 */
export function canEmitSignal(patternType: string, now: number = Date.now()): boolean {
  // Signal Fidelity Mode: Check if debouncing should be disabled
  if (SignalFidelityValidator.canEmitSignal(patternType, FIDELITY_MODE_SETTINGS)) {
    lastEmitMap.set(patternType, now); // Still track for diagnostics
    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[Fidelity] Signal emission allowed (fidelity mode)', {
        pattern: patternType,
        fidelityMode: true,
        timestamp: new Date(now).toISOString()
      });
    }
    return true;
  }

  const cooldownMs = debounceConfig[patternType as keyof typeof debounceConfig] || DEFAULT_DEBOUNCE_MS;
  const lastEmitTime = lastEmitMap.get(patternType) || 0;
  const timeSinceLastEmit = now - lastEmitTime;
  
  const canEmit = timeSinceLastEmit >= cooldownMs;
  
  if (canEmit) {
    lastEmitMap.set(patternType, now);
    
    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[Debounce] Signal emission allowed', {
        pattern: patternType,
        cooldownMs,
        timeSinceLastEmit,
        lastEmitTime: new Date(lastEmitTime).toISOString(),
        currentTime: new Date(now).toISOString()
      });
    }
  } else {
    if (DEBUG_MODE) {
      logDebug('DEBUG_PATTERN_DETECT', '[Debounce] Signal emission blocked', {
        pattern: patternType,
        cooldownMs,
        timeSinceLastEmit,
        remainingCooldown: cooldownMs - timeSinceLastEmit,
        lastEmitTime: new Date(lastEmitTime).toISOString()
      });
    }
  }
  
  return canEmit;
}

/**
 * Sets the staging state for a pattern
 * @param patternKey - Unique pattern identifier
 * @param state - Pattern state to set
 */
export function setPatternState(patternKey: string, state: PatternState): void {
  patternStateMap.set(patternKey, state);
  
  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Staging] Pattern state changed', {
      patternKey,
      newState: state,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Gets the current staging state for a pattern
 * @param patternKey - Unique pattern identifier
 * @returns Current pattern state or FORMED if not set
 */
export function getPatternState(patternKey: string): PatternState {
  return patternStateMap.get(patternKey) || PatternState.FORMED;
}

/**
 * Checks if a pattern can emit signals based on its staging state
 * @param patternKey - Unique pattern identifier
 * @param requiredState - Required state for signal emission (default: TRIGGERED)
 * @returns True if pattern is in valid state for emission
 */
export function canEmitByState(
  patternKey: string, 
  requiredState: PatternState = PatternState.TRIGGERED
): boolean {
  const currentState = getPatternState(patternKey);
  const canEmit = currentState === requiredState;
  
  if (!canEmit && DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Staging] Signal emission blocked by state', {
      patternKey,
      currentState,
      requiredState,
      timestamp: new Date().toISOString()
    });
  }
  
  return canEmit;
}

/**
 * Combined debounce and state check for signal emission
 * @param patternType - Pattern type for debounce check
 * @param patternKey - Unique pattern identifier for state check
 * @param requiredState - Required state for emission
 * @param now - Current timestamp
 * @returns True if both debounce and state checks pass
 */
export function canEmitSignalGated(
  patternType: string,
  patternKey: string,
  requiredState: PatternState = PatternState.TRIGGERED,
  now: number = Date.now()
): boolean {
  const debounceOk = canEmitSignal(patternType, now);
  const stateOk = canEmitByState(patternKey, requiredState);
  
  return debounceOk && stateOk;
}

/**
 * Resets debounce timer for a pattern (for testing or manual override)
 * @param patternType - Pattern type to reset
 */
export function resetDebounce(patternType: string): void {
  lastEmitMap.delete(patternType);
  
  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Debounce] Timer reset', {
      pattern: patternType,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Clears all debounce timers and pattern states (for testing)
 */
export function clearAllDebounceState(): void {
  lastEmitMap.clear();
  patternStateMap.clear();
  
  if (DEBUG_MODE) {
    logDebug('DEBUG_PATTERN_DETECT', '[Debounce] All state cleared', {
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Gets debounce status for debugging
 * @returns Object with debounce and state information
 */
export function getDebounceStatus(): {
  lastEmissions: Record<string, string>;
  patternStates: Record<string, PatternState>;
} {
  const lastEmissions: Record<string, string> = {};
  const patternStates: Record<string, PatternState> = {};
  
  lastEmitMap.forEach((timestamp, pattern) => {
    lastEmissions[pattern] = new Date(timestamp).toISOString();
  });
  
  patternStateMap.forEach((state, pattern) => {
    patternStates[pattern] = state;
  });
  
  return { lastEmissions, patternStates };
}
