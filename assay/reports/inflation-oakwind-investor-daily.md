# Oakwind Investor Daily — Inflation Report

## The claim

- Status: FOUND
- Stated: Locked benchmark: Win 50.51%, CAGR 8,728.89%, MaxDD -10.53% — shown to collapse to 673%-891% CAGR when the sibling Swing strategy's own capacity controls are applied to the identical event set (locked backtest benchmark, fixed_target_2r_control_no_liquidity_5bps) over ?..?
- Normalized: 8728.9%/yr — method: stated CAGR fraction; scenario window not declared in calendar terms — return dimension will refuse on window
- Sources: `Oakwind Investor lockdown doc (locked benchmark)`, `trisight-trader/docs_output/oakwind_capped_validation_20260809/00_VALIDATION.md`, `orchestration/reports/DEFECT-REGISTRY.md:59-61 (D39 phantom fills 54/104, D40 cap never enforced 54 vs 10, D41 stop-loss erasure)`
- Verbatim: "Win 50.51%, CAGR 8,728.89%, Max DD -10.53%"
- Record: `sha256:e4bbf85fb15d17c678c7b80a2c7885ead1a25b96f187fb02105f2ef77138a7f1`

## The realized record

- Status: PARTIAL
- Stated: Reconstructed backlog (2026-07-30, 50 closed): aggregate WR 68.0% BUT 29/50 entries were phantom (no market crossing on entry day, D39); REAL-entry-only subset: n=21, WR 38.1%, +$9,000.49 over 2026-06-17..2026-07-30
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `auto_oakwind_investor_paper_fills_log.csv (CARD-93)`, `orchestration/reports/DEFECT-REGISTRY.md:59 (D39)`
- Verbatim: "REAL-entry trades (market actually touched the recorded price) n=21, wins=8 (38.1%)"
- Record: `sha256:b02295e6cb33d58b11979b770214d106b9dae67ba16936dbd8610206e12c3c50`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Oakwind Investor Daily: side not normalizable to annualized return (claim: stated CAGR fraction; scenario window not declared in calendar terms — return dimension will refuse on window; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: not computed** — NOT COMPUTED: realized population 21 < declared 30 floor.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:037fb7e4bfb4c4b15be9f6b9e08d8c3c82f0f0a8da8edbbe2b98ccc6f3169c34`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
