# WI-6.1 — Escalator Reclaimed Shadow: normalized-inputs entry exists; why it never reached Dick's dialog

**Directive being executed (verbatim, from ROUND2-DIRECTIVES-QUALITY-MATRIX.md WI-6):**
> "how would i know — you still have given me NOTHING as evidence or validation to review."

**Reading:** Evidence for this strategy DOES exist in the sealed study data. The failure is that it never reached Dick's review dialog — not that the extraction was never done.

---

## 1. The existing normalized-inputs entry (quoted verbatim)

Source: `assay/phase2/normalized-inputs.json:130-160`

```json
{
  "strategy": "Escalator Reclaimed Shadow",
  "seal_ref": "5d483f7c",
  "claim": {
    "status": "FOUND",
    "value_raw": "349 trades, total return 215.97%, CAGR 16,079.18%, MaxDD 1.10%, win rate 63.04% over 57 market dates — source doc states 'No calendar-day span is claimed'",
    "metric_kind": "golden replay backtest",
    "annualized_return": 160.7917921783,
    "normalization_method": "stated CAGR fraction; the claim EXPLICITLY declines to anchor a calendar window — return dimension will refuse on window",
    "win_rate": 0.63037249,
    "win_rate_n": 349,
    "window_from": null,
    "window_to": null,
    "integrity_flags": ["claim declines to state a calendar window", "audit seal verifies code/spec drift only, not backtest numbers (PROOF.md)"],
    "source_citations": ["escalator_reclaimed_shadow lockdown/golden replay (profile escalator_reclaimed_bidirectional_v1_20260510)", "trisight-trader/Audits/2026-07-12_escalator_reclaimed_shadow_b5ffd4f/PROOF.md"],
    "excerpt": "349 trades, total return 215.969323%, CAGR 16079.179 ... win rate 63.037249%"
  },
  "realized": {
    "status": "FOUND",
    "value_raw": "150 closed trades (68W/82L = 45.33%), realized P&L +$370.59 (+0.05%) since inception 2026-05-15 through Aug 4 2026 (dashboard roll-up screen-verified against production ledger)",
    "metric_kind": "shadow paper ledger roll-up",
    "annualized_return": 0.00226,
    "normalization_method": "+0.05% over 81 calendar days annualized as (1.0005)^(365/81)-1 ≈ 0.226%/yr — short-sample noise disclosed",
    "win_rate": 0.45333,
    "win_rate_n": 150,
    "window_from": "2026-05-15",
    "window_to": "2026-08-04",
    "integrity_flags": ["shadow/simulated fills, not broker-routed"],
    "source_citations": ["auto_escalator_reclaimed_trade_log.csv (production)", "dashboard since-inception roll-up, screen-verified"],
    "excerpt": "150 closed trades (68 wins / 82 losses) · Realized P&L +$370.59 (+0.05%)"
  }
}
```

Both `claim.status` and `realized.status` are **FOUND**. This is not a gap in extraction — the study already has a claim side (349 trades, 215.97% total return, 63.04% win rate, no calendar window declared) and a realized side (150 closed trades, 45.33% win rate, +0.05% realized P&L over 2026-05-15→2026-08-04), each with sourced citations and disclosed integrity flags.

The pre-built input-review guide for this exact entry already exists at `assay/reports/review/input-review-escalator-reclaimed-shadow.md` (107 lines, all 7 steps populated with these same figures) and the computed verdict already exists in `assay/reports/review/review-data.json:710`:

> `"REFUSED (invalid_params) Escalator Reclaimed Shadow: side window incomplete. A refusal is a finding: this claim cannot be honestly ratioed against reality."`

— i.e. return-inflation was correctly refused (claim side has no calendar window per `window_from`/`window_to` both `null`), while win-rate inflation was computed: claimed 63.04%/349 trades vs realized 45.33%/150 trades ≈ **1.39×ᵒ**.

## 2. Why it never reached Dick's dialog

Source: `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md:150-158` (WI-6 reading, verbatim):

> "Evidence for this strategy DOES exist — normalized-inputs already has an entry (claim FOUND, realized FOUND). The failure is that it never reached his review dialog (round-1 saved zero rows; round-2 asked only a housekeeping question). So the work is to present the existing entry, not to extract it fresh."

Confirmed independently in `assay/reports/review/dialog-seed.json:281` (round-2 housekeeping question served to Dick, verbatim):

> "Housekeeping, and possibly on us: the review received no answers for this strategy (Escalator Reclaimed Shadow — the short-window one, distinct from Long Shadow, which you did answer). Given this same tool served you a broken 404 link and a rendering bug last round, we're not assuming you skipped it — it may be that its cards failed to save. Either way, its questions are here now. Did it save wrong on your end, or would you like to review it fresh?"

Same text is duplicated verbatim in `assay/reports/review/ROUND2-QUESTIONS.md:194-197` under the `## Escalator Reclaimed Shadow` heading.

**Root cause as currently understood (per the matrix, not yet independently re-verified by this WI):** round-1 saved **zero rows** of Dick's input for this specific strategy — a save/persistence failure on the review tool's side, not a case of Dick skipping the strategy or the study lacking evidence. Round-2 did not re-present the substantive evidence cards for Escalator Reclaimed Shadow; it only asked Dick the housekeeping question above (did it fail to save, or did you skip it), so as of round-2 Dick still had not been shown the claim/realized figures captured in Section 1.

This round-1 zero-save is flagged by the matrix as a possible **fleet-wide** integrity risk, tracked separately as **WI-9** (`ROUND2-DIRECTIVES-QUALITY-MATRIX.md:184-190`, verbatim): "Source: surfaced by WI-6's reconciliation (Escalator Reclaimed Shadow saved zero round-1 rows). ... If the round-1 save failure touched other strategies, some of Dick's round-1 input may be silently missing — a fleet-wide data-integrity risk, not one strategy's gap." WI-9 (comparing round-1 saved-vs-expected row counts per strategy) is out of scope for this WI-6.1 evidence file and remains **NOT ESTABLISHED** here — it requires its own query per `wi9.1-save-integrity.md` (not produced by this task).

## 3. Disposition of WI-6.2

Per the matrix, drafting round-3 evidence-first cards for this strategy (WI-6.2) is explicitly **deferred to the round-3 preparation phase** (status `⛔` in the matrix) and is out of scope for this confirmation step.

---

### Sources cited (file:line)

- `assay/phase2/normalized-inputs.json:130-160` — the claim/realized entry, quoted in full above
- `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md:150-158` — WI-6 directive + reading
- `assay/reports/review/ROUND2-DIRECTIVES-QUALITY-MATRIX.md:184-190` — WI-9, the round-1 zero-save cross-reference
- `assay/reports/review/dialog-seed.json:281` — round-2 housekeeping question actually served to Dick
- `assay/reports/review/ROUND2-QUESTIONS.md:194-197` — same housekeeping question, duplicate rendering
- `assay/reports/review/input-review-escalator-reclaimed-shadow.md` — pre-built 7-step input-review guide for this entry (never confirmed reached Dick per the round-1/round-2 gap above)
- `assay/reports/review/review-data.json:710` — computed win-rate-inflation verdict / return-inflation refusal text
