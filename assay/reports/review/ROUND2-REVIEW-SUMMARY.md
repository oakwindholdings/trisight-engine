# Round 2 — Peer + Adversarial Review Summary (for Bob)

**Method.** Five independent review lenses ran in parallel over all 17 proposed round-2
messages — fabrication auditor, derivation-bar (peer) reviewer, tone adversary reading as
Dick, factual/logic adversary, and completeness critic. Every finding was then handed to a
separate agent instructed to *refute* it against the sealed record before it counted.
27 findings raised; 15 survived refutation; I hand-adjudicated the other 12 against source
(8 had been dropped by a schema-retry fault, not rejected on merit — nearly all were valid).
Net: I fixed every real issue and rebuilt the seed as v2 (22 messages, up from 17).

**The three that would have hurt you with Dick — all caught, all fixed.**

1. **We asked Dick for a window we already have.** The High 5 question presented the
   backtest window as "not stated" and asked him to supply it — but the sealed record has
   it (2021-04-01 to 2026-04-30). This is the exact "you're asking me for what you already
   have" trap he'd have detonated on. Now the card states the window as ours (MEASURED) and
   asks him to confirm it, surfacing the real issue: claimed 92.33% wins vs realized 45.08%.

2. **We told Dick his real trades were fabricated.** The Manual Swing card called the
   flagged rows "fabricated… never happened… a row-generating script." The source says the
   opposite: they were "PRICE-REAL but CONTRACT-INVALID — the market traded through those
   levels," but under a stop rule the contract forbids. Calling a client's real fills fake
   is both wrong and inflammatory. Corrected to match the source exactly.

3. **We overstated the survivorship hit on his Oakwind strategies.** The card said the bias
   "hits your Oakwind strategies hardest" and attributed it to the 3-lens MEASURED audit. In
   fact the source rates **Top 40 2.0** as the SEVERE worst case, and the "dip-buy amplifies"
   point is a *separate, single-lens INFERRED* analysis. Split into two clearly labelled
   claims; the false "hardest" removed.

**Other fixes (high/medium).**

- **Top 40 chain was stale.** Updated to the verified survivorship-corrected figure
  (-32.42% CAGR / 76.68% DD, both adversarial lenses, 2026-08-10) and added it as a fourth
  ruling option, alongside the -7.55% bound and 88.44% analog.
- **The Oakwind Investor ruling — we now do the lookup, not Dick.** He said a prior ruling
  was "note the CAGR, don't refuse it." Round 1's sin was making him find his own quote.
  I searched the full decisions log myself, reported that it isn't there in those words, and
  offered to treat it as a standing instruction — instead of sending him looking.
- **Venue no longer pre-committed.** The "we'll apply your answer to all ten" line assumed
  venue is a fleet constant; the record shows it's per-strategy. Now asks once and invites
  per-strategy correction.
- **Two misquotes fixed** — an ellipsis that spliced two different registry rows into one
  "verbatim" quote (the exact round-1 defect), and "213.07%" inside quotation marks where
  the source says 213.06656830114653%.
- **Derivation-bar gaps closed** — confidence intervals added where the source provides
  them; MEASURED/INFERRED labels made honest (a hypothesis was labelled as measured fact).
- **Tone** — removed "you asked exactly the right question," the "first four confirmed
  inputs, thank you" milestone, and a defensive "not a gap in our homework" aside. Dick
  reads praise and self-justification as handling.
- **Coverage added** — Dick corrected seven claim cards on Earnings Trader with no round-2
  answer; added one. Added the missing Oakwind Investor window question and a plain-English
  "phantom" definition; added the Top 40 survivorship definition (he asked it there too) and
  an evidence card agreeing his corrupted-ledger point was right.

**Verification.** Every quoted string in the v2 seed was traced back to its source file
(normalized-inputs.json or the cited evidence file) — all trace. JSON validates. The live
content was replaced safely: an admin endpoint retracts only *unanswered* study questions,
so a reviewer's answer can never be erased (the table stays append-only for Dick).

**Bottom line.** The review was worth running — it caught a client-detonating factual error
(fabricated-vs-contract-invalid), a "you already have this" trap, and a defensible-but-wrong
overclaim, none of which I'd have caught re-reading my own draft. Round 2 is materially safer
to put in front of him now than it was an hour ago.
