import { renderHook } from '@testing-library/react';
import { useFeedback } from '../useFeedback';

describe('useFeedback', () => {
  test('submits feedback', () => {
    const { result } = renderHook(() => useFeedback());
    result.current.submitFeedback({ patternId: '1', confidenceRating: 5, falsePositive: false, notes: '' });
    // Add assertions
  });
}); 