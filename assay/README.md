# ASSAY — Phase 1

**A machine that decides whether a claim about returns is true.** A strategy is an input to it, not the product of it. The product is earned confidence: a number with an honest error bar, a named worst case, and a full reproduction receipt — or an explicit refusal to produce one.

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
bun run cli.ts reproduce --result sha256:7b16ad8e0b6cefc8b8257effb6ed29b489b155861a1a4a7bf1ef273aef2c7c4c
```

## Current honest status (2026-08-17)

`MASSIVE_API_KEY` was **set-but-empty** in the build environment, so the committed acceptance run is a **first-class refusal chain**, exactly as I6 demands: ingest refused `missing_credential` (named by variable, never by value), evaluation stored a `Refused(partial_universe)` result, the receipt records it with `worst_slice: NOT_RUN` and `verified: false`, and reproduction of the refusal is byte-identical. The full-number path — bars → walk-forward evaluation → adversary worst slice → verified receipt — is proven end-to-end by the test suite against a fake vendor.

With a real key exported, the real chain is:

```bash
bun run cli.ts ingest --symbols AAPL,MSFT,NVDA,SPY --from 2022-10-01 --to 2025-12-31
bun run cli.ts evaluate --spec-file demo/spec.json --frictions demo/frictions.json --from 2023-01-01 --to 2025-12-31 --folds 8
bun run cli.ts adversary --result <result_hash>
bun run cli.ts receipt   --result <result_hash>
```

The demo spec was registered 2026-08-17 and will therefore carry `registered_after_window: true` on any historical window — that flag is the product working, not a defect.

## Invariants (build is wrong if any can be violated)

I1 content-addressed determinism · I2 point-in-time by type · I3 pre-registration · I4 declared frictions/universe · I5 every result carries its refutation · I6 refusal is first-class · I7 append-only, supersede with disclosure.
