// src/config/debounceConfig.ts
// Per-pattern debounce configuration for signal emission control
// Prevents rapid repeat emissions and ensures proper signal spacing

/**
 * Debounce configuration in milliseconds for each TriSight pattern
 * Dick O'Leary compliance: Controls signal frequency to prevent over-trading
 */
export const debounceConfig = {
  ESCALATOR: 300000,         // 5 minutes - moderate frequency for trend patterns
  ROCKETMAN: 600000,         // 10 minutes - high frequency control for momentum
  GOLDMINE_SHAFT: 300000,    // 5 minutes - moderate frequency for retracement
  GOLDMINE_CHANNEL: 300000,  // 5 minutes - moderate frequency for channel breaks
  PIVOT: 300000,             // 5 minutes - moderate frequency for support/resistance
  GOLDEN_CANDLE: 180000,     // 3 minutes - faster frequency for high-confidence signals
  BREAKOUT_BOX: 180000,      // 3 minutes - faster frequency for box breakouts
  BLACKJACK: 240000          // 4 minutes - moderate frequency for bias signals
};

/**
 * Pattern state definitions for staging control
 */
export enum PatternState {
  FORMED = 'FORMED',         // Pattern detected but not confirmed
  TRIGGERED = 'TRIGGERED',   // Pattern confirmed and ready for signals
  STAGED = 'STAGED',         // Pattern waiting for confirmation
  EXITED = 'EXITED',         // Pattern completed or invalidated
  SUPPRESSED = 'SUPPRESSED'  // Pattern temporarily suppressed
}

/**
 * Default debounce time for unspecified patterns
 */
export const DEFAULT_DEBOUNCE_MS = 300000; // 5 minutes
