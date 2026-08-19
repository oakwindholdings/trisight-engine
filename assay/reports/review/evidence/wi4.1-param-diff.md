# WI-4.1 — Automated Swing vs Manual Swing Parameter Diff

Repo: `/Users/bobstewart/dev/trisight/trisight-trader`
Files diffed:
- `Target_Strategies/automated_swing_trading.py`
- `Target_Strategies/manual_swing_trading.py`

## Method

Both files carry an explicitly labeled block: `LOCKED PRODUCTION PARAMETERS (Glossary #79 + Phase 6 v2 Lockdown — DO NOT MODIFY)`. Every constant in that block, in both files, was read and quoted verbatim with file:line. Each file's own docstring also republishes the same parameter list under `PRODUCTION PARAMETERS (Phase 6 v2 Lockdown)`, which was cross-checked against the live constants for consistency.

## Result: LOCKED PRODUCTION PARAMETERS block — IDENTICAL, value-for-value

| Constant | Automated Swing (file:line) | Manual Swing (file:line) | Match |
|---|---|---|---|
| `POLE_VOL_MULTIPLIER` | `automated_swing_trading.py:396` | `manual_swing_trading.py:126` | identical |
| `CONSOLIDATION_VOL_RATIO` | `automated_swing_trading.py:397` | `manual_swing_trading.py:127` | identical |
| `POLE_GAIN_RETENTION` | `automated_swing_trading.py:398` | `manual_swing_trading.py:128` | identical |
| `CONSOL_MIN_BARS` | `automated_swing_trading.py:399` | `manual_swing_trading.py:129` | identical |
| `CONSOL_MAX_BARS` | `automated_swing_trading.py:400` | `manual_swing_trading.py:130` | identical |
| `STOP_BUFFER_PCT` | `automated_swing_trading.py:403` | `manual_swing_trading.py:133` | identical |
| `INITIAL_STOP_BUFFER` | `automated_swing_trading.py:404` | `manual_swing_trading.py:134` | identical |
| `BE_R_TRIGGER` | `automated_swing_trading.py:411` | `manual_swing_trading.py:141` | identical |
| `BE_STOP_MULTIPLIER` | `automated_swing_trading.py:412` | `manual_swing_trading.py:142` | identical |
| `POST_BE_TRAIL_BUFFER` | `automated_swing_trading.py:413` | `manual_swing_trading.py:143` | identical |
| `MAX_HOLD_DAYS` | `automated_swing_trading.py:414` | `manual_swing_trading.py:144` | identical |
| `MAX_POSITIONS` | `automated_swing_trading.py:415` | `manual_swing_trading.py:145` | identical |
| `MAX_DYNAMIC_UNIVERSE` | `automated_swing_trading.py:418` | `manual_swing_trading.py:148` | identical |
| `LEVERAGE` | `automated_swing_trading.py:423` | `manual_swing_trading.py:155` | identical |
| `A_POLE_RANGE_MIN` | `automated_swing_trading.py:431` | `manual_swing_trading.py:162` | identical |
| `ENTRY_TO_POLE_HIGH_MIN` | `automated_swing_trading.py:432` | `manual_swing_trading.py:163` | identical |
| `SECTOR_CAP_PER_DAY` | `automated_swing_trading.py:433` | `manual_swing_trading.py:164` | identical |
| `SLOT_WEIGHT_CAP` | `automated_swing_trading.py:434` | `manual_swing_trading.py:165` | identical |

### Verbatim quotes, side by side

**Detection block (`automated_swing_trading.py:396-400`):**
```
POLE_VOL_MULTIPLIER     = 1.2     # Pole candle volume must exceed 20-day SMA * 1.2
CONSOLIDATION_VOL_RATIO = 0.80    # Avg consolidation volume must be < pole volume * 0.80
POLE_GAIN_RETENTION     = 0.40    # Consolidation cannot retrace > 60% of pole range
CONSOL_MIN_BARS         = 1       # Minimum consolidation bars
CONSOL_MAX_BARS         = 7       # Maximum consolidation bars
```

**Detection block (`manual_swing_trading.py:126-130`):**
```
POLE_VOL_MULTIPLIER     = 1.2     # Pole candle volume must exceed 20-day SMA * 1.2
CONSOLIDATION_VOL_RATIO = 0.80    # Avg consolidation volume must be < pole volume * 0.80
POLE_GAIN_RETENTION     = 0.40    # Consolidation cannot retrace > 60% of pole range
CONSOL_MIN_BARS         = 1       # Minimum consolidation bars
CONSOL_MAX_BARS         = 7       # Maximum consolidation bars
```
→ Character-for-character identical, including comments.

**Risk management block (`automated_swing_trading.py:403-415`):**
```
STOP_BUFFER_PCT         = 0.010   # LEGACY constant retained for backward compat
INITIAL_STOP_BUFFER     = 0.015   # NEW: stop placed 1.5% below consolidation low
...
BE_R_TRIGGER            = 0.020   # Move stop to BE when intra-bar R >= +0.020
BE_STOP_MULTIPLIER      = 1.010   # BE stop = entry * 1.010 (locks 1% profit)
POST_BE_TRAIL_BUFFER    = 0.99    # After BE: stop = max(BE, prior_day_low * 0.99)
MAX_HOLD_DAYS           = 7       # Maximum holding period before forced exit
MAX_POSITIONS           = 5       # Concurrent position slots
```

**Risk management block (`manual_swing_trading.py:133-145`):** byte-identical to the above (verified by direct read of both ranges).

