// src/__tests__/PatternFeedbackPipeline.test.tsx
// Unit tests for pattern feedback pipeline components

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicPatternAnalysisModal } from '../components/Feedback/DynamicPatternAnalysisModal';
import { ConsentModal } from '../components/privacy/ConsentModal';
import { usePrivacyConsent } from '../hooks/usePrivacyConsent';
import { patternLearningEngine } from '../services/PatternLearningEngine';
import { 
  PatternFeedback, 
  FeedbackAccuracy, 
  TimingAssessment,
  InvalidityReason 
} from '../models/FeedbackTypes';
import { Pattern, PatternType } from '../models/PatternTypes';

// Mock dependencies
jest.mock('../utils/debug', () => ({
  logDebug: jest.fn()
}));

jest.mock('../hooks/usePrivacyConsent');

// Sample pattern for testing
const mockPattern: Pattern = {
  id: 'test-pattern-1',
  type: PatternType.BLACKJACK,
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T10:30:00'),
  highPrice: 150,
  lowPrice: 145,
  confidence: 0.85,
  hasReceivedFeedback: false,
  // Additional required fields for BlackjackPattern
  intrinsicScores: [8, 9, 7, 10],
  cumulativeScore: 34,
  signalStrength: 'STRONG' as any,
  priceChange: [2.1, 1.8, -0.5, 3.2],
  volumeChange: [15, 20, -5, 25]
} as Pattern;

describe('DynamicPatternAnalysisModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockRequestConsent = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (usePrivacyConsent as jest.Mock).mockReturnValue({
      hasConsent: true,
      requestConsent: mockRequestConsent
    });
  });
  
  it('renders correctly when open with pattern', () => {
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.getByText('Pattern Analysis Feedback')).toBeInTheDocument();
    expect(screen.getByText(/BLACKJACK Pattern/i)).toBeInTheDocument();
    expect(screen.getByText(/Confidence: 85%/)).toBeInTheDocument();
  });
  
  it('does not render when closed', () => {
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={false}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    expect(screen.queryByText('Pattern Analysis Feedback')).not.toBeInTheDocument();
  });
  
  it('handles accuracy rating changes', () => {
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const accuracySlider = screen.getByRole('slider', { name: /accuracy/i });
    fireEvent.change(accuracySlider, { target: { value: '4' } });
    
    expect(screen.getByText('Accurate')).toHaveClass('active');
  });
  
  it('handles confidence level changes', () => {
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const confidenceSlider = screen.getAllByRole('slider')[1];
    fireEvent.change(confidenceSlider, { target: { value: '75' } });
    
    expect(screen.getByText(/Your confidence in this assessment: 75%/)).toBeInTheDocument();
  });
  
  it('shows invalidity reason when pattern marked invalid', async () => {
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const validityCheckbox = screen.getByRole('checkbox', { name: /valid pattern/i });
    await userEvent.click(validityCheckbox);
    
    expect(screen.getByText(/Why is this pattern invalid/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
  
  it('requests consent if not given', async () => {
    (usePrivacyConsent as jest.Mock).mockReturnValue({
      hasConsent: false,
      requestConsent: mockRequestConsent.mockResolvedValue(false)
    });
    
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await userEvent.click(submitButton);
    
    expect(mockRequestConsent).toHaveBeenCalled();
    expect(screen.getByText(/Privacy consent is required/i)).toBeInTheDocument();
  });
  
  it('submits feedback with correct data', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    // Set form values
    const accuracySlider = screen.getByRole('slider', { name: /accuracy/i });
    fireEvent.change(accuracySlider, { target: { value: '5' } });
    
    const timingRadio = screen.getByLabelText(/Perfect Timing/i);
    await userEvent.click(timingRadio);
    
    const notesTextarea = screen.getByPlaceholderText(/additional observations/i);
    await userEvent.type(notesTextarea, 'Great pattern detection!');
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          patternId: 'test-pattern-1',
          patternType: PatternType.BLACKJACK,
          accuracy: FeedbackAccuracy.VERY_ACCURATE,
          timing: TimingAssessment.PERFECT,
          isValid: true,
          notes: 'Great pattern detection!',
          consentGiven: true
        })
      );
    });
  });
  
  it('shows success message after submission', async () => {
    mockOnSubmit.mockResolvedValue(undefined);
    
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPattern}
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
      />
    );
    
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await userEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback!/i)).toBeInTheDocument();
    });
    
    // Should close after delay
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});

