# WI-4.2 — Automated Swing Claim Provenance: Confirm or Refute Shared Lineage with Manual Swing

## The claim under test

`assay/phase2/normalized-inputs.json`, array index 9, `strategy: "Automated Swing Trading"`, `claim` object:

```json
{
  "strategy": "Automated Swing Trading",
  "seal_ref": "5a60b8b9",
  "claim": {
    "status": "FOUND",
    "value_raw": "N=2,107, WR 92.22% | CAGR 1x +420.85% | 2x +2,304.32% frictionless / +1,636.16% realistic-10bps",
    "metric_kind": "5-year backtest (shares ledger lineage with Manual Swing)",
    "annualized_return": 4.2085,
    "normalization_method": "1x CAGR as stated; WINDOW derived only from a ledger filename (2021-2026, no exact dates) — return dimension will refuse on window",
    "win_rate": 0.9222,
    "win_rate_n": 2107,
    "window_from": null,
    "window_to": null,
    "integrity_flags": [
      "window known only from filename",
      "fleet-wide frozen survivor-biased universe (w4nfwu675)"
    ],
    "source_citations": [
      "backtest_results/manual_swing_phase6* ledger artifacts",
      "seal 5a60b8b9 SEALED 2026-07-17"
    ],
    "excerpt": "N=2,107 trades, WR=92.22% | CAGR 1x=+420.85%"
  }
}
```

Quoted verbatim from `/Users/bobstewart/dev/trisight/trisight-engine/.claude/worktrees/optimistic-babbage-a859bb/assay/phase2/normalized-inputs.json`, entry index 9.

## Verdict: CONFIRMED — the shared lineage is real, and it is stronger than "shares lineage": there is no distinct Automated-Swing-specific backtest artifact at all. Automated Swing's own production code cites the identical Manual Swing ledger as its own backtest authority.

## Evidence chain

### 1. The cited artifact exists and its numbers match the claim exactly

File: `/Users/bobstewart/dev/trisight/trisight-trader/backtest_results/manual_swing_phase6_parity_2021_2026.json`

Read directly (Python `json.load`):
```
artifact: manual_swing_phase6_parity_2021_2026
sha256: c23383bf0f3517a5e0946f0bd4d56e1d55f513afed2cf42668b0077592d012d8
start_date/end_date: 2021-04-01 2026-04-30
engine: manual_swing_phase6_v2_parity
total_trades: 2107
win_rate: 92.22
frictionless: {'win_rate': 92.22, 'cagr_1x_pct': 420.85, 'max_drawdown_1x_pct': 13.2, 'cagr_2x_pct': 2304.32, 'max_drawdown_2x_pct': 25.3}
realistic_10bps: {'win_rate': 92.22, 'cagr_1x_pct': 342.39, 'max_drawdown_1x_pct': 14.54, 'cagr_2x_pct': 1636.16, 'max_drawdown_2x_pct': 27.6}
```

Every number in the claim's `value_raw` (`N=2,107, WR 92.22% | CAGR 1x +420.85% | 2x +2,304.32% frictionless / +1,636.16% realistic-10bps`) is present verbatim in this file: `total_trades: 2107` matches `N=2,107`; `win_rate: 92.22` matches `WR 92.22%`; `frictionless.cagr_1x_pct: 420.85` matches `CAGR 1x +420.85%`; `frictionless.cagr_2x_pct: 2304.32` matches `2x +2,304.32% frictionless`; `realistic_10bps.cagr_2x_pct: 1636.16` matches `+1,636.16% realistic-10bps`.

The artifact's own `engine` field is literally `"manual_swing_phase6_v2_parity"` — this ledger is self-identified as the Manual Swing engine's parity backtest, not an Automated Swing backtest.

### 2. No distinct Automated-Swing-specific backtest artifact exists anywhere in the trader repo

```
$ find /Users/bobstewart/dev/trisight/trisight-trader/backtest_results -iname "*swing*"
backtest_results/manual_swing_phase6_parity_2021_2026.json
backtest_results/swing_filter_grid.csv
backtest_results/swing_production_parity_20260424_191128.csv
backtest_results/swing_production_parity_DYNAMIC_20260424_203445.csv
backtest_results/swing_trades_enriched.csv
backtest_results/swing_trades_full.csv
backtest_results/swing_trades_full_bj.csv
```

Full `ls backtest_results/` (150+ files) contains zero files named `automated_swing*` or any other `auto*swing*` backtest ledger. A separate `find` across the whole repo (excluding worktrees/recovered snapshots) for `auto*swing*.json` turns up only runtime/operational artifacts — `Snapshots/auto_swing_position_state.json`, `Audits/validate_automated_swing_trading_*_VR-*.json` (validation-run records, not backtests), `docs_output/automated_swing_trading_validation_package/auto_swing_trade_log_dedupe_20260526.json` (a live paper-trade-log dedupe artifact) — none of which is a 5-year backtest ledger. There is no `automated_swing_phase6_parity` file or equivalent anywhere.

### 3. Automated Swing's own production source code cites this exact Manual Swing ledger as its performance authority — this is not an inference, it is stated in the file

`/Users/bobstewart/dev/trisight/trisight-trader/Target_Strategies/automated_swing_trading.py:7-10` (docstring):
> "IDENTICAL signal logic to Manual Swing Trading (same Phase 6 v2 stack). THE ONLY DIFFERENCE: this strategy auto-places BUY/SELL orders to TradeStation on entry/exit, instead of waiting for manual click in the trade modal."

