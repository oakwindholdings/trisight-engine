import { useState, useCallback, useEffect } from 'react';
import { PatternFeedback } from '../models/FeedbackTypes';
import { Pattern } from '../models/PatternTypes';
import { submitFeedback, getFeedbackHistory } from '../api/patternApi';

/**
 * Hook for managing pattern feedback submission and history
 */
export const useFeedback = (onPatternUpdate?: (pattern: Pattern) => void) => {
  const [feedbackHistory, setFeedbackHistory] = useState<PatternFeedback[]>([]);
  const [pendingFeedback, setPendingFeedback] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<Error | null>(null);
  
  // Load feedback history
  const loadFeedbackHistory = useCallback(async () => {
    try {
      const history = await getFeedbackHistory();
      setFeedbackHistory(history);
    } catch (error) {
      console.error('Error loading feedback history:', error);
      setFeedbackError(error instanceof Error ? error : new Error('Failed to load feedback history'));
    }
  }, []);
  
  // Load feedback history on mount
  useEffect(() => {
    loadFeedbackHistory();
  }, [loadFeedbackHistory]);
  
  // Submit new feedback
  const handleSubmitFeedback = useCallback(async (feedback: PatternFeedback) => {
    setPendingFeedback(true);
    setFeedbackError(null);
    
    try {
      await submitFeedback(feedback);
      
      // Update the feedback history
      setFeedbackHistory(prev => [...prev, feedback]);
      
      // If pattern update callback is provided, mark the pattern as having received feedback
      if (onPatternUpdate) {
        onPatternUpdate({
          ...feedback,
          hasReceivedFeedback: true
        } as unknown as Pattern);
      }
      
      return true;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackError(error instanceof Error ? error : new Error('Failed to submit feedback'));
      return false;
    } finally {
      setPendingFeedback(false);
    }
  }, [onPatternUpdate]);
  
  // Check if a pattern has received feedback
  const hasReceivedFeedback = useCallback((patternId: string): boolean => {
    return feedbackHistory.some(f => f.patternId === patternId);
  }, [feedbackHistory]);
  
  // Get feedback for a specific pattern
  const getFeedbackForPattern = useCallback((patternId: string): PatternFeedback | null => {
    return feedbackHistory.find(f => f.patternId === patternId) || null;
  }, [feedbackHistory]);
  
  return {
    submitFeedback: handleSubmitFeedback,
    feedbackHistory,
    pendingFeedback,
    feedbackError,
    hasReceivedFeedback,
    getFeedbackForPattern,
    refreshFeedback: loadFeedbackHistory
  };
};

export default useFeedback;
