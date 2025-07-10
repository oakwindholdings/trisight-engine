# Supabase Integration Guide for TriSight

## Overview
This guide explains how to integrate Supabase caching into your TriSight application for improved performance and reduced API usage.

## Quick Start

### 1. Environment Setup

Since you've created the Supabase project through Vercel integration, your environment variables should be automatically available in production. For local development, create a `.env.local` file:

```bash
# Copy from Vercel Dashboard → Your Project → Settings → Environment Variables
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Apply Database Schema

Go to your Supabase Dashboard → SQL Editor and run the schema from `/supabase/schema.sql`.

### 3. Update Your Components

#### Option A: Gradual Migration (Recommended)

Keep existing code working while testing Supabase integration:

```typescript
// In components that need caching
import { useMarketDataWithSupabase } from '../hooks/useMarketDataWithSupabase';

// Replace the old hook
const { 
  data, 
  loading, 
  error, 
  fetchDateRange, 
  clearData,
  cachedSymbols,  // NEW: List of cached symbols
  isUsingCache    // NEW: Whether current data is from cache
} = useMarketDataWithSupabase();
```

#### Option B: Global Replacement

Update `MarketDataProvider` to use the new hook:

```typescript
// src/contexts/MarketDataContext.tsx
import { useMarketDataWithSupabase } from '../hooks/useMarketDataWithSupabase';

// In MarketDataProvider component
const marketDataHook = useMarketDataWithSupabase();
```

## Features

### 🚀 Automatic Caching
- First fetch from TwelveData → stored in Supabase
- Subsequent fetches → served from cache
- Incremental updates → only fetch new data

### 📊 Pre-computed Heikin-Ashi
- HA values calculated on insert via database triggers
- No client-side computation needed
- Consistent across all users

### 🔄 Smart Updates
- Intraday data: Updated every hour
- Daily data: Updated every 24 hours
- Manual refresh available via `forceRefresh` option

### 💾 Offline Support
- Falls back to cached data if API fails
- Shows last available data with timestamp

## Cache Status Component (Optional)

Add this component to show users when data is cached:

```typescript
// src/components/CacheStatus.tsx
import React from 'react';
import { useMarketDataContext } from '../contexts/MarketDataContext';

export const CacheStatus: React.FC = () => {
  const { isUsingCache, cachedSymbols } = useMarketDataContext();
  
  if (!isUsingCache) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-emerald-600">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
      </svg>
      <span>Using cached data</span>
    </div>
  );
};
```

## Performance Benefits

### Before (Direct API)
- Every user fetches same data
- ~2-5 second load time
- API rate limits
- No offline support

### After (With Supabase)
- Data fetched once, cached for all
- ~100-300ms load time
- Minimal API usage
- Works offline

## Monitoring

View cache performance in Supabase Dashboard:
1. Table Editor → `api_cache_status` → See cached symbols
2. Table Editor → `ohlcv_data` → View stored candles
3. SQL Editor → Run analytics queries

## Troubleshooting

### "Supabase not configured" warning
- Check `.env.local` has correct values
- Restart dev server after adding env vars

### Data not caching
- Check browser console for errors
- Verify RLS policies in Supabase Dashboard
- Ensure tables were created successfully

### Slow performance
- Check Supabase Dashboard → Database → Performance
- Consider adding indexes for frequently queried symbols

## Next Steps

1. **Test with a few symbols first**
   - Start with SPY, AAPL, GOOGL
   - Monitor cache hit rates

2. **Set up background updates** (coming soon)
   - Supabase Edge Functions for popular symbols
   - Scheduled updates for watchlists

3. **Add user preferences**
   - Save favorite symbols
   - Cache user's watchlist automatically

## Questions?

Check the Supabase Dashboard logs or reach out for support!
