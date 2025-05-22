// src/components/PatternDetails/RocketmanPatternDetails.tsx
// Details view for Rocketman pattern
// Shows thrust calculations
import React from 'react';
import styled from 'styled-components';
import { format } from 'd3-format';
import { RocketmanPattern, RocketmanSignalStrength, ThrustDirection } from '../../models/PatternTypes';
import { formatDate, formatTime } from '../../utils/formatters';

const DetailsContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const PatternHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const PatternTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
`;

const Direction = styled.span<{ direction: ThrustDirection }>`
  display: inline-block;
  padding: 4px 8px;
  margin-left: 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background-color: ${props => 
    props.direction === ThrustDirection.BULLISH ? '#4CAF50' : '#F44336'};
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
`;

const MetricLabel = styled.span`
  font-size: 12px;
  color: #6c757d;
  margin-bottom: 2px;
`;

const MetricValue = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #212529;
`;

const ScoreSection = styled.div`
  margin-bottom: 12px;
`;

const ScoreTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: #343a40;
`;

const ScoreBars = styled.div`
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
`;

const ScoreLabel = styled.span`
  font-size: 12px;
  color: #495057;
`;

const ScoreBar = styled.div`
  height: 8px;
  background-color: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ value: number; color: string }>`
  height: 100%;
  width: ${props => props.value * 100}%;
  background-color: ${props => props.color};
`;

const TimelineSection = styled.div`
  margin-bottom: 12px;
`;

const SignalStrengthIndicator = styled.div<{ strength: RocketmanSignalStrength }>`
  display: inline-block;
  padding: 4px 8px;
  margin-top: 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  background-color: ${props => {
    switch (props.strength) {
      case RocketmanSignalStrength.VERY_STRONG:
        return '#7C4DFF';
      case RocketmanSignalStrength.STRONG:
        return '#00C853';
      case RocketmanSignalStrength.MODERATE:
        return '#FFD600';
      case RocketmanSignalStrength.WEAK:
      default:
        return '#9E9E9E';
    }
  }};
`;

interface RocketmanPatternDetailsProps {
  pattern: RocketmanPattern;
}

/**
 * Component for displaying detailed information about a Rocketman pattern
 */
const RocketmanPatternDetails: React.FC<RocketmanPatternDetailsProps> = ({ pattern }) => {
  const formatPercent = format('.2f');
  const formatNumber = format('.2f');

  // Convert number scores to percentages for display
  const momentumPercent = pattern.momentumScore * 100;
  const volumeConfirmPercent = pattern.volumeConfirmation * 100;
  const confidencePercent = pattern.confidence * 100;
  const intensityPercent = pattern.intensity * 100;
  
  return (
    <DetailsContainer>
      <PatternHeader>
        <PatternTitle>Rocketman Pattern</PatternTitle>
        <Direction direction={pattern.direction}>
          {pattern.direction === ThrustDirection.BULLISH ? 'BULLISH' : 'BEARISH'}
        </Direction>
      </PatternHeader>
      
      <MetricsGrid>
        <MetricItem>
          <MetricLabel>Start Time</MetricLabel>
          <MetricValue>{formatDate(pattern.startTime, true)} {formatTime(pattern.startTime)}</MetricValue>
        </MetricItem>
        <MetricItem>
          <MetricLabel>End Time</MetricLabel>
          <MetricValue>{formatDate(pattern.endTime, true)} {formatTime(pattern.endTime)}</MetricValue>
        </MetricItem>
        <MetricItem>
          <MetricLabel>Peak Time</MetricLabel>
          <MetricValue>{formatDate(pattern.peakTime, true)} {formatTime(pattern.peakTime)}</MetricValue>
        </MetricItem>
        <MetricItem>
          <MetricLabel>Acceleration Rate</MetricLabel>
          <MetricValue>{formatNumber(pattern.accelerationRate)}x</MetricValue>
        </MetricItem>
        <MetricItem>
          <MetricLabel>High Price</MetricLabel>
          <MetricValue>${formatNumber(pattern.highPrice)}</MetricValue>
        </MetricItem>
        <MetricItem>
          <MetricLabel>Low Price</MetricLabel>
          <MetricValue>${formatNumber(pattern.lowPrice)}</MetricValue>
        </MetricItem>
      </MetricsGrid>
      
      <ScoreSection>
        <ScoreTitle>Pattern Metrics</ScoreTitle>
        <ScoreBars>
          <ScoreLabel>Momentum</ScoreLabel>
          <ScoreBar>
            <ScoreFill 
              value={pattern.momentumScore} 
              color={pattern.direction === ThrustDirection.BULLISH ? '#4CAF50' : '#F44336'} 
            />
          </ScoreBar>
        </ScoreBars>
        <ScoreBars>
          <ScoreLabel>Volume Confirmation</ScoreLabel>
          <ScoreBar>
            <ScoreFill value={pattern.volumeConfirmation} color="#2196F3" />
          </ScoreBar>
        </ScoreBars>
        <ScoreBars>
          <ScoreLabel>Pattern Intensity</ScoreLabel>
          <ScoreBar>
            <ScoreFill value={pattern.intensity} color="#FFC107" />
          </ScoreBar>
        </ScoreBars>
        <ScoreBars>
          <ScoreLabel>Overall Confidence</ScoreLabel>
          <ScoreBar>
            <ScoreFill value={pattern.confidence} color="#9C27B0" />
          </ScoreBar>
        </ScoreBars>
      </ScoreSection>
      
      <TimelineSection>
        <ScoreTitle>Key Metrics</ScoreTitle>
        <div>
          <MetricLabel>Acceleration Score:</MetricLabel>
          <MetricValue> {formatPercent(momentumPercent)}%</MetricValue>
        </div>
        <div>
          <MetricLabel>Volume Confirmation:</MetricLabel>
          <MetricValue> {formatPercent(volumeConfirmPercent)}%</MetricValue>
        </div>
        <div>
          <MetricLabel>Pattern Intensity:</MetricLabel>
          <MetricValue> {formatPercent(intensityPercent)}%</MetricValue>
        </div>
        <div>
          <MetricLabel>Adaptive Threshold:</MetricLabel>
          <MetricValue> {formatNumber(pattern.adaptiveThreshold)}</MetricValue>
        </div>
        <div>
          <MetricLabel>Signal Strength:</MetricLabel>
          <SignalStrengthIndicator strength={pattern.signalStrength}>
            {pattern.signalStrength}
          </SignalStrengthIndicator>
        </div>
      </TimelineSection>
    </DetailsContainer>
  );
};

export default RocketmanPatternDetails;
