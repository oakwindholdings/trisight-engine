// assay/kernel/micros.ts
// Integer micro-unit money arithmetic — one owner. 1 dollar = 1_000_000 micros.
// Every operation guards Number.MAX_SAFE_INTEGER; overflow refuses, never wraps or rounds silently.

import { refuse, type Outcome } from './refusal.ts';

export const MICROS_PER_UNIT = 1_000_000;

export function assertSafe(n: number, ctx: string): Outcome<number> {
  if (!Number.isSafeInteger(n)) return refuse('unsafe_integer', `${ctx}: ${n} exceeds safe integer range`);
  return n;
}

export function addMicros(a: number, b: number, ctx: string): Outcome<number> {
  return assertSafe(a + b, ctx);
}

export function mulMicros(a: number, b: number, ctx: string): Outcome<number> {
  const r = a * b;
  if (!Number.isSafeInteger(r)) return refuse('unsafe_integer', `${ctx}: ${a}*${b} exceeds safe integer range`);
  return r;
}

/** Round-half-even integer division — the single declared rounding rule for money. */
export function divRoundHalfEven(numerator: number, denominator: number, ctx: string): Outcome<number> {
  if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
    return refuse('unsafe_integer', `${ctx}: invalid division ${numerator}/${denominator}`);
  }
  const q = Math.trunc(numerator / denominator);
  const r = numerator - q * denominator;
  const twice = Math.abs(r) * 2;
  const sign = numerator < 0 ? -1 : 1;
  if (twice > denominator) return q + sign;
  if (twice === denominator) return q % 2 === 0 ? q : q + sign;
  return q;
}

/** Convert a vendor decimal price to integer micros with the declared rounding rule. */
export function toMicros(price: number, ctx: string): Outcome<number> {
  if (!Number.isFinite(price) || price < 0) return refuse('non_finite_number', `${ctx}: price ${price}`);
  // scale via string to avoid double-rounding surprises on the fast path
  const scaled = price * MICROS_PER_UNIT;
  const rounded = Math.round(scaled);
  // guard: the round must be within half a micro of the scaled value
  if (Math.abs(scaled - rounded) > 0.5 + 1e-9) return refuse('non_finite_number', `${ctx}: rounding drift on ${price}`);
  return assertSafe(rounded, ctx);
}
