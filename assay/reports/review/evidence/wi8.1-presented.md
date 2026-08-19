# WI-8.1 — What was shown to Dick for Manual Swing that he rejected ("no real trades")

## Task
Identify exactly what card/number was shown to Dick for Manual Swing Trading that he
rejected with "no real trades"; quote it verbatim.

## The card/question actually presented to him

Source: `assay/reports/review/dialog-seed.json` (round-2 review seed, `strategy:
"manual-swing-trading"`, `element_id: "realized-ledger"`, `kind: "question"`) — identical
text is rendered in the human-readable `assay/reports/review/ROUND2-QUESTIONS.md` under the
`## Manual Swing Trading` heading.

**`dialog-seed.json:239` — the question body shown to him verbatim:**

> "Arithmetic on what's left: MEASURED — of 259 rows, 104 carry the contract-invalid
> +1.00%/1-day signature and 48 are BACKFILL-simulated (rows before ~2026-04-26). Even
> before counting any overlap, well over half the ledger is unusable, and no aggregate win
> rate is stated — so we can't compute an honest realized figure from this record. Does a
> cleaner record of real fills exist anywhere — a different TriSight Sim lane, a
> TradeStation account, a log of yours?"

Answer options offered on the card (`dialog-seed.json:240-244`):
> "A better record exists — I'll say where" / "This ledger is all there is" / "I don't know"

This question card was itself preceded by a context card on the same strategy
(`dialog-seed.json:226`, `element_id: "realized-flag-0"`) that supplied the underlying
number — the **259-row realized ledger** and the **104/259 D86 signature** — and explicitly
told him the flagged rows were "PRICE-REAL but CONTRACT-INVALID," not fabricated:

> "MEASURED: 104 of this ledger's 259 rows show exactly +1.00% profit held exactly 1 day, a
> pattern the validated contract makes mathematically impossible; on replay against real
> bars, the covered trades diverge from their recorded outcomes (e.g. CNK: recorded
> +1.00%/1-day vs contract +14.58%/7-day)... So they are not invented trades; they are real
> fills booked under a stop rule the strategy isn't allowed to use."

## The "card/number": 259 rows / 104 D86-flagged / 48 BACKFILL

The specific numbers shown to Dick were the ledger population and its two flagged
subgroups — **259 total rows, 104 carrying the D86 +1.00%/1-day signature, 48 tagged
BACKFILL** — presented as "well over half the ledger is unusable ... no aggregate win rate
is stated." No win-rate percentage or dollar P&L figure was presented to him for this
strategy's realized ledger; the card explicitly states none could be honestly computed.

## His rejection, quoted verbatim

Source: `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md`

**Coverage table, `ROUND2-DIRECTIVES-QUALITY-MATRIX.md:76`:**
> `| 10 | manual-swing-trading/realized-ledger | "There were no real trades … I have no idea what you are referencing" | WI-8 |`

**Full directive quote, `ROUND2-DIRECTIVES-QUALITY-MATRIX.md:173-175` (WI-8 section header):**
> "There were no real trades, so I have no idea what you think you are referencing."

**WI-8 framing of the dispute, `ROUND2-DIRECTIVES-QUALITY-MATRIX.md:177-178`:**
> "Distinct from WI-3 (venue) and WI-4 (Auto/Manual param identity). He disputes that Manual
> Swing's 259-row ledger reflects real trading at all — its own integrity question."

## Note on card drafting history (context, not the presented card)

`assay/reports/review/ROUND2-REVIEW-SUMMARY.md:19-22` records that an *earlier draft* of
this same card (before it was shown to Dick) had called the flagged rows "fabricated…
never happened… a row-generating script," which the review process caught and corrected
before send — the version actually presented (quoted above) instead says the rows are
"PRICE-REAL but CONTRACT-INVALID," not fabricated:

> "We told Dick his real trades were fabricated. The Manual Swing card called the flagged
> rows 'fabricated… never happened… a row-generating script.' The source says the
> opposite: they were 'PRICE-REAL but CONTRACT-INVALID — the market traded through those
> levels,' but under a stop rule the contract forbids... Corrected to match the source
> exactly."

This is relevant provenance (it shows the corrected card did NOT claim the trades were
fake) but it is not itself what was shown to him — the card he actually saw is the
`dialog-seed.json:239` question quoted above.

## Sources
- `assay/reports/review/dialog-seed.json:223-245`
- `assay/reports/review/ROUND2-QUESTIONS.md:158-176`
- `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md:76, 172-186`
- `assay/reports/review/ROUND2-REVIEW-SUMMARY.md:19-22`
