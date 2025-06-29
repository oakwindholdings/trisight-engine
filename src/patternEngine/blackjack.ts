// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.
// src/patternEngine/blackjack.ts
// Implements Intrinsic and Cumulative Blackjack scoring for Goldmine signal qualification
// Focuses on the first full Step candle for scoring
// NOTE: Debug channel support - DEBUG_PATTERN_DETECT
// DICK O'LEARY COMPLIANCE: Strict HA-only scoring logic - no OHLC substitution allowed

import { Candle, BlackjackScore } from '../types/pattern';
import { BJ_GOLD_THRESHOLD_LONG, BJ_GOLD_THRESHOLD_SHORT } from '../constants/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform'; // Enforce HA-only scoring
import { emitTradeSignal } from '../utils/trading/TradeActionSignal';

/**
 * Calculate the intrinsic score for a single candle based on price and volume
 * relationship compared to the previous candle.
 * DICK O'LEARY COMPLIANCE: Uses HA candle metrics exclusively for trend analysis
 * 
 * @param candle - The current candle to score
 * @param prevCandle - The previous candle for comparison
 * @returns +1 for Price↑ & Volume↑, -1 for Price↓ & Volume↑, 0 for mixed/other
 */
export function getIntrinsicScore(
  candle: Candle,
  prevCandle: Candle
): -1 | 0 | 1 {
  // DICK O'LEARY COMPLIANCE: Convert to HA candles for trend analysis
  const haCandles = convertToHeikinAshi([prevCandle, candle]);
  const haPrev = haCandles[0];
  const haCurrent = haCandles[1];
  
  // Use HA close for trend direction (smoother than OHLC)
  const priceUp = haCurrent.close > haPrev.close;
  const priceDown = haCurrent.close < haPrev.close;
  const volumeUp = candle.volume > prevCandle.volume; // Volume remains from original data
  
  // Log HA scoring analysis for debugging
  logDebug('DEBUG_PATTERN_DETECT', '[Blackjack HA Scoring]', {
    candleTimestamp: candle.timestamp,
    haCurrentClose: haCurrent.close.toFixed(4),
    haPrevClose: haPrev.close.toFixed(4),
    priceDirection: priceUp ? 'UP' : priceDown ? 'DOWN' : 'FLAT',
    volumeDirection: volumeUp ? 'UP' : 'DOWN',
    currentVolume: candle.volume,
    prevVolume: prevCandle.volume,
    dickOLearyCompliant: true
  });
  
  // Apply standardized Blackjack scoring rule using HA metrics
  if (priceUp && volumeUp) {
    return 1;  // HA Price↑ & Volume↑ = Bullish signal
  }
  
  if (priceDown && volumeUp) {
    return -1; // HA Price↓ & Volume↑ = Bearish signal (unusual volume with price decline)
  }
  
  // All other cases (HA Price↑ & Volume↓, HA Price↓ & Volume↓, HA Price flat, Volume flat) = 0
  return 0;
}

/**
 * Calculate the Blackjack score for step candles.
 * For Goldmine, sum the intrinsic scores of the first two reversal candles.
 * DICK O'LEARY COMPLIANCE: Uses HA candle metrics exclusively for trend analysis
 * 
 * @param stepCandles - Array of at least 2 candles for scoring
 * @returns BlackjackScore with intrinsic (candle #2) and cumulative (sum of candles #1 and #2)
 */
