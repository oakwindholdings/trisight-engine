# Round 3 — What We Found

*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

You told us to do the work instead of asking you to bless guesses. We did. This is a printed
copy of everything round 3 puts in front of you — each strategy leads with what we verified
against the actual data and code, and only a few genuine decisions are left for you. Everything
below is live on the review website (same link and code); this is your paper copy.

Labels: **MEASURED** = a measured value from the record; **INFERRED** = our reading of it.


## Top 40 2.0

**[WHAT WE FOUND]**  
You told us to find the original 213% validation, not substitutes. We did the work. The original is gone and cannot be rebuilt: its score-matrix cache exists nowhere, and its seal never recorded a SHA256, so even a file with the exact name can't be proven to be it. What DOES exist is three honestly-computed numbers, each dated and each worse as more survivorship bias is corrected out: 88.44% (closest analog, 2026-07-23), -7.52% CAGR (full point-in-time rebuild, 2026-07-31, an optimistic bound), and -32.42% CAGR (delisted-augmented correction, 2026-08-10, verified by both adversarial lenses). None of these is 213%, and the original that was can't be reproduced.

> *DEFECT-REGISTRY.md, D58, verbatim (MEASURED)*  
> “its 2026-05-15 score-matrix cache exists nowhere ... No SHA256 exists, so the sealed artifact is UNVERIFIABLE even if a candidate file surfaces”

> *TOTAL-QUALITY-MATRIX.md, E4→E11 addendum, verbatim (MEASURED, verified both lenses 2026-08-10)*  
> “−32.42% CAGR / 76.68% DD”

**[DECISION FOR YOU]**  
Your Round-61 ruling was 're-validate first, rule after.' The re-validation is done (above). The remaining decision is yours as owner: present an honest number with full disclosure that it's far below the sealed 213%, or retire the strategy. (We are NOT re-asking the external-quotation question — you closed that 2026-07-31.)

Your call (pick one, add detail):

- [ ] Present the honest number (-32.42%, verified) with full disclosure
- [ ] Present the optimistic bound (-7.52%) with disclosure
- [ ] Retire Top 40 2.0
- [ ] I'll rule differently — explaining below


## High 5

**[WHAT WE FOUND]**  
On High 5 we don't have a new question for you — you already answered it. At Round-74 (2026-08-07) you ruled, verbatim, that the sealed contract is the no-stop 7-day hold, production is aligned with it, and its performance 'was never validly backtested.' So the answer to 'find the evidence that supports the 92.33%' is: there is none, by your own ruling — it was graded on a stop the contract doesn't have. The honest, production-faithful number is 25.12%, which has been run and reproduced.

> *DEFECT-REGISTRY.md, ROUND-74-RULED, verbatim (MEASURED)*  
> “High 5: the record-assembled answer stands — sealed contract is the no-stop 7-day hold, production is ALIGNED with it, and its performance was never validly backtested”

**[DECISION FOR YOU]**  
The one thing still open on High 5 is a decision that's been parked with you since 2026-08-10: the re-seal that replaces the manufactured 92.33% with the measured 25.12% has never been signed. It's waiting on your word.

Your call (pick one, add detail):

- [ ] Close it now — ratify the measured 25.12%
- [ ] Keep it open — I'm not ready to seal
- [ ] Something else — explaining below


## Oakwind Swing Trader

**[WHAT WE FOUND]**  
You were right to push back, and your instinct on the '9,408 in one day' was correct — so we established the actual window from our own committed data rather than ask you. Oakwind Swing's backtest covers 2025-01-02 to 2026-05-14 — about 16 months — so 9,408 executed trades over that span is coherent, not one day. The dates come from the committed baseline-capital CSV (git-tracked), corroborated by a separate coverage file confirming 2025 as the entry-start year. The venue question is likewise answered from our own code: this is TriSight Sim.

> *WI-2.4 evidence (MEASURED; committed baseline_capital.csv, single source)*  
> “first_entry = 2025-01-02 09:30:00, last_exit = 2026-05-14 12:30:00”


## Oakwind Investor Daily

**[WHAT WE FOUND]**  
You ruled 'note it, don't refuse' as a standing rule — we applied it, we didn't re-ask. The window is now established (2025-01-02 to 2026-05-15, 2,055 executed trades, from the committed ledger), which was the only reason it had been refused. So Oakwind Investor's CAGR verdict is now NOTED-with-caveats, not refused. The caveats that travel with the number: it carries the fleet survivorship bias, and the realized side shows 29 of 50 entries were phantom (no market crossing on the entry day). The number is recorded, not endorsed.

