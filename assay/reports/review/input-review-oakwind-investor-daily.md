# Oakwind Investor Daily — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is
We ran ASSAY on Oakwind Investor Daily: what the strategy claims versus what actually
happened in the fills ledger. Before you treat any of these results as final, we want you
to check every input we used to get there. If you correct anything below, the study
re-runs on the corrected input — your correction supersedes what we used, but the
original stays visible next to it.

## Step 1 — The claim document we used
Sources: the Oakwind Investor lockdown doc (locked benchmark), cross-checked against
`trisight-trader/docs_output/oakwind_capped_validation_20260809/00_VALIDATION.md` and
`orchestration/reports/DEFECT-REGISTRY.md:59-61` (logs defects D39, D40, D41).

Verbatim excerpt we pulled: "Win 50.51%, CAGR 8,728.89%, Max DD -10.53%"

Seal reference: not stated. Generation/seal date: not stated.

**Your review:** Is this the right / best statement of what Oakwind Investor Daily
claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim
- **Win rate** — raw: "50.51%". Normalized to 0.5051 (50.51%). Trade count behind this
  figure: not stated.
- **CAGR** — raw: "8,728.89%". Normalized to 8728.9%/yr. Method: stated CAGR fraction;
  the scenario window isn't declared in calendar terms, so the return math in Step 6
  refuses on this input.
- **Max drawdown** — raw: "-10.53%". Not separately normalized or used in the ratio math
  below; carried here for context only.
- The claim document also states this headline is "shown to collapse to 673%-891% CAGR
  when the sibling Swing strategy's own capacity controls are applied to the identical
  event set" — that collapse is part of the raw claim text, not something we calculated.

**Your review:** one confirm/correct line per metric.
- Win rate — [ ] Confirmed  [ ] Correction: ______
- CAGR — [ ] Confirmed  [ ] Correction: ______
- Max drawdown — [ ] Confirmed  [ ] Correction: ______

## Step 3 — The time window of the claim
window_from and window_to are both not stated. The normalization method note says
explicitly: "scenario window not declared in calendar terms — return dimension will
refuse on window." That's not a technicality — it's the reason the return-ratio
computation refuses in Step 6.

**Your review:** if you know the calendar window the backtest covered, state it — this
single input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used
File: `auto_oakwind_investor_paper_fills_log.csv` (CARD-93), cross-referenced with
`orchestration/reports/DEFECT-REGISTRY.md:59` (D39).

This is a reconstructed backlog dated 2026-07-30: 50 closed trades total, over the window
2026-06-17 to 2026-07-30. How it was pulled beyond "reconstructed": not stated.

**Your review:** is this the right ledger? Does a cleaner or more complete record of real
fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them
Realized win rate (REAL-entry-only subset): 0.381 (38.1%), n=21 — "wins=8 (38.1%)." That
same subset shows "+$9,000.49". Realized annualized return: not stated. Realized
normalization method: not stated.

Known problems, one per flag:

**On the claim side:**
1. "headline depends on ABSENT capacity controls (collapses 8728.89%→673-891% under
   sibling's own caps: oakwind_capped_validation_20260809/00_VALIDATION.md)" — plain
   English: apply the sibling Swing strategy's own capacity caps to the same events, and
   CAGR falls from 8728.89% to somewhere between 673% and 891%. Biases the claim upward.
2. "unsealed; fills ledger integrity defects D39/D40/D41 on record" — plain English: the
   claim isn't sealed, and the ledger has three logged defects (D39, D40, D41). Direction
   unknown until those are resolved.

**On the realized side:**
3. "D39: 54/104 live BUY fills phantom (51.9%)" — plain English: just over half of live
   buy fills (54 of 104) never actually happened — no market crossing on the entry day.
   Biases the aggregate win rate upward.
4. "aggregate 68% WR contaminated by phantom entries — REAL-only subset used, which falls
   below the n>=30 floor" — plain English: because the 68.0% aggregate win rate is
   contaminated by those phantom trades, we used only the REAL-entry subset (n=21) —
   cleaner, but under our 30-trade reliability floor.

**Your review:** per flag above — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused
- **Return inflation: REFUSED (invalid_params).** Stated reason: "side not normalizable
  to annualized return (claim: stated CAGR fraction; scenario window not declared in
  calendar terms — return dimension will refuse on window; realized: none)." Driven
  entirely by Step 3 — the missing claim window.
- **Win-rate inflation: not computed.** Stated reason: "NOT COMPUTED: realized population
  21 < declared 30 floor." Driven by Step 4/5 — the ledger only yields 21 clean
  (non-phantom) trades against a 30-trade floor.
- Report note: claim and realized windows cover different market regimes by nature
  (backtest history vs. 2026 paper trading), so any rate comparison assumes the claim
  rates were offered as forward-looking. Realized samples are short — treat any future
  ratio as a lower-noise-bound estimate, not a precision measurement.

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock
- If you supply the calendar window the locked benchmark actually covers (Step 3), the
  return-ratio computation becomes computable instead of refused.
- If you supply enough additional REAL (non-phantom) fills to bring the realized win-rate
  sample past n=30 (currently n=21), win-rate inflation becomes computable.
- If you can confirm whether capacity controls should apply to this strategy, that
  resolves the flag that the 8,728.89% CAGR headline depends on their absence — and could
  correct it toward the 673%-891% range instead.
- If you have context that resolves defects D39, D40, or D41 on the fills ledger, that
  could correct both the phantom-fill count and the realized numbers derived from it.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`Oakwind Investor lockdown doc (locked benchmark)`**
  → Sealed lockdown artifact recorded in the estate audit trail — the seal line is in the Decisions snapshot: https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md
- **`trisight-trader/docs_output/oakwind_capped_validation_20260809/00_VALIDATION.md`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/docs_output/oakwind_capped_validation_20260809/00_VALIDATION.md>
- **`orchestration/reports/DEFECT-REGISTRY.md:59-61 (D39 phantom fills 54/104, D40 cap never enforced 54 vs 10, D41 stop-loss erasure)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DEFECT-REGISTRY.md>
- **`auto_oakwind_investor_paper_fills_log.csv (CARD-93)`**
  → A July-29 production snapshot of this ledger is viewable at <https://github.com/oakwindholdings/TriSight/blob/main/docs_output/d26_lrcx_trigger_forensics_20260729/auto_oakwind_investor_paper_fills_log_PROD_SNAPSHOT_20260729.csv>. The exact 2026-08-07 pull used in this study lives on the Railway volume; ask Bob for it.
- **`orchestration/reports/DEFECT-REGISTRY.md:59 (D39)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DEFECT-REGISTRY.md>

## How corrections work
Name a file path or state a correction against any item above. Our record set is
append-only: your correction supersedes what we used, but the original stays visible next
to it, and every version is hashed so the full history stays auditable. Record hashes on
file: claim `sha256:e4bbf85fb15d17c678c7b80a2c7885ead1a25b96f187fb02105f2ef77138a7f1`,
realized `sha256:b02295e6cb33d58b11979b770214d106b9dae67ba16936dbd8610206e12c3c50`, verdict
`sha256:037fb7e4bfb4c4b15be9f6b9e08d8c3c82f0f0a8da8edbbe2b98ccc6f3169c34`.
