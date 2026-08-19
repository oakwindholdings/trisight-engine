# WI-2.4 — Oakwind Swing Trader: backtest calendar window recovery (no fresh run)

## Task

Recover Oakwind Swing Trader's backtest calendar window without executing a fresh backtest. The claim artifact (`assay/phase2/normalized-inputs.json`, index 2, `strategy: "Oakwind Swing Trader"`) states:

> `"value_raw": "Modeled control ledger, 5bps friction: Win% 67.65%, net executed win% 62.85%, CAGR 1,851.41%, MaxDD -1.65%, 15,028 trades / 9,408 executed (15bps variant: win 55.12%, CAGR 430.61%)"`
> `"window_from": null, "window_to": null`
> `"normalization_method": "stated CAGR fraction; window NOT stated by the source (artifact generated 2026-05-18, no historical span declared) — return dimension will refuse on window"`
> `"source_citations": ["Oakwind Swing lockdown/backtest artifact (commit b5ffd4f lineage, generated 2026-05-18T14:33:54)", "Audits/ seal 915248a6 signed Dick O'Leary 2026-07-12T12:55:29Z"]`

## Trace: lockdown doc → evidence file → committed source CSV

`trisight-trader/docs_output/Supply_Demand_Hourly_Paper_Locked.md` (System Name: Oakwind Swing Trader, Registry ID `supply_demand_hourly_paper_locked`) lines 189–200, "Validation Evidence":

> `"| modeled control | 5 bps | 15,028 | 9,408 | 67.65% | 62.85% | 1851.41% | -1.65% |"`
> `"Evidence file: docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_summary.txt."`

That summary.txt (`trisight-trader/docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_summary.txt`, line 1–2) is:

> `"Supply/Demand Hourly Final Trigger Attribution Audit"`
> `"Generated: 2026-05-18T14:33:54"`

— matching the claim's `source_citations` timestamp exactly. Its "Baseline Capital Rows" table (lines 24–25 of that file) reads:

> `" modeled_control                    5.0   15028             9408      67.65%                   62.85% 1851.41%       -1.65%     5698910.00"`

This aggregate table is generated from the companion **committed** CSV, which carries the per-scenario window fields the .txt summary drops:

`trisight-trader/docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_baseline_capital.csv` (git-tracked, committed at `0432e11a838c793e59bd5e14a4a9767910060a33`, "Lock supply demand hourly paper mode", 2026-05-18 15:53:47 -0400 — `trisight-trader` repo).

Header (line 1) + the `modeled_control|baseline_all|5bps` data row (line 2), verbatim:

```
profile,...,input_trades,executed_trades,executed_winning_pct,net_executed_winning_pct,...,first_entry,last_exit,...,trades,winning_pct,...,market_days,days_with_entries,avg_executed_per_market_day,avg_executed_per_active_day,median_executed_per_active_day,p90_executed_per_active_day,max_executed_on_one_day,...
final_trigger_attribution|modeled_control|baseline_all|5bps,0.01,10,,5.0,100000.0,5698910.0,5698910.0,55.9891,18.514076,-0.016488,1122.891875,9975,9408,0.673044,0.628508,1084573.05,557,10,0,0,0,0,0,9382,638,5053,2025-01-02 09:30:00,2026-05-14 12:30:00,0.446088,0.01,0.01,0.01,10000000.0,0.01,0.1,0.097364,0.002328,0,0,0,15028,0.676537,0.350413,0.522201,1,hourly_final_trigger_attribution_audit,final_trigger_attribution,modeled_control|baseline_all,Full unchanged final candidate stream.,trail_1r_after_1r,stop_pct_top40,full_walk_forward_applications,full_walk_forward,prior_period_by_application,15028,100000.0,355,341,26.501,27.589,27.0,40.0,54,highest_arrival_quality_first,10,0.02,0.454739,4861,modeled_control,baseline,baseline_all,all,,current_modeled_entry,stop_pct_top40,highest_arrival_quality_first
```
(`trisight-trader/docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_baseline_capital.csv:2`)

Field-by-field reconciliation against the claim (all from the same row):

| Claim field | Claim value | CSV field | CSV value |
|---|---|---|---|
| trades | 15,028 | `trades` | `15028` |
| executed | 9,408 | `executed_trades` | `9408` |
| Win% | 67.65% | `winning_pct` | `0.676537` |
| net executed win% | 62.85% | `net_executed_winning_pct` | `0.628508` |
| CAGR | 1,851.41% | `cagr` | `18.514076` (×100) |
| MaxDD | -1.65% | `max_drawdown` | `-0.016488` (×100) |

Every figure in the claim reconciles exactly to this committed row — this is unambiguously the source of the 15,028/9,408 numbers, and it carries the two window fields the lockdown doc's prose table dropped: `first_entry = 2025-01-02 09:30:00`, `last_exit = 2026-05-14 12:30:00`.

## Recovered window

