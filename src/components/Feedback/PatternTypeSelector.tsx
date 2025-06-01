// src/components/Feedback/PatternTypeSelector.tsx
// Selector for correct pattern type
// Supports feedback flow
import React from 'react';
import styled from 'styled-components';
import { PatternType, patternStyles } from '../../models/PatternTypes';
import type { PatternTypeSelectorProps } from './feedback-components';

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
`;

const TypeCard = styled.div<{ $selected: boolean; $isOriginal: boolean }>`
  padding: 12px;
  border-radius: 6px;
  border: 2px solid ${props => 
    props.$selected 
      ? '#1976d2' 
      : props.$isOriginal 
        ? '#ff9800' 
        : '#e0e0e0'};
  background-color: ${props => 
    props.$selected 
      ? 'rgba(25, 118, 210, 0.1)' 
      : props.$isOriginal 
        ? 'rgba(255, 152, 0, 0.1)' 
        : 'white'};
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &:hover {
    border-color: ${props => props.$selected ? '#1976d2' : '#757575'};
    background-color: ${props => 
      props.$selected 
        ? 'rgba(25, 118, 210, 0.15)' 
        : props.$isOriginal 
          ? 'rgba(255, 152, 0, 0.15)' 
          : '#f5f5f5'};
  }
`;

const TypeIcon = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
`;

const TypeName = styled.div`
  font-size: 14px;
  text-align: center;
  font-weight: 500;
`;

const TypeDescription = styled.div`
  font-size: 12px;
  text-align: center;
  color: #757575;
  margin-top: 4px;
`;

const Legend = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
  font-size: 12px;
  color: #757575;
`;

const LegendItem = styled.div<{ color: string }>`
  display: flex;
  align-items: center;
  
  &::before {
    content: '';
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: ${props => props.color};
    margin-right: 6px;
  }
`;

// Pattern type descriptions
const patternDescriptions: Record<PatternType, string> = {
  [PatternType.GOLDMINE_CHANNEL]: 'Parallel lines connecting highs and lows',
  [PatternType.GOLDMINE_SHAFT]: 'Arrow-like formation showing thrust direction',
  [PatternType.PIVOT]: 'Horizontal line at pivot level with triangle markers',
  [PatternType.ROCKETMAN]: 'Curved acceleration line with gradient fill',
  [PatternType.ESCALATOR]: 'Horizontal lines marking step levels with transitions',
  [PatternType.BLACKJACK]: 'Card suit symbols showing price/volume correlation'
};

// First letter icons for pattern types
const patternIcons: Record<PatternType, string> = {
  [PatternType.GOLDMINE_CHANNEL]: 'GC',
  [PatternType.GOLDMINE_SHAFT]: 'GS',
  [PatternType.PIVOT]: 'P',
  [PatternType.ROCKETMAN]: 'R',
  [PatternType.ESCALATOR]: 'E',
  [PatternType.BLACKJACK]: 'BJ'
};

/**
 * Component for selecting and correcting pattern types in feedback
 * Displays a grid of pattern types with visual indicators for original and selected types
 */
const PatternTypeSelectorComponent: React.FC<PatternTypeSelectorProps> = ({
  selectedType,
  originalType,
  onSelect
}) => {
  // Get all pattern types
  const patternTypes = Object.values(PatternType);
  
  return (
    <>
      <TypeGrid>
        {patternTypes.map(type => (
          <TypeCard 
            key={type}
            $selected={selectedType === type}
            $isOriginal={originalType === type && selectedType !== type}
            onClick={() => onSelect(type)}
          >
            <TypeIcon color={patternStyles[type].color}>
              {patternIcons[type]}
            </TypeIcon>
            <TypeName>
              {type.replace('_', ' ')}
            </TypeName>
            <TypeDescription>
              {patternDescriptions[type]}
            </TypeDescription>
          </TypeCard>
        ))}
      </TypeGrid>
      
      <Legend>
        <LegendItem color="#1976d2">Currently Selected</LegendItem>
        <LegendItem color="#ff9800">Original Type</LegendItem>
      </Legend>
    </>
  );
};

// Simply export the component directly
export default PatternTypeSelectorComponent;
