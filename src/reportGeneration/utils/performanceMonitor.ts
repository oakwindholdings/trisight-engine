// src/reportGeneration/utils/performanceMonitor.ts
// Performance monitoring and optimization utilities for report generation
// Context: Tracks operation metrics, identifies bottlenecks, and provides optimization insights

import { logger } from '../../utils/logger';

export interface PerformanceMetric {
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface OperationStats {
  count: number;
  successRate: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  errors: string[];
}

export interface PerformanceReport {
  summary: Record<string, OperationStats>;
  bottlenecks: string[];
  recommendations: string[];
  resourceUsage: ResourceUsage;
}

export interface ResourceUsage {
  memoryUsageMB: number;
  apiCallsCount: number;
  cacheHitRate: number;
  concurrentOperations: number;
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private resourceTracking = {
    apiCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    activeOperations: new Set<string>()
  };
  
  /**
   * Measures the duration and success of an async operation
   */
  async measureOperation<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const operationId = `${name}_${Date.now()}_${Math.random()}`;
    this.resourceTracking.activeOperations.add(operationId);
    const start = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - start;
      
      this.recordMetric(name, {
        duration,
        success: true,
        timestamp: Date.now(),
        metadata
      });
      
      logger.debug(`Operation ${name} completed in ${duration.toFixed(2)}ms`);
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.recordMetric(name, {
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
        metadata
      });
      
      logger.error(`Operation ${name} failed after ${duration.toFixed(2)}ms: ${error}`);
      
