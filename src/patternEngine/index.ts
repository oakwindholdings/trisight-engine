// src/patternEngine/index.ts
// TriSight Detection Input Refactor Patch v1.3.0: Export near-miss detection and trailing stop functions
// TriSight Detection Input Refactor Patch v1.3.3: Export ENTRY/EXIT lifecycle detection
// Provides centralized access to all pattern detection functions

export { detectEscalators, detectEscalatorTradeSignals, monitorEscalatorExitSignals } from './escalator';
export { detectEscalatorSteps, detectStepContinuation } from './escalatorStep';
export { detectBreakoutBoxes, type BreakoutBox } from './breakoutBox';
export {
  getIntrinsicScore,
  calcStepBlackjack,
  computeRollingBlackjackScores,
  computeTargetBlackjackScore,
  detectBlackjackTradeSignals,
  getBlackjackSignal
} from './blackjack';
export { 
  detectGoldmine, 
  detectGoldmineShaftPatterns,
  detectGoldmineShaftTradeSignals,
  evaluateGoldmineShaftForEntry,
  monitorGoldmineShaftExitSignals,
  monitorGoldmineShaftForExit,
  type GoldmineSignal 
} from './goldmine';

// Scaffolded pattern detectors (placeholder implementations)
export { 
  detectGoldmineChannel, 
  detectGoldmineChannelPatterns,
  detectGoldmineChannelTradeSignals,
  evaluateGoldmineChannelForEntry,
  monitorGoldmineChannelExitSignals,
  monitorGoldmineChannelForExit,
  type GoldmineChannelDetection 
} from './goldmineChannel';
export { detectPivots, evaluatePivotForEntry, monitorPivotForExit, type PivotDetection } from './pivot';
export { detectRocketman, evaluateRocketmanForEntry, monitorRocketmanForExit, type RocketmanDetection } from './rocketman';
export { detectGoldenCandle, detectGoldenCandleCandidates, detectGoldenNearMisses, isTrailingStopTriggered, evaluateGoldenCandleForEntry, monitorGoldenCandleForExit, type GoldenCandlePattern, type GoldenCandleCandidate } from './goldenCandle';
