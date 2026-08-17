// assay/tests/span_asof.test.ts
// Basis-typed spans and AsOf point-in-time loading — the load gate behind the type gate (I2).
// Lookahead, duplicates, disorder each refuse; restriction can only forget the future.

import { test, expect } from 'bun:test';
import { span, addSpans, spanCount } from '../kernel/span.ts';
import { loadAsOf, restrictTo, loadUniverse, type Bar, type AsOfSeries } from '../kernel/bars.ts';
import { isRefused } from '../kernel/refusal.ts';
import { rng } from './prop.ts';

function bar(t: number, priceMicros: number): Bar {
  return { t, oMicros: priceMicros, hMicros: priceMicros, lMicros: priceMicros, cMicros: priceMicros, volume: 100 };
}

test('span refuses negative and non-integer counts', () => {
  for (const bad of [-1, 1.5, NaN]) {
    const s = span('TRADING', bad);
    expect(isRefused(s)).toBe(true);
    if (isRefused(s)) expect(s.reason).toBe('invalid_span');
  }
});

test('same-basis span arithmetic preserves basis and adds counts', () => {
  const a = span('TRADING', 10);
  const b = span('TRADING', 21);
  if (isRefused(a) || isRefused(b)) throw new Error('unexpected');
  const c = addSpans(a, b);
  if (isRefused(c)) throw new Error('unexpected');
  expect(c.basis).toBe('TRADING');
  expect(spanCount(c)).toBe(31);
});

test('loadAsOf refuses a bar beyond the as-of date (lookahead unloadable — A2 runtime layer)', () => {
  const r = loadAsOf('X', 1000, [bar(900, 1_000_000), bar(1001, 1_000_000)]);
  expect(isRefused(r)).toBe(true);
  if (isRefused(r)) expect(r.reason).toBe('lookahead_at_load');
});

test('loadAsOf refuses duplicate and unsorted timestamps', () => {
  const dup = loadAsOf('X', 1000, [bar(900, 1_000_000), bar(900, 1_000_000)]);
  expect(isRefused(dup) && dup.reason === 'duplicate_bar').toBe(true);
  const unsorted = loadAsOf('X', 1000, [bar(900, 1_000_000), bar(800, 1_000_000)]);
  expect(isRefused(unsorted) && unsorted.reason === 'unsorted_bars').toBe(true);
});

test('AsOf exposes its date read-only and iterates in ascending order (seeded property)', () => {
  const r = rng(2024);
  for (let caseN = 0; caseN < 50; caseN++) {
    const n = r.int(1, 40);
    const bars: Bar[] = [];
    let t = r.int(1, 100);
    for (let i = 0; i < n; i++) {
      bars.push(bar(t, r.int(1, 1_000_000_000)));
      t += r.int(1, 50);
    }
    const s = loadAsOf('P', t, bars);
    if (isRefused(s)) throw new Error('valid series refused');
    expect(s.asOf).toBe(t);
    let prev = -Infinity;
    for (let i = 0; i < s.length; i++) {
      const b = s.bar(i);
      if (isRefused(b)) throw new Error('in-range access refused');
      expect(b.t).toBeGreaterThan(prev);
      prev = b.t;
    }
  }
});

test('out-of-range access refuses (missing_bar), never returns undefined', () => {
  const s = loadAsOf('X', 1000, [bar(900, 1_000_000)]);
  if (isRefused(s)) throw new Error('unexpected');
  const b = s.bar(5);
  expect(isRefused(b) && b.reason === 'missing_bar').toBe(true);
});

test('restrictTo can only move the as-of date backward', () => {
  const s = loadAsOf('X', 1000, [bar(900, 1_000_000), bar(950, 1_000_000)]);
  if (isRefused(s)) throw new Error('unexpected');
  const forward = restrictTo(s, 2000);
  expect(isRefused(forward) && forward.reason === 'lookahead_at_load').toBe(true);
  const back = restrictTo(s, 920);
  if (isRefused(back)) throw new Error('unexpected');
  expect(back.length).toBe(1);
  expect(back.asOf).toBe(920);
});

test('universe refuses zero symbols, zero-bar members, and mismatched as-of', () => {
  expect(isRefused(loadUniverse(1000, new Map()))).toBe(true);
  const s = loadAsOf('X', 900, [bar(800, 1_000_000)]);
  if (isRefused(s)) throw new Error('unexpected');
  const mismatch = loadUniverse(1000, new Map<string, AsOfSeries>([['X', s]]));
  expect(isRefused(mismatch)).toBe(true);
});