      throw error;
    } finally {
      this.resourceTracking.activeOperations.delete(operationId);
    }
  }
  
  /**
   * Records a metric value with automatic cleanup
   */
  private recordMetric(name: string, metric: PerformanceMetric): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(metric);
    
    // Keep only last 1000 values for memory efficiency
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
  }
  
  /**
   * Tracks API call for resource monitoring
   */
  recordApiCall(cacheHit: boolean): void {
    this.resourceTracking.apiCalls++;
    if (cacheHit) {
      this.resourceTracking.cacheHits++;
    } else {
      this.resourceTracking.cacheMisses++;
    }
  }
  
  /**
   * Gets detailed statistics for a specific operation
   */
  getStats(operationName: string): OperationStats | null {
    const values = this.metrics.get(operationName);
    if (!values || values.length === 0) return null;
    
    const successfulOps = values.filter(v => v.success);
    const durations = successfulOps.map(v => v.duration);
    
    if (durations.length === 0) {
      return {
        count: values.length,
        successRate: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50Duration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errors: values.filter(v => v.error).map(v => v.error!)
      };
    }
    
    durations.sort((a, b) => a - b);
    
    return {
      count: values.length,
      successRate: successfulOps.length / values.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50Duration: this.percentile(durations, 0.50),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      errors: [...new Set(values.filter(v => v.error).map(v => v.error!))]
    };
  }
  
  /**
   * Generates a comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const summary: Record<string, OperationStats> = {};
    
    for (const [name] of this.metrics.entries()) {
      const stats = this.getStats(name);
      if (stats) {
        summary[name] = stats;
      }
    }
    
    return {
      summary,
      bottlenecks: this.identifyBottlenecks(summary),
      recommendations: this.generateRecommendations(summary),
      resourceUsage: this.getResourceUsage()
    };
  }
  
  /**
   * Identifies performance bottlenecks
   */
  private identifyBottlenecks(summary: Record<string, OperationStats>): string[] {
    const bottlenecks: string[] = [];
    
    // Find slow operations (avg > 5 seconds)
    const slowOps = Object.entries(summary)
      .filter(([_, stats]) => stats.avgDuration > 5000)
      .sort(([_, a], [__, b]) => b.avgDuration - a.avgDuration);
    
    slowOps.forEach(([name, stats]) => {
      bottlenecks.push(
        `${name}: avg ${Math.round(stats.avgDuration)}ms, ` +
        `p95 ${Math.round(stats.p95Duration)}ms (${stats.count} calls)`
      );
    });
    
    // Find unreliable operations (success rate < 90%)
    const unreliableOps = Object.entries(summary)
      .filter(([_, stats]) => stats.successRate < 0.9 && stats.count > 5);
    
    unreliableOps.forEach(([name, stats]) => {
      bottlenecks.push(
        `${name}: ${Math.round(stats.successRate * 100)}% success rate ` +
        `(${stats.count - Math.round(stats.count * stats.successRate)} failures)`
      );
    });
    
    // Find high-variance operations
    const highVarianceOps = Object.entries(summary)
      .filter(([_, stats]) => 
        stats.p99Duration > stats.p50Duration * 10 && stats.count > 10
      );
    
    highVarianceOps.forEach(([name, stats]) => {
      bottlenecks.push(
        `${name}: high variance - p50 ${Math.round(stats.p50Duration)}ms, ` +
        `p99 ${Math.round(stats.p99Duration)}ms`
      );
    });
    
    return bottlenecks;
  }
  
  /**
   * Generates performance optimization recommendations
   */
  private generateRecommendations(summary: Record<string, OperationStats>): string[] {
    const recommendations: string[] = [];
    
    // Check cache hit rate
    const cacheHitRate = this.getCacheHitRate();
    if (cacheHitRate < 0.7 && this.resourceTracking.apiCalls > 50) {
      recommendations.push(
        `Low cache hit rate (${Math.round(cacheHitRate * 100)}%). ` +
        `Consider implementing more aggressive caching strategies.`
      );
    }
    
    // Check for operations that could benefit from parallelization
    const sequentialOps = Object.entries(summary)
      .filter(([name, stats]) => 
        name.includes('fetch') && stats.avgDuration > 1000 && stats.count > 5
      );
    
    if (sequentialOps.length > 2) {
      recommendations.push(
        `${sequentialOps.length} data fetching operations could potentially ` +
        `be parallelized to reduce total execution time.`
      );
    }
    
    // Check for memory-intensive operations
    const memoryUsage = this.getMemoryUsageMB();
    if (memoryUsage > 500) {
      recommendations.push(
        `High memory usage detected (${memoryUsage}MB). ` +
        `Consider streaming data processing or chunking large operations.`
      );
    }
    
    // Check for retry opportunities
    const retriableOps = Object.entries(summary)
      .filter(([_, stats]) => 
        stats.successRate < 0.95 && 
        stats.successRate > 0.5 && 
        stats.errors.some(e => 
          e.includes('timeout') || 
          e.includes('network') || 
          e.includes('rate limit')
        )
      );
    
    if (retriableOps.length > 0) {
      recommendations.push(
        `${retriableOps.length} operations have transient failures. ` +
        `Implement retry logic with exponential backoff.`
      );
    }
    
    return recommendations;
  }
  
  /**
   * Calculates percentile of a sorted array
   */
  private percentile(sortedArr: number[], p: number): number {
    const index = Math.ceil(sortedArr.length * p) - 1;
    return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
  }
  
  /**
   * Gets current memory usage in MB
   */
  private getMemoryUsageMB(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        return Math.round(memory.usedJSHeapSize / 1024 / 1024);
      }
    }
    return 0;
  }
  
  /**
   * Gets cache hit rate
   */
  private getCacheHitRate(): number {
    const total = this.resourceTracking.cacheHits + this.resourceTracking.cacheMisses;
    return total > 0 ? this.resourceTracking.cacheHits / total : 0;
  }
  
  /**
   * Gets current resource usage metrics
   */
  private getResourceUsage(): ResourceUsage {
    return {
      memoryUsageMB: this.getMemoryUsageMB(),
      apiCallsCount: this.resourceTracking.apiCalls,
      cacheHitRate: this.getCacheHitRate(),
      concurrentOperations: this.resourceTracking.activeOperations.size
    };
  }
  
  /**
   * Resets all metrics (useful for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.resourceTracking = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      activeOperations: new Set<string>()
    };
  }
}

// Global instance for easy access across the application
export const performanceMonitor = new PerformanceMonitor();