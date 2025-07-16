// src/components/Feedback/PatternAnalysisModal.tsx
// Modal for pattern analysis and feedback
// Provides UI for pattern quality assessment

import React, { useState, useEffect } from 'react';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { 
  PatternFeedback, 
  FeedbackAccuracy, 
  TimingAssessment, 
  InvalidityReason,
  createDefaultFeedback
} from '../../models/FeedbackTypes';
import { usePrivacyConsent } from '../../hooks/usePrivacyConsent';
import { logDebug } from '../../utils/debug';
import './PatternAnalysisModal.css';

interface PatternAnalysisModalProps {
  pattern: Pattern | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: Partial<PatternFeedback>) => Promise<void>;
}

const accuracyLabels: Record<FeedbackAccuracy, string> = {
  [FeedbackAccuracy.VERY_INACCURATE]: 'Very Inaccurate',
  [FeedbackAccuracy.INACCURATE]: 'Inaccurate',
  [FeedbackAccuracy.NEUTRAL]: 'Neutral',
  [FeedbackAccuracy.ACCURATE]: 'Accurate',
  [FeedbackAccuracy.VERY_ACCURATE]: 'Very Accurate'
};

const timingLabels: Record<TimingAssessment, string> = {
  [TimingAssessment.TOO_EARLY]: 'Too Early',
  [TimingAssessment.SLIGHTLY_EARLY]: 'Slightly Early',
  [TimingAssessment.PERFECT]: 'Perfect Timing',
  [TimingAssessment.SLIGHTLY_LATE]: 'Slightly Late',
  [TimingAssessment.TOO_LATE]: 'Too Late'
};

const invalidityReasonLabels: Record<InvalidityReason, string> = {
  [InvalidityReason.FALSE_POSITIVE]: 'False Positive - No Pattern Exists',
  [InvalidityReason.WRONG_PATTERN_TYPE]: 'Wrong Pattern Type Detected',
  [InvalidityReason.POOR_BOUNDARIES]: 'Poor Boundary Detection',
  [InvalidityReason.MISSING_CONFIRMATION]: 'Missing Market Confirmation',
  [InvalidityReason.MARKET_CONTEXT]: 'Ignores Market Context',
  [InvalidityReason.OTHER]: 'Other Reason'
};

