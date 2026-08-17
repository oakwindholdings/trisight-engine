# Evidence Manifest — ASSAY Phase 1

Every file here is captured stdout/stderr from the exact command listed, run at the working-tree
state that this manifest is committed with. The independent verifier fleet re-runs the gate and
re-derives these claims against the committed repo after this commit lands (PRD §7). A field with
no evidence file reads NOT RUN.

| File | Command | Exit | What it proves |
|---|---|---|---|
| 01-register.txt | `bun run cli.ts register --file demo/spec.json` | 0 | I3 pre-registration; spec_hash + registered_at recorded |
| 02-ingest-attempt.txt | `bun run cli.ts ingest --symbols AAPL,MSFT,NVDA,SPY --from 2022-10-01 --to 2025-12-31` | 1 | A7/I6: missing_credential refusal named by variable, never value (key was set-but-empty) |
| 03-evaluate.txt | `bun run cli.ts evaluate --spec-file demo/spec.json --frictions demo/frictions.json --from 2023-01-01 --to 2025-12-31 --folds 8` | 2 | A7/I6: partial_universe refusal stored as a first-class Result; registered_after_window honesty flag |
| 04-receipt.txt | `bun run cli.ts receipt --result sha256:7b16ad8e…` | 0 | D7: receipt with every hash, refusals, worst_slice NOT_RUN, verified false, repro command |
| 05-reproduce.txt | `bun run cli.ts reproduce --result sha256:7b16ad8e…` | 0 | A1 mechanism: byte-identical recompute with cache bypassed, store unmutated |
| 06-a2-compile-failure.txt | stripped type harness under `bunx tsc --noEmit -p tsconfig.json` | 2 | A2 compile layer: 4 distinct misuses fail under the project's own strictness |
| 07-a2-load-refusal.txt | `bun -e "loadAsOf(… future bar …)"` | 0 | A2 load layer: lookahead_at_load refusal value |
| gate-run-final.txt | `./gate.sh` | 0 | A5/A6 + full gate: typecheck, guard-shown-failing, 64 tests, purity greps, unmasked scans, replay, coverage |
| coverage.txt | written by gate step 8 (`bun test --coverage`) | 0 | line/function coverage per file |

NOT RUN (and why): A4 real-data worst slice — requires a non-empty MASSIVE_API_KEY; the adversary
mechanism is proven in test space (tests/adversary_receipt.test.ts, tests/forge_fixes.test.ts F3).
Cold-clone reproduction and the independent verifier report are executed post-commit and recorded
in the ISA Verification section, not here, because they must run against the committed state.
