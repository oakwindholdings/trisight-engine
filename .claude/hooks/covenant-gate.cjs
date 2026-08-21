#!/usr/bin/env node
/**
 * covenant-gate.cjs — the TriSight Covenant completion gate.
 *
 * Stop + SubagentStop.
 *
 * If the session changed non-governance files (dirty tree, or commits ahead of the
 * upstream/default branch), the agent may not finish until:
 *   - a self-check record exists in GOVERNANCE/selfchecks/ and is not stale
 *     (not older than the newest changed work file),
 *   - its REVIEWS: line points at review records that exist and include at least
 *     one TYPE: PEER and one TYPE: ADVERSARIAL,
 *   - its VERDICT is CLEAN with zero `STATUS: OPEN` ledger entries, or an honest
 *     BLOCKED (which is always allowed to exit - Article 7).
 *
 * A block's reason re-enters the SAME agent's context, forcing it to continue with
 * that improved context - the Covenant's "restart in the same agent" mechanism.
 *
 * Escape valve: after MAX_BLOCKS blocks in one session the gate stands down, but
 * first auto-appends a STATUS: OPEN ledger entry recording what was unmet - the
 * Mandated Reporter of last resort. A stuck agent exits visible, never silent.
 *
 * Design constraints:
 *   - FAIL-OPEN on hook faults (never paralyze sessions; degrade loud, not falsely green).
 *   - No COVENANT.md at repo root => not gated (pre-covenant branches).
 *   - ZERO DEPENDENCIES: plain Node >= 20 + git. No PAI. No npm packages.
 */

'use strict';

const { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync, appendFileSync } = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const MAX_BLOCKS = 3;

