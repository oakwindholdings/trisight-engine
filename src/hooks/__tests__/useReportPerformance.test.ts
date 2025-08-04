// src/hooks/__tests__/useReportPerformance.test.ts
// Unit tests for useReportPerformance hook
// Context: Tests report performance monitoring and metrics

import { renderHook, act } from '@testing-library/react';
import { useReportPerformance } from '../useReportPerformance';
import { logDebug, logError } from '../../utils/logger';

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

// Mock performance API
const mockPerformance = {
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByName: jest.fn(),
  getEntriesByType: jest.fn(),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn()
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true
});

describe('useReportPerformance Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformance.getEntriesByName.mockReturnValue([]);
    mockPerformance.getEntriesByType.mockReturnValue([]);
  });

  describe('Initial State', () => {
    it('should return initial metrics', () => {
      const { result } = renderHook(() => useReportPerformance());

      expect(result.current.metrics).toEqual({
        generationTime: 0,
        dataFetchTime: 0,
        processingTime: 0,
        assemblyTime: 0,
        totalTime: 0,
        memoryUsage: 0,
        reportSize: 0
      });

      expect(result.current.isTracking).toBe(false);
      expect(result.current.history).toEqual([]);
      expect(typeof result.current.startTracking).toBe('function');
      expect(typeof result.current.endTracking).toBe('function');
      expect(typeof result.current.trackStage).toBe('function');
      expect(typeof result.current.getAverageMetrics).toBe('function');
      expect(typeof result.current.clearHistory).toBe('function');
    });
  });

  describe('Performance Tracking', () => {
    it('should start tracking report generation', () => {
      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
      });

      expect(result.current.isTracking).toBe(true);
      expect(mockPerformance.mark).toHaveBeenCalledWith('report-generation-start-report-123');
    });

    it('should track individual stages', () => {
      mockPerformance.getEntriesByName.mockImplementation((name) => {
        if (name.includes('measure')) {
          return [{ duration: 1000 }];
        }
        return [];
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
      });

      act(() => {
        result.current.trackStage('data-fetch', 'start');
      });

      expect(mockPerformance.mark).toHaveBeenCalledWith('data-fetch-start-report-123');

      act(() => {
        result.current.trackStage('data-fetch', 'end');
      });

      expect(mockPerformance.mark).toHaveBeenCalledWith('data-fetch-end-report-123');
      expect(mockPerformance.measure).toHaveBeenCalledWith(
        'data-fetch-duration-report-123',
        'data-fetch-start-report-123',
        'data-fetch-end-report-123'
      );

      expect(result.current.metrics.dataFetchTime).toBe(1000);
    });

    it('should end tracking and calculate total time', () => {
      mockPerformance.getEntriesByName.mockImplementation((name) => {
        if (name === 'report-generation-duration-report-123') {
          return [{ duration: 5000 }];
        }
        if (name.includes('data-fetch')) {
          return [{ duration: 1000 }];
        }
        if (name.includes('processing')) {
          return [{ duration: 2000 }];
        }
        if (name.includes('assembly')) {
          return [{ duration: 1500 }];
        }
        return [];
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.trackStage('data-fetch', 'start');
        result.current.trackStage('data-fetch', 'end');
        result.current.trackStage('processing', 'start');
        result.current.trackStage('processing', 'end');
        result.current.trackStage('assembly', 'start');
        result.current.trackStage('assembly', 'end');
      });

      const reportInfo = {
        reportSize: 1024 * 32, // 32KB
        slideCount: 6
      };

      act(() => {
        result.current.endTracking('report-123', reportInfo);
      });

      expect(result.current.isTracking).toBe(false);
      expect(result.current.metrics).toEqual({
        generationTime: 5000,
        dataFetchTime: 1000,
        processingTime: 2000,
        assemblyTime: 1500,
        totalTime: 5000,
        memoryUsage: expect.any(Number),
        reportSize: 32768
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0]).toMatchObject({
        reportId: 'report-123',
        timestamp: expect.any(Date),
        metrics: result.current.metrics,
        reportInfo
      });
    });
  });

  describe('Memory Usage Tracking', () => {
    it('should track memory usage if available', () => {
      const mockMemory = {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024,
        jsHeapSizeLimit: 2048 * 1024 * 1024
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.endTracking('report-123', { reportSize: 1000 });
      });

      expect(result.current.metrics.memoryUsage).toBe(50);
    });

    it('should handle missing memory API', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        configurable: true
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.endTracking('report-123', { reportSize: 1000 });
      });

      expect(result.current.metrics.memoryUsage).toBe(0);
    });
  });

  describe('Average Metrics', () => {
    it('should calculate average metrics from history', () => {
      mockPerformance.getEntriesByName.mockImplementation((name) => {
        if (name.includes('duration')) {
          return [{ duration: 1000 + Math.random() * 1000 }];
        }
        return [];
      });

      const { result } = renderHook(() => useReportPerformance());

      // Generate multiple reports
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.startTracking(`report-${i}`);
          result.current.trackStage('data-fetch', 'start');
          result.current.trackStage('data-fetch', 'end');
          result.current.endTracking(`report-${i}`, { 
            reportSize: 30000 + i * 1000,
            slideCount: 5 + i 
          });
        });
      }

      const averages = result.current.getAverageMetrics();

      expect(averages.generationTime).toBeGreaterThan(0);
      expect(averages.dataFetchTime).toBeGreaterThan(0);
      expect(averages.reportSize).toBeGreaterThan(30000);
      expect(averages.totalTime).toBeGreaterThan(0);
    });

    it('should return zero averages for empty history', () => {
      const { result } = renderHook(() => useReportPerformance());

      const averages = result.current.getAverageMetrics();

      expect(averages).toEqual({
        generationTime: 0,
        dataFetchTime: 0,
        processingTime: 0,
        assemblyTime: 0,
        totalTime: 0,
        memoryUsage: 0,
        reportSize: 0
      });
    });
  });

  describe('History Management', () => {
    it('should limit history to 100 entries', () => {
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 1000 }]);

      const { result } = renderHook(() => useReportPerformance());

      // Generate more than 100 reports
      for (let i = 0; i < 110; i++) {
        act(() => {
          result.current.startTracking(`report-${i}`);
          result.current.endTracking(`report-${i}`, { reportSize: 1000 });
        });
      }

      expect(result.current.history).toHaveLength(100);
      expect(result.current.history[0].reportId).toBe('report-10');
      expect(result.current.history[99].reportId).toBe('report-109');
    });

    it('should clear history', () => {
      mockPerformance.getEntriesByName.mockReturnValue([{ duration: 1000 }]);

      const { result } = renderHook(() => useReportPerformance());

      // Add some history
      act(() => {
        result.current.startTracking('report-1');
        result.current.endTracking('report-1', { reportSize: 1000 });
        result.current.startTracking('report-2');
        result.current.endTracking('report-2', { reportSize: 2000 });
      });

      expect(result.current.history).toHaveLength(2);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle stage tracking without starting', () => {
      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.trackStage('data-fetch', 'start');
      });

      expect(logError).toHaveBeenCalledWith(
        'useReportPerformance',
        'Cannot track stage without active tracking session'
      );
    });

    it('should handle ending without starting', () => {
      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.endTracking('report-123', { reportSize: 1000 });
      });

      expect(logError).toHaveBeenCalledWith(
        'useReportPerformance',
        'Cannot end tracking without active session'
      );
    });

    it('should handle performance API errors gracefully', () => {
      mockPerformance.measure.mockImplementation(() => {
        throw new Error('Performance API error');
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.trackStage('data-fetch', 'start');
        result.current.trackStage('data-fetch', 'end');
      });

      expect(logError).toHaveBeenCalledWith(
        'useReportPerformance',
        'Failed to measure stage performance:',
        expect.any(Error)
      );
    });
  });

  describe('Performance Thresholds', () => {
    it('should identify slow operations', () => {
      mockPerformance.getEntriesByName.mockImplementation((name) => {
        if (name.includes('data-fetch')) {
          return [{ duration: 10000 }]; // 10 seconds - slow
        }
        if (name.includes('processing')) {
          return [{ duration: 500 }]; // 0.5 seconds - fast
        }
        return [{ duration: 1000 }];
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.trackStage('data-fetch', 'start');
        result.current.trackStage('data-fetch', 'end');
        result.current.trackStage('processing', 'start');
        result.current.trackStage('processing', 'end');
        result.current.endTracking('report-123', { reportSize: 1000 });
      });

      const slowOperations = result.current.getSlowOperations?.() || [];
      
      expect(slowOperations).toContain('data-fetch');
      expect(slowOperations).not.toContain('processing');
    });
  });

  describe('Concurrent Tracking', () => {
    it('should handle multiple concurrent report tracking', () => {
      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-1');
      });

      // Try to start another tracking session
      act(() => {
        result.current.startTracking('report-2');
      });

      expect(logDebug).toHaveBeenCalledWith(
        'useReportPerformance',
        'Ending previous tracking session before starting new one'
      );
    });
  });

  describe('Performance Optimization Suggestions', () => {
    it('should provide optimization suggestions based on metrics', () => {
      mockPerformance.getEntriesByName.mockImplementation((name) => {
        if (name.includes('data-fetch')) {
          return [{ duration: 8000 }]; // Slow data fetch
        }
        if (name.includes('processing')) {
          return [{ duration: 5000 }]; // Slow processing
        }
        return [{ duration: 1000 }];
      });

      const { result } = renderHook(() => useReportPerformance());

      act(() => {
        result.current.startTracking('report-123');
        result.current.trackStage('data-fetch', 'start');
        result.current.trackStage('data-fetch', 'end');
        result.current.trackStage('processing', 'start');
        result.current.trackStage('processing', 'end');
        result.current.endTracking('report-123', { 
          reportSize: 10 * 1024 * 1024 // 10MB - large
        });
      });

      const suggestions = result.current.getOptimizationSuggestions?.() || [];

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          stage: 'data-fetch',
          issue: 'Slow data fetching',
          suggestion: expect.stringContaining('cache')
        })
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          stage: 'processing',
          issue: 'Slow processing',
          suggestion: expect.stringContaining('optimize')
        })
      );

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          stage: 'report-size',
          issue: 'Large report size',
          suggestion: expect.stringContaining('compress')
        })
      );
    });
  });
});