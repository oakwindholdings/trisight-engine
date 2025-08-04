// src/hooks/__tests__/useReportGeneration.test.ts
// Unit tests for useReportGeneration hook
// Context: Tests report generation hook functionality

import { renderHook, act } from '@testing-library/react';
import { useReportGeneration } from '../useReportGeneration';
import { generateReport } from '../../services/reportApiService';
import { logDebug, logError } from '../../utils/logger';

// Mock dependencies
jest.mock('../../services/reportApiService', () => ({
  generateReport: jest.fn()
}));

jest.mock('../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn()
}));

describe('useReportGeneration Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return initial state', () => {
      const { result } = renderHook(() => useReportGeneration());

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationProgress).toBe(0);
      expect(result.current.generationError).toBeNull();
      expect(result.current.lastGeneratedReport).toBeNull();
      expect(typeof result.current.generateReport).toBe('function');
      expect(typeof result.current.resetGeneration).toBe('function');
    });
  });

  describe('Report Generation', () => {
    it('should generate report successfully', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'AAPL',
        title: 'Test Report',
        slides: [{ slideNumber: 1, title: 'Title' }],
        companyData: { ticker: 'AAPL' },
        metadata: { format: 'pdf' }
      };

      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'report-123',
        data: mockReport
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        const report = await result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          format: 'pdf'
        });

        expect(report).toEqual(mockReport);
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationProgress).toBe(100);
      expect(result.current.generationError).toBeNull();
      expect(result.current.lastGeneratedReport).toEqual(mockReport);
    });

    it('should handle generation error', async () => {
      const error = new Error('Generation failed');
      (generateReport as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        try {
          await result.current.generateReport({
            ticker: 'AAPL',
            title: 'Test Report',
            template: 'equity-research',
            format: 'pdf'
          });
        } catch (e) {
          // Expected error
        }
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationError).toBe('Generation failed');
      expect(result.current.lastGeneratedReport).toBeNull();
      expect(logError).toHaveBeenCalledWith(
        'useReportGeneration',
        'Failed to generate report:',
        error
      );
    });

    it('should update progress during generation', async () => {
      let progressCallback: ((progress: number) => void) | undefined;
      
      (generateReport as jest.Mock).mockImplementation((config, onProgress) => {
        progressCallback = onProgress;
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              reportId: 'test',
              data: { slides: [] }
            });
          }, 100);
        });
      });

      const { result } = renderHook(() => useReportGeneration());

      act(() => {
        result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          format: 'pdf'
        });
      });

      expect(result.current.isGenerating).toBe(true);
      expect(result.current.generationProgress).toBe(0);

      // Simulate progress updates
      act(() => {
        if (progressCallback) {
          progressCallback(25);
        }
      });

      expect(result.current.generationProgress).toBe(25);

      act(() => {
        if (progressCallback) {
          progressCallback(50);
        }
      });

      expect(result.current.generationProgress).toBe(50);
    });

    it('should prevent concurrent generations', async () => {
      (generateReport as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useReportGeneration());

      act(() => {
        result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test 1',
          template: 'equity-research',
          format: 'pdf'
        });
      });

      expect(result.current.isGenerating).toBe(true);

      // Try to generate another report while first is in progress
      await act(async () => {
        try {
          await result.current.generateReport({
            ticker: 'NVDA',
            title: 'Test 2',
            template: 'equity-research',
            format: 'pdf'
          });
        } catch (e) {
          expect(e).toEqual(new Error('Generation already in progress'));
        }
      });

      expect(generateReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset generation state', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'AAPL',
        title: 'Test Report',
        slides: [],
        companyData: {},
        metadata: {}
      };

      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'report-123',
        data: mockReport
      });

      const { result } = renderHook(() => useReportGeneration());

      // Generate report first
      await act(async () => {
        await result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          format: 'pdf'
        });
      });

      expect(result.current.lastGeneratedReport).toEqual(mockReport);
      expect(result.current.generationProgress).toBe(100);

      // Reset
      act(() => {
        result.current.resetGeneration();
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.generationProgress).toBe(0);
      expect(result.current.generationError).toBeNull();
      expect(result.current.lastGeneratedReport).toBeNull();
    });
  });

  describe('Report Configuration', () => {
    it('should pass correct configuration to API', async () => {
      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'test',
        data: { slides: [] }
      });

      const { result } = renderHook(() => useReportGeneration());

      const config = {
        ticker: 'AAPL',
        title: 'Apple Report',
        template: 'equity-research',
        format: 'pdf' as const,
        author: 'Test Author',
        dataSources: ['market-data', 'financials'],
        visualizations: ['price-chart'],
        includeAISummary: true,
        includeCharts: true,
        aiTone: 'professional' as const
      };

      await act(async () => {
        await result.current.generateReport(config);
      });

      expect(generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          ...config,
          outputFormat: 'pdf'
        }),
        expect.any(Function)
      );
    });

    it('should use default values for optional fields', async () => {
      (generateReport as jest.Mock).mockResolvedValueOnce({
        success: true,
        reportId: 'test',
        data: { slides: [] }
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        await result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          format: 'pdf'
        });
      });

      expect(generateReport).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          format: 'pdf',
          outputFormat: 'pdf',
          author: 'TriSight Analytics',
          dataSources: ['market-data', 'financial-statements', 'news'],
          visualizations: ['price-chart', 'volume-chart', 'financial-metrics'],
          includeAISummary: true,
          includeCharts: true,
          aiTone: 'professional'
        }),
        expect.any(Function)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      (generateReport as jest.Mock).mockRejectedValueOnce({
        response: {
          data: {
            error: 'Invalid ticker symbol'
          }
        }
      });

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        try {
          await result.current.generateReport({
            ticker: 'INVALID',
            title: 'Test',
            template: 'equity-research',
            format: 'pdf'
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.generationError).toBe('Invalid ticker symbol');
    });

    it('should handle network errors', async () => {
      (generateReport as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useReportGeneration());

      await act(async () => {
        try {
          await result.current.generateReport({
            ticker: 'AAPL',
            title: 'Test',
            template: 'equity-research',
            format: 'pdf'
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.generationError).toBe('Network error');
    });

    it('should clear error on successful generation', async () => {
      const error = new Error('First error');
      (generateReport as jest.Mock)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          success: true,
          reportId: 'test',
          data: { slides: [] }
        });

      const { result } = renderHook(() => useReportGeneration());

      // First attempt fails
      await act(async () => {
        try {
          await result.current.generateReport({
            ticker: 'AAPL',
            title: 'Test',
            template: 'equity-research',
            format: 'pdf'
          });
        } catch (e) {
          // Expected
        }
      });

      expect(result.current.generationError).toBe('First error');

      // Second attempt succeeds
      await act(async () => {
        await result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          format: 'pdf'
        });
      });

      expect(result.current.generationError).toBeNull();
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress through generation stages', async () => {
      const progressValues: number[] = [];
      let progressCallback: ((progress: number) => void) | undefined;

      (generateReport as jest.Mock).mockImplementation((config, onProgress) => {
        progressCallback = onProgress;
        // Simulate stages
        setTimeout(() => onProgress?.(20), 10);  // Fetching
        setTimeout(() => onProgress?.(40), 20);  // Processing
        setTimeout(() => onProgress?.(60), 30);  // Generating
        setTimeout(() => onProgress?.(80), 40);  // Assembling
        setTimeout(() => onProgress?.(100), 50); // Complete
        
        return new Promise(resolve => {
          setTimeout(() => resolve({
            success: true,
            reportId: 'test',
            data: { slides: [] }
          }), 60);
        });
      });

      const { result } = renderHook(() => useReportGeneration());
      
      // Capture progress updates
      let previousProgress = 0;
      const checkProgress = () => {
        if (result.current.generationProgress !== previousProgress) {
          progressValues.push(result.current.generationProgress);
          previousProgress = result.current.generationProgress;
        }
      };

      await act(async () => {
        const promise = result.current.generateReport({
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          format: 'pdf'
        });

        // Check progress at intervals
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 10));
          checkProgress();
        }

        await promise;
      });

      // Should have progressed through stages
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    });
  });
});