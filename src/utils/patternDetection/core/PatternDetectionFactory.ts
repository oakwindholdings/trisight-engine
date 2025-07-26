// src/utils/patternDetection/core/PatternDetectionFactory.ts
// Creates pattern detector instances
// Central factory logic
import { PatternType } from '../../../models/PatternTypes';
import { BasePatternDetector, DetectionOptions } from './BasePatternDetector';
import { PatternDetectionOrchestrator, OrchestrationOptions } from './PatternDetectionOrchestrator';
import { AdaptiveGoldmineChannelDetector } from '../AdaptiveGoldmineChannelDetector';
import { AdaptiveGoldmineShaftDetector } from '../AdaptiveGoldmineShaftDetector';
import { AdaptiveBlackjackDetector } from '../AdaptiveBlackjackDetector';
import { AdaptiveEscalatorDetector } from '../AdaptiveEscalatorDetector';
import AdaptivePivotDetector from '../AdaptivePivotDetector';
import AdaptiveRocketmanDetector from '../AdaptiveRocketmanDetector';
import RocketmanDetectorFactory from '../RocketmanDetectorFactory';
import AdaptiveBreakoutBoxDetector from '../AdaptiveBreakoutBoxDetector';

/**
 * Factory for creating pattern detectors and orchestrators
 * Centralizes detector creation and configuration
 */
export class PatternDetectionFactory {
  /**
   * Create a complete pattern detection orchestrator with all detectors
   */
  public static createOrchestrator(
    options: Partial<OrchestrationOptions> = {}
  ): PatternDetectionOrchestrator {
    const detectors = new Map<PatternType, BasePatternDetector<any>>();
    
    // Create all detectors
    detectors.set(
      PatternType.GOLDMINE_CHANNEL, 
      PatternDetectionFactory.createChannelDetector()
    );
    
    detectors.set(
      PatternType.GOLDMINE_SHAFT, 
      PatternDetectionFactory.createShaftDetector()
    );
    
    // Add all adaptive detectors
    detectors.set(PatternType.ESCALATOR, PatternDetectionFactory.createEscalatorDetector());
    detectors.set(PatternType.ROCKETMAN, PatternDetectionFactory.createRocketmanDetector());
    detectors.set(PatternType.PIVOT, PatternDetectionFactory.createPivotDetector());
    detectors.set(PatternType.BLACKJACK, PatternDetectionFactory.createBlackjackDetector());
    detectors.set(PatternType.BREAKOUTBOX, PatternDetectionFactory.createBreakoutBoxDetector());
    
    // Create orchestrator with all detectors
    return new PatternDetectionOrchestrator(detectors, options);
  }
  
  /**
   * Create a Goldmine Channel detector
   */
  public static createChannelDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveGoldmineChannelDetector {
    return new AdaptiveGoldmineChannelDetector(options);
  }
  
  /**
   * Create a Goldmine Shaft detector
   */
  public static createShaftDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveGoldmineShaftDetector {
    return new AdaptiveGoldmineShaftDetector(options);
  }
  
  /**
   * Create a Blackjack detector
   */
  public static createBlackjackDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveBlackjackDetector {
    return new AdaptiveBlackjackDetector(options);
  }
  
  /**
   * Create an Escalator detector
   */
  public static createEscalatorDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveEscalatorDetector {
    return new AdaptiveEscalatorDetector(options);
  }
  
  /**
   * Create a Pivot detector
   */
  public static createPivotDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptivePivotDetector {
    return new AdaptivePivotDetector(options);
  }
  
  /**
   * Create a Rocketman detector
   */
  public static createRocketmanDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveRocketmanDetector {
    return RocketmanDetectorFactory.createRocketmanDetector(options);
  }
  
  /**
   * Create a Breakout Box detector
   */
  public static createBreakoutBoxDetector(
    options: Partial<DetectionOptions> = {}
  ): AdaptiveBreakoutBoxDetector {
    return new AdaptiveBreakoutBoxDetector(options);
  }
  
  /**
   * Create an individual detector by type
   */
  public static createDetector(
    type: PatternType,
    options: Partial<DetectionOptions> = {}
  ): BasePatternDetector<any> {
    switch (type) {
      case PatternType.GOLDMINE_CHANNEL:
        return PatternDetectionFactory.createChannelDetector(options);
      case PatternType.GOLDMINE_SHAFT:
        return PatternDetectionFactory.createShaftDetector(options);
      case PatternType.BLACKJACK:
        return PatternDetectionFactory.createBlackjackDetector(options);
      case PatternType.ESCALATOR:
        return PatternDetectionFactory.createEscalatorDetector(options);
      case PatternType.PIVOT:
        return PatternDetectionFactory.createPivotDetector(options);
      case PatternType.ROCKETMAN:
        return PatternDetectionFactory.createRocketmanDetector(options);
      case PatternType.BREAKOUTBOX:
        return PatternDetectionFactory.createBreakoutBoxDetector(options);
      // All pattern types are now supported
      default:
        throw new Error(`Detector not implemented for pattern type: ${type}`);
    }
  }
}
