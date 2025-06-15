// src/contexts/UIStateContext.tsx
// Context for managing UI state like datepicker visibility
// Used to coordinate between different UI components

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIStateContextType {
  isDatePickerOpen: boolean;
  setIsDatePickerOpen: (isOpen: boolean) => void;
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  return (
    <UIStateContext.Provider value={{ isDatePickerOpen, setIsDatePickerOpen }}>
      {children}
    </UIStateContext.Provider>
  );
};
