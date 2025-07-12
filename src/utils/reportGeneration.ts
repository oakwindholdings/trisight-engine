// src/utils/reportGeneration.ts
// Report generation utilities for Breakout Targets and Golden Candle Reports
// Integrates step metrics with sortable/rankable strength and momentum fields

import { Candle } from '../types';
import { StepBox } from '../types/pattern';

export interface ReportMetrics {
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  strength: number;        // Normalized strength score (0-100)
  momentum: number;        // Normalized momentum score (0-100)
  strengthPercentile: number;  // Percentile ranking (0-100)
  momentumPercentile: number;  // Percentile ranking (0-100)
}

export interface BreakoutTargetReport {
  timestamp: string;
  symbol: string;
  price: number;
  direction: 'UP' | 'DOWN';
  stepRef: string;
  
  // Core step metrics
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  
  // Derived metrics
  strength: number;        // Based on stepIntrinsicCount
  momentum: number;        // Based on stepBreakoutCount
  strengthPercentile: number;
  momentumPercentile: number;
  
  // Additional context
  confidence: number;
  volumeProfile: number;
  priceMove: number;
  
  // Ranking fields
  overallRank: number;
  strengthRank: number;
  momentumRank: number;
}

export interface EscalatorStepReport {
  timestamp: string;
  symbol: string;
  stepRef: string;
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  direction: 'RISING' | 'FALLING';
}

export interface EscalatorReport {
  timestamp: string;
  symbol: string;
  direction: 'RISING' | 'FALLING';
  escalatorLength: number;
  escalatorStart: number;
  escalatorEnd: number;
}

export interface GoldmineShaftReport {
  timestamp: string;
  symbol: string;
  entryIndex: number;
  breakoutConfirmed: boolean;
  continuationCount: number;
  blackjackScore: number;
}

export interface GoldenCandleReport {
  timestamp: string;
  symbol: string;
  price: number;
  candleType: 'GOLDEN' | 'CONTINUATION';
  
  // Core step metrics
  stepIntrinsicCount: number;
  stepBreakoutCount: number;
  stepContinuanceCount: number;
  
  // Derived metrics
  strength: number;
  momentum: number;
  strengthPercentile: number;
  momentumPercentile: number;
  
  // Golden candle specific
  goldenScore: number;
  blackjackScore: number;
  confirmationCandles: number;
  
  // Ranking fields
  overallRank: number;
  strengthRank: number;
  momentumRank: number;
}

export interface BlackjackReport {
  timestamp: string;
  symbol: string;
  rollingScore: number;
  intrinsicScore: number;
  cumulativeScore: number;
}

export interface BreakoutBoxReport {
  timestamp: string;
  symbol: string;
  floor: number;
  ceiling: number;
  height: number;
  direction: 'LONG' | 'SHORT';
  blackjackScore: number;
}

export interface RocketmanReport {
  timestamp: string;
  symbol: string;
  direction: 'LONG' | 'SHORT';
  confidence: number;
  accelerationRate: number;
  peakPrice: number;
  intensity: number;
  momentumScore: number;
}

export interface PivotReport {
  timestamp: string;
  symbol: string;
  pivotIndex: number;
  direction: 'SUPPORT' | 'RESISTANCE';
  strength: number;
  touchCount: number;
  pivotPrice: number;
  confidence: number;
  adaptiveZoneWidth: number;
}

export interface GoldmineChannelReport {
  timestamp: string;
  symbol: string;
  direction: 'ASCENDING' | 'DESCENDING' | 'HORIZONTAL';
  depthPercent: number;
  baseDuration: number;
  breakoutStrength: number;
  upperBoundary: number;
  lowerBoundary: number;
  touchPointCount: number;
  confidence: number;
}

/**
 * Calculate strength score based on step intrinsic count
 * Higher intrinsic count indicates stronger foundational movement
 */
