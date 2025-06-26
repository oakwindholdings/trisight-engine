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
 * Generate Golden Candle Report from golden candle events and step data
 */
export function generateGoldenCandleReport(
  stepBoxes: StepBox[],
  goldmineEvents: any[],
  candles: Candle[],
  symbol: string = 'SYMBOL'
): GoldenCandleReport[] {
  const reports: GoldenCandleReport[] = [];
  
  goldmineEvents.forEach(event => {
    const goldmine = event.data;
    if (goldmine.stepRef) {
      const stepBox = stepBoxes.find(step => {
        const stepStartTs = candles[step.startIndex]?.timestamp || 0;
        const stepEndTs = candles[step.endIndex]?.timestamp || 0;
        const stepRef = `${stepStartTs}-${stepEndTs}`;
        return goldmine.stepRef === stepRef;
      });
      
      if (stepBox && goldmine.candleIndex !== undefined) {
        const goldenCandle = candles[goldmine.candleIndex];
        if (goldenCandle) {
          const stepIntrinsicCount = stepBox.stepIntrinsicCount || 0;
          const stepBreakoutCount = stepBox.stepBreakoutCount || 0;
          const stepContinuanceCount = stepBox.stepContinuanceCount || stepIntrinsicCount + stepBreakoutCount;
          
          const strength = calculateStrengthScore(stepIntrinsicCount);
          const momentum = calculateMomentumScore(stepBreakoutCount);
          
          const report: GoldenCandleReport = {
            timestamp: new Date(goldenCandle.timestamp).toISOString(),
            symbol,
            price: goldenCandle.close,
            candleType: goldmine.isContinuation ? 'CONTINUATION' : 'GOLDEN',
            
            stepIntrinsicCount,
            stepBreakoutCount,
            stepContinuanceCount,
            
            strength,
            momentum,
            strengthPercentile: 0, // Will be calculated later
            momentumPercentile: 0, // Will be calculated later
            
            goldenScore: goldmine.goldenScore || 0,
            blackjackScore: goldmine.blackjackScore || 0,
            confirmationCandles: goldmine.confirmationCandles || 0,
            
            overallRank: 0,
            strengthRank: 0,
            momentumRank: 0
          };
          
          reports.push(report);
        }
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
  
  // Sort by combined golden and strength score
  reports.sort((a, b) => {
    const scoreA = a.goldenScore * 0.4 + a.strength * 0.3 + a.momentum * 0.3;
    const scoreB = b.goldenScore * 0.4 + b.strength * 0.3 + b.momentum * 0.3;
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
  goldenReports: GoldenCandleReport[]
): any {
  return {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    reportTypes: ['BREAKOUT_TARGETS', 'GOLDEN_CANDLES'],
    data: {
      breakoutTargets: breakoutReports,
      goldenCandles: goldenReports
    },
    summary: {
      totalBreakoutTargets: breakoutReports.length,
      totalGoldenCandles: goldenReports.length,
      avgStrength: {
        breakout: breakoutReports.reduce((sum, r) => sum + r.strength, 0) / breakoutReports.length || 0,
        golden: goldenReports.reduce((sum, r) => sum + r.strength, 0) / goldenReports.length || 0
      },
      avgMomentum: {
        breakout: breakoutReports.reduce((sum, r) => sum + r.momentum, 0) / breakoutReports.length || 0,
        golden: goldenReports.reduce((sum, r) => sum + r.momentum, 0) / goldenReports.length || 0
      }
    }
  };
}