- **window_from = 2025-01-02** (`first_entry`, 09:30:00 — the opening bell)
- **window_to = 2026-05-14** (`last_exit`, 12:30:00 — an intraday hourly-bar exit timestamp, consistent with the strategy's hourly candle structure)
- Span: ~16.4 months (2025-01-02 → 2026-05-14), consistent with `market_days = 355` in the same row.

These are the modeled-control ledger's actual first-trade-entry and last-trade-exit timestamps as computed by the same run (`supply_demand_hourly_final_trigger_attribution_audit.py`, generated 2026-05-18T14:33:54) that produced the 15,028/9,408/CAGR/MaxDD figures the claim quotes — not a re-derived or re-run value.

Corroborating context (same audit run, `trisight-trader/docs_output/supply_demand_hourly_modeled_entry_execution_protocol_pack_20260518_131600_summary.txt:6`, upstream candidate-pool coverage before the final trigger-attribution filter):

> `"Coverage: {'year_counts': {2024: 25254, 2025: 42358, 2026: 16049}, 'period_counts': {'year_2024_to_year_2025': {'fit_rows': 25254, 'application_rows': 42358}, 'years_2024_2025_to_year_2026': {'fit_rows': 67612, 'application_rows': 16049}}}"`

This confirms the walk-forward design uses 2024 as a fit-only year (25,254 candidate rows never entered as trades) and treats 2025–2026 as the out-of-sample application period — consistent with the modeled-control ledger's trade window starting 2025-01-02, not 2024.

## Reconciling Dick's "9,408 in one day is unlikely" concern

The same `baseline_capital.csv` row (line 2) carries the daily-distribution fields directly:

- `market_days = 355`
- `days_with_entries = 341`
- `avg_executed_per_market_day = 26.501`
- `avg_executed_per_active_day = 27.589`
- `median_executed_per_active_day = 27.0`
- `p90_executed_per_active_day = 40.0`
- `max_executed_on_one_day = 54`

9,408 executed trades are spread across **341 distinct active days** within the ~16.4-month window, averaging ~27.6 executions per active day (median 27), with a maximum of **54** trades on the single busiest day. This directly resolves the concern: the 9,408 figure was never a single-day count — it is the ledger's full-window executed-trade total across 341 trading days, at a rate consistent with the strategy's own locked hourly cap (10 paper rows per hourly timestamp, ~6.5 regular-session hours/day → a ceiling around 65/day, comfortably above the observed max of 54 and average of ~27.6).

**Trade-count reconciliation: CONFIRMED.** The 15,028 / 9,408 figures, the win/CAGR/drawdown figures, and the daily distribution all originate from one committed, git-tracked row (`supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_baseline_capital.csv:2`) generated by the same run — no arithmetic or provenance gap.

## What this does NOT establish

- This is the **modeled control** ledger's window, not the strategy's live/paper production window (that is `realized.window_from = 2026-05-15`, `realized.window_to = 2026-08-06` per the same normalized-inputs.json entry — i.e., the modeled-control backtest window ends 2026-05-14, one day before the paper-fills production window begins 2026-05-15; the two are sequential, not overlapping).
- A prior estate audit (`trisight-trader/docs_output/sme_s3_backtest_validity_20260807/00_AUDIT.md:44,494`) stated: *"Oakwind Swing Trader | 9,408 executed | not stated in the lockdown | — | not stated"* and *"Oakwind Swing Trader's validation window is not in the record. Its lockdown gives trade counts without dates, and the estate could not locate a span in the committed evidence."* That audit examined the lockdown doc's prose table (`Supply_Demand_Hourly_Paper_Locked.md`, which indeed omits calendar dates) and the `.txt` summary (which also omits them) — it did not open the companion `_baseline_capital.csv`, where `first_entry`/`last_exit` are present as columns. This recovery closes that gap using a file already in the commit the prior audit cites, without a fresh run.
- `first_entry`/`last_exit` are the modeled-control ledger's own first and last trade timestamps as computed by that run — they are not independently re-verified against raw Massive/Polygon intraday bars in this pass (that would require the underlying manifest CSV, `supply_demand_hourly_modeled_entry_execution_protocol_pack_20260518_131600_manifest.csv`, which per the coverage table in `docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_summary.txt` has 125,410 rows but is not itself committed to the repo — only its aggregate outputs are).

## Sources (all `trisight-trader` repo, committed at `0432e11a838c793e59bd5e14a4a9767910060a33`)

- `docs_output/Supply_Demand_Hourly_Paper_Locked.md:189-200` (lockdown doc, Validation Evidence table + evidence-file pointer)
- `docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_summary.txt:1-2,24-25` (generation timestamp + Baseline Capital Rows table)
- `docs_output/supply_demand_hourly_final_trigger_attribution_audit_20260518_143233_baseline_capital.csv:1-2` (committed source CSV — carries `first_entry`, `last_exit`, and the daily-distribution fields)
- `docs_output/supply_demand_hourly_modeled_entry_execution_protocol_pack_20260518_131600_summary.txt:6` (upstream candidate-pool year coverage, corroborating the 2025–2026 application window)
- `docs_output/sme_s3_backtest_validity_20260807/00_AUDIT.md:44,494` (prior estate audit that had marked the window "not stated"/"not in the record" — superseded by this recovery)
- `assay/phase2/normalized-inputs.json` (index 2, Oakwind Swing Trader claim/realized entries — `trisight-engine` worktree)
