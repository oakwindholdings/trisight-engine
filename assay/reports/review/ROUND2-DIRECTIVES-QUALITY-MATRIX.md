# Round-2 Directives — Quality Matrix & Evidence Ledger

*Prepared for Bob Stewart · Oakwind strategy estate · 2026-08-19*
*Status: PLAN v6 — CONVERGED. Three review cycles + confirmation + convergence pass; findings
15 → 16 → 8 → 1 (the last a citation-attribution fix, applied). Both peer and adversarial review
complete; every reviewer claim source-verified before applying. Read-only execution lane ready on
Bob's go; heavy/estate-compute and anything to Dick remain gated (Gates C/D).*

This matrix converts Dick's round-2 answers into a mapped, evidence-gated work plan. Its
purpose is anti-hallucination: **no step may be marked done without a checkable evidence
artifact recorded in its row.** A sub-agent cannot claim an action or a result — it must
produce the artifact, and a different party must independently re-derive it.

---

## Evidence Protocol (binding on every row)

1. **No evidence file = NOT RUN.** A row reads VERIFIED only when its Evidence cell names a
   real, openable artifact: a committed file path, a content hash (`sha256:…`), a captured
   command-output file, or a git commit SHA. An assertion is not evidence.
2. **Executor ≠ Verifier, both named.** The party doing the work records the evidence; a
   *different, named* party confirms it. "Bob or agent" is not a valid Verifier cell.
2a. **Citations are quoted, not pointed.** Any evidence artifact citing `file:line` or a
   "sourced" fact MUST inline the verbatim excerpt from that location, per the estate's own
   DEFECT-REGISTRY convention (e.g. `high_5_strategy.py:87 ENTRY_WINDOW_END_HHMM_ET=1555`).
   A bare path/line pointer does not satisfy this protocol.
2b. **Verification is re-derivation, not sign-off.** The Verifier does not close a row by
   reading the Executor's prose and agreeing. For each citation the Verifier opens the source
   itself, confirms the quoted excerpt is accurate AND dispositive (not merely related), and
   independently re-derives the row's factual predicate. The Verifier records their own
   evidence line.
3. **Provenance per row.** Every row cites the verbatim Dick directive it traces to. The
   coverage table below proves all 10 directives are mapped.
4. **Status is monotone and honest.** `NOT STARTED` → `IN PROGRESS` → `DONE-UNVERIFIED` →
   `VERIFIED`; plus `BLOCKED` (needs a dependency) and `ESCALATED` (needs a Bob/Dick decision).
   A step never skips to VERIFIED. A step that cannot produce its evidence goes BLOCKED or
   ESCALATED, never silently DONE.
5. **Small steps only.** One verifiable increment per row; split anything that can't be proven
   in one artifact.
6. **The matrix is the system of record.** Every status change is its own git commit, so the
   ledger's own history is auditable.
7. **Escalation rulings need out-of-band evidence.** Because agents edit this file, an agent
   could TYPE a fake Bob ruling into an ESCALATED row. A logged escalation decision is only
   VERIFIED when its Evidence cell points to something an agent cannot author: a Bob message
   quoted with its source, or a commit whose author is Bob. An agent-typed "Bob decided X" is
   NOT RUN.
8. **Balance every directive against our data — never face value.** *(Bob, 2026-08-19,
   verbatim: "ANY DIRECTIVE FROM DICK MUST BE BALANCED WITH ACTUAL DATA AND FACTS WE HAVE NOT
   TAKEN AS SUCH ON FACE VALUE.")* An owner directive rules ACTION, not FACT (estate
   STANDING-ORDER-2). Before any fix is built, its WI must carry a **Directive-vs-Data
   reconciliation** classifying the directive against the four quadrants — known-knowns (both
   agree), known-unknowns (we know we're missing it), unknown-knowns (our data shows something
   Dick's directive doesn't account for), unknown-unknowns (surfaced only by adversarial
   probing). Where a fix needs inputs or definitions we lack, we DRAFT a specific elaboration
   question about Dick's INTENDED approach — held for the Gate-C review, never sent unreviewed.

Status legend: 🔲 NOT STARTED · 🔄 IN PROGRESS · 📝 DONE-UNVERIFIED · ✅ VERIFIED · ⛔ BLOCKED · ⤴️ ESCALATED · 🟢 RULED (owner decision recorded per Rule 7)

