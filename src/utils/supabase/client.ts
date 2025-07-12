// src/utils/supabase/client.ts
// Supabase client configuration for browser environment
// Uses environment variables from Vercel integration

import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables not found. Please check your .env file.');
}

// Create Supabase client with proper typing
export const supabase = createClient<Database>(
  supabaseUrl || '',
  supabaseAnonKey || '',
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

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
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
  console.log('[DEBUG_SUPABASE] batchInsertOHLCV called with', data.length, 'records');
  
  if (!supabase) {
    console.error('[DEBUG_SUPABASE] Supabase client not initialized!');
    return [{ success: false, error: new Error('Supabase not initialized') }];
  }
  
  const results = [];
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    console.log('[DEBUG_SUPABASE] Inserting batch', i/batchSize + 1, 'with', batch.length, 'records');
    
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
        console.log(`[DEBUG_SUPABASE] Successfully upserted ${insertedData?.length || 0} records`);
        results.push({ success: true, data: insertedData });
      }
    } catch (err) {
      console.error('[DEBUG_SUPABASE] Exception during insert:', err);
      results.push({ success: false, error: err, batch });
    }
  }
  
  console.log('[DEBUG_SUPABASE] batchInsertOHLCV complete. Success rate:', 
    results.filter(r => r.success).length, '/', results.length);
  
  return results;
}
