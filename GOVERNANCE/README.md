# GOVERNANCE/ — the Covenant record

This directory is the durable record required by [COVENANT.md](../COVENANT.md).
Chat output is not a deliverable; these files are.

| Directory | Holds | Naming |
|---|---|---|
| `reviews/` | Peer + adversarial review records (Article 2) | `YYYY-MM-DD-<slug>-<peer\|adv>.md` |
| `evidence/` | Command output: stdout + stderr + exit code, one file per command (Article 3) | `YYYY-MM-DD-<slug>-<NN>-<step>.log` |
| `selfchecks/` | Self-check records written from fresh disk reads (Article 4) | `YYYY-MM-DD-<slug>.md` |
| `discrepancies/LEDGER.md` | Mandated Reporter ledger (Article 5) — append-only entries, `STATUS: OPEN` → `STATUS: RESOLVED` | one file |

Required header lines for each record type are specified in `COVENANT.md`
(Articles 2, 4, 5). The completion gate parses exactly those lines — a record
without them does not count. Only record-shaped files (`.md`, `.log`, `.txt`,
`.gitkeep`) are treated as governance here; anything else placed under
`GOVERNANCE/` is treated as work and gated normally.

## Enforcement requirements

- **Node.js >= 20** on PATH (`node`) — both hooks are dependency-free `.cjs` scripts.
- **git** on PATH.
- Hooks are wired in `.claude/settings.json` (tracked). On first use per machine,
  Claude Code asks you to approve the project's hooks — approve them or the
  Covenant is not enforced on that machine.
- Gate session state lives in `.claude/covenant-state/` (gitignored).

## Verify the machinery on any machine

```bash
node --test .claude/hooks/covenant-hooks.test.cjs
```

All tests must pass. If they don't, the Covenant is not enforceable on that
machine — fix that before doing work there, or the work is ungoverned.
