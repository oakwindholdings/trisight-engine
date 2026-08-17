// assay/receipt/receipt.ts
// The Receipt: every hash, the exact window, the frictions, the refusals, the worst slice,
// and the single command that reproduces the number. A result without an adversary is 'unverified'.

import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';
import { contentHash, type Hash } from '../kernel/canonical.ts';
import { getObject, putRecord, recordsOfType, type StoreRoot } from '../substrate/store.ts';
import { invokeEvaluate, type RunRecord, type ResultRecord, type EvaluateParamsRecord } from '../substrate/invoke.ts';
import { type AdversaryReport, type Slice } from '../adversary/adversary.ts';

export interface Receipt {
  readonly record_type: 'Receipt';
  readonly result_hash: Hash;
  readonly triple: Hash;
  readonly inputs_hash: Hash;
  readonly code_hash: Hash;
  readonly params_hash: Hash;
  readonly spec_hash: Hash;
  readonly spec_registered_at: string | null;
  readonly registered_after_window: boolean | null;
  readonly snapshot_hashes: readonly Hash[];
  readonly frictions_hash: Hash;
  readonly window: { readonly startT: number; readonly endT: number };
  /** Cato M6: the receipt says out loud whether it certifies a refusal or a number. */
  readonly outcome_kind: 'refused' | 'result';
  readonly headline: {
    readonly totalReturn: number;
    readonly cagrValue: number;
    readonly worstFoldDrawdown: number; // per-fold max, convention declared in EvalResult (Cato M3)
    readonly tradingDays: number;
    readonly periodsPerYear: number;
  } | null;
  readonly refusals: readonly string[];
  readonly adversary_hash: Hash | null;
  /** true only when an adversary ran AND did not find material weakness (Forge finding 18) */
  readonly verified: boolean;
  readonly materially_worse: boolean | 'NOT_RUN'; // the adversary's actual verdict, on the receipt
  readonly worst_slice: Slice | 'NOT_RUN';
  readonly repro_command: string;
}

function findRunForResult(root: StoreRoot, result_hash: Hash): Outcome<RunRecord> {
  const runs = recordsOfType(root, 'Run');
  if (isRefused(runs)) return runs;
  const matches = runs.map((r) => r.value as RunRecord).filter((run) => run.output_hash === result_hash);
  if (matches.length === 0) return refuse('unknown_object', `no Run produced result ${result_hash}`);
  const triples = new Set(matches.map((m) => m.triple));
  if (triples.size > 1) {
    return refuse('invalid_params', `result ${result_hash} is ambiguous across ${triples.size} distinct triples — receipt cannot attribute inputs`);
  }
  return matches[0]!;
}

export function buildReceipt(root: StoreRoot, result_hash: Hash): Outcome<{ hash: Hash; receipt: Receipt }> {
  const resultObj = getObject(root, result_hash);
  if (isRefused(resultObj)) return resultObj;
  const result = resultObj as ResultRecord;
  const run = findRunForResult(root, result_hash);
  if (isRefused(run)) return run;
  const paramsObj = getObject(root, run.params_hash);
  if (isRefused(paramsObj)) return paramsObj;
  const params = paramsObj as EvaluateParamsRecord;
  const frictions_hash = contentHash(params.frictions);
  if (isRefused(frictions_hash)) return frictions_hash;

  const adversaries = recordsOfType(root, 'Adversary');
  if (isRefused(adversaries)) return adversaries;
  const mine = adversaries.filter((a) => (a.value as AdversaryReport).result_hash === result_hash);
  if (mine.length > 1) {
    return refuse('invalid_params', `${mine.length} adversary reports exist for ${result_hash} — ambiguous verdict, supersede one first`);
  }
  const advHash: Hash | null = mine.length === 1 ? mine[0]!.hash : null;
  const adv: AdversaryReport | null = mine.length === 1 ? (mine[0]!.value as AdversaryReport) : null;

  const refusals: string[] = [];
  if (result.outcome.kind === 'refused') {
    refusals.push(`${result.outcome.reason}: ${result.outcome.detail}`);
  } else {
    refusals.push(...result.outcome.notes);
  }

  const receipt: Receipt = {
    record_type: 'Receipt',
    result_hash,
    triple: run.triple,
    inputs_hash: run.inputs_hash,
    code_hash: run.code_hash,
    params_hash: run.params_hash,
    spec_hash: result.spec_hash,
    spec_registered_at: result.spec_registered_at,
    registered_after_window: result.registered_after_window,
    snapshot_hashes: run.snapshot_hashes,
    frictions_hash,
    window: result.window,
    outcome_kind: result.outcome.kind === 'refused' ? 'refused' : 'result',
    headline: result.outcome.kind === 'result' ? result.outcome.headline : null,
    refusals,
    adversary_hash: advHash,
    verified: adv !== null && !adv.materially_worse, // an adversary that found material weakness is not a pass
    materially_worse: adv !== null ? adv.materially_worse : 'NOT_RUN',
    worst_slice: adv !== null ? adv.worst : 'NOT_RUN',
    repro_command: `bun run cli.ts reproduce --result ${result_hash}`,
  };
  const hash = putRecord(root, 'Receipt', receipt as unknown as Record<string, unknown>);
  if (isRefused(hash)) return hash;
  return { hash, receipt };
}

export interface ReproduceReport {
  readonly identical: boolean;
  /** Cato M6: say WHAT was reproduced — a refusal record and a headline are different claims. */
  readonly reproduced: 'refusal' | 'headline';
  /** Cato C2: code drift is checked explicitly, never inferred from a silent byte mismatch. */
  readonly code_drift: boolean;
  readonly recorded_code: Hash;
  readonly current_code: Hash;
  readonly expected: Hash;
  readonly actual: Hash;
}

/** Recompute from the committed cache with the cache bypassed; byte-compare via content hash (A1),
 *  and assert the recorded code_hash matches the tree actually doing the recomputing. */
export function reproduce(root: StoreRoot, result_hash: Hash): Outcome<ReproduceReport> {
  const run = findRunForResult(root, result_hash);
  if (isRefused(run)) return run;
  const original = getObject(root, result_hash);
  if (isRefused(original)) return original;
  const originalResult = original as ResultRecord;
  const paramsObj = getObject(root, run.params_hash);
  if (isRefused(paramsObj)) return paramsObj;
  const re = invokeEvaluate(root, run.snapshot_hashes, paramsObj as EvaluateParamsRecord, {
    bypassCache: true,
    emitTrace: false,
    persist: false, // verification must not mutate the store it verifies (Forge finding 15)
  });
  if (isRefused(re)) return re;
  return {
    identical: re.result_hash === result_hash,
    reproduced: originalResult.outcome.kind === 'refused' ? 'refusal' : 'headline',
    code_drift: re.result.code_hash !== run.code_hash,
    recorded_code: run.code_hash,
    current_code: re.result.code_hash,
    expected: result_hash,
    actual: re.result_hash,
  };
}
