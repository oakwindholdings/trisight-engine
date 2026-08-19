# Round 2 — The Questions, In Full

*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

This is a printed copy of every round-2 item in the review website, so you have it on paper.
Each item leads with the sealed evidence (quoted word for word, labelled **MEASURED** for a
measured value or **INFERRED** for our reading of it), then either explains a term you flagged
or asks you one specific question. Answer on the website — the same link and code as before —
or mark this up and send it back.


## Oakwind Swing Trader

**[QUESTION]**  
You asked which system these trades come from — TriSight Sim, TradeStation Sim, or TradeStation Live. INFERRED: every ledger in this study is written by TriSight's own strategy runners, pricing signals against market data in simulation, with no broker involved. We read that as TriSight Sim, not TradeStation. If that is right for this strategy, say so; and if the venue differs for ANY specific strategy, name it there — we will not assume one answer covers all ten. (The link that 404'd for you needed a GitHub sign-in; every file link in these questions is served by this site directly, no sign-in.)

> *Sealed realized record, Oakwind Swing — supply_demand_hourly_paper_fills.csv, read-only pull 2026-08-07 (MEASURED)*  
> “254 closed round-trip trades: WR 58.66% (95% CI 52.52%-64.54%) ... expectancy +0.466%/trade”

Your answer (pick one, then add detail):

- [ ] TriSight Sim
- [ ] TradeStation Sim
- [ ] TradeStation Live
- [ ] Differs by strategy — I'll specify

**[QUESTION]**  
MEASURED: the Oakwind Swing backtest artifact declares NO calendar window — it names 15,028 trades / 9,408 executed and a generation timestamp (2026-05-18T14:33:54), but no field states the start or end date of the period those trades span. We confirmed the absence in the artifact and its seal record. That missing window is the one input blocking the return comparison. Do you know the calendar span the backtest covered?

> *Sealed claim artifact, verbatim (MEASURED)*  
> “Win% 67.65%, Net executed win% 62.85%, CAGR 1,851.41%, Max DD -1.65% — artifact generated 2026-05-18T14:33:54, seal 915248a6 signed Dick O'Leary 2026-07-12”

Your answer (pick one, then add detail):

- [ ] I know the dates — typing them below
- [ ] I don't know the dates
- [ ] Re-run so the artifact declares its dates

**[CONTEXT]**  
You said 'modeled control ledger' means nothing to you. INFERRED from the artifact's own terms: it is a list of simulated fills priced at modeled market prices with 5 basis points (0.05%) of friction charged per trade — a calculation, not executed orders. Every number on the claim side of this strategy comes from that calculation.

> *Sealed claim artifact (MEASURED)*  
> “Modeled control ledger, 5bps friction: Win% 67.65% ... 15,028 trades / 9,408 executed (15bps variant: win 55.12%, CAGR 430.61%)”

**[CONTEXT]**  
You asked what 'fleet-wide frozen survivor-biased universe; dip-buy amplification' means. Two separate findings, labeled separately. FIRST, MEASURED (three-lens audit, workflow w4nfwu675): the backtest ranks stocks from a list of companies as it exists today; companies that died or delisted during the tested years are absent, so the test could only ever pick survivors — which can only flatter results. This was confirmed for every sealed strategy in the estate. SECOND, and more tentative — INFERRED (a separate single-lens equities analysis): dip-buying strategies feel this bias more than momentum-exit ones, because a dip-buyer is what would have bought the failing names the frozen list deletes. That analysis names the dip-buyers generically and rates the flagship Top 40 2.0 as the estate's SEVERE worst case — not Oakwind. Only Top 40 has since had the credentialed re-measurement that turns this from hypothesis into a hard number.

