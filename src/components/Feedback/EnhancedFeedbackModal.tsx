// src/components/Feedback/EnhancedFeedbackModal.tsx
// Advanced feedback modal
// Shows history and rating
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { PatternFeedback, FalsePositiveReason } from '../../models/FeedbackTypes';
import { EnhancedPatternFeedback, PatternFeedbackHistory } from '../../models/LearningTypes';
import { useLearningContext } from '../../contexts/LearningContext';
import PatternTypeSelectorComponent from './PatternTypeSelector';
import ConfidenceRatingComponent from './ConfidenceRating';
import { BoundaryAdjusterImpl } from './';

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

// Type the components with the correct interfaces

// Type the imports for use in the component
const PatternTypeSelector = PatternTypeSelectorComponent as React.FC<PatternTypeSelectorProps>;
const ConfidenceRating = ConfidenceRatingComponent as React.FC<ConfidenceRatingProps>;
const BoundaryAdjuster = BoundaryAdjusterImpl as React.FC<BoundaryAdjusterProps>;

interface EnhancedFeedbackModalProps {
  pattern: Pattern | null;
  feedbackHistory?: PatternFeedbackHistory;
  onClose: () => void;
  onSubmit: (feedback: PatternFeedback) => Promise<void>;
  userId: string;
}

// Styled components (reusing styles from FeedbackModal)
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
  width: 700px; // Slightly wider to accommodate more detailed feedback
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

const SectionDescription = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #757575;
`;

const InputGroup = styled.div`
  margin-bottom: 16px;
`;

const InputLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #424242;
`;

const TextInput = styled.input`
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
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

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  
  &:focus {
    outline: none;
    border-color: #2196f3;
  }
`;

const FalsePositiveToggle = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Checkbox = styled.input`
  margin-right: 8px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
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

const FeedbackHistorySection = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const BeforeAfterComparison = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 12px;
`;

const ComparisonColumn = styled.div`
  flex: 1;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
`;

const ComparisonTitle = styled.div`
  font-weight: 500;
  margin-bottom: 8px;
  font-size: 14px;
  color: #616161;
`;

const ComparisonValue = styled.div`
  font-family: monospace;
  font-size: 13px;
`;