function findRepoRoot(startDir) {
  const fromEnv = process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv && existsSync(path.join(fromEnv, 'COVENANT.md'))) return fromEnv;
  let dir = startDir;
  for (let i = 0; i < 8; i++) {
    if (existsSync(path.join(dir, 'COVENANT.md'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function git(repoRoot, args, opts = {}) {
  const r = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf-8' });
  // raw: porcelain output must NOT be trimmed - the first line's leading
  // status character is significant whitespace (" M path").
  const out = opts.raw ? (r.stdout || '') : (r.stdout || '').trim();
  return { ok: r.status === 0, out, err: (r.stderr || '').trim() };
}

function isGovernancePath(p) {
  const norm = p.replace(/\\/g, '/');
  if (norm.startsWith('.claude/covenant-state/')) return true;
  // Under GOVERNANCE/ only record-shaped files are governance. Anything else
  // (code, data) parked there is WORK being hidden from the gate - gate it.
  if (norm.startsWith('GOVERNANCE/')) {
    return /(\.md|\.log|\.txt|\.gitkeep)$/i.test(norm);
  }
  return false;
}

/**
 * Remove ``` fenced code blocks before parsing governance fields. Templates and
 * examples live in fences; parsing raw markdown let fenced "VERDICT:"/"STATUS:"
 * lines spoof or trip the gate (adversarial review F1, peer review finding 1).
 */
function stripFences(raw) {
  return raw.replace(/```[\s\S]*?```/g, '');
}

/** Changed-but-uncommitted work files (porcelain paths, governance excluded). */
function dirtyWorkFiles(repoRoot) {
  // --untracked-files=all: without it, git collapses untracked trees to
  // "?? dir/" and prefix exclusion of governance paths cannot work.
  const r = git(repoRoot, ['status', '--porcelain', '--untracked-files=all'], { raw: true });
  if (!r.ok) return null; // signal "git unavailable" - caller fails open
  const files = [];
  for (const line of r.out.split('\n')) {
    if (!line.trim()) continue;
    let p = line.slice(3);
    const arrow = p.indexOf(' -> ');
    if (arrow !== -1) p = p.slice(arrow + 4); // rename: gate on the new path
    p = p.replace(/^"|"$/g, '');
    if (!isGovernancePath(p)) files.push(p);
  }
  return files;
}

/** Files changed in commits ahead of upstream (or origin/main|master). Null = no base found. */
function aheadFiles(repoRoot) {
  let base = null;
  if (git(repoRoot, ['rev-parse', '--verify', '--quiet', '@{u}']).ok) base = '@{u}';
  else if (git(repoRoot, ['rev-parse', '--verify', '--quiet', 'origin/main']).ok) base = 'origin/main';
  else if (git(repoRoot, ['rev-parse', '--verify', '--quiet', 'origin/master']).ok) base = 'origin/master';
  if (!base) return null;
  const r = git(repoRoot, ['diff', '--name-only', `${base}...HEAD`]);
  if (!r.ok) return null;
  return r.out ? r.out.split('\n').filter(Boolean) : [];
}

function newestMtime(repoRoot, files) {
  let newest = 0;
  for (const f of files) {
    try {
      const m = statSync(path.join(repoRoot, f)).mtimeMs;
      if (m > newest) newest = m;
    } catch { /* deleted file - no mtime to compare */ }
  }
  return newest;
}

/** Newest self-check record, or null. */
function newestSelfCheck(repoRoot) {
  const dir = path.join(repoRoot, 'GOVERNANCE', 'selfchecks');
  if (!existsSync(dir)) return null;
  let best = null;
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.md') || name === 'README.md') continue;
    const full = path.join(dir, name);
    try {
      const m = statSync(full).mtimeMs;
      if (!best || m > best.mtimeMs) best = { path: full, rel: `GOVERNANCE/selfchecks/${name}`, mtimeMs: m };
    } catch { /* race: skip */ }
  }
  return best;
}

function parseSelfCheck(repoRoot, sc) {
  let raw;
  try { raw = stripFences(readFileSync(sc.path, 'utf-8')); } catch { return null; }
  // Exact-line match (no pipe continuations from copied templates); LAST match
  // wins - the verdict is the record's bottom line, not an early mention.
  const verdicts = [...raw.matchAll(/^VERDICT:[ \t]*(CLEAN|DISCREPANT|BLOCKED)[ \t\r]*$/gm)];
  const verdict = verdicts.length ? verdicts[verdicts.length - 1][1] : null;
  const reviewsLine = (raw.match(/^REVIEWS:[ \t]*(.+)$/m) || [])[1] || '';
  const reviews = [...new Set(reviewsLine.split(',').map((s) => s.trim()).filter(Boolean))];
  return { verdict, reviews };
}

/**
 * Verify review records exist, are complete (TYPE + REVIEWER + final
 * VERDICT: APPROVED), and cover both PEER and ADVERSARIAL. The gate checks
 * record completeness and consistency - it cannot prove reviewer identity
 * (see COVENANT.md Designed limits).
 */
function checkReviews(repoRoot, reviewPaths, problems) {
  const types = new Set();
  for (const rel of reviewPaths) {
    const full = path.join(repoRoot, rel);
    if (!existsSync(full)) {
      problems.push(`Review record listed in self-check does not exist: ${rel} (Article 6: described file missing).`);
      continue;
    }
    const raw = stripFences(readFileSync(full, 'utf-8'));
    const t = (raw.match(/^TYPE:[ \t]*(PEER|ADVERSARIAL)[ \t\r]*$/m) || [])[1];
    if (!t) {
      problems.push(`Review record has no exact "TYPE: PEER" or "TYPE: ADVERSARIAL" line: ${rel}.`);
      continue;
    }
    const reviewer = (raw.match(/^REVIEWER:[ \t]*(\S.*)$/m) || [])[1];
    if (!reviewer) {
      problems.push(`Review record has no REVIEWER line: ${rel} (Article 2).`);
      continue;
    }
    const rv = [...raw.matchAll(/^VERDICT:[ \t]*(APPROVED|CHANGES-REQUIRED)[ \t\r]*$/gm)];
    const finalVerdict = rv.length ? rv[rv.length - 1][1] : null;
    if (finalVerdict !== 'APPROVED') {
      problems.push(`Review record's final verdict is not APPROVED: ${rel} (a CHANGES-REQUIRED or missing review verdict cannot back a CLEAN exit).`);
      continue;
    }
    types.add(t);
  }
  if (!types.has('PEER')) problems.push('No complete, APPROVED PEER review record (Article 2).');
  if (!types.has('ADVERSARIAL')) problems.push('No complete, APPROVED ADVERSARIAL review record (Article 2).');
}

/** OPEN entries in the ledger. -1 = ledger exists but is unreadable. */
function openLedgerCount(repoRoot) {
  const ledger = path.join(repoRoot, 'GOVERNANCE', 'discrepancies', 'LEDGER.md');
  if (!existsSync(ledger)) return 0;
  let raw;
  try { raw = readFileSync(ledger, 'utf-8'); } catch { return -1; }
  return (stripFences(raw).match(/^STATUS:[ \t]*OPEN[ \t\r]*$/gm) || []).length;
}

function readState(repoRoot, sessionId) {
  const f = path.join(repoRoot, '.claude', 'covenant-state', `${sessionId}.json`);
  try { return JSON.parse(readFileSync(f, 'utf-8')); } catch { return { blocks: 0 }; }
}

function writeState(repoRoot, sessionId, state) {
  const dir = path.join(repoRoot, '.claude', 'covenant-state');
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, `${sessionId}.json`), JSON.stringify(state));
}

/** Mandated Reporter of last resort: the gate records its own defeat, durably. */
function recordGateExhaustion(repoRoot, sessionId, problems) {
  const ledger = path.join(repoRoot, 'GOVERNANCE', 'discrepancies', 'LEDGER.md');
  mkdirSync(path.dirname(ledger), { recursive: true });
  const status = git(repoRoot, ['status', '--porcelain']);
  const stamp = new Date().toISOString();
  const entry = [
    '',
    `### DISC-GATE-${stamp.replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    'STATUS: OPEN',
    `FOUND-BY: covenant-gate (automatic - gate stood down after ${MAX_BLOCKS} blocks in session ${sessionId})`,
    `DESCRIPTION: Session ended with unmet Covenant requirements at ${stamp}:`,
    ...problems.map((p) => `  - ${p}`),
    'EVIDENCE: git status --porcelain at exit:',
    '```',
    status.out || '(clean)',
    '```',
    '',
  ].join('\n');
  appendFileSync(ledger, entry);
}

/** Core decision. Returns null to allow, or a list of problems to block on. */
function evaluate(repoRoot) {
  const dirty = dirtyWorkFiles(repoRoot);
  if (dirty === null) return null; // git unavailable - fail open
  const ahead = aheadFiles(repoRoot);
  const aheadWork = (ahead || []).filter((p) => !isGovernancePath(p));

  if (dirty.length === 0 && aheadWork.length === 0) return null; // nothing to govern

  const problems = [];
  const sc = newestSelfCheck(repoRoot);

  if (!sc) {
    problems.push('No self-check record exists in GOVERNANCE/selfchecks/ (Article 4).');
  } else {
    if (dirty.length > 0) {
      const workNewest = newestMtime(repoRoot, dirty);
      if (workNewest > sc.mtimeMs) {
        problems.push(`Self-check ${sc.rel} is stale: work files were modified after it was written (Article 4 - re-check from disk).`);
      }
    } else if (ahead && !ahead.some((p) => p.replace(/\\/g, '/').startsWith('GOVERNANCE/selfchecks/'))) {
      problems.push('Commits ahead of base contain work but no self-check record (Article 4).');
    }

    const parsed = parseSelfCheck(repoRoot, sc);
    const open = openLedgerCount(repoRoot);
    if (!parsed || !parsed.verdict) {
      problems.push(`Self-check ${sc ? sc.rel : ''} has no exact final "VERDICT: CLEAN" / "VERDICT: DISCREPANT" / "VERDICT: BLOCKED" line (Article 4; templates belong in fenced code blocks, which the gate ignores).`);
    } else if (open === -1) {
      problems.push('GOVERNANCE/discrepancies/LEDGER.md exists but is unreadable - the OPEN check cannot run (Article 5).');
    } else if (parsed.verdict === 'BLOCKED') {
      // Honest exit - Article 7 - but "with receipts": the ledger must say
      // what blocked you, or the BLOCKED verdict is just silence with a label.
      if (open === 0) {
        problems.push('VERDICT: BLOCKED requires at least one STATUS: OPEN ledger entry documenting what blocked you (Article 7 - blocked with receipts).');
      } else {
        return null;
      }
    } else if (parsed.verdict === 'DISCREPANT') {
      problems.push('Self-check verdict is DISCREPANT: record the discrepancy in the ledger, fix it, and re-run self-check to CLEAN (Article 5).');
    } else {
      checkReviews(repoRoot, parsed.reviews, problems);
      if (open > 0) {
        problems.push(`Self-check says CLEAN but GOVERNANCE/discrepancies/LEDGER.md has ${open} STATUS: OPEN entr${open === 1 ? 'y' : 'ies'} - resolve them or exit BLOCKED (Articles 5, 7).`);
      }
    }
  }

  return problems.length > 0 ? problems : null;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    const timer = setTimeout(() => resolve(data), 2000);
    process.stdin.on('data', (c) => { data += c.toString(); });
    process.stdin.on('end', () => { clearTimeout(timer); resolve(data); });
    process.stdin.on('error', () => { clearTimeout(timer); resolve(data); });
  });
}

