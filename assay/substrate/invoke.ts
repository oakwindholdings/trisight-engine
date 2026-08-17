// assay/substrate/invoke.ts
// Lambda-discipline invocation: inputs arrive as content hashes or hashed params, never ambient state (I1).
// Registration facts and the spec ride INSIDE params — replay depends on nothing queryable. Trace = audit log.

import { appendFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { contentHash, type Hash } from '../kernel/canonical.ts';
import { refuse, isRefused, type Outcome, type Refused } from '../kernel/refusal.ts';
import { loadAsOf, loadUniverse, type AsOfSeries, type Bar } from '../kernel/bars.ts';
import { evaluate, type EvalResult, type EvalWindow, type EvalParams } from '../kernel/evaluate.ts';
import { type Frictions } from '../kernel/sim.ts';
import { specHash, type Spec } from '../kernel/spec.ts';
import { getObject, putRecord, recordsOfType, type StoreRoot } from './store.ts';
import { kernelCodeHash } from './codehash.ts';
import { type DataSnapshot } from './ingress.ts';

export interface EvaluateParamsRecord {
  readonly record_type: 'Params';
  readonly spec: Spec; // the spec is data and rides in params — no store query in the compute path
  readonly spec_hash: Hash;
  readonly registration: { readonly registered_at: string } | null; // resolved BEFORE invoke; part of the hashed input surface
  readonly frictions: Frictions;
  readonly window: EvalWindow;
  readonly evalParams: EvalParams;
}

export interface ResultRecord {
  readonly record_type: 'Result';
  readonly spec_hash: Hash;
  readonly spec_registered_at: string | null;
  readonly registered_after_window: boolean | null;
  readonly window: EvalWindow;
  // Forge finding 7 + Cato C2: a Result must be self-describing so one result_hash cannot be
  // reachable from two different triples — inputs, params, AND code ride inside the record.
  readonly inputs_hash: Hash;
  readonly params_hash: Hash;
  readonly code_hash: Hash;
  readonly outcome: EvalResult | Refused;
}

/** Forge finding 2 (proven TZ-dependent): strict UTC ISO-8601 only. A malformed timestamp
 *  refuses — it never defaults to the favorable answer. */
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
function registeredAtMs(s: string): Outcome<number> {
  if (!ISO_UTC.test(s)) return refuse('invalid_params', `registered_at must be ISO-8601 UTC with trailing Z, got '${s}'`);
  const ms = Date.parse(s);
  if (!Number.isFinite(ms)) return refuse('invalid_params', `unparseable registered_at '${s}'`);
  return ms;
}

export interface RunRecord {
  readonly record_type: 'Run';
  readonly entry: 'evaluate';
  readonly triple: Hash;
  readonly inputs_hash: Hash;
  readonly code_hash: Hash;
  readonly params_hash: Hash;
  readonly snapshot_hashes: readonly Hash[];
  readonly output_hash: Hash;
  readonly refusal_reason: string | null;
  readonly started_at: string;
}

export interface Trace {
  readonly trace_id: string;
  readonly ts: string;
  readonly entry: 'evaluate';
  readonly triple: Hash;
  readonly inputs_hash: Hash;
  readonly code_hash: Hash;
  readonly params_hash: Hash;
  readonly snapshot_hashes: readonly Hash[];
  readonly output_hash: Hash;
  readonly refusal_reason: string | null;
  readonly wall_ms: number; // metadata only — excluded from every content hash
  readonly cache_hit: boolean;
}

function tracesPath(root: StoreRoot): string {
  return join(root.dir, 'traces', 'traces.jsonl');
}

function emitTrace(root: StoreRoot, t: Trace): void {
  appendFileSync(tracesPath(root), JSON.stringify(t) + '\n');
}

export interface InvokeOptions {
  readonly bypassCache?: boolean;
  readonly emitTrace?: boolean;
  /** Forge finding 15: verification must not mutate what it verifies — reproduce/replay set false. */
  readonly persist?: boolean;
}

/** Pure recompute: a function of content-addressed store objects + hashed params + kernel code. */
function computeResult(
  root: StoreRoot,
  snapshotHashes: readonly Hash[],
  params: EvaluateParamsRecord,
  inputs_hash: Hash,
  params_hash: Hash,
  code_hash: Hash
): Outcome<ResultRecord> {
  let outcome: EvalResult | Refused;
  let afterWindow: boolean | null = null;
  const declaredHash = specHash(params.spec);
  let regMs: number | null = null;
  let regRefusal: Refused | null = null;
  if (params.registration !== null) {
    const m = registeredAtMs(params.registration.registered_at);
    if (isRefused(m)) regRefusal = m;
    else regMs = m;
  }
  if (isRefused(declaredHash)) {
    outcome = declaredHash;
  } else if (declaredHash !== params.spec_hash) {
    outcome = refuse('invalid_params', `params.spec hashes to ${declaredHash}, claims ${params.spec_hash}`);
  } else if (params.registration === null) {
    outcome = refuse('unregistered_spec', `spec ${params.spec_hash} has no registration record (I3)`);
  } else if (regRefusal !== null) {
    outcome = regRefusal; // malformed timestamp refuses — never defaults to the favorable answer
  } else {
    afterWindow = (regMs as number) > params.window.endT;
    const series = new Map<string, AsOfSeries>();
    let loadFailure: Refused | null = null;
    for (const h of snapshotHashes) {
      const obj = getObject(root, h);
      if (isRefused(obj)) {
        loadFailure = obj;
        break;
      }
      const snap = obj as DataSnapshot;
      if (snap.record_type !== 'DataSnapshot' || snap.provenance !== 'vendor' || !Array.isArray(snap.bars)) {
        loadFailure = refuse('invalid_params', `${h} is not a well-formed vendor DataSnapshot — fixtures cannot enter evaluation`);
        break;
      }
      if (series.has(snap.symbol)) {
        loadFailure = refuse('invalid_params', `duplicate snapshot for ${snap.symbol}`);
        break;
      }
      const bars: Bar[] = snap.bars.filter((b) => b.t <= params.window.endT);
      const s = loadAsOf(snap.symbol, params.window.endT, bars);
      if (isRefused(s)) {
        loadFailure = s;
        break;
      }
      series.set(snap.symbol, s);
    }
    if (loadFailure !== null) {
      outcome = loadFailure;
    } else {
      const missing = params.spec.universe.filter((s) => !series.has(s));
      if (missing.length > 0) {
        outcome = refuse('partial_universe', `no snapshots for: ${missing.join(', ')} — never silently completed`);
      } else {
        const universe = loadUniverse(params.window.endT, series);
        if (isRefused(universe)) {
          outcome = universe;
        } else {
          outcome = evaluate(params.spec, universe, params.frictions, params.window, params.evalParams);
        }
      }
    }
  }

  return {
    record_type: 'Result',
    spec_hash: params.spec_hash,
    spec_registered_at: params.registration?.registered_at ?? null,
    registered_after_window: afterWindow,
    window: params.window,
    inputs_hash,
    params_hash,
    code_hash,
    outcome,
  };
}

export function invokeEvaluate(
  root: StoreRoot,
  snapshotHashes: readonly Hash[],
  params: EvaluateParamsRecord,
  opts: InvokeOptions = {}
): Outcome<{ result_hash: Hash; result: ResultRecord; cache_hit: boolean; triple: Hash }> {
  const started = performance.now();
  const persist = opts.persist !== false;
  const sortedSnaps = [...snapshotHashes].sort();
  const inputs_hash = contentHash({ snapshot_hashes: sortedSnaps });
  if (isRefused(inputs_hash)) return inputs_hash;
  const params_hash = persist
    ? putRecord(root, 'Params', params as unknown as Record<string, unknown>)
    : contentHash(params); // putRecord's hash IS contentHash — persist:false computes without writing
  if (isRefused(params_hash)) return params_hash;
  const code_hash = kernelCodeHash();
  const triple = contentHash({ entry: 'evaluate', inputs_hash, code_hash, params_hash });
  if (isRefused(triple)) return triple;

  if (opts.bypassCache !== true) {
    const runs = recordsOfType(root, 'Run');
    if (isRefused(runs)) return runs;
    for (const r of runs) {
      const run = r.value as RunRecord;
      if (run.triple === triple) {
        const cached = getObject(root, run.output_hash);
        if (isRefused(cached)) return cached;
        if (opts.emitTrace !== false) {
          emitTrace(root, {
            trace_id: `${triple}#cache`,
            ts: new Date().toISOString(),
            entry: 'evaluate',
            triple,
            inputs_hash,
            code_hash,
            params_hash,
            snapshot_hashes: sortedSnaps,
            output_hash: run.output_hash,
            refusal_reason: run.refusal_reason,
            wall_ms: performance.now() - started,
            cache_hit: true,
          });
        }
        return { result_hash: run.output_hash, result: cached as ResultRecord, cache_hit: true, triple };
      }
    }
  }

  const result = computeResult(root, sortedSnaps, params, inputs_hash, params_hash, code_hash);
  if (isRefused(result)) return result; // store-level failure, not a domain refusal
  const output_hash = persist
    ? putRecord(root, 'Result', result as unknown as Record<string, unknown>)
    : contentHash(result);
  if (isRefused(output_hash)) return output_hash;
  const refusal_reason = result.outcome.kind === 'refused' ? result.outcome.reason : null;

  const run: RunRecord = {
    record_type: 'Run',
    entry: 'evaluate',
    triple,
    inputs_hash,
    code_hash,
    params_hash,
    snapshot_hashes: sortedSnaps,
    output_hash,
    refusal_reason,
    started_at: new Date().toISOString(),
  };
  if (persist) {
    const runStored = putRecord(root, 'Run', run as unknown as Record<string, unknown>);
    if (isRefused(runStored)) return runStored;
  }

  if (opts.emitTrace !== false) {
    emitTrace(root, {
      trace_id: `${triple}#${run.started_at}`,
      ts: run.started_at,
      entry: 'evaluate',
      triple,
      inputs_hash,
      code_hash,
      params_hash,
      snapshot_hashes: sortedSnaps,
      output_hash,
      refusal_reason,
      wall_ms: performance.now() - started,
      cache_hit: false,
    });
  }
  return { result_hash: output_hash, result, cache_hit: false, triple };
}

export interface ReplayReport {
  readonly checked: number;
  readonly drifted: { trace_id: string; expected: Hash; actual: Hash }[];
  /** Cato C2 / Forge F29: code-changed is a DIFFERENT fact from nondeterminism — reported separately. */
  readonly code_drift: { trace_id: string; recorded_code: Hash; current_code: Hash }[];
}

/** Determinism CI (A5): re-execute recorded invocations, assert byte-identical output hashes. */
export function replayTraces(root: StoreRoot): Outcome<ReplayReport> {
  const p = tracesPath(root);
  if (!existsSync(p)) return { checked: 0, drifted: [], code_drift: [] };
  const lines = readFileSync(p, 'utf8').split('\n').filter((l) => l.length > 0);
  const seen = new Set<string>();
  let checked = 0;
  const drifted: { trace_id: string; expected: Hash; actual: Hash }[] = [];
  const code_drift: { trace_id: string; recorded_code: Hash; current_code: Hash }[] = [];
  const currentCode = kernelCodeHash();
  for (const line of lines) {
    const t = JSON.parse(line) as Trace;
    if (t.cache_hit) continue;
    if (seen.has(t.triple)) continue;
    seen.add(t.triple);
    if (t.code_hash !== currentCode) {
      // the trace certifies a code state the tree no longer contains — a distinct failure (Cato C1/C2)
      code_drift.push({ trace_id: t.trace_id, recorded_code: t.code_hash, current_code: currentCode });
      continue;
    }
    const paramsObj = getObject(root, t.params_hash);
    if (isRefused(paramsObj)) return paramsObj;
    const re = invokeEvaluate(root, t.snapshot_hashes, paramsObj as EvaluateParamsRecord, {
      bypassCache: true,
      emitTrace: false,
      persist: false, // verification must not mutate the store it verifies
    });
    if (isRefused(re)) return re;
    checked++;
    if (re.result_hash !== t.output_hash) {
      drifted.push({ trace_id: t.trace_id, expected: t.output_hash, actual: re.result_hash });
    }
  }
  return { checked, drifted, code_drift };
}
