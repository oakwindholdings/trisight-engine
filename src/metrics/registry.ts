// src/metrics/registry.ts
// Central registry for chart metrics and indicators
// Provides metric calculations for hover displays

// NOTE: This registry powers hover metrics in MetricPopover (e.g., Open, Close, BJ Cum).

export interface MetricDefinition {
  id: string;
  label: string;
  calc: (idx: number, context: any) => string | number;
}

export const MetricRegistry: Record<string, MetricDefinition> = {
  // Candle data metrics
  open: {
    id: 'open',
    label: 'Open',
    calc: (idx, ctx) => {
      const candle = ctx.candles?.[idx];
      return candle ? candle.open.toFixed(2) : '-';
    }
  },
  high: {
    id: 'high', 
    label: 'High',
    calc: (idx, ctx) => {
      const candle = ctx.candles?.[idx];
      return candle ? candle.high.toFixed(2) : '-';
    }
  },
  low: {
    id: 'low',
    label: 'Low',
    calc: (idx, ctx) => {
      const candle = ctx.candles?.[idx];
      return candle ? candle.low.toFixed(2) : '-';
    }
  },
  close: {
    id: 'close',
    label: 'Close',
    calc: (idx, ctx) => {
      const candle = ctx.candles?.[idx];
      return candle ? candle.close.toFixed(2) : '-';
    }
  },
  volume: {
    id: 'volume',
    label: 'Volume',
    calc: (idx, ctx) => {
      const candle = ctx.candles?.[idx];
      return candle ? (candle.volume / 1000000).toFixed(1) + 'M' : '-';
    }
  },
  bjIntrinsic: {
    id: 'bjIntrinsic',
    label: 'BJ Int',
    calc: (idx, ctx) => ctx.bjIntrinsic?.[idx] ?? '-'
  },
  bjCumulative: {
    id: 'bjCumulative',
    label: 'BJ Cum',
    calc: (idx, ctx) => ctx.bjCumulative?.[idx] ?? '-'
  },
  stepNumber: {
    id: 'stepNumber',
    label: 'Step #',
    calc: (idx, ctx) => ctx.stepIndex?.[idx] ?? '-'
  },
  escalatorDir: {
    id: 'escalatorDir',
    label: 'Esc Dir',
    calc: (idx, ctx) => ctx.escalatorDir?.[idx] ?? '-'
  },
  escalatorLength: {
    id: 'escalatorLength',
    label: 'Esc Len',
    calc: (idx, ctx) => ctx.escalatorLength?.[idx] ?? '-'
  },
  goldmineQual: {
    id: 'goldmineQual',
    label: 'Gold Q',
    calc: (idx, ctx) => ctx.goldmineQual?.[idx] ? 'Y' : 'N'
  },
  trailStop: {
    id: 'trailStop',
    label: 'Stop',
    calc: (idx, ctx) => {
      const stop = ctx.trailStop?.[idx];
      return stop ? stop.toFixed(2) : '-';
    }
  },
  distToStopPct: {
    id: 'distToStopPct',
    label: 'ΔStop%',
    calc: (idx, ctx) => {
      const pct = ctx.distToStopPct?.[idx];
      return pct !== undefined ? pct.toFixed(1) + '%' : '-';
    }
  }
};
