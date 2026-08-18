// src/hooks/useAutomatedReportGeneration.ts
// React hook for automated report generation integration
// Context: Connects report generation to React components

import { useState, useCallback } from 'react';
import { ReportConfig, ProcessingStatus, GeneratedReport } from '../types/reportTypes';
import { reportApiService } from '../services/reportApiService';

export function useAutomatedReportGeneration() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  // Holds either the mapped GeneratedReport shape or the raw wire response (server returns the latter)
  const [report, setReport] = useState<GeneratedReport | Awaited<ReturnType<typeof reportApiService.generateReport>> | null>(null);

  const generateReport = useCallback(async (config: ReportConfig | any) => {
    try {
      // Use config as-is, mapping will be done server-side
      let reportConfig = config;
      
      // Ensure output format is set
      reportConfig.outputFormat = config.format || config.outputFormat || 'pdf';
      
      // Update status
      setStatus({
        stage: 'processing',
        progress: 0,
        currentTask: 'Generating report...',
        errors: [],
        startTime: Date.now()
      });
      
      // Use the report API service which handles serverless vs local
      const generatedReport = await reportApiService.generateReport(reportConfig);
      
      setReport(generatedReport);
      
      return generatedReport;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }, []);

  const cancelGeneration = useCallback(async () => {
    if (status?.stage === 'processing') {
      try {
        await reportApiService.cancelReport(report?.id || '');
        setStatus({
          ...status,
          stage: 'failed',
          currentTask: 'Report generation cancelled'
        });
      } catch (error) {
        console.error('Failed to cancel report generation:', error);
      }
    }
  }, [status]);

  return {
    generateReport,
    cancelGeneration,
    status,
    report
  };
}