// src/hooks/useTwelveDataApiKey.ts
// Stores TwelveData API key locally
// Hydrates and persists key for API calls
import { useState, useEffect } from 'react';
import { setApiKey as setClientApiKey } from '../api/marketApi';
import { logDebug } from '../utils/debug';

const STORAGE_KEY = 'twelveDataApiKey';

export const useTwelveDataApiKey = () => {
  const [apiKey, setApiKeyState] = useState('');

  // Load key from localStorage on mount
  useEffect(() => {
    try {
      logDebug('DEBUG_DATA_FETCH', '[useTwelveDataApiKey] Loading API key from localStorage...');
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        logDebug('DEBUG_DATA_FETCH', '[useTwelveDataApiKey] Found API key in localStorage: ' + stored.substring(0, 8) + '...');
        setApiKeyState(stored);
        setClientApiKey(stored);
      } else {
        logDebug('DEBUG_DATA_FETCH', '[useTwelveDataApiKey] No API key found in localStorage');
      }
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logDebug('DEBUG_DATA_FETCH', 'Failed to load TwelveData API key: ' + errorMessage);
    }
  }, []);

  // Update state, persist and notify API module
  const setApiKey = (key: string) => {
    setApiKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      logDebug('DEBUG_DATA_FETCH', 'Failed to save TwelveData API key: ' + errorMessage);
    }
    setClientApiKey(key);
  };

  return { apiKey, setApiKey };
};

export default useTwelveDataApiKey;
