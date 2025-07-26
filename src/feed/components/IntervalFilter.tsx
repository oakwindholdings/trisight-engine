// src/feed/components/IntervalFilter.tsx
// Chart interval filter for Pattern Feed
// Filters by chart timeframe intervals

import React from 'react';
import styled from 'styled-components';
import { useFeedFilter, CHART_INTERVALS } from '../contexts/FeedFilterContext';

const Select = styled.select`
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  min-width: 110px;
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

export const IntervalFilter: React.FC = () => {
  const { filters, setInterval } = useFeedFilter();

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInterval(event.target.value);
  };

  const currentValue = filters.interval || 'all';

  return (
    <Select value={currentValue} onChange={handleChange}>
      {CHART_INTERVALS.map(interval => (
        <Option key={interval.value} value={interval.value}>
          {interval.label}
        </Option>
      ))}
    </Select>
  );
};
