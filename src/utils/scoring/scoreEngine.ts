// src/utils/scoring/scoreEngine.ts
// TriSight Scoring Engine - Dick O'Leary Formula Implementation
// Extracted from TargetReportTable for testability and reusability

import { TradeActionSignal } from '../trading/TradeActionSignal';
import { PatternBase, PatternType } from '../../models/PatternTypes';
import { StepBox } from '../../types/pattern';

export interface PriceGains {
  gains5Day: Record<string, number>;
  gains10Day: Record<string, number>;
}

export interface TriSightMetrics {
  symbol: string;
  successProfile: number;
  acceleration: number;
  intrinsicStrength: number;
  relativeStrength: number;
  momentum: number;
  goldenCandle: number;
  triSightRating: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Compute TriSight metrics for a specific symbol using Dick O'Leary's formulas
 * @param ticker - Symbol to compute metrics for
 * @param latestSignal - Most recent signal for the symbol
 * @param associatedPatterns - Patterns associated with the symbol
 * @param associatedSteps - Escalator steps associated with the symbol
 * @param priceGains - Price gain data from TwelveData API
 * @returns Complete TriSight metrics object
 */
export function computeTriSightMetrics(
  ticker: string,
  latestSignal: TradeActionSignal,
  associatedPatterns: PatternBase[],
  associatedSteps: StepBox[],
  priceGains: PriceGains
): TriSightMetrics {
  // Dick O'Leary's TriSight Formula Implementation
  // PATCH L-2: Improved association logic with symbol/ticker fallback
  
  // Filter steps with improved symbol/ticker matching
  const filteredSteps = associatedSteps.filter(s =>
    (s as any).symbol === ticker || (s as any).ticker === ticker
  );
  
  // Filter Blackjack patterns with exact type matching
  const blackjackPatterns = associatedPatterns.filter(p =>
    ((p as any).symbol === ticker || (p as any).ticker === ticker) &&
    p.type === PatternType.BLACKJACK
  );
  
  // Filter Golden/Breakout patterns with exact type matching
  const goldenPatterns = associatedPatterns.filter(p =>
    ((p as any).symbol === ticker || (p as any).ticker === ticker) &&
    (p.type === PatternType.GOLDEN_CANDLE || p.type === PatternType.BREAKOUTBOX)
  );
  
  // Success Profile: AI confidence rating (0-100)
  const successProfile = Math.round(latestSignal.confidence * 100);
  
  // Acceleration: Escalator step count (capped at 100)
  const acceleration = Math.min(100, filteredSteps.length * 10);
  
  // Intrinsic Strength: Blackjack Trailing 5 patterns with fallback
  const trailing5 = [...blackjackPatterns].slice(-5);
  const intrinsicStrength = trailing5.length > 0
    ? Math.min(trailing5.reduce((sum, p) => sum + (p.confidence || 0.5), 0) * 20, 100)
    : 0;
  
  // Relative Strength: Blackjack Continuance Score with fallback
  const relativeStrength = blackjackPatterns.length > 0
    ? Math.min(blackjackPatterns.reduce((sum, p) => sum + (p.confidence || 0.5), 0) * 25, 100)
    : 0;
  
  // Golden Candle: Step breakout patterns
  const goldenCandle = Math.min(100, goldenPatterns.length * 30);
  
  // Momentum: Real price gains from TwelveData API
  const priceGain5Day = priceGains.gains5Day[ticker] || 0;
  const priceGain10Day = priceGains.gains10Day[ticker] || 0;
  const momentum = (priceGain5Day + priceGain10Day) / 2; // real price delta
  
  // TriSight Rating: Core formula average
  const triSightRating = Math.round((successProfile + acceleration + intrinsicStrength + momentum) / 4);
  
  // Risk Level: Based on TriSight rating
  const riskLevel = triSightRating >= 70 ? 'LOW' : triSightRating >= 50 ? 'MEDIUM' : 'HIGH';
  
  return {
    symbol: ticker.toUpperCase(),
    successProfile,
    acceleration,
    intrinsicStrength,
    relativeStrength,
    momentum,
    goldenCandle,
    triSightRating,
    riskLevel
  };
}

/**
 * Compute TriSight metrics for multiple symbols in batch
 * @param signalGroups - Grouped signals by ticker
 * @param patterns - All available patterns
 * @param escalatorSteps - All available escalator steps
 * @param priceGains - Price gain data
 * @returns Array of TriSight metrics
 */
export function computeBatchTriSightMetrics(
  signalGroups: Record<string, TradeActionSignal[]>,
  patterns: PatternBase[],
  escalatorSteps: StepBox[],
  priceGains: PriceGains
): TriSightMetrics[] {
  return Object.entries(signalGroups).map(([ticker, tickerSignals]) => {
    const latestSignal = tickerSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const associatedPatterns = patterns.filter(p =>
      p.type === latestSignal.pattern &&
      tickerSignals.some(sig => Math.abs(sig.timestamp.getTime() - p.startTime.getTime()) < 60000)
    );

    const associatedSteps = escalatorSteps.filter(s =>
      tickerSignals.some(sig => Math.abs(sig.timestamp.getTime() - s.startTime.getTime()) < 300000)
    );

    return computeTriSightMetrics(ticker, latestSignal, associatedPatterns, associatedSteps, priceGains);
  });
}

/**
 * Debug aid: expose internal association counts if needed
 * @param symbol - Symbol to analyze
 * @param patterns - All available patterns 
 * @param steps - All available steps
 * @returns Association statistics for debugging
 */
export function computeAssociationStats(
  symbol: string,
  patterns: PatternBase[],
  steps: StepBox[]
) {
  return {
    totalPatterns: patterns.filter(p => (p as any).symbol === symbol || (p as any).ticker === symbol).length,
    totalSteps: steps.filter(s => (s as any).symbol === symbol || (s as any).ticker === symbol).length,
    blackjackCount: patterns.filter(p => 
      ((p as any).symbol === symbol || (p as any).ticker === symbol) && 
      p.type === PatternType.BLACKJACK
    ).length
  };
}
