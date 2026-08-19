# WI 1.3a — Re-validation Feasibility (Go/No-Go)

Scope: is a full point-in-time re-validation of Top 40 2.0's sealed 213.07% CAGR runnable? Checked three required inputs against the trader repo and Railway production environment.

## Input 1 — MASSIVE_API_KEY

**GO.** Present on the Railway production service.

```
railway variables --service trisight-trader | grep -i MASSIVE
║ MASSIVE_API_KEY  │ <redacted — key present, non-empty> ║
```

Confirmed a second way, directly on the running container:

```
railway ssh --service trisight-trader "printenv | grep -i MASSIVE"
MASSIVE_API_KEY=<redacted-present>
```

No local `.env`/`.env.example` file exists in the trader working tree (`find . -maxdepth 1 -iname ".env*"` returned nothing), so any local (non-Railway) re-run would need the key supplied separately — but the key itself is not the blocker; it lives in the deployed environment where the original data pulls run.

## Input 2 — Universe-resolution pipeline

**GO, with a disclosed unclosed gap.**

The pipeline exists and is runnable: `gateway/massive_universe.py` implements the two-stage resolver (`resolve_massive_universe()` at `scripts/earnings_trader_v1_dynamic_ts500_one_year.py:532`), and a point-in-time-aware rebuild script already exists and has already been executed once: `scripts/top40_sealed_cagr_pit_universe_rebuild_20260731.py`.

That script's own docstring states its method and scope, quoted verbatim:

> "Rebuilds the Top 40 roster at EVERY rotation in the fit window (2023-04-10 -> 2026-04-17) using a point-in-time-eligible candidate pool instead of the today-resolved (2026-07-23) pool used unmodified everywhere else in this codebase's Top 40 2.0 evidence chain."

— `scripts/top40_sealed_cagr_pit_universe_rebuild_20260731.py:3-9`

But the same docstring discloses a hard, one-directional limitation on what the rebuild can prove:

> "DISCLOSED, MATERIAL LIMITATION (repeated in the evidence report): this rebuild can only ever REMOVE tickers present in the 2026-07-23-resolved 3,324-symbol pool and PROMOTE lower-ranked tickers that are ALSO in that same pool. It cannot admit a ticker that is absent from the 2026-07-23 pool entirely... that ticker's GPA/XGB/pivot_z scores were never computed in the first place because it was never hydrated into this score-matrix cache."

— `scripts/top40_sealed_cagr_pit_universe_rebuild_20260731.py:31-38`

Separately, the enrichment stage of the resolver (Stage 2, ticker details) still calls the **dateless** Massive/Polygon detail endpoint — confirmed by reading the live code:

```python
# gateway/massive_universe.py:524-526
def _fetch_ticker_detail(ticker: str, api_key: str) -> dict:
    """Fetch /v3/reference/tickers/{T}. Returns dict of extracted fields; failures yield empty dict."""
    url = f"{_BASE_URL}/v3/reference/tickers/{ticker}?apiKey={api_key}"
```

No `date=` query parameter is present on this call. This matches the registry's own characterization of the gap, quoted verbatim from `DEFECT-REGISTRY.md:75` (D55 row):

> "SECOND GAP the scope names and the probe does not fix: the enrichment stage (`gateway/massive_universe.py::_fetch_ticker_detail:525-526`) calls the DATELESS detail endpoint, so market-cap/shares filters would still use today's values even with point-in-time selection — two stages, two gaps, only one closed."

**Net effect:** the pipeline can run a point-in-time *selection* re-validation today, and already has (see Conclusion below) — but every such run's market-cap/shares-outstanding filter is still evaluated against **today's** values, not the value as of each historical rotation date. This is a known, disclosed, still-open gap, not a blocker to running the exercise, but a bound on how "fully" point-in-time any output can be trusted to be.

## Input 3 — Original sealed parameter set

**GO.** Fully recorded in `docs_output/TOP_40_2_0_LOCKDOWN_SPEC.md` §3 "Production Parameters" (lines 181-199):

