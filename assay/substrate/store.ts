// assay/substrate/store.ts
// Append-only content-addressed object store; sqlite index is DERIVED and rebuildable (I7).
// Objects are the truth. No delete, no update — supersede records only. Postgres swap point: this interface.

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';
import { canonicalize, hashBytes, isHash, type Hash } from '../kernel/canonical.ts';
import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';

export type RecordType =
  | 'Spec'
  | 'Registration'
  | 'DataSnapshot'
  | 'Params'
  | 'Run'
  | 'Result'
  | 'Adversary'
  | 'Supersede'
  | 'Receipt';

export interface StoreRoot {
  readonly dir: string;
}

function objectsDir(root: StoreRoot): string {
  return join(root.dir, 'objects');
}

function objectPath(root: StoreRoot, hash: Hash): string {
  return join(objectsDir(root), hash.replace(':', '-'));
}

export function openStore(dir: string): StoreRoot {
  mkdirSync(join(dir, 'objects'), { recursive: true });
  mkdirSync(join(dir, 'traces'), { recursive: true });
  const root: StoreRoot = { dir };
  // Cold-clone finding (A1): the index is derived and gitignored, so on a fresh checkout it must
  // self-materialize from objects — A1's reproduction command must be a SINGLE command.
  if (!existsSync(join(dir, 'index.sqlite'))) {
    const hasObjects = readdirSync(join(dir, 'objects')).some((f) => f.startsWith('sha256-'));
    if (hasObjects) rebuildIndex(root); // a refusal here surfaces on the first query; objects stay the truth
  }
  return root;
}

/** Write-once put. Existing identical bytes: idempotent. Existing different bytes: refuse (I7). */
export function putObject(root: StoreRoot, value: unknown): Outcome<Hash> {
  const bytes = canonicalize(value);
  if (isRefused(bytes)) return bytes;
  const hash = hashBytes(bytes);
  const p = objectPath(root, hash);
  if (existsSync(p)) {
    const existing = readFileSync(p, 'utf8');
    if (existing !== bytes) return refuse('store_immutable', `object ${hash} exists with different bytes`);
    return hash;
  }
  writeFileSync(p, bytes, { flag: 'wx' });
  return hash;
}

/** Read with mandatory hash verification — corrupted bytes refuse, never parse (A3). */
export function getObject(root: StoreRoot, hash: Hash): Outcome<unknown> {
  if (!isHash(hash)) return refuse('invalid_params', `not a hash: ${String(hash)}`);
  const p = objectPath(root, hash);
  if (!existsSync(p)) return refuse('unknown_object', `no object for ${hash}`);
  const bytes = readFileSync(p, 'utf8');
  const actual = hashBytes(bytes);
  if (actual !== hash) return refuse('hash_mismatch', `object claims ${hash}, bytes hash to ${actual}`);
  return JSON.parse(bytes) as unknown;
}

// ---- derived index (rebuildable; never the source of truth) ----

function indexDb(root: StoreRoot): Database {
  const db = new Database(join(root.dir, 'index.sqlite'));
  db.run(
    'CREATE TABLE IF NOT EXISTS records (hash TEXT PRIMARY KEY, record_type TEXT NOT NULL, created_seq INTEGER)'
  );
  return db;
}

export function putRecord(root: StoreRoot, recordType: RecordType, value: Record<string, unknown>): Outcome<Hash> {
  if (value.record_type !== recordType) {
    return refuse('invalid_params', `record_type field '${String(value.record_type)}' != '${recordType}'`);
  }
  const hash = putObject(root, value);
  if (isRefused(hash)) return hash;
  const db = indexDb(root);
  try {
    // created_seq is NOT wall-clock: rebuildIndex assigns hash-order ordinals, and a derived
    // index must reproduce identically (Forge 17). NULL here; ordinals come from rebuild.
    db.run('INSERT OR IGNORE INTO records (hash, record_type, created_seq) VALUES (?, ?, NULL)', [
      hash,
      recordType,
    ]);
  } finally {
    db.close();
  }
  return hash;
}

export function recordsOfType(root: StoreRoot, recordType: RecordType): Outcome<{ hash: Hash; value: unknown }[]> {
  const db = indexDb(root);
  try {
    const rows = db
      .query('SELECT hash FROM records WHERE record_type = ? ORDER BY hash')
      .all(recordType) as { hash: Hash }[];
    const out: { hash: Hash; value: unknown }[] = [];
    for (const r of rows) {
      const v = getObject(root, r.hash);
      if (isRefused(v)) return v;
      out.push({ hash: r.hash, value: v });
    }
    return out;
  } finally {
    db.close();
  }
}

/** Drop and rebuild the index purely from objects on disk — proof the index is derived. */
export function rebuildIndex(root: StoreRoot): Outcome<number> {
  const db = indexDb(root);
  try {
    db.run('DELETE FROM records');
    const files = readdirSync(objectsDir(root)).sort();
    let n = 0;
    for (const f of files) {
      if (!f.startsWith('sha256-')) continue; // .DS_Store and friends are not store content (Forge 16)
      const hash = f.replace('sha256-', 'sha256:') as Hash;
      if (!isHash(hash)) return refuse('invalid_params', `malformed object filename ${f}`);
      const v = getObject(root, hash);
      if (isRefused(v)) return v;
      const rt = (v as { record_type?: unknown }).record_type;
      if (typeof rt === 'string') {
        db.run('INSERT OR IGNORE INTO records (hash, record_type, created_seq) VALUES (?, ?, ?)', [hash, rt, n]);
        n++;
      }
    }
    return n;
  } finally {
    db.close();
  }
}
