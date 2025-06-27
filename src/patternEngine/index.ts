// src/patternEngine/index.ts
// Export all pattern detection functions
// Provides centralized access to all pattern detection functions

export { detectEscalators } from './escalator';
export { detectEscalatorSteps, detectStepContinuation } from './escalatorStep';
export { detectBreakoutBoxes, type BreakoutBox } from './breakoutBox';
export { 
  getIntrinsicScore, 
  calcStepBlackjack, 
  getBlackjackSignal,
  computeRollingBlackjackScores,
  computeTargetBlackjackScore
} from './blackjack';
export { detectGoldmine } from './goldmine';
export type { GoldmineSignal } from './goldmine';

// Scaffolded pattern detectors (placeholder implementations)
export { detectGoldmineChannel, type GoldmineChannelDetection } from './goldmineChannel';
export { detectPivots, type PivotDetection } from './pivot';
export { detectRocketman, type RocketmanDetection } from './rocketman';
export { detectGoldenCandle, detectGoldenCandleCandidates, detectGoldenNearMisses, isTrailingStopTriggered, type GoldenCandlePattern, type GoldenCandleCandidate } from './goldenCandle';