export function calculateStrengthScore(stepIntrinsicCount: number): number {
  // Normalize to 0-100 scale with exponential weighting
  // Assumption: 20+ intrinsic candles = maximum strength
  const maxIntrinsic = 20;
  const normalizedScore = Math.min(stepIntrinsicCount / maxIntrinsic, 1.0);
  
  // Apply exponential weighting to emphasize higher counts
  return Math.pow(normalizedScore, 0.7) * 100;
}

/**
 * Calculate momentum score based on step breakout count
 * Higher breakout count indicates stronger momentum continuation
 */
export function calculateMomentumScore(stepBreakoutCount: number): number {
  // Normalize to 0-100 scale with logarithmic weighting
  // Assumption: 10+ breakout candles = maximum momentum
  const maxBreakout = 10;
  const normalizedScore = Math.min(stepBreakoutCount / maxBreakout, 1.0);
  
  // Apply logarithmic scaling to emphasize early momentum
  return (Math.log10(normalizedScore * 9 + 1)) * 100;
}

/**
 * Calculate percentile rankings for a given metric across all records
 */
export function calculatePercentiles<T extends Record<string, any>>(
  records: T[],
  metricField: keyof T
): number[] {
  const values = records.map(r => r[metricField] as number);
  const sortedValues = [...values].sort((a, b) => a - b);
  
  return values.map(value => {
    const rank = sortedValues.findIndex(v => v >= value) + 1;
    return (rank / sortedValues.length) * 100;
  });
}

/**
 * Generate Breakout Target Report from step boxes and breakout events
 */
export function generateBreakoutTargetReport(
  stepBoxes: StepBox[],
  breakoutEvents: any[],
  candles: Candle[],
  symbol: string = 'SYMBOL'
): BreakoutTargetReport[] {
  const reports: BreakoutTargetReport[] = [];
  
  breakoutEvents.forEach(event => {
    const stepBox = stepBoxes.find(step => {
      const stepStartTs = candles[step.startIndex]?.timestamp || 0;
      const stepEndTs = candles[step.endIndex]?.timestamp || 0;
      const stepRef = `${stepStartTs}-${stepEndTs}`;
      return event.data.stepRef === stepRef;
    });
    
    if (stepBox && event.data.breakoutIndex !== undefined) {
      const breakoutCandle = candles[event.data.breakoutIndex];
      if (breakoutCandle) {
        const stepIntrinsicCount = stepBox.stepIntrinsicCount || 0;
        const stepBreakoutCount = stepBox.stepBreakoutCount || 0;
        const stepContinuanceCount = stepBox.stepContinuanceCount || stepIntrinsicCount + stepBreakoutCount;
        
        const strength = calculateStrengthScore(stepIntrinsicCount);
        const momentum = calculateMomentumScore(stepBreakoutCount);
        
        const report: BreakoutTargetReport = {
          timestamp: new Date(breakoutCandle.timestamp).toISOString(),
          symbol,
          price: breakoutCandle.close,
          direction: stepBox.direction || 'UP',
          stepRef: event.data.stepRef,
          
          stepIntrinsicCount,
          stepBreakoutCount,
          stepContinuanceCount,
          
          strength,
          momentum,
          strengthPercentile: 0, // Will be calculated later
          momentumPercentile: 0, // Will be calculated later
          
          confidence: event.data.blackjackScore || 0,
          volumeProfile: stepBox.volumeProfile || 0,
          priceMove: Math.abs(breakoutCandle.close - (stepBox.level || 0)),
          
          overallRank: 0,
          strengthRank: 0,
          momentumRank: 0
        };
        
        reports.push(report);
      }
    }
  });
  
  // Calculate percentiles
  const strengthPercentiles = calculatePercentiles(reports, 'strength');
  const momentumPercentiles = calculatePercentiles(reports, 'momentum');
  
  reports.forEach((report, index) => {
    report.strengthPercentile = strengthPercentiles[index];
    report.momentumPercentile = momentumPercentiles[index];
  });
  
  // Sort by combined strength and momentum score
  reports.sort((a, b) => {
    const scoreA = a.strength * 0.6 + a.momentum * 0.4;
    const scoreB = b.strength * 0.6 + b.momentum * 0.4;
    return scoreB - scoreA;
  });
  
  // Assign rankings
  reports.forEach((report, index) => {
    report.overallRank = index + 1;
  });
  
  // Sort by strength for strength rankings
  const strengthSorted = [...reports].sort((a, b) => b.strength - a.strength);
  strengthSorted.forEach((report, index) => {
    report.strengthRank = index + 1;
  });
  
  // Sort by momentum for momentum rankings
  const momentumSorted = [...reports].sort((a, b) => b.momentum - a.momentum);
  momentumSorted.forEach((report, index) => {
    report.momentumRank = index + 1;
  });
  
  return reports;
}

