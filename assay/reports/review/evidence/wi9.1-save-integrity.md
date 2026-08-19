# WI-9.1 — Round-1 Save Integrity Check

**Question:** Was round-1's zero-save a systemic (all-strategy) failure, or isolated? Confirm Escalator Reclaimed Shadow saved zero; check the others.

## Method

1. Pulled the full review export:
   ```
   curl -s "https://trisight-engine-production.up.railway.app/api/review/export" -H "x-review-code: emerald-oak-faf4"
   ```
   Response: `HTTP_STATUS:200`, body `{"data":[...]}` with 191 rows total, saved to scratchpad `export.json` (75,236 bytes).

2. Loaded expected element counts per strategy from `assay/reports/review/review-data.json` (`d['strategies'][i]['elements']`, one row per reviewable card).

3. Grouped the 191 exported rows by `created_at` timestamp to separate review sessions. There is exactly one large gap in the timeline (all other adjacent-row gaps are under 5 minutes):
   ```
   2026-08-19T10:10:18.657Z automated-swing-trading verdict-1
   2026-08-19T13:19:54.507Z oakwind-swing-trader claim-doc   <<< GAP 11375.9s (~3.16 hr)
   ```
   This splits the data into: the deploy smoke-test row (`2026-08-18T22:45:11.371Z`, `strategy:"_smoke-test"`, `element_id:"deploy-check"`), **round 1** (`2026-08-19T09:22:54.508Z` → `2026-08-19T10:10:18.657Z`, 120 rows), and **round 2** (`2026-08-19T13:19:54.507Z` → `2026-08-19T13:40:55.593Z`, 70 rows, a shorter partial re-pass that only re-touches early cards on a subset of strategies).

4. For round 1, compared the set of distinct `element_id`s saved per `strategy` against the expected element `id` list for that strategy slug in `review-data.json`.

## Round-1 per-strategy results (query output)

