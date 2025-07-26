// src/utils/patternDetection/AdaptiveBreakoutBoxDetector.ts
// Adaptive detector for breakout box patterns

import { BasePatternDetector, DetectionOptions } from './core/BasePatternDetector';
import { CandlestickData } from '../../models/ChartTypes';
import { BreakoutBoxPattern, PatternType } from '../../models/PatternTypes';
import { MarketContext, ThresholdConfig } from './core/MarketContext';
import { logDebug } from '../debug';
import { detectBreakoutBoxes, BreakoutBox } from '../../patternEngine/breakoutBox';

import { TradeAction } from '../trading/TradeActionSignal';

export interface BreakoutBoxThresholdConfig extends ThresholdConfig {
  minStallLength?: number;
  stallThreshold?: number;  
  breakoutMultiplier?: number;
}

// Extended interface for internal use with additional fields
export interface ExtendedBreakoutBoxPattern extends BreakoutBoxPattern {
  height: number;
  stallLength: number;
  breakoutDirection: 'RISING' | 'FALLING';
  boxType?: string;
  blackjackScore?: number;
  qualifiesForGoldmine?: boolean;
  // Signal attributes for compatibility
  action?: TradeAction;
  entryPrice?: number;
  entryTime?: Date;
  pivotLevel?: number;
  channelHeight?: number;
  depthPercent?: number;
  baseDuration?: number;
  breakoutStrength?: number;
  pattern?: string;
  additionalNotes?: string;
  startPrice?: number;
  endPrice?: number;
  priceTarget?: number;
  stopLoss?: number;
  strength?: number;
}

export class AdaptiveBreakoutBoxDetector extends BasePatternDetector<BreakoutBoxPattern> {
  constructor(options: Partial<DetectionOptions> = {}) {
    super(options);
  }

  public getPatternType(): PatternType {
    return PatternType.BREAKOUTBOX;
  }

  protected detectPatterns(
    data: CandlestickData[],
    _context: MarketContext,
    thresholds: ThresholdConfig
  ): BreakoutBoxPattern[] {
    if (data.length < 5) {
      return [];
    }

    // Use the existing breakout box detection logic with threshold mapping
    const minStallLength = thresholds.minPatternDuration || 3;
    const stallThreshold = thresholds.retracementMin || 0.1;
    const breakoutMultiplier = thresholds.thrustPercentMin || 0.5;
    
    const breakoutBoxes = detectBreakoutBoxes(
      data,
      minStallLength,
      stallThreshold,
      breakoutMultiplier
    );

    // Convert BreakoutBox objects to Pattern objects for integration
    const patterns: BreakoutBoxPattern[] = breakoutBoxes.map((box: BreakoutBox): ExtendedBreakoutBoxPattern | null => {
      const startCandle = data[box.startIndex];
      const endCandle = data[box.endIndex];
      const breakoutCandle = box.breakoutCandle || endCandle;

      // Calculate confidence based on blackjack score and goldmine qualification
      let confidence = 0.6; // Base confidence
      if (box.qualifiesForGoldmine) {
        confidence = Math.min(0.9, 0.7 + (Math.abs(box.blackjackScore || 0) - 2.0) * 0.1);
      }
      
      // Apply confidence threshold filter
      if (confidence < thresholds.confidenceThreshold) {
        return null; // Skip low confidence patterns
      }

      const pattern: ExtendedBreakoutBoxPattern = {
        // PatternBase required fields
        id: `bb_${box.startIndex}_${box.endIndex}_${Date.now()}`,
        type: PatternType.BREAKOUTBOX,
        startTime: new Date(startCandle.datetime),
        endTime: new Date(breakoutCandle.datetime),
        highPrice: box.ceiling,
        lowPrice: box.floor,
        confidence,
        hasReceivedFeedback: false,

        // BreakoutBoxPattern required fields
        direction: box.direction, // Already 'RISING' | 'FALLING'
        floor: box.floor,
        ceiling: box.ceiling,

        // Extended fields
        height: box.height,
        stallLength: box.endIndex - box.startIndex + 1,
        breakoutDirection: box.direction,
        boxType: box.qualifiesForGoldmine ? 'goldmine' : 'standard',
        blackjackScore: box.blackjackScore,
        qualifiesForGoldmine: box.qualifiesForGoldmine,

        // Signal attributes for compatibility
        action: box.direction === 'RISING' ? TradeAction.BUY : TradeAction.SHORT,
        entryPrice: breakoutCandle.close,
        entryTime: new Date(breakoutCandle.datetime),
        pivotLevel: (box.floor + box.ceiling) / 2,
        channelHeight: box.height,
        depthPercent: (box.height / box.ceiling) * 100,
        baseDuration: box.endIndex - box.startIndex + 1,
        breakoutStrength: confidence,
        pattern: 'Breakout Box',
        additionalNotes: `${box.direction} breakout${box.qualifiesForGoldmine ? ' (Goldmine)' : ''}`,
        startPrice: box.floor,
        endPrice: box.ceiling,
        strength: confidence,
        priceTarget: box.direction === 'RISING'
          ? box.ceiling + (box.height * 0.5)
          : box.floor - (box.height * 0.5),
        stopLoss: box.direction === 'RISING' ? box.floor : box.ceiling
      };

      return pattern;
    }).filter((p): p is ExtendedBreakoutBoxPattern => p !== null);

    logDebug('DEBUG_PATTERN_DETECT', `[AdaptiveBreakoutBoxDetector] Detected ${patterns.length} breakout boxes`);
    
    return patterns;
  }

