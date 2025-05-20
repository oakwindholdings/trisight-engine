/**
 * Registry for pattern detectors
 * Allows registration and retrieval of detector factories by pattern type
 */
import { PatternType } from '../../../models/PatternTypes';
import { BasePatternDetector } from './BasePatternDetector';

type DetectorFactoryFunction = (...args: any[]) => BasePatternDetector<any>;

class PatternRegistry {
  private static detectorFactories = new Map<string, DetectorFactoryFunction>();

  /**
   * Register a detector factory function for a pattern type
   */
  public static registerDetectorFactory(type: string, factory: DetectorFactoryFunction): void {
    PatternRegistry.detectorFactories.set(type, factory);
  }

  /**
   * Get a detector factory by pattern type
   */
  public static getDetectorFactory(type: string): DetectorFactoryFunction | undefined {
    return PatternRegistry.detectorFactories.get(type);
  }

  /**
   * Check if a detector factory is registered for a pattern type
   */
  public static hasDetectorFactory(type: string): boolean {
    return PatternRegistry.detectorFactories.has(type);
  }

  /**
   * Get all registered detector factories
   */
  public static getAllDetectorFactories(): Map<string, DetectorFactoryFunction> {
    return new Map(PatternRegistry.detectorFactories);
  }

  /**
   * Create a detector instance from a registered factory
   */
  public static createDetector(type: string, ...args: any[]): BasePatternDetector<any> | null {
    const factory = PatternRegistry.getDetectorFactory(type);
    if (factory) {
      return factory(...args);
    }
    return null;
  }
}

export { PatternRegistry };
