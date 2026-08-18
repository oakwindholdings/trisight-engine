// assay/tests/epochs.test.ts
// The M6 attack suite: every epoch-chain guard shown FAILING against a hostile fixture before
// the happy path is believed. FakeGit isolates chain logic from the real repository.

import { test, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  verifyEpochChain,
  deriveCodeHashFromGit,
  headEpoch,
  type EpochRecord,
  type GitOps,
} from '../substrate/verify/epochs.ts';
import { openStore, putRecord } from '../substrate/store.ts';
import { COMPUTE_ROOTS } from '../substrate/codehash.ts';
import { isRefused } from '../kernel/refusal.ts';
import { hashBytes, type Hash } from '../kernel/canonical.ts';

type FakeTree = Record<string, { path: string; content: string }[]>; // rootName -> files

function fakeGit(trees: Record<string, FakeTree>, staged: string): GitOps {
  // oid scheme: `<treeName>:<root>` for subtrees, `<treeName>:<root>:<path>` for blobs
  return {
    rootOids(ref) {
      const name = ref === 'STAGED' ? staged : ref;
      const t = trees[name];
      if (t === undefined) throw new Error(`no tree ${name}`);
      const out: Record<string, string> = {};
      for (const r of COMPUTE_ROOTS) out[r] = `${name}:${r}`;
      return out;
    },
    lsTree(oid) {
      const [treeName, root] = oid.split(':') as [string, string];
      return (trees[treeName]?.[root] ?? []).map((f) => ({ path: f.path, oid: `${oid}:${f.path}` }));
    },
    catBlob(oid) {
      const [treeName, root, ...rest] = oid.split(':') as [string, string, ...string[]];
      const f = trees[treeName]?.[root]?.find((x) => x.path === rest.join(':'));
      if (f === undefined) throw new Error(`no blob ${oid}`);
      return Buffer.from(f.content, 'utf8');
    },
    fileTracked() {
      return true;
    },
    lastAuthorEmail() {
      return 'cato-reviewer@test'; // differs from declared_by — the Article II happy case
    },
    oidExists(oid) {
      const [treeName, root] = oid.split(':') as [string, string];
      return trees[treeName]?.[root] !== undefined;
    },
  };
}

const TREE_A: FakeTree = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, [{ path: 'mod.ts', content: `// ${r} v1` }]]));
const TREE_B: FakeTree = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, [{ path: 'mod.ts', content: `// ${r} v2` }]]));

interface Env {
  root: ReturnType<typeof openStore>;
  dir: string;
  git: GitOps;
}

function env(staged = 'A'): Env {
  const dir = mkdtempSync(join(tmpdir(), 'assay-epoch-'));
  mkdirSync(join(dir, 'reviews'), { recursive: true });
  return { root: openStore(join(dir, 'store')), dir, git: fakeGit({ A: TREE_A, B: TREE_B }, staged) };
}

function declareEpoch(e: Env, opts: Partial<EpochRecord> & { epoch: number; tree: string }): { hash: Hash; rec: EpochRecord } {
  const oids = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, `${opts.tree}:${r}`]));
  const code = deriveCodeHashFromGit(e.git, oids);
  if (isRefused(code)) throw new Error(code.detail);
  const reviewPath = `reviews/epoch-${opts.epoch}.md`;
  const reviewBytes = opts.review?.content_hash !== undefined ? 'stale review, wrong bytes' : `Reviewed. code_hash: ${code}`;
  writeFileSync(join(e.dir, reviewPath), reviewBytes);
  const rec: EpochRecord = {
    record_type: 'Epoch',
    epoch: opts.epoch,
    root_tree_oids: oids,
    code_hash: (opts.code_hash as Hash) ?? code,
    grammar_version: 1,
    runtime: { bun_version: '1.x', os: 'test', arch: 'test' },
    review: opts.review ?? { path: reviewPath, content_hash: hashBytes(reviewBytes) },
    declared_by: 'executor-test',
    parent: opts.parent ?? null,
    retroactive: opts.retroactive ?? false,
    blessed_records: opts.retroactive === true ? (opts.blessed_records ?? []) : null,
  };
  const h = putRecord(e.root, 'Epoch', rec as unknown as Record<string, unknown>);
  if (isRefused(h)) throw new Error(h.detail);
  return { hash: h, rec };
}

