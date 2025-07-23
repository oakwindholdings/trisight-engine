// path // FeedContext.tsx // Holds local feed entries for offline / supabase fallback.

import React, { createContext, useContext, useState } from 'react';
import { PatternFeedEntry } from '../types/PatternFeedTypes';

interface FeedContextValue {
  entries: PatternFeedEntry[];
  addEntry: (e: PatternFeedEntry) => void;
}

const FeedContext = createContext<FeedContextValue>({
  entries: [],
  addEntry: () => {},
});

export const FeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<PatternFeedEntry[]>([]);

  const addEntry = (e: PatternFeedEntry) => {
    setEntries((prev) => [e, ...prev]);
  };

  return (
    <FeedContext.Provider value={{ entries, addEntry }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeedContext = () => useContext(FeedContext); 