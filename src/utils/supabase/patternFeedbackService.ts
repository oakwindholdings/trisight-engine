// src/utils/supabase/patternFeedbackService.ts
// Service for persisting pattern feedback via the Express data API
// Handles feedback submission and retrieval

import {
  PatternFeedback,
  FeedbackAccuracy,
  TimingAssessment,
  InvalidityReason
} from '../../models/FeedbackTypes';
import { PatternType } from '../../models/PatternTypes';
import { logDebug } from '../debug';

interface SupabaseFeedbackRow {
  id: string;
  pattern_id: string;
  pattern_type: string;
  user_id?: string;
  session_id: string;

  accuracy: number;
  confidence: number;
  timing: string;
  is_valid: boolean;
  invalidity_reason?: string;

  notes?: string;
  suggested_start_time?: string;
  suggested_end_time?: string;
  suggested_price_high?: number;
  suggested_price_low?: number;

  created_at: string;
  updated_at: string;
  user_agent: string;
  viewport_width: number;
  viewport_height: number;

  consent_given: boolean;
  consent_timestamp: string;
  data_retention_days: number;
}

/**
 * Minimal JSON fetch wrapper for the /api/data/* endpoints.
 * Errors come back as non-2xx with { error: string }.
 */
async function apiRequest<T = any>(path: string, init?: RequestInit): Promise<{ data: T }> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (body && body.error) || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return body as { data: T };
}

/**
 * Convert client-side feedback to API row format
 */
function toSupabaseRow(feedback: Partial<PatternFeedback>): Partial<SupabaseFeedbackRow> {
  const row: Partial<SupabaseFeedbackRow> = {
    pattern_id: feedback.patternId!,
    pattern_type: String(feedback.patternType),
    session_id: feedback.sessionId || generateSessionId(),

    accuracy: feedback.accuracy || FeedbackAccuracy.NEUTRAL,
    confidence: feedback.confidence || 50,
    timing: feedback.timing || TimingAssessment.PERFECT,
    is_valid: feedback.isValid !== false,
    invalidity_reason: feedback.invalidityReason,

    notes: feedback.notes,

    user_agent: navigator.userAgent,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,

    consent_given: feedback.consentGiven || false,
    consent_timestamp: feedback.consentTimestamp?.toISOString() || new Date().toISOString(),
    data_retention_days: feedback.dataRetentionDays || 90
  };

  // Add suggested adjustments if provided
  if (feedback.suggestedAdjustment) {
    if (feedback.suggestedAdjustment.startTime) {
      row.suggested_start_time = feedback.suggestedAdjustment.startTime.toISOString();
    }
    if (feedback.suggestedAdjustment.endTime) {
      row.suggested_end_time = feedback.suggestedAdjustment.endTime.toISOString();
    }
    row.suggested_price_high = feedback.suggestedAdjustment.priceHigh;
    row.suggested_price_low = feedback.suggestedAdjustment.priceLow;
  }

  return row;
}

/**
 * Convert an API row to client-side feedback
 */
function fromSupabaseRow(row: SupabaseFeedbackRow): PatternFeedback {
  return {
    id: row.id,
    patternId: row.pattern_id,
    patternType: row.pattern_type as PatternType,
    userId: row.user_id,
    sessionId: row.session_id,

    accuracy: row.accuracy as FeedbackAccuracy,
    confidence: row.confidence,
    timing: row.timing as TimingAssessment,
    isValid: row.is_valid,
    invalidityReason: row.invalidity_reason as InvalidityReason | undefined,

    notes: row.notes,
    suggestedAdjustment: (row.suggested_start_time || row.suggested_end_time ||
                         row.suggested_price_high || row.suggested_price_low) ? {
      startTime: row.suggested_start_time ? new Date(row.suggested_start_time) : undefined,
      endTime: row.suggested_end_time ? new Date(row.suggested_end_time) : undefined,
      priceHigh: row.suggested_price_high,
      priceLow: row.suggested_price_low
    } : undefined,

    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    userAgent: row.user_agent,
    viewport: {
      width: row.viewport_width,
      height: row.viewport_height
    },

    consentGiven: row.consent_given,
    consentTimestamp: new Date(row.consent_timestamp),
    dataRetentionDays: row.data_retention_days
  };
}

/**
 * Generate a session ID for anonymous users
 */
function generateSessionId(): string {
  const stored = localStorage.getItem('trisight_session_id');
  if (stored) return stored;

  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('trisight_session_id', sessionId);
  return sessionId;
}

/**
 * Submit pattern feedback via the data API
 */
