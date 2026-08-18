# Earnings Trader Locked 93 — Input Review Guide
*Draft for Bob's review. Nothing here goes to Dick until Bob signs off.*

## What this is

We measured what this strategy's claim says against what actually happened in the real
world. Before you treat any result as final, we want you to check every input we used to
get there. Anything you correct re-runs the comparison automatically, and the original
value stays visible next to your correction.

## Step 1 — The claim document we used

- Files: `trisight-trader EARNINGS_TRADER_LOCKED_93_CONTRACT.md + STRATEGY_SUMMARY.md`
  and `Audits/2026-07-15_earnings_trader_locked_93_5feacc6/PROOF.md`
- Seal reference: `247c6367`
- Verbatim excerpt: "Events: 93 | Win rate: 92.473% | CAGR: 419.481%"
- Generation/seal date: not stated as a separate field. The audit folder name embeds
  `2026-07-15` — if that is the actual seal date, confirm it below.

**Your review:** Is this the right / best statement of what Earnings Trader Locked 93
claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim

Raw stated value (verbatim): "Events: 93 | Win rate: 92.47% | CAGR: 419.48% | MaxDD:
-4.11% | avg trade +7.77% | profit factor 59.43"

- **Events: 93** — not a normalized figure. Per the claim, this is a *selected* set of
  trades, not every trade the strategy considered.
- **Win rate: 92.47%** — normalized to `0.92473` (92.473%). Plain words: of the 93
  selected events, this share was profitable.
- **CAGR: 419.48%** — normalized to `4.19481` (419.481%/yr). Method used: "stated CAGR
  fraction" — we took the claim's CAGR number as-is and read it as an annual rate.
- **MaxDD: -4.11%** — not separately normalized in our data. Stated as the claim's
  worst peak-to-trough drop.
- **avg trade: +7.77%** — not separately normalized in our data. Stated as-is.
- **profit factor: 59.43** — not separately normalized in our data. Stated as-is.

**Your review:** one confirm/correct line per metric —
- Events (93): [ ] Confirmed  [ ] Correction: ______  |  Win rate (92.47%): [ ] Confirmed  [ ] Correction: ______
- CAGR (419.48%): [ ] Confirmed  [ ] Correction: ______  |  MaxDD (-4.11%): [ ] Confirmed  [ ] Correction: ______
- Avg trade (+7.77%): [ ] Confirmed  [ ] Correction: ______  |  Profit factor (59.43): [ ] Confirmed  [ ] Correction: ______

## Step 3 — The time window of the claim

Stated window: **2022-03-31 to 2026-05-15**.

**Your review:** if you know the calendar window this backtest actually covered, and it
differs from what's shown, tell us — this single input may change how the CAGR should
be read.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

There is no fills ledger, paper P&L file, or physical log for this strategy anywhere in
the estate (status: NOT_FOUND). The document we used to establish that absence:

- File: `trisight-trader/docs_output/zero_fill_investigation_20260731/ZERO_FILL_INVESTIGATION_20260731.md`
- How pulled: not stated
- Pull date: not stated as a separate field (the investigation itself is dated
  2026-07-31)
- Row/trade counts: not stated — zero fills were reported
- Window: not stated (no start or end date given for the realized side)

**Your review:** is this the right investigation to rely on? Does a cleaner or more
complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Realized metrics: none. Status is NOT_FOUND — no value, no win rate, no window was
recorded on the realized side.

Every integrity flag in our data, in plain English:

1. **"93 selected events — selection process undocumented in the claim itself"** (claim
   side) — nobody stated the rule used to pick these 93 trades out of whatever larger
   set existed; direction unknown, could be all trades taken or a favorable subset.
2. **"fleet-wide frozen survivor-biased universe (w4nfwu675)"** (claim side) — the pool
   this claim was tested against was frozen and excludes anything that dropped out
   before the freeze; biases the claim's numbers optimistic.
3. **"ZERO fills have ever occurred since sealing — investigated and confirmed
   2026-07-31"** (realized side) — since this strategy's numbers were locked, not one
   real trade has filled; not a bias, it means there is no live track record to check
   the claim against at all.

**Your review:** per flag — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused

From the inflation report: **REFUSED — missing_data.** "Earnings Trader Locked 93:
claim FOUND, realized NOT_FOUND — no comparison without both sides." The report notes:
"A refusal is a finding: this claim cannot currently be checked against reality, which
is itself the predecessor system's core defect."

One sentence on the input that drove it: the refusal is driven entirely by Step 4/5 —
the realized side is NOT_FOUND because zero fills have ever occurred, so there is
nothing to compare the claim against.

**Your review:** dispute the input, not the arithmetic — which step above would you
change?

## Step 7 — What your feedback can unlock

- If you supply a real fills ledger or paper P&L record for this strategy, a genuine
  claim-vs-realized comparison becomes computable (currently refused for
  missing_data).
- If you supply the rule used to select the 93 events, the "selection process
  undocumented" flag can be resolved and the win rate/CAGR read with a known bias
  direction instead of "unknown."
- If you can identify or confirm the frozen universe reference (`w4nfwu675`) as it
  applies to this strategy, the survivor-bias flag's effect on these specific numbers
  becomes known rather than assumed.
- If you confirm the actual seal/generation date (or correct the 2026-07-15 embedded
  in the audit folder name), Step 1's dating becomes confirmed rather than inferred.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`trisight-trader EARNINGS_TRADER_LOCKED_93_CONTRACT.md + STRATEGY_SUMMARY.md`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/docs_output/EARNINGS_TRADER_LOCKED_93_CONTRACT.md>
- **`Audits/2026-07-15_earnings_trader_locked_93_5feacc6/PROOF.md`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/Audits/2026-07-15_earnings_trader_locked_93_5feacc6/PROOF.md>
- **`trisight-trader/docs_output/zero_fill_investigation_20260731/ZERO_FILL_INVESTIGATION_20260731.md`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/docs_output/zero_fill_investigation_20260731/ZERO_FILL_INVESTIGATION_20260731.md>

## How corrections work

Name a file path or a correction for any item above. The record set is append-only —
your correction supersedes the prior value, but the original stays visible for audit.
Every version is hashed: the claim record for this strategy is
`sha256:3a9d52d6bab32522e79f416d003c7ee3df9c7bb1a22a6bdba5fe31c39e2a965f`, and the
realized record is `sha256:fca5b6a93a34d7f106fccf34d471e44489eee8bb76d05cd1959911a177368f2f`.
