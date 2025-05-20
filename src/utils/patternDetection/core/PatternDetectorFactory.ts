import { PatternType } from '../../../models/PatternTypes';
import { BasePatternDetector, DetectionOptions } from './BasePatternDetector';

/**
 * Options for pattern detector creation
 */
export interface PatternDetectorOptions extends DetectionOptions {
  /**
   * Additional pattern-specific options
   */
  additionalOptions?: Record<string, any>;
}

/**
 * Interface for pattern detector factories
 */
export interface PatternDetectorFactory {
  /**
   * Create an instance of a pattern detector
   */
  createDetector(options: PatternDetectorOptions): BasePatternDetector<any>;
  
  /**
   * Returns the pattern type this factory creates
   */
  getPatternType(): PatternType;
}
