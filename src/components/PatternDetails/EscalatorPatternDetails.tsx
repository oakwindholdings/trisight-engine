import React from 'react';
import styled from 'styled-components';
import { EscalatorPattern, EscalatorSignalStrength, ThrustDirection } from '../../models/PatternTypes';
import { formatPercent, formatDate } from '../../utils/formatters';

interface EscalatorPatternDetailsProps {
  pattern: EscalatorPattern;
  onClose: () => void;
}

const Container = styled.div`
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 16px;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: #757575;
  
  &:hover {
    color: #212121;
  }
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f5f5f5;
`;

const Label = styled.span`
  font-size: 14px;
  color: #616161;
`;

const Value = styled.span<{ positive?: boolean }>`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.positive === undefined ? '#212121' : 
    props.positive ? '#4CAF50' : '#E91E63'};
`;

const DirectionIndicator = styled.div<{ direction: ThrustDirection }>`
  background-color: ${props => 
    props.direction === ThrustDirection.BULLISH ? '#4CAF50' : '#9C27B0'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
`;

const SignalStrengthIndicator = styled.div<{ strength: EscalatorSignalStrength; direction: ThrustDirection }>`
  background-color: ${props => {
    if (props.direction === ThrustDirection.BULLISH) {
      switch (props.strength) {
        case EscalatorSignalStrength.VERY_STRONG: return '#0A5D36'; // Dark green
        case EscalatorSignalStrength.STRONG: return '#0F8A3C'; // Green
        case EscalatorSignalStrength.MODERATE: return '#4CAF50'; // Light green
        default: return '#8BC34A'; // Pale green
      }
    } else {
      switch (props.strength) {
        case EscalatorSignalStrength.VERY_STRONG: return '#7B1FA2'; // Dark purple
        case EscalatorSignalStrength.STRONG: return '#9C27B0'; // Purple
        case EscalatorSignalStrength.MODERATE: return '#BA68C8'; // Light purple
        default: return '#D1C4E9'; // Pale purple
      }
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 12px 0;
  max-height: 300px;
  overflow-y: auto;
`;

const StepItem = styled.div<{ isConsolidation: boolean; direction: ThrustDirection }>`
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  background-color: ${props => props.isConsolidation 
    ? '#f5f5f5' 
    : props.direction === ThrustDirection.BULLISH 
      ? 'rgba(76, 175, 80, 0.1)' 
      : 'rgba(156, 39, 176, 0.1)'};
  border-left: 4px solid ${props => props.isConsolidation 
    ? '#9e9e9e' 
    : props.direction === ThrustDirection.BULLISH 
      ? '#4CAF50' 
      : '#9C27B0'};
  display: flex;
  justify-content: space-between;
`;

const StepDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const StepTitle = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const StepStat = styled.div`
  font-size: 12px;
  color: #757575;
`;

const ScoresContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 12px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 4px;
`;

const ScoreRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
`;

const ScoreLabel = styled.span`
  font-size: 14px;
  color: #616161;
  width: 120px;
`;

const ScoreBar = styled.div<{ value: number; max: number; direction: ThrustDirection }>`
  height: 16px;
  width: ${props => Math.min(100, Math.max(0, (Math.abs(props.value) / props.max) * 100))}%;
  background-color: ${props => 
    props.direction === ThrustDirection.BULLISH 
      ? (props.value >= 0 ? '#4CAF50' : '#E91E63')
      : (props.value <= 0 ? '#9C27B0' : '#E91E63')};
  border-radius: 2px;
`;

const ScoreValue = styled.span`
  font-size: 14px;
  color: #212121;
  margin-left: 8px;
`;

const RelatedPatterns = styled.div`
  margin-top: 16px;
`;

const RelatedPatternItem = styled.div`
  padding: 8px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #616161;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const RelatedPatternType = styled.span`
  font-weight: 500;
  color: #212121;
