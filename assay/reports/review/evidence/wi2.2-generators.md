# WI-2.2 — Backtest generators: window recording (Oakwind Swing, Oakwind Investor, Escalator Reclaimed Long Shadow)

All three strategies trace to a real generator script in `trisight-trader`. Two of the three generators (Oakwind Swing, Oakwind Investor) DO compute and DO write a calendar window (`first_entry`/`last_exit`) into their raw output CSVs — but that window never survives into the locked-benchmark doc or the sealed claim quoted in WI-2.1. The third (Escalator Reclaimed Long Shadow) never computes a calendar window at all; its generator records a bare day-count (`market_dates`) and nothing else.

---

## 1. Oakwind Swing Trader

**Generator chain:** `scripts/supply_demand_hourly_queue_candidate_validation.py` → `scripts/supply_demand_hourly_queue_priority_pack.py` → `scripts/supply_demand_hourly_production_throttle_pack.py` (`simulate_with_risk_brakes`).

The trader-repo authority doc attributes the exact 15,028/9,408/1851.41% figures to this run:

> "| Queue candidate validation, full OOS, 5 bps | 15,028 trades; 9,408 executed; 67.65% win; 62.85% net executed win; 1851.41% CAGR; -1.65% max drawdown. |"

— `trisight-trader/docs_output/oakwind_swing_trader_validation_package/02_BACKTEST_AUTHORITY_EXTRACTION.md:37`

**Code line that DOES record a window** — the innermost simulator tracks and writes `first_entry`/`last_exit` directly into the result row:

```python
574:        "first_entry": str(first_entry),
575:        "last_exit": str(last_exit),
```

— `trisight-trader/scripts/supply_demand_hourly_production_throttle_pack.py:574-575`

CAGR itself is computed from that same window one line above:

```python
544:    cagr = base.compute_cagr(starting_capital, ending_equity, first_entry, last_exit) if pd.notna(first_entry) and pd.notna(last_exit) else 0.0
```

— `trisight-trader/scripts/supply_demand_hourly_production_throttle_pack.py:544`

**Confirmed present in the actual committed output CSV.** The row matching the claimed trade counts and CAGR carries the window:

```
scenario_name=highest_arrival_quality_candidate, validation_slice=full_oos, friction_bps_per_side=5.0,
trades=15028, executed_trades=9408, cagr=18.514076,
first_entry=2025-01-02 09:30:00, last_exit=2026-05-14 12:30:00
```

