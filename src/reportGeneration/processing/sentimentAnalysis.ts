// src/reportGeneration/processing/sentimentAnalysis.ts
// Sophisticated sentiment analysis engine for financial text processing
// Context: Extracts market sentiment and themes from news, transcripts, and reports

import { NewsItem, TranscriptData } from '../models/reportTypes';

/**
 * Sentiment analysis configuration
 * These parameters control the depth and focus of analysis
 */
export interface SentimentAnalysisConfig {
  enableEntityExtraction: boolean;
  enableThemeDetection: boolean;
  enableTemporalAnalysis: boolean;
  customDictionary?: FinancialDictionary;
  confidenceThreshold: number;
  languages: string[];
}

/**
 * Financial-specific sentiment dictionary
 * Maps terms to sentiment scores with context awareness
 */
export interface FinancialDictionary {
  positive: { [term: string]: number };
  negative: { [term: string]: number };
  neutral: { [term: string]: number };
  modifiers: { [term: string]: number }; // Intensifiers/diminishers
  contextual: { [phrase: string]: { sentiment: number; context: string } };
}

/**
 * Analyzed sentiment result structure
 * Contains multi-dimensional sentiment analysis
 */
export interface SentimentResult {
  overall: 'positive' | 'neutral' | 'negative';
  score: number; // -1 to 1
  confidence: number; // 0 to 1
  dimensions: {
    financial: number;
    operational: number;
    strategic: number;
    competitive: number;
    regulatory: number;
  };
  emotions: {
    optimism: number;
    concern: number;
    uncertainty: number;
    confidence: number;
  };
  themes: Theme[];
  entities: Entity[];
  temporalAnalysis?: TemporalSentiment;
  keyPhrases: KeyPhrase[];
  summary: string;
}

/**
 * Represents a key theme in the text
 */
export interface Theme {
  name: string;
  relevance: number;
  sentiment: number;
  mentions: number;
  examples: string[];
}

/**
 * Represents an entity (company, person, product)
 */
export interface Entity {
  name: string;
  type: 'company' | 'person' | 'product' | 'technology' | 'location';
  sentiment: number;
  mentions: number;
  context: string[];
}

/**
 * Temporal sentiment tracking
 */
export interface TemporalSentiment {
  trend: 'improving' | 'stable' | 'declining';
  momentum: number;
  volatility: number;
  changes: SentimentChange[];
}

/**
 * Sentiment change event
 */
export interface SentimentChange {
  date: string;
  fromScore: number;
  toScore: number;
  magnitude: number;
  trigger?: string;
}

/**
 * Key phrase with sentiment
 */
export interface KeyPhrase {
  phrase: string;
  sentiment: number;
  importance: number;
  frequency: number;
}

/**
 * Main sentiment analysis engine
 * This class orchestrates all NLP operations for financial text
 */
export class SentimentAnalysisEngine {
  private config: SentimentAnalysisConfig;
  private dictionary: FinancialDictionary;
  private readonly DEFAULT_DICTIONARY = this.createDefaultDictionary();
  
  constructor(config: Partial<SentimentAnalysisConfig> = {}) {
    this.config = {
      enableEntityExtraction: true,
      enableThemeDetection: true,
      enableTemporalAnalysis: true,
      confidenceThreshold: 0.6,
      languages: ['en'],
      ...config
    };
    
    this.dictionary = config.customDictionary || this.DEFAULT_DICTIONARY;
  }
  
  /**
   * Analyzes sentiment from multiple news items
   * Aggregates and synthesizes sentiment across sources
   */
  async analyzeNews(newsItems: NewsItem[]): Promise<SentimentResult> {
    if (!newsItems || newsItems.length === 0) {
      return this.getEmptySentimentResult();
    }
    
    // Analyze individual articles
    const articleAnalyses = await Promise.all(
      newsItems.map(item => this.analyzeText(
        `${item.title}. ${item.summary || ''}`,
        {
          source: 'news',
          date: item.publishedDate,
          metadata: item
        }
      ))
    );
    
    // Weight by recency and source credibility
    const weightedAnalyses = this.weightAnalysesByImportance(
      articleAnalyses,
      newsItems
    );
    
    // Aggregate results
    const aggregated = this.aggregateSentiments(weightedAnalyses);
    
    // Add temporal analysis if enabled
    if (this.config.enableTemporalAnalysis) {
      aggregated.temporalAnalysis = this.analyzeTemporalTrends(
        articleAnalyses,
        newsItems
      );
    }
    
    // Generate summary
    aggregated.summary = this.generateSentimentSummary(
      aggregated,
      newsItems.length
    );
    
    return aggregated;
  }
  
