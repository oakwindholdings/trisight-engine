// src/feed/components/FilterChips.tsx
// Active filter chips with remove functionality
// Shows currently applied filters as removable chips

import React from 'react';
import styled from 'styled-components';
import { useFeedFilter, TIME_WINDOWS, CHART_INTERVALS } from '../contexts/FeedFilterContext';
import { PatternType } from '../../models/PatternTypes';

const ChipsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const Chip = styled.div`
  display: flex;
  align-items: center;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  padding: 4px 8px 4px 12px;
  font-size: 12px;
  color: #1e40af;
  gap: 6px;
`;

const ChipLabel = styled.span`
  font-weight: 500;
`;

const ChipValue = styled.span`
  opacity: 0.8;
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: #1e40af;
  cursor: pointer;
  padding: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1;
  transition: background-color 0.2s;

  &:hover {
    background: #dbeafe;
  }
`;

export const FilterChips: React.FC = () => {
  const {
    filters,
    setPatternType,
    setTimeWindow,
    setInterval,
    setSymbol,
    setSector,
    setConfidenceRange
  } = useFeedFilter();

  const chips = [];

  // Pattern type chip
  if (filters.patternType) {
    const patternLabel = filters.patternType.replace(/_/g, ' ');
    chips.push({
      key: 'patternType',
      label: 'Pattern',
      value: patternLabel,
      onRemove: () => setPatternType('all')
    });
  }

  // Time window chip
  if (filters.timeWindow) {
    const timeWindow = TIME_WINDOWS.find(w => w.value === filters.timeWindow);
    chips.push({
      key: 'timeWindow',
      label: 'Time',
      value: timeWindow?.label || filters.timeWindow,
      onRemove: () => setTimeWindow('all')
    });
  }

  // Interval chip
  if (filters.interval) {
    const interval = CHART_INTERVALS.find(i => i.value === filters.interval);
    chips.push({
      key: 'interval',
      label: 'Interval',
      value: interval?.label || filters.interval,
      onRemove: () => setInterval('all')
    });
  }

  // Symbol chip
  if (filters.symbol) {
    chips.push({
      key: 'symbol',
      label: 'Symbol',
      value: filters.symbol,
      onRemove: () => setSymbol('')
    });
  }

  // Sector chip
  if (filters.sector) {
    chips.push({
      key: 'sector',
      label: 'Sector',
      value: filters.sector,
      onRemove: () => setSector('')
    });
  }

  // Confidence range chip
  if (filters.confidence?.min !== undefined || filters.confidence?.max !== undefined) {
    const { min, max } = filters.confidence;
    let value = 'Custom range';
    if (min !== undefined && max !== undefined) {
      value = `${(min * 100).toFixed(0)}% - ${(max * 100).toFixed(0)}%`;
    } else if (min !== undefined) {
      value = `≥ ${(min * 100).toFixed(0)}%`;
    } else if (max !== undefined) {
      value = `≤ ${(max * 100).toFixed(0)}%`;
    }
    
    chips.push({
      key: 'confidence',
      label: 'Confidence',
      value,
      onRemove: () => setConfidenceRange()
    });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <ChipsContainer>
      {chips.map(chip => (
        <Chip key={chip.key}>
          <ChipLabel>{chip.label}:</ChipLabel>
          <ChipValue>{chip.value}</ChipValue>
          <RemoveButton
            onClick={chip.onRemove}
            title={`Remove ${chip.label} filter`}
          >
            ×
          </RemoveButton>
        </Chip>
      ))}
    </ChipsContainer>
  );
};
