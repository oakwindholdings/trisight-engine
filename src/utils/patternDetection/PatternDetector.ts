// src/utils/patternDetection/PatternDetector.ts
// Detector for Pattern pattern
// Identifies occurrences in price data
import { CandlestickData } from '../../models/ChartTypes';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';
import { PatternDetectionFactory } from './core/PatternDetectionFactory';
import { BasePatternDetector } from './core/BasePatternDetector';
import { MarketContext } from './core/MarketContext';
import { MarketStructureAnalyzer } from './core/MarketStructureAnalyzer';
import RocketmanDetectorFactory from './RocketmanDetectorFactory';

/**
 * Main pattern detection orchestrator that runs all detectors and 
 * aggregates the results
 */
class PatternDetector {
  private detectors: BasePatternDetector<any>[];
  private marketStructureAnalyzer: MarketStructureAnalyzer;
  
  constructor() {
    // Use the factory to create adaptive detectors
    this.marketStructureAnalyzer = new MarketStructureAnalyzer();
    
    // Initialize all adaptive pattern detectors
    this.detectors = [
      PatternDetectionFactory.createChannelDetector(),
      PatternDetectionFactory.createShaftDetector(),
      PatternDetectionFactory.createPivotDetector(),
      RocketmanDetectorFactory.createRocketmanDetector(),
      PatternDetectionFactory.createEscalatorDetector(),
      PatternDetectionFactory.createBlackjackDetector()
    ];
  }
  
  /**
   * Detect all patterns in the provided candlestick data
   */
  detectPatterns(data: CandlestickData[]): Pattern[] {
    if (data.length < 10) {
      return []; // Not enough data for pattern detection
    }
    
    // Create market context for enhanced detection
    const context = this.marketStructureAnalyzer.analyzeContext(data);
    
    let patterns: Pattern[] = [];
    
    // Run each adaptive detector with market context
    this.detectors.forEach(detector => {
      const detectedPatterns = detector.detect(data, context);
      
      // Debug logging for pattern detection
      if (detectedPatterns.length > 0) {
        console.log(`[PatternDetector] ${detector.getPatternType()} found ${detectedPatterns.length} patterns`);
      }
      
      patterns = [...patterns, ...detectedPatterns];
    });
    
    // Sort patterns by start time
    patterns.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    
    return patterns;
  }
  
  /**
   * Get counts of detected patterns by type
   */
  getPatternCounts(patterns: Pattern[]): Record<PatternType, number> {
    const counts: Partial<Record<PatternType, number>> = {};
    
    // Initialize counts with zeros
    Object.values(PatternType).forEach(type => {
      counts[type] = 0;
    });
    
    // Count patterns by type
    patterns.forEach(pattern => {
      counts[pattern.type] = (counts[pattern.type] || 0) + 1;
    });
    
    return counts as Record<PatternType, number>;
  }
}

export default PatternDetector;
