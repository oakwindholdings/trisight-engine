// src/hooks/__tests__/useFeedback.test.tsx
// Unit tests for useFeedback hook
// Context: Tests pattern feedback submission hook

import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeedback } from '../useFeedback';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { Pattern, PatternType } from '../../models/PatternTypes';
import * as patternApi from '../../api/patternApi';

// Mock the patternApi
jest.mock('../../api/patternApi');

describe('useFeedback', () => {
  const mockPatternApi = patternApi as jest.Mocked<typeof patternApi>;

  const mockFeedback: PatternFeedback = {
    id: 'feedback-1',
    patternId: 'pattern-1',
    patternType: PatternType.GOLDMINE_CHANNEL,
    timestamp: new Date().toISOString(),
    symbol: 'AAPL',
    timeframe: '5m',
    correct: true,
    confidence: 0.85,
    priceAtDetection: 150,
    priceAtFeedback: 152,
    userRating: 4
  };

  const mockPattern: Pattern = {
    id: 'pattern-1',
    type: PatternType.GOLDMINE_CHANNEL,
    symbol: 'AAPL',
    timeframe: '5m',
    startIndex: 0,
    endIndex: 10,
    confidence: 0.85,
    detectedAt: new Date().toISOString(),
    parameters: {},
    hasReceivedFeedback: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPatternApi.getFeedbackHistory.mockResolvedValue([]);
    mockPatternApi.submitFeedback.mockResolvedValue(true);
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFeedback());

    expect(result.current.feedbackHistory).toEqual([]);
    expect(result.current.pendingFeedback).toBe(false);
    expect(result.current.feedbackError).toBeNull();
  });

  it('should load feedback history on mount', async () => {
    const mockHistory = [mockFeedback];
    mockPatternApi.getFeedbackHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.feedbackHistory).toEqual(mockHistory);
    });

    expect(mockPatternApi.getFeedbackHistory).toHaveBeenCalledTimes(1);
  });

  it('should handle feedback history loading error', async () => {
    const mockError = new Error('Failed to load');
    mockPatternApi.getFeedbackHistory.mockRejectedValue(mockError);

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.feedbackError).toEqual(mockError);
    });

    expect(result.current.feedbackHistory).toEqual([]);
  });

  it('should submit feedback successfully', async () => {
    const onPatternUpdate = jest.fn();
    const { result } = renderHook(() => useFeedback(onPatternUpdate));

    let submitResult: boolean | undefined;

    await act(async () => {
      submitResult = await result.current.submitFeedback(mockFeedback);
    });

    expect(submitResult).toBe(true);
    expect(mockPatternApi.submitFeedback).toHaveBeenCalledWith(mockFeedback);
    expect(result.current.feedbackHistory).toContain(mockFeedback);
    expect(result.current.pendingFeedback).toBe(false);
    expect(result.current.feedbackError).toBeNull();
  });

  it('should call onPatternUpdate with preserved symbol', async () => {
    const onPatternUpdate = jest.fn();
    const { result } = renderHook(() => useFeedback(onPatternUpdate));

    const feedbackWithSymbol = {
      ...mockFeedback,
      symbol: 'NVDA',
      ticker: 'NVDA'
    };

    await act(async () => {
      await result.current.submitFeedback(feedbackWithSymbol);
    });

    expect(onPatternUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        hasReceivedFeedback: true,
        symbol: 'NVDA',
        ticker: 'NVDA'
      })
    );
  });

  it('should handle feedback submission error', async () => {
    const mockError = new Error('Submit failed');
    mockPatternApi.submitFeedback.mockRejectedValue(mockError);

    const { result } = renderHook(() => useFeedback());

    let submitResult: boolean | undefined;

    await act(async () => {
      submitResult = await result.current.submitFeedback(mockFeedback);
    });

    expect(submitResult).toBe(false);
    expect(result.current.feedbackError).toEqual(mockError);
    expect(result.current.feedbackHistory).not.toContain(mockFeedback);
  });

  it('should check if pattern has received feedback', async () => {
    const mockHistory = [
      { ...mockFeedback, patternId: 'pattern-1' },
      { ...mockFeedback, patternId: 'pattern-2', id: 'feedback-2' }
    ];
    mockPatternApi.getFeedbackHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.feedbackHistory).toEqual(mockHistory);
    });

    expect(result.current.hasReceivedFeedback('pattern-1')).toBe(true);
    expect(result.current.hasReceivedFeedback('pattern-2')).toBe(true);
    expect(result.current.hasReceivedFeedback('pattern-3')).toBe(false);
  });

  it('should get feedback for specific pattern', async () => {
    const mockHistory = [
      { ...mockFeedback, patternId: 'pattern-1' },
      { ...mockFeedback, patternId: 'pattern-2', id: 'feedback-2' }
    ];
    mockPatternApi.getFeedbackHistory.mockResolvedValue(mockHistory);

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.feedbackHistory).toEqual(mockHistory);
    });

    const feedback = result.current.getFeedbackForPattern('pattern-1');
    expect(feedback).toEqual(mockHistory[0]);

    const noFeedback = result.current.getFeedbackForPattern('pattern-3');
    expect(noFeedback).toBeNull();
  });

  it('should refresh feedback history', async () => {
    const initialHistory = [mockFeedback];
    const updatedHistory = [
      mockFeedback,
      { ...mockFeedback, id: 'feedback-2', patternId: 'pattern-2' }
    ];

    mockPatternApi.getFeedbackHistory
      .mockResolvedValueOnce(initialHistory)
      .mockResolvedValueOnce(updatedHistory);

    const { result } = renderHook(() => useFeedback());

    await waitFor(() => {
      expect(result.current.feedbackHistory).toEqual(initialHistory);
    });

    await act(async () => {
      await result.current.refreshFeedback();
    });

    expect(result.current.feedbackHistory).toEqual(updatedHistory);
    expect(mockPatternApi.getFeedbackHistory).toHaveBeenCalledTimes(2);
  });

  it('should handle concurrent feedback submissions', async () => {
    const feedback1 = { ...mockFeedback, id: 'feedback-1' };
    const feedback2 = { ...mockFeedback, id: 'feedback-2', patternId: 'pattern-2' };

    const { result } = renderHook(() => useFeedback());

    // Submit two feedbacks concurrently
    await act(async () => {
      const promise1 = result.current.submitFeedback(feedback1);
      const promise2 = result.current.submitFeedback(feedback2);
      await Promise.all([promise1, promise2]);
    });

    expect(mockPatternApi.submitFeedback).toHaveBeenCalledTimes(2);
    expect(result.current.feedbackHistory).toHaveLength(2);
    expect(result.current.feedbackHistory).toContain(feedback1);
    expect(result.current.feedbackHistory).toContain(feedback2);
  });

  it('should set pending state during submission', async () => {
    let resolveFeedback: (value: boolean) => void;
    const feedbackPromise = new Promise<boolean>((resolve) => {
      resolveFeedback = resolve;
    });

    mockPatternApi.submitFeedback.mockReturnValue(feedbackPromise);

    const { result } = renderHook(() => useFeedback());

    expect(result.current.pendingFeedback).toBe(false);

    // Start submission
    act(() => {
      result.current.submitFeedback(mockFeedback);
    });

    expect(result.current.pendingFeedback).toBe(true);

    // Complete submission
    await act(async () => {
      resolveFeedback!(true);
      await feedbackPromise;
    });

    expect(result.current.pendingFeedback).toBe(false);
  });
});