// assay/tests/typeharness.ts
// Compile-time guards (A2/I2): every @ts-expect-error line marks a misuse that MUST fail to typecheck.
// gate.sh also strips these annotations into a copy and asserts tsc FAILS — the guard shown failing.

import { span, addSpans, type Span } from '../kernel/span.ts';
import { cagr } from '../kernel/metrics.ts';
import { isRefused } from '../kernel/refusal.ts';
import { type AsOfSeries } from '../kernel/bars.ts';

const t = span('TRADING', 5);
const c = span('CALENDAR', 5);

if (!isRefused(t) && !isRefused(c)) {
  // @ts-expect-error I2: TRADING and CALENDAR spans cannot mix in arithmetic
  addSpans(t, c);
  // @ts-expect-error CAGR rejects a CALENDAR span at compile time
  cagr(0.1, c, 252);
}

// @ts-expect-error a raw number cannot stand in for a basis-typed span (ISC-15/16)
cagr(0.1, 63, 252);

// @ts-expect-error the Span brand cannot be forged from an object literal
const forgedSpan: Span<'TRADING'> = { basis: 'TRADING', count: 5 };

// @ts-expect-error a raw object cannot pose as an AsOfSeries — the brand is unforgeable (ISC-19/24)
const forgedSeries: AsOfSeries = {
  symbol: 'X',
  asOf: 1,
  length: 0,
  bar: () => ({ kind: 'refused', reason: 'missing_bar', detail: '' }),
};

export {}; // module scope; nothing runs — this file exists to be typechecked
