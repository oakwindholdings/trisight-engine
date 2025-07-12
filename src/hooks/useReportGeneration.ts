// src/hooks/useReportGeneration.ts
// Hook for generating Breakout Target and Golden Candle Reports with step metrics
// Integrates with PatternContext and provides export functionality

import { useCallback, useMemo } from 'react';
import { usePatternContext } from '../contexts/PatternContext';
import { useMarketData } from './useMarketData';
import { 
  generateBreakoutTargetReport,
  generateGoldenCandleReport,
  exportToCSV,
  exportToExcel,
  createReportExportPackage,
  BreakoutTargetReport,
  GoldenCandleReport
} from '../utils/reportGeneration';
import { logDebug } from '../utils/debug';

export interface ReportGenerationResult {
  breakoutTargets: BreakoutTargetReport[];
  goldenCandles: GoldenCandleReport[];
  totalReports: number;
  hasData: boolean;
}

export interface UseReportGenerationReturn {
  // Report data
  reports: ReportGenerationResult;
  
  // Export functions
  exportBreakoutTargetsCSV: () => void;
  exportBreakoutTargetsExcel: () => void;
  exportGoldenCandlesCSV: () => void;
  exportGoldenCandlesExcel: () => void;
  exportAllReportsPackage: () => void;
  
  // Utility functions
  generateReports: () => ReportGenerationResult;
  isReportDataAvailable: boolean;
}

/**
 * Hook for generating and exporting step metric reports
 */
export function useReportGeneration(): UseReportGenerationReturn {
  const { 
    breakoutBoxes,
    escalatorSteps,
    stepIntrinsicCount,
    stepBreakoutCount,
    stepContinuanceCount
  } = usePatternContext();
  
  const { data } = useMarketData();
  
  // Generate reports when data changes
  const reports = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        breakoutTargets: [],
        goldenCandles: [],
        totalReports: 0,
        hasData: false
      };
    }
    
    // Convert escalator step events to step boxes with metrics
    const stepBoxes = escalatorSteps.map(stepEvent => {
      const stepData = stepEvent.data;
      
      // Extract step metrics from context arrays
      const stepStartIndex = stepData.startIndex || 0;
      const stepEndIndex = stepData.endIndex || 0;
      
      const intrinsicCount = stepIntrinsicCount?.[stepStartIndex] || 0;
      const breakoutCount = stepBreakoutCount?.[stepStartIndex] || 0;
      const continuanceCount = stepContinuanceCount?.[stepStartIndex] || 0;
      
      return {
        ...stepData,
        stepIntrinsicCount: intrinsicCount,
        stepBreakoutCount: breakoutCount,
        stepContinuanceCount: continuanceCount
      };
    });
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Generating reports:', {
      stepBoxesCount: stepBoxes.length,
      breakoutBoxesCount: breakoutBoxes.length,
      candlesCount: data.length,
      sampleStepMetrics: stepBoxes.slice(0, 3).map(s => ({
        stepRef: `${s.startIndex}-${s.endIndex}`,
        stepIntrinsicCount: s.stepIntrinsicCount,
        stepBreakoutCount: s.stepBreakoutCount,
        stepContinuanceCount: s.stepContinuanceCount
      }))
    });
    
    // Generate breakout target reports
    const breakoutTargets = generateBreakoutTargetReport(
      stepBoxes,
      breakoutBoxes,
      data,
      'TRISIGHT' // Symbol placeholder
    );
    
    // Generate golden candle reports (using breakout events as golden events for now)
    // TODO: Replace with actual golden candle events when available
    const goldenCandles = generateGoldenCandleReport(
      breakoutBoxes, // Using breakout events as placeholder until golden candle events are available
      'TRISIGHT'
    );
    
    const result = {
      breakoutTargets,
      goldenCandles,
      totalReports: breakoutTargets.length + goldenCandles.length,
      hasData: breakoutTargets.length > 0 || goldenCandles.length > 0
    };
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Reports generated:', {
      breakoutTargetsCount: breakoutTargets.length,
      goldenCandlesCount: goldenCandles.length,
      totalReports: result.totalReports,
      hasData: result.hasData
    });
    
    return result;
  }, [data, breakoutBoxes, escalatorSteps, stepIntrinsicCount, stepBreakoutCount, stepContinuanceCount]);
  
  // Export functions
  const exportBreakoutTargetsCSV = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trisight-breakout-targets_${timestamp}.csv`;
    exportToCSV(reports.breakoutTargets, filename);
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Exported breakout targets CSV:', {
      filename,
      recordCount: reports.breakoutTargets.length
    });
  }, [reports.breakoutTargets]);
  
  const exportBreakoutTargetsExcel = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trisight-breakout-targets_${timestamp}.xlsx`;
    exportToExcel(reports.breakoutTargets, filename);
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Exported breakout targets Excel:', {
      filename,
      recordCount: reports.breakoutTargets.length
    });
  }, [reports.breakoutTargets]);
  
  const exportGoldenCandlesCSV = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trisight-golden-candles_${timestamp}.csv`;
    exportToCSV(reports.goldenCandles, filename);
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Exported golden candles CSV:', {
      filename,
      recordCount: reports.goldenCandles.length
    });
  }, [reports.goldenCandles]);
  
  const exportGoldenCandlesExcel = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trisight-golden-candles_${timestamp}.xlsx`;
    exportToExcel(reports.goldenCandles, filename);
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Exported golden candles Excel:', {
      filename,
      recordCount: reports.goldenCandles.length
    });
  }, [reports.goldenCandles]);
  
  const exportAllReportsPackage = useCallback(() => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `trisight-step-metrics-report_${timestamp}.json`;
    
    const exportPackage = createReportExportPackage(
      reports.breakoutTargets,
      reports.goldenCandles
    );
    
    const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { 
      type: 'application/json;charset=utf-8;' 
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    logDebug('DEBUG_PATTERN_DETECT', '[useReportGeneration] Exported complete report package:', {
      filename,
      breakoutTargets: reports.breakoutTargets.length,
      goldenCandles: reports.goldenCandles.length,
      packageSize: JSON.stringify(exportPackage).length
    });
  }, [reports]);
  
  const generateReports = useCallback(() => {
    return reports;
  }, [reports]);
  
  const isReportDataAvailable = reports.hasData;
  
  return {
    reports,
    exportBreakoutTargetsCSV,
    exportBreakoutTargetsExcel,
    exportGoldenCandlesCSV,
    exportGoldenCandlesExcel,
    exportAllReportsPackage,
    generateReports,
    isReportDataAvailable
  };
}
