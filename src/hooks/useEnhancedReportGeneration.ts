// src/hooks/useEnhancedReportGeneration.ts
// Enhanced report generation hook for superior UI integration
// Context: Provides enhanced reporting capabilities to React components

import { useState, useCallback, useEffect } from 'react';
import { getEnhancedReportApiService, EnhancedReportGenerationRequest, EnhancedReportGenerationResponse } from '../services/enhancedReportApiService';
import { logDebug, logError } from '../utils/logger';

interface EnhancedReportStatus {
  isGenerating: boolean;
  isEnhancedAvailable: boolean;
  progress: number;
  currentTask: string;
  error: string | null;
  lastGenerated: Date | null;
  enhancedFeatures: string[];
}

interface EnhancedReportResult {
  report: EnhancedReportGenerationResponse | null;
  downloadUrl: string | null;
  metadata: any;
}

/**
 * Enhanced report generation hook
 * Provides superior report generation with advanced AI and data capabilities
 */
export function useEnhancedReportGeneration() {
  const [status, setStatus] = useState<EnhancedReportStatus>({
    isGenerating: false,
    isEnhancedAvailable: false,
    progress: 0,
    currentTask: '',
    error: null,
    lastGenerated: null,
    enhancedFeatures: []
  });

  const [result, setResult] = useState<EnhancedReportResult>({
    report: null,
    downloadUrl: null,
    metadata: null
  });

  const enhancedApiService = getEnhancedReportApiService();

  // Check enhanced availability on mount
  useEffect(() => {
    checkEnhancedAvailability();
  }, []);

  /**
   * Check if enhanced reporting is available
   */
  const checkEnhancedAvailability = useCallback(async () => {
    try {
      const isAvailable = await enhancedApiService.isEnhancedAvailable();
      const capabilities = isAvailable ? await enhancedApiService.getEnhancedCapabilities() : null;
      
      setStatus(prev => ({
        ...prev,
        isEnhancedAvailable: isAvailable,
        enhancedFeatures: capabilities?.capabilities.advancedFeatures || []
      }));

      logDebug('useEnhancedReportGeneration', 'Enhanced availability checked:', {
        available: isAvailable,
        features: capabilities?.capabilities.advancedFeatures?.length || 0
      });

    } catch (error) {
      logError('useEnhancedReportGeneration', 'Failed to check enhanced availability:', error);
      setStatus(prev => ({
        ...prev,
        isEnhancedAvailable: false,
        enhancedFeatures: []
      }));
    }
  }, [enhancedApiService]);

  /**
   * Generate enhanced report
   */
  const generateEnhancedReport = useCallback(async (request: EnhancedReportGenerationRequest): Promise<EnhancedReportGenerationResponse> => {
    logDebug('useEnhancedReportGeneration', 'Starting enhanced report generation:', {
      ticker: request.ticker,
      template: request.template,
      enhanced: status.isEnhancedAvailable
    });

    setStatus(prev => ({
      ...prev,
      isGenerating: true,
      progress: 0,
      currentTask: 'Initializing enhanced report generation...',
      error: null
    }));

    setResult({
      report: null,
      downloadUrl: null,
      metadata: null
    });

    try {
      // Update progress during generation
      const progressUpdates = [
        { progress: 10, task: 'Gathering enhanced market data...' },
        { progress: 25, task: 'Analyzing with Claude Opus 4 Max...' },
        { progress: 40, task: 'Performing pattern detection...' },
        { progress: 55, task: 'Gathering web intelligence...' },
        { progress: 70, task: 'Generating AI insights...' },
        { progress: 85, task: 'Assembling enhanced report...' },
        { progress: 95, task: 'Finalizing report...' }
      ];

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setStatus(prev => {
          const nextUpdate = progressUpdates.find(update => update.progress > prev.progress);
          if (nextUpdate) {
            return {
              ...prev,
              progress: nextUpdate.progress,
              currentTask: nextUpdate.task
            };
          }
          return prev;
        });
      }, 2000);

      // Generate the report (with fallback if enhanced not available)
      const report = status.isEnhancedAvailable 
        ? await enhancedApiService.generateEnhancedReport(request)
        : await enhancedApiService.generateReportWithFallback(request);

      clearInterval(progressInterval);

      if (!report.success) {
        throw new Error(report.error?.message || 'Enhanced report generation failed');
      }

      // Create download URL if available
      const downloadUrl = report.downloadUrl || 
        (report.outputPath ? enhancedApiService.getEnhancedDownloadUrl(report.outputPath) : null);

      setResult({
        report,
        downloadUrl,
        metadata: report.metadata
      });

      setStatus(prev => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        currentTask: 'Enhanced report completed successfully!',
        lastGenerated: new Date(),
        error: null
      }));

      logDebug('useEnhancedReportGeneration', 'Enhanced report generated successfully:', {
        reportId: report.reportId,
        dataQuality: report.metadata?.dataQuality,
        confidence: report.metadata?.confidence,
        enhanced: !!report.metadata?.enhancedFeatures?.length
      });

      return report;

    } catch (error) {
      clearInterval(progressInterval);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setStatus(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        currentTask: '',
        error: errorMessage
      }));

      logError('useEnhancedReportGeneration', 'Enhanced report generation failed:', error);
      throw error;
    }
  }, [enhancedApiService, status.isEnhancedAvailable]);

  /**
   * Cancel enhanced report generation
   */
  const cancelEnhancedGeneration = useCallback(async (generationId: string) => {
    try {
      await enhancedApiService.cancelEnhancedReport(generationId);
      
      setStatus(prev => ({
        ...prev,
        isGenerating: false,
        progress: 0,
        currentTask: 'Generation cancelled',
        error: null
      }));

      logDebug('useEnhancedReportGeneration', 'Enhanced generation cancelled:', generationId);

    } catch (error) {
      logError('useEnhancedReportGeneration', 'Failed to cancel enhanced generation:', error);
      throw error;
    }
  }, [enhancedApiService]);

  /**
   * Reset status and result
   */
  const resetEnhancedGeneration = useCallback(() => {
    setStatus(prev => ({
      ...prev,
      isGenerating: false,
      progress: 0,
      currentTask: '',
      error: null
    }));

    setResult({
      report: null,
      downloadUrl: null,
      metadata: null
    });

    logDebug('useEnhancedReportGeneration', 'Enhanced generation reset');
  }, []);

  /**
   * Get enhanced capabilities
   */
  const getEnhancedCapabilities = useCallback(async () => {
    try {
      return await enhancedApiService.getEnhancedCapabilities();
    } catch (error) {
      logError('useEnhancedReportGeneration', 'Failed to get enhanced capabilities:', error);
      throw error;
    }
  }, [enhancedApiService]);

  /**
   * Check enhanced health
   */
  const checkEnhancedHealth = useCallback(async () => {
    try {
      return await enhancedApiService.checkEnhancedHealth();
    } catch (error) {
      logError('useEnhancedReportGeneration', 'Failed to check enhanced health:', error);
      throw error;
    }
  }, [enhancedApiService]);

  return {
    // Status
    status,
    result,
    
    // Actions
    generateEnhancedReport,
    cancelEnhancedGeneration,
    resetEnhancedGeneration,
    checkEnhancedAvailability,
    
    // Utilities
    getEnhancedCapabilities,
    checkEnhancedHealth,
    
    // Computed values
    isEnhanced: status.isEnhancedAvailable,
    isGenerating: status.isGenerating,
    hasError: !!status.error,
    hasResult: !!result.report,
    progress: status.progress,
    enhancedFeatures: status.enhancedFeatures
  };
}

export default useEnhancedReportGeneration;
