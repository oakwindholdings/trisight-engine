import React, { useMemo } from 'react';
import styled from 'styled-components';
import { EscalatorPattern, EscalatorSignalStrength, ThrustDirection } from '../../models/PatternTypes';
import { formatPercent } from '../../utils/formatters';

interface EscalatorVisualizationProps {
  pattern: EscalatorPattern;
  width: number;
  height: number;
  onPatternClick?: (pattern: EscalatorPattern) => void;
}

const Container = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const StepsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StepBar = styled.div<{ 
  direction: ThrustDirection; 
  isConsolidation: boolean;
  strength: EscalatorSignalStrength; 
}>`
  height: 18px;
  border-radius: 3px;
  cursor: pointer;
  background-color: ${props => {
    if (props.isConsolidation) {
      return '#E0E0E0'; // Gray for consolidation steps
    }
    
    // Different colors for bullish vs bearish direction
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  opacity: ${props => props.isConsolidation ? 0.6 : 0.85};
  
  &:hover {
    opacity: 1;
  }
`;

const StepLabel = styled.span`
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.3);
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 5px;
  padding: 5px;
  border-radius: 3px;
  background-color: rgba(255, 255, 255, 0.7);
`;

const ScoreValue = styled.span<{ positive: boolean }>`
  font-size: 14px;
  font-weight: bold;
  color: ${props => props.positive ? '#4CAF50' : '#E91E63'};
`;

const ScoreLabel = styled.span`
  font-size: 12px;
  color: #424242;
`;

const PatternDetails = styled.div`
  display: flex;
  flex-direction: column;
  padding: 4px;
  margin-top: 5px;
  font-size: 10px;
  color: #555;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 1px 0;
`;

const DetailValue = styled.span<{ positive?: boolean }>`
  font-weight: 600;
  color: ${props => props.positive === undefined ? '#555' : 
    props.positive ? '#4CAF50' : '#E91E63'};
`;

export const EscalatorVisualization: React.FC<EscalatorVisualizationProps> = ({ 
  pattern, 
  width, 
  height,
  onPatternClick
}) => {
  const handleClick = () => {
    if (onPatternClick) {
      onPatternClick(pattern);
    }
  };

  // Calculate average price and volume changes
  const avgPriceChange = useMemo(() => {
    if (!pattern.priceChanges?.length) return 0;
    return pattern.priceChanges.reduce((sum, val) => sum + val, 0) / pattern.priceChanges.length;
  }, [pattern.priceChanges]);
  
  const avgVolumeChange = useMemo(() => {
    if (!pattern.volumeChanges?.length) return 0;
    return pattern.volumeChanges.reduce((sum, val) => sum + val, 0) / pattern.volumeChanges.length;
  }, [pattern.volumeChanges]);
  
  // Format score display
  const scoreDisplay = useMemo(() => {
    const directionPrefix = pattern.direction === ThrustDirection.BULLISH ? '+' : '-';
    const baseScore = `${directionPrefix}${Math.abs(pattern.cumulativeScore).toFixed(1)}`;
    
    if (pattern.contextScore !== undefined) {
      const contextBoost = Math.abs(pattern.contextScore) > Math.abs(pattern.cumulativeScore);
      return (
        <>
          {baseScore}
          <span style={{ 
            color: contextBoost ? '#4CAF50' : '#E91E63',
            fontSize: '10px',
            marginLeft: '3px'
          }}>
            ({directionPrefix}${Math.abs(pattern.contextScore).toFixed(1)})
          </span>
        </>
      );
    } else {
      return baseScore;
    }
  }, [pattern.cumulativeScore, pattern.contextScore, pattern.direction]);
  
  return (
    <Container width={width} height={height}>
      <StepsContainer>
        {pattern.steps.map((step, index) => {
          const stepScore = pattern.stepScores[index] || 0;
          const isPositive = (pattern.direction === ThrustDirection.BULLISH && stepScore > 0) || 
                            (pattern.direction === ThrustDirection.BEARISH && stepScore < 0);
          
          return (
            <StepBar 
              key={index}
              direction={pattern.direction}
              isConsolidation={step.isConsolidation}
              strength={pattern.signalStrength}
              onClick={handleClick}
              title={`${step.isConsolidation ? 'Consolidation' : 'Movement'} Step ${index + 1}`}
            >
              <StepLabel>
                {step.isConsolidation 
                  ? 'Consolidation' 
                  : `${pattern.direction === ThrustDirection.BULLISH ? '↗' : '↘'} Step ${index + 1}`}
              </StepLabel>
            </StepBar>
          );
        })}
      </StepsContainer>
      
      <ScoreContainer>
        <ScoreLabel>Score:</ScoreLabel>
        <ScoreValue positive={pattern.direction === ThrustDirection.BULLISH}>
          {scoreDisplay}
        </ScoreValue>
      </ScoreContainer>
      
      <PatternDetails>
        <DetailRow>
          <span>Direction:</span>
          <DetailValue>
            {pattern.direction === ThrustDirection.BULLISH ? 'BULLISH ↗' : 'BEARISH ↘'}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <span>Consistency:</span>
          <DetailValue>
            {(pattern.stepConsistency * 100).toFixed(0)}%
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <span>Steps:</span>
          <DetailValue>
            {pattern.steps.filter(s => !s.isConsolidation).length} of {pattern.steps.length}
          </DetailValue>
        </DetailRow>
      </PatternDetails>
    </Container>
  );
};

export default EscalatorVisualization;