export async function submitPatternFeedback(feedback: Partial<PatternFeedback>): Promise<void> {
  try {
    logDebug('feedback', '[PatternFeedbackService] Submitting feedback:', feedback);

    const row = toSupabaseRow(feedback);

    console.log('[PatternFeedbackService] API row data:', row);
    console.log('[PatternFeedbackService] Notes field:', row.notes);

    try {
      await apiRequest('/api/data/feedback', {
        method: 'POST',
        body: JSON.stringify(row)
      });
    } catch (error: any) {
      console.error('[PatternFeedbackService] API error:', error);
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }

    logDebug('feedback', '[PatternFeedbackService] Feedback submitted successfully');

    // Mark pattern as reviewed when feedback is submitted
    if (feedback.patternId) {
      try {
        const reviewedAt = new Date().toISOString();
        await apiRequest(`/api/data/feed/${feedback.patternId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            reviewed: true,
            reviewed_by: feedback.userId || null,
            reviewed_at: reviewedAt
          })
        });
        logDebug('feedback', '[PatternFeedbackService] Pattern marked as reviewed');
      } catch (reviewError) {
        console.warn('[PatternFeedbackService] Failed to mark pattern as reviewed:', reviewError);
        // Don't fail the feedback submission if review marking fails
      }
    }

    // Dispatch custom event for real-time metrics updates
    window.dispatchEvent(new CustomEvent('pattern-feedback-submitted', {
      detail: {
        patternId: feedback.patternId,
        patternType: feedback.patternType,
        accuracy: feedback.accuracy,
        confidence: feedback.confidence,
        isValid: feedback.isValid,
        timestamp: new Date()
      }
    }));

    // Also emit to pattern feed for real-time updates
    try {
      const { emitPatternFeedSignal } = await import('../../framework/emitPatternFeedSignal');
      emitPatternFeedSignal(
        'FEEDBACK',
        {
          patternId: feedback.patternId,
          accuracy: feedback.accuracy,
          confidence: feedback.confidence,
          isValid: feedback.isValid
        },
        undefined,
        'FEEDBACK'
      );
    } catch (err) {
      logDebug('feedback', '[PatternFeedbackService] Failed to emit to pattern feed:', err);
    }
  } catch (error) {
    console.error('[PatternFeedbackService] Error submitting feedback:', error);
    throw error;
  }
}

/**
 * Get feedback history for a pattern
 */
export async function getPatternFeedback(patternId: string): Promise<PatternFeedback[]> {
  try {
    const params = new URLSearchParams({ pattern_id: patternId });
    const { data } = await apiRequest<SupabaseFeedbackRow[]>(`/api/data/feedback?${params.toString()}`);

    return (data || []).map(fromSupabaseRow);
  } catch (error) {
    console.error('[PatternFeedbackService] Error fetching feedback:', error);
    throw error;
  }
}

/**
 * Get aggregated feedback metrics for a pattern
 */
export async function getPatternFeedbackSummary(patternId: string): Promise<{
  totalFeedbacks: number;
  averageAccuracy: number;
  averageConfidence: number;
  validityRate: number;
  mostCommonTiming: string;
  feedbackTrend: string;
}> {
  try {
    const params = new URLSearchParams({ pattern_id: patternId });
    const { data } = await apiRequest<any[]>(`/api/data/feedback-summary?${params.toString()}`);

    return data?.[0] || {
      totalFeedbacks: 0,
      averageAccuracy: 0,
      averageConfidence: 0,
      validityRate: 0,
      mostCommonTiming: 'unknown',
      feedbackTrend: 'insufficient_data'
    };
  } catch (error) {
    console.error('[PatternFeedbackService] Error fetching feedback summary:', error);
    throw error;
  }
}

/**
 * Update privacy consent
 */
export async function updatePrivacyConsent(consent: {
  consentGiven: boolean;
  consentType: 'feedback' | 'analytics' | 'all';
  allowDataProcessing: boolean;
  allowModelTraining: boolean;
  allowAggregateSharing: boolean;
}): Promise<void> {
  try {
    const sessionId = generateSessionId();

    await apiRequest('/api/data/consent', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        consent_given: consent.consentGiven,
        consent_type: consent.consentType,
        allow_data_processing: consent.allowDataProcessing,
        allow_model_training: consent.allowModelTraining,
        allow_aggregate_sharing: consent.allowAggregateSharing,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days
      })
    });
  } catch (error) {
    console.error('[PatternFeedbackService] Error updating consent:', error);
    throw error;
  }
}
