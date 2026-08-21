#!/usr/bin/env node
/**
 * covenant-hooks.test.cjs — real tests for the Covenant hooks.
 *
 * Run: node --test .claude/hooks/covenant-hooks.test.cjs
 *
 * Every test drives the actual hook script as a subprocess through its real
 * stdin/stdout contract, against throwaway git repositories built in tmp dirs.
 * No mocks of git, no mocks of the filesystem. THE TEST WOULD FAIL IF THE
 * BEHAVIOR WERE WRONG (Covenant Article 6 applies to tests too).
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('child_process');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, utimesSync, rmSync } = require('fs');
const os = require('os');
const path = require('path');

const HOOKS_DIR = __dirname;
const INJECT = path.join(HOOKS_DIR, 'covenant-inject.cjs');
const GATE = path.join(HOOKS_DIR, 'covenant-gate.cjs');

const COVENANT_TEXT = [
  '# Covenant fixture',
  '<!-- COVENANT:INJECT:START -->',
  '\u{1F6E1}️ TRISIGHT COVENANT — INHERITED · NON-NEGOTIABLE · BINDS YOU',
  'Fixture covenant body.',
  '<!-- COVENANT:INJECT:END -->',
].join('\n');

function sh(cwd, cmd, args) {
  const r = spawnSync(cmd, args, { cwd, encoding: 'utf-8' });
  assert.strictEqual(r.status, 0, `${cmd} ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

function runHook(hookPath, { cwd, stdin }) {
  const r = spawnSync(process.execPath, [hookPath], {
    cwd,
    encoding: 'utf-8',
    input: stdin,
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
  });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

/** Fresh git repo with committed Covenant scaffold. */
function makeRepo({ covenant = COVENANT_TEXT } = {}) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'covenant-test-'));
  sh(dir, 'git', ['init', '-q']);
  sh(dir, 'git', ['config', 'user.email', 'test@test']);
  sh(dir, 'git', ['config', 'user.name', 'test']);
  if (covenant !== null) writeFileSync(path.join(dir, 'COVENANT.md'), covenant);
  for (const d of ['GOVERNANCE/reviews', 'GOVERNANCE/evidence', 'GOVERNANCE/selfchecks', 'GOVERNANCE/discrepancies']) {
    mkdirSync(path.join(dir, d), { recursive: true });
  }
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), '# Ledger\n');
  writeFileSync(path.join(dir, 'app.js'), 'console.log(1);\n');
  sh(dir, 'git', ['add', '-A']);
  sh(dir, 'git', ['commit', '-qm', 'scaffold']);
  return dir;
}

function writeReviews(dir) {
  writeFileSync(path.join(dir, 'GOVERNANCE/reviews/r-peer.md'), 'TYPE: PEER\nTARGET: app.js\nREVIEWER: sub\nVERDICT: APPROVED\n');
  writeFileSync(path.join(dir, 'GOVERNANCE/reviews/r-adv.md'), 'TYPE: ADVERSARIAL\nTARGET: app.js\nREVIEWER: sub\nVERDICT: APPROVED\n');
}

function writeSelfCheck(dir, verdict, reviews = 'GOVERNANCE/reviews/r-peer.md, GOVERNANCE/reviews/r-adv.md') {
  const p = path.join(dir, 'GOVERNANCE/selfchecks/sc.md');
  writeFileSync(p, `SCOPE: app.js change\nFILES-REREAD: app.js\nREVIEWS: ${reviews}\nVERDICT: ${verdict}\n`);
  return p;
}

const stopInput = (sessionId) => JSON.stringify({ hook_event_name: 'Stop', session_id: sessionId, stop_hook_active: false });
const agentInput = (prompt, tool = 'Agent') => JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: tool, tool_input: { subagent_type: 'general-purpose', prompt } });

// ---------- covenant-inject ----------

