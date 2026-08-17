// assay/tests/canonical.test.ts
// Canonical bytes + content addressing: key-order invariance, -0, NaN refusal, cross-process stability.
// Two numbers that differ in the last bit are two different numbers — so bytes are compared, not floats.

import { test, expect } from 'bun:test';
import { canonicalize, contentHash, hashBytes, isHash } from '../kernel/canonical.ts';
import { isRefused } from '../kernel/refusal.ts';
import { rng, forAll } from './prop.ts';

test('golden: canonical bytes of a fixed record', () => {
  const c = canonicalize({ b: 2, a: [1, 'x', null, true], z: { y: -0 } });
  expect(c).toBe('{"a":[1,"x",null,true],"b":2,"z":{"y":-0}}');
});

test('key insertion order does not change the hash', () => {
  const h1 = contentHash({ a: 1, b: [2, 3], c: { d: 'e' } });
  const h2 = contentHash({ c: { d: 'e' }, b: [2, 3], a: 1 });
  expect(h1).toEqual(h2);
});

test('NaN and Infinity refuse — they never enter a record', () => {
  for (const bad of [NaN, Infinity, -Infinity]) {
    const r = canonicalize({ x: bad });
    expect(isRefused(r)).toBe(true);
    if (isRefused(r)) expect(r.reason).toBe('non_finite_number');
  }
});

test('-0 and 0 are two different numbers', () => {
  expect(contentHash({ x: -0 })).not.toEqual(contentHash({ x: 0 }));
});

test('undefined object fields are absent facts, not values', () => {
  expect(contentHash({ a: 1, b: undefined })).toEqual(contentHash({ a: 1 }));
});

test('hash format is sha256:<64 hex>', () => {
  const h = hashBytes('assay');
  expect(isHash(h)).toBe(true);
});

test('cross-process hash stability (fresh bun process computes the same hash)', () => {
  const local = contentHash({ probe: 'stability', n: 42.5, arr: [1, 2, 3] });
  if (isRefused(local)) throw new Error('unexpected refusal');
  const proc = Bun.spawnSync([
    'bun',
    '-e',
    `import { contentHash } from '${import.meta.dir}/../kernel/canonical.ts'; console.log(contentHash({ probe: 'stability', n: 42.5, arr: [1, 2, 3] }));`,
  ]);
  expect(proc.stdout.toString().trim()).toBe(local);
});

test('property: canonicalize is stable under object key shuffling', () => {
  forAll(
    'key-shuffle stability',
    1337,
    200,
    (r) => {
      const keys = ['k1', 'k2', 'k3', 'k4', 'k5'].slice(0, r.int(1, 5));
      const obj: Record<string, number> = {};
      for (const k of keys) obj[k] = r.int(-1000, 1000);
      const shuffled: Record<string, number> = {};
      for (const k of [...keys].reverse()) shuffled[k] = obj[k]!;
      return { obj, shuffled };
    },
    ({ obj, shuffled }) => contentHash(obj) === contentHash(shuffled)
  );
});
