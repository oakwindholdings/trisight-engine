// path // usePatternFeed.ts // Real-time consumer hook for pattern_feed table with enhanced filtering.

import { useEffect, useState, useMemo } from 'react';
import { subscribeToFeed } from '../db/patternFeedService';
import { PatternFeedEntry, EnhancedPatternFeedFilters } from '../types/PatternFeedTypes';
import { useFeedContext } from '../contexts/FeedContext';
import { filterEntries, countByPatternType, sortEntries } from '../utils/filterUtils';

function snakeToCamelObj<T = any>(obj: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out as T;
}

// Legacy interface for backward compatibility
export interface PatternFeedFilters {
  symbol?: string;
  patternType?: string;
  sector?: string;
}

export interface UsePatternFeedOptions {
  filters?: EnhancedPatternFeedFilters;
  sortBy?: 'timestamp' | 'confidence' | 'patternType';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

export interface UsePatternFeedResult {
  entries: PatternFeedEntry[];
  filteredCount: number;
  totalCount: number;
  patternTypeCounts: Record<string, number>;
  isLoading: boolean;
}

// Enhanced hook with filtering, sorting, and performance optimizations
export function usePatternFeed(
  options: UsePatternFeedOptions = {}
): UsePatternFeedResult {
  const { filters, sortBy = 'timestamp', sortDirection = 'desc', limit } = options;
  const [entries, setEntries] = useState<PatternFeedEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { entries: localEntries } = useFeedContext();

  useEffect(() => {
    const subscription = subscribeToFeed((row) => {
      const camelRow = snakeToCamelObj<PatternFeedEntry>(row as any);
      setEntries((prev) => [camelRow, ...prev]);
    });

    // Set loading to false after initial subscription
    setIsLoading(false);

    return () => {
      if ('unsubscribe' in subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Memoized combined entries (local + remote, deduplicated)
  const combinedEntries = useMemo(() => {
    return [...localEntries, ...entries.filter((e) => !localEntries.some((l) => l.id === e.id))];
  }, [localEntries, entries]);

  // Memoized pattern type counts for all entries
  const patternTypeCounts = useMemo(() => {
    return countByPatternType(combinedEntries);
  }, [combinedEntries]);

  // Memoized filtered and sorted entries
  const processedEntries = useMemo(() => {
    let result = combinedEntries;

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      result = filterEntries(result, filters);
    }

    // Apply sorting
    result = sortEntries(result, sortBy, sortDirection);

    // Apply limit
    if (limit && limit > 0) {
      result = result.slice(0, limit);
    }

    return result;
  }, [combinedEntries, filters, sortBy, sortDirection, limit]);

  return {
    entries: processedEntries,
    filteredCount: processedEntries.length,
    totalCount: combinedEntries.length,
    patternTypeCounts,
    isLoading,
  };
}

// Legacy function for backward compatibility
export function usePatternFeedLegacy(filters?: PatternFeedFilters): PatternFeedEntry[] {
  const enhancedFilters: EnhancedPatternFeedFilters = filters || {};
  const { entries } = usePatternFeed({ filters: enhancedFilters });
  return entries;
}