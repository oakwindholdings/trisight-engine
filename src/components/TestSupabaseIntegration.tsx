// src/components/TestSupabaseIntegration.tsx
// Test component to verify global Supabase integration
// Displays current market data context state

import React from 'react';
import { useMarketDataContext } from '../contexts/MarketDataContext';

export const TestSupabaseIntegration: React.FC = () => {
  const context = useMarketDataContext();
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: 'white', 
      border: '2px solid #10b981',
      borderRadius: 8,
      padding: 16,
      maxWidth: 300,
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Supabase Integration Status</h4>
      <div style={{ fontSize: 14 }}>
        <p><strong>Symbol:</strong> {context.symbol}</p>
        <p><strong>Timeframe:</strong> {context.timeframe}</p>
        <p><strong>Data Points:</strong> {context.data?.length || 0}</p>
        <p><strong>Loading:</strong> {context.loading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {context.error?.message || 'None'}</p>
        <p><strong>Using Cache:</strong> {context.isUsingCache ? 'Yes' : 'No'}</p>
        <p><strong>Cached Symbols:</strong> {context.cachedSymbols?.join(', ') || 'None'}</p>
      </div>
      <button 
        onClick={() => context.refresh()}
        style={{
          marginTop: 8,
          padding: '4px 12px',
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer'
        }}
      >
        Refresh Data
      </button>
    </div>
  );
};
