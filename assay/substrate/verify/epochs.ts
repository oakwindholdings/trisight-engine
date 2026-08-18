// assay/substrate/verify/epochs.ts
// The epoch chain, verified as COMPUTED FACT (design v2 Component 1, ratified; Cato X-review applied).
// Lives inside COMPUTE_ROOTS deliberately: weakening this verifier changes code_hash → needs an epoch
// → needs a review (C2/F8). Genesis blesses an ENUMERATED, content-addressed record set (X1/X2 —
// nothing pattern-matched, nothing declarable twice). NOTE: rootOids('STAGED') runs `git write-tree`,
// which writes (unreferenced, gc-able) tree objects — the verifier is read-only w.r.t. the store but
// not w.r.t. .git/objects; disclosed per X11. A conflicted index refuses rather than crashes.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { refuse, isRefused, type Outcome } from '../../kernel/refusal.ts';
import { contentHash, hashBytes, isHash, type Hash } from '../../kernel/canonical.ts';
import { recordsOfType, type StoreRoot, SEALED_RECORD_TYPES } from '../store.ts';
import { COMPUTE_ROOTS, frameFiles } from '../codehash.ts';

export interface EpochRecord {
  readonly record_type: 'Epoch';
  readonly epoch: number;
  /** The four COMPUTE_ROOTS subtree OIDs. Store objects live OUTSIDE these roots, so declaring an
   *  epoch cannot alter the identity it declares (C1 fixed-point, defused one level down). */
  readonly root_tree_oids: Readonly<Record<string, string>>;
  readonly code_hash: Hash; // re-derived from git objects by clause 2 — never trusted
  readonly grammar_version: number;
  readonly runtime: { readonly bun_version: string; readonly os: string; readonly arch: string };
  readonly review: { readonly path: string; readonly content_hash: Hash };
  readonly declared_by: string;
  readonly parent: Hash | null;
  readonly retroactive: boolean;
  /** GENESIS ONLY (X1/X2): the complete, enumerated set of pre-epoch sealed-record hashes this
   *  chain blesses. Content-addressed and closed at declaration — a record not in this list is an
   *  unblessed orphan forever; a second blessing epoch is refused by clause 1. */
  readonly blessed_records: readonly Hash[] | null;
}

export interface EpochRevocationRecord {
  readonly record_type: 'EpochRevocation';
  readonly epoch_hash: Hash;
  readonly reason: string;
  readonly evidence_ref: string;
  readonly revoked_by: string;
}

/** Git operations, injectable so chain logic is testable with fakes (real impl below). */
export interface GitOps {
  /** OIDs of the compute-root subtrees: 'STAGED' (write-tree of the index) or any git ref */
  rootOids(refOrStaged: string): Record<string, string>;
  /** recursive (path, blobOid) listing of a subtree OID — blobs only; non-blob entries throw */
  lsTree(oid: string): { path: string; oid: string }[];
  /** raw blob bytes — never decoded (X9) */
  catBlob(oid: string): Uint8Array;
  oidExists(oid: string): boolean;
  /** is the path tracked by git (X6 — an epoch may not reference an untracked review) */
  fileTracked(relPath: string): boolean;
  /** last committing author email for a path, or null when no history exists yet (X6) */
  lastAuthorEmail(relPath: string): string | null;
}

export function realGit(assayDir: string): GitOps {
  const git = (args: string[]): string => execFileSync('git', args, { cwd: assayDir, encoding: 'utf8' });
  const gitRaw = (args: string[]): Buffer => execFileSync('git', args, { cwd: assayDir, maxBuffer: 256 * 1024 * 1024 }) as Buffer;
  const prefix = git(['rev-parse', '--show-prefix']).trim();
  // ls-tree silently applies the cwd as an implicit pathspec prefix — every call uses --full-tree.
  return {
    rootOids(refOrStaged) {
      const tree = refOrStaged === 'STAGED' ? git(['write-tree']).trim() : git(['rev-parse', `${refOrStaged}^{tree}`]).trim();
      const out: Record<string, string> = {};
      for (const root of COMPUTE_ROOTS) {
        const line = git(['ls-tree', '--full-tree', tree, `${prefix}${root}`]).trim();
        const m = line.match(/^040000 tree ([0-9a-f]{40})\t/);
        if (m === null) throw new Error(`compute root ${root} not found in ${refOrStaged} tree`);
        out[root] = m[1]!;
      }
      return out;
    },
    lsTree(oid) {
      return git(['ls-tree', '--full-tree', '-r', oid])
        .trim()
        .split('\n')
        .filter((l) => l.length > 0)
        .map((l) => {
          const m = l.match(/^\d+ blob ([0-9a-f]{40})\t(.+)$/);
          if (m === null) throw new Error(`non-blob entry under a compute root: ${l} (submodules/gitlinks are not sealable)`);
          return { path: m[2]!, oid: m[1]! };
        });
    },
    catBlob(oid) {
      return gitRaw(['cat-file', 'blob', oid]);
    },
    oidExists(oid) {
      try {
        git(['cat-file', '-e', oid]);
        return true;
      } catch {
        return false;
      }
    },
    fileTracked(relPath) {
      try {
        git(['ls-files', '--error-unmatch', relPath]);
        return true;
      } catch {
        return false;
      }
    },
    lastAuthorEmail(relPath) {
      const out = git(['log', '-1', '--format=%ae', '--', relPath]).trim();
      return out.length > 0 ? out : null;
    },
  };
}

