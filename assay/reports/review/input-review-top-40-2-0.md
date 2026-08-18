# Top 40 2.0 — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is

We measured what Top 40 2.0's claim says against what it actually did in real (paper) trading. Before you treat that comparison as final, we want you to check every input we used to get there — the claim document, the numbers we pulled from it, the realized ledger, and every flag we found. If you correct anything below, the study re-runs automatically and the original version stays visible next to your correction.

## Step 1 — The claim document we used

- Files: `trisight-trader/docs_output/TOP_40_2_0_LOCKDOWN_SPEC.md:14-22,187,338-354`, `orchestration/reports/DEFECT-REGISTRY.md:78` (defect D58), `orchestration/reports/DECISIONS-INBOX.md:332` (seal 50f02064)
- Seal reference: `50f02064`
- Verbatim excerpt: "TOP40_2_VALIDATION_CAGR_PCT = 213.06656830114653 ... FROZEN FROM ALL EXTERNAL USE, effective 2026-07-31"
- Freeze effective date: 2026-07-31 (this is the date the owner ruling froze the number, per D58 — not a document generation date)
- Generation/seal date of the underlying document: not stated in our sources

**Your review:** Is this the right / best statement of what Top 40 2.0 claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

- **CAGR (backtest, baseline_aggressive_8_linear):** "213.07% CAGR (FROZEN from all external use by owner ruling D58; backing 118MB score cache absent from estate AND owner's machine, no SHA256 ever recorded; closest honest analog 88.44% CAGR; full point-in-time rebuild bound: -7.52% CAGR)"
  - How we normalized it: we took the stated 213.07% CAGR and used it directly as the annual rate (2.1307), and carried the FROZEN status and irreproducibility forward as integrity flags rather than silently accepting the number.
- **Win rate:** not stated (the claim document does not give a win rate for this metric)

**Your review:** one confirm/correct line per metric above.
- [ ] CAGR reading confirmed  - [ ] Correction: ______
- [ ] Win rate: confirmed as not stated  - [ ] Actual win rate: ______

## Step 3 — The time window of the claim

- Window: 2023-04-10 to 2026-04-17

**Your review:** if you know the calendar window the backtest actually covered and it differs from the above, state it — this single input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- File: `trisight-trader/docs_output/gate_conjunction_blast_radius_20260808/prod_auto_top40_2_0_trade_log.csv`
- Type/size: paper fills ledger, 11,355 rows, all PAPER (no live fills)
- How pulled: not stated in our sources
- Pull date: not stated in our sources
- Window: 2026-05-22 to 2026-08-10

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

- Realized value, verbatim: "No authoritative realized figure: displayed +22%/5d corrected to +8.03% (D77 calc artifact); +13.10%/wk sat on 144 corrupted basis-reset rows; ledger carries positions corrupted to 4.24e69 shares (CARD-99), 32/72 still corrupted as of 2026-08-10"
- Supporting excerpt: "the owner's 'appears fine' number was wrong: 36/55 positions ... crediting $118,619 of pre-entry movement; entry-clamped truth = +8.03%"

Every integrity flag from the slice, in plain terms:

- **D58 (claim side):** the CAGR can't be reproduced — the 118MB score cache that backs it is missing from both the estate and the owner's own machine, and no SHA256 hash was ever recorded to verify it. Direction unknown — we can't check if 213.07% is right or wrong without that cache.
- **Owner-FROZEN (claim side):** the owner ruled the CAGR frozen from all external use, effective 2026-07-31. This biases toward caution — the owner themself does not want this number used externally.
- **Fleet-wide frozen survivor-biased universe (claim side, w4nfwu675):** the backtest universe is flagged as survivor-biased across the fleet. This biases the CAGR upward — survivor bias tends to inflate backtested returns.
- **D77 calc artifact (realized side):** a displayed +22% over 5 days was actually a calculation error; the corrected figure is +8.03%. Biases the realized number upward before correction.
- **144 paper_basis_reset rows (realized side):** a +13.10%/week figure sat on top of 144 rows where the cost basis had been reset, which is a known corruption pattern. Direction unknown without seeing the resets themselves.
- **CARD-99 (realized side):** a floating-point bug doubled some position sizes up to 4.24e69 shares — an obviously impossible number. 32 of 72 affected positions were still corrupted as of 2026-08-10. Biases realized figures in an unpredictable direction depending on which trades are affected.
- **CARD-94 (realized side):** a side-blind sizing bug corrupted 87 of 128 positions. Direction unknown.

**Your review:** per flag — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params).** Reason, verbatim: "Top 40 2.0: side not normalizable to annualized return (claim: stated CAGR used directly as annual fraction; FROZEN status and irreproducibility carried as integrity flags; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality." — driven by Step 4/5: the realized side has no clean, normalizable annualized-return figure to ratio against the claim's CAGR.
- **Win-rate inflation: not computed.** Reason, verbatim: "NOT COMPUTED: a side lacks a stated win rate." — driven by Step 2: neither side has a stated win rate.
- Report note, verbatim: "Claim and realized windows cover DIFFERENT market regimes by nature (backtest history vs 2026 paper); rate-vs-rate comparison assumes claim rates were offered as forward-looking. Realized samples are short — treat ratios as lower-noise-bound estimates, not precision measurements."

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock

- If you supply a clean, complete realized ledger (or confirm the D77/CARD-99/CARD-94 corruptions are fully resolved) with a normalizable annualized-return figure, then the return-inflation ratio becomes computable instead of refused.
- If you supply a stated win rate for the claim side and/or the realized side (realized needs n>=30 trades), then win-rate inflation becomes computable instead of "not computed."
- If you can locate the backing 118MB score cache and its hash, then the D58 irreproducibility flag on the claim CAGR can be resolved rather than carried as an open flag.
- If you can confirm or correct the calendar window the backtest actually covered, then Step 3 is corrected if it's wrong.
- If you can confirm or correct how and when the realized ledger was pulled, then Step 4 is corrected.

## How corrections work

Name a file path or state a correction for any item above and send it back to us. The record set is append-only — nothing is deleted — so your correction supersedes what's shown here while the original stays visible for audit. Every version is hashed for traceability. Record hashes from the inflation report: claim `sha256:2213e5801fedc77df198ad901fd7c5f0ca54285e2bc2177d547117bdf7c53547`, realized `sha256:565ef2f32f12788b5bac2c845e39f30a012000192588c9f876d72d33967e001a`, verdict `sha256:0aaafb85fa2a0a93853f4ba5bd934faa828af2d450032603082d91e02934de47`.
