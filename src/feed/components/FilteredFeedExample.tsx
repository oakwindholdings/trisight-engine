// src/feed/components/FilteredFeedExample.tsx
// Usage example showing the filtered feed implementation
// Demonstrates how to use the filtering system

import React, { useState } from 'react';
import styled from 'styled-components';
import { FeedFilterProvider, useFeedFilter } from '../contexts/FeedFilterContext';
import { usePatternFeed } from '../hooks/usePatternFeed';
import { FilterBar } from './FilterBar';
import { PatternType } from '../../models/PatternTypes';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const FeedGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 20px;
`;

const FeedCard = styled.div`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 8px;
`;

const PatternTypeLabel = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

const Symbol = styled.span`
  background: #eff6ff;
  color: #1e40af;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`;

const Confidence = styled.div`
  margin-top: 8px;
  font-size: 13px;
  color: #374151;
`;

const Summary = styled.div`
  margin-top: 8px;
  font-size: 14px;
  color: #4b5563;
  line-height: 1.4;
`;

const Controls = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
`;

const Button = styled.button`
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #2563eb;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: #6b7280;

  &:hover {
    background: #4b5563;
  }
`;

// Example component showing filtered feed usage
const FilteredFeedContent: React.FC = () => {
  const { filters, setFilters, clearAllFilters, hasActiveFilters } = useFeedFilter();
  const { entries, filteredCount, totalCount, patternTypeCounts } = usePatternFeed({
    filters,
    sortBy: 'timestamp',
    sortDirection: 'desc',
    limit: 50 // Limit for demo
  });

  // Example preset filters
  const applyHighConfidenceFilter = () => {
    setFilters({
      confidence: { min: 0.7 },
      timeWindow: '1h'
    });
  };

  const applyGoldmineFilter = () => {
    setFilters({
      patternType: PatternType.GOLDMINE_SHAFT,
      timeWindow: '4h'
    });
  };

  const applyRecentPatternsFilter = () => {
    setFilters({
      timeWindow: '15m'
    });
  };

  return (
    <Container>
      <h2>Pattern Feed with Advanced Filtering</h2>
      
      <Controls>
        <Button onClick={applyHighConfidenceFilter}>
          High Confidence (≥70%)
        </Button>
        <Button onClick={applyGoldmineFilter}>
          Goldmine Shaft (4h)
        </Button>
        <Button onClick={applyRecentPatternsFilter}>
          Recent Patterns (15m)
        </Button>
        <SecondaryButton 
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
        >
          Clear All Filters
        </SecondaryButton>
      </Controls>

      <FilterBar 
        totalCount={totalCount}
        filteredCount={filteredCount}
      />

      <FeedGrid>
        {entries.map(entry => (
          <FeedCard key={entry.id}>
            <CardHeader>
              <PatternTypeLabel>
                {entry.patternType.replace(/_/g, ' ')}
              </PatternTypeLabel>
              <Symbol>{entry.symbol}</Symbol>
            </CardHeader>
            
            <Timestamp>
              {new Date(entry.timestamp).toLocaleString()}
            </Timestamp>
            
            {entry.confidence != null && (
              <Confidence>
                Confidence: {(entry.confidence * 100).toFixed(1)}%
              </Confidence>
            )}
            
            <Summary>{entry.humanSummary}</Summary>
          </FeedCard>
        ))}
      </FeedGrid>

      {entries.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
          {totalCount === 0 ? 'No patterns available' : 'No patterns match current filters'}
        </div>
      )}
    </Container>
  );
};

// Main example component with provider
export const FilteredFeedExample: React.FC = () => {
  return (
    <FeedFilterProvider>
      <FilteredFeedContent />
    </FeedFilterProvider>
  );
};
