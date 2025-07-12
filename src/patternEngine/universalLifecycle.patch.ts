// src/patternEngine/universalLifecycle.patch.ts
// PATCH: Universal TRANSITIONED and SUPPRESSED lifecycle tag support
// Addresses audit finding: Missing universal lifecycle tags across all pattern detectors

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';

// Universal lifecycle tags for all patterns
export type UniversalLifecycleTag = 
  | 'EMERGED' 
  | 'CONFIRMED' 
  | 'TRANSITIONED' 
  | 'SUPPRESSED' 
  | 'EXITED';

// Enhanced pattern event with universal lifecycle support
export interface UniversalPatternEvent {
  type: string; // Pattern-specific type (ESCALATOR, ROCKETMAN, etc.)
  lifecycleTag: UniversalLifecycleTag;
  timestamp: Date;
  candleIndex: number;
  patternId: string;
  data: any;
  transitionData?: {
    fromState: string;
    toState: string;
    reason: string;
    confidence: number;
  };
  suppressionData?: {
    reason: string;
    suppressedBy: string;
    duration: number;
    canReactivate: boolean;
  };
}

// Pattern state for lifecycle tracking
export interface PatternLifecycleState {
  id: string;
  type: string;
  currentTag: UniversalLifecycleTag;
  startIndex: number;
  lastUpdateIndex: number;
  confidence: number;
  suppressionCount: number;
  transitionHistory: Array<{
    fromTag: UniversalLifecycleTag;
    toTag: UniversalLifecycleTag;
    timestamp: Date;
    reason: string;
  }>;
}

/**
 * Universal lifecycle manager for all pattern types
 * ADDRESSES AUDIT FINDING: Universal TRANSITIONED and SUPPRESSED tag support
 */
export class UniversalLifecycleManager {
  private activePatterns: Map<string, PatternLifecycleState> = new Map();
  private suppressionRules: Map<string, (pattern: PatternLifecycleState, candles: Candle[], index: number) => boolean> = new Map();
  
  constructor() {
    this.initializeSuppressionRules();
  }
  
  /**
   * Initialize suppression rules for different pattern types
   */
  private initializeSuppressionRules(): void {
    // Escalator suppression: overlapping patterns
    this.suppressionRules.set('ESCALATOR', (pattern, candles, index) => {
      return this.checkEscalatorSuppression(pattern, candles, index);
    });
    
    // Rocketman suppression: market volatility too high
    this.suppressionRules.set('ROCKETMAN', (pattern, candles, index) => {
      return this.checkRocketmanSuppression(pattern, candles, index);
    });
    
    // Blackjack suppression: volume threshold not met
    this.suppressionRules.set('BLACKJACK', (pattern, candles, index) => {
      return this.checkBlackjackSuppression(pattern, candles, index);
    });
    
    // Pivot suppression: insufficient touch points
    this.suppressionRules.set('PIVOT', (pattern, candles, index) => {
      return this.checkPivotSuppression(pattern, candles, index);
    });
    
    // Goldmine suppression: retracement failure
    this.suppressionRules.set('GOLDMINE', (pattern, candles, index) => {
      return this.checkGoldmineSuppression(pattern, candles, index);
    });
  }
  
  /**
   * Process pattern for lifecycle updates and emit appropriate events
   */
  processPatternLifecycle(
    patternType: string,
    patternId: string,
    patternData: any,
    candles: Candle[],
    currentIndex: number
  ): UniversalPatternEvent[] {
    const events: UniversalPatternEvent[] = [];
    let pattern = this.activePatterns.get(patternId);
    
    // Initialize new pattern
    if (!pattern) {
      pattern = {
        id: patternId,
        type: patternType,
        currentTag: 'EMERGED',
        startIndex: currentIndex,
        lastUpdateIndex: currentIndex,
        confidence: patternData.confidence || 0.5,
        suppressionCount: 0,
        transitionHistory: []
      };
      
      this.activePatterns.set(patternId, pattern);
      
      // Emit EMERGED event
      events.push({
        type: patternType,
        lifecycleTag: 'EMERGED',
        timestamp: new Date(candles[currentIndex].datetime),
        candleIndex: currentIndex,
        patternId,
        data: patternData
      });
      
      logDebug('DEBUG_PATTERN_DETECT', '[Universal Lifecycle] Pattern EMERGED:', {
        patternType,
        patternId,
        index: currentIndex,
        confidence: pattern.confidence
      });
    }
    
    // Check for suppression
    const shouldSuppress = this.checkSuppression(pattern, candles, currentIndex);
    if (shouldSuppress && pattern.currentTag !== 'SUPPRESSED') {
      const suppressionEvent = this.createSuppressionEvent(pattern, candles, currentIndex, shouldSuppress);
      events.push(suppressionEvent);
      this.transitionPattern(pattern, 'SUPPRESSED', shouldSuppress.reason);
    }
    
    // Check for transitions (only if not suppressed)
    if (pattern.currentTag !== 'SUPPRESSED') {
      const transitionEvents = this.checkTransitions(pattern, candles, currentIndex, patternData);
      events.push(...transitionEvents);
    }
    
    // Update pattern state
    pattern.lastUpdateIndex = currentIndex;
    pattern.confidence = patternData.confidence || pattern.confidence;
    
    return events;
  }
  
