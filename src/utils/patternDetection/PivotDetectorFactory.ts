import { ThresholdConfig } from './core/MarketContext';
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

export default PivotDetectorFactory;
