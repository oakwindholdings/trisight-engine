// src/utils/supabase/client.ts
// Supabase client configuration for browser environment
// Uses environment variables from Vercel integration

import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { logDebug } from '../debug';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // We're not using auth redirects
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-application-name': 'trisight',
        },
      },
    }
  );
} else {
  console.warn('Supabase environment variables not found. Please check your .env file. Client not created.');
}

export { supabase };

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!supabase;
};

/**
 * Wrapper for Supabase queries with error handling
 */
export async function supabaseQuery<T = any>(
  queryFn: () => PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - using fallback mode');
    return { data: null, error: null };
  }

  try {
    const result = await queryFn();
    return result;
  } catch (error) {
    console.error('Supabase query error:', error);
    return { data: null, error };
  }
}

// Batch insert helper for OHLCV data
export async function batchInsertOHLCV(
  data: Database['public']['Tables']['ohlcv_data']['Insert'][],
  batchSize = 500
): Promise<Array<{ success: boolean; error?: any; data?: any; batch?: any[] }>> {
  logDebug('DEBUG_DATA_FETCH', `batchInsertOHLCV called with ${data.length} records`);
  
  if (!supabase) {
    console.error('[DEBUG_SUPABASE] Supabase client not initialized!');
    return [{ success: false, error: new Error('Supabase not initialized') }];
  }
  
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    logDebug('DEBUG_DATA_FETCH', `Inserting batch ${i/batchSize + 1} with ${batch.length} records`);
    
    try {
      const { data: insertedData, error } = await supabase
        .from('ohlcv_data')
        .upsert(batch, {
          onConflict: 'symbol,interval,timestamp',
          ignoreDuplicates: false // Update existing records
        })
        .select();
      
      if (error) {
        console.error(`[DEBUG_SUPABASE] Batch upsert error at index ${i}:`, error);
        console.error('[DEBUG_SUPABASE] Failed batch sample:', batch[0]);
        results.push({ success: false, error, batch });
      } else {
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
