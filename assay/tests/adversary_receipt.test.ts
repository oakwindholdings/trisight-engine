// assay/tests/adversary_receipt.test.ts
// The adversary names a worst slice deterministically; the receipt marks unverified results,
// carries every hash, and reproduce() byte-compares a from-scratch recompute (A1 mechanism).

import { test, expect } from 'bun:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore } from '../substrate/store.ts';
import { registerSpec } from '../substrate/registry.ts';
import { ingestDailyBars } from '../substrate/ingress.ts';
import { invokeEvaluate, type EvaluateParamsRecord } from '../substrate/invoke.ts';
import { runAdversary } from '../adversary/adversary.ts';
import { buildReceipt, reproduce } from '../receipt/receipt.ts';
import { validateSpec, specHash } from '../kernel/spec.ts';
import { type Frictions } from '../kernel/sim.ts';
import { isRefused } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

const DAY = 86_400_000;
const FAKE_KEY = 'FAKE-SECRET-KEY-0123456789';

const RAW_SPEC = {
  name: 'test-sma',
  universe: ['X', 'Y'],
  signal: { kind: 'sma_cross', fast: 2, slow: 3 },
  sizing: { kind: 'fixed_cash', cashMicros: 10_000_000_000 },
  entry: { kind: 'next_open' },
  exit: { kind: 'signal_flip' },
  risk: { maxOpenPositions: 2 },
};

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

function fakeFetch(closes: number[]): typeof fetch {
  return (async () =>
    new Response(
      JSON.stringify({ results: closes.map((c, i) => ({ t: (i + 1) * DAY, o: c, h: c, l: c, c, v: 1000 })) }),
      { status: 200 }
    )) as unknown as typeof fetch;
}

async function fullChain(): Promise<{ root: ReturnType<typeof openStore>; result_hash: Hash }> {
  const root = openStore(mkdtempSync(join(tmpdir(), 'assay-ar-')));
  const reg = registerSpec(root, RAW_SPEC, () => '2026-08-17T10:00:00Z');
  if (isRefused(reg)) throw new Error('unexpected');
  const closesX = [100, 100, 100, 90, 85, 110, 130, 150, 150, 100, 70, 60, 80, 90, 95, 100];
  const closesY = [50, 51, 52, 53, 52, 51, 50, 55, 60, 65, 70, 60, 50, 45, 50, 55];
  const iX = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-16', { fetchImpl: fakeFetch(closesX), env: { MASSIVE_API_KEY: FAKE_KEY } });
  const iY = await ingestDailyBars(root, 'Y', '2023-01-01', '2023-01-16', { fetchImpl: fakeFetch(closesY), env: { MASSIVE_API_KEY: FAKE_KEY } });
  if (isRefused(iX) || isRefused(iY)) throw new Error('unexpected');
  const spec = validateSpec(RAW_SPEC);
  if (isRefused(spec)) throw new Error('unexpected');
  const sHash = specHash(spec);
  if (isRefused(sHash)) throw new Error('unexpected');
  const params: EvaluateParamsRecord = {
    record_type: 'Params',
    spec,
    spec_hash: sHash,
    registration: { registered_at: reg.registered_at },
    frictions: F,
    window: { startT: 5 * DAY, endT: 16 * DAY },
    evalParams: { initialCashMicros: 100_000_000_000, foldCount: 2 },
  };
  const r = invokeEvaluate(root, [iX.hash, iY.hash], params);
  if (isRefused(r)) throw new Error('unexpected');
  if (r.result.outcome.kind !== 'result') throw new Error(`chain refused: ${r.result.outcome.detail}`);
  return { root, result_hash: r.result_hash };
}

test('adversary: names a worst slice; enumeration is deterministic (same report hash twice)', async () => {
  const { root, result_hash } = await fullChain();
  const a1 = runAdversary(root, result_hash);
  if (isRefused(a1)) throw new Error(a1.detail);
  expect(a1.report.slices.length).toBeGreaterThanOrEqual(4); // 2 folds + 2 symbols at minimum
  expect(a1.report.worst.totalReturn).toBeLessThanOrEqual(a1.report.headlineReturn);
  const a2 = runAdversary(root, result_hash);
  if (isRefused(a2)) throw new Error(a2.detail);
  expect(a2.hash).toBe(a1.hash);
});

test('adversary refuses to slice a refusal-result', async () => {
  const { root, result_hash } = await fullChain();
  void result_hash;
  const bogus = ('sha256:' + 'e'.repeat(64)) as Hash;
  const r = runAdversary(root, bogus);
  expect(isRefused(r)).toBe(true);
});

test('receipt: unverified without adversary (worst NOT_RUN), verified with; reproduce is byte-identical', async () => {
  const { root, result_hash } = await fullChain();
  const before = buildReceipt(root, result_hash);
  if (isRefused(before)) throw new Error(before.detail);
  expect(before.receipt.verified).toBe(false);
  expect(before.receipt.honesty_flags).toContain('no_adversary');
  expect(before.receipt.worst_slice).toBe('NOT_RUN');
  expect(before.receipt.materially_worse).toBe('NOT_RUN');
  expect(before.receipt.registered_after_window).toBe(true); // honesty marker present
  const adv = runAdversary(root, result_hash);
  if (isRefused(adv)) throw new Error('unexpected');
  const after = buildReceipt(root, result_hash);
  if (isRefused(after)) throw new Error('unexpected');
  // X3 aggregation rule: verified requires ZERO live honesty flags — this historical chain always
  // carries registered_after_window (and pre-epoch stores carry epoch_declared_after_run)
  expect(after.receipt.verified).toBe(false);
  expect(after.receipt.honesty_flags).toContain('registered_after_window');
  expect(after.receipt.honesty_flags).toContain('epoch_declared_after_run');
  if (adv.report.materially_worse) expect(after.receipt.honesty_flags).toContain('materially_worse');
  expect(after.receipt.materially_worse).toBe(adv.report.materially_worse);
  expect(after.receipt.worst_slice).not.toBe('NOT_RUN');
  expect(after.receipt.adversary_hash).toBe(adv.hash);
  expect(after.receipt.repro_command).toContain(result_hash);
  const rep = reproduce(root, result_hash);
  if (isRefused(rep)) throw new Error('unexpected');
  expect(rep.identical).toBe(true);
});