/** Rebuild kernelCodeHash byte-for-byte from git objects alone (clause 2 — the C3 fix), through
 *  the SAME frameFiles owner the filesystem path uses (X9: one framing rule, raw bytes). */
export function deriveCodeHashFromGit(gitOps: GitOps, rootOids: Readonly<Record<string, string>>): Outcome<Hash> {
  const files: { label: string; bytes: Uint8Array }[] = [];
  try {
    for (const root of COMPUTE_ROOTS) {
      const oid = rootOids[root];
      if (oid === undefined) return refuse('epoch_unverifiable', `epoch records no OID for compute root '${root}'`);
      if (!gitOps.oidExists(oid)) return refuse('epoch_unverifiable', `git object ${oid} (${root}) absent from this repository`);
      for (const f of gitOps.lsTree(oid)) files.push({ label: `${root}/${f.path}`, bytes: gitOps.catBlob(f.oid) });
    }
  } catch (e) {
    return refuse('epoch_unverifiable', `git derivation failed: ${String(e)}`);
  }
  return frameFiles(files);
}

export interface EpochChainReport {
  readonly epochs: number;
  readonly head_epoch: number;
  readonly head_hash: Hash;
  readonly genesis_blessed_count: number;
  readonly revoked_epochs: number[];
  readonly sealed_records_checked: number;
  readonly retroactively_blessed: number;
  readonly epoch_declared_after_run: number;
  readonly quarantined: number;
  readonly review_authorship: 'verified-distinct' | 'indistinct-or-no-history (disclosed weak identity)';
}

