// src/components/PatternDetails/PivotPatternDetails.tsx
// Details view for Pivot pattern
// Shows pivot dates and prices
import React from 'react';
import styled from 'styled-components';
import { PivotPattern, PivotType } from '../../models/PatternTypes';
import { formatDate } from '../../utils/formatters';

const Container = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 12px;
`;

const Title = styled.h2`
  margin: 0;
  color: #2c3e50;
  font-size: 18px;
`;

const TimeRange = styled.div`
  color: #7f8c8d;
  font-size: 14px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 16px;
  color: #34495e;
  margin-bottom: 12px;
  font-weight: 500;
`;

const MetricGroup = styled.div`
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
`;

const Metric = styled.div`
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const MetricLabel = styled.div`
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
`;

const MetricValue = styled.div<{ $highlight?: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$highlight ? '600' : '400'};
  color: ${props => props.$highlight ? '#2980b9' : '#2c3e50'};
`;

const TouchesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
`;

const TouchCard = styled.div<{ $pivotType: PivotType }>`
  background-color: ${props => props.$pivotType === PivotType.SUPPORT ? '#e8f5e9' : '#ffebee'};
  border-left: 4px solid ${props => props.$pivotType === PivotType.SUPPORT ? '#4caf50' : '#f44336'};
  padding: 10px;
  border-radius: 4px;
`;

const TouchRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
`;

const TouchLabel = styled.span`
  color: #7f8c8d;
`;

const TouchValue = styled.span`
  font-weight: 500;
`;

const ScoreBar = styled.div`
  height: 6px;
  background-color: #ecf0f1;
  border-radius: 3px;
  margin-top: 4px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ $width: number; $color: string }>`
  height: 100%;
  width: ${props => `${props.$width}%`};
  background-color: ${props => props.$color};
`;

const getScoreColor = (score: number): string => {
  if (score < 0.3) return '#e74c3c';
  if (score < 0.6) return '#f39c12';
  if (score < 0.8) return '#3498db';
  return '#2ecc71';
};

interface PivotPatternDetailsProps {
  pattern: PivotPattern;
}

const PivotPatternDetails: React.FC<PivotPatternDetailsProps> = ({ pattern }) => {
  const pivotTypeLabel = pattern.pivotType === PivotType.SUPPORT ? 'Support' : 'Resistance';
  
  return (
    <Container>
      <Header>
        <Title>
          {pivotTypeLabel} Pivot Pattern
        </Title>
        <TimeRange>
          {formatDate(pattern.startTime)} - {formatDate(pattern.endTime)}
        </TimeRange>
      </Header>
      
      <Grid>
        <MetricGroup>
          <Metric>
            <MetricLabel>Pivot Level</MetricLabel>
            <MetricValue $highlight>{pattern.pivotLevel.toFixed(2)}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Confidence</MetricLabel>
            <MetricValue>{(pattern.confidence * 100).toFixed(1)}%</MetricValue>
            <ScoreBar>
              <ScoreFill 
                $width={pattern.confidence * 100} 
                $color={getScoreColor(pattern.confidence)} 
              />
            </ScoreBar>
          </Metric>
        </MetricGroup>
        
        <MetricGroup>
          <Metric>
            <MetricLabel>Total Touch Points</MetricLabel>
            <MetricValue>{pattern.touchPoints.length}</MetricValue>
          </Metric>
          <Metric>
            <MetricLabel>Adaptive Zone Width</MetricLabel>
            <MetricValue>{pattern.adaptiveZoneWidth.toFixed(2)}</MetricValue>
          </Metric>
        </MetricGroup>
        
        <MetricGroup>
          <Metric>
            <MetricLabel>Price Consistency</MetricLabel>
            <MetricValue>{(pattern.priceConsistency * 100).toFixed(1)}%</MetricValue>
            <ScoreBar>
              <ScoreFill 
                $width={pattern.priceConsistency * 100} 
                $color={getScoreColor(pattern.priceConsistency)} 
              />
            </ScoreBar>
          </Metric>
          <Metric>
            <MetricLabel>Touch Strength</MetricLabel>
            <MetricValue>{(pattern.touchStrength * 100).toFixed(1)}%</MetricValue>
            <ScoreBar>
              <ScoreFill 
                $width={pattern.touchStrength * 100} 
                $color={getScoreColor(pattern.touchStrength)} 
              />
            </ScoreBar>
          </Metric>
        </MetricGroup>
        
        <MetricGroup>
          <Metric>
            <MetricLabel>Temporal Distribution</MetricLabel>
            <MetricValue>{(pattern.temporalDistribution * 100).toFixed(1)}%</MetricValue>
            <ScoreBar>
              <ScoreFill 
                $width={pattern.temporalDistribution * 100} 
                $color={getScoreColor(pattern.temporalDistribution)} 
              />
            </ScoreBar>
          </Metric>
          <Metric>
            <MetricLabel>Overall Strength</MetricLabel>
            <MetricValue>{(pattern.strengthScore * 100).toFixed(1)}%</MetricValue>
            <ScoreBar>
              <ScoreFill 
                $width={pattern.strengthScore * 100} 
                $color={getScoreColor(pattern.strengthScore)} 
              />
            </ScoreBar>
          </Metric>
        </MetricGroup>
      </Grid>
      
      <Section>
        <SectionTitle>Touch Points Detail</SectionTitle>
        <TouchesGrid>
          {pattern.touchPoints.map((touch, index) => (
            <TouchCard key={index} $pivotType={pattern.pivotType}>
              <TouchRow>
                <TouchLabel>Time:</TouchLabel>
                <TouchValue>{formatDate(touch.time)}</TouchValue>
              </TouchRow>
              <TouchRow>
                <TouchLabel>Price:</TouchLabel>
                <TouchValue>{touch.price.toFixed(2)}</TouchValue>
              </TouchRow>
              {pattern.volumeReactions[index] !== undefined && (
                <TouchRow>
                  <TouchLabel>Volume:</TouchLabel>
                  <TouchValue>{(pattern.volumeReactions[index] * 100).toFixed(0)}%</TouchValue>
                </TouchRow>
              )}
              {pattern.priceReactions[index] !== undefined && (
                <TouchRow>
                  <TouchLabel>Price Reaction:</TouchLabel>
                  <TouchValue>{pattern.priceReactions[index].toFixed(2)}%</TouchValue>
                </TouchRow>
              )}
            </TouchCard>
          ))}
        </TouchesGrid>
      </Section>
    </Container>
  );
};

export default PivotPatternDetails;
