// src/patternEngine/blackjack.ts
// Blackjack pattern detection logic
// Integrates with patternEngine for equity analysis

import { Candle, BlackjackScore } from '../types/pattern';
import { BJ_GOLD_THRESHOLD_LONG, BJ_GOLD_THRESHOLD_SHORT } from '../constants/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';
import { emitTradeBiasSignal } from '../utils/trading/TradeActionSignal';

// Define functions without export

function calculateATR(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 0;
  let sum = 0;
  const actualPeriod = Math.min(period, candles.length - 1);
  for (let i = 1; i <= actualPeriod; i++) {
    sum += Math.max(candles[i].high - candles[i].low, Math.abs(candles[i].high - candles[i-1].close), Math.abs(candles[i].low - candles[i-1].close));
  }
  return sum / actualPeriod;
}

function getIntrinsicScore(candle: Candle, prevCandle: Candle): -1 | 0 | 1 {
  const haCandles = convertToHeikinAshi([prevCandle, candle]);
  const haPrev = haCandles[0];
  const haCurrent = haCandles[1];
  const priceUp = haCurrent.close > haPrev.close;
  const priceDown = haCurrent.close < haPrev.close;
  const volumeUp = candle.volume > prevCandle.volume;
  const atr = calculateATR([prevCandle, candle]);
  const volatility = (candle.high - candle.low) / candle.close;
  const atrThreshold = 0.01;
  if (process.env.NODE_ENV === 'development') {
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
  }
  if (priceUp && volumeUp && volatility < atrThreshold) return 1;
  if (priceDown && volumeUp) return -1;
  return 0;
}

function calcStepBlackjack(stepCandles: Candle[]): BlackjackScore {
  if (stepCandles.length < 2) {
    return { timestamp: new Date(), intrinsicScore: 0, cumulativeScore: 0, components: { priceChange: 0, volumeRatio: 0, momentum: 0, volatility: 0 }, signal: 'NEUTRAL' };
  }
  const haCandles = convertToHeikinAshi(stepCandles);
  const haFirst = haCandles[0];
  const haSecond = haCandles[1];
  const firstCandle = stepCandles[0];
  const secondCandle = stepCandles[1];
  const firstIntrinsic = haFirst.close > haFirst.open ? 1 : haFirst.close < haFirst.open ? -1 : 0;
  const secondIntrinsic = getIntrinsicScore(secondCandle, firstCandle);
  const cumulativeScore = firstIntrinsic + secondIntrinsic;
  const intrinsicScore = secondIntrinsic;
  const priceChange = (haSecond.close - haFirst.open) / haFirst.open;
  const volatility = Math.max((haFirst.high - haFirst.low) / haFirst.open, (haSecond.high - haSecond.low) / haSecond.open);
  if (process.env.NODE_ENV === 'development') {
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
  }
  return {
    timestamp: new Date(secondCandle.datetime),
    intrinsicScore,
    cumulativeScore,
    components: { priceChange, volumeRatio: 1.0, momentum: priceChange, volatility },
    signal: getBlackjackSignal(cumulativeScore)
  };
}

function computeTargetBlackjackScore(candles: Candle[], startIndex: number, endIndex: number): number {
  if (!candles || candles.length === 0 || endIndex <= startIndex) return 0;
  const relevantCandles = candles.slice(startIndex, endIndex + 1);
  const haCandles = convertToHeikinAshi(relevantCandles);
  let score = 0;
  for (let i = 1; i < haCandles.length; i++) {
    const haPrev = haCandles[i - 1];
    const haCurrent = haCandles[i];
    const origPrev = relevantCandles[i - 1];
    const origCurrent = relevantCandles[i];
    const priceUp = haCurrent.close > haPrev.close;
    const priceDown = haCurrent.close < haPrev.close;
    const volumeUp = origCurrent.volume > origPrev.volume;
    if (priceUp && volumeUp) score += 1;
    else if (priceDown && volumeUp) score -= 1;
  }
  if (process.env.NODE_ENV === 'development') {
    logDebug('DEBUG_PATTERN_DETECT', '[HA Target Blackjack Scoring]', { startIndex, endIndex, candleCount: relevantCandles.length, finalScore: score, dickOLearyCompliant: true });
  }
  return score;
}