/** The whole chain, verified. Every failure is a refusal naming its clause. */
export function verifyEpochChain(root: StoreRoot, gitOps: GitOps, assayDir: string): Outcome<EpochChainReport> {
  const epochRecs = recordsOfType(root, 'Epoch');
  if (isRefused(epochRecs)) return epochRecs;
  if (epochRecs.length === 0) return refuse('ambiguous_epoch_chain', 'no epochs declared — a post-W1 store must carry its chain');
  const epochs = epochRecs.map((e) => ({ hash: e.hash, v: e.value as EpochRecord }));

  // clause 1 — topology + X2 genesis constraints
  const roots = epochs.filter((e) => e.v.parent === null);
  if (roots.length !== 1) return refuse('ambiguous_epoch_chain', `${roots.length} root epochs (parent: null) — need exactly 1`);
  const retros = epochs.filter((e) => e.v.retroactive);
  if (retros.length > 1) {
    return refuse('ambiguous_epoch_chain', `${retros.length} retroactive epochs — the bridge cannot bless two histories (X2)`);
  }
  for (const e of epochs) {
    if (e.v.retroactive && e.v.parent !== null) {
      return refuse('ambiguous_epoch_chain', `epoch ${e.v.epoch} is retroactive but not genesis — retroactivity is genesis-only (X2)`);
    }
    if (!e.v.retroactive && e.v.blessed_records !== null) {
      return refuse('ambiguous_epoch_chain', `epoch ${e.v.epoch} carries blessed_records without retroactive — blessing is genesis-only (X2)`);
    }
  }
  const byParent = new Map<string, typeof epochs[number][]>();
  for (const e of epochs) {
    if (e.v.parent !== null) {
      const list = byParent.get(e.v.parent) ?? [];
      list.push(e);
      byParent.set(e.v.parent, list);
    }
  }
  for (const [parent, children] of byParent) {
    if (children.length > 1) {
      return refuse('ambiguous_epoch_chain', `fork: epochs ${children.map((c) => c.v.epoch).join(',')} share parent ${parent.slice(0, 16)}…`);
    }
  }
  const ordered: typeof epochs = [];
  let cursor: typeof epochs[number] | undefined = roots[0];
  const seen = new Set<string>();
  while (cursor !== undefined) {
    if (seen.has(cursor.hash)) return refuse('ambiguous_epoch_chain', 'cycle in epoch chain');
    seen.add(cursor.hash);
    ordered.push(cursor);
    cursor = byParent.get(cursor.hash)?.[0];
  }
  if (ordered.length !== epochs.length) {
    return refuse('ambiguous_epoch_chain', `${epochs.length - ordered.length} epoch(s) unreachable from the root — orphaned link`);
  }
  for (let i = 0; i < ordered.length; i++) {
    if (ordered[i]!.v.epoch !== i + 1) {
      return refuse('ambiguous_epoch_chain', `epoch numbers not 1..N along the chain (position ${i + 1} carries ${ordered[i]!.v.epoch})`);
    }
  }
  const head = ordered[ordered.length - 1]!;
  const genesis = ordered[0]!;

  // clause 2 — historical re-derivation from git objects: declarations are never trusted
  for (const e of ordered) {
    const derived = deriveCodeHashFromGit(gitOps, e.v.root_tree_oids);
    if (isRefused(derived)) return derived;
    if (derived !== e.v.code_hash) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: declared code_hash ${e.v.code_hash.slice(0, 20)}… but git re-derives ${derived.slice(0, 20)}…`);
    }
  }

  // clause 3 — head equals present (STAGED covers the pre-commit declaration flow)
  let current: Record<string, string>;
  try {
    current = gitOps.rootOids('STAGED');
  } catch (e) {
    return refuse('epoch_unverifiable', `cannot read current tree (conflicted index?): ${String(e)}`);
  }
  for (const rootName of COMPUTE_ROOTS) {
    if (current[rootName] !== head.v.root_tree_oids[rootName]) {
      return refuse('epoch_unverifiable', `current ${rootName}/ tree differs from head epoch ${head.v.epoch} — an unepoched compute-root change exists`);
    }
  }

  // clause 5 — review binding: tracked, byte-bound, quotes the code_hash, authorship best-effort (X6)
  let authorship: EpochChainReport['review_authorship'] = 'verified-distinct';
  for (const e of ordered) {
    const p = join(assayDir, e.v.review.path);
    if (e.v.review.path.trim().length === 0 || !isHash(e.v.review.content_hash)) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review reference malformed`);
    }
    if (!gitOps.fileTracked(e.v.review.path)) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review file ${e.v.review.path} is not git-tracked — an epoch may not cite a document absent from clones (X6)`);
    }
    if (!existsSync(p)) return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review file ${e.v.review.path} missing from working tree`);
    const bytes = readFileSync(p, 'utf8');
    if (hashBytes(bytes) !== e.v.review.content_hash) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review file bytes do not match recorded content_hash`);
    }
    if (!bytes.includes(e.v.code_hash)) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review does not quote this epoch's code_hash — reviews are not recyclable`);
    }
    const author = gitOps.lastAuthorEmail(e.v.review.path);
    if (author === null) {
      authorship = 'indistinct-or-no-history (disclosed weak identity)';
    } else if (author === e.v.declared_by) {
      return refuse('epoch_unverifiable', `epoch ${e.v.epoch}: review author equals declarer '${author}' — executor may not review itself (Article II; git authorship is weak identity, disclosed)`);
    }
  }

  // clause 6 — revocations quarantine
  const revRecs = recordsOfType(root, 'EpochRevocation');
  if (isRefused(revRecs)) return revRecs;
  const revoked = new Set(revRecs.map((r) => (r.value as EpochRevocationRecord).epoch_hash));
  const revokedEpochNums = ordered.filter((e) => revoked.has(e.hash)).map((e) => e.v.epoch);
  if (revoked.has(head.hash)) {
    return refuse('ambiguous_epoch_chain', `head epoch ${head.v.epoch} is revoked — declare a successor before the gate can pass`);
  }

  // clause 4 — sealed-record binding: epoch_hash resolves, or membership in the ENUMERATED genesis set (X1)
  const byHash = new Map(ordered.map((e) => [e.hash as string, e]));
  const blessedSet = new Set(genesis.v.blessed_records ?? []);
  let checked = 0;
  let blessed = 0;
  let afterRun = 0;
  let quarantined = 0;
  for (const t of SEALED_RECORD_TYPES) {
    const recs = recordsOfType(root, t);
    if (isRefused(recs)) return recs;
    for (const r of recs) {
      const ch = (r.value as { code_hash?: string }).code_hash;
      if (typeof ch !== 'string') continue;
      checked++;
      const eh = (r.value as { epoch_hash?: string }).epoch_hash;
      let epoch: (typeof ordered)[number] | undefined;
      if (typeof eh === 'string') {
        epoch = byHash.get(eh);
        if (epoch === undefined) return refuse('epoch_unverifiable', `${t} ${r.hash.slice(0, 20)}… names an epoch that does not exist`);
        if (epoch.v.code_hash !== ch) {
          return refuse('epoch_unverifiable', `${t} ${r.hash.slice(0, 20)}…: code_hash does not match its named epoch ${epoch.v.epoch}`);
        }
      } else {
        if (!blessedSet.has(r.hash)) {
          return refuse('epoch_unverifiable', `${t} ${r.hash.slice(0, 20)}…: not in the genesis blessed enumeration — an unblessed orphan (X1)`);
        }
        epoch = genesis;
        blessed++;
        afterRun++; // genesis was declared after these ran — permanently marked in the report
      }
      if (revoked.has(epoch.hash)) quarantined++;
    }
  }

  return {
    epochs: ordered.length,
    head_epoch: head.v.epoch,
    head_hash: head.hash,
    genesis_blessed_count: blessedSet.size,
    revoked_epochs: revokedEpochNums,
    sealed_records_checked: checked,
    retroactively_blessed: blessed,
    epoch_declared_after_run: afterRun,
    quarantined,
    review_authorship: authorship,
  };
}

