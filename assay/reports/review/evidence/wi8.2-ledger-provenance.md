# WI-8.2 — Live ledger provenance: `/trisight-volume/Snapshots/swing_trade_log.csv`

## Method

Per the sealed task scope, this trace uses the **Railway production/live volume**, not the
git-committed copy. Pulled via:

```
cd /Users/bobstewart/dev/trisight/trisight-trader
railway ssh --service trisight-trader "cat /trisight-volume/Snapshots/swing_trade_log.csv"
```

Railway session banner (proves this hit the live container, not a local file):
```
Using SSH key from file /Users/bobstewart/.ssh/spark.pub: bobstewart@Mac.lan
```
Project confirmed via `railway status` before the pull:
```
Project:         TriSight-Trader
Environment:     production
trisight-trader
    status:        ● Online
    volume:        web-volume · /trisight-volume · 11.5 GB / 48.8 GB
```
Pulled 2026-08-19 (today), saved to
`/private/tmp/claude-501/.../scratchpad/swing_trade_log_live.csv` for analysis. This is a
**fresh, live pull** — 12 days after the 2026-08-07 pull that produced the sealed
`normalized-inputs.json` / `dialog-seed.json` figure of 259 rows. The strategy has kept
trading in that window, so the live file has grown; both counts are reported below rather
than forcing the newer pull to match the older one.

## Column header (confirms this is the trade log, not a different file)

```
ticker,entry_date,exit_date,entry_price,exit_price,pnl_pct,exit_reason,days_held,stop_price,pole_date,consol_days,pole_vol_ratio,universe_source,sector,pole_range_pct,be_triggered,original_stop,recommended_slot_weight,quantity,pnl_usd,pnl_usd_source
```

## Classification rules (quoted inline, as required)

- **BACKFILL**: `universe_source == "BACKFILL"` (the ledger's own tag column; matches the
  BACKFILL classification used throughout DECISIONS-INBOX RULING 3 and DEFECT-REGISTRY D86).
- **D86-signature**: per the task's own rule statement — `pnl_pct==+1.00% AND days_held==1`
  — cross-checked against DEFECT-REGISTRY D86's fuller description: "101 of 256 closed
  trades (54% of all STOP_TRAIL exits) carry the **+1.00%/1-day/BE-triggered signature** the
  validated contract makes mathematically impossible" (DEFECT-REGISTRY.md:119, quoted in
  full at `evidence/DEFECT-REGISTRY.md:119`).
- **Paper-simulated (clean)**: every remaining row — not BACKFILL, not carrying the D86
  signature.

## Counts — today's live pull (2026-08-19), all 291 data rows

| Class | Rule | Count |
|---|---|---|
| Total rows | all data rows in the live CSV | **291** |
| BACKFILL | `universe_source == "BACKFILL"` | **48** |
| D86-signature | `pnl_pct == 1.00 AND days_held == 1` (non-BACKFILL) | **134** |
| Paper-simulated (clean) | remaining rows (neither BACKFILL nor D86) | **109** |

Check: 48 + 134 + 109 = 291. ✓ No BACKFILL row also carries the D86 signature (confirmed by
direct query — 0 rows match both); the three classes are mutually exclusive and exhaustive.

Supporting detail confirmed in the raw data:
- All 134 D86-signature rows show `exit_reason=STOP_TRAIL` and `be_triggered=True` — matching
  the fuller D86 description ("+1.00%/1-day/BE-triggered signature") exactly, not just the
  narrower `pnl_pct`/`days_held` pair.
- All 48 BACKFILL rows carry `entry_date` between 2025-12-29 and 2026-04-15 — pre-dating the
  live strategy's own stated backfill cutoff (DEFECT-REGISTRY/dialog-seed both say "rows
  before ~2026-04-26").
- No row dated before 2026-04-26 is un-tagged (i.e., every pre-cutoff row in the current live
  file is correctly tagged `BACKFILL`; there is no residual "unlabeled fixture" class of the
  kind RULING 3 describes for the *committed* file — see wi8.2a).

## Reconciling against the sealed 259-row snapshot (2026-08-07)

The sealed `normalized-inputs.json` (excerpt, `phase2/normalized-inputs.json:277,285,287`)
recorded, from the 2026-08-07 pull:
> "259 closed paper trades: mean +0.517%/trade, median +1.000% — but the D86 synthetic
> signature (pnl_pct == +1.00% AND days_held == 1) sits on 104/259 rows, and 48 rows are
> BACKFILL-simulated; no aggregate win rate stated"

Comparing the two pulls:

| Pull date | Total | BACKFILL | D86-signature | Clean |
|---|---|---|---|---|
| 2026-08-07 (sealed) | 259 | 48 | 104 | 107 |
| 2026-08-19 (this pull, live) | 291 | 48 | 134 | 109 |
| Δ (12 days) | +32 | +0 | +30 | +2 |

The BACKFILL count is unchanged (those rows are historical and fixed at pre-2026-04-26
dates, so a later pull cannot add to them). The +32 new rows since 2026-08-07 are almost
entirely (30 of 32) new D86-signature closes — the STOP_TRAIL/+1.00%/1-day/BE-triggered
pattern DEFECT-REGISTRY D86 says is "NOT LATENT — ACTIVELY EXPRESSING" (D86, DEFECT-REGISTRY
line 119) has continued to fire in the 12 days between pulls. This is corroborating, not
contradicting, evidence for D86's own "actively expressing" characterization — the defect
has kept producing new contract-invalid closes since the review card was drafted, so the
"well over half the ledger is unusable" framing shown to Dick (see wi8.1) is, if anything,
now understating the current proportion: 134/291 D86 + 48/291 BACKFILL = 182/291 (62.5%)
flagged today vs 152/259 (58.7%) at the 2026-08-07 pull.

## Sources
- Live file: `/trisight-volume/Snapshots/swing_trade_log.csv` (Railway production volume,
  service `trisight-trader`), pulled 2026-08-19 via `railway ssh`
- `assay/phase2/normalized-inputs.json:275-288` (sealed 2026-08-07 snapshot figures)
- `assay/reports/review/evidence/DEFECT-REGISTRY.md:119` (D86 entry, full rule + status)