— `trisight-trader/docs_output/supply_demand_hourly_queue_candidate_validation_20260518_110211_summary.csv` (row: `scenario_name=highest_arrival_quality_candidate`, `validation_slice=full_oos`, `friction_bps_per_side=5.0`; `cagr=18.514076` = 1851.41%, matching WI-2.1's quoted claim exactly)

**But the window is stripped before it reaches the reported summary.** Both `write_text_summary` functions in the generator chain define an explicit `key_cols`/output-column allowlist that omits `first_entry`/`last_exit`:

```python
210:    key_cols = [
211:        "slice_type",
212:        "validation_slice",
213:        "friction_bps_per_side",
214:        "trades",
215:        "executed_trades",
216:        "winning_pct",
217:        "net_executed_winning_pct",
218:        "cagr",
219:        "max_drawdown",
220:        "avg_executed_per_market_day",
221:        "max_executed_on_one_day",
222:        "ending_equity",
223:        "skipped_daily_loss_stop",
224:    ]
```

— `trisight-trader/scripts/supply_demand_hourly_queue_candidate_validation.py:210-224` (no `first_entry`/`last_exit` key)

**Conclusion:** the window is computed and does exist in the raw CSV (2025-01-02 → 2026-05-14, ≈497 days ≈ 1.36 years — consistent with WI-2.1's arithmetic that 9,408 executed trades requires well over 100 trading days). It was dropped by the reporting layer before reaching `02_BACKTEST_AUTHORITY_EXTRACTION.md` and the sealed claim, which is why the Phase-2 normalized claim carries `window_from: null, window_to: null` with the note `"window NOT stated by the source"` (quoted in WI-2.1) — the source *script* stated it; the source *document* did not.

---

## 2. Oakwind Investor Daily

**Generator:** `scripts/supply_demand_oakwind_investor_exit_paper_readiness_pack.py`, function `_summary_row`.

The trader-repo authority doc attributes the locked benchmark to this pack:

> "The locked research benchmark is `fixed_target_2r_control_no_liquidity_5bps`, sourced from the corrected Oakwind Investor Exit + Paper Readiness Pack."
> "| Win % | 50.51% | | CAGR | 8,728.89% | | Max DD | -10.53% |"

— `trisight-trader/docs_output/Oakwind_Investor_Daily_Paper_Locked.md:17,21-23`

**Code line that DOES record a window:**

```python
637:        "first_entry": str(first_entry),
638:        "last_exit": str(last_exit),
```

— `trisight-trader/scripts/supply_demand_oakwind_investor_exit_paper_readiness_pack.py:637-638`

CAGR is computed from that same span:

```python
597:    cagr = compute_cagr(STARTING_CAPITAL, ending_equity, first_entry, last_exit)
...
658:def compute_cagr(starting_equity: float, ending_equity: float, start_date: pd.Timestamp, end_date: pd.Timestamp) -> float:
...
663:    elapsed_days = max((pd.Timestamp(end_date) - pd.Timestamp(start_date)).days, 1)
664:    return (ending_equity / starting_equity) ** (1.0 / (elapsed_days / 365.25)) - 1.0
```

— `trisight-trader/scripts/supply_demand_oakwind_investor_exit_paper_readiness_pack.py:597,658,663-664`

**Confirmed present in the actual committed output CSV.** The row matching the locked benchmark's exact win rate and CAGR carries the window:

```
scenario_name=fixed_target_2r_control_no_liquidity_5bps, executed_trades=2055, cagr=87.288888,
first_entry=2025-01-02 05:00:00, last_exit=2026-05-15 04:00:00
```

— `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv` (row: `scenario_name=fixed_target_2r_control_no_liquidity_5bps`; `cagr=87.288888` = 8,728.89%, matching `Oakwind_Investor_Daily_Paper_Locked.md:22`'s "CAGR | 8,728.89%")

**But, as with Oakwind Swing, the window never reaches the locked-benchmark doc.** `Oakwind_Investor_Daily_Paper_Locked.md`'s "Locked Benchmark" table (quoted above, lines 19-23) lists only Win %/CAGR/Max DD — no `first_entry`/`last_exit`, no calendar span. The Phase-2 sealed claim for Oakwind Investor Daily inherits that same gap: `window_from: null, window_to: null`, with the annotation `"scenario window not declared in calendar terms — return dimension will refuse on window"` (`assay/phase2/normalized-inputs.json`, Oakwind Investor Daily `claim.normalization_method`).

**Conclusion:** identical pattern to Oakwind Swing — the generator computes and writes the window (2025-01-02 → 2026-05-15, ≈499 days ≈ 1.37 years) into its raw CSV, but the locked-benchmark documentation and the sealed claim both drop it.

---

## 3. Escalator Reclaimed Long Shadow

**Generator chain:** `scripts/escalator_side_family_optimization.py` (input run) → `scripts/escalator_side_profile_hardening.py` (hardening run, function `summarize_daily`).

The trader-repo strategy doc attributes the 264-trade/101.61%/2119.69% figures to this exact chain:

> "Source hardening run: `escalator_side_profile_hardening_20260510_long_short`"
> "Input run: `escalator_side_family_optimization_20260510_long_short_cadence`"
> "Full-window raw results over 57 market dates:"
> "| 264 | 62.50 | 101.6130 | 2119.6892 | 0.7482 |"

— `trisight-trader/docs_output/Escalator_Reclaimed_Long_Shadow.md:80,82,86,90`

**Code line that does NOT record a window** — the summary-row builder records only a day-count, never a calendar `window_from`/`window_to`:

```python
112:def summarize_daily(
113:    daily: pd.DataFrame,
114:    trades: pd.DataFrame,
115:    label: str,
116:    side: str,
117:    window_name: str,
118:    starting_equity: float,
119:    leverage: float,
120:) -> dict[str, Any]:
...
124:    return {
125:        "candidate_id": label,
126:        "side": side,
127:        "window": window_name,
128:        "market_dates": int(len(daily)),
129:        "trade_count": int(len(profits)),
```

— `trisight-trader/scripts/escalator_side_profile_hardening.py:112-129` (note: `window_name` here — e.g. `"FULL"` — is a slice label, not a calendar date; `market_dates` at line 128 is `int(len(daily))`, a count, not a span)

**The trader-repo doc confirms this is a documented, ruled-on gap — not an oversight this WI is surfacing for the first time:**

> "No calendar-day span is stated here because the hardening run's committed manifest (`docs_output/escalator_side_profile_hardening_20260510_long_short_manifest.json`) records `market_dates` only and carries no window endpoints."

— `trisight-trader/docs_output/Escalator_Reclaimed_Long_Shadow.md:101-104`

The same doc also carries an explicit owner ruling on the comparability consequence of annualizing a sub-year sample this way:

> "**Sub-year window qualifier (owner ruling, Dick O'Leary, 2026-08-13).** The CAGR above is annualized from **57 trading days — 22.6% of a 252-day trading year**. ... It is **not comparable to the multi-year CAGRs** shown elsewhere in this terminal."

— `trisight-trader/docs_output/Escalator_Reclaimed_Long_Shadow.md:92-96`

**Conclusion:** unlike the two Oakwind generators, the Escalator Reclaimed Long Shadow generator has no code path that ever computes or stores a calendar window — `first_entry`/`last_exit` do not exist anywhere in `escalator_side_profile_hardening.py`'s summary row. This is the one case of the three where "the window was never computed" is literally true at the code level, not merely dropped downstream, and the trader-repo doc itself already discloses this as a ruled-on defect.

---

## Summary table

| Strategy | Generator | Window computed in code? | Window in raw output CSV? | Window in locked-benchmark doc / sealed claim? |
|---|---|---|---|---|
| Oakwind Swing Trader | `scripts/supply_demand_hourly_production_throttle_pack.py:544,574-575` | Yes (`first_entry`/`last_exit`, used for `cagr`) | Yes — `2025-01-02 09:30:00` → `2026-05-14 12:30:00` (`supply_demand_hourly_queue_candidate_validation_20260518_110211_summary.csv`) | No — dropped by `key_cols` allowlist (`supply_demand_hourly_queue_candidate_validation.py:210-224`); sealed claim has `window_from/to: null` |
| Oakwind Investor Daily | `scripts/supply_demand_oakwind_investor_exit_paper_readiness_pack.py:597,637-638,658` | Yes (`first_entry`/`last_exit`, used for `cagr`) | Yes — `2025-01-02 05:00:00` → `2026-05-15 04:00:00` (`oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv`) | No — `Oakwind_Investor_Daily_Paper_Locked.md` Locked Benchmark table omits it; sealed claim has `window_from/to: null` |
| Escalator Reclaimed Long Shadow | `scripts/escalator_side_profile_hardening.py:112-129` | No — only `market_dates: int(len(daily))`, a count | No — manifest "records `market_dates` only and carries no window endpoints" (doc's own words) | No — and the doc discloses this gap itself with an owner sub-year-comparability ruling |

## E-2 re-run feasibility note

For **Oakwind Swing** and **Oakwind Investor Daily**, an E-2 re-run does not need to reconstruct the window from scratch — the calendar span (`first_entry`/`last_exit`) is already sitting in committed raw CSVs (`supply_demand_hourly_queue_candidate_validation_20260518_110211_summary.csv`; `oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv`) even though it was stripped from the locked-benchmark docs and the sealed claims. For **Escalator Reclaimed Long Shadow**, no such recovery is possible from this generator chain — the window was never computed, only a 57-day count — so an E-2 re-run for that strategy would need to re-derive the calendar span independently (e.g., from the bar cache or trade-log timestamps feeding `escalator_side_family_optimization.py`), not merely re-surface a dropped field.
