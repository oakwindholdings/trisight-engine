// assay/kernel/bars.ts
// Point-in-time bar series — AsOf is opaque and validated at load (I2).
// A series loaded as-of D cannot contain observations after D; lookahead is unwritable.

import { refuse, type Outcome, isRefused } from './refusal.ts';

export interface Bar {
  readonly t: number; // epoch ms UTC of the bar's session date
  readonly oMicros: number;
  readonly hMicros: number;
  readonly lMicros: number;
  readonly cMicros: number;
  readonly volume: number;
}

declare const AsOfBrand: unique symbol;

/** Opaque: only loadAsOf/restrictTo construct this; raw bars are unreachable without the accessors. */
export interface AsOfSeries {
  readonly symbol: string;
  readonly asOf: number;
  readonly length: number;
  bar(i: number): Outcome<Bar>;
  readonly [AsOfBrand]: true;
}

function validBar(b: Bar): boolean {
  return (
    Number.isSafeInteger(b.t) &&
    Number.isSafeInteger(b.oMicros) && b.oMicros >= 0 &&
    Number.isSafeInteger(b.hMicros) && b.hMicros >= 0 &&
    Number.isSafeInteger(b.lMicros) && b.lMicros >= 0 &&
    Number.isSafeInteger(b.cMicros) && b.cMicros >= 0 &&
    Number.isSafeInteger(b.volume) && b.volume >= 0
  );
}

export function loadAsOf(symbol: string, asOf: number, bars: readonly Bar[]): Outcome<AsOfSeries> {
  if (!Number.isSafeInteger(asOf)) return refuse('invalid_params', `asOf must be epoch ms, got ${asOf}`);
  let prev = -Infinity;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]!;
    if (!validBar(b)) return refuse('vendor_malformed', `${symbol}: bar ${i} has invalid fields`);
    if (b.t > asOf) return refuse('lookahead_at_load', `${symbol}: bar at ${b.t} exceeds asOf ${asOf}`);
    if (b.t === prev) return refuse('duplicate_bar', `${symbol}: duplicate timestamp ${b.t}`);
    if (b.t < prev) return refuse('unsorted_bars', `${symbol}: ${b.t} after ${prev}`);
    prev = b.t;
  }
  const frozen: readonly Bar[] = Object.freeze(bars.map((b) => Object.freeze({ ...b })));
  const series: AsOfSeries = {
    symbol,
    asOf,
    length: frozen.length,
    bar(i: number): Outcome<Bar> {
      const b = frozen[i];
      if (b === undefined) return refuse('missing_bar', `${symbol}: index ${i} of ${frozen.length}`);
      return b;
    },
  } as AsOfSeries;
  return Object.freeze(series);
}

/** Restriction to an EARLIER as-of only — you can forget the future, never acquire it. */
export function restrictTo(series: AsOfSeries, newAsOf: number): Outcome<AsOfSeries> {
  if (newAsOf > series.asOf) {
    return refuse('lookahead_at_load', `${series.symbol}: cannot extend asOf ${series.asOf} to ${newAsOf}`);
  }
  const kept: Bar[] = [];
  for (let i = 0; i < series.length; i++) {
    const b = series.bar(i);
    if (isRefused(b)) return b;
    if (b.t <= newAsOf) kept.push(b);
  }
  return loadAsOf(series.symbol, newAsOf, kept);
}

declare const UniverseBrand: unique symbol;

export interface AsOfUniverse {
  readonly asOf: number;
  readonly symbols: readonly string[];
  series(symbol: string): Outcome<AsOfSeries>;
  readonly [UniverseBrand]: true;
}

/** All member series must share the universe's as-of; a missing declared symbol refuses (I4). */
export function loadUniverse(asOf: number, members: ReadonlyMap<string, AsOfSeries>): Outcome<AsOfUniverse> {
  const symbols = [...members.keys()].sort();
  if (symbols.length === 0) return refuse('partial_universe', 'universe has zero symbols');
  for (const s of symbols) {
    const m = members.get(s)!;
    if (m.asOf !== asOf) return refuse('invalid_params', `${s}: series asOf ${m.asOf} != universe asOf ${asOf}`);
    if (m.length === 0) return refuse('partial_universe', `${s}: zero bars — never silently completed`);
  }
  const map = new Map(members);
  const u: AsOfUniverse = {
    asOf,
    symbols,
    series(symbol: string): Outcome<AsOfSeries> {
      const m = map.get(symbol);
      if (m === undefined) return refuse('missing_data', `no series for ${symbol}`);
      return m;
    },
  } as unknown as AsOfUniverse;
  return Object.freeze(u);
}
