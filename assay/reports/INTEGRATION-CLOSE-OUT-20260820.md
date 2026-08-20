# Integration Close-Out — Trader Repo, 2026-08-20

Session record of the trader-repo integration thread that executed the ratified WI-A→WI-F plan (WI-A was completed earlier by the engine thread via PR #919). Everything below was verified firsthand in-session; every hash and merge sha is quotable against the `oakwindholdings/TriSight` repo. All strategies named here are TriSight Sim paper only; no real money anywhere.

## 1. Final state — committed, pushed, merged, deployed

| Item | State | Evidence |
|---|---|---|
| WI-B CAGR reconciliation + WI-C cycle receipt + 36-row intraday ledger delta | **Merged** | PR #920, squash `ad500776746686ec06d00454ae0ff674e625959e`, merged 2026-08-20 18:41:00Z (14:41 ET) |
| WI-D fresh backtest doc + 2 result artifacts + 5 evidence logs + WI-E sandbox doc + status JSON + runner log | **Merged** | PR #921, squash `db73e72175e7e15879d179449f545711fc57bcc8`, merged 2026-08-20 19:11:55Z (15:11 ET) |
| Production deploy of both merges | **Verified in production** | `railway ssh ls` at 15:35 ET: both docs present on the container, file-stamped Aug 20 19:11 UTC (= the #921 merge). Both merges evidence-only, redeploys inert code-wise |
| Merge-window discipline | Held | Both merges landed before the 15:30–16:10 ET no-merge window; session-local 15:28 ET watchdogs armed to disarm auto-merge if checks ran long — both fired as no-ops (already merged) |
| Trader-repo hygiene | Clean | primary checkout on `main` at `db73e721`; merged branches deleted local+remote; zero tracked changes; universe mirror file restored untouched |
| Production writes this session | **Zero** | all reads via `railway ssh cat/ls/tail`; the pre-authorized WI-D container write went unused (see §4.1) |

## 2. Deliverables and hashes of record (all on `oakwindholdings/TriSight` main)

**WI-B** `docs_output/oakwind_swing_cagr_reconciliation_20260820.md` — realized side from the merged 529-row snapshot (`28eaf90a88efaa3ae153a2d6713bf0012b9cc3a8b115a08e592a6818416d3af9`), numerator via the production extractor: **+$9,589.30 on the documented $100k base** (recorded column sums $9,589.21; 9-cent mechanism disclosed — extractor recomputes (exit−entry)×qty unrounded because its key list lacks `realized_pnl_usd`). Window 2026-07-27→2026-08-19 (18 trading days, 23 calendar days). **Annualized +327.7%/yr point, indicative 95% band +152% to +613%** (normal approx, per-trade USD sd $79.48, n=529; assumptions disclosed). WR **59.55%** (315W/213L/1 flat) — inside the after-cost modeled band 55.12–62.85%. Expectancy +0.37%/trade; payoff 1.54 (pct) / 1.55 (USD); breakeven WR 39.42%. Modeled band (modeled_control|baseline_all rows ONLY; limit_active_60m decoys excluded): **+430.6% (15bps) to +1,851.4% (5bps) per year** over 2025-01-02→2026-05-14 — every tier labeled survivor-biased + not-recomputable (125,410-row manifest uncommitted). Windows disjoint (modeled-then-out-of-sample). Date reconciliation: 05-15 = production boundary, not a fill; fills file zero-row until its recorder shipped; first close 07-27; 254-row continuity to one cent (+$5,865.64 vs audit's +$5,865.65). **Verdict: realized point sits below the entire modeled band; statistically inseparable from the 15 bps tier on 18 days.**

**WI-C** `docs_output/oakwind_swing_cycle_verification_receipt_20260820.md` + `oakwind_swing_paper_fills_delta_20260820_intraday.csv` (36 rows, `648cd3b08eafb859851d6a90fe5cb27e2695e1e8ff75c4dbd8f2653842805114`) + manifest. Two bounded production reads, zero writes. Live ledger 565 rows; **the snapshot is a byte-exact prefix** (first 144,501 bytes hash to the snapshot sha); +36 fills 2026-08-20, +$277.47, closes 10:30–13:45 ET; snapshot+delta reconstructs the pull byte-for-byte (`869d36d2e11ae121451031257f436030aa4f050a285db69789c3986f640ba399`). 06:20 run's log entry NOT VERIFIABLE (destroyed by #919's 12:56 ET redeploy); chain observed completing end-to-end 13:20:13→13:24:50 ET (`current=5 next=3`, `ACTIVE_ROWS_PUBLISHED`).

**WI-D** `docs_output/automated_swing_fresh_backtest_20260820.md` + artifacts `auto_swing_phase6_fresh_sealed_window_20260820.json` (`f9e2abb96b0b117d16fc1aa8afbe4b552289fed8f48ebee82830de86e1cbf84b`) and `auto_swing_phase6_fresh_through_present_20260820.json` (`5657e8699d4c3112ab56f08a9118cf282c63ba8f5f9b98431ddfc2180787b7ea`), both verified byte-identical on `main` post-merge. **NEW MEASUREMENT** (the sealed 92.22% stays restated-only; its cache confirmed never in git history):

| | Frozen (restated) | Fresh, sealed window 2021-04-01→2026-04-30 | Fresh, through 2026-08-19 |
|---|---|---|---|
| Trades | 2,107 | **2,032** | 2,133 |
| Win rate | 92.22% | **91.78%** | 91.56% |
| CAGR (model output) | 1,636% | 1,290.9% | 1,172.87% |
| Max DD | 27.6% | 30.06% | 29.82% |
| Avg win / loss | +2.48% / −8.3% | +2.44% / −8.75% | +2.42% / −8.64% |

Fabrication guard held both runs: cache asserted present; `data_source=local_signal_cache`; frozen-ledger fallback branch (`swing_phase6_parity.py:563-565`) not taken. **Payoff bridge:** engine payoff 0.28 → breakeven WR ≈78%; backtest clears (91.78%), realized does not (raw 42.9%, phantom-excluded 76.9%); post-void framing verbatim: the 37 voided rows were phantom stop-out losses, voiding raises WR, real-only P&L negative (−0.44% wk, −0.88% mo/YTD, pre-void 56.7% 59W/45L n=104).

**Input cache preserved (unlike the sealed run):** `backtest_results/swing_dynamic_signals_cache.pkl` on Bob's Mac in the trader checkout — gitignored, 162,967,488 bytes, SHA256 `5c4c95b31c169350145f28d35e364ffdecb9599a4553397d316d3d564d35bda1`, 130,545 signals / 2,027 tickers, built 14:27–14:42 ET on the current volume universe mirror. Losing this file re-creates the 92.22% unrecoverability class — keep it.

**WI-E** `docs_output/oakwind_investor_exit_check_sandbox_20260820.md` + `oakwind_investor_exit_check_status_20260820.json` (`9b38c83a…`) + runner log (`3f2788c6…`). Runner executed locally against byte-exact pulls (input hashes in the doc; before-state reproduction verified to the pre-run pull hash `e90cf9b9…`; after-append `ddafe3f2…`). Result: 2 open paper tranches, both entered 2026-08-12, both **STOP on the 2026-08-19 bar** at recorded geometry stops — ESLT 245 sh @ 770.667954 (paper −$3,746.55), HON 750 sh @ 224.833358 (paper −$3,769.98). Zero unresolved geometry, zero data errors. Seasoning: 91 closed round trips, gate met, flip OFF awaiting Dick.

## 3. Verification record

Three independent adversarial passes preceded every landing (raw outputs delivered to Bob with the package as `review_round1_wib_wic.json` / `review_round2_wid_wie.json`):
- Round 1 (WI-B/WI-C): PASS / PASS_WITH_MINORS ×2 — zero material; 4 minor wording/citation fixes applied pre-PR.
- Round 2 (WI-D/WI-E): caught **2 material** — (a) universe-mirror `generated_at` mislabeled ET when it is a **naive UTC stamp** (reviewer proved the production container clock is UTC by direct inspection — estate-wide implication: every naive `datetime.now()` timestamp production writes is UTC); (b) stale "no scheduler entry" claim — the exit-runner entry EXISTS, `enabled: False`, `scheduler_config.py:108-131`. Both fixed (artifact notes corrected pre-commit, hashes re-pinned) and re-verified CONFIRMED_ALL_FIXED.
- Package audit: caught **3 material** in the cover note itself (session-local watchdog phrased like a platform mechanism; paper qualifiers dropped in §3/§4; verification claims without shipped evidence) — all corrected before delivery to Bob.

## 4. Discoveries (each also saved to the trader-project memory)

1. **`MASSIVE_API_KEY` resolves locally** on Bob's Mac via the repo's own resolver (`gateway/secret_resolver.py` → `~/.trisight/secrets/market_data.env`; source label only, value never touched). The handoff's "Railway-only" premise is stale. Consequence taken: WI-D and WI-E ran entirely locally — zero production writes, no redeploy-wipe race; the pre-authorized container write went unused. Whether the local secrets file stays is Bob's call.
2. **Every merge-redeploy destroys same-day schedule evidence** (ephemeral container log + pool; the log file is git-tracked so deploys ship it with committed content ending ~May and append from boot). Durable cycle evidence = volume-ledger row deltas + order stamps. Design note surfaced (not implemented): a chain-completion marker written to the volume would make receipts durable — production change, owner's decision.
3. **Universe mirror staleness:** the repo-local mirror was 111 days old (2026-05-01, 2,114 tickers); the volume mirror was current (naive-UTC `generated_at` 2026-08-20T08:00:40 = 04:00 ET, matching the documented 04:00 ET server rebuild; 2,058 tickers; −76/+20 delta). A first build attempt on the stale mirror was killed and disclosed (`wid_cache_build_20260820_attempt1_stale_universe.log`); the real build used the pulled current mirror, repo file restored untouched.
4. **Oakwind Investor exits are being run manually in production:** 14 SELL rows dated Aug 3–18 in the production paper ledger carry the exit-runner's own idempotency-key convention (`…:BUY:SELL:<bar-date>`) while its scheduler entry is off — regular manual invocations. Today's sandbox result is exactly what the next manual pass would produce. Material context for Dick's re-enable ruling.
5. One transient `railway ssh` key-verification-service outage mid-session ("key wasn't rejected; check didn't complete") — self-resolved, no rotation needed.

## 5. Dick's open rulings (unchanged; nothing new asked)

1. Designate Oakwind Swing's governing win-rate column (recommendation on record: after-cost executed 62.85%).
2. Judge the WI-B CAGR reconciliation table (now on main).
3. Rule on Oakwind Investor exit-runner re-enable (WI-E before/after + the manual-invocation finding in front of him).
4. Judge the fresh Automated Swing number (91.78% same-window, new measurement).

## 6. Deliberately uncommitted, and where it lives

- The 155 MB signal cache (trader checkout, gitignored, SHA256 pinned above) — **keep**.
- `.data_cache/` per-ticker gateway pickles (4h freshness cache, regenerable).
- The pulled `Snapshots/` Oakwind Investor sandbox copies in the integration worktree (hashes recorded in the WI-E doc).
- The Bob package (md + PDF + 2 review-record JSONs) — delivered to Bob directly; §7 is Bob-only (key-location note), kept out of both repos deliberately.
