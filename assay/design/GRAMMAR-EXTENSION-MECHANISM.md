# Grammar Extension Mechanism — Design v2, for Ratification

*Status: DESIGN — nothing here is built. v2 supersedes v1 (commit 7639d8d) with disclosure: v1 was
single-author and unreviewed; it was withdrawn from ratification, adversarially reviewed (Cato:
REJECT as written) and peer reviewed (Forge: sound-with-changes) — verdicts in
[REVIEWS-2026-08-18.md](REVIEWS-2026-08-18.md). Every finding is dispositioned here by ID. The v1
text remains in git history by design (I7).*

## What changed from v1, in one paragraph

v1's Epoch was a *declared* record the gate took on faith; both reviewers showed that trades a
machine-checked invariant for a written-down one, and one field of it was mathematically
impossible (C1/F6). v2's Epoch is a **computed, git-re-derivable fact**: bound to a git tree hash,
re-verified from git objects on every gate run, enforced by code that is itself inside the sealed
hash, ordered by topology rather than timestamps, revocable, and reviewed via content-addressed
diff-bound records rather than a string. The earnings-calendar question changed answers entirely:
measurement replaces both the caveat and the refusal (M4). And rotation gained the two kernel
facts v1 missed: membership is not availability (F3), and delisting needs a declared terminal-value
policy (F4).

## Component 0 — Prerequisite hardening (NEW; W0, before anything else) [C7/F1/F2/M7]

- `kernelCodeHash()` becomes recursive over **all files** (not `.ts` only) under COMPUTE_ROOTS,
  with sorted `root/relative/path` labels. COMPUTE_ROOTS gains `receipt/` and the new
  `substrate/verify/` (see C1-fix below) — one disclosed epoch-relevant change, made once. [C7/F1/F8]
- Gate asserts the hashed file list equals `git ls-files` for those roots — a tracked file the
  hash misses is a FAILURE. *Vacuity condition, stated: this guard is vacuous if run against an
  unstaged tree; the gate therefore also asserts the working tree is clean for those roots.* [C7]
- The two non-recursive gate greps (`kernel/*.ts` globs) become directory-recursive with
  `--include='*.ts'`, plus a self-test asserting each grep's file count matches `find`. [F2]
- Red-first: a file added in `kernel/families/` shown changing the hash; a tracked-but-unhashed
  file shown failing the gate.

## Component 1 — The Epoch model, rebuilt [C1-C6, F5-F9, F22-F26, M1-M3, M8, N1/N2/N5]

**Epoch record (append-only, in the main store; RecordType extended — N1):**

```
Epoch {
  record_type: 'Epoch',
  epoch: number,                    // unique, strictly increasing along the chain
  tree_hash: string,                // git tree object (write-tree) — computable BEFORE commit [C1/F6]
  code_hash: Hash,                  // kernelCodeHash() of that tree — RE-DERIVED by the gate [C3/F5]
  grammar_version: number,
  runtime: { bun_version, os, arch },  // pins the engine, not just the code [M1/F25]
  review: { path, content_hash },   // Review doc IN the tree; must contain this epoch's code_hash
                                    // verbatim (un-recyclable); declarer ≠ review author asserted
                                    // from git authorship [C5/F9/N5]
  declared_by: string,              // [N5]
  parent: Hash | null,              // renamed from 'supersedes' — no collision with Supersede [N2]
  retroactive: boolean              // genesis Epoch-1 is permanently marked [C4]
}
```

**What the gate (step 7, rebuilt) asserts — every clause a computed fact, never a declaration:**

1. **Chain topology** [M2/F23]: exactly one root (`parent: null`), exactly one head, `epoch`
   numbers unique and strictly increasing along a single acyclic parent path. Violation →
   `ambiguous_epoch_chain`, gate fails.
2. **Historical re-derivation** [C3/F5]: for EVERY epoch, reconstruct `kernelCodeHash()` from git
   objects (`git ls-tree -r <tree_hash>` + `cat-file blob` — no checkout, works for all history)
   and assert equality with the declared `code_hash`. An epoch whose tree is absent or whose hash
   does not re-derive → gate failure, not a footnote.
3. **Head equals present**: current tree's computed hash == head epoch's `code_hash`. This single
   check subsumes v1's unmechanizable "same commit" rule [F26].
4. **Record binding** [F23/C4]: every Run/Result/Receipt carries `epoch_hash` (not just
   code_hash — a revert can give two epochs one code_hash). It must resolve to exactly one Epoch
   with matching code_hash, and that Epoch must have existed in the store **before** the record
   was computed. A record whose epoch was declared after it → permanently marked
   `epoch_declared_after_run: true`, and `verified` can never be true for it. Genesis exception:
   every Phase-1/2 record predates Epoch-1 and is marked exactly this way — the mechanism's first
   honest act is flagging its own history [C4/F22].
