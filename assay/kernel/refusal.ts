// assay/kernel/refusal.ts
// Refusal taxonomy — the single owner of every refusal reason in ASSAY (I6).
// Refusals are values, never exceptions; a degraded number is worse than no number.

export const REFUSAL_REASONS = [
  'lookahead_at_load', // a bar timestamp exceeds the as-of date at load time (I2)
  'unsorted_bars', // bars not in strictly ascending timestamp order
  'duplicate_bar', // two bars share a timestamp
  'insufficient_history', // fewer bars than the computation's declared lookback requires
  'missing_bar', // a decision references a date with no bar
  'missing_data', // a required series/snapshot is absent
  'partial_universe', // some declared symbols have no data; never silently completed (I4/I6)
  'missing_credential', // credential env var absent OR set-but-empty (learned 2026-08-17)
  'vendor_auth_failed', // vendor rejected the credential
  'vendor_malformed', // vendor payload failed validation; never coerced
  'invalid_spec', // spec fails grammar validation (unknown fields, bad params)
  'unregistered_spec', // evaluation requested for a spec with no registration record (I3)
  'borrow_unavailable', // short entry while frictions declare no borrow
  'invalid_span', // span constructor given negative/non-integer count
  'non_finite_number', // NaN/Infinity attempted to enter a record
  'unsafe_integer', // integer arithmetic would exceed Number.MAX_SAFE_INTEGER
  'unknown_object', // store lookup for a hash that has no object (A3)
  'hash_mismatch', // stored bytes do not hash to their claimed key (A3)
  'store_immutable', // attempted overwrite/edit of an existing object (I7)
  'empty_population', // statistic requested over zero members; never 0/0
  'invalid_params', // evaluation/invocation params fail validation
  'ambiguous_epoch_chain', // epoch topology broken: fork, cycle, duplicate numbers, or no single head (W1)
  'epoch_unverifiable', // an epoch's declared code_hash cannot be re-derived from its git tree (W1)
  'epoch_mismatch', // reproduction requested at the wrong epoch — the exact worktree command is supplied (W1)
] as const;

export type RefusalReason = (typeof REFUSAL_REASONS)[number];

export interface Refused {
  readonly kind: 'refused';
  readonly reason: RefusalReason;
  readonly detail: string;
}

/** Every value-producing ASSAY function returns Outcome<T>, never throws for domain failures. */
export type Outcome<T> = T | Refused;

export function refuse(reason: RefusalReason, detail: string): Refused {
  return { kind: 'refused', reason, detail };
}

export function isRefused(x: unknown): x is Refused {
  return (
    typeof x === 'object' &&
    x !== null &&
    (x as { kind?: unknown }).kind === 'refused' &&
    typeof (x as { reason?: unknown }).reason === 'string' &&
    (REFUSAL_REASONS as readonly string[]).includes((x as { reason: string }).reason)
  );
}