export function calcStepBlackjack(stepCandles: Candle[]): BlackjackScore {
  // Guard against insufficient input
  if (!stepCandles || stepCandles.length < 2) {
    return {
      timestamp: new Date(),
      intrinsicScore: 0,
      cumulativeScore: 0,
      components: {
        priceChange: 0,
        volumeRatio: 0,
        momentum: 0,
        volatility: 0
      },
      signal: 'NEUTRAL'
    };
  }
  
  // DICK O'LEARY COMPLIANCE: Convert to HA candles for all scoring analysis
  const haCandles = convertToHeikinAshi(stepCandles);
  const haFirst = haCandles[0];
  const haSecond = haCandles[1];
  
  // Get the first two candles (original for volume, HA for price/trend)
  const firstCandle = stepCandles[0];
  const secondCandle = stepCandles[1];
  
  // Calculate intrinsic scores for each candle using HA metrics
  // For the first candle, use HA body direction (close vs open)
  const firstIntrinsic = haFirst.close > haFirst.open ? 1 : 
                        haFirst.close < haFirst.open ? -1 : 0;
  
  // For the second candle, use the standardized HA price/volume rule
  const secondIntrinsic = getIntrinsicScore(secondCandle, firstCandle);
  
  // Cumulative score is the sum of the two intrinsic scores
  const cumulativeScore = firstIntrinsic + secondIntrinsic;
  
  // Use the second candle's intrinsic as the reported intrinsic score
  const intrinsicScore = secondIntrinsic;
  
  // Calculate components based on HA candles (Dick O'Leary compliance)
  const priceChange = (haSecond.close - haFirst.open) / haFirst.open;
  const volatility = Math.max(
    (haFirst.high - haFirst.low) / haFirst.open,
    (haSecond.high - haSecond.low) / haSecond.open
  );
  
  // Log HA Blackjack scoring for debugging
  logDebug('DEBUG_PATTERN_DETECT', '[HA Blackjack Step Scoring]', {
    stepLength: stepCandles.length,
    haFirstClose: haFirst.close.toFixed(4),
    haFirstOpen: haFirst.open.toFixed(4),
    haSecondClose: haSecond.close.toFixed(4),
    firstIntrinsic,
    secondIntrinsic,
    cumulativeScore,
    priceChange: (priceChange * 100).toFixed(2) + '%',
    volatility: (volatility * 100).toFixed(2) + '%',
    dickOLearyCompliant: true
  });
  
  return {
    timestamp: new Date(secondCandle.datetime),
    intrinsicScore,
    cumulativeScore,
    components: {
      priceChange,
      volumeRatio: 1.0,
      momentum: priceChange,
      volatility
    },
    signal: getBlackjackSignal(cumulativeScore)
  };
}

/**
 * Compute cumulative Blackjack score for an Escalator step between start & breakout candles (inclusive).
 * DICK O'LEARY COMPLIANCE: Uses HA candle metrics exclusively for trend analysis
 */
export function computeTargetBlackjackScore(
  candles: Candle[],
  startIndex: number,
  endIndex: number
): number {
  if (!candles || candles.length === 0) return 0;
  if (endIndex <= startIndex) return 0;

  // DICK O'LEARY COMPLIANCE: Convert candle range to HA for scoring
  const relevantCandles = candles.slice(startIndex, endIndex + 1);
  const haCandles = convertToHeikinAshi(relevantCandles);

  let score = 0;
  for (let i = 1; i < haCandles.length; i++) {
    const haPrev = haCandles[i - 1];
    const haCurrent = haCandles[i];
    const origPrev = relevantCandles[i - 1];
    const origCurrent = relevantCandles[i];

    // Use HA candles for price trend analysis
    const priceUp = haCurrent.close > haPrev.close;
    const priceDown = haCurrent.close < haPrev.close;
    // Volume remains from original data
    const volumeUp = origCurrent.volume > origPrev.volume;

    if (priceUp && volumeUp) score += 1;
    else if (priceDown && volumeUp) score -= 1;
    // else 0, no change
  }

  // Log HA Target scoring for debugging
  logDebug('DEBUG_PATTERN_DETECT', '[HA Target Blackjack Scoring]', {
    startIndex,
    endIndex,
    candleCount: relevantCandles.length,
    finalScore: score,
    dickOLearyCompliant: true
  });

  return score;
}

/**
 * Helper function to determine if a cumulative score triggers a signal
 * @param cumulativeScore - The cumulative blackjack score
 * @returns 'LONG' if score >= threshold, 'SHORT' if score <= threshold, 'NEUTRAL' otherwise
 */
export function computeRollingBlackjackScores(
  candles: Candle[],
  window: number = 5
): { timestamp: number; score: number }[] {
  if (!candles || candles.length === 0) return [];
  // Intrinsic per-candle (+1/0/-1) relative to previous candle
  const intrinsic: number[] = new Array(candles.length).fill(0);

  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const priceUp = curr.close > prev.close;
    const priceDown = curr.close < prev.close;
    // Treat flat volume as volume down (per spec)
    const volumeUp = curr.volume > prev.volume;
    const volumeDown = curr.volume < prev.volume; // flat will be false for both

    if (priceUp && volumeUp) intrinsic[i] = 1;
    else if (priceDown && volumeUp) intrinsic[i] = -1;
    else intrinsic[i] = 0;
  }

  // Rolling sum
  const rolling: { timestamp: number; score: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    let sum = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += intrinsic[j];
    }
    rolling.push({ timestamp: candles[i].timestamp ?? (candles[i] as any).datetime ?? i, score: sum });
  }

  logDebug('DEBUG_PATTERN_DETECT', '[Blackjack] Rolling Score Calculated:', {
    window,
    firstFive: rolling.slice(0, 5)
  });

  return rolling;
}

