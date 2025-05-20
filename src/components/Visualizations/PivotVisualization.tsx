import React from 'react';
import styled from 'styled-components';
import { PivotPattern, PivotType } from '../../models/PatternTypes';
import { formatDate } from '../../utils/formatters';

const PivotContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-bottom: 16px;
  font-family: 'Roboto', sans-serif;
`;

const PivotHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PivotTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const PivotTimeframe = styled.span`
  font-size: 12px;
  color: #666;
`;

const PivotBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MetricsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 8px;
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricLabel = styled.span`
  font-size: 12px;
  color: #666;
`;

const MetricValue = styled.span<{ $highlight?: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$highlight ? '600' : '400'};
  color: ${props => props.$highlight ? '#0056b3' : '#333'};
`;

const TouchesContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TouchesHeader = styled.div`
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
`;

const TouchesGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  font-size: 12px;
`;

const TouchItem = styled.div<{ $strength: number }>`
  display: flex;
  flex-direction: column;
  padding: 6px;
  border-radius: 4px;
  background-color: ${props => {
    const alpha = Math.max(0.1, Math.min(0.9, props.$strength));
    return `rgba(0, 86, 179, ${alpha})`;
  }};
  color: ${props => props.$strength > 0.5 ? 'white' : '#333'};
`;

const TouchTime = styled.span`
  font-size: 11px;
  margin-bottom: 2px;
`;

const TouchDetails = styled.span`
  font-size: 10px;
`;

const SupportIndicator = styled.div`
  height: 4px;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 2px;
  margin-top: 4px;
`;

const ResistanceIndicator = styled.div`
  height: 4px;
  background: linear-gradient(90deg, #f44336, #ff9800);
  border-radius: 2px;
  margin-top: 4px;
`;

interface PivotVisualizationProps {
  pattern: PivotPattern;
  isSelected?: boolean;
}

const PivotVisualization: React.FC<PivotVisualizationProps> = ({ pattern, isSelected }) => {
  // Calculate normalized strength for visualization
  const normalizedStrength = Math.min(1, Math.max(0, pattern.confidence));
  
  // Format date ranges
  const startTime = formatDate(pattern.startTime);
  const endTime = formatDate(pattern.endTime);
  
  // Get up to 6 touch points to display
  const displayTouches = pattern.touchPoints.slice(0, 6);
  
  return (
    <PivotContainer>
      <PivotHeader>
        <PivotTitle>
          {pattern.pivotType === PivotType.SUPPORT ? 'Support' : 'Resistance'} Pivot
        </PivotTitle>
        <PivotTimeframe>{startTime} to {endTime}</PivotTimeframe>
      </PivotHeader>
      
      <PivotBody>
        <MetricsContainer>
          <MetricItem>
            <MetricLabel>Pivot Level</MetricLabel>
            <MetricValue $highlight={true}>{pattern.pivotLevel.toFixed(2)}</MetricValue>
          </MetricItem>
          <MetricItem>
            <MetricLabel>Confidence</MetricLabel>
            <MetricValue>{(pattern.confidence * 100).toFixed(1)}%</MetricValue>
          </MetricItem>
          <MetricItem>
            <MetricLabel>Touch Points</MetricLabel>
            <MetricValue>{pattern.touchPoints.length}</MetricValue>
          </MetricItem>
          <MetricItem>
            <MetricLabel>Price Consistency</MetricLabel>
            <MetricValue>{(pattern.priceConsistency * 100).toFixed(1)}%</MetricValue>
          </MetricItem>
        </MetricsContainer>
        
        {isSelected && (
          <>
            <TouchesContainer>
              <TouchesHeader>Touch Points Analysis</TouchesHeader>
              <TouchesGrid>
                {displayTouches.map((touch, index) => {
                  const strength = pattern.volumeReactions[index] || 0;
                  const priceReaction = pattern.priceReactions[index] || 0;
                  
                  return (
                    <TouchItem key={index} $strength={strength}>
                      <TouchTime>{formatDate(touch.time)}</TouchTime>
                      <TouchDetails>Price: {touch.price.toFixed(2)}</TouchDetails>
                      <TouchDetails>Reaction: {priceReaction.toFixed(2)}%</TouchDetails>
                    </TouchItem>
                  );
                })}
              </TouchesGrid>
            </TouchesContainer>
            
            {pattern.pivotType === PivotType.SUPPORT ? (
              <SupportIndicator />
            ) : (
              <ResistanceIndicator />
            )}
          </>
        )}
      </PivotBody>
    </PivotContainer>
  );
};

export default PivotVisualization;
