// assay/kernel/canonical.ts
// Canonical serialization + content addressing — one owner (I1).
// Same value ⇒ same bytes ⇒ same sha256, forever, on any machine.

import { createHash } from 'node:crypto';
import { refuse, type Outcome, isRefused } from './refusal.ts';

// Canonical form: JSON with object keys sorted lexicographically, arrays in order,
// numbers via ECMA-262 shortest-round-trip (deterministic across conforming engines),
// -0 preserved as "-0" (two numbers that differ in the last bit are two different numbers),
// NaN/Infinity refused — they never enter a record.
const MAX_DEPTH = 64;

// Cato N6: cycles and pathological depth are DIFFERENT facts — detected separately, refused as
// values (kernel totality), each with its own honest message.
export function canonicalize(value: unknown, depth = 0, ancestors?: Set<unknown>): Outcome<string> {
  if (depth > MAX_DEPTH) return refuse('invalid_params', `value deeper than ${MAX_DEPTH} levels — cannot canonicalize`);
  if (typeof value === 'object' && value !== null) {
    if (ancestors?.has(value)) return refuse('invalid_params', 'cyclic value — cannot canonicalize');
  }
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'boolean') return value ? 'true' : 'false';
  if (t === 'number') {
    const n = value as number;
    if (!Number.isFinite(n)) return refuse('non_finite_number', `cannot canonicalize ${String(n)}`);
    if (Object.is(n, -0)) return '-0';
    return JSON.stringify(n);
  }
  if (t === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const item of value) {
      if (item === undefined) return refuse('invalid_params', 'undefined array element cannot be canonicalized');
      const p = canonicalize(item, depth + 1);
      if (isRefused(p)) return p;
      parts.push(p);
    }
    return `[${parts.join(',')}]`;
  }
  if (t === 'object') {
    // Forge finding 5 (proven): Date/Map/Set/class instances have no own enumerable keys and would
    // silently canonicalize to {} — a hash collision. Plain objects only; anything exotic refuses.
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      const name = (value as { constructor?: { name?: string } }).constructor?.name ?? 'exotic object';
      return refuse('invalid_params', `${name} cannot enter a record — plain objects only`);
    }
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const parts: string[] = [];
    for (const k of keys) {
      const v = obj[k];
      if (v === undefined) continue; // absent and undefined are the same fact
      const p = canonicalize(v, depth + 1);
      if (isRefused(p)) return p;
      parts.push(`${JSON.stringify(k)}:${p}`);
    }
    return `{${parts.join(',')}}`;
  }
  return refuse('invalid_params', `type ${t} cannot enter a record`);
}

export type Hash = `sha256:${string}`;

export function hashBytes(bytes: string | Uint8Array): Hash {
  const h = createHash('sha256').update(bytes).digest('hex');
  return `sha256:${h}`;
}

/** Content address of any record value: sha256 over its canonical bytes. */
export function contentHash(value: unknown): Outcome<Hash> {
  const c = canonicalize(value);
  if (isRefused(c)) return c;
  return hashBytes(c);
}

export function isHash(x: unknown): x is Hash {
  return typeof x === 'string' && /^sha256:[0-9a-f]{64}$/.test(x);
}
