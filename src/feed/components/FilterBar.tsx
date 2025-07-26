// src/feed/components/FilterBar.tsx
// Collapsible filter bar for Pattern Feed
// Pinned to top with real-time filtering capabilities

import React, { useState } from 'react';
import styled from 'styled-components';
import { useFeedFilter } from '../contexts/FeedFilterContext';
import { PatternTypeFilter } from './PatternTypeFilter';
import { TimeWindowFilter } from './TimeWindowFilter';
import { IntervalFilter } from './IntervalFilter';
import { FilterChips } from './FilterChips';

const FilterContainer = styled.div`
  background: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

const FilterHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;

  &:hover {
    background: #f1f5f9;
  }
`;

const FilterTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
`;

const FilterBadge = styled.span`
  background: #3b82f6;
  color: white;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 16px;
  text-align: center;
`;

const CollapseIcon = styled.div<{ $isExpanded: boolean }>`
  transition: transform 0.2s ease;
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: #6b7280;
  font-size: 12px;
`;

const FilterContent = styled.div<{ $isExpanded: boolean }>`
  display: ${props => props.$isExpanded ? 'block' : 'none'};
  padding: 16px;
  background: #ffffff;
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 8px;
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
`;

const ClearButton = styled.button`
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FilterStats = styled.div`
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
`;

interface FilterBarProps {
  totalCount: number;
  filteredCount: number;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  totalCount,
  filteredCount,
  className
}) => {
  const { hasActiveFilters, activeFilterCount, clearAllFilters } = useFeedFilter();
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <FilterContainer className={className}>
      <FilterHeader onClick={toggleExpanded}>
        <FilterTitle>
          Filters
          {activeFilterCount > 0 && (
            <FilterBadge>{activeFilterCount}</FilterBadge>
          )}
        </FilterTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FilterStats>
            {hasActiveFilters ? (
              `${filteredCount} of ${totalCount}`
            ) : (
              `${totalCount} patterns`
            )}
          </FilterStats>
          <CollapseIcon $isExpanded={isExpanded}>
            ▼
          </CollapseIcon>
        </div>
      </FilterHeader>

      <FilterContent $isExpanded={isExpanded}>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>Pattern:</FilterLabel>
            <PatternTypeFilter />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Time:</FilterLabel>
            <TimeWindowFilter />
          </FilterGroup>

          <FilterGroup>
            <FilterLabel>Interval:</FilterLabel>
            <IntervalFilter />
          </FilterGroup>

          <ClearButton
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            title="Clear all filters"
          >
            Clear All
          </ClearButton>
        </FilterRow>

        {hasActiveFilters && (
          <FilterRow style={{ marginTop: '12px' }}>
            <FilterChips />
          </FilterRow>
        )}
      </FilterContent>
    </FilterContainer>
  );
};
