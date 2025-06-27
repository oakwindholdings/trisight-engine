// src/metrics/registry.ts
// Central registry for chart metrics and indicators
// Provides metric calculations for hover displays

// NOTE: This registry powers hover metrics in MetricPopover (e.g., Open, Close, BJ Cum).
// HA Infrastructure Alignment Patch v1.0.0: All metrics now use HA candles for consistency with detection logic

import { logDebugHAAlignmentMismatch } from '../utils/debug';

export interface MetricDefinition {
  id: string;
  label: string;
  calc: (idx: number, context: any) => string | number;
}

export const MetricRegistry: Record<string, MetricDefinition> = {
  // Candle data metrics - NOW USING HA CANDLES FOR ALIGNMENT WITH DETECTION LOGIC
  open: {
    id: 'open',
    label: 'Open (HA)',
    calc: (idx, ctx) => {
      // Use HA candles instead of OHLC for consistency with pattern detection
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle) {
        logDebugHAAlignmentMismatch(idx, 'MetricRegistry.open', 'HA candle data', 'undefined');
        return '-';
      }
      return haCandle.open.toFixed(2);
    }
  },
  high: {
    id: 'high', 
    label: 'High (HA)',
    calc: (idx, ctx) => {
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle) {
        logDebugHAAlignmentMismatch(idx, 'MetricRegistry.high', 'HA candle data', 'undefined');
        return '-';
      }
      return haCandle.high.toFixed(2);
    }
  },
  low: {
    id: 'low',
    label: 'Low (HA)',
    calc: (idx, ctx) => {
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle) {
        logDebugHAAlignmentMismatch(idx, 'MetricRegistry.low', 'HA candle data', 'undefined');
        return '-';
      }
      return haCandle.low.toFixed(2);
    }
  },
  close: {
    id: 'close',
    label: 'Close (HA)',
    calc: (idx, ctx) => {
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle) {
        logDebugHAAlignmentMismatch(idx, 'MetricRegistry.close', 'HA candle data', 'undefined');
        return '-';
      }
      return haCandle.close.toFixed(2);
    }
  },
  volume: {
    id: 'volume',
    label: 'Volume (HA)',
    calc: (idx, ctx) => {
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle) {
        logDebugHAAlignmentMismatch(idx, 'MetricRegistry.volume', 'HA candle data', 'undefined');
        return '-';
      }
      return (haCandle.volume / 1000000).toFixed(1) + 'M';
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
  },
  // Phase 1: Core Metrics - Step candle count metrics (as per trisight.escalator_step.yml)
  stepIntrinsicCount: {
    id: 'stepIntrinsicCount',
    label: 'Step Intrinsic',
    calc: (idx, ctx) => {
      const count = ctx.stepIntrinsicCount?.[idx];
      return count !== undefined && count > 0 ? count.toString() : '-';
    }
  },
  stepBreakoutCount: {
    id: 'stepBreakoutCount', 
    label: 'Step Breakout',
    calc: (idx, ctx) => {
      const count = ctx.stepBreakoutCount?.[idx];
      return count !== undefined && count > 0 ? count.toString() : '-';
    }
  },
  stepContinuanceCount: {
    id: 'stepContinuanceCount',
    label: 'Step Continuance', 
    calc: (idx, ctx) => {
      const count = ctx.stepContinuanceCount?.[idx];
      return count !== undefined && count > 0 ? count.toString() : '-';
    }
  },
  
  // Blackjack Rolling Score Metric
  bjRollingScore: {
    id: 'bjRollingScore',
    label: 'BJ Rolling',
    calc: (idx, ctx) => {
      // Find the rolling score for this timestamp
      const haCandle = ctx.haCandles?.[idx];
      if (!haCandle || !ctx.bjRollingScores) return '-';
      
      const rollingScore = ctx.bjRollingScores.find((rs: { timestamp: number; score: number }) => 
        rs.timestamp === haCandle.timestamp
      );
      return rollingScore ? rollingScore.score.toString() : '-';
    }
  },
  
  // Golden Candle Status Metric
  goldenCandle: {
    id: 'goldenCandle',
    label: 'Golden Candle',
    calc: (idx, ctx) => ctx.goldmineQual?.[idx] ? 'YES' : '-'
  },
  
  // Goldmine Shaft Status Metric
  goldmineShaft: {
    id: 'goldmineShaft',
    label: 'Shaft?',
    calc: (idx, ctx) => ctx.goldmineQual?.[idx] ? 'YES' : '-'
  },
  
  // Rocketman pattern metrics
  rocketmanConfidence: {
    id: 'rocketmanConfidence',
    label: 'Rocket Conf',
    calc: (idx, ctx) => ctx.rocketmanConfidence?.[idx]?.toFixed(2) ?? '-'
  },
  rocketmanAcceleration: {
    id: 'rocketmanAcceleration',
    label: 'Accel Rate',
    calc: (idx, ctx) => ctx.rocketmanAcceleration?.[idx]?.toFixed(2) ?? '-'
  },
  
  // Pivot pattern metrics
  pivotStrength: {
    id: 'pivotStrength',
    label: 'Pivot Str',
    calc: (idx, ctx) => ctx.pivotStrength?.[idx]?.toFixed(2) ?? '-'
  },
  pivotTouchCount: {
    id: 'pivotTouchCount',
    label: 'Touches',
    calc: (idx, ctx) => ctx.pivotTouchCount?.[idx]?.toString() ?? '-'
  },
  
  // Goldmine Channel pattern metrics
  gmcDepthPercent: {
    id: 'gmcDepthPercent',
    label: 'Depth %',
    calc: (idx, ctx) => (ctx.gmcDepthPercent?.[idx]?.toFixed(1) ?? '-') === '-' ? '-' : ctx.gmcDepthPercent[idx].toFixed(1) + '%'
  },
  gmcBaseDuration: {
    id: 'gmcBaseDuration',
    label: 'Base Dur',
    calc: (idx, ctx) => ctx.gmcBaseDuration?.[idx]?.toString() ?? '-'
  },
  gmcBreakoutStrength: {
    id: 'gmcBreakoutStrength',
    label: 'Breakout',
    calc: (idx, ctx) => ctx.gmcBreakoutStrength?.[idx]?.toFixed(2) ?? '-'
  },
  
  // Golden Candle pattern metrics
  goldenCandleQual: {
    id: 'goldenCandleQual',
    label: 'Golden',
    calc: (idx, ctx) => ctx.goldenCandleQual?.[idx] ? 'GOLD' : '-'
  },
  goldenScore: {
    id: 'goldenScore',
    label: 'GoldScore',
    calc: (idx, ctx) => ctx.goldenScore?.[idx]?.toFixed(2) ?? '-'
  },
  goldmineForensics: {
    id: 'goldmineForensics',
    label: 'Forensics',
    calc: (idx, ctx) => ctx.goldmineForensics?.[idx] ? 'NEAR-MISS' : '-'
  },
  goldmineForensicsNotes: {
    id: 'goldmineForensicsNotes',
    label: 'Fail Reason',
    calc: (idx, ctx) => {
      const note = ctx.goldmineForensicsNotes?.[idx];
      return (note && note !== '-') ? note : '-';
    }
  },
};
