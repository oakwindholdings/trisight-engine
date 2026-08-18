// assay/phase2/ingest.ts
// Ingest normalized claim/realized sides from phase2/normalized-inputs.json into the campaign
// store, compute inflation factors (or refusals), and print the outcome per strategy.
// The normalization JSON is human-authored FROM fleet citations — judgment kept visible and refutable.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRefused } from '../kernel/refusal.ts';
import { openCampaignStore, putCampaignRecord } from './campaignStore.ts';
import { computeInflation, type SideRecord } from './inflation.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSAY = join(HERE, '..');
const root = openCampaignStore(join(ASSAY, 'store-campaign'));

interface InputRow {
  strategy: string;
  seal_ref: string | null;
  claim: Omit<SideRecord, 'record_type' | 'strategy' | 'seal_ref' | 'provenance'>;
  realized: Omit<SideRecord, 'record_type' | 'strategy' | 'seal_ref' | 'provenance'>;
}

const inputs = JSON.parse(readFileSync(join(HERE, 'normalized-inputs.json'), 'utf8')) as InputRow[];

for (const row of inputs) {
  const claim: SideRecord = { record_type: 'PredecessorClaim', strategy: row.strategy, seal_ref: row.seal_ref, provenance: 'estate-readonly', ...row.claim };
  const realized: SideRecord = { record_type: 'PredecessorRealized', strategy: row.strategy, seal_ref: row.seal_ref, provenance: 'estate-readonly', ...row.realized };
  const ch = putCampaignRecord(root, 'PredecessorClaim', claim as unknown as Record<string, unknown>);
  if (isRefused(ch)) throw new Error(`${row.strategy} claim: ${ch.detail}`);
  const rh = putCampaignRecord(root, 'PredecessorRealized', realized as unknown as Record<string, unknown>);
  if (isRefused(rh)) throw new Error(`${row.strategy} realized: ${rh.detail}`);
  const inf = computeInflation(claim, ch, realized, rh);
  if (isRefused(inf)) {
    // the refusal itself is a stored, citable deliverable (ISC-158)
    const note = {
      record_type: 'CampaignNote' as const,
      strategy: row.strategy,
      kind: 'inflation_refused',
      reason: inf.reason,
      detail: inf.detail,
      claim_hash: ch,
      realized_hash: rh,
    };
    const nh = putCampaignRecord(root, 'CampaignNote', note as unknown as Record<string, unknown>);
    if (isRefused(nh)) throw new Error(`${row.strategy} note: ${nh.detail}`);
    console.log(`${row.strategy}: REFUSED ${inf.reason} — ${inf.detail}`);
    continue;
  }
  const ih = putCampaignRecord(root, 'InflationFactor', inf as unknown as Record<string, unknown>);
  if (isRefused(ih)) throw new Error(`${row.strategy} inflation: ${ih.detail}`);
  const o = inf.return_outcome;
  const label =
    o !== null && 'kind' in o && o.kind === 'ratio'
      ? `return ratio ${o.value.toFixed(2)}x`
      : o !== null && 'kind' in o && o.kind === 'sign_divergence'
        ? 'return SIGN DIVERGENCE (categorically inflated)'
        : `return REFUSED ${(o as { reason: string }).reason}`;
  const wr = inf.win_rate_ratio !== null ? `win-rate ratio ${inf.win_rate_ratio.toFixed(2)}x` : 'win-rate n/c';
  console.log(`${row.strategy}: ${label} | ${wr} — ${inf.win_rate_note}`);
}