  /**
   * Analyzes sentiment from earnings transcripts
   * Focuses on management tone and forward-looking statements
   */
  async analyzeTranscripts(transcripts: TranscriptData[]): Promise<SentimentResult> {
    if (!transcripts || transcripts.length === 0) {
      return this.getEmptySentimentResult();
    }
    
    // Analyze each transcript
    const transcriptAnalyses = await Promise.all(
      transcripts.map(transcript => this.analyzeTranscript(transcript))
    );
    
    // Weight more recent transcripts higher
    const weighted = transcriptAnalyses.map((analysis, index) => ({
      ...analysis,
      weight: Math.pow(0.8, index) // Exponential decay
    }));
    
    // Aggregate with special focus on management sentiment
    const aggregated = this.aggregateSentiments(weighted);
    
    // Extract key management themes
    aggregated.themes = this.extractManagementThemes(transcripts);
    
    // Add transcript-specific insights
    aggregated.dimensions = {
      ...aggregated.dimensions,
      managementTone: this.assessManagementTone(transcripts),
      guidanceQuality: this.assessGuidanceQuality(transcripts)
    };
    
    return aggregated;
  }
  
  /**
   * Analyzes a single text with context
   * Core sentiment analysis function
   */
  async analyzeText(
    text: string,
    context?: {
      source?: string;
      date?: string;
      metadata?: any;
    }
  ): Promise<SentimentResult> {
    // Preprocess text
    const processed = this.preprocessText(text);
    
    // Extract sentences for granular analysis
    const sentences = this.extractSentences(processed);
    
    // Analyze each sentence
    const sentenceScores = sentences.map(sentence => 
      this.analyzeSentence(sentence)
    );
    
    // Calculate overall sentiment
    const overallScore = this.calculateOverallScore(sentenceScores);
    const overall = this.scoreToSentiment(overallScore);
    
    // Extract dimensions
    const dimensions = this.extractDimensions(processed);
    
    // Extract emotions
    const emotions = this.extractEmotions(processed);
    
    // Extract themes if enabled
    const themes = this.config.enableThemeDetection
      ? this.extractThemes(processed)
      : [];
    
    // Extract entities if enabled
    const entities = this.config.enableEntityExtraction
      ? this.extractEntities(processed)
      : [];
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(processed);
    
    // Calculate confidence based on multiple factors
    const confidence = this.calculateConfidence(
      sentenceScores,
      processed.length
    );
    
    return {
      overall,
      score: overallScore,
      confidence,
      dimensions,
      emotions,
      themes,
      entities,
      keyPhrases,
      summary: ''
    };
  }
  
  /**
   * Analyzes a single earnings transcript
   * Specialized analysis for management communication
   */
  private async analyzeTranscript(transcript: TranscriptData): Promise<SentimentResult> {
    // Analyze full text if available
    const baseAnalysis = await this.analyzeText(
      transcript.fullText || transcript.keyHighlights.join('. '),
      {
        source: 'transcript',
        date: transcript.date
      }
    );
    
    // Enhance with transcript-specific analysis
    
    // Analyze Q&A section separately (often more revealing)
    const qaAnalysis = this.analyzeQASection(transcript);
    
    // Detect forward-looking statements
    const forwardLooking = this.detectForwardLookingStatements(
      transcript.fullText || transcript.keyHighlights.join(' ')
    );
    
    // Merge analyses with Q&A weighted higher
    return {
      ...baseAnalysis,
      score: baseAnalysis.score * 0.6 + qaAnalysis.score * 0.4,
      dimensions: {
        ...baseAnalysis.dimensions,
        qasentiment: qaAnalysis.score,
        forwardLookingConfidence: forwardLooking.confidence
      }
    };
  }
  
