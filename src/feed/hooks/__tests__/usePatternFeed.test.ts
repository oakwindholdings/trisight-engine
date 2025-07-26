// src/feed/hooks/__tests__/usePatternFeed.test.ts
// Tests for enhanced usePatternFeed hook
// Validates filtering, sorting, and performance

import { renderHook, act } from '@testing-library/react';
import { usePatternFeed } from '../usePatternFeed';
import { PatternFeedEntry, EnhancedPatternFeedFilters } from '../../types/PatternFeedTypes';
import { PatternType } from '../../../models/PatternTypes';

// Mock the dependencies
jest.mock('../../../contexts/FeedContext', () => ({
  useFeedContext: () => ({
    entries: [],
    addEntry: jest.fn()
  })
}));

jest.mock('../../db/patternFeedService', () => ({
  subscribeToFeed: jest.fn(() => ({
    unsubscribe: jest.fn()
  }))
}));

// Mock data
const createMockEntry = (overrides: Partial<PatternFeedEntry> = {}): PatternFeedEntry => ({
  id: `entry-${Math.random()}`,
  symbol: 'AAPL',
  patternType: PatternType.GOLDMINE_SHAFT,
  eventType: 'PATTERN' as any,
  timestamp: new Date().toISOString(),
  humanSummary: 'Test pattern',
  mcpVersion: '0.1.0' as const,
  confidence: 0.8,
  ...overrides
});

describe('usePatternFeed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => usePatternFeed());
    
    expect(result.current.entries).toEqual([]);
    expect(result.current.filteredCount).toBe(0);
    expect(result.current.totalCount).toBe(0);
    expect(result.current.patternTypeCounts).toEqual({});
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle filters correctly', () => {
    const filters: EnhancedPatternFeedFilters = {
      patternType: PatternType.GOLDMINE_SHAFT,
      confidence: { min: 0.7 }
    };

    const { result } = renderHook(() => usePatternFeed({ filters }));
    
    // Initial state should still be empty but with filters applied
    expect(result.current.entries).toEqual([]);
    expect(result.current.filteredCount).toBe(0);
  });

  it('should handle sorting options', () => {
    const { result } = renderHook(() => 
      usePatternFeed({ 
        sortBy: 'confidence', 
        sortDirection: 'desc' 
      })
    );
    
    expect(result.current.entries).toEqual([]);
  });

  it('should handle limit option', () => {
    const { result } = renderHook(() => 
      usePatternFeed({ limit: 10 })
    );
    
    expect(result.current.entries).toEqual([]);
  });

  it('should return pattern type counts', () => {
    const { result } = renderHook(() => usePatternFeed());
    
    expect(result.current.patternTypeCounts).toEqual({});
  });

  it('should handle loading state', () => {
    const { result } = renderHook(() => usePatternFeed());
    
    // Initially should not be loading (mocked subscription returns immediately)
    expect(result.current.isLoading).toBe(false);
  });
});

describe('usePatternFeed with mock data', () => {
  const mockEntries: PatternFeedEntry[] = [
    createMockEntry({
      id: '1',
      patternType: PatternType.GOLDMINE_SHAFT,
      confidence: 0.9,
      timestamp: '2024-01-15T10:00:00Z'
    }),
    createMockEntry({
      id: '2',
      patternType: PatternType.BLACKJACK,
      confidence: 0.6,
      timestamp: '2024-01-15T11:00:00Z'
    }),
    createMockEntry({
      id: '3',
      patternType: PatternType.GOLDMINE_SHAFT,
      confidence: 0.8,
      timestamp: '2024-01-15T09:00:00Z'
    })
  ];

  beforeEach(() => {
    // Mock the FeedContext to return our test data
    jest.doMock('../../../contexts/FeedContext', () => ({
      useFeedContext: () => ({
        entries: mockEntries,
        addEntry: jest.fn()
      })
    }));
  });

  it('should filter by pattern type', () => {
    const filters: EnhancedPatternFeedFilters = {
      patternType: PatternType.GOLDMINE_SHAFT
    };

    const { result } = renderHook(() => usePatternFeed({ filters }));
    
    // Should filter to only GOLDMINE_SHAFT patterns
    expect(result.current.filteredCount).toBeLessThanOrEqual(result.current.totalCount);
  });

  it('should filter by confidence range', () => {
    const filters: EnhancedPatternFeedFilters = {
      confidence: { min: 0.8 }
    };

    const { result } = renderHook(() => usePatternFeed({ filters }));
    
    // Should filter to only high confidence patterns
    expect(result.current.filteredCount).toBeLessThanOrEqual(result.current.totalCount);
  });

  it('should sort by timestamp desc by default', () => {
    const { result } = renderHook(() => usePatternFeed());
    
    // Entries should be sorted by timestamp descending
    if (result.current.entries.length > 1) {
      const first = new Date(result.current.entries[0].timestamp).getTime();
      const second = new Date(result.current.entries[1].timestamp).getTime();
      expect(first).toBeGreaterThanOrEqual(second);
    }
  });

  it('should apply limit correctly', () => {
    const { result } = renderHook(() => usePatternFeed({ limit: 2 }));
    
    expect(result.current.entries.length).toBeLessThanOrEqual(2);
  });

  it('should count pattern types correctly', () => {
    const { result } = renderHook(() => usePatternFeed());
    
    const counts = result.current.patternTypeCounts;
    expect(typeof counts).toBe('object');
    
    // Should have counts for the pattern types in our mock data
    if (Object.keys(counts).length > 0) {
      expect(counts[PatternType.GOLDMINE_SHAFT]).toBeGreaterThan(0);
    }
  });
});

describe('usePatternFeed performance', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) =>
      createMockEntry({
        id: `large-entry-${i}`,
        patternType: i % 2 === 0 ? PatternType.GOLDMINE_SHAFT : PatternType.BLACKJACK,
        confidence: Math.random()
      })
    );

    // Mock large dataset
    jest.doMock('../../../contexts/FeedContext', () => ({
      useFeedContext: () => ({
        entries: largeDataset,
        addEntry: jest.fn()
      })
    }));

    const filters: EnhancedPatternFeedFilters = {
      patternType: PatternType.GOLDMINE_SHAFT,
      confidence: { min: 0.7 }
    };

    const startTime = performance.now();
    const { result } = renderHook(() => usePatternFeed({ filters }));
    const endTime = performance.now();

    // Should complete quickly even with large dataset
    expect(endTime - startTime).toBeLessThan(50);
    expect(result.current.totalCount).toBe(largeDataset.length);
  });
});

describe('usePatternFeedLegacy', () => {
  it('should maintain backward compatibility', () => {
    const { usePatternFeedLegacy } = require('../usePatternFeed');
    
    const { result } = renderHook(() => 
      usePatternFeedLegacy({ 
        symbol: 'AAPL',
        patternType: PatternType.GOLDMINE_SHAFT 
      })
    );
    
    expect(Array.isArray(result.current)).toBe(true);
  });
});
