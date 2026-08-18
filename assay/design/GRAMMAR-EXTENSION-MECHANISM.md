# Grammar Extension Mechanism — Design for Ratification

*Status: DESIGN — nothing here is built. Bob ratifies (or amends) before implementation begins.*
*Author: PAI, 2026-08-18. Informed by every defect the verifiers found in Phase 1/2.*

## The problem this mechanism solves

ASSAY today speaks one strategy shape (`sma_cross`). The estate's real claims live in three other shapes — **dip-buy** (the Oakwind family), **rotation** (Top 40 / TriSight 500), **earnings-event** (Earnings-93) — none of which can currently be pre-registered and re-validated point-in-time inside the gauntlet. Extending the grammar naively would destroy the thing that makes ASSAY trustworthy: any change to `kernel/`, `substrate/`, or `adversary/` changes `code_hash`, and gate step 7 (verify-store) then correctly declares every committed seal stale. The mechanism below makes grammar growth *routine* without ever weakening that guarantee.

## Component 1 — The Epoch model (the foundation; everything else depends on it)

**An Epoch is a declared, reviewed, content-addressed code state.** New append-only record type:

```
Epoch {
  record_type: 'Epoch',
  epoch: number,                  // monotonic, 1 = the Phase-1 code state
  code_hash: Hash,                // kernelCodeHash() of the declared tree
  git_commit: string,             // the exact commit embodying this epoch
  grammar_version: number,        // which grammar families exist in this epoch
  review_ref: string,             // MANDATORY: citation of the second-party verifier report
  declared_at: ISO-8601,
  supersedes: Hash | null         // prior epoch record — the chain is the history
}
```

**verify-store changes meaning, not strictness.** Today it asserts every stored `code_hash` equals the *current tree*. Under epochs it asserts: (a) every Run/Result/Receipt `code_hash` matches **some declared Epoch**, (b) the current tree's hash equals the **latest** declared Epoch, and (c) the Epoch chain is unbroken (each `supersedes` resolves). Old seals stay valid forever because they certify a *declared* code state, not the current one.

**Reproduction becomes epoch-aware.** A receipt's repro command gains the epoch's git commit: `git checkout <epoch.git_commit> && bun run cli.ts reproduce --result <hash>`. Byte-identity is still the test; the epoch tells you which tree performs it. (This also finally discharges the deferred Math.pow cross-machine concern honestly: an epoch pins the exact code that must reproduce.)

**The rule that makes extension "consistent":** *no commit may touch `kernel/`, `substrate/`, or `adversary/` without declaring a new Epoch in the same commit, and no Epoch may be declared without a non-empty `review_ref`.* The gate enforces the mechanical parts (tree hash = latest epoch; review_ref non-empty); the review itself is process — but it leaves a permanent, citable record, which is what the estate's seals never had.

## Component 2 — Grammar versioning (append-only, like everything else)

- `Spec` gains `grammar_version: number`. Validation dispatches per version; **families are only ever added, never changed or removed** — the grammar itself obeys I7. A v1 `sma_cross` spec validates identically forever.
- Each family is one kernel module with one contract: `computeDecisions(spec, AsOf inputs, window) → Decision[] | Refused` — pure, total, AsOf-typed inputs only (lookahead stays unwritable at the same two layers: opaque types + load refusal).
- **A family cannot enter the grammar without its birth certificate:** family validator with unknown-field refusal, property tests, at least one hand-computed golden vector, a red-first lookahead test, and its refusal paths enumerated. The gate mechanizes the checkable half: a `FAMILIES` registry constant; gate asserts every registered family name has a matching `tests/family_<name>.test.ts` and that the stripped-guard count still equals the fired-error count.

## Component 3 — The three estate shapes, and the data each honestly requires

**3a. Dip-buy (Oakwind family) — grammar_version 2.**
Signal: price retraces into a demand zone (definable from prior bars only), entry on the retest, exit at target/stop/time. Expressible over existing daily bars now; the Oakwind Swing claim is *hourly*, so full fidelity needs `interval: '1hour'` ingress — a parameter the DataSnapshot record already carries, requiring only that the Massive plan serves hourly aggregates (**ask for you: confirm plan tier**). Frictions already declare `periodsPerYear` as an input, so intraday annualization stays declared, never assumed. New refusal: `zone_undefinable` when lookback can't establish a zone.

