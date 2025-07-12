// src/components/SupabaseTestPanel.tsx
// Test panel to verify Supabase integration
// Shows cache status and performance metrics

import React, { useState } from 'react';
import { useMarketDataWithSupabase } from '../hooks/useMarketDataWithSupabase';
import { isSupabaseConfigured } from '../utils/supabase/client';

export const SupabaseTestPanel: React.FC = () => {
  const [symbol, setSymbol] = useState('SPY');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [fetchTime, setFetchTime] = useState<number | null>(null);
  
  const {
    data,
    loading,
    error,
    fetchDateRange,
    cachedSymbols,
    isUsingCache,
  } = useMarketDataWithSupabase();

  const handleFetch = async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    
    const startTimestamp = Date.now();
    setStartTime(startTimestamp);
    await fetchDateRange(start, end, '15min');
    setFetchTime(Date.now() - startTimestamp);
  };

  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Supabase Integration Test</h3>
      
      {/* Configuration Status */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${supabaseConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm">
            Supabase {supabaseConfigured ? 'Connected' : 'Not Configured'}
          </span>
        </div>
      </div>

      {/* Test Controls */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          className="px-3 py-1 border rounded"
          placeholder="Symbol"
        />
        <button
          onClick={handleFetch}
          disabled={loading || !supabaseConfigured}
          className="px-4 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Fetching...' : 'Fetch Data'}
        </button>
      </div>

      {/* Cache Status */}
      {cachedSymbols.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-1">Cached Symbols:</p>
          <div className="flex flex-wrap gap-1">
            {cachedSymbols.map(s => (
              <span key={s} className="px-2 py-1 bg-gray-100 rounded text-xs">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {data.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Data Points:</span>
            <span className="font-mono">{data.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm">Source:</span>
            <span className={`px-2 py-1 rounded text-xs ${
              isUsingCache ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isUsingCache ? 'Cache' : 'API'}
            </span>
          </div>
          
          {fetchTime && (
            <div className="flex items-center gap-2">
              <span className="text-sm">Fetch Time:</span>
              <span className="font-mono">{fetchTime}ms</span>
            </div>
          )}
          
          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
            <p>First: {data[0]?.timestamp.toLocaleString()}</p>
            <p>Last: {data[data.length - 1]?.timestamp.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 text-red-700 rounded text-sm">
          {error.message || error.toString()}
        </div>
      )}
    </div>
  );
};