  /**
   * Check for pattern transitions based on current state
   */
  private checkTransitions(
    pattern: PatternLifecycleState,
    candles: Candle[],
    currentIndex: number,
    patternData: any
  ): UniversalPatternEvent[] {
    const events: UniversalPatternEvent[] = [];
    
    // EMERGED → CONFIRMED transition
    if (pattern.currentTag === 'EMERGED') {
      const shouldConfirm = this.checkConfirmationCriteria(pattern, candles, currentIndex, patternData);
      if (shouldConfirm) {
        const confirmEvent = this.createTransitionEvent(
          pattern, 
          'CONFIRMED', 
          candles, 
          currentIndex, 
          'Pattern criteria confirmed'
        );
        events.push(confirmEvent);
        this.transitionPattern(pattern, 'CONFIRMED', 'Pattern criteria confirmed');
      }
    }
    
    // CONFIRMED → TRANSITIONED (pattern state change)
    if (pattern.currentTag === 'CONFIRMED') {
      const transitionTrigger = this.checkTransitionTriggers(pattern, candles, currentIndex, patternData);
      if (transitionTrigger) {
        const transitionEvent = this.createTransitionEvent(
          pattern,
          'TRANSITIONED',
          candles,
          currentIndex,
          transitionTrigger.reason,
          transitionTrigger
        );
        events.push(transitionEvent);
        // Note: Don't change currentTag for TRANSITIONED - it's a notification, not a state change
      }
    }
    
    // Any state → EXITED transition
    const exitTrigger = this.checkExitCriteria(pattern, candles, currentIndex, patternData);
    if (exitTrigger) {
      const exitEvent = this.createTransitionEvent(
        pattern,
        'EXITED',
        candles,
        currentIndex,
        exitTrigger.reason
      );
      events.push(exitEvent);
      this.transitionPattern(pattern, 'EXITED', exitTrigger.reason);
      this.activePatterns.delete(pattern.id); // Remove from active tracking
    }
    
    return events;
  }
  
  /**
   * Check suppression conditions for a pattern
   */
  private checkSuppression(
    pattern: PatternLifecycleState,
    candles: Candle[],
    currentIndex: number
  ): { reason: string; suppressedBy: string; duration: number } | null {
    const suppressionRule = this.suppressionRules.get(pattern.type);
    if (!suppressionRule) return null;
    
    const shouldSuppress = suppressionRule(pattern, candles, currentIndex);
    if (!shouldSuppress) return null;
    
    return {
      reason: `${pattern.type} pattern suppressed due to market conditions`,
      suppressedBy: `${pattern.type}_SUPPRESSION_RULE`,
      duration: 10 // candles
    };
  }
  
  /**
   * Create suppression event
   */
  private createSuppressionEvent(
    pattern: PatternLifecycleState,
    candles: Candle[],
    currentIndex: number,
    suppressionData: { reason: string; suppressedBy: string; duration: number }
  ): UniversalPatternEvent {
    return {
      type: pattern.type,
      lifecycleTag: 'SUPPRESSED',
      timestamp: new Date(candles[currentIndex].datetime),
      candleIndex: currentIndex,
      patternId: pattern.id,
      data: {},
      suppressionData: {
        ...suppressionData,
        canReactivate: true
      }
    };
  }
  
  /**
   * Create transition event
   */
  private createTransitionEvent(
    pattern: PatternLifecycleState,
    newTag: UniversalLifecycleTag,
    candles: Candle[],
    currentIndex: number,
    reason: string,
    transitionData?: any
  ): UniversalPatternEvent {
    return {
      type: pattern.type,
      lifecycleTag: newTag,
      timestamp: new Date(candles[currentIndex].datetime),
      candleIndex: currentIndex,
      patternId: pattern.id,
      data: transitionData || {},
      transitionData: {
        fromState: pattern.currentTag,
        toState: newTag,
        reason,
        confidence: pattern.confidence
      }
    };
  }
  
