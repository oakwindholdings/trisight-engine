# Input Review Guides — Dick's Feedback Round

*Draft set for Bob's review. Nothing here goes to Dick until Bob signs off.*

One guide per sealed strategy. Each walks the strategy owner step by step through every
input ASSAY used — the claim document, the numbers read from it, the assumed time window,
the realized ledger, the integrity flags, and what was computed vs. refused — with a
confirm/correct checkpoint at every step. Corrections are append-only supersessions: the
study re-runs on corrected inputs and the original reading stays visible under its hash.

## The guides

| Strategy | Guide | Win-rate finding | Return finding |
|---|---|---|---|
| High 5 | [input-review-high-5.md](input-review-high-5.md) | 2.05× inflation | refused |
| Automated Swing Trading | [input-review-automated-swing-trading.md](input-review-automated-swing-trading.md) | 1.63× inflation* | refused |
| Escalator Reclaimed Shadow | [input-review-escalator-reclaimed-shadow.md](input-review-escalator-reclaimed-shadow.md) | 1.39× inflation | refused |
| Oakwind Swing Trader | [input-review-oakwind-swing-trader.md](input-review-oakwind-swing-trader.md) | 1.15× inflation | refused |
| Oakwind Investor Daily | [input-review-oakwind-investor-daily.md](input-review-oakwind-investor-daily.md) | not computable | refused |
| Top 40 2.0 | [input-review-top-40-2-0.md](input-review-top-40-2-0.md) | not computable | refused |
| TriSight 500 2.0 | [input-review-trisight-500-2-0.md](input-review-trisight-500-2-0.md) | not computable | refused |
| Escalator Reclaimed Long Shadow | [input-review-escalator-reclaimed-long-shadow.md](input-review-escalator-reclaimed-long-shadow.md) | not computable | refused |
| Earnings Trader (locked 93) | [input-review-earnings-trader-locked-93.md](input-review-earnings-trader-locked-93.md) | not computable | refused |
| Manual Swing Trading | [input-review-manual-swing-trading.md](input-review-manual-swing-trading.md) | not computable | refused |

*\*Automated Swing's realized side includes 37 voided phantom exits — see its guide, Step 5.*

Refusals are findings, not gaps: each guide's Step 7 lists exactly which input from the
owner would convert a refusal into a computable result.

## Provenance

- Facts sourced solely from `assay/phase2/normalized-inputs.json` (content-addressed,
  Epoch-verified) and the Campaign-2 inflation reports in `assay/reports/`.
- Every guide passed an independent adversarial audit lane that attempted to refute each
  number, date, filename, and quote against those sources. Two guides failed the first
  audit (one silently-omitted integrity flag; one misquote-by-ellipsis) and were repaired
  and re-verified before inclusion.
- Companion methodology: [../METHODOLOGY-FOR-DICK.md](../METHODOLOGY-FOR-DICK.md)
