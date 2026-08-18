// assay/phase3/sweep.ts
// Phase-3 population sweep: EVERY candidate pre-registered before ANY evaluation (ISC-161),
// identical frictions/window across the sweep, adversary for every result, survivors = verified only.
// The sweep report discloses the full population and failure distribution — no silent survivorship.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRefused } from '../kernel/refusal.ts';
import { validateSpec, specHash } from '../kernel/spec.ts';
import { validateFrictions } from '../kernel/sim.ts';
import { openStore, recordsOfType } from '../substrate/store.ts';
import { registerSpec, findRegistration } from '../substrate/registry.ts';
import { invokeEvaluate, type EvaluateParamsRecord } from '../substrate/invoke.ts';
import { runAdversary } from '../adversary/adversary.ts';
import { buildReceipt } from '../receipt/receipt.ts';
import { type DataSnapshot } from '../substrate/ingress.ts';
import { type Hash } from '../kernel/canonical.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSAY = join(HERE, '..');
const root = openStore(join(ASSAY, 'store-data'));

const FASTS = [5, 10, 15, 20, 30, 40];
const SLOWS = [20, 50, 100, 150, 200];
const UNIVERSES: { tag: string; symbols: string[] }[] = [
  { tag: 'all4', symbols: ['AAPL', 'MSFT', 'NVDA', 'SPY'] },
  { tag: 'aapl', symbols: ['AAPL'] },
  { tag: 'msft', symbols: ['MSFT'] },
  { tag: 'nvda', symbols: ['NVDA'] },
  { tag: 'spy', symbols: ['SPY'] },
];
const WINDOW = { from: '2023-01-01', to: '2025-12-31' };
const FOLDS = 8;
const CASH = 100_000_000_000;

const frictions = validateFrictions(JSON.parse(readFileSync(join(ASSAY, 'demo', 'frictions.json'), 'utf8')));
if (isRefused(frictions)) throw new Error(`frictions invalid: ${frictions.detail}`);

interface Candidate {
  name: string;
  raw: Record<string, unknown>;
}

const candidates: Candidate[] = [];
for (const u of UNIVERSES) {
  for (const f of FASTS) {
    for (const s of SLOWS) {
      if (s <= f) continue;
      candidates.push({
        name: `sweep-sma-f${f}-s${s}-${u.tag}`,
        raw: {
          name: `sweep-sma-f${f}-s${s}-${u.tag}`,
          universe: u.symbols,
          signal: { kind: 'sma_cross', fast: f, slow: s },
          sizing: { kind: 'fixed_cash', cashMicros: Math.floor(CASH / (u.symbols.length * 1)) },
          entry: { kind: 'next_open' },
          exit: { kind: 'signal_flip' },
          risk: { maxOpenPositions: u.symbols.length },
        },
      });
    }
  }
}

console.log(`population: ${candidates.length} candidates`);

// ---- PHASE A: register EVERYTHING before evaluating ANYTHING (I3 / ISC-161) ----
const registrations = new Map<string, { spec_hash: Hash; registered_at: string }>();
for (const c of candidates) {
  const reg = registerSpec(root, c.raw);
  if (isRefused(reg)) throw new Error(`${c.name}: registration refused — ${reg.detail}`);
  registrations.set(c.name, { spec_hash: reg.spec_hash, registered_at: reg.registered_at });
}
console.log(`registered: ${registrations.size} (all before first evaluation)`);

// snapshots resolved once — identical inputs across the sweep where universes match
const snapList = ((): { hash: Hash; value: unknown }[] => {
  const s = recordsOfType(root, 'DataSnapshot');
  if (isRefused(s)) throw new Error(s.detail);
  return s;
})();
function snapsFor(symbols: string[]): Hash[] {
  const chosen: Hash[] = [];
  for (const sym of symbols) {
    const covering = snapList
      .filter((s) => {
        const v = s.value as DataSnapshot;
        return v.symbol === sym && Array.isArray(v.bars) && v.bars.length > 0 && v.window.from <= WINDOW.from && v.window.to >= WINDOW.to;
      })
      .sort((a, b) => (a.hash < b.hash ? -1 : 1));
    if (covering.length !== 1) throw new Error(`${sym}: ${covering.length} covering snapshots — sweep requires exactly one`);
    chosen.push(covering[0]!.hash);
  }
  return chosen;
}

