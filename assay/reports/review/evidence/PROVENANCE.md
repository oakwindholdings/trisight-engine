# Evidence Snapshots — Provenance

Read-only snapshots of governance reports cited by the Input Review Guides.
Snapshotted 2026-08-18 from the estate's orchestration layer
(`orchestration/reports/`, which is not itself published to GitHub). Append-only:
corrections supersede, originals stay. SHA-256 of each snapshot at capture:

- `DEFECT-REGISTRY.md` — `sha256:b597575d544c05b95eb17d834360e7278b893d52d3bf7643ec9a3c5928c458c8`
- `DECISIONS-INBOX.md` — `sha256:2a137e197ee459dc1663ea89e4dc543f8849990bc8f38d1ec5abb23b4231d609`
- `CARD-99-TRADELOG-FORENSICS.md` — `sha256:9c8db8ebfe96ebd90ff0a8ededda7288724317f905c45e00032d47e421e7e0bc`
- `ESTATE-STATUS.md` — `sha256:e40db5cf3b05243e55769a5ed72c7ec8971a1cc9d436a92b8ecc01af0117fe14`
- `TOTAL-QUALITY-MATRIX.md` — `sha256:78f977db32cd0896330a8cd6ac97e0a528457ff831e6aab0ab7e373c10f07afa`

## Ledger snapshots (pulled 2026-08-18)

Read-only `railway ssh` pulls from the TriSight-Trader production volume
(`/trisight-volume/Snapshots/`), server-side sha256 computed in-container before
transfer and verified byte-for-byte after (exact match). NOTE: these are the CURRENT
ledgers as of 2026-08-18. The study's figures came from 2026-08-07 pulls of the same
append-only ledgers; today's files contain those rows plus fills since.

- `high_5_paper_trade_log_SNAPSHOT_20260818.csv` — `sha256:2e6b1a193d2e3227b7216c9a993221851e514cf58adc04f411ec48c314b3b183`
- `auto_escalator_reclaimed_trade_log_SNAPSHOT_20260818.csv` — `sha256:20b6233c7e1d1b0d613354722f11d26db493d1a8475467cc262a1987ba4c0c9c`
- `auto_ts500_lfr_shadow_paper_fill_log_SNAPSHOT_20260818.csv` — `sha256:3fa367411cc4a31f79fb8ede7cb98e26d6268de7d847f122e19b52a2dab1eb68`
