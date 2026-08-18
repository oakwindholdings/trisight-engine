// assay/phase2/inflation.ts
// The inflation factor: claimed vs realized, or an explicit refusal — never a stretched ratio.
// Pure computation over campaign records; annualization method is declared on every output.

import { refuse, isRefused, type Outcome, type Refused } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

export interface SideRecord {
  readonly record_type: 'PredecessorClaim' | 'PredecessorRealized';
  readonly strategy: string;
  readonly seal_ref: string | null;
  readonly status: 'FOUND' | 'PARTIAL' | 'NOT_FOUND';
  readonly value_raw: string | null; // the figure exactly as the source states it
  readonly metric_kind: string | null;
  /** normalized to an annualized simple-return fraction, or null when not normalizable */
  readonly annualized_return: number | null;
  readonly normalization_method: string | null; // declared, human-auditable
  readonly window_from: string | null; // YYYY-MM-DD
  readonly window_to: string | null;
  readonly source_citations: readonly string[];
  readonly excerpt: string | null;
  readonly provenance: 'estate-readonly';
}

export type InflationOutcome =
  | { readonly kind: 'ratio'; readonly value: number }
  | { readonly kind: 'sign_divergence'; readonly detail: string } // claimed positive, realized <= 0: not ratio-able, categorically inflated
  | Refused;

export interface InflationFactor {
  readonly record_type: 'InflationFactor';
  readonly strategy: string;
  readonly claim_hash: Hash;
  readonly realized_hash: Hash;
  readonly claimed_annualized: number;
  readonly realized_annualized: number;
  readonly outcome: InflationOutcome;
  readonly window_overlap_days: number;
  readonly method: string;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Overlap in calendar days between the two windows; both sides must carry complete windows. */
export function windowOverlapDays(a: SideRecord, b: SideRecord): Outcome<number> {
  if (a.window_from === null || a.window_to === null || b.window_from === null || b.window_to === null) {
    return refuse('invalid_params', `window incomplete: claim ${a.window_from}..${a.window_to} vs realized ${b.window_from}..${b.window_to}`);
  }
  const from = a.window_from > b.window_from ? a.window_from : b.window_from;
  const to = a.window_to < b.window_to ? a.window_to : b.window_to;
  if (from >= to) return refuse('invalid_params', `windows do not overlap: ${a.window_from}..${a.window_to} vs ${b.window_from}..${b.window_to}`);
  return daysBetween(from, to);
}

export const MIN_OVERLAP_DAYS = 90; // declared threshold: below this, a ratio would be noise dressed as measurement

/** (claim, realized) -> inflation outcome. Total function; every failure mode is a value. */
export function computeInflation(
  claim: SideRecord,
  claimHash: Hash,
  realized: SideRecord,
  realizedHash: Hash
): Outcome<InflationFactor> {
  if (claim.strategy !== realized.strategy) {
    return refuse('invalid_params', `strategy mismatch: '${claim.strategy}' vs '${realized.strategy}'`);
  }
  if (claim.status === 'NOT_FOUND' || realized.status === 'NOT_FOUND') {
    return refuse('missing_data', `${claim.strategy}: claim ${claim.status}, realized ${realized.status} — no ratio without both sides`);
  }
  if (claim.annualized_return === null || realized.annualized_return === null) {
    return refuse('invalid_params', `${claim.strategy}: side not normalizable to annualized return (claim method: ${claim.normalization_method ?? 'none'}, realized: ${realized.normalization_method ?? 'none'})`);
  }
  const overlap = windowOverlapDays(claim, realized);
  if (isRefused(overlap)) return overlap;
  if (overlap < MIN_OVERLAP_DAYS) {
    return refuse('insufficient_history', `${claim.strategy}: window overlap ${overlap}d < declared minimum ${MIN_OVERLAP_DAYS}d`);
  }
  const c = claim.annualized_return;
  const r = realized.annualized_return;
  let outcome: InflationOutcome;
  if (c > 0 && r <= 0) {
    outcome = { kind: 'sign_divergence', detail: `claimed +${(c * 100).toFixed(1)}%/yr while realized ${(r * 100).toFixed(1)}%/yr — not ratio-able, categorically inflated` };
  } else if (c <= 0 && r <= 0) {
    outcome = refuse('invalid_params', `${claim.strategy}: both sides non-positive — inflation undefined for jointly losing records`);
  } else {
    outcome = { kind: 'ratio', value: c / r };
  }
  return {
    record_type: 'InflationFactor',
    strategy: claim.strategy,
    claim_hash: claimHash,
    realized_hash: realizedHash,
    claimed_annualized: c,
    realized_annualized: r,
    outcome,
    window_overlap_days: overlap,
    method: `annualized-return ratio over >=${MIN_OVERLAP_DAYS}d overlap; sides normalized per their declared normalization_method fields`,
  };
}
