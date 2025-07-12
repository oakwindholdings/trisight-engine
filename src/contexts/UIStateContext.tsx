// src/contexts/UIStateContext.tsx
// Context for managing UI state
// Used to coordinate between different UI components

import React, { createContext, useContext, ReactNode } from 'react';

// Note: Removed isDatePickerOpen state since we switched to HTML5 date input
// HTML5 date inputs don't require external state tracking
interface UIStateContextType {
  // Future UI state can be added here
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export const useUIState = () => {
  const context = useContext(UIStateContext);
  if (!context) {
    throw new Error('useUIState must be used within UIStateProvider');
  }
  return context;
};

interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  return (
    <UIStateContext.Provider value={{}}>
      {children}
    </UIStateContext.Provider>
  );
};
