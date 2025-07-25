// src/utils/supabase/dynamicPatternFeedbackService.ts
// Dynamic service for persisting pattern feedback to Supabase
// Handles all pattern-specific feedback fields dynamically

import { supabase } from './client';
import { logDebug } from '../debug';

interface DynamicFeedbackPayload {
  pattern_id: string;
  pattern_type: string;
  symbol: string;
  pattern_start_time?: Date;
  pattern_end_time?: Date;
  user_id?: string | null;
  session_id: string;
  notes?: string;
  pattern_metadata?: Record<string, any>;
  ui_metadata?: Record<string, any>;
  consent_given: boolean;
  consent_timestamp: Date;
  [key: string]: any; // Allow any dynamic fields
}

/**
 * Convert dynamic feedback to Supabase row format
 */
function toSupabaseRow(feedback: DynamicFeedbackPayload): Record<string, any> {
  const row: Record<string, any> = {};
  
  // Map all fields, converting camelCase to snake_case
  Object.entries(feedback).forEach(([key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Convert Date objects to ISO strings
    if (value instanceof Date) {
      row[snakeKey] = value.toISOString();
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Keep objects as JSONB
      row[snakeKey] = value;
    } else {
      row[snakeKey] = value;
    }
  });
  
  // Ensure required fields
  row.pattern_id = row.pattern_id || `synthetic_${Date.now()}`;
  row.pattern_type = row.pattern_type || 'UNKNOWN';
  row.symbol = row.symbol || 'UNKNOWN';
  row.session_id = row.session_id || generateSessionId();
  row.feedback_timestamp = row.feedback_timestamp || new Date().toISOString();
  
  return row;
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
 * Submit dynamic pattern feedback to Supabase
 */
export async function submitDynamicPatternFeedback(feedback: DynamicFeedbackPayload): Promise<void> {
  try {
    logDebug('feedback', '[DynamicPatternFeedbackService] Submitting feedback:', feedback);
    
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }
    
    const row = toSupabaseRow(feedback);
    
    console.log('[DynamicPatternFeedbackService] Supabase row data:', row);
    
    const { error } = await supabase
      .from('pattern_feedback')
      .insert(row);
      
    if (error) {
      console.error('[DynamicPatternFeedbackService] Supabase error:', error);
      console.error('[DynamicPatternFeedbackService] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to submit feedback: ${error.message}`);
    }
    
    logDebug('feedback', '[DynamicPatternFeedbackService] Feedback submitted successfully');

    // Dispatch custom event for real-time metrics updates
    window.dispatchEvent(new CustomEvent('pattern-feedback-submitted', {
      detail: {
        patternId: feedback.pattern_id,
        patternType: feedback.pattern_type,
        symbol: feedback.symbol,
        notes: feedback.notes,
        timestamp: new Date()
      }
    }));

    // Also emit to pattern feed for real-time updates
    try {
      const { emitPatternFeedSignal } = await import('../../framework/emitPatternFeedSignal');
      emitPatternFeedSignal(
        'FEEDBACK',
        {
          patternId: feedback.pattern_id,
          patternType: feedback.pattern_type,
          symbol: feedback.symbol,
          notes: feedback.notes
        },
        feedback.symbol,
        'FEEDBACK'
      );
    } catch (err) {
      logDebug('feedback', '[DynamicPatternFeedbackService] Failed to emit to pattern feed:', err);
    }
  } catch (error) {
    console.error('[DynamicPatternFeedbackService] Error submitting feedback:', error);
    throw error;
  }
}

// Re-export the dynamic version as the main function
export { submitDynamicPatternFeedback as submitPatternFeedback }; 