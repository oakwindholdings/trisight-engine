// assay/substrate/codehash.ts
// code_hash over every kernel source byte — any kernel change changes every triple (I1).
// Substrate may read the filesystem; the kernel itself never does.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashBytes, type Hash } from '../kernel/canonical.ts';

/** Forge finding 1: every directory whose bytes can change a Result must be inside code_hash —
 *  the compute path includes substrate/invoke.ts and the adversary, not just kernel/. */
const COMPUTE_ROOTS = ['kernel', 'substrate', 'adversary'] as const;

export function kernelCodeHash(): Hash {
  const base = join(dirname(fileURLToPath(import.meta.url)), '..');
  let acc = '';
  for (const root of COMPUTE_ROOTS) {
    const dir = join(base, root);
    const files = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .sort();
    for (const f of files) {
      const bytes = readFileSync(join(dir, f), 'utf8');
      acc += `--- ${root}/${f} ---\n${bytes}\n`;
    }
  }
  return hashBytes(acc);
}
