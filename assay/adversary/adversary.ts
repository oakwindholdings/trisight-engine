// assay/adversary/adversary.ts
// The paid refuter (I5): every result gets a named worst slice or it stays unverified.
// Uses the same kernel owners — an adversary with its own formulas would just be a second liar.

import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';
import { type Hash, contentHash } from '../kernel/canonical.ts';
import { loadAsOf, loadUniverse, type AsOfSeries, type Bar } from '../kernel/bars.ts';
import { evaluate } from '../kernel/evaluate.ts';
import { getObject, putRecord, recordsOfType, type StoreRoot } from '../substrate/store.ts';
import { type RunRecord, type ResultRecord, type EvaluateParamsRecord } from '../substrate/invoke.ts';
import { type DataSnapshot } from '../substrate/ingress.ts';

export interface Slice {
  readonly id: string;
  readonly kind: 'fold' | 'symbol' | 'return_magnitude_regime';
  readonly def: string;
  readonly totalReturn: number | 'REFUSED'; // never an imputed 0 (I6 — Forge finding 3)
  readonly refusal_reason: string | null;
}

export interface AdversaryReport {
  readonly record_type: 'Adversary';
  readonly result_hash: Hash;
  readonly headlineReturn: number;
  readonly thresholdMateriality: number; // declared: worst is material when headline - worst >= this
  readonly slices: readonly Slice[];
  readonly worst: Slice;
  readonly materially_worse: boolean;
}

function findRunForResult(root: StoreRoot, result_hash: Hash): Outcome<RunRecord> {
  const runs = recordsOfType(root, 'Run');
  if (isRefused(runs)) return runs;
  for (const r of runs) {
    const run = r.value as RunRecord;
    if (run.output_hash === result_hash) return run;
  }
  return refuse('unknown_object', `no Run produced result ${result_hash}`);
}

function loadSeries(root: StoreRoot, hashes: readonly Hash[], endT: number): Outcome<Map<string, AsOfSeries>> {
  const series = new Map<string, AsOfSeries>();
  for (const h of hashes) {
    const obj = getObject(root, h);
    if (isRefused(obj)) return obj;
    const snap = obj as DataSnapshot;
    if (snap?.record_type !== 'DataSnapshot' || snap.provenance !== 'vendor' || !Array.isArray(snap.bars)) {
      return refuse('invalid_params', `${h} is not a well-formed vendor DataSnapshot — fixtures cannot enter adversarial review`);
    }
    const bars: Bar[] = snap.bars.filter((b) => b.t <= endT);
    const s = loadAsOf(snap.symbol, endT, bars);
    if (isRefused(s)) return s;
    series.set(snap.symbol, s);
  }
  return series;
}

/** Deterministic slice enumeration; worst = minimum total return across every MEASURED slice.
 *  thresholdMateriality is a declared input recorded in the report, not a buried constant. */
export function runAdversary(
  root: StoreRoot,
  result_hash: Hash,
  thresholdMateriality = 0.005
): Outcome<{ hash: Hash; report: AdversaryReport }> {
  const resultObj = getObject(root, result_hash);
  if (isRefused(resultObj)) return resultObj;
  const result = resultObj as ResultRecord;
  if (result.outcome.kind !== 'result') {
    return refuse('invalid_params', `result ${result_hash} is a refusal (${result.outcome.reason}) — nothing to slice`);
  }
  const run = findRunForResult(root, result_hash);
  if (isRefused(run)) return run;
  const paramsObj = getObject(root, run.params_hash);
  if (isRefused(paramsObj)) return paramsObj;
  const params = paramsObj as EvaluateParamsRecord;

  const slices: Slice[] = [];

  // 1) fold slices — already kernel-computed inside the result
  for (let i = 0; i < result.outcome.folds.length; i++) {
    const f = result.outcome.folds[i]!;
    slices.push({
      id: `fold-${i}`,
      kind: 'fold',
      def: `window ${f.startT}..${f.endT}`,
      totalReturn: f.totalReturn,
      refusal_reason: null,
    });
  }

  // 2) symbol slices — same kernel, universe restricted to one symbol
  const series = loadSeries(root, run.snapshot_hashes, params.window.endT);
  if (isRefused(series)) return series;
  for (const sym of params.spec.universe) {
    const s = series.get(sym);
    if (s === undefined) continue;
    const single = new Map<string, AsOfSeries>([[sym, s]]);
    const uni = loadUniverse(params.window.endT, single);
    if (isRefused(uni)) return uni;
    const soloSpec = { ...params.spec, universe: [sym] as readonly string[] };
    const solo = evaluate(soloSpec, uni, params.frictions, params.window, params.evalParams);
    if (isRefused(solo)) {
      // a refusal is recorded AS a refusal — it never becomes a number, and never becomes 'worst'
      slices.push({ id: `symbol-${sym}`, kind: 'symbol', def: `universe restricted to ${sym}`, totalReturn: 'REFUSED', refusal_reason: solo.reason });
      continue;
    }
    slices.push({ id: `symbol-${sym}`, kind: 'symbol', def: `universe restricted to ${sym}`, totalReturn: solo.headline.totalReturn, refusal_reason: null });
  }

  // 3) volatility-regime slices — fold dispersion of fold returns split at median |return|
  const foldRets = result.outcome.folds.map((f, i) => ({ i, r: f.totalReturn, mag: Math.abs(f.totalReturn) }));
  if (foldRets.length >= 2) {
    const sortedMags = [...foldRets].sort((a, b) => a.mag - b.mag).map((x) => x.mag);
    const median = sortedMags[Math.floor(sortedMags.length / 2)]!;
    const high = foldRets.filter((x) => x.mag >= median);
    const low = foldRets.filter((x) => x.mag < median);
    for (const [name, group] of [
      ['high_activity', high],
      ['low_activity', low],
    ] as const) {
      if (group.length === 0) continue;
      let growth = 1;
      for (const g of group) growth = growth * (1 + g.r);
      slices.push({
        id: `regime-${name}`,
        kind: 'return_magnitude_regime',
        def: `folds [${group.map((g) => g.i).join(',')}] by |fold return| vs median`,
        totalReturn: growth - 1,
        refusal_reason: null,
      });
    }
  }

  if (slices.length === 0) return refuse('insufficient_history', 'no slices could be enumerated');

  // only measured slices compete for 'worst' — a refusal never impersonates a number (I6)
  const scored = slices.filter((s): s is Slice & { totalReturn: number } => typeof s.totalReturn === 'number');
  if (scored.length === 0) return refuse('empty_population', 'every slice refused — no worst slice exists');
  let worst = scored[0]!;
  for (const s of scored) if (s.totalReturn < worst.totalReturn) worst = s;

  const report: AdversaryReport = {
    record_type: 'Adversary',
    result_hash,
    headlineReturn: result.outcome.headline.totalReturn,
    thresholdMateriality,
    slices,
    worst,
    materially_worse: result.outcome.headline.totalReturn - worst.totalReturn >= thresholdMateriality,
  };
  const hash = putRecord(root, 'Adversary', report as unknown as Record<string, unknown>);
  if (isRefused(hash)) return hash;
  const check = contentHash(report);
  if (isRefused(check)) return check;
  return { hash, report };
}