/**
 * Generate Escalator Report from escalator events
 */
export function generateEscalatorReport(events: any[], symbol: string = 'SYMBOL'): EscalatorReport[] {
  return events.filter(e => e.type === 'ESCALATOR').map((e: any) => ({
    timestamp: new Date(e.timestamp).toISOString(),
    symbol: symbol,
    direction: e.data.direction || 'RISING',
    escalatorLength: e.data.steps?.length || 0,
    escalatorStart: e.data.startIndex || 0,
    escalatorEnd: e.data.endIndex || 0,
  }));
}

/**
 * Generate Blackjack Report from rolling scores context
 */
export function generateBlackjackReport(context: any, symbol: string = 'SYMBOL'): BlackjackReport[] {
  return context.bjRollingScores?.map((scoreObj: any, index: number) => ({
    timestamp: new Date(scoreObj.timestamp).toISOString(),
    symbol: symbol,
    rollingScore: scoreObj.score,
    intrinsicScore: context.bjIntrinsic?.[index] || 0,
    cumulativeScore: context.bjCumulative?.[index] || 0,
  })) || [];
}

/**
 * Generate Breakout Box Report from breakout box events
 */
export function generateBreakoutBoxReport(events: any[], symbol: string = 'SYMBOL'): BreakoutBoxReport[] {
  return events.filter(e => e.type === 'BREAKOUT_BOX').map((e: any) => ({
    timestamp: new Date(e.timestamp).toISOString(),
    symbol: symbol,
    floor: e.data.floor || 0,
    ceiling: e.data.ceiling || 0,
    height: (e.data.ceiling || 0) - (e.data.floor || 0),
    direction: e.data.direction === 'RISING' ? 'LONG' : 'SHORT',
    blackjackScore: e.data.blackjackScore || 0,
  }));
}

/**
 * Generate Rocketman Report from Rocketman pattern events
 */
export function generateRocketmanReport(events: any[], symbol: string = 'SYMBOL'): RocketmanReport[] {
  return events.filter(e => e.type === 'ROCKETMAN').map((e: any) => {
    const data = e.data;
    return {
      timestamp: new Date(data.peakTime).toISOString(),
      symbol: symbol,
      direction: data.direction === 'BULLISH' ? 'LONG' : 'SHORT',
      confidence: data.confidence || 0,
      accelerationRate: data.accelerationRate || 0,
      peakPrice: data.peakPrice || 0,
      intensity: data.intensity || 0,
      momentumScore: data.momentumScore || 0,
    };
  });
}

/**
 * Generate Pivot Report from Pivot pattern events
 */
export function generatePivotReport(events: any[], symbol: string = 'SYMBOL'): PivotReport[] {
  return events.filter(e => e.type === 'PIVOT').map((e: any) => {
    const data = e.data;
    return {
      timestamp: new Date(e.timestamp).toISOString(),
      symbol: symbol,
      pivotIndex: data.pivotIndex || 0,
      direction: data.pivotType === 'SUPPORT' ? 'SUPPORT' : 'RESISTANCE',
      strength: data.strength || 0,
      touchCount: data.touchCount || 0,
      pivotPrice: data.pivotLevel || 0,
      confidence: data.confidence || 0,
      adaptiveZoneWidth: data.zoneWidth || 0,
    };
  });
}

/**
 * Generate Goldmine Channel Report from Goldmine Channel pattern events
 */
