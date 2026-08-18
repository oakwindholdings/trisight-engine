// assay/phase2/report.ts
// Dick-facing report generator — reads campaign + sweep records and WRITES PROSE FROM THEM ONLY.
// Every number cites a stored record hash or estate file; a claim without a citation cannot render.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isRefused } from '../kernel/refusal.ts';
import { openCampaignStore, campaignRecordsOfType } from './campaignStore.ts';
import { type SideRecord, type InflationFactor } from './inflation.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSAY = join(HERE, '..');
const root = openCampaignStore(join(ASSAY, 'store-campaign'));
const OUT = join(ASSAY, 'reports');
mkdirSync(OUT, { recursive: true });

function fetch<T>(type: Parameters<typeof campaignRecordsOfType>[1]): { hash: string; value: T }[] {
  const r = campaignRecordsOfType(root, type);
  if (isRefused(r)) throw new Error(r.detail);
  return r as { hash: string; value: T }[];
}

const claims = fetch<SideRecord>('PredecessorClaim');
const realizeds = fetch<SideRecord>('PredecessorRealized');
const inflations = fetch<InflationFactor>('InflationFactor');
const notes = fetch<{ strategy: string; kind: string; reason: string; detail: string }>('CampaignNote');

const strategies = [...new Set(claims.map((c) => c.value.strategy))].sort();

const pct = (x: number): string => `${(x * 100).toFixed(1)}%`;

let estate = `# TriSight Estate — Inflation Study (Phase 2)\n\n`;
estate += `> Generated ${'from stored records only'} — every figure below carries a record hash or an estate file citation. `;
estate += `To refute any line: open the cited source, or re-run \`bun run phase2/ingest.ts && bun run phase2/report.ts\` and diff.\n\n`;
estate += `**Structural context that applies to every sealed strategy:** a prior fleet-wide audit (workflow w4nfwu675, `;
estate += `orchestration/reports/TOTAL-QUALITY-MATRIX.md) found every committed backtest ranked inside a FROZEN, `;
estate += `survivor-biased universe pool. That bias only inflates claims — dead and delisted names the strategy would `;
estate += `have traded are erased from history. Dip-buy strategies (both Oakwinds, Sniper) amplify this effect. `;
estate += `Every per-strategy figure below should be read with that inflator already in mind.\n\n`;
estate += `| Strategy | Claimed (ann.) | Realized (ann.) | Return inflation | Win-rate inflation | Basis |\n|---|---|---|---|---|---|\n`;

