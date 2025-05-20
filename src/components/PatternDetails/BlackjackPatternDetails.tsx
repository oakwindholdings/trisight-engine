import React from 'react';
import styled from 'styled-components';
import { BlackjackPattern, BlackjackSignalStrength } from '../../models/PatternTypes';
import { formatPercent, formatDate } from '../../utils/formatters';

interface BlackjackPatternDetailsProps {
  pattern: BlackjackPattern;
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

const SignalStrengthIndicator = styled.div<{ strength: BlackjackSignalStrength }>`
  background-color: ${props => {
    switch (props.strength) {
      case BlackjackSignalStrength.VERY_STRONG: return '#0A5D36'; // Dark green
      case BlackjackSignalStrength.STRONG: return '#0F8A3C'; // Green
      case BlackjackSignalStrength.MODERATE: return '#4CAF50'; // Light green
      default: return '#8BC34A'; // Pale green
    }
  }};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: inline-block;
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
  width: 100px;
`;

const ScoreBar = styled.div<{ value: number; max: number }>`
  height: 16px;
  width: ${props => Math.min(100, Math.max(0, (props.value / props.max) * 100))}%;
  background-color: ${props => props.value >= 0 ? '#4CAF50' : '#E91E63'};
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

const BlackjackPatternDetails: React.FC<BlackjackPatternDetailsProps> = ({ 
  pattern, 
  onClose 
}) => {
  // Format date from start time
  const formattedDate = formatDate(pattern.startTime, true);
  
  // Calculate average price and volume change
  const avgPriceChange = pattern.priceChange.reduce((sum, val) => sum + val, 0) / pattern.priceChange.length;
  const avgVolumeChange = pattern.volumeChange.reduce((sum, val) => sum + val, 0) / pattern.volumeChange.length;
  
  // Find max intrinsic score for scaling
  const maxIntrinsicScore = Math.max(...pattern.intrinsicScores.map(s => Math.abs(s)));
  
  return (
    <Container>
      <Header>
        <Title>BlackJack Pattern Details</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      <DetailRow>
        <Label>Date & Time:</Label>
        <Value>{formattedDate}</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Signal Strength:</Label>
        <SignalStrengthIndicator strength={pattern.signalStrength}>
          {pattern.signalStrength.replace('_', ' ')}
        </SignalStrengthIndicator>
      </DetailRow>
      
      <DetailRow>
        <Label>Overall Score:</Label>
        <Value positive={pattern.cumulativeScore > 0}>{pattern.cumulativeScore.toFixed(2)}</Value>
      </DetailRow>
      
      {pattern.contextScore !== undefined && (
        <DetailRow>
          <Label>Context Score:</Label>
          <Value positive={pattern.contextScore > pattern.cumulativeScore}>{pattern.contextScore.toFixed(2)}</Value>
        </DetailRow>
      )}
      
      <DetailRow>
        <Label>Average Price Change:</Label>
        <Value positive={avgPriceChange > 0}>{formatPercent(avgPriceChange)}</Value>
      </DetailRow>
      
      <DetailRow>
        <Label>Average Volume Change:</Label>
        <Value positive={avgVolumeChange > 0}>{formatPercent(avgVolumeChange)}</Value>
      </DetailRow>
      
      <ScoresContainer>
        <Label style={{ marginBottom: '8px' }}>Intrinsic Scores:</Label>
        {pattern.intrinsicScores.map((score, index) => (
          <ScoreRow key={index}>
            <ScoreLabel>Period {index + 1}:</ScoreLabel>
            <ScoreBar value={score} max={maxIntrinsicScore} />
            <ScoreValue>{score.toFixed(2)}</ScoreValue>
          </ScoreRow>
        ))}
      </ScoresContainer>
      
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

export default BlackjackPatternDetails;
