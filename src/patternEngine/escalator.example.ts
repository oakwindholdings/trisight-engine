// src/patternEngine/escalator.example.ts
// Example usage of the detectEscalators function
// Demonstrates how to integrate with existing pattern detection

import { detectEscalators } from './escalator';
import { Candle } from '../types';
import { CandlestickData } from '../models/ChartTypes';

// Example: Converting CandlestickData to Candle type alias
function convertCandlestickData(data: CandlestickData[]): Candle[] {
  // Since Candle is just an alias for CandlestickData, no conversion needed
  return data;
}

// Example: Using detectEscalators in a pattern detection pipeline
export function detectPatternsExample(chartData: CandlestickData[]) {
  const candles = convertCandlestickData(chartData);
  
  // Detect escalator patterns with default settings
  const escalatorRuns = detectEscalators(candles);
  
  console.log(`Found ${escalatorRuns.length} escalator patterns`);
  
  // Process each detected run
  escalatorRuns.forEach((run, index) => {
    console.log(`Escalator ${index + 1}:`);
    console.log(`  Direction: ${run.direction}`);
    console.log(`  Range: candles ${run.startIndex} to ${run.endIndex}`);
    console.log(`  Steps: ${run.steps.length}`);
    console.log(`  Average step height: ${run.averageStepHeight.toFixed(2)}`);
    console.log(`  Consistency: ${(run.consistency * 100).toFixed(1)}%`);
  });
  
  // Example: Custom parameters
  const strictEscalators = detectEscalators(
    candles, 
    3,  // minLength: require at least 3 candles
    10  // maxStepBars: limit to 10 bars per step
  );
  
  return {
    escalators: escalatorRuns,
    strictEscalators
  };
}

// Example: Integration with pattern scoring
export function scoreEscalatorPattern(run: ReturnType<typeof detectEscalators>[0]) {
  // Base score from consistency
  let score = run.consistency;
  
  // Bonus for longer runs
  const lengthBonus = Math.min((run.endIndex - run.startIndex) / 10, 0.3);
  score += lengthBonus;
  
  // Penalty for very small average steps
  if (run.averageStepHeight < 0.001) {
    score *= 0.5;
  }
  
  return Math.min(score, 1.0); // Cap at 1.0
}
