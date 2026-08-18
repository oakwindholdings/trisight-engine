# ASSAY — Phase 1

**A machine that decides whether a claim about returns is true.** A strategy is an input to it, not the product of it. The product is earned confidence: a number with an honest error bar, a named worst case, and a full reproduction receipt — or an explicit refusal to produce one.

> **What this tests:** the real subject is the TriSight strategy estate at
> [`oakwindholdings/TriSight`](https://github.com/oakwindholdings/TriSight) (local clones:
> `trisight-trader`) — Top 40 2.0, High 5, both Oakwinds, the Escalator family, TriSight 500 2.0,
> Earnings-93, Manual/Automated Swing. Phase 2's inflation study measured those directly
> (`reports/ESTATE-INFLATION.md`); build waves W2–W4 express their shapes (dip-buy, rotation,
> earnings-event) inside this gauntlet for point-in-time re-validation. The SMA-cross spec used in
> Phase 1 is deliberate scaffolding that proved the *measurement machine* — it is not, and never
> was, a strategy of interest.

Full ideal-state articulation, criteria, and verification evidence: [ISA.md](./ISA.md). Product requirements: the ASSAY PRD (Phase 1 is the only authorized phase).

## Layout

| Path | What it is |
|---|---|
| `kernel/` | Pure, total functions. No I/O, no clock, no env, no randomness. `refusal` (taxonomy owner), `canonical` (bytes+hashing owner), `span` (basis-typed time), `micros` (integer money owner), `bars` (opaque `AsOf` point-in-time), `metrics` (formula owners), `sim` (ledger as a value), `spec` (data-only grammar), `evaluate` (walk-forward) |
| `substrate/` | Impure, thin, instrumented. `store` (append-only content-addressed objects + derived sqlite index), `registry` (pre-registration, I3), `ingress` (the one vendor gateway, redacting), `invoke` (hash-in/hash-out invocation + traces + cache + replay), `codehash` |
| `adversary/` | Deterministic slice enumeration; names the worst slice (I5) |
| `receipt/` | Receipt builder + `reproduce` (recompute with cache bypassed, byte-compare) |
| `cli.ts` | ingest · register · evaluate · adversary · receipt · show · reproduce · replay · rebuild-index |
| `tests/` | Property tests (seeded, zero-dep harness), hand-computed exact-in-binary goldens, red-first guard demos, compile-time type harness |
| `gate.sh` | The one gate: typecheck, guard-shown-failing, tests, purity greps, mask scan, determinism replay (A5), secret scan (A6). Exits 0 unmasked. |
| `store-data/` | The committed object store + traces. **The cache is the reproduction guarantee.** `index.sqlite` is derived and gitignored — rebuild with `bun run cli.ts rebuild-index`. |
| `evidence/` | Captured command outputs. Prose claims cite these files; a claim with no evidence file reads NOT RUN. |

## Quick start

```bash
bun install            # dev-only type packages; runtime dependencies are zero
./gate.sh              # the whole gate, one command
```

Reproduce the committed run (byte-identical or non-zero exit):

```bash
bun run cli.ts reproduce --result sha256:cb29c69a8265dea813b6b3804fc589517ef7886139228886f4d39ff2168de7d7
```

## Current honest status (2026-08-17, real-data run complete)

All 150 ISA criteria closed. The store holds two committed chains, both byte-reproducible:

1. **The refusal chain** (built when the key was empty): `missing_credential` → `Refused(partial_universe)` result → receipt of refusal. Kept as history — a refusal is as reproducible as a number.
2. **The real chain**: 4 vendor snapshots (815 daily bars each) → real evaluation `sha256:c30b3949…` → adversary (14 slices) → receipt.

The real result reads: total return **+94.9%** (CAGR 25.1%, 752 trading days), worst fold drawdown 7.8% — and the receipt marks it **`verified: false`**, because the adversary found fold-5 at **−5.2%**, materially worse than the headline, and because the win rate is **18.2% over 11 closed round-trips** (net of commissions): the headline lives mostly in unrealized marks under the declared `independent_flat_start_folds` semantics. It also carries `registered_after_window: true` — the spec was registered 2026-08-17 against an earlier window. Every one of those caveats appearing *on the receipt itself* is the product working.

Reproduce the real run (byte-identical or non-zero exit):

```bash
bun run cli.ts reproduce --result sha256:c30b3949e0518687f5c5cda6ba16b0cdf87cb106b093adc570fb0bcfd5730299
```

## Invariants (build is wrong if any can be violated)

I1 content-addressed determinism · I2 point-in-time by type · I3 pre-registration · I4 declared frictions/universe · I5 every result carries its refutation · I6 refusal is first-class · I7 append-only, supersede with disclosure.
