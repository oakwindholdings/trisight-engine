// src/components/Chart/TimeRangeSelector.tsx
// Buttons for selecting time range
// Updates chart viewport
import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  align-items: center;
  margin-right: 16px;
`;

const RangeButton = styled.button<{ $isActive?: boolean }>`
  background-color: ${props => props.$isActive ? '#2196f3' : '#f0f0f0'};
  color: ${props => props.$isActive ? 'white' : '#333'};
  border: 1px solid ${props => props.$isActive ? '#1976d2' : '#ddd'};
  border-radius: 4px;
  padding: 4px 8px;
  margin: 0 2px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$isActive ? '#1976d2' : '#e0e0e0'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
  }
`;

const Label = styled.span`
  margin-right: 8px;
  font-size: 12px;
  color: #666;
`;

// Define time range options
export type TimeRangeOption = '1D' | '1W' | '1M' | '3M' | 'YTD' | 'Custom';

interface TimeRangeSelectorProps {
  activeRange: TimeRangeOption;
  onRangeSelect: (range: TimeRangeOption, startDate: Date, endDate: Date) => void;
}

const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  activeRange,
  onRangeSelect
}) => {
  // Helper to calculate date for a given range
  const calculateDateRange = (option: TimeRangeOption): [Date, Date] => {
    const endDate = new Date(); // Always use current date as end date
    const startDate = new Date();
    
    switch (option) {
      case '1D':
        // Set to beginning of current day
        startDate.setHours(0, 0, 0, 0);
        break;
      case '1W':
        // 7 days ago
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        // 30 days ago
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '3M':
        // 90 days ago
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'YTD':
        // Beginning of current year
        startDate.setMonth(0, 1);
        startDate.setHours(0, 0, 0, 0);
        break;
      default:
        // Default to 1D
        startDate.setHours(0, 0, 0, 0);
        break;
    }
    
    return [startDate, endDate];
  };
  
  // Handle button click
  const handleClick = (option: TimeRangeOption) => {
    const [startDate, endDate] = calculateDateRange(option);
    
    // Add safety check to ensure onRangeSelect is a function
    if (typeof onRangeSelect === 'function') {
      console.log('Calling onRangeSelect with:', option, startDate, endDate);
      onRangeSelect(option, startDate, endDate);
    } else {
      console.error('Error: onRangeSelect is not a function', { onRangeSelect });
    }
  };
  
  return (
    <Container>
      <Label>Range:</Label>
      <RangeButton 
        $isActive={activeRange === '1D'} 
        onClick={() => handleClick('1D')}
      >
        1D
      </RangeButton>
      <RangeButton 
        $isActive={activeRange === '1W'} 
        onClick={() => handleClick('1W')}
      >
        1W
      </RangeButton>
      <RangeButton 
        $isActive={activeRange === '1M'} 
        onClick={() => handleClick('1M')}
      >
        1M
      </RangeButton>
      <RangeButton 
        $isActive={activeRange === '3M'} 
        onClick={() => handleClick('3M')}
      >
        3M
      </RangeButton>
      <RangeButton 
        $isActive={activeRange === 'YTD'} 
        onClick={() => handleClick('YTD')}
      >
        YTD
      </RangeButton>
    </Container>
  );
};

export default TimeRangeSelector;