function sealed(e: Env, code_hash: string, epoch_hash: string | undefined): Hash {
  const rec: Record<string, unknown> = { record_type: 'Result', code_hash, outcome: { kind: 'refused', reason: 'missing_data', detail: 'fixture' } };
  if (epoch_hash !== undefined) rec.epoch_hash = epoch_hash;
  const h = putRecord(e.root, 'Result', rec);
  if (isRefused(h)) throw new Error(h.detail);
  return h;
}

test('happy path: genesis blesses an ENUMERATED pre-epoch set; report honest about the flags', () => {
  const e = env('A');
  const pre = sealed(e, 'sha256:' + 'a'.repeat(64), undefined); // pre-epoch record, listed by ITS OWN hash
  const { hash, rec } = declareEpoch(e, { epoch: 1, tree: 'A', retroactive: true, blessed_records: [pre] });
  sealed(e, rec.code_hash, hash);
  const r = verifyEpochChain(e.root, e.git, e.dir);
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.head_epoch).toBe(1);
  expect(r.genesis_blessed_count).toBe(1);
  expect(r.sealed_records_checked).toBe(2);
  expect(r.retroactively_blessed).toBe(1);
  expect(r.epoch_declared_after_run).toBe(1); // genesis honesty: marked, never hidden
  expect(r.review_authorship).toBe('verified-distinct');
});

test('ATTACK X1 — a record OUTSIDE the genesis enumeration is an unblessed orphan, whatever its code_hash claims', () => {
  const e = env('A');
  const pre = sealed(e, 'sha256:' + 'a'.repeat(64), undefined);
  const { rec } = declareEpoch(e, { epoch: 1, tree: 'A', retroactive: true, blessed_records: [pre] });
  void rec;
  sealed(e, 'sha256:' + 'a'.repeat(64), undefined); // fabricated history: SAME code_hash, not enumerated... but identical content dedups
  const fabricated = putRecord(e.root, 'Result', {
    record_type: 'Result',
    code_hash: 'sha256:' + 'a'.repeat(64),
    outcome: { kind: 'refused', reason: 'missing_data', detail: 'fabricated-after-genesis' },
  });
  if (isRefused(fabricated)) throw new Error('unexpected');
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'epoch_unverifiable' && r.detail.includes('unblessed orphan')).toBe(true);
});

test('ATTACK X2a — a second retroactive epoch is refused: the bridge cannot bless two histories', () => {
  const e = env('B');
  const g = declareEpoch(e, { epoch: 1, tree: 'A', retroactive: true, blessed_records: [] });
  const oids = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, `B:${r}`]));
  const code = deriveCodeHashFromGit(e.git, oids);
  if (isRefused(code)) throw new Error('unexpected');
  const reviewPath = 'reviews/epoch-2.md';
  const reviewBytes = `Reviewed. code_hash: ${code}`;
  writeFileSync(join(e.dir, reviewPath), reviewBytes);
  const second = putRecord(e.root, 'Epoch', {
    record_type: 'Epoch', epoch: 2, root_tree_oids: oids, code_hash: code, grammar_version: 1,
    runtime: { bun_version: '1.x', os: 't', arch: 't' },
    review: { path: reviewPath, content_hash: hashBytes(reviewBytes) },
    declared_by: 'executor-test', parent: g.hash, retroactive: true, blessed_records: ['sha256:' + 'e'.repeat(64)],
  });
  if (isRefused(second)) throw new Error('unexpected');
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'ambiguous_epoch_chain' && r.detail.includes('two histories')).toBe(true);
});

test('ATTACK X2b — blessed_records on a non-retroactive epoch is refused', () => {
  const e = env('A');
  const oids = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, `A:${r}`]));
  const code = deriveCodeHashFromGit(e.git, oids);
  if (isRefused(code)) throw new Error('unexpected');
  const reviewPath = 'reviews/epoch-x2b.md';
  const reviewBytes = `Reviewed. code_hash: ${code}`;
  writeFileSync(join(e.dir, reviewPath), reviewBytes);
  const put = putRecord(e.root, 'Epoch', {
    record_type: 'Epoch', epoch: 1, root_tree_oids: oids, code_hash: code, grammar_version: 1,
    runtime: { bun_version: '1.x', os: 't', arch: 't' },
    review: { path: reviewPath, content_hash: hashBytes(reviewBytes) },
    declared_by: 'executor-test', parent: null, retroactive: false, blessed_records: ['sha256:' + 'e'.repeat(64)],
  });
  if (isRefused(put)) throw new Error('unexpected');
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'ambiguous_epoch_chain' && r.detail.includes('genesis-only')).toBe(true);
});

