# TRISIGHT TOTAL QUALITY MATRIX (TQM)

**What it is.** One traceable, gated, learnable record of the solutions framework across every strategy. The matrix is `strategy × element`. Every intersection holds an **array of effort records** (one per round/attempt). An intersection **passes only if its array is non-empty and its latest record has a non-null `effort` and a passing `verdict`.** A null/empty cell = *not done* — it cannot be waved through. Round-end pattern analysis (the last element) is itself a step, run every round.

## Cell schema — the array element (must not be null to pass)
Each intersection = `[record, …]`, newest last. A record:
```
{ round: int, agent: "<who did it — subagent/workflow id or lens>",
  effort: "<description of the work actually done>",   // NON-NULL to pass
  evidence: "<file:line / PR# / artifact / workflow id>",
  verdict: "PASS | FAIL | BLOCKED | IN-PROGRESS | N/A",
  ts: "<UTC>" }
```
`effort` null → the intersection fails by construction. Arrays accumulate across rounds so we can read the *pattern* (what keeps failing, which agent/lens catches what, where reconciliation churns).

## Framework elements (columns)
| # | Element | Passes when |
|---|---|---|
| E0 | Ground-truth deploy | prod serves latest; the architect's UI is what we reason about |
| E1 | Axis 1 Code⇄Contract | code does what the sealed doc says |
| E2 | Axis 2 Output⇄Human | the deployed panel renders the truth (architect-confirmed) |
| E3 | Axis 3 Contract⇄Intent | the contract expresses the architect's actual intent (fault line) |
| E4 | Axis 4 Number⇄Reality | every number from real, current, settled, **provenance-verified** data |
| E5 | Axis 5 Owner-belief⇄Reality | the architect's mental model matches what runs |
| E6 | Axis 6 Claim⇄Evidence | every claim carries committed, re-derivable proof |
| E7 | Card derivation | each aspect grounded + cited |
| E8 | Adversarial verification | each finding/verdict independently challenged by TWO lenses: (a) **refute lens** — logical/code validity; (b) **quant/equities lens** — is the finding financially real, in what *magnitude and direction* given how this strategy actually selects, and what domain traps (survivorship, look-ahead, point-in-time fundamentals, splits/corporate actions, execution liquidity, regime dependence) does a pure code-tracer miss? A finding is not verified until it survives BOTH. *(Added 2026-08-10, Bob: the assessors reason from code logic; a logical fact ("names absent") is not a financial fact ("returns inflated X%") — only the quant lens converts one to the other.)* |
| E9 | Architect reconciliation | Accept/Dispute/Adjust against intent |
| E10 | Gate closure | every gating caveat closed, not merely disclosed |
| E11 | Re-measure | rerun on verified/reconciled inputs |
| E12 | Encode | reconciled truth written into the lockdown contract |
| E13 | Sign | architect's signed seal (`audit_session.py` PROOF.md) |
| E14 | Round analysis | end-of-round pattern learning (this element, every round) |

## STATUS MATRIX (— = null/not-started · ▶ in-progress · ✔ pass · ✖ fail/blocked)
| Strategy | E0 | E1 | E2 | E3 | E4 | E5 | E6 | E7 | E8 | E9 | E10 | E11 | E12 | E13 | E14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **High 5** | ✔ | ▶ | ✔ | ▶ | ✖ | ▶ | ▶ | ✔ | ✔ | ✔ | ✖ | — | — | — | ▶ |
| Top 40 2.0 (parent) | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Top 40 2.0 Top 10 | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| TriSight 500 2.0 | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Manual Swing | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Automated Swing | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Oakwind Investor | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Earnings Trader 93 | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Intraday Pivot Sniper | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |
| Escalator Reclaimed | — | — | — | — | ✖† | — | — | — | — | — | — | — | — | — | — |

† **E4 ✖ VERIFIED FLEET-WIDE** (workflow `w4nfwu675`, 3 lenses). Refute-lens: CONFIRMED survivor-biased (no valid refutation). Fleet-lens: **ALL sealed strategies AFFECTED** — every committed backtest ranks within a frozen current-listed pool: High 5 / Manual+Automated Swing (static `trisight_universe_cache.json`), Top 40 2.0 + Top 10 (`massive-trisight-universe` matrix, 2026-05-15, ~3.1yr freeze; rotator code already self-discloses "FROZEN / NOT point-in-time validated"), TS500 2.0 (`trisight_16D_master_cache.json`, 2026-04-05, **~6yr freeze — most severe**), Sniper (Tier-2 subset of same pool), Oakwind (TS500_CSV present-day roster), Earnings 93 (`resolve_massive_universe` once, reused). **Audit-machinery gap**: no `PROOF.md` checks universe-membership provenance — why it went undetected fleet-wide. Close-lens: a full credentialed rebuild is NOT the required first move — a **zero-credential offline magnitude upper-bound** runs first, then a scoped credentialed delisted-delta, then (only if needed) a full PIT rebuild. E4 is a **fleet-scoped element** — one gate, all rows.