**3b. Rotation (Top 40 / TS500 family) — grammar_version 3. The survivorship killer.**
Rotation claims rank a *universe* per cycle — and the estate's fatal flaw (w4nfwu675) was frozen, survivor-only universes. The mechanism's answer is a new point-in-time data type:

```
UniverseSnapshot {
  record_type: 'UniverseSnapshot', provenance: 'vendor',
  as_of_date, constituents: [{symbol, listed, delisted_date|null}],
  vendor_version, url (keyless), source_kind: 'listed+delisted'
}
```

Ingested from Massive's reference/delisted endpoints (delisted tickers with date ranges are exactly what the frozen caches erased — **ask for you: confirm reference-data access on the plan**). Rotation specs reference a universe-*series* by hash; membership lookups are AsOf-gated exactly like bars: asking "was X in the universe on D" with D beyond the snapshot's as-of **refuses**. A rotation backtest whose universe series has gaps refuses `partial_universe` — never silently completes. This single component, honestly built, is what turns the estate's worst structural inflator into a measurable, refusable input.

**3c. Earnings-event (Earnings-93 family) — grammar_version 4.**
Signal fires relative to earnings dates. Same PIT discipline applied to the *calendar*: `EventSnapshot` records of announcement dates, and the hard honesty question asked up front — are these dates *as known at the time* or as revised later? If the vendor can only supply current-knowledge dates, the family's every Result carries a declared `calendar_pit: 'current_knowledge'` caveat field (visible on the receipt), or Bob rules that it refuses instead. **That is a design decision reserved for you** — I recommend the caveat-field path, disclosed on every receipt, because a refusal here forecloses the whole family for a limitation every commercial calendar shares.

## Component 4 — The adversary grows with the grammar

Each family registers its slicers alongside its signal (same kernel metric owners, ISC-126 discipline): dip-buy adds drawdown-regime and zone-quality slices; rotation adds per-cycle and survivor-vs-delisted-cohort slices (the delisted cohort slice is the direct refutation test for survivorship inflation); earnings-event adds per-event-cohort and surprise-direction slices. A family without registered slicers fails the family gate — an unrefutable family cannot enter the grammar (I5 applied to the grammar itself).

## Component 5 — Delivery waves (each through the full §7 process: executor ≠ verifier, red-first, epoch per wave)

| Wave | Contents | Proof obligation |
|---|---|---|
| **W1** | Epoch model + verify-store/gate/receipt changes. **No grammar change.** | Old seals verify against Epoch-1; a deliberate unepoched kernel edit shown FAILING the gate; then Epoch-2 declared with review_ref and everything green. Red-first at the mechanism level. |
| **W2** | Dip-buy family (daily bars), Oakwind Swing re-validation spec pre-registered and run | Golden vectors vs hand-computed zone entries; lookahead property across zones; Oakwind receipt with worst slice |
| **W3** | UniverseSnapshot ingress + rotation family; Top 40 2.0 re-validation with real delisted data | Survivor-vs-delisted cohort slice quantifies the frozen-pool inflation the prior fleet could only bound |
| **W4** | EventSnapshot + earnings-event family; Earnings-93 re-validation | Selected-93-events vs all-eligible-events slice — the selection-bias refutation Earnings-93 never faced |

Each wave ends with its own verifier pass and epoch declaration; each re-validation is registered before evaluation and will carry `registered_after_window: true` forever — the honest flag, disclosed on every page, because these are *re*-validations by definition.

## Decisions reserved for Bob (the stop-line)

1. Ratify the Epoch model (Component 1) — it redefines what verify-store asserts.
2. Earnings calendar: caveat-field or refusal (3c). My recommendation: caveat-field.
3. Massive plan confirmation: hourly aggregates + reference/delisted endpoints.
4. Wave order as proposed (W1→W4), or reordered by your priority with Dick.

Nothing begins until you rule. One word per line item is enough.