const EnhancedFeedbackModal: React.FC<EnhancedFeedbackModalProps> = ({
  pattern,
  feedbackHistory,
  onClose,
  onSubmit,
  userId
}) => {
  // Learning context for processing feedback
  const { processFeedback, isLearningEnabled } = useLearningContext();

  // Basic feedback state
  const [correctedPatternType, setCorrectedPatternType] = useState<PatternType | null>(null);
  const [confidenceRating, setConfidenceRating] = useState<number>(3);
  const [boundaryAdjustment, setBoundaryAdjustment] = useState<{
    correctedStart: Date | null;
    correctedEnd: Date | null;
  }>({
    correctedStart: null,
    correctedEnd: null
  });
  const [falsePositive, setFalsePositive] = useState<boolean>(false);
  const [falsePositiveReason, setFalsePositiveReason] = useState<FalsePositiveReason | ''>('');
  const [notes, setNotes] = useState<string>('');

  // Enhanced feedback state
  const [confidenceRationale, setConfidenceRationale] = useState<string>('');
  const [boundaryAdjustmentRationale, setBoundaryAdjustmentRationale] = useState<string>('');
  const [patternCorrectionRationale, setPatternCorrectionRationale] = useState<string>('');
  const [marketCondition, setMarketCondition] = useState<string>('NORMAL');
  const [volatilityLevel, setVolatilityLevel] = useState<number>(3);
  const [beforeAfterView, setBeforeAfterView] = useState<boolean>(false);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  
  // Reset form when pattern changes
  useEffect(() => {
    if (pattern) {
      setCorrectedPatternType(null);
      setConfidenceRating(3);
      setBoundaryAdjustment({
        correctedStart: null,
        correctedEnd: null
      });
      setFalsePositive(false);
      setFalsePositiveReason('');
      setNotes('');
      setPreviewMode(false);
      
      // Reset enhanced fields
      setConfidenceRationale('');
      setBoundaryAdjustmentRationale('');
      setPatternCorrectionRationale('');
      setMarketCondition('NORMAL');
      setVolatilityLevel(3);
      setBeforeAfterView(false);
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
    
    // Show before-after view when boundaries are changed
    if (start !== null || end !== null) {
      setBeforeAfterView(true);
    }
  };
  
  const handleFalsePositiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFalsePositive(e.target.checked);
    if (!e.target.checked) {
      setFalsePositiveReason('');
    }
  };
  
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };
  
  const toggleBeforeAfterView = () => {
    setBeforeAfterView(!beforeAfterView);
  };
  
  const handleSubmit = async () => {
    if (!pattern) return;
    
    setIsSubmitting(true);
    
    // Create basic feedback
    const baseFeedback: PatternFeedback = {
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
      falsePositive,
      notes,
      submittedAt: new Date(),
      userId
    };
    
    // Create enhanced feedback with additional context for learning
    const enhancedFeedback: EnhancedPatternFeedback = {
      ...baseFeedback,
      confidenceRationale,
      falsePositiveReason: falsePositive ? (falsePositiveReason === '' ? undefined : falsePositiveReason) : undefined,
      correctionRationale: correctedPatternType ? patternCorrectionRationale : undefined,
      boundaryAdjustment: {
        ...baseFeedback.boundaryAdjustment,
        adjustmentReason: boundaryAdjustmentRationale
      },
      contextData: {
        marketCondition,
        volatilityLevel,
        tradingVolume: 0, // Would be calculated from actual data
        timeframe: '5min' // Default timeframe
      }
    };
    
    try {
      // Submit feedback to parent component
      await onSubmit(baseFeedback);
      
      // Process enhanced feedback through learning system if enabled
      if (isLearningEnabled) {
        await processFeedback(baseFeedback);
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Validation
  const isValid = falsePositive 
    ? !!falsePositiveReason 
    : (correctedPatternType ? !!patternCorrectionRationale : true);
  
  // Preview mode UI
  if (previewMode) {
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
              confidenceRationale,
              boundaryAdjustment: {
                originalStart: pattern.startTime,
                originalEnd: pattern.endTime,
                correctedStart: boundaryAdjustment.correctedStart,
                correctedEnd: boundaryAdjustment.correctedEnd,
                adjustmentReason: boundaryAdjustmentRationale
              },
              falsePositive,
              falsePositiveReason: falsePositive ? falsePositiveReason : undefined,
              patternCorrectionRationale: correctedPatternType ? patternCorrectionRationale : undefined,
              contextData: {
                marketCondition,
                volatilityLevel,
                tradingVolume: "calculated from data",
                timeframe: "5min"
              },
              notes,
              submittedAt: new Date(),
              userId
            }, null, 2)}
          </pre>
          
          <ButtonGroup>
            <Button onClick={togglePreviewMode}>Back to Edit</Button>
            <Button 
              $primary 
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
            </Button>
          </ButtonGroup>
        </ModalContent>
      </ModalOverlay>
    );
  }
  
  // Main form UI
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Pattern Feedback</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <FormSection>
          <SectionTitle>Pattern Type</SectionTitle>
          <SectionDescription>
            Is this the correct pattern type? If not, select the correct type.
          </SectionDescription>
          <PatternTypeSelector 
            selectedType={correctedPatternType || pattern.type}
            originalType={pattern.type}
            onSelect={handlePatternTypeChange}
          />
          
          {correctedPatternType && (
            <InputGroup>
              <InputLabel>Why did you change the pattern type?</InputLabel>
              <TextArea
                value={patternCorrectionRationale}
                onChange={(e) => setPatternCorrectionRationale(e.target.value)}
                placeholder="Explain why this is a different pattern type..."
              />
            </InputGroup>
          )}
        </FormSection>
        
        <FormSection>
          <SectionTitle>Confidence Rating</SectionTitle>
          <SectionDescription>
            How confident are you that this is a valid pattern?
          </SectionDescription>
          <ConfidenceRating 
            value={confidenceRating}
            onChange={setConfidenceRating}
          />
          
          <InputGroup>
            <InputLabel>Confidence Rationale</InputLabel>
            <TextArea
              value={confidenceRationale}
              onChange={(e) => setConfidenceRationale(e.target.value)}
              placeholder="Explain your confidence level..."
            />
          </InputGroup>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Pattern Boundaries</SectionTitle>
          <SectionDescription>
            Are the start and end times correct? Adjust if necessary.
          </SectionDescription>
          <BoundaryAdjuster 
            originalStart={pattern.startTime}
            originalEnd={pattern.endTime}
            onChange={handleBoundaryChange}
          />
          
          {(boundaryAdjustment.correctedStart || boundaryAdjustment.correctedEnd) && (
            <>
              <InputGroup>
                <InputLabel>Why did you adjust the boundaries?</InputLabel>
                <TextArea
                  value={boundaryAdjustmentRationale}
                  onChange={(e) => setBoundaryAdjustmentRationale(e.target.value)}
                  placeholder="Explain why you adjusted the pattern boundaries..."
                />
              </InputGroup>
              
              <Button onClick={toggleBeforeAfterView}>
                {beforeAfterView ? 'Hide' : 'Show'} Before/After Comparison
              </Button>
              
              {beforeAfterView && (
                <BeforeAfterComparison>
                  <ComparisonColumn>
                    <ComparisonTitle>Original</ComparisonTitle>
                    <ComparisonValue>
                      Start: {pattern.startTime.toLocaleString()}<br />
                      End: {pattern.endTime.toLocaleString()}<br />
                      Duration: {Math.round((pattern.endTime.getTime() - pattern.startTime.getTime()) / (1000 * 60))} minutes
                    </ComparisonValue>
                  </ComparisonColumn>
                  <ComparisonColumn>
                    <ComparisonTitle>Adjusted</ComparisonTitle>
                    <ComparisonValue>
                      Start: {boundaryAdjustment.correctedStart ? boundaryAdjustment.correctedStart.toLocaleString() : pattern.startTime.toLocaleString()}<br />
                      End: {boundaryAdjustment.correctedEnd ? boundaryAdjustment.correctedEnd.toLocaleString() : pattern.endTime.toLocaleString()}<br />
                      Duration: {Math.round(((boundaryAdjustment.correctedEnd || pattern.endTime).getTime() - 
                                           (boundaryAdjustment.correctedStart || pattern.startTime).getTime()) / (1000 * 60))} minutes
                    </ComparisonValue>
                  </ComparisonColumn>
                </BeforeAfterComparison>
              )}
            </>
          )}
        </FormSection>
        
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
              <Select
                value={falsePositiveReason}
                onChange={(e) => setFalsePositiveReason(e.target.value as FalsePositiveReason)}
                style={{ marginLeft: '16px' }}
              >
                <option value="">Select a reason...</option>
                <option value="NOT_A_PATTERN">Not a pattern</option>
                <option value="INSIGNIFICANT_MOVEMENT">Insignificant movement</option>
                <option value="MARKET_NOISE">Market noise</option>
                <option value="EXTERNAL_EVENT">External event impact</option>
                <option value="OTHER">Other</option>
              </Select>
            )}
          </FalsePositiveToggle>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Market Context</SectionTitle>
          <SectionDescription>
            Provide additional context to help improve pattern detection.
          </SectionDescription>
          
          <InputGroup>
            <InputLabel>Market Condition</InputLabel>
            <Select
              value={marketCondition}
              onChange={(e) => setMarketCondition(e.target.value)}
            >
              <option value="NORMAL">Normal</option>
              <option value="TRENDING_UP">Trending Up</option>
              <option value="TRENDING_DOWN">Trending Down</option>
              <option value="CHOPPY">Choppy/Sideways</option>
              <option value="HIGH_VOLATILITY">High Volatility</option>
              <option value="LOW_VOLATILITY">Low Volatility</option>
            </Select>
          </InputGroup>
          
          <InputGroup>
            <InputLabel>Volatility Level (1-5)</InputLabel>
            <input
              type="range"
              min="1"
              max="5"
              value={volatilityLevel}
              onChange={(e) => setVolatilityLevel(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Low</span>
              <span>Medium</span>
              <span>High</span>
            </div>
          </InputGroup>
        </FormSection>
        
        <FormSection>
          <SectionTitle>Additional Notes</SectionTitle>
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional observations or comments..."
          />
        </FormSection>
        
        {feedbackHistory && feedbackHistory.feedbackEntries.length > 0 && (
          <FeedbackHistorySection>
            <SectionTitle>Previous Feedback</SectionTitle>
            <SectionDescription>
              This pattern has received {feedbackHistory.feedbackEntries.length} feedback entries previously.
            </SectionDescription>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '12px' }}>
              {feedbackHistory.feedbackEntries.slice(0, 3).map((fb, index) => (
                <div key={index} style={{ 
                  padding: '8px', 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '4px',
                  marginBottom: '8px'
                }}>
                  <div><strong>Date:</strong> {fb.submittedAt.toLocaleString()}</div>
                  <div><strong>Confidence:</strong> {fb.confidenceRating}/5</div>
                  {fb.correctedPatternType && (
                    <div><strong>Corrected Type:</strong> {fb.correctedPatternType}</div>
                  )}
                  {fb.falsePositive && (
                    <div><strong>Marked as:</strong> False Positive</div>
                  )}
                </div>
              ))}
              
              {feedbackHistory.feedbackEntries.length > 3 && (
                <div style={{ textAlign: 'center', marginTop: '8px', color: '#757575' }}>
                  {feedbackHistory.feedbackEntries.length - 3} more feedback entries not shown
                </div>
              )}
            </div>
          </FeedbackHistorySection>
        )}
        
        <ButtonGroup>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={togglePreviewMode}>Preview</Button>
          <Button 
            $primary 
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

export default EnhancedFeedbackModal;
