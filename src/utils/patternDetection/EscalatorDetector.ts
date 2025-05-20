import { CandlestickData } from '../../models/ChartTypes';
import { EscalatorPattern, PatternType, ThrustDirection, EscalatorSignalStrength } from '../../models/PatternTypes';
import { v4 as uuidv4 } from 'uuid';

/**
 * Detector for Escalator patterns
 * These are characterized by stair-step price movements with alternating
 * consolidation and directional movement phases
 */
class EscalatorDetector {
  private readonly MIN_STEPS = 3; // Minimum number of steps to form an escalator
  private readonly MIN_STEP_SIZE = 0.5; // Minimum % change to consider as a step
  private readonly MAX_CONSOLIDATION_VOLATILITY = 1.0; // Max % volatility during consolidation
  private readonly MIN_CONFIDENCE = 0.5; // Minimum confidence threshold
  
  /**
   * Detect Escalator patterns in the given candlestick data
   */
  detect(data: CandlestickData[]): EscalatorPattern[] {
    if (data.length < this.MIN_STEPS * 2) {
      return []; // Not enough data for minimum steps
    }
    
    const patterns: EscalatorPattern[] = [];
    
    // Look for both upward and downward escalators
    const upwardPatterns = this.detectByDirection(data, ThrustDirection.BULLISH);
    const downwardPatterns = this.detectByDirection(data, ThrustDirection.BEARISH);
    
    patterns.push(...upwardPatterns, ...downwardPatterns);
    
    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);
    
