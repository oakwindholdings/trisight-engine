// src/reportGeneration/processing/dataProcessor.ts
// Main data processing orchestrator that coordinates all analysis
// Context: Bridges data fetching with report generation through comprehensive analysis

import { CompanyData } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { createFinancialCalculationsEngine } from './financialCalculations';
import { createPatternDetectionEngine, DetectedPattern } from './patternDetection';
import { createSentimentAnalysisEngine, SentimentResult } from './sentimentAnalysis';

/**
 * Configuration for data processing
 */
export interface ProcessingConfig {
  includePatternDetection?: boolean;
  includeSentimentAnalysis?: boolean;
  includeComparativeAnalysis?: boolean;
  includeValuationMetrics?: boolean; // example-script flags
  includeRiskAssessment?: boolean;
  customCalculations?: any;
}

/**
 * Main data processor that orchestrates all analytical components
 * This class serves as the central hub for transforming raw data into insights
 */
export class DataProcessor {
  private config: ProcessingConfig;
  private financialEngine: any;
  private patternEngine: any;
  private sentimentEngine: any;
  
  constructor(config: ProcessingConfig = {}) {
    this.config = {
      includePatternDetection: true,
      includeSentimentAnalysis: true,
      includeComparativeAnalysis: true,
      ...config
    };
    
    // Initialize processing engines
    this.financialEngine = createFinancialCalculationsEngine();
    this.patternEngine = createPatternDetectionEngine({
      minPatternLength: 5,
      confidenceThreshold: 60,
      lookbackPeriod: 252,
      validateWithVolume: true,
      statisticalValidation: true
    });
    this.sentimentEngine = createSentimentAnalysisEngine({
      enableEntityExtraction: true,
      enableThemeDetection: true,
      enableTemporalAnalysis: true,
      confidenceThreshold: 0.6
    });
  }
  
  /**
   * Processes company data through all analytical pipelines
   * This is where raw data becomes actionable intelligence
   */
  async processData(
    companyData: CompanyData,
    onProgress?: (stage: string, progress: number) => void
  ): Promise<{ companyData: CompanyData; analysis: AnalysisResults; [extra: string]: any }> { // demo callers destructure optional extras (metadata)
    try {
      // Phase 1: Financial Analysis (40% of processing)
      onProgress?.('Performing financial analysis', 10);
      const financialAnalysis = await this.financialEngine.analyze(companyData);
      onProgress?.('Financial analysis complete', 40);
      
      // Phase 2: Pattern Detection (20% of processing)
      let patternAnalysis = null;
      if (this.config.includePatternDetection) {
        onProgress?.('Detecting price patterns', 45);
        
        // Detect patterns in historical price data
        const patterns = await this.patternEngine.detectPatterns(
          companyData.financials.historicalPrices,
          companyData.technicals
        );
        
        // Analyze pattern significance and create summary
        patternAnalysis = this.analyzePatterns(patterns);
        
        onProgress?.('Pattern detection complete', 60);
      }
      
      // Phase 3: Sentiment Analysis (20% of processing)
      let sentimentAnalysis = null;
      if (this.config.includeSentimentAnalysis) {
        onProgress?.('Analyzing market sentiment', 65);
        
        // Analyze news sentiment
        let newsSentiment: SentimentResult | null = null;
        if (companyData.news && companyData.news.length > 0) {
          newsSentiment = await this.sentimentEngine.analyzeNews(companyData.news);
        }
        
        // Analyze transcript sentiment
        let transcriptSentiment: SentimentResult | null = null;
        if (companyData.transcripts && companyData.transcripts.length > 0) {
          transcriptSentiment = await this.sentimentEngine.analyzeTranscripts(companyData.transcripts);
        }
        
        // Combine sentiment analyses
        sentimentAnalysis = this.combineSentimentAnalyses(newsSentiment, transcriptSentiment);
        
        onProgress?.('Sentiment analysis complete', 80);
      }
      
      // Phase 4: Comparative Analysis (10% of processing)
      let comparativeAnalysis = null;
      if (this.config.includeComparativeAnalysis) {
        onProgress?.('Performing peer comparison', 85);
        // Comparative analysis implementation will be added
        onProgress?.('Comparative analysis complete', 90);
      }
      
      // Phase 5: Synthesis and Enrichment (10% of processing)
      onProgress?.('Synthesizing insights', 95);
      const enrichedAnalysis = this.synthesizeAnalyses({
        financial: financialAnalysis,
        patterns: patternAnalysis,
        sentiment: sentimentAnalysis,
        comparative: comparativeAnalysis
      });
      
      onProgress?.('Processing complete', 100);
      
      return {
        companyData: this.enrichCompanyData(companyData, enrichedAnalysis),
        analysis: enrichedAnalysis
      };
      
    } catch (error) {
      console.error('[DataProcessor] Error during processing:', error);
      throw new Error(`Data processing failed: ${error.message}`);
    }
  }
  
