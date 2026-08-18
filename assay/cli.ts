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
import { realGit, headEpoch, buildEpochRecord, verifyEpochChain } from './substrate/verify/epochs.ts';
import { putRecord } from './substrate/store.ts';
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
// X8: --store points any command (reproduce especially) at a different store — the epoch_mismatch
// remediation command is executable as written.
const root = openStore(arg('store') ?? STORE_DIR);

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
    const { startT, endT, from, to } = parseWindow();
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
      // coverage = the snapshot's DECLARED vendor-request window spans the eval window.
      // (Bar-timestamp comparison was over-strict: daily bars stamp at session START, so no bar
      // can ever be >= the window-end instant — found red-first on the first real-data run.)
      const covering = forSym.filter((s) => {
        const snap = s.value as DataSnapshot;
        return (
          Array.isArray(snap.bars) &&
          snap.bars.length > 0 &&
          snap.window.from <= from &&
          snap.window.to >= to
        );
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
  case 'declare-epoch': {
    // W1: declare a reviewed code state. The record's code_hash is RE-DERIVED from git before
    // storage (buildEpochRecord refuses otherwise) and re-verified by every future gate run.
    const reviewPath = arg('review') ?? fail('--review <path> required — no epoch without a review');
    const by = arg('by') ?? fail('--by <declarer> required');
    const fromRef = arg('from-ref') ?? 'STAGED';
    const retro = process.argv.includes('--retroactive');
    const gitOps = realGit(HERE);
    const head = headEpoch(root);
    if (isRefused(head)) fail(`${head.reason} — ${head.detail}`);
    const rec = buildEpochRecord(gitOps, HERE, {
      epoch: head === null ? 1 : head.record.epoch + 1,
      from: fromRef,
      grammar_version: Number(arg('grammar-version') ?? '1'),
      reviewPath,
      declared_by: by,
      parent: head === null ? null : head.hash,
      retroactive: retro,
      ...(retro && process.argv.includes('--bless-existing')
        ? {
            blessed_records: ((): Hash[] => {
              // X1: genesis enumerates the pre-epoch sealed set BY HASH — closed at declaration
              const out: Hash[] = [];
              for (const t of ['Run', 'Result', 'Receipt'] as const) {
                const recs = recordsOfType(root, t);
                if (isRefused(recs)) fail(`${recs.reason} — ${recs.detail}`);
                for (const r of recs) {
                  const v = r.value as { code_hash?: string; epoch_hash?: string };
                  if (typeof v.code_hash === 'string' && v.epoch_hash === undefined) out.push(r.hash);
                }
              }
              return out.sort();
            })(),
          }
        : {}),
    });
    if (isRefused(rec)) fail(`${rec.reason} — ${rec.detail}`);
    const stored = putRecord(root, 'Epoch', rec as unknown as Record<string, unknown>);
    if (isRefused(stored)) fail(`${stored.reason} — ${stored.detail}`);
    out({ epoch: rec.epoch, epoch_hash: stored, code_hash: rec.code_hash, retroactive: rec.retroactive, blessed: rec.blessed_records?.length ?? null, parent: rec.parent });
    break;
  }
  case 'revoke-epoch': {
    // X10: clause 6 made operable — validated, refusal-honest, never an ad-hoc script
    const eh = arg('epoch-hash');
    if (eh === undefined || !isHash(eh)) fail('--epoch-hash sha256:<hex> required');
    const reason = arg('reason') ?? fail('--reason required');
    const evidence = arg('evidence-ref') ?? fail('--evidence-ref required');
    const by = arg('by') ?? fail('--by required');
    const target = getObject(root, eh as Hash);
    if (isRefused(target)) fail(`epoch not found: ${target.detail}`);
    const trec = target as { record_type?: string; declared_by?: string; epoch?: number };
    if (trec.record_type !== 'Epoch') fail(`${eh} is not an Epoch record`);
    if (trec.declared_by === by) fail(`revoker '${by}' equals the epoch's declarer — a second party must revoke (Article II)`);
    const rv = putRecord(root, 'EpochRevocation', { record_type: 'EpochRevocation', epoch_hash: eh, reason, evidence_ref: evidence, revoked_by: by });
    if (isRefused(rv)) fail(`${rv.reason} — ${rv.detail}`);
    out({ revoked_epoch: trec.epoch, revocation: rv });
    break;
  }
  case 'amend-receipts': {
    // X8: supersede-with-disclosure for pre-epoch receipts whose baked repro commands are epoch-blind
    const head = headEpoch(root);
    if (isRefused(head)) fail(`${head.reason} — ${head.detail}`);
    if (head === null) fail('no epochs declared — amend after genesis');
    const receipts = recordsOfType(root, 'Receipt');
    if (isRefused(receipts)) fail(`${receipts.reason} — ${receipts.detail}`);
    const superseded = receipts.filter((r) => (r.value as { epoch_hash?: unknown }).epoch_hash === undefined).map((r) => r.hash).sort();
    const rec = {
      record_type: 'ReceiptAmendment',
      supersedes_receipts: superseded,
      reason: 'pre-epoch repro commands are epoch-blind (Cato M3/F24/X8); superseded with disclosure, priors visible (I7)',
      corrected_command_template: 'bun run cli.ts reproduce --result <result_hash> [--store <path>] — refuses epoch_mismatch with the exact worktree procedure when the result is not head-epoch',
      epoch_hash: head.hash,
    };
    const stored = putRecord(root, 'ReceiptAmendment', rec);
    if (isRefused(stored)) fail(`${stored.reason} — ${stored.detail}`);
    out({ amendment: stored, superseded_count: superseded.length });
    break;
  }
  case 'verify-epochs': {
    // W1 gate clause: the chain as computed fact — topology, git re-derivation, head-vs-present,
    // review binding, revocation quarantine, sealed-record binding.
    const r = verifyEpochChain(root, realGit(HERE), HERE);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    out(r);
    break;
  }
  case 'verify-store': {
    // Cato C1/C4 mechanized: the derived index is proven complete in both directions, every object
    // hash-verifies, and every stored code_hash matches the tree that is running right now.
    // W1: seal-vs-code binding moved to verify-epochs (clause 4) — historical seals are valid
    // under their declared epochs. verify-store keeps object integrity + index completeness.
    const v = verifyStore(root);
    if (isRefused(v)) fail(`${v.reason} — ${v.detail}`);
    out({ ...v, current_code: kernelCodeHash(), note: 'seal/code binding is verify-epochs clause 4' });
    if (v.missing_from_index.length > 0 || v.indexed_without_object.length > 0) process.exit(6);
    break;
  }
  case 'rebuild-index': {
    const r = rebuildIndex(root);
    if (isRefused(r)) fail(`${r.reason} — ${r.detail}`);
    console.log(`indexed ${r} records`);
    break;
  }
  default:
    console.error(
      'usage: cli.ts <ingest|register|evaluate|adversary|receipt|show|reproduce|replay|rebuild-index|declare-epoch|verify-epochs|verify-store|revoke-epoch|amend-receipts> [--store <dir>]'
    );
    process.exit(1);
}
