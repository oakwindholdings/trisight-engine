# WI-5.2 — Reconcile High 5's 92.33% benchmark against Dick's own architect ruling

## 1. Dick's ruling, quoted verbatim

`TOTAL-QUALITY-MATRIX.md:56`:

> **High5·E3** — [{r1, agent: derive:edge-contract + verify:edge-contract, effort: "found stop+2× not in written contract; posed neutral intent question", evidence: "swing_phase6_parity.py stop consts; HIGH_5_LOCKDOWN", verdict: PARTIAL}, {r1, agent: Dick (architect), effort: "**DISPUTE — the stop IS the design; 2× is artifact; add stop to contract + re-measure at 1×**", verdict: RECONCILED-open→r2}]

`TOTAL-QUALITY-MATRIX.md:60` (the round-closing ruling that references E3):

> **High5·E9** — [{r1, agent: Dick (architect), effort: "ruled all 5: **E3 DISPUTE**, leverage ACCEPT, E-settled DISPUTE (#887 revisit), display ACCEPT, provenance GATE", evidence: "HIGH5_RECON_ROUND1_RULINGS.md", verdict: PASS(round complete)}]

So Dick's own architect ruling on the record is: the stop belongs in the strategy by design; the 2× leverage figure is the artifact to fix (not the stop); and the action item is **"add stop to contract + re-measure at 1×"**.

## 2. D94's finding, quoted verbatim

`DEFECT-REGISTRY.md:407`:

> "**AND EVEN 29.25% IS INVALID.** The replay producing all three numbers is **93.05% stop-driven** — `STOP_TRAIL` 4,662 trades at **100% winners**, `STOP` 289 at 0 winners — with only 6.95% reaching the 7-day forced exit. **High 5's sealed contract has no stop at all:** `scripts/high_5_exit_check_runner.py` states verbatim that *"the 7-trading-day forced exit is High 5's ONLY locked exit condition (no stop-loss/trailing-stop exit is part of its sealed contract)."* **Production confirms it, read firsthand: 127 of 127 realized exits are `TIME_EXIT`. Zero stop exits, ever.**"

`DEFECT-REGISTRY.md:408`:

> "**Therefore the 92.33% win rate is manufactured by a trailing stop that neither the contract nor production has.** High 5 Strategy has **no valid performance number** — the owner's Round-74 statement was exactly right, and this is the evidence for it."

`DEFECT-REGISTRY.md:406` (equity-linked vs. fixed-notional):

> "**The applicable figure is 29.25%, not 194.81% — a 6.66× overstatement** against what production's own sizing rule produces."

(Table at `DEFECT-REGISTRY.md:400-404`: `high_5_automated_grading` — equity-linked `(equity/35) × 2.0 × slot_weight` — **194.81%** CAGR headline, vs. `high_5_fixed_slot` — fixed $28,571.43, 1× — **29.25%** CAGR, "the only model matching production's locked rule.")

## 3. Reconciliation — these two documents are describing the same fact, not contradicting each other

Both sources agree on the underlying mechanics: **93.05%–93.2% of the sealed replay's trades exit via a trailing stop (`STOP_TRAIL`), that stop is not written into the sealed contract text, and production has run 127/127 (also cited elsewhere as 122/122) realized exits as `TIME_EXIT` with zero stop exits.** Neither document disputes any of those measured facts. What differs is the **prescriptive conclusion** drawn from them:

- **Dick's E3 ruling** treats the absence of the stop from the written contract as a **documentation gap**, not a strategy defect: *"the stop IS the design"* — i.e., the stop was always intended to be part of High 5, the contract text simply never caught up to reflect it. His remedy is an **edit**: *"add stop to contract + re-measure at 1×."*
- **D94's framing**, read in isolation, states flatly that *"High 5's sealed contract has no stop at all"* and that the 92.33% win rate is "manufactured" by a mechanism "neither the contract nor production has" — which, without Dick's ruling attached, reads as though the no-stop contract were a settled, final fact establishing the strategy has no stop, rather than a **known, disputed gap Dick had already ruled on and ordered fixed.**

