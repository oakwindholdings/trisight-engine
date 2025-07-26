// src/components/Feedback/DynamicPatternAnalysisModal.tsx
// Dynamic modal for pattern analysis and feedback
// Renders UI controls based on JSON configuration

import React, { useState, useEffect } from 'react';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { usePrivacyConsent } from '../../hooks/usePrivacyConsent';
// import { logDebug } from '../../utils/debug';
import { submitPatternFeedback } from '../../utils/supabase/dynamicPatternFeedbackService';
import { getModalConfig, interpolateTemplate, ModalConfig, FeedbackControl } from '../../config/feedbackModalConfig';
import './PatternAnalysisModal.css';

interface DynamicPatternAnalysisModalProps {
  pattern: Pattern | null;
  patternMetadata?: Record<string, any>; // Additional metadata from feed
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (feedback: Partial<PatternFeedback>) => Promise<void>;
}

// Dynamic control renderers
const renderControl = (
  control: FeedbackControl,
  value: any,
  onChange: (value: any) => void,
  isSubmitting: boolean
) => {
  switch (control.type) {
    case 'confidence-slider':
      return (
        <div className="form-group" key={control.field}>
          <label>{control.label}: {value}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            disabled={isSubmitting}
          />
        </div>
      );

    case 'thumbs':
      return (
        <div className="form-group" key={control.field}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              disabled={isSubmitting}
            />
            <span>{control.label}</span>
          </label>
        </div>
      );

    case 'timing-scale':
      return (
        <div className="form-group" key={control.field}>
          <label>{control.label}</label>
          <div className="radio-group">
            {['EARLY', 'ON_TIME', 'LATE', 'MISSED'].map((option) => (
              <label key={option} className="radio-label">
                <input
                  type="radio"
                  name={control.field}
                  value={option}
                  checked={value === option}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isSubmitting}
                />
                <span>{option.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'multiselect':
      return (
        <div className="form-group" key={control.field}>
          <label>{control.label}</label>
          <div className="checkbox-group">
            {control.options?.map((option) => (
              <label key={option} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      onChange([...currentValues, option]);
                    } else {
                      onChange(currentValues.filter((v) => v !== option));
                    }
                  }}
                  disabled={isSubmitting}
                />
                <span>{option.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="form-group" key={control.field}>
          <label>{control.label}</label>
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Enter your feedback..."
            rows={3}
            disabled={isSubmitting}
          />
        </div>
      );

    default:
      return null;
  }
};

export const DynamicPatternAnalysisModal: React.FC<DynamicPatternAnalysisModalProps> = ({
  pattern,
  patternMetadata = {},
  isOpen,
  onClose,
  onSubmit
}) => {
  const { hasConsent, requestConsent } = usePrivacyConsent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Form state - dynamic based on pattern type
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [modalConfig, setModalConfig] = useState<ModalConfig | null>(null);
  
  // Draggable state - disabled for centered modal
  // const [position, setPosition] = useState({ x: 0, y: 0 });
  // const [isDragging, setIsDragging] = useState(false);
  // const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Get pattern type from either pattern or metadata
  const patternType = pattern?.type || patternMetadata?.patternType || patternMetadata?.type;
  
  // Reset form when pattern changes
  useEffect(() => {
    if (patternType) {
      const config = getModalConfig(patternType);
      setModalConfig(config);
      
      // Initialize form values
      const initialValues: Record<string, any> = {};
      config?.feedbackControls.forEach((control) => {
        switch (control.type) {
          case 'confidence-slider':
            initialValues[control.field] = 50;
            break;
          case 'thumbs':
            initialValues[control.field] = false;
            break;
          case 'timing-scale':
            initialValues[control.field] = 'ON_TIME';
            break;
          case 'multiselect':
            initialValues[control.field] = [];
            break;
          case 'text':
            initialValues[control.field] = '';
            break;
        }
      });
      
      setFormValues(initialValues);
      setError(null);
      setShowSuccess(false);
      // setPosition({ x: 0, y: 0 }); // Disabled for centered modal
    }
  }, [patternType]);
  
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, isSubmitting, onClose]);
  
  // Dragging handlers - disabled for centered modal
  // const handleMouseMove = useCallback((e: MouseEvent) => {
  //   if (!isDragging) return;
  //   setPosition({
  //     x: e.clientX - dragStart.x,
  //     y: e.clientY - dragStart.y
  //   });
  // }, [isDragging, dragStart]);

  // const handleMouseUp = useCallback(() => {
  //   setIsDragging(false);
  // }, []);

  // useEffect(() => {
  //   if (isDragging) {
  //     document.addEventListener('mousemove', handleMouseMove);
  //     document.addEventListener('mouseup', handleMouseUp);
  //     return () => {
  //       document.removeEventListener('mousemove', handleMouseMove);
  //       document.removeEventListener('mouseup', handleMouseUp);
  //     };
  //   }
  // }, [isDragging, handleMouseMove, handleMouseUp]);
  
  if (!isOpen || !modalConfig) return null;
  
  // const handleMouseDown = (e: React.MouseEvent) => {
  //   setIsDragging(true);
  //   setDragStart({
  //     x: e.clientX - position.x,
  //     y: e.clientY - position.y
  //   });
  // };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check privacy consent
    if (!hasConsent) {
      const granted = await requestConsent();
      if (!granted) {
        setError('Privacy consent is required to submit feedback.');
        return;
      }
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get session ID
      const sessionId = localStorage.getItem('sessionId') || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!localStorage.getItem('sessionId')) {
        localStorage.setItem('sessionId', sessionId);
      }
      
      // Get user ID if available (from Supabase auth)
      const userId = null; // TODO: Get from Supabase auth context if implemented
      
      // Combine pattern data and metadata
      const patternData = {
        ...(pattern || {}),
        ...patternMetadata
      };
      
      // Generate notes using template
      const templateValues = {
        ...patternData,
        ...formValues
      };
      const notes = interpolateTemplate(modalConfig.notesMergeTemplate, templateValues);
      
             // Prepare Supabase payload
      const feedbackPayload = {
        pattern_id: pattern?.id || patternMetadata?.id || `synthetic_${Date.now()}`,
        pattern_type: patternType,
        symbol: (pattern as any)?.symbol || patternMetadata?.symbol || 'UNKNOWN',
        pattern_start_time: pattern?.startTime || ((patternData as any).startTime ? new Date((patternData as any).startTime) : new Date()),
        pattern_end_time: pattern?.endTime || ((patternData as any).endTime ? new Date((patternData as any).endTime) : new Date()),
        user_id: userId,
        session_id: sessionId,
        notes,
        pattern_metadata: patternData,
        ui_metadata: { modalConfig: modalConfig.displayName },
        consent_given: true,
        consent_timestamp: new Date(),
        ...formValues // Spread all form values directly
      };
      
      console.log('[DynamicPatternAnalysisModal] Submitting feedback:', feedbackPayload);
      
      // Submit to Supabase
      await submitPatternFeedback(feedbackPayload as any);
      
      // Call optional onSubmit for local processing
      if (onSubmit) {
        await onSubmit({
          patternId: feedbackPayload.pattern_id,
          patternType: patternType as PatternType,
          notes: feedbackPayload.notes,
          sessionId: feedbackPayload.session_id
        });
      }
      
      setShowSuccess(true);
      
      // Close after showing success
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('[DynamicPatternAnalysisModal] Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div 
      className="pattern-analysis-modal-overlay" 
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="pattern-analysis-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            backgroundColor: modalConfig.color + '20',
            borderBottom: `2px solid ${modalConfig.color}`
          }}
        >
          <h2>{modalConfig.displayName}</h2>
          <button 
            className="close-button" 
            onClick={onClose}
            disabled={isSubmitting}
            type="button"
          >
            ×
          </button>
        </div>
        
        <div className="modal-body">
          <div className="pattern-info" style={{ borderLeft: `4px solid ${modalConfig.color}` }}>
            <div className="pattern-type">
              {modalConfig.displayName}
            </div>
            <div className="pattern-details">
              {pattern?.confidence && (
                <span>Confidence: {Math.round(pattern.confidence * 100)}%</span>
              )}
                             <span>{(pattern as any)?.symbol || patternMetadata?.symbol || 'UNKNOWN'}</span>
            </div>
          </div>
          
          {showSuccess ? (
            <div className="success-message">
              <div className="success-content">
                <div className="success-icon" style={{ color: modalConfig.color }}>✓</div>
                <h2 className="success-title">FEEDBACK SAVED</h2>
                <p className="success-note">Thank you for improving {modalConfig.displayName} detection!</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Render dynamic controls */}
              {modalConfig.feedbackControls.map((control) => 
                renderControl(
                  control,
                  formValues[control.field],
                  (value) => setFormValues({ ...formValues, [control.field]: value }),
                  isSubmitting
                )
              )}
              
              {/* Error Message */}
              {error && (
                <div className="error-message">{error}</div>
              )}
              
              {/* Privacy Notice */}
              <div className="privacy-notice">
                <p>
                  Your feedback helps improve pattern detection accuracy.
                  Data is retained for 90 days. By submitting, you agree to our data processing policy.
                </p>
              </div>
              
              {/* Submit Button */}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="submit-button"
                  style={{
                    backgroundColor: isSubmitting ? '#ccc' : modalConfig.color
                  }}
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