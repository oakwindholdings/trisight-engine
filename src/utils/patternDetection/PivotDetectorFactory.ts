// src/utils/patternDetection/PivotDetectorFactory.ts
// Factory for Pivot detectors
// Creates configured detector instances
import { DetectionOptions } from './core/BasePatternDetector';
import AdaptivePivotDetector from './AdaptivePivotDetector';

/**
 * Factory for creating Pivot pattern detectors
 */
const PivotDetectorFactory = {
  createPivotDetector: (options?: Partial<DetectionOptions>) => {
    return new AdaptivePivotDetector(options);
  }
};

export { PivotDetectorFactory };
export default PivotDetectorFactory;