5. **Review binding** [C5/F9]: `review.path` exists in the epoch's tree, bytes hash to
   `content_hash`, the text contains the epoch's `code_hash` string verbatim, and git authorship
   of the review file differs from `declared_by`. *Stated limitation: git authorship is weak
   identity; this is the mechanizable half of Article II, and the residue is process — recorded,
   not hidden.*
6. **Revocation** [C6]: `EpochRevocation {epoch_hash, reason, evidence_ref, revoked_by}` is
   append-only; all records bound to a revoked epoch become quarantined — readable (I7) but
   `verified: false` everywhere, excluded from any published surface.
7. **Published-surface freshness** [M8]: every Receipt cited by any file under `reports/` either
   matches the head epoch or the page renders `verified: false` with a `stale_epoch` mark. An
   epoch bump produces a visible re-derivation queue, never silent staleness.
8. **Replay across epochs** [F7]: replay partitions traces by epoch; head-epoch traces must
   replay byte-identically and must number ≥1 (anti-vacuity preserved); prior-epoch traces report
   `deferred_to_epoch` — neither pass nor fail. **Every epoch-declaring commit must include a
   fresh evaluation run** so the new epoch's replay corpus is never empty.

**Reproduction, epoch-aware** [M3/F24]: `reproduce` on a non-head-epoch result refuses
`epoch_mismatch` and prints the exact two-part command — `git worktree add <tmp> <tree_hash>` +
`reproduce --store <path-to-head-store>` — never a misleading `identical: false`. The 107 existing
receipts' baked commands are superseded-with-disclosure by a `ReceiptAmendment` record, priors
visible. The Math.pow discharge claim from v1 is **withdrawn** [M1/F25]: epochs pin code and (now)
runtime identity; cross-machine byte-identity still waits on the deferred deterministic-pow fix,
which remains queued and NOT RUN.

## Component 2 — Grammar versioning and family birth certificates [F10, F13, F14, M7]

- `Spec.grammar_version` is **optional and absent for v1 specs** — canonicalize already treats
  undefined as absent, so all 136 existing registrations and 137 Results keep their hashes
  byte-for-byte; a golden-bytes test pins a v1 spec's canonical form forever [F10]. A spec whose
  `grammar_version` exceeds the running epoch's refuses `grammar_unavailable`.
- Families live in `kernel/families/<name>.ts` (sealed by Component 0), registered in a
  `FAMILIES` const carrying: validator, decision fn, slicers, refusal reasons, and a **written
  vacuity condition for each guard the family adds** [M7].
- Birth certificate, all six mechanized via `substrate/verify/families.ts` (inside the hash) [F13]:
  (1) family test file runs in-gate with assertions > 0; (2) every family refusal reason exists in
  `kernel/refusal.ts` (single owner); (3) golden-vector bytes committed and compared; (4) each
  family contributes ≥1 counted `@ts-expect-error` guard; (5) registry-driven unknown-field
  injection test (a family cannot forget strict validation); (6) each declared slicer appears in a
  canonical AdversaryReport fixture. `Slice.kind` becomes `{family, slicer}` validated against the
  registry [F14].

## Component 3 — The estate shapes [3a/3b/3c, F3/F4/F11/F12/F15-F21, M4/M5]

**3a. Dip-buy.** Interval widens from the hardcoded `'1day'` literal — a real substrate change,
epoch-declared, not "a parameter we already carry" [F17]. `(interval, periodsPerYear)` consistency
is refused in-kernel; `session_convention` (bar stamping, half-days, extended hours) becomes a
hashed input with a half-day red-first test [N3/F17]. **Value-vintage honesty** [F11]: DataSnapshot
gains `adjustment_basis` and `knowledge_basis` fields; dip-buy (a price-LEVEL family) declares
which basis it requires; AsOf guards timestamps, not adjustment vintage — that residue is named,
declared on every receipt, with its refusal path, not silently absorbed.

**3b. Rotation — the survivorship component, now honest about all three layers** [M5]:
- *Membership vs availability* [F3]: `loadUniverse` gains date-gated membership intervals from the
  UniverseSnapshot. A constituent outside its `[listed, delisted]` interval at as-of is a
  non-member (no refusal); an in-interval member with zero bars refuses. Red-first: mid-window IPO
  and mid-window delisting both shown working.
- *Delisting terminal value* [F4]: a declared, hashed `Frictions.delisting` policy
  (`refuse | liquidate_at_last_close | vendor_terminal_value`) with a mandatory adversary slice
  re-running under the alternate policy — sensitivity measured, never assumed.
- *Identity* [F19]: constituents key on a permanent `entity_id` (FIGI/CIK), never bare tickers;
  `ambiguous_symbol` refusal on recycled/renamed tickers.
