# Round 3 — Approach (for Gate-B review, before building)

*Prepared for Bob Stewart · 2026-08-19 · Gate-B reviewed (wf_b20525f8, 10 findings applied). Ready to build round 3.*

## What changed from round 2 → round 3

Round 2 asked Dick questions. Round 3 **presents verified answers** — the work he demanded
(his round-2 demand for "proper detail, evidence and validation - and not ask me [to] take a shortcut for you") is done, executor≠verifier, evidence
committed. Round 3 leads with what our own data established, and asks him **only** genuine
open decisions that the decision record does not already settle (his round-15 standing rule).

Every round-3 item is backed by a committed `evidence/wi*.md` artifact. Nothing is asserted
at face value — including his own directives, which were each balanced against our data.

## Per-strategy round-3 content

| Strategy | What round 3 PRESENTS (verified) | Genuine decision for Dick (only where truly open) |
|---|---|---|
| **Top 40 2.0** | Original 213.07% is unrecoverable & unverifiable — cache gone, no SHA256 (WI-1.1/1.2, wi1.4). Three honestly-computed numbers, each dated (wi1.4): **88.44%** analog (2026-07-23), **-7.52% CAGR** full point-in-time rebuild (2026-07-31, *optimistic* bound, D58), **-32.42% CAGR** delisted-augmented survivorship correction (2026-08-10, *verified both lenses*, TQM E4→E11). | Your Round-61 ruling was "re-validate first, rule after" — the re-validation is done. **Present the honest number (with full disclosure it is far below 213%), or retire the strategy?** (Owner's call; the external-quotation sub-question you closed 2026-07-31 is NOT re-asked.) |
| **Oakwind Swing** | **Window established** 2025-01-02→2026-05-14 (WI-2.4, from the committed baseline-capital CSV, corroborated by a separate coverage file confirming 2025 as the entry-start year). The 9,408 executed span those ~16 months, not one day — your objection is answered by our data. Venue = TriSight Sim, from code (WI-3). | None — established from our own data. (FYI only: flag if this conflicts with anything on your end.) |
| **Oakwind Investor** | **Window established** 2025-01-02→2026-05-15 (2,055 executed, WI-2.4). Per your standing "note it, don't refuse" ruling, the CAGR verdict is now **NOTED-with-caveats, not refused — executed** (WI-7.1, commit e9689d8; caveats: survivorship, 29/50 phantom entries). | None — your ruling was a standing rule; applied, not re-asked. |
| **High 5** | **Your own Round-74 ruling** (WI-5): 92.33% "never validly backtested," no-stop contract stands. Measured production number **25.12%**, run and reproduced, its re-seal **parked with you since 2026-08-10, unsigned**. | The 25.12% re-seal is waiting on your word — **close it (ratify 25.12%), or keep it open?** (Surfacing a decision already parked with you, not a new question.) |
| **Automated Swing** | **Confirmed exactly as you said** (WI-4): 18 locked params value-for-value identical to Manual; NO separate Auto backtest exists — Auto's claim reused Manual's `manual_swing_phase6` ledger; the only divergence is an execution-layer entry-window cutoff. **We are addressing the fix, not asking you to:** our recommendation is to formally record Auto as inheriting Manual's validated backtest (identical params) with the execution-layer difference documented, and we will execute that unless you redirect. | Redirect only if you want Auto re-validated as a separate backtest instead of inheriting Manual's — otherwise nothing needed. |
| **Manual Swing** | Live ledger re-pulled today (WI-8, 2026-08-19): **291 rows — 48 tagged BACKFILL, 134 carry the +1%/1-day contract-invalid signature, 109 other** (the 259/104/48 in round 2 was the 2026-08-07 snapshot). The flagged fills were PRICE-REAL but contract-invalid (not fabricated); your RULING 3 (distrust backfilled data) reset only the committed seed file, live volume untouched. | Your "no real trades": do you mean none executed, or none under a *valid contract*? (Decides void vs re-book.) |
| **Escalator Reclaimed Shadow** | Evidence EXISTS and never reached you — an isolated round-1 save failure, not systemic (WI-6/WI-9): 349 trades / 215.97% total return, full claim+realized. Delivered in full now. | Your review of these inputs (first time you're seeing them). |
| **Escalator Long Shadow** | **Window established** 2025-12-31→2026-03-24 (57 market dates / 264 trades, WI-2.4, from two independently-generated committed CSVs cross-checked + hash-verified, reconciling exactly to the claim) — no re-run needed. | None — established from our own data. |
| **TriSight 500 2.0** | Carry round-2 answers (shadow-paper-fill defined; 6yr-freeze = longest freeze duration, momentum-exit dampens the bias). | (unchanged) |
| **Earnings Trader** | Carry round-2: never fired (funnel 472→0), unverifiable-by-absence. | (unchanged) |

## What round 3 does NOT do
- Does not ask any question the decision record already answers (round-15 rule).
- Does not ask Dick to confirm anything our own data has already settled — venue AND all three
  recovered windows (Oakwind Swing, Oakwind Investor, Long Shadow) are presented as established
  facts with their evidence, not confirmation-asks (his round-2 "validate my guess — NFW").
- Does not ask Dick to make a fix he told us to make ourselves — Auto Swing presents our
  recommended resolution ("addressing FIXING this rather than asking you"), not an either/or.
- Does not assert the Top-40 or High-5 numbers as final owner decisions — both are put back to
  Dick as the decisions they genuinely are; the Top-40 numbers are shown as three dated
  candidates, never a single "the corrected claim."
- Does not reach Dick until Gate C passes; Bob relays the link + code.

## Delivery vehicle
The same live review UI + a refreshed printable package. Round-3 items load as a new dialog
layer (kind: evidence + a small number of decision questions), replacing the round-2 set the
same way round 2 replaced round 1 (retract-unanswered, owner answers preserved).

## Open dependency before build
All three windows recovered and VERIFIED (no estate compute needed): Oakwind Swing 2025-01-02..2026-05-14, Oakwind Investor 2025-01-02..2026-05-15, Long Shadow 2025-12-31..2026-03-24. Evidence base COMPLETE. Build begins after Gate-B findings applied.
