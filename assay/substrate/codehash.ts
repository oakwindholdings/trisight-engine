// assay/substrate/codehash.ts
// code_hash over every BYTE of every file under COMPUTE_ROOTS — recursive, binary-faithful (W0; X9).
// ONE framing owner: filesystem hashing and git re-derivation both call frameFiles, so the two
// paths cannot diverge (Cato X9 — utf8 decoding was non-injective; raw bytes are hashed now).

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { type Hash } from '../kernel/canonical.ts';

/** Every directory whose bytes can change a Result or a published Receipt. */
export const COMPUTE_ROOTS = ['kernel', 'substrate', 'adversary', 'receipt'] as const;

/** The single framing rule: `--- label ---\n` + raw bytes + `\n`, files pre-sorted by label
 *  bytewise. Both the filesystem path and the git path feed this exact function. */
export function frameFiles(files: readonly { label: string; bytes: Uint8Array }[]): Hash {
  const h = createHash('sha256');
  // bytewise label order, as documented — Buffer.compare over UTF-8, not UTF-16 code units (X17)
  const sorted = [...files].sort((a, b) => Buffer.compare(Buffer.from(a.label, 'utf8'), Buffer.from(b.label, 'utf8')));
  for (const f of sorted) {
    h.update(Buffer.from(`--- ${f.label} ---\n`, 'utf8'));
    h.update(f.bytes);
    h.update(Buffer.from('\n', 'utf8'));
  }
  return `sha256:${h.digest('hex')}`;
}

function walk(dir: string, base: string, acc: string[]): void {
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, base, acc);
    else acc.push(relative(base, p));
  }
}

/** Sorted relative paths of every file the hash covers — the gate asserts this equals
 *  `git ls-files` for the roots (the guard's own vacuity check, stated and mechanized). */
export function hashedFileList(): string[] {
  const base = join(dirname(fileURLToPath(import.meta.url)), '..');
  const files: string[] = [];
  for (const root of COMPUTE_ROOTS) {
    walk(join(base, root), base, files);
  }
  return files.sort();
}

export function kernelCodeHash(): Hash {
  const base = join(dirname(fileURLToPath(import.meta.url)), '..');
  return frameFiles(hashedFileList().map((f) => ({ label: f, bytes: readFileSync(join(base, f)) })));
}
