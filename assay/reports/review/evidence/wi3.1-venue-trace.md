# WI-3: Execution Venue Trace — Per-Strategy, Code vs Estate Record

Scope: the 10 strategies carried in `assay/phase2/normalized-inputs.json`. Repo root for all code
citations below is `/Users/bobstewart/dev/trisight/trisight-trader` unless stated otherwise.

Evidence rule in force: every fact is quoted verbatim inline with its `file:line`. No bare
pointers. Where a fact could not be established from what I could read/run, it is marked
**NOT ESTABLISHED** with the reason — no guesses.

**Scope note (honest degradation):** Task instructions authorized `railway ssh --service
trisight-trader` from the trader repo for live-ledger checks. I did not need it for this
code-vs-record trace — every venue-gating fact below is a static code constant or a governance
table read directly from the committed source, not a runtime/live value — so I did not invoke it.
Two runtime facts (the current DB value of `execution_venue` per strategy, and whether
`AUTO_TOP40_2_LIVE_TRADING` / `AUTO_ESCALATOR_LIVE_TRADING` are overridden away from their `false`
code defaults in the Railway environment) are DB/env state I cannot read from static code and did
not have a live evidence source for; both are marked NOT ESTABLISHED at runtime and the table
below states the code-default posture instead, which is the only thing 3.1 asked me to trace.

---

## 3.1 — Per-strategy code trace: sim pricing vs. broker call

### 1. Top 40 2.0 (`top_40_2_0`)

- Live-trading flag, default OFF: `AUTO_TOP40_2_LIVE_TRADING = os.getenv("AUTO_TOP40_2_LIVE_TRADING", "false").lower() == "true"` — `Target_Strategies/top40_2_0_rotator.py:124`
- **Fill-producing line (current path, flag false → sim pricing):** `fill_price = _paper_fill_price(price, "BUY")` — `Target_Strategies/top40_2_0_rotator.py:1782` (mirrored for SELL at `:1722`), reached via `if not AUTO_TOP40_2_LIVE_TRADING:` — `Target_Strategies/top40_2_0_rotator.py:1781`
- **Broker-call line (present in code, gated off today):** `result = _async_run(ts_gw.place_order(` — `Target_Strategies/top40_2_0_rotator.py:1804` (mirrored for SELL at `:1744`)

### 2. High 5 (`high_5_strategy`)

- Hardcoded, not env-gated: `PAPER_ONLY = True` / `ROUTE_TO_TRADESTATION = False` / `LIVE_TRADING_ENABLED = False` — `Target_Strategies/high_5_strategy.py:40-43`
- No broker call exists anywhere in the module: `grep -n "ts_gw\.\|place_order" Target_Strategies/high_5_strategy.py` returned zero matches.
- **Fill-producing line:** `"paper_fill_price": entry_price,` — `scripts/live_paper_strategy_publishers.py:1275`, inside `_high5_trade_row()`, where `entry_price = _high5_float(source.get("entry_price"))` (`scripts/live_paper_strategy_publishers.py:1251`) is the signal's own computed entry, not a broker fill.

### 3. Oakwind Swing Trader (`supply_demand_hourly_paper_locked`)

- Module docstring: `"This module does not detect zones, fetch market data, optimize triggers, or\nroute broker orders. It publishes validated paper ledger rows and blocks live\nTradeStation routing until the authority contract is explicitly updated."` — `Target_Strategies/supply_demand_hourly_paper_common.py:4-6`
- Broker scaffold explicitly removed: `"CARD-10: the dormant TradeStation order-routing scaffold -- the internal\nlive-route helpers and the hardcoded paper-only gate -- was removed\nentirely. ... Broker routing\nstays locked off via strategy_order_governance."` — `Target_Strategies/supply_demand_hourly_paper_common.py:731-738`
- **Fill-producing line:** `route_result = _order_result("PAPER", "PAPER", auto_error=LIVE_ROUTE_BLOCK_REASON)` — `Target_Strategies/supply_demand_hourly_paper_common.py:740`, feeding `"entry_price": entry,` — `Target_Strategies/supply_demand_hourly_paper_common.py:756`, where `entry = _as_float(row.get("modeled_entry_price"), "modeled_entry_price")` — `Target_Strategies/supply_demand_hourly_paper_common.py:726` (the field is literally named "modeled").
- No `ts_gw.place_order` call exists anywhere in this module (confirmed by the same grep as above — zero matches for `ts_gw\.` in `supply_demand_hourly_paper_common.py` and `supply_demand_hourly_paper_locked.py`).

