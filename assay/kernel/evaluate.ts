// assay/kernel/evaluate.ts
// (spec, AsOf bars, frictions) -> Result | Refused. Walk-forward; each fold sees only its own past.
// Pure and total: refusals are values; every reduction is a fixed-order left fold.

import { refuse, type Outcome, isRefused } from './refusal.ts';
import { type AsOfUniverse, type AsOfSeries, restrictTo, loadUniverse } from './bars.ts';
import { type Spec } from './spec.ts';
import { simulate, type Decision, type Frictions } from './sim.ts';
import { totalReturn, maxDrawdown, cagr, winRate, type WinRateReport, type DrawdownReport, type ClosedPosition } from './metrics.ts';
import { span } from './span.ts';
import { mulMicros } from './micros.ts';

export interface EvalWindow {
  readonly startT: number;
  readonly endT: number;
}

export interface EvalParams {
  readonly initialCashMicros: number;
  readonly foldCount: number;
}

export interface FoldReport {
  readonly startT: number;
  readonly endT: number;
  readonly totalReturn: number;
  readonly drawdown: DrawdownReport;
  readonly fillCount: number;
  readonly closedCount: number;
  readonly finalEquityMicros: number;
}

export interface EvalResult {
  readonly kind: 'result';
  readonly window: EvalWindow;
  readonly foldCount: number;
  readonly folds: readonly FoldReport[];
  readonly headline: {
    readonly totalReturn: number;
    readonly cagrValue: number;
    readonly maxDrawdownMagnitude: number;
    readonly tradingDays: number;
    readonly periodsPerYear: number;
  };
  readonly winRateReport: WinRateReport | null;
  readonly notes: readonly string[];
}

/** Generate decisions for one symbol from an SMA-cross spec. Sees only the AsOf series it is given. */
export function computeDecisions(
  spec: Spec,
  series: AsOfSeries,
  windowStartT: number,
  windowEndT: number
): Outcome<Decision[]> {
  const { fast, slow } = spec.signal;
  // Forge finding 8 (proven): Spec is structural, so a forged spec can bypass validateSpec.
  // The precondition the rolling-sum math depends on is re-checked here, in the kernel.
  if (!Number.isInteger(fast) || fast < 1 || !Number.isInteger(slow) || slow <= fast) {
    return refuse('invalid_params', `sma_cross requires 1 <= fast < slow, got fast=${fast} slow=${slow}`);
  }
  if (series.length < slow + 1) {
    return refuse('insufficient_history', `${series.symbol}: ${series.length} bars < lookback ${slow + 1}`);
  }
  const closes: number[] = [];
  const times: number[] = [];
  for (let i = 0; i < series.length; i++) {
    const b = series.bar(i);
    if (isRefused(b)) return b;
    closes.push(b.cMicros);
    times.push(b.t);
  }
  const decisions: Decision[] = [];
  let heldShares = 0;
  let seq = 0;
  // fixed-order rolling sums; comparison in cross-multiplied integer space (no float SMA)
  let sumFast = 0;
  let sumSlow = 0;
  for (let i = 0; i < closes.length; i++) {
    sumFast += closes[i]!;
    if (i >= fast) sumFast -= closes[i - fast]!;
    sumSlow += closes[i]!;
    if (i >= slow) sumSlow -= closes[i - slow]!;
    if (i < slow) continue; // need full windows for both SMAs at i and i-1
    const prevFast = sumFast - closes[i]! + (i - fast >= 0 ? closes[i - fast]! : 0);
    const prevSlow = sumSlow - closes[i]! + (i - slow >= 0 ? closes[i - slow]! : 0);
    const nowUp = mulMicros(sumFast, slow, 'sma cmp');
    const nowDn = mulMicros(sumSlow, fast, 'sma cmp');
    const beforeUp = mulMicros(prevFast, slow, 'sma cmp');
    const beforeDn = mulMicros(prevSlow, fast, 'sma cmp');
    if (isRefused(nowUp)) return nowUp;
    if (isRefused(nowDn)) return nowDn;
    if (isRefused(beforeUp)) return beforeUp;
    if (isRefused(beforeDn)) return beforeDn;
    const t = times[i]!;
    if (t < windowStartT || t > windowEndT) continue;
    const crossUp = nowUp > nowDn && beforeUp <= beforeDn;
    const crossDown = nowUp < nowDn && beforeUp >= beforeDn;
    const hasNextBar = i + 1 < closes.length;
    if (crossUp && heldShares === 0) {
      const price = closes[i]!;
      if (price <= 0) continue;
      const shares = Math.floor(spec.sizing.cashMicros / price);
      if (shares <= 0) continue;
      decisions.push({ id: `D${series.symbol}-${String(seq++).padStart(4, '0')}`, t, symbol: series.symbol, action: 'BUY', shares });
      if (hasNextBar) heldShares = shares; // fill lands only if a next bar exists
    } else if (crossDown && heldShares > 0) {
      decisions.push({ id: `D${series.symbol}-${String(seq++).padStart(4, '0')}`, t, symbol: series.symbol, action: 'SELL', shares: heldShares });
      if (hasNextBar) heldShares = 0;
    }
  }
  return decisions;
}

