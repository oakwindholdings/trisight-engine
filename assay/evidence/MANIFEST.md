# Evidence Manifest — ASSAY Phase 1

Every file here is captured stdout/stderr from the exact command listed, run at the tree state this
manifest is committed with. This is the THIRD evidence generation: wave 1 (pre-Forge) and wave 2
(pre-Cato) were superseded with disclosure — see ISA.md Verification amendments. Gate step 7
(verify-store) now mechanically proves that every stored code_hash matches the committed tree, so
this manifest's provenance claim is checked by machine, not by prose. A field with no evidence file
reads NOT RUN.

| File | Command | Exit | What it proves |
|---|---|---|---|
| 01-register.txt | `bun run cli.ts register --file demo/spec.json` | 0 | I3 pre-registration; spec_hash + registered_at recorded |
| 02-ingest-attempt.txt | `bun run cli.ts ingest --symbols AAPL,MSFT,NVDA,SPY --from 2022-10-01 --to 2025-12-31` | 1 | A7/I6: missing_credential refusal named by variable, never value (key was set-but-empty) |
| 03-evaluate.txt | `bun run cli.ts evaluate --spec-file demo/spec.json --frictions demo/frictions.json --from 2023-01-01 --to 2025-12-31 --folds 8` | 2 | A7/I6: partial_universe refusal stored as a first-class Result; registered_after_window honesty flag |
| 04-receipt.txt | `bun run cli.ts receipt --result sha256:cb29c69a…` | 0 | D7: every hash incl. code_hash, outcome_kind: refused, worst_slice NOT_RUN, verified false, repro command |
| 05-reproduce.txt | `bun run cli.ts reproduce --result sha256:cb29c69a…` | 0 | A1 mechanism: byte-identical, reproduced: "refusal" (self-described), code_drift: false, store unmutated |
| 06-a2-compile-failure.txt | stripped type harness under `bunx tsc --noEmit -p tsconfig.json` | 2 | A2 compile layer: 5 distinct misuses fail under project strictness (count asserted by gate step 2) |
| 07-a2-load-refusal.txt | `bun -e "loadAsOf(… future bar …)"` | 0 | A2 load layer: lookahead_at_load refusal value |
| gate-run-final.txt | `./gate.sh` | 0 | 9-step gate: typecheck, guard-shown-failing (counted), 66 tests/1509 assertions, purity greps, unmasked scans, A5 replay + code-drift check, verify-store (index complete both directions, zero stale seals), A6 secret scan (DISCLOSED: predicate NOT RUN with empty key), coverage |
| coverage.txt | written by gate step 9 (`bun test --coverage`) | 0 | line/function coverage per file |

NOT RUN (and why): A4 real-data worst slice and the A6 live-key grep — both require a non-empty
MASSIVE_API_KEY; the adversary and redaction mechanisms are proven in test space
(tests/adversary_receipt.test.ts, tests/forge_fixes.test.ts). Cold-clone single-command
reproduction was executed against the committed tree and is recorded in the ISA Verification
section. Verifier reports (Forge 30 findings; Cato FAIL→fixed; 6-lane fleet) are summarized in
ISA.md Decisions with dates and dispositions.
