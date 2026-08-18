# Epoch Review Record — Epoch-3 (genesis-trace deferral in replay)

**Reviewer: Cato — cross-vendor adversarial auditor, PAI Verification Doctrine Rule 2a** (fourth
pass; nothing in the worktree modified by the reviewer). Declarer: PAI-executor.

**Epoch-3 code_hash (clause-5 verbatim quote): sha256:08717a5e2b255b464a00f0f48c83fbef923d3d6bc215882e314e36704023ed1e**

Verdict: **delta approved — E3 may be declared.** Scope: one branch in `substrate/invoke.ts
replayTraces` — a trace whose code_hash matches no epoch defers to genesis IFF its output_hash is
in the genesis blessed enumeration (the X1 membership discipline applied to the trace surface);
unknown code AND unenumerated output remains fatal code_drift; the X5 head-anchor refusal fires
first; malformed traces fail closed. Suite independently re-run: 89 pass / 1551 assertions.

Reviewer's own-miss disclosure, quoted for the record: the retired-algorithm consequence was traced
through the record surface across two passes "and not the second [trace surface]… Two reviewers and
a ratified design missed it; **the gate did not.** That is the mechanism doing exactly what it was
built to do, and it belongs in the E3 record as evidence for the design rather than against it."

W2 obligations recorded by the reviewer (neither blocking E3): (1) harden `traces.jsonl` — the
weakest surface: not content-addressed, not hash-verified, bare JSON.parse; consider sealing Trace
as a store record or hash-chaining the log. (2) `receipt.ts:158` carries the X15 bug class
(`!== null` misses absent-key) yielding an unresolved "epoch ?" remediation message on the exact
corpus genesis blessed — same one-character fix plus a pre-epoch message naming genesis. Owner PAI,
early W2, alongside the deferred X7. Executor lesson in force: full gate rehearsal BEFORE declaring.
