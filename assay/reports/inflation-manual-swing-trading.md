# Manual Swing Trading — Inflation Report

## The claim

- Status: FOUND
- Stated: N=2,107 trades, WR 92.22%; CAGR +342.39% (realistic 10bps) / +420.85% (frictionless); MaxDD -14.54% (realistic) (5-year backtest, production leverage 1x) over 2021-05-18..2026-04-24
- Normalized: 342.4%/yr — method: realistic-10bps variant used (more favorable to the claim than ASSAY frictions would be)
- Sources: `manual_swing governed backtest artifact (5yr, 2021-05-18..2026-04-24)`, `seal 0d516728 SEALED 2026-07-17`
- Verbatim: "N=2,107 trades, WR=92.22%. Production leverage (1x): CAGR +342.39% (realistic 10bps)"
- Record: `sha256:ef492cb8aa16db2eb6e6015e51c37e0249506501c03f9fb188c7a409a4a5d5f5`

## The realized record

- Status: PARTIAL
- Stated: 259 closed paper trades: mean +0.517%/trade, median +1.000% — but the D86 synthetic signature (pnl_pct == +1.00% AND days_held == 1) sits on 104/259 rows, and 48 rows are BACKFILL-simulated; no aggregate win rate stated over 2025-12-29..2026-08-06
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `/trisight-volume/Snapshots/swing_trade_log.csv (Railway, pull 2026-08-07)`, `D86 (DEFECT-REGISTRY)`
- Verbatim: "The D86 signature (pnl_pct == +1.00 % AND days_held == 1) appears on 104 of 259 rows"
- Record: `sha256:b58325e7caad0ae2a88af9658ddee456d29be493b93ac9611249db66d0e12d60`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Manual Swing Trading: side not normalizable to annualized return (claim: realistic-10bps variant used (more favorable to the claim than ASSAY frictions would be); realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: not computed** — NOT COMPUTED: a side lacks a stated win rate.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:7fb5cc341fa2e290bd768a4a59c76114b889ba103c998714b4ad9d1d0e03de70`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
