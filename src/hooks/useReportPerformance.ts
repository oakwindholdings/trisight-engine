// src/hooks/useReportPerformance.ts
// React hook for monitoring and displaying report generation performance
// Context: Provides real-time performance insights and optimization suggestions

import React, { useState, useEffect, useCallback } from 'react';
import { PerformanceReport } from '../types/reportTypes';
import { logDebug, logError } from '../utils/logger';

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
  const startTime = React.useRef(Date.now());
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
      // For client-side, we'll track basic metrics
      // Real performance data comes from the server
      setMetrics(prev => ({
        ...prev,
        operationsCompleted: prev.operationsCompleted + 1,
        totalDuration: Date.now() - startTime.current
      }));
    };
    
    // Initial update
    updateMetrics();
    
    // Update every second
    const interval = setInterval(updateMetrics, 1000);
    
    return () => clearInterval(interval);
  }, [isMonitoring]);
  
  const startMonitoring = useCallback(() => {
    logDebug('Starting performance monitoring');
    startTime.current = Date.now();
    setIsMonitoring(true);
  }, []);
  
  const stopMonitoring = useCallback(() => {
    logDebug('Stopping performance monitoring');
    setIsMonitoring(false);
  }, []);
  
  const getReport = useCallback((): PerformanceReport => {
    // Return basic performance report
    return {
      totalDuration: metrics.totalDuration,
      stageDurations: {},
      apiCalls: [],
      memoryUsage: undefined
    };
  }, [metrics]);
  
  const reset = useCallback(() => {
    logDebug('Resetting performance metrics');
    startTime.current = Date.now();
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