> *TOTAL-QUALITY-MATRIX.md line 49, verbatim (MEASURED, 3-lens w4nfwu675)*  
> “VERIFIED FLEET-WIDE (workflow w4nfwu675, 3 lenses). Refute-lens: CONFIRMED survivor-biased (no valid refutation). Fleet-lens: ALL sealed strategies AFFECTED ... Oakwind (TS500_CSV present-day roster)”

> *TOTAL-QUALITY-MATRIX.md line 87, verbatim (INFERRED, single-lens lambda analysis)*  
> “momentum-exit lambdas (TS500, partly Shark-Fin) dampen the corruption; dip-buy lambdas (Oakwind, Sniper) amplify it; hyper-tactical concentrated momentum (Top 40 2.0) is severe”


## High 5

**[QUESTION]**  
Correction on our part: High 5's window is NOT missing — we have it, and we should not have asked you to supply it. MEASURED (sealed record): the backtest covers 2021-04-01 to 2026-04-30. So the return comparison is not blocked on a window here. What IS worth your eye is the gap it exposes: claim win rate 92.33% over 5,321 trades vs realized 45.08% (95% CI 36.3%-53.9%) over 122 closed trades, all of them time-exits with no stops. Is 2021-04-01 to 2026-04-30 the correct span, and does that claim/realized gap match your understanding?

> *Sealed claim, High 5 — 2026-07-16 sealed benchmark (MEASURED)*  
> “5,321 trades, Win% 92.33%”

> *Sealed realized, High 5 — pulled 2026-08-07 (MEASURED)*  
> “122 closed paper round-trips (pulled 2026-08-07): win rate 45.08% [95% CI 36.3%-53.9%]”

Your answer (pick one, then add detail):

- [ ] Window and gap look right
- [ ] Window is wrong — correct dates below
- [ ] The gap needs explaining — comment below


## Top 40 2.0

**[CONTEXT]**  
You asked for the validation, not more dialog. Here is the full chain for the 213.07% figure, every step MEASURED: (1) The sealed number rests on a 118MB score cache that exists nowhere — you verified its absence from your own machine, and the seal never recorded the SHA256 its own policy required, so even a found file could not be verified. (2) The closest honest analog — same sealed parameters, universe re-resolved 2026-07-23 — reproduces to 88.44% CAGR. (3) A point-in-time rebuild that may only buy what was actually eligible on each entry date drops it to -7.55% CAGR / 61.59% max drawdown, and that is an OPTIMISTIC bound. (4) The credentialed survivorship correction — restoring the 2,399 delisted names — is the firm number: -32.42% CAGR / 76.68% max drawdown, VERIFIED by both adversarial lenses on 2026-08-10. (5) On your Round-61 ruling (c), the sealed 213.07% is frozen from all external use until honest re-validation. The full record is one click away.

> *DEFECT-REGISTRY.md, D58, verbatim (MEASURED)*  
> “the literal sealed 213.06656830114653% CANNOT BE REPRODUCED AT ALL: its 2026-05-15 score-matrix cache exists nowhere — director independently confirmed absent from the working tree, from ALL git refs ... and from the entire estate filesystem”

> *TOTAL-QUALITY-MATRIX.md, E4→E11 addendum, verbatim (MEASURED, VERIFIED both lenses wvu77ebio 2026-08-10)*  
> “baseline (survivor-only PIT rebuild) -7.55% CAGR / 61.59% DD -> survivorship-corrected -32.42% CAGR / 76.68% DD ... 2,399 delisted-liquid names”

**[CONTEXT]**  
Same definition you asked for on Oakwind, applied here where you also asked it. MEASURED (three-lens audit w4nfwu675): 'fleet-wide frozen survivor-biased universe' means the backtest picked from today's list of live companies, so it never saw the ones that failed or delisted during the test — which only inflates results. For Top 40 specifically this is the estate's worst case: the credentialed correction (finding above, -32.42% CAGR) shows the damage is concentrated in the small-cap tail the frozen list deletes.

