// path // PatternFeedBridge.tsx // Attaches PatternBus→Feed ingest inside proper provider hierarchy.

import React from 'react';
import { usePatternFeedIngest } from '../hooks/usePatternFeedIngest';
 
export const PatternFeedBridge: React.FC = () => {
  const ENABLE = process.env.REACT_APP_ENABLE_PATTERN_FEED !== 'false';
  usePatternFeedIngest(ENABLE);
  return null;
}; 