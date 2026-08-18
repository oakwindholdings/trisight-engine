# TriSight 500 2.0 — Inflation Report

## The claim

- Status: FOUND
- Stated: CAGR 30.62% (restated 2026-08-13; originally sealed 29.96%) | basket win 70.30% | MaxDD -12.89% over 101 rotation cycles (rotation backtest) over 2020-03-03..2026-02-20
- Normalized: 30.6%/yr — method: stated CAGR fraction (post-restatement value; restatement disclosed)
- Sources: `trisight_500 lockdown (registry trisight_500_late_failed_recovery_shadow)`, `orchestration/reports/TOTAL-QUALITY-MATRIX.md (TS500 ~6yr freeze)`
- Verbatim: "CAGR 30.618321% (restated 2026-08-13; originally sealed as 29.955846%)"
- Record: `sha256:841f04b21cba0c00fdf4134af29632814f8747b56c4d6c4e478250632cdd8e20`

## The realized record

- Status: PARTIAL
- Stated: No aggregate realized figure; D101 measured a $2,524 open-P&L overstatement across 500 rows from restamped entry prices ($4,478.64 ledger basis vs $1,954.63 restamped basis) over 2026-07-13..2026-08-13
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `auto_ts500_lfr_shadow_paper_fill_log.csv (Railway volume)`, `D101 finding 2026-08-09`
- Verbatim: "Across all 500 rows: $4,478.64 (ledger basis) vs $1,954.63 (restamped basis)"
- Record: `sha256:44655aa6539573f0f9d5c55aa51e06b70550e4e6885e2e9b5e73e84491e237b1`

## The verdict

**Return inflation: REFUSED (invalid_params)** — TriSight 500 2.0: side not normalizable to annualized return (claim: stated CAGR fraction (post-restatement value; restatement disclosed); realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: not computed** — NOT COMPUTED: a side lacks a stated win rate.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:59cec51d9275ce7ae6faccc2bb54092b277c3fd9694b8d939ecc6bc2f7f3bd87`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