export function getBlackjackSignal(cumulativeScore: number): 'LONG' | 'SHORT' | 'NEUTRAL' {
  if (cumulativeScore >= BJ_GOLD_THRESHOLD_LONG) {
    return 'LONG';
  }
  if (cumulativeScore <= BJ_GOLD_THRESHOLD_SHORT) {
    return 'SHORT';
  }
  return 'NEUTRAL';
}

// ─────────────────────────────────────────────────────────────
// TriSight Blackjack → TradeAction Signal Integration
// Pattern : Blackjack
// Purpose : Emit BUY/SHORT signals based on cumulative score logic
// Note    : Self-contained signal emitter with momentum-based thresholds
// ─────────────────────────────────────────────────────────────

/**
 * Emit BUY/SHORT trade signals for Blackjack momentum patterns
 */
export function detectBlackjackTradeSignals(candles: Candle[]) {
  if (!candles || candles.length < 5) return [];
  
  // Convert to Heikin-Ashi for Dick O'Leary methodology compliance
  const heikinAshiCandles = convertToHeikinAshi(candles);
  
  // Calculate rolling Blackjack scores using existing function
  const rollingScores = computeRollingBlackjackScores(heikinAshiCandles, 5);
  
  const signals: any[] = [];
  
  // Deduplication state tracking
  let lastBuySignalIndex = -1;
  let lastShortSignalIndex = -1;
  const minSignalGap = 5; // Minimum 5 candles between signals
  
  // Detect signals based on cumulative score thresholds
  for (let i = 1; i < Math.min(heikinAshiCandles.length, rollingScores.length); i++) {
    const candle = heikinAshiCandles[i];
    const cumulativeScore = rollingScores[i].score;
    
    // 🔴 CRITICAL FIX: Inverted Blackjack signal logic for tactical entries
    // Strong bullish momentum (score >= 3) = SHORT at momentum peak (fade the strength)
    // Strong bearish momentum (score <= -3) = BUY at momentum trough (fade the weakness)
    
    // SHORT signal: Cumulative score >= 3 (strong bullish momentum - fade at peak)
    if (cumulativeScore >= 3 && (i - lastShortSignalIndex) >= minSignalGap) {
      const confidence = Math.min(0.8 + (cumulativeScore - 3) * 0.05, 0.95);
      const stopLoss = candle.high * 1.02; // 2% stop loss
      const targetPrice = candle.low * 0.94; // 6% target
      
      signals.push(emitTradeSignal(
        'SHORT' as any,
        'SHORT_ENTRY' as any,
        'BLACKJACK',
        confidence,
        candle.close,
        new Date(candle.timestamp),
        `BJ Score: ${cumulativeScore} (FADE BULLISH)`,
        { 
          stopLoss,
          targetPrice
        }
      ));
      
      lastShortSignalIndex = i; // Update deduplication tracker
      
      if (process.env.DEBUG_BLACKJACK_SIGNALS) {
        logDebug(`🎯 Blackjack SHORT Signal: Score=${cumulativeScore}, Confidence=${confidence.toFixed(2)}, Price=${candle.close}, Index=${i}, GapFromLast=${i - (lastShortSignalIndex - minSignalGap)}`);
      }
    }
    
    // BUY signal: Cumulative score <= -3 (strong bearish momentum - fade at trough)
    if (cumulativeScore <= -3 && (i - lastBuySignalIndex) >= minSignalGap) {
      const confidence = Math.min(0.8 + Math.abs(cumulativeScore + 3) * 0.05, 0.95);
      const stopLoss = candle.low * 0.98; // 2% stop loss
      const targetPrice = candle.high * 1.06; // 6% target
      
      signals.push(emitTradeSignal(
        'BUY' as any,
        'LONG_ENTRY' as any,
        'BLACKJACK',
        confidence,
        candle.close,
        new Date(candle.timestamp),
        `BJ Score: ${cumulativeScore} (FADE BEARISH)`,
        { 
          stopLoss,
          targetPrice
        }
      ));
      
      lastBuySignalIndex = i; // Update deduplication tracker
      
      if (process.env.DEBUG_BLACKJACK_SIGNALS) {
        logDebug(`🎯 Blackjack BUY Signal: Score=${cumulativeScore}, Confidence=${confidence.toFixed(2)}, Price=${candle.close}, Index=${i}, GapFromLast=${i - (lastBuySignalIndex - minSignalGap)}`);
      }
    }
  }
  
  // Enhanced debug logging for signal placement validation
  if (process.env.DEBUG_BLACKJACK_SIGNALS && signals.length > 0) {
    logDebug(`🔍 Blackjack Signal Summary: ${signals.length} signals emitted, Deduplication active (${minSignalGap} candle gap), Signal anchoring: momentum confirmation`);
  }
  
  return signals;
}
