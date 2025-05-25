// src/hooks/useTwelveDataApiKey.ts
// Stores TwelveData API key locally
// Hydrates and persists key for API calls
import { useState, useEffect } from 'react';
import { setApiKey as setClientApiKey } from '../api/twelveDataApi';

const STORAGE_KEY = 'twelveDataApiKey';

export const useTwelveDataApiKey = () => {
  const [apiKey, setApiKeyState] = useState('');

  // Load key from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setApiKeyState(stored);
        setClientApiKey(stored);
      }
    } catch (e) {
      console.error('Failed to load TwelveData API key:', e);
    }
  }, []);

  // Update state, persist and notify API module
  const setApiKey = (key: string) => {
    setApiKeyState(key);
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch (e) {
      console.error('Failed to save TwelveData API key:', e);
    }
    setClientApiKey(key);
  };

  return { apiKey, setApiKey };
};

export default useTwelveDataApiKey;
