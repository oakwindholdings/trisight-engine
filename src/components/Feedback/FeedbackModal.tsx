// src/components/Feedback/FeedbackModal.tsx
// Modal to submit pattern feedback
// Allows boundary adjustments
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Pattern, PatternType, GoldmineChannelPattern } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { BoundaryAdjuster } from './BoundaryAdjuster';
import { GoldmineChannelAdjuster } from './GoldmineChannelAdjuster';

// Legacy types for backward compatibility
type FalsePositiveReason = 'NOT_A_PATTERN' | 'WRONG_PATTERN_TYPE' | 'BOUNDARY_ISSUE' | 'OTHER';

// Legacy feedback interface
interface LegacyPatternFeedback extends Omit<PatternFeedback, 'patternType'> {
  submittedAt: Date;
  originalPatternType: PatternType;
  correctedPatternType?: PatternType;
  falsePositive?: boolean;
  falsePositiveReason?: FalsePositiveReason;
  boundaryAdjustment?: any;
  channelAdjustment?: any;
}

// Define component props types inline to avoid import issues
interface PatternTypeSelectorProps {
  selectedType: PatternType;
  originalType: PatternType;
  onSelect: (type: PatternType) => void;
}

interface ConfidenceRatingProps {
  value: number;
  onChange: (value: number) => void;
}

interface BoundaryAdjusterProps {
  originalStart: Date;
  originalEnd: Date;
  onChange: (start: Date | null, end: Date | null) => void;
}

// Import components using require and cast to React components with the appropriate prop types
// Import the implementation files with their Impl suffix and rename to the expected component names
// @ts-ignore - Ignore TypeScript module resolution errors
const PatternTypeSelector = require('./PatternTypeSelector').default as React.FC<PatternTypeSelectorProps>;
// @ts-ignore - Ignore TypeScript module resolution errors
const ConfidenceRating = require('./ConfidenceRating').default as React.FC<ConfidenceRatingProps>;
// @ts-ignore - Ignore TypeScript module resolution errors
// Use the renamed component to avoid identifier conflicts
const LocalBoundaryAdjuster = BoundaryAdjuster as React.FC<BoundaryAdjusterProps>;

interface FeedbackModalProps {
  pattern: Pattern | null;
  onClose: () => void;
  onSubmit: (feedback: PatternFeedback) => Promise<void>;
  userId: string;
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  color: #212121;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 20px;
  color: #757575;
  
