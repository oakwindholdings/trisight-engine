// src/feed/components/PatternTypeFilter.tsx
// Pattern type filter dropdown with counts
// Follows existing TriSight pattern selector patterns

import React from 'react';
import styled from 'styled-components';
import { useFeedFilter } from '../contexts/FeedFilterContext';
import { patternStyles } from '../../models/PatternTypes';

const Select = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  min-width: 140px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:hover {
    border-color: #9ca3af;
  }
`;

const Option = styled.option`
  padding: 4px 8px;
`;

const PatternIcon = styled.span<{ $color?: string }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => props.$color || '#6b7280'};
  margin-right: 6px;
  vertical-align: middle;
`;

export const PatternTypeFilter: React.FC = () => {
  const { filters, setPatternType, patternTypeOptions } = useFeedFilter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPatternType(event.target.value);
  };

  const currentValue = filters.patternType || 'all';

  return (
    <Select value={currentValue} onChange={handleChange}>
      {patternTypeOptions.map(option => {
        const color = option.type !== 'all' ? patternStyles[option.type]?.color : undefined;
        
        return (
          <Option key={option.type} value={option.type}>
            {option.label} ({option.count})
          </Option>
        );
      })}
    </Select>
  );
};
