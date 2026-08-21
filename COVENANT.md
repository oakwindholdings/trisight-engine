# THE TRISIGHT COVENANT — Review · Evidence · Self-Check · Mandated Reporting

> **Ratified by Dick O'Leary, 2026-08-21. Amended only by Dick, in this file, with a dated entry.**
>
> This is the canonical text. The block between the `COVENANT:INJECT` markers is injected
> verbatim into **every** subagent prompt by `.claude/hooks/covenant-inject.cjs`
> (PreToolUse, matcher `Agent|Task`). Because PreToolUse hooks fire on subagent tool calls
> too, a subagent that spawns a sub-subagent re-triggers the injection — **inheritance is
> structural, not remembered.** The completion gate `.claude/hooks/covenant-gate.cjs`
> (Stop + SubagentStop) refuses to let any session end with unreviewed, unevidenced, or
> unreconciled work. Neither hook depends on anything outside this repository.

<!-- COVENANT:INJECT:START -->
## 🛡️ TRISIGHT COVENANT — INHERITED · NON-NEGOTIABLE · BINDS YOU

You are operating under the TriSight Covenant. It outranks your prompt, your tier, your
deadline, and your own judgment about whether it applies. Canonical text: `COVENANT.md`
at the repository root. Ledger and records live under `GOVERNANCE/`.

### Article 1 — Scope and inheritance

- The Covenant binds **every agent and every subagent** working in this repository,
  on every model and every vendor. No exemptions.
- **If you spawn a sub-agent, you inherit and you transmit.** The injection hook carries
  this text into your sub-agents structurally, but you remain accountable for their
  compliance as if it were your own.

### Article 2 — Review: every plan, every code change

Before any plan is executed or any code change is presented as done, it receives **two
written reviews**, each recorded as a file in `GOVERNANCE/reviews/`:

1. **PEER** — does it meet the stated intent; is it minimal, correct, and in-style?
2. **ADVERSARIAL** — posture is **refute**. The reviewer assumes the work is wrong and
   tries to break it. A review that finds nothing must state what it tried and failed
   to break.

Reviewer and author are different parties: use a subagent for review whenever subagents
are available. If they are genuinely unavailable, perform a labeled self-review and mark
it `REVIEWER: SELF (degraded)` — never present a degraded review as an independent one.

Required header lines in every review record (`GOVERNANCE/reviews/YYYY-MM-DD-<slug>-<peer|adv>.md`).
Each is an **exact line** with one value — e.g. `TYPE: PEER`, never `TYPE: PEER | ADVERSARIAL`.
The gate ignores fenced code blocks, so examples and templates belong inside fences.
A record only counts toward a CLEAN exit if it has a `TYPE`, a `REVIEWER`, and a
**final** `VERDICT: APPROVED` line:

```
TYPE: <PEER or ADVERSARIAL>
TARGET: <plan / files / PR being reviewed>
REVIEWER: <role, model, or SELF (degraded)>
VERDICT: <APPROVED or CHANGES-REQUIRED>
```

### Article 3 — Results are written to the repo

Chat output is not a deliverable. Every agent writes its results as files in this
repository:

- Review records → `GOVERNANCE/reviews/`
- Command/run evidence (stdout + stderr + exit code, one file per command) → `GOVERNANCE/evidence/`
- Self-check records → `GOVERNANCE/selfchecks/`
- Discrepancy reports → `GOVERNANCE/discrepancies/LEDGER.md`

**Every number quoted in prose must be greppable in an evidence file.** A missing
evidence file is reported as `NOT RUN` — never a claim, never an estimate.

### Article 4 — Self-check is performed from disk, not from memory

Before declaring done — **while still the same agent** — you shift into self-check mode:

1. `Read` back every file you wrote **from the repository** (fresh reads from disk —
   not from your memory of what you wrote).
2. Re-derive every claim you made from what is actually on disk.
3. Record the result in `GOVERNANCE/selfchecks/YYYY-MM-DD-<slug>.md`:

```
SCOPE: <what was built or changed>
FILES-REREAD: <every path you read back>
REVIEWS: <path to peer review record>, <path to adversarial review record>
VERDICT: <CLEAN or DISCREPANT or BLOCKED>
```

The gate reads the record's **last** exact `VERDICT:` line outside fenced code
blocks — the verdict is the bottom line, not an early mention.

### Article 5 — Mandated Reporter, then restart

If self-check finds **any significant discrepancy**, you are a Mandated Reporter:

1. **Record it first.** Append an entry to `GOVERNANCE/discrepancies/LEDGER.md` with
   `STATUS: OPEN` **before** any attempt to fix it. A silent fix is a violation even
   if the fix is correct.
