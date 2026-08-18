// src/utils/supabase/client.ts
// Thin data-API helper module (Supabase client removed)
// Context: server owns all persistence now via same-origin /api/data/* routes (see server/routes/data.js)

import { Database } from './types';
import { logDebug } from '../debug';

/**
 * @deprecated The Supabase client has been removed. All persistence now goes through the
 * same-origin server data API (see server/routes/data.js). This export is kept only so
 * modules that have not yet been migrated off direct-client query chains (e.g.
 * `supabase.from(...).select()`) still compile; it is always null and any code path that
 * dereferences it should be migrated to a fetch() call against /api/data/*.
 */
export const supabase = null;

// Helper function to check if the data API is usable.
// The server API is always same-origin, so this is true whenever we're running in a browser.
export const isSupabaseConfigured = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Wrapper for data-API queries with error handling
 */
export async function supabaseQuery<T = any>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured()) {
    console.warn('Data API not configured - using fallback mode');
    return { data: null, error: null };
  }

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error('Data API query error:', error);
    return { data: null, error };
  }
}

// Batch insert helper for OHLCV data — POSTs to /api/data/ohlcv/batch in chunks of `batchSize`.
export async function batchInsertOHLCV(
  data: Database['public']['Tables']['ohlcv_data']['Insert'][],
  batchSize = 500
): Promise<Array<{ success: boolean; error?: any; data?: any; batch?: any[] }>> {
  logDebug('DEBUG_DATA_FETCH', `batchInsertOHLCV called with ${data.length} records`);

  const results: Array<{ success: boolean; error?: any; data?: any; batch?: any[] }> = [];

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    logDebug('DEBUG_DATA_FETCH', `Inserting batch ${i / batchSize + 1} with ${batch.length} records`);

    try {
      const response = await fetch('/api/data/ohlcv/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: response.statusText }));
        console.error(`[DEBUG_SUPABASE] Batch upsert error at index ${i}:`, errorBody);
        console.error('[DEBUG_SUPABASE] Failed batch sample:', batch[0]);
        results.push({ success: false, error: errorBody?.error ?? errorBody, batch });
      } else {
        const body = await response.json();
        const insertedData = body?.data;
        logDebug('DEBUG_DATA_FETCH', `Successfully upserted ${insertedData?.length || 0} records`);
        results.push({ success: true, data: insertedData });
      }
    } catch (err) {
      console.error('[DEBUG_SUPABASE] Exception during insert:', err);
      results.push({ success: false, error: err, batch });
    }
  }

  const successRate = (results.filter(r => r.success).length / results.length) * 100;
  logDebug('DEBUG_DATA_FETCH', `batchInsertOHLCV complete. Success rate: ${successRate.toFixed(2)}%`);

  return results;
}
