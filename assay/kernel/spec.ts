// assay/kernel/spec.ts
// Strategy grammar — specs are data: hashable, diffable, never executable (I3 substrate).
// Unknown fields refuse at parse; a spec that cannot be validated cannot be registered.

import { refuse, type Outcome, isRefused } from './refusal.ts';
import { contentHash, type Hash } from './canonical.ts';

export interface Spec {
  readonly name: string;
  readonly universe: readonly string[];
  readonly signal: { readonly kind: 'sma_cross'; readonly fast: number; readonly slow: number };
  readonly sizing: { readonly kind: 'fixed_cash'; readonly cashMicros: number };
  readonly entry: { readonly kind: 'next_open' };
  readonly exit: { readonly kind: 'signal_flip' };
  readonly risk: { readonly maxOpenPositions: number };
}

function onlyKeys(obj: Record<string, unknown>, allowed: readonly string[], ctx: string): Outcome<true> {
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) return refuse('invalid_spec', `${ctx}: unknown field '${k}'`);
    if (typeof obj[k] === 'function') return refuse('invalid_spec', `${ctx}: field '${k}' carries executable code`);
  }
  return true;
}

/** Strict structural validation — the only door a Spec can enter through. */
export function validateSpec(x: unknown): Outcome<Spec> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return refuse('invalid_spec', 'spec must be an object');
  const o = x as Record<string, unknown>;
  const top = onlyKeys(o, ['name', 'universe', 'signal', 'sizing', 'entry', 'exit', 'risk'], 'spec');
  if (isRefused(top)) return top;

  if (typeof o.name !== 'string' || o.name.length === 0) return refuse('invalid_spec', 'name must be a non-empty string');
  if (!Array.isArray(o.universe) || o.universe.length === 0 || !o.universe.every((s) => typeof s === 'string' && s.length > 0)) {
    return refuse('invalid_spec', 'universe must be a non-empty string array');
  }
  const uniq = new Set(o.universe as string[]);
  if (uniq.size !== (o.universe as string[]).length) return refuse('invalid_spec', 'universe has duplicate symbols');

  const sig = o.signal as Record<string, unknown> | undefined;
  if (typeof sig !== 'object' || sig === null) return refuse('invalid_spec', 'signal missing');
  const sigK = onlyKeys(sig, ['kind', 'fast', 'slow'], 'signal');
  if (isRefused(sigK)) return sigK;
  if (sig.kind !== 'sma_cross') return refuse('invalid_spec', `unknown signal kind '${String(sig.kind)}'`);
  if (!Number.isInteger(sig.fast) || (sig.fast as number) < 1) return refuse('invalid_spec', 'signal.fast must be int >= 1');
  if (!Number.isInteger(sig.slow) || (sig.slow as number) <= (sig.fast as number)) {
    return refuse('invalid_spec', 'signal.slow must be int > fast');
  }

  const siz = o.sizing as Record<string, unknown> | undefined;
  if (typeof siz !== 'object' || siz === null) return refuse('invalid_spec', 'sizing missing');
  const sizK = onlyKeys(siz, ['kind', 'cashMicros'], 'sizing');
  if (isRefused(sizK)) return sizK;
  if (siz.kind !== 'fixed_cash') return refuse('invalid_spec', `unknown sizing kind '${String(siz.kind)}'`);
  if (!Number.isSafeInteger(siz.cashMicros) || (siz.cashMicros as number) <= 0) {
    return refuse('invalid_spec', 'sizing.cashMicros must be a positive safe integer');
  }

  const ent = o.entry as Record<string, unknown> | undefined;
  if (typeof ent !== 'object' || ent === null) return refuse('invalid_spec', 'entry missing');
  const entK = onlyKeys(ent, ['kind'], 'entry');
  if (isRefused(entK)) return entK;
  if (ent.kind !== 'next_open') return refuse('invalid_spec', `unknown entry kind '${String(ent.kind)}'`);

  const ex = o.exit as Record<string, unknown> | undefined;
  if (typeof ex !== 'object' || ex === null) return refuse('invalid_spec', 'exit missing');
  const exK = onlyKeys(ex, ['kind'], 'exit');
  if (isRefused(exK)) return exK;
  if (ex.kind !== 'signal_flip') return refuse('invalid_spec', `unknown exit kind '${String(ex.kind)}'`);

  const risk = o.risk as Record<string, unknown> | undefined;
  if (typeof risk !== 'object' || risk === null) return refuse('invalid_spec', 'risk missing');
  const riskK = onlyKeys(risk, ['maxOpenPositions'], 'risk');
  if (isRefused(riskK)) return riskK;
  if (!Number.isInteger(risk.maxOpenPositions) || (risk.maxOpenPositions as number) < 1) {
    return refuse('invalid_spec', 'risk.maxOpenPositions must be int >= 1');
  }

  return {
    name: o.name,
    universe: [...(o.universe as string[])].sort(),
    signal: { kind: 'sma_cross', fast: sig.fast as number, slow: sig.slow as number },
    sizing: { kind: 'fixed_cash', cashMicros: siz.cashMicros as number },
    entry: { kind: 'next_open' },
    exit: { kind: 'signal_flip' },
    risk: { maxOpenPositions: risk.maxOpenPositions as number },
  };
}

/** Spec hash is stable across key order and whitespace because it hashes canonical bytes. */
export function specHash(spec: Spec): Outcome<Hash> {
  return contentHash(spec);
}