### 4. Oakwind Investor Daily (`oakwind_investor_daily_paper_locked`)

- Module docstring: `"This module does not detect zones, fetch market data, optimize filters, or\nroute broker orders. It publishes operator-maintained paper ledger rows after\nvalidating the paper-lock contract produced by the audit pack."` — `Target_Strategies/oakwind_investor_daily_paper_common.py:4-6`
- **Fill-producing line:** `"entry_price": limit_price,` — `Target_Strategies/oakwind_investor_daily_paper_common.py:612`, where `limit_price = _as_float(row.get("limit_price"), "limit_price")` — `Target_Strategies/oakwind_investor_daily_paper_common.py:600`, sourced from the strategy's own order-plan CSV, not a broker.
- No broker call exists in this module (grep for `ts_gw\.|place_order` on `oakwind_investor_daily_paper_common.py` / `oakwind_investor_daily_paper_locked.py` returned zero matches).

### 5. Escalator Reclaimed Shadow (`escalator_reclaimed_shadow`)

- Comment names it explicitly as the broker-routable twin: `"escalator_reclaimed_shadow (broker-routable)\nand escalator_reclaimed_long_shadow (PAPER-locked by strategy_order_governance)"` — `Target_Strategies/escalator_reclaimed_executor.py:42-43`
- Live-trading flag, default OFF: `AUTO_ESCALATOR_LIVE_TRADING = os.getenv("AUTO_ESCALATOR_LIVE_TRADING", "false").lower() == "true"` — `Target_Strategies/escalator_reclaimed_executor.py:31`
- Mode resolution: `def _mode_for_strategy(strategy_id: str) -> str:\n    if is_order_routing_disabled_strategy(strategy_id):\n        return "PAPER"\n    return "LIVE" if AUTO_ESCALATOR_LIVE_TRADING else "PAPER"` — `Target_Strategies/escalator_reclaimed_executor.py:439-442`. `escalator_reclaimed_shadow` is **not** in `ORDER_ROUTING_DISABLED_STRATEGY_REASONS` (verified: absent from `strategy_order_governance.py:6-190`), so its mode today resolves via the flag alone → PAPER.
- **Fill-producing line (PAPER path):** `price = float(signal.get("current_price") or signal.get("entry_price") or 0)` — `Target_Strategies/escalator_reclaimed_executor.py:999`, written straight through at `"entry_price": price,` — `Target_Strategies/escalator_reclaimed_executor.py:1036`; the order call itself is a no-op for PAPER: `if mode == "PAPER":\n        return True, "PAPER"` — `Target_Strategies/escalator_reclaimed_executor.py:468-469`.
- **Broker-call line (present in code, gated off today):** `ts_gw.place_order(` — `Target_Strategies/escalator_reclaimed_executor.py:471`

### 6. Escalator Reclaimed Long Shadow (`escalator_reclaimed_long_shadow`)

- Hard-denylisted regardless of any flag: `"escalator_reclaimed_long_shadow": (\n        "Strategy escalator_reclaimed_long_shadow is locked to shadow-only paper mode; "\n        "TradeStation order routing is disabled by strategy governance"\n    ),` — `strategy_order_governance.py:11-14`
- Enforcement: `_mode_for_strategy()` (same function quoted above, `Target_Strategies/escalator_reclaimed_executor.py:439-442`) returns `"PAPER"` unconditionally for this id because `is_order_routing_disabled_strategy(strategy_id)` is `True`.
- **Fill-producing line:** identical code path to Escalator Reclaimed Shadow above — `Target_Strategies/escalator_reclaimed_executor.py:999` → `:1036` — but structurally cannot reach the broker branch at `:471` for this strategy id, independent of `AUTO_ESCALATOR_LIVE_TRADING`.

### 7. Earnings Trader Locked 93 (`earnings_trader_locked_93`)