> *TOTAL-QUALITY-MATRIX.md line 49, verbatim (MEASURED)*  
> “ALL sealed strategies AFFECTED — every committed backtest ranks within a frozen current-listed pool: ... Top 40 2.0 + Top 10 (massive-trisight-universe matrix, 2026-05-15, ~3.1yr freeze”

**[CONTEXT]**  
Your round-1 point stands and we agree: MEASURED — this ledger carries 144 corrupted basis-reset rows and positions corrupted to 4.24e69 shares (CARD-99), with 32 of 72 still corrupted as of 2026-08-10. There is no honest realized number to comment on here, and we are not asking you to invent one. We are noting the corruption as the finding itself. Nothing for you to do on this card unless you know of an uncorrupted record elsewhere.

> *Sealed realized record, Top 40 (MEASURED)*  
> “144 corrupted basis-reset rows ... positions corrupted to 4.24e69 shares (CARD-99), 32/72 still corrupted as of 2026-08-10”

**[QUESTION]**  
One ruling from you — an action call, not a fact. While the sealed 213.07% stays frozen, which number should stand as Top 40's claim-side comparator? Your strongest counter, stated for you: the -32.42% correction restores delisted names but still runs them through the same scoring, and the 88.44% analog still carries the survivor bias — so none is clean. The question is which honest imperfection goes on the page.

> *DEFECT-REGISTRY.md, D58 owner ruling, verbatim (MEASURED)*  
> “OWNER RULING ROUND-61 = (c) RE-VALIDATE FIRST, RULE AFTER (verbatim: 'Part 2: c'). The Top 40 2.0 ... sealed CAGR figures are FROZEN FROM ALL EXTERNAL USE, effective immediately”

Your answer (pick one, then add detail):

- [ ] -32.42% — the verified survivorship-corrected figure
- [ ] -7.55% — the point-in-time optimistic bound
- [ ] 88.44% — the closest honest analog
- [ ] Keep it REFUSED until full re-validation completes


## Oakwind Investor Daily

**[QUESTION]**  
You said a prior ruling was to NOTE Oakwind Investor's CAGR, not refuse it — and you were right that we should be honoring your ruling, not our memory. We searched the full decisions log ourselves rather than send you looking. We could NOT find a ruling in those words. What we did find: component-wise ratifications were stopped at Round-25b, and the sealed headline is the deduped win 51.18% / maxDD -20.71%. So rather than overrule you or guess, we propose treating your instruction as a standing one now: NOTE the CAGR calculation with its caveats instead of refusing it. Confirm that and we apply it; or point us to the ruling and we'll match it exactly.

> *DECISIONS-INBOX.md, Round-25b, verbatim (MEASURED — closest located)*  
> “component-wise asks came from serving Bob's pipeline sequencing over the owner's standing order — STOPPED as of this sitting; no further component-level ratifications will be put to Dick”

Your answer (pick one, then add detail):

- [ ] Yes — note it, don't refuse (apply as a standing rule)
- [ ] The ruling exists — here's roughly when/what
- [ ] Leave it refused

**[QUESTION]**  
MEASURED: the Oakwind Investor claim artifact declares no calendar window (both start and end are absent in the sealed record). Same single blocking input as Oakwind Swing. If you know the span the backtest covered, that unlocks the return comparison.

Your answer (pick one, then add detail):

- [ ] I know the dates — typing them below
- [ ] I don't know
- [ ] Re-run so the artifact declares its dates

**[CONTEXT]**  
You objected — rightly — to being asked to weigh 'phantom' vs 'real' when neither was defined. Definitions, MEASURED (defect D39): a 'phantom' entry is one where no market crossing occurred on the entry day — the strategy logged an entry the tape does not support. On the reconstructed backlog, 29 of 50 entries were phantom; the real-entry-only subset is n=21 with a 38.1% win rate, against the claim's 50.51%. 'Real' here just means the non-phantom subset — we'll drop the word if it's still unclear.

> *Sealed realized record, Oakwind Investor (MEASURED)*  
> “Reconstructed backlog (2026-07-30, 50 closed): aggregate WR 68.0% BUT 29/50 entries were phantom (no market crossing on entry day, D39); REAL-entry-only subset: n=21, WR 38.1%”


## Automated Swing Trading

**[CONTEXT]**  
Context for the flag you couldn't evaluate, with the attribution kept straight. MEASURED: 37 of this ledger's 104 completed round-trips were stop-exits at prices the market never traded. The director's audit caught them (D77/D81, kill-shot-verified 2026-08-05); you then ruled the same day to VOID those 37 rows. The 56.7% realized win rate (59W/45L, n=104) on the card still includes the voided rows, which is why the study marks even the realized side of this strategy unreliable — the honest rate can't be stated until the ledger is recomputed without them.

> *Sealed realized record, Automated Swing (MEASURED)*  
> “Since-inception realized WR 56.7% (59W/45L, n=104) — of which 37 were later ruled fabricated phantom stop-exits and VOIDED by owner 2026-08-05”

**[QUESTION]**  
MEASURED: this backtest's window is not stated inside the artifact — it is only implied by the filename. Is the filename-implied span the real period the test covered?

Your answer (pick one, then add detail):

- [ ] Yes — the filename dates are correct
- [ ] No — I know different dates
- [ ] I don't know


## Manual Swing Trading

**[CONTEXT]**  
You asked what a 'synthetic signature' is — and the honest answer is narrower than 'fake trades,' so here it is precisely. MEASURED: 104 of this ledger's 259 rows show exactly +1.00% profit held exactly 1 day, a pattern the validated contract makes mathematically impossible; on replay against real bars, the covered trades diverge from their recorded outcomes (e.g. CNK: recorded +1.00%/1-day vs contract +14.58%/7-day). The director's own correction, on record: these were PRICE-REAL but CONTRACT-INVALID — the market did trade through those levels, but the levels were same-session stop-raises the contract forbids. So they are not invented trades; they are real fills booked under a stop rule the strategy isn't allowed to use. That is why the study won't compute a realized rate from this ledger as-is.

> *DEFECT-REGISTRY.md, D86, verbatim (MEASURED)*  
> “101 of 256 closed trades (54% of all STOP_TRAIL exits) carry the +1.00%/1-day/BE-triggered signature the validated contract makes mathematically impossible ... DIRECTOR CORRECTION owned: the ... '+1% trail-outs' I realism-verified were PRICE-REAL but CONTRACT-INVALID”

**[QUESTION]**  
Arithmetic on what's left: MEASURED — of 259 rows, 104 carry the contract-invalid +1.00%/1-day signature and 48 are BACKFILL-simulated (rows before ~2026-04-26). Even before counting any overlap, well over half the ledger is unusable, and no aggregate win rate is stated — so we can't compute an honest realized figure from this record. Does a cleaner record of real fills exist anywhere — a different TriSight Sim lane, a TradeStation account, a log of yours?

Your answer (pick one, then add detail):

- [ ] A better record exists — I'll say where
- [ ] This ledger is all there is
- [ ] I don't know


## TriSight 500 2.0

**[CONTEXT]**  
You asked what a '6yr frozen universe cache' is and why anything frozen would matter in production — and you're right to be skeptical. Two distinct points, labeled. MEASURED (line 49): TS500's backtest simulated 2020-2026 but picked stocks from ONE list resolved 2026-04-05 — the longest frozen-cache DURATION in the estate (~6 years). That is a statement about freeze length, not yet about how much it distorts TS500's result. Separately, INFERRED (the lambda analysis): TS500's momentum-EXIT logic actually DAMPENS this bias rather than amplifying it, unlike the dip-buyers — so despite having the longest freeze, TS500 is not rated the worst-hit. Only a credentialed re-measurement (done for Top 40, not yet for TS500) would give the hard impact number.

> *TOTAL-QUALITY-MATRIX.md line 49, verbatim (MEASURED)*  
> “TS500 2.0 (trisight_16D_master_cache.json, 2026-04-05, ~6yr freeze — most severe)”

> *TOTAL-QUALITY-MATRIX.md line 87, verbatim (INFERRED)*  
> “momentum-exit lambdas (TS500, partly Shark-Fin) dampen the corruption; dip-buy lambdas (Oakwind, Sniper) amplify it”

**[CONTEXT]**  
You asked what a 'shadow paper fill' is versus TriSight Sim / TradeStation Sim / Live. INFERRED: 'shadow' means the strategy runs silently in parallel with production — its signals are recorded and priced by TriSight's own engine, but no orders are placed, not even into a simulated account. In your taxonomy that is a TriSight Sim lane, one step more detached than a normal sim. If your venue answer on the earlier question says otherwise, that answer governs.

> *Realized ledger snapshot, hash-verified (MEASURED)*  
> “auto_ts500_lfr_shadow_paper_fill_log.csv — 495,505 bytes, sha256 3fa36741…”


## Escalator Reclaimed Shadow

**[QUESTION]**  
Housekeeping, and possibly on us: the review received no answers for this strategy (Escalator Reclaimed Shadow — the short-window one, distinct from Long Shadow, which you did answer). Given this same tool served you a broken 404 link and a rendering bug last round, we're not assuming you skipped it — it may be that its cards failed to save. Either way, its questions are here now. Did it save wrong on your end, or would you like to review it fresh?

Your answer (pick one, then add detail):

- [ ] Its cards must have failed to save
- [ ] I skipped it — I'll review it now
- [ ] I'll come back to it


## Escalator Reclaimed Long Shadow

**[QUESTION]**  
MEASURED: the Long Shadow claim artifact declares no calendar window. If you know the span the backtest covered, that one input unlocks its return comparison.

Your answer (pick one, then add detail):

- [ ] I know the dates — typing them below
- [ ] I don't know
- [ ] Re-run so the artifact declares its dates


## Earnings Trader (locked 93)

**[CONTEXT]**  
You corrected every claim card here in round 1. The claim, MEASURED (sealed record): 93 events, 92.473% win rate, CAGR 419.481%, window 2022-03-31 to 2026-05-15. We can state the claim exactly — what we cannot do is compare it to reality, because this strategy has never produced a live trade (see the realized card). So the honest status is not 'refused because we didn't do the work'; it is 'unverifiable because there is nothing on the realized side to weigh it against.' Is 92.473% over 93 events the claim you intend to stand on?

> *Sealed claim, Earnings Trader (MEASURED)*  
> “Events: 93 | Win rate: 92.473% | CAGR: 419.481% — window 2022-03-31..2026-05-15”

Your answer (pick one, then add detail):

- [ ] Yes — that's the claim
- [ ] No — correct it below
- [ ] It shouldn't be presented until it fires

**[CONTEXT]**  
For the realized cards: the reason there's nothing to show is itself the finding, and it's measured, not an excuse. This strategy has never fired in production — the funnel was reproduced live at 472 candidates in, 0 out, with the sole survivor rejected on five named missing features. Three of its five gate features require rolling roster history the live pipeline structurally never builds. There is no realized record because none exists.

> *DEFECT-REGISTRY.md, Q-EARN, verbatim (MEASURED)*  
> “Real funnel: 472 → 77 → 59 → 1 → 0 — the sole survivor MMSI was rejected on 5 named missing entry features”

> *DEFECT-REGISTRY.md, D53, verbatim (MEASURED)*  
> “This is the sealed-backtest-validated-against-data-live-doesn't-have scenario, CONFIRMED TRUE — the strategy can never fire as built”


---
*11 questions in all. Website: https://trisight-engine-production.up.railway.app/review · code from Bob.*