export const PatternAnalysisModal: React.FC<PatternAnalysisModalProps> = ({
  pattern,
  isOpen,
  onClose,
  onSubmit
}) => {
  const { hasConsent, requestConsent } = usePrivacyConsent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state
  const [accuracy, setAccuracy] = useState<FeedbackAccuracy>(FeedbackAccuracy.NEUTRAL);
  const [confidence, setConfidence] = useState<number>(50);
  const [timing, setTiming] = useState<TimingAssessment>(TimingAssessment.PERFECT);
  const [isValid, setIsValid] = useState<boolean>(true);
  const [invalidityReason, setInvalidityReason] = useState<InvalidityReason | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  
  // Reset form when pattern changes
  useEffect(() => {
    if (pattern) {
      const defaults = createDefaultFeedback(pattern.id, pattern.type);
      setAccuracy(defaults.accuracy || FeedbackAccuracy.NEUTRAL);
      setConfidence(defaults.confidence || 50);
      setTiming(defaults.timing || TimingAssessment.PERFECT);
      setIsValid(defaults.isValid !== false);
      setInvalidityReason(undefined);
      setNotes('');
      setError(null);
      setShowSuccess(false);
    }
  }, [pattern]);
  
  // Handle ESC key - Move this before the early return
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('[PatternAnalysisModal] Key pressed:', e.key, { isOpen, isSubmitting });
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        logDebug('feedback', 'PatternAnalysisModal: ESC key pressed');
        console.log('[PatternAnalysisModal] ESC key detected - calling onClose directly');
        e.preventDefault(); // Prevent default browser behavior
        e.stopPropagation(); // Stop event propagation
        onClose(); // Call onClose directly instead of handleClose
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      console.log('[PatternAnalysisModal] Added ESC key listener');
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      console.log('[PatternAnalysisModal] Removed ESC key listener');
    };
  }, [isOpen, isSubmitting, onClose]);
  
  if (!isOpen || !pattern) return null;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logDebug('feedback', 'PatternAnalysisModal: Submit clicked');
    
    // Check privacy consent
    if (!hasConsent) {
      logDebug('feedback', 'PatternAnalysisModal: No consent, requesting...');
      const granted = await requestConsent();
      if (!granted) {
        setError('Privacy consent is required to submit feedback.');
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Prepare feedback data
      const feedback: Partial<PatternFeedback> = {
        patternId: pattern.id,
        patternType: pattern.type,
        accuracy,
        confidence,
        timing,
        isValid,
        invalidityReason: isValid ? undefined : invalidityReason,
        notes: notes.trim() || undefined,
        sessionId: localStorage.getItem('sessionId') || 'anonymous',
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        consentGiven: true,
        consentTimestamp: new Date(),
        dataRetentionDays: 90
      };
      
      logDebug('feedback', 'Submitting pattern feedback:', {
        patternId: pattern.id,
        patternType: pattern.type,
        accuracy,
        confidence,
        timing,
        isValid
      });
      
      await onSubmit(feedback);
      
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      logDebug('feedback', 'Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    console.log('[PatternAnalysisModal] handleClose called', { isSubmitting, hasOnClose: !!onClose });
    if (!isSubmitting) {
      logDebug('feedback', 'PatternAnalysisModal: Closing modal');
      console.log('[PatternAnalysisModal] Calling onClose()');
      onClose();
    }
  };
  
  return (
    <div className="pattern-analysis-modal-overlay" onClick={(e) => {
      console.log('[PatternAnalysisModal] Overlay clicked - calling handleClose');
      logDebug('feedback', 'PatternAnalysisModal: Overlay clicked');
      handleClose();
    }}>
      <div 
        className="pattern-analysis-modal" 
        onClick={(e) => {
          console.log('[PatternAnalysisModal] Modal content clicked - stopping propagation');
          logDebug('feedback', 'PatternAnalysisModal: Modal clicked, stopping propagation');
          e.stopPropagation();
        }}
        tabIndex={-1} // Make the modal focusable
        role="dialog" // Accessibility
        aria-modal="true" // Accessibility
      >
        <div className="modal-header">
          <h2 style={{ color: 'red' }}>Pattern Analysis Feedback (UPDATED)</h2>
          <button style={{ marginRight: '10px' }} onClick={() => alert('Test!')}>TEST</button>
          <button 
            className="close-button" 
            onClick={() => {
              alert('Close button clicked!');
              console.log('[PatternAnalysisModal] Close X button clicked');
              onClose();
            }}
            disabled={isSubmitting}
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="pattern-info">
            <div className="pattern-type">
              {pattern.type.replace(/_/g, ' ')} Pattern
            </div>
            <div className="pattern-details">
              <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
              <span>Time: {pattern.startTime.toLocaleString()}</span>
            </div>
          </div>
          
          {showSuccess ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <p>Thank you for your feedback!</p>
              <p className="success-note">Your input helps improve pattern detection accuracy.</p>
            </div>
          ) : (
            <form onSubmit={(e) => {
              console.log('[PatternAnalysisModal] Form submitted');
              handleSubmit(e);
            }} onClick={(e) => {
            logDebug('feedback', 'Form clicked', { target: (e.target as any).tagName });
          }}>
              {/* Accuracy Rating */}
              <div className="form-group">
                <label>How accurate is this pattern detection?</label>
                <div className="accuracy-slider">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={accuracy}
                    onChange={(e) => setAccuracy(parseInt(e.target.value) as FeedbackAccuracy)}
                    disabled={isSubmitting}
                  />
                  <div className="accuracy-labels">
                    {Object.entries(accuracyLabels).map(([value, label]) => (
                      <span 
                        key={value} 
                        className={parseInt(value) === accuracy ? 'active' : ''}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Confidence Level */}
              <div className="form-group">
                <label>Your confidence in this assessment: {confidence}%</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={confidence}
                  onChange={(e) => setConfidence(parseInt(e.target.value))}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Timing Assessment */}
              <div className="form-group">
                <label>Pattern timing assessment:</label>
                <div className="radio-group">
                  {Object.entries(timingLabels).map(([value, label]) => (
                    <label key={value} className="radio-label">
                      <input
                        type="radio"
                        name="timing"
                        value={value}
                        checked={timing === value}
                        onChange={(e) => setTiming(e.target.value as TimingAssessment)}
                        disabled={isSubmitting}
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Validity Check */}
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isValid}
                    onChange={(e) => {
                      setIsValid(e.target.checked);
                      if (e.target.checked) {
                        setInvalidityReason(undefined);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <span>This is a valid pattern detection</span>
                </label>
              </div>
              
              {/* Invalidity Reason */}
              {!isValid && (
                <div className="form-group">
                  <label>Why is this pattern invalid?</label>
                  <select
                    value={invalidityReason || ''}
                    onChange={(e) => setInvalidityReason(e.target.value as InvalidityReason)}
                    disabled={isSubmitting}
                    required={!isValid}
                  >
                    <option value="">Select a reason...</option>
                    {Object.entries(invalidityReasonLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Optional Notes */}
              <div className="form-group">
                <label>Additional notes (optional):</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional observations or suggestions..."
                  maxLength={1000}
                  rows={3}
                  disabled={isSubmitting}
                />
                <div className="char-count">{notes.length}/1000</div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="error-message">{error}</div>
              )}
              
              {/* Privacy Notice */}
              <div className="privacy-notice">
                <p>
                  Your feedback is anonymous and will be used to improve pattern detection accuracy.
                  Data is retained for 90 days. By submitting, you agree to our data processing policy.
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[PatternAnalysisModal] Cancel button clicked - calling handleClose');
                    logDebug('feedback', 'PatternAnalysisModal: Cancel button clicked');
                    handleClose();
                  }}
                  disabled={isSubmitting}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-button"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}; 