- *Coverage floor* [F21/M5]: `UniverseSnapshot.coverage_from` declared; windows before it refuse
  `universe_coverage` — the cure cannot silently reproduce the disease.
- *The back door* [F12]: rotation-family specs REFUSE literal `universeAvailability` maps; they
  must reference `from_universe_series: <hash>`.
- *Cadence and gaps* [F18]: `UniverseSeries` declares cadence; a rebalance date without a
  snapshot within one cadence period refuses `universe_gap` (new reason, single owner).
- *Fold semantics* [F16]: the fold schedule becomes a hashed `EvalParams` variant
  (`uniform_calendar | cycle_aligned`); rotation refuses non-cycle-aligned schedules; whether
  estate comparison needs continuous-account semantics is a declared open question for W3 design.
- *Scale* [F15]: deferred store-index work (F30) lands before W3; per-symbol adversary slicing is
  replaced by declared cohort slices (survivor-vs-delisted remains mandatory) plus a bounded,
  declared top-k worst-symbol pass.
- *The sharpened vendor ask* [F20]: "Top 40 / TriSight 500" must be pinned down — a SCREEN over
  all listed names (reference+delisted endpoints suffice; the screen itself becomes an AsOf-gated
  hashed spec component) or INDEX MEMBERSHIP (needs a PIT constituents source, or the universe is
  declared a *reconstruction* on every receipt). This is now reserved decision #3 for Bob.

**3c. Earnings-event — measurement replaces both v1 options** [M4, adopted from Cato]: every
earnings-family Result is computed twice — once on the vendor calendar, once under a declared
perturbation (±1 trading day on every event date). The spread is a **mandatory adversary slice**;
the result refuses outright when the headline's sign flips or the spread exceeds a pre-registered
tolerance. Calendar knowledge-basis is still declared on the record, and any live caveat is
structural: `outcome_kind: 'caveated'`, and `verified` can never be true while any honesty flag is
live — one aggregation rule for all flags, now and future [N4].

## Component 4 — Adversary (unchanged in principle, family-registered slicers per Component 2)

An unrefutable family cannot register. Rotation's survivor-vs-delisted cohort slice and the
earnings perturbation-spread slice are mandatory, not optional.

## Component 5 — Waves, with the review-demanded proof obligations

| Wave | Contents | Proof obligations (all red-first) |
|---|---|---|
| **W0** | Recursive all-file code hash, grep hardening, clean-tree assertion | Subdirectory file changes hash; tracked-unhashed file fails gate; grep counts match find [C7/F1/F2] |
| **W1** | Epoch model: records, substrate/verify/, gate rebuild, TWO epochs declared atomically (Epoch-1 retroactive at the pre-W1 tree; Epoch-2 at W1's tree) + fresh run for Epoch-2's corpus | The eight attack cases from Cato M6, each shown failing first: no-epoch seal; false-code_hash epoch; after-the-fact blessing (marked, never verified); empty/whitespace/recycled review_ref; forked head; cyclic chain; revoked-epoch quarantine; weakened-verifier detection [M6/F22/F7] |
| **W2** | Dip-buy family (daily), session/interval consistency, adjustment-basis declarations; Oakwind Swing re-validation pre-registered and run | Family birth certificate (all six checks); zone golden vectors; lookahead property; basis caveat visible on receipt [F11/F13/F17] |
| **W3** | UniverseSnapshot/Series ingress, membership-aware loadUniverse, delisting policy, entity ids, F30 index; Top 40 2.0 re-validation | IPO/delisting red-firsts; coverage-floor refusal; literal-map refusal; survivor-vs-delisted slice quantifying the frozen-pool inflation [F3/F4/F12/F19/F21] |
| **W4** | EventSnapshot + earnings family with perturbation dual-run; Earnings-93 re-validation | Spread slice mandatory; sign-flip refusal shown firing; selected-93 vs all-eligible cohort slice [M4] |

Every wave: executor ≠ verifier, its own epoch with review record, fresh replay corpus, push on
completion. Every re-validation registered before evaluation, `registered_after_window: true`
disclosed forever.

## Decisions reserved for Bob (v2 ratification line)

1. **Ratify the rebuilt Epoch model** (Component 1) — now computed-from-git, not declared; both
   reviewers' minimum changes are incorporated.
2. **Earnings calendar**: ratify the measurement design (perturbation dual-run + mandatory spread
   slice) that replaced v1's caveat-vs-refusal question.
3. **Rotation universe semantics** [F20]: screen over all listed names, or index membership? (This
   determines whether the Massive reference endpoints suffice or a PIT-constituents source is
   needed — the plan-tier ask depends on your answer.)
4. **Wave order** W0→W4 as proposed, or reordered for Dick's priorities.

Nothing begins until you rule. The reviews that produced v2 are committed beside it.