*Rule-7 note: Bob RATIFIED the E-1/E-2/E-4 rulings and the plan on 2026-08-19 (verbatim: "ratified — go, start work"), the out-of-band confirmation Rule 7 asks for. The rulings are ✅ ratified; execution of the read-now (verification/evidence-gathering) lane is authorized. The two heavy estate-compute steps (WI-1.3b re-validation run, WI-2.4 backtest re-runs) still pass through their own feasibility gates (WI-1.3a, WI-2.2) before running; nothing reaches Dick before Gate C; no remediation PR merges before Gate D.*

---

## Coverage table — all 10 directives map to a work item

| # | Directive key | Verbatim (short) | Work item |
|---|---------------|------------------|-----------|
| 1 | top-40-2-0/verdict-0 | "find the missing details from the original validation for 213% CAGR" | WI-1 |
| 2 | oakwind-swing-trader/claim-window | "Re-run so the artifact declares its dates … 9,408 in one day is unlikely" | WI-2 |
| 3 | oakwind-investor-daily/claim-window | "Re-run so the artifact declares its dates" | WI-2 |
| 4 | escalator-reclaimed-long-shadow/claim-window | "Re-run so the artifact declares its dates" | WI-2 |
| 5 | oakwind-swing-trader/realized-ledger | "you are asking me to validate if your 'guess' is right. NFW" | WI-3 |
| 6 | automated-swing-trading/claim-window | "parameters are identical, just the execution is different … FIXING this" | WI-4 |
| 7 | high-5/claim-window | "THERE IS NO GAP — FIND THE EVIDENCE THAT SUPPORTS THE ORIGINAL" | WI-5 |
| 8 | escalator-reclaimed-shadow/claim-doc | "you still have given me NOTHING as evidence or validation to review" | WI-6 |
| 9 | oakwind-investor-daily/verdict-0 | "Yes — note it, don't refuse (apply as a standing rule)" | WI-7 |
| 10 | manual-swing-trading/realized-ledger | "There were no real trades … I have no idea what you are referencing" | WI-8 |

---

## Work Items

> **Authoritative current status = the Execution Status Ledger at the end of this document.**
> The per-step 🔲 markers in the tables below were the *pre-execution plan*; after the
> 2026-08-19 execution wave (executor≠verifier), the ledger holds the verified current state.

