// assay/kernel/sim.ts
// Position lifecycle, fills, frictions — the ledger is a value, not a file.
// Pure: no I/O, no clock, no randomness; identical inputs yield byte-identical ledgers.

import { refuse, type Outcome, isRefused } from './refusal.ts';
import { type AsOfUniverse } from './bars.ts';
import { divRoundHalfEven, mulMicros, addMicros } from './micros.ts';
import { type ClosedPosition } from './metrics.ts';

/** Frictions are declared, versioned, hashed inputs (I4) — never afterthoughts. */
export interface Frictions {
  readonly version: string;
  readonly slippageBps: number;
  readonly commissionPerShareMicros: number;
  readonly borrowAvailable: boolean;
  readonly fillModel: 'next_open';
  readonly gapPolicy: 'fill_at_open'; // gaps fill at the actual (gapped) open — no better-price fantasy
  readonly periodsPerYear: number; // annualization convention is an input, never a kernel constant
  readonly universeAvailability: Readonly<Record<string, boolean>>;
}

export interface Decision {
  readonly id: string;
  readonly t: number; // must equal a bar timestamp of the symbol (signal computed on that close)
  readonly symbol: string;
  readonly action: 'BUY' | 'SELL';
  readonly shares: number;
}

export interface Fill {
  readonly fillId: string;
  readonly decisionId: string; // exactly one decision per fill — double-counting unrepresentable
  readonly t: number;
  readonly symbol: string;
  readonly action: 'BUY' | 'SELL';
  readonly shares: number;
  readonly priceMicros: number; // slippage applied
  readonly commissionMicros: number;
}

export interface Ledger {
  readonly kind: 'ledger';
  readonly initialCashMicros: number;
  readonly finalCashMicros: number;
  readonly fills: readonly Fill[];
  readonly unfilled: readonly { decisionId: string; why: string }[];
  readonly closedPositions: readonly ClosedPosition[];
  readonly openPositions: readonly { symbol: string; shares: number; costMicros: number }[];
  readonly equityPath: readonly { t: number; equityMicros: number }[];
  readonly totalCommissionsMicros: number;
  readonly realizedTradingPnlMicros: number; // excludes commissions; commissions are their own line
}

/** Forge finding 4 (proven +296%): a negative commission MINTS cash. Frictions are declared
 *  inputs (I4) but declared does not mean trusted — one owner validates structure AND values,
 *  used at the CLI boundary and re-checked inside simulate (Spec is structural, forgeable). */
export function validateFrictions(x: unknown): Outcome<Frictions> {
  if (typeof x !== 'object' || x === null || Array.isArray(x)) return refuse('invalid_params', 'frictions must be an object');
  const o = x as Record<string, unknown>;
  const allowed = ['version', 'slippageBps', 'commissionPerShareMicros', 'borrowAvailable', 'fillModel', 'gapPolicy', 'periodsPerYear', 'universeAvailability'];
  for (const k of Object.keys(o)) {
    if (!allowed.includes(k)) return refuse('invalid_params', `frictions: unknown field '${k}'`);
  }
  if (typeof o.version !== 'string' || o.version.length === 0) return refuse('invalid_params', 'frictions.version must be a non-empty string');
  if (typeof o.slippageBps !== 'number' || !Number.isInteger(o.slippageBps) || o.slippageBps < 0 || o.slippageBps >= 10_000) {
    return refuse('invalid_params', `slippageBps ${String(o.slippageBps)} must be an integer in [0, 10000)`);
  }
  if (!Number.isSafeInteger(o.commissionPerShareMicros) || (o.commissionPerShareMicros as number) < 0) {
    return refuse('invalid_params', `commissionPerShareMicros ${String(o.commissionPerShareMicros)} must be a non-negative safe integer`);
  }
  if (typeof o.borrowAvailable !== 'boolean') return refuse('invalid_params', 'borrowAvailable must be boolean');
  if (o.fillModel !== 'next_open') return refuse('invalid_params', `unsupported fillModel '${String(o.fillModel)}'`);
  if (o.gapPolicy !== 'fill_at_open') return refuse('invalid_params', `unsupported gapPolicy '${String(o.gapPolicy)}'`);
  if (typeof o.periodsPerYear !== 'number' || !Number.isFinite(o.periodsPerYear) || o.periodsPerYear <= 0) {
    return refuse('invalid_params', `periodsPerYear ${String(o.periodsPerYear)} must be a positive number`);
  }
  const ua = o.universeAvailability;
  if (typeof ua !== 'object' || ua === null || Array.isArray(ua)) return refuse('invalid_params', 'universeAvailability must be an object');
  for (const [sym, v] of Object.entries(ua as Record<string, unknown>)) {
    if (typeof v !== 'boolean') return refuse('invalid_params', `universeAvailability['${sym}'] must be boolean`);
  }
  return x as Frictions;
}

