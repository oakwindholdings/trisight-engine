// assay/tests/spec_evaluate.test.ts
// Spec grammar strictness + walk-forward evaluation: fold isolation is the lookahead property —
// changing the future must not change a fold's past-only result, byte for byte.

import { test, expect } from 'bun:test';
import { validateSpec, specHash, type Spec } from '../kernel/spec.ts';
import { evaluate, computeDecisions } from '../kernel/evaluate.ts';
import { loadAsOf, loadUniverse, type Bar, type AsOfSeries } from '../kernel/bars.ts';
import { type Frictions } from '../kernel/sim.ts';
import { canonicalize } from '../kernel/canonical.ts';
import { isRefused } from '../kernel/refusal.ts';
import { rng } from './prop.ts';

const DAY = 86_400_000;

const RAW_SPEC = {
  name: 'test-sma',
  universe: ['X'],
  signal: { kind: 'sma_cross', fast: 2, slow: 3 },
  sizing: { kind: 'fixed_cash', cashMicros: 10_000_000_000 },
  entry: { kind: 'next_open' },
  exit: { kind: 'signal_flip' },
  risk: { maxOpenPositions: 1 },
};

const F: Frictions = {
  version: 'test-v1',
  slippageBps: 0,
  commissionPerShareMicros: 0,
  borrowAvailable: false,
  fillModel: 'next_open',
  gapPolicy: 'fill_at_open',
  periodsPerYear: 252,
  universeAvailability: { X: true },
};

function series(symbol: string, closesMicros: number[], asOfExtra = 0): AsOfSeries {
  const bars: Bar[] = closesMicros.map((c, i) => ({
    t: (i + 1) * DAY,
    oMicros: c,
    hMicros: c,
    lMicros: c,
    cMicros: c,
    volume: 1000,
  }));
  const s = loadAsOf(symbol, closesMicros.length * DAY + asOfExtra, bars);
  if (isRefused(s)) throw new Error(`bad test series: ${s.detail}`);
  return s;
}

test('validateSpec: happy path normalizes and sorts the universe', () => {
  const s = validateSpec({ ...RAW_SPEC, universe: ['X'] });
  if (isRefused(s)) throw new Error(s.detail);
  expect(s.name).toBe('test-sma');
});

test('validateSpec: unknown fields refuse at parse', () => {
  const s = validateSpec({ ...RAW_SPEC, extraKnob: 1 });
  expect(isRefused(s) && s.reason === 'invalid_spec').toBe(true);
  const s2 = validateSpec({ ...RAW_SPEC, signal: { kind: 'sma_cross', fast: 2, slow: 3, secret: 9 } });
  expect(isRefused(s2) && s2.reason === 'invalid_spec').toBe(true);
});

test('validateSpec: executable payloads refuse — specs are data only', () => {
  const s = validateSpec({ ...RAW_SPEC, name: 'x', universe: ['X'], signal: { kind: 'sma_cross', fast: 2, slow: 3 }, risk: { maxOpenPositions: 1 }, entry: { kind: 'next_open' }, exit: { kind: 'signal_flip' }, sizing: Object.assign({ kind: 'fixed_cash', cashMicros: 1 }, { }) , });
  // function-bearing payload:
  const withFn = { ...RAW_SPEC, entry: { kind: 'next_open' } } as Record<string, unknown>;
  (withFn as { evil?: unknown }).evil = () => 1;
  const r = validateSpec(withFn);
  expect(isRefused(r) && r.reason === 'invalid_spec').toBe(true);
  if (isRefused(s)) throw new Error('control spec should validate');
});

test('specHash is stable across key insertion order', () => {
  const a = validateSpec(RAW_SPEC);
  const shuffled = {
    risk: { maxOpenPositions: 1 },
    exit: { kind: 'signal_flip' },
    entry: { kind: 'next_open' },
    sizing: { cashMicros: 10_000_000_000, kind: 'fixed_cash' },
    signal: { slow: 3, fast: 2, kind: 'sma_cross' },
    universe: ['X'],
    name: 'test-sma',
  };
  const b = validateSpec(shuffled);
  if (isRefused(a) || isRefused(b)) throw new Error('unexpected');
  expect(specHash(a)).toEqual(specHash(b));
});

test('computeDecisions refuses insufficient history for the declared lookback', () => {
  const spec = validateSpec(RAW_SPEC);
  if (isRefused(spec)) throw new Error('unexpected');
  const s = series('X', [1_000_000, 1_000_000, 1_000_000]); // 3 bars < slow+1
  const d = computeDecisions(spec, s, 0, 100 * DAY);
  expect(isRefused(d) && d.reason === 'insufficient_history').toBe(true);
});