/** Head epoch resolved for compute-time binding (invoke stamps epoch_hash on new records). */
export function headEpoch(root: StoreRoot): Outcome<{ hash: Hash; record: EpochRecord } | null> {
  const epochRecs = recordsOfType(root, 'Epoch');
  if (isRefused(epochRecs)) return epochRecs;
  if (epochRecs.length === 0) return null;
  const epochs = epochRecs.map((e) => ({ hash: e.hash, v: e.value as EpochRecord }));
  const parents = new Set(epochs.map((e) => e.v.parent).filter((p): p is Hash => p !== null));
  const heads = epochs.filter((e) => !parents.has(e.hash));
  if (heads.length !== 1) return refuse('ambiguous_epoch_chain', `${heads.length} heads — chain must be verified before use`);
  return { hash: heads[0]!.hash, record: heads[0]!.v };
}

/** Revocations for a store, as a set of epoch hashes (used by receipt honesty flags — X3). */
export function revokedEpochs(root: StoreRoot): Outcome<Set<string>> {
  const revRecs = recordsOfType(root, 'EpochRevocation');
  if (isRefused(revRecs)) return revRecs;
  return new Set(revRecs.map((r) => (r.value as EpochRevocationRecord).epoch_hash));
}

/** Build (not store) an Epoch record for declaration — cli wires storage + argument plumbing. */
export function buildEpochRecord(
  gitOps: GitOps,
  assayDir: string,
  opts: {
    epoch: number;
    from: string; // 'STAGED' or any git ref — genesis declares a past commit's tree
    grammar_version: number;
    reviewPath: string;
    declared_by: string;
    parent: Hash | null;
    retroactive: boolean;
    blessed_records?: readonly Hash[]; // genesis only — the enumerated pre-epoch set (X1)
  }
): Outcome<EpochRecord> {
  if (opts.retroactive && opts.parent !== null) {
    return refuse('ambiguous_epoch_chain', 'retroactive epochs are genesis-only (X2)');
  }
  if (!opts.retroactive && opts.blessed_records !== undefined) {
    return refuse('ambiguous_epoch_chain', 'blessed_records is genesis-only (X2)');
  }
  if (opts.blessed_records !== undefined && opts.blessed_records.some((h) => !isHash(h))) {
    return refuse('invalid_params', 'blessed_records contains a malformed hash');
  }
  const root_tree_oids = gitOps.rootOids(opts.from);
  const derived = deriveCodeHashFromGit(gitOps, root_tree_oids);
  if (isRefused(derived)) return derived;
  if (!gitOps.fileTracked(opts.reviewPath)) {
    return refuse('epoch_unverifiable', `review file ${opts.reviewPath} is not git-tracked (X6) — git add it first`);
  }
  const reviewFull = join(assayDir, opts.reviewPath);
  if (!existsSync(reviewFull)) return refuse('epoch_unverifiable', `review file ${opts.reviewPath} does not exist`);
  const reviewBytes = readFileSync(reviewFull, 'utf8');
  if (!reviewBytes.includes(derived)) {
    return refuse('epoch_unverifiable', `review file does not quote code_hash ${derived.slice(0, 24)}… — a review must name what it reviewed`);
  }
  const rec: EpochRecord = {
    record_type: 'Epoch',
    epoch: opts.epoch,
    root_tree_oids,
    code_hash: derived,
    grammar_version: opts.grammar_version,
    runtime: { bun_version: Bun.version, os: process.platform, arch: process.arch },
    review: { path: opts.reviewPath, content_hash: hashBytes(reviewBytes) },
    declared_by: opts.declared_by,
    parent: opts.parent,
    retroactive: opts.retroactive,
    blessed_records: opts.retroactive ? (opts.blessed_records ?? []) : null,
  };
  const check = contentHash(rec);
  if (isRefused(check)) return check;
  return rec;
}
