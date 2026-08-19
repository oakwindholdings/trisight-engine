# WI-8.2a — DECISIONS-INBOX RULING 3, verbatim, and its scope

## RULING 3, verbatim

Source: `assay/reports/review/evidence/DECISIONS-INBOX.md:2436`, under
`## 2026-08-17 — Dick O'Leary (ground-truth thread sitting: three rulings + re-seal rebuilt)`:

> "RULING 3 (swing ledger starting files), owner verbatim: **'I do not trust ANY of your
> backfilled data for ANYTHING'** and **''seeding' that starts with 'header only' might be
> the proper start'** — the committed `Snapshots/swing_trade_log.csv` becomes header-only
> and `swing_position_state.json` becomes `{"positions": [], "count": 0}`; a fresh
> environment starts with an empty ledger; the word 'seed' is retired for this mechanism.
> Implemented same sitting: branch `chore/swing-ledger-empty-initializer-20260817` @
> `834d1163`. Context: the committed file carried 48 tagged BACKFILL rows plus 83 UNLABELED
> fixture rows (every row exactly +1.00%, exit = entry×1.01) that passed the BACKFILL-only
> display filter into any fresh volume's displayed statistics. **Live volume ledgers and the
> family's validated research record are untouched and unaffected.**"

## What RULING 3 actually disposed of

RULING 3's scope is the **committed repo file** (`Snapshots/swing_trade_log.csv` as checked
into git — the file a *fresh* deployment would seed from) plus the committed
`swing_position_state.json`. Its stated trigger was a different, narrower defect than D86:
83 **UNLABELED** fixture rows (not tagged BACKFILL at all, each hard-coded to exactly
+1.00% pnl / exit=entry×1.01) that were slipping past the app's BACKFILL-only display filter
and inflating any fresh environment's shown win rate. The ruling's own text states, in the
same breath, that **"Live volume ledgers and the family's validated research record are
untouched and unaffected."**

Implementation confirmed in the trisight-trader repo history: commit `834d1163` ("chore:
swing ledger repo files become empty initializers — no backfilled data ships (Dick-ruled
2026-08-17)") landed on branch `chore/swing-ledger-empty-initializer-20260817` and was
merged to `origin/main` via PR #911 (commit `eb41cb44`, confirmed as an ancestor of
`origin/main`'s current tip `ee2b0de9`). `git show origin/main:Snapshots/swing_trade_log.csv`
returns only the header row — the committed file is empty of data rows as of this check.
(Note: the *local* checkout at `/Users/bobstewart/dev/trisight/trisight-trader` is on a
stale `main` — `e9f56145`, dated before the merge — that has not fetched/merged this PR, so
`Snapshots/swing_trade_log.csv` still shows 131 old rows in the local working tree; that
staleness is a local-clone artifact, not evidence against the ruling having landed on
`origin/main`.)

## Does RULING 3 dispose of the live 259/104/48 rows? No — by its own text.

RULING 3 governs **what a fresh environment starts with**, not the ledger already
accumulated on the running Railway production volume. The ruling's own sentence — "Live
volume ledgers ... are untouched and unaffected" — is explicit that it does not reach the
`/trisight-volume/Snapshots/swing_trade_log.csv` file traced in wi8.2 (291 live rows as of
today's pull, 259 at the 2026-08-07 sealed pull; 48 BACKFILL-tagged, 104-134 D86-signature
depending on pull date).

So RULING 3:
1. **Records Dick's stance** on backfilled/fabricated data in the strongest terms ("I do not
   trust ANY of your backfilled data for ANYTHING") — directly relevant context for reading
   his WI-8 "no real trades" rejection.
2. **Does NOT by itself dispose of** the live ledger's 48 BACKFILL rows or 104-134 D86-flagged
   rows — those remain on the live volume, unaddressed by this ruling, and are a live-data
   question RULING 3 does not answer. Whatever disposition those rows get (void, flag,
   exclude) is a decision still open, not settled by RULING 3.

## Sources
- `assay/reports/review/evidence/DECISIONS-INBOX.md:2436` (RULING 3, full text)
- `assay/reports/review/evidence/DECISIONS-INBOX.md:2434-2435` (sitting header, date, other
  same-day rulings for context)
- trisight-trader repo: commit `834d1163`, branch `chore/swing-ledger-empty-initializer-20260817`,
  merged via PR #911 (`eb41cb44`), confirmed ancestor of `origin/main` tip `ee2b0de9`
- `assay/reports/review/evidence/wi8.2-ledger-provenance.md` (live-volume trace this ruling
  does not reach)