/** Walk-forward evaluation. Folds partition the window; fold f's data is restricted as-of fold end (I2). */
export function evaluate(
  spec: Spec,
  universe: AsOfUniverse,
  frictions: Frictions,
  window: EvalWindow,
  params: EvalParams
): Outcome<EvalResult> {
  if (window.startT >= window.endT) return refuse('invalid_params', `window ${window.startT}..${window.endT}`);
  if (!Number.isInteger(params.foldCount) || params.foldCount < 1) {
    return refuse('invalid_params', `foldCount ${params.foldCount}`);
  }
  if (universe.asOf < window.endT) {
    return refuse('missing_data', `universe asOf ${universe.asOf} < window end ${window.endT}`);
  }
  for (const s of spec.universe) {
    const got = universe.series(s);
    if (isRefused(got)) return refuse('partial_universe', `spec symbol ${s} missing from universe`);
  }

  const width = Math.floor((window.endT - window.startT) / params.foldCount);
  const folds: FoldReport[] = [];
  const allClosed: ClosedPosition[] = [];
  const notes: string[] = [];
  const tradingDaySet = new Set<number>();

  for (let f = 0; f < params.foldCount; f++) {
    const fStart = window.startT + f * width;
    const fEnd = f === params.foldCount - 1 ? window.endT : window.startT + (f + 1) * width - 1;

    // point-in-time: restrict every series to the fold end before anything computes
    const restricted = new Map<string, AsOfSeries>();
    for (const s of spec.universe) {
      const full = universe.series(s);
      if (isRefused(full)) return full;
      const r = restrictTo(full, fEnd);
      if (isRefused(r)) return r;
      restricted.set(s, r);
    }
    const foldUniverse = loadUniverse(fEnd, restricted);
    if (isRefused(foldUniverse)) return foldUniverse;

    // Forge finding 10: the risk cap must bind in CHRONOLOGICAL order across symbols,
    // and a BUY suppressed by the cap must suppress its paired SELL — never orphan a SELL.
    const perSymbol: Decision[] = [];
    for (const s of spec.universe) {
      const series = foldUniverse.series(s);
      if (isRefused(series)) return series;
      const d = computeDecisions(spec, series, fStart, fEnd);
      if (isRefused(d)) return d;
      perSymbol.push(...d);
    }
    const merged = perSymbol.sort((a, b) => (a.t - b.t !== 0 ? a.t - b.t : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const decisions: Decision[] = [];
    const openSymbols = new Set<string>();
    for (const dec of merged) {
      if (dec.action === 'BUY') {
        if (openSymbols.size >= spec.risk.maxOpenPositions) continue; // paired SELL suppressed below
        openSymbols.add(dec.symbol);
      } else {
        if (!openSymbols.has(dec.symbol)) continue; // a dropped BUY never leaves an orphaned SELL
        openSymbols.delete(dec.symbol);
      }
      decisions.push(dec);
    }

    const ledger = simulate(foldUniverse, decisions, frictions, params.initialCashMicros);
    if (isRefused(ledger)) return ledger;

    const foldEquity = ledger.equityPath.filter((p) => p.t >= fStart && p.t <= fEnd);
    if (foldEquity.length < 2) return refuse('insufficient_history', `fold ${f}: ${foldEquity.length} equity points`);
    for (const p of foldEquity) tradingDaySet.add(p.t);
    const eq = foldEquity.map((p) => p.equityMicros);
    const tr = totalReturn(eq);
    if (isRefused(tr)) return tr;
    const dd = maxDrawdown(eq);
    if (isRefused(dd)) return dd;
    allClosed.push(...ledger.closedPositions);
    if (ledger.unfilled.length > 0) notes.push(`fold ${f}: ${ledger.unfilled.length} unfilled decisions`);
    folds.push({
      startT: fStart,
      endT: fEnd,
      totalReturn: tr,
      drawdown: dd,
      fillCount: ledger.fills.length,
      closedCount: ledger.closedPositions.length,
      finalEquityMicros: eq[eq.length - 1]!,
    });
  }

  // headline: multiplicative composition across folds, fixed order
  let growth = 1;
  for (const f of folds) growth = growth * (1 + f.totalReturn);
  const headlineReturn = growth - 1;
  const tradingDays = tradingDaySet.size;
  const tSpan = span('TRADING', tradingDays);
  if (isRefused(tSpan)) return tSpan;
  const cg = cagr(headlineReturn, tSpan, frictions.periodsPerYear);
  if (isRefused(cg)) return cg;
  let worstDd = 0;
  for (const f of folds) worstDd = Math.max(worstDd, f.drawdown.magnitude);

  let wr: WinRateReport | null = null;
  if (allClosed.length > 0) {
    const w = winRate(allClosed);
    if (isRefused(w)) return w;
    wr = w;
  } else {
    notes.push('no_closed_positions: win rate population empty — reported as null, never 0/0');
  }

  return {
    kind: 'result',
    window,
    foldCount: params.foldCount,
    folds,
    headline: {
      totalReturn: headlineReturn,
      cagrValue: cg,
      maxDrawdownMagnitude: worstDd,
      tradingDays,
      periodsPerYear: frictions.periodsPerYear,
    },
    winRateReport: wr,
    notes,
  };
}
