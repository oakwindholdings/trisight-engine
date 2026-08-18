# TriSight 500 2.0 — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is

We measured what TriSight 500 2.0 claims against what actually happened in the paper fills. Before you treat any result here as final, we want you to check every input we used — the claim document, the ledger, the numbers we pulled from each. If you correct any of it, the study re-runs automatically, and your correction sits alongside the original so nothing gets silently overwritten.

## Step 1 — The claim document we used

- Seal reference: `1ac7a48a`
- Sources: `trisight_500 lockdown (registry trisight_500_late_failed_recovery_shadow)`, `orchestration/reports/TOTAL-QUALITY-MATRIX.md (TS500 ~6yr freeze)`
- Verbatim excerpt: "CAGR 30.618321% (restated 2026-08-13; originally sealed as 29.955846%)"
- Restated: 2026-08-13. Original seal date: not stated.

**Your review:** Is this the right / best statement of what TriSight 500 2.0 claims? If a better or newer claim document exists, name the file path.

- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

- **CAGR:** raw = "CAGR 30.62% (restated 2026-08-13; originally sealed 29.96%)". We normalized this to 30.618321%/yr using the post-restatement value, method: "stated CAGR fraction (post-restatement value; restatement disclosed)" — in plain words, we used the corrected number, not the original number.
- **Basket win rate:** raw = "basket win 70.30% ... over 101 rotation cycles". We read this as 70.29703% won, out of 101 rotation cycles (trades).
- **MaxDD (max drawdown):** raw = "MaxDD -12.89% over 101 rotation cycles". Not separately normalized in this record — we carried it as stated, we didn't convert it to any other figure.

**Your review:** one confirm/correct line per metric above.

- [ ] CAGR confirmed  - [ ] Correction: ______
- [ ] Basket win rate confirmed  - [ ] Correction: ______
- [ ] MaxDD confirmed  - [ ] Correction: ______

## Step 3 — The time window of the claim

The claim states a window: **2020-03-03 to 2026-02-20**.

**Your review:** if you know this is not the actual calendar window the backtest covered, state the actual window — this single input may unlock the return comparison in Step 6.

- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- File: `auto_ts500_lfr_shadow_paper_fill_log.csv (Railway volume)`
- Also cited: `D101 finding 2026-08-09`
- Row count: 500 rows
- Window: **2026-07-13 to 2026-08-13**
- Pull date: not stated.

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.

- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Raw: "No aggregate realized figure; D101 measured a $2,524 open-P&L overstatement across 500 rows from restamped entry prices ($4,478.64 ledger basis vs $1,954.63 restamped basis)."

Verbatim excerpt: "Across all 500 rows: $4,478.64 (ledger basis) vs $1,954.63 (restamped basis)."

There is no realized annualized return and no realized win rate in this record — both are not stated.

Every integrity flag on this strategy, in plain English:

1. **"restated after sealing (29.96%→30.62%)"** — the claimed CAGR was changed after it was first sealed, from 29.96% up to 30.62%. This biases the claim side upward relative to what was originally locked in.
2. **"~6yr frozen universe cache — most severe survivorship case per w4nfwu675"** — the backtest ran against a stock universe that was frozen for roughly six years rather than updated as it went. This is flagged as the worst case of survivorship bias found. Direction: biases the claim's backtest results upward (frozen universes tend to exclude names that failed or delisted).
3. **"D101: entry-price restamping overstates open P&L 2.3x on measured snapshot"** — the realized ledger's entry prices were restamped (rewritten after the fact), and on the measured snapshot this made open profit-and-loss look 2.3x bigger than it should. Direction: biases the realized side upward.

**Your review:** per flag above — is our reading right? Do you have context that changes it?

- [ ] Flag 1 (restatement) — confirmed  - [ ] Context: ______
- [ ] Flag 2 (frozen universe)  — confirmed  - [ ] Context: ______
- [ ] Flag 3 (entry-price restamping) — confirmed  - [ ] Context: ______

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params).** Reason stated: "side not normalizable to annualized return (claim: stated CAGR fraction (post-restatement value; restatement disclosed); realized: none)." Which input drove it: Step 5 — the realized side has no annualized return to compare the claim's CAGR against.
- **Win-rate inflation: not computed.** Reason stated: "NOT COMPUTED: a side lacks a stated win rate." Which input drove it: Step 5 — the realized side has no stated win rate to compare the claim's 70.30% against.
- Also noted in the report: the claim window and the realized window cover different market periods by nature (a multi-year backtest vs. a one-month 2026 paper run), and the realized sample is short — any future ratio should be read as a rough estimate, not a precise measurement.

**Your review:** dispute the input, not the arithmetic — which step above would you change?

- [ ] Nothing to change  - [ ] I'd change: ______

## Step 7 — What your feedback can unlock

- If you supply a realized annualized return (or enough realized trade data for us to compute one), the return-inflation ratio in Step 6 becomes computable.
- If you supply a realized win rate (or enough realized trade outcomes for us to compute one), the win-rate ratio in Step 6 becomes computable.
- If you confirm which CAGR figure is correct to use going forward — the original 29.96% or the restated 30.62% — that resolves integrity flag 1.
- If you can explain the ~6yr frozen universe cache (intentional methodology choice vs. error), that changes how integrity flag 2 should be weighted.
- If you can confirm the correct entry-price basis (ledger vs. restamped) for the 500-row shadow log, that resolves integrity flag 3.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`trisight_500 lockdown (registry trisight_500_late_failed_recovery_shadow)`**
  → Sealed lockdown artifact recorded in the estate audit trail — the seal line is in the Decisions snapshot: https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md
- **`orchestration/reports/TOTAL-QUALITY-MATRIX.md (TS500 ~6yr freeze)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/TOTAL-QUALITY-MATRIX.md>
- **`auto_ts500_lfr_shadow_paper_fill_log.csv (Railway volume)`**
  → Lives only on the Railway production volume (not web-viewable). Ask Bob for a copy — pulls are read-only and dated.
- **`D101 finding 2026-08-09`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DEFECT-REGISTRY.md>

## How corrections work

Name a file path or state a correction for any item above and we'll re-run the study on it. The record set is append-only — nothing gets deleted — so your correction supersedes the original, but the original stays visible for the audit trail. Every version is hash-tracked. The three records behind this guide:

- Claim record: `sha256:841f04b21cba0c00fdf4134af29632814f8747b56c4d6c4e478250632cdd8e20`
- Realized record: `sha256:44655aa6539573f0f9d5c55aa51e06b70550e4e6885e2e9b5e73e84491e237b1`
- Verdict record: `sha256:59cec51d9275ce7ae6faccc2bb54092b277c3fd9694b8d939ecc6bc2f7f3bd87`