Expected element counts, quoted from `review-data.json` (`"slug"` line numbers shown; each strategy's element array was counted via its `"id"` entries):

- `review-data.json:6` `"slug": "top-40-2-0"` — 17 elements
- `review-data.json:184` `"slug": "high-5"` — 10 elements
- `review-data.json:292` `"slug": "oakwind-swing-trader"` — 13 elements
- `review-data.json:423` `"slug": "oakwind-investor-daily"` — 15 elements
- `review-data.json:580` `"slug": "escalator-reclaimed-shadow"` — 14 elements (`"id": "claim-doc"` at line 589 through `"id": "verdict-1"` at line 716)
- `review-data.json:725` `"slug": "escalator-reclaimed-long-shadow"` — 13 elements
- `review-data.json:851` `"slug": "earnings-trader-locked-93"` — 11 elements
- `review-data.json:966` `"slug": "trisight-500-2-0"` — 14 elements
- `review-data.json:1111` `"slug": "manual-swing-trading"` — 15 elements
- `review-data.json:1263` `"slug": "automated-swing-trading"` — 14 elements

Round-1 saved rows/distinct elements from the export (computed from the 120 round-1 rows, `created_at` between `2026-08-19T09:22:54.508Z` and `2026-08-19T10:10:18.657Z`):

```
strategy                            expected  rows  distinct  dup_rows  missing
top-40-2-0                          17        16    16        0         ['claim-metric-1']              <<< SHORTFALL
high-5                              10        10    10        0         []
oakwind-swing-trader                13        13    13        0         []
oakwind-investor-daily              15        15    14        1         ['realized-flag-1']             <<< SHORTFALL
escalator-reclaimed-shadow          14         0     0        0         ALL 14 MISSING                  <<< SHORTFALL (ZERO SAVE)
escalator-reclaimed-long-shadow     13        13    13        0         []
earnings-trader-locked-93           11        11    10        1         ['claim-metric-2']              <<< SHORTFALL
trisight-500-2-0                    14        14    14        0         []
manual-swing-trading                15        15    15        0         []
automated-swing-trading             14        13    13        0         ['realized-window']             <<< SHORTFALL
```

Totals: expected 136 element-decisions across 10 strategies; round 1 saved 118 distinct elements; 18 missing.

## Escalator Reclaimed Shadow — confirmed zero-save

`escalator-reclaimed-shadow` has **zero rows** anywhere in the full 191-row export (not just round 1) — confirmed by:
```python
by_strategy['escalator-reclaimed-shadow']  # -> [] (KeyError on export data; no rows exist for this slug in any round)
```
Distinct from `escalator-reclaimed-long-shadow`, a separate strategy slug (`review-data.json:725`) that saved cleanly both rounds (13/13 in round 1, plus a round-2 partial re-touch of `claim-doc` through `claim-metric-3`). The two slugs are name-adjacent ("Escalator Reclaimed Shadow" vs. "Escalator Reclaimed Long Shadow") but are distinct strategies in `review-data.json`; only the "Shadow" (non-"Long") variant has zero saved decisions in the export at any timestamp, round 1 or round 2. This is consistent with either (a) the reviewer never opening/submitting that specific strategy's review page, or (b) a save/routing failure specific to that slug — the export data alone cannot distinguish between "never attempted" and "attempted but failed to persist" for this strategy, since there is no partial row and no error record to inspect from this endpoint.

## Verdict: NOT purely systemic — two distinct failure modes

The round-1 zero-save is **not** systemic across all 10 strategies. 6 of 10 strategies saved every expected element cleanly in round 1 (`high-5`, `oakwind-swing-trader`, `escalator-reclaimed-long-shadow`, `trisight-500-2-0`, `manual-swing-trading`, and effectively `top-40-2-0`/`automated-swing-trading` minus one card each). Two distinct problems are visible:

1. **Total save failure, isolated to one strategy:** `escalator-reclaimed-shadow` — 0 of 14 expected elements ever saved, in either round. This is the shortfall flagged in the task and it is confirmed.

2. **Single-element drop, affecting 4 of 10 strategies:** `top-40-2-0` (missing `claim-metric-1`), `oakwind-investor-daily` (missing `realized-flag-1`), `earnings-trader-locked-93` (missing `claim-metric-2`), `automated-swing-trading` (missing `realized-window`) each lost exactly one card's decision. In two of those four cases (`oakwind-investor-daily`, `earnings-trader-locked-93`) the export shows a **duplicate row** for a different, adjacent element_id submitted twice within ~0.4–4.7 seconds of each other, quoted from the export:
   ```
   2026-08-19T09:36:16.702Z oakwind-investor-daily realized-flag-0 correction
   2026-08-19T09:36:17.096Z oakwind-investor-daily realized-flag-0 correction   (dup, 0.4s later)
   ...
   2026-08-19T09:58:42.549Z earnings-trader-locked-93 realized-ledger correction
   2026-08-19T09:58:47.267Z earnings-trader-locked-93 realized-ledger correction   (dup, 4.7s later)
   ```
   This is consistent with a rapid double-submit (e.g., double-click / no debounce) landing two writes on the same card while the intended next card (`realized-flag-1`, `claim-metric-2` respectively) never got its own submission — a UI/race issue, not a full save-pipeline failure. The other two single-card misses (`top-40-2-0`'s `claim-metric-1`, `automated-swing-trading`'s `realized-window`) show no duplicate row, so for those two NOT ESTABLISHED whether the card was skipped by the reviewer or dropped by the client — the export has no evidence either way.

## Bottom line

- **Escalator Reclaimed Shadow saved zero — CONFIRMED.** 0/14 in round 1, 0/14 across the entire 191-row export.
- **Not systemic in the "every strategy zero-saved" sense** — every other strategy captured the large majority (10/10 to 15/15) of its expected decisions in round 1.
- **A secondary, lower-severity integrity issue is present across 4 additional strategies** (`top-40-2-0`, `oakwind-investor-daily`, `earnings-trader-locked-93`, `automated-swing-trading`), each missing exactly one element's decision in round 1 — worth a follow-up fix (debounce / idempotent submit), but distinct in kind and severity from the Escalator Reclaimed Shadow total failure.

## Source data

- Export snapshot: scratchpad `export.json` (191 rows, fetched 2026-08-19 via the query above, HTTP 200).
- Expected element sets: `/Users/bobstewart/dev/trisight/trisight-engine/.claude/worktrees/optimistic-babbage-a859bb/assay/reports/review/review-data.json`.
