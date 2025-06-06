// src/hooks/__mocks__/usePatternBus.ts
// Mock implementation of usePatternBus for deterministic testing
// Returns fixed pattern events

import { PatternEvent, PatternBusState } from '../usePatternBus';
import { ThrustDirection } from '../../models/PatternTypes';

export const usePatternBus = (): PatternBusState => {
  const events: PatternEvent[] = [
    {
      type: 'ESCALATOR',
      data: {
        startIndex: 0,
        endIndex: 5,
        direction: ThrustDirection.BULLISH,
        steps: [],
        averageStepHeight: 0.5,
        consistency: 0.8
      },
      timestamp: Date.now()
    },
    {
      type: 'GOLDMINE',
      data: {
        side: 'SHORT' as const,
        entryIndex: 6,
        entryPrice: 101,
        intrinsic: 0.7,
        cumulative: 1.2,
        stepRef: '5-6'
      },
      timestamp: Date.now()
    },
    {
      type: 'STOP_EVENT',
      data: {
        index: 10,
        price: 99,
        type: 'TRAIL' as const
      },
      timestamp: Date.now()
    }
  ];

  return { events, activePosition: undefined };
};