  &:hover {
    color: #212121;
  }
`;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #424242;
`;

const FalsePositiveToggle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: inherit;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ReasonSelect = styled.select`
  margin-left: 16px;
  padding: 4px 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  background-color: ${props => props.$primary ? '#1976d2' : '#e0e0e0'};
  color: ${props => props.$primary ? 'white' : '#212121'};
  
  &:hover {
    background-color: ${props => props.$primary ? '#1565c0' : '#d5d5d5'};
  }
  
  &:disabled {
    background-color: #e0e0e0;
    color: #9e9e9e;
    cursor: not-allowed;
  }
`;

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  pattern,
  onClose,
  onSubmit,
  userId
}) => {
  const [correctedPatternType, setCorrectedPatternType] = useState<PatternType | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<number>(3);
  const [boundaryAdjustment, setBoundaryAdjustment] = useState<{
    correctedStart: Date | null;
    correctedEnd: Date | null;
  }>({
    correctedStart: null,
    correctedEnd: null
  });
  const [channelAdjustment, setChannelAdjustment] = useState({ upper: null as number | null, lower: null as number | null });
  const [falsePositive, setFalsePositive] = useState<boolean>(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState<FalsePositiveReason>('NOT_A_PATTERN');
  const [notes, setNotes] = useState<string>('');
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Add local undo stack:
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  // On change, push to history.
  // Add undo button that pops from history.

  // Reset form when pattern changes
  useEffect(() => {
    if (pattern) {
      setCorrectedPatternType(null);
      setConfidenceRating(3);
      setBoundaryAdjustment({
        correctedStart: null,
        correctedEnd: null
      });
      setChannelAdjustment({ upper: null, lower: null });
      setFalsePositive(false);
      setFalsePositiveReason('NOT_A_PATTERN');
      setNotes('');
      setIsPreviewMode(false);
    }
  }, [pattern]);
  
  if (!pattern) return null;
  
  const handlePatternTypeChange = (type: PatternType) => {
    setCorrectedPatternType(type === pattern.type ? null : type);
  };
  
  const handleBoundaryChange = (start: Date | null, end: Date | null) => {
    setBoundaryAdjustment({
      correctedStart: start,
      correctedEnd: end
    });
  };
  
  const handleFalsePositiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFalsePositive(e.target.checked);
    if (!e.target.checked) {
      setFalsePositiveReason('NOT_A_PATTERN');
    }
  };
  
  const handleChannelAdjustment = (upper: number, lower: number) => {
    setChannelAdjustment({
      upper,
      lower
    });
  };
  
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };
  
  const handleSubmit = async () => {
    if (!pattern) return;
    
    setIsSubmitting(true);
    
    const feedback: PatternFeedback = {
      patternId: pattern.id,
      originalPatternType: pattern.type,
      correctedPatternType,
      confidenceRating,
      boundaryAdjustment: {
        originalStart: pattern.startTime,
        originalEnd: pattern.endTime,
        correctedStart: boundaryAdjustment.correctedStart,
        correctedEnd: boundaryAdjustment.correctedEnd
      },
      // Include channel adjustment data for Goldmine Channel patterns
      ...(isGoldmineChannel && {
        channelAdjustment: {
          originalUpperBoundary: (pattern as GoldmineChannelPattern).upperBoundary,
          originalLowerBoundary: (pattern as GoldmineChannelPattern).lowerBoundary,
          correctedUpperBoundary: channelAdjustment.upper,
          correctedLowerBoundary: channelAdjustment.lower
        }
      }),
      falsePositive,
      // Include reason if marked as false positive
      ...(falsePositive && { falsePositiveReason }),
      notes,
      submittedAt: new Date(),
      userId
    };
    
    try {
      await onSubmit(feedback);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Determine if this is a Goldmine Channel pattern
  const isGoldmineChannel = pattern.type === PatternType.GOLDMINE_CHANNEL || 
    correctedPatternType === PatternType.GOLDMINE_CHANNEL;
  
  // Validation
  const isValid = (falsePositive ? !!falsePositiveReason : true) || confidenceRating > 0; // Per spec: confidence OR false positive
  
  if (isPreviewMode) {
    return (
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Feedback Preview</ModalTitle>
            <CloseButton onClick={togglePreviewMode}>×</CloseButton>
          </ModalHeader>
          
          <pre style={{ 
            backgroundColor: '#f5f5f5', 
            padding: 16, 
            borderRadius: 4,
            overflow: 'auto' 
          }}>
            {JSON.stringify({
              patternId: pattern.id,
              originalPatternType: pattern.type,
              correctedPatternType,
              confidenceRating,
              // Include standard boundary adjustment for time boundaries
              boundaryAdjustment: {
                originalStart: pattern.startTime,
                originalEnd: pattern.endTime,
                correctedStart: boundaryAdjustment.correctedStart,
                correctedEnd: boundaryAdjustment.correctedEnd
              },
              // Include channel adjustments when applicable
              ...(isGoldmineChannel && {
                channelAdjustment: {
                  originalUpperBoundary: (pattern as GoldmineChannelPattern).upperBoundary,
                  originalLowerBoundary: (pattern as GoldmineChannelPattern).lowerBoundary,
                  correctedUpperBoundary: channelAdjustment.upper,
                  correctedLowerBoundary: channelAdjustment.lower
                }
              }),
              falsePositive,
              ...(falsePositive && { falsePositiveReason }),
              notes,
              submittedAt: new Date(),
              userId
            }, null, 2)}
          </pre>
          
          <ButtonGroup>
            <Button onClick={togglePreviewMode}>Back to Edit</Button>
            <Button 
              $primary 
              onClick={(e) => {
                e.stopPropagation();
                handleSubmit();
              }}
              onMouseDown={(e) => e.stopPropagation()}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </ButtonGroup>
        </ModalContent>
      </ModalOverlay>
    );
  }
  
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Pattern Feedback</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <FormSection>
          <SectionTitle>Pattern Type</SectionTitle>
          <PatternTypeSelector 
            selectedType={correctedPatternType || pattern.type}
            originalType={pattern.type}
            onSelect={handlePatternTypeChange}
          />
        </FormSection>
        
        <FormSection>
          <SectionTitle>Confidence Rating</SectionTitle>
          <ConfidenceRating 
            value={confidenceRating}
            onChange={setConfidenceRating}
          />
        </FormSection>
        
        <FormSection>
          <SectionTitle>Time Boundaries</SectionTitle>
          <LocalBoundaryAdjuster 
            originalStart={pattern.startTime}
            originalEnd={pattern.endTime}
            onChange={handleBoundaryChange}
          />
        </FormSection>
        
        {pattern.type === 'GOLDMINE_CHANNEL' && (
          <FormSection>
            <SectionTitle>Channel Adjustment</SectionTitle>
            <GoldmineChannelAdjuster 
              originalUpper={pattern.upperBoundary || 0}
              originalLower={pattern.lowerBoundary || 0}
              onChange={(upper, lower) => setChannelAdjustment({ upper, lower })}
            />
          </FormSection>
        )}
        
        <FormSection>
          <FalsePositiveToggle>
            <Checkbox 
              type="checkbox" 
              id="falsePositive"
              checked={falsePositive}
              onChange={handleFalsePositiveChange}
            />
            <label htmlFor="falsePositive">This is a false positive</label>
            
            {falsePositive && (
              <ReasonSelect
                value={falsePositiveReason}
                onChange={(e) => setFalsePositiveReason(e.target.value as FalsePositiveReason)}
              >
                <option value="">Select a reason...</option>
                <option value="NOT_A_PATTERN">Not a pattern</option>
                <option value="INSIGNIFICANT_MOVEMENT">Insignificant movement</option>
                <option value="MARKET_NOISE">Market noise</option>
                <option value="EXTERNAL_EVENT">External event impact</option>
                <option value="OTHER">Other</option>
              </ReasonSelect>
            )}
          </FalsePositiveToggle>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Additional Notes</SectionTitle>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional observations or comments..."
          />
        </FormSection>
        
        <ButtonGroup>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={togglePreviewMode}>Preview</Button>
          <Button 
            $primary 
            onClick={(e) => {
              e.stopPropagation();
              handleSubmit();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};
