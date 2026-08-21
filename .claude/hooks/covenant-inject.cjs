#!/usr/bin/env node
/**
 * covenant-inject.cjs — structural inheritance of the TriSight Covenant.
 *
 * PreToolUse, matcher = Agent|Task (tool name differs across Claude Code versions).
 *
 * Rewrites every subagent spawn so the child's prompt carries the Covenant verbatim,
 * ahead of the task. PreToolUse hooks fire on subagent tool calls too, so a subagent
 * spawning a sub-subagent re-triggers this hook — inheritance recurses structurally
 * instead of depending on any agent remembering to pass it down.
 *
 * Canonical text: COVENANT.md at repo root, between the COVENANT:INJECT markers.
 *
 * Design constraints:
 *   - IDEMPOTENT: if the prompt already BEGINS with the full injected preamble
 *     (covenant + communication standard), emit nothing. (Never keyed on a
 *     substring - see note above buildInjectedPrompt.)
 *   - FAIL-OPEN: any read/parse error exits 0 with no output; a broken hook must never
 *     block agent spawning. Degrades to "not injected", which the gate + PR review catch.
 *   - PERMISSION-NEUTRAL: emits updatedInput without a permissionDecision.
 *   - ZERO DEPENDENCIES: plain Node >= 20, no PAI, no npm packages.
 */

'use strict';

const { readFileSync, existsSync } = require('fs');
const path = require('path');

const START_MARKER = '<!-- COVENANT:INJECT:START -->';
const END_MARKER = '<!-- COVENANT:INJECT:END -->';

// NOTE: idempotency is keyed on the prompt BEGINNING with the full covenant
// text, never on a banner substring appearing anywhere. A substring key let a
// malicious or prompt-injected parent suppress injection by embedding the
// banner in the task text (adversarial review F2). If a prompt starts with the
// entire covenant verbatim, the child carries it either way - skipping is safe.

/** Resolve the repo root: CLAUDE_PROJECT_DIR if set, else walk up from cwd. */
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

/** Pull the injectable region out of COVENANT.md. Null if file or markers missing. */
function extractCovenant(repoRoot) {
  let raw;
  try {
    raw = readFileSync(path.join(repoRoot, 'COVENANT.md'), 'utf-8');
  } catch {
    return null;
  }
  const start = raw.indexOf(START_MARKER);
  const end = raw.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end <= start) return null;
  const body = raw.slice(start + START_MARKER.length, end).trim();
  return body.length > 0 ? body : null;
}

/** COMMUNICATION.md, verbatim. Null (covenant-only injection) if absent or empty. */
function extractCommunication(repoRoot) {
  try {
    const raw = readFileSync(path.join(repoRoot, 'COMMUNICATION.md'), 'utf-8').trim();
    return raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

/** Everything injected ahead of the task: the Covenant, then the communication standard. */
function buildPreamble(covenant, communication) {
  return communication ? `${covenant}\n\n---\n\n${communication}` : covenant;
}

/** New prompt string, or null when no rewrite should happen. */
function buildInjectedPrompt(prompt, preamble) {
  if (prompt.trimStart().startsWith(preamble)) return null; // idempotent
  return `${preamble}\n\n---\n\n${prompt}`;
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
    if (!raw.trim()) return;

    const data = JSON.parse(raw);
    if (data.tool_name !== 'Agent' && data.tool_name !== 'Task') return;

    const input = data.tool_input;
    if (!input || typeof input.prompt !== 'string') return;

    const repoRoot = findRepoRoot(process.cwd());
    if (!repoRoot) {
      process.stderr.write('[covenant-inject] COVENANT.md not found - not injected\n');
      return;
    }
    const covenant = extractCovenant(repoRoot);
    if (!covenant) {
      process.stderr.write('[covenant-inject] COVENANT.md unreadable or markers missing - not injected\n');
      return;
    }

    const preamble = buildPreamble(covenant, extractCommunication(repoRoot));
    const injected = buildInjectedPrompt(input.prompt, preamble);
    if (injected === null) return; // already present

    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        updatedInput: { ...input, prompt: injected },
      },
    }));
    process.stderr.write(`[covenant-inject] Covenant injected -> ${input.subagent_type || 'general-purpose'}\n`);
  } catch (err) {
    // Fail-open by design: never block an agent spawn on a hook fault.
    process.stderr.write(`[covenant-inject] fail-open: ${err && err.message ? err.message : String(err)}\n`);
  }
}

module.exports = { extractCovenant, extractCommunication, buildPreamble, buildInjectedPrompt, findRepoRoot };

if (require.main === module) {
  main();
}
