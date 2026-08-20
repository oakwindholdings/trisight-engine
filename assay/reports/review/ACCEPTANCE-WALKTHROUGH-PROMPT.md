# Acceptance Walkthrough — Taking the Study's Learnings Into the Strategies

*Prepared for Bob to relay · August 2026 · DRAFT until Bob sends it*

This is the stage AFTER the input review. The input review asked Dick to check what the
study used. This walkthrough asks him to decide what the strategies now say — four
decisions, each anchored to documents already merged on `oakwindholdings/TriSight`
`main` (PRs #919, #920, #921, all merged 2026-08-20). Nothing here asks him to trust a
premise: every card has him open the merged file and read the number with his own eyes
before deciding.

**How Bob uses this:** paste the block below into a Claude Code session on Dick's PC
(his usual TriSight session works; if he'd rather not use Claude Code, the same four
cards work as an email — each card ends with a one-line answer he can type). Everything
the session might change is draft-only until Dick approves it on screen.

---

## The prompt (paste everything between the lines into Claude Code)

```
I am Dick O'Leary, the owner of the TriSight trading strategies. A study compared my
strategies' claimed results against their real paper trading records. Its findings are
now merged into this repository as documents. Your job is to walk me through FOUR
decisions, one at a time, so my strategies' own documents say what I decide they say.
I am not highly technical. Plain English only.

FIRST, before anything else, check what you can do here and tell me in one short
paragraph: (1) run "git rev-parse --short HEAD" and "git pull origin main" and tell me
if this is the TriSight repository and it updated cleanly; (2) confirm these three files
exist after the pull: docs_output/oakwind_swing_cagr_reconciliation_20260820.md,
docs_output/automated_swing_fresh_backtest_20260820.md,
docs_output/oakwind_investor_exit_check_sandbox_20260820.md. If any of that fails, stop
and tell me exactly what to tell Bob — do not improvise.

RULES for the whole session:
- One card at a time. Show me the card, wait for my answer, record it, then move on.
- For every number you show me, first OPEN the named file and quote the line it comes
  from, so I am reading the repository, not your memory. If a number you find does not
  match what this prompt says, STOP on that card and record "MISMATCH" with both values.
- My answer on each card is exactly one of: ACCEPT, DISPUTE: <my words>, or
  ADJUST: <my words>. "I don't know" is recorded as DEFER. Never argue me out of an
  answer; record it.
- Do not give your own opinion of whether any strategy is good.
- Do not touch any file until all four cards are answered, and then only what my
  answers authorize, shown to me as a diff before anything is saved.
- Everything here is TriSight Sim paper trading. Nothing in this session touches real
  money, broker connections, or live orders, and you must refuse if anything asks.

CARD 1 of 4 — Oakwind Swing Trader: which win rate governs?
Open docs_output/oakwind_swing_cagr_reconciliation_20260820.md, section 2. Show me the
four-row table. Explain in two sentences: the backtest's headline win rate (67.65% raw
signals, or 67.30% before costs) counts trades no real account gets to take at prices
no real account pays; the after-cost executed win rate at realistic cost levels is
62.85% (at 5 bps) down to 55.12% (at 15 bps) — "bps" is basis points, the assumed
trading cost per side; 5 bps means 0.05% of each trade's value. The strategy's real paper record so far
is 59.55% over 529 trades — inside that after-cost range, below the raw number.
The decision: designate the after-cost executed win rate (62.85% at the 5 bps tier) as
the governing backtest win-rate figure for this strategy, so every future comparison
uses it instead of the raw 67.65%.
My answer: ACCEPT / DISPUTE / ADJUST.

CARD 2 of 4 — Oakwind Swing Trader: the return comparison.
Same document, sections 3, 4 and 6. Show me the reconciliation table. Explain in three
sentences: the real paper account made +$9,589.30 on its $100,000 base in its first 18
trading days; carried out to a full year that pace is +327.7%/yr, with a wide
uncertainty band because 18 days is a short sample; the backtest's after-cost model
band is +430.6%/yr to +1,851.4%/yr, so the real paper account is running BELOW everything the
model promised, closest to the most cost-conservative tier — and the model numbers
carry a known survivor-bias flag and cannot be recomputed from committed inputs.
The decision: accept this document as the standing comparison of record for Oakwind
Swing (it updates as more weeks of real data arrive), including its labels on the
model numbers.
My answer: ACCEPT / DISPUTE / ADJUST.

CARD 3 of 4 — Automated Swing: which backtest number is current?
Open docs_output/automated_swing_fresh_backtest_20260820.md. Show me the three-column
table. Explain in three sentences: the sealed 92.22% figure can never be recomputed —
the data file behind it is gone, so it is a historical quote only; the study rebuilt
the dataset from scratch on 2026-08-20 and measured fresh: 91.78% win rate over 2,032
trades on the same date window (and 91.56% through the present) — so the sealed
number's character is real, not an artifact of the lost file. As context the document
itself records (read it to me from the file, not from opinion): the engine's average
winning trade is +2.44% and its average losing trade is −8.75%, and the document's own
arithmetic puts the win rate a real account must stay above at roughly 78%.
The decision: record 91.78% (N=2,032, measured 2026-08-20, input preserved) as the
strategy's current measured backtest figure, with 92.22% kept as the sealed historical
quote it is.
My answer: ACCEPT / DISPUTE / ADJUST.

CARD 4 of 4 — Oakwind Investor: schedule the end-of-day exit check?
Open docs_output/oakwind_investor_exit_check_sandbox_20260820.md. Show me the two-row
result table and the "Two observations" section. Explain in three sentences: the exit
check has been running only when someone runs it by hand — the paper ledger shows 14
hand-run exit records between Aug 3 and Aug 18; when the study ran the same check in a
sandbox on Aug 20, the two positions still open (ESLT and HON, both entered Aug 12)
had both already hit their stop levels on the Aug 19 daily bar and would close at
those recorded stop prices (paper losses of $3,746.55 and $3,769.98); the scheduled
version of this same check is already built and wired into the daily engine, switched
off (the "Oakwind Investor End-of-Day Exit Check (D31)" entry, set to run 15:55 ET
daily — the repository's own note on that entry says turning it on is a settings
change made for my ruling, not a code change).
The decision, three ways:
  ACCEPT = switch the scheduled check ON. This happens on my own screen, not in code:
  in my TriSight terminal, the admin "Job Schedules" panel lists "Oakwind Investor
  End-of-Day Exit Check (D31)" with an "Enabled" checkbox — I tick it and click "Save
  Schedule". Walk me there step by step, then have me re-open the panel and read the
  checkbox back to confirm it saved. From the next trading day the check runs itself
  at 15:55 ET and writes its result file daily; tell me the file name so I know what
  to look for tomorrow, and remind me to check it. The settings panel is the live
  control — what I see saved there is what the engine obeys.
  DISPUTE = leave it off, keep running it by hand;
  ADJUST: <my words> (for example a different time, or on-but-alert-me-first).
My answer: ACCEPT / DISPUTE / ADJUST.

WHEN ALL FOUR CARDS ARE ANSWERED:
1. Show me a clean numbered record: card, my decision, my words verbatim. Format it so
   I can email it to bob@bobstewart.com exactly as-is.
2. For any card I ACCEPTED that changes a strategy's wording (cards 1-3): show me each
   change as a diff on screen, one at a time, and ask me to approve each one before
   saving anything; they go in one branch and pull request. Tell me the pull request
   address when it exists. Do not merge anything in this session — Bob and I handle
   merges. Card 4, if I accepted it, was already done live on my screen in step-by-step
   fashion above — record in the list exactly what I saw saved.
3. If I DISPUTED or ADJUSTED anything, do not edit any file for that card — my words in
   the record are the outcome, and the study re-runs from them.
```

---

## Notes for Bob (not part of the paste)

- **Scope guard:** the four cards are exactly Dick's four open rulings. The prompt asks
  nothing about parked strategies (Top 40 2.0, High 5, Escalator, Sniper), nothing the
  input review already settled, and nothing from the standing never-re-ask list.
- **Why every card re-opens the file:** three prior briefing premises were refuted by
  live state in past rounds. This prompt never asks Dick to trust a stated number —
  the session must quote the merged file first, and records MISMATCH instead of
  proceeding if the repo disagrees with the prompt.
- **Card 4 is the only behavior change**, and per the repo's own design note on the
  scheduler entry ("the flip is a config change, not a PR", scheduler_config.py:116-117),
  it executes as the Enabled checkbox in the terminal's admin Job Schedules panel —
  the runtime authority is the settings database behind that panel, which OVERRIDES the
  source-file default; a source-only PR could be a silent no-op, which is why the card
  uses the panel and makes Dick read the saved state back. His click IS the recorded
  ruling. The daemon-side wiring is real and verified (autopilot_daemon.py's
  oakwind_investor_exit_check loop dispatches the runner when the schedule is enabled).
- **If Dick prefers paper/email:** each card's "The decision" paragraph + the three-way
  answer line works standalone; the repository quotes can be printed from the three
  merged documents.
- Sealing: if Dick wants the accepted wording changes sealed, his session can follow
  the repo's own /validate then /audit flow afterwards (USERGUIDE.md §9–§10) — that is
  deliberately NOT bundled into this walkthrough; one decision layer at a time.
