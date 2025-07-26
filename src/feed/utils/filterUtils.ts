// src/feed/utils/filterUtils.ts
// High-performance filtering utilities for Pattern Feed
// Optimized for 10,000+ feed items with memoization

import { PatternFeedEntry, EnhancedPatternFeedFilters } from '../types/PatternFeedTypes';

/**
 * Parse ISO timestamp to milliseconds for time-based filtering
 */
export function parseTimestamp(timestamp: string): number {
  return new Date(timestamp).getTime();
}

/**
 * Check if entry falls within time window
 */
export function isWithinTimeWindow(
  entryTimestamp: string,
  timeWindowMinutes: number,
  currentTime: number = Date.now()
): boolean {
  if (timeWindowMinutes === 0) return true; // 'all' time window
  
  const entryTime = parseTimestamp(entryTimestamp);
  const windowStart = currentTime - (timeWindowMinutes * 60 * 1000);
  
  return entryTime >= windowStart;
}

/**
 * Extract interval from entry metadata or infer from context
 */
export function getEntryInterval(entry: PatternFeedEntry): string | undefined {
  // Check metadata first
  if (entry.metadata?.interval) {
    return entry.metadata.interval;
  }
  
  // Could infer from other metadata or context if needed
  return undefined;
}

/**
 * Check if confidence falls within range
 */
export function isWithinConfidenceRange(
  confidence: number | null | undefined,
  range?: { min?: number; max?: number }
): boolean {
  if (!range || (range.min === undefined && range.max === undefined)) return true;
  if (confidence == null) return false;
  
  const withinMin = range.min === undefined || confidence >= range.min;
  const withinMax = range.max === undefined || confidence <= range.max;
  
  return withinMin && withinMax;
}

/**
 * Single entry filter function - optimized for performance
 */
export function matchesFilters(
  entry: PatternFeedEntry,
  filters: EnhancedPatternFeedFilters,
  currentTime: number = Date.now()
): boolean {
  // Pattern type filter
  if (filters.patternType && entry.patternType !== filters.patternType) {
    return false;
  }
  
  // Symbol filter
  if (filters.symbol && entry.symbol !== filters.symbol) {
    return false;
  }
  
  // Sector filter
  if (filters.sector && entry.sector !== filters.sector) {
    return false;
  }
  
  // Time window filter
  if (filters.timeWindow) {
    const timeWindow = getTimeWindowMinutes(filters.timeWindow);
    if (!isWithinTimeWindow(entry.timestamp, timeWindow, currentTime)) {
      return false;
    }
  }
  
  // Interval filter
  if (filters.interval) {
    const entryInterval = getEntryInterval(entry);
    if (entryInterval !== filters.interval) {
      return false;
    }
  }
  
  // Confidence range filter
  if (!isWithinConfidenceRange(entry.confidence, filters.confidence)) {
    return false;
  }
  
  return true;
}

/**
 * Get time window in minutes from filter value
 */
export function getTimeWindowMinutes(timeWindow: string): number {
  const timeWindowMap: Record<string, number> = {
    'all': 0,
    '5m': 5,
    '15m': 15,
    '30m': 30,
    '1h': 60,
    '4h': 240,
    '24h': 1440,
  };
  
  return timeWindowMap[timeWindow] || 0;
}

/**
 * Batch filter function with performance optimizations
 */
export function filterEntries(
  entries: PatternFeedEntry[],
  filters: EnhancedPatternFeedFilters
): PatternFeedEntry[] {
  // Early return if no filters
  if (Object.keys(filters).length === 0) {
    return entries;
  }
  
  // Cache current time for consistent time-based filtering
  const currentTime = Date.now();
  
  // Use native filter for best performance
  return entries.filter(entry => matchesFilters(entry, filters, currentTime));
}

/**
 * Count entries by pattern type for filter UI
 */
export function countByPatternType(entries: PatternFeedEntry[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  for (const entry of entries) {
    counts[entry.patternType] = (counts[entry.patternType] || 0) + 1;
  }
  
  return counts;
}

/**
 * Get unique values for filter options
 */
export function getUniqueValues(entries: PatternFeedEntry[], field: keyof PatternFeedEntry): string[] {
  const values = new Set<string>();
  
  for (const entry of entries) {
    const value = entry[field];
    if (value && typeof value === 'string') {
      values.add(value);
    }
  }
  
  return Array.from(values).sort();
}

/**
 * Get unique intervals from entries
 */
export function getUniqueIntervals(entries: PatternFeedEntry[]): string[] {
  const intervals = new Set<string>();
  
  for (const entry of entries) {
    const interval = getEntryInterval(entry);
    if (interval) {
      intervals.add(interval);
    }
  }
  
  return Array.from(intervals).sort();
}

/**
 * Performance-optimized search function
 */
export function searchEntries(
  entries: PatternFeedEntry[],
  searchTerm: string,
  searchFields: (keyof PatternFeedEntry)[] = ['patternType', 'symbol', 'humanSummary']
): PatternFeedEntry[] {
  if (!searchTerm.trim()) return entries;
  
  const term = searchTerm.toLowerCase();
  
  return entries.filter(entry => {
    return searchFields.some(field => {
      const value = entry[field];
      return value && typeof value === 'string' && value.toLowerCase().includes(term);
    });
  });
}

/**
 * Sort entries by timestamp (newest first by default)
 */
export function sortEntries(
  entries: PatternFeedEntry[],
  sortBy: 'timestamp' | 'confidence' | 'patternType' = 'timestamp',
  direction: 'asc' | 'desc' = 'desc'
): PatternFeedEntry[] {
  return [...entries].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'timestamp':
        comparison = parseTimestamp(a.timestamp) - parseTimestamp(b.timestamp);
        break;
      case 'confidence':
        const aConf = a.confidence || 0;
        const bConf = b.confidence || 0;
        comparison = aConf - bConf;
        break;
      case 'patternType':
        comparison = a.patternType.localeCompare(b.patternType);
        break;
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Debounced filter function for real-time filtering
 */
export function createDebouncedFilter(
  callback: (entries: PatternFeedEntry[]) => void,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;
  
  return (entries: PatternFeedEntry[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback(entries), delay);
  };
}
