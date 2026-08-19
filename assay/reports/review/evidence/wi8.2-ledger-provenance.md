# WI-8.2 — Live ledger provenance: `/trisight-volume/Snapshots/swing_trade_log.csv`

## Rework note (this pass)

This is a rework of the prior draft, re-pulling the live ledger fresh today
(2026-08-19) rather than reusing the prior draft's numbers, to close a
row-count discrepancy flagged against the sealed 2026-08-07 study figures
(259 rows / 104 D86-signature / 48 BACKFILL) vs. a live pull showing ~291
rows. The independent re-pull below reproduces the same 291/48/134/109
breakdown the prior draft reported — so those counts stand verified by a
second, fresh query — but it also surfaces one inaccurate supporting claim
in the prior draft (the "every pre-cutoff row is tagged BACKFILL" line),
which is corrected in the Supporting detail section below with the
counter-example rows quoted.

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
Project/environment confirmed via `railway status` immediately before the pull:
```
Project:         TriSight-Trader
Environment:     production
trisight-trader
    status:        ● Online
    volume:        web-volume · /trisight-volume · 11.5 GB / 48.8 GB
```
Pulled 2026-08-19 (today), exit code `0`, saved to
`/private/tmp/claude-501/.../scratchpad/swing_trade_log_live_rework.csv`
(md5 `b5158c7bdb44a8fd1da68a16e6167838`) for analysis. This is a **fresh, live pull** — 12
days after the 2026-08-07 pull that produced the sealed `normalized-inputs.json` /
`dialog-seed.json` figure of 259 rows. The strategy has kept trading in that window, so the
live file has grown; both counts are reported below rather than forcing the newer pull to
match the older one.

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

Computed directly against the freshly pulled CSV with `awk -F,` field-position queries
(`$13` = `universe_source`, `$6` = `pnl_pct`, `$8` = `days_held`):

| Class | Rule | Count |
|---|---|---|
| Total rows | `wc -l` on the pulled file minus header (292 lines total, 1 header) | **291** |
| BACKFILL | `$13=="BACKFILL"` | **48** |
| D86-signature | `$6==1 && $8==1 && $13!="BACKFILL"` | **134** |
| Paper-simulated (clean) | `!($13=="BACKFILL") && !($6==1 && $8==1)` | **109** |

Check: 48 + 134 + 109 = 291. ✓ Overlap query (`$13=="BACKFILL" && $6==1 && $8==1`) returns 0
rows — no BACKFILL row also carries the D86 signature; the three classes are mutually
exclusive and exhaustive. These figures were reproduced independently in this rework pass
(fresh pull, fresh `awk` query) and match the prior draft's reported 291/48/134/109 exactly.

Supporting detail confirmed in the raw data:
- All 134 D86-signature rows show `exit_reason=STOP_TRAIL` (134/134 by direct `uniq -c`
  count) and `be_triggered=True` (134/134 by direct `uniq -c` count) — matching the fuller
  D86 description ("+1.00%/1-day/BE-triggered signature") exactly, not just the narrower
  `pnl_pct`/`days_held` pair.
- All 48 BACKFILL rows carry `entry_date` between 2025-12-29 and 2026-04-15 — pre-dating the
  live strategy's own stated backfill cutoff (DEFECT-REGISTRY/dialog-seed both say "rows
  before ~2026-04-26").
