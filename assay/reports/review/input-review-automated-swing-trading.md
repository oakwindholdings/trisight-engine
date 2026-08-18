# Automated Swing Trading — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is

We measured what Automated Swing Trading claims against what actually happened in the paper ledger. Before you treat these results as final, we want you to check every input we used to get there. Anything you correct here re-runs the comparison automatically, and the original stays visible next to your correction.

## Step 1 — The claim document we used

Sources: `backtest_results/manual_swing_phase6* ledger artifacts`; seal `5a60b8b9`, SEALED 2026-07-17.

Verbatim excerpt: "N=2,107 trades, WR=92.22% | CAGR 1x=+420.85%"

Described as a 5-year backtest that shares ledger lineage with Manual Swing.

**Your review:** Is this the right / best statement of what Automated Swing Trading claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

- Trade count: N=2,107 (as stated).
- Win rate: WR 92.22% (n=2,107).
- 1x CAGR: +420.85% — normalized to 420.85%/yr using the method "1x CAGR as stated."
- 2x CAGR: +2,304.32% frictionless / +1,636.16% realistic-10bps — stated as-is, not separately normalized.

**Your review:** one confirm/correct line per metric.
- [ ] N=2,107 confirmed  - [ ] Correction: ______
- [ ] WR 92.22% confirmed  - [ ] Correction: ______
- [ ] 1x CAGR +420.85% confirmed  - [ ] Correction: ______
- [ ] 2x CAGR figures confirmed  - [ ] Correction: ______

## Step 3 — The time window of the claim

No exact start/end date is stated for the claim window. The only clue is the ledger filename itself, which points to 2021-2026 with no exact dates. Because of this, the return-inflation comparison refuses to run on the window dimension.

**Your review:** if you know the calendar window the backtest covered, state it — this single input may unlock the return comparison.
- [ ] Window confirmed as shown (2021-2026, filename-derived only)  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- Filename: `Snapshots/auto_swing_trade_log.csv` (116 rows).
- How pulled: not stated.
- Pull date: not stated.
- Trade count behind the win-rate figure: n=104.
- Window: 2026-04-26 to 2026-08-05.

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Verbatim: "realized WR 56.7% (59W/45L of 104 ... 37 were later ruled fabricated 'phantom' stop-exits and VOIDED)"

Full figure: Since-inception realized WR 56.7% (59W/45L, n=104) — of which 37 were later ruled fabricated phantom stop-exits and VOIDED by owner 2026-08-05; since strategy-tagging: raw 42.9%, phantom-excluded 76.9%; real-only P&L weekly -0.44%, monthly/YTD -0.88%.

Every integrity flag in the slice:

1. **Window known only from filename** (claim-side). What it is: the backtest window isn't given as exact dates, only implied by a ledger filename. Direction: unknown — we can't tell if this makes the claim look better or worse, but it's why the return comparison refuses to run.
2. **Fleet-wide frozen survivor-biased universe (w4nfwu675)** (claim-side). What it is: the backtest ran against a fixed, fleet-wide symbol universe flagged as survivor-biased. Direction: this kind of bias typically makes a backtest look better than it would without it — it tends to inflate the claim.
3. **37/104 round-trips VOIDED as fabricated phantom stop-exits, owner ruling 2026-08-05** (realized-side). What it is: 37 of the 104 realized trades were ruled fake stop-exits and voided; the 56.7% win rate we used is drawn from the population before that voiding, so it is itself flagged unreliable. The since-tagging subset shows raw 42.9% vs phantom-excluded 76.9%, but that's a different, smaller population than the since-inception 56.7% figure. Direction: not fully determinable from these numbers alone.

**Your review:** per flag — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused

**Return inflation: REFUSED (invalid_params).** Reason given: the claim side isn't normalizable to an annualized return because the window is only filename-derived (Step 3), and the realized side has no annualized-return figure at all (Step 4/5). Input driving this: the missing exact window in Step 3.

**Win-rate inflation: 1.63×.** Claimed 92.2% (Step 2) vs realized 56.7% over 104 closed trades (Step 5). Input driving this: the Step 2 claim win rate and the Step 5 realized win rate, including the 37-trade voiding question flagged above.

Report's own caveat, verbatim: "Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements."

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock

- If you supply the exact calendar window the 5-year backtest covered (Step 3), then the return-inflation ratio — currently refused — becomes computable.
- If you confirm or correct the fleet-wide frozen universe flagged as survivor-biased, w4nfwu675 (Step 5, flag 2), then the claim numbers can be corrected for that bias.
- If you confirm the final win/loss tally for the since-inception 104 trades after the 37 voided phantom stop-exits are properly excluded (Step 5, flag 3), then the realized win rate feeding the 1.63× ratio can be corrected.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`backtest_results/manual_swing_phase6* ledger artifacts`**
  → Lives only on the Railway production volume (not web-viewable). Ask Bob for a copy — pulls are read-only and dated.
- **`seal 5a60b8b9 SEALED 2026-07-17`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md>
- **`Snapshots/auto_swing_trade_log.csv (116 rows)`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/Snapshots/auto_swing_trade_log.csv>
- **`owner ruling 2026-08-05 (phantom exits voided)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md>

## How corrections work

Tell us a file path or a correction for any item above. The record set is append-only, so nothing gets overwritten — a correction supersedes the prior value while the original stays visible for comparison, and every version carries a hash so the whole chain is auditable. Records behind this guide: claim `sha256:c6e0a423d8a33a9774a6668e146d6850d8705a645ce09b9a9789e984b5c0c07c`; realized `sha256:02b83282aaf19149a8f9bbd0b40e1f46e59ba8ed06bfbd0f36ea814d2f887bc0`; verdict `sha256:e089539bd8f286589c3bfac68d1fa48971aecaafb636eb69948ce3b65b170262`.