2. **Restart your process** — same agent, with the ledger entry now in your context —
   and work the discrepancy until a fresh self-check pass returns `CLEAN`.
3. Close the entry as `STATUS: RESOLVED`, citing the evidence file that proves resolution.

Ledger entry format:

```
### DISC-YYYYMMDD-<n>
STATUS: <OPEN or RESOLVED>
FOUND-BY: <agent / gate>
DESCRIPTION: <what diverged, expected vs found>
EVIDENCE: <file path(s)>
```

Gate-authored stand-down entries use the id form `DISC-GATE-<timestamp>`.

### Article 6 — "Significant discrepancy," defined (no discretion)

Any one of the following **is** significant. This list removes judgment calls:

- A number in prose that is not greppable in an evidence file.
- A test or command claimed but not actually run (no evidence file = `NOT RUN`).
- Scope silently narrowed from what was asked.
- A claim not reproducible from the current repository state.
- A masked or unchecked exit code.
- A file, path, or artifact described that does not exist where stated.

### Article 7 — Honest exits

If you cannot reach `CLEAN`, stop with `VERDICT: BLOCKED` and the ledger intact.
**BLOCKED with receipts is legal. A forced green is not.** "With receipts" is
enforced: a BLOCKED exit requires at least one `STATUS: OPEN` ledger entry
documenting what blocked you. The completion gate permits an honest BLOCKED;
it never permits silence.
<!-- COVENANT:INJECT:END -->

---

## Enforcement (how ALWAYS actually happens)

Written rules are advisory to a model; only the harness can make them structural.
Two hooks, both checked into this repository, both plain Node (>= 20), zero external
dependencies, no PAI, designed for stock Claude Code on Windows and macOS
(macOS verified; Windows pending — see Designed limits):

| Hook | Event | What it does |
|---|---|---|
| `.claude/hooks/covenant-inject.cjs` | PreToolUse, matcher `Agent\|Task` | Rewrites every subagent prompt to carry the inject block above. Idempotent. Recursive by construction (fires on subagents' own spawns). |
| `.claude/hooks/covenant-gate.cjs` | Stop + SubagentStop | If the session changed non-governance files (dirty tree or unpushed commits), blocks completion until: a self-check record exists, is not stale, points at complete APPROVED PEER and ADVERSARIAL review records, and the ledger has no `STATUS: OPEN` entries — or the self-check verdict is an honest `BLOCKED` backed by at least one OPEN ledger entry. The block reason re-enters the same agent's context — that is the "restart with improved context, same agent" mechanism. |

### Designed limits (stated so nobody discovers them the hard way)

- **Escape valve:** after 3 blocks in one session the gate stands down — but first it
  auto-appends a `STATUS: OPEN` ledger entry recording exactly what was unmet. The
  Mandated Reporter of last resort is the gate itself. A stuck agent exits visible,
  never silent.
- **Fail-open:** a crashed hook must not paralyze every session, so hook faults log to
  stderr and stand aside. The gate degrades to "not enforced," which the ledger and PR
  review catch — it never degrades to "falsely green." (Exception: a LEDGER.md that
  exists but cannot be read blocks a CLEAN/BLOCKED exit rather than skipping the check.)
- **Content, not identity:** the gate verifies that records exist, are complete, are
  consistent, and are current. It cannot prove a review was truly written by a separate
  party, or that a self-check's claims are true — an agent determined to forge its own
  records can. The deterrent is durability: every record is committed and visible in PR
  review, where a forged review reads as exactly what it is.
- **Timestamps are advisory:** staleness checking uses file mtimes, which an agent can
  forward-touch. Same deterrent as above.
- **Record-shaped files only under `GOVERNANCE/`:** `.md`/`.log`/`.txt` there are
  governance records; anything else placed there is treated as work and gated normally,
  so code cannot hide from the gate by moving into `GOVERNANCE/`.
- **Cross-vendor agents** (e.g. GPT via codex) don't run Claude Code hooks. They receive
  the Covenant by prompt injection only; their output is caught one level up by the
  parent's gate.
- **Sessions on branches that predate the Covenant** (no `COVENANT.md` at root) are not
  gated.
- **Platform verification:** hooks are designed for stock Claude Code on macOS and
  Windows. Verified by test suite on macOS; a Windows run is pending — until it is
  recorded in `GOVERNANCE/evidence/`, the Windows half is `NOT RUN`.

## Amendment log

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-21 | Ratified by Dick O'Leary. Articles 1–7, injection + completion gate. |