**Path-0 result (wf `wjq9hfkk2`, compute + E8 quant-lens verify): INDETERMINATE — offline cannot close it.** Offline ceiling on the KNOWN S&P delistings ≈ **2.1% of slot-days** (generous 10-name ≈ 4.8%). **The quant lens (added this session) caught a LEVEL ERROR** in the compute agent's "immaterial" read on its first run: (i) that ceiling bounds only a *minority subset* of the true delisted-would-qualify population (~4.3× wider — SPAC/de-SPAC/biotech/small-mid deaths the offline lists can't enumerate; estate_dead_ticker_sweep already found CAEP/LC/PSTG/SATS delisted inside the live universe); (ii) slot-day *exposure* ≠ *edge distortion* (the −100% names distort CAGR by more than their slot share). **Honest close-path: DISCLOSE now (mandatory floor); to assert "immaterial" and CLOSE Dick's gate requires Path 1 — a scoped credentialed delisted-delta (MASSIVE_API_KEY): reconstruct every in-window name passing price≥$10 & $vol≥$150k, re-rank, measure the true CAGR/edge delta.** → **owner decision: authorize the scoped credentialed measurement.** Other strategies' E0–E3, E5–E14 remain null (not yet entered the framework).

## DETAIL LEDGER — non-null intersections (High 5)
- **High5·E0** — [{r1, agent: director, effort: "verified prod /version == main HEAD 4546a047 == container RAILWAY_GIT_COMMIT_SHA; UI is ground truth", evidence: "/version + railway ssh", verdict: PASS}]
- **High5·E2** — [{r1, agent: workflow wf_ac1cb343 derive:display + verify:display, effort: "Monthly==YTD (#882) + entry==exit/rollup (#879) render defects; corrected claim to merged/deployed-not-screen-verified", evidence: "#882 #879 @4546a047", verdict: IN-PROGRESS→PASS on **Dick's r1 ACCEPT (both check out on live build)**"}]
- **High5·E3** — [{r1, agent: derive:edge-contract + verify:edge-contract, effort: "found stop+2× not in written contract; posed neutral intent question", evidence: "swing_phase6_parity.py stop consts; HIGH_5_LOCKDOWN", verdict: PARTIAL}, {r1, agent: Dick (architect), effort: "DISPUTE — the stop IS the design; 2× is artifact; add stop to contract + re-measure at 1×", verdict: RECONCILED-open→r2}]
- **High5·E4** — [{r1, agent: derive:provenance + verify:provenance, effort: "surfaced D5 universe-provenance caveat as a ride-along", verdict: PARTIAL}, {r1, agent: Dick, effort: "ADJUST/GATE — provenance must be VERIFIED, gates everything", verdict: GATE-OPEN}, {r1, agent: a126f4a04c (single) → **under challenge wf_w4nfwu675**, effort: "verdict FAIL: measurement universe survivor-biased (static 2026-05-01 pool)", verdict: FAIL-UNVERIFIED}]
- **High5·E7** — [{r1, agent: wf_ac1cb343 (5 derive agents), effort: "5 cards grounded + cited from tracked files", evidence: "wf_ac1cb343", verdict: PASS}]
- **High5·E8** — [{r1, agent: wf_ac1cb343 (5 verify agents), effort: "each card adversarially verified; caught display OVERCLAIM, edge-contract basis nuance, honesty-note-A", evidence: "wf_ac1cb343", verdict: PASS}]
- **High5·E9** — [{r1, agent: Dick (architect), effort: "ruled all 5: E3 DISPUTE, leverage ACCEPT, E-settled DISPUTE (#887 revisit), display ACCEPT, provenance GATE", evidence: "HIGH5_RECON_ROUND1_RULINGS.md", verdict: PASS(round complete)}]
- **High5·E10** — [{r1, agent: director + a126f4a04c, effort: "ran the roster gate; it FAILED (survivorship) — gate NOT closed", verdict: FAIL}]
- **High5·E14** — [{r1, agent: director, effort: "Round-1 pattern analysis (below)", verdict: IN-PROGRESS}]

*(High5·E1 Code⇄Contract ▶: partially covered by the invariant harness but not run as a formal element this round. High5·E5/E6 ▶: E6 evidence mostly committed (validation pack tracked); E5 rests on Dick's r1 confirmations. E11/E12/E13 null — blocked behind E10/E4.)*

## E14 — ROUND-END PATTERN ANALYSIS (run every round; this is Round 1)
**Patterns from Round 1 (High 5):**
1. **The architect overturned our two highest-confidence findings** (E3 stop, E-settled #887). Pattern: *machine measurement is strong on FACT, blind on INTENT* — every fault-line/contract element (E3) must route through E9 before it can pass. Never let E3 self-certify.
2. **The gate (E10/E4) is where the real risk lives.** Both the display (E2) and evidence (E6/E8) elements passed clean; the thing that actually blocks the seal is data provenance. Pattern: *prioritize E4/E10 earliest next strategy* — it's the long pole and it's likely shared (static universe).
3. **Single-agent verdicts leaked in at E10** (the roster FAIL) — caught by Bob, now under E8. Pattern: *E8 must wrap E10 verdicts, not just E7 cards.* Adversarial verification is not only for derivation; it's for every consequential conclusion.
4. **E4 is probably not per-strategy** — the static survivor pool is shared, so E4 may pass/fail fleet-wide at once. Pattern: *some elements are fleet-scoped, not strategy-scoped* — model them once, apply to all rows.

**Feeds forward:** next round runs E4/E10 first; E8 wraps every verdict; E3 is never closed without E9.

## E4 addendum — FLEET SURVIVORSHIP EXPOSURE MAP (equities lens `wdo3jz5q5`, single-lens per cluster — a prioritization hypothesis the credentialed measurement verifies)
The corrupted universe INPUT propagates by the shape of each strategy's selection function f (the lambda). **All INFLATE the measured edge; magnitude is the spectrum:**

| Strategy (lambda) | Dir | Tier | Why the corrupted input bends this f |
|---|---|---|---|
| **Top 40 2.0 + Top 10** | INFLATES | **SEVERE** | hyper-tactical GPA (w_t 0.602) surfaces the exact de-SPAC/biotech/crypto parabola-then-die cohort; heavy concentration (82.5% in 12). Own docs already disclose **−7.52% honest PIT analog vs 213% sealed** — survivorship stacks same-direction on the known look-ahead corruption |
| **Oakwind Investor** | INFLATES | **MATERIAL** | DIP-BUY — buys the retest into a demand zone = *catches falling knives*; would have caught the deaths the frozen pool erases |
| **Earnings Trader 93** | INFLATES | **MATERIAL** | naked-long, no-stop, hold-through; quality/liquidity screen dampens but N=93 is fragile |
| **High 5 + Swings** | INFLATES | **MODEST** (MATERIAL @2× headline) | holds strong-until-death into the 7-day window, but large-cap tilt limits to big S&P sudden-deaths (SVB/FRC/SBNY); momentum gate filters slow bleeds |
| **TriSight 500 2.0** | INFLATES | **MODEST** | momentum-EXIT is self-protective — a bleeding name's pillars collapse and it drops out at rotation before the worst |
| **Intraday Pivot Sniper** | INFLATES | **MODEST** | falling-knife catcher (buys z≤−1.5), but 3-bar exit + ATR stop caps per-event; scoped/moderate |

**The lambda ins/outs, stated:** momentum-**exit** lambdas (TS500, partly Shark-Fin) *dampen* the corruption; dip-**buy** lambdas (Oakwind, Sniper) *amplify* it; hyper-tactical concentrated momentum (Top 40 2.0) is *severe*. **`corruption(output) = f(corruption(input), shape of f)`.** Note: Dick gated HIGH 5 (a MODEST lambda) — but the estate's worst exposure is the **flagship Top 40 2.0 (SEVERE)**, corroborated by its own PIT disclosure.
**Prioritized close-order for the credentialed delisted-delta:** Top 40 2.0 → Oakwind/Earnings → High 5/TS500/Sniper.

## E4 → E11 addendum — Top 40 2.0 survivorship MEASURED (2026-08-10, VERIFIED — both adversarial lenses CONFIRMED, could not break it, wf `wvu77ebio`)
The credentialed measurement ran end-to-end. Missing universe ENUMERATED: **2,399 delisted-liquid names** (verified; larger than the ~2,114 survivor pool — population-severe). Delisted-augmented re-rank through **unmodified production scoring**: baseline (survivor-only PIT rebuild, reproduced this session) **−7.55% CAGR / 61.59% DD** → survivorship-corrected **−32.42% CAGR / 76.68% DD** = **DELTA −24.87pp CAGR / +15.10pp DD** (679/6,080 slots = 11.17% went to delisted names; loss-slots −195pp vs gain-slots +88pp). **The equities lens was right**: the damage is the small-cap SPAC/biotech tail (387 names), NOT the famous banks (SIVB et al. never selected).
- **Status: VERIFIED FACT** — both lenses CONFIRMED (mechanics sound: production scoring reused unmodified, parity gate passed, arithmetic exact). The −24.87pp is a **LOWER BOUND** — forward-fill + $10-floor + one-sector-cap all understate; true correction ≥ this.
- **Durable capability built:** `scripts/delisted_universe_enumerator.py` (PR #888) — the estate's first delisted-LIST enumerator; a real bug (list_date absent from the active=false endpoint) was caught only by the credentialed firsthand run, fixed, re-run.
- **SECURITY (new finding, E-cross-cutting):** `gateway/polygon_data.py` ConnectionError handler logs the full URL incl. `apiKey=` → any prod network blip leaks the live MASSIVE_API_KEY to logs. Session leak scrubbed + verified (0 remaining); production code fix pending (a proper redaction PR, not a chip).
- E11 (re-measure) for Top 40 2.0 = DONE-pending-verification; E10 (gate closure) = the credentialed measure IS the close, once verified.
