// src/utils/patternDetection/core/PatternDetectionOrchestrator.ts
// Coordinates detectors and tracks relationships
// Handles detection workflow
import { CandlestickData } from '../../../models/ChartTypes';
import { Pattern, PatternType } from '../../../models/PatternTypes';
import { MarketContext } from './MarketContext';
import { MarketStructureAnalyzer } from './MarketStructureAnalyzer';
import { BasePatternDetector, DetectionOptions, DetectionStats } from './BasePatternDetector';
import { PatternRelationshipTracker } from './PatternRelationshipTracker';

/**
 * Options for pattern detection orchestration
 */
export interface OrchestrationOptions {
  enabledPatternTypes: PatternType[];
  detectorOptions: Partial<Record<PatternType, Partial<DetectionOptions>>>;
  logPerformance: boolean;
  relationshipTracking: boolean;
}

/**
 * Default orchestration options
 */
const DEFAULT_ORCHESTRATION_OPTIONS: OrchestrationOptions = {
  enabledPatternTypes: Object.values(PatternType),
  detectorOptions: {},
  logPerformance: false,
  relationshipTracking: true
};

/**
 * Result of a pattern detection operation
 */
export interface PatternDetectionResult {
  patterns: Pattern[];
  patternsByType: Record<PatternType, Pattern[]>;
  context: MarketContext;
  statistics: Record<PatternType, DetectionStats>;
  totalDetectionTimeMs: number;
}

/**
 * Central orchestrator for all pattern detection operations
 * Manages the complete pattern detection workflow including:
 * - Market structure analysis
 * - Pattern detection via specialized detectors
 * - Pattern relationship tracking
 * - Performance monitoring
 */
export class PatternDetectionOrchestrator {
  private detectors: Map<PatternType, BasePatternDetector<any>>;
  private marketStructureAnalyzer: MarketStructureAnalyzer;
  private patternRelationshipTracker: PatternRelationshipTracker;
  private options: OrchestrationOptions;
  
  constructor(
    detectors: Map<PatternType, BasePatternDetector<any>>,
    options: Partial<OrchestrationOptions> = {}
  ) {
    this.detectors = detectors;
    this.options = { ...DEFAULT_ORCHESTRATION_OPTIONS, ...options };
    
    this.marketStructureAnalyzer = new MarketStructureAnalyzer();
    this.patternRelationshipTracker = new PatternRelationshipTracker();
  }
  
  /**
   * Detects all patterns in the provided data using the full orchestration pipeline
   */
  public detectPatterns(data: CandlestickData[]): PatternDetectionResult {
    const startTime = performance.now();
    
    // Step 1: Analyze market structure to create context
    const context = this.marketStructureAnalyzer.analyzeContext(data);
    
    if (this.options.logPerformance) {
      console.log(`Market structure analysis completed in ${performance.now() - startTime}ms`);
    }
    
    // Step 2: Detect patterns using individual detectors
    const patternsByType: Partial<Record<PatternType, Pattern[]>> = {};
    const statistics: Partial<Record<PatternType, DetectionStats>> = {};
    
    // Only use enabled pattern types
    for (const type of this.options.enabledPatternTypes) {
      const detector = this.detectors.get(type);
      if (!detector) continue;
      
      // Apply detector-specific options if available
      const detectorOptions = this.options.detectorOptions[type];
      if (detectorOptions) {
        // Use the public updateOptions method instead of directly accessing the protected property
        detector.updateOptions(detectorOptions);
      }
      
      // Detect patterns for this type
      const typeStartTime = performance.now();
      const patterns = detector.detect(data, context);
      patternsByType[type] = patterns;
      statistics[type] = detector.getDetectionStats();
      
      if (this.options.logPerformance) {
        console.log(`Detected ${patterns.length} ${type} patterns in ${performance.now() - typeStartTime}ms`);
      }
    }
    
    // Step 3: Track relationships between patterns if enabled
    let allPatterns: Pattern[] = Object.values(patternsByType).flat();
    
    if (this.options.relationshipTracking) {
      allPatterns = this.patternRelationshipTracker.processPatternRelationships(
        allPatterns, 
        context
      );
      
      if (this.options.logPerformance) {
        console.log(`Pattern relationship processing completed in ${performance.now() - startTime}ms`);
      }
    }
    
    const totalTime = performance.now() - startTime;
    
    if (this.options.logPerformance) {
      console.log(`Total detection time: ${totalTime}ms for ${allPatterns.length} patterns`);
    }
    
    return {
      patterns: allPatterns,
      patternsByType: patternsByType as Record<PatternType, Pattern[]>,
      context,
      statistics: statistics as Record<PatternType, DetectionStats>,
      totalDetectionTimeMs: totalTime
    };
  }
}
