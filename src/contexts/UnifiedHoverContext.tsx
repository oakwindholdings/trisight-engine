// src/contexts/UnifiedHoverContext.tsx
// Unified hover context combining pattern and signal hover data
// Phase 2: Canvas-DOM Bridge Implementation

import React, { createContext, useContext, ReactNode } from 'react';
import { CandlestickData } from '../models/ChartTypes';
import { TradeActionSignal } from '../utils/trading/TradeActionSignal';
import { SignalValidationResult } from '../utils/signalValidation/TradeSignalValidator';

// Escalator Step Data Structure
interface EscalatorStepData {
  stepRef: string;
  direction: string;
  floor: number;
  ceiling: number;
  height: number;
  duration: number;
  blackjackScore?: number;
  qualifiesForGoldmine?: boolean;
}

// Breakout Box Data Structure
interface BreakoutBoxData {
  stepRef: string;
  direction: 'RISING' | 'FALLING';
  floor: number;
  ceiling: number;
  blackjackScore?: number;
  qualifiesForGoldmine?: boolean;
}

// Golden Candle Data Structure
interface GoldenCandleData {
  type: 'ENTRY' | 'EXIT';
  index: number;
  direction: string;
  goldenScore?: number;
}

// Unified Hover Data Interface
export interface UnifiedHoverData {
  // Existing hover metrics (from useHoverMetrics)
  candle: {
    idx: number;
    x: number;
    y: number;
    data: CandlestickData;
    visibleIndex: number;
  };
  
  // Pattern data (from PatternContext)
  patterns: {
    bjCount: number | string;
    escalatorStep?: EscalatorStepData;
    breakoutBox?: BreakoutBoxData;
    goldenCandle?: GoldenCandleData;
    // Extensible for additional pattern types
    [key: string]: any;
  };
  
  // NEW: Signal data (from SignalRenderer)
  signal?: {
    tradeActionSignal: TradeActionSignal;
    tooltip: string;
    validation?: SignalValidationResult;
    isHovered: boolean;
  };
  
  // Hover state management
  isActive: boolean;
  lastUpdate: number;
}

// Context Type
interface UnifiedHoverContextType {
  hoverData: UnifiedHoverData | null;
  setHoverData: (data: UnifiedHoverData | null) => void;
  isHoverActive: boolean;
  clearHover: () => void;
}

// Create Context
const UnifiedHoverContext = createContext<UnifiedHoverContextType | null>(null);

// Context Provider Props
interface UnifiedHoverProviderProps {
  children: ReactNode;
}

// Context Provider Component
export function UnifiedHoverProvider({ children }: UnifiedHoverProviderProps) {
  const [hoverData, setHoverData] = React.useState<UnifiedHoverData | null>(null);

  const contextValue: UnifiedHoverContextType = {
    hoverData,
    setHoverData,
    isHoverActive: hoverData !== null && hoverData.isActive,
    clearHover: () => setHoverData(null)
  };

  return (
    <UnifiedHoverContext.Provider value={contextValue}>
      {children}
    </UnifiedHoverContext.Provider>
  );
}

// Hook to use Unified Hover Context
export function useUnifiedHover(): UnifiedHoverContextType {
  const context = useContext(UnifiedHoverContext);
  if (!context) {
    throw new Error('useUnifiedHover must be used within a UnifiedHoverProvider');
  }
  return context;
}

// Helper function to create hover data from legacy hover metrics
export function createUnifiedHoverData(
  legacyHoverData: any,
  patternData: any,
  signalData?: {
    tradeActionSignal: TradeActionSignal;
    tooltip: string;
    validation?: SignalValidationResult;
  }
): UnifiedHoverData {
  return {
    candle: {
      idx: legacyHoverData.idx,
      x: legacyHoverData.x,
      y: legacyHoverData.y,
      data: legacyHoverData.candle,
      visibleIndex: legacyHoverData.visibleIndex
    },
    patterns: {
      bjCount: legacyHoverData.bj,
      escalatorStep: patternData.escalatorStep,
      breakoutBox: patternData.breakoutBox,
      goldenCandle: patternData.goldenCandle,
      ...patternData.additional
    },
    signal: signalData ? {
      ...signalData,
      isHovered: true
    } : undefined,
    isActive: true,
    lastUpdate: Date.now()
  };
}

// Helper function to extract pattern data from PatternContext
export function extractPatternDataForHover(
  patternContext: any,
  candleIndex: number,
  visibleIndex: number
): any {
  const patterns: any = {
    bjCount: patternContext.bjCounts?.[candleIndex] ?? 'n/a'
  };

  // Check for escalator step at this index
  const hoveredStep = patternContext.escalatorSteps?.find((event: any) => {
    if (event.type === 'ESCALATOR_STEP' && event.data) {
      const stepData = event.data as { stepRef: string; direction: string; floor: number; ceiling: number; height: number };
      const [startStr, endStr] = stepData.stepRef.split('-');
      const startIndex = parseInt(startStr);
      const endIndex = parseInt(endStr);
      return candleIndex >= startIndex && candleIndex <= endIndex;
    }
    return false;
  });

  if (hoveredStep) {
    const stepData = hoveredStep.data;
    const targetBjEntry = patternContext.bjTargetScores?.find((e: any) => e.stepRef === stepData.stepRef);
    
    patterns.escalatorStep = {
      stepRef: stepData.stepRef,
      direction: stepData.direction,
      floor: stepData.floor,
      ceiling: stepData.ceiling,
      height: stepData.height,
      duration: (() => {
        const [startStr, endStr] = stepData.stepRef.split('-');
        return parseInt(endStr) - parseInt(startStr) + 1;
      })(),
      blackjackScore: targetBjEntry?.score,
      qualifiesForGoldmine: targetBjEntry?.qualifiesForGoldmine
    };
  }

  // Check for breakout box at this index
  const hoveredBreakoutBox = patternContext.breakoutBoxes?.find((box: any) => {
    return candleIndex >= box.startIndex && candleIndex <= box.endIndex;
  });

  if (hoveredBreakoutBox) {
    patterns.breakoutBox = {
      stepRef: hoveredBreakoutBox.stepRef,
      direction: hoveredBreakoutBox.direction,
      floor: hoveredBreakoutBox.floor,
      ceiling: hoveredBreakoutBox.ceiling,
      blackjackScore: hoveredBreakoutBox.blackjackScore,
      qualifiesForGoldmine: hoveredBreakoutBox.qualifiesForGoldmine
    };
  }

  // Check for golden candle events
  const hoveredGoldenEntry = patternContext.goldenCandleEntries?.find((event: any) => {
    return event.index === candleIndex;
  });
  
  const hoveredGoldenExit = patternContext.goldenCandleExits?.find((event: any) => {
    return event.index === candleIndex;
  });

  if (hoveredGoldenEntry || hoveredGoldenExit) {
    patterns.goldenCandle = {
      type: hoveredGoldenEntry ? 'ENTRY' : 'EXIT',
      index: candleIndex,
      direction: hoveredGoldenEntry?.direction || hoveredGoldenExit?.direction,
      goldenScore: hoveredGoldenEntry?.goldenScore || hoveredGoldenExit?.goldenScore
    };
  }

  return patterns;
}

export default UnifiedHoverContext;
