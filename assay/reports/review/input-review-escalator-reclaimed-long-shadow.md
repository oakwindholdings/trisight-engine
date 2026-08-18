# Escalator Reclaimed Long Shadow — Input Review Guide
*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

## What this is
We measured what this strategy claims against what it actually did in the shadow paper ledger. Before treating any of this as a final finding, we want you to check every input we used to get there — the claim document, the numbers we pulled from it, the realized ledger, and every problem we flagged along the way. Anything you correct re-runs the comparison automatically, and the original stays visible next to your correction.

## Step 1 — The claim document we used
- Source: `escalator_reclaimed_long_shadow lockdown (audit AUD-20260712121726-59f366, git b5ffd4f)`
- Seal reference: `b0d8e0f6`
- Verbatim excerpt: "Total return 101.6130% | CAGR 2119.6892% | Win rate 62.50% | 264 trades"
- Generation/seal date: not stated in the slice or the report.

**Your review:** Is this the right / best statement of what Escalator Reclaimed Long Shadow claims? If a better or newer claim document exists, name the file path.
- [ ] Confirmed  - [ ] Correction: ______

## Step 2 — The numbers we read from the claim
- Total return: **101.6130%** (raw, verbatim).
  - [ ] Confirmed  - [ ] Correction: ______
- CAGR: **2119.6892%** (raw, verbatim) — normalized to **2119.7%/yr**, method: "stated CAGR fraction; no calendar window declared — return dimension will refuse on window."
  - [ ] Confirmed  - [ ] Correction: ______
- Win rate: **62.50%** (raw, verbatim) — normalized to **0.625** across **264 trades**.
  - [ ] Confirmed  - [ ] Correction: ______
- Trade count: **264 trades** (raw, verbatim).
  - [ ] Confirmed  - [ ] Correction: ______
- Max drawdown: **0.75% over 57 market dates** (raw, verbatim) — no normalization method stated for this figure.
  - [ ] Confirmed  - [ ] Correction: ______

**Your review:** confirm each line above reads correctly, or tell us the correction.

## Step 3 — The time window of the claim
No calendar window is stated for the claim — both the start and end dates are not stated. The claim's own normalization note says: "no calendar window declared — return dimension will refuse on window." That refusal is a direct cause of the return-inflation refusal in Step 6.

**Your review:** if you know the calendar window the backtest covered, state it — this single input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used
- Source: `long-shadow production ledger + repair ledger (fake exit price defect)`
- How pulled: not stated.
- Pull date: not stated.
- Row/trade counts: 66 closed shadow round-trips; a 62-trade repaired subset inside that 66.
- Window: **2026-06-16** to **2026-07-23**.

**Your review:** is this the right ledger? Does a cleaner or more complete record of real fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them
- Realized value (verbatim): "66 closed shadow round-trips; NO complete aggregate figure exists — only a 62-trade repaired subset (-$1,062.34) from the fake-exit-price defect repair; win rate not stated as an aggregate."
- Excerpt (verbatim): "only a partial subset (62 of the 66 closed trades ...) sums to -$1,062.3354 in the repair ledger."
- Annualized return: not stated. Win rate: not stated as an aggregate.

Integrity flags, in plain English:
1. **"claim declines to state a calendar window."** The claim side never says what dates its backtest covers. Direction unknown — it doesn't push the number up or down, it just blocks us from honestly turning the claim's CAGR into a comparable annual return.
2. **"fake-exit-price defect required repair of 62/66 closed trades; complete 66-trade aggregate never stated."** 62 of the 66 closed round-trips had bad exit prices and had to be repaired; those 62 repaired trades sum to a loss of -$1,062.3354. Direction unknown — a complete 66-trade aggregate is never stated in our sources.

**Your review:** per flag — is our reading right? Do you have context that changes it?

## Step 6 — What we computed and what we refused
- **Return inflation: REFUSED (invalid_params).** "Escalator Reclaimed Long Shadow: side not normalizable to annualized return (claim: stated CAGR fraction; no calendar window declared — return dimension will refuse on window; realized: none). A refusal is a finding: this claim cannot be honestly ratioed against reality." Driven by: Step 3 (no window on the claim) and Step 5 (no complete realized aggregate).
- **Win-rate inflation: not computed.** "NOT COMPUTED: a side lacks a stated win rate." Driven by: Step 5 (the realized ledger never states an aggregate win rate).
- Report note: claim and realized windows cover different market regimes by nature (backtest history vs. 2026 paper trading); the rate-vs-rate comparison assumes the claim's rates were offered as forward-looking; and the realized sample is short enough that any ratio should be read as a lower-noise-bound estimate, not a precision measurement.

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock
- If you supply the calendar window the claim's backtest (Step 1/3) actually covered, the return-inflation check becomes computable instead of refused.
- If you supply or confirm a complete 66-trade realized aggregate — total P&L and win rate — for the ledger in Step 4/5, the win-rate check becomes computable and the return comparison can use a real, complete realized figure instead of the partial 62-trade subset.
- If a cleaner or more complete realized ledger exists (Step 4), name it so we can re-run against real fills instead of the shadow paper ledger.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`escalator_reclaimed_long_shadow lockdown (audit AUD-20260712121726-59f366, git b5ffd4f)`**
  → Sealed lockdown artifact recorded in the estate audit trail — the seal line is in the Decisions snapshot: https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md
- **`long-shadow production ledger + repair ledger (fake exit price defect)`**
  → Lives only on the Railway production volume (not web-viewable). Ask Bob for a copy — pulls are read-only and dated.

## How corrections work
To correct anything above, name the file path or state the correction next to the relevant item. The record set is append-only — nothing gets overwritten. Your correction supersedes what we used, but the original stays visible alongside it, and every version is hashed so the whole chain stays auditable. Record hashes for this review: claim `sha256:285c04811c9b77d668d0ceefe4b9e6ce1c3d0a2f4a87182df2c82255b02c1642`, realized `sha256:74ccdec21948257cc2b8ccfde6d44e0120a25d030c3bc7bbc059fe8ddada9955`, verdict `sha256:ed16f819e904d202286c1009dbd3601cec63f3886ca5c2b0da05acac3565ae35`.
