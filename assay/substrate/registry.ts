// assay/substrate/registry.ts
// Pre-registration (I3) — the single highest-value control. Spec hashed and timestamped BEFORE evaluation.
// Idempotent by content: re-registering returns the ORIGINAL timestamp; history cannot be rewritten.

import { validateSpec, specHash, type Spec } from '../kernel/spec.ts';
import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';
import { putRecord, recordsOfType, type StoreRoot } from './store.ts';

export interface Registration {
  readonly record_type: 'Registration';
  readonly spec_hash: Hash;
  readonly registered_at: string; // ISO-8601, stamped at this boundary — the kernel never sees a clock
}

export function findRegistration(root: StoreRoot, hash: Hash): Outcome<Registration | null> {
  const regs = recordsOfType(root, 'Registration');
  if (isRefused(regs)) return regs;
  const matches = regs
    .map((r) => r.value as Registration)
    .filter((r) => r.spec_hash === hash)
    .sort((a, b) => (a.registered_at < b.registered_at ? -1 : 1));
  return matches[0] ?? null;
}

export function registerSpec(
  root: StoreRoot,
  rawSpec: unknown,
  now: () => string = () => new Date().toISOString()
): Outcome<{ spec: Spec; spec_hash: Hash; registered_at: string; already_registered: boolean }> {
  const spec = validateSpec(rawSpec);
  if (isRefused(spec)) return spec;
  const hash = specHash(spec);
  if (isRefused(hash)) return hash;

  const existing = findRegistration(root, hash);
  if (isRefused(existing)) return existing;
  if (existing !== null) {
    return { spec, spec_hash: hash, registered_at: existing.registered_at, already_registered: true };
  }

  const specStored = putRecord(root, 'Spec', { record_type: 'Spec', spec } as unknown as Record<string, unknown>);
  if (isRefused(specStored)) return specStored;

  const reg: Registration = { record_type: 'Registration', spec_hash: hash, registered_at: now() };
  const regStored = putRecord(root, 'Registration', reg as unknown as Record<string, unknown>);
  if (isRefused(regStored)) return regStored;

  return { spec, spec_hash: hash, registered_at: reg.registered_at, already_registered: false };
}

export function loadSpec(root: StoreRoot, hash: Hash): Outcome<Spec> {
  const specs = recordsOfType(root, 'Spec');
  if (isRefused(specs)) return specs;
  for (const s of specs) {
    const spec = (s.value as { spec: unknown }).spec;
    const v = validateSpec(spec);
    if (isRefused(v)) continue;
    const h = specHash(v);
    if (isRefused(h)) continue;
    if (h === hash) return v;
  }
  return refuse('unknown_object', `no Spec record hashes to ${hash}`);
}
