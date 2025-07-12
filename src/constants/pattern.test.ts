// src/constants/pattern.test.ts
// Tests for pattern constants
// Ensures constant values remain stable

import * as patternConstants from './pattern';

describe('Pattern Constants', () => {
  it('should have correct escalator constants', () => {
    expect(patternConstants.MIN_ESCALATOR_LENGTH).toBe(2);
    expect(patternConstants.MAX_STEP_DURATION).toBe(60);
  });

  it('should have correct blackjack thresholds', () => {
    expect(patternConstants.BJ_GOLD_THRESHOLD_LONG).toBe(2);
    expect(patternConstants.BJ_GOLD_THRESHOLD_SHORT).toBe(-2);
  });

  it('should have correct risk management constants', () => {
    expect(patternConstants.GAP_MAX_RISK_DEFAULT).toBe(0.04);
  });

  it('should have correct pattern detection constants', () => {
    expect(patternConstants.MIN_PATTERN_CONFIDENCE).toBe(0.5);
    expect(patternConstants.MIN_TOUCH_POINTS).toBe(2);
    expect(patternConstants.VOLUME_CONFIRMATION_THRESHOLD).toBe(1.2);
    expect(patternConstants.MOMENTUM_THRESHOLD).toBe(0.02);
    expect(patternConstants.PATTERN_OVERLAP_TOLERANCE).toBe(0.8);
  });

  it('should have correct lookback periods', () => {
    expect(patternConstants.PATTERN_LOOKBACK_PERIODS).toEqual({
      GOLDMINE_CHANNEL: 100,
      GOLDMINE_SHAFT: 50,
      PIVOT: 200,
      ROCKETMAN: 20,
      ESCALATOR: 100,
      BLACKJACK: 50
    });
  });

  it('should have correct strength thresholds', () => {
    expect(patternConstants.PATTERN_STRENGTH_THRESHOLDS).toEqual({
      WEAK: 0.3,
      MODERATE: 0.5,
      STRONG: 0.7,
      VERY_STRONG: 0.85
    });
  });

  // Snapshot test to detect any unintended changes
  it('should match constant values snapshot', () => {
    const snapshot = {
      MIN_ESCALATOR_LENGTH: patternConstants.MIN_ESCALATOR_LENGTH,
      MAX_STEP_DURATION: patternConstants.MAX_STEP_DURATION,
      BJ_GOLD_THRESHOLD_LONG: patternConstants.BJ_GOLD_THRESHOLD_LONG,
      BJ_GOLD_THRESHOLD_SHORT: patternConstants.BJ_GOLD_THRESHOLD_SHORT,
      GAP_MAX_RISK_DEFAULT: patternConstants.GAP_MAX_RISK_DEFAULT,
      MIN_PATTERN_CONFIDENCE: patternConstants.MIN_PATTERN_CONFIDENCE,
      MIN_TOUCH_POINTS: patternConstants.MIN_TOUCH_POINTS,
      VOLUME_CONFIRMATION_THRESHOLD: patternConstants.VOLUME_CONFIRMATION_THRESHOLD,
      MOMENTUM_THRESHOLD: patternConstants.MOMENTUM_THRESHOLD,
      PATTERN_OVERLAP_TOLERANCE: patternConstants.PATTERN_OVERLAP_TOLERANCE,
      PATTERN_LOOKBACK_PERIODS: patternConstants.PATTERN_LOOKBACK_PERIODS,
      PATTERN_STRENGTH_THRESHOLDS: patternConstants.PATTERN_STRENGTH_THRESHOLDS
    };
    
    expect(snapshot).toMatchSnapshot();
  });
});
