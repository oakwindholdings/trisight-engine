# Manual Swing Trading — Input Review Guide
*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

## What this is

We measured what the Manual Swing Trading claim says against what the production paper
ledger shows actually happened. Before you treat any result as final, we want you to check
every input we used below — the claim document, the numbers we pulled from it, and the
ledger we compared it to. Anything you correct re-runs the study automatically, and the
original input stays visible alongside your correction.

## Step 1 — The claim document we used

- **File:** `manual_swing governed backtest artifact (5yr, 2021-05-18..2026-04-24)`
- **Seal reference:** seal `0d516728`, SEALED 2026-07-17
- **Generation date:** not stated separately — only the seal date (2026-07-17) is in the record
- **Verbatim excerpt:** "N=2,107 trades, WR=92.22%. Production leverage (1x): CAGR +342.39% (realistic 10bps)"
- **Integrity flag on this claim:** the slice flags the backtest universe behind this claim
  as "fleet-wide frozen survivor-biased universe (w4nfwu675)." Plain English: the pool of
  symbols the backtest ran over was frozen at a fixed snapshot and may leave out names that
  were later removed (e.g. delisted or failed) — a known way a backtest universe can flatter
  its own results. Direction not stated in the slice.

**Your review:** Is this the right / best statement of what Manual Swing Trading claims? If a
better or newer claim document exists, name the file path. Is the fleet-wide frozen
survivor-biased universe flag accurate, or do you have context that changes it?
- [ ] Confirmed  - [ ] Correction: ______
- [ ] Integrity flag confirmed  - [ ] Correction/context: ______

## Step 2 — The numbers we read from the claim

Full raw line, verbatim: "N=2,107 trades, WR 92.22%; CAGR +342.39% (realistic 10bps) /
+420.85% (frictionless); MaxDD -14.54% (realistic)" — metric kind: 5-year backtest,
production leverage 1x.

- **Trade count:** N=2,107 trades. Not normalized (raw count, taken as-is).
- **Win rate:** WR 92.22% (2,107 trades). Normalized value: 92.22% — no adjustment made,
  read directly from the claim.
- **CAGR:** +342.39% (realistic 10bps) / +420.85% (frictionless). Normalized to
  342.4%/yr using the "realistic-10bps variant" — the report notes this variant is *more
  favorable to the claim* than the frictions ASSAY would normally apply, i.e. it gives the
  claim the benefit of the doubt, not a stricter reading.
- **Max drawdown:** -14.54% (realistic). Not normalized — no separate normalization method
  stated for this figure.

**Your review:** one confirm/correct line per metric above.
- [ ] Trade count confirmed - [ ] Correction: ______
- [ ] Win rate confirmed - [ ] Correction: ______
- [ ] CAGR confirmed - [ ] Correction: ______
- [ ] Max drawdown confirmed - [ ] Correction: ______

## Step 3 — The time window of the claim

The claim states a window: 2021-05-18 to 2026-04-24.

**Your review:** if you know the calendar window the backtest actually covered, state it —
this single input may unlock the return comparison.
- [ ] Window confirmed as shown  - [ ] Actual window: ______

## Step 4 — The realized ledger we used

- **File:** `/trisight-volume/Snapshots/swing_trade_log.csv`
- **How pulled:** pulled from Railway
- **Pull date:** 2026-08-07
- **Row/trade count:** 259 closed paper trades
- **Window:** 2025-12-29 to 2026-08-06

**Your review:** is this the right ledger? Does a cleaner or more complete record of real
fills exist anywhere? Name it if so.
- [ ] Confirmed  - [ ] Better ledger: ______

## Step 5 — The realized numbers and the known problems with them

Verbatim: "259 closed paper trades: mean +0.517%/trade, median +1.000% — but the D86
synthetic signature (pnl_pct == +1.00% AND days_held == 1) sits on 104/259 rows, and 48
rows are BACKFILL-simulated; no aggregate win rate stated."

Three integrity flags apply to this ledger:

1. **D86 synthetic signature on 104/259 rows.** 104 of 259 rows (40%) show exactly
   +1.00% P&L with exactly 1 day held — a pattern flagged in the Defect Registry as D86.
   Direction unknown from the slice.
2. **48 BACKFILL-simulated rows.** 48 of 259 rows were added via simulated backfill
   rather than recorded as live fills. Direction unknown from the slice.
3. **Rows before ~2026-04-26 backfilled/synthetic.** Everything in the ledger prior to
   that date is backfilled or synthetic, not a live-captured trade. Direction unknown.

**Your review:** per flag above — is our reading right? Do you have context that changes it?
- [ ] Flag 1 (D86 signature) confirmed  - [ ] Correction/context: ______
- [ ] Flag 2 (BACKFILL rows) confirmed  - [ ] Correction/context: ______
- [ ] Flag 3 (pre-2026-04-26 rows) confirmed  - [ ] Correction/context: ______

## Step 6 — What we computed and what we refused

- **Return inflation: REFUSED (invalid_params).** The realized side has no computable
  annualized return — the report says "side not normalizable to annualized return
  (claim: realistic-10bps variant used (more favorable to the claim than ASSAY frictions
  would be); realized: none)." This traces to Step 4/5: the
  ledger's `normalization_method` is not stated ("n/a"), so there is nothing to ratio the
  claim's 342.4%/yr against.
- **Win-rate inflation: NOT COMPUTED.** The report states "a side lacks a stated win
  rate." This traces to Step 5: the realized ledger states no aggregate win rate, only a
  mean and median per-trade return.

**Your review:** dispute the input, not the arithmetic — which step above would you change?

## Step 7 — What your feedback can unlock

- If you supply an aggregate win rate for the realized ledger, the win-rate inflation
  ratio becomes computable.
- If you supply a normalizable annualized-return figure for the realized side (or the
  raw data needed to compute one), the return inflation ratio becomes computable instead
  of refused.
- If you confirm whether the 104/259 D86-signature rows are real trades or
  placeholder/test data, the realized numbers in Step 5 can be corrected.
- If you confirm whether the 48 BACKFILL rows should count as real fills, the trade
  count and averages in Step 5 can be corrected.
- If you confirm what the pre-2026-04-26 backfilled/synthetic rows actually represent,
  the true start of the live track record can be corrected.

## Where the files live — click to open

Every source this guide cites, with a direct link where one exists. You will need to be
signed in to GitHub with your oakwindholdings access for these links to open.

- **`manual_swing governed backtest artifact (5yr, 2021-05-18..2026-04-24)`**
  → Sealed lockdown artifact recorded in the estate audit trail — the seal line is in the Decisions snapshot: https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md
- **`seal 0d516728 SEALED 2026-07-17`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DECISIONS-INBOX.md>
- **`/trisight-volume/Snapshots/swing_trade_log.csv (Railway, pull 2026-08-07)`**
  → <https://github.com/oakwindholdings/TriSight/blob/main/Snapshots/swing_trade_log.csv>
- **`D86 (DEFECT-REGISTRY)`**
  → <https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/evidence/DEFECT-REGISTRY.md>

## How corrections work

Name a file path or a correction for any item above. The record set is append-only —
nothing gets overwritten. A correction supersedes the prior value, but the original stays
visible, and hashes keep every version auditable. Record hashes for this review: claim
`sha256:ef492cb8aa16db2eb6e6015e51c37e0249506501c03f9fb188c7a409a4a5d5f5`, realized
`sha256:b58325e7caad0ae2a88af9658ddee456d29be493b93ac9611249db66d0e12d60`, verdict
`sha256:7fb5cc341fa2e290bd768a4a59c76114b889ba103c998714b4ad9d1d0e03de70`.
