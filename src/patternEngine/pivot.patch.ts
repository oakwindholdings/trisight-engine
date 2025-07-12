// src/patternEngine/pivot.patch.ts
// PATCH: Add explicit INITIATION → DECLARATION → EXIT lifecycle tags for Pivot
// Addresses audit finding: Missing 3-phase pivot lifecycle tracking

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

// Enhanced lifecycle phases for Pivot pattern
export interface PivotLifecycleEvent {
  type: 'PIVOT_INITIATION' | 'PIVOT_DECLARATION' | 'PIVOT_EXIT' | 'PIVOT_TRANSITIONED';
  timestamp: Date;
  candleIndex: number;
  pivotId: string;
  phase: 'INITIATION' | 'DECLARATION' | 'EXIT';
  pivotLevel: number;
  touchCount: number;
  strength: number;
  transitionData?: {
    fromPhase: 'INITIATION' | 'DECLARATION' | 'EXIT';
    toPhase: 'INITIATION' | 'DECLARATION' | 'EXIT';
    reason: string;
  };
}

// Enhanced Pivot pattern with 3-phase lifecycle tracking
export interface EnhancedPivotPattern {
  id: string;
  type: 'SUPPORT' | 'RESISTANCE';
  pivotLevel: number;
  startIndex: number;
  currentIndex: number;
  currentPhase: 'INITIATION' | 'DECLARATION' | 'EXIT';
  
  initiationPhase: {
    startIndex: number;
    endIndex?: number;
    initialTouchCount: number;
    confidence: number;
    completed: boolean;
  };
  
  declarationPhase: {
    startIndex?: number;
    endIndex?: number;
    confirmedTouchCount: number;
    strength: number;
    zoneWidth: number;
    completed: boolean;
  };
  
  exitPhase: {
    startIndex?: number;
    endIndex?: number;
    breachPrice: number;
    breachConfirmed: boolean;
    exitReason: string;
    completed: boolean;
  };
  
  touchPoints: Array<{
    index: number;
    price: number;
    volume: number;
    strength: number;
  }>;
  
  lifecycleEvents: PivotLifecycleEvent[];
  overallStrength: number;
  confidence: number;
}

/**
 * Monitor pivot pattern for 3-phase lifecycle transitions
 * ADDRESSES AUDIT FINDING: INITIATION → DECLARATION → EXIT lifecycle tracking
 */
export function monitorPivotLifecycleTransitions(
  pivot: EnhancedPivotPattern,
  candles: Candle[],
  currentIndex: number
): PivotLifecycleEvent[] {
  const haCandles = convertToHeikinAshi(candles);
  const events: PivotLifecycleEvent[] = [];
  
  // Phase 1: INITIATION → DECLARATION transition
  if (pivot.currentPhase === 'INITIATION' && !pivot.initiationPhase.completed) {
    const declarationTrigger = checkInitiationToDeclaration(pivot, haCandles, currentIndex);
    if (declarationTrigger) {
      const transitionEvent: PivotLifecycleEvent = {
        type: 'PIVOT_DECLARATION',
        timestamp: new Date(haCandles[currentIndex].datetime),
        candleIndex: currentIndex,
        pivotId: pivot.id,
        phase: 'DECLARATION',
        pivotLevel: pivot.pivotLevel,
        touchCount: pivot.touchPoints.length,
        strength: pivot.overallStrength
      };
      
      events.push(transitionEvent);
      
      // Update pivot phase
      pivot.currentPhase = 'DECLARATION';
      pivot.initiationPhase.completed = true;
      pivot.initiationPhase.endIndex = currentIndex;
      pivot.declarationPhase.startIndex = currentIndex;
      pivot.declarationPhase.confirmedTouchCount = pivot.touchPoints.length;
      
      logDebug('DEBUG_PATTERN_DETECT', '[Pivot Lifecycle] INITIATION → DECLARATION:', {
        pivotId: pivot.id,
        type: pivot.type,
        pivotLevel: pivot.pivotLevel.toFixed(4),
        touchCount: pivot.touchPoints.length,
        strength: pivot.overallStrength.toFixed(2),
        transitionIndex: currentIndex,
        reason: 'Sufficient touch confirmation for declaration'
      });
    }
  }
  
  // Phase 2: DECLARATION → EXIT transition
  if (pivot.currentPhase === 'DECLARATION' && !pivot.declarationPhase.completed) {
    const exitTrigger = checkDeclarationToExit(pivot, haCandles, currentIndex);
    if (exitTrigger) {
      const transitionEvent: PivotLifecycleEvent = {
        type: 'PIVOT_EXIT',
        timestamp: new Date(haCandles[currentIndex].datetime),
        candleIndex: currentIndex,
        pivotId: pivot.id,
        phase: 'EXIT',
        pivotLevel: pivot.pivotLevel,
        touchCount: pivot.touchPoints.length,
        strength: pivot.overallStrength
      };
      
      events.push(transitionEvent);
      
      // Update pivot phase
      pivot.currentPhase = 'EXIT';
      pivot.declarationPhase.completed = true;
      pivot.declarationPhase.endIndex = currentIndex;
      pivot.exitPhase.startIndex = currentIndex;
      pivot.exitPhase.breachPrice = haCandles[currentIndex].close;
      pivot.exitPhase.breachConfirmed = true;
      pivot.exitPhase.exitReason = exitTrigger.reason;
      
      logDebug('DEBUG_PATTERN_DETECT', '[Pivot Lifecycle] DECLARATION → EXIT:', {
        pivotId: pivot.id,
        type: pivot.type,
        pivotLevel: pivot.pivotLevel.toFixed(4),
        breachPrice: pivot.exitPhase.breachPrice.toFixed(4),
        breachPercent: exitTrigger.breachPercentage.toFixed(2),
        transitionIndex: currentIndex,
        reason: exitTrigger.reason
      });
    }
  }
  
  // Check for additional touch points during DECLARATION phase
  if (pivot.currentPhase === 'DECLARATION') {
    const newTouch = detectNewTouchPoint(pivot, haCandles, currentIndex);
    if (newTouch) {
      pivot.touchPoints.push(newTouch);
      pivot.overallStrength = calculatePivotStrength(pivot);
      
      logDebug('DEBUG_PATTERN_DETECT', '[Pivot Lifecycle] New touch point in DECLARATION:', {
        pivotId: pivot.id,
        touchIndex: currentIndex,
        touchPrice: newTouch.price.toFixed(4),
        totalTouches: pivot.touchPoints.length,
        updatedStrength: pivot.overallStrength.toFixed(2)
      });
    }
  }
  
  return events;
}