| Parameter | Value |
|---|---:|
| `TOP40_2_VALIDATION_WINDOW_START` | `2023-04-10` |
| `TOP40_2_VALIDATION_WINDOW_END` | `2026-04-17` |
| `TOP40_2_VALIDATION_RESULT_ID` | `baseline_aggressive_8_linear` |
| `TOP40_2_VALIDATION_REQUESTED_SYMBOLS` | `3317` |
| `TOP40_2_VALIDATION_USABLE_SYMBOLS` | `3242` |
| `TOP40_2_UNIVERSE_PRESET_ID` | `top40-2-authority-universe` |
| `TOP40_2_ROSTER_SIZE` | `40` |
| `TOP40_2_SECTOR_CAP` | `8` |
| `TOP40_2_PRICE_HISTORY_DAYS` | `65` |
| `TOP40_2_MIN_PRICE_ROWS` | `61` |
| `TOP40_2_AUDIT_SLIPPAGE` | `0.001` |
| `TOP40_2_VALIDATION_LEVERAGE` | `1.0` |

All parameters needed to configure a re-run are present and pinned in the lockdown spec. What is **not** recoverable is the *original universe-resolution snapshot itself* — i.e., which 3,317 tickers were actually resolved on 2026-05-15, the date the sealed cache was built. Per WI 1.2, the resolver at seal time had no point-in-time capability and simply resolved "today's" (2026-05-15's) membership with no separate historical record kept; that specific membership list is gone with the missing cache file (WI 1.1) and cannot be reconstructed byte-for-byte even with today's PIT-aware tooling, because PIT capability was only proven viable on 2026-07-31 — over ten weeks after the seal — via a provider probe on a *different* dimension (delisting/active-status point-in-time lookup), not a full point-in-time re-hydration of the original resolved list.

## Go/No-Go summary

| Question | Answer |
|---|---|
| Can an **honest, new, full point-in-time re-validation** be run (owner's Round-61 ruling "(c) RE-VALIDATE FIRST, RULE AFTER")? | **GO — and it already has been.** All three inputs are present. The decomposition lane already executed this exact exercise (`scripts/top40_sealed_cagr_pit_universe_rebuild_20260731.py`) against the closest honest analog (universe resolved 2026-07-23, CAGR 88.442888%, reproduced to 1e-6 against committed eval JSON) and reported the result: full PIT rebuild turns the return **negative: -7.52% CAGR / -61.58% max DD**, explicitly labeled by the registry as an **optimistic bound** — quoted verbatim from `DEFECT-REGISTRY.md:78`: "**FULL POINT-IN-TIME REBUILD TURNS IT NEGATIVE: -7.52% CAGR / -61.58% max DD** — and that is explicitly an OPTIMISTIC BOUND (the rebuild can only promote candidates still in today's pool; names that fell out entirely can never be restored)." |
| Can the **literal original sealed run** (2026-05-15 universe resolution, 3317/3242 symbols, the exact 213.07% CAGR) be reproduced byte-for-byte? | **NO-GO.** The cache is absent everywhere (WI 1.1) and structurally unverifiable even if found (WI 1.2, no SHA256 was ever recorded), and the underlying 2026-05-15 point-in-time membership list itself was never separately captured — the resolver at that time had no PIT capability and recorded only "today's" (2026-05-15's) state inline, which is gone with the cache. |
| Are the three named inputs (MASSIVE_API_KEY, universe-resolution pipeline, original sealed parameter set) present? | **All three: GO.** Key confirmed live on Railway; pipeline code confirmed present and already run once for this exact purpose; full parameter set confirmed pinned in the lockdown spec. |

**Bottom line:** re-validation in the sense the owner ordered (produce real, honest, point-in-time numbers to rule on) is not only feasible — it has already been executed and the result is on record and materially worse than the frozen sealed figure. What remains infeasible, permanently, is reproducing the *original* 213.07% run itself, because its unique input (the 2026-05-15 resolved universe) no longer exists in any recoverable form.
