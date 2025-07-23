// path // emitPatternFeedSignal.ts // Helper to push any pattern signal into PatternBus and feed.

import { persistFeedEntry } from '../feed/db/patternFeedService';
import { mapEventType, generateId } from '../feed/types/PatternFeedTypes';
import { PatternEvent } from '../hooks/usePatternBus';

/**
 * Fire-and-forget feed emission. Emits to PatternBus for local consumers, then
 * immediately persists a PatternFeedEntry to Supabase (via feed ingest). All on
 * the UI thread; no await.
 */
export function emitPatternFeedSignal(
  rawType: string,
  data: any,
  symbol?: string,
  overrideEventType?: string
) {
  const evt: PatternEvent = {
    type: rawType as any,
    data: { symbol, ...data },
    timestamp: Date.now(),
  } as PatternEvent;

  // Build feed entry and persist
  // Accept explicit symbol when provided, but treat "UNKNOWN" or empty strings as missing
  let finalSymbol = symbol;
  if (!finalSymbol || finalSymbol === 'UNKNOWN') {
    if (typeof window !== 'undefined') {
      finalSymbol = (window as any).trisightSymbol;
      if (!finalSymbol || finalSymbol === 'UNKNOWN') {
        try {
          const stored = localStorage.getItem('trisight_navbar_symbol_info');
          if (stored) finalSymbol = JSON.parse(stored).symbol;
        } catch {}
      }
    }
  }
  // Final fallback
  if (!finalSymbol) finalSymbol = 'UNKNOWN';
  const entry = {
    id: generateId(),
    symbol: finalSymbol,
    sector: data?.sector ?? null,
    pattern_type: rawType,
    event_type: overrideEventType ?? mapEventType(rawType),
    confidence: data?.confidence ?? null,
    timestamp: new Date(evt.timestamp).toISOString(),
    human_summary: `${finalSymbol} triggered ${rawType}`,
    metadata: data,
    render_hints: data?.renderHints ?? null,
    mcp_version: '0.1.0',
    user_id: data?.userId ?? null,
  } as any;
  persistFeedEntry(entry);

  // Dev log (once per patternType per session)
  if (process.env.NODE_ENV === 'development') {
    const w = window as any;
    w.__feedEmitted = w.__feedEmitted || new Set();
    if (!w.__feedEmitted.has(rawType)) {
      console.log(`[FEED] Emitted ${rawType} for`, symbol);
      w.__feedEmitted.add(rawType);
    }
  }
} 