/**
 * Check conditions for INITIATION → DECLARATION transition
 */
function checkInitiationToDeclaration(
  pivot: EnhancedPivotPattern,
  haCandles: Candle[],
  currentIndex: number
): boolean {
  const minimumTouchesForDeclaration = 3;
  const minimumDurationForDeclaration = 5; // candles
  
  const hasEnoughTouches = pivot.touchPoints.length >= minimumTouchesForDeclaration;
  const hasEnoughDuration = currentIndex - pivot.startIndex >= minimumDurationForDeclaration;
  const hasStrongConfidence = pivot.confidence > 0.6;
  
  return hasEnoughTouches && hasEnoughDuration && hasStrongConfidence;
}

/**
 * Check conditions for DECLARATION → EXIT transition
 */
function checkDeclarationToExit(
  pivot: EnhancedPivotPattern,
  haCandles: Candle[],
  currentIndex: number
): { reason: string; breachPercentage: number } | null {
  const currentPrice = haCandles[currentIndex].close;
  const breachThreshold = 0.002; // 0.2% breach threshold
  
  let breachPercentage = 0;
  let reason = '';
  
  if (pivot.type === 'SUPPORT') {
    // Support breach: price breaks below support level
    breachPercentage = ((pivot.pivotLevel - currentPrice) / pivot.pivotLevel) * 100;
    if (breachPercentage > breachThreshold * 100) {
      reason = `Support breached by ${breachPercentage.toFixed(2)}%`;
      return { reason, breachPercentage };
    }
  } else {
    // Resistance breach: price breaks above resistance level
    breachPercentage = ((currentPrice - pivot.pivotLevel) / pivot.pivotLevel) * 100;
    if (breachPercentage > breachThreshold * 100) {
      reason = `Resistance breached by ${breachPercentage.toFixed(2)}%`;
      return { reason, breachPercentage };
    }
  }
  
  // Check for time-based exit (pivot became stale)
  const declarationDuration = currentIndex - (pivot.declarationPhase.startIndex || currentIndex);
  const maxDeclarationDuration = 50; // candles
  
  if (declarationDuration > maxDeclarationDuration) {
    reason = `Pivot aged out after ${declarationDuration} candles without breach`;
    return { reason, breachPercentage: 0 };
  }
  
  return null;
}

/**
 * Detect new touch points during DECLARATION phase
 */