`;

const EscalatorPatternDetails: React.FC<EscalatorPatternDetailsProps> = ({ 
  pattern, 
  onClose 
}) => {
  // Format date from the pattern's start time
  const formattedDate = formatDate(new Date(pattern.startTime), true);
  
  // Calculate average price and volume change
  const avgPriceChange = pattern.priceChanges.reduce((sum, val) => sum + val, 0) / pattern.priceChanges.length;
  const avgVolumeChange = pattern.volumeChanges.reduce((sum, val) => sum + val, 0) / pattern.volumeChanges.length;
  
  // Find max step score for scaling bars
  const maxStepScore = Math.max(...pattern.stepScores.map(s => Math.abs(s)), 1);
  
  // Extract non-consolidation steps
  const movementSteps = pattern.steps.filter(step => !step.isConsolidation);
  
  return (
    <Container>
      <Header>
        <Title>Escalator Pattern Details</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      <DetailRow>
        <Label>Date & Time:</Label>
        <Value>{formattedDate}</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Direction:</Label>
        <DirectionIndicator direction={pattern.direction}>
          {pattern.direction}
          {pattern.direction === ThrustDirection.BULLISH ? ' ↗' : ' ↘'}
        </DirectionIndicator>
      </DetailRow>
      
      <DetailRow>
        <Label>Signal Strength:</Label>
        <SignalStrengthIndicator strength={pattern.signalStrength} direction={pattern.direction}>
          {pattern.signalStrength.replace('_', ' ')}
        </SignalStrengthIndicator>
      </DetailRow>
      
      <DetailRow>
        <Label>Overall Score:</Label>
        <Value positive={pattern.direction === ThrustDirection.BULLISH}>
          {pattern.cumulativeScore.toFixed(2)}
        </Value>
      </DetailRow>
      
      {pattern.contextScore !== undefined && (
        <DetailRow>
          <Label>Context Score:</Label>
          <Value positive={pattern.contextScore > pattern.cumulativeScore}>
            {pattern.contextScore.toFixed(2)}
          </Value>
        </DetailRow>
      )}
      
      <DetailRow>
        <Label>Steps:</Label>
        <Value>{movementSteps.length} movement, {pattern.steps.length - movementSteps.length} consolidation</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Average Step Height:</Label>
        <Value>{pattern.averageStepHeight.toFixed(4)}</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Step Consistency:</Label>
        <Value>{(pattern.stepConsistency * 100).toFixed(0)}%</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Average Price Change:</Label>
        <Value positive={avgPriceChange > 0}>{formatPercent(avgPriceChange)}</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Average Volume Change:</Label>
        <Value positive={avgVolumeChange > 0}>{formatPercent(avgVolumeChange)}</Value>
      </DetailRow>
      
      <ScoresContainer>
        <Label style={{ marginBottom: '8px' }}>Step Scores:</Label>
        {pattern.stepScores.map((score, index) => (
          <ScoreRow key={index}>
            <ScoreLabel>
              {pattern.steps[index].isConsolidation ? 'Consolidation' : 'Step'} {index + 1}:
            </ScoreLabel>
            <ScoreBar 
              value={score} 
              max={maxStepScore} 
              direction={pattern.direction}
            />
            <ScoreValue>{score.toFixed(2)}</ScoreValue>
          </ScoreRow>
        ))}
      </ScoresContainer>
      
      <StepsContainer>
        <Label style={{ marginBottom: '8px' }}>Step Details:</Label>
        {pattern.steps.map((step, index) => (
          <StepItem 
            key={index} 
            isConsolidation={step.isConsolidation}
            direction={pattern.direction}
          >
            <StepDetails>
              <StepTitle>
                {step.isConsolidation ? 'Consolidation' : 'Movement Step'} {index + 1}
              </StepTitle>
              <StepStat>
                Start: {new Date(step.startTime).toLocaleTimeString()}
              </StepStat>
              <StepStat>
                End: {new Date(step.endTime).toLocaleTimeString()}
              </StepStat>
              <StepStat>
                Level: {step.level.toFixed(4)}
              </StepStat>
            </StepDetails>
            {!step.isConsolidation && (
              <Value positive={pattern.stepScores[index] > 0}>
                Score: {pattern.stepScores[index].toFixed(2)}
              </Value>
            )}
          </StepItem>
        ))}
      </StepsContainer>
      
      {pattern.relatedPatternIds && pattern.relatedPatternIds.length > 0 && (
        <RelatedPatterns>
          <Label style={{ marginBottom: '8px' }}>Related Patterns:</Label>
          {pattern.relatedPatternIds.map((id, index) => (
            <RelatedPatternItem key={index}>
              <RelatedPatternType>Pattern ID: {id.substring(0, 8)}</RelatedPatternType>
              <span>Related</span>
            </RelatedPatternItem>
          ))}
        </RelatedPatterns>
      )}
    </Container>
  );
};

export default EscalatorPatternDetails;
