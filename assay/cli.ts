// assay/cli.ts
// Orchestration + display. Display commands print stored records only — the CLI re-derives nothing.
// Exit codes are honest: any refusal or mismatch exits non-zero.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRefused } from './kernel/refusal.ts';
import { type Hash, isHash } from './kernel/canonical.ts';
import { openStore, getObject, rebuildIndex, recordsOfType, verifyStore } from './substrate/store.ts';
import { kernelCodeHash } from './substrate/codehash.ts';
import { registerSpec, findRegistration } from './substrate/registry.ts';
import { ingestDailyBars, type DataSnapshot } from './substrate/ingress.ts';
import { invokeEvaluate, replayTraces, type EvaluateParamsRecord } from './substrate/invoke.ts';
import { validateSpec, specHash } from './kernel/spec.ts';
import { validateFrictions } from './kernel/sim.ts';
import { runAdversary } from './adversary/adversary.ts';
import { buildReceipt, reproduce } from './receipt/receipt.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const STORE_DIR = join(HERE, 'store-data');

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1 || i + 1 >= process.argv.length) return undefined;
  return process.argv[i + 1];
}

function fail(msg: string): never {
  console.error(`REFUSED/ERROR: ${msg}`);
  process.exit(1);
}

function out(obj: unknown): void {
  console.log(JSON.stringify(obj, null, 2));
}

