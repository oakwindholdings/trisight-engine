// src/utils/patternDetection/core/PatternRelationshipTracker.ts
// Tracks relationships between patterns
// Used for advanced analytics
import { 
  Pattern, 
  PatternType, 
  BlackjackPattern, 
  GoldmineShaftPattern,
  GoldmineChannelPattern,
  ThrustDirection
} from '../../../models/PatternTypes';
import { MarketContext } from './MarketContext';

/**
 * Types of relationships between patterns
 */
export enum RelationshipType {
  EXTENSION = 'EXTENSION',         // One pattern extends or continues another
  CONFIRMATION = 'CONFIRMATION',   // One pattern confirms another 
  CONTRADICTION = 'CONTRADICTION', // Patterns contradict each other
  TRANSITION = 'TRANSITION',       // One pattern leads into another
  COMPONENT = 'COMPONENT',         // One pattern is a component of another
  NESTED = 'NESTED'                // One pattern is nested within another
}

/**
 * Represents a relationship between two patterns
 */
export interface PatternRelationship {
  sourcePattern: Pattern;
  relatedPattern: Pattern;
  relationshipType: RelationshipType;
  strength: number; // 0.0 to 1.0
  description: string;
}

/**
 * Extended pattern with relationship metadata
 * Using intersection type instead of extension since Pattern is a union type
 */
export type EnhancedPattern = Pattern & {
  relationships: PatternRelationship[];
  visualComponents?: any[]; // For rendering
  keyPoints?: { time: Date; price: number; description: string }[];
  annotations?: { text: string; position: { time: Date; price: number } }[];
  projectedOutcomes?: {
    scenario: string;
    probability: number;
    priceTargets: { price: number; confidence: number }[];
  }[];
}

/**
 * Tracks and analyzes relationships between different patterns
 */
export class PatternRelationshipTracker {
  
  /**
   * Process pattern relationships and enhance patterns with relationship metadata
   */
  public processPatternRelationships(
    patterns: Pattern[], 
    context: MarketContext
  ): EnhancedPattern[] {
    if (patterns.length <= 1) {
      // No relationships possible with 0 or 1 patterns
      return patterns.map(p => this.enhancePattern(p, []));
    }
    
    console.log(`Processing relationships between ${patterns.length} patterns`);
    
    // All identified relationships
    const relationships: PatternRelationship[] = [];
    
    // Detect temporal relationships (patterns that follow one another)
    relationships.push(...this.detectTemporalRelationships(patterns));
    
    // Detect spatial relationships (patterns that overlap)
    relationships.push(...this.detectSpatialRelationships(patterns));
    
    // Detect type-specific relationships
    relationships.push(...this.detectTypeSpecificRelationships(patterns, context));
    
    // Detect BlackJack confirmation relationships
    relationships.push(...this.detectBlackjackRelationships(patterns, context));
    
    console.log(`Identified ${relationships.length} pattern relationships`);
    
    // Group relationships by pattern
    const relationshipsByPattern = new Map<string, PatternRelationship[]>();
    
    for (const relationship of relationships) {
      // Add to source pattern
      const sourceRelationships = relationshipsByPattern.get(relationship.sourcePattern.id) || [];
      sourceRelationships.push(relationship);
      relationshipsByPattern.set(relationship.sourcePattern.id, sourceRelationships);
      
      // Add to related pattern with reversed relationship
      const reversedRelationship = this.reverseRelationship(relationship);
      const targetRelationships = relationshipsByPattern.get(relationship.relatedPattern.id) || [];
      targetRelationships.push(reversedRelationship);
      relationshipsByPattern.set(relationship.relatedPattern.id, targetRelationships);
    }
    
    // Enhance patterns with their relationships
    return patterns.map(pattern => {
      const patternRelationships = relationshipsByPattern.get(pattern.id) || [];
      return this.enhancePattern(pattern, patternRelationships);
    });
  }
  
  /**
   * Detects relationships between patterns based on their temporal sequence
   */
  private detectTemporalRelationships(patterns: Pattern[]): PatternRelationship[] {
    const relationships: PatternRelationship[] = [];
    
    // Sort patterns by start time
    const sortedPatterns = [...patterns].sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );
    
