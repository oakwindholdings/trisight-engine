# Round-2 Directives — Quality Matrix & Evidence Ledger

*Prepared for Bob Stewart · Oakwind strategy estate · 2026-08-19*
*Status: PLAN — pending peer + adversarial review, then Bob's approval before any execution.*

This matrix converts Dick's round-2 answers into a mapped, evidence-gated work plan. Its
purpose is anti-hallucination: **no step may be marked done without a checkable evidence
artifact recorded in its row.** A sub-agent cannot claim an action or a result — it must
produce the artifact, and a different party must open that artifact to verify it.

---

## Evidence Protocol (binding on every row)

1. **No evidence file = NOT RUN.** A row's status may read VERIFIED only when its Evidence
   cell names a real, openable artifact: a committed file path, a content hash (`sha256:…`),
   a captured command-output file, or a git commit SHA. An assertion is not evidence.
2. **Executor ≠ Verifier.** The party that does the work records the evidence; a *different*
   party (an independent agent, or Bob) opens the evidence and confirms it says what the row
   claims. Both are named in the row.
3. **Provenance per row.** Every row cites the verbatim Dick directive it traces to. No row
   exists without a directive or an explicit Bob instruction.
4. **Status is monotone and honest.** Allowed: `NOT STARTED` → `IN PROGRESS` → `DONE-UNVERIFIED`
   → `VERIFIED`; plus `BLOCKED` (needs a dependency) and `ESCALATED` (needs a Bob/Dick decision).
   A step never skips to VERIFIED. A step that cannot produce its evidence goes BLOCKED or
   ESCALATED, never silently DONE.
5. **Small steps only.** Each row is a single verifiable increment. If a row can't be proven
   in one artifact, it must be split.
6. **The matrix is the system of record.** This file is updated in-place as work proceeds;
   every status change is a git commit, so the ledger's own history is auditable.

Status legend: 🔲 NOT STARTED · 🔄 IN PROGRESS · 📝 DONE-UNVERIFIED · ✅ VERIFIED · ⛔ BLOCKED · ⤴️ ESCALATED

---

## Work Items

### WI-1 · Recover or honestly re-derive the Top 40 2.0 "213.07%" validation
**Directive (Dick, verbatim):** *"You need to find them missing details from the original
valdation for 213% CAGR ... your 'efforts' instead of that remain a DISMAL FAILURE."*
**Reading:** He rejects substitute numbers (−32.42% / 88.44%). He wants the ORIGINAL
validation recovered — or, if truly unrecoverable, that fact proven to his standard.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 1.1 | Exhaustively re-confirm the 118MB score-matrix cache is absent | Search of working tree, ALL git refs, and the estate filesystem for `top40_scored_matrix_massive-trisight-universe_3317_2023-04-10_2026-04-17_v1.pkl` (118,501,504 bytes) returns nothing | Captured command output file: `evidence/wi1.1-cache-search.txt` listing the exact commands + empty results, plus the near-twin's location so it isn't mistaken for the real one | agent | Bob or 2nd agent | 🔲 |
| 1.2 | Determine whether an honest re-validation run is even possible (inputs still exist) | A written go/no-go: which inputs the original run needed, which survive, which are gone | `evidence/wi1.2-revalidation-feasibility.md` citing each input's presence/absence with file:line or hash | agent | 2nd agent | 🔲 |
| 1.3 | **ESCALATION POINT** — present Bob the fork: (a) fund a full point-in-time re-validation run, or (b) formally retract the sealed 213.07% | Bob records a decision | Bob's ruling logged in this matrix | Bob | — | ⤴️ |

### WI-2 · Re-run the date-less backtests so the artifacts declare their own windows
**Directives (verbatim):** Oakwind Swing — *"Re-run so the artifact declares its dates ...
the idea that we executed 9,408 in one day is highly unlikely. You should have checked
further before presenting such nonsense to me."* Same for Oakwind Investor and Long Shadow.
**Reading:** The artifacts lack windows AND the trade-count-vs-window is internally
incoherent. He wants re-runs that embed real dates; and he caught a logic gap we missed.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 2.1 | Reproduce the "9,408 executed" coherence problem | Show, with numbers, why 9,408 executed with no window is incoherent (implied per-day rate) | `evidence/wi2.1-trade-count-coherence.md` with the arithmetic | agent | 2nd agent | 🔲 |
| 2.2 | Locate the three backtest generators and confirm whether they can emit windows | For each of Oakwind Swing / Investor / Long Shadow: the generator script path + whether it records span | `evidence/wi2.2-generators.md` with file:line per strategy | agent | 2nd agent | 🔲 |
| 2.3 | **ESCALATION POINT** — re-running production backtests is estate compute with its own blast radius; get Bob's go before executing any run | Bob records go/no-go per strategy | Bob's ruling in this matrix | Bob | — | ⤴️ |
| 2.4 | (If approved) Re-run each; artifact embeds `window_from`/`window_to` | New artifact declares its dates; trade count reconciles to the window | New artifact path + `sha256`, logged per strategy | agent | 2nd agent | ⛔ (blocked on 2.3) |

