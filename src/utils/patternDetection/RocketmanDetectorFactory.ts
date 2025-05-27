// src/utils/patternDetection/RocketmanDetectorFactory.ts
// Factory for Rocketman detectors
// Creates configured detector instances
import { ThresholdConfig } from './core/MarketContext';
import { DetectionOptions } from './core/BasePatternDetector';
import AdaptiveRocketmanDetector from './AdaptiveRocketmanDetector';

/**
 * Factory for creating Rocketman pattern detectors
 */
const RocketmanDetectorFactory = {
  createRocketmanDetector: (options?: Partial<DetectionOptions>) => {
    return new AdaptiveRocketmanDetector(options);
  }
};

export default RocketmanDetectorFactory;
