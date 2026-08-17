// assay/tests/substrate.test.ts
// Store write-once/tamper detection, derived-index rebuild, registration idempotency,
// ingress redaction (shown failing first), and the full invoke/cache/replay path with a fake vendor.

import { test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, appendFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openStore, putObject, getObject, putRecord, recordsOfType, rebuildIndex } from '../substrate/store.ts';
import { registerSpec } from '../substrate/registry.ts';
import { ingestDailyBars, readCredential, redact } from '../substrate/ingress.ts';
import { invokeEvaluate, replayTraces, type EvaluateParamsRecord, type Trace } from '../substrate/invoke.ts';
import { validateSpec, specHash } from '../kernel/spec.ts';
import { type Frictions } from '../kernel/sim.ts';
import { isRefused } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

const FAKE_KEY = 'FAKE-SECRET-KEY-0123456789';
const DAY = 86_400_000;

function tempStore(): ReturnType<typeof openStore> {
  return openStore(mkdtempSync(join(tmpdir(), 'assay-test-')));
}

function fakeFetch(status: number, body: unknown): typeof fetch {
  return (async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;
}

function vendorRows(closes: number[]): unknown {
  return {
    results: closes.map((c, i) => ({ t: (i + 1) * DAY, o: c, h: c, l: c, c, v: 1000 })),
  };
}

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

// ---- store ----

test('store: put/get roundtrip, unknown object refusal', () => {
  const root = tempStore();
  const h = putObject(root, { hello: 'assay' });
  if (isRefused(h)) throw new Error('unexpected');
  expect(getObject(root, h)).toEqual({ hello: 'assay' });
  const missing = getObject(root, 'sha256:' + '0'.repeat(64) as Hash);
  expect(isRefused(missing) && missing.reason === 'unknown_object').toBe(true);
});

test('store: tampered bytes are detected on read (A3 seed) and write-once holds', () => {
  const root = tempStore();
  const h = putObject(root, { v: 1 });
  if (isRefused(h)) throw new Error('unexpected');
  const p = join(root.dir, 'objects', h.replace(':', '-'));
  writeFileSync(p, readFileSync(p, 'utf8') + ' '); // tamper
  const read = getObject(root, h);
  expect(isRefused(read) && read.reason === 'hash_mismatch').toBe(true);
  const rewrite = putObject(root, { v: 1 });
  expect(isRefused(rewrite) && rewrite.reason === 'store_immutable').toBe(true);
});

test('store: index is derived — delete it, rebuild it, identical query results', () => {
  const root = tempStore();
  const r1 = putRecord(root, 'Spec', { record_type: 'Spec', spec: { a: 1 } });
  const r2 = putRecord(root, 'Registration', { record_type: 'Registration', spec_hash: 'sha256:' + 'a'.repeat(64), registered_at: '2026-01-01T00:00:00Z' });
  if (isRefused(r1) || isRefused(r2)) throw new Error('unexpected');
  const before = recordsOfType(root, 'Spec');
  if (isRefused(before)) throw new Error('unexpected');
  rmSync(join(root.dir, 'index.sqlite'));
  const n = rebuildIndex(root);
  if (isRefused(n)) throw new Error('unexpected');
  expect(n).toBe(2);
  const after = recordsOfType(root, 'Spec');
  expect(after).toEqual(before);
});

test('cold start: a fresh openStore over existing objects self-materializes the index (A1)', () => {
  const root = tempStore();
  const r = putRecord(root, 'Spec', { record_type: 'Spec', spec: { cold: true } });
  if (isRefused(r)) throw new Error('unexpected');
  rmSync(join(root.dir, 'index.sqlite'));
  const reopened = openStore(root.dir); // simulates a clone where the gitignored index never existed
  const specs = recordsOfType(reopened, 'Spec');
  if (isRefused(specs)) throw new Error('unexpected');
  expect(specs.length).toBe(1);
});

test('store: record_type field must match the declared type', () => {
  const root = tempStore();
  const bad = putRecord(root, 'Result', { record_type: 'Spec' });
  expect(isRefused(bad)).toBe(true);
});

// ---- registry ----

test('registry: registration is idempotent by content and keeps the ORIGINAL timestamp', () => {
  const root = tempStore();
  const first = registerSpec(root, RAW_SPEC, () => '2026-08-17T10:00:00Z');
  if (isRefused(first)) throw new Error('unexpected');
  expect(first.already_registered).toBe(false);
  const second = registerSpec(root, RAW_SPEC, () => '2026-08-18T10:00:00Z');
  if (isRefused(second)) throw new Error('unexpected');
  expect(second.already_registered).toBe(true);
  expect(second.registered_at).toBe('2026-08-17T10:00:00Z');
});

// ---- ingress ----

test('credential: absent AND set-but-empty both refuse by name, never by value', () => {
  const absent = readCredential({});
  expect(isRefused(absent) && absent.reason === 'missing_credential').toBe(true);
  const empty = readCredential({ MASSIVE_API_KEY: '' });
  expect(isRefused(empty) && empty.reason === 'missing_credential').toBe(true);
  if (isRefused(empty)) expect(empty.detail).toContain('MASSIVE_API_KEY'); // named by variable, never by value
});

test('RED-FIRST redaction: the vendor echoes the key back; unredacted it WOULD leak; refusal detail does not', async () => {
  const root = tempStore();
  const echoBody = `{"status":"NOT_AUTHORIZED","message":"Your key ${FAKE_KEY} is invalid."}`;
  // guard shown failing: the raw vendor body really does contain the secret
  expect(echoBody).toContain(FAKE_KEY);
  expect(redact(echoBody, FAKE_KEY)).not.toContain(FAKE_KEY);
  const r = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-10', {
    fetchImpl: fakeFetch(401, echoBody),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  expect(isRefused(r) && r.reason === 'vendor_auth_failed').toBe(true);
  if (isRefused(r)) {
    expect(r.detail).not.toContain(FAKE_KEY);
    expect(r.detail).toContain('[REDACTED]');
  }
});

test('ingress: valid payload stores an immutable vendor snapshot with a keyless URL', async () => {
  const root = tempStore();
  const r = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-10', {
    fetchImpl: fakeFetch(200, vendorRows([100, 101, 102])),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.snapshot.provenance).toBe('vendor');
  expect(r.snapshot.barCount).toBe(3);
  expect(r.snapshot.url).not.toContain(FAKE_KEY);
  expect(r.snapshot.bars[0]!.cMicros).toBe(100_000_000);
});