interface Lot {
  shares: number;
  priceMicros: number;
  openFillId: string;
}

function fillPrice(openMicros: number, slippageBps: number, action: 'BUY' | 'SELL'): Outcome<number> {
  const factor = action === 'BUY' ? 10_000 + slippageBps : 10_000 - slippageBps;
  const num = mulMicros(openMicros, factor, 'slippage');
  if (isRefused(num)) return num;
  return divRoundHalfEven(num, 10_000, 'slippage');
}

/** Simulate decisions against an AsOf universe under declared frictions. Total function. */
export function simulate(
  universe: AsOfUniverse,
  decisions: readonly Decision[],
  frictions: Frictions,
  initialCashMicros: number
): Outcome<Ledger> {
  if (!Number.isSafeInteger(initialCashMicros) || initialCashMicros <= 0) {
    return refuse('invalid_params', `initial cash ${initialCashMicros}`);
  }
  const fv = validateFrictions(frictions);
  if (isRefused(fv)) return fv;
  for (const s of universe.symbols) {
    if (frictions.universeAvailability[s] !== true) {
      return refuse('partial_universe', `availability not declared true for ${s}`);
    }
  }
  // deterministic order: by time, then id
  const ordered = [...decisions].sort((a, b) => (a.t - b.t !== 0 ? a.t - b.t : a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // per-symbol timestamp index
  const barIndex = new Map<string, Map<number, number>>();
  const timeline = new Set<number>();
  for (const sym of universe.symbols) {
    const series = universe.series(sym);
    if (isRefused(series)) return series;
    const m = new Map<number, number>();
    for (let i = 0; i < series.length; i++) {
      const b = series.bar(i);
      if (isRefused(b)) return b;
      m.set(b.t, i);
      timeline.add(b.t);
    }
    barIndex.set(sym, m);
  }
  const times = [...timeline].sort((a, b) => a - b);

  // schedule fills: decision at bar i fills at bar i+1 open (declared fill model)
  interface Pending { decision: Decision; fillT: number; openMicros: number }
  const pending: Pending[] = [];
  const unfilled: { decisionId: string; why: string }[] = [];
  for (const d of ordered) {
    if (!Number.isSafeInteger(d.shares) || d.shares <= 0) return refuse('invalid_params', `decision ${d.id} shares ${d.shares}`);
    const idx = barIndex.get(d.symbol)?.get(d.t);
    if (idx === undefined) return refuse('missing_bar', `decision ${d.id}: no ${d.symbol} bar at ${d.t}`);
    const series = universe.series(d.symbol);
    if (isRefused(series)) return series;
    const next = series.bar(idx + 1);
    if (isRefused(next)) {
      unfilled.push({ decisionId: d.id, why: 'no_next_bar' });
      continue;
    }
    pending.push({ decision: d, fillT: next.t, openMicros: next.oMicros });
  }

  let cash = initialCashMicros;
  let commissions = 0;
  let realized = 0;
  const fills: Fill[] = [];
  const closed: ClosedPosition[] = [];
  const lots = new Map<string, Lot[]>();
  const equityPath: { t: number; equityMicros: number }[] = [];
  let fillSeq = 0;

  for (const t of times) {
    // fills due at this timestamp, deterministic order (schedule order is already deterministic)
    for (const p of pending) {
      if (p.fillT !== t) continue;
      const d = p.decision;
      const price = fillPrice(p.openMicros, frictions.slippageBps, d.action);
      if (isRefused(price)) return price;
      const gross = mulMicros(price, d.shares, `fill ${d.id}`);
      if (isRefused(gross)) return gross;
      const commission = mulMicros(frictions.commissionPerShareMicros, d.shares, `commission ${d.id}`);
      if (isRefused(commission)) return commission;
      const fillId = `F${String(fillSeq++).padStart(6, '0')}`;
      if (d.action === 'BUY') {
        const debit = addMicros(gross, commission, `debit ${d.id}`);
        if (isRefused(debit)) return debit;
        const cashAfter = addMicros(cash, -debit, `cash after ${d.id}`);
        if (isRefused(cashAfter)) return cashAfter;
        cash = cashAfter;
        const symLots = lots.get(d.symbol) ?? [];
        symLots.push({ shares: d.shares, priceMicros: price, openFillId: fillId });
        lots.set(d.symbol, symLots);
      } else {
        const symLots = lots.get(d.symbol) ?? [];
        const held = symLots.reduce((acc, l) => acc + l.shares, 0);
        if (held < d.shares) {
          if (!frictions.borrowAvailable) {
            return refuse('borrow_unavailable', `decision ${d.id}: short ${d.shares - held} ${d.symbol} with no borrow`);
          }
          return refuse('invalid_params', `decision ${d.id}: shorting not supported in Phase 1 sim`);
        }
        let remaining = d.shares;
        while (remaining > 0) {
          const lot = symLots[0]!;
          const take = Math.min(lot.shares, remaining);
          const proceeds = mulMicros(price, take, `close ${d.id}`);
          if (isRefused(proceeds)) return proceeds;
          const cost = mulMicros(lot.priceMicros, take, `cost ${d.id}`);
          if (isRefused(cost)) return cost;
          closed.push({ symbol: d.symbol, openFillId: lot.openFillId, closeFillId: fillId, pnlMicros: proceeds - cost });
          const realizedNext = addMicros(realized, proceeds - cost, `realized after ${d.id}`);
          if (isRefused(realizedNext)) return realizedNext;
          realized = realizedNext;
          lot.shares -= take;
          remaining -= take;
          if (lot.shares === 0) symLots.shift();
        }
        const credit = addMicros(gross, -commission, `credit ${d.id}`);
        if (isRefused(credit)) return credit;
        const cashAfter = addMicros(cash, credit, `cash after ${d.id}`);
        if (isRefused(cashAfter)) return cashAfter;
        cash = cashAfter;
      }
      const commissionsNext = addMicros(commissions, commission, 'commission total');
      if (isRefused(commissionsNext)) return commissionsNext;
      commissions = commissionsNext;
      fills.push({
        fillId,
        decisionId: d.id,
        t,
        symbol: d.symbol,
        action: d.action,
        shares: d.shares,
        priceMicros: price,
        commissionMicros: commission,
      });
    }
    // mark-to-market at close
    let equity = cash;
    for (const [sym, symLots] of [...lots.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      if (symLots.length === 0) continue;
      const idx = barIndex.get(sym)!;
      // last bar at or before t
      const series = universe.series(sym);
      if (isRefused(series)) return series;
      let markMicros: number | undefined;
      const direct = idx.get(t);
      if (direct !== undefined) {
        const b = series.bar(direct);
        if (isRefused(b)) return b;
        markMicros = b.cMicros;
      } else {
        for (let i = series.length - 1; i >= 0; i--) {
          const b = series.bar(i);
          if (isRefused(b)) return b;
          if (b.t <= t) {
            markMicros = b.cMicros;
            break;
          }
        }
      }
      if (markMicros === undefined) return refuse('missing_bar', `${sym}: no mark price at ${t}`);
      for (const lot of symLots) {
        const mv = mulMicros(markMicros, lot.shares, `mark ${sym}`);
        if (isRefused(mv)) return mv;
        const equityNext = addMicros(equity, mv, `equity at ${t}`);
        if (isRefused(equityNext)) return equityNext;
        equity = equityNext;
      }
    }
    equityPath.push({ t, equityMicros: equity });
  }

  const openPositions: { symbol: string; shares: number; costMicros: number }[] = [];
  for (const [symbol, symLots] of [...lots.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (symLots.length === 0) continue;
    let shares = 0;
    let costMicros = 0;
    for (const l of symLots) {
      shares = shares + l.shares;
      const lotCost = mulMicros(l.priceMicros, l.shares, `lot cost ${symbol}`);
      if (isRefused(lotCost)) return lotCost;
      const next = addMicros(costMicros, lotCost, `cost sum ${symbol}`);
      if (isRefused(next)) return next;
      costMicros = next;
    }
    openPositions.push({ symbol, shares, costMicros });
  }

  return {
    kind: 'ledger',
    initialCashMicros,
    finalCashMicros: cash,
    fills,
    unfilled,
    closedPositions: closed,
    openPositions,
    equityPath,
    totalCommissionsMicros: commissions,
    realizedTradingPnlMicros: realized,
  };
}
