TYPE: PEER
TARGET: Covenant installation (COVENANT.md, .claude/hooks/*, settings.json, CLAUDE.md, GOVERNANCE/)
REVIEWER: general-purpose subagent (peer)
VERDICT: APPROVED

## Scope of review

Branch `feat/trisight-covenant`, uncommitted working-tree change. Reviewed every file in
the change, compared doc formats against the gate's parsers, verified settings.json against
git HEAD, ran the test suite, and drove both hooks end-to-end against fixture repos built
with the SHIPPED (not test-fixture) governance files.

Test suite result (Node v25.9.0, macOS):
`node --test .claude/hooks/covenant-hooks.test.cjs` → **tests 19, pass 19, fail 0, cancelled 0, skipped 0**.
Evidence: `GOVERNANCE/evidence/2026-08-21-covenant-install-02-node-test-green.log` matches what I observed.

## Findings

### 1. BLOCKER — the shipped ledger template permanently trips the gate (doc/parser drift, correctness defect)

- `GOVERNANCE/discrepancies/LEDGER.md:12` — the "Entry format" example contains the line
  `STATUS: OPEN | RESOLVED`.
- `.claude/hooks/covenant-gate.cjs:151` — `openLedgerCount` counts `/^STATUS:\s*OPEN\b/gm`
  matches. `\b` holds between `OPEN` and the following space, and the regex has no
  code-fence awareness, so the format example counts as a real OPEN entry.
- Verified live: `openLedgerCount(<repo>)` on the shipped LEDGER.md returns **1**.
- Verified end-to-end: a fixture repo using the SHIPPED LEDGER.md plus dirty work, a
  CLEAN self-check, and both review records gets
  `{"decision":"block","reason":"...LEDGER.md has 1 STATUS: OPEN entry..."}`. A fully
  compliant session can never exit CLEAN while the ledger template ships as-is.
- The test suite masks this: `.claude/hooks/covenant-hooks.test.cjs:60` builds its fixture
  ledger as `'# Ledger\n'` instead of the shipped template, so the green suite never
  exercises the file that actually ships.
- Fix options (author's choice): fence-strip before matching, tighten the regex to reject a
  trailing `| RESOLVED` continuation (e.g. `/^STATUS:\s*OPEN\s*$/m`), or reword the
  example lines so they cannot match — and add a test that runs the gate against the
  shipped LEDGER.md.

### 2. MAJOR — claimed .gitignore append is absent; GOVERNANCE/README.md makes a false claim

- The change description includes ".gitignore (2-line append)". Verified:
  `git diff HEAD -- .gitignore` is empty and `diff <(git show HEAD:.gitignore) .gitignore`
  reports identical. No append exists.
- `GOVERNANCE/README.md:24` states "Gate session state lives in `.claude/covenant-state/`
  (gitignored)." Verified false: `git check-ignore .claude/covenant-state/probe.json`
  exits 1 (not ignored).
- Consequence: per-session state files (`.claude/covenant-state/<session>.json`, written by
  `covenant-gate.cjs:159-163`) appear as untracked files and will be committed by any
  `git add -A`. The gate itself won't self-trip (GOV_DIRS at `covenant-gate.cjs:36`
  excludes the path from work-file detection), but the changeset does not match its claim
  and the README claim is untrue as shipped.

### 3. MINOR — ledger entry id format drift (doc vs gate)

- `COVENANT.md:94` documents entry headings as `### DISC-YYYYMMDD-<n>`.
- `covenant-gate.cjs:173` (exhaustion path) writes `### DISC-GATE-YYYYMMDDHHMMSS`.
- Functionally harmless — nothing parses the heading, only `STATUS:` lines — but it is
  format drift between the canonical doc and what the gate itself appends. Either document
  the `DISC-GATE-` form in Article 5 or emit the documented form.

### 4. MINOR — latent template-copy hazard in the other two parsers (same class as finding 1)

- A review record that copies the documented header line verbatim
  (`TYPE: PEER | ADVERSARIAL`, `COVENANT.md:45`) parses as `PEER` at
  `covenant-gate.cjs:139` because `\b` accepts the pipe continuation.
- A self-check copying `VERDICT: CLEAN | DISCREPANT | BLOCKED` (`COVENANT.md:77`) parses
  as `CLEAN` at `covenant-gate.cjs:124`.
- Unlike finding 1 this requires author error to fire, but the same regex tightening fixes
  all three at once.

### 5. MINOR — Windows claim is unevidenced

- `COVENANT.md:125` claims the hooks are "runnable on stock Claude Code on Windows and
  macOS"; `.claude/settings.json` uses sh-style `"$CLAUDE_PROJECT_DIR"` expansion in the
  hook commands. macOS is verified (this review). No evidence file records a Windows run,
  and Windows shell expansion of `$VAR` in hook commands is a known portability risk. By
  the Covenant's own Article 6 standard, the Windows half of that sentence is `NOT RUN`.
  Verify on the Windows machine before relying on enforcement there, or soften the claim.

### 6. NOTE — exported internals are unused by anything in the change

- `covenant-inject.cjs:116` and `covenant-gate.cjs:275` export their internals, but the
  test suite drives both hooks exclusively as subprocesses (by design, per the test file
  header). The exports are currently dead weight under a strict "no dead code" reading;
  they are harmless and I used them to find finding 1, so I'd keep them — noting for
  completeness.

## Verified correct (what I checked and could not fault)

- **settings.json**: valid JSON; `permissions` block byte-identical to git HEAD (diff hunk
  contains zero deletions inside permissions; structural compare equal; only additions plus
  the trailing-newline fix). Hooks block uses the correct top-level schema: PreToolUse
  matcher `Agent|Task`, Stop + SubagentStop; `{decision:"block",reason}` is the correct
  Stop-hook contract; `hookSpecificOutput.updatedInput` is the correct PreToolUse
  input-rewrite contract.
- **CLAUDE.md**: single 11-line "## 0. THE COVENANT" section inserted near the top; the
  diff contains no other hunks — rest of the file untouched.
- **COVENANT.md ↔ inject hook**: `extractCovenant` succeeds on the shipped file; the
  banner bytes match exactly (U+1F6E1 U+FE0F); idempotence, Task-name compatibility,
  non-agent passthrough, and markers-missing fail-open all verified by the suite and by
  direct runs. Recursion rests on PreToolUse firing for subagents' own Agent/Task calls,
  which is stock behavior; idempotence prevents double-stacking. Cross-vendor gap is
  honestly documented (COVENANT.md:141-143).
- **Gate semantics**: dirty-tree and ahead-of-upstream detection, governance-path
  exclusion (including rename-target handling and `--untracked-files=all`), staleness by
  mtime, PEER+ADVERSARIAL presence check, honest-BLOCKED exit, DISCREPANT block, and the
  3-block escape valve with auto-recorded OPEN ledger entry — all covered by passing tests
  I ran, and consistent with COVENANT.md Articles 2, 4, 5, 7 (modulo findings 1 and 4).
- **Code quality**: plain Node built-ins only (`fs`, `path`, `child_process`,
  `node:test`, `node:assert`, `os`); zero npm dependencies; zero PAI references; fail-open
  paths log to stderr and never emit a false allow/deny decision.

## Verdict rationale (initial review — superseded by the re-review below)

Finding 1 was a hard correctness defect that defeated the gate's core purpose out of the
box, and finding 2 was a changeset-vs-claim mismatch with a false statement in shipped
documentation. Per the review charter, any correctness defect or doc/parser drift forced
the initial CHANGES-REQUIRED. The architecture itself was sound and the fixes small.

---

## Re-review (post-fix), 2026-08-21 — same reviewer

The author fixed all findings plus adversarial-review hardening in the same checkout.
Every check below was re-run firsthand; the header verdict line above reflects this
re-review. All six original findings stand in the record above; their dispositions:

### Finding-by-finding verification

1. **BLOCKER (ledger template trips gate) — FIXED, verified three ways.**
   `covenant-gate.cjs` now strips fenced code blocks before all governance parsing
   (`stripFences`, covenant-gate.cjs:74-76) and uses exact-line, end-anchored regexes
   (`^STATUS:[ \t]*OPEN[ \t\r]*$` at :190; VERDICT/TYPE likewise) — pipe continuations
   no longer match. (a) Live: `openLedgerCount(<repo>)` on the current shipped LEDGER.md
   returns **0**. (b) I replayed my original end-to-end blocker fixture (shipped ledger +
   dirty work + CLEAN self-check + both reviews) against the fixed gate: empty stdout —
   ALLOW. (c) The suite now has a regression test that builds its fixture from the
   SHIPPED LEDGER.md (covenant-hooks.test.cjs:279-290), closing the fixture-masking gap.

2. **.gitignore / README claim — FIXED.** `git diff HEAD -- .gitignore` now shows the
   2-line append (`.claude/covenant-state/` at .gitignore:37);
   `git check-ignore .claude/covenant-state/x.json` exits 0. GOVERNANCE/README.md:24's
   "gitignored" claim is now true.

3. **DISC id drift — FIXED.** COVENANT.md:108 now documents gate-authored ids as
   `DISC-GATE-<timestamp>`, matching covenant-gate.cjs:212.

4. **Template-copy hazard — FIXED.** All three parsers are end-anchored;
   `TYPE: PEER | ADVERSARIAL` no longer parses (regression test at
   covenant-hooks.test.cjs:339-347 passes). COVENANT.md templates switched to
   `<PEER or ADVERSARIAL>` placeholder style, which I probed directly: placeholder lines
   match none of the parsers.

5. **Windows claim — FIXED (with one residual wording note below).** COVENANT.md:168-170
   ("Platform verification") now states the Windows half is `NOT RUN` until evidence
   lands in GOVERNANCE/evidence/.

6. **Unused exports — unchanged, accepted.** Still note-level; I again used the exports
   for firsthand verification, which is a legitimate consumer.

### Adversarial-review hardening spot-checked (not my findings, but re-verified as peer)

- Last-VERDICT-wins + fence-stripping in parseSelfCheck (covenant-gate.cjs:135-145).
- Review records must carry TYPE + REVIEWER + final `VERDICT: APPROVED`
  (covenant-gate.cjs:153-182); CHANGES-REQUIRED or stub records now block.
- BLOCKED exits require at least one OPEN ledger entry (covenant-gate.cjs:256-263),
  matching the amended Article 7 text.
- Unreadable LEDGER.md returns -1 and blocks instead of skipping (covenant-gate.cjs:184-191, :254-255).
- Non-record files under GOVERNANCE/ are gated as work (covenant-gate.cjs:58-67),
  matching the new Designed-limits bullet.
- Injection idempotency re-keyed to prompt-starts-with-full-covenant
  (covenant-inject.cjs:67-70); banner-substring suppression test passes.
- Doc-vs-parser consistency re-checked across Articles 2, 4, 5, 7 and Designed limits:
  no drift found — every documented format rule now matches the parser exactly, and the
  docs themselves state the fence-ignoring and last-line rules the code implements.

### Test suite (re-run firsthand)

`node --test .claude/hooks/covenant-hooks.test.cjs` (Node v25.9.0, macOS):
**tests 29, pass 29, fail 0, cancelled 0, skipped 0** — matching
`GOVERNANCE/evidence/2026-08-21-covenant-install-03-node-test-post-review.log`.

### settings.json (re-verified)

Valid JSON; `permissions` block still structurally identical to git HEAD; only
`permissions` and `hooks` at top level.

### Residual notes (non-blocking)

- COVENANT.md:135-136 still says the hooks are "runnable on stock Claude Code on Windows
  and macOS" in the Enforcement intro; the corrected NOT-RUN qualification lives at
  :168-170. Read as a whole the document is honest, but tightening the intro to
  "designed for" would remove the last unevidenced assertion.
- `stripFences` requires balanced fences; an unterminated fence leaves its content
  parseable. All shipped records use balanced fences and the failure direction in the
  ledger case is toward blocking, not false green. Worth remembering when writing records.
- GOVERNANCE/README.md does not yet mention the new non-record-files-are-gated rule; it
  makes no contrary claim, so this is a nit.

Re-review conclusion: all correctness defects and doc/parser drift from the initial
review are fixed and regression-tested; the hardening additions behave as documented.
The residual notes are wording/robustness nits that do not affect correctness. The
header line of this record carries the final verdict: APPROVED.
