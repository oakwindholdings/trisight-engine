// assay/tests/sim.test.ts
// The ledger as a value: hand-computed fill golden, exact conservation identities recomputed
// independently from fills, refusal paths, and byte-level determinism.

import { test, expect } from 'bun:test';
import { simulate, type Decision, type Frictions } from '../kernel/sim.ts';
import { loadAsOf, loadUniverse, type Bar, type AsOfSeries } from '../kernel/bars.ts';
import { canonicalize } from '../kernel/canonical.ts';
import { isRefused } from '../kernel/refusal.ts';
import { rng } from './prop.ts';

const F: Frictions = {
  version: 'test-v1',
  slippageBps: 5,
  commissionPerShareMicros: 5_000,
  borrowAvailable: false,
  fillModel: 'next_open',
  gapPolicy: 'fill_at_open',
  periodsPerYear: 252,
  universeAvailability: { X: true, Y: true },
};

function bars(symbol: string, rows: [number, number, number][]): AsOfSeries {
  // rows: [t, openMicros, closeMicros]
  const bs: Bar[] = rows.map(([t, o, c]) => ({ t, oMicros: o, hMicros: Math.max(o, c), lMicros: Math.min(o, c), cMicros: c, volume: 1000 }));
  const s = loadAsOf(symbol, rows[rows.length - 1]![0], bs);
  if (isRefused(s)) throw new Error(`test series invalid: ${s.detail}`);
  return s;
}

function uni(...series: AsOfSeries[]): ReturnType<typeof loadUniverse> {
  const asOf = Math.max(...series.map((s) => s.asOf));
  const restricted = series.map((s) => {
    if (s.asOf === asOf) return s;
    throw new Error('test universe misaligned');
  });
  return loadUniverse(asOf, new Map(restricted.map((s) => [s.symbol, s])));
}

test('golden: hand-computed buy fill with 5bps slippage and $0.005/share commission', () => {
  // decision at bar t=1 (close), fills at bar t=2 open 100.50 → 100_500_000 micros
  // fill price = 100_500_000 * 10005 / 10000 = 100_550_250 micros (exact)
  // gross 10 shares = 1_005_502_500; commission = 50_000
  // cash 2_000_000_000 - 1_005_502_500 - 50_000 = 994_447_500
  // equity at t=2 close 102.00 → 994_447_500 + 1_020_000_000 = 2_014_447_500
  const x = bars('X', [
    [1, 100_000_000, 100_000_000],
    [2, 100_500_000, 102_000_000],
  ]);
  const u = uni(x);
  if (isRefused(u)) throw new Error('unexpected');
  const d: Decision[] = [{ id: 'D1', t: 1, symbol: 'X', action: 'BUY', shares: 10 }];
  const led = simulate(u, d, F, 2_000_000_000);
  if (isRefused(led)) throw new Error(`refused: ${led.detail}`);
  expect(led.fills.length).toBe(1);
  expect(led.fills[0]!.priceMicros).toBe(100_550_250);
  expect(led.fills[0]!.commissionMicros).toBe(50_000);
  expect(led.finalCashMicros).toBe(994_447_500);
  expect(led.equityPath[led.equityPath.length - 1]!.equityMicros).toBe(2_014_447_500);
});

test('mirrored round-trips produce exactly negated trading pnl', () => {
  const up = bars('X', [
    [1, 100_000_000, 100_000_000],
    [2, 100_000_000, 100_000_000],
    [3, 110_000_000, 110_000_000],
    [4, 110_000_000, 110_000_000],
  ]);
  const down = bars('X', [
    [1, 110_000_000, 110_000_000],
    [2, 110_000_000, 110_000_000],
    [3, 100_000_000, 100_000_000],
    [4, 100_000_000, 100_000_000],
  ]);
  const noSlip: Frictions = { ...F, slippageBps: 0, commissionPerShareMicros: 0 };
  const ds: Decision[] = [
    { id: 'D1', t: 1, symbol: 'X', action: 'BUY', shares: 5 },
    { id: 'D2', t: 3, symbol: 'X', action: 'SELL', shares: 5 },
  ];
  const u1 = uni(up);
  const u2 = uni(down);
  if (isRefused(u1) || isRefused(u2)) throw new Error('unexpected');
  const l1 = simulate(u1, ds, noSlip, 10_000_000_000);
  const l2 = simulate(u2, ds, noSlip, 10_000_000_000);
  if (isRefused(l1) || isRefused(l2)) throw new Error('unexpected');
  expect(l1.realizedTradingPnlMicros).toBe(50_000_000); // (110-100)*5 dollars in micros
  expect(l2.realizedTradingPnlMicros).toBe(-50_000_000);
});