test('ATTACK X6 — review authored by the declarer is refused: executor may not review itself', () => {
  const e = env('A');
  const pre = sealed(e, 'sha256:' + 'a'.repeat(64), undefined);
  declareEpoch(e, { epoch: 1, tree: 'A', retroactive: true, blessed_records: [pre] });
  const selfReviewed = { ...e.git, lastAuthorEmail: () => 'executor-test' };
  const r = verifyEpochChain(e.root, selfReviewed, e.dir);
  expect(isRefused(r) && r.detail.includes('may not review itself')).toBe(true);
});

test('ATTACK ii — false code_hash: a declared epoch that git cannot re-derive fails the gate', () => {
  const e = env('A');
  declareEpoch(e, { epoch: 1, tree: 'A', code_hash: ('sha256:' + 'f'.repeat(64)) as Hash });
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'epoch_unverifiable').toBe(true);
});

test('ATTACK i — a pre-epoch record under a NON-retroactive chain is an unblessed orphan', () => {
  const e = env('A');
  const { rec } = declareEpoch(e, { epoch: 1, tree: 'A' });
  void rec;
  sealed(e, 'sha256:' + 'b'.repeat(64), undefined);
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'epoch_unverifiable' && r.detail.includes('unblessed orphan')).toBe(true);
});

test('ATTACK v — forked chain: two epochs sharing a parent fail topology', () => {
  const e = env('B');
  const g = declareEpoch(e, { epoch: 1, tree: 'A' });
  declareEpoch(e, { epoch: 2, tree: 'B', parent: g.hash });
  declareEpoch(e, { epoch: 3, tree: 'B', parent: g.hash }); // fork
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'ambiguous_epoch_chain' && r.detail.includes('fork')).toBe(true);
});

test('ATTACK vi — no root / cycle-shaped chain fails topology', () => {
  const e = env('A');
  // two epochs pointing at each other's hashes is unconstructable content-addressed; the
  // realizable cycle shape is "no root": every epoch names SOME parent hash
  declareEpoch(e, { epoch: 1, tree: 'A', parent: ('sha256:' + 'c'.repeat(64)) as Hash });
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'ambiguous_epoch_chain').toBe(true);
});

test('ATTACK iv — review that does not quote the code_hash is refused (reviews are not recyclable)', () => {
  const e = env('A');
  const oids = Object.fromEntries(COMPUTE_ROOTS.map((r) => [r, `A:${r}`]));
  const code = deriveCodeHashFromGit(e.git, oids);
  if (isRefused(code)) throw new Error('unexpected');
  const reviewPath = 'reviews/bad.md';
  writeFileSync(join(e.dir, reviewPath), 'looks good to me'); // no code_hash quoted
  const rec: EpochRecord = {
    record_type: 'Epoch', epoch: 1, root_tree_oids: oids, code_hash: code, grammar_version: 1,
    runtime: { bun_version: '1.x', os: 't', arch: 't' },
    review: { path: reviewPath, content_hash: hashBytes('looks good to me') },
    declared_by: 'x', parent: null, retroactive: false, blessed_records: null,
  };
  const h = putRecord(e.root, 'Epoch', rec as unknown as Record<string, unknown>);
  if (isRefused(h)) throw new Error('unexpected');
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.detail.includes('does not quote')).toBe(true);
});