function detectNewTouchPoint(
  pivot: EnhancedPivotPattern,
  haCandles: Candle[],
  currentIndex: number
): { index: number; price: number; volume: number; strength: number } | null {
  const currentCandle = haCandles[currentIndex];
  const tolerance = pivot.declarationPhase.zoneWidth || 0.001; // Default 0.1%
  
  let touchPrice = 0;
  let isTouch = false;
  
  if (pivot.type === 'SUPPORT') {
    touchPrice = currentCandle.low;
    isTouch = Math.abs(touchPrice - pivot.pivotLevel) <= (pivot.pivotLevel * tolerance);
  } else {
    touchPrice = currentCandle.high;
    isTouch = Math.abs(touchPrice - pivot.pivotLevel) <= (pivot.pivotLevel * tolerance);
  }
  
  if (isTouch) {
    // Avoid duplicate touches (check if recent touch exists)
    const recentTouches = pivot.touchPoints.filter(tp => 
      Math.abs(tp.index - currentIndex) <= 3
    );
    
    if (recentTouches.length === 0) {
      const touchStrength = calculateTouchStrength(currentCandle, pivot.pivotLevel);
      
      return {
        index: currentIndex,
        price: touchPrice,
        volume: currentCandle.volume,
        strength: touchStrength
      };
    }
  }
  
  return null;
}

/**
 * Calculate strength of a touch point
 */
function calculateTouchStrength(candle: Candle, pivotLevel: number): number {
  const priceDeviation = Math.abs(candle.close - pivotLevel) / pivotLevel;
  const volumeWeight = Math.min(candle.volume / 1000000, 1); // Normalize volume
  
  // Lower deviation and higher volume = stronger touch
  return Math.max(0, 1 - priceDeviation * 10) * (0.7 + volumeWeight * 0.3);
}

/**
 * Calculate overall pivot strength based on touch points
 */
function calculatePivotStrength(pivot: EnhancedPivotPattern): number {
  if (pivot.touchPoints.length === 0) return 0;
  
  const avgTouchStrength = pivot.touchPoints.reduce((sum, tp) => sum + tp.strength, 0) / pivot.touchPoints.length;
  const touchCountWeight = Math.min(pivot.touchPoints.length / 5, 1); // Max weight at 5 touches
  const timeWeight = Math.min((pivot.currentIndex - pivot.startIndex) / 20, 1); // Max weight at 20 candles
  
  return avgTouchStrength * 0.5 + touchCountWeight * 0.3 + timeWeight * 0.2;
}

/**
 * Create enhanced pivot pattern with 3-phase lifecycle
 */
export function createEnhancedPivotPattern(
  type: 'SUPPORT' | 'RESISTANCE',
  pivotLevel: number,
  startIndex: number,
  initialTouchPoints: Array<{ index: number; price: number; volume: number }>
): EnhancedPivotPattern {
  const pivotId = `pivot_${type.toLowerCase()}_${startIndex}_${Date.now()}`;
  
  const touchPoints = initialTouchPoints.map(tp => ({
    ...tp,
    strength: calculateTouchStrength({ close: tp.price, volume: tp.volume } as Candle, pivotLevel)
  }));
  
  const initialStrength = touchPoints.length > 0 
    ? touchPoints.reduce((sum, tp) => sum + tp.strength, 0) / touchPoints.length 
    : 0;
  
  return {
    id: pivotId,
    type,
    pivotLevel,
    startIndex,
    currentIndex: startIndex,
    currentPhase: 'INITIATION',
    
    initiationPhase: {
      startIndex,
      initialTouchCount: touchPoints.length,
      confidence: Math.min(touchPoints.length / 3, 1), // Max confidence at 3 touches
      completed: false
    },
    
    declarationPhase: {
      confirmedTouchCount: 0,
      strength: 0,
      zoneWidth: 0.001, // 0.1% default zone width
      completed: false
    },
    
    exitPhase: {
      breachPrice: 0,
      breachConfirmed: false,
      exitReason: '',
      completed: false
    },
    
    touchPoints,
    lifecycleEvents: [],
    overallStrength: initialStrength,
    confidence: Math.min(touchPoints.length / 3, 1)
  };
}

/**
 * Generate INITIATION event for new pivot pattern
 */
export function emitPivotInitiationEvent(
  pivot: EnhancedPivotPattern,
  candles: Candle[]
): PivotLifecycleEvent {
  const haCandles = convertToHeikinAshi(candles);
  
  return {
    type: 'PIVOT_INITIATION',
    timestamp: new Date(haCandles[pivot.startIndex].datetime),
    candleIndex: pivot.startIndex,
    pivotId: pivot.id,
    phase: 'INITIATION',
    pivotLevel: pivot.pivotLevel,
    touchCount: pivot.touchPoints.length,
    strength: pivot.overallStrength
  };
}