`automated_swing_trading.py:74-78`:
> "PHASE 6 v2 BACKTEST PERFORMANCE (5 years, dynamic Top-100 universe): N=2107 WR=92.22% CAGR1x=+420.85%/DD13.20% CAGR2x=+2304.32%/DD25.30% C/D=91.09 / Realistic 10bps asymm slippage: CAGR2x +1636.16% / DD 27.60% / C/D 59.28 / Walk-forward H1 IS +1085.47% CAGR2x; H2 OOS +4791.71% CAGR2x; both halves strongly + / vs prior production anchor: WR +49pp, CAGR2x +2264pp, DD2x -29.6pp, C/D 123x"

This is the automated strategy's own file, publishing the exact same N=2107 / WR=92.22% / CAGR figures as the ledger above. The docstring does not say Automated Swing was independently backtested — it presents the shared Phase 6 v2 detection/risk stack (verified value-identical in `wi4.1-param-diff.md`) as justification for reusing the one ledger.

`manual_swing_trading.py:49-52` publishes the identical block verbatim:
> "PHASE 6 v2 BACKTEST PERFORMANCE (5 years, dynamic Top-100 universe): N=2107 WR=92.22% CAGR1x=+420.85%/DD13.20% CAGR2x=+2304.32%/DD25.30% C/D=91.09"

`manual_swing_trading.py:637`: `from swing_phase6_parity import STARTING_BALANCE as _PHASE6_V2_STARTING_BALANCE` — Manual Swing explicitly names `swing_phase6_parity.py` (the script, at `/Users/bobstewart/dev/trisight/trisight-trader/swing_phase6_parity.py`, `STARTING_BALANCE = 100_000.0` at line 26) as the generator of the ledger. There is no `automated_swing_phase6_parity.py` counterpart script in the repo (`find . -iname "*phase6_parity*"` in the trader repo returns only `swing_phase6_parity.py` and its compiled `.pyc`, plus the one JSON output already cited).

`automated_swing_trading.py:14-17` (docstring `VALIDATED SPECS`):
> "Glossary Item #79 (2026-04-18) — original production spec / Phase 6 v2 Lockdown (2026-04-26) — see docs_output/MANUAL_SWING_LOCKDOWN_SPEC.md / Auto-Trade Layer (2026-04-26) — clone of manual_swing_trading.py with auto-execute"

The word "clone" is Automated Swing's own self-description in its own docstring: it is presented as a clone of `manual_swing_trading.py` with an auto-execute layer added on top, not as an independently developed/backtested strategy.

### 4. Corroborating: the same ledger is separately cited for the leverage ratification that applies to both files identically

`automated_swing_trading.py:419-422`:
> "Dick round-17 ratification (2026-07-17, verbatim owner ruling): LEVERAGE 2.0 -> 1.0, matching manual_swing_trading.py's twin change and High 5's CARD-66 precedent."

`manual_swing_trading.py:149-154`:
> "Dick round-17 ratification (2026-07-17, verbatim owner ruling): LEVERAGE 2.0 -> 1.0, matching automated_swing_trading.py's twin change and High 5's CARD-66 precedent. Parity benchmark (backtest_results/manual_swing_phase6_parity_2021_2026.json) already carries validated 1x numbers under both cost models: realistic 10bps 1x CAGR 342.39% / maxDD -14.54%; frictionless 1x CAGR 420.85% / -13.2%."

Manual Swing's own comment names `backtest_results/manual_swing_phase6_parity_2021_2026.json` as the source of the 1x numbers used to justify the leverage change in *both* files — again the one shared artifact, not two.

## Conclusion (answering WI-4.2 directly)

The normalized-inputs.json claim's `metric_kind` label — `"5-year backtest (shares ledger lineage with Manual Swing)"` — is CONFIRMED, and understates the finding: Automated Swing does not merely "share lineage" with a related-but-distinct Manual Swing backtest. There is no Automated-Swing-specific backtest ledger in the repo at all. `backtest_results/manual_swing_phase6_parity_2021_2026.json` — an artifact whose own `engine` field says `manual_swing_phase6_v2_parity` and whose generating script is `swing_phase6_parity.py` (no `automated_` counterpart exists) — IS the sole source for the N=2,107/WR=92.22%/CAGR figures republished verbatim in Automated Swing's own docstring (`automated_swing_trading.py:74-78`). Automated Swing's own docstring self-identifies the file as a "clone of manual_swing_trading.py with auto-execute" (`automated_swing_trading.py:17`) built on "IDENTICAL signal logic" (`automated_swing_trading.py:8`) — which `wi4.1-param-diff.md` confirms by direct constant-for-constant comparison of the two files' `LOCKED PRODUCTION PARAMETERS` blocks. No refuting evidence — i.e., no independent Automated-Swing backtest with its own numbers — was found anywhere in the trader repo, its `backtest_results/`, `docs_output/`, `Audits/`, or `Snapshots/` directories.

## Caveat carried forward (not this WI's scope, but material to how the claim should be read)

The `integrity_flags` in the normalized-inputs.json entry — "window known only from filename" and "fleet-wide frozen survivor-biased universe (w4nfwu675)" — are independent data-quality concerns about the shared ledger itself (window precision, universe survivorship bias) and are unaffected by this provenance finding; confirming shared/identical lineage does not resolve those flags, it only confirms the claim's stated source relationship is accurate.