  /**
   * Transition pattern to new lifecycle state
   */
  private transitionPattern(pattern: PatternLifecycleState, newTag: UniversalLifecycleTag, reason: string): void {
    const oldTag = pattern.currentTag;
    pattern.currentTag = newTag;
    
    pattern.transitionHistory.push({
      fromTag: oldTag,
      toTag: newTag,
      timestamp: new Date(),
      reason
    });
    
    logDebug('DEBUG_PATTERN_DETECT', '[Universal Lifecycle] Pattern transitioned:', {
      patternId: pattern.id,
      fromTag: oldTag,
      toTag: newTag,
      reason
    });
  }
  
  // Pattern-specific suppression checks
  private checkEscalatorSuppression(pattern: PatternLifecycleState, candles: Candle[], index: number): boolean {
    // Suppress if too many overlapping escalators
    const overlappingCount = Array.from(this.activePatterns.values())
      .filter(p => p.type === 'ESCALATOR' && p.id !== pattern.id)
      .filter(p => Math.abs(p.startIndex - pattern.startIndex) < 10).length;
    
    return overlappingCount > 2;
  }
  
  private checkRocketmanSuppression(pattern: PatternLifecycleState, candles: Candle[], index: number): boolean {
    // Suppress if market volatility is too high (>5% in 5 candles)
    if (index < 5) return false;
    
    const recentCandles = candles.slice(index - 4, index + 1);
    const volatility = this.calculateVolatility(recentCandles);
    
    return volatility > 0.05; // 5% volatility threshold
  }
  
  private checkBlackjackSuppression(pattern: PatternLifecycleState, candles: Candle[], index: number): boolean {
    // Suppress if volume is consistently low (below 50% of 10-day average)
    if (index < 10) return false;
    
    const recentVolume = candles.slice(index - 4, index + 1).reduce((sum, c) => sum + c.volume, 0) / 5;
    const avgVolume = candles.slice(index - 9, index + 1).reduce((sum, c) => sum + c.volume, 0) / 10;
    
    return recentVolume < (avgVolume * 0.5);
  }
  
  private checkPivotSuppression(pattern: PatternLifecycleState, candles: Candle[], index: number): boolean {
    // Suppress if pivot hasn't been touched in 20 candles
    const candlesSinceStart = index - pattern.startIndex;
    return candlesSinceStart > 20 && pattern.confidence < 0.3;
  }
  
  private checkGoldmineSuppression(pattern: PatternLifecycleState, candles: Candle[], index: number): boolean {
    // Suppress if retracement exceeds 85% (failure threshold)
    // This would need pattern-specific data to implement properly
    return false; // Placeholder
  }
  
  // Helper methods
  private checkConfirmationCriteria(pattern: PatternLifecycleState, candles: Candle[], index: number, data: any): boolean {
    const duration = index - pattern.startIndex;
    return duration >= 3 && pattern.confidence > 0.6;
  }
  
  private checkTransitionTriggers(pattern: PatternLifecycleState, candles: Candle[], index: number, data: any): { reason: string } | null {
    // Pattern-specific transition logic would go here
    // For now, generic confidence-based transitions
    if (pattern.confidence !== data.confidence) {
      return { reason: `Pattern confidence changed from ${pattern.confidence.toFixed(2)} to ${data.confidence.toFixed(2)}` };
    }
    return null;
  }
  
  private checkExitCriteria(pattern: PatternLifecycleState, candles: Candle[], index: number, data: any): { reason: string } | null {
    // Generic exit criteria
    if (pattern.confidence < 0.2) {
      return { reason: 'Pattern confidence dropped below exit threshold' };
    }
    
    const duration = index - pattern.startIndex;
    if (duration > 100) { // Max pattern duration
      return { reason: 'Pattern duration exceeded maximum limit' };
    }
    
    return null;
  }
  
  private calculateVolatility(candles: Candle[]): number {
    if (candles.length < 2) return 0;
    
    const prices = candles.map(c => c.close);
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Get all active patterns with their current lifecycle states
   */
  getActivePatterns(): PatternLifecycleState[] {
    return Array.from(this.activePatterns.values());
  }
  
  /**
   * Get patterns by lifecycle tag
   */
  getPatternsByTag(tag: UniversalLifecycleTag): PatternLifecycleState[] {
    return Array.from(this.activePatterns.values()).filter(p => p.currentTag === tag);
  }
}
