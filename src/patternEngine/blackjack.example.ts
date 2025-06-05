// src/patternEngine/blackjack.example.ts
// Example usage of Blackjack scoring functions
// Demonstrates integration with step detection and signal generation

import { getIntrinsicScore, calcStepBlackjack, getBlackjackSignal } from './blackjack';
import { detectEscalators } from './escalator';
import { Candle, BlackjackScore } from '../types/pattern';

/**
 * Example: Score individual candles in a sequence
 */
export function scoreCandles(candles: Candle[]) {
  console.log('Scoring individual candles:');
  
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const previous = candles[i - 1];
    
    // Calculate body high/low for previous candle
    const prevBodyHigh = Math.max(previous.open, previous.close);
    const prevBodyLow = Math.min(previous.open, previous.close);
    
    const score = getIntrinsicScore(current, prevBodyHigh, prevBodyLow);
    
    console.log(`Candle ${i}: ${score === 1 ? 'Bullish' : score === -1 ? 'Bearish' : 'Neutral'} (${score})`);
  }
}

/**
 * Example: Integrate Blackjack scoring with Escalator detection
 */
export function analyzeEscalatorWithBlackjack(candles: Candle[]) {
  // Detect escalator patterns
  const escalatorRuns = detectEscalators(candles);
  
  console.log(`Found ${escalatorRuns.length} escalator patterns`);
  
  // Score each escalator's first step
  escalatorRuns.forEach((run, index) => {
    // Get the candles for the first step
    const firstStepStart = run.startIndex;
    const firstStepEnd = run.steps[0] ? run.startIndex + run.steps[0].duration : run.startIndex;
    const stepCandles = candles.slice(firstStepStart, firstStepEnd + 1);
    
    // Calculate Blackjack score for the step
    const blackjackScore = calcStepBlackjack(stepCandles);
    
    console.log(`\nEscalator ${index + 1}:`);
    console.log(`  Direction: ${run.direction}`);
    console.log(`  Blackjack Score: ${blackjackScore.intrinsicScore}`);
    console.log(`  Signal: ${blackjackScore.signal}`);
    console.log(`  Price Change: ${(blackjackScore.components.priceChange * 100).toFixed(2)}%`);
  });
}

/**
 * Example: Build cumulative Blackjack scores over time
 */
export function buildCumulativeScores(candles: Candle[]): BlackjackScore[] {
  const scores: BlackjackScore[] = [];
  let cumulativeTotal = 0;
  
  for (let i = 0; i < candles.length; i++) {
    const stepCandles = [candles[i]];
    const score = calcStepBlackjack(stepCandles);
    
    // Update cumulative total
    cumulativeTotal += score.intrinsicScore;
    
    // Create new score with updated cumulative
    scores.push({
      ...score,
      cumulativeScore: cumulativeTotal,
      signal: getBlackjackSignal(cumulativeTotal)
    });
  }
  
  return scores;
}

/**
 * Example: Find Goldmine signal opportunities
 */
export function findGoldmineSignals(candles: Candle[]) {
  const scores = buildCumulativeScores(candles);
  const signals: { index: number; type: 'LONG' | 'SHORT'; score: number }[] = [];
  
  scores.forEach((score, index) => {
    if (score.signal !== 'NEUTRAL') {
      // Check if this is a new signal (different from previous)
      const prevSignal = index > 0 ? scores[index - 1].signal : 'NEUTRAL';
      if (score.signal !== prevSignal) {
        signals.push({
          index,
          type: score.signal as 'LONG' | 'SHORT',
          score: score.cumulativeScore
        });
      }
    }
  });
  
  console.log(`Found ${signals.length} Goldmine signals:`);
  signals.forEach(signal => {
    console.log(`  ${signal.type} signal at candle ${signal.index} (score: ${signal.score})`);
  });
  
  return signals;
}
