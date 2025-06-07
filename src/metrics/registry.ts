// src/metrics/registry.ts
// Central registry for all metrics displayed in the UI
// Each metric has an ID, label, and calculation function

export interface MetricDefinition {
  id: string;
  label: string;
  calc: (idx: number, context: any) => string | number;
}

export const MetricRegistry: Record<string, MetricDefinition> = {
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
    calc: (idx, ctx) => {
      const dir = ctx.escalatorDir?.[idx];
      console.log(`[MetricRegistry] escalatorDir calc for idx ${idx}: raw value = ${dir}, returning = ${dir ?? '-'}`);
      return dir ?? '-';
    }
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
