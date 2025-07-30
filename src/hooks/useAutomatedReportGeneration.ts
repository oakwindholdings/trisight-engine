// src/hooks/useAutomatedReportGeneration.ts
// React hook for automated report generation integration
// Context: Connects report generation to React components

import { useState, useCallback } from 'react';
import { ReportConfig, ProcessingStatus, GeneratedReport } from '../reportGeneration/models/reportTypes';
import { createReportGenerator } from '../reportGeneration';

export function useAutomatedReportGeneration() {
  const [status, setStatus] = useState<ProcessingStatus | null>(null);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [generator, setGenerator] = useState<any>(null);

  const generateReport = useCallback(async (config: ReportConfig) => {
    try {
      const gen = createReportGenerator(config);
      setGenerator(gen);
      
      // Listen for status updates
      const handleStatus = (event: any) => {
        setStatus(event.detail);
      };
      
      window.addEventListener('reportGenerationStatus', handleStatus);
      
      const generatedReport = await gen.generateReport();
      setReport(generatedReport);
      
      window.removeEventListener('reportGenerationStatus', handleStatus);
      
      return generatedReport;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  }, []);

  const cancelGeneration = useCallback(() => {
    if (generator) {
      generator.cancel();
    }
  }, [generator]);

  return {
    generateReport,
    cancelGeneration,
    status,
    report
  };
}