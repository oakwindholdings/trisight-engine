# Discrepancy Ledger — Mandated Reporter record (Covenant Article 5)

Append-only. A significant discrepancy is recorded here with `STATUS: OPEN`
**before** it is fixed. Entries are closed as `STATUS: RESOLVED` with the
evidence file that proves resolution. The completion gate refuses a CLEAN
exit while any entry is OPEN, and records its own stand-downs here.

Entry format:

```
### DISC-YYYYMMDD-<n>
STATUS: <OPEN or RESOLVED>
FOUND-BY: <agent / gate>
DESCRIPTION: <what diverged, expected vs found>
EVIDENCE: <file path(s)>
```

---

### DISC-20260821-1
STATUS: RESOLVED
FOUND-BY: peer reviewer (2026-08-21-covenant-install-peer.md), finding 1 (BLOCKER)
DESCRIPTION: Shipped LEDGER.md format-example line "STATUS: OPEN | RESOLVED" matches openLedgerCount regex (covenant-gate.cjs:151); openLedgerCount on the shipped ledger returns 1, so a fully compliant session can never exit CLEAN. Test suite masked it by using a minimal fixture ledger instead of the shipped file.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md

### DISC-20260821-2
STATUS: RESOLVED
FOUND-BY: peer reviewer, finding 2 (MAJOR)
DESCRIPTION: Claimed .gitignore append does not exist in the changeset (git diff HEAD -- .gitignore is empty; the append landed in the OLD worktree copy or was lost), and GOVERNANCE/README.md claims .claude/covenant-state/ is gitignored - false per git check-ignore. Claim not reproducible from repo state (Article 6).
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md

### DISC-20260821-3
STATUS: RESOLVED
FOUND-BY: peer reviewer, findings 3+4 (MINOR)
DESCRIPTION: Doc/parser drift: exhaustion entries use DISC-GATE-<timestamp> vs documented DISC-YYYYMMDD-<n>; and a record copying the documented header verbatim ("TYPE: PEER | ADVERSARIAL", "VERDICT: CLEAN | ...") parses as PEER/CLEAN - parser accepts pipe continuations.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md

### DISC-20260821-4
STATUS: RESOLVED
FOUND-BY: peer reviewer, finding 5 (MINOR)
DESCRIPTION: COVENANT.md claims Windows support; no evidence file records a Windows run. By Article 6 that claim is NOT RUN until verified on a Windows machine.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md

### DISC-20260821-5
STATUS: RESOLVED
FOUND-BY: adversarial reviewer (2026-08-21-covenant-install-adv.md), F1 (BYPASS)
DESCRIPTION: parseSelfCheck takes the FIRST line-start VERDICT: match over raw markdown incl. fenced blocks; an early "VERDICT: BLOCKED" line (e.g. fenced template) short-circuits review+ledger checks while the human-visible bottom line says CLEAN.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md

### DISC-20260821-6
STATUS: RESOLVED
FOUND-BY: adversarial reviewer, F2 (BYPASS)
DESCRIPTION: Injection idempotency keys on a guessable literal banner substring; a parent embedding that substring anywhere in the child prompt suppresses covenant injection entirely, defeating Article 1 structural inheritance.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md

### DISC-20260821-7
STATUS: RESOLVED
FOUND-BY: adversarial reviewer, F3 (BYPASS)
DESCRIPTION: checkReviews accepts any two files containing TYPE lines; never reads REVIEWER or the review's own VERDICT, so two stub files (even VERDICT: CHANGES-REQUIRED) self-certify a CLEAN exit.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md

### DISC-20260821-8
STATUS: RESOLVED
FOUND-BY: adversarial reviewer, D1/D2/D3/D5
DESCRIPTION: Undocumented design limits: mtime forward-touch defeats staleness (D1); work hidden under GOVERNANCE/ path prefix escapes gating (D2); bare VERDICT: BLOCKED needs no backing ledger entry (D3); unreadable LEDGER.md silently drops the OPEN check (D5). D2/D3/D5 are fixable; D1 to be documented.
EVIDENCE: GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md

## Resolutions (2026-08-21, covenant-install session)

- DISC-20260821-1, -5: gate parses fence-stripped text with exact-line, last-match
  VERDICT/STATUS regexes (covenant-gate.cjs stripFences + parseSelfCheck + openLedgerCount).
- DISC-20260821-2: .gitignore append landed for real (git check-ignore verified); README claim now true.
- DISC-20260821-3: COVENANT.md documents DISC-GATE-<timestamp> ids; pipe-continuation lines no longer parse.
- DISC-20260821-4: Windows claim corrected to "pending / NOT RUN until evidence recorded" (COVENANT.md Designed limits).
- DISC-20260821-6: injection idempotency re-keyed to prompt-starts-with-full-covenant.
- DISC-20260821-7: review records must have TYPE + REVIEWER + final VERDICT: APPROVED to count.
- DISC-20260821-8: D2 closed (non-record files under GOVERNANCE/ are gated), D3 closed (BLOCKED
  requires an OPEN entry), D5 closed (unreadable ledger blocks), D1 documented as designed limit.
- EVIDENCE for all: GOVERNANCE/evidence/2026-08-21-covenant-install-03-node-test-post-review.log