### WI-3 · Determine the execution venue definitively — do not ask Dick to bless a guess
**Directive (verbatim):** *"LOL - you are sking me to validate if your 'guess' is right. NFW."*
**Reading:** He won't confirm our INFERRED "TriSight Sim." We must establish it from the code.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 3.1 | Trace where each ledger's fills are actually priced/written | For each strategy runner: the code path that produces a fill (sim pricing vs broker call) | `evidence/wi3.1-venue-trace.md` with file:line per strategy runner | agent | 2nd agent | 🔲 |
| 3.2 | State the venue per strategy as MEASURED (not INFERRED) | A venue label per strategy backed by the code trace | Table in `evidence/wi3.1-venue-trace.md`; each cell cites its trace | agent | 2nd agent | 🔲 |

### WI-4 · Verify Dick's stated fact: Automated Swing = Manual Swing (params identical, execution differs)
**Directive (verbatim):** *"The strategy parameters are identical, just the execution is
different. Either way, you should be addressing FIXING this rather than asking to do it for you."*
**Reading:** An owner assertion rules ACTION, not FACT — verify it against the code.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 4.1 | Diff the two strategies' parameter sets | Show identical params, different execution path — or the exact divergences if not identical | `evidence/wi4.1-auto-vs-manual-diff.md` with file:line for both | agent | 2nd agent | 🔲 |
| 4.2 | Determine whether Auto Swing was validated separately or reused Manual's backtest | A sourced yes/no with the artifact that settles it | `evidence/wi4.2-auto-validation-provenance.md` | agent | 2nd agent | 🔲 |

### WI-5 · Find the evidence behind High 5's 92.33% claim (do not frame it as a "gap")
**Directive (verbatim):** *"THERE IS NO GAP - YOU NEED TO FIND THE EVIDENCE THAT SUPPORTS THE ORIGINAL."*

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 5.1 | Locate the sealed-benchmark run that produced 92.33% / 5,321 trades | The run artifact + whether its inputs are reproducible (to Top-40 standard) | `evidence/wi5.1-high5-benchmark.md` citing the artifact + repro status | agent | 2nd agent | 🔲 |

### WI-6 · Prepare Escalator Reclaimed Shadow's actual review content
**Directive (verbatim):** *"how would i know - you still have giving me NOTHING as evidence or
validation to review."*
**Reading:** This strategy never had real evidence presented — only a housekeeping question.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 6.1 | Extract Escalator Shadow's claim + realized into the normalized-inputs format | A normalized-inputs entry with sourced claim/realized/flags | Committed entry + source citations per field | agent | 2nd agent | 🔲 |

### WI-7 · Apply the ratified Oakwind Investor ruling as a standing rule
**Directive (verbatim):** *"Yes — note it, don't refuse (apply as a standing rule)."*
**Reading:** A CLEAN owner ruling — the one closure round 2 produced. Apply it.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 7.1 | Change Oakwind Investor's CAGR verdict from REFUSED to NOTED-with-caveats | The verdict updated in the study data | git commit SHA of the change + before/after quote | agent | 2nd agent | 🔲 |
| 7.2 | Record "note computable-but-caveated returns, don't refuse" as a standing study rule | The rule written into the study's methodology doc | Committed rule text + path | agent | Bob | 🔲 |

---

## Cross-cutting escalations for Bob (decisions the plan cannot make itself)

- **E-1 (from WI-1.3):** Fund a full Top-40 re-validation run, or formally retract the sealed
  213.07%? Dick will not accept a substitute number.
- **E-2 (from WI-2.3):** Approve re-running the three date-less production backtests?
- **E-3 (scope):** Several directives ask us to *fix* the strategies' evidence base, not just
  review it ("you should be addressing FIXING this"). That expands ASSAY from verification to
  remediation. Confirm that scope expansion before execution.

## What this plan deliberately does NOT do yet
- It does not execute any work item — execution is gated on Bob's approval of this plan and on
  the escalation decisions above.
- It does not touch the schema, UI, or round-3 content — those are the explicitly later phases.

## Definition of Done for the PLAN (this document)
Every Dick round-2 directive maps to at least one WI row; every row has objective acceptance
criteria and a named un-fakeable evidence artifact; every irreversible/estate-compute step is
an explicit escalation, not an assumed action. Pending: peer + adversarial review of this plan.
