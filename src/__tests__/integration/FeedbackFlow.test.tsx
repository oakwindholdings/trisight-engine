// src/__tests__/integration/FeedbackFlow.test.tsx
// Integration tests for end-to-end feedback submission flow

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatternProvider } from '../../contexts/PatternContext';
import { MarketDataProvider } from '../../contexts/MarketDataContext';
import InfiniteZoomChart from '../../components/Chart/InfiniteZoomChart';
import { DynamicPatternAnalysisModal } from '../../components/Feedback/DynamicPatternAnalysisModal';
import { ConsentModal } from '../../components/privacy/ConsentModal';
import { patternLearningEngine } from '../../services/PatternLearningEngine';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { FeedbackAccuracy, TimingAssessment } from '../../models/FeedbackTypes';

// Mock modules
jest.mock('../../api/marketApi');
jest.mock('../../utils/debug');
jest.mock('../../utils/supabase/client', () => ({
  supabaseClient: {
    from: jest.fn(() => ({
      insert: jest.fn().mockResolvedValue({ data: [], error: null }),
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    }))
  }
}));

// Mock pattern data
const mockPatternWithFeedback: Pattern = {
  id: 'pattern-feedback-enabled',
  type: PatternType.ESCALATOR,
  startTime: new Date('2024-01-15T10:00:00'),
  endTime: new Date('2024-01-15T10:30:00'),
  highPrice: 155,
  lowPrice: 150,
  confidence: 0.75,
  hasReceivedFeedback: false,
  feedbackEnabled: true,
  clickable: true,
  steps: [],
  direction: 'BULLISH' as any,
  stepScores: [],
  cumulativeScore: 0,
  signalStrength: 'MODERATE' as any,
  priceChanges: [],
  volumeChanges: [],
  averageStepHeight: 0,
  stepConsistency: 0
} as any;