- **Correction to the prior draft:** the prior draft claimed "No row dated before 2026-04-26
  is un-tagged... every pre-cutoff row in the current live file is correctly tagged
  BACKFILL." That claim is **false** — a direct query (`entry_date < 2026-04-26 AND
  universe_source != "BACKFILL"`) returns **3 rows**, all tagged `TIER1_PROXY` instead of
  `BACKFILL`:
  ```
  COST,2026-04-21,2026-04-24,1005.81,1015.87,1.0,STOP_TRAIL,3,...,TIER1_PROXY,Unknown,...
  MSFT,2026-04-23,2026-04-24,420.35,424.55,1.0,STOP_TRAIL,1,...,TIER1_PROXY,Unknown,...
  AMZN,2026-04-21,2026-04-28,249.91,257.74,3.13,STOP_TRAIL,5,...,TIER1_PROXY,Unknown,...
  ```
  This does not change the 291/48/134/109 top-line counts — the MSFT row already falls into
  the D86-signature bucket (`pnl_pct==1.0`, `days_held==1`, `universe_source != "BACKFILL"`),
  and COST/AMZN fall into the "clean" bucket under the strict two-rule classification defined
  above — but the narrative claim that the BACKFILL tag exhaustively covers the pre-cutoff
  window is not supported by the data and is retracted here.

## Reconciling against the sealed 259-row snapshot (2026-08-07)

The sealed `normalized-inputs.json` (`phase2/normalized-inputs.json:277`, `:285`, `:287` —
verified present at those exact lines in this rework pass) recorded, from the 2026-08-07
pull:
> "259 closed paper trades: mean +0.517%/trade, median +1.000% — but the D86 synthetic
> signature (pnl_pct == +1.00% AND days_held == 1) sits on 104/259 rows, and 48 rows are
> BACKFILL-simulated; no aggregate win rate stated" (`phase2/normalized-inputs.json:277`)

> integrity_flags: "D86 synthetic signature on 104/259 rows", "48 BACKFILL-simulated rows",
> "rows before ~2026-04-26 backfilled/synthetic" (`phase2/normalized-inputs.json:285`)

Comparing the two pulls:

| Pull date | Total | BACKFILL | D86-signature | Clean |
|---|---|---|---|---|
| 2026-08-07 (sealed) | 259 | 48 | 104 | 107 |
| 2026-08-19 (this pull, live) | 291 | 48 | 134 | 109 |
| Δ (12 days) | +32 | +0 | +30 | +2 |

Arithmetic check: 48+104+107=259 ✓; 48+134+109=291 ✓; 0+30+2=32 ✓.

**Reconciliation:**
- **How many rows were added since 2026-08-07:** 32 (259 → 291).
- **Are the new rows real fills or more synthetic/backfill:** Not BACKFILL — the BACKFILL
  count is unchanged at 48 across both pulls (those rows are historical, fixed at
  pre-2026-04-26 dates, so a later pull cannot add to them; confirmed no BACKFILL row's
  `entry_date` is after 2026-04-15 in this pull). The new rows are the strategy's live
  paper-simulated trading continuing to close positions day by day. However, of those 32 new
  rows, **30 carry the D86 synthetic signature** (`pnl_pct==+1.00%`, `days_held==1`,
  `exit_reason=STOP_TRAIL`, `be_triggered=True`) — the same contract-invalid pattern
  DEFECT-REGISTRY D86 describes as "NOT LATENT — ACTIVELY EXPRESSING" (DEFECT-REGISTRY.md:119).
  Spot-checked directly against the tail of the live file: the three most recent closes
  (`NIQ,2026-08-18,2026-08-19,...,1.0,STOP_TRAIL,1,...`; `CLMT,2026-08-18,2026-08-19,...,1.0,
  STOP_TRAIL,1,...`; `KGS,2026-08-18,2026-08-19,...,1.0,STOP_TRAIL,1,...`) all carry the exact
  D86 signature, confirming the pattern is still firing as of the day before this pull. Only
  2 of the 32 new rows are clean (paper-simulated, non-D86, non-BACKFILL).
- **Does the D86-signature fraction change:** Yes, it worsens. D86+BACKFILL combined =
  152/259 = 58.7% at the 2026-08-07 pull vs. 182/291 = 62.5% at this pull (48 BACKFILL + 134
  D86 = 182; 182/291 = 0.6254...). D86-signature alone rose from 104/259 = 40.2% to 134/291 =
  46.0%. This is corroborating, not contradicting, evidence for D86's "actively expressing"
  characterization — the defect has kept producing new contract-invalid closes since the
  review card was drafted, so the "well over half the ledger is unusable" framing shown to
  Dick (see wi8.1) is, if anything, now understating the current proportion.

## Sources
- Live file: `/trisight-volume/Snapshots/swing_trade_log.csv` (Railway production volume,
  service `trisight-trader`), pulled 2026-08-19 via `railway ssh` (this rework pass), exit
  code 0, 292 lines total (1 header + 291 data rows)
- `assay/phase2/normalized-inputs.json:277,285,287` (sealed 2026-08-07 snapshot figures)
- `assay/reports/review/evidence/DEFECT-REGISTRY.md:119` (D86 entry, full rule + status)
- `assay/reports/review/evidence/wi8.2a-ruling3.md` (RULING 3 verbatim + scope — unchanged by
  this rework; RULING 3 reset the **committed** repo file only, per its own text at
  `DECISIONS-INBOX.md:2436`: "Live volume ledgers and the family's validated research record
  are untouched and unaffected." This rework's live-volume pull is consistent with that: the
  live ledger kept growing normally, untouched by the RULING 3 committed-file reset.)
