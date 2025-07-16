// src/models/PatternTypes.ts
// Pattern enumeration and models
// Defines domain pattern shapes
export enum PatternType {
  GOLDMINE_CHANNEL = 'GOLDMINE_CHANNEL',
  GOLDMINE_SHAFT = 'GOLDMINE_SHAFT',
  PIVOT = 'PIVOT',
  ROCKETMAN = 'ROCKETMAN',
  ESCALATOR = 'ESCALATOR',
  BLACKJACK = 'BLACKJACK',
  BREAKOUTBOX = 'BREAKOUTBOX',
  GOLDEN_CANDLE = 'GOLDEN_CANDLE'
}

export enum BlackjackSignalStrength {
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG'
}

export enum EscalatorSignalStrength {
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG'
}

export enum ChannelDirection {
  HORIZONTAL = 'HORIZONTAL',
  ASCENDING = 'ASCENDING',
  DESCENDING = 'DESCENDING'
}

export enum ThrustDirection {
  BULLISH = 'BULLISH',
  BEARISH = 'BEARISH'
}

export enum PivotType {
  SUPPORT = 'SUPPORT',
  RESISTANCE = 'RESISTANCE'
}

export interface PatternBase {
  id: string;
  type: PatternType;
  startTime: Date;
  endTime: Date;
  highPrice: number;
  lowPrice: number;
  confidence: number; // 0.0 to 1.0
  hasReceivedFeedback: boolean;
  
  // Enhanced fields for learning system
  feedbackCount?: number;
  latestFeedbackTimestamp?: number;
  confidenceHistory?: { timestamp: number; confidence: number }[];
  detectionVersion?: string; // Algorithm version that detected this pattern
  isAdjustedByFeedback?: boolean; // Whether this pattern has been adjusted by the learning system
}

export interface GoldmineChannelPattern extends PatternBase {
  type: PatternType.GOLDMINE_CHANNEL;
  direction: ChannelDirection;
  upperBoundary: number;
  lowerBoundary: number;
  touchPoints: Array<{ time: Date; price: number; isUpper: boolean }>;
}

export interface GoldmineShaftPattern extends PatternBase {
  type: PatternType.GOLDMINE_SHAFT;
  direction: ThrustDirection;
  thrustStartTime: Date;
  thrustEndTime: Date;
  thrustHighPrice: number;
  thrustLowPrice: number;
  retracementPercentage: number;
}

export interface PivotPattern extends PatternBase {
  type: PatternType.PIVOT;
  pivotType: PivotType;
  pivotLevel: number;
  touchPoints: Array<{ time: Date; price: number }>;
  touchStrength: number;        // Strength of each touch (0-1)
  temporalDistribution: number; // Quality of time distribution (0-1)
  priceConsistency: number;     // Consistency of price touches (0-1)
  volumeReactions: number[];    // Volume reactions at touch points
  priceReactions: number[];     // Price reactions at touch points
  strengthScore: number;        // Overall strength score
  adaptiveZoneWidth: number;    // Width of the pivot zone adjusted for volatility
  relatedPatternIds?: string[] | undefined; // IDs of related patterns
}

export enum RocketmanSignalStrength {
  WEAK = 'WEAK',
  MODERATE = 'MODERATE',
  STRONG = 'STRONG',
  VERY_STRONG = 'VERY_STRONG'
}

export interface RocketmanPattern extends PatternBase {
  type: PatternType.ROCKETMAN;
  accelerationRate: number;
  peakTime: Date;
  peakPrice: number;
  intensity: number; // 0.0 to 1.0 for gradient
  direction: ThrustDirection; // Bullish or bearish acceleration
  priceChanges: number[];     // Percentage price changes for each candle
  volumeChanges: number[];    // Percentage volume changes for each candle
  momentumScore: number;      // Score based on acceleration momentum (0-1)
  volumeConfirmation: number; // Volume confirmation score (0-1)
  signalStrength: RocketmanSignalStrength; // Classification of pattern strength
  adaptiveThreshold: number;  // Adjusted threshold based on market conditions
  relatedPatternIds?: string[] | undefined; // IDs of related patterns
}

