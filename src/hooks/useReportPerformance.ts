// src/hooks/useReportPerformance.ts
// React hook for monitoring and displaying report generation performance
// Context: Provides real-time performance insights and optimization suggestions

import { useState, useEffect, useCallback } from 'react';
import { performanceMonitor, PerformanceReport } from '../reportGeneration/utils/performanceMonitor';
import { logger } from '../utils/logger';

export interface PerformanceMetrics {
  currentOperation?: string;
  operationsCompleted: number;
  totalDuration: number;
  avgOperationTime: number;
  bottlenecks: string[];
  recommendations: string[];
  resourceUsage: {
    memoryMB: number;
    apiCalls: number;
    cacheHitRate: number;
    activeOperations: number;
  };
}

export interface UseReportPerformanceResult {
  metrics: PerformanceMetrics;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getReport: () => PerformanceReport;
  reset: () => void;
  isMonitoring: boolean;
}

export function useReportPerformance(): UseReportPerformanceResult {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    operationsCompleted: 0,
    totalDuration: 0,
    avgOperationTime: 0,
    bottlenecks: [],
    recommendations: [],
    resourceUsage: {
      memoryMB: 0,
      apiCalls: 0,
      cacheHitRate: 0,
      activeOperations: 0
    }
  });
  
  // Update metrics periodically when monitoring
  useEffect(() => {
    if (!isMonitoring) return;
    
    const updateMetrics = () => {
      const report = performanceMonitor.generateReport();
      
      // Calculate aggregate metrics
      let totalOps = 0;
      let totalDuration = 0;
      
      Object.values(report.summary).forEach(stats => {
        totalOps += stats.count;
        totalDuration += stats.avgDuration * stats.count;
      });
      
      setMetrics({
        operationsCompleted: totalOps,
        totalDuration,
        avgOperationTime: totalOps > 0 ? totalDuration / totalOps : 0,
        bottlenecks: report.bottlenecks,
        recommendations: report.recommendations,
        resourceUsage: {
          memoryMB: report.resourceUsage.memoryUsageMB,
          apiCalls: report.resourceUsage.apiCallsCount,
          cacheHitRate: report.resourceUsage.cacheHitRate,
          activeOperations: report.resourceUsage.concurrentOperations
        }
      });
    };
    
    // Initial update
    updateMetrics();
    
    // Update every second
    const interval = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);
  
  const startMonitoring = useCallback(() => {
    logger.info('Starting performance monitoring');
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    logger.info('Stopping performance monitoring');
    setIsMonitoring(false);
  }, []);
  
  const getReport = useCallback((): PerformanceReport => {
    return performanceMonitor.generateReport();
  }, []);
  
  const reset = useCallback(() => {
    logger.info('Resetting performance metrics');
    performanceMonitor.reset();
    setMetrics({
      operationsCompleted: 0,
      totalDuration: 0,
      avgOperationTime: 0,
      bottlenecks: [],
      recommendations: [],
      resourceUsage: {
        memoryMB: 0,
        apiCalls: 0,
        cacheHitRate: 0,
        activeOperations: 0
      }
    });
  }, []);
  
  return {
    metrics,
    startMonitoring,
    stopMonitoring,
    getReport,
    reset,
    isMonitoring
  };
}