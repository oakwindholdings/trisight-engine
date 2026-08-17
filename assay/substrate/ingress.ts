// assay/substrate/ingress.ts
// The one vendor gateway (Massive daily aggregates). Key enters here and ONLY here, via env.
// Red-first lesson 2026-08-17: vendor error bodies echo the token back — redact RESPONSES, not just requests.

import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';
import { toMicros } from '../kernel/micros.ts';
import { type Bar } from '../kernel/bars.ts';
import { type Hash } from '../kernel/canonical.ts';
import { putRecord, type StoreRoot } from './store.ts';

export const VENDOR_VERSION = 'massive-aggs-v2';
const BASE = 'https://api.massive.com';

export interface DataSnapshot {
  readonly record_type: 'DataSnapshot';
  readonly provenance: 'vendor'; // the ONLY provenance the store accepts for snapshots — no fixtures (§2)
  readonly vendor_version: string;
  readonly symbol: string;
  readonly interval: '1day';
  readonly window: { readonly from: string; readonly to: string };
  readonly adjusted: true;
  readonly url: string; // keyless by construction — the key never touches this string
  readonly barCount: number;
  readonly bars: readonly Bar[];
}

/** Set-but-empty is missing (learned from this machine's env on 2026-08-17). */
export function readCredential(env: Record<string, string | undefined> = process.env): Outcome<string> {
  const key = env.MASSIVE_API_KEY;
  if (key === undefined || key.length === 0) {
    return refuse('missing_credential', 'MASSIVE_API_KEY absent or empty — name reported, value never');
  }
  return key;
}

/** Scrub every occurrence of the credential from any text before it can surface anywhere.
 *  Forge finding 14: vendors echo tokens JSON-escaped, percent-encoded, or case-folded —
 *  literal substring replacement alone is not redaction. When in doubt, withhold the body. */
export function redact(text: string, key: string): string {
  if (key.length === 0) return text;
  if (key.length < 8) return text.length > 0 ? '[BODY WITHHELD — key too short to redact safely]' : text;
  let out = text.split(key).join('[REDACTED]');
  for (const variant of [JSON.stringify(key).slice(1, -1), encodeURIComponent(key), key.toLowerCase(), key.toUpperCase()]) {
    if (variant !== key) out = out.split(variant).join('[REDACTED]');
  }
  if (out.includes(key.slice(0, 8))) return '[BODY WITHHELD — possible credential echo]';
  return out;
}

function keylessUrl(symbol: string, from: string, to: string): string {
  return `${BASE}/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=50000`;
}

interface VendorRow {
  t?: unknown;
  o?: unknown;
  h?: unknown;
  l?: unknown;
  c?: unknown;
  v?: unknown;
}

function parseVendorBars(symbol: string, payload: unknown): Outcome<Bar[]> {
  if (typeof payload !== 'object' || payload === null) return refuse('vendor_malformed', `${symbol}: non-object payload`);
  const rows = (payload as { results?: unknown }).results;
  if (!Array.isArray(rows)) return refuse('vendor_malformed', `${symbol}: no results array`);
  const bars: Bar[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i] as VendorRow;
    if (
      typeof r.t !== 'number' ||
      typeof r.o !== 'number' ||
      typeof r.h !== 'number' ||
      typeof r.l !== 'number' ||
      typeof r.c !== 'number' ||
      typeof r.v !== 'number'
    ) {
      return refuse('vendor_malformed', `${symbol}: row ${i} has missing/non-numeric fields — never coerced`);
    }
    const o = toMicros(r.o, `${symbol} row ${i} open`);
    if (isRefused(o)) return o;
    const h = toMicros(r.h, `${symbol} row ${i} high`);
    if (isRefused(h)) return h;
    const l = toMicros(r.l, `${symbol} row ${i} low`);
    if (isRefused(l)) return l;
    const c = toMicros(r.c, `${symbol} row ${i} close`);
    if (isRefused(c)) return c;
    if (!Number.isSafeInteger(r.t) || !Number.isSafeInteger(r.v) || r.v < 0) {
      return refuse('vendor_malformed', `${symbol}: row ${i} time/volume invalid — never coerced`);
    }
    bars.push({ t: r.t, oMicros: o, hMicros: h, lMicros: l, cMicros: c, volume: r.v });
  }
  return bars;
}

export interface FetchDeps {
  readonly fetchImpl: typeof fetch;
  readonly env: Record<string, string | undefined>;
}

/** Fetch daily bars and store an immutable content-addressed DataSnapshot. */
export async function ingestDailyBars(
  root: StoreRoot,
  symbol: string,
  from: string,
  to: string,
  deps: FetchDeps = { fetchImpl: fetch, env: process.env }
): Promise<Outcome<{ hash: Hash; snapshot: DataSnapshot }>> {
  const key = readCredential(deps.env);
  if (isRefused(key)) return key;
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return refuse('invalid_params', `window must be YYYY-MM-DD..YYYY-MM-DD, got '${from}'..'${to}'`);
  }
  const url = keylessUrl(symbol, from, to);
  let status: number;
  let bodyText: string;
  try {
    const res = await deps.fetchImpl(url, { headers: { Authorization: `Bearer ${key}` } });
    status = res.status;
    bodyText = await res.text();
  } catch (e) {
    return refuse('vendor_malformed', `${symbol}: transport failure — ${redact(String(e), key)}`);
  }
  if (status === 401 || status === 403) {
    return refuse('vendor_auth_failed', `${symbol}: vendor returned ${status}; body redacted: ${redact(bodyText, key).slice(0, 200)}`);
  }
  if (status !== 200) {
    return refuse('vendor_malformed', `${symbol}: vendor returned ${status}; body redacted: ${redact(bodyText, key).slice(0, 200)}`);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return refuse('vendor_malformed', `${symbol}: non-JSON 200 body`);
  }
  const bars = parseVendorBars(symbol, payload);
  if (isRefused(bars)) return bars;
  if (bars.length === 0) {
    return refuse('missing_data', `${symbol}: vendor returned zero bars for ${from}..${to} — never silently completed`);
  }
  const snapshot: DataSnapshot = {
    record_type: 'DataSnapshot',
    provenance: 'vendor',
    vendor_version: VENDOR_VERSION,
    symbol,
    interval: '1day',
    window: { from, to },
    adjusted: true,
    url,
    barCount: bars.length,
    bars,
  };
  const hash = putRecord(root, 'DataSnapshot', snapshot as unknown as Record<string, unknown>);
  if (isRefused(hash)) return hash;
  return { hash, snapshot };
}