## 4. The "no-stop contract" is an UNEXECUTED edit — not proof the strategy has no stop

Verified firsthand against the actual sealed contract file, `/Users/bobstewart/dev/trisight/trisight-trader/HIGH_5_STRATEGY_LOCKDOWN.md`:

- `grep -n -i "stop" HIGH_5_STRATEGY_LOCKDOWN.md` returns **zero matches** — the word "stop" does not appear anywhere in the sealed lockdown document today.
- Its git history (`git log --oneline -- HIGH_5_STRATEGY_LOCKDOWN.md`) shows the file's last substantive touch was commit `f149a8a4`, dated **2026-07-21** ("fix: relabel High 5 headline evidence at 2x/1x + pin Oakwind Swing evidence to sealed module (#665)") — **more than two weeks before** the D94 finding (dated 2026-08-07) and before Dick's E3 ruling was recorded in `TOTAL-QUALITY-MATRIX.md`. No commit after that date touches the file.
- D94 itself confirms, in its own closing line (`DEFECT-REGISTRY.md:412`): **"Nothing re-sealed. No lockdown document or module edited. No strategy parameter changed."**
- The D1-execution follow-up (`DEFECT-REGISTRY.md:514`) likewise closes with: **"Conforming production is his decision; no code changed."**

So: Dick ordered the stop **added to the contract** (E3: "add stop to contract + re-measure at 1×"). That edit was never made — the lockdown document has no stop clause today, has not been touched since before the ruling, and every downstream evidence entry explicitly confirms no lockdown document, module, or strategy parameter was ever changed as a result.

**This means the correct statement is: the "no-stop sealed contract" is a stale, unexecuted document — an open task item, not a considered architectural fact.** It is not evidence that High 5 "has no stop" as a matter of design; it is evidence that a specific, already-ordered documentation fix has not yet been carried out. Dick's own ruling establishes the opposite premise — that the stop *is* the intended design and belongs in the contract — and that ruling has simply not been executed as code/doc changes.

## 5. What is and is not settled, stated plainly

- **Settled, verified, and undisputed by either source:** the 92.33% win rate / 5,321-trade sealed benchmark is 93.05% stop-driven (`STOP_TRAIL` 4,662 trades, 100% winners); production has run 127/127 realized exits as `TIME_EXIT` with zero stop exits ever; the equity-linked headline model (194.81% CAGR) overstates the fixed-notional model that matches production's actual sizing rule (29.25% CAGR) by 6.66×.
- **Unsettled / owner-only, per the record itself:** whether High 5 in production should be *changed* to include the stop mechanism Dick says is "the design" (E3: RECONCILED-open→r2 — explicitly still open, not closed), and whether the 92.33% number can be validly quoted for a strategy whose written contract and whose live 127/127 execution record currently show no stop at all. D1's contract-faithful re-run (no stop, 7-day exit only, cash-rotation basis Dick chose) measured **N 5,321 · WR 50.12% Wilson [48.78%, 51.47%] · CAGR 35.28% · max DD 25.56%** (`DEFECT-REGISTRY.md:510`) — the number that actually describes what the sealed contract text and production both currently implement, pending Dick's still-open E3 edit.

**Bottom line:** D94's "no stop in the sealed contract" finding is factually accurate as a read of the document *as it exists today*, and is corroborated firsthand (grep of the actual file, zero "stop" mentions, no commits since before the ruling). But it must not be read as Dick's final word on whether High 5 *should* have a stop — his own architect ruling (E3, DISPUTE) says the stop is intended design and ordered it written into the contract. That order is simply unexecuted. The 92.33% figure remains unusable as a valid performance number for High 5 as currently documented and as currently run in production (zero stops, 127/127 `TIME_EXIT`) — but the reason it is unusable is an open, ordered-but-undone documentation/contract edit, not a closed finding that the strategy was never meant to have a stop.
