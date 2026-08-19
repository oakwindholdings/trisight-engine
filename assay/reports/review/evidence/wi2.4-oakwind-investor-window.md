# WI-2.4 — Oakwind Investor Daily: backtest calendar window recovered without a fresh run

**Task directive (verbatim, as given):** "Recover Oakwind Investor Daily's backtest calendar window WITHOUT a fresh run, same method: find the committed source CSV/artifact in `trisight-trader` ..., derive `window_from`/`window_to` from first/last dated rows, quote verbatim, reconcile the trade count to the span."

**Why a fresh run is not required:** WI-2.2 already traced this exact strategy's generator chain and found the calendar window is not missing from the codebase — only from the two downstream documents that get shown to Dick. Quoted verbatim from `assay/reports/review/evidence/wi2.2-generators.md:114`:

> "Conclusion: identical pattern to Oakwind Swing — the generator computes and writes the window (2025-01-02 → 2026-05-15, ≈499 days ≈ 1.37 years) into its raw CSV, but the locked-benchmark documentation and the sealed claim both drop it."

And the WI-2.2 summary table row (`wi2.2-generators.md:175`, verbatim):

> "Oakwind Investor Daily | `scripts/supply_demand_oakwind_investor_exit_paper_readiness_pack.py:597,637-638,658` | Yes (`first_entry`/`last_exit`, used for `cagr`) | Yes — `2025-01-02 05:00:00` → `2026-05-15 04:00:00` (`oakwind_investor_exit_paper_readiness_pack_20260518_110211_summary.csv`) | No — `Oakwind_Investor_Daily_Paper_Locked.md` Locked Benchmark table omits it; sealed claim has `window_from/to: null`"

(Filename typo in the WI-2.2 table — the actual committed file is `oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv`, confirmed by direct read below.) This WI independently re-derives the same window from the raw trade-level ledger, not just the aggregate row, and reconciles the trade count.

---

## 1. The sealed claim being reconciled

Source: `assay/phase2/normalized-inputs.json:99-114` (Oakwind Investor Daily, `claim` block), quoted verbatim:

> `"value_raw": "Locked benchmark: Win 50.51%, CAGR 8,728.89%, MaxDD -10.53% — shown to collapse to 673%-891% CAGR when the sibling Swing strategy's own capacity controls are applied to the identical event set"`
> `"win_rate": 0.5051, "win_rate_n": null, "window_from": null, "window_to": null`
> `"normalization_method": "stated CAGR fraction; scenario window not declared in calendar terms — return dimension will refuse on window"`
> `"source_citations": ["Oakwind Investor lockdown doc (locked benchmark)", "trisight-trader/docs_output/oakwind_capped_validation_20260809/00_VALIDATION.md", "orchestration/reports/DEFECT-REGISTRY.md:59-61 (D39 phantom fills 54/104, D40 cap never enforced 54 vs 10, D41 stop-loss erasure)"]`

`win_rate_n` is `null` in the sealed claim. This WI also recovers that value from the same committed artifact as a byproduct of the reconciliation.

## 2. Tracing "Oakwind Investor lockdown doc" to its numeric source

`trisight-trader/docs_output/Oakwind_Investor_Daily_Paper_Locked.md:17,21-23`, quoted verbatim:

> "The locked research benchmark is `fixed_target_2r_control_no_liquidity_5bps`, sourced from the corrected Oakwind Investor Exit + Paper Readiness Pack."
>
> | Metric | Value |
> |---|---:|
> | Win % | 50.51% |
> | CAGR | 8,728.89% |
> | Max DD | -10.53% |

This doc names the scenario (`fixed_target_2r_control_no_liquidity_5bps`) and the source pack ("Oakwind Investor Exit + Paper Readiness Pack") but states no date range and no trade count — exactly the gap WI-2.2 flagged.

## 3. Committed source CSV — aggregate scenario row (`first_entry`/`last_exit`)

File: `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv` (82 lines; header line 1, data line 5 for this scenario).

Row for `scenario_name=fixed_target_2r_control_no_liquidity_5bps`, quoted verbatim (line 5):

