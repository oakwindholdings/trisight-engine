// assay/tests/metrics.test.ts
// Metric owners: golden vectors chosen exact-in-binary (hand-computed, no float ambiguity) + properties.
// Every refusal path is exercised; no metric ever returns NaN/null in place of a Refusal.

import { test, expect } from 'bun:test';
import { totalReturn, maxDrawdown, cagr, winRate, ratio, type ClosedPosition } from '../kernel/metrics.ts';
import { span } from '../kernel/span.ts';
import { canonicalize } from '../kernel/canonical.ts';
import { isRefused } from '../kernel/refusal.ts';
import { forAll } from './prop.ts';

test('golden: totalReturn of [2^20, 1.25*2^20] is exactly 0.25', () => {
  const r = totalReturn([1_048_576, 1_310_720]);
  expect(canonicalize(r)).toBe('0.25');
});

test('golden: cagr(0.25, 63 trading days, 252/yr) is exactly 1.44140625', () => {
  const s = span('TRADING', 63);
  if (isRefused(s)) throw new Error('unexpected');
  const r = cagr(0.25, s, 252);
  expect(canonicalize(r)).toBe('1.44140625'); // 1.25^4 - 1, hand-computed
});

test('golden: drawdown of peak 2^20 to trough 0.75*2^20 is exactly 0.25 with path named', () => {
  const r = maxDrawdown([1_048_576, 786_432, 1_048_576]);
  if (isRefused(r)) throw new Error('unexpected');
  expect(r.magnitude).toBe(0.25);
  expect(r.peakIndex).toBe(0);
  expect(r.troughIndex).toBe(1);
});

test('drawdown of a monotone-rising series is exactly zero', () => {
  const r = maxDrawdown([1, 2, 3, 4, 5].map((x) => x * 1_000_000));
  if (isRefused(r)) throw new Error('unexpected');
  expect(r.magnitude).toBe(0);
});

test('golden: winRate 3W/1L/0S over declared population 4', () => {
  const closed: ClosedPosition[] = [
    { symbol: 'A', openFillId: 'F1', closeFillId: 'F2', pnlMicros: 10 },
    { symbol: 'A', openFillId: 'F3', closeFillId: 'F4', pnlMicros: 5 },
    { symbol: 'B', openFillId: 'F5', closeFillId: 'F6', pnlMicros: 1 },
    { symbol: 'B', openFillId: 'F7', closeFillId: 'F8', pnlMicros: -3 },
  ];
  const r = winRate(closed);
  if (isRefused(r)) throw new Error('unexpected');
  expect(r).toEqual({ population: 4, winRate: 0.75, lossRate: 0.25, scratchRate: 0 });
});

test('refusals: empty series, empty population, zero-length span, undeclared periods', () => {
  expect(isRefused(totalReturn([]))).toBe(true);
  expect(isRefused(totalReturn([1_000_000]))).toBe(true);
  expect(isRefused(maxDrawdown([]))).toBe(true);
  const wr = winRate([]);
  expect(isRefused(wr) && wr.reason === 'empty_population').toBe(true);
  const s0 = span('TRADING', 0);
  if (isRefused(s0)) throw new Error('unexpected');
  expect(isRefused(cagr(0.25, s0, 252))).toBe(true);
  const s = span('TRADING', 10);
  if (isRefused(s)) throw new Error('unexpected');
  expect(isRefused(cagr(0.25, s, 0))).toBe(true);
  expect(isRefused(ratio([0.01], 252, 0))).toBe(true);
});

test('property: drawdown is monotone non-decreasing under appending a new equity low', () => {
  forAll(
    'dd monotone',
    99,
    200,
    (r) => {
      const n = r.int(2, 30);
      const eq: number[] = [];
      let v = r.int(500_000, 2_000_000);
      for (let i = 0; i < n; i++) {
        v = Math.max(1, v + r.int(-100_000, 100_000));
        eq.push(v);
      }
      const lower = Math.max(1, Math.min(...eq) - r.int(1, 100_000));
      return { eq, lower };
    },
    ({ eq, lower }) => {
      const before = maxDrawdown(eq);
      const after = maxDrawdown([...eq, lower]);
      if (isRefused(before) || isRefused(after)) return false;
      return after.magnitude >= before.magnitude;
    }
  );
});

test('property: win + loss + scratch rates sum to 1 over the declared population', () => {
  forAll(
    'rates sum to 1',
    7,
    200,
    (r) => {
      const n = r.int(1, 50);
      const closed: ClosedPosition[] = [];
      for (let i = 0; i < n; i++) {
        closed.push({ symbol: 'S', openFillId: `o${i}`, closeFillId: `c${i}`, pnlMicros: r.int(-5, 5) });
      }
      return closed;
    },
    (closed) => {
      const r = winRate(closed);
      if (isRefused(r)) return false;
      // n/n + m/n + k/n with n+m+k = population is exact in binary only when denominators divide;
      // assert the exact integer identity instead of float sum
      const wins = Math.round(r.winRate * r.population);
      const losses = Math.round(r.lossRate * r.population);
      const scratches = Math.round(r.scratchRate * r.population);
      return wins + losses + scratches === r.population;
    }
  );
});

test('property: totalReturn composes multiplicatively over exact power-of-two segments', () => {
  forAll(
    'return composition',
    41,
    100,
    (r) => {
      // powers of two make every division exact
      const a = 2 ** r.int(10, 20);
      const b = 2 ** r.int(10, 20);
      const c = 2 ** r.int(10, 20);
      return { a, b, c };
    },
    ({ a, b, c }) => {
      const r1 = totalReturn([a, b]);
      const r2 = totalReturn([b, c]);
      const whole = totalReturn([a, b, c]);
      if (isRefused(r1) || isRefused(r2) || isRefused(whole)) return false;
      return (1 + r1) * (1 + r2) - 1 === whole;
    }
  );
});
