// src/utils/supabase/types.ts
// TypeScript types for Supabase database schema
// Auto-generated types can be replaced with Supabase CLI generated types later

export interface SymbolMetadata {
  id: string;
  symbol: string;
  name?: string;
  exchange?: string;
  currency?: string;
  type?: string;
  sector?: string;
  industry?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OHLCVData {
  id: string;
  symbol: string;
  interval: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ha_open?: number;
  ha_high?: number;
  ha_low?: number;
  ha_close?: number;
  created_at: string;
}

export interface ApiCacheStatus {
  id: string;
  symbol: string;
  interval: string;
  first_timestamp: string;
  last_timestamp: string;
  last_fetch_at: string;
  fetch_count: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PatternCache {
  id: string;
  symbol: string;
  interval: string;
  pattern_type: string;
  start_timestamp: string;
  end_timestamp: string;
  start_index: number;
  end_index: number;
  confidence?: number;
  direction?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface TradeSignal {
  id: string;
  pattern_id?: string;
  symbol: string;
  interval: string;
  signal_type: string;
  signal_timestamp: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit?: number;
  confidence?: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserWatchlist {
  id: string;
  user_id?: string;
  name: string;
  symbols: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface FetchQueue {
  id: string;
  symbol: string;
  interval: string;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  last_attempt_at?: string;
  attempt_count: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

// Database type mapping
export interface Database {
  public: {
    Tables: {
      symbol_metadata: {
        Row: SymbolMetadata;
        Insert: Omit<SymbolMetadata, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SymbolMetadata, 'id' | 'created_at' | 'updated_at'>>;
      };
      ohlcv_data: {
        Row: OHLCVData;
        Insert: Omit<OHLCVData, 'id' | 'created_at' | 'ha_open' | 'ha_high' | 'ha_low' | 'ha_close'>;
        Update: Partial<Omit<OHLCVData, 'id' | 'created_at'>>;
      };
      api_cache_status: {
        Row: ApiCacheStatus;
        Insert: Omit<ApiCacheStatus, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ApiCacheStatus, 'id' | 'created_at' | 'updated_at'>>;
      };
      pattern_cache: {
        Row: PatternCache;
        Insert: Omit<PatternCache, 'id' | 'created_at'>;
        Update: Partial<Omit<PatternCache, 'id' | 'created_at'>>;
      };
      trade_signals: {
        Row: TradeSignal;
        Insert: Omit<TradeSignal, 'id' | 'created_at'>;
        Update: Partial<Omit<TradeSignal, 'id' | 'created_at'>>;
      };
      user_watchlists: {
        Row: UserWatchlist;
        Insert: Omit<UserWatchlist, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserWatchlist, 'id' | 'created_at' | 'updated_at'>>;
      };
      fetch_queue: {
        Row: FetchQueue;
        Insert: Omit<FetchQueue, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<FetchQueue, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Interval mapping for consistency
export const INTERVAL_MAP = {
  '1m': '1min',
  '5m': '5min',
  '15m': '15min',
  '1h': '1h',
  '1d': '1day',
  '1D': '1day',
  'daily': '1day',
  '1W': '1week',
  'weekly': '1week',
  '1M': '1month',
  'monthly': '1month'
} as const;

export type IntervalKey = keyof typeof INTERVAL_MAP;
export type IntervalValue = typeof INTERVAL_MAP[IntervalKey];
