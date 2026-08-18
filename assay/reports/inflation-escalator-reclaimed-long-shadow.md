# Escalator Reclaimed Long Shadow — Inflation Report

## The claim

- Status: FOUND
- Stated: Total return 101.61%, CAGR 2,119.69%, win rate 62.50%, 264 trades, MaxDD 0.75% over 57 market dates — no calendar span claimed (golden replay backtest) over ?..?
- Normalized: 2119.7%/yr — method: stated CAGR fraction; no calendar window declared — return dimension will refuse on window
- Sources: `escalator_reclaimed_long_shadow lockdown (audit AUD-20260712121726-59f366, git b5ffd4f)`
- Verbatim: "Total return 101.6130% | CAGR 2119.6892% | Win rate 62.50% | 264 trades"
- Record: `sha256:285c04811c9b77d668d0ceefe4b9e6ce1c3d0a2f4a87182df2c82255b02c1642`

## The realized record

- Status: PARTIAL
- Stated: 66 closed shadow round-trips; NO complete aggregate figure exists — only a 62-trade repaired subset (-$1,062.34) from the fake-exit-price defect repair; win rate not stated as an aggregate over 2026-06-16..2026-07-23
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `long-shadow production ledger + repair ledger (fake exit price defect)`
- Verbatim: "only a partial subset (62 of the 66 closed trades ...) sums to -$1,062.3354 in the repair ledger"
- Record: `sha256:74ccdec21948257cc2b8ccfde6d44e0120a25d030c3bc7bbc059fe8ddada9955`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Escalator Reclaimed Long Shadow: side not normalizable to annualized return (claim: stated CAGR fraction; no calendar window declared — return dimension will refuse on window; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: not computed** — NOT COMPUTED: a side lacks a stated win rate.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:ed16f819e904d202286c1009dbd3601cec63f3886ca5c2b0da05acac3565ae35`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