export interface EscalatorPattern extends PatternBase {
  type: PatternType.ESCALATOR;
  steps: Array<{
    startTime: Date;
    endTime: Date;
    level: number;
    isConsolidation: boolean;
  }>;
  direction: ThrustDirection;
  stepScores: number[];          // Score for each step in the escalator
  cumulativeScore: number;       // Overall strength score
  contextScore?: number;         // Optional score from higher timeframe context
  signalStrength: EscalatorSignalStrength;
  priceChanges: number[];        // Price percent changes for each step
  volumeChanges: number[];       // Volume percent changes for each step
  averageStepHeight: number;     // Average price movement per step
  stepConsistency: number;       // Measure of how consistent the steps are (0-1)
  relatedPatternIds?: string[] | undefined;  // IDs of related patterns
}

export interface BlackjackPattern extends PatternBase {
  type: PatternType.BLACKJACK;
  intrinsicScores: number[];       // Score for each individual period
  cumulativeScore: number;         // Running total score over lookback period
  contextScore?: number;           // Optional score from higher timeframe
  signalStrength: BlackjackSignalStrength;
  priceChange: number[];           // Price percent changes
  volumeChange: number[];          // Volume percent changes
  relatedPatternIds?: string[] | undefined;    // IDs of related patterns
}

export interface GoldenCandlePattern extends PatternBase {
  type: PatternType.GOLDEN_CANDLE;
  direction: 'LONG' | 'SHORT';
  goldenScore: number;
  intrinsicScore: number;
  cumulativeScore: number;
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  candlePrice: number;
  stepBoxCeiling?: number;
  stepBoxFloor?: number;
}

export interface BreakoutBoxPattern extends PatternBase {
  type: PatternType.BREAKOUTBOX;
  direction: 'RISING' | 'FALLING';
  floor: number;
  ceiling: number;
}

export type Pattern =
  | GoldmineChannelPattern
  | GoldmineShaftPattern
  | PivotPattern
  | RocketmanPattern
  | EscalatorPattern
  | BlackjackPattern
  | GoldenCandlePattern
  | BreakoutBoxPattern;

// Enhanced pattern with feedback metadata
export interface PatternSignal extends PatternBase {
  // Feedback metadata
  feedbackEnabled: boolean;
  feedbackId?: string;
  clickable: boolean;
  
  // Visual metadata for enhanced rendering
  visualMetadata?: {
    labelPosition: 'top' | 'bottom' | 'left' | 'right';
    showConfidenceBar: boolean;
    highlightOnHover: boolean;
    pulseAnimation?: boolean;
    customColor?: string;
  };
  
  // Learning system metadata
  modelVersion: string;
  detectedAt: Date;
  adjustmentHistory?: Array<{
    timestamp: Date;
    previousConfidence: number;
    newConfidence: number;
    reason: string;
  }>;
}

export interface PatternStyle {
  color: string;
  secondaryColor?: string;
  lineWidth: number;
  opacity: number;
}

export const patternStyles: Record<PatternType, PatternStyle> = {
  [PatternType.GOLDMINE_CHANNEL]: {
    color: '#1E88E5', // Deep Blue
    lineWidth: 2,
    opacity: 0.8
  },
  [PatternType.GOLDMINE_SHAFT]: {
    color: '#43A047', // Green
    secondaryColor: '#E53935', // Red
    lineWidth: 2,
    opacity: 0.8
  },
  [PatternType.PIVOT]: {
    color: '#FB8C00', // Orange
    secondaryColor: '#E53935', // Red
    lineWidth: 1,
    opacity: 0.8
  },
  [PatternType.ROCKETMAN]: {
    color: '#D81B60', // Magenta
    lineWidth: 2,
    opacity: 0.8
  },
  [PatternType.ESCALATOR]: {
    color: '#8E24AA', // Purple
    lineWidth: 1,
    opacity: 0.8
  },
  [PatternType.BLACKJACK]: {
    color: '#3949AB', // Indigo
    lineWidth: 1,
    opacity: 0.8
  },
  [PatternType.BREAKOUTBOX]: {
    color: '#2196F3', // Blue
    lineWidth: 2,
    opacity: 0.8
  },
  [PatternType.GOLDEN_CANDLE]: {
    color: '#FFD700', // Golden
    lineWidth: 2,
    opacity: 0.8
  }
};
