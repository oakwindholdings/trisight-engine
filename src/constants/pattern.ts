// src/constants/pattern.ts
// Pattern detection and analysis constants
// Centralized configuration values for pattern algorithms

// Escalator pattern constants
export const MIN_ESCALATOR_LENGTH = 2; // Minimum number of steps for a valid escalator pattern
export const MAX_STEP_DURATION = 60; // Maximum bars/candles in a single escalator step

// Blackjack pattern constants
export const BJ_GOLD_THRESHOLD_LONG = 2; // Minimum score for long signal
export const BJ_GOLD_THRESHOLD_SHORT = -2; // Maximum score for short signal (negative)

// Risk management constants
export const GAP_MAX_RISK_DEFAULT = 0.04; // Default maximum risk for gap patterns (4%)

// Additional pattern detection constants
export const MIN_PATTERN_CONFIDENCE = 0.5; // Minimum confidence threshold for pattern detection
export const MIN_TOUCH_POINTS = 2; // Minimum touch points for channel/pivot patterns
export const VOLUME_CONFIRMATION_THRESHOLD = 1.2; // Minimum volume ratio for confirmation
export const MOMENTUM_THRESHOLD = 0.02; // Minimum price change for momentum patterns (2%)
export const PATTERN_OVERLAP_TOLERANCE = 0.8; // Maximum overlap allowed between patterns (80%)

// Time-based constants
export const PATTERN_LOOKBACK_PERIODS = {
  GOLDMINE_CHANNEL: 100,
  GOLDMINE_SHAFT: 50,
  PIVOT: 200,
  ROCKETMAN: 20,
  ESCALATOR: 100,
  BLACKJACK: 50
} as const;

// Score thresholds for pattern strength
export const PATTERN_STRENGTH_THRESHOLDS = {
  WEAK: 0.3,
  MODERATE: 0.5,
  STRONG: 0.7,
  VERY_STRONG: 0.85
} as const;
