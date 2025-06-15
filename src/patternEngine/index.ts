// src/patternEngine/index.ts
// Barrel export for pattern detection engine modules
// Provides centralized access to all pattern detection functions

export { detectEscalators } from './escalator';
export { detectEscalatorSteps, isValidStep, isInStep } from './escalatorStep';
export { 
  getIntrinsicScore, 
  calcStepBlackjack, 
  getBlackjackSignal 
} from './blackjack';
export { detectGoldmine } from './goldmine';
export type { GoldmineSignal } from './goldmine';