**Universe + leverage (`automated_swing_trading.py:418,423`):**
```
MAX_DYNAMIC_UNIVERSE    = 100     # Top 100 by Hybrid MOM+STR from 16D Master Cache
...
LEVERAGE                = 1.0
```
Comment at `automated_swing_trading.py:419-422`: *"Dick round-17 ratification (2026-07-17, verbatim owner ruling): LEVERAGE 2.0 -> 1.0, matching manual_swing_trading.py's twin change and High 5's CARD-66 precedent."*

**Universe + leverage (`manual_swing_trading.py:148,155`):**
```
MAX_DYNAMIC_UNIVERSE    = 100     # Top 100 by Hybrid MOM+STR from 16D Master Cache
...
LEVERAGE                = 1.0
```
Comment at `manual_swing_trading.py:149-154`: *"Dick round-17 ratification (2026-07-17, verbatim owner ruling): LEVERAGE 2.0 -> 1.0, matching automated_swing_trading.py's twin change and High 5's CARD-66 precedent."*
→ The two files' own comments cross-reference each other by filename as the paired change. This is corroborating, not just identical values by coincidence.

**Phase 6 v2 enhancements (`automated_swing_trading.py:431-434`):**
```
A_POLE_RANGE_MIN        = 0.030   # Reject signals where pole_range/entry_price < 3%
ENTRY_TO_POLE_HIGH_MIN  = 0.030   # Reject signals where (entry-pole_high)/entry < 3%
SECTOR_CAP_PER_DAY      = 2       # Max 2 entries per sector per day
SLOT_WEIGHT_CAP         = (0.5, 2.0)        # cap range for recommended_slot_weight
```

**Phase 6 v2 enhancements (`manual_swing_trading.py:162-165`):** byte-identical to the above (verified by direct read).

Note on `__strategy_meta__["leverage"]`: both files' `__strategy_meta__` dict literal still shows `"leverage": 2.0` (`automated_swing_trading.py:387`, `manual_swing_trading.py:117`), but both immediately overwrite it at runtime with `__strategy_meta__["leverage"] = LEVERAGE` (`automated_swing_trading.py:428`, `manual_swing_trading.py:159`), so the effective published value is `1.0` in both — the stale `2.0` literal is dead code in both files identically, not a divergence between them.

## Divergences found (outside the locked parameter block)

These are NOT in the `LOCKED PRODUCTION PARAMETERS` block and are execution-layer differences the docstrings themselves flag as the intended distinction between the two strategies (`automated_swing_trading.py:8-10`: *"IDENTICAL signal logic to Manual Swing Trading ... THE ONLY DIFFERENCE: this strategy auto-places BUY/SELL orders"*):

1. **Entry-window cutoff constant** — Automated Swing only:
   `AUTO_SWING_ENTRY_END_HHMM_ET = 1555` (`automated_swing_trading.py:115`). Manual Swing has no equivalent hard cutoff constant; it relies on a human clicking the trade modal.

2. **Position-sizing formula uses different capital bases**:
   - Automated (`automated_swing_trading.py:753`): `slot_capital = (equity * LEVERAGE / MAX_POSITIONS) * normalized_slot_weight`, where `equity` is fetched live from the broker (`automated_swing_trading.py:742-743`, falling back to `100000.0` "PAPER notional" at `automated_swing_trading.py:749` only when `AUTO_SWING_USER_ID` is unset or live-equity fetch fails), then capped: `capital = min(slot_capital, AUTO_SWING_MAX_ORDER_USD)` (`automated_swing_trading.py:754`, default cap `$5,000` from `AUTO_SWING_MAX_ORDER_USD` at `automated_swing_trading.py:455`).
   - Manual (`manual_swing_trading.py:661`): `per_slot_capital = (_PHASE6_V2_STARTING_BALANCE / MAX_POSITIONS) * LEVERAGE`, where `_PHASE6_V2_STARTING_BALANCE` is a fixed `100_000.0` imported from `swing_phase6_parity.py:26` (`STARTING_BALANCE = 100_000.0`), not live equity, and used only to produce a *modeled/informational* display quantity (`manual_swing_trading.py:614-635`: "pre-filling the trade-modal's suggested order quantity ... never claimed as a confirmed broker fill") — Manual never places an order itself, so there is no per-order USD cap.
   - Same shape (`capital_base / MAX_POSITIONS * LEVERAGE * slot_weight`), different capital source (live broker equity + hard order cap vs. fixed backtest starting balance, informational only). This is the expected consequence of one strategy auto-executing and the other requiring a human click, not a drift in the locked detection/risk parameters.

3. **Separate state/log files** (by design, so the two engines run side-by-side without collision): `auto_swing_position_state.json` / `auto_swing_trade_log.csv` (`automated_swing_trading.py:904-905`) vs. `swing_position_state.json` / `swing_trade_log.csv` (`manual_swing_trading.py:172-173`).

## Conclusion

The 18 constants that make up the `LOCKED PRODUCTION PARAMETERS (Glossary #79 + Phase 6 v2 Lockdown)` block — detection thresholds, risk-management/stop-and-trail rules, universe size, leverage, and the Phase 6 v2 enhancement thresholds — are **identical, value-for-value, in both files**, confirmed by direct read of both source ranges. The only differences found are execution-layer (auto-order entry-window cutoff, live-equity-based sizing with a per-order USD cap vs. a fixed-balance informational sizing formula, and separate state/log filenames), which both files' own docstrings describe as the intentional and sole distinction between the automated and manual variants.
