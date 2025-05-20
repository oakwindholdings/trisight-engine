import { PatternType } from '../../models/PatternTypes';
import { BasePatternDetector } from './core/BasePatternDetector';
import { PatternDetectorFactory, PatternDetectorOptions } from './core/PatternDetectorFactory';
import { AdaptiveBlackjackDetector } from './AdaptiveBlackjackDetector';

/**
 * Factory for creating BlackJack pattern detectors
 */
export class BlackjackDetectorFactory implements PatternDetectorFactory {
  /**
   * Create an instance of the BlackJack pattern detector
   */
  createDetector(options: PatternDetectorOptions): BasePatternDetector<any> {
    return new AdaptiveBlackjackDetector({
      minimumConfidence: options.minimumConfidence,
      adaptiveThresholds: options.adaptiveThresholds,
      maxPatterns: options.maxPatterns,
      enableLogging: options.enableLogging,
      lookbackPeriods: options.additionalOptions?.lookbackPeriods || 7,
      useContextTimeframe: options.additionalOptions?.useContextTimeframe || true,
      contextTimeframeMultiplier: options.additionalOptions?.contextTimeframeMultiplier || 5,
      basePriceChangeThreshold: options.additionalOptions?.basePriceChangeThreshold || 0.1,
      baseVolumeChangeThreshold: options.additionalOptions?.baseVolumeChangeThreshold || 0.5
    });
  }
  
  /**
   * Returns the pattern type this factory creates
   */
  getPatternType(): PatternType {
    return PatternType.BLACKJACK;
  }
}
