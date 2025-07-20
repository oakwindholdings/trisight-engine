// src/utils/feed/patternFeed.ts
// Emits pattern events detected by AdaptivePatternDetectionService to Supabase
// and provides a thin wrapper for local development diagnostics.

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { Pattern } from '../../models/PatternTypes';

export interface PatternFeedRow {
  id: string;
  symbol: string;
  patternType: string;
  eventType: string; // e.g. 'PATTERN'
  confidence: number;
  timestamp: string; // ISO string
  humanSummary: string;
  metadata: Record<string, any>;
  mcpVersion: string;
}

/**
 * Inserts a single pattern event into the `pattern_feed` table.
 * Falls back to console logging when Supabase is not configured.
 */
export async function emitPatternFeedEvent(pattern: Pattern): Promise<void> {
  const symbol = (pattern as any).symbol || (pattern as any).ticker || 'UNKNOWN';
  const row: PatternFeedRow = {
    id: pattern.id,
    symbol,
    patternType: pattern.type,
    eventType: 'PATTERN',
    confidence: pattern.confidence,
    timestamp: pattern.endTime.toISOString(),
    humanSummary: `${symbol} triggered ${pattern.type}`,
    metadata: pattern as unknown as Record<string, any>,
    mcpVersion: '0.1.0'
  };

  // Development log – always output so diagnostics can be filtered easily.
  // eslint-disable-next-line no-console
  console.log(`[FEED] Emitting ${pattern.type} for ${symbol} (conf ${pattern.confidence.toFixed(2)})`);

  if (!isSupabaseConfigured()) return;

  try {
    const { error } = await supabase!.from('pattern_feed').insert([row]);
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[PatternFeed] Supabase insert error:', error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[PatternFeed] Exception during Supabase insert', e);
  }
}