export function generateGoldmineChannelReport(events: any[], symbol: string = 'SYMBOL'): GoldmineChannelReport[] {
  return events.filter(e => e.type === 'GOLDMINE_CHANNEL').map((e: any) => {
    const data = e.data;
    const depthPercent = (data.channelWidth || 0) * 100;
    const baseDuration = (data.endIndex || 0) - (data.startIndex || 0);
    
    return {
      timestamp: new Date(e.timestamp).toISOString(),
      symbol: symbol,
      direction: data.direction || 'HORIZONTAL',
      depthPercent: depthPercent,
      baseDuration: baseDuration,
      breakoutStrength: data.confidence || 0,
      upperBoundary: data.upperBoundary || 0,
      lowerBoundary: data.lowerBoundary || 0,
      touchPointCount: data.touchPointCount || 0,
      confidence: data.confidence || 0,
    };
  });
}

/**
 * Generate Golden Candle Report from Golden Candle pattern events
 */
export function generateGoldenCandleReport(events: any[], symbol: string = 'SYMBOL'): GoldenCandleReport[] {
  return events.filter(e => e.type === 'GOLDEN_CANDLE').map((e: any) => {
    const data = e.data;
    
    return {
      timestamp: new Date(e.timestamp).toISOString(),
      symbol: symbol,
      price: data.price || 0,
      candleType: data.candleType || 'GOLDEN',
      
      // Core step metrics
      stepIntrinsicCount: data.stepIntrinsicCount || 0,
      stepBreakoutCount: data.stepBreakoutCount || 0,
      stepContinuanceCount: data.stepContinuanceCount || 0,
      
      // Derived metrics
      strength: data.strength || 0,
      momentum: data.momentum || 0,
      strengthPercentile: data.strengthPercentile || 0,
      momentumPercentile: data.momentumPercentile || 0,
      
      // Golden candle specific
      goldenScore: data.goldenScore || 0,
      blackjackScore: data.blackjackScore || 0,
      confirmationCandles: data.confirmationCandles || 0,
      
      // Ranking fields
      overallRank: data.overallRank || 0,
      strengthRank: data.strengthRank || 0,
      momentumRank: data.momentumRank || 0
    };
  });
}

/**
 * Generate EscalatorStep Report from escalator step events
 */
export function generateEscalatorStepReport(events: any[]): EscalatorStepReport[] {
  return events
    .filter(e => e.type === 'ESCALATOR_STEP')
    .map(e => ({
      timestamp: new Date(e.timestamp).toISOString(),
      symbol: e.symbol || '-',
      stepRef: e.data.stepRef || '',
      stepIntrinsicCount: e.data.stepIntrinsicCount ?? 0,
      stepBreakoutCount: e.data.stepBreakoutCount ?? 0,
      stepContinuanceCount: e.data.stepContinuanceCount ?? 0,
      direction: e.data.direction || 'RISING',
    }));
}

/**
 * Generate GoldmineShaft Report from goldmine shaft events
 */
export function generateGoldmineShaftReport(events: any[]): GoldmineShaftReport[] {
  return events
    .filter(e => e.type === 'GOLDMINE_SHAFT')
    .map(e => ({
      timestamp: new Date(e.timestamp).toISOString(),
      symbol: e.symbol || '-',
      entryIndex: e.data.entryIndex || -1,
      breakoutConfirmed: e.data.breakoutConfirmed || false,
      continuationCount: e.data.continuationCount || 0,
      blackjackScore: e.data.blackjackScore || 0
    }));
}

/**
 * Export report data to CSV format
 */
