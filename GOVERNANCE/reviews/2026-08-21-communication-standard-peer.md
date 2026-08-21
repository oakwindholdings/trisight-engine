TYPE: PEER
TARGET: Communication standard install (COMMUNICATION.md, covenant-inject.cjs, COVENANT.md, covenant-hooks.test.cjs), uncommitted delta on aabdfd0
REVIEWER: general-purpose subagent (peer)
VERDICT: APPROVED

## Scope of review

Uncommitted delta on `feat/trisight-covenant` at aabdfd0. I read every changed file,
fetched the source comment from GitHub (issue comment id 5374326918 on
oakwindholdings/trisight-engine PR #3, the only comment there — `pulls/3/comments` is
empty), diffed it against COMMUNICATION.md, probed the injection code live, and ran the
test suite.

Test suite: `node --test .claude/hooks/covenant-hooks.test.cjs` (Node v25.9.0, macOS):
tests 31, pass 31, fail 0, cancelled 0, skipped 0. Matches
`GOVERNANCE/evidence/2026-08-21-communication-standard-05-node-test.log` (EXIT=0).

## Findings

### F1 — MAJOR: the "verbatim" claim is false — the PR comment's entire "### Examples" section is missing

The change is presented as the PR #3 comment verbatim except a 3-line provenance header
and two disclosed typo fixes. Diffing the fetched comment (6318 bytes, CRLF) against
COMMUNICATION.md shows a third, undisclosed difference: the comment ends with a
"### Examples" section of about 67 lines (Simple Investigation, Engineering
Recommendation, Summarizing a blog — each with To do / Not to do blocks) that
COMMUNICATION.md omits entirely. COMMUNICATION.md ends at line 91 ("ref = ...");
the comment continues past that point.

Dick may have ratified a no-examples variant in the chat session ("option 2"), but no
record available to this review says so, and the change description says "verbatim". Per
Covenant Article 6 an undisclosed scope reduction is a significant discrepancy. Two
acceptable resolutions, author's choice: restore the Examples section, or disclose the
omission explicitly (change description + COMMUNICATION.md provenance header) with the
ratification recorded. Until one happens, the change does not do what it claims.

### F2 — TRIVIAL: one undisclosed whitespace normalization

The comment's "## Purpose " (trailing space) became "## Purpose". Whitespace-only, as is
the CRLF-to-LF conversion. No action needed beyond noting it here.

### F3 — NOTE: transitional double-injection

A prompt injected before this change starts with the covenant only. With
COMMUNICATION.md present it no longer matches the new full-preamble idempotency key, so
the hook prepends the full preamble again and the covenant appears twice. Verified live.
Harmless and self-limiting (only affects prompts spanning the upgrade), no action needed.

### F4 — NOTE: degraded-mode wording in the injected Article 3 line

The new Article 3 sentence says COMMUNICATION.md "is injected below this Covenant" and
sits inside the inject markers. When COMMUNICATION.md is absent the injected text
references a standard that is not below it. Mildly inaccurate in exactly the degraded
case; the file path is named, so a subagent can still find it if it exists. No action
required.

## Verified correct

- The two disclosed typo fixes are real and exact: "#### negative Patterns" to
  "#### Negative Patterns" (comment line 19) and "when the improve navigation" to
  "when they improve navigation" (comment line 52). Apart from F1 and F2 they are the
  only text differences vs the comment.
- The provenance header is 3 blockquote lines plus a blank, as described.
- Injection: `extractCommunication` returns COMMUNICATION.md trimmed, byte-equal to the
  file (verified live); preamble order is covenant, then "---", then communication, then
  "---", then task (verified live and by the new ordering test); idempotency keys on the
  full preamble and a re-injection emits nothing (verified live and by the new test).
