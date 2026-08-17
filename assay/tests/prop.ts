// assay/tests/prop.ts
// Seeded property-test harness — zero dependencies, deterministic by construction.
// Same seed ⇒ same cases, forever; randomness enters ASSAY tests only through an explicit seed.

export interface Rng {
  next(): number; // [0, 1)
  int(min: number, max: number): number; // inclusive
}

/** mulberry32 — small, fast, deterministic. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min: number, max: number): number {
      return min + Math.floor(next() * (max - min + 1));
    },
  };
}

/** Run a predicate over n generated cases; throws with the failing case and seed on first failure. */
export function forAll<T>(name: string, seed: number, n: number, gen: (r: Rng) => T, predicate: (v: T) => boolean): void {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const v = gen(r);
    if (!predicate(v)) {
      throw new Error(`property '${name}' failed at case ${i} (seed ${seed}): ${JSON.stringify(v)}`);
    }
  }
}
