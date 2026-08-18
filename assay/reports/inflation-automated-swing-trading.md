# Automated Swing Trading — Inflation Report

## The claim

- Status: FOUND
- Stated: N=2,107, WR 92.22% | CAGR 1x +420.85% | 2x +2,304.32% frictionless / +1,636.16% realistic-10bps (5-year backtest (shares ledger lineage with Manual Swing)) over ?..?
- Normalized: 420.8%/yr — method: 1x CAGR as stated; WINDOW derived only from a ledger filename (2021-2026, no exact dates) — return dimension will refuse on window
- Sources: `backtest_results/manual_swing_phase6* ledger artifacts`, `seal 5a60b8b9 SEALED 2026-07-17`
- Verbatim: "N=2,107 trades, WR=92.22% | CAGR 1x=+420.85%"
- Record: `sha256:c6e0a423d8a33a9774a6668e146d6850d8705a645ce09b9a9789e984b5c0c07c`

## The realized record

- Status: FOUND
- Stated: Since-inception realized WR 56.7% (59W/45L, n=104) — of which 37 were later ruled fabricated phantom stop-exits and VOIDED by owner 2026-08-05; since strategy-tagging: raw 42.9%, phantom-excluded 76.9%; real-only P&L weekly -0.44%, monthly/YTD -0.88% over 2026-04-26..2026-08-05
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `Snapshots/auto_swing_trade_log.csv (116 rows)`, `owner ruling 2026-08-05 (phantom exits voided)`
- Verbatim: "realized WR 56.7% (59W/45L of 104 ... 37 were later ruled fabricated 'phantom' stop-exits and VOIDED)"
- Record: `sha256:02b83282aaf19149a8f9bbd0b40e1f46e59ba8ed06bfbd0f36ea814d2f887bc0`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Automated Swing Trading: side not normalizable to annualized return (claim: 1x CAGR as stated; WINDOW derived only from a ledger filename (2021-2026, no exact dates) — return dimension will refuse on window; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: 1.63×** — claimed 92.2% vs realized 56.7% over 104 closed trades.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:e089539bd8f286589c3bfac68d1fa48971aecaafb636eb69948ce3b65b170262`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