describe('Feedback Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    patternLearningEngine.clearBuffer();
    localStorage.clear();
  });
  
  it('completes full feedback flow from pattern click to submission', async () => {
    const user = userEvent;
    
    // Render chart with pattern provider
    const { container } = render(
      <MarketDataProvider>
        <PatternProvider>
          <div>
            <InfiniteZoomChart
              symbol="AAPL"
              patterns={[mockPatternWithFeedback]}
              width={800}
              height={600}
            />
            <DynamicPatternAnalysisModal
              pattern={null}
              isOpen={false}
              onClose={() => {}}
              onSubmit={async () => {}}
            />
            <ConsentModal isOpen={false} onClose={() => {}} />
          </div>
        </PatternProvider>
      </MarketDataProvider>
    );
    
    // Wait for chart to render
    await waitFor(() => {
      const canvas = container.querySelector('canvas.interaction-canvas');
      expect(canvas).toBeInTheDocument();
    });
    
    // Simulate pattern click
    const canvas = container.querySelector('canvas.interaction-canvas') as HTMLCanvasElement;
    await user.click(canvas);
    
    // Modal should open for feedback-enabled pattern
    await waitFor(() => {
      expect(screen.getByText('Pattern Analysis Feedback')).toBeInTheDocument();
    });
    
    // Fill out feedback form
    const accuracySlider = screen.getByRole('slider', { name: /accuracy/i });
    await user.type(accuracySlider, '{arrowright}{arrowright}'); // Move to "Accurate"
    
    const confidenceSlider = screen.getAllByRole('slider')[1];
    await user.clear(confidenceSlider);
    await user.type(confidenceSlider, '85');
    
    const timingRadio = screen.getByLabelText(/Perfect Timing/i);
    await user.click(timingRadio);
    
    const notesTextarea = screen.getByPlaceholderText(/additional observations/i);
    await user.type(notesTextarea, 'Integration test feedback');
    
    // Submit feedback
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback!/i)).toBeInTheDocument();
    });
    
    // Verify feedback was added to learning engine
    const stats = patternLearningEngine.getStatistics();
    expect(stats.totalFeedbacks).toBe(1);
    expect(stats.patternsInBuffer).toBe(1);
  });
  
  it('handles consent flow when not previously granted', async () => {
    const user = userEvent;
    
    render(
      <MarketDataProvider>
        <PatternProvider>
          <div>
            <DynamicPatternAnalysisModal
              pattern={mockPatternWithFeedback}
              isOpen={true}
              onClose={() => {}}
              onSubmit={async () => {}}
            />
            <ConsentModal isOpen={false} onClose={() => {}} />
          </div>
        </PatternProvider>
      </MarketDataProvider>
    );
    
    // Try to submit without consent
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    // Consent modal should appear
    await waitFor(() => {
      expect(screen.getByText('Help Improve Pattern Detection')).toBeInTheDocument();
    });
    
    // Grant consent
    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i });
    await user.click(acceptButton);
    
    // Should return to feedback modal
    await waitFor(() => {
      expect(screen.getByText('Pattern Analysis Feedback')).toBeInTheDocument();
    });
    
    // Now submission should work
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback!/i)).toBeInTheDocument();
    });
  });
  
  it('persists consent across sessions', async () => {
    const user = userEvent;
    
    // First session - grant consent
    const { unmount } = render(
      <ConsentModal isOpen={true} onClose={() => {}} />
    );
    
    const acceptButton = screen.getByRole('button', { name: /Accept & Continue/i });
    await user.click(acceptButton);
    
    // Verify consent stored
    expect(localStorage.getItem('trisight_privacy_consent')).toBeTruthy();
    
    unmount();
    
    // Second session - consent should be remembered
    render(
      <MarketDataProvider>
        <PatternProvider>
          <DynamicPatternAnalysisModal
            pattern={mockPatternWithFeedback}
            isOpen={true}
            onClose={() => {}}
            onSubmit={async () => {}}
          />
        </PatternProvider>
      </MarketDataProvider>
    );
    
    // Should be able to submit directly without consent prompt
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    // Should show success without consent modal
    await waitFor(() => {
      expect(screen.getByText(/Thank you for your feedback!/i)).toBeInTheDocument();
    });
  });
  
  it('processes feedback batch when threshold reached', async () => {
    const processSpy = jest.spyOn(patternLearningEngine as any, 'processPatternFeedback');
    
    // Add multiple feedbacks
    for (let i = 0; i < 10; i++) {
      await patternLearningEngine.addFeedback({
        id: `fb-${i}`,
        patternId: mockPatternWithFeedback.id,
        patternType: mockPatternWithFeedback.type,
        accuracy: FeedbackAccuracy.ACCURATE,
        confidence: 80 + i,
        timing: TimingAssessment.PERFECT,
        isValid: true,
        sessionId: 'test-session',
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        consentGiven: true,
        consentTimestamp: new Date(),
        dataRetentionDays: 90,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Verify batch processing triggered
    expect(processSpy).toHaveBeenCalledWith(mockPatternWithFeedback.id);
    
    // Verify model update event fired
    await waitFor(() => {
      const stats = patternLearningEngine.getStatistics();
      expect(stats.totalFeedbacks).toBe(0); // Buffer cleared after processing
    });
  });
  
  it('validates feedback data before submission', async () => {
    const user = userEvent;
    const mockSubmit = jest.fn().mockRejectedValue(new Error('Validation failed'));
    
    render(
      <DynamicPatternAnalysisModal
        pattern={mockPatternWithFeedback}
        isOpen={true}
        onClose={() => {}}
        onSubmit={mockSubmit}
      />
    );
    
    // Submit without changing defaults
    const submitButton = screen.getByRole('button', { name: /Submit Feedback/i });
    await user.click(submitButton);
    
    // Should call submit with valid data structure
    expect(mockSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        patternId: mockPatternWithFeedback.id,
        patternType: mockPatternWithFeedback.type,
        accuracy: expect.any(Number),
        confidence: expect.any(Number),
        timing: expect.any(String),
        isValid: expect.any(Boolean),
        sessionId: expect.any(String),
        userAgent: expect.any(String),
        viewport: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number)
        }),
        consentGiven: true,
        consentTimestamp: expect.any(Date),
        dataRetentionDays: 90
      })
    );
    
    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to submit feedback/i)).toBeInTheDocument();
    });
  });
}); 