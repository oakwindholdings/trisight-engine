# Input Review Guides — Dick's Feedback Round

*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

**The live review UI is at `https://trisight-engine-production.up.railway.app/review`**
(access-code gated; feedback persists per input element to Postgres, append-only).
**Dick starts at [START-HERE-DICK.md](START-HERE-DICK.md)** ([printable PDF](pdf/START-HERE-DICK.pdf)) — a zero-setup walkthrough with three review
paths (paper, browser, AI-guided). Each strategy below also has a comprehensive printable
PDF packet (guide + findings appendix) in [pdf/](pdf/), and every guide ends with a
"Where the files live" section giving full clickable URLs for every cited source.
Governance reports cited by the guides are snapshotted with hashes in
[evidence/](evidence/PROVENANCE.md).

One guide per sealed strategy. Each walks the strategy owner step by step through every
input ASSAY used — the claim document, the numbers read from it, the assumed time window,
the realized ledger, the integrity flags, and what was computed vs. refused — with a
confirm/correct checkpoint at every step. Corrections are append-only supersessions: the
study re-runs on corrected inputs and the original reading stays visible under its hash.

## The guides

| Strategy | Guide | PDF packet | Win-rate finding | Return finding |
|---|---|---|---|---|
| High 5 | [input-review-high-5.md](input-review-high-5.md) | [pdf/high-5.pdf](pdf/high-5.pdf) | 2.05× inflation | refused |
| Automated Swing Trading | [input-review-automated-swing-trading.md](input-review-automated-swing-trading.md) | [pdf/automated-swing-trading.pdf](pdf/automated-swing-trading.pdf) | 1.63× inflation* | refused |
| Escalator Reclaimed Shadow | [input-review-escalator-reclaimed-shadow.md](input-review-escalator-reclaimed-shadow.md) | [pdf/escalator-reclaimed-shadow.pdf](pdf/escalator-reclaimed-shadow.pdf) | 1.39× inflation | refused |
| Oakwind Swing Trader | [input-review-oakwind-swing-trader.md](input-review-oakwind-swing-trader.md) | [pdf/oakwind-swing-trader.pdf](pdf/oakwind-swing-trader.pdf) | 1.15× inflation | refused |
| Oakwind Investor Daily | [input-review-oakwind-investor-daily.md](input-review-oakwind-investor-daily.md) | [pdf/oakwind-investor-daily.pdf](pdf/oakwind-investor-daily.pdf) | not computable | refused |
| Top 40 2.0 | [input-review-top-40-2-0.md](input-review-top-40-2-0.md) | [pdf/top-40-2-0.pdf](pdf/top-40-2-0.pdf) | not computable | refused |
| TriSight 500 2.0 | [input-review-trisight-500-2-0.md](input-review-trisight-500-2-0.md) | [pdf/trisight-500-2-0.pdf](pdf/trisight-500-2-0.pdf) | not computable | refused |
| Escalator Reclaimed Long Shadow | [input-review-escalator-reclaimed-long-shadow.md](input-review-escalator-reclaimed-long-shadow.md) | [pdf/escalator-reclaimed-long-shadow.pdf](pdf/escalator-reclaimed-long-shadow.pdf) | not computable | refused |
| Earnings Trader (locked 93) | [input-review-earnings-trader-locked-93.md](input-review-earnings-trader-locked-93.md) | [pdf/earnings-trader-locked-93.pdf](pdf/earnings-trader-locked-93.pdf) | not computable | refused |
| Manual Swing Trading | [input-review-manual-swing-trading.md](input-review-manual-swing-trading.md) | [pdf/manual-swing-trading.pdf](pdf/manual-swing-trading.pdf) | not computable | refused |

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
