// path // usePatternFeed.ts // Real-time consumer hook for pattern_feed table.

import { useEffect, useState } from 'react';
import { subscribeToFeed } from '../db/patternFeedService';
import { PatternFeedEntry } from '../types/PatternFeedTypes';
import { useFeedContext } from '../contexts/FeedContext';

function snakeToCamelObj<T = any>(obj: Record<string, any>): T {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = value;
  }
  return out as T;
}

export interface PatternFeedFilters {
  symbol?: string;
  patternType?: string;
  sector?: string;
}

export function usePatternFeed(filters?: PatternFeedFilters) {
  const [entries, setEntries] = useState<PatternFeedEntry[]>([]);
  const { entries: localEntries, addEntry } = useFeedContext();

  useEffect(() => {
    const subscription = subscribeToFeed((row) => {
      const camelRow = snakeToCamelObj<PatternFeedEntry>(row as any);
      setEntries((prev) => [camelRow, ...prev]);
    });
    return () => {
      if ('unsubscribe' in subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // merge local entries and real-time ones, de-duplicate by id
  const combined = [...localEntries, ...entries.filter((e) => !localEntries.some((l) => l.id === e.id))];

  return filters
    ? combined.filter(
        (e) =>
          (!filters.symbol || e.symbol === filters.symbol) &&
          (!filters.patternType || e.patternType === filters.patternType) &&
          (!filters.sector || e.sector === filters.sector)
      )
    : combined;
} 