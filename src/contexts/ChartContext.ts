// src/contexts/ChartContext.ts
// Chart context for symbol sync between components
// Enables row click → Chart Tab navigation with symbol context

import React, { createContext, useContext, useState } from 'react';

interface ChartContextType {
  currentSymbol: string;
  setSymbol: (s: string) => void;
}

export const ChartContext = createContext<ChartContextType>({
  currentSymbol: '',
  setSymbol: () => {}
});

export const useChartContext = () => useContext(ChartContext);

export const ChartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSymbol, setSymbol] = useState('');
  
  console.log('[ChartProvider] Rendering with symbol:', currentSymbol);
  
  try {
    return React.createElement(
      ChartContext.Provider,
      { value: { currentSymbol, setSymbol } },
      children
    );
  } catch (error) {
    console.error('[ChartProvider] Error rendering:', error);
    return children as React.ReactElement;
  }
};
