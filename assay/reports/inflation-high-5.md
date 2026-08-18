# High 5 — Inflation Report

## The claim

- Status: FOUND
- Stated: Canonical sealed benchmark (2026-07-16 replay): 5,321 trades, Win% 92.33%, 2x-levered headline row (CAGR headline row present in replay table; leverage-dependent) (backtest replay, win rate + levered CAGR table) over 2021-04-01..2026-04-30
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `trisight-trader scripts/high5_direct_allocation_replay.py committed replay runs (canonical 2026-07-16)`, `orchestration/reports/ESTATE-STATUS.md row 2 (seal 523c3369)`
- Verbatim: "Canonical (2026-07-16 run, cited as 'the sealed benchmark'): 5,321 trades, Win% 92.33%"
- Record: `sha256:34bea16dc0066db3171e9af6d1d1be562f20acdd36993f1a919801c105670595`

## The realized record

- Status: FOUND
- Stated: 122 closed paper round-trips (pulled 2026-08-07): win rate 45.08% [95% CI 36.3%-53.9%], avg win +8.46%, avg loss -8.11%, mean per trade -0.638%; all 122 exits TIME_EXIT (no stops, per sealed contract) over 2026-06-17..2026-08-06
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `Snapshots/high_5_paper_trade_log.csv (Railway volume, read-only pull 2026-08-07; 279 rows: 157 BUY/122 SELL)`
- Verbatim: "Win rate 45.0820% [Wald 95% CI 36.2525%-53.9114%] ... mean per trade -0.6380%"
- Record: `sha256:23138afe7ad8eaf839e9210260ab07a81729476c35f439ef4a9f5bb76a133094`

## The verdict

**Return inflation: REFUSED (invalid_params)** — High 5: side not normalizable to annualized return (claim: none; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: 2.05×** — claimed 92.3% vs realized 45.1% over 122 closed trades.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:963698e0a2129ea08381636016e6db0a31fe829b12a1616f3dc1684a8de20a83`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