    // Filter out overlapping patterns
    return this.filterOverlappingPatterns(patterns);
  }
  
  /**
   * Filter out overlapping patterns, keeping the ones with highest confidence
   */
  private filterOverlappingPatterns(patterns: EscalatorPattern[]): EscalatorPattern[] {
    if (patterns.length <= 1) return patterns;
    
    const filtered: EscalatorPattern[] = [];
    
    for (const pattern of patterns) {
      // Check if this pattern overlaps with any already in the filtered list
      const isOverlapping = filtered.some(p => this.patternsOverlap(p, pattern));
      
      if (!isOverlapping) {
        filtered.push(pattern);
      }
    }
    
    return filtered;
  }
  
  /**
   * Check if two patterns overlap significantly
   */
  private patternsOverlap(pattern1: EscalatorPattern, pattern2: EscalatorPattern): boolean {
    const start1 = pattern1.startTime.getTime();
    const end1 = pattern1.endTime.getTime();
    const start2 = pattern2.startTime.getTime();
    const end2 = pattern2.endTime.getTime();
    
    // Calculate overlap
    const overlapStart = Math.max(start1, start2);
    const overlapEnd = Math.min(end1, end2);
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Calculate overlap percentage relative to the shorter pattern
    const duration1 = end1 - start1;
    const duration2 = end2 - start2;
    const minDuration = Math.min(duration1, duration2);
    const overlapPercentage = overlapDuration / minDuration;
    
    // Consider patterns overlapping if they overlap by more than 30%
    return overlapPercentage > 0.3;
  }
  
  /**
   * Detect escalator patterns in a specific direction
   */
  private detectByDirection(data: CandlestickData[], direction: ThrustDirection): EscalatorPattern[] {
    const patterns: EscalatorPattern[] = [];
    
    // Dynamic window sizes to detect different scales of patterns
    for (let windowSize = this.MIN_STEPS * 4; windowSize <= Math.min(data.length, 60); windowSize += 4) {
      // Slide the window through the data
      for (let i = 0; i <= data.length - windowSize; i++) {
        const windowData = data.slice(i, i + windowSize);
        const steps = this.identifySteps(windowData, direction);
        
        if (steps.length >= this.MIN_STEPS) {
          const pattern = this.createEscalatorPattern(windowData, steps, direction);
          
          if (pattern.confidence >= this.MIN_CONFIDENCE) {
            patterns.push(pattern);
          }
        }
      }
    }
    
    return patterns;
  }
  
  /**
   * Identify step formations in the price data
   */
  private identifySteps(
    data: CandlestickData[], 
    direction: ThrustDirection
  ): Array<{
    startTime: Date;
    endTime: Date;
    level: number;
    isConsolidation: boolean;
  }> {
    // Initial state tracking
    const steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }> = [];
    
    let currentMode: 'thrust' | 'consolidation' = 'thrust';
    let currentStepStart = 0;
    let currentLevel = data[0].close;
    
    // Function to calculate volatility in a window
    const calcVolatility = (start: number, end: number): number => {
      const prices = data.slice(start, end + 1).map(d => d.close);
      const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      const deviations = prices.map(p => Math.abs(p - avg) / avg * 100);
      return deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    };
    
    // Function to check if we have a significant price move
    const hasSignificantMove = (start: number, end: number): boolean => {
      const startPrice = data[start].close;
      const endPrice = data[end].close;
      const percentChange = ((endPrice - startPrice) / startPrice) * 100;
      
      // For bullish direction, check for significant upward moves
      // For bearish direction, check for significant downward moves
      return direction === ThrustDirection.BULLISH ? 
        percentChange >= this.MIN_STEP_SIZE : 
        percentChange <= -this.MIN_STEP_SIZE;
    };
    
    // Analyze the data to identify step patterns
    for (let i = 1; i < data.length; i++) {
      if (currentMode === 'thrust') {
        // Check if we've completed a thrust step
        if (i - currentStepStart >= 2 && hasSignificantMove(currentStepStart, i)) {
          // Record this thrust step
          steps.push({
            startTime: new Date(data[currentStepStart].timestamp),
            endTime: new Date(data[i].timestamp),
            level: data[i].close,
            isConsolidation: false
          });
          
          // Update current level and switch to consolidation mode
          currentLevel = data[i].close;
          currentMode = 'consolidation';
          currentStepStart = i;
        }
      } else { // consolidation mode
        const volatility = calcVolatility(currentStepStart, i);
        
        // Check if we're still in a low-volatility consolidation
        if (volatility <= this.MAX_CONSOLIDATION_VOLATILITY) {
          // Still consolidating
          if (i === data.length - 1) {
            // End of data, record the consolidation
            steps.push({
              startTime: new Date(data[currentStepStart].timestamp),
              endTime: new Date(data[i].timestamp),
              level: currentLevel,
              isConsolidation: true
            });
          }
        } else if (hasSignificantMove(currentStepStart, i)) {
          // Volatility broke, check if it's a new thrust in the right direction
          const priceChange = ((data[i].close - currentLevel) / currentLevel) * 100;
          const isCorrectDirection = direction === ThrustDirection.BULLISH ? 
            priceChange > 0 : priceChange < 0;
          
          if (isCorrectDirection) {
            // Record the completed consolidation
            steps.push({
              startTime: new Date(data[currentStepStart].timestamp),
              endTime: new Date(data[i-1].timestamp),
              level: currentLevel,
              isConsolidation: true
            });
            
            // Switch back to thrust mode
            currentMode = 'thrust';
            currentStepStart = i;
          }
        }
      }
    }
    
    return steps;
  }
  
  /**
   * Create an escalator pattern from identified steps
   */
  private createEscalatorPattern(
    data: CandlestickData[],
    steps: Array<{
      startTime: Date;
      endTime: Date;
      level: number;
      isConsolidation: boolean;
    }>,
    direction: ThrustDirection
  ): EscalatorPattern {
    // Determine pattern boundaries
    const startTime = steps[0].startTime;
    const endTime = steps[steps.length - 1].endTime;
    
    // Calculate high and low prices
    const highPrice = Math.max(...data
      .filter(d => {
        const time = new Date(d.timestamp);
        return time >= startTime && time <= endTime;
      })
      .map(d => d.high)
    );
    
    const lowPrice = Math.min(...data
      .filter(d => {
        const time = new Date(d.timestamp);
        return time >= startTime && time <= endTime;
      })
      .map(d => d.low)
    );
    
    // Calculate confidence based on:
    // 1. Number of steps (more is better)
    // 2. Consistency of step sizes
    // 3. Cleanliness of consolidation phases
    
    // Step count factor
    const stepCountFactor = Math.min((steps.length / this.MIN_STEPS) - 0.5, 1);
    
    // Step consistency factor
    const thrustSteps = steps.filter(s => !s.isConsolidation);
    let stepConsistencyFactor = 1.0;
    
    if (thrustSteps.length >= 2) {
      const stepSizes: number[] = [];
      
      // Calculate the % change of each thrust step
      for (let i = 0; i < thrustSteps.length - 1; i++) {
        const startLevel = thrustSteps[i].level;
        const endLevel = thrustSteps[i + 1].level;
        const percentChange = Math.abs((endLevel - startLevel) / startLevel) * 100;
        stepSizes.push(percentChange);
      }
      
      // Calculate the average step size and deviation
      const avgStepSize = stepSizes.reduce((sum, size) => sum + size, 0) / stepSizes.length;
      const deviations = stepSizes.map(size => Math.abs(size - avgStepSize) / avgStepSize);
      const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
      
      // Convert to a factor (lower deviation is better)
      stepConsistencyFactor = 1 - Math.min(avgDeviation, 0.8);
    }
    
    // Consolidation cleanliness factor
    const consolidationSteps = steps.filter(s => s.isConsolidation);
    let consolidationFactor = 0.5; // Default if no consolidation phases
    
    if (consolidationSteps.length > 0) {
      // Check the average volatility of consolidation phases
      const volatilities: number[] = [];
      
      for (const step of consolidationSteps) {
        const relevantData = data.filter(d => {
          const time = new Date(d.timestamp);
          return time >= step.startTime && time <= step.endTime;
        });
        
        if (relevantData.length > 1) {
          const prices = relevantData.map(d => d.close);
          const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
          const deviations = prices.map(p => Math.abs(p - avg) / avg * 100);
          const volatility = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
          
          volatilities.push(volatility);
        }
      }
      
      if (volatilities.length > 0) {
        const avgVolatility = volatilities.reduce((sum, v) => sum + v, 0) / volatilities.length;
        // Convert to a factor (lower volatility is better)
        consolidationFactor = 1 - Math.min(avgVolatility / this.MAX_CONSOLIDATION_VOLATILITY, 1);
      }
    }
    
    // Combine factors for overall confidence
    const confidence = (
      stepCountFactor * 0.4 +
      stepConsistencyFactor * 0.4 +
      consolidationFactor * 0.2
    );
    
    // Create the pattern with all required properties for the enhanced interface
    const pattern: EscalatorPattern = {
      id: uuidv4(),
      type: PatternType.ESCALATOR,
      startTime,
      endTime,
      highPrice,
      lowPrice,
      confidence,
      hasReceivedFeedback: false,
      detectionVersion: '1.0-legacy',
      steps,
      direction,
      // Add required properties for enhanced interface
      stepScores: steps.map(() => 1.0), // Default score for each step
      cumulativeScore: steps.length * 0.5, // Simple calculation based on step count
      signalStrength: steps.length >= 5 ? EscalatorSignalStrength.STRONG : 
                     steps.length >= 4 ? EscalatorSignalStrength.MODERATE : 
                     EscalatorSignalStrength.WEAK,
      priceChanges: steps.map(() => 0.0), // Placeholder for price changes
      volumeChanges: steps.map(() => 0.0), // Placeholder for volume changes
      averageStepHeight: 0.0, // Placeholder for average step height
      stepConsistency: stepConsistencyFactor, // We already have this value
      relatedPatternIds: [] // No related patterns by default
    };
    
    return pattern;
  }
}

export default EscalatorDetector;