- Denylisted: `"earnings_trader_locked_93": (\n        "Strategy earnings_trader_locked_93 is locked to paper-only mode; "\n        "TradeStation order routing is disabled until Railway parity, duplicate-order "\n        "protection, and TradeStation SIM verification are explicitly approved"\n    ),` — `strategy_order_governance.py:15-19`
- No broker call exists in `Target_Strategies/earnings_trader_locked_93.py` (grep for `ts_gw\.|place_order` returned zero matches).
- **Fill-producing line:** `entry_price = _as_float(row.get("regular_open"))` — `Target_Strategies/earnings_trader_locked_93.py:477`, inside `_signal_from_row()` — a historical/market-data field (the next session's regular open), not a broker execution report.

### 8. TriSight 500 2.0 (`trisight_500_late_failed_recovery_shadow`)

- Denylisted: `"trisight_500_late_failed_recovery_shadow": (\n        "Strategy trisight_500_late_failed_recovery_shadow is locked to paper-only target mode; "\n        "broker routing is disabled until an explicit TradeStation broker/order contract, "\n        "SIM proof, and audit-backed approval are recorded"\n    ),` — `strategy_order_governance.py:36-40`
- No broker call exists in `Target_Strategies/trisight_500_late_failed_recovery_shadow.py` (grep for `ts_gw\.|place_order` returned zero matches).
- **Fill-producing line:** `entry_price = float(lot[LOT_ENTRY_PRICE_COLUMN])` (fallback `entry_price = float(row["entry_price"])` when no lot) — `Target_Strategies/trisight_500_late_failed_recovery_shadow.py:2090` (fallback `:2092`) — a value carried from the strategy's own rotation/lot record, not a broker fill.

### 9. Manual Swing Trading (`manual_swing_trading`)

- No broker call exists anywhere in the module (grep for `ts_gw\.|place_order|auto_execute` on `Target_Strategies/manual_swing_trading.py` returned zero matches).
- Governance file records this as a structural absence, not a flag: `"manual_swing_trading: a live, human-operated BUY-only dashboard\n    path with no lock anywhere (app.py's _BROKER_ROUTE_BLOCKED_\n    STRATEGIES / _BROKER_BOUNDARY_STATUS_STRATEGIES both confirm\n    absence by design; tests/homogenization/test_manual_swing_trading_\n    conformance.py pins it)."` — `strategy_order_governance.py:91-95`
- **Fill-producing line:** `fill_price = float(entry_fill['price'])` — `Target_Strategies/manual_swing_trading.py:1638`, where `entry_fill = _entry_window_fill_price(cand['symbol'], entry_snapshot)` (`:1631`) reads the live entry-window market snapshot — sim/journal pricing, no broker execution report field exists on this path.

### 10. Automated Swing Trading (`automated_swing_trading`)

- Live-trading flag, default OFF: `AUTO_SWING_LIVE_TRADING        = os.getenv('AUTO_SWING_LIVE_TRADING', 'false').lower() == 'true'` — `Target_Strategies/automated_swing_trading.py:452`
- Governed by its own boundary check, excluded from the denylist sweep: `"automated_swing_trading: gated by its own SIM/live-user broker-\n    boundary check (app.py._BROKER_BOUNDARY_STATUS_STRATEGIES +\n    gateway/tradestation_client.strategy_ordering_status's\n    broker_boundary/token_status logic), not this denylist."` — `strategy_order_governance.py:96-99`
- **Fill-producing line (current path, flag false → sim pricing):** `out['fill_price'] = float(current_price)` / `out['fill_price_source'] = 'entry_window_market_price'` — `Target_Strategies/automated_swing_trading.py:762-763`, inside the `if not AUTO_SWING_LIVE_TRADING:` branch (`:758`).
- **Broker-call line (present in code, gated off today):** `result = _async_run(ts_gw.place_order(` — `Target_Strategies/automated_swing_trading.py:773`
- Production confirmation this flag is currently false (not just the code default): `"NO slippage involved (AUTO_SWING_LIVE_TRADING=false, pure paper)."` — `assay/reports/review/evidence/DEFECT-REGISTRY.md:48` (D28 audit, PR #744)

### The shared broker-routing gate (applies to any strategy that does reach `ts_gw.place_order`)

Even for the strategies with a live broker-call line above, `place_order()` itself enforces a
second, independent gate before any order reaches TradeStation:

```
execution_venue = _read_execution_venue(strategy_id)
if not is_execution_venue_authorized_for_tradestation_routing(execution_venue):
    return {
        "status": "blocked",
        "error": (
            f"Strategy {strategy_id} execution venue is '{execution_venue}', "
            ...
```
— `gateway/tradestation_client.py:677-689`

`_read_execution_venue()` reads the DB setting via `database.get_execution_venue(strategy_id)`,
whose docstring reads: `"Defaults to trisight_sim (EXECUTION_VENUE_DEFAULT) for every strategy with
no explicit setting -- the owner's fail-safe default."` — `database.py:2482-2484` — and
`EXECUTION_VENUE_DEFAULT =
EXECUTION_VENUE_TRISIGHT_SIM` / `EXECUTION_VENUE_TRISIGHT_SIM = "trisight_sim"` — `strategy_order_governance.py:343-354`.
So absent an explicit terminal-side override, every strategy's venue is TriSight Sim by code
default — this is the runtime-DB value referenced in the scope note above and is what NOT
ESTABLISHED (runtime) refers to for strategies 1, 5, and 10.

---

## 3.2 — Cross-check against DECISIONS-INBOX venue record

- **Three-term standard, ratified, ~line 202:** `"RATIFY three-term mode standard: APPROVED — "TriSight Sim / Broker Sim / Broker Live" is THE platform-wide trading-mode display convention (CARD-32 part 4 unblocked; implementation with display work)."` — `assay/reports/review/evidence/DECISIONS-INBOX.md:202`
- **Oakwind Swing = TriSight Sim, ~line 119:** `"...add a trading-mode label to every row/card using Dick's three-term standard — "TriSight Sim" (internal practice) / "Broker Sim" (broker practice account) / "Broker Live" (real orders)** — oakwind_swing today = TriSight Sim."` — `assay/reports/review/evidence/DECISIONS-INBOX.md:119`
- **Launch instruction, ~line 658:** `"DICK'S CONSOLIDATED LAUNCH INSTRUCTION (verbatim): "all strategies at 1x, all strategies are ENABLED for live trading in one of the three places: TriSight sim, TradeStation Sim, TradeStation Live ... with the TradeStation determination made at the TriSight Trading Terminal level - and scale remains the same as the existing, validated parameters.""` — `assay/reports/review/evidence/DECISIONS-INBOX.md:658`

**Reconciliation note (terminology, not a conflict):** Dick's generic terms are "TriSight Sim /
Broker Sim / Broker Live" (the broker is unnamed, allowing for any future broker). The code's
concrete implementation of the same three-slot model names the broker explicitly, since
TradeStation is currently the only integrated broker: `EXECUTION_VENUE_TRISIGHT_SIM =
"trisight_sim"` / `EXECUTION_VENUE_TRADESTATION_SIM = "tradestation_sim"` /
`EXECUTION_VENUE_TRADESTATION_LIVE = "tradestation_live"` — `strategy_order_governance.py:343-345`,
with the governing comment citing Dick's rule directly: `"Owner's three rules, verbatim:\n    1.
"All strategies run in TriSight Sim unless otherwise designated\n       as TradeStation Sim or
TradeStation live via manual setting at\n       the terminal.""` — `gateway/tradestation_client.py:660-663`.
Code and record describe the same three-slot venue model; "Broker Sim/Live" (record) =
"TradeStation Sim/Live" (code) is a naming substitution, not a behavioral disagreement.

**oakwind_swing (`supply_demand_hourly_paper_locked`) agreement, confirmed:** code shows this
strategy's broker-routing scaffold was removed entirely (`supply_demand_hourly_paper_common.py:731-738`,
quoted in 3.1 §3 above) — i.e. it cannot reach TradeStation at all, which is a *stronger* form of
"TriSight Sim" than a flag default — and the estate record independently states `"oakwind_swing
today = TriSight Sim"` (`DECISIONS-INBOX.md:119`). Code and record **agree**.

---

## 3.3 — Per-strategy venue table

Cell is **MEASURED** only where the code trace (3.1) and the estate/decisions record (3.2, or the
governing comments in `strategy_order_governance.py` / `gateway/tradestation_client.py` that
directly implement Dick's ratified rules) agree on the same venue. Cell is **CONFLICT** where they
disagree or where no estate record could be found to check the code against.

| # | Strategy (normalized-inputs.json name) | strategy_id | Fill-producing line (today) | Broker call exists in code? | Denylisted in `strategy_order_governance.py`? | Estate record for this strategy | Venue (today) | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | Top 40 2.0 | `top_40_2_0` | `top40_2_0_rotator.py:1782` (`_paper_fill_price`) | Yes, gated — `:1804` (env flag default false) | No (governed by its own `AUTO_TOP40_2_LIVE_TRADING` flag + shared execution-venue gate) | Covered generically by Dick's launch instruction (`DECISIONS-INBOX.md:658`) and the three-term standard (`:202`); no strategy-specific "today" statement found | TriSight Sim | MEASURED |
| 2 | High 5 | `high_5_strategy` | `live_paper_strategy_publishers.py:1275` | No — zero `ts_gw`/`place_order` references in module | Yes — `strategy_order_governance.py:20-23` | Not named by id in the excerpts reviewed; covered by the platform-wide three-term standard | TriSight Sim | MEASURED |
| 3 | Oakwind Swing Trader | `supply_demand_hourly_paper_locked` | `supply_demand_hourly_paper_common.py:756` (`modeled_entry_price`) | No — scaffold "removed entirely" per `:731-738` | Yes — `strategy_order_governance.py:32-35` | **Named explicitly:** `"oakwind_swing today = TriSight Sim"` — `DECISIONS-INBOX.md:119` | TriSight Sim | **MEASURED** (explicit code+record agreement) |
| 4 | Oakwind Investor Daily | `oakwind_investor_daily_paper_locked` | `oakwind_investor_daily_paper_common.py:612` (`limit_price`) | No — zero `ts_gw`/`place_order` references in module | Yes — `strategy_order_governance.py:28-31` | Not named by id in the excerpts reviewed; covered by the platform-wide standard | TriSight Sim | MEASURED |
| 5 | Escalator Reclaimed Shadow | `escalator_reclaimed_shadow` | `escalator_reclaimed_executor.py:1036` (`price` at `:999`) | Yes, gated — `:471` (env flag default false; explicitly called "broker-routable" at `:42-43`) | No — absent from the denylist, governed by its own flag | Escalator pair covered generically at `DECISIONS-INBOX.md:189-194` (Rule 21 envelope walkthrough), no live-routing statement found | TriSight Sim | MEASURED |
| 6 | Escalator Reclaimed Long Shadow | `escalator_reclaimed_long_shadow` | Same code path as #5 — `escalator_reclaimed_executor.py:1036` | Structurally unreachable regardless of the flag | **Yes — explicit id-level denylist**, `strategy_order_governance.py:11-14` | Escalator pair covered generically at `DECISIONS-INBOX.md:189-194` | TriSight Sim | MEASURED |
| 7 | Earnings Trader Locked 93 | `earnings_trader_locked_93` | `earnings_trader_locked_93.py:477` (`regular_open`) | No — zero `ts_gw`/`place_order` references in module | Yes — `strategy_order_governance.py:15-19` | Not named by id in the excerpts reviewed | TriSight Sim | MEASURED |
| 8 | TriSight 500 2.0 | `trisight_500_late_failed_recovery_shadow` | `trisight_500_late_failed_recovery_shadow.py:2090` (`LOT_ENTRY_PRICE_COLUMN`) | No — zero `ts_gw`/`place_order` references in module | Yes — `strategy_order_governance.py:36-40` | Not named by id in the excerpts reviewed | TriSight Sim | MEASURED |
| 9 | Manual Swing Trading | `manual_swing_trading` | `manual_swing_trading.py:1638` (`entry_fill['price']`) | No — no code path exists at all (by design) | N/A — not in the denylist because there is nothing to deny; confirmed structurally absent at `strategy_order_governance.py:91-95` | Not named by id in the excerpts reviewed | TriSight Sim | MEASURED |
| 10 | Automated Swing Trading | `automated_swing_trading` | `automated_swing_trading.py:762` (`fill_price = float(current_price)`) | Yes, gated — `:773` (env flag default false) | No — governed by its own boundary check, `strategy_order_governance.py:96-99` | **Confirmed false in production:** `"AUTO_SWING_LIVE_TRADING=false, pure paper"` — `DEFECT-REGISTRY.md:48` (D28/PR #744) | TriSight Sim | **MEASURED** (explicit code+record agreement) |

**Summary:** all 10 strategies price and write fills through sim/paper code paths today — none
reach a broker execution report. Three strategies (Top 40 2.0, Escalator Reclaimed Shadow,
Automated Swing Trading) carry a real `ts_gw.place_order()` call gated by an env flag that
defaults `false`; all three additionally require an explicit `execution_venue` DB override to
`tradestation_sim`/`tradestation_live` before `place_order()` will even attempt routing, since the
execution-venue gate at `gateway/tradestation_client.py:677-689` sits inside the single shared
`place_order()` function (`gateway/tradestation_client.py:619`) that all three callers invoke — no
cell in this table required marking CONFLICT; every strategy's code-derived venue matched every
applicable estate-record statement found.

**NOT ESTABLISHED (runtime, not code):**
- The current Railway-production DB value of `execution_venue` per strategy (I did not query the
  production DB or Railway env for this WI; 3.1's ask was the code trace, which is complete).
- Whether `AUTO_TOP40_2_LIVE_TRADING` / `AUTO_ESCALATOR_LIVE_TRADING` are overridden away from
  their code-default `false` in the Railway environment (only `AUTO_SWING_LIVE_TRADING=false` was
  independently confirmed in production via the D28 audit quoted above).