  /**
   * Synthesizes multiple analyses into coherent insights
   * This is where we connect the dots between different analytical perspectives
   */
  private synthesizeAnalyses(analyses: any): AnalysisResults {
    const { financial, patterns, sentiment, comparative } = analyses;
    
    // Start with financial analysis as the foundation
    const synthesized = { ...financial };
    
    // Enhance with pattern insights
    if (patterns) {
      // Add pattern analysis to technicals
      synthesized.technicals = {
        ...synthesized.technicals,
        patternAnalysis: patterns
      };
      
      // Adjust momentum score based on pattern momentum
      if (patterns.patternMomentum > 0.7) {
        synthesized.composite.momentum = Math.min(100, synthesized.composite.momentum + 10);
      } else if (patterns.patternMomentum < 0.3) {
        synthesized.composite.momentum = Math.max(0, synthesized.composite.momentum - 10);
      }
      
      // Adjust overall score based on pattern confidence
      if (patterns.averageConfidence > 70) {
        synthesized.composite.overall += 5;
      }
    }
    
    // Incorporate sentiment
    if (sentiment) {
      // Add sentiment results to analysis
      synthesized.sentiment = sentiment;
      
      // Adjust composite score based on sentiment
      const sentimentAdjustment = sentiment.overall === 'positive' ? 5 :
                                 sentiment.overall === 'negative' ? -5 : 0;
      
      synthesized.composite.sentiment = sentiment.score * 100; // Convert to percentage
      synthesized.composite.overall += sentimentAdjustment;
      
      // Adjust momentum based on sentiment trend
      if (sentiment.temporalAnalysis) {
        if (sentiment.temporalAnalysis.trend === 'improving') {
          synthesized.composite.momentum += 5;
        } else if (sentiment.temporalAnalysis.trend === 'declining') {
          synthesized.composite.momentum -= 5;
        }
      }
      
      // Add sentiment confidence to overall confidence
      synthesized.composite.confidence = 
        (synthesized.composite.confidence + sentiment.confidence * 100) / 2;
    }
    
    // Add comparative context
    if (comparative) {
      synthesized.comparative = comparative;
    }
    
    return synthesized;
  }
  
  /**
   * Enriches company data with calculated insights
   * Adds analysis results back into the company data structure
   */
  private enrichCompanyData(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): CompanyData {
    return {
      ...companyData,
      analysis, // Add analysis results
      metadata: {
        ...companyData.metadata,
        processingTimestamp: new Date().toISOString(),
        analysisVersion: '1.0'
      }
    };
  }
  
