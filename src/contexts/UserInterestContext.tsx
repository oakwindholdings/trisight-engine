// path // UserInterestContext.tsx // User-selected feed filters shared across app.

import React, { createContext, useContext, useState } from 'react';

export interface UserInterestFilters {
  symbol?: string;
  patternType?: string;
  sector?: string;
}

interface UserInterestContextValue extends UserInterestFilters {
  setFilters: (filters: UserInterestFilters) => void;
}

const defaultValue: UserInterestContextValue = {
  setFilters: () => {},
};

const UserInterestContext = createContext<UserInterestContextValue>(defaultValue);

export const UserInterestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<UserInterestFilters>({});

  return (
    <UserInterestContext.Provider value={{ ...filters, setFilters }}>
      {children}
    </UserInterestContext.Provider>
  );
};

export const useUserInterest = () => useContext(UserInterestContext); 