test('property: exact conservation — identities recomputed independently from fills', () => {
  const r = rng(555);
  for (let caseN = 0; caseN < 60; caseN++) {
    const n = r.int(4, 20);
    const rows: [number, number, number][] = [];
    for (let i = 0; i < n; i++) {
      const o = r.int(50, 500) * 1_000_000;
      const c = r.int(50, 500) * 1_000_000;
      rows.push([i + 1, o, c]);
    }
    const x = bars('X', rows);
    const u = uni(x);
    if (isRefused(u)) throw new Error('unexpected');
    const ds: Decision[] = [];
    let held = 0;
    let seq = 0;
    for (let i = 1; i < n - 1; i++) {
      if (held === 0 && r.next() < 0.4) {
        const sh = r.int(1, 20);
        ds.push({ id: `D${seq++}`, t: i, symbol: 'X', action: 'BUY', shares: sh });
        held = sh;
      } else if (held > 0 && r.next() < 0.4) {
        ds.push({ id: `D${seq++}`, t: i, symbol: 'X', action: 'SELL', shares: held });
        held = 0;
      }
    }
    const led = simulate(u, ds, F, 100_000_000_000);
    if (isRefused(led)) throw new Error(`refused: ${led.detail}`);
    // identity 1: cash from fills alone
    let cash = 100_000_000_000;
    for (const f of led.fills) {
      const gross = f.priceMicros * f.shares;
      cash += f.action === 'BUY' ? -(gross + f.commissionMicros) : gross - f.commissionMicros;
    }
    expect(cash).toBe(led.finalCashMicros);
    // identity 2: realized pnl equals sum over closed positions
    const sumClosed = led.closedPositions.reduce((acc, p) => acc + p.pnlMicros, 0);
    expect(sumClosed).toBe(led.realizedTradingPnlMicros);
    // identity 3: each fill references exactly one decision, uniquely
    const decisionIds = led.fills.map((f) => f.decisionId);
    expect(new Set(decisionIds).size).toBe(decisionIds.length);
    // identity 4: byte determinism
    const led2 = simulate(u, ds, F, 100_000_000_000);
    if (isRefused(led2)) throw new Error('unexpected');
    expect(canonicalize(led)).toEqual(canonicalize(led2));
  }
});

test('refusal: decision on a date with no bar', () => {
  const x = bars('X', [
    [1, 100_000_000, 100_000_000],
    [2, 100_000_000, 100_000_000],
  ]);
  const u = uni(x);
  if (isRefused(u)) throw new Error('unexpected');
  const led = simulate(u, [{ id: 'D1', t: 99, symbol: 'X', action: 'BUY', shares: 1 }], F, 1_000_000_000);
  expect(isRefused(led) && led.reason === 'missing_bar').toBe(true);
});

test('refusal: short with borrow unavailable', () => {
  const x = bars('X', [
    [1, 100_000_000, 100_000_000],
    [2, 100_000_000, 100_000_000],
  ]);
  const u = uni(x);
  if (isRefused(u)) throw new Error('unexpected');
  const led = simulate(u, [{ id: 'D1', t: 1, symbol: 'X', action: 'SELL', shares: 1 }], F, 1_000_000_000);
  expect(isRefused(led) && led.reason === 'borrow_unavailable').toBe(true);
});

test('refusal: universe availability not declared true', () => {
  const z = bars('Z', [
    [1, 100_000_000, 100_000_000],
    [2, 100_000_000, 100_000_000],
  ]);
  const u = uni(z);
  if (isRefused(u)) throw new Error('unexpected');
  const led = simulate(u, [], F, 1_000_000_000); // F declares X and Y only
  expect(isRefused(led) && led.reason === 'partial_universe').toBe(true);
});

test('decision at the last bar is recorded unfilled, never synthetically filled', () => {
  const x = bars('X', [
    [1, 100_000_000, 100_000_000],
    [2, 100_000_000, 100_000_000],
  ]);
  const u = uni(x);
  if (isRefused(u)) throw new Error('unexpected');
  const led = simulate(u, [{ id: 'D1', t: 2, symbol: 'X', action: 'BUY', shares: 1 }], F, 1_000_000_000);
  if (isRefused(led)) throw new Error('unexpected');
  expect(led.fills.length).toBe(0);
  expect(led.unfilled).toEqual([{ decisionId: 'D1', why: 'no_next_bar' }]);
});