test('evaluate: designed cross produces trades and a result with folds', () => {
  const spec = validateSpec(RAW_SPEC);
  if (isRefused(spec)) throw new Error('unexpected');
  // flat, dip, strong rise (cross up), then collapse (cross down), then flat
  const closes = [100, 100, 100, 90, 85, 110, 130, 150, 150, 100, 70, 60, 80, 90, 95, 100].map((x) => x * 1_000_000);
  const s = series('X', closes);
  const u = loadUniverse(s.asOf, new Map([['X', s]]));
  if (isRefused(u)) throw new Error('unexpected');
  const r = evaluate(spec, u, F, { startT: 5 * DAY, endT: 16 * DAY }, { initialCashMicros: 100_000_000_000, foldCount: 2 });
  if (isRefused(r)) throw new Error(`refused: ${r.detail}`);
  expect(r.kind).toBe('result');
  expect(r.folds.length).toBe(2);
  const fills = r.folds.reduce((acc, f) => acc + f.fillCount, 0);
  expect(fills).toBeGreaterThan(0);
});

test('LOOKAHEAD PROPERTY: altering the future never alters a fold, byte for byte', () => {
  const spec = validateSpec(RAW_SPEC);
  if (isRefused(spec)) throw new Error('unexpected');
  const r = rng(4242);
  for (let caseN = 0; caseN < 20; caseN++) {
    const n = 24;
    const base: number[] = [];
    let v = 100;
    for (let i = 0; i < n; i++) {
      v = Math.max(10, v + r.int(-8, 8));
      base.push(v * 1_000_000);
    }
    const altered = [...base];
    // fold boundary: window 9..24 in 2 folds → fold 1 ends around day 16; alter strictly after day 17
    for (let i = 17; i < n; i++) altered[i] = Math.max(10_000_000, altered[i]! + r.int(1, 50) * 1_000_000);
    const sA = series('X', base);
    const sB = series('X', altered);
    const uA = loadUniverse(sA.asOf, new Map([['X', sA]]));
    const uB = loadUniverse(sB.asOf, new Map([['X', sB]]));
    if (isRefused(uA) || isRefused(uB)) throw new Error('unexpected');
    const win = { startT: 9 * DAY, endT: 24 * DAY };
    const p = { initialCashMicros: 100_000_000_000, foldCount: 2 };
    const rA = evaluate(spec, uA, F, win, p);
    const rB = evaluate(spec, uB, F, win, p);
    if (isRefused(rA) || isRefused(rB)) throw new Error('unexpected refusal in lookahead property');
    expect(canonicalize(rA.folds[0])).toEqual(canonicalize(rB.folds[0]));

    // harder configuration (Forge review): universe.asOf BEYOND window end — bars exist past the
    // window and altering them must leave the ENTIRE result byte-identical
    const beyond = [...base];
    for (let i = 20; i < n; i++) beyond[i] = Math.max(10_000_000, beyond[i]! + r.int(1, 99) * 1_000_000);
    const sC = series('X', base);
    const sD = series('X', beyond);
    const uC = loadUniverse(sC.asOf, new Map([['X', sC]]));
    const uD = loadUniverse(sD.asOf, new Map([['X', sD]]));
    if (isRefused(uC) || isRefused(uD)) throw new Error('unexpected');
    const winShort = { startT: 9 * DAY, endT: 20 * DAY }; // asOf is 24*DAY — beyond the window
    const rC = evaluate(spec, uC, F, winShort, p);
    const rD = evaluate(spec, uD, F, winShort, p);
    if (isRefused(rC) || isRefused(rD)) throw new Error('unexpected refusal in beyond-window property');
    expect(canonicalize(rC)).toEqual(canonicalize(rD));
  }
});

test('evaluate refusals: bad window, bad folds, missing symbol, universe asOf too early', () => {
  const spec = validateSpec(RAW_SPEC);
  if (isRefused(spec)) throw new Error('unexpected');
  const s = series('X', [100, 100, 100, 100, 100, 100, 100, 100].map((x) => x * 1_000_000));
  const u = loadUniverse(s.asOf, new Map([['X', s]]));
  if (isRefused(u)) throw new Error('unexpected');
  const p = { initialCashMicros: 100_000_000_000, foldCount: 1 };
  expect(isRefused(evaluate(spec, u, F, { startT: 5 * DAY, endT: 4 * DAY }, p))).toBe(true);
  expect(isRefused(evaluate(spec, u, F, { startT: 4 * DAY, endT: 8 * DAY }, { ...p, foldCount: 0 }))).toBe(true);
  const specY = validateSpec({ ...RAW_SPEC, universe: ['X', 'Y'] });
  if (isRefused(specY)) throw new Error('unexpected');
  const missing = evaluate(specY, u, F, { startT: 4 * DAY, endT: 8 * DAY }, p);
  expect(isRefused(missing) && missing.reason === 'partial_universe').toBe(true);
  const early = evaluate(spec, u, F, { startT: 4 * DAY, endT: 30 * DAY }, p);
  expect(isRefused(early) && early.reason === 'missing_data').toBe(true);
});
