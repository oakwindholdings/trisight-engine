// path // patternFeedService.ts // Supabase interaction helpers for PatternFeed.

import { supabase, isSupabaseConfigured } from '../../utils/supabase/client';
import { PatternFeedEntry } from '../types/PatternFeedTypes';

/**
 * Non-blocking insert: we intentionally do NOT await the promise to avoid
 * tail-latency on the PatternBus thread.
 */
// Convert camelCase object keys to snake_case recursively (shallow for expected payload)
function toSnakeCaseObj(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase());
    out[snake] = value;
  }
  return out;
}

export function persistFeedEntry(entry: PatternFeedEntry): void {
  if (!isSupabaseConfigured() || !supabase) return;

  const dbEntry = toSnakeCaseObj(entry);

  // Fire-and-forget insert
  void supabase
    .from('pattern_feed')
    .insert(dbEntry)
    .then(({ error }) => {
      if (error) console.error('[PatternFeed] Supabase insert error:', error);
    });
}

/**
 * Subscribe to INSERT events on the pattern_feed table. Caller is responsible
 * for unsubscribing when the component unmounts.
 */
export function subscribeToFeed(
  onRow: (entry: PatternFeedEntry) => void
) {
  if (!isSupabaseConfigured() || !supabase) {
    return { unsubscribe: () => {} } as const;
  }

  const sub = supabase
    .channel('pattern_feed')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pattern_feed' },
      (payload) => {
        onRow(payload.new as PatternFeedEntry);
      }
    )
    .subscribe();

  return sub;
} 