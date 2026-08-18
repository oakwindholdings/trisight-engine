// assay/tests/phase2.test.ts
// Inflation-factor honesty: ratios only when both sides exist, normalize, and overlap;
// sign divergence is categorical, never a fake number; campaign store is namespace-isolated.

import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { computeInflation, windowOverlapDays, MIN_OVERLAP_DAYS, type SideRecord } from '../phase2/inflation.ts';
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
    window_from: '2023-01-01',
    window_to: '2025-12-31',
    source_citations: ['some/file.md:10'],
    excerpt: 'claimed 40%',
    provenance: 'estate-readonly',
    ...over,
  } as SideRecord;
}

test('happy path: claimed 40%/yr over realized 10%/yr → inflation ratio 4', () => {
  const claim = side({ record_type: 'PredecessorClaim' });
  const realized = side({ record_type: 'PredecessorRealized', annualized_return: 0.1 });
  const r = computeInflation(claim, H1, realized, H2);
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.outcome).toEqual({ kind: 'ratio', value: 4 });
  expect(r.window_overlap_days).toBeGreaterThan(MIN_OVERLAP_DAYS);
});

test('sign divergence: claimed positive, realized non-positive → categorical, never a number', () => {
  const claim = side({ record_type: 'PredecessorClaim' });
  const realized = side({ record_type: 'PredecessorRealized', annualized_return: -0.05 });
  const r = computeInflation(claim, H1, realized, H2);
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.outcome.kind).toBe('sign_divergence');
});

test('refusals: NOT_FOUND side, non-normalizable side, disjoint windows, thin overlap, strategy mismatch', () => {
  const claim = side({ record_type: 'PredecessorClaim' });
  expect(isRefused(computeInflation(claim, H1, side({ record_type: 'PredecessorRealized', status: 'NOT_FOUND' }), H2))).toBe(true);
  expect(isRefused(computeInflation(claim, H1, side({ record_type: 'PredecessorRealized', annualized_return: null, normalization_method: null }), H2))).toBe(true);
  expect(isRefused(computeInflation(claim, H1, side({ record_type: 'PredecessorRealized', annualized_return: 0.1, window_from: '2019-01-01', window_to: '2019-06-01' }), H2))).toBe(true);
  const thin = computeInflation(
    side({ record_type: 'PredecessorClaim', window_from: '2025-01-01', window_to: '2025-12-31' }),
    H1,
    side({ record_type: 'PredecessorRealized', annualized_return: 0.1, window_from: '2025-11-01', window_to: '2025-12-31' }),
    H2
  );
  expect(isRefused(thin) && thin.reason === 'insufficient_history').toBe(true);
  expect(isRefused(computeInflation(claim, H1, side({ record_type: 'PredecessorRealized', strategy: 'Other', annualized_return: 0.1 }), H2))).toBe(true);
});

test('window overlap math: partial overlap counted in days', () => {
  const a = side({ record_type: 'PredecessorClaim', window_from: '2024-01-01', window_to: '2024-12-31' });
  const b = side({ record_type: 'PredecessorRealized', window_from: '2024-07-01', window_to: '2025-06-30' });
  const d = windowOverlapDays(a, b);
  if (isRefused(d)) throw new Error('unexpected');
  expect(d).toBe(183); // 2024-07-01..2024-12-31
});

test('campaign store: roundtrip, type gate, and separation from the Phase-1 store namespace', () => {
  const root = openCampaignStore(mkdtempSync(join(tmpdir(), 'assay-camp-')));
  const rec = { record_type: 'PredecessorClaim', strategy: 'X', payload: 1 };
  const h = putCampaignRecord(root, 'PredecessorClaim', rec);
  if (isRefused(h)) throw new Error('unexpected');
  const all = campaignRecordsOfType(root, 'PredecessorClaim');
  if (isRefused(all)) throw new Error('unexpected');
  expect(all.length).toBe(1);
  expect(all[0]!.value).toEqual(rec);
  const bad = putCampaignRecord(root, 'InflationFactor', rec);
  expect(isRefused(bad)).toBe(true);
});
