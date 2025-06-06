// src/context/PatternContext.tsx
// Context for pattern detection metrics and state
// Provides arrays of metrics for each candle in the chart

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PatternContextValue {
  bjCounts: number[];
  setBjCounts: (counts: number[]) => void;
  stepIndex: number[];
  setStepIndex: (indices: number[]) => void;
  // New metrics
  bjIntrinsic: number[];
  setBjIntrinsic: (values: number[]) => void;
  bjCumulative: number[];
  setBjCumulative: (values: number[]) => void;
  escalatorDir: ('RISING' | 'FALLING' | null)[];
  setEscalatorDir: (values: ('RISING' | 'FALLING' | null)[]) => void;
  escalatorLength: number[];
  setEscalatorLength: (values: number[]) => void;
  goldmineQual: boolean[];
  setGoldmineQual: (values: boolean[]) => void;
  trailStop: number[];
  setTrailStop: (values: number[]) => void;
  distToStopPct: number[];
  setDistToStopPct: (values: number[]) => void;
}

const PatternContext = createContext<PatternContextValue | null>(null);

export function PatternProvider({ children }: { children: ReactNode }) {
  const [bjCounts, setBjCounts] = useState<number[]>([]);
  const [stepIndex, setStepIndex] = useState<number[]>([]);
  // New metric states
  const [bjIntrinsic, setBjIntrinsic] = useState<number[]>([]);
  const [bjCumulative, setBjCumulative] = useState<number[]>([]);
  const [escalatorDir, setEscalatorDir] = useState<('RISING' | 'FALLING' | null)[]>([]);
  const [escalatorLength, setEscalatorLength] = useState<number[]>([]);
  const [goldmineQual, setGoldmineQual] = useState<boolean[]>([]);
  const [trailStop, setTrailStop] = useState<number[]>([]);
  const [distToStopPct, setDistToStopPct] = useState<number[]>([]);

  const value: PatternContextValue = {
    bjCounts,
    setBjCounts,
    stepIndex,
    setStepIndex,
    bjIntrinsic,
    setBjIntrinsic,
    bjCumulative,
    setBjCumulative,
    escalatorDir,
    setEscalatorDir,
    escalatorLength,
    setEscalatorLength,
    goldmineQual,
    setGoldmineQual,
    trailStop,
    setTrailStop,
    distToStopPct,
    setDistToStopPct,
  };

  return (
    <PatternContext.Provider value={value}>
      {children}
    </PatternContext.Provider>
  );
}

export function usePatternContext() {
  const context = useContext(PatternContext);
  if (!context) {
    throw new Error('usePatternContext must be used within a PatternProvider');
  }
  return context;
}
