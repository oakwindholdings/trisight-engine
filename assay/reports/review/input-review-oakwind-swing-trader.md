# Oakwind Swing Trader — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is

We measured what Oakwind Swing Trader's backtest claims against what it actually did in
production paper trading. Before you treat any of these results as final, we want you to
check every input we used to get there. If you correct anything below, the study re-runs
automatically — your correction supersedes, and the original stays visible.

## Step 1 — The claim document we used

- File: `Oakwind Swing lockdown/backtest artifact (commit b5ffd4f lineage, generated 2026-05-18T14:33:54)`
- Seal reference: `915248a6`, signed Dick O'Leary 2026-07-12T12:55:29Z (`Audits/ seal 915248a6 signed Dick O'Leary 2026-07-12T12:55:29Z`)
- Verbatim excerpt: "Win% 67.65%, Net executed win% 62.85%, CAGR 1,851.41%, Max DD -1.65%"

**Your review:** Is this the right / best statement of what Oakwind Swing Trader claims? If a
better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

- Win rate: **67.65%** raw, based on 15,028 trades — this is the headline win rate we used.
- Net executed win rate: **62.85%** raw — win rate after accounting for which signals actually got filled.
- CAGR: **1,851.41%** raw, at 5bps friction — normalized to **1851.4%/yr** per the method note:
  "stated CAGR fraction; window NOT stated by the source (artifact generated 2026-05-18, no
  historical span declared) — return dimension will refuse on window."
- Max drawdown: **-1.65%** raw.
- Trade counts: **15,028 trades / 9,408 executed**.
- 15bps friction variant (also stated): win **55.12%**, CAGR **430.61%**.

**Your review:** one confirm/correct line per metric above — flag any number that looks wrong
to you.

## Step 3 — The time window of the claim

The claim artifact does **not state** a calendar window (`window_from` / `window_to`: not
stated). The artifact was generated 2026-05-18T14:33:54, but that is a generation date, not
a backtest span. Because no window is stated, the return-inflation comparison **refuses to
run** — there is nothing to annualize against.

**Your review:** if you know the calendar window the backtest covered, state it — this single
input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- File: `supply_demand_hourly_paper_fills.csv`
- How pulled: railway ssh, read-only pull
- Pull date: 2026-08-07
- Row/trade count: 254 closed round-trip trades
- Window: **2026-05-15** to **2026-08-06**

**Your review:** is this the right ledger? Does a cleaner or more complete record of real
fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Verbatim: "254 closed round-trip trades: WR 58.66% (95% CI 52.52%-64.54%) ... expectancy
+0.466%/trade." Additional stated figures: payoff **1.680**; a stated aggregate dollar figure
exists only for the sub-window 2026-07-27..08-06: **+$5,865.65**. No integrity flags are
recorded on the realized side.

Two integrity flags are recorded on the **claim** side:

1. **"no historical window declared by the claim artifact"** — plain English: the backtest
   doesn't say what dates it covers. Direction: unknown — could be a favorable stretch, an
   unfavorable one, or full history; without the window we can't tell, and it's the same gap
   that blocks Step 3.
2. **"fleet-wide frozen survivor-biased universe; dip-buy amplification (w4nfwu675)"** — plain
   English: the backtest ran on a fixed set of symbols and includes amplified dip-buy signals.
   Survivorship bias of this kind generally makes historical performance look better than it
   would have been in real time, so treat this as a likely upward bias on the claimed numbers
   — but the slice does not quantify by how much.

**Your review:** per flag — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params).** "Side not normalizable to annualized return
  (claim: stated CAGR fraction; window NOT stated by the source ... realized: none). A
  refusal is a finding: this claim cannot be honestly ratioed against reality." Driven by
  Step 3 — the claim has no stated window, so there's nothing to annualize.
- **Win-rate inflation: 1.15×** — claimed 67.7% vs realized 58.7% over 254 closed trades.
  Driven by Step 2's claimed win rate (67.65%) against Step 5's realized win rate (58.66%).
- Report caveat: "Claim and realized windows cover DIFFERENT market regimes by nature
  (backtest history vs 2026 paper) ... Realized samples are short — treat ratios as
  lower-noise-bound estimates, not precision measurements."

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock

- If you supply the calendar window the backtest covered (Step 3), the return-inflation
  ratio becomes computable instead of refused.
- If you supply a better or newer claim document (Step 1), the claim-side numbers in Step 2
  could be corrected or replaced.
- If you have context on the survivor-biased universe / dip-buy amplification flag (Step 5,
  flag 2), that reading could be corrected.
- If you know of a cleaner or more complete realized ledger than the paper-fills CSV
  (Step 4), the realized side could be strengthened.

## How corrections work

Name a file path or a correction for any item above and send it back — the record set is
append-only, so your correction supersedes the current reading while the original stays
visible for audit. Every version is hashed. Record hashes for this review: claim
`sha256:4892e5c5c65abc900adf43e086cad3ac79e59e315356610234505028fe6da3a3`, realized
`sha256:cfb710325640a9c2e684947027b06fcd4d6874bdba23dc320370deddbf6161bb`, verdict
`sha256:10df9b911752042ab6c567890cfa6111d07c97d05c51da55830370e43f5c4ae2`.
