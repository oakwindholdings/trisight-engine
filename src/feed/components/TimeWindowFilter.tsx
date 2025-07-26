// src/feed/components/TimeWindowFilter.tsx
// Time window filter for Pattern Feed
// Provides preset time ranges for filtering

import React from 'react';
import styled from 'styled-components';
import { useFeedFilter, TIME_WINDOWS } from '../contexts/FeedFilterContext';

const Select = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  min-width: 120px;
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

export const TimeWindowFilter: React.FC = () => {
  const { filters, setTimeWindow } = useFeedFilter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeWindow(event.target.value);
  };

  const currentValue = filters.timeWindow || 'all';

  return (
    <Select value={currentValue} onChange={handleChange}>
      {TIME_WINDOWS.map(window => (
        <Option key={window.value} value={window.value}>
          {window.label}
        </Option>
      ))}
    </Select>
  );
};