describe('ConsentModal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).__handleConsentDecision = jest.fn();
  });
  
  it('renders privacy information correctly', () => {
    render(<ConsentModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Help Improve Pattern Detection')).toBeInTheDocument();
    expect(screen.getByText(/Your feedback helps us make pattern detection more accurate/i)).toBeInTheDocument();
    expect(screen.getByText(/All feedback is anonymous/i)).toBeInTheDocument();
  });
  
  it('handles consent acceptance', async () => {
    const mockHandleDecision = jest.fn();
    (window as any).__handleConsentDecision = mockHandleDecision;
    
    render(<ConsentModal isOpen={true} onClose={mockOnClose} />);
    
    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i });
    await userEvent.click(acceptButton);
    
    expect(mockHandleDecision).toHaveBeenCalledWith(true, expect.objectContaining({
      consentType: 'feedback',
      allowDataProcessing: true,
      allowModelTraining: true,
      allowAggregateSharing: true
    }));
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('handles consent decline', async () => {
    const mockHandleDecision = jest.fn();
    (window as any).__handleConsentDecision = mockHandleDecision;
    
    render(<ConsentModal isOpen={true} onClose={mockOnClose} />);
    
    const declineButton = screen.getByRole('button', { name: /No Thanks/i });
    await userEvent.click(declineButton);
    
    expect(mockHandleDecision).toHaveBeenCalledWith(false);
    expect(mockOnClose).toHaveBeenCalled();
  });
  
  it('disables accept when basic processing unchecked', async () => {
    render(<ConsentModal isOpen={true} onClose={mockOnClose} />);
    
    const basicProcessingCheckbox = screen.getByLabelText(/Basic Processing/i);
    await userEvent.click(basicProcessingCheckbox);
    
    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i });
    expect(acceptButton).toBeDisabled();
  });
});

describe('PatternLearningEngine', () => {
  beforeEach(() => {
    patternLearningEngine.clearBuffer();
  });
  
  it('calculates average accuracy correctly', () => {
    const feedbacks: Partial<PatternFeedback>[] = [
      { accuracy: FeedbackAccuracy.ACCURATE },
      { accuracy: FeedbackAccuracy.VERY_ACCURATE },
      { accuracy: FeedbackAccuracy.NEUTRAL }
    ];
    
    const avg = patternLearningEngine.calculateAverageAccuracy(feedbacks as PatternFeedback[]);
    expect(avg).toBe(4); // (4 + 5 + 3) / 3
  });
  
  it('calculates timing adjustment with confidence weighting', () => {
    const feedbacks: Partial<PatternFeedback>[] = [
      { timing: TimingAssessment.TOO_EARLY, confidence: 100 },
      { timing: TimingAssessment.SLIGHTLY_LATE, confidence: 50 }
    ];
    
    const adjustment = patternLearningEngine.calculateTimingAdjustment(feedbacks as PatternFeedback[]);
    expect(adjustment).toBeCloseTo(-100); // Weighted towards early
  });
  
  it('calculates validity rate correctly', () => {
    const feedbacks: Partial<PatternFeedback>[] = [
      { isValid: true },
      { isValid: true },
      { isValid: false },
      { isValid: true }
    ];
    
    const rate = patternLearningEngine.calculateValidityRate(feedbacks as PatternFeedback[]);
    expect(rate).toBe(0.75); // 3/4
  });
  
  it('adjusts confidence threshold based on feedback', () => {
    const feedbacks: Partial<PatternFeedback>[] = [
      { accuracy: FeedbackAccuracy.VERY_ACCURATE, isValid: true },
      { accuracy: FeedbackAccuracy.ACCURATE, isValid: true }
    ];
    
    const newThreshold = patternLearningEngine.calculateNewConfidenceThreshold(
      0.6,
      feedbacks as PatternFeedback[]
    );
    
    expect(newThreshold).toBeLessThan(0.6); // Should decrease for good feedback
  });
  
  it('processes feedback batch when threshold reached', () => {
    const processSpy = jest.spyOn(patternLearningEngine as any, 'processPatternFeedback');
    
    // Add feedbacks up to threshold (10)
    for (let i = 0; i < 10; i++) {
      patternLearningEngine.addFeedback({
        id: `fb-${i}`,
        patternId: 'pattern-1',
        patternType: PatternType.BLACKJACK,
        accuracy: FeedbackAccuracy.ACCURATE,
        confidence: 80,
        timing: TimingAssessment.PERFECT,
        isValid: true,
        sessionId: 'test-session',
        userAgent: 'test',
        viewport: { width: 1920, height: 1080 },
        consentGiven: true,
        consentTimestamp: new Date(),
        dataRetentionDays: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      } as PatternFeedback);
    }
    
    expect(processSpy).toHaveBeenCalled();
  });
  
  it('returns correct statistics', () => {
    // Add some feedbacks
    for (let i = 0; i < 5; i++) {
      patternLearningEngine.addFeedback({
        id: `fb-${i}`,
        patternId: 'pattern-1',
        patternType: PatternType.ESCALATOR,
        accuracy: FeedbackAccuracy.NEUTRAL,
        confidence: 50,
        timing: TimingAssessment.PERFECT,
        isValid: true,
        sessionId: 'test',
        userAgent: 'test',
        viewport: { width: 1920, height: 1080 },
        consentGiven: true,
        consentTimestamp: new Date(),
        dataRetentionDays: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      } as PatternFeedback);
    }
    
    const stats = patternLearningEngine.getStatistics();
    expect(stats.totalFeedbacks).toBe(5);
    expect(stats.patternsInBuffer).toBe(1);
    expect(stats.readyToProcess).toBe(0); // Not at threshold yet
  });
}); 