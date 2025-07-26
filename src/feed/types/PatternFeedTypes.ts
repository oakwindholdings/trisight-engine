// path // PatternFeedTypes.ts // Pattern feed domain model and mapper for PatternBus events.

import { PatternEvent } from '../../hooks/usePatternBus';
import { MarketDataContext } from '../../contexts/MarketDataContext';
import { useContext } from 'react';

// Unique id generator – use crypto.randomUUID when available, fallback timestamp
const generateId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

// expose for helper
export { generateId };

/**
 * PatternFeedEventType – canonical routing buckets for every signal we emit into the feed.
 * ---------------------------------------------------------------------------
 * TRADE_ENTRY     – actionable buy/short trigger (produced by riskEngine / signalValidation)
 * STOP_EXIT       – stop-loss or cover event; usually terminates a TRADE_ENTRY
 * TRADE_BIAS      – non-actionable sentiment: LONG_BIAS / SHORT_BIAS etc.
 * PATTERN         – anything output directly from PatternBus detectors: ESCALATOR, SHAFT, BLACKJACK …
 * LABEL           – chart-only annotations (e.g. STEP#, ZONE) that still matter for replay/RAG.
 * CLUSTER_SIGNAL  – composite overlays (Conviction-Mass-Cloud, heat-maps). High information density.
 * FEEDBACK        – explicit human or ML feedback (pattern verified, thumbs-down, etc.)
 * SYSTEM_EVENT    – infrastructure / lifecycle notices: data-refresh, auto-scan complete, etc.
 */
export type PatternFeedEventType =
  | 'TRADE_ENTRY'
  | 'STOP_EXIT'
  | 'TRADE_BIAS'
  | 'PATTERN'
  | 'LABEL'
  | 'CLUSTER_SIGNAL'
  | 'FEEDBACK'
  | 'SYSTEM_EVENT';

// MCP-aligned feed entry. Keep this stable; add optional fields for forward-compat.
export interface PatternFeedEntry {
  id: string; // uuid (PK)
  symbol: string;
  sector?: string;
  patternType: string;
  eventType: PatternFeedEventType;
  confidence?: number | null;
  timestamp: string; // ISO 8601 string
  humanSummary: string;
  metadata?: Record<string, unknown> & {
    interval?: string; // Chart interval (1m, 5m, 15m, 1h, etc.)
  };
  renderHints?: {
    emphasis?: 'bull' | 'bear';
  };
  mcpVersion: '0.1.0';
  userId?: string;
}

// Time window options for filtering
export interface TimeWindow {
  label: string;
  value: string;
  minutes: number;
}

// Chart interval options
export interface ChartInterval {
  label: string;
  value: string;
}

// Enhanced filter interface with time and interval support
export interface EnhancedPatternFeedFilters {
  symbol?: string;
  patternType?: string;
  sector?: string;
  timeWindow?: string;
  interval?: string;
  confidence?: {
    min?: number;
    max?: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Thin mapper – evolve as PatternEvent grows. No heavy logic here; keep bus fast.
export function usePatternEventMapper() {
  const { symbol: currentSymbol } = useContext(MarketDataContext);

  return function patternEventToFeedEntry(evt: PatternEvent): PatternFeedEntry {
    let baseSymbol: string | undefined =
      (evt as any).symbol || (evt.data as any)?.symbol || (evt.data as any)?.ticker;

    if (!baseSymbol && currentSymbol) baseSymbol = currentSymbol;

    if (!baseSymbol) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PatternFeed] Event missing symbol', evt);
      }
      baseSymbol = 'UNKNOWN';
    }

    const confidence: number | undefined = (evt.data as any)?.confidence;

    return {
      id: generateId(),
      symbol: baseSymbol.toUpperCase(),
      patternType: evt.type,
      eventType: mapEventType(evt.type),
      confidence: confidence ?? null,
      timestamp: new Date(evt.timestamp || Date.now()).toISOString(),
      humanSummary: `${baseSymbol.toUpperCase()} triggered ${evt.type}`,
      metadata: evt.data as Record<string, unknown>,
      mcpVersion: '0.1.0'
    };
  };
}

function mapEventType(type: string): PatternFeedEventType {
  // Normalize obvious trade & system events first
  if (type === 'STOP_EVENT' || type === 'STOP_EXIT') return 'STOP_EXIT';
  if (type === 'TRADE_ENTRY') return 'TRADE_ENTRY';
  if (type === 'TRADE_BIAS') return 'TRADE_BIAS';

  // Composite overlays
  if (type === 'CMC' || type === 'CONVICTION_MASS_CLOUD') return 'CLUSTER_SIGNAL';

  // Labels – common suffixes
  if (type.endsWith('_LABEL') || type === 'LABEL' || type === 'ZONE') return 'LABEL';

  // Feedback / system
  if (type === 'FEEDBACK' || type === 'ADJUSTMENT') return 'FEEDBACK';
  if (type === 'SYSTEM_EVENT') return 'SYSTEM_EVENT';

  // Default bucket – raw detector patterns
  return 'PATTERN';
}

export { mapEventType }; 