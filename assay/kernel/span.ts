// assay/kernel/span.ts
// Basis-typed time spans — mixing trading and calendar time fails to typecheck (I2 heritage).
// No annualization constant lives in the kernel; periodsPerYear is always a declared input.

import { refuse, type Outcome } from './refusal.ts';

export type Basis = 'TRADING' | 'CALENDAR';

declare const SpanBrand: unique symbol;

/** Opaque: constructible only via span(); the brand cannot be forged outside this module. */
export interface Span<B extends Basis> {
  readonly basis: B;
  readonly count: number;
  readonly [SpanBrand]: true;
}

export function span<B extends Basis>(basis: B, count: number): Outcome<Span<B>> {
  if (!Number.isInteger(count) || count < 0) {
    return refuse('invalid_span', `span count must be a non-negative integer, got ${count}`);
  }
  return { basis, count } as Span<B>;
}

/** Same-basis arithmetic only — a TRADING+CALENDAR call does not typecheck.
 *  NoInfer stops TS from widening B to the union of both bases (found red-first by the type harness). */
export function addSpans<B extends Basis>(a: Span<B>, b: Span<NoInfer<B>>): Outcome<Span<B>> {
  if ((a.basis as Basis) !== (b.basis as Basis)) {
    // unreachable through the type system; kept so a type-cast bypass still refuses at runtime
    return refuse('invalid_span', `basis mismatch: ${a.basis} vs ${b.basis}`);
  }
  return span(a.basis, a.count + b.count);
}

export function spanCount<B extends Basis>(s: Span<B>): number {
  return s.count;
}
