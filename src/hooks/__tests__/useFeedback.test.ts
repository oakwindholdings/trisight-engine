// src/hooks/__tests__/useFeedback.test.ts
// Unit tests for useFeedback hook
// Context: Tests feedback submission and management

import { renderHook, act } from '@testing-library/react';
import { useFeedback } from '../useFeedback';
import { patternApi } from '../../api/patternApi';

// Mock the pattern API
jest.mock('../../api/patternApi', () => ({
  patternApi: {
    submitPatternFeedback: jest.fn(),
    getPatternHistory: jest.fn(),
    updatePatternSettings: jest.fn()
  }
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('useFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      (patternApi.submitPatternFeedback as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Feedback submitted'
      });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitFeedback({
          patternId: 'pattern-123',
          isCorrect: true,
          confidence: 0.9,
          notes: 'Good pattern detection'
        });
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastSubmission).toEqual({
        patternId: 'pattern-123',
        timestamp: expect.any(Number)
      });

      expect(patternApi.submitPatternFeedback).toHaveBeenCalledWith({
        patternInstanceId: 'pattern-123',
        isCorrect: true,
        confidence: 0.9,
        notes: 'Good pattern detection'
      });
    });

    it('should handle submission errors', async () => {
      (patternApi.submitPatternFeedback as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Submission failed'
      });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitFeedback({
          patternId: 'pattern-123',
          isCorrect: false
        });
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBe('Submission failed');
      expect(result.current.lastSubmission).toBeNull();
    });

    it('should handle network errors', async () => {
      (patternApi.submitPatternFeedback as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitFeedback({
          patternId: 'pattern-123',
          isCorrect: true
        });
      });

      expect(result.current.isSubmitting).toBe(false);
      expect(result.current.error).toBe('Failed to submit feedback');
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('should set loading state during submission', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      (patternApi.submitPatternFeedback as jest.Mock).mockReturnValue(promise);

      const { result } = renderHook(() => useFeedback());

      // Start submission
      act(() => {
        result.current.submitFeedback({
          patternId: 'pattern-123',
          isCorrect: true
        });
      });

      expect(result.current.isSubmitting).toBe(true);

      // Resolve submission
      await act(async () => {
        resolvePromise!({ success: true });
        await promise;
      });

      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('getFeedbackHistory', () => {
    it('should fetch feedback history', async () => {
      const mockHistory = [
        { id: '1', patternType: 'BREAKOUT', isCorrect: true },
        { id: '2', patternType: 'CHANNEL', isCorrect: false }
      ];

      (patternApi.getPatternHistory as jest.Mock).mockResolvedValue({
        success: true,
        data: mockHistory
      });

      const { result } = renderHook(() => useFeedback());

      let history;
      await act(async () => {
        history = await result.current.getFeedbackHistory('AAPL');
      });

      expect(history).toEqual(mockHistory);
      expect(patternApi.getPatternHistory).toHaveBeenCalledWith('AAPL', 50);
    });

    it('should handle history fetch errors', async () => {
      (patternApi.getPatternHistory as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to fetch'
      });

      const { result } = renderHook(() => useFeedback());

      let history;
      await act(async () => {
        history = await result.current.getFeedbackHistory('AAPL');
      });

      expect(history).toEqual([]);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update feedback settings', async () => {
      (patternApi.updatePatternSettings as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Settings updated'
      });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.updateSettings({
          autoSubmit: true,
          minConfidence: 0.7
        });
      });

      expect(result.current.settings).toEqual({
        autoSubmit: true,
        minConfidence: 0.7
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle settings update errors', async () => {
      (patternApi.updatePatternSettings as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Update failed'
      });

      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.updateSettings({
          autoSubmit: false
        });
      });

      expect(result.current.error).toBe('Update failed');
      expect(result.current.settings).toEqual({}); // Settings not updated
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      const { result } = renderHook(() => useFeedback());

      // Set error state
      await act(async () => {
        (patternApi.submitPatternFeedback as jest.Mock).mockResolvedValue({
          success: false,
          message: 'Error occurred'
        });

        await result.current.submitFeedback({
          patternId: 'test',
          isCorrect: true
        });
      });

      expect(result.current.error).toBe('Error occurred');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('state management', () => {
    it('should track feedback statistics', async () => {
      (patternApi.submitPatternFeedback as jest.Mock).mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useFeedback());

      // Submit multiple feedbacks
      await act(async () => {
        await result.current.submitFeedback({
          patternId: '1',
          isCorrect: true
        });
      });

      await act(async () => {
        await result.current.submitFeedback({
          patternId: '2',
          isCorrect: false
        });
      });

      await act(async () => {
        await result.current.submitFeedback({
          patternId: '3',
          isCorrect: true
        });
      });

      expect(result.current.stats).toEqual({
        totalSubmissions: 3,
        correctCount: 2,
        incorrectCount: 1,
        accuracy: 0.67
      });
    });

    it('should handle rapid submissions', async () => {
      (patternApi.submitPatternFeedback as jest.Mock).mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useFeedback());

      const submissions = Array(5).fill(null).map((_, i) => ({
        patternId: `pattern-${i}`,
        isCorrect: i % 2 === 0
      }));

      await act(async () => {
        await Promise.all(
          submissions.map(feedback => 
            result.current.submitFeedback(feedback)
          )
        );
      });

      expect(patternApi.submitPatternFeedback).toHaveBeenCalledTimes(5);
      expect(result.current.stats.totalSubmissions).toBe(5);
    });
  });

  describe('validation', () => {
    it('should validate required feedback fields', async () => {
      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitFeedback({
          patternId: '', // Invalid
          isCorrect: true
        });
      });

      expect(result.current.error).toBe('Pattern ID is required');
      expect(patternApi.submitPatternFeedback).not.toHaveBeenCalled();
    });

    it('should validate confidence range', async () => {
      const { result } = renderHook(() => useFeedback());

      await act(async () => {
        await result.current.submitFeedback({
          patternId: 'test',
          isCorrect: true,
          confidence: 1.5 // Invalid
        });
      });

      expect(result.current.error).toBe('Confidence must be between 0 and 1');
      expect(patternApi.submitPatternFeedback).not.toHaveBeenCalled();
    });
  });
});