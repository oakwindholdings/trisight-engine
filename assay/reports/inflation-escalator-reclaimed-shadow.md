# Escalator Reclaimed Shadow — Inflation Report

## The claim

- Status: FOUND
- Stated: 349 trades, total return 215.97%, CAGR 16,079.18%, MaxDD 1.10%, win rate 63.04% over 57 market dates — source doc states 'No calendar-day span is claimed' (golden replay backtest) over ?..?
- Normalized: 16079.2%/yr — method: stated CAGR fraction; the claim EXPLICITLY declines to anchor a calendar window — return dimension will refuse on window
- Sources: `escalator_reclaimed_shadow lockdown/golden replay (profile escalator_reclaimed_bidirectional_v1_20260510)`, `trisight-trader/Audits/2026-07-12_escalator_reclaimed_shadow_b5ffd4f/PROOF.md`
- Verbatim: "349 trades, total return 215.969323%, CAGR 16079.179 ... win rate 63.037249%"
- Record: `sha256:4a762ba870b2a114e2978bd91294bef150094d9c6b032038456492c7b75f2035`

## The realized record

- Status: FOUND
- Stated: 150 closed trades (68W/82L = 45.33%), realized P&L +$370.59 (+0.05%) since inception 2026-05-15 through Aug 4 2026 (dashboard roll-up screen-verified against production ledger) over 2026-05-15..2026-08-04
- Normalized: 0.2%/yr — method: +0.05% over 81 calendar days annualized as (1.0005)^(365/81)-1 ≈ 0.226%/yr — short-sample noise disclosed
- Sources: `auto_escalator_reclaimed_trade_log.csv (production)`, `dashboard since-inception roll-up, screen-verified`
- Verbatim: "150 closed trades (68 wins / 82 losses) · Realized P&L +$370.59 (+0.05%)"
- Record: `sha256:697d8baec553c34148d7167096c8419d37eb5d651c577d7b992a85a126dbc685`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Escalator Reclaimed Shadow: side window incomplete. A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: 1.39×** — claimed 63.0% vs realized 45.3% over 150 closed trades.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:ef8d16cec7efb139de62c244c312b31439fb6c8f93cad8be2ee97326b4aba5bb`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
