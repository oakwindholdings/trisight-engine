// path // usePatternFeedIngest.ts // Hook to mirror PatternBus events into Supabase feed.

import { useEffect, useRef } from 'react';
import { usePatternContext } from '../../contexts/PatternContext';
import { persistFeedEntry } from '../db/patternFeedService';
import { usePatternEventMapper } from '../types/PatternFeedTypes';
import { useFeedContext } from '../contexts/FeedContext';

/**
 * Hook that listens to PatternContext events and forwards them to Supabase.
 * @param enabled Toggle ingestion on/off (feature flag).
 */
export function usePatternFeedIngest(enabled = true): void {
  const { events } = usePatternContext();
  const { addEntry } = useFeedContext();
  const toFeedEntry = usePatternEventMapper();

  // Track which event timestamps we've already processed to avoid duplicates.
  const processed = useRef<Set<number>>(new Set());
  const lastEventCount = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    // Only process new events added since last check
    const newEvents = events.slice(lastEventCount.current);
    lastEventCount.current = events.length;

    newEvents.forEach((evt) => {
      if (processed.current.has(evt.timestamp)) return;
      processed.current.add(evt.timestamp);

      const feedEntry = toFeedEntry(evt as any);
      // Commented out to prevent console spam
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('[PatternFeed] Ingest event', evt.type, feedEntry);
      // }
      addEntry(feedEntry); // local store
      persistFeedEntry(feedEntry);
    });
  }, [events, enabled, toFeedEntry, addEntry]);
} 