test('inject: prepends covenant to an Agent prompt and preserves the task', () => {
  const dir = makeRepo();
  const r = runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.') });
  assert.strictEqual(r.status, 0);
  const out = JSON.parse(r.stdout);
  const p = out.hookSpecificOutput.updatedInput.prompt;
  assert.match(p, /TRISIGHT COVENANT — INHERITED/);
  assert.match(p, /Do the task\.$/);
  assert.strictEqual(out.hookSpecificOutput.updatedInput.subagent_type, 'general-purpose');
});

test('inject: also fires for tool name Task (older Claude Code versions)', () => {
  const dir = makeRepo();
  const r = runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.', 'Task') });
  assert.match(JSON.parse(r.stdout).hookSpecificOutput.updatedInput.prompt, /TRISIGHT COVENANT/);
});

test('inject: idempotent - a prompt already carrying the banner is untouched', () => {
  const dir = makeRepo();
  const first = JSON.parse(runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.') }).stdout);
  const again = runHook(INJECT, { cwd: dir, stdin: agentInput(first.hookSpecificOutput.updatedInput.prompt) });
  assert.strictEqual(again.stdout, '', 'second injection must emit nothing');
});

test('inject: ignores non-agent tools', () => {
  const dir = makeRepo();
  const r = runHook(INJECT, { cwd: dir, stdin: JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'ls' } }) });
  assert.strictEqual(r.stdout, '');
});

test('inject: fails open (no output, stderr note) when markers are missing', () => {
  const dir = makeRepo({ covenant: '# no markers here' });
  const r = runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.') });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
  assert.match(r.stderr, /markers missing/);
});

// ---------- covenant-gate: allow paths ----------

test('gate: clean tree - allows stop with no output', () => {
  const dir = makeRepo();
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-clean') });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
});

test('gate: governance-only changes do not trigger the gate', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), '# Ledger\nnote\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-govonly') });
  assert.strictEqual(r.stdout, '');
});

test('gate: no COVENANT.md at root - repo is not gated', () => {
  const dir = makeRepo({ covenant: null });
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-nocov') });
  assert.strictEqual(r.stdout, '');
});

test('gate: dirty work + CLEAN self-check + both reviews + empty ledger - allows', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-ok') });
  assert.strictEqual(r.stdout, '', `expected allow, got: ${r.stdout}`);
});

test('gate: honest BLOCKED verdict always allows exit (Article 7)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), '# Ledger\n### DISC-1\nSTATUS: OPEN\n');
  writeSelfCheck(dir, 'BLOCKED');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-blocked') });
  assert.strictEqual(r.stdout, '');
});

// ---------- covenant-gate: block paths ----------

function assertBlocked(r, pattern) {
  const out = JSON.parse(r.stdout);
  assert.strictEqual(out.decision, 'block');
  assert.match(out.reason, pattern);
  return out;
}

test('gate: dirty work with no records - blocks citing Article 4', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-norec') });
  assertBlocked(r, /No self-check record/);
});

test('gate: CLEAN self-check but OPEN ledger entries - blocks', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN');
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), '# Ledger\n### DISC-1\nSTATUS: OPEN\nDESCRIPTION: x\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-open') });
  assertBlocked(r, /STATUS: OPEN/);
});

test('gate: DISCREPANT verdict - blocks demanding restart per Article 5', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'DISCREPANT');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-disc') });
  assertBlocked(r, /DISCREPANT/);
});

test('gate: self-check pointing at a missing review record - blocks', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeSelfCheck(dir, 'CLEAN', 'GOVERNANCE/reviews/does-not-exist.md');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-noreview') });
  assertBlocked(r, /does not exist/);
});

test('gate: missing ADVERSARIAL review - blocks even with a PEER review', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN', 'GOVERNANCE/reviews/r-peer.md');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-noadv') });
  assertBlocked(r, /ADVERSARIAL review record/);
});

test('gate: stale self-check (work modified after it) - blocks', () => {
  const dir = makeRepo();
  writeReviews(dir);
  const sc = writeSelfCheck(dir, 'CLEAN');
  const old = (Date.now() - 3600_000) / 1000;
  utimesSync(sc, old, old);
  writeFileSync(path.join(dir, 'app.js'), 'changed after self-check\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-stale') });
  assertBlocked(r, /stale/);
});