  /**
   * Creates default financial sentiment dictionary
   * Contains common financial terms and their sentiment associations
   */
  private createDefaultDictionary(): FinancialDictionary {
    return {
      positive: {
        // Growth terms
        'growth': 0.8,
        'expansion': 0.8,
        'increase': 0.7,
        'improve': 0.7,
        'accelerate': 0.8,
        'momentum': 0.6,
        'record': 0.8,
        'strong': 0.7,
        'robust': 0.7,
        'outperform': 0.9,
        
        // Financial performance
        'profit': 0.7,
        'profitable': 0.8,
        'margin': 0.5,
        'revenue': 0.6,
        'earnings': 0.6,
        'beat': 0.9,
        'exceed': 0.8,
        
        // Strategic terms
        'innovation': 0.7,
        'breakthrough': 0.9,
        'transform': 0.7,
        'disrupt': 0.6,
        'leading': 0.7,
        'competitive advantage': 0.8,
        
        // Market position
        'market share': 0.7,
        'demand': 0.6,
        'adoption': 0.7,
        'traction': 0.7,
        'penetration': 0.6
      },
      
      negative: {
        // Decline terms
        'decline': -0.8,
        'decrease': -0.7,
        'fall': -0.7,
        'drop': -0.7,
        'slow': -0.6,
        'weak': -0.7,
        'deteriorate': -0.8,
        'worsen': -0.8,
        
        // Financial concerns
        'loss': -0.8,
        'unprofitable': -0.8,
        'debt': -0.5,
        'writedown': -0.9,
        'impairment': -0.9,
        'miss': -0.8,
        
        // Risk terms
        'risk': -0.5,
        'threat': -0.7,
        'challenge': -0.6,
        'difficult': -0.6,
        'concern': -0.6,
        'uncertain': -0.6,
        'volatile': -0.5,
        
        // Competitive concerns
        'competition': -0.5,
        'pressure': -0.6,
        'erosion': -0.7,
        'commoditization': -0.8
      },
      
      neutral: {
        'maintain': 0,
        'stable': 0,
        'continue': 0,
        'ongoing': 0,
        'expect': 0,
        'anticipate': 0,
        'project': 0,
        'estimate': 0
      },
      
      modifiers: {
        // Intensifiers
        'very': 1.2,
        'extremely': 1.5,
        'significantly': 1.3,
        'substantially': 1.3,
        'dramatically': 1.4,
        
        // Diminishers
        'slightly': 0.5,
        'somewhat': 0.6,
        'moderately': 0.7,
        'partially': 0.6
      },
      
      contextual: {
        // Phrases that change meaning with context
        'restructuring': {
          sentiment: -0.3,
          context: 'short-term negative, potential long-term positive'
        },
        'investment': {
          sentiment: 0.2,
          context: 'positive if growth-oriented, negative if defensive'
        },
        'acquisition': {
          sentiment: 0.3,
          context: 'depends on strategic fit and price'
        },
        'guidance': {
          sentiment: 0,
          context: 'sentiment depends on revision direction'
        }
      }
    };
  }
  
