# Epoch Review Record — W0+W1 (genesis Epoch-1 + Epoch-2)

**Reviewer: Cato — cross-vendor adversarial auditor, PAI Verification Doctrine Rule 2a.** Verifier
under Article II, not the executor; nothing in the worktree was modified by the reviewer across all
three review passes. Declarer: PAI-executor (session 25053cba). Git authorship on this machine is a
shared identity — the declarer≠author check will report indistinct until the org grows a second
committer; disclosed per the design's own weak-identity limitation.

## The hashes this review binds (clause 5 checks these verbatim; clause 2 re-derives them from git)

- **Epoch-1 (genesis, retroactive)** — the pre-W1 tree: `code_hash` **sha256:b5af796ab374cd53b563cad3bf8cbb236aed62d28a94bf383bf2939a28e6945d**
- **Epoch-2 (W0+W1)** — the tree this review approves: `code_hash` **sha256:f543ebda38cf46d3b20e9d07eced45bbc74a9d3394e50b92bf8dc56994471387**
- **Genesis blessed enumeration (X16 anchor):** **381** pre-epoch sealed records; `contentHash` of the sorted enumeration: **sha256:143c1164f5df5a548026dbf719d2570391f7e7eacb1b4b5c15c3de611890b79f**. A future re-declaration with a different set will not match this quotation.

## Verdict

**APPROVE FOR EPOCH** (pass 3), following **changes-required** (pass 2) whose blocking set X1/X2/X3
landed in the stronger form: the legacy bridge was deleted outright and replaced by the enumerated,
content-addressed `blessed_records` genesis set (Form 3 — "the blessed set is now auditable by
enumeration rather than by trusting a hash nobody derives"); retroactivity is genesis-only,
enforced at both construction and verification; `verified === (honesty_flags.length === 0)` is one
rule in one place with seven visible flags. Independently re-ran the suite each pass; final state:
**89 pass, 0 fail, 1551 assertions**. Red-first attack fixtures verified for: fabricated history
outside the enumeration (X1), second retroactive epoch (X2a), blessing on non-retroactive (X2b),
false epoch code_hash (ATTACK ii), forked chain (v), rootless chain (vi), unquoted review (iv),
revoked head + quarantine (vii), self-reviewed epoch (X6), the mechanized 4a5a807 catch, and the
absent-epoch_hash corpus shape (X15 red-first).

Delta pass: X15 (`== null` catches the absent-key shape the 107 pre-W1 records actually hold — the
corpus genesis blesses now discloses `epoch_declared_after_run`, not the weaker-and-wrong
`epoch_stale`) and X17 (bytewise Buffer.compare label ordering) verified fixed pre-genesis.
**"Delta approved."**

## What the reviewer tried and could not break

The enumerated genesis bridge (no path admits an unenumerated record; no second enumeration can
exist); the retroactivity constraints (refused at both entry points); the C1 fixed-point (subtree-OID
binding — store objects cannot perturb the identity they are recorded in); the C2 laundering vector
(the verifier lives inside the sealed hash); historical code_hash forgery (clause-2 git
re-derivation); chain topology forgery (fork/cycle/orphan/non-contiguous); review recycling (the
verbatim code_hash quote requirement); the head-anchored replay partition; the single-owner framing
rule (the filesystem and git hash paths are one function); and the honesty-flag aggregation —
attacked specifically for any shape yielding `verified: true` with a live flag; none found.

## Disclosed residuals (recorded, not hidden)

- **X7 / design clause 7 (published-surface freshness, M8) is DEFERRED: owner PAI, first task of
  W2.** Rationale: `reports/` restructuring belongs with W2's report regeneration; the compensating
  control is real — the X3 aggregation rule means no newly generated page can render a stale-epoch
  receipt as `verified: true`. Residual risk is confined to the already-published artifacts under
  `reports/`, a known, bounded, disclosed set. (Cato: "an enumerated clause list with one clause
  missing and a signed note is ordinary honest engineering.")
- Git authorship as weak identity (stated inside the refusal text itself).
- The gate-to-commit window: one commit deep and self-healing — the next gate run recomputes STAGED
  against the head epoch.
- Cross-machine byte-identity: explicitly withdrawn by design v2, queued, NOT RUN (deterministic
  pow / declared-precision rounding remains the open item).

Cato's closing, quoted: *"every finding I raised was against a declaration, and every fix replaced
a declaration with a computation or an enumeration. … A design that retracts its own overclaim
under review is behaving the way the mechanism it describes is supposed to make people behave."*