```
scenario_name,...,cagr,max_drawdown,input_trades,executed_trades,winning_pct,executed_winning_pct,net_executed_winning_pct,...,first_entry,last_exit,...,calendar_weeks,trades_per_calendar_week,active_entry_weeks,trades_per_active_entry_week,lock_benchmark,exit_variant,starting_capital
fixed_target_2r_control_no_liquidity_5bps,...,87.288888,-0.105303,5278,2055,0.505305,0.507543,0.505109,...,2025-01-02 05:00:00,2026-05-15 04:00:00,...,71.0,28.943662,72,28.541667,frozen_year_arrival_quality_top40,fixed_target_2r_control,100000.0
```

Full raw line (verbatim, all 50 fields):

```
fixed_target_2r_control_no_liquidity_5bps,exit_no_liquidity,fixed_target_2r_control_no_liquidity_5bps|full_oos,100000.0,44444436.18,44444436.18,443.444362,87.288888,-0.105303,5278,2055,0.505305,0.507543,0.505109,10,,,,,5.0,,0,3349414.21,reduce@4%|pause@10%|cooldown=3d|scale=0.50,default,0,323,2371,0,0,0,0,0,529,0,0,2025-01-02 05:00:00,2026-05-15 04:00:00,0.357178,0.008961,0.005,0.01,828.927679,71.0,28.943662,72,28.541667,frozen_year_arrival_quality_top40,fixed_target_2r_control,100000.0
```

Reading the named fields: `cagr=87.288888` (= 8,728.8888% — matches the locked-benchmark doc's "8,728.89%"), `max_drawdown=-0.105303` (= -10.53%, matches), `net_executed_winning_pct=0.505109` (≈ 50.51%, matches the doc's "50.51%"), `executed_trades=2055`, `first_entry=2025-01-02 05:00:00`, `last_exit=2026-05-15 04:00:00`, `calendar_weeks=71.0`, `trades_per_calendar_week=28.943662`.

This is an exact match on all three headline figures in the claim (Win 50.51%, CAGR 8,728.89%, MaxDD -10.53%), which confirms this CSV row is the actual numeric source behind `Oakwind_Investor_Daily_Paper_Locked.md`'s table, not merely a similarly-named artifact.

## 4. Independent cross-check against the trade-level ledger (not just the aggregate row)

File: `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_paper_ledger.csv` (2,056 lines: 1 header + 2,055 data rows).

Filtering to `paper_scenario == fixed_target_2r_control_no_liquidity_5bps` (the scenario named in the locked-benchmark doc) returns **all 2,055 data rows** — i.e. the entire ledger file is this one scenario, and the row count matches `executed_trades=2055` from the aggregate row exactly.

First data row (line 2), quoted verbatim:

```
source_index,ticker,profile,timeframe,entry_at,exit_at,entry_price,exit_price,risk_per_share,allocated_risk_fraction,risk_scale,shares,notional,risk_dollars,pnl_r,gross_pnl_dollars,friction_dollars,net_pnl_dollars,outcome,entry_date,entry_week,entry_month,quality,arrival_quality_atr,prior_median_dollar_volume_20,paper_scenario
0,EMN,daily_one_per_ticker_month,daily,2025-01-02 05:00:00,2025-01-02 05:00:00,88.23,91.613,1.6915,0.01,1.0,591,52143.93,999.6765,2.0,1999.353,53.143607,1946.209393,TARGET_2R,2025-01-02,2024-12-28/2025-01-03,2025-01,1.23839,2.767802,121898359.51,fixed_target_2r_control_no_liquidity_5bps
```

Last data row (line 2056), quoted verbatim:

```
5277,CDE,daily_one_per_ticker_week,daily,2026-05-15 04:00:00,2026-05-15 04:00:00,17.845,17.61,0.9395,0.01,1.0,474340,8464597.299999999,445642.43,-0.250133,-111469.87794318999,8408.86235,-119878.74029318999,TIME_EXIT,2026-05-15,2026-05-09/2026-05-15,2026-05,1.142857,2.698413,319101021.96541286,fixed_target_2r_control_no_liquidity_5bps
```

Programmatic confirmation the file is chronologically ordered and these are the true min/max (`entry_date`/`exit_at` fields, all 2,055 rows scanned):

```
n rows 2055
min entry_date 2025-01-02   max entry_date 2026-05-15
min exit_at    2025-01-02 05:00:00   max exit_at 2026-05-15 04:00:00
sorted (entry_date ascending)? True
```

The trade-level ledger's own first/last dated rows independently reproduce the same window the aggregate `first_entry`/`last_exit` fields report — two different levels of the same committed artifact agree.

## 5. Trade count reconciled to the span