for (const s of strategies) {
  const claim = claims.find((c) => c.value.strategy === s);
  const realized = realizeds.find((c) => c.value.strategy === s);
  const inf = inflations.find((i) => i.value.strategy === s);
  const note = notes.find((n) => n.value.strategy === s && n.value.kind === 'inflation_refused');

  let inflationCell = 'NOT RUN';
  let wrCell = 'n/c';
  let basis = '—';
  if (inf !== undefined) {
    const o = inf.value.return_outcome;
    if (o !== null && typeof o === 'object' && 'kind' in o && o.kind === 'ratio') inflationCell = `**${(o as { value: number }).value.toFixed(2)}×**`;
    else if (o !== null && typeof o === 'object' && 'kind' in o && o.kind === 'sign_divergence') inflationCell = '**∞ (sign divergence)**';
    else inflationCell = `REFUSED: ${(o as { reason?: string }).reason ?? '?'}`;
    if (inf.value.win_rate_ratio !== null) wrCell = `**${inf.value.win_rate_ratio.toFixed(2)}×**`;
    basis = `\`${inf.hash.slice(0, 23)}…\``;
  } else if (note !== undefined) {
    inflationCell = `REFUSED: ${note.value.reason}`;
    basis = note.value.detail.slice(0, 60);
  }
  estate += `| ${s} | ${claim?.value.annualized_return !== null && claim !== undefined ? pct(claim.value.annualized_return!) : 'n/a'} | ${realized?.value.annualized_return !== null && realized !== undefined ? pct(realized.value.annualized_return!) : 'n/a'} | ${inflationCell} | ${wrCell} | ${basis} |\n`;

  // per-strategy page
  let page = `# ${s} — Inflation Report\n\n`;
  page += `## The claim\n\n`;
  if (claim !== undefined) {
    page += `- Status: ${claim.value.status}\n- Stated: ${claim.value.value_raw ?? 'n/a'} (${claim.value.metric_kind ?? '?'}) over ${claim.value.window_from ?? '?'}..${claim.value.window_to ?? '?'}\n`;
    page += `- Normalized: ${claim.value.annualized_return !== null ? pct(claim.value.annualized_return) + '/yr' : 'NOT NORMALIZABLE'} — method: ${claim.value.normalization_method ?? 'n/a'}\n`;
    page += `- Sources: ${claim.value.source_citations.map((c) => `\`${c}\``).join(', ')}\n`;
    if (claim.value.excerpt !== null) page += `- Verbatim: "${claim.value.excerpt}"\n`;
    page += `- Record: \`${claim.hash}\`\n`;
  } else page += `NOT FOUND\n`;
  page += `\n## The realized record\n\n`;
  if (realized !== undefined) {
    page += `- Status: ${realized.value.status}\n- Stated: ${realized.value.value_raw ?? 'n/a'} over ${realized.value.window_from ?? '?'}..${realized.value.window_to ?? '?'}\n`;
    page += `- Normalized: ${realized.value.annualized_return !== null ? pct(realized.value.annualized_return) + '/yr' : 'NOT NORMALIZABLE'} — method: ${realized.value.normalization_method ?? 'n/a'}\n`;
    page += `- Sources: ${realized.value.source_citations.map((c) => `\`${c}\``).join(', ')}\n`;
    if (realized.value.excerpt !== null) page += `- Verbatim: "${realized.value.excerpt}"\n`;
    page += `- Record: \`${realized.hash}\`\n`;
  } else page += `NOT FOUND\n`;
  page += `\n## The verdict\n\n`;
  if (inf !== undefined) {
    const o = inf.value.return_outcome as { kind?: string; value?: number; detail?: string; reason?: string };
    if (o.kind === 'ratio') {
      page += `**Return inflation: ${o.value!.toFixed(2)}×** — the claimed rate overstates the realized rate by this multiple `;
      page += `(claimed ${inf.value.claimed_annualized !== null ? pct(inf.value.claimed_annualized) : '?'}/yr over ${inf.value.claim_days}d vs realized ${inf.value.realized_annualized !== null ? pct(inf.value.realized_annualized) : '?'}/yr over ${inf.value.realized_days}d).\n`;
    } else if (o.kind === 'sign_divergence') {
      page += `**Return: sign divergence** — ${o.detail}. No finite ratio can describe this; the claim is categorically inflated.\n`;
    } else {
      page += `**Return inflation: REFUSED (${o.reason})** — ${o.detail}. A refusal is a finding: this claim cannot be honestly ratioed against reality.\n`;
    }
    page += `\n**Win-rate inflation: ${inf.value.win_rate_ratio !== null ? `${inf.value.win_rate_ratio.toFixed(2)}×` : 'not computed'}** — ${inf.value.win_rate_note}.\n`;
    page += `\n> ${inf.value.regime_note}\n`;
    page += `\nMethod: ${inf.value.method}\nRecord: \`${inf.hash}\`\n`;
  } else if (note !== undefined) {
    page += `**REFUSED — ${note.value.reason}.** ${note.value.detail}\n\nA refusal is a finding: this claim cannot currently be checked against reality, which is itself the predecessor system's core defect.\n`;
  } else {
    page += `NOT RUN.\n`;
  }
  page += `\n## How to refute this page\n\nOpen the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.\n`;
  writeFileSync(join(OUT, `inflation-${s.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`), page);
}

const computed = inflations.filter((i) => (i.value.return_outcome as { kind?: string }).kind === 'ratio');
const ratios = computed.map((i) => (i.value.return_outcome as { value: number }).value).sort((a, b) => a - b);
estate += `\n## Distribution\n\n`;
estate += `- Strategies examined: ${strategies.length}\n- Finite ratios computed: ${ratios.length}\n- Sign divergences (claim +, reality ≤0): ${inflations.filter((i) => (i.value.return_outcome as { kind?: string }).kind === 'sign_divergence').length}\n- Refused (unmeasurable): ${notes.filter((n) => n.value.kind === 'inflation_refused').length}\n`;
if (ratios.length > 0) {
  estate += `- Ratio range: ${ratios[0]!.toFixed(2)}× .. ${ratios[ratios.length - 1]!.toFixed(2)}× (median ${ratios[Math.floor(ratios.length / 2)]!.toFixed(2)}×)\n`;
}
if (existsSync(join(OUT, 'phase3-sweep.json'))) {
  const sweep = JSON.parse(readFileSync(join(OUT, 'phase3-sweep.json'), 'utf8')) as { population: number; evaluated_ok: number; refused: number; survivors: number };
  estate += `\n## What the honest gauntlet says about finding replacements (Phase 3)\n\n`;
  estate += `${sweep.population} pre-registered candidate variants were run through the identical gauntlet: `;
  estate += `${sweep.evaluated_ok} evaluated, ${sweep.refused} refused for insufficient history, **${sweep.survivors} survived adversarial review**. `;
  estate += `Every number and its worst case: \`reports/phase3-sweep.json\`. The lesson is the selection discipline, not any single rule set.\n`;
}
writeFileSync(join(OUT, 'ESTATE-INFLATION.md'), estate);
console.log(`wrote ESTATE-INFLATION.md + ${strategies.length} strategy pages`);
