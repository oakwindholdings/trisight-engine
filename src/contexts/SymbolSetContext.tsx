// src/contexts/SymbolSetContext.tsx
// Context for managing symbol set selection and state
// Provides active symbol set, loading state, and error handling

import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { getSymbolSet, getAllSymbolSets, SymbolPreset } from '../utils/symbolPresets';

interface SymbolSetContextType {
  currentSet: string | null;
  symbols: string[];
  loading: boolean;
  error: string | null;
  availableSets: SymbolPreset[];
  loadSymbolSet: (setId: string) => Promise<void>;
  clearError: () => void;
}

const SymbolSetContext = createContext<SymbolSetContextType | undefined>(undefined);

const STORAGE_KEY = 'trisight_active_symbol_set';

export const SymbolSetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSet, setCurrentSet] = useState<string | null>(() => {
    // Load persisted symbol set from localStorage
    try {
      return localStorage.getItem(STORAGE_KEY) || 'top-40';
    } catch {
      return 'top-40';
    }
  });

  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const availableSets = getAllSymbolSets();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadSymbolSet = useCallback(async (setId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate async load (in real app, this might be an API call)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const preset = getSymbolSet(setId);
      if (!preset) {
        throw new Error(`Symbol set '${setId}' not found`);
      }
      
      if (!preset.symbols || preset.symbols.length === 0) {
        throw new Error(`Symbol set '${setId}' is empty`);
      }
      
      setCurrentSet(setId);
      setSymbols(preset.symbols);
      localStorage.setItem(STORAGE_KEY, setId);
      
      // Emit custom event for other components to listen
      window.dispatchEvent(new CustomEvent('symbolSetChanged', {
        detail: { setId, symbols: preset.symbols }
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to load symbol set: ${errorMessage}`);
      console.error('[SymbolSetContext] Error loading symbol set:', err);
      
      // Reset to empty state on error
      setCurrentSet(null);
      setSymbols([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial symbol set on mount
  useEffect(() => {
    if (currentSet) {
      loadSymbolSet(currentSet);
    }
  }, []); // Only run on mount

  const value = {
    currentSet,
    symbols,
    loading,
    error,
    availableSets,
    loadSymbolSet,
    clearError
  };

  return (
    <SymbolSetContext.Provider value={value}>
      {children}
    </SymbolSetContext.Provider>
  );
};

export const useSymbolSet = () => {
  const context = useContext(SymbolSetContext);
  if (context === undefined) {
    throw new Error('useSymbolSet must be used within a SymbolSetProvider');
  }
  return context;
};

// Type for the symbol set changed event
export interface SymbolSetChangedEvent extends Event {
  detail: {
    setId: string;
    symbols: string[];
  };
}

// Helper to add type safety when listening to symbol set changes
export function addSymbolSetChangeListener(
  callback: (event: SymbolSetChangedEvent) => void
): () => void {
  const typedCallback = (event: Event) => {
    callback(event as SymbolSetChangedEvent);
  };
  
  window.addEventListener('symbolSetChanged', typedCallback);
  
  return () => {
    window.removeEventListener('symbolSetChanged', typedCallback);
  };
}
