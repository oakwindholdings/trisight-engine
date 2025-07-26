// src/feed/utils/__tests__/filterUtils.test.ts
// Comprehensive tests for filtering utilities
// Tests performance, edge cases, and correctness

import {
  parseTimestamp,
  isWithinTimeWindow,
  getEntryInterval,
  isWithinConfidenceRange,
  matchesFilters,
  filterEntries,
  countByPatternType,
  getUniqueValues,
  sortEntries
} from '../filterUtils';
import { PatternFeedEntry, EnhancedPatternFeedFilters } from '../../types/PatternFeedTypes';
import { PatternType } from '../../../models/PatternTypes';

// Mock data for testing
const createMockEntry = (overrides: Partial<PatternFeedEntry> = {}): PatternFeedEntry => ({
  id: 'test-id',
  symbol: 'AAPL',
  patternType: PatternType.GOLDMINE_SHAFT,
  eventType: 'PATTERN' as any,
  timestamp: new Date().toISOString(),
  humanSummary: 'Test pattern',
  mcpVersion: '0.1.0' as const,
  ...overrides
});

describe('filterUtils', () => {
  describe('parseTimestamp', () => {
    it('should parse ISO timestamp correctly', () => {
      const timestamp = '2024-01-15T10:30:00.000Z';
      const result = parseTimestamp(timestamp);
      expect(result).toBe(new Date(timestamp).getTime());
    });

    it('should handle different timestamp formats', () => {
      const timestamps = [
        '2024-01-15T10:30:00Z',
        '2024-01-15T10:30:00.123Z',
        '2024-01-15T10:30:00+00:00'
      ];
      
      timestamps.forEach(ts => {
        expect(typeof parseTimestamp(ts)).toBe('number');
        expect(parseTimestamp(ts)).toBeGreaterThan(0);
      });
    });
  });

  describe('isWithinTimeWindow', () => {
    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();
    const tenMinutesAgo = new Date(now - 10 * 60 * 1000).toISOString();

    it('should return true for "all" time window', () => {
      expect(isWithinTimeWindow(tenMinutesAgo, 0, now)).toBe(true);
    });

    it('should return true for entries within time window', () => {
      expect(isWithinTimeWindow(fiveMinutesAgo, 15, now)).toBe(true);
    });

    it('should return false for entries outside time window', () => {
      expect(isWithinTimeWindow(tenMinutesAgo, 5, now)).toBe(false);
    });
  });

  describe('getEntryInterval', () => {
    it('should extract interval from metadata', () => {
      const entry = createMockEntry({
        metadata: { interval: '5m' }
      });
      expect(getEntryInterval(entry)).toBe('5m');
    });

    it('should return undefined if no interval in metadata', () => {
      const entry = createMockEntry();
      expect(getEntryInterval(entry)).toBeUndefined();
    });
  });

  describe('isWithinConfidenceRange', () => {
    it('should return true when no range specified', () => {
      expect(isWithinConfidenceRange(0.5)).toBe(true);
      expect(isWithinConfidenceRange(0.5, {})).toBe(true);
    });

    it('should handle min confidence correctly', () => {
      expect(isWithinConfidenceRange(0.8, { min: 0.7 })).toBe(true);
      expect(isWithinConfidenceRange(0.6, { min: 0.7 })).toBe(false);
    });

    it('should handle max confidence correctly', () => {
      expect(isWithinConfidenceRange(0.6, { max: 0.7 })).toBe(true);
      expect(isWithinConfidenceRange(0.8, { max: 0.7 })).toBe(false);
    });

    it('should handle range correctly', () => {
      expect(isWithinConfidenceRange(0.75, { min: 0.7, max: 0.8 })).toBe(true);
      expect(isWithinConfidenceRange(0.6, { min: 0.7, max: 0.8 })).toBe(false);
      expect(isWithinConfidenceRange(0.9, { min: 0.7, max: 0.8 })).toBe(false);
    });

    it('should return false for null confidence with range', () => {
      expect(isWithinConfidenceRange(null, { min: 0.5 })).toBe(false);
      expect(isWithinConfidenceRange(undefined, { min: 0.5 })).toBe(false);
    });
  });

  describe('matchesFilters', () => {
    const baseEntry = createMockEntry({
      patternType: PatternType.GOLDMINE_SHAFT,
      symbol: 'AAPL',
      sector: 'Technology',
      confidence: 0.8,
      metadata: { interval: '5m' }
    });

    it('should match entry with no filters', () => {
      expect(matchesFilters(baseEntry, {})).toBe(true);
    });

    it('should filter by pattern type', () => {
      const filters: EnhancedPatternFeedFilters = {
        patternType: PatternType.GOLDMINE_SHAFT
      };
      expect(matchesFilters(baseEntry, filters)).toBe(true);

      const filters2: EnhancedPatternFeedFilters = {
        patternType: PatternType.BLACKJACK
      };
      expect(matchesFilters(baseEntry, filters2)).toBe(false);
    });

    it('should filter by symbol', () => {
      const filters: EnhancedPatternFeedFilters = { symbol: 'AAPL' };
      expect(matchesFilters(baseEntry, filters)).toBe(true);

      const filters2: EnhancedPatternFeedFilters = { symbol: 'MSFT' };
      expect(matchesFilters(baseEntry, filters2)).toBe(false);
    });

    it('should filter by confidence range', () => {
      const filters: EnhancedPatternFeedFilters = {
        confidence: { min: 0.7, max: 0.9 }
      };
      expect(matchesFilters(baseEntry, filters)).toBe(true);

      const filters2: EnhancedPatternFeedFilters = {
        confidence: { min: 0.9 }
      };
      expect(matchesFilters(baseEntry, filters2)).toBe(false);
    });

    it('should filter by interval', () => {
      const filters: EnhancedPatternFeedFilters = { interval: '5m' };
      expect(matchesFilters(baseEntry, filters)).toBe(true);

      const filters2: EnhancedPatternFeedFilters = { interval: '1h' };
      expect(matchesFilters(baseEntry, filters2)).toBe(false);
    });
  });

  describe('filterEntries', () => {
    const entries = [
      createMockEntry({
        id: '1',
        patternType: PatternType.GOLDMINE_SHAFT,
        symbol: 'AAPL',
        confidence: 0.8
      }),
      createMockEntry({
        id: '2',
        patternType: PatternType.BLACKJACK,
        symbol: 'MSFT',
        confidence: 0.6
      }),
      createMockEntry({
        id: '3',
        patternType: PatternType.GOLDMINE_SHAFT,
        symbol: 'AAPL',
        confidence: 0.9
      })
    ];

    it('should return all entries with no filters', () => {
      const result = filterEntries(entries, {});
      expect(result).toHaveLength(3);
    });

    it('should filter by pattern type', () => {
      const filters: EnhancedPatternFeedFilters = {
        patternType: PatternType.GOLDMINE_SHAFT
      };
      const result = filterEntries(entries, filters);
      expect(result).toHaveLength(2);
      expect(result.every(e => e.patternType === PatternType.GOLDMINE_SHAFT)).toBe(true);
    });

    it('should filter by multiple criteria', () => {
      const filters: EnhancedPatternFeedFilters = {
        patternType: PatternType.GOLDMINE_SHAFT,
        symbol: 'AAPL',
        confidence: { min: 0.85 }
      };
      const result = filterEntries(entries, filters);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('3');
    });
  });

  describe('countByPatternType', () => {
    const entries = [
      createMockEntry({ patternType: PatternType.GOLDMINE_SHAFT }),
      createMockEntry({ patternType: PatternType.GOLDMINE_SHAFT }),
      createMockEntry({ patternType: PatternType.BLACKJACK }),
    ];

    it('should count patterns correctly', () => {
      const counts = countByPatternType(entries);
      expect(counts[PatternType.GOLDMINE_SHAFT]).toBe(2);
      expect(counts[PatternType.BLACKJACK]).toBe(1);
      expect(counts[PatternType.PIVOT]).toBeUndefined();
    });
  });

  describe('sortEntries', () => {
    const entries = [
      createMockEntry({
        id: '1',
        timestamp: '2024-01-15T10:00:00Z',
        confidence: 0.6,
        patternType: PatternType.BLACKJACK
      }),
      createMockEntry({
        id: '2',
        timestamp: '2024-01-15T11:00:00Z',
        confidence: 0.8,
        patternType: PatternType.GOLDMINE_SHAFT
      }),
      createMockEntry({
        id: '3',
        timestamp: '2024-01-15T09:00:00Z',
        confidence: 0.9,
        patternType: PatternType.PIVOT
      })
    ];

    it('should sort by timestamp desc by default', () => {
      const result = sortEntries(entries);
      expect(result[0].id).toBe('2'); // 11:00
      expect(result[1].id).toBe('1'); // 10:00
      expect(result[2].id).toBe('3'); // 09:00
    });

    it('should sort by confidence desc', () => {
      const result = sortEntries(entries, 'confidence', 'desc');
      expect(result[0].confidence).toBe(0.9);
      expect(result[1].confidence).toBe(0.8);
      expect(result[2].confidence).toBe(0.6);
    });

    it('should sort by pattern type asc', () => {
      const result = sortEntries(entries, 'patternType', 'asc');
      expect(result[0].patternType).toBe(PatternType.BLACKJACK);
      expect(result[1].patternType).toBe(PatternType.GOLDMINE_SHAFT);
      expect(result[2].patternType).toBe(PatternType.PIVOT);
    });
  });

  describe('Performance tests', () => {
    it('should handle large datasets efficiently', () => {
      // Create 10,000 mock entries
      const largeDataset = Array.from({ length: 10000 }, (_, i) =>
        createMockEntry({
          id: `entry-${i}`,
          patternType: i % 2 === 0 ? PatternType.GOLDMINE_SHAFT : PatternType.BLACKJACK,
          confidence: Math.random()
        })
      );

      const filters: EnhancedPatternFeedFilters = {
        patternType: PatternType.GOLDMINE_SHAFT,
        confidence: { min: 0.7 }
      };

      const startTime = performance.now();
      const result = filterEntries(largeDataset, filters);
      const endTime = performance.now();

      // Should complete within reasonable time (< 100ms for 10k items)
      expect(endTime - startTime).toBeLessThan(100);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every(e => 
        e.patternType === PatternType.GOLDMINE_SHAFT && 
        (e.confidence || 0) >= 0.7
      )).toBe(true);
    });
  });
});
