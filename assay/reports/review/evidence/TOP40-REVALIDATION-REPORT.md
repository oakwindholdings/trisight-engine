# Top 40 2.0 — Point-in-Time Re-Validation: inputs, scope, and actual results

*You said the re-validation was not done. It was — here it is, with the full input scope
declared and the actual result reported, good/bad/or indifferent. The −7.52% rebuild and the
+88.44% analog are reproducible from artifacts committed in the trisight-trader repo; the
−32.42% survivorship correction was verified independently by two adversarial reviews, with its
delisted-universe input committed in the trader repo and the run itself recorded in this study's
evidence tree. Nothing below is asserted without a source.*

## What was frozen (the number under review)
The sealed headline `TOP40_2_VALIDATION_CAGR_PCT = 213.06656830114653`. It rests on a
2026-05-15 score-matrix cache that no longer exists anywhere and whose SHA256 was never
recorded — so the *original* run cannot be reproduced. The re-validation below does not try
to resurrect it; it re-computes the strategy honestly from scratch.

## Input scope — declared (verbatim from the run script)
Script: `scripts/top40_sealed_cagr_pit_universe_rebuild_20260731.py`. Profile:
`baseline_aggressive_8_linear`.
- **Window:** 2023-04-10 to 2026-04-17 (the fit window).
- **Ranking:** production Top-150-XGBoost-overlay `rank_score`, unmodified (`apply_rank_score()`).
- **Sector cap:** 8 per sector.
- **Point-in-time eligibility (the correction):** at *each* rotation, a candidate must be
  active-listed AND have market cap ≥ $250M **as of that rotation's own start date**
  (`gateway.polygon_data.get_bulk_shares_outstanding_asof()`), instead of the today-resolved
  (2026-07-23) pool used unmodified everywhere else in the Top 40 2.0 evidence chain (the sealed
  original's own 2026-05-15 resolution is unrecoverable). A candidate that fails PIT is skipped and the
  next-ranked eligible name fills the slot — exactly as live runtime behaves.
- **Disclosed, material limitation (in the run's own report):** this rebuild can only REMOVE
  or PROMOTE tickers that are still in the 2026-07-23 pool; it cannot admit a name that
  delisted or dropped out entirely (its scores were never computed). So its result is an
  **optimistic bound**. The delisted-augmented run below removes that limitation.

## Actual results — reported, not characterized

**(1) Point-in-time rebuild — the optimistic bound (2026-07-31)**
Source: `docs_output/top40_sealed_cagr_hindsight_decomposition_20260731/fit_window_baseline_aggressive_8_linear_pit_rebuild_summary.json`.
- **CAGR: −7.52%** (`cagr_pct = -7.522707844510002`)
- Max drawdown: **61.58%** (peak equity $158,297 on 2024-05-22 down to trough $60,813 on 2026-03-30)
- 152 rotations · 6,080 trades · trade win 47.12% · rotation win 49.34%
- Worst cycle −13.28% · best cycle +28.76%

**(2) Delisted-augmented correction — the firm bound (2026-08-10, VERIFIED both adversarial lenses)**
Restoring the 2,399 delisted-liquid names the PIT rebuild couldn't admit:
- **CAGR: −32.42% · Max DD: 76.68%** (TOTAL-QUALITY-MATRIX E4-to-E11 addendum, wf `wvu77ebio`).

**(3) For reference — the closest honest analog** (same sealed params, universe re-resolved
2026-07-23, reproduced to 1e-6 against the committed eval JSON): **+88.44% CAGR** — still
carrying survivorship bias, hence higher than the honest bounds.

## The bottom line
Sealed: **+213.07%** (frozen, unrecoverable). Honestly re-computed, the strategy runs between
**−7.52%** (optimistic) and **−32.42%** (survivorship-corrected, verified). The re-validation
was done, it is reproducible from the committed script + summary + trade-level CSV + rebuild
log + exclusions CSV, and the answer is: negative, not +213%.