test('ingress: malformed rows and zero rows refuse — never coerced, never completed', async () => {
  const root = tempStore();
  const bad = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-10', {
    fetchImpl: fakeFetch(200, { results: [{ t: 1, o: 'oops', h: 1, l: 1, c: 1, v: 1 }] }),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  expect(isRefused(bad) && bad.reason === 'vendor_malformed').toBe(true);
  const zero = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-10', {
    fetchImpl: fakeFetch(200, { results: [] }),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  expect(isRefused(zero) && zero.reason === 'missing_data').toBe(true);
});

// ---- invoke / cache / replay ----

async function seededStore(): Promise<{ root: ReturnType<typeof openStore>; params: EvaluateParamsRecord; snapHash: Hash }> {
  const root = tempStore();
  const reg = registerSpec(root, RAW_SPEC, () => '2026-08-17T10:00:00Z');
  if (isRefused(reg)) throw new Error('unexpected');
  const closes = [100, 100, 100, 90, 85, 110, 130, 150, 150, 100, 70, 60, 80, 90, 95, 100];
  const ing = await ingestDailyBars(root, 'X', '2023-01-01', '2023-01-16', {
    fetchImpl: fakeFetch(200, vendorRows(closes)),
    env: { MASSIVE_API_KEY: FAKE_KEY },
  });
  if (isRefused(ing)) throw new Error('unexpected');
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
  return { root, params, snapHash: ing.hash };
}