// ---- PHASE B/C/D: evaluate → adversary → receipt, identical params shape ----
interface SweepRow {
  name: string;
  spec_hash: Hash;
  registered_at: string;
  registered_after_window: boolean | null;
  result_hash: Hash | null;
  outcome: 'result' | string; // refusal reason when not 'result'
  totalReturn: number | null;
  cagr: number | null;
  worstFoldDrawdown: number | null;
  closedTrades: number | null;
  winRate: number | null;
  worst_slice_return: number | null;
  materially_worse: boolean | null;
  verified: boolean;
}

const rows: SweepRow[] = [];
const startT = Date.parse(`${WINDOW.from}T00:00:00Z`);
const endT = Date.parse(`${WINDOW.to}T23:59:59Z`);

for (const c of candidates) {
  const spec = validateSpec(c.raw);
  if (isRefused(spec)) throw new Error(`${c.name}: ${spec.detail}`);
  const reg = registrations.get(c.name)!;
  const regCheck = findRegistration(root, reg.spec_hash);
  if (isRefused(regCheck) || regCheck === null) throw new Error(`${c.name}: registration lookup failed`);
  const params: EvaluateParamsRecord = {
    record_type: 'Params',
    spec,
    spec_hash: reg.spec_hash,
    registration: { registered_at: regCheck.registered_at },
    frictions,
    window: { startT, endT },
    evalParams: { initialCashMicros: CASH, foldCount: FOLDS },
  };
  const r = invokeEvaluate(root, snapsFor([...spec.universe]), params);
  if (isRefused(r)) throw new Error(`${c.name}: invoke failed — ${r.detail}`);
  const row: SweepRow = {
    name: c.name,
    spec_hash: reg.spec_hash,
    registered_at: regCheck.registered_at,
    registered_after_window: r.result.registered_after_window,
    result_hash: r.result_hash,
    outcome: r.result.outcome.kind === 'result' ? 'result' : r.result.outcome.reason,
    totalReturn: null,
    cagr: null,
    worstFoldDrawdown: null,
    closedTrades: null,
    winRate: null,
    worst_slice_return: null,
    materially_worse: null,
    verified: false,
  };
  if (r.result.outcome.kind === 'result') {
    row.totalReturn = r.result.outcome.headline.totalReturn;
    row.cagr = r.result.outcome.headline.cagrValue;
    row.worstFoldDrawdown = r.result.outcome.headline.worstFoldDrawdown;
    row.closedTrades = r.result.outcome.winRateReport?.population ?? 0;
    row.winRate = r.result.outcome.winRateReport?.winRate ?? null;
    const adv = runAdversary(root, r.result_hash);
    if (!isRefused(adv)) {
      row.worst_slice_return = typeof adv.report.worst.totalReturn === 'number' ? adv.report.worst.totalReturn : null;
      row.materially_worse = adv.report.materially_worse;
    }
    const rec = buildReceipt(root, r.result_hash);
    if (!isRefused(rec)) row.verified = rec.receipt.verified;
  }
  rows.push(row);
  if (rows.length % 20 === 0) console.log(`progress: ${rows.length}/${candidates.length}`);
}

const survivors = rows.filter((r) => r.verified);
const summary = {
  generated_from: 'phase3/sweep.ts — every row backed by store records; display re-derives nothing',
  window: WINDOW,
  folds: FOLDS,
  frictions_version: frictions.version,
  population: rows.length,
  evaluated_ok: rows.filter((r) => r.outcome === 'result').length,
  refused: rows.filter((r) => r.outcome !== 'result').length,
  materially_worse_count: rows.filter((r) => r.materially_worse === true).length,
  survivors: survivors.length,
  survivor_names: survivors.map((s) => s.name),
  all_registered_after_window: rows.every((r) => r.registered_after_window === true),
  rows,
};
mkdirSync(join(ASSAY, 'reports'), { recursive: true });
writeFileSync(join(ASSAY, 'reports', 'phase3-sweep.json'), JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    { population: summary.population, ok: summary.evaluated_ok, refused: summary.refused, materially_worse: summary.materially_worse_count, survivors: summary.survivors },
    null,
    2
  )
);
