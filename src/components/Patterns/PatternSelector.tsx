import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PatternType, patternStyles } from '../../models/PatternTypes';
import { usePatternContext } from '../../contexts/PatternContext';
import AdaptivePatternControls from './AdaptivePatternControls';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
`;

const SelectorContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const Label = styled.span`
  font-size: 14px;
  color: #616161;
`;

const PatternButtonGroup = styled.div`
  display: flex;
  gap: 4px;
  border-radius: 4px;
  overflow: hidden;
`;

const PatternButton = styled.button<{ 
  $isSelected: boolean; 
  $patternColor: string;
  $count: number;
}>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px 12px;
  border: none;
  background-color: ${props => props.$isSelected ? props.$patternColor + '22' : 'white'};
  color: ${props => props.$isSelected ? props.$patternColor : '#616161'};
  font-size: 13px;
  cursor: pointer;
  position: relative;
  border: 1px solid ${props => props.$isSelected ? props.$patternColor : '#e0e0e0'};
  
  &:hover {
    background-color: ${props => props.$patternColor}11;
  }
  
  &::after {
    content: '${props => props.$count}';
    position: absolute;
    top: -6px;
    right: -6px;
    background-color: ${props => props.$count > 0 ? props.$patternColor : 'transparent'};
    color: white;
    font-size: 10px;
    font-weight: bold;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: ${props => props.$count > 0 ? 1 : 0};
  }
`;

const ClearButton = styled.button`
  background: none;
  border: none;
  color: #1976d2;
  font-size: 13px;
  cursor: pointer;
  padding: 6px 12px;
  
  &:hover {
    text-decoration: underline;
  }
`;

// Format pattern type for display
const formatPatternType = (type: PatternType): string => {
  return type.split('_').map(word => 
    word.charAt(0) + word.slice(1).toLowerCase()
  ).join(' ');
};

const PatternSelector: React.FC = () => {
  const { 
    patternCounts, 
    filterPatternsByType, 
    activeFilter, 
    preferences, 
    updatePreferences,
    getDetectionStatistics
  } = usePatternContext();
  // State to store detection statistics
  const [detectionStats, setDetectionStats] = useState({});

  // Periodically update detection statistics
  useEffect(() => {
    const updateStats = () => {
      setDetectionStats(getDetectionStatistics());
    };
    
    // Update stats immediately and then every 2 seconds
    updateStats();
    const interval = setInterval(updateStats, 2000);
    
    return () => clearInterval(interval);
  }, [getDetectionStatistics]);
  
  // Handle pattern type selection
  const handleSelectType = (type: PatternType) => {
    if (activeFilter === type) {
      // If clicking the same type, clear the filter
      filterPatternsByType(null);
    } else {
      // Set a new filter
      filterPatternsByType(type);
    }
  };
  
  // Clear selection
  const handleClearSelection = () => {
    filterPatternsByType(null);
  };
  
  return (
    <Container>
      {/* Adaptive Pattern Controls */}
      <AdaptivePatternControls
        preferences={preferences}
        updatePreferences={updatePreferences}
        detectionStats={detectionStats}
      />
      
      {/* Pattern Type Filter */}
      <SelectorContainer>
        <Label>Filter patterns:</Label>
        
        <PatternButtonGroup>
          {Object.values(PatternType).map(type => (
            <PatternButton
              key={type}
              $isSelected={activeFilter === type}
              $patternColor={patternStyles[type].color}
              $count={patternCounts[type] || 0}
              onClick={() => handleSelectType(type)}
            >
              {formatPatternType(type)}
            </PatternButton>
          ))}
        </PatternButtonGroup>
        
        {activeFilter && (
          <ClearButton onClick={handleClearSelection}>
            Clear filter
          </ClearButton>
        )}
      </SelectorContainer>
    </Container>
  );
};

export default PatternSelector;