test('invoke: computes, stores, then CACHE-HITS on the identical triple without recompute', async () => {
  const { root, params, snapHash } = await seededStore();
  const first = invokeEvaluate(root, [snapHash], params);
  if (isRefused(first)) throw new Error('unexpected');
  expect(first.cache_hit).toBe(false);
  expect(first.result.outcome.kind).toBe('result');
  expect(first.result.registered_after_window).toBe(true); // registered 2026, window 1970-ms-scale — honest flag
  const second = invokeEvaluate(root, [snapHash], params);
  if (isRefused(second)) throw new Error('unexpected');
  expect(second.cache_hit).toBe(true);
  expect(second.result_hash).toBe(first.result_hash);
  const traces = readFileSync(join(root.dir, 'traces', 'traces.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l) as Trace);
  expect(traces.length).toBe(2);
  expect(traces[1]!.cache_hit).toBe(true);
});

test('A3: corrupted/unknown input hash refuses with a trace — never a number', async () => {
  const { root, params } = await seededStore();
  const bogus = ('sha256:' + 'b'.repeat(64)) as Hash;
  const r = invokeEvaluate(root, [bogus], params);
  if (isRefused(r)) throw new Error('invoke itself should store the refusal as the outcome');
  expect(r.result.outcome.kind).toBe('refused');
  if (r.result.outcome.kind === 'refused') expect(r.result.outcome.reason).toBe('unknown_object');
});

test('I3: null registration refuses evaluation (unregistered_spec)', async () => {
  const { root, params, snapHash } = await seededStore();
  const r = invokeEvaluate(root, [snapHash], { ...params, registration: null });
  if (isRefused(r)) throw new Error('unexpected');
  expect(r.result.outcome.kind).toBe('refused');
  if (r.result.outcome.kind === 'refused') expect(r.result.outcome.reason).toBe('unregistered_spec');
});

test('A5 replay: recorded invocations re-execute byte-identically; a doctored trace is CAUGHT', async () => {
  const { root, params, snapHash } = await seededStore();
  const first = invokeEvaluate(root, [snapHash], params);
  if (isRefused(first)) throw new Error('unexpected');
  const clean = replayTraces(root);
  if (isRefused(clean)) throw new Error('unexpected');
  expect(clean.checked).toBeGreaterThan(0);
  expect(clean.drifted.length).toBe(0);
  // red-first: forge a trace claiming a different output hash — replay must flag it
  const tracesFile = join(root.dir, 'traces', 'traces.jsonl');
  const forged: Trace = {
    ...(JSON.parse(readFileSync(tracesFile, 'utf8').trim().split('\n')[0]!) as Trace),
    trace_id: 'forged',
    triple: ('sha256:' + 'c'.repeat(64)) as Hash,
    output_hash: ('sha256:' + 'd'.repeat(64)) as Hash,
  };
  appendFileSync(tracesFile, JSON.stringify(forged) + '\n');
  const dirty = replayTraces(root);
  if (isRefused(dirty)) throw new Error('unexpected');
  expect(dirty.drifted.length).toBe(1);
  expect(dirty.drifted[0]!.trace_id).toBe('forged');
});

test('A6 seed: with the fake key in play, no store object or trace contains it', async () => {
  const { root } = await seededStore();
  const files = [join(root.dir, 'traces', 'traces.jsonl')];
  if (existsSync(files[0]!)) {
    expect(readFileSync(files[0]!, 'utf8')).not.toContain(FAKE_KEY);
  }
  // and every stored object
  const { readdirSync } = await import('node:fs');
  for (const f of readdirSync(join(root.dir, 'objects'))) {
    expect(readFileSync(join(root.dir, 'objects', f), 'utf8')).not.toContain(FAKE_KEY);
  }
});
