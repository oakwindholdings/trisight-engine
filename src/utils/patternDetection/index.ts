// Pattern detector factories
import PivotDetectorFactory from './PivotDetectorFactory';
import RocketmanDetectorFactory from './RocketmanDetectorFactory';

// Core pattern detection
import { DetectionOptions, BasePatternDetector } from './core/BasePatternDetector';
import { MarketContext, ThresholdConfig } from './core/MarketContext';
import { PatternRegistry } from './core/PatternRegistry';

// Register all pattern detectors
PatternRegistry.registerDetectorFactory('pivot', PivotDetectorFactory.createPivotDetector);
PatternRegistry.registerDetectorFactory('rocketman', RocketmanDetectorFactory.createRocketmanDetector);

// Export main components
export { PatternRegistry };
export { PivotDetectorFactory, RocketmanDetectorFactory };

// Export types using export type syntax
export { BasePatternDetector };
export type { DetectionOptions, MarketContext, ThresholdConfig };
