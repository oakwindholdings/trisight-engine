// src/types/pattern.ts
// Pattern-specific type definitions
// Extends base pattern types with detailed structures

import { CandlestickData } from '../models/ChartTypes';
import { PatternType, ThrustDirection } from '../models/PatternTypes';

// Re-export CandlestickData as Candle for convenience
export type Candle = CandlestickData;

// Re-export PatternType and ThrustDirection for convenience
export { PatternType, ThrustDirection };

// Escalator pattern structures
export interface EscalatorRun {
  startIndex: number;
  endIndex: number;
  direction: ThrustDirection;
  steps: StepBox[];
  averageStepHeight: number;
  consistency: number; // 0-1 measure of step uniformity
}

export interface StepBox {
  startTime: Date;
  endTime: Date;
  startIndex: number;
  endIndex: number;
  level: number; // Price level of the step
  height: number; // Price difference from previous step
  duration: number; // Number of candles
  isConsolidation: boolean; // True if this is a consolidation phase
  volumeProfile: number; // Average volume during this step
  floor: number; // Step range bottom (lowest low in step)
  ceiling: number; // Step range top (highest high in step)
  direction?: 'UP' | 'DOWN'; // Direction of the preceding escalator
  isCompleted?: boolean; // True if step has been broken/completed
}

// Blackjack pattern structures
export interface BlackjackScore {
  timestamp: Date;
  intrinsicScore: number; // Score for this period
  cumulativeScore: number; // Running total
  components: {
    priceChange: number;
    volumeRatio: number;
    momentum: number;
    volatility: number;
  };
  signal: 'LONG' | 'SHORT' | 'NEUTRAL';
}

// Goldmine pattern structures
export interface GoldmineSignal {
  patternId: string;
  type: PatternType.GOLDMINE_CHANNEL | PatternType.GOLDMINE_SHAFT;
  timestamp: Date;
  entryPrice: number;
  direction: ThrustDirection;
  stopLoss: number;
  takeProfit: number[];
  confidence: number;
  riskRewardRatio: number;
}

// Risk management structures
export interface StopLossEvent {
  patternId: string;
  timestamp: Date;
  triggerPrice: number;
  originalStopLoss: number;
  adjustedStopLoss?: number; // If trailing stop was used
  reason: 'FIXED' | 'TRAILING' | 'VOLATILITY' | 'TIME_BASED';
  loss: number; // Actual loss amount/percentage
}

// Pattern validation structures
export interface PatternValidation {
  isValid: boolean;
  confidence: number;
  reasons: string[];
  adjustments?: {
    startTime?: Date;
    endTime?: Date;
    levels?: number[];
  };
}

// Pattern context for adaptive detection
export interface PatternContext {
  volatility: number;
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volume: 'LOW' | 'NORMAL' | 'HIGH';
  timeOfDay: 'PREMARKET' | 'OPEN' | 'MIDDAY' | 'CLOSE' | 'AFTERHOURS';
  relatedPatterns: string[]; // IDs of nearby patterns
}

// Pattern detection parameters
export interface PatternDetectionConfig {
  minConfidence: number;
  lookbackPeriod: number;
  adaptiveThresholds: boolean;
  contextAware: boolean;
  allowOverlap: boolean;
  maxPatterns: number;
}
