// assay/phase2/inflation.ts
// The inflation factor: claimed vs realized on two declared dimensions — annualized return and
// win rate — or an explicit refusal. Backtest and paper windows differ BY NATURE (claims are
// history, paper is 2026); that regime difference is disclosed on every output, never hidden.

import { refuse, isRefused, type Outcome, type Refused } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

export interface SideRecord {
  readonly record_type: 'PredecessorClaim' | 'PredecessorRealized';
  readonly strategy: string;
  readonly seal_ref: string | null;
  readonly status: 'FOUND' | 'PARTIAL' | 'NOT_FOUND';
  readonly value_raw: string | null; // the figure exactly as the source states it
  readonly metric_kind: string | null;
  /** normalized to an annualized simple-return fraction, or null when not honestly normalizable */
  readonly annualized_return: number | null;
  readonly normalization_method: string | null; // declared, human-auditable
  /** win rate as a fraction, when the source states one */
  readonly win_rate: number | null;
  readonly win_rate_n: number | null; // population behind the win rate
  readonly window_from: string | null; // YYYY-MM-DD
  readonly window_to: string | null;
  readonly integrity_flags: readonly string[]; // known contamination on record (defect ids etc.)
  readonly source_citations: readonly string[];
  readonly excerpt: string | null;
  readonly provenance: 'estate-readonly';
}

export type ReturnOutcome =
  | { readonly kind: 'ratio'; readonly value: number }
  | { readonly kind: 'sign_divergence'; readonly detail: string } // claimed positive, realized <= 0
  | Refused;

export interface InflationFactor {
  readonly record_type: 'InflationFactor';
  readonly strategy: string;
  readonly claim_hash: Hash;
  readonly realized_hash: Hash;
  readonly return_outcome: ReturnOutcome;
  readonly claimed_annualized: number | null;
  readonly realized_annualized: number | null;
  /** claimed win rate / realized win rate — >1 means the claim overstated hit rate */
  readonly win_rate_ratio: number | null;
  readonly win_rate_note: string;
  readonly claim_days: number | null;
  readonly realized_days: number | null;
  readonly regime_note: string;
  readonly method: string;
}

export const MIN_SIDE_DAYS = 60; // annualizing a shorter record is noise dressed as measurement
export const MIN_WIN_RATE_N = 30; // a hit-rate over fewer closed trades is not a population

function sideDays(s: SideRecord): number | null {
  if (s.window_from === null || s.window_to === null) return null;
  const d = Math.round((Date.parse(`${s.window_to}T00:00:00Z`) - Date.parse(`${s.window_from}T00:00:00Z`)) / 86_400_000);
  return Number.isFinite(d) && d > 0 ? d : null;
}

function returnOutcome(claim: SideRecord, realized: SideRecord): ReturnOutcome {
  if (claim.annualized_return === null || realized.annualized_return === null) {
    return refuse(
      'invalid_params',
      `${claim.strategy}: side not normalizable to annualized return (claim: ${claim.normalization_method ?? 'none'}; realized: ${realized.normalization_method ?? 'none'})`
    );
  }
  const cd = sideDays(claim);
  const rd = sideDays(realized);
  if (cd === null || rd === null) return refuse('invalid_params', `${claim.strategy}: side window incomplete`);
  if (cd < MIN_SIDE_DAYS || rd < MIN_SIDE_DAYS) {
    return refuse('insufficient_history', `${claim.strategy}: side duration below declared ${MIN_SIDE_DAYS}d floor (claim ${cd}d, realized ${rd}d)`);
  }
  const c = claim.annualized_return;
  const r = realized.annualized_return;
  if (c > 0 && r <= 0) {
    return { kind: 'sign_divergence', detail: `claimed +${(c * 100).toFixed(1)}%/yr while realized ${(r * 100).toFixed(1)}%/yr — not ratio-able, categorically inflated` };
  }
  if (c <= 0 && r <= 0) return refuse('invalid_params', `${claim.strategy}: both sides non-positive — inflation undefined`);
  return { kind: 'ratio', value: c / r };
}

/** (claim, realized) -> inflation record. Total; every failure mode is a value on the record. */
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
    return refuse('missing_data', `${claim.strategy}: claim ${claim.status}, realized ${realized.status} — no comparison without both sides`);
  }

  let win_rate_ratio: number | null = null;
  let win_rate_note: string;
  if (claim.win_rate === null || realized.win_rate === null) {
    win_rate_note = 'NOT COMPUTED: a side lacks a stated win rate';
  } else if (realized.win_rate_n === null || realized.win_rate_n < MIN_WIN_RATE_N) {
    win_rate_note = `NOT COMPUTED: realized population ${realized.win_rate_n ?? '?'} < declared ${MIN_WIN_RATE_N} floor`;
  } else if (realized.win_rate <= 0) {
    win_rate_note = 'NOT COMPUTED: realized win rate is zero — ratio undefined; see records';
  } else {
    win_rate_ratio = claim.win_rate / realized.win_rate;
    win_rate_note = `claimed ${(claim.win_rate * 100).toFixed(1)}% vs realized ${(realized.win_rate * 100).toFixed(1)}% over ${realized.win_rate_n} closed trades`;
  }

  return {
    record_type: 'InflationFactor',
    strategy: claim.strategy,
    claim_hash: claimHash,
    realized_hash: realizedHash,
    return_outcome: returnOutcome(claim, realized),
    claimed_annualized: claim.annualized_return,
    realized_annualized: realized.annualized_return,
    win_rate_ratio,
    win_rate_note,
    claim_days: sideDays(claim),
    realized_days: sideDays(realized),
    regime_note:
      'Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.',
    method: `annualized-return ratio (sides >=${MIN_SIDE_DAYS}d) + win-rate ratio (realized n>=${MIN_WIN_RATE_N}); normalization per declared per-side methods`,
  };
}
