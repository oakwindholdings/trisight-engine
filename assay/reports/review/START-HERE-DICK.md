# Start Here, Dick — Reviewing the Strategy Study Inputs

*Prepared for Dick O'Leary · Oakwind strategy estate · August 2026*

Dick — before any conclusion in this study counts, we want you to check the **inputs** we
used: which documents we treated as your strategies' official claims, which trade ledgers
we treated as reality, and what assumptions we made. You know things we don't. Anything
you correct, the study re-runs with your correction, and the original stays visible.

There are **four ways to do this review**. Pick whichever suits you — they all end the
same way (your confirmations and corrections on record).

---

## Option 0 — The review website (recommended)

The easiest complete path. Open this address in any browser on your PC:

**https://trisight-engine-production.up.railway.app/review**

Enter the short access code Bob gives you with this link, and you'll see every strategy
in a list on the left. Click one, and each input we used appears as its own card with a
plain-English question, direct links to the source files, and two buttons: **Confirm**
or **Needs correction** with a box for your words. Click **Save this answer** on each
card — your answers are recorded instantly, you can stop and come back anytime, and you
can revise any answer later (every version is kept). The left-hand list shows your
progress per strategy. Nothing to install, nothing to email.

## Option 1 — Paper

1. Bob will hand you (or email you) **one printed PDF per strategy** — ten in all. Each
   is a self-contained packet: the review guide, the findings report, and the full web
   addresses of every source file, printed out so nothing is hidden.
2. Work through one packet at a time with a pen. Each step has a checkbox:
   **Confirmed** or **Correction** with a blank to fill in.
3. Give the marked-up packets back to Bob, or photograph the pages and email them to
   **bob@bobstewart.com**. That's it.

You never need to touch a computer for Option 1 beyond email.

## Option 2 — In your web browser (no installs, nothing to set up)

Everything lives on GitHub, readable in any browser on your PC. One-time setup:

1. Open **https://github.com** and sign in. (Your account owns the `oakwindholdings`
   organization, so you already have access. If a page says "404", you're either not
   signed in or signed in with a different account — sign out and back in.)
2. Open the review folder:
   **https://github.com/oakwindholdings/trisight-engine/tree/main/assay/reports/review**
3. Click any file named `input-review-…` to read a strategy's guide right in the browser.
   Start with **input-review-oakwind-swing-trader.md** — it's the strategy the study
   found most likely to be real, and it needs only one input from you (a date range) to
   unlock its blocked comparison.
4. Every guide ends with a section called **"Where the files live — click to open"** —
   those are direct links to the exact claim documents and trade ledgers we used. Click
   them to see the raw source with your own eyes.
5. Send your confirmations/corrections to Bob by email, referencing the step numbers
   (e.g., "Oakwind Swing, Step 3: the backtest window was Jan 2023 – Apr 2026").

## Option 3 — Guided by an AI assistant (if you use ChatGPT or Claude)

If you'd like to be walked through a guide interactively — asked one question at a time,
in plain English — paste the following into ChatGPT or Claude, then paste the full text
of one guide underneath it (in the browser view, click the "Raw" button, press
Ctrl+A then Ctrl+C to copy the whole guide, and Ctrl+V to paste):

```
You are helping me, a trading strategy owner, review a document called an "Input Review
Guide." It walks through every input an audit team used when checking my strategy's
claimed performance against its real trading record. I am not highly technical.

Your job: take me through the guide ONE STEP AT A TIME (it has 7 steps). For each step:
1. Explain in plain English what the audit team used or assumed, and why it matters.
2. Ask me the specific review question that step poses.
3. Record my answer as either "CONFIRMED" or "CORRECTION: <what I said>".
Do not skip steps, do not summarize multiple steps together, and do not offer your own
opinion of whether my strategy is good. At the end, produce a clean numbered list of all
my confirmations and corrections, formatted so I can email it as-is.

Here is the guide:
[PASTE THE GUIDE TEXT HERE]
```

The assistant's final list is exactly what Bob needs — email it to **bob@bobstewart.com**.

---

## What you're actually deciding at each step

Every guide has the same seven steps. In plain terms:

| Step | The question you're answering |
|---|---|
| 1 | Is this the right document to treat as my strategy's official claim? |
| 2 | Did they read the right numbers off it? |
| 3 | What time period does my backtest actually cover? (Often only you know.) |
| 4 | Is this the right record of my strategy's real trades? Is there a better one? |
| 5 | The real results, and known problems with the records — is their reading fair? |
| 6 | Given steps 1–5, here's what they computed or refused to compute. Which *input* would you change? |
| 7 | A list of exactly what your answers can unlock. |

Two words you'll see:

- **REFUSED** — the study would not compute a number because an input was missing or
  broken. A refusal is not an accusation; it's the study declining to guess. Your
  feedback can often convert a refusal into a real computation.
- **Integrity flag** — a known problem with a record (for example, corrupted rows in a
  ledger, or a backtest universe that quietly excluded companies that later failed).
  Flags are stated so you can challenge or confirm them, not to embarrass anyone.

## The one rule of this review

**Dispute the inputs, not the arithmetic.** If a conclusion looks wrong to you, the fix
is always upstream: a better claim document, the true window, a cleaner ledger. Name the
file — every correction re-runs the study, supersedes the old reading, and keeps the
original visible with its fingerprint (hash), so nothing ever silently changes.

## The ten packets

| Strategy | Read online | Printable PDF |
|---|---|---|
| Oakwind Swing Trader *(start here)* | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-oakwind-swing-trader.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/oakwind-swing-trader.pdf) |
| Oakwind Investor Daily | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-oakwind-investor-daily.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/oakwind-investor-daily.pdf) |
| High 5 | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-high-5.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/high-5.pdf) |
| Automated Swing Trading | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-automated-swing-trading.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/automated-swing-trading.pdf) |
| Manual Swing Trading | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-manual-swing-trading.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/manual-swing-trading.pdf) |
| Escalator Reclaimed Shadow | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-escalator-reclaimed-shadow.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/escalator-reclaimed-shadow.pdf) |
| Escalator Reclaimed Long Shadow | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-escalator-reclaimed-long-shadow.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/escalator-reclaimed-long-shadow.pdf) |
| Top 40 2.0 | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-top-40-2-0.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/top-40-2-0.pdf) |
| TriSight 500 2.0 | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-trisight-500-2-0.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/trisight-500-2-0.pdf) |
| Earnings Trader (locked 93) | [guide](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/input-review-earnings-trader-locked-93.md) | [PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/earnings-trader-locked-93.pdf) |

Background reading, if you want it: [How this study works — and how to refute it](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/METHODOLOGY-FOR-DICK.md)
([printable PDF](https://github.com/oakwindholdings/trisight-engine/blob/main/assay/reports/review/pdf/METHODOLOGY-FOR-DICK.pdf)).

Questions at any point: **bob@bobstewart.com**. There is no deadline pressure on this —
accuracy beats speed.