export function exportToCSV<T extends Record<string, any>>(
  reports: T[],
  filename: string
): void {
  if (reports.length === 0) return;
  
  const headers = Object.keys(reports[0]);
  const csvContent = [
    headers.join(','),
    ...reports.map(report => 
      headers.map(header => {
        const value = report[header];
        // Handle string values that might contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export report data to Excel-compatible format (CSV with Excel headers)
 */
export function exportToExcel<T extends Record<string, any>>(
  reports: T[],
  filename: string
): void {
  const excelFilename = filename.replace('.csv', '.xlsx');
  exportToCSV(reports, excelFilename);
}

/**
 * Create exportable data package for context export
 */
export function createReportExportPackage(
  breakoutReports: BreakoutTargetReport[],
  goldenReports: GoldenCandleReport[],
  escalatorReports: EscalatorReport[] = [],
  blackjackReports: BlackjackReport[] = [],
  breakoutBoxReports: BreakoutBoxReport[] = [],
  escalatorStepReports: EscalatorStepReport[] = [],
  goldmineShaftReports: GoldmineShaftReport[] = [],
  rocketmanReports: RocketmanReport[] = [],
  pivotReports: PivotReport[] = [],
  goldmineChannelReports: GoldmineChannelReport[] = []
): any {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    reportTypes: [
      'BREAKOUT_TARGETS', 'GOLDEN_CANDLES', 'ESCALATORS',
      'ESCALATOR_STEPS', 'BLACKJACK', 'BREAKOUT_BOXES', 'GOLDMINE_SHAFTS', 'ROCKETMAN', 'PIVOT', 'GOLDMINE_CHANNEL'
    ],
    data: {
      breakoutTargets: breakoutReports,
      goldenCandles: goldenReports,
      escalators: escalatorReports,
      escalatorSteps: escalatorStepReports,
      blackjack: blackjackReports,
      breakoutBoxes: breakoutBoxReports,
      goldmineShafts: goldmineShaftReports,
      rocketman: rocketmanReports,
      pivot: pivotReports,
      goldmineChannel: goldmineChannelReports
    },
    summary: {
      totalBreakoutTargets: breakoutReports.length,
      totalGoldenCandles: goldenReports.length,
      totalEscalators: escalatorReports.length,
      totalEscalatorSteps: escalatorStepReports.length,
      totalBlackjack: blackjackReports.length,
      totalBreakoutBoxes: breakoutBoxReports.length,
      totalGoldmineShafts: goldmineShaftReports.length,
      totalRocketman: rocketmanReports.length,
      totalPivot: pivotReports.length,
      totalGoldmineChannel: goldmineChannelReports.length,
      avgStrength: {
        breakout: breakoutReports.reduce((sum, r) => sum + r.strength, 0) / breakoutReports.length || 0,
        golden: goldenReports.reduce((sum, r) => sum + r.strength, 0) / goldenReports.length || 0,
        pivot: pivotReports.reduce((sum, r) => sum + r.strength, 0) / pivotReports.length || 0
      },
      avgMomentum: {
        breakout: breakoutReports.reduce((sum, r) => sum + r.momentum, 0) / breakoutReports.length || 0,
        golden: goldenReports.reduce((sum, r) => sum + r.momentum, 0) / goldenReports.length || 0
      },
      avgConfidence: {
        rocketman: rocketmanReports.reduce((sum, r) => sum + r.confidence, 0) / rocketmanReports.length || 0,
        pivot: pivotReports.reduce((sum, r) => sum + r.confidence, 0) / pivotReports.length || 0,
        goldmineChannel: goldmineChannelReports.reduce((sum, r) => sum + r.confidence, 0) / goldmineChannelReports.length || 0
      },
      avgAcceleration: {
        rocketman: rocketmanReports.reduce((sum, r) => sum + r.accelerationRate, 0) / rocketmanReports.length || 0
      },
      avgTouchCount: {
        pivot: pivotReports.reduce((sum, r) => sum + r.touchCount, 0) / pivotReports.length || 0
      },
      avgDepthPercent: {
        goldmineChannel: goldmineChannelReports.reduce((sum, r) => sum + r.depthPercent, 0) / goldmineChannelReports.length || 0
      },
      avgBaseDuration: {
        goldmineChannel: goldmineChannelReports.reduce((sum, r) => sum + r.baseDuration, 0) / goldmineChannelReports.length || 0
      }
    }
  };
}