  protected getDefaultThresholds(): ThresholdConfig {
    return {
      thrustPercentMin: 0.5,       // Maps to breakoutMultiplier
      retracementMin: 0.1,         // Maps to stallThreshold  
      retracementMax: 0.3,         // Maximum stall variation
      confidenceThreshold: 0.6,    // Minimum confidence required
      minPatternDuration: 3,       // Maps to minStallLength
      maxPatternDuration: 20,      // Maximum box duration
      volumeConfirmationThreshold: 1.0
    };
  }

  protected calculateThresholds(context: MarketContext): ThresholdConfig {
    const baseThresholds = this.getDefaultThresholds();
    const adjusted = { ...baseThresholds };

    // Calculate volatility factor for adaptive thresholds
    let volatilityFactor = 1.0;
    try {
      // Check if the function exists before calling it
      if (typeof context.getVolatilityFactor === 'function') {
        volatilityFactor = context.getVolatilityFactor();
      } else {
        // Fallback calculation based on context volatility
        const baseVolatility = 0.01; // 1% as baseline
        volatilityFactor = Math.max(0.5, Math.min(2.0, (context.volatility || 0.01) / baseVolatility));
      }
    } catch (error) {
      volatilityFactor = 1.0;
    }

    // Adjust for volatility
    if (context.volatility > 0.02) {
      adjusted.retracementMin = Math.min(0.2, baseThresholds.retracementMin * 1.2);
      adjusted.thrustPercentMin = Math.min(0.7, baseThresholds.thrustPercentMin * 1.2);
    }

    // Adjust for market phase
    if (context.phase === 'CHANNEL_BREAKOUT') {
      adjusted.minPatternDuration = Math.max(2, (baseThresholds.minPatternDuration || 3) - 1);
    }

    // Adjust minimum confidence based on market conditions
    if (context.volatility < 0.01 && context.breakoutPotential > 0.5) {
      // In low volatility high-breakout-potential markets, require higher confidence
      adjusted.confidenceThreshold = Math.min(0.8, baseThresholds.confidenceThreshold * 1.2);
    }
    
    // Use volatility factor to scale thresholds
    adjusted.thrustPercentMin *= volatilityFactor;
    adjusted.retracementMin *= volatilityFactor;

    return adjusted;
  }
}

export default AdaptiveBreakoutBoxDetector; 