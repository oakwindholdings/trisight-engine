# WI 1.2 — Sealed Artifact Unverifiability (D58, SHA256 Gap)

**Source:** `assay/reports/review/evidence/DEFECT-REGISTRY.md:78` (D58 row, Owner Ruling Round-61 cell)

## Verbatim quote

> "Dick INDEPENDENTLY VERIFIED Finding 1 firsthand (not relayed): sealed cache `top40_scored_matrix_massive-trisight-universe_3317_2023-04-10_2026-04-17_v1.pkl` (118,501,504 bytes, 3317 symbols) is genuinely ABSENT from his machine. **HE ALSO FOUND A SECOND, INDEPENDENT SEAL FAILURE WE DID NOT REPORT:** the lockdown spec's own line-185 'Cache commit policy' required reference by path, size, **AND SHA256** — but only path and size were ever recorded. **No SHA256 exists, so the sealed artifact is UNVERIFIABLE even if a candidate file surfaces.** The seal's own stated verification method was never completed."

— DEFECT-REGISTRY.md:78

## Corroborating quote (decomposition finding, same row)

> "**DECOMPOSITION COMPLETE (PR #780) — THE ANSWER IS BAD.** (1) **The literal sealed 213.07% CANNOT BE REPRODUCED AT ALL**: its 2026-05-15 score-matrix cache exists nowhere — director independently confirmed absent from the working tree, from ALL git refs (`git log --all`), and from the entire estate filesystem. A sealed, ratified headline that no one can re-derive."

— DEFECT-REGISTRY.md:78

## Implication for WI-1

Even if a byte-identical or near-identical candidate `.pkl` file were to surface on some machine, volume, or backup, **it cannot be authenticated as the sealed artifact**, because the lockdown spec's own "Cache commit policy" (TOP_40_2_0_LOCKDOWN_SPEC.md:185, referenced in the quote above) never recorded the required SHA256 hash — only path and byte size were logged. Path and size alone are insufficient: WI 1.1's own search turned up a filename-and-size near-collision (the DECOY at `top40_scored_matrix_massive-trisight-universe_3317_2023-04-10_2026-04-17_v1.pkl`, 112,428,132 bytes on the Railway volume) that shares the exact filename token "3317" with the sealed identity but differs in byte count — proof that filename alone is not a safe identity check, and without a SHA256 there is no cryptographic way to rule out a same-name/same-size false positive either.

**Conclusion: the sealed Top 40 2.0 213.07% CAGR is structurally unverifiable, independent of whether the cache file is ever physically located.** The verification method the lockdown spec itself specified (path + size + SHA256) was never completed at seal time, so no candidate file recovered today — however plausible — could be cryptographically proven identical to what actually produced the sealed number.
