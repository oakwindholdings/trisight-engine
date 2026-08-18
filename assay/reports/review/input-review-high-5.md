# High 5 — Input Review Guide
*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

## What this is

We compared what High 5 claims against what it has actually done in real paper trading. Before you treat either number as final, we want you to check every input we pulled to build this comparison — the claim document, the realized ledger, the windows, and every flag on the data. If you correct anything below, the study re-runs on the correction, and the original stays visible in the record.

## Step 1 — The claim document we used

- Sources: `trisight-trader scripts/high5_direct_allocation_replay.py` committed replay runs (canonical 2026-07-16), and `orchestration/reports/ESTATE-STATUS.md` row 2 (seal `523c3369`)
- Canonical run date: 2026-07-16
- Seal reference: `523c3369`
- Verbatim excerpt: "Canonical (2026-07-16 run, cited as 'the sealed benchmark'): 5,321 trades, Win% 92.33%"

**Your review:** Is this the right / best statement of what High 5 claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

Full raw value we pulled: "Canonical sealed benchmark (2026-07-16 replay): 5,321 trades, Win% 92.33%, 2x-levered headline row (CAGR headline row present in replay table; leverage-dependent)"

- **Trade count:** 5,321 trades. This is the sample size behind the claimed win rate.
- **Win rate:** 92.33% — read directly from the sealed replay, no normalization applied.
- **Annualized return / CAGR:** not stated. The raw text notes a "CAGR headline row present in replay table" and calls it "2x-levered ... leverage-dependent," but no actual number and no normalization method were given to us. The inflation report records this side as "NOT NORMALIZABLE — method: n/a."

**Your review:** Confirm each line, or correct it — especially the missing CAGR figure, if you have it.
- [ ] Trade count / win rate confirmed  - [ ] Correction: ______
- [ ] CAGR figure available (state it): ______

## Step 3 — The time window of the claim

- Window: 2021-04-01 to 2026-04-30

**Your review:** if you know the calendar window the backtest covered, confirm it or correct it — this single input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- File: `Snapshots/high_5_paper_trade_log.csv`
- Source: Railway volume, read-only pull
- Pull date: 2026-08-07
- Rows: 279 total (157 BUY / 122 SELL); 122 closed round-trips were used for the win-rate calculation
- Window: 2026-06-17 to 2026-08-06

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Verbatim: "Win rate 45.0820% [Wald 95% CI 36.2525%-53.9114%] ... mean per trade -0.6380%"

- **Win rate:** 45.08% [95% CI 36.3%-53.9%], n = 122 closed round-trips
- **Avg win:** +8.46%
- **Avg loss:** -8.11%
- **Mean per trade:** -0.638%
- **Exit type:** all 122 exits were TIME_EXIT (no stops were used — the sealed contract for this strategy doesn't use stop-losses)

**Integrity flag on the claim side** — "fleet-wide frozen survivor-biased universe (`w4nfwu675`)": in plain terms, the backtest universe of symbols was frozen fleet-wide, which means the set of tradable symbols was fixed in advance rather than reconstructed as it would have looked in real time. Universes built this way typically only contain symbols that survived to the freeze date, which tends to bias backtested win rates upward relative to a universe that also included symbols that failed or delisted along the way. We have no further detail on this flag beyond its ID.

There are no integrity flags recorded against the realized ledger itself.

**Your review:** is our reading of the survivor-bias flag right? Do you have context on how the universe was actually constructed that changes it?

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params)** — "High 5: side not normalizable to annualized return (claim: none; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality." This was driven entirely by Step 2 and Step 5: neither side gave us a normalization method or an annualized-return figure, so no ratio could be built.
- **Win-rate inflation: 2.05×** — claimed 92.3% vs realized 45.1% over 122 closed trades. This was driven by the Step 2 win rate (92.33%, n=5,321) against the Step 5 win rate (45.08%, n=122).

Report's own caveat: "Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements."

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock

- If you can supply the actual CAGR figure behind the "CAGR headline row present in replay table" (Step 2) and how it should be normalized — including whether it's stated before or after the 2x leverage — the return-inflation refusal becomes a computable ratio on the claim side.
- If you can supply an annualized-return figure or normalization method for the realized paper ledger (Step 5), the return-inflation refusal becomes computable on that side too.
- If you have context on how the "fleet-wide frozen survivor-biased universe" (`w4nfwu675`, Step 5) was built — specifically, whether failed or delisted symbols were excluded — that could correct how the claimed 92.33% win rate should be read.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`trisight-trader scripts/high5_direct_allocation_replay.py committed replay runs (canonical 2026-07-16)`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/scripts/high5_direct_allocation_replay.py>
- **`orchestration/reports/ESTATE-STATUS.md row 2 (seal 523c3369)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/ESTATE-STATUS.md>
- **`Snapshots/high_5_paper_trade_log.csv (Railway volume, read-only pull 2026-08-07; 279 rows: 157 BUY/122 SELL)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/high_5_paper_trade_log_SNAPSHOT_20260818.csv>
  (2026-08-18 snapshot of this append-only ledger, hash-verified against the server; the study used the 2026-08-07 pull — same ledger, fewer rows)

## How corrections work

Name a file path or a correction for any item above. The record set is append-only: corrections supersede the current reading, but the original stays visible for audit — nothing is overwritten or deleted. Every version, claim, and verdict is hashed so the full history stays checkable.

- Claim record: `sha256:34bea16dc0066db3171e9af6d1d1be562f20acdd36993f1a919801c105670595`
- Realized record: `sha256:23138afe7ad8eaf839e9210260ab07a81729476c35f439ef4a9f5bb76a133094`
- Verdict record: `sha256:963698e0a2129ea08381636016e6db0a31fe829b12a1616f3dc1684a8de20a83`
