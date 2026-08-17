// assay/kernel/metrics.ts
// Metric owners — every formula lives here once (predecessor lesson: duplicates diverge).
// Sequential left-folds only; annualization always via declared periodsPerYear; refusals, never NaN.

import { refuse, type Outcome } from './refusal.ts';
import { type Span } from './span.ts';

/** Total return over an equity path in micros. Requires >=2 points and a positive start. */
export function totalReturn(equityMicros: readonly number[]): Outcome<number> {
  if (equityMicros.length < 2) return refuse('insufficient_history', `equity path has ${equityMicros.length} points`);
  const first = equityMicros[0]!;
  const last = equityMicros[equityMicros.length - 1]!;
  if (first <= 0) return refuse('invalid_params', `starting equity ${first} must be positive`);
  return last / first - 1;
}

/** CAGR from a basis-typed TRADING span and a DECLARED periodsPerYear — no constant in the kernel. */
export function cagr(totalRet: number, tradingSpan: Span<'TRADING'>, periodsPerYear: number): Outcome<number> {
  if (!Number.isFinite(totalRet) || totalRet <= -1) return refuse('invalid_params', `total return ${totalRet}`);
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    return refuse('invalid_params', `periodsPerYear ${periodsPerYear} must be positive and declared`);
  }
  if (tradingSpan.count === 0) return refuse('insufficient_history', 'zero-length span');
  const years = tradingSpan.count / periodsPerYear;
  return Math.pow(1 + totalRet, 1 / years) - 1;
}

export interface DrawdownReport {
  readonly magnitude: number; // fraction, >= 0
  readonly peakIndex: number;
  readonly troughIndex: number;
}

/** Max drawdown with the adverse-excursion path named. Zero for monotone-rising series. */
export function maxDrawdown(equityMicros: readonly number[]): Outcome<DrawdownReport> {
  if (equityMicros.length === 0) return refuse('insufficient_history', 'empty equity path');
  let peak = equityMicros[0]!;
  let peakIdx = 0;
  let worst = 0;
  let worstPeak = 0;
  let worstTrough = 0;
  for (let i = 0; i < equityMicros.length; i++) {
    const v = equityMicros[i]!;
    if (v <= 0) return refuse('invalid_params', `equity ${v} at index ${i} must be positive`);
    if (v > peak) {
      peak = v;
      peakIdx = i;
    }
    const dd = (peak - v) / peak;
    if (dd > worst) {
      worst = dd;
      worstPeak = peakIdx;
      worstTrough = i;
    }
  }
  return { magnitude: worst, peakIndex: worstPeak, troughIndex: worstTrough };
}

export interface ClosedPosition {
  readonly symbol: string;
  readonly openFillId: string;
  readonly closeFillId: string;
  readonly pnlMicros: number;
}

export interface WinRateReport {
  readonly population: number; // declared: closed positions only
  readonly winRate: number;
  readonly lossRate: number;
  readonly scratchRate: number;
}

/** Win rate with its population declared. Empty population refuses — never 0/0. */
export function winRate(closed: readonly ClosedPosition[]): Outcome<WinRateReport> {
  if (closed.length === 0) return refuse('empty_population', 'no closed positions');
  let wins = 0;
  let losses = 0;
  let scratches = 0;
  for (const p of closed) {
    if (p.pnlMicros > 0) wins++;
    else if (p.pnlMicros < 0) losses++;
    else scratches++;
  }
  const n = closed.length;
  return { population: n, winRate: wins / n, lossRate: losses / n, scratchRate: scratches / n };
}

/** Sharpe-style ratio with every convention declared; sequential folds, no hidden annualization. */
export function ratio(
  periodReturns: readonly number[],
  periodsPerYear: number,
  riskFreePerPeriod: number
): Outcome<number> {
  if (periodReturns.length < 2) return refuse('insufficient_history', `${periodReturns.length} period returns`);
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) {
    return refuse('invalid_params', `periodsPerYear ${periodsPerYear}`);
  }
  let sum = 0;
  for (const r of periodReturns) {
    if (!Number.isFinite(r)) return refuse('non_finite_number', `period return ${r}`);
    sum = sum + (r - riskFreePerPeriod);
  }
  const mean = sum / periodReturns.length;
  let ss = 0;
  for (const r of periodReturns) {
    const d = r - riskFreePerPeriod - mean;
    ss = ss + d * d;
  }
  const sd = Math.sqrt(ss / (periodReturns.length - 1));
  if (sd === 0) return refuse('invalid_params', 'zero dispersion — ratio undefined');
  return (mean / sd) * Math.sqrt(periodsPerYear);
}