### WI-1 · Compile the established Top 40 2.0 "213.07%" validation facts and escalate
**Directive (verbatim):** *"You need to find the missing details from the original validation
for 213% CAGR … your 'efforts' instead of that remain a DISMAL FAILURE."*
**Reading (corrected by review):** He rejects substitute numbers (−32.42% / 88.44%) and wants
the ORIGINAL validation. The estate record already establishes this is **unrecoverable by
construction**: the sealed cache's SHA256 was never recorded (D58), so even a byte-exact file
could not be proven to be it — and same-named decoys exist on disk. So WI-1 is not a fresh
investigation; it is compiling the settled facts for Bob's decision, with one hard guard
against the known cache-name trap.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 1.1 | Confirm the sealed cache is not present in any real form, guarding the near-twin trap | Search names EXACT targets: working tree; `git log --all --source`; AND the production mount `/trisight-volume/backtest_results/`. ANY filename hit must be reconciled against the sealed identity (**118,501,504 bytes / 3,317 symbols**) and against the two known decoys (`…massive-trisight-universe_3317…` at 112,428,132 B on the volume; `…top40-2-authority-universe_2666…` at 92,743,878 B / 2,666 symbols in 11+ locations) — a hit is NOT the sealed artifact unless byte count and symbol count both match | `evidence/wi1.1-cache-search.txt`: raw unedited stdout of every command incl. the volume mount; plus an identity-reconciliation table showing each hit's bytes/symbols vs the sealed identity and both decoys | agent | 2nd agent re-runs identical commands from a clean shell incl. the volume mount, attaches own output; packet then reviewed by Bob at 1.3 | 🔲 |
| 1.2 | Record that the cache is unverifiable even if a candidate surfaces | State, quoting D58 verbatim, that the seal recorded path+size but never a SHA256, so no candidate can be proven to be the sealed artifact | `evidence/wi1.2-unverifiable.md` with the verbatim D58 excerpt quoted inline | agent | 2nd agent opens D58, confirms the quote is exact and dispositive | 🔲 (fact established in D58, but per Rule 1 the row stays NOT STARTED until evidence/wi1.2-unverifiable.md exists and a 2nd party re-derives it) |
| 1.3 | **E-1 RULED GO** (Bob 2026-08-19): fund a full point-in-time re-validation run producing a NEW verifiable number; retraction is the fallback if the run proves infeasible | Bob's ruling recorded | Bob's verbatim ruling quoted in the Escalations section (Rule 7; conversation-sourced) | Bob | — | 🟢 RULED |
| 1.3a | Feasibility pre-check BEFORE any compute: are the required inputs present (MASSIVE key, universe-resolution pipeline, the original run's parameter set) and is this not a duplicate of a run already done? | A go/no-go: every required input's presence confirmed with a quoted check; if any is absent the run is infeasible and the fallback is retraction | `evidence/wi1.3a-feasibility.md` with each input's presence quoted inline | agent | 2nd agent re-checks each input | 🔲 |
| 1.3b | (If 1.3a = go) Execute the re-validation run | Run completes; produces a NEW number with a reproducible artifact | New artifact path + `sha256` + the run command captured | agent | 2nd agent re-runs or independently checks the artifact | ⛔ BLOCKED on 1.3a |

### WI-2 · Re-run the date-less backtests so the artifacts declare their windows
**Directives (verbatim):** Oakwind Swing — *"Re-run so the artifact declares its dates … the
idea that we executed 9,408 in one day is highly unlikely. You should have checked further
before presenting such nonsense to me."* Same for Oakwind Investor and Long Shadow.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 2.1 | Reproduce the "9,408 executed" coherence problem | First cite the artifact's own trade-count/executed field verbatim, THEN show the arithmetic for why it can't be one day | `evidence/wi2.1-coherence.md` with the artifact excerpt quoted inline + the calculation | agent | 2nd agent opens the artifact, confirms the quoted field and re-derives the arithmetic | 🔲 |
| 2.2 | Locate the three backtest generators; confirm whether each can emit a window | Per strategy: generator script path + the exact code line that would (or would not) record span, quoted inline | `evidence/wi2.2-generators.md`, file:line + verbatim line per strategy | agent | 2nd agent opens each file:line, confirms | 🔲 |
| 2.3 | **E-2 RULED GO** (Bob 2026-08-19): re-run the three date-less backtests so artifacts declare windows | Bob's ruling recorded | Bob's verbatim ruling quoted in the Escalations section (Rule 7; conversation-sourced) | Bob | — | 🟢 RULED |
| 2.4 | Re-run each; artifact embeds `window_from`/`window_to`, trade count reconciles to the window | WI-2.2 must first confirm the generator CAN emit a window for that strategy (quoted); only then re-run. New artifact declares dates and the count is coherent with the span | New artifact path + `sha256` + reconciliation note citing WI-2.2's finding, per strategy | agent | 2nd agent | ⛔ BLOCKED on WI-2.2 per strategy |

### WI-3 · Determine execution venue definitively — do not ask Dick to bless a guess
**Directive (verbatim):** *"LOL — you are asking me to validate if your 'guess' is right. NFW."*
**Reading:** He won't confirm our INFERRED "TriSight Sim." Venue may be stated MEASURED only
when BOTH a live code trace AND the estate's existing venue findings agree.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 3.1 | Trace, per strategy runner, the code path that prices/writes a fill | The fill-producing line (sim pricing vs broker call) quoted inline, file:line | `evidence/wi3.1-venue-trace.md`, verbatim line per runner | agent | 2nd agent opens each, confirms | 🔲 |
| 3.2 | Cross-check against existing estate venue findings (DEFECT-REGISTRY paper/sim entries) | The prior finding quoted inline; agrees with or contradicts 3.1 | Citations added to `evidence/wi3.1-venue-trace.md` | agent | 2nd agent | 🔲 |
| 3.3 | State venue per strategy as MEASURED only where 3.1 and 3.2 agree; else flag the conflict | A per-strategy venue table; each cell MEASURED-with-two-sources or flagged CONFLICT | Table in the same file, each cell citing both | agent | 2nd agent | 🔲 |

### WI-4 · Verify Dick's stated fact: Automated Swing = Manual Swing (params identical, execution differs)
**Directive (verbatim):** *"I do not know if YOU ran a backtest to validate this or YOU elected to
simply apply the manaul [sic] backtest to the automated strategy. The strategy parameters are identical,
just the execution is different. Either way, you should be addressing FIXING this rather than asking to
do it for you."*
**Reading:** An owner assertion rules ACTION, not FACT — verify against the code. And our OWN sealed input
already speaks to his diagnostic question: normalized-inputs' Automated Swing claim carries
`metric_kind: "5-year backtest (shares ledger lineage with Manual Swing)"` and cites
`backtest_results/manual_swing_phase6* ledger artifacts` — i.e. the estate's data already implies Auto's
claim reused Manual's ledger rather than a separate validation. WI-4.2 confirms or refutes that lineage;
it does NOT treat it as an untouched unknown.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 4.1 | Diff the two strategies' parameter sets | Identical params shown, or exact divergences listed — each param quoted file:line for both | `evidence/wi4.1-param-diff.md`, verbatim params for both | agent | 2nd agent opens both, confirms | 🔲 |
| 4.2 | Confirm or refute the already-implied shared lineage: is Auto's claim the manual_swing_phase6* ledger, or a distinct Auto-specific backtest? | Starting from the normalized-inputs lineage citation, either (a) confirm the manual_swing_phase6* artifacts ARE Auto's claim source, or (b) produce a distinct Auto-specific backtest artifact that refutes it | `evidence/wi4.2-validation-provenance.md`, the normalized-inputs lineage line quoted + the settling artifact quoted inline | agent | 2nd agent opens the artifact, confirms it is dispositive | 🔲 |

### WI-5 · Present the evidence behind High 5's 92.33% claim (do not frame it as a "gap")
**Directive (verbatim):** *"THERE IS NO GAP — YOU NEED TO FIND THE EVIDENCE THAT SUPPORTS THE ORIGINAL."*
**Reading:** Don't ask him to explain a 92-vs-45 gap; go produce the original 92.33% claim's
supporting evidence, to the same standard applied to Top 40.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 5.1 | Locate the sealed-benchmark run that produced 92.33% / 5,321 trades | The run artifact path + the win-rate line quoted inline | `evidence/wi5.1-high5-benchmark.md`, verbatim excerpt | agent | 2nd agent opens it, confirms | 🔲 |
| 5.2 | Reconcile the sealed 92.33% against Dick's own architect ruling (TQM High5·E3: stop IS the design, amend contract, re-measure at 1×) and the unexecuted-edit reality per D94 | A sourced statement that the no-stop-contract is an UNEXECUTED edit (not proof of no stop), citing E3 verbatim + D94 | `evidence/wi5.2-high5-recon.md`, E3 ruling + D94 quoted inline | agent | 2nd agent opens TQM + D94, confirms | 🔲 |

### WI-6 · Put Escalator Reclaimed Shadow's existing evidence in front of Dick
**Directive (verbatim):** *"how would i know — you still have given me NOTHING as evidence or
validation to review."*
**Reading (corrected by review):** Evidence for this strategy DOES exist — normalized-inputs
already has an entry (claim FOUND, realized FOUND). The failure is that it never reached his
review dialog (round-1 saved zero rows; round-2 asked only a housekeeping question). So the
work is to present the existing entry, not to extract it fresh.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 6.1 | Confirm the existing normalized-inputs entry and why it never reached his dialog | Quote the existing claim/realized entry; show the round-1/round-2 gap | `evidence/wi6.1-escalator-shadow-present.md`, verbatim entry + gap explanation | agent | 2nd agent opens normalized-inputs, confirms | 🔲 |
| 6.2 | Draft the round-3 evidence-first cards for this strategy (built in the round-3 phase, not now) | Deferred to the round-3 preparation phase | — | agent | — | ⛔ (deferred to round 3) |

### WI-7 · Apply the ratified Oakwind Investor ruling as a standing rule
**Directive (verbatim):** *"Yes — note it, don't refuse (apply as a standing rule)."*
**Reading:** The one clean owner ruling round 2 produced — the only row that is a directive to
CLOSE, not to rework. Apply it.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 7.1 | Change Oakwind Investor's CAGR verdict from REFUSED to NOTED-with-caveats | The verdict updated in the study data, AND the caveat text must cite the reconciled `window_from`/`window_to` from WI-2.4's Oakwind Investor artifact — a verdict committed before that window exists is non-compliant (an undefined-annualization CAGR cannot be honestly "noted") | git commit SHA of the change + before/after quote inline | agent | 2nd agent opens the commit, confirms the window is cited | ⛔ BLOCKED on WI-2.4 |
| 7.2 | Record "note computable-but-caveated returns, don't refuse" as a standing study rule | The rule written into the study methodology doc | Committed rule text + path | agent | Bob | 🔲 |

### WI-8 · Answer Dick's dispute that Manual Swing's realized ledger reflects any real trades
**Directive (verbatim):** *"There were no real trades, so I have no idea what you think you are
referencing."*
**Reading:** Distinct from WI-3 (venue) and WI-4 (Auto/Manual param identity). He disputes that
Manual Swing's 259-row ledger reflects real trading at all — its own integrity question.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 8.1 | Identify exactly what was shown to Dick that he is rejecting | The specific card/number presented, quoted | `evidence/wi8.1-presented.md`, verbatim of what he saw | agent | 2nd agent | 🔲 |
| 8.2 | Trace the 259 rows' provenance: paper-simulated vs 48 BACKFILL vs 104 D86-signature | Per-class row counts, each class defined by its source rule quoted inline (D86: `pnl_pct==+1.00% AND days_held==1`). Trace **`/trisight-volume/Snapshots/swing_trade_log.csv` (Railway live volume, pull 2026-08-07)** — do NOT trace the git-committed `Snapshots/swing_trade_log.csv`, which DECISIONS-INBOX RULING 3 (2026-08-17) reset to header-only and is not the source of the 259-row figures | `evidence/wi8.2-ledger-provenance.md`, verbatim D86 rule + counts + the live-volume path | agent | 2nd agent opens the live-volume ledger + D86, confirms | 🔲 |
| 8.2a | Reconcile against DICK'S OWN standing ruling on backfilled data before drafting any elaboration | Cite DECISIONS-INBOX RULING 3 verbatim ("I do not trust ANY of your backfilled data for ANYTHING", 2026-08-17); confirm it reset the committed seed file only and left live volume ledgers "untouched", so it does NOT dispose of the live 104/48 rows — but records his stance | `evidence/wi8.2a-ruling3.md`, RULING 3 quoted inline | agent | 2nd agent opens DECISIONS-INBOX, confirms | 🔲 |
| 8.3 | Produce a sourced verdict: does any subset reflect real trading, or should the ledger be flagged like WI-1's cache | A yes/no per subset with evidence | `evidence/wi8.3-real-trades-verdict.md` | agent | 2nd agent | 🔲 |
| 8.4 | **ESCALATION (if 8.3 warrants)** — present Bob the disposition options for the flagged rows | Bob records a decision | Bob's ruling per Protocol Rule 7 | Bob | — | ⤴️ |

### WI-9 · Check whether round-1's zero-save was systemic (fleet-wide integrity)
**Source:** surfaced by WI-6's reconciliation (Escalator Reclaimed Shadow saved zero round-1 rows).
**Reading:** If the round-1 save failure touched other strategies, some of Dick's round-1 input may
be silently missing — a fleet-wide data-integrity risk, not one strategy's gap.

| # | Step | Acceptance criteria | Evidence required | Executor | Verifier | Status |
|---|------|--------------------|-------------------|----------|----------|--------|
| 9.1 | Compare round-1 saved rows per strategy against the elements each strategy should have | A per-strategy expected-vs-saved count; any strategy with a shortfall flagged | `evidence/wi9.1-save-integrity.md` with the counts (query output quoted) | agent | 2nd agent re-queries, confirms | 🔲 |
| 9.2 | If a shortfall exists, determine cause (save bug vs Dick skipped) and whether input was lost | A sourced cause + whether any Dick input is unrecoverable | `evidence/wi9.2-cause.md` | agent | 2nd agent | ⛔ BLOCKED on 9.1 |

---

## Cross-cutting escalations — Bob's rulings (2026-08-19, quoted per Protocol Rule 7)

Bob verbatim: *"E-1 go, E-2 go, E-4 incrementally expand scope to seek from Dick any input
required to achieve said 'fixings' if we do not have the necessary inputs and definitions we
must ask him to elaborate on the INTENDED approach so that we may reconcile our known-knowns,
known-unknowns, unknown-knowns, and unknown-unknowns."*

- **E-1 — GO.** Fund a full Top-40 point-in-time re-validation run producing a NEW verifiable
  number (retraction remains the fallback if the run proves infeasible). WI-1.3 status → GO.
- **E-2 — GO.** Re-run the three date-less production backtests so artifacts declare windows.
  WI-2.3 status → GO; WI-2.4 unblocked.
- **E-3 (WI-8.4):** Disposition of Manual Swing's flagged rows — still an escalation, fires
  only if the WI-8.3 trace warrants it.
- **E-4 — INCREMENTAL SCOPE EXPANSION APPROVED, with a reconciliation gate.** ASSAY may expand
  from verification into remediation, but incrementally: for each fixing, first reconcile
  Dick's directive against our data (Protocol Rule 8). Where we lack the inputs or definitions
  to execute the fix, we do NOT guess — we draft an elaboration question about Dick's INTENDED
  approach (see the reconciliation section below), and it goes to him only after the Gate-C
  review. Nothing is taken from Dick at face value; nothing new reaches Dick unreviewed.

## Review gates (Bob, 2026-08-19)
- **Gate A** — this updated plan + execution approach, peer + adversarially reviewed **before
  any execution**.
- **Gate B** — reviewed again **before creating the round-3 return approach**.
- **Gate C** — reviewed again **before any expanded-scope interface or package reaches Dick**.
- **Gate D** — reviewed again **before any remediation change (a "FIXING" PR under E-4) merges into estate/production code**. Verification-only evidence gathering does not trigger Gate D; any change to strategy code, ledgers, or seals does.

## Directive-vs-Data Reconciliation (Protocol Rule 8 — never at face value)

For each directive: what our data confirms (known-known), what we lack (known-unknown), what
our data shows that the directive does not account for (unknown-known), and the residual risk
(unknown-unknown). Elaboration questions are **drafted, not sent** — they go to Dick only after
the Gate-C review.

Every quadrant claim carries an inline source (Rule 2a). Elaboration questions are **drafted, not
sent** — they go to Dick only after the Gate-C review, and none may ask him to do our lookup work
or pre-commit him to a number.

**WI-1 · Top 40 213%.** *Known-known:* the sealed 213.06656830114653% is frozen; cache absent, no
SHA256 recorded (DEFECT-REGISTRY D58) — Dick agrees (D58, Round-61 ruling "Part 2: c"). *Known-
unknown:* the original score-matrix inputs to reproduce 213% exactly. *Unknown-known (data the
directive does not account for):* the PIT-corrected number is **−32.42% CAGR, VERIFIED both lenses**
(TOTAL-QUALITY-MATRIX E4→E11 addendum, wvu77ebio) — a re-validation will produce a real number, and
the estate's own evidence points far from 213%. *Unknown-unknown:* whether today's pipeline (MASSIVE
key, universe resolution) can reproduce the run at all — surfaced only by WI-1.3a. *Draft elaboration
(decision only, no prejudged number, no lookup ask):* "The re-validation will produce a NEW verified
number. When it lands, how do you want it handled — presented as the corrected claim, or the strategy
retired? (If you personally hold a copy of the original validation outside the systems we searched,
tell us and we'll validate against it; but we will not ask you to hunt for it.)"

**WI-2 · Re-run date-less backtests.** *Known-known:* Oakwind Swing / Investor / Long Shadow artifacts
declare no window (normalized-inputs: `window_from`/`window_to` null for all three); Dick wants re-runs
that embed dates. *Known-unknown:* whether the current generators reproduce the original runs. *Unknown-
known:* Dick's "9,408 in one day is unlikely" **rests on the very window that's missing** — the artifact
states 15,028 trades / 9,408 executed with no span (normalized-inputs, Oakwind Swing claim), so 9,408 is
almost certainly cumulative; we verify count-vs-span before conceding "nonsense." *Unknown-unknown:*
whether a re-run reproduces the SEALED headline numbers (if not, the seal is invalid regardless of window).
*Draft elaboration (decision only):* "If the re-run's headline numbers differ from the sealed values,
which governs going forward — the re-run or the seal?"

**WI-3 · Venue.** *Known-known:* Dick won't bless our guess (his directive). Estate data already largely
settles venue: his ratified three-term standard **"TriSight Sim / Broker Sim / Broker Live"** is the
platform-wide convention (DECISIONS-INBOX line 202), oakwind_swing is tagged TriSight Sim today (line 119),
and his launch instruction routes every strategy to (verbatim, line 658) "TriSight sim, TradeStation Sim, TradeStation Live ... with the TradeStation determination made at the TriSight Trading Terminal level". *Known-unknown:* the current
per-strategy venue value from the live config/code. *Unknown-known:* venue is a **per-strategy setting with
a TriSight Sim default**, not a fleet constant — so WI-3 states it per strategy from config+code, and never
asks Dick. *Unknown-unknown:* whether any strategy currently carries a TradeStation override at the terminal
level. *Draft elaboration:* none — this is answerable from our own data; do not ask Dick.

**WI-4 · Auto = Manual params.** *Known-known:* Dick asserts identical params, different execution (his
directive). *Known-unknown:* whether Auto was validated on its own path. *Unknown-known:* his assertion is
a FACT claim to verify against the two strategy files, not accept — a shared config with an override could
make "identical" false. *Unknown-unknown:* a divergence hidden in inheritance. *Draft elaboration (decision
only, after we've verified):* "We [confirmed identical / found divergence X]. Your directive was to FIX
this — do you intend Auto re-validated on its own execution path, or inheriting Manual's validation?"

**WI-5 · High 5 92.33% — CORRECTED after execution surfaced a superseding ruling.** *Known-known:* 92.33%
claim vs 45.08% realized (normalized-inputs). *Unknown-known — DICK HAS ALREADY RULED ON THIS, more recently
than any framing we'd reached:* an earlier July architect ruling (TQM High5·E3: *"the stop IS the design;
add stop to contract; re-measure at 1×"*) was **SUPERSEDED** at Round-74. Owner, verbatim, DEFECT-REGISTRY
line 128 (2026-08-07): *"High 5: the record-assembled answer stands — sealed contract is the no-stop 7-day
hold, production is ALIGNED with it, and its performance was never validly backtested."* His own words,
DECISIONS-INBOX line 2233: *"i only 'sealed parameter' because i was TOLD the strategy was validated…
this current revelation indicates we need to actually validate the strategy before considering anything
else."* And the seal in progress (DEFECT-REGISTRY lines 583/774/781, 2026-08-10, PR #856) validates
production at **25.12% CAGR / 50.76% WR / 100% TIME_EXIT** and frames the seal decision as *"ratify 25.12%
vs manufactured 92.33%"* — the seal prompt to Dick states the 92.33% *"was not edge — it was a stop
artifact… replaces the manufactured number with the measured one."* So the honest answer to his round-2
"find the evidence that supports the original 92.33%" is: **there is none, and Dick himself already ruled
so** — the no-stop contract stands, the 92.33% was never validly backtested, and the measured 25.12% is his
pending re-seal. *Balance lesson (recorded):* our v4 called it "manufactured" (right conclusion, wrong basis
— took D94 at face value); v5 called it an "unexecuted edit" (wrong — took the stale E3 ruling at face
value); only checking the FULL record found Round-74. *Draft elaboration — NOT a new question (his round-15
rule: check the decision record before asking):* none. Round 3 shows Dick his own Round-74 ruling + the
pending 25.12% seal, and asks nothing new about High 5.

**WI-6 · Escalator Shadow.** *Known-known:* evidence exists in normalized-inputs (claim FOUND / realized
FOUND); it never reached his dialog (round-1 saved zero rows). *Known-unknown:* none material. *Unknown-
known:* the entry is already extracted — this is a presentation gap, not a data gap. *Unknown-unknown:*
whether the round-1 zero-save was **systemic** across strategies — escalated to WI-9. *No elaboration —
present the existing evidence.*

**WI-7 · Oakwind Investor note-not-refuse.** *Known-known:* clean ruling, apply it. *Unknown-known (blocks
naive execution):* its claim CAGR (8,728.89%, normalized-inputs) is annualization-undefined while the
window is null — so "note it" **depends on WI-2 delivering the window first**; WI-7.1 is BLOCKED on WI-2.4.
We cannot honestly NOTE a CAGR whose span we don't have. *No elaboration.*

**WI-8 · Manual Swing "no real trades".** *Known-known:* Dick says none real (his directive); our data
(DEFECT-REGISTRY D86) shows 104/259 contract-invalid + 48 backfill. *Known-unknown:* whether ANY of the
259 are clean. *Unknown-known (directly contradicts the directive at face value):* D86's director
correction says some fills were **"PRICE-REAL but CONTRACT-INVALID — the market traded through those
levels"** — not fabricated. "No real trades" is therefore not literally true: real fills exist, booked
under a forbidden same-session stop rule. We do NOT encode "no real trades" as fact. *Unknown-unknown:*
whether the ~107 unflagged rows are clean. *Draft elaboration (decision only):* "Our data shows some fills
were real but contract-invalid, not fabricated. By 'no real trades' do you mean none executed, or none
under a valid contract? That decides whether we void or re-book them."

## What this plan deliberately does NOT do yet
- No work item is executed — execution is gated on Bob's approval of this plan and on the
  escalation decisions above.
- No schema/UI change and no round-3 content — those are the explicitly later, gated phases.

## Definition of Done for the PLAN (this document)
✅ All 10 Dick round-2 directives map to a WI row (coverage table above). ✅ Every row has
objective acceptance criteria and a named un-fakeable evidence artifact requiring inline
quoted excerpts. ✅ Executor and Verifier are distinct and named on every row. ✅ Every
irreversible/estate-compute step and every owner ruling is an explicit escalation with
out-of-band evidence, never an assumed or agent-authored action. Pending: **Bob's approval.**


---

## Execution Status Ledger (updated as work proceeds)

First execution wave 2026-08-19 (workflows wf_4fdb523f execute + wf_4fe4b573 rework), each
item executor≠verifier. Evidence artifacts committed under `evidence/wi*.{md,txt}`.

| WI | What it established | Verify status |
|----|--------------------|---------------|
| WI-1 | Sealed 213% cache CONFIRMED absent (volume near-twin is 112,428,132 B, not sealed 118,501,504); unverifiable by construction (no SHA256, D58) | ✅ VERIFIED |
| WI-2 | 9,408-executed coherence shown; 3 generators located; Oakwind Swing+Investor windows recoverable from committed CSVs (no fresh run needed); Long Shadow needs a re-run | ✅ VERIFIED |
| WI-3 | All 10 strategies price/write fills via sim/paper today; venue = TriSight Sim per strategy (config default + code gate); no strategy routes to a broker now | ✅ VERIFIED (citations reworked) |
| WI-4 | Dick's assertion CONFIRMED: 18 locked params value-for-value identical Auto vs Manual; NO separate Auto backtest exists — Auto reused Manual's manual_swing_phase6 ledger | ✅ VERIFIED |
| WI-5 | High 5: Dick already ruled (Round-74, 2026-08-07) the 92.33% "never validly backtested", no-stop contract stands; measured 25.12% presented but re-seal OPEN/parked with Dick (unsigned through 2026-08-17) | ✅ VERIFIED |
| WI-6 | Escalator Reclaimed Shadow evidence EXISTS (349 trades / 215.97%); pre-built guide ready; pure delivery failure — present it in round 3 | ✅ VERIFIED |
| WI-7 | Oakwind Investor window now known (2025-01-02..2026-05-15) — note-not-refuse applicable in round-3 build | ✅ UNBLOCKED |
| WI-8 | Manual Swing live ledger grew 259→291 since study pull; provenance reconciled; RULING 3 (backfill-distrust) cited, disposed only the committed file | ✅ VERIFIED |
| WI-9 | Round-1 zero-save NOT systemic — only escalator-reclaimed-shadow lost rows; 6/10 saved every element; Dick's other round-1 input intact | ✅ VERIFIED |

**Heavy estate-compute (E-1/E-2), feasibility recorded:** WI-1.3a (Top-40 re-validation) and
WI-2.2/2.4 (backtest re-runs) — feasibility findings in `evidence/wi1.3a-feasibility.md` and
`evidence/wi2.2-generators.md`; next step is the feasibility-gated execution of the runs that
are runnable from here, escalating any that need the trader estate.
