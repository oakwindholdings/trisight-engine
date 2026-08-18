# Top 40 2.0 — Inflation Report

## The claim

- Status: FOUND
- Stated: 213.07% CAGR (FROZEN from all external use by owner ruling D58; backing 118MB score cache absent from estate AND owner's machine, no SHA256 ever recorded; closest honest analog 88.44% CAGR; full point-in-time rebuild bound: -7.52% CAGR) (CAGR, backtest, baseline_aggressive_8_linear) over 2023-04-10..2026-04-17
- Normalized: 213.1%/yr — method: stated CAGR used directly as annual fraction; FROZEN status and irreproducibility carried as integrity flags
- Sources: `trisight-trader/docs_output/TOP_40_2_0_LOCKDOWN_SPEC.md:14-22,187,338-354`, `orchestration/reports/DEFECT-REGISTRY.md:78 (D58)`, `orchestration/reports/DECISIONS-INBOX.md:332 (seal 50f02064)`
- Verbatim: "TOP40_2_VALIDATION_CAGR_PCT = 213.06656830114653 ... FROZEN FROM ALL EXTERNAL USE, effective 2026-07-31"
- Record: `sha256:2213e5801fedc77df198ad901fd7c5f0ca54285e2bc2177d547117bdf7c53547`

## The realized record

- Status: PARTIAL
- Stated: No authoritative realized figure: displayed +22%/5d corrected to +8.03% (D77 calc artifact); +13.10%/wk sat on 144 corrupted basis-reset rows; ledger carries positions corrupted to 4.24e69 shares (CARD-99), 32/72 still corrupted as of 2026-08-10 over 2026-05-22..2026-08-10
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `orchestration/reports/DEFECT-REGISTRY.md:109 (D77), :519-521, :697`, `orchestration/reports/CARD-99-TRADELOG-FORENSICS.md:104`, `trisight-trader/docs_output/gate_conjunction_blast_radius_20260808/prod_auto_top40_2_0_trade_log.csv`
- Verbatim: "the owner's 'appears fine' number was wrong: 36/55 positions ... crediting $118,619 of pre-entry movement; entry-clamped truth = +8.03%"
- Record: `sha256:565ef2f32f12788b5bac2c845e39f30a012000192588c9f876d72d33967e001a`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Top 40 2.0: side not normalizable to annualized return (claim: stated CAGR used directly as annual fraction; FROZEN status and irreproducibility carried as integrity flags; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: not computed** — NOT COMPUTED: a side lacks a stated win rate.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:0aaafb85fa2a0a93853f4ba5bd934faa828af2d450032603082d91e02934de47`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