> *WI-2.4 evidence (MEASURED; from committed oakwind_investor ledger)*  
> “2025-01-02 05:00:00 → 2026-05-15”


## Automated Swing Trading

**[WHAT WE FOUND]**  
You said the params are identical and only the execution differs, and that we should be fixing it, not asking you. Both halves check out. We verified against the code: all 18 locked production parameters are value-for-value identical between Automated and Manual Swing, and there is NO separate Automated Swing backtest anywhere — its claim reused Manual's manual_swing_phase6 ledger. The only real difference is an execution-layer entry-window cutoff. We are addressing the fix: our recommendation is to formally record Automated Swing as inheriting Manual's validated backtest (the params are the same strategy), with the execution difference documented — and we'll execute that unless you redirect.

> *WI-4 evidence, verbatim (MEASURED)*  
> “identical, value-for-value, in both files”

> *WI-4 evidence, verbatim (MEASURED)*  
> “No distinct Automated-Swing-specific backtest artifact exists anywhere in the trader repo”

Your call (pick one, add detail):

- [ ] Proceed — record Auto as inheriting Manual's validation (our recommendation)
- [ ] Redirect — re-validate Auto on its own separate backtest instead
- [ ] Explaining below


## Manual Swing Trading

**[WHAT WE FOUND]**  
We re-pulled your live Manual Swing ledger fresh today (not the stale study snapshot). It now holds 291 rows: 48 tagged BACKFILL, 134 carrying the +1.00%/1-day signature the validated contract makes impossible, and 109 others. Two honest points: (1) those flagged fills were PRICE-REAL but contract-invalid — the market did trade through those levels, but under a stop rule the contract forbids; they are not fabricated trades. (2) Your RULING 3 ('I do not trust ANY of your backfilled data') reset only the committed seed file to empty — the live volume ledger these numbers come from was left untouched. Note: this signature is not a stale historical artifact — it is still actively appearing in the live production ledger.

> *WI-8 evidence, verbatim (MEASURED, live pull 2026-08-19)*  
> “291/48/134/109”

> *WI-8 evidence — D86 signature rule (MEASURED)*  
> “pnl_pct==+1.00% AND days_held==1”

**[DECISION FOR YOU]**  
So when you say Manual Swing had 'no real trades,' which do you mean — that none executed at all, or that none executed under a valid contract? Our data shows real fills that violated the stop rule. The distinction decides whether we void those rows or re-book them.

Your call (pick one, add detail):

- [ ] None executed under a valid contract — void the contract-invalid rows
- [ ] None executed at all — treat the whole ledger as unusable
- [ ] Explaining below


## Escalator Reclaimed Shadow

**[WHAT WE FOUND]**  
You said we'd given you nothing to review on this strategy — you were right that it never reached you, but the evidence exists. Here is the full picture, both sides. CLAIM: 349 trades, total return 215.97%, win rate 63.04%. REALIZED (production paper): 150 closed trades, 68 wins / 82 losses = 45.33% win rate, net +$370.59 (+0.05%) over 2026-05-15 to 2026-08-04 — a win-rate inflation of about 1.39×. It simply never reached your dialog in round 1 (an isolated save failure on this one strategy; we checked — not systemic).

> *WI-6 evidence — CLAIM side (MEASURED, from normalized-inputs)*  
> “349 trades, total return 215.969323%, CAGR 16079.179”

> *WI-6 evidence — REALIZED side (MEASURED)*  
> “150 closed trades (68W/82L = 45.33%”


## Escalator Reclaimed Long Shadow

**[WHAT WE FOUND]**  
Long Shadow's window is established from our own committed data — 2025-12-31 to 2026-03-24 (57 market dates, 264 trades), recovered from two independently-generated committed CSVs (a block-summary and a rolling-summary) that cross-check and reconcile exactly to the claim. No re-run was needed, and nothing to confirm on your end.

> *WI-2.4 evidence, verbatim (MEASURED)*  
> “2025-12-31 and the latest end_date value is 2026-03-24”


---
*4 decisions in all. Website: https://trisight-engine-production.up.railway.app/review · code from Bob. Your round-2 answers are preserved there as the thread history above each item.*