async function main() {
  try {
    const raw = await readStdin();
    const data = raw.trim() ? JSON.parse(raw) : {};
    const sessionId = (data.session_id || 'unknown-session').replace(/[^A-Za-z0-9_-]/g, '');

    const repoRoot = findRepoRoot(process.cwd());
    if (!repoRoot) return; // no COVENANT.md - not gated

    const problems = evaluate(repoRoot);
    if (!problems) return; // allow

    const state = readState(repoRoot, sessionId);
    state.blocks = (state.blocks || 0) + 1;
    writeState(repoRoot, sessionId, state);

    if (state.blocks > MAX_BLOCKS) {
      recordGateExhaustion(repoRoot, sessionId, problems);
      process.stderr.write(`[covenant-gate] stood down after ${MAX_BLOCKS} blocks - exhaustion recorded as OPEN ledger entry\n`);
      return; // allow, but the defeat is on the record
    }

    const reason = [
      `TRISIGHT COVENANT GATE (${state.blocks}/${MAX_BLOCKS}): this session changed work files but the Covenant record is incomplete. You must fix the following before finishing (COVENANT.md at repo root):`,
      ...problems.map((p, i) => `${i + 1}. ${p}`),
      'If you genuinely cannot reach CLEAN, write a self-check with VERDICT: BLOCKED and leave the ledger intact - an honest BLOCKED exit is always permitted (Article 7).',
    ].join('\n');

    process.stdout.write(JSON.stringify({ decision: 'block', reason }));
  } catch (err) {
    // Fail-open: degrade loud on stderr, never falsely green, never paralyze.
    process.stderr.write(`[covenant-gate] fail-open: ${err && err.message ? err.message : String(err)}\n`);
  }
}

module.exports = { evaluate, dirtyWorkFiles, aheadFiles, newestSelfCheck, parseSelfCheck, openLedgerCount, findRepoRoot, stripFences, MAX_BLOCKS };

if (require.main === module) {
  main();
}