  /**
   * Preprocesses text for analysis
   * Handles financial text-specific preprocessing
   */
  private preprocessText(text: string): string {
    // Convert to lowercase for analysis
    let processed = text.toLowerCase();
    
    // Expand common financial abbreviations
    const abbreviations = {
      'yoy': 'year over year',
      'qoq': 'quarter over quarter',
      'mom': 'month over month',
      'ttm': 'trailing twelve months',
      'cagr': 'compound annual growth rate',
      'ebitda': 'earnings before interest taxes depreciation amortization',
      'fcf': 'free cash flow',
      'roi': 'return on investment',
      'roic': 'return on invested capital'
    };
    
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      processed = processed.replace(new RegExp(`\\b${abbr}\\b`, 'gi'), full);
    });
    
    // Normalize numbers and percentages
    processed = processed.replace(/\$[\d,]+\.?\d*/g, 'MONEY_AMOUNT');
    processed = processed.replace(/\d+\.?\d*%/g, 'PERCENTAGE');
    processed = processed.replace(/\b\d{4}\b/g, 'YEAR');
    
    // Remove noise
    processed = processed.replace(/[^\w\s\.\!\?-]/g, ' ');
    processed = processed.replace(/\s+/g, ' ').trim();
    
    return processed;
  }
  
  /**
   * Extracts sentences from text
   * Handles financial text sentence boundaries
   */
  private extractSentences(text: string): string[] {
    // Simple sentence extraction - in production would use NLP library
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    
    return sentences
      .map(s => s.trim())
      .filter(s => s.split(' ').length > 3); // Filter out very short sentences
  }
  
  /**
   * Analyzes sentiment of a single sentence
   * Core sentiment scoring logic
   */
  private analyzeSentence(sentence: string): number {
    const words = sentence.split(' ');
    let score = 0;
    let wordCount = 0;
    let modifier = 1;
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const nextWord = words[i + 1];
      const phrase = nextWord ? `${word} ${nextWord}` : '';
      
      // Check for modifiers first
      if (this.dictionary.modifiers[word]) {
        modifier = this.dictionary.modifiers[word];
        continue;
      }
      
      // Check for phrase matches
      if (phrase && this.dictionary.contextual[phrase]) {
        score += this.dictionary.contextual[phrase].sentiment * modifier;
        wordCount++;
        i++; // Skip next word
        modifier = 1; // Reset modifier
        continue;
      }
      
      // Check individual words
      let wordScore = 0;
      if (this.dictionary.positive[word]) {
        wordScore = this.dictionary.positive[word];
      } else if (this.dictionary.negative[word]) {
        wordScore = this.dictionary.negative[word];
      } else if (this.dictionary.neutral[word]) {
        wordScore = this.dictionary.neutral[word];
      }
      
      if (wordScore !== 0) {
        score += wordScore * modifier;
        wordCount++;
        modifier = 1; // Reset modifier after use
      }
    }
    
    // Normalize by sentence length
    return wordCount > 0 ? score / wordCount : 0;
  }
  
  /**
   * Calculates overall score from sentence scores
   * Weights sentences by importance and position
   */
  private calculateOverallScore(sentenceScores: number[]): number {
    if (sentenceScores.length === 0) return 0;
    
    // Weight first and last sentences higher (often contain key points)
    const weights = sentenceScores.map((_, index) => {
      if (index === 0 || index === sentenceScores.length - 1) return 1.5;
      if (index === 1 || index === sentenceScores.length - 2) return 1.2;
      return 1.0;
    });
    
    const weightedSum = sentenceScores.reduce((sum, score, index) => 
      sum + score * weights[index], 0
    );
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    // Clamp to [-1, 1]
    return Math.max(-1, Math.min(1, weightedSum / totalWeight));
  }
  
  /**
   * Converts numeric score to sentiment category
   */
  private scoreToSentiment(score: number): 'positive' | 'neutral' | 'negative' {
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }
  
  /**
   * Extracts dimensional sentiment scores
   * Different aspects of business sentiment
   */
  private extractDimensions(text: string): any {
    const dimensions = {
      financial: 0,
      operational: 0,
      strategic: 0,
      competitive: 0,
      regulatory: 0
    };
    
    // Financial dimension keywords
    const financialTerms = ['revenue', 'profit', 'margin', 'earnings', 'cash flow', 'debt', 'capital'];
    dimensions.financial = this.calculateDimensionScore(text, financialTerms);
    
    // Operational dimension keywords
    const operationalTerms = ['efficiency', 'productivity', 'utilization', 'capacity', 'supply chain', 'operations'];
    dimensions.operational = this.calculateDimensionScore(text, operationalTerms);
    
    // Strategic dimension keywords
    const strategicTerms = ['strategy', 'vision', 'transformation', 'innovation', 'market position', 'competitive advantage'];
    dimensions.strategic = this.calculateDimensionScore(text, strategicTerms);
    
    // Competitive dimension keywords
    const competitiveTerms = ['competition', 'market share', 'differentiation', 'moat', 'disruption', 'competitor'];
    dimensions.competitive = this.calculateDimensionScore(text, competitiveTerms);
    
    // Regulatory dimension keywords
    const regulatoryTerms = ['regulation', 'compliance', 'government', 'policy', 'legal', 'regulatory'];
    dimensions.regulatory = this.calculateDimensionScore(text, regulatoryTerms);
    
    return dimensions;
  }
  
  /**
   * Calculates score for a specific dimension
   */
  private calculateDimensionScore(text: string, keywords: string[]): number {
    let score = 0;
    let mentions = 0;
    
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex) || [];
      
      matches.forEach(() => {
        // Find sentiment around keyword (within 10 words)
        const contextRegex = new RegExp(
          `(\\w+\\s+){0,10}${keyword}(\\s+\\w+){0,10}`,
          'gi'
        );
        
        const contexts = text.match(contextRegex) || [];
        contexts.forEach(context => {
          score += this.analyzeSentence(context);
          mentions++;
        });
      });
    });
    
    return mentions > 0 ? score / mentions : 0;
  }
  
  /**
   * Extracts emotional tones from text
   * Goes beyond positive/negative to specific emotions
   */
  private extractEmotions(text: string): any {
    const emotions = {
      optimism: 0,
      concern: 0,
      uncertainty: 0,
      confidence: 0
    };
    
    // Optimism indicators
    const optimismTerms = ['excited', 'opportunity', 'potential', 'promising', 'breakthrough', 'bullish'];
    emotions.optimism = this.countTermFrequency(text, optimismTerms);
    
    // Concern indicators
    const concernTerms = ['concern', 'worry', 'risk', 'threat', 'challenge', 'headwind'];
    emotions.concern = this.countTermFrequency(text, concernTerms);
    
    // Uncertainty indicators
    const uncertaintyTerms = ['uncertain', 'unclear', 'volatile', 'unpredictable', 'depends', 'may', 'might'];
    emotions.uncertainty = this.countTermFrequency(text, uncertaintyTerms);
    
    // Confidence indicators
    const confidenceTerms = ['confident', 'certain', 'will', 'expect', 'strong', 'robust', 'solid'];
    emotions.confidence = this.countTermFrequency(text, confidenceTerms);
    
    // Normalize scores
    const total = Object.values(emotions).reduce((sum, val) => sum + val, 0.1);
    Object.keys(emotions).forEach(emotion => {
      emotions[emotion] = emotions[emotion] / total;
    });
    
    return emotions;
  }
  
  /**
   * Counts normalized frequency of terms
   */
  private countTermFrequency(text: string, terms: string[]): number {
    const wordCount = text.split(' ').length;
    let count = 0;
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = text.match(regex) || [];
      count += matches.length;
    });
    
    return count / wordCount * 100; // Normalize to per 100 words
  }
  
  /**
   * Extracts major themes from text
   * Identifies what topics are being discussed
   */
  private extractThemes(text: string): Theme[] {
    // Predefined financial themes
    const themeDefinitions = {
      'growth': ['growth', 'expansion', 'increase', 'accelerate', 'momentum'],
      'profitability': ['profit', 'margin', 'earnings', 'income', 'return'],
      'innovation': ['innovation', 'technology', 'ai', 'digital', 'transform'],
      'market_conditions': ['market', 'demand', 'supply', 'economy', 'macro'],
      'competition': ['competition', 'competitor', 'market share', 'pricing'],
      'guidance': ['guidance', 'outlook', 'expect', 'forecast', 'predict'],
      'cost_management': ['cost', 'expense', 'efficiency', 'optimization', 'saving'],
      'capital_allocation': ['investment', 'capex', 'acquisition', 'buyback', 'dividend']
    };
    
    const themes: Theme[] = [];
    
    Object.entries(themeDefinitions).forEach(([themeName, keywords]) => {
      let mentions = 0;
      let sentimentSum = 0;
      const examples: string[] = [];
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`[^.!?]*\\b${keyword}\\b[^.!?]*[.!?]`, 'gi');
        const sentences = text.match(regex) || [];
        
        sentences.forEach(sentence => {
          mentions++;
          sentimentSum += this.analyzeSentence(sentence);
          
          if (examples.length < 2) {
            examples.push(sentence.trim());
          }
        });
      });
      
      if (mentions > 0) {
        themes.push({
          name: themeName.replace('_', ' '),
          relevance: mentions / text.split('.').length, // Normalize by sentence count
          sentiment: sentimentSum / mentions,
          mentions,
          examples
        });
      }
    });
    
    // Sort by relevance
    return themes.sort((a, b) => b.relevance - a.relevance);
  }
  
  /**
   * Extracts named entities from text
   * Identifies companies, people, products mentioned
   */
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    // Simple entity extraction - in production would use NER model
    // Look for capitalized words and phrases
    const capitalizedRegex = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g;
    const potentialEntities = text.match(capitalizedRegex) || [];
    
    // Count occurrences and analyze sentiment
    const entityMap = new Map<string, { count: number; sentiments: number[] }>();
    
    potentialEntities.forEach(entity => {
      if (entity.length < 3 || this.isCommonWord(entity)) return;
      
      const existing = entityMap.get(entity) || { count: 0, sentiments: [] };
      existing.count++;
      
      // Find sentiment in surrounding context
      const contextRegex = new RegExp(
        `(\\w+\\s+){0,10}${entity}(\\s+\\w+){0,10}`,
        'gi'
      );
      const contexts = text.match(contextRegex) || [];
      
      contexts.forEach(context => {
        existing.sentiments.push(this.analyzeSentence(context));
      });
      
      entityMap.set(entity, existing);
    });
    
    // Convert to Entity objects
    entityMap.forEach((data, name) => {
      if (data.count >= 2) { // Only include entities mentioned multiple times
        const avgSentiment = data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length;
        
        entities.push({
          name,
          type: this.classifyEntityType(name),
          sentiment: avgSentiment,
          mentions: data.count,
          context: [] // Would extract actual context sentences in full implementation
        });
      }
    });
    
    return entities.sort((a, b) => b.mentions - a.mentions);
  }
  
  /**
   * Checks if a word is too common to be an entity
   */
  private isCommonWord(word: string): boolean {
    const common = ['The', 'This', 'That', 'These', 'Those', 'Company', 'Corporation'];
    return common.includes(word);
  }
  
  /**
   * Classifies entity type based on patterns
   */
  private classifyEntityType(name: string): Entity['type'] {
    if (name.match(/\b(Inc|Corp|Ltd|LLC|Company)\b/)) return 'company';
    if (name.match(/\b(Mr|Ms|Dr|CEO|CFO|President)\b/)) return 'person';
    if (name.match(/\b(City|Country|State)\b/)) return 'location';
    // Default to company for financial texts
    return 'company';
  }
  
  /**
   * Extracts key phrases with sentiment
   * Identifies important multi-word expressions
   */
  private extractKeyPhrases(text: string): KeyPhrase[] {
    const phrases: KeyPhrase[] = [];
    
    // Common financial phrase patterns
    const patterns = [
      /\b(?:strong|weak|record|disappointing)\s+(?:performance|results|quarter|year)\b/gi,
      /\b(?:revenue|earnings|margin)\s+(?:growth|decline|pressure|expansion)\b/gi,
      /\b(?:market|competitive)\s+(?:position|advantage|share|leadership)\b/gi,
      /\b(?:cost|expense)\s+(?:reduction|optimization|pressure|increase)\b/gi,
      /\b(?:guidance|outlook)\s+(?:raised|lowered|maintained|withdrawn)\b/gi
    ];
    
    const phraseMap = new Map<string, { count: number; sentiments: number[] }>();
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern) || [];
      
      matches.forEach(phrase => {
        const normalizedPhrase = phrase.toLowerCase();
        const existing = phraseMap.get(normalizedPhrase) || { count: 0, sentiments: [] };
        
        existing.count++;
        existing.sentiments.push(this.analyzeSentence(phrase));
        
        phraseMap.set(normalizedPhrase, existing);
      });
    });
    
    // Convert to KeyPhrase objects
    phraseMap.forEach((data, phrase) => {
      const avgSentiment = data.sentiments.reduce((sum, s) => sum + s, 0) / data.sentiments.length;
      
      phrases.push({
        phrase,
        sentiment: avgSentiment,
        importance: Math.min(data.count / 5, 1), // Normalize importance
        frequency: data.count
      });
    });
    
    return phrases.sort((a, b) => b.importance - a.importance);
  }
  
  /**
   * Calculates confidence in sentiment analysis
   */
  private calculateConfidence(sentenceScores: number[], textLength: number): number {
    let confidence = 0.5; // Base confidence
    
    // More text generally means more reliable analysis
    if (textLength > 1000) confidence += 0.1;
    if (textLength > 2000) confidence += 0.1;
    
    // Consistent sentiment across sentences increases confidence
    if (sentenceScores.length > 3) {
      const variance = this.calculateVariance(sentenceScores);
      if (variance < 0.1) confidence += 0.2;
      else if (variance < 0.2) confidence += 0.1;
    }
    
    // Strong sentiment (not neutral) increases confidence
    const avgScore = sentenceScores.reduce((sum, s) => sum + s, 0) / sentenceScores.length;
    if (Math.abs(avgScore) > 0.3) confidence += 0.1;
    
    return Math.min(confidence, 1);
  }
  
  /**
   * Calculates variance of scores
   */
  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const squaredDiffs = scores.map(s => Math.pow(s - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / scores.length;
  }
  
  /**
   * Weights analyses by importance factors
   */
  private weightAnalysesByImportance(
    analyses: SentimentResult[],
    newsItems: NewsItem[]
  ): Array<SentimentResult & { weight: number }> {
    return analyses.map((analysis, index) => {
      const news = newsItems[index];
      let weight = 1.0;
      
      // Recency weight (exponential decay)
      const daysOld = (Date.now() - new Date(news.publishedDate).getTime()) / (1000 * 60 * 60 * 24);
      weight *= Math.exp(-daysOld / 30); // Half-life of 30 days
      
      // Source credibility weight
      const trustedSources = ['reuters', 'bloomberg', 'wsj', 'financial times'];
      if (trustedSources.some(source => news.source.toLowerCase().includes(source))) {
        weight *= 1.2;
      }
      
      // Relevance weight
      if (news.relevanceScore) {
        weight *= (0.5 + news.relevanceScore * 0.5);
      }
      
      return { ...analysis, weight };
    });
  }
  
  /**
   * Aggregates multiple sentiment analyses
   */
  private aggregateSentiments(
    weightedAnalyses: Array<SentimentResult & { weight: number }>
  ): SentimentResult {
    if (weightedAnalyses.length === 0) {
      return this.getEmptySentimentResult();
    }
    
    const totalWeight = weightedAnalyses.reduce((sum, a) => sum + a.weight, 0);
    
    // Weighted average of scores
    const score = weightedAnalyses.reduce((sum, a) => 
      sum + a.score * a.weight, 0
    ) / totalWeight;
    
    // Aggregate dimensions
    const dimensions = {} as any;
    Object.keys(weightedAnalyses[0].dimensions).forEach(dim => {
      dimensions[dim] = weightedAnalyses.reduce((sum, a) => 
        sum + a.dimensions[dim] * a.weight, 0
      ) / totalWeight;
    });
    
    // Aggregate emotions
    const emotions = {} as any;
    Object.keys(weightedAnalyses[0].emotions).forEach(emotion => {
      emotions[emotion] = weightedAnalyses.reduce((sum, a) => 
        sum + a.emotions[emotion] * a.weight, 0
      ) / totalWeight;
    });
    
    // Merge themes (keep top themes)
    const allThemes = weightedAnalyses.flatMap(a => a.themes);
    const themes = this.mergeThemes(allThemes);
    
    // Merge entities
    const allEntities = weightedAnalyses.flatMap(a => a.entities);
    const entities = this.mergeEntities(allEntities);
    
    // Merge key phrases
    const allPhrases = weightedAnalyses.flatMap(a => a.keyPhrases);
    const keyPhrases = this.mergeKeyPhrases(allPhrases);
    
    // Average confidence
    const confidence = weightedAnalyses.reduce((sum, a) => 
      sum + a.confidence * a.weight, 0
    ) / totalWeight;
    
    return {
      overall: this.scoreToSentiment(score),
      score,
      confidence,
      dimensions,
      emotions,
      themes,
      entities,
      keyPhrases,
      summary: ''
    };
  }
  
  /**
   * Merges themes from multiple analyses
   */
  private mergeThemes(themes: Theme[]): Theme[] {
    const themeMap = new Map<string, Theme>();
    
    themes.forEach(theme => {
      const existing = themeMap.get(theme.name);
      if (existing) {
        existing.mentions += theme.mentions;
        existing.relevance = (existing.relevance + theme.relevance) / 2;
        existing.sentiment = (existing.sentiment + theme.sentiment) / 2;
        existing.examples = [...existing.examples, ...theme.examples]
          .slice(0, 3); // Keep top 3 examples
      } else {
        themeMap.set(theme.name, { ...theme });
      }
    });
    
    return Array.from(themeMap.values())
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10); // Top 10 themes
  }
  
  /**
   * Merges entities from multiple analyses
   */
  private mergeEntities(entities: Entity[]): Entity[] {
    const entityMap = new Map<string, Entity>();
    
    entities.forEach(entity => {
      const existing = entityMap.get(entity.name);
      if (existing) {
        existing.mentions += entity.mentions;
        existing.sentiment = (existing.sentiment * existing.mentions + 
                            entity.sentiment * entity.mentions) / 
                           (existing.mentions + entity.mentions);
      } else {
        entityMap.set(entity.name, { ...entity });
      }
    });
    
    return Array.from(entityMap.values())
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 20); // Top 20 entities
  }
  
  /**
   * Merges key phrases from multiple analyses
   */
  private mergeKeyPhrases(phrases: KeyPhrase[]): KeyPhrase[] {
    const phraseMap = new Map<string, KeyPhrase>();
    
    phrases.forEach(phrase => {
      const existing = phraseMap.get(phrase.phrase);
      if (existing) {
        existing.frequency += phrase.frequency;
        existing.sentiment = (existing.sentiment + phrase.sentiment) / 2;
        existing.importance = Math.max(existing.importance, phrase.importance);
      } else {
        phraseMap.set(phrase.phrase, { ...phrase });
      }
    });
    
    return Array.from(phraseMap.values())
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 15); // Top 15 phrases
  }
  
  /**
   * Analyzes temporal trends in sentiment
   */
  private analyzeTemporalTrends(
    analyses: SentimentResult[],
    newsItems: NewsItem[]
  ): TemporalSentiment {
    // Group by time periods
    const timeGroups = new Map<string, { scores: number[]; dates: string[] }>();
    
    analyses.forEach((analysis, index) => {
      const date = new Date(newsItems[index].publishedDate);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      
      const group = timeGroups.get(monthKey) || { scores: [], dates: [] };
      group.scores.push(analysis.score);
      group.dates.push(date.toISOString());
      
      timeGroups.set(monthKey, group);
    });
    
    // Calculate trend
    const monthlyScores = Array.from(timeGroups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, group]) => 
        group.scores.reduce((sum, s) => sum + s, 0) / group.scores.length
      );
    
    const trend = this.calculateTrend(monthlyScores);
    const momentum = this.calculateMomentum(monthlyScores);
    const volatility = this.calculateVolatility(monthlyScores);
    
    // Identify significant changes
    const changes: SentimentChange[] = [];
    for (let i = 1; i < monthlyScores.length; i++) {
      const change = monthlyScores[i] - monthlyScores[i - 1];
      if (Math.abs(change) > 0.2) {
        changes.push({
          date: Array.from(timeGroups.keys())[i],
          fromScore: monthlyScores[i - 1],
          toScore: monthlyScores[i],
          magnitude: Math.abs(change)
        });
      }
    }
    
    return {
      trend,
      momentum,
      volatility,
      changes
    };
  }
  
  /**
   * Calculates sentiment trend
   */
  private calculateTrend(scores: number[]): 'improving' | 'stable' | 'declining' {
    if (scores.length < 2) return 'stable';
    
    // Simple linear regression
    const n = scores.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = scores.reduce((sum, s) => sum + s, 0);
    const sumXY = scores.reduce((sum, s, i) => sum + s * i, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope > 0.05) return 'improving';
    if (slope < -0.05) return 'declining';
    return 'stable';
  }
  
  /**
   * Calculates sentiment momentum
   */
  private calculateMomentum(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    // Rate of change in recent periods
    const recentScores = scores.slice(-3);
    if (recentScores.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < recentScores.length; i++) {
      changes.push(recentScores[i] - recentScores[i - 1]);
    }
    
    return changes.reduce((sum, c) => sum + c, 0) / changes.length;
  }
  
  /**
   * Calculates sentiment volatility
   */
  private calculateVolatility(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    
    return Math.sqrt(variance);
  }
  
  /**
   * Generates human-readable sentiment summary
   */
  private generateSentimentSummary(result: SentimentResult, itemCount: number): string {
    const { overall, score, confidence, themes, temporalAnalysis } = result;
    
    let summary = `Based on analysis of ${itemCount} sources, `;
    summary += `sentiment is ${overall} (score: ${score.toFixed(2)}) `;
    summary += `with ${confidence > 0.7 ? 'high' : confidence > 0.5 ? 'moderate' : 'low'} confidence. `;
    
    if (themes.length > 0) {
      const topThemes = themes.slice(0, 3).map(t => t.name).join(', ');
      summary += `Key themes include ${topThemes}. `;
    }
    
    if (temporalAnalysis) {
      summary += `Sentiment trend is ${temporalAnalysis.trend}`;
      if (temporalAnalysis.momentum !== 0) {
        summary += ` with ${temporalAnalysis.momentum > 0 ? 'positive' : 'negative'} momentum`;
      }
      summary += '. ';
    }
    
    return summary;
  }
  
  /**
   * Analyzes Q&A section of transcript
   * Often more revealing than prepared remarks
   */
  private analyzeQASection(transcript: TranscriptData): { score: number } {
    // Simple implementation - would analyze actual Q&A in full version
    // Q&A tends to be more negative as analysts probe concerns
    return {
      score: transcript.sentiment?.overall === 'positive' ? 0.3 :
             transcript.sentiment?.overall === 'negative' ? -0.5 : 0
    };
  }
  
  /**
   * Detects forward-looking statements
   * Important for understanding management confidence
   */
  private detectForwardLookingStatements(text: string): { confidence: number } {
    const forwardTerms = [
      'will', 'expect', 'anticipate', 'believe', 'intend',
      'plan', 'forecast', 'project', 'estimate', 'goal'
    ];
    
    const forwardCount = forwardTerms.reduce((count, term) => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      return count + (text.match(regex) || []).length;
    }, 0);
    
    const wordCount = text.split(' ').length;
    const forwardDensity = forwardCount / wordCount;
    
    // More forward-looking statements indicate confidence
    return {
      confidence: Math.min(forwardDensity * 100, 1)
    };
  }
  
  /**
   * Extracts management themes from transcripts
   */
  private extractManagementThemes(transcripts: TranscriptData[]): Theme[] {
    // Aggregate key highlights
    const allHighlights = transcripts.flatMap(t => t.keyHighlights).join(' ');
    
    // Use standard theme extraction on highlights
    return this.extractThemes(allHighlights);
  }
  
  /**
   * Assesses management tone across transcripts
   */
  private assessManagementTone(transcripts: TranscriptData[]): number {
    // Simple average of transcript sentiments
    const scores = transcripts
      .filter(t => t.sentiment)
      .map(t => t.sentiment!.score || 0);
    
    return scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0;
  }
  
  /**
   * Assesses quality of guidance provided
   */
  private assessGuidanceQuality(transcripts: TranscriptData[]): number {
    // Look for guidance-related keywords in highlights
    let guidanceCount = 0;
    let specificCount = 0;
    
    transcripts.forEach(transcript => {
      transcript.keyHighlights.forEach(highlight => {
        if (highlight.match(/guidance|outlook|expect|forecast/i)) {
          guidanceCount++;
          
          // Check if guidance includes specific numbers
          if (highlight.match(/\d+%|\$\d+|basis points/)) {
            specificCount++;
          }
        }
      });
    });
    
    // Quality based on specificity
    return guidanceCount > 0 ? specificCount / guidanceCount : 0;
  }
  
  /**
   * Returns empty sentiment result
   */
  private getEmptySentimentResult(): SentimentResult {
    return {
      overall: 'neutral',
      score: 0,
      confidence: 0,
      dimensions: {
        financial: 0,
        operational: 0,
        strategic: 0,
        competitive: 0,
        regulatory: 0
      },
      emotions: {
        optimism: 0.25,
        concern: 0.25,
        uncertainty: 0.25,
        confidence: 0.25
      },
      themes: [],
      entities: [],
      keyPhrases: [],
      summary: 'No data available for sentiment analysis.'
    };
  }
}

/**
 * Factory function for creating sentiment analysis engines
 */
export function createSentimentAnalysisEngine(
  config?: Partial<SentimentAnalysisConfig>
): SentimentAnalysisEngine {
  return new SentimentAnalysisEngine(config);
}