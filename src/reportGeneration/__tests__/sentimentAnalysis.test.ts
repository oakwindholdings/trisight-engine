// src/reportGeneration/__tests__/sentimentAnalysis.test.ts
// Comprehensive unit tests for sentiment analysis engine
// Context: Ensures accuracy and reliability of financial text analysis

import {
  SentimentAnalysisEngine,
  createSentimentAnalysisEngine,
  SentimentResult,
  Theme,
  Entity,
  KeyPhrase
} from '../processing/sentimentAnalysis';
import { NewsItem, TranscriptData } from '../models/reportTypes';

describe('SentimentAnalysisEngine', () => {
  let engine: SentimentAnalysisEngine;
  
  beforeEach(() => {
    engine = createSentimentAnalysisEngine();
  });
  
  describe('Text Analysis Core', () => {
    it('should analyze positive financial text correctly', async () => {
      const text = 'The company reported strong revenue growth and record profits. ' +
                  'Management is extremely confident about future expansion.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.overall).toBe('positive');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should analyze negative financial text correctly', async () => {
      const text = 'Revenue declined significantly amid weak demand. ' +
                  'The company faces serious challenges and mounting losses.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.overall).toBe('negative');
      expect(result.score).toBeLessThan(-0.5);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
    
    it('should analyze neutral financial text correctly', async () => {
      const text = 'The company will maintain its current operations. ' +
                  'Management expects stable performance to continue.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.overall).toBe('neutral');
      expect(Math.abs(result.score)).toBeLessThan(0.2);
    });
    
    it('should handle mixed sentiment appropriately', async () => {
      const text = 'While revenue growth was strong, rising costs and increased ' +
                  'competition present significant challenges going forward.';
      
      const result = await engine.analyzeText(text);
      
      // Should be neutral or slightly negative due to mixed signals
      expect(Math.abs(result.score)).toBeLessThan(0.5);
      expect(['neutral', 'negative']).toContain(result.overall);
    });
  });
  
  describe('Sentiment Modifiers', () => {
    it('should apply intensifiers correctly', async () => {
      const normalText = 'The company reported strong performance.';
      const intensifiedText = 'The company reported extremely strong performance.';
      
      const normalResult = await engine.analyzeText(normalText);
      const intensifiedResult = await engine.analyzeText(intensifiedText);
      
      expect(intensifiedResult.score).toBeGreaterThan(normalResult.score);
    });
    
    it('should apply diminishers correctly', async () => {
      const normalText = 'The company faces challenges.';
      const diminishedText = 'The company faces slight challenges.';
      
      const normalResult = await engine.analyzeText(normalText);
      const diminishedResult = await engine.analyzeText(diminishedText);
      
      expect(Math.abs(diminishedResult.score)).toBeLessThan(Math.abs(normalResult.score));
    });
  });
  
  describe('Theme Extraction', () => {
    it('should extract growth themes', async () => {
      const text = 'Revenue growth accelerated in Q4 with strong momentum. ' +
                  'The expansion into new markets drives further growth opportunities.';
      
      const result = await engine.analyzeText(text);
      
      const growthTheme = result.themes.find(t => t.name === 'growth');
      expect(growthTheme).toBeDefined();
      expect(growthTheme!.mentions).toBeGreaterThan(0);
      expect(growthTheme!.sentiment).toBeGreaterThan(0);
    });
    
    it('should extract multiple themes with correct relevance', async () => {
      const text = 'Strong revenue growth and margin expansion demonstrate operational efficiency. ' +
                  'Innovation in AI technology positions us ahead of competition. ' +
                  'Cost optimization initiatives are yielding significant savings.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.themes.length).toBeGreaterThan(3);
      
      // Check for expected themes
      const themeNames = result.themes.map(t => t.name);
      expect(themeNames).toContain('growth');
      expect(themeNames).toContain('innovation');
      expect(themeNames).toContain('cost management');
      
      // Themes should be sorted by relevance
      for (let i = 1; i < result.themes.length; i++) {
        expect(result.themes[i - 1].relevance).toBeGreaterThanOrEqual(result.themes[i].relevance);
      }
    });
  });
  
  describe('Entity Extraction', () => {
    it('should extract company entities', async () => {
      const text = 'Apple Inc reported strong results. Microsoft Corporation also ' +
                  'exceeded expectations. Both Apple and Microsoft dominate the market.';
      
      const result = await engine.analyzeText(text);
      
      // Should find entities mentioned multiple times
      const appleEntity = result.entities.find(e => e.name.includes('Apple'));
      const microsoftEntity = result.entities.find(e => e.name.includes('Microsoft'));
      
      expect(appleEntity).toBeDefined();
      expect(microsoftEntity).toBeDefined();
      expect(appleEntity!.mentions).toBeGreaterThanOrEqual(2);
      expect(microsoftEntity!.mentions).toBeGreaterThanOrEqual(2);
    });
    
    it('should assign sentiment to entities based on context', async () => {
      const text = 'Nvidia continues to outperform with exceptional growth. ' +
                  'Meanwhile, Intel faces significant challenges in the market. ' +
                  'Nvidia\'s innovation gives it a clear advantage over Intel.';
      
      const result = await engine.analyzeText(text);
      
      const nvidiaEntity = result.entities.find(e => e.name === 'Nvidia');
      const intelEntity = result.entities.find(e => e.name === 'Intel');
      
      expect(nvidiaEntity).toBeDefined();
      expect(intelEntity).toBeDefined();
      expect(nvidiaEntity!.sentiment).toBeGreaterThan(0);
      expect(intelEntity!.sentiment).toBeLessThan(0);
    });
  });
  
  describe('Key Phrase Extraction', () => {
    it('should extract financial key phrases', async () => {
      const text = 'The company reported record performance with strong revenue growth. ' +
                  'Margin expansion and cost reduction drove earnings growth. ' +
                  'Management raised guidance for the full year.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.keyPhrases.length).toBeGreaterThan(0);
      
      // Check for expected phrases
      const phrases = result.keyPhrases.map(p => p.phrase);
      expect(phrases.find(p => p.includes('record performance'))).toBeDefined();
      expect(phrases.find(p => p.includes('revenue growth'))).toBeDefined();
    });
    
    it('should assign correct sentiment to key phrases', async () => {
      const text = 'Disappointing results and weak performance led to guidance lowered. ' +
                  'However, strong market position provides competitive advantage.';
      
      const result = await engine.analyzeText(text);
      
      const negativePhrase = result.keyPhrases.find(p => 
        p.phrase.includes('disappointing results') || p.phrase.includes('weak performance')
      );
      const positivePhrase = result.keyPhrases.find(p => 
        p.phrase.includes('strong market') || p.phrase.includes('competitive advantage')
      );
      
      expect(negativePhrase).toBeDefined();
      expect(positivePhrase).toBeDefined();
      expect(negativePhrase!.sentiment).toBeLessThan(0);
      expect(positivePhrase!.sentiment).toBeGreaterThan(0);
    });
  });
  
  describe('Dimensional Analysis', () => {
    it('should extract financial dimension correctly', async () => {
      const text = 'Revenue increased 20% with strong profit margins. ' +
                  'Earnings per share beat expectations despite higher debt levels.';
      
      const result = await engine.analyzeText(text);
      
      // Financial dimension should be prominent
      expect(result.dimensions.financial).not.toBe(0);
      // Should be positive overall (growth outweighs debt concern)
      expect(result.dimensions.financial).toBeGreaterThan(0);
    });
    
    it('should extract operational dimension correctly', async () => {
      const text = 'Operational efficiency improved with higher productivity. ' +
                  'Supply chain optimization and capacity utilization reached new highs.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.dimensions.operational).toBeGreaterThan(0.5);
    });
    
    it('should extract strategic dimension correctly', async () => {
      const text = 'Our digital transformation strategy and innovation pipeline ' +
                  'strengthen our competitive advantage and market position.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.dimensions.strategic).toBeGreaterThan(0.5);
    });
  });
  
  describe('Emotion Detection', () => {
    it('should detect optimism correctly', async () => {
      const text = 'We are excited about the breakthrough opportunities ahead. ' +
                  'The potential for growth is promising and we remain bullish.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.emotions.optimism).toBeGreaterThan(result.emotions.concern);
      expect(result.emotions.optimism).toBeGreaterThan(0.3);
    });
    
    it('should detect concern correctly', async () => {
      const text = 'Management expressed concern about rising risks and threats. ' +
                  'Several challenges and headwinds worry the leadership team.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.emotions.concern).toBeGreaterThan(result.emotions.optimism);
      expect(result.emotions.concern).toBeGreaterThan(0.3);
    });
    
    it('should detect uncertainty correctly', async () => {
      const text = 'The outlook remains uncertain and unclear. Market conditions ' +
                  'are volatile and unpredictable, results may vary significantly.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.emotions.uncertainty).toBeGreaterThan(result.emotions.confidence);
      expect(result.emotions.uncertainty).toBeGreaterThan(0.3);
    });
  });
  
  describe('News Analysis', () => {
    it('should analyze multiple news items correctly', async () => {
      const newsItems: NewsItem[] = [
        {
          title: 'Company Reports Record Earnings',
          summary: 'Strong growth and profitability drive record results.',
          source: 'Reuters',
          publishedDate: new Date().toISOString(),
          url: 'http://example.com/1',
          relevanceScore: 0.9
        },
        {
          title: 'Analysts Raise Price Targets',
          summary: 'Multiple analysts upgrade rating citing strong fundamentals.',
          source: 'Bloomberg',
          publishedDate: new Date(Date.now() - 86400000).toISOString(),
          url: 'http://example.com/2',
          relevanceScore: 0.8
        }
      ];
      
      const result = await engine.analyzeNews(newsItems);
      
      expect(result.overall).toBe('positive');
      expect(result.score).toBeGreaterThan(0.5);
      expect(result.summary).toContain('2 sources');
    });
    
    it('should weight recent news higher', async () => {
      const oldPositiveNews: NewsItem = {
        title: 'Great Results Last Year',
        summary: 'Company had excellent performance.',
        source: 'Reuters',
        publishedDate: new Date(Date.now() - 60 * 86400000).toISOString(), // 60 days old
        url: 'http://example.com/1'
      };
      
      const recentNegativeNews: NewsItem = {
        title: 'Challenges Emerge',
        summary: 'Company faces difficulties and weak demand.',
        source: 'Reuters',
        publishedDate: new Date().toISOString(), // Today
        url: 'http://example.com/2'
      };
      
      const result = await engine.analyzeNews([oldPositiveNews, recentNegativeNews]);
      
      // Recent negative should outweigh old positive
      expect(result.overall).toBe('negative');
    });
    
    it('should weight credible sources higher', async () => {
      const credibleNews: NewsItem = {
        title: 'Market Analysis',
        summary: 'Modest growth expected.',
        source: 'Reuters',
        publishedDate: new Date().toISOString(),
        url: 'http://example.com/1'
      };
      
      const lessCredibleNews: NewsItem = {
        title: 'Amazing Opportunity!',
        summary: 'Incredible profits guaranteed!',
        source: 'Unknown Blog',
        publishedDate: new Date().toISOString(),
        url: 'http://example.com/2'
      };
      
      const result = await engine.analyzeNews([credibleNews, lessCredibleNews]);
      
      // Should lean toward the credible source's modest tone
      expect(Math.abs(result.score)).toBeLessThan(0.5);
    });
  });
  
  describe('Transcript Analysis', () => {
    it('should analyze earnings transcripts correctly', async () => {
      const transcript: TranscriptData = {
        date: '2024-01-15',
        type: 'earnings',
        participants: ['CEO', 'CFO', 'Analysts'],
        keyHighlights: [
          'Revenue grew 25% year-over-year',
          'We expect continued momentum in 2024',
          'Margin expansion exceeded our targets',
          'We are raising full-year guidance'
        ],
        sentiment: {
          overall: 'positive',
          score: 0.7,
          topics: {}
        }
      };
      
      const result = await engine.analyzeTranscripts([transcript]);
      
      expect(result.overall).toBe('positive');
      expect(result.dimensions.managementTone).toBeGreaterThan(0);
    });
    
    it('should detect forward-looking statements', async () => {
      const transcript: TranscriptData = {
        date: '2024-01-15',
        type: 'earnings',
        participants: ['CEO'],
        keyHighlights: [
          'We will achieve our targets',
          'We expect strong growth',
          'We anticipate margin improvement',
          'We plan to expand internationally'
        ],
        fullText: 'We will achieve our targets. We expect strong growth. ' +
                 'We anticipate margin improvement. We plan to expand internationally.'
      };
      
      const result = await engine.analyzeTranscripts([transcript]);
      
      expect(result.dimensions.forwardLookingConfidence).toBeGreaterThan(0.5);
    });
    
    it('should assess guidance quality', async () => {
      const vagueTranscript: TranscriptData = {
        date: '2024-01-15',
        type: 'earnings',
        participants: ['CEO'],
        keyHighlights: [
          'Guidance remains unchanged',
          'We expect reasonable performance',
          'Outlook is generally positive'
        ]
      };
      
      const specificTranscript: TranscriptData = {
        date: '2024-01-15',
        type: 'earnings',
        participants: ['CEO'],
        keyHighlights: [
          'We expect revenue growth of 15-17%',
          'Guidance raised to $4.50-$4.70 EPS',
          'Operating margin forecast at 23-24%'
        ]
      };
      
      const vagueResult = await engine.analyzeTranscripts([vagueTranscript]);
      const specificResult = await engine.analyzeTranscripts([specificTranscript]);
      
      expect(specificResult.dimensions.guidanceQuality).toBeGreaterThan(
        vagueResult.dimensions.guidanceQuality
      );
    });
  });
  
  describe('Temporal Analysis', () => {
    it('should detect improving sentiment trend', async () => {
      const newsItems: NewsItem[] = [
        {
          title: 'Initial Concerns',
          summary: 'Some challenges noted.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 90 * 86400000).toISOString(),
          url: 'http://example.com/1'
        },
        {
          title: 'Stabilization',
          summary: 'Situation improving gradually.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 60 * 86400000).toISOString(),
          url: 'http://example.com/2'
        },
        {
          title: 'Strong Recovery',
          summary: 'Excellent performance and growth.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          url: 'http://example.com/3'
        },
        {
          title: 'Record Results',
          summary: 'Best quarter ever with exceptional growth.',
          source: 'Reuters',
          publishedDate: new Date().toISOString(),
          url: 'http://example.com/4'
        }
      ];
      
      const result = await engine.analyzeNews(newsItems);
      
      expect(result.temporalAnalysis).toBeDefined();
      expect(result.temporalAnalysis!.trend).toBe('improving');
      expect(result.temporalAnalysis!.momentum).toBeGreaterThan(0);
    });
    
    it('should detect sentiment volatility', async () => {
      const volatileNews: NewsItem[] = [
        {
          title: 'Great News',
          summary: 'Excellent results.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 40 * 86400000).toISOString(),
          url: 'http://example.com/1'
        },
        {
          title: 'Terrible News',
          summary: 'Major problems.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          url: 'http://example.com/2'
        },
        {
          title: 'Recovery',
          summary: 'Things improving.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 20 * 86400000).toISOString(),
          url: 'http://example.com/3'
        },
        {
          title: 'Another Setback',
          summary: 'More challenges.',
          source: 'Reuters',
          publishedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
          url: 'http://example.com/4'
        }
      ];
      
      const result = await engine.analyzeNews(volatileNews);
      
      expect(result.temporalAnalysis).toBeDefined();
      expect(result.temporalAnalysis!.volatility).toBeGreaterThan(0.2);
    });
  });
  
  describe('Confidence Calculation', () => {
    it('should have high confidence for longer consistent text', async () => {
      const shortText = 'Good results.';
      const longConsistentText = 'The company delivered excellent financial results ' +
        'with strong revenue growth and impressive margin expansion. All business ' +
        'segments showed robust performance with positive momentum. Management ' +
        'expressed confidence in continued growth and raised guidance. The outlook ' +
        'remains very positive with multiple growth drivers identified.';
      
      const shortResult = await engine.analyzeText(shortText);
      const longResult = await engine.analyzeText(longConsistentText);
      
      expect(longResult.confidence).toBeGreaterThan(shortResult.confidence);
      expect(longResult.confidence).toBeGreaterThan(0.7);
    });
    
    it('should have lower confidence for mixed signals', async () => {
      const mixedText = 'Results were strong but challenges remain. Growth was good ' +
        'however competition is intense. Profits increased yet costs are rising. ' +
        'Outlook is positive although risks are significant.';
      
      const result = await engine.analyzeText(mixedText);
      
      expect(result.confidence).toBeLessThan(0.7);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const result = await engine.analyzeText('');
      
      expect(result.overall).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.themes.length).toBe(0);
      expect(result.entities.length).toBe(0);
    });
    
    it('should handle text with only neutral words', async () => {
      const text = 'The company will continue to maintain stable operations.';
      
      const result = await engine.analyzeText(text);
      
      expect(result.overall).toBe('neutral');
      expect(Math.abs(result.score)).toBeLessThan(0.1);
    });
    
    it('should handle text with financial abbreviations', async () => {
      const text = 'YoY revenue growth of 20% with improved EBITDA. ' +
                  'FCF increased QoQ and ROIC remains strong.';
      
      const result = await engine.analyzeText(text);
      
      // Should understand expanded abbreviations
      expect(result.score).toBeGreaterThan(0);
      expect(result.themes.find(t => t.name === 'growth')).toBeDefined();
    });
    
    it('should handle empty news array', async () => {
      const result = await engine.analyzeNews([]);
      
      expect(result.overall).toBe('neutral');
      expect(result.score).toBe(0);
      expect(result.summary).toContain('No data available');
    });
  });
  
  describe('Custom Configuration', () => {
    it('should respect entity extraction config', async () => {
      const engineNoEntities = createSentimentAnalysisEngine({
        enableEntityExtraction: false
      });
      
      const text = 'Apple and Microsoft reported strong results.';
      const result = await engineNoEntities.analyzeText(text);
      
      expect(result.entities.length).toBe(0);
    });
    
    it('should respect theme detection config', async () => {
      const engineNoThemes = createSentimentAnalysisEngine({
        enableThemeDetection: false
      });
      
      const text = 'Strong growth and innovation drive profitability.';
      const result = await engineNoThemes.analyzeText(text);
      
      expect(result.themes.length).toBe(0);
    });
    
    it('should use custom dictionary when provided', async () => {
      const customEngine = createSentimentAnalysisEngine({
        customDictionary: {
          positive: { 'custom-positive': 0.9 },
          negative: { 'custom-negative': -0.9 },
          neutral: {},
          modifiers: {},
          contextual: {}
        }
      });
      
      const text = 'This is custom-positive news.';
      const result = await customEngine.analyzeText(text);
      
      expect(result.score).toBeGreaterThan(0.5);
    });
  });
});

// Helper function to create mock company data
function createMockNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    title: 'Test News',
    summary: 'Test summary',
    source: 'Test Source',
    publishedDate: new Date().toISOString(),
    url: 'http://example.com',
    ...overrides
  };
}