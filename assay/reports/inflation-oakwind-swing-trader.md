# Oakwind Swing Trader — Inflation Report

## The claim

- Status: FOUND
- Stated: Modeled control ledger, 5bps friction: Win% 67.65%, net executed win% 62.85%, CAGR 1,851.41%, MaxDD -1.65%, 15,028 trades / 9,408 executed (15bps variant: win 55.12%, CAGR 430.61%) (modeled control-ledger backtest) over ?..?
- Normalized: 1851.4%/yr — method: stated CAGR fraction; window NOT stated by the source (artifact generated 2026-05-18, no historical span declared) — return dimension will refuse on window
- Sources: `Oakwind Swing lockdown/backtest artifact (commit b5ffd4f lineage, generated 2026-05-18T14:33:54)`, `Audits/ seal 915248a6 signed Dick O'Leary 2026-07-12T12:55:29Z`
- Verbatim: "Win% 67.65%, Net executed win% 62.85%, CAGR 1,851.41%, Max DD -1.65%"
- Record: `sha256:4892e5c5c65abc900adf43e086cad3ac79e59e315356610234505028fe6da3a3`

## The realized record

- Status: FOUND
- Stated: 254 closed round-trips on production paper ledger: WR 58.66% [95% CI 52.5%-64.5%], payoff 1.680, expectancy +0.466%/trade; stated aggregate $ figure exists only for 2026-07-27..08-06 (+$5,865.65) over 2026-05-15..2026-08-06
- Normalized: NOT NORMALIZABLE — method: n/a
- Sources: `supply_demand_hourly_paper_fills.csv via railway ssh read-only pull 2026-08-07`
- Verbatim: "254 closed round-trip trades: WR 58.66% (95% CI 52.52%-64.54%) ... expectancy +0.466%/trade"
- Record: `sha256:cfb710325640a9c2e684947027b06fcd4d6874bdba23dc320370deddbf6161bb`

## The verdict

**Return inflation: REFUSED (invalid_params)** — Oakwind Swing Trader: side not normalizable to annualized return (claim: stated CAGR fraction; window NOT stated by the source (artifact generated 2026-05-18, no historical span declared) — return dimension will refuse on window; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality.

**Win-rate inflation: 1.15×** — claimed 67.7% vs realized 58.7% over 254 closed trades.

> Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements.

Method: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods
Record: `sha256:10df9b911752042ab6c567890cfa6111d07c97d05c51da55830370e43f5c4ae2`

## How to refute this page

Open the cited sources; if any excerpt is misquoted or a better claim/realized artifact exists, supply the file path — the record set is append-only and corrections supersede with the prior kept visible.