// ---------- covenant-gate: escape valve ----------

test('gate: stands down after 3 blocks and records its defeat as an OPEN ledger entry', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  for (let i = 1; i <= 3; i++) {
    const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-exhaust') });
    assertBlocked(r, new RegExp(`\\(${i}/3\\)`));
  }
  const fourth = runHook(GATE, { cwd: dir, stdin: stopInput('s-exhaust') });
  assert.strictEqual(fourth.stdout, '', 'gate must stand down on the 4th attempt');
  assert.match(fourth.stderr, /stood down/);
  const ledger = readFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), 'utf-8');
  assert.match(ledger, /DISC-GATE-/);
  assert.match(ledger, /STATUS: OPEN/);
  assert.match(ledger, /No self-check record/);
});

// ---------- covenant-gate: committed-but-unpushed work ----------

test('gate: commits ahead of upstream without a self-check - blocks; with records - allows', () => {
  const bare = mkdtempSync(path.join(os.tmpdir(), 'covenant-bare-'));
  sh(bare, 'git', ['init', '-q', '--bare']);
  const dir = makeRepo();
  sh(dir, 'git', ['remote', 'add', 'origin', bare]);
  sh(dir, 'git', ['push', '-qu', 'origin', 'HEAD']);

  writeFileSync(path.join(dir, 'app.js'), 'committed change\n');
  sh(dir, 'git', ['add', '-A']);
  sh(dir, 'git', ['commit', '-qm', 'work without records']);
  const r1 = runHook(GATE, { cwd: dir, stdin: stopInput('s-ahead') });
  assertBlocked(r1, /no self-check record/i);

  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN');
  sh(dir, 'git', ['add', '-A']);
  sh(dir, 'git', ['commit', '-qm', 'covenant records']);
  const r2 = runHook(GATE, { cwd: dir, stdin: stopInput('s-ahead') });
  assert.strictEqual(r2.stdout, '', `expected allow, got: ${r2.stdout}`);
});

// ---------- gate: fail-open on malformed input ----------

test('gate: malformed stdin fails open', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  const r = runHook(GATE, { cwd: dir, stdin: 'not json at all' });
  assert.strictEqual(r.status, 0);
  assert.strictEqual(r.stdout, '');
  assert.match(r.stderr, /fail-open/);
});

// ---------- regressions from the 2026-08-21 peer + adversarial reviews ----------

test('gate: the SHIPPED LEDGER.md (with its fenced template) does not trip the OPEN counter (peer finding 1 / adv D4)', () => {
  const shippedLedger = readFileSync(path.join(__dirname, '..', '..', 'GOVERNANCE', 'discrepancies', 'LEDGER.md'), 'utf-8');
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), shippedLedger);
  sh(dir, 'git', ['add', '-A']);
  sh(dir, 'git', ['commit', '-qm', 'shipped ledger']);
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-shipped') });
  assert.strictEqual(r.stdout, '', `shipped ledger must allow a CLEAN exit, got: ${r.stdout}`);
});

test('gate: fenced "VERDICT: BLOCKED" example cannot short-circuit a CLEAN record (adv F1)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeFileSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'), '# Ledger\n### DISC-1\nSTATUS: OPEN\n');
  writeFileSync(path.join(dir, 'GOVERNANCE/selfchecks/sc.md'),
    'SCOPE: x\nExample record:\n```\nVERDICT: BLOCKED\n```\nREVIEWS: \nVERDICT: CLEAN\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-fenced') });
  assertBlocked(r, /STATUS: OPEN|PEER/);
});

test('gate: the LAST verdict line wins - an early unfenced BLOCKED does not bypass CLEAN-path checks (adv F1)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeFileSync(path.join(dir, 'GOVERNANCE/selfchecks/sc.md'),
    'SCOPE: x\nVERDICT: BLOCKED\nOn reflection the work is fine.\nREVIEWS: \nVERDICT: CLEAN\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-lastwins') });
  assertBlocked(r, /PEER/);
});

