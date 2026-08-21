SCOPE: Installation of the TriSight Covenant - COVENANT.md, covenant-inject.cjs, covenant-gate.cjs, covenant-hooks.test.cjs, settings.json hook wiring, CLAUDE.md section 0, GOVERNANCE scaffold, .gitignore append
FILES-REREAD: COVENANT.md, .claude/hooks/covenant-inject.cjs, .claude/hooks/covenant-gate.cjs, .claude/hooks/covenant-hooks.test.cjs, .claude/settings.json, CLAUDE.md, GOVERNANCE/README.md, GOVERNANCE/discrepancies/LEDGER.md, GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md, GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md, GOVERNANCE/evidence/2026-08-21-covenant-install-03-node-test-post-review.log, .gitignore
REVIEWS: GOVERNANCE/reviews/2026-08-21-covenant-install-peer.md, GOVERNANCE/reviews/2026-08-21-covenant-install-adv.md

Claims re-derived from disk (Article 4 - fresh reads, not memory):

- Test suite: evidence log 03 ends `EXIT=0`; 29 pass / 0 fail lines counted in the log itself.
- Ledger: `grep -c '^STATUS: OPEN$'` on GOVERNANCE/discrepancies/LEDGER.md returns 0; all 8
  DISC-20260821 entries read `STATUS: RESOLVED` with a resolutions section citing evidence log 03.
- Both review records exist on disk with header `TYPE:` lines, `REVIEWER:` lines, and final
  `VERDICT: APPROVED` after their round-2 sections (verified via the gate's own parser in the
  live smoke test recorded in evidence log 04).
- settings.json parses as JSON; permissions block unchanged vs git HEAD (peer re-verified).
- .gitignore contains `.claude/covenant-state/`; `git check-ignore` confirms.
- Known honest gaps: Windows run is NOT RUN (documented in COVENANT.md Designed limits and the
  PR checklist); hooks unexercised by a real Claude Code Stop event until first live session.

VERDICT: CLEAN
