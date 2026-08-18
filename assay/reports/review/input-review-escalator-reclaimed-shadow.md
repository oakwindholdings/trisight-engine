# Escalator Reclaimed Shadow — Input Review Guide
*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

## What this is

We measured what this strategy claims against what it actually did in the paper ledger. Before you treat any of these results as final, we want you to check every input we used to get there. If you correct anything below, the study re-runs automatically — your original number stays visible next to the correction, nothing gets overwritten.

## Step 1 — The claim document we used

- Source files: `escalator_reclaimed_shadow lockdown/golden replay (profile escalator_reclaimed_bidirectional_v1_20260510)` and `trisight-trader/Audits/2026-07-12_escalator_reclaimed_shadow_b5ffd4f/PROOF.md`
- Seal reference: `5d483f7c`
- Verbatim excerpt: "349 trades, total return 215.969323%, CAGR 16079.179 ... win rate 63.037249%"
- Generation/seal date: not separately stated in the slice; the only date present is embedded in the audit path itself — `2026-07-12`

**Your review:** Is this the right / best statement of what Escalator Reclaimed Shadow claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

- Trades: **349** (raw)
- Total return: **215.97%** (raw), verbatim excerpt gives **215.969323%**
- CAGR: **16,079.18%** (raw), verbatim excerpt gives **16079.179**. Normalized to an annualized return of **160.7917921783** (i.e. ~16,079.2%/yr) by taking the stated CAGR fraction at face value — the claim explicitly declines to anchor it to a calendar window, so this normalization carries no window backing it.
- MaxDD: **1.10%** (raw only — no normalization method given for this metric in the slice)
- Win rate: **63.04%** (raw), verbatim excerpt gives **63.037249%**, normalized as a plain fraction to **0.63037249**, based on **349** trades
- Market dates: **57** (raw only, no calendar window attached — see Step 3)

**Your review:** one confirm/correct line per metric above.
- [ ] Trades confirmed  - [ ] Correction: ______
- [ ] Total return / CAGR confirmed  - [ ] Correction: ______
- [ ] MaxDD confirmed  - [ ] Correction: ______
- [ ] Win rate confirmed  - [ ] Correction: ______

## Step 3 — The time window of the claim

`window_from` and `window_to` are both **not stated** in the slice. The claim's own source document says, verbatim, "No calendar-day span is claimed." The claim reports 57 market dates but never says which calendar dates those are.

This refusal is not free — it's the reason the return-ratio comparison in Step 6 could not be computed at all.

**Your review:** if you know the calendar window the backtest covered, state it — this single input may unlock the return comparison.
- [ ] Window confirmed as shown (not stated)  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- Filenames: `auto_escalator_reclaimed_trade_log.csv (production)`, plus a `dashboard since-inception roll-up, screen-verified`
- How pulled: dashboard roll-up, screen-verified against the production ledger (no separate pull date stated in the slice)
- Row/trade counts: **150 closed trades (68 wins / 82 losses)**
- Window: **2026-05-15** through **2026-08-04**

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

- Verbatim: "150 closed trades (68 wins / 82 losses) · Realized P&L +$370.59 (+0.05%)"
- Win rate: **45.333%** (0.45333) over **150** trades
- Annualized return: **0.226%/yr** (0.00226) — normalized as "+0.05% over 81 calendar days annualized as (1.0005)^(365/81)-1 ≈ 0.226%/yr — short-sample noise disclosed"

Every integrity flag in the slice, plain-English:

1. **"Claim declines to state a calendar window"** — we don't know the historical period the 57-market-date backtest actually covers. This is what blocked the return-ratio in Step 6 — not a bias in a direction, a hard refusal.
2. **"Audit seal verifies code/spec drift only, not backtest numbers (PROOF.md)"** — the seal on the claim confirms the code and profile spec match what was sealed. It does NOT confirm the 349-trade, 215.97%-return numbers themselves were checked or reproduced. Direction unknown.
3. **"Shadow/simulated fills, not broker-routed"** — the 150 realized trades were filled in a paper/shadow system, not through a real broker. Direction unknown — simulated fills could read better or worse than real fills would have.

**Your review:** per flag — is our reading right? Do you have context that changes it?
- [ ] Flag 1 confirmed  - [ ] Context: ______
- [ ] Flag 2 confirmed  - [ ] Context: ______
- [ ] Flag 3 confirmed  - [ ] Context: ______

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params)** — "Escalator Reclaimed Shadow: side window incomplete. A refusal is a finding: this claim cannot be honestly ratioed against reality." Driven by Step 3: the claim side has no calendar window at all.
- **Win-rate inflation: 1.39×** — claimed 63.0% vs realized 45.3% over 150 closed trades. Driven by Step 2's claim win rate (63.037249% / 349 trades) against Step 5's realized win rate (45.333% / 150 trades).
- Report's own caveat, verbatim: "Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements."
- Method used: annualized-return ratio (sides >=60d) + win-rate ratio (realized n>=30); normalization per declared per-side methods.

**Your review:** dispute the input, not the arithmetic — which step above would you change?
- [ ] No dispute  - [ ] Dispute step: ______  Reason: ______

## Step 7 — What your feedback can unlock

- If you supply the calendar window the backtest actually covers (Step 3), the return-inflation ratio — currently refused for an incomplete side window — becomes computable.
- If a better or newer claim document exists (Step 1), the claim-side numbers in Step 2 get corrected and the study re-runs.
- If a cleaner or more complete realized ledger exists (Step 4), the realized-side numbers in Step 5 get corrected and the study re-runs.
- If you can point to something that verifies the backtest numbers themselves (not just code/spec drift — Step 5, flag 2), that flag's "direction unknown" status can be resolved.
- If broker-routed fills exist to replace the shadow/simulated fills (Step 5, flag 3), that flag can be closed out.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`escalator_reclaimed_shadow lockdown/golden replay (profile escalator_reclaimed_bidirectional_v1_20260510)`**
  → Sealed lockdown artifact recorded in the estate audit trail — the seal line is in the Decisions snapshot: https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md
- **`trisight-trader/Audits/2026-07-12_escalator_reclaimed_shadow_b5ffd4f/PROOF.md`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/Audits/2026-07-12_escalator_reclaimed_shadow_b5ffd4f/PROOF.md>
- **`auto_escalator_reclaimed_trade_log.csv (production)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/auto_escalator_reclaimed_trade_log_SNAPSHOT_20260818.csv>
  (2026-08-18 snapshot of this append-only ledger, hash-verified against the server; the study used the 2026-08-07 pull — same ledger, fewer rows)
- **`dashboard since-inception roll-up, screen-verified`**
  → A screen-verified dashboard reading (no file). The number was read off the live dashboard on the stated date.

## How corrections work

Name a file path or a correction against any item above and send it back. The record set is append-only — nothing gets deleted or silently changed. A correction supersedes the prior value but the original stays visible, and hashes keep every version auditable. Record hashes for this study:
- Claim record: `sha256:4a762ba870b2a114e2978bd91294bef150094d9c6b032038456492c7b75f2035`
- Realized record: `sha256:697d8baec553c34148d7167096c8419d37eb5d651c577d7b992a85a126dbc685`
- Verdict record: `sha256:ef8d16cec7efb139de62c244c312b31439fb6c8f93cad8be2ee97326b4aba5bb`
