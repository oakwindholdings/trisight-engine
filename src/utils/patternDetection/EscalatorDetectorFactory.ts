import { PatternDetectorFactory, PatternDetectorOptions } from './core/PatternDetectorFactory';
import { BasePatternDetector } from './core/BasePatternDetector';
import { AdaptiveEscalatorDetector, EscalatorDetectionOptions } from './AdaptiveEscalatorDetector';
import { EscalatorPattern, PatternType } from '../../models/PatternTypes';

/**
 * Factory for creating Escalator pattern detectors
 */
export class EscalatorDetectorFactory implements PatternDetectorFactory {
  /**
   * Create a new adaptive escalator detector
   */
  /**
   * Returns the pattern type this factory creates
   */
  getPatternType(): PatternType {
    return PatternType.ESCALATOR;
  }
  
  /**
   * Create a new adaptive escalator detector instance
   */
  createDetector(options: PatternDetectorOptions): BasePatternDetector<EscalatorPattern> {
    // Convert generic options to escalator-specific options
    return new AdaptiveEscalatorDetector({
      minimumConfidence: options.minimumConfidence ?? 0.4,
      adaptiveThresholds: options.adaptiveThresholds ?? true,
      enableLogging: options.enableLogging ?? false,
      maxPatterns: options.maxPatterns,
      // Add any additional options specific to escalator detectors
      minSteps: 3,
      minStepSize: 0.5,
      maxConsolidationVolatility: 1.0,
      basePriceChangeThreshold: 0.01,
      baseVolumeChangeThreshold: 0.05
    });
  }
}

export default new EscalatorDetectorFactory();
