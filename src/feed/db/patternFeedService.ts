// path // patternFeedService.ts // Data-API interaction helpers for PatternFeed.
// Context: Fetch-based replacement for the former Supabase client — insert stays a
// fire-and-forget POST; the former realtime channel subscription is now polling.

import { PatternFeedEntry } from '../types/PatternFeedTypes';

// How often we poll for new feed rows while "subscribed".
const POLL_INTERVAL_MS = 5000;

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
  const dbEntry = toSnakeCaseObj(entry);

  // Fire-and-forget insert
  void fetch('/api/data/feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dbEntry),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        console.error('[PatternFeed] insert error:', body.error || res.statusText);
      }
    })
    .catch((error) => {
      console.error('[PatternFeed] insert error:', error);
    });
}

/**
 * Subscribe to new pattern_feed rows. The former Supabase realtime channel
 * ('postgres_changes' INSERT) is replaced with polling: every POLL_INTERVAL_MS
 * we fetch rows created since the last row we saw and deliver them oldest-first
 * to `onRow`, one at a time, to mimic discrete INSERT events.
 *
 * Only rows created after the subscription starts are delivered — no historical
 * backfill — matching the semantics of the realtime subscription it replaces.
 *
 * Caller is responsible for unsubscribing (via the returned unsubscribe()) when
 * the component unmounts.
 */
export function subscribeToFeed(
  onRow: (entry: PatternFeedEntry) => void
) {
  let since = new Date().toISOString();
  let stopped = false;
  let inFlight = false;
  // Guards against redelivering rows that land exactly on the `since` boundary
  // if the server-side filter is inclusive.
  let lastDeliveredIds = new Set<string>();

  const poll = async () => {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const params = new URLSearchParams({ since, limit: '200' });
      const res = await fetch(`/api/data/feed/recent?${params.toString()}`);
      if (stopped) return;

      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        console.error('[PatternFeed] poll error:', body.error || res.statusText);
        return;
      }

      const { data } = await res.json();
      const rows: Record<string, any>[] = Array.isArray(data) ? data : [];
      if (rows.length === 0) return;

      // Rows arrive newest-first; deliver oldest-first to mimic sequential INSERT events.
      const oldestFirst = [...rows].reverse();
      const deliveredIds = new Set<string>();

      for (const row of oldestFirst) {
        if (row.id && lastDeliveredIds.has(row.id)) continue;
        onRow(row as PatternFeedEntry);
        if (row.id) deliveredIds.add(row.id);
      }

      lastDeliveredIds = deliveredIds;

      // Advance the watermark to the newest row's creation time.
      const newest = rows[0];
      const newestTimestamp = newest?.created_at || newest?.timestamp;
      if (newestTimestamp) {
        since = newestTimestamp;
      }
    } catch (error) {
      console.error('[PatternFeed] poll error:', error);
    } finally {
      inFlight = false;
    }
  };

  const intervalId = setInterval(poll, POLL_INTERVAL_MS);

  return {
    unsubscribe: () => {
      stopped = true;
      clearInterval(intervalId);
    },
  };
}
