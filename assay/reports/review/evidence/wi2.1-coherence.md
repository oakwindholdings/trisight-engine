# WI-2.1 — Coherence: Oakwind Swing Trader trade-count arithmetic

## Claim artifact quote (source of the 15,028 / 9,408 figures)

Sealed Phase-2 normalized input, Oakwind Swing Trader / `claim`:

> "Modeled control ledger, 5bps friction: Win% 67.65%, net executed win% 62.85%, CAGR 1,851.41%, MaxDD -1.65%, 15,028 trades / 9,408 executed (15bps variant: win 55.12%, CAGR 430.61%)"

— `assay/phase2/normalized-inputs.json` (Oakwind Swing Trader Trader `claim.value_raw`)

> "excerpt": "Win% 67.65%, Net executed win% 62.85%, CAGR 1,851.41%, Max DD -1.65%"

— `assay/phase2/normalized-inputs.json` (Oakwind Swing Trader `claim.excerpt`)

The claim's own `window_from`/`window_to` fields are both `null`, and the artifact says so explicitly:

> "normalization_method": "stated CAGR fraction; window NOT stated by the source (artifact generated 2026-05-18, no historical span declared) — return dimension will refuse on window"

— `assay/phase2/normalized-inputs.json` (Oakwind Swing Trader `claim.normalization_method`)

The underlying trader-repo authority doc gives the same trade counts, tagged as a "full OOS" (full out-of-sample) run, not a single-session run:

> "| Queue candidate validation, full OOS, 5 bps | 15,028 trades; 9,408 executed; 67.65% win; 62.85% net executed win; 1851.41% CAGR; -1.65% max drawdown. |"

— `trisight-trader/docs_output/oakwind_swing_trader_validation_package/02_BACKTEST_AUTHORITY_EXTRACTION.md:37`

## Locked strategy parameters used for the arithmetic

From the strategy's locked contract doc:

> "| Timeframe | `60m` | Hourly structure derived from regular-session 15m bars. |"

— `trisight-trader/docs_output/Supply_Demand_Hourly_Paper_Locked.md:29`

> "| Hour cap | `10` | Maximum paper rows per hourly timestamp. |"

— `trisight-trader/docs_output/Supply_Demand_Hourly_Paper_Locked.md:35`

> "| Target pool size | `500` | Same-session Oakwind scan pool size. |"

— `trisight-trader/docs_output/Supply_Demand_Hourly_Paper_Locked.md:23`

The backtest-authority extraction doc restates the timeframe and hour cap identically for the audited/locked behavior:

> "| Timeframe | Hourly, resampled from regular-session 15m bars | `docs_output/Supply_Demand_Hourly_Paper_Locked.md:46`; `docs_output/supply_demand_hourly_paper_locked_ALIGNMENT_AUDIT.md:37` |"
> "| Hour cap | 10 paper rows per hourly timestamp | `docs_output/Supply_Demand_Hourly_Paper_Locked.md:32`; `docs_output/supply_demand_hourly_queue_candidate_validation_20260518_110211_summary.txt:53-54` |"

— `trisight-trader/docs_output/oakwind_swing_trader_validation_package/02_BACKTEST_AUTHORITY_EXTRACTION.md:15,24`

## Arithmetic: why 9,408 executed trades cannot be one day

**Bar count per regular trading session.** Regular US equity market hours are 9:30 AM–4:00 PM ET (a fixed, external, non-strategy-specific fact — not sourced from the estate, used only as the calendar constant needed to convert 60-minute bars to a session count). A 6.5-hour regular session resampled into 60-minute bars (per the quoted `60m ... derived from regular-session 15m bars` timeframe above) yields at most **7 hourly timestamps per trading day** (bars anchored at 9:30, 10:30, 11:30, 12:30, 13:30, 14:30, and a partial 15:30–16:00 bar).

**Ceiling 1 — the hour cap.** The locked contract caps executed paper rows at `10` **per hourly timestamp** (quoted above). So the maximum possible executed trades in a single trading day is:

```
7 hourly timestamps/day × 10 executed rows/hour cap = 70 executed trades/day (maximum)
```

Dividing the claimed executed count by that daily ceiling:

```
9,408 executed trades ÷ 70 executed trades/day (max) = 134.4 trading days (minimum)
```

9,408 is **134x** the single-day ceiling of 70 — it cannot be produced in one day even if every hourly slot on every one of the 7 daily bars hit the cap for the entire session.

**Ceiling 2 — the universe size (independent check, ignoring the hour cap entirely).** The target pool is capped at `500` names (quoted above: "Target pool size | `500`"). Even granting one candidate signal per name per hourly bar with no cap at all:

```
500 names × 7 hourly bars/day = 3,500 maximum possible candidate signals in one day
```

The claimed **executed** count alone (9,408) already exceeds this uncapped, cap-free theoretical ceiling by 2.69x (9,408 ÷ 3,500 = 2.69), and the claimed **total** count (15,028) exceeds it by 4.29x (15,028 ÷ 3,500 = 4.29). Executed trades cannot exceed total candidates generated on the same day, so this second, independent ceiling confirms the first: the 15,028/9,408 figures cannot describe a single trading day under any combination of the strategy's own locked parameters.

**Conclusion.** Two independent parameter-derived ceilings — the hour cap (70/day) and the universe size (3,500/day, uncapped) — both fall an order of magnitude or more short of the claimed 9,408 executed trades. The claim can only be coherent as a multi-day, "full OOS" backtest (consistent with the source doc's own "full OOS" label quoted above), which is exactly why the claim's `window_from`/`window_to` fields being `null` — i.e. no calendar span ever declared — is itself a defect: the artifact reports a return figure (CAGR 1,851.41%) that is mathematically dependent on an elapsed-time span it never states.