    for (let i = 0; i < sortedPatterns.length - 1; i++) {
      const current = sortedPatterns[i];
      
      // Look for patterns that start soon after this one ends
      for (let j = i + 1; j < sortedPatterns.length; j++) {
        const next = sortedPatterns[j];
        
        // Skip if next pattern starts before current ends
        if (next.startTime < current.endTime) continue;
        
        // Calculate time gap between patterns
        const gapMs = next.startTime.getTime() - current.endTime.getTime();
        const patternDurationMs = current.endTime.getTime() - current.startTime.getTime();
        
        // Only consider transitions with a reasonably small gap
        // (less than half the duration of the first pattern)
        if (gapMs <= patternDurationMs / 2) {
          // Strength inversely proportional to gap
          const strength = Math.max(0, Math.min(1, 1 - (gapMs / patternDurationMs)));
          
          relationships.push({
            sourcePattern: current,
            relatedPattern: next,
            relationshipType: RelationshipType.TRANSITION,
            strength,
            description: `${current.type} transitions to ${next.type} with ${gapMs}ms gap`
          });
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Detects relationships between patterns based on spatial overlap
   */
  private detectSpatialRelationships(patterns: Pattern[]): PatternRelationship[] {
    const relationships: PatternRelationship[] = [];
    
    for (let i = 0; i < patterns.length; i++) {
      for (let j = i + 1; j < patterns.length; j++) {
        const p1 = patterns[i];
        const p2 = patterns[j];
        
        // Check for temporal overlap
        if (this.patternsOverlap(p1, p2)) {
          // Determine relationship type based on overlap characteristics
          const relationshipType = this.determineOverlapRelationship(p1, p2);
          
          // Calculate overlap percentage
          const overlapStrength = this.calculateOverlapStrength(p1, p2);
          
          relationships.push({
            sourcePattern: p1,
            relatedPattern: p2,
            relationshipType,
            strength: overlapStrength,
            description: `${p1.type} ${relationshipType.toLowerCase()} with ${p2.type}`
          });
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Detects relationships specific to certain pattern type combinations
   */
  private detectTypeSpecificRelationships(
    patterns: Pattern[],
    context: MarketContext
  ): PatternRelationship[] {
    const relationships: PatternRelationship[] = [];
    
    // Process each pattern pair
    for (let i = 0; i < patterns.length; i++) {
      for (let j = 0; j < patterns.length; j++) {
        if (i === j) continue; // Skip self
        
        const p1 = patterns[i];
        const p2 = patterns[j];
        
        // Check for type-specific relationships
        switch (p1.type) {
          case PatternType.GOLDMINE_CHANNEL:
            if (p2.type === PatternType.GOLDMINE_SHAFT) {
              // Channel to Shaft relationship
              relationships.push(...this.analyzeChannelShaftRelationship(p1, p2));
            } else if (p2.type === PatternType.PIVOT) {
              // Channel to Pivot relationship
              relationships.push(...this.analyzeChannelPivotRelationship(p1, p2));
            }
            break;
            
          case PatternType.GOLDMINE_SHAFT:
            if (p2.type === PatternType.ESCALATOR) {
              // Shaft to Escalator relationship
              relationships.push(...this.analyzeShaftEscalatorRelationship(p1, p2));
            } else if (p2.type === PatternType.ROCKETMAN) {
              // Shaft to Rocketman relationship
              relationships.push(...this.analyzeShaftRocketmanRelationship(p1, p2));
            }
            break;
            
          case PatternType.BLACKJACK:
            // Blackjack confirms other patterns
            relationships.push(...this.analyzeBlackjackConfirmation(p1, p2));
            break;
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Enhances a pattern with relationship data and additional metadata
   */
  private enhancePattern(
    pattern: Pattern, 
    relationships: PatternRelationship[]
  ): EnhancedPattern {
    // Create basic enhanced pattern
    const enhanced: EnhancedPattern = {
      ...pattern,
      relationships
    };
    
    // Add visualization components based on pattern type
    enhanced.visualComponents = this.generateVisualComponents(pattern);
    
    // Add key points based on pattern type
    enhanced.keyPoints = this.generateKeyPoints(pattern);
    
    // Add annotations
    enhanced.annotations = this.generateAnnotations(pattern, relationships);
    
    // Add projected outcomes
    enhanced.projectedOutcomes = this.generateProjections(pattern, relationships);
    
    return enhanced;
  }
  
  /**
   * Generates visual components for rendering the pattern
   */
  private generateVisualComponents(pattern: Pattern): any[] {
    // Generate specific visualization components based on pattern type
    switch(pattern.type) {
      case PatternType.BLACKJACK:
        const blackjackPattern = pattern as BlackjackPattern;
        return [{
          type: 'blackjack-score',
          score: blackjackPattern.cumulativeScore,
          intrinsicScores: blackjackPattern.intrinsicScores,
          signalStrength: blackjackPattern.signalStrength,
          contextScore: blackjackPattern.contextScore
        }];
      default:
        return [];
    }
  }
  
  /**
   * Generates key points that define the pattern
   */
  private generateKeyPoints(pattern: Pattern): { time: Date; price: number; description: string }[] {
    // Placeholder implementation
    // Would implement pattern-specific key point logic
    return [];
  }
  
  /**
   * Generates annotations for the pattern
   */
  private generateAnnotations(
    pattern: Pattern, 
    relationships: PatternRelationship[]
  ): { text: string; position: { time: Date; price: number } }[] {
    // Placeholder implementation
    // Would implement pattern-specific annotation logic
    return [];
  }
  
  /**
   * Generates projected outcomes for the pattern
   */
  private generateProjections(
    pattern: Pattern,
    relationships: PatternRelationship[]
  ): {
    scenario: string;
    probability: number;
    priceTargets: { price: number; confidence: number }[];
  }[] {
    // Placeholder implementation
    // Would implement pattern-specific projection logic
    return [];
  }
  
  /**
   * Checks if two patterns overlap in time
   */
  private patternsOverlap(p1: Pattern, p2: Pattern): boolean {
    return p1.startTime < p2.endTime && p2.startTime < p1.endTime;
  }
  
  /**
   * Determines the type of relationship between overlapping patterns
   */
  private determineOverlapRelationship(p1: Pattern, p2: Pattern): RelationshipType {
    // Check for nesting
    if (p1.startTime <= p2.startTime && p1.endTime >= p2.endTime) {
      return RelationshipType.NESTED;
    }
    
    // Check for component relationship
    if (p2.startTime <= p1.startTime && p2.endTime >= p1.endTime) {
      return RelationshipType.COMPONENT;
    }
    
    // Default to confirmation unless contradictory
    // (Contradictions would be determined by comparing pattern directions)
    return RelationshipType.CONFIRMATION;
  }
  
  /**
   * Calculates the strength of overlap between two patterns
   */
  private calculateOverlapStrength(p1: Pattern, p2: Pattern): number {
    const p1Duration = p1.endTime.getTime() - p1.startTime.getTime();
    const p2Duration = p2.endTime.getTime() - p2.startTime.getTime();
    
    const overlapStart = Math.max(p1.startTime.getTime(), p2.startTime.getTime());
    const overlapEnd = Math.min(p1.endTime.getTime(), p2.endTime.getTime());
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Calculate overlap percentage relative to the shorter pattern
    const minDuration = Math.min(p1Duration, p2Duration);
    return Math.min(1, overlapDuration / minDuration);
  }
  
  /**
   * Creates a reversed version of a relationship
   */
  private reverseRelationship(relationship: PatternRelationship): PatternRelationship {
    // Define reversed relationship types
    const reversedType = this.getReverseRelationshipType(relationship.relationshipType);
    
    return {
      sourcePattern: relationship.relatedPattern,
      relatedPattern: relationship.sourcePattern,
      relationshipType: reversedType,
      strength: relationship.strength,
      description: `${relationship.relatedPattern.type} ${reversedType.toLowerCase()} with ${relationship.sourcePattern.type}`
    };
  }
  
  /**
   * Returns the reverse relationship type
   */
  private getReverseRelationshipType(type: RelationshipType): RelationshipType {
    switch (type) {
      case RelationshipType.COMPONENT:
        return RelationshipType.NESTED;
      case RelationshipType.NESTED:
        return RelationshipType.COMPONENT;
      case RelationshipType.EXTENSION:
        return RelationshipType.TRANSITION;
      case RelationshipType.TRANSITION:
        return RelationshipType.EXTENSION;
      default:
        return type; // CONFIRMATION, CONTRADICTION are symmetric
    }
  }
  
  /**
   * Analyzes relationship between Channel and Shaft patterns
   */
  private analyzeChannelShaftRelationship(
    channel: Pattern, 
    shaft: Pattern
  ): PatternRelationship[] {
    // Placeholder implementation
    // Would analyze if shaft starts/ends at channel boundaries
    return [];
  }
  
  /**
   * Analyzes relationship between Channel and Pivot patterns
   */
  private analyzeChannelPivotRelationship(
    channel: Pattern, 
    pivot: Pattern
  ): PatternRelationship[] {
    // Placeholder implementation
    // Would analyze if pivot occurs at channel boundary
    return [];
  }
  
  /**
   * Analyzes relationship between Shaft and Escalator patterns
   */
  private analyzeShaftEscalatorRelationship(
    shaft: Pattern, 
    escalator: Pattern
  ): PatternRelationship[] {
    // Placeholder implementation
    // Would analyze if shaft is part of escalator structure
    return [];
  }
  
  /**
   * Analyzes relationship between Shaft and Rocketman patterns
   */
  private analyzeShaftRocketmanRelationship(
    shaft: Pattern, 
    rocketman: Pattern
  ): PatternRelationship[] {
    // Placeholder implementation
    // Would analyze if rocketman extends a shaft
    return [];
  }
  
  /**
   * Detects relationships involving BlackJack patterns
   */
  private detectBlackjackRelationships(
    patterns: Pattern[],
    context: MarketContext
  ): PatternRelationship[] {
    const relationships: PatternRelationship[] = [];
    
    // Filter BlackJack patterns
    const blackjackPatterns = patterns.filter(p => 
      p.type === PatternType.BLACKJACK
    ) as BlackjackPattern[];
    
    // Filter non-BlackJack patterns
    const otherPatterns = patterns.filter(p => 
      p.type !== PatternType.BLACKJACK
    );
    
    // For each BlackJack pattern, analyze relationship with other patterns
    for (const blackjack of blackjackPatterns) {
      for (const other of otherPatterns) {
        // Only consider patterns where BlackJack is within or overlapping
        if (this.patternsOverlap(blackjack, other)) {
          relationships.push(...this.analyzeBlackjackConfirmation(blackjack, other));
        }
      }
    }
    
    return relationships;
  }
  
  /**
   * Analyzes how Blackjack patterns confirm other patterns
   */
  private analyzeBlackjackConfirmation(
    blackjack: BlackjackPattern, 
    other: Pattern
  ): PatternRelationship[] {
    const relationships: PatternRelationship[] = [];
    
    // Get the direction of the other pattern if applicable
    let otherDirection: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    
    if (other.type === PatternType.GOLDMINE_SHAFT) {
      const shaftPattern = other as GoldmineShaftPattern;
      otherDirection = shaftPattern.direction === ThrustDirection.BULLISH ? 'bullish' : 'bearish';
    } else if (other.type === PatternType.GOLDMINE_CHANNEL) {
      const channelPattern = other as GoldmineChannelPattern;
      otherDirection = 
        channelPattern.direction === 'ASCENDING' ? 'bullish' : 
        channelPattern.direction === 'DESCENDING' ? 'bearish' : 'neutral';
    }
    
    // BlackJack is bullish if cumulative score is positive
    const blackjackDirection = blackjack.cumulativeScore > 0 ? 'bullish' : 
                             blackjack.cumulativeScore < 0 ? 'bearish' : 'neutral';
    
    // If BlackJack and other pattern align in direction, it's a confirmation
    if (blackjackDirection === otherDirection) {
      relationships.push({
        sourcePattern: blackjack,
        relatedPattern: other,
        relationshipType: RelationshipType.CONFIRMATION,
        strength: Math.min(1, Math.abs(blackjack.cumulativeScore) / 5) * 0.7 + 0.3, // Scale based on score
        description: `${blackjack.type} confirms ${other.type} with volume-price correlation`
      });
    } 
    // If they contradict, it's a contradiction relationship
    else if (blackjackDirection !== 'neutral' && otherDirection !== 'neutral' && blackjackDirection !== otherDirection) {
      relationships.push({
        sourcePattern: blackjack,
        relatedPattern: other,
        relationshipType: RelationshipType.CONTRADICTION,
        strength: Math.min(1, Math.abs(blackjack.cumulativeScore) / 5) * 0.7 + 0.3, // Scale based on score
        description: `${blackjack.type} contradicts ${other.type} with opposite volume-price correlation`
      });
    }
    
    return relationships;
  }
}