function computeRollingBlackjackScores(candles: Candle[], window: number = 5): { timestamp: number; score: number }[] {
  if (!candles || candles.length === 0) return [];
  const intrinsic: number[] = new Array(candles.length).fill(0);
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    const priceUp = curr.close > prev.close;
    const priceDown = curr.close < prev.close;
    const volumeUp = curr.volume > prev.volume;
    if (priceUp && volumeUp) intrinsic[i] = 1;
    else if (priceDown && volumeUp) intrinsic[i] = -1;
    else intrinsic[i] = 0;
  }
  const rolling: { timestamp: number; score: number }[] = [];
  for (let i = 0; i < candles.length; i++) {
    let sum = 0;
    for (let j = Math.max(0, i - window + 1); j <= i; j++) {
      sum += intrinsic[j];
    }
    rolling.push({ timestamp: candles[i].timestamp ?? i, score: sum });
  }
  if (process.env.NODE_ENV === 'development') {
    logDebug('DEBUG_PATTERN_DETECT', '[Blackjack] Rolling Score Calculated:', { window, firstFive: rolling.slice(0, 5) });
  }
  return rolling;
}

function getBlackjackSignal(cumulativeScore: number): 'LONG' | 'SHORT' | 'NEUTRAL' {
  if (cumulativeScore >= BJ_GOLD_THRESHOLD_LONG) return 'LONG';
  if (cumulativeScore <= BJ_GOLD_THRESHOLD_SHORT) return 'SHORT';
  return 'NEUTRAL';
}

function emitBlackjackBiasSignal(cumulativeScore: number, candle: any, confidence: number, reason: string): any {
  const bias = cumulativeScore > 0 ? 'LONG' : 'SHORT';
  return emitTradeBiasSignal('BLACKJACK', confidence, candle.close, new Date(candle.timestamp), bias, reason, { candleIndex: candle.index, riskLevel: 'MEDIUM' });
}

function detectBlackjackTradeSignals(candles: Candle[]) {
  if (!candles || candles.length < 5) return [];
  const heikinAshiCandles = convertToHeikinAshi(candles);
  const rollingScores = computeRollingBlackjackScores(heikinAshiCandles, 5);
  const signals: any[] = [];
  let lastBiasSignalIndex = -1;
  const minSignalGap = 5;
  for (let i = 1; i < Math.min(heikinAshiCandles.length, rollingScores.length); i++) {
    const candle = heikinAshiCandles[i];
    const cumulativeScore = rollingScores[i].score;
    if (Math.abs(cumulativeScore) >= 3 && (i - lastBiasSignalIndex) >= minSignalGap) {
      const confidence = Math.min(0.7 + (Math.abs(cumulativeScore) - 3) * 0.05, 0.90);
      const reason = `BJ Score: ${cumulativeScore} (${cumulativeScore > 0 ? 'BULLISH' : 'BEARISH'} BIAS)`;
      signals.push(emitBlackjackBiasSignal(cumulativeScore, { ...candle, index: i }, confidence, reason));
      lastBiasSignalIndex = i;
      if (process.env.DEBUG_BLACKJACK_SIGNALS) {
        logDebug('DEBUG_PATTERN_DETECT', `🎯 Blackjack BIAS Signal: Score=${cumulativeScore}, Confidence=${confidence.toFixed(2)}, Price=${candle.close}, Index=${i}, Bias=${cumulativeScore > 0 ? 'LONG' : 'SHORT'}`);
      }
    }
  }
  if (process.env.DEBUG_BLACKJACK_SIGNALS && signals.length > 0) {
    logDebug('DEBUG_PATTERN_DETECT', `🔍 Blackjack BIAS Summary: ${signals.length} bias signals emitted, Non-executional mode, Deduplication active (${minSignalGap} candle gap)`);
  }
  return signals;
}

// Named exports at end
export { getIntrinsicScore, calcStepBlackjack, computeTargetBlackjackScore, computeRollingBlackjackScores, getBlackjackSignal, emitBlackjackBiasSignal, detectBlackjackTradeSignals };
