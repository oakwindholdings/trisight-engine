// assay/tests/phase2.test.ts
// Inflation-factor honesty on both dimensions: return ratios only when both sides normalize with
// adequate duration; win-rate ratios only over adequate populations; refusals everywhere else.

import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeInflation, MIN_SIDE_DAYS, MIN_WIN_RATE_N, type SideRecord } from '../phase2/inflation.ts';
import { openCampaignStore, putCampaignRecord, campaignRecordsOfType } from '../phase2/campaignStore.ts';
import { isRefused } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

const H1 = ('sha256:' + '1'.repeat(64)) as Hash;
const H2 = ('sha256:' + '2'.repeat(64)) as Hash;

function side(over: Partial<SideRecord> & { record_type: SideRecord['record_type'] }): SideRecord {
  return {
    strategy: 'TestStrat',
    seal_ref: 'abc',
    status: 'FOUND',
    value_raw: '+40%/yr',
    metric_kind: 'cagr',
    annualized_return: 0.4,
    normalization_method: 'stated CAGR used directly',
    win_rate: 0.9,
    win_rate_n: 1000,
    window_from: '2023-01-01',
    window_to: '2025-12-31',
    integrity_flags: [],
    source_citations: ['some/file.md:10'],
    excerpt: 'claimed 40%',
    provenance: 'estate-readonly',
    ...over,
  } as SideRecord;
}

test('happy path: 40%/yr over 10%/yr → return ratio 4; 90% vs 45% → win-rate ratio 2', () => {
  const claim = side({ record_type: 'PredecessorClaim' });
  const realized = side({ record_type: 'PredecessorRealized', annualized_return: 0.1, win_rate: 0.45, win_rate_n: 100 });
  const r = computeInflation(claim, H1, realized, H2);
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.return_outcome).toEqual({ kind: 'ratio', value: 4 });
  expect(r.win_rate_ratio).toBe(2);
});

test('sign divergence: claimed positive, realized non-positive → categorical, never a number', () => {
  const r = computeInflation(
    side({ record_type: 'PredecessorClaim' }),
    H1,
    side({ record_type: 'PredecessorRealized', annualized_return: -0.05 }),
    H2
  );
  if (isRefused(r)) throw new Error(r.detail);
  expect((r.return_outcome as { kind: string }).kind).toBe('sign_divergence');
});

test('NOT_FOUND side refuses the whole comparison (Earnings-93 zero-fills shape)', () => {
  const r = computeInflation(
    side({ record_type: 'PredecessorClaim' }),
    H1,
    side({ record_type: 'PredecessorRealized', status: 'NOT_FOUND', annualized_return: null, win_rate: null }),
    H2
  );
  expect(isRefused(r) && r.reason === 'missing_data').toBe(true);
});

test('short realized duration: record produced, return dimension refused, win rate still measured', () => {
  const r = computeInflation(
    side({ record_type: 'PredecessorClaim' }),
    H1,
    side({ record_type: 'PredecessorRealized', annualized_return: 0.1, win_rate: 0.45, win_rate_n: 200, window_from: '2026-07-01', window_to: '2026-07-20' }),
    H2
  );
  if (isRefused(r)) throw new Error(r.detail);
  const o = r.return_outcome as { kind?: string; reason?: string };
  expect(o.reason).toBe('insufficient_history');
  expect(r.win_rate_ratio).toBe(2);
  expect(r.realized_days).toBeLessThan(MIN_SIDE_DAYS);
});

test('claim with no declared window (Escalator shape): return refused, win-rate ratio survives', () => {
  const r = computeInflation(
    side({ record_type: 'PredecessorClaim', window_from: null, window_to: null }),
    H1,
    side({ record_type: 'PredecessorRealized', annualized_return: 0.1, win_rate: 0.45, win_rate_n: 150 }),
    H2
  );
  if (isRefused(r)) throw new Error(r.detail);
  expect((r.return_outcome as { reason?: string }).reason).toBe('invalid_params');
  expect(r.win_rate_ratio).toBe(2);
});

test('win-rate population floor: n < MIN_WIN_RATE_N → not computed (Oakwind Investor real-only shape)', () => {
  const r = computeInflation(
    side({ record_type: 'PredecessorClaim' }),
    H1,
    side({ record_type: 'PredecessorRealized', annualized_return: 0.1, win_rate: 0.381, win_rate_n: MIN_WIN_RATE_N - 9 }),
    H2
  );
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.win_rate_ratio).toBe(null);
  expect(r.win_rate_note).toContain('floor');
});

test('strategy mismatch refuses', () => {
  const r = computeInflation(side({ record_type: 'PredecessorClaim' }), H1, side({ record_type: 'PredecessorRealized', strategy: 'Other' }), H2);
  expect(isRefused(r)).toBe(true);
});

test('campaign store: roundtrip, type gate, separation from the Phase-1 namespace', () => {
  const root = openCampaignStore(mkdtempSync(join(tmpdir(), 'assay-camp-')));
  const rec = { record_type: 'PredecessorClaim', strategy: 'X', payload: 1 };
  const h = putCampaignRecord(root, 'PredecessorClaim', rec);
  if (isRefused(h)) throw new Error('unexpected');
  const all = campaignRecordsOfType(root, 'PredecessorClaim');
  if (isRefused(all)) throw new Error('unexpected');
  expect(all.length).toBe(1);
  expect(isRefused(putCampaignRecord(root, 'InflationFactor', rec))).toBe(true);
});
