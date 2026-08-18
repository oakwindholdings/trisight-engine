// assay/phase2/campaignStore.ts
// Separate content-addressed store for Phase-2 estate-derived records (store-campaign/).
// Deliberately OUTSIDE COMPUTE_ROOTS and separate from store-data/: predecessor-derived records
// never share a namespace with vendor-derived ones, and Phase-1 seals stay untouched (ISC-154).

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Database } from 'bun:sqlite';
import { putObject, getObject, type StoreRoot } from '../substrate/store.ts';
import { refuse, isRefused, type Outcome } from '../kernel/refusal.ts';
import { type Hash } from '../kernel/canonical.ts';

export type CampaignRecordType = 'PredecessorClaim' | 'PredecessorRealized' | 'InflationFactor' | 'CampaignNote';

export function openCampaignStore(dir: string): StoreRoot {
  mkdirSync(join(dir, 'objects'), { recursive: true });
  mkdirSync(join(dir, 'traces'), { recursive: true });
  return { dir };
}

function indexDb(root: StoreRoot): Database {
  const db = new Database(join(root.dir, 'index.sqlite'));
  db.run('CREATE TABLE IF NOT EXISTS records (hash TEXT PRIMARY KEY, record_type TEXT NOT NULL)');
  return db;
}

export function putCampaignRecord(root: StoreRoot, recordType: CampaignRecordType, value: Record<string, unknown>): Outcome<Hash> {
  if (value.record_type !== recordType) {
    return refuse('invalid_params', `record_type field '${String(value.record_type)}' != '${recordType}'`);
  }
  const hash = putObject(root, value);
  if (isRefused(hash)) return hash;
  const db = indexDb(root);
  try {
    db.run('INSERT OR IGNORE INTO records (hash, record_type) VALUES (?, ?)', [hash, recordType]);
  } finally {
    db.close();
  }
  return hash;
}

export function campaignRecordsOfType(root: StoreRoot, recordType: CampaignRecordType): Outcome<{ hash: Hash; value: unknown }[]> {
  const db = indexDb(root);
  try {
    const rows = db.query('SELECT hash FROM records WHERE record_type = ? ORDER BY hash').all(recordType) as { hash: Hash }[];
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