test('ATTACK vii — revoked head blocks the gate; revoked ancestor quarantines its seals', () => {
  const e = env('B');
  const g = declareEpoch(e, { epoch: 1, tree: 'A' });
  sealed(e, g.rec.code_hash, g.hash);
  const h2 = declareEpoch(e, { epoch: 2, tree: 'B', parent: g.hash });
  const rev = putRecord(e.root, 'EpochRevocation', {
    record_type: 'EpochRevocation', epoch_hash: g.hash, reason: 'defect found', evidence_ref: 'test', revoked_by: 'verifier-test',
  });
  if (isRefused(rev)) throw new Error('unexpected');
  const r = verifyEpochChain(e.root, e.git, e.dir);
  if (isRefused(r)) throw new Error(r.detail);
  expect(r.revoked_epochs).toEqual([1]);
  expect(r.quarantined).toBe(1); // the seal under epoch 1 stops certifying
  // now revoke the head too — the gate must refuse outright
  const rev2 = putRecord(e.root, 'EpochRevocation', {
    record_type: 'EpochRevocation', epoch_hash: h2.hash, reason: 'also bad', evidence_ref: 'test', revoked_by: 'verifier-test',
  });
  if (isRefused(rev2)) throw new Error('unexpected');
  const r2 = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r2) && r2.detail.includes('revoked')).toBe(true);
});

test('THE 4a5a807 CATCH — staged compute-root change with no epoch fails the gate', () => {
  const e = env('B'); // staged tree is B
  declareEpoch(e, { epoch: 1, tree: 'A' }); // head epoch blesses A only
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'epoch_unverifiable' && r.detail.includes('unepoched')).toBe(true);
});

test('non-sequential epoch numbers fail topology', () => {
  const e = env('B');
  const g = declareEpoch(e, { epoch: 1, tree: 'A' });
  declareEpoch(e, { epoch: 5, tree: 'B', parent: g.hash });
  const r = verifyEpochChain(e.root, e.git, e.dir);
  expect(isRefused(r) && r.reason === 'ambiguous_epoch_chain' && r.detail.includes('1..N')).toBe(true);
});

test('headEpoch resolves the single un-superseded epoch', () => {
  const e = env('B');
  const g = declareEpoch(e, { epoch: 1, tree: 'A' });
  const h2 = declareEpoch(e, { epoch: 2, tree: 'B', parent: g.hash });
  const head = headEpoch(e.root);
  if (isRefused(head) || head === null) throw new Error('unexpected');
  expect(head.hash).toBe(h2.hash);
});

test('X15 red-first: a pre-epoch Result with NO epoch_hash key flags epoch_declared_after_run, never epoch_stale', async () => {
  const { openStore: open2, putRecord: put2 } = await import('../substrate/store.ts');
  const { buildReceipt } = await import('../receipt/receipt.ts');
  const { contentHash } = await import('../kernel/canonical.ts');
  const dir = mkdtempSync(join(tmpdir(), 'assay-x15-'));
  const store = open2(join(dir, 'store'));
  const resultRec = {
    record_type: 'Result', spec_hash: 'sha256:' + '1'.repeat(64), spec_registered_at: null,
    registered_after_window: null, window: { startT: 1, endT: 2 },
    inputs_hash: 'sha256:' + '2'.repeat(64), params_hash: 'sha256:' + '3'.repeat(64),
    code_hash: 'sha256:' + '4'.repeat(64),
    outcome: { kind: 'refused', reason: 'missing_data', detail: 'x15 fixture' },
  }; // deliberately NO epoch_hash key — the shape the real pre-W1 store holds
  const rh = put2(store, 'Result', resultRec);
  if (isRefused(rh)) throw new Error(rh.detail);
  const params = { record_type: 'Params', frictions: { version: 'x' } };
  const ph = put2(store, 'Params', params);
  if (isRefused(ph)) throw new Error(ph.detail);
  const run = {
    record_type: 'Run', entry: 'evaluate', triple: 'sha256:' + '5'.repeat(64),
    inputs_hash: 'sha256:' + '2'.repeat(64), code_hash: 'sha256:' + '4'.repeat(64),
    params_hash: ph, snapshot_hashes: [], output_hash: rh, refusal_reason: 'missing_data',
    started_at: '2026-08-17T00:00:00Z',
  }; // likewise no epoch_hash key
  const runH = put2(store, 'Run', run);
  if (isRefused(runH)) throw new Error(runH.detail);
  const receipt = buildReceipt(store, rh);
  if (isRefused(receipt)) throw new Error(receipt.detail);
  expect(receipt.receipt.honesty_flags).toContain('epoch_declared_after_run');
  expect(receipt.receipt.honesty_flags).not.toContain('epoch_stale');
  expect(receipt.receipt.verified).toBe(false);
  void contentHash;
});