- Absence degrades to exactly the old behavior: `buildPreamble(covenant, null)` is the
  covenant string itself and the resulting injection is byte-identical to the pre-change
  output (verified live). Empty COMMUNICATION.md also degrades to covenant-only. All 12
  pre-existing inject/gate fixture repos have no COMMUNICATION.md, so the old behavior
  stays under test.
- Fail-open is preserved: `extractCommunication` swallows read errors and returns null.
- COVENANT.md doc changes match the code: Article 3 binding, enforcement-table row
  ("followed by COMMUNICATION.md verbatim when that file is present"), amendment log
  1.1.0. No doc/parser drift introduced — the gate does not parse COMMUNICATION.md.
- The change is minimal: three files plus one evidence log, exports updated to match the
  new functions, no unrelated edits.

## Verdict rationale (initial review — superseded by the re-review below)

The mechanics (F3, F4 aside, both notes) were correct, minimal, and well tested. F1 was
a false verbatim claim covering a 67-line omission from the ratified source text, which
the charter and Covenant Article 6 both treat as blocking. It forced the initial
CHANGES-REQUIRED.

---

## Re-review (post-fix), 2026-08-21 — same reviewer

The author restored the omitted section and recorded the discrepancy. Every check below
was re-run firsthand. The header verdict line above reflects this re-review.

### F1 — FIXED, verified by independent diff

I re-diffed COMMUNICATION.md (provenance header removed) against my own previously
fetched copy of GitHub comment 5374326918 (CR stripped). The "### Examples" section is
restored and byte-identical through end of file. The complete remaining delta vs source:

1. The disclosed 3-line provenance header (plus one blank line).
2. The two disclosed typo fixes ("#### negative Patterns" to "#### Negative Patterns",
   "when the improve navigation" to "when they improve navigation").
3. The F2 whitespace normalization ("## Purpose " trailing space dropped; CRLF to LF).

Nothing else differs. Item 3 is now also disclosed, in the DISC-20260821-9 resolution
note, which closes F2 as well.

### Ledger record confirmed

DISC-20260821-9 (GOVERNANCE/discrepancies/LEDGER.md:81-89) records the omission, cites
this review as FOUND-BY/EVIDENCE, and carries a resolution note naming the restore and
the remaining disclosed deltas. Live `openLedgerCount` on the repo: 0.

### Gate machinery confirmed working during the fix cycle

The coordinator reported the shipped-ledger regression test failed while DISC-9 was OPEN
and passed after resolution. I verified the mechanism firsthand: a fixture built from the
CURRENT shipped ledger plus one appended STATUS: OPEN entry (reproducing the intermediate
state) blocks a fully-recorded CLEAN exit; with the ledger as now shipped (DISC-9
RESOLVED) the same fixture allows. That is the designed record-before-fix loop operating
on a real discrepancy.

### Trust-boundary bullet (adversarial recommendation)

New Designed-limits bullet at COVENANT.md:157-160: COVENANT.md's inject region and
COMMUNICATION.md reach every prompt verbatim, so editing either carries amendment-level
authority (Dick-only, diff-visible). Accurate description of the code's behavior; no
code change needed and none made.

### Test suite (re-run firsthand)

`node --test .claude/hooks/covenant-hooks.test.cjs` (Node v25.9.0, macOS): tests 31,
pass 31, fail 0, cancelled 0, skipped 0. Matches
`GOVERNANCE/evidence/2026-08-21-communication-standard-06-node-test-post-restore.log`
(EXIT=0).

### Scope check

`git diff HEAD --stat` shows exactly the four expected tracked files (test, inject hook,
COVENANT.md, LEDGER.md) plus untracked COMMUNICATION.md and the two evidence logs. No
unrelated edits. F3 and F4 stand as notes with no action taken, per the initial review.

Re-review conclusion: the omission is restored, disclosed, and ledgered; the injected
content now matches the ratified source except for disclosed deltas; the suite is green
and evidenced. Nothing blocking remains. Final verdict is in the header: APPROVED.