`executed_trades = 2055`. `calendar_weeks = 71.0` (as recorded in the same aggregate row, section 3). This WI independently recomputes both the calendar span and the density figure to confirm they are internally consistent, not merely copied:

- Calendar-day span, `2025-01-02` to `2026-05-15` inclusive of both endpoints: **498 days** → **71.14 weeks** → 2055 / 71.14 = **28.89 trades/week**.
- Unique weekly bins actually populated (`entry_week` column, distinct values): **72** bins, first `2024-12-28/2025-01-03`, last `2026-05-09/2026-05-15` → 2055 / 72 = **28.54 trades/week**.
- The artifact's own stated `trades_per_calendar_week = 28.943662` (71.0 calendar-week denominator, section 3) sits between these two independently recomputed figures (28.89 and 28.54), consistent with a slightly different week-counting convention in the generator (`71.0` calendar weeks vs. this WI's 71.14-week raw span and 72-bin count) rather than a data error — all three land within 1.4% of each other.

Trade count (2,055) is therefore coherent with the recovered span: no scenario-mixing, no truncation, no phantom rows — the full ledger, the aggregate summary row, and independent recomputation all agree to within normal week-boundary rounding.

## 6. Recovered window (verdict)

| Field | Value | Basis |
|---|---|---|
| `window_from` | **2025-01-02** (full timestamp `2025-01-02 05:00:00`) | `first_entry` (aggregate row, §3) = min `entry_date`/`entry_at` (ledger, §4) |
| `window_to` | **2026-05-15** (full timestamp `2026-05-15 04:00:00`) | `last_exit` (aggregate row, §3) = max `exit_at` (ledger, §4) |
| `win_rate_n` (recovered; was `null` in the sealed claim) | **2,055** | `executed_trades` (aggregate row, §3) = row count of the scenario-filtered ledger (§4) |
| Trade-count-to-span reconciliation | **CONSISTENT** | 2,055 trades / ~71–72 weeks ≈ 28.5–28.9/week, matching the artifact's own `trades_per_calendar_week=28.943662` within ~1.4% |

This recovers the window WI-7.1 is blocked on (`ROUND2-DIRECTIVES-QUALITY-MATRIX.md:170`, verbatim requirement: "the caveat text must cite the reconciled `window_from`/`window_to` from WI-2.4's Oakwind Investor artifact — a verdict committed before that window exists is non-compliant"). No fresh backtest run was executed; both figures come from a CSV already committed to `trisight-trader` as of the pack's generation timestamp `2026-05-18T19:43:23` (`oakwind_investor_exit_paper_readiness_pack_20260518_193120_summary.txt:2`).

**What this does NOT establish:** whether `fixed_target_2r_control_no_liquidity_5bps` is an appropriate benchmark to present to Dick as-is (WI-2.2/2.1 already flag that it uses a "frozen_year_arrival_quality_top40" lock benchmark and no liquidity capacity controls, and the same claim's `integrity_flags` note the CAGR collapses to 673–891% once the sibling strategy's own capacity caps are applied). This WI is scoped only to the calendar window and trade-count reconciliation the directive asked for — the CAGR-collapse and D39/D40/D41 integrity findings cited in the sealed claim's `source_citations` are pre-existing and out of scope here.

---

### Sources cited (file:line / path)

- `assay/phase2/normalized-inputs.json:99-114` — Oakwind Investor Daily sealed `claim` block, quoted in full
- `assay/reports/review/evidence/wi2.2-generators.md:114,175` — prior finding that the generator computes and writes the window into its raw CSV, cross-referenced above
- `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md:110,170` — WI-2.4 and WI-7.1 directive text (verbatim quotes above)
- `trisight-trader/docs_output/Oakwind_Investor_Daily_Paper_Locked.md:17,21-23` — locked-benchmark doc naming the scenario and headline figures, no window/count
- `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_scenario_summary.csv:1,5` — aggregate scenario row, `first_entry`/`last_exit`/`executed_trades`/`calendar_weeks`/`trades_per_calendar_week`, quoted verbatim
- `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_paper_ledger.csv:1,2,2056` — trade-level ledger, header + first + last data row, quoted verbatim; scenario-filtered row count independently confirms `executed_trades`
- `trisight-trader/docs_output/oakwind_investor_exit_paper_readiness_pack_20260518_193120_summary.txt:2-17` — pack generation timestamp and per-scenario summary table (`fixed_target_2r_control_no_liquidity_5bps` row) confirming the same figures a third time
