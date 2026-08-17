// assay/tests/forge_fixes.test.ts
// Regression tests for the Forge second-vendor review findings (2026-08-17) — each of these
// was a live defect, proven or read, before the fix it now guards. Red-first by construction.

import { test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { canonicalize, contentHash } from '../kernel/canonical.ts';
import { validateFrictions, simulate, type Frictions } from '../kernel/sim.ts';
import { computeDecisions } from '../kernel/evaluate.ts';
import { validateSpec, specHash, type Spec } from '../kernel/spec.ts';
import { loadAsOf, loadUniverse, type Bar, type AsOfSeries } from '../kernel/bars.ts';
import { isRefused } from '../kernel/refusal.ts';
import { redact, ingestDailyBars } from '../substrate/ingress.ts';
import { openStore, putRecord, rebuildIndex, recordsOfType } from '../substrate/store.ts';
import { registerSpec } from '../substrate/registry.ts';
import { invokeEvaluate, type EvaluateParamsRecord } from '../substrate/invoke.ts';
import { runAdversary } from '../adversary/adversary.ts';

const DAY = 86_400_000;
const FAKE_KEY = 'FAKE-SECRET-KEY-0123456789';

const F: Frictions = {
  version: 'test-v1',
  slippageBps: 0,
  commissionPerShareMicros: 0,
  borrowAvailable: false,
  fillModel: 'next_open',
  gapPolicy: 'fill_at_open',
  periodsPerYear: 252,
  universeAvailability: { X: true, Y: true },
};

function tempStore(): ReturnType<typeof openStore> {
  return openStore(mkdtempSync(join(tmpdir(), 'assay-ff-')));
}

function fakeFetch(closes: number[], startDay = 1): typeof fetch {
  return (async () =>
    new Response(
      JSON.stringify({ results: closes.map((c, i) => ({ t: (startDay + i) * DAY, o: c, h: c, l: c, c, v: 1000 })) }),
      { status: 200 }
    )) as unknown as typeof fetch;
}

// Finding 2 (CRITICAL, proven TZ-dependent): registered_at must be strict UTC; malformed refuses,
// and NEVER defaults to the favorable "not after window" answer.
test('F2: non-UTC and malformed registered_at refuse — never marked favorably', async () => {
  const root = tempStore();
  const rawSpec = {
    name: 't', universe: ['X'], signal: { kind: 'sma_cross', fast: 2, slow: 3 },
    sizing: { kind: 'fixed_cash', cashMicros: 10_000_000_000 }, entry: { kind: 'next_open' },
    exit: { kind: 'signal_flip' }, risk: { maxOpenPositions: 1 },
  };
  const ing = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-10', {
    fetchImpl: fakeFetch([100, 101, 102, 103, 104, 105, 106, 107]),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  if (isRefused(ing)) throw new Error('unexpected');
  const spec = validateSpec(rawSpec);
  if (isRefused(spec)) throw new Error('unexpected');
  const sh = specHash(spec);
  if (isRefused(sh)) throw new Error('unexpected');
  for (const bad of ['2024-06-01T00:00:00', 'garbage', '2024-06-01', '2024-06-01T00:00:00+02:00']) {
    const params: EvaluateParamsRecord = {
      record_type: 'Params', spec, spec_hash: sh, registration: { registered_at: bad },
      frictions: F, window: { startT: 4 * DAY, endT: 8 * DAY },
      evalParams: { initialCashMicros: 100_000_000_000, foldCount: 1 },
    };
    const r = invokeEvaluate(root, [ing.hash], params, { emitTrace: false });
    if (isRefused(r)) throw new Error('unexpected');
    expect(r.result.outcome.kind).toBe('refused');
    expect(r.result.registered_after_window).toBe(null); // never a favorable boolean
  }
});

// Finding 3 (CRITICAL): a refused adversary slice is recorded AS refused — never scored 0,
// never eligible to be the worst slice.
test('F3: refused symbol slice carries REFUSED, not 0, and cannot become worst', async () => {
  const root = tempStore();
  const rawSpec = {
    name: 't2', universe: ['X', 'Y'], signal: { kind: 'sma_cross', fast: 2, slow: 3 },
    sizing: { kind: 'fixed_cash', cashMicros: 10_000_000_000 }, entry: { kind: 'next_open' },
    exit: { kind: 'signal_flip' }, risk: { maxOpenPositions: 2 },
  };
  const reg = registerSpec(root, rawSpec, () => '2026-08-17T10:00:00.000Z');
  if (isRefused(reg)) throw new Error('unexpected');
  // X spans days 1..20; Y has only days 1..5 — solo-Y evaluation lacks fold-2 equity and refuses
  const iX = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-20', {
    fetchImpl: fakeFetch([100, 100, 100, 90, 85, 110, 130, 150, 150, 100, 70, 60, 80, 90, 95, 100, 105, 110, 100, 95]),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  const iY = await ingestDailyBars(root, 'Y', '2023-01-01', '2023-01-05', {
    fetchImpl: fakeFetch([50, 51, 52, 51, 50]),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  if (isRefused(iX) || isRefused(iY)) throw new Error('unexpected');
  const spec = validateSpec(rawSpec);
  if (isRefused(spec)) throw new Error('unexpected');
  const sh = specHash(spec);
  if (isRefused(sh)) throw new Error('unexpected');
  const params: EvaluateParamsRecord = {
    record_type: 'Params', spec, spec_hash: sh, registration: { registered_at: reg.registered_at },
    frictions: F, window: { startT: 6 * DAY, endT: 20 * DAY },
    evalParams: { initialCashMicros: 100_000_000_000, foldCount: 2 },
  };
  const r = invokeEvaluate(root, [iX.hash, iY.hash], params);
  if (isRefused(r)) throw new Error('unexpected');
  if (r.result.outcome.kind !== 'result') throw new Error(`main chain refused: ${r.result.outcome.detail}`);
  const adv = runAdversary(root, r.result_hash);
  if (isRefused(adv)) throw new Error(adv.detail);
  const ySlice = adv.report.slices.find((s) => s.id === 'symbol-Y');
  expect(ySlice).toBeDefined();
  expect(ySlice!.totalReturn).toBe('REFUSED');
  expect(ySlice!.refusal_reason).not.toBe(null);
  expect(typeof adv.report.worst.totalReturn).toBe('number'); // worst is always a MEASURED slice
});

// Finding 4 (CRITICAL, proven +296%): negative commission mints cash — refused at both owners.
test('F4: negative commission and unknown friction fields refuse', () => {
  expect(isRefused(validateFrictions({ ...F, commissionPerShareMicros: -1_000_000 }))).toBe(true);
  expect(isRefused(validateFrictions({ ...F, extraKnob: 1 }))).toBe(true);
  expect(isRefused(validateFrictions({ ...F, slippageBps: 2.5 }))).toBe(true);
  const bars: Bar[] = [1, 2].map((i) => ({ t: i * DAY, oMicros: 100_000_000, hMicros: 100_000_000, lMicros: 100_000_000, cMicros: 100_000_000, volume: 1 }));
  const s = loadAsOf('X', 2 * DAY, bars);
  if (isRefused(s)) throw new Error('unexpected');
  const u = loadUniverse(2 * DAY, new Map([['X', s]]));
  if (isRefused(u)) throw new Error('unexpected');
  const forged = { ...F, commissionPerShareMicros: -1_000_000_000 } as Frictions;
  const led = simulate(u, [], forged, 1_000_000_000);
  expect(isRefused(led)).toBe(true);
});

// Finding 5 (CRITICAL, proven collision): exotic objects refuse instead of hashing as {}.
test('F5: Date/Map/Set/class instances and cycles refuse — no silent {} collision', () => {
  for (const exotic of [new Date(0), new Map([['a', 1]]), new Set([1]), new (class Q { x = 1 })()]) {
    const r = canonicalize({ v: exotic });
    expect(isRefused(r)).toBe(true);
  }
  expect(contentHash({})).not.toEqual(contentHash(new Date(0)));
  const cyc: Record<string, unknown> = {};
  cyc.self = cyc;
  const r = canonicalize(cyc);
  expect(isRefused(r)).toBe(true); // a value, not a RangeError throw
});

// Finding 8 (MAJOR, proven silent corruption): forged spec bypassing validateSpec refuses in-kernel.
test('F8: computeDecisions refuses forged specs with fast >= slow or fast < 1', () => {
  const bars: Bar[] = [1, 2, 3, 4, 5, 6].map((i) => ({ t: i * DAY, oMicros: 100_000_000, hMicros: 100_000_000, lMicros: 100_000_000, cMicros: 100_000_000, volume: 1 }));
  const s = loadAsOf('X', 6 * DAY, bars);
  if (isRefused(s)) throw new Error('unexpected');
  const base = validateSpec({
    name: 't', universe: ['X'], signal: { kind: 'sma_cross', fast: 2, slow: 3 },
    sizing: { kind: 'fixed_cash', cashMicros: 10_000_000_000 }, entry: { kind: 'next_open' },
    exit: { kind: 'signal_flip' }, risk: { maxOpenPositions: 1 },
  });
  if (isRefused(base)) throw new Error('unexpected');
  for (const [fast, slow] of [[5, 3], [0, 3], [3, 3]] as const) {
    const forged = { ...base, signal: { kind: 'sma_cross', fast, slow } } as Spec;
    const d = computeDecisions(forged, s, 0, 10 * DAY);
    expect(isRefused(d)).toBe(true);
  }
});

// Finding 14 (MAJOR): redaction survives JSON-escaped, percent-encoded, and case-folded echoes.
test('F14: escaped and case-folded credential echoes never survive redaction', () => {
  const key = 'SEC"RET\\KEY+WITH SPACES-0123';
  const jsonEscaped = JSON.stringify(key).slice(1, -1);
  const percent = encodeURIComponent(key);
  for (const body of [`token ${key} invalid`, `token ${jsonEscaped} invalid`, `token ${percent} invalid`, `token ${key.toLowerCase()} invalid`]) {
    const out = redact(body, key);
    expect(out).not.toContain(key);
    expect(out).not.toContain(jsonEscaped);
    expect(out).not.toContain(percent);
  }
  expect(redact('body with short key', 'abc')).toBe('[BODY WITHHELD — key too short to redact safely]');
});

// Finding 16 (MAJOR): a stray .DS_Store must not brick the derived-index rebuild.
test('F16: rebuildIndex survives non-object files in objects/', () => {
  const root = tempStore();
  const r = putRecord(root, 'Spec', { record_type: 'Spec', spec: { a: 1 } });
  if (isRefused(r)) throw new Error('unexpected');
  writeFileSync(join(root.dir, 'objects', '.DS_Store'), 'finder junk');
  rmSync(join(root.dir, 'index.sqlite'));
  const n = rebuildIndex(root);
  if (isRefused(n)) throw new Error(`rebuild refused: ${n.detail}`);
  expect(n).toBe(1);
  const specs = recordsOfType(root, 'Spec');
  if (isRefused(specs)) throw new Error('unexpected');
  expect(specs.length).toBe(1);
});