  /**
   * Analyzes detected patterns to create actionable insights
   * Groups patterns by type and calculates aggregate metrics
   */
  private analyzePatterns(patterns: DetectedPattern[]): any {
    if (!patterns || patterns.length === 0) {
      return {
        patternCount: 0,
        dominantPattern: null,
        bullishPatterns: 0,
        bearishPatterns: 0,
        averageConfidence: 0,
        keyPatterns: []
      };
    }
    
    // Group patterns by type
    const patternGroups = patterns.reduce((groups, pattern) => {
      const type = pattern.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(pattern);
      return groups;
    }, {} as Record<string, DetectedPattern[]>);
    
    // Count bullish vs bearish
    const bullishPatterns = patterns.filter(p => p.direction === 'bullish').length;
    const bearishPatterns = patterns.filter(p => p.direction === 'bearish').length;
    const neutralPatterns = patterns.filter(p => p.direction === 'neutral').length;
    
    // Calculate average confidence
    const averageConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    
    // Find dominant pattern type
    const dominantType = Object.entries(patternGroups)
      .sort(([, a], [, b]) => b.length - a.length)[0]?.[0] || null;
    
    // Get most significant patterns (top 5 by confidence)
    const keyPatterns = [...patterns]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(p => ({
        type: p.type,
        direction: p.direction,
        confidence: p.confidence,
        targetPrice: p.targetPrice,
        stopLoss: p.stopLoss,
        probability: p.probability,
        startDate: p.startDate,
        endDate: p.endDate
      }));
    
    // Calculate pattern momentum (recent patterns weighted higher)
    const recentPatterns = patterns.filter(p => {
      const daysAgo = (new Date().getTime() - new Date(p.endDate).getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo < 30;
    });
    
    const patternMomentum = recentPatterns.length > 0
      ? recentPatterns.filter(p => p.direction === 'bullish').length / recentPatterns.length
      : 0.5;
    
    return {
      patternCount: patterns.length,
      dominantPattern: dominantType,
      bullishPatterns,
      bearishPatterns,
      neutralPatterns,
      averageConfidence,
      patternMomentum,
      keyPatterns,
      patternGroups: Object.entries(patternGroups).map(([type, group]) => ({
        type,
        count: group.length,
        avgConfidence: group.reduce((sum, p) => sum + p.confidence, 0) / group.length
      }))
    };
  }
  
  /**
   * Combines news and transcript sentiment analyses
   * Provides a holistic view of market sentiment
   */
  private combineSentimentAnalyses(
    newsSentiment: SentimentResult | null,
    transcriptSentiment: SentimentResult | null
  ): any {
    // If only one source available, return it
    if (!newsSentiment && !transcriptSentiment) return null;
    if (!newsSentiment) return { source: 'transcripts', ...transcriptSentiment };
    if (!transcriptSentiment) return { source: 'news', ...newsSentiment };
    
    // Combine both sources with transcript weighted higher (more direct)
    const combinedScore = newsSentiment.score * 0.4 + transcriptSentiment.score * 0.6;
    const combinedConfidence = (newsSentiment.confidence + transcriptSentiment.confidence) / 2;
    
    // Merge themes and entities
    const allThemes = [...newsSentiment.themes, ...transcriptSentiment.themes];
    const uniqueThemes = this.deduplicateThemes(allThemes);
    
    const allEntities = [...newsSentiment.entities, ...transcriptSentiment.entities];
    const uniqueEntities = this.deduplicateEntities(allEntities);
    
    // Combine key phrases
    const allPhrases = [...newsSentiment.keyPhrases, ...transcriptSentiment.keyPhrases];
    const uniquePhrases = this.deduplicateKeyPhrases(allPhrases);
    
    return {
      source: 'combined',
      overall: combinedScore > 0.1 ? 'positive' : combinedScore < -0.1 ? 'negative' : 'neutral',
      score: combinedScore,
      confidence: combinedConfidence,
      dimensions: {
        ...newsSentiment.dimensions,
        ...transcriptSentiment.dimensions,
        marketPerception: newsSentiment.score,
        managementSentiment: transcriptSentiment.score
      },
      emotions: {
        optimism: (newsSentiment.emotions.optimism + transcriptSentiment.emotions.optimism) / 2,
        concern: (newsSentiment.emotions.concern + transcriptSentiment.emotions.concern) / 2,
        uncertainty: (newsSentiment.emotions.uncertainty + transcriptSentiment.emotions.uncertainty) / 2,
        confidence: (newsSentiment.emotions.confidence + transcriptSentiment.emotions.confidence) / 2
      },
      themes: uniqueThemes.slice(0, 10),
      entities: uniqueEntities.slice(0, 20),
      keyPhrases: uniquePhrases.slice(0, 15),
      temporalAnalysis: newsSentiment.temporalAnalysis, // News provides better temporal view
      summary: this.generateCombinedSummary(newsSentiment, transcriptSentiment)
    };
  }
  
  /**
   * Deduplicates themes from multiple sources
   */
  private deduplicateThemes(themes: any[]): any[] {
    const themeMap = new Map();
    
    themes.forEach(theme => {
      const existing = themeMap.get(theme.name);
      if (existing) {
        existing.mentions += theme.mentions;
        existing.relevance = Math.max(existing.relevance, theme.relevance);
        existing.sentiment = (existing.sentiment + theme.sentiment) / 2;
      } else {
        themeMap.set(theme.name, { ...theme });
      }
    });
    
    return Array.from(themeMap.values())
      .sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * Deduplicates entities from multiple sources
   */
  private deduplicateEntities(entities: any[]): any[] {
    const entityMap = new Map();
    
    entities.forEach(entity => {
      const existing = entityMap.get(entity.name);
      if (existing) {
        existing.mentions += entity.mentions;
        existing.sentiment = (existing.sentiment + entity.sentiment) / 2;
      } else {
        entityMap.set(entity.name, { ...entity });
      }
    });
    
    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions);
  }
  
  /**
   * Deduplicates key phrases from multiple sources
   */
  private deduplicateKeyPhrases(phrases: any[]): any[] {
    const phraseMap = new Map();
    
    phrases.forEach(phrase => {
      const existing = phraseMap.get(phrase.phrase);
      if (existing) {
        existing.frequency += phrase.frequency;
        existing.importance = Math.max(existing.importance, phrase.importance);
        existing.sentiment = (existing.sentiment + phrase.sentiment) / 2;
      } else {
        phraseMap.set(phrase.phrase, { ...phrase });
      }
    });
    
    return Array.from(phraseMap.values())
      .sort((a, b) => b.importance - a.importance);
  }
  
  /**
   * Generates combined sentiment summary
   */
  private generateCombinedSummary(
    newsSentiment: SentimentResult,
    transcriptSentiment: SentimentResult
  ): string {
    let summary = 'Combined analysis shows ';
    
    // Compare news vs transcript sentiment
    if (Math.sign(newsSentiment.score) === Math.sign(transcriptSentiment.score)) {
      summary += `aligned ${newsSentiment.overall} sentiment between market perception and management communication. `;
    } else {
      summary += `divergent sentiment with ${newsSentiment.overall} market perception but ${transcriptSentiment.overall} management tone. `;
    }
    
    // Add key themes
    const topThemes = [...newsSentiment.themes, ...transcriptSentiment.themes]
      .slice(0, 3)
      .map(t => t.name);
    
    if (topThemes.length > 0) {
      summary += `Key themes: ${topThemes.join(', ')}. `;
    }
    
    // Add confidence note
    const avgConfidence = (newsSentiment.confidence + transcriptSentiment.confidence) / 2;
    summary += `Analysis confidence: ${avgConfidence > 0.7 ? 'high' : avgConfidence > 0.5 ? 'moderate' : 'low'}.`;
    
    return summary;
  }
}

/**
 * Factory function for creating data processors
 */
export function createDataProcessor(config?: ProcessingConfig): DataProcessor {
  return new DataProcessor(config);
}