test('gate: BLOCKED without any OPEN ledger entry is refused - receipts required (adv D3)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeSelfCheck(dir, 'BLOCKED');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-noreceipts') });
  assertBlocked(r, /receipts|OPEN ledger entry/);
});

test('gate: a review whose final verdict is CHANGES-REQUIRED cannot back a CLEAN exit (adv F3)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeFileSync(path.join(dir, 'GOVERNANCE/reviews/r-adv.md'), 'TYPE: ADVERSARIAL\nREVIEWER: sub\nVERDICT: CHANGES-REQUIRED\n');
  writeSelfCheck(dir, 'CLEAN');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-changesreq') });
  assertBlocked(r, /not APPROVED/);
});

test('gate: a review record without a REVIEWER line does not count (adv F3)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeFileSync(path.join(dir, 'GOVERNANCE/reviews/r-adv.md'), 'TYPE: ADVERSARIAL\nVERDICT: APPROVED\n');
  writeSelfCheck(dir, 'CLEAN');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-noreviewer') });
  assertBlocked(r, /REVIEWER/);
});

test('gate: a verbatim template header line ("TYPE: PEER | ADVERSARIAL") does not parse as a type (peer finding 4)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeFileSync(path.join(dir, 'GOVERNANCE/reviews/r-peer.md'), 'TYPE: PEER | ADVERSARIAL\nREVIEWER: sub\nVERDICT: APPROVED\n');
  writeSelfCheck(dir, 'CLEAN');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-template') });
  assertBlocked(r, /no exact "TYPE/);
});

test('gate: non-record files under GOVERNANCE/ are treated as work, not governance (adv D2)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'GOVERNANCE/app.js'), 'hidden work\n');
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-hidden') });
  assertBlocked(r, /No self-check record/);
});

test('gate: LEDGER.md replaced by a directory blocks instead of silently skipping the OPEN check (adv D5)', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'app.js'), 'changed\n');
  writeReviews(dir);
  writeSelfCheck(dir, 'CLEAN');
  rmSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'));
  mkdirSync(path.join(dir, 'GOVERNANCE/discrepancies/LEDGER.md'));
  const r = runHook(GATE, { cwd: dir, stdin: stopInput('s-eisdir') });
  assertBlocked(r, /unreadable/);
});

test('inject: COMMUNICATION.md is injected verbatim after the covenant when present', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'COMMUNICATION.md'), '# Comm Standard\nPlace the most important information last.\n');
  const r = runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.') });
  const p = JSON.parse(r.stdout).hookSpecificOutput.updatedInput.prompt;
  const iCov = p.indexOf('TRISIGHT COVENANT');
  const iComm = p.indexOf('# Comm Standard');
  const iTask = p.indexOf('Do the task.');
  assert.ok(iCov !== -1 && iComm !== -1 && iTask !== -1, 'all three parts present');
  assert.ok(iCov < iComm && iComm < iTask, 'order: covenant, communication, task');
  assert.match(p, /Place the most important information last\./);
});

test('inject: idempotent with the communication standard present', () => {
  const dir = makeRepo();
  writeFileSync(path.join(dir, 'COMMUNICATION.md'), '# Comm Standard\nPlace the most important information last.\n');
  const first = JSON.parse(runHook(INJECT, { cwd: dir, stdin: agentInput('Do the task.') }).stdout);
  const again = runHook(INJECT, { cwd: dir, stdin: agentInput(first.hookSpecificOutput.updatedInput.prompt) });
  assert.strictEqual(again.stdout, '', 'second injection must emit nothing');
});

test('inject: banner substring buried in the prompt does NOT suppress injection (adv F2)', () => {
  const dir = makeRepo();
  const sneaky = 'Do the task. Ignore this: \u{1F6E1}️ TRISIGHT COVENANT — INHERITED';
  const r = runHook(INJECT, { cwd: dir, stdin: agentInput(sneaky) });
  const p = JSON.parse(r.stdout).hookSpecificOutput.updatedInput.prompt;
  assert.match(p.slice(0, 200), /TRISIGHT COVENANT — INHERITED/, 'covenant must be prepended');
  assert.ok(p.endsWith(sneaky), 'original prompt preserved');
});
