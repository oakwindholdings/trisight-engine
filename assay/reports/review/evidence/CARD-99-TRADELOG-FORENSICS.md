# CARD-99 — Top40 Trade-Log Forensics (archived 2026-07-14)

# CARD-99 Forensic Analysis: Top 40 2.0 Net-Short Trade Log Corruption

## 1. Executive Summary (plain English)

The five "monster" positions Bob spotted are **not real trades and never were**. They are the visible tail of a floating-point doubling bug: every time the reconciliation job ran against a ticker that had fallen out of the Top 40 roster (no live price that day), the old code sold the *entire current position* again instead of recognizing it was already short — and because the reconciliation job fires far more often than once per trading session (up to **138 times within a single locked session**), that "sell the whole thing again" mistake compounded by an exact factor of **2.0x per cycle**. Left unchecked across ~7 weeks it reached **10^69** shares for the worst offender (DXCM) before the size of the numbers exceeded what a computer can even represent precisely, which is where the "$0.999 average price" and the "returned to a smaller-but-still-insane number" both come from — pure arithmetic residue, not economics.

The good news: the code fix already merged today (PR #593) structurally stops this specific bug from creating *new* monsters. The bad news, in order of urgency:

1. **A parallel, undetected problem exists today**: 15 of these same corrupted tickers currently show up as absurdly large *LONG* positions instead of short ones (e.g., BLFS at ~4×10^50 "shares"). The long-only guard only checks for SHORT positions — these fake LONGs have zero protection and, if any of those tickers has a live market price feed (several look like it — ABM, KRC, SLG, MT are all normal liquid stocks), their fake P&L could already be flowing into whatever P&L number the terminal shows Dick.
2. **The new fix itself has no size limit.** If any of the 18 remaining monster-magnitude shorts (PBA, PNRG, SJM, SRAD, WSBC, and 13 others) ever regains a roster price, the system will automatically write a "BUY several-times-10^47-shares" order into the permanent trade log — a second physically-impossible trade, fully automatic, no human in the loop.
3. There is **no way to "correct" a 10^47-share position with a real trade** — any correcting BUY at that scale is itself a fabrication. The right fix is a ledger convention (a dated "this position is rebased to zero, here's why" marker), not another fake trade.
4. The count has already moved since the halted dry-run: it reported 87 net-short violations; this fresh pull shows 36. That's not an error in either number — it's the new code actively (and imperfectly) self-correcting in real time between the two snapshots. **Any repair decision needs a fresh count taken immediately beforehand.**

---

## 2. The Mechanism, With Row-Level Receipts

### 2.1 Where the bug lives

Pre-#593, `Target_Strategies/top40_2_0_rotator.py::execute_live_orders()` built its idea of "current position" like this (the sign-blind version, commit `a310b91e`):

```python
positions = {
    sym: float(snapshot.get("quantity") or 0.0)
    for sym, snapshot in paper_snapshots.items()
    if float(snapshot.get("quantity") or 0.0) > 0
}
```

`snapshot["quantity"]` from `execution_pnl.extract_paper_positions_by_symbol()` is **always the unsigned magnitude** (`quantity = abs(signed_qty)`) — the actual sign lives in a separate `side` field that this line never reads. A ticker that was net SHORT X shares was therefore read as **LONG X shares**.

### 2.2 The trigger: a ticker falls out of the roster

When a ticker's `Close` price in the roster payload is 0/missing (dropped from the universe), the target-sizing loop never inserts it into `target{}` at all, so `tgt_qty` defaults to 0 and `ref_price` falls back to `1.0`:

```python
ref_price = price if price > 0 else 1.0
delta = tgt_qty - cur_qty          # = 0 - cur_qty  (always negative when cur_qty>0)
...
if delta < 0:
    sells.append((sym, abs(delta), ref_price, "rebalance"))
```

That produces a fill price of `1.0 * (1 - 0.001 slippage) = 0.999` — this is the source of the mysterious **"$0.999 average price"** across every monster. It's not a real quote; it's the hardcoded fallback price, unchanged for months.

### 2.3 The doubling

`execution_pnl._apply_paper_fill()` treats a SELL against an already-negative position as **additive**, not covering:

```python
if current_qty < 0 and signed_delta < 0:      # both negative → same direction
    position["signed_qty"] = current_qty + signed_delta
```

Since the sign-blind code always read `cur_qty` as `abs(true_signed_qty)` and sold *that exact amount* every cycle, each cycle's SELL was numerically identical to the running short — so `new = -X + (-X) = -2X`. **Exact doubling, every cycle.**

Row-level receipt for **PBA** (raw CSV, consecutive rows, same locked session `2026-06-09T16:00:00-04:00`):

| rownum | action | qty | price |
|---|---|---|---|
| 641 | SELL | 1.42676981341e-11 | 0.999 |
| 682 | SELL | 2.85353962682e-11 | 0.999 |
| 699 | SELL | 5.70707925364e-11 | 0.999 |
| 716 | SELL | 1.14141585073e-10 | 0.999 |
| 733 | SELL | 2.28283170146e-10 | 0.999 |

Each row is exactly 2.0000x the previous, to the last printed digit. I reimplemented `_apply_paper_fill`/`_paper_action_delta` verbatim in Python and replayed all 10,814 rows in file order; the replay reproduces Bob's reported numbers almost exactly:

| Ticker | Replayed final signed qty | Bob's reported figure |
|---|---|---|
| PBA | -3.982021e+47 | ~4e47 ✓ |
| PNRG | -2.040251e+48 | ~2e48 ✓ |
| SJM | -4.421760e+37 | ~4.4e37 ✓ |
| SRAD | -2.015442e+38 | ~2e38 ✓ |
| WSBC | -2.175053e+37 | ~2.2e37 ✓ |

All five: avg_price exactly **0.999**, side SHORT. Confirmed.

### 2.4 Cadence: why the exponent got so large so fast

Within the single locked session `2026-06-15T16:00:00-04:00`, **twenty different tickers** (PBA, PNRG, SJM, SRAD, ABM, RAMP, LB, SLG, FACT, SCVL, RLAY, RBB, GHRS, CWBC, IBM, ODC, MYE, MT, INVX, KRC) each show **exactly 138 rows** — meaning `execute_live_orders()` was invoked roughly 138 separate times while the session stayed locked to that one date. The pinned lockdown spec's own **Condition 10 ("Daemon Invocation Topology")** already discloses that a single autopilot cycle can call the signals/rotation pipeline 2-3 times and describes this as harmless *because generate_live_signals() is read-only*. What Condition 10 does not cover is `execute_live_orders()` (the write path) apparently being invoked with similar frequency — under the old sign-blind code, every one of those "harmless, idempotent" re-checks was in fact appending another doubling trade. I could not pin down the exact scheduling loop responsible for that many `execute_live_orders()` calls per session in `autopilot_daemon.py` in the time available — that's a distinct, worthwhile follow-up (start at `_refresh_portfolio_rotation` / the portfolio/paper-publisher loops around lines 2107-2270).

Growth check for PBA within that one 06-15 session: qty went from 1.96094 to 3.41643e+41 over 138 rows. `log2(3.41643e41 / 1.96094) ≈ 137.99` — a clean, unbroken chain of 138 exact doublings in one session.

### 2.5 Eras

| Era | Window | What happened |
|---|---|---|
| **1. Pre-window-gate** | 2026-05-22 → 05-25 | Small scale (~275 rows). Includes a benign symmetric SELL+BUY `paper_timestamp_reset` pair (no net drift) for several tickers, including PBA. |
| **2. Sign-blind compounding** | 2026-06-09 → 2026-07-06 16:00 (`locked_session_close` policy, 16:00 ET) | The core bug. Reconciliation is gated to the paper-entry window but still fires dozens of times per locked session; orphaned tickers double every cycle. |
| **3. Timestamp-policy mass reset** | **2026-07-06** | `contract_entry_timestamp_policy` switches mid-day from `locked_session_close_america_new_york` (16:00 stamps) to `locked_session_preclose_1545_1555_america_new_york` (CARD-47's 15:45-15:55 window, 15:50 stamps) — visible as two different `contract_entry_ts` groups (16:00 and 15:50) both dated 07-06. Every existing position's `last_fill_at` (stamped under the old policy) stops matching the new policy's `contract_entry_ts`, so essentially every held position gets `paper_timestamp_reset` simultaneously — the single biggest growth spike in the log (several tickers jump 6 more doublings, e.g. PBA from ~1e54 to ~1.26e61, inside this one date). This is very likely what Bob's prior investigation referred to as the "07-12ish mass-reset trigger" (the exact date in this file is 07-06, not 07-12 — flagging the discrepancy rather than forcing a match). |
| **4. Post-#593 (today, 2026-07-14)** | `2026-07-13T15:50` session | The newly-deployed side-aware code runs. For orphaned tickers (still `tgt_qty=0`), the now-correctly-signed `delta = 0 - cur_qty` comes out **positive** when `cur_qty` is deeply negative, so the generic rebalance path issues one huge covering BUY automatically (reason `"rebalance"`, not the new explicit `"long_only_short_cover"` reason — that branch only fires when `tgt_qty > 0`). This is where the near-flattening happened. Two *other* symbols (not the 5 named monsters) got the new explicit `long_only_short_cover` + `long_only_short_cover_reopen` treatment because they *do* still have a live roster price today. |

### 2.6 Why the "should-be-zero" BUY left a residue instead of an exact zero

`_num_text()` in the rotator serializes every qty/price/usd to the trade log with only **12 significant digits** (`f"{float(value):.12g}"`). Every cycle's `qty` is read back from that lossy text, not from a persisted full-precision float. After ~138-190 doubling-and-round-trip cycles, the covering BUY (sized from the last 12-sig-fig text read) no longer exactly equals the true accumulated short. On a base around 10^60-10^61, a relative rounding error of ~10^-13 to 10^-14 leaves an absolute residue in the **10^37 - 10^48 range** — exactly the "monster" magnitudes reported. This is a pure floating-point/serialization artifact, not a real position of any size.

---

## 3. Classification of Every Net-Short Symbol

Replaying all 10,814 rows (all `strategy_id=top_40_2_0`, all `PAPER`/`success`) through the exact `_apply_paper_fill` logic, **36 symbols are currently net-short** in this snapshot (full detail written to `net_short_classification.csv` in scratchpad):

| Class | Count | Range | Combined total |
|---|---|---|---|
| **(a) Dust (\|qty\| < 1 share)** | 18 | 2.02e-12 to 0.416 shares | 0.417 shares combined — economically inert |
| **(b) Plausible-magnitude real inversions** | **0** | — | Nothing found between 0.42 shares and 1.64×10^37 shares. There is currently no "ordinary-looking mistaken short" of any believable size. |
| **(c) Exponential monsters** | 18 | 1.64e+37 (COO) to 4.24e+69 (DXCM) | Economically meaningless (fake) |

Every one of the 36 has `avg_price` exactly `0.999`, confirming all 36 are products of the same fallback-price/doubling mechanism, not distinct real trading mistakes.

**Reconciling the 87 vs. 36 discrepancy**: I found **47 distinct tickers** that ever reached monster magnitude (≥1e6) at some point in the log's history. Of those, as of this snapshot:
- **21 are currently SHORT** (18 still monster-sized + 3 that shrank all the way down to sub-share dust — MGNI, ACLS, KIM)
- **20 are currently LONG** at similarly fake magnitudes (15 still monster-sized — BLFS, CEPT, CMBT, RLAY, MT, CMPR, RAMP, MYE, RBB, SLG, CRS, ABM, LQDA, KRC, SCVL — + 5 shrunk to dust — CAKE, ELVN, GRC, NGNE, UAL)
- **6 landed exactly flat** (AGIO, ASH, CRBG, NUVL, RAL, ROKU)

The most likely explanation for 87→36 is simple timing: the dry-run that reported 87 ran against an earlier pull; the newly-deployed #593 code has been auto-correcting (and in some cases over-correcting into fake LONGs) with every subsequent reconciliation cycle since then. **This population is moving in real time — any repair decision needs a fresh snapshot and a fresh dry-run count taken immediately before acting, not the 87 or the 36 quoted here.**

---

## 4. Blast Radius

Traced the consumer chain in `app.py` (`/api/signals` → `_load_execution_pnl_context` → `extract_paper_positions_by_symbol` → `build_strategy_pnl_summary` → `summarize_open_positions_pnl`):

- **SHORT-side positions ARE protected today.** `app.py` (line ~4995) explicitly tags every position with `side=="SHORT"` in `_LONG_ONLY_PAPER_POSITION_STRATEGIES` (`top_40_2_0`, `top_40_2_0_top10`) as `untrusted_position_reason = "long_only_net_short_paper_position"`, and `summarize_open_positions_pnl()` in `execution_pnl.py` explicitly excludes any position with that reason from the aggregate `total_usd`/`total_basis` sums. So the 18 monster shorts and 18 dust shorts do **not** currently pollute the P&L summary chip.
- **The 15 phantom-LONG monsters are NOT protected.** The only generic magnitude/sanity check, `_untrusted_open_position_reason()` in `execution_pnl.py` (line 279), checks for zero quantity, negative market price, or (LONG-only) an impossibly *negative* PnL below cost basis — **it has no upper-bound/magnitude check at all**, and it never runs for a runaway *gain*. If any of BLFS/CEPT/CMBT/RLAY/MT/CMPR/RAMP/MYE/RBB/SLG/CRS/ABM/LQDA/KRC/SCVL has a live market price feed today (several — ABM, KRC, SLG, MT — are ordinary liquid NYSE names, not delisted; I did not make a live pricing call to confirm, per the no-production-calls instruction, so treat this as a strong plausibility flag, not a confirmed fact), its `open_pnl_usd` would compute as a real number on the order of 10^37-10^50 and flow, unflagged, straight into `pnl_summary_by_strategy["top_40_2_0"]`. This is the single most urgent live risk uncovered by this investigation.
- **The already-deployed fix can itself write a new impossible trade.** The new `long_only_short_cover` branch (`rotator.py` line ~1533) does `buys.append((sym, abs(cur_qty), ref_price, "long_only_short_cover"))` with **no magnitude ceiling**. If PBA/PNRG/SJM/SRAD/WSBC (or any of the other 13 monster shorts) ever regains a live roster price, the system will automatically append a "BUY several×10^47 shares" row to the permanent, sealed trade log — a second fabricated trade, fully automated.

---

## 5. Repair Design Recommendation (design only — no writes, no commits, no production calls made)

**Dust class (18 symbols, 0.417 shares combined):** the existing `scripts/repair_top40_net_short_positions.py` design (CORRECTING BUY at the position's own recorded average price) is fine as-is for this class — sub-share, economically inert, safe to correct with a normal trade row.

**Monster class (18 symbols, plus the 15 phantom-LONG siblings not currently caught by any repair tooling):** a "correcting BUY" is wrong at any scale here — even correcting just the current 10^37-10^48 *residue* (rather than the historical peak) is still writing a fabricated trade for an amount with zero economic meaning. Evaluating the three alternatives honestly:

1. **Dated BASELINE-RESET marker (recommended primary)** — a new row type/reason (e.g. `reason="card99_baseline_reset_forensic"`) stating "position rebased to zero as of DATE, see CARD-99" that readers respect as a hard reset point rather than pretending a giant BUY happened. Cleanest match to what actually occurred (nothing was bought or sold at this scale — the ledger is simply wrong from here back). **Requires reader-side code changes** in `execution_pnl.py::extract_paper_positions_by_symbol` and `Target_Strategies/top40_2_0_rotator.py::_paper_position_snapshots_from_trade_log` — both are pinned/sealed files, so this needs the same "honest re-seal" treatment already used for #593 (new Condition in `TOP_40_2_0_LOCKDOWN_SPEC.md`, hash re-seal, disclosure of the new convention). This is squarely Strategy Contract Discipline territory — Dick's ledger convention, not something to add silently.
2. **Date-scoping the reader (CARD-91 deferred follow-up)** — bound how far back any reader nets rows, so pre-reset-era garbage stops accumulating forever. Good defense-in-depth and worth adopting alongside (1), but it doesn't by itself solve "what is the position AT the cutoff" — it still needs a baseline value seeded by something like (1). Recommend as a **complement**, not a substitute.
3. **Quarantine to a sidecar file** — simplest reader story (no code changes at all) but the worst fit for this codebase's own stated principles: the repair script's own docstring calls out "append-only by construction" as a design virtue, and AGENTS.md's NO LIES OF OMISSION rule plus the PAI Witness doctrine ("no silent mutation, no undocumented drift") both argue against physically removing rows from the historical record, even with a manifest. **Flagging this tension explicitly rather than recommending it** — only consider this if Dick and Bob jointly decide the evidentiary cost is acceptable, and even then only as a last resort.

**Concrete gates before any repair executes:**
- Add a **hard, fail-closed magnitude/notional ceiling** to `repair_top40_net_short_positions.py` (e.g., refuse to emit a CORRECTING BUY above some small share-count or USD-notional threshold — today this was only caught because a human eyeballed the dry-run output, not because the script enforced anything).
- Add the **same ceiling to the new `long_only_short_cover` branch** in `rotator.py` — right now it's the more urgent gap, since it fires automatically in live production with no review, not just in an offline repair script.
- Take a **fresh snapshot + fresh dry-run count immediately before any repair decision** — the 87→36 movement proves this population is not static.
- Recommend **pausing top_40_2_0 auto-trading (or at minimum suppressing the cover branch for the 18 known monster symbols)** until the ledger convention is ratified, to prevent the system from writing another physically-impossible BUY on its own in the interim — this is a recommendation for Bob/Dick to act on, not something I've done.

**What Dick must ratify** (per this repo's Strategy Contract Discipline and pinned-file rules):
- Whether the BASELINE-RESET convention is an acceptable addition to his sealed strategy's ledger semantics, and the wording/placement of the new lockdown-spec Condition disclosing it.
- The magnitude/notional ceiling chosen for both the repair script and the live `long_only_short_cover` branch.
- Whether date-scoping should become a standing convention beyond just top_40_2_0.
- Explicit sign-off given the 87→36 movement — he should see a same-day, freshly-generated count, not the number from the earlier halted run.

---

## Files referenced (all read-only, no writes to the repo)
- Raw analysis + scratch scripts: `/private/tmp/claude-501/.../scratchpad/card99/` — `replay_positions.py`, `classify_all.py`, `net_short_classification.csv` (full 36-row detail), `rotator_pre593.py` / `rotator_post593.py` / `execution_pnl_post593.py` / `repair_script_post593.py` (pulled via `git show` from commits `a310b91e` and `22046aa1`)
- Repo (read-only, no changes made): `/Users/bobstewart/dev/trisight/trisight-trader/Target_Strategies/top40_2_0_rotator.py`, `execution_pnl.py`, `app.py` (lines ~4126, ~4990-5017, ~5073-5118), `docs_output/TOP_40_2_0_LOCKDOWN_SPEC.md` (Condition 10), `autopilot_daemon.py`
- Could not locate `orchestration/reports/CARD-91-92-TOP10-INVESTIGATIONS.md` anywhere on disk (checked git history across all branches and the working trees of all worktrees) — relied on the summary of its findings as relayed in the task description, flagged here for transparency rather than treated as independently verified.