function loadJsonFile(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function parseWindow(): { startT: number; endT: number; from: string; to: string } {
  const from = arg('from') ?? fail('--from YYYY-MM-DD required');
  const to = arg('to') ?? fail('--to YYYY-MM-DD required');
  const startT = Date.parse(`${from}T00:00:00Z`);
  const endT = Date.parse(`${to}T23:59:59Z`);
  if (!Number.isFinite(startT) || !Number.isFinite(endT)) fail('bad dates');
  return { startT, endT, from, to };
}

const cmd = process.argv[2];
const root = openStore(STORE_DIR);

switch (cmd) {
  case 'ingest': {
    const symbols = (arg('symbols') ?? fail('--symbols A,B,C required')).split(',');
    const { from, to } = parseWindow();
    for (const s of symbols) {
      const r = await ingestDailyBars(root, s.trim(), from, to);
      if (isRefused(r)) {
        console.error(`${s}: REFUSED ${r.reason} — ${r.detail}`);
        process.exitCode = 1;
      } else {
        console.log(`${s}: snapshot ${r.hash} (${r.snapshot.barCount} bars)`);
      }
    }
    break;
  }
  case 'register': {
    const file = arg('file') ?? fail('--file spec.json required');
    const r = registerSpec(root, loadJsonFile(file));
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out({ spec_hash: r.spec_hash, registered_at: r.registered_at, already_registered: r.already_registered });
    break;
  }
  case 'evaluate': {
    const specFile = arg('spec-file') ?? fail('--spec-file required');
    const frictionsFile = arg('frictions') ?? fail('--frictions required');
    const { startT, endT } = parseWindow();
    const folds = Number(arg('folds') ?? '8');
    const cash = Number(arg('cash-micros') ?? '100000000000');
    const spec = validateSpec(loadJsonFile(specFile));
    if (isRefused(spec)) fail(`${spec.reason} — ${spec.detail}`);
    const sHash = specHash(spec);
    if (isRefused(sHash)) fail(`${sHash.reason} — ${sHash.detail}`);
    const reg = findRegistration(root, sHash);
    if (isRefused(reg)) fail(`${reg.reason} — ${reg.detail}`);
    const frictions = validateFrictions(loadJsonFile(frictionsFile));
    if (isRefused(frictions)) fail(`${frictions.reason} — ${frictions.detail}`);
    // snapshots: chosen by WINDOW COVERAGE, never by hash order (Forge finding 12) —
    // an uncovering snapshot must refuse loudly, and ambiguity must be disambiguated by hand
    const snaps = recordsOfType(root, 'DataSnapshot');
    if (isRefused(snaps)) fail(`${snaps.reason} — ${snaps.detail}`);
    const chosen: Hash[] = [];
    for (const sym of spec.universe) {
      const forSym = snaps.filter((s) => (s.value as DataSnapshot).symbol === sym);
      if (forSym.length === 0) continue; // surfaces downstream as partial_universe refusal
      const covering = forSym.filter((s) => {
        const bars = (s.value as DataSnapshot).bars;
        return Array.isArray(bars) && bars.length > 0 && bars[0]!.t <= startT && bars[bars.length - 1]!.t >= endT;
      });
      if (covering.length === 0) fail(`no snapshot for ${sym} covers ${startT}..${endT} — never silently truncated`);
      if (covering.length > 1) fail(`${covering.length} snapshots cover ${sym} for this window — ambiguous; ingest hygiene required`);
      chosen.push(covering[0]!.hash);
    }
    const params: EvaluateParamsRecord = {
      record_type: 'Params',
      spec,
      spec_hash: sHash,
      registration: reg === null ? null : { registered_at: reg.registered_at },
      frictions,
      window: { startT, endT },
      evalParams: { initialCashMicros: cash, foldCount: folds },
    };
    const r = invokeEvaluate(root, chosen, params);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out({
      result_hash: r.result_hash,
      cache_hit: r.cache_hit,
      triple: r.triple,
      outcome_kind: r.result.outcome.kind,
      refusal: r.result.outcome.kind === 'refused' ? `${r.result.outcome.reason}: ${r.result.outcome.detail}` : null,
      registered_after_window: r.result.registered_after_window,
    });
    if (r.result.outcome.kind === 'refused') process.exitCode = 2; // refusal is a first-class, visible outcome
    break;
  }
  case 'adversary': {
    const h = arg('result');
    if (h === undefined || !isHash(h)) fail('--result sha256:<hex> required');
    const r = runAdversary(root, h);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out({ adversary_hash: r.hash, worst: r.report.worst, materially_worse: r.report.materially_worse, slices: r.report.slices.length });
    break;
  }
  case 'receipt': {
    const h = arg('result');
    if (h === undefined || !isHash(h)) fail('--result sha256:<hex> required');
    const r = buildReceipt(root, h);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out({ receipt_hash: r.hash, receipt: r.receipt });
    break;
  }
  case 'show': {
    // display path: reads the stored record and prints it — nothing recomputed
    const h = arg('hash');
    if (h === undefined || !isHash(h)) fail('--hash sha256:<hex> required');
    const v = getObject(root, h as Hash);
    if (isRefused(v)) fail(`${v.reason} — ${v.detail}`);
    out(v);
    break;
  }
  case 'reproduce': {
    const h = arg('result');
    if (h === undefined || !isHash(h)) fail('--result sha256:<hex> required');
    const r = reproduce(root, h);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out(r);
    if (!r.identical) process.exit(3);
    break;
  }
  case 'replay': {
    const r = replayTraces(root);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out(r);
    if (r.drifted.length > 0) process.exit(4);
    if (r.code_drift.length > 0) process.exit(5); // traces certify code the tree no longer contains (Cato C1/C2)
    break;
  }
  case 'verify-store': {
    // Cato C1/C4 mechanized: the derived index is proven complete in both directions, every object
    // hash-verifies, and every stored code_hash matches the tree that is running right now.
    const v = verifyStore(root);
    if (isRefused(v)) fail(`${v.reason} — ${v.detail}`);
    const current = kernelCodeHash();
    const staleCode: { record: string; hash: Hash; recorded: string }[] = [];
    for (const type of ['Run', 'Result', 'Receipt'] as const) {
      const recs = recordsOfType(root, type);
      if (isRefused(recs)) fail(`${recs.reason} — ${recs.detail}`);
      for (const rec of recs) {
        const ch = (rec.value as { code_hash?: string }).code_hash;
        if (typeof ch === 'string' && ch !== current) staleCode.push({ record: type, hash: rec.hash, recorded: ch });
      }
    }
    out({ ...v, current_code: current, stale_code_records: staleCode });
    if (v.missing_from_index.length > 0 || v.indexed_without_object.length > 0) process.exit(6);
    if (staleCode.length > 0) process.exit(7); // a committed seal must certify the committed tree
    break;
  }
  case 'rebuild-index': {
    const r = rebuildIndex(root);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    console.log(`indexed ${r} records`);
    break;
  }
  default:
    console.error('usage: cli.ts <ingest|register|evaluate|adversary|receipt|show|reproduce|replay|rebuild-index>');
    process.exit(1);
}
