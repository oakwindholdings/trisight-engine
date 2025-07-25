// src/components/Visualizations/BlackjackVisualization.tsx
// Visualization for Blackjack pattern
// Shows scoring and confidence
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { BlackjackPattern, BlackjackSignalStrength } from '../../models/PatternTypes';
import { formatPercent } from '../../utils/formatters';

interface BlackjackVisualizationProps {
  pattern: BlackjackPattern;
  width: number;
  height: number;
  onPatternClick?: (pattern: BlackjackPattern) => void;
  isVisible?: boolean;
}

// Styled-component for ScoreBar
const ScoreBar = styled.div<{ positive: boolean; strength: BlackjackSignalStrength; isVisible?: boolean }>`
  background-color: ${props => {
    if (props.isVisible === false) return 'rgba(0,0,0,0)';
    if (props.positive) {
      switch (props.strength) {
        case BlackjackSignalStrength.VERY_STRONG: return '#0A5D36';
        case BlackjackSignalStrength.STRONG: return '#0F8A3C';
        case BlackjackSignalStrength.MODERATE: return '#4CAF50';
        default: return '#8BC34A';
      }
    } else {
      switch (props.strength) {
        case BlackjackSignalStrength.VERY_STRONG: return '#7B1FA2';
        case BlackjackSignalStrength.STRONG: return '#9C27B0';
        case BlackjackSignalStrength.MODERATE: return '#BA68C8';
        default: return '#D1C4E9';
      }
    }
  }};
  height: 20px;
  margin: 2px 0;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.8;
  &:hover {
    opacity: 1;
  }
`;

const Container = styled.div<{ width: number; height: number }>`
  width: ${props => props.width}px;
  height: ${props => props.height}px;
  position: relative;
`;

const ScoreLabel = styled.span`
  font-size: 12px;
  color: white;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
`;

const ScoreDot = styled.div<{ value: number; size?: number }>`
  width: ${props => props.size || 12}px;
  height: ${props => props.size || 12}px;
  border-radius: 50%;
  margin: 0 1px;
  background-color: ${props => 
    props.value > 0 ? '#4CAF50' : 
    props.value < 0 ? '#E91E63' : 
    '#9E9E9E'
  };
`;

const ScoreContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  margin-top: 5px;
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

export const BlackjackVisualization: React.FC<BlackjackVisualizationProps> = ({ 
  pattern, 
  width, 
  height,
  onPatternClick,
  isVisible
}) => {
  const isPositive = pattern.cumulativeScore > 0;
  
  const handleClick = () => {
    if (onPatternClick) {
      onPatternClick(pattern);
    }
  };

  // Format score display
  const scoreDisplay = useMemo(() => {
    if (pattern.contextScore !== undefined) {
      const contextBoost = pattern.contextScore > pattern.cumulativeScore;
      return (
        <>
          {pattern.cumulativeScore.toFixed(1)}
          <span style={{ 
            color: contextBoost ? '#4CAF50' : '#E91E63',
            fontSize: '10px',
            marginLeft: '3px'
          }}>
            ({pattern.contextScore.toFixed(1)})
          </span>
        </>
      );
    } else {
      return pattern.cumulativeScore.toFixed(1);
    }
  }, [pattern.cumulativeScore, pattern.contextScore]);
  
  // Calculate average price and volume changes
  const avgPriceChange = useMemo(() => {
    if (!pattern.priceChange?.length) return 0;
    return pattern.priceChange.reduce((sum, val) => sum + val, 0) / pattern.priceChange.length;
  }, [pattern.priceChange]);
  
  const avgVolumeChange = useMemo(() => {
    if (!pattern.volumeChange?.length) return 0;
    return pattern.volumeChange.reduce((sum, val) => sum + val, 0) / pattern.volumeChange.length;
  }, [pattern.volumeChange]);
  
  return (
    <Container width={width} height={height}>
      <ScoreBar 
        positive={isPositive} 
        strength={pattern.signalStrength}
        onClick={handleClick}
        title={`BlackJack pattern (${pattern.signalStrength})`}
        isVisible={isVisible}
      >
        <ScoreLabel>{scoreDisplay}</ScoreLabel>
      </ScoreBar>
      
      <ScoreContainer>
        {pattern.intrinsicScores.map((score, index) => (
          <ScoreDot 
            key={index} 
            value={score} 
            title={`Period ${index + 1}: ${score > 0 ? '+' : ''}${score}`}
          />
        ))}
      </ScoreContainer>
      
      <PatternDetails>
        <DetailRow>
          <span>Price Δ:</span>
          <DetailValue positive={avgPriceChange > 0}>
            {formatPercent(avgPriceChange)}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <span>Volume Δ:</span>
          <DetailValue positive={avgVolumeChange > 0}>
            {formatPercent(avgVolumeChange)}
          </DetailValue>
        </DetailRow>
        <DetailRow>
          <span>Signal:</span>
          <DetailValue>
            {pattern.signalStrength.replace('_', ' ')}
          </DetailValue>
        </DetailRow>
      </PatternDetails>
    </Container>
  );
};

export default BlackjackVisualization;
