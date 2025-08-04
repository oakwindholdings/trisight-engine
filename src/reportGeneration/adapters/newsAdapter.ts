// src/reportGeneration/adapters/newsAdapter.ts
// News and sentiment data fetching adapter using Firecrawl for intelligent extraction
// Context: Aggregates news from multiple sources with AI-powered sentiment analysis

import { BaseAdapter } from '../core/baseAdapter';
import { FirecrawlAdapter } from './firecrawlAdapter';
import { RetryableError, ErrorCategory, wrapDataFetchError } from '../utils/errorHandler';
import { NewsItem, NewsSentiment, NewsEvent } from '../models/reportTypes';
import { logDebug } from '../../utils/logger';
import axios from 'axios';

/**
 * Configuration for News adapter
 */
interface NewsAdapterConfig {
  firecrawlAdapter?: FirecrawlAdapter;
  newsApiKey?: string; // NewsAPI.org API key
  alphaVantageApiKey?: string; // Alpha Vantage for news & sentiment
  finnhubApiKey?: string; // Finnhub for financial news
  sentimentThreshold?: number;
  defaultTimeRange?: 'day' | 'week' | 'month' | 'quarter';
  includeUnverifiedSources?: boolean;
  minimumCredibilityScore?: number;
}

/**
 * News sentiment aggregation result
 */
interface SentimentAggregation {
  overallSentiment: 'positive' | 'neutral' | 'negative';
  sentimentScore: number; // -1 to 1
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  totalArticles: number;
  sentimentTrend: 'improving' | 'stable' | 'declining';
  keyTopics: Array<{
    topic: string;
    mentions: number;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
}

/**
 * Enhanced News adapter implementation
 * Leverages Firecrawl for intelligent news extraction and sentiment analysis
 */
export class NewsAdapter extends BaseAdapter {
  private firecrawl: FirecrawlAdapter;
  private sentimentThreshold: number;
  private newsApiKey?: string;
  private alphaVantageApiKey?: string;
  private finnhubApiKey?: string;
  
  // API endpoints
  private readonly NEWS_API_URL = 'https://newsapi.org/v2';
  private readonly ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
  private readonly FINNHUB_URL = 'https://finnhub.io/api/v1';
  
  // Define reputable financial news sources with credibility weights
  private readonly TRUSTED_SOURCES = [
    { domain: 'reuters.com', name: 'Reuters', weight: 1.0 },
    { domain: 'bloomberg.com', name: 'Bloomberg', weight: 1.0 },
    { domain: 'wsj.com', name: 'Wall Street Journal', weight: 0.9 },
    { domain: 'ft.com', name: 'Financial Times', weight: 0.9 },
    { domain: 'cnbc.com', name: 'CNBC', weight: 0.8 },
    { domain: 'marketwatch.com', name: 'MarketWatch', weight: 0.7 },
    { domain: 'seekingalpha.com', name: 'Seeking Alpha', weight: 0.6 },
    { domain: 'businesswire.com', name: 'Business Wire', weight: 0.8 },
    { domain: 'prnewswire.com', name: 'PR Newswire', weight: 0.8 },
    { domain: 'yahoo.com/finance', name: 'Yahoo Finance', weight: 0.7 },
    { domain: 'barrons.com', name: 'Barrons', weight: 0.8 },
    { domain: 'fool.com', name: 'Motley Fool', weight: 0.6 }
  ];
  
  constructor(config: Partial<NewsAdapterConfig> & { cache?: any; debugMode?: boolean }) {
    super('News', {
      cache: config.cache,
      debugMode: config.debugMode,
      rateLimitConfig: {
        requestsPerMinute: 30, // Conservative limit for news scraping
        burstSize: 5
      }
    });
    
    // Use provided Firecrawl adapter or create new one
    this.firecrawl = config.firecrawlAdapter || new FirecrawlAdapter({
      cache: config.cache,
      debugMode: config.debugMode
    });
    
    this.sentimentThreshold = config.sentimentThreshold || 0.6;
    this.newsApiKey = config.newsApiKey || process.env.REACT_APP_NEWS_API_KEY;
    this.alphaVantageApiKey = config.alphaVantageApiKey || process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
    this.finnhubApiKey = config.finnhubApiKey || process.env.REACT_APP_FINNHUB_API_KEY;
    
    // Create cached versions of methods
    this.getCompanyNews = this.createCachedMethod(
      this.getCompanyNews,
      'company_news',
      300000 // Cache for 5 minutes
    );
    
    this.getThemedNews = this.createCachedMethod(
      this.getThemedNews,
      'themed_news',
      300000 // Cache for 5 minutes
    );
  }
  
  /**
   * Gets comprehensive news coverage for a company
   * Aggregates from multiple sources and enriches with metadata
   */
  async getCompanyNews(
    ticker: string, 
    limit: number = 20,
    companyName?: string,
    options: {
      timeRange?: 'day' | 'week' | 'month' | 'quarter';
      focusAreas?: string[];
      includeSocialSentiment?: boolean;
    } = {}
  ): Promise<NewsItem[]> {
    try {
      // Get company name if not provided
      const name = companyName || await this.getCompanyName(ticker);
      
      logDebug('NewsAdapter', `Fetching news for ${ticker} (${name})`);
      
      // Fetch from multiple sources in parallel
      const newsPromises: Promise<NewsItem[]>[] = [];
      
      // 1. Finnhub Financial News (if API key available)
      if (this.finnhubApiKey) {
        newsPromises.push(this.fetchFinnhubNews(ticker));
      }
      
      // 2. Alpha Vantage News & Sentiment (if API key available)
      if (this.alphaVantageApiKey) {
        newsPromises.push(this.fetchAlphaVantageNews(ticker));
      }
      
      // 3. NewsAPI.org (if API key available)
      if (this.newsApiKey) {
        newsPromises.push(this.fetchNewsApiNews(name, ticker));
      }
      
      // 4. Firecrawl as fallback or supplementary source
      newsPromises.push(this.firecrawl.getCompanyNews(name, ticker, limit));
      
      // Await all sources
      const allNewsArrays = await Promise.allSettled(newsPromises);
      
      // Combine results from successful sources
      let newsItems: NewsItem[] = [];
      allNewsArrays.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          logDebug('NewsAdapter', `Source ${index} returned ${result.value.length} items`);
          newsItems = newsItems.concat(result.value);
        } else {
          logDebug('NewsAdapter', `Source ${index} failed: ${result.reason}`);
        }
      });
      
      // Deduplicate by URL
      const uniqueItems = this.deduplicateNews(newsItems);
      
      // Enrich news items with additional analysis
      const enrichedItems = await this.enrichNewsItems(uniqueItems, ticker, options);
      
      // Sort by composite score (relevance, credibility, temporal, impact)
      enrichedItems.sort((a, b) => {
        const scoreA = this.calculateNewsScore(a);
        const scoreB = this.calculateNewsScore(b);
        return scoreB - scoreA;
      });
      
      // Filter by time range if specified
      let filteredItems = enrichedItems;
      if (options.timeRange) {
        filteredItems = this.filterByTimeRange(enrichedItems, options.timeRange);
      }
      
      // Return top items
      return filteredItems.slice(0, limit);
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getCompanyNews',
        ticker
      });
    }
  }
  
  /**
   * Analyzes sentiment from recent news articles
   * Provides aggregated sentiment metrics and trends
   */
  async getNewsSentiment(ticker: string, companyName?: string): Promise<NewsSentiment> {
    try {
      // Get recent news articles
      const newsItems = await this.getCompanyNews(ticker, 30, companyName);
      
      if (newsItems.length === 0) {
        return {
          overall: 'neutral',
          score: 0,
          positiveCount: 0,
          negativeCount: 0,
          neutralCount: 0,
          articles: []
        };
      }
      
      // Aggregate sentiment data
      const aggregation = this.aggregateSentiment(newsItems);
      
      // Get top sentiment-driving articles
      const topArticles = this.getTopSentimentArticles(newsItems);
      
      return {
        overall: aggregation.overallSentiment,
        score: aggregation.sentimentScore,
        positiveCount: aggregation.positiveCount,
        negativeCount: aggregation.negativeCount,
        neutralCount: aggregation.neutralCount,
        articles: topArticles,
        // Additional insights
        trend: aggregation.sentimentTrend,
        keyTopics: aggregation.keyTopics,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getNewsSentiment',
        ticker
      });
    }
  }
  
  /**
   * Identifies earnings-related news events
   * Filters news for earnings announcements, guidance updates, etc.
   */
  async getEarningsEvents(ticker: string, companyName?: string): Promise<NewsEvent[]> {
    try {
      const name = companyName || await this.getCompanyName(ticker);
      const newsItems = await this.getCompanyNews(ticker, 50, name);
      
      // Filter for earnings-related news
      const earningsNews = newsItems.filter(item => 
        this.isEarningsRelated(item)
      );
      
      // Transform to NewsEvent format
      return earningsNews.map(item => ({
        date: item.publishedDate,
        type: this.classifyEarningsEvent(item),
        headline: item.title,
        description: item.summary,
        impact: this.assessImpact(item),
        source: item.source,
        url: item.url,
        metadata: {
          sentiment: item.sentiment,
          relevanceScore: item.relevanceScore,
          keyMetrics: this.extractKeyMetrics(item)
        }
      }));
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getEarningsEvents',
        ticker
      });
    }
  }
  
  /**
   * Gets themed news for specific analysis focus
   * Allows targeting specific types of news for deeper analysis
   */
  async getThemedNews(
    ticker: string,
    theme: 'technology' | 'financial' | 'regulatory' | 'competitive' | 'market',
    limit: number = 10,
    companyName?: string
  ): Promise<NewsItem[]> {
    try {
      // Define keywords for each theme
      const themeKeywords: { [key: string]: string[] } = {
        technology: ['AI', 'innovation', 'product', 'launch', 'technology', 'patent', 'research', 'development'],
        financial: ['earnings', 'revenue', 'profit', 'guidance', 'forecast', 'financial', 'quarter'],
        regulatory: ['SEC', 'regulation', 'compliance', 'investigation', 'lawsuit', 'legal', 'government'],
        competitive: ['competitor', 'market share', 'rival', 'competition', 'industry', 'versus'],
        market: ['stock', 'shares', 'trading', 'analyst', 'upgrade', 'downgrade', 'price target']
      };
      
      const keywords = themeKeywords[theme] || [];
      
      // Get news with focus areas
      const newsItems = await this.getCompanyNews(
        ticker,
        limit * 2, // Get more to filter
        companyName,
        { focusAreas: keywords }
      );
      
      // Further filter by theme relevance
      const themedNews = newsItems.filter(item => {
        const text = `${item.title} ${item.summary || ''}`.toLowerCase();
        return keywords.some(keyword => text.includes(keyword.toLowerCase()));
      });
      
      return themedNews.slice(0, limit);
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getThemedNews',
        ticker
      });
    }
  }

  /**
   * Gets general company events from news
   * Includes product launches, management changes, M&A activity, etc.
   */
  async getCompanyEvents(ticker: string, companyName?: string): Promise<NewsEvent[]> {
    try {
      const name = companyName || await this.getCompanyName(ticker);
      const newsItems = await this.getCompanyNews(ticker, 50, name);
      
      // Categorize news into event types
      const events: NewsEvent[] = [];
      
      for (const item of newsItems) {
        const eventType = this.classifyEvent(item);
        if (eventType !== 'other') {
          events.push({
            date: item.publishedDate,
            type: eventType,
            headline: item.title,
            description: item.summary,
            impact: this.assessImpact(item),
            source: item.source,
            url: item.url,
            metadata: {
              sentiment: item.sentiment,
              relevanceScore: item.relevanceScore,
              keyTopics: item.metadata?.keyTopics || []
            }
          });
        }
      }
      
      // Sort by date and impact
      return events.sort((a, b) => {
        const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (Math.abs(dateDiff) < 86400000) { // Within same day
          return this.getImpactScore(b.impact) - this.getImpactScore(a.impact);
        }
        return dateDiff;
      });
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getCompanyEvents',
        ticker
      });
    }
  }
  
  /**
   * Gets competitive intelligence by analyzing news about competitors
   * Useful for understanding market positioning and threats
   */
  async getCompetitiveIntelligence(
    ticker: string,
    competitors: string[],
    companyName?: string
  ): Promise<{
    company: NewsItem[];
    competitors: { [competitor: string]: NewsItem[] };
    analysis: {
      relativesentiment: 'better' | 'similar' | 'worse';
      keyThreats: string[];
      keyOpportunities: string[];
    };
  }> {
    try {
      const name = companyName || await this.getCompanyName(ticker);
      
      // Get news for main company
      const companyNews = await this.getCompanyNews(ticker, 20, name);
      
      // Get news for each competitor
      const competitorNews: { [key: string]: NewsItem[] } = {};
      for (const competitor of competitors) {
        const competitorName = await this.getCompanyName(competitor);
        competitorNews[competitor] = await this.getCompanyNews(competitor, 10, competitorName);
      }
      
      // Analyze relative sentiment
      const companySentiment = this.aggregateSentiment(companyNews);
      const competitorSentiments = Object.entries(competitorNews).map(([comp, news]) => ({
        competitor: comp,
        sentiment: this.aggregateSentiment(news)
      }));
      
      const avgCompetitorScore = competitorSentiments.reduce(
        (sum, c) => sum + c.sentiment.sentimentScore, 0
      ) / competitorSentiments.length;
      
      const relativeSentiment = companySentiment.sentimentScore > avgCompetitorScore + 0.2 ? 'better' :
                               companySentiment.sentimentScore < avgCompetitorScore - 0.2 ? 'worse' : 
                               'similar';
      
      // Extract threats and opportunities
      const threats: string[] = [];
      const opportunities: string[] = [];
      
      // Analyze competitor news for threats
      Object.values(competitorNews).flat().forEach(item => {
        if (item.sentiment === 'positive') {
          const text = `${item.title} ${item.summary || ''}`.toLowerCase();
          if (text.includes('market share') || text.includes('growth') || text.includes('expansion')) {
            threats.push(`Competitor ${item.title.substring(0, 100)}`);
          }
        }
      });
      
      // Analyze company news for opportunities
      companyNews.forEach(item => {
        if (item.sentiment === 'positive') {
          const text = `${item.title} ${item.summary || ''}`.toLowerCase();
          if (text.includes('partnership') || text.includes('innovation') || text.includes('breakthrough')) {
            opportunities.push(item.title.substring(0, 100));
          }
        }
      });
      
      return {
        company: companyNews.slice(0, 10),
        competitors: Object.fromEntries(
          Object.entries(competitorNews).map(([k, v]) => [k, v.slice(0, 5)])
        ),
        analysis: {
          relativesentiment: relativeSentiment,
          keyThreats: threats.slice(0, 5),
          keyOpportunities: opportunities.slice(0, 5)
        }
      };
      
    } catch (error) {
      throw wrapDataFetchError(error as Error, {
        source: 'News',
        operation: 'getCompetitiveIntelligence',
        ticker
      });
    }
  }

  /**
   * Helper methods for sentiment analysis and event classification
   */
  
  private aggregateSentiment(newsItems: NewsItem[]): SentimentAggregation {
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;
    let totalScore = 0;
    
    // Topic tracking
    const topicMap = new Map<string, { count: number; sentiment: number }>();
    
    // Process each article
    for (const item of newsItems) {
      // Count sentiment
      switch (item.sentiment) {
        case 'positive':
          positiveCount++;
          totalScore += item.relevanceScore;
          break;
        case 'negative':
          negativeCount++;
          totalScore -= item.relevanceScore;
          break;
        default:
          neutralCount++;
      }
      
      // Track topics
      if (item.metadata?.keyTopics) {
        for (const topic of item.metadata.keyTopics) {
          const existing = topicMap.get(topic) || { count: 0, sentiment: 0 };
          existing.count++;
          existing.sentiment += item.sentiment === 'positive' ? 1 : 
                               item.sentiment === 'negative' ? -1 : 0;
          topicMap.set(topic, existing);
        }
      }
    }
    
    // Calculate overall sentiment
    const totalArticles = newsItems.length;
    const sentimentScore = totalArticles > 0 ? totalScore / totalArticles : 0;
    const overallSentiment = sentimentScore > 0.2 ? 'positive' :
                            sentimentScore < -0.2 ? 'negative' : 'neutral';
    
    // Determine trend (compare recent vs older articles)
    const recentCount = Math.floor(totalArticles / 3);
    const recentScore = this.calculateAverageSentiment(newsItems.slice(0, recentCount));
    const olderScore = this.calculateAverageSentiment(newsItems.slice(recentCount));
    const sentimentTrend = recentScore > olderScore + 0.1 ? 'improving' :
                          recentScore < olderScore - 0.1 ? 'declining' : 'stable';
    
    // Process topics
    const keyTopics = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        mentions: data.count,
        sentiment: data.sentiment > 0 ? 'positive' as const :
                  data.sentiment < 0 ? 'negative' as const : 'neutral' as const
      }))
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10);
    
    return {
      overallSentiment,
      sentimentScore,
      positiveCount,
      neutralCount,
      negativeCount,
      totalArticles,
      sentimentTrend,
      keyTopics
    };
  }
  
  private calculateAverageSentiment(items: NewsItem[]): number {
    if (items.length === 0) return 0;
    
    const sum = items.reduce((acc, item) => {
      return acc + (item.sentiment === 'positive' ? 1 : 
                   item.sentiment === 'negative' ? -1 : 0) * item.relevanceScore;
    }, 0);
    
    return sum / items.length;
  }
  
  private getTopSentimentArticles(newsItems: NewsItem[]): NewsItem[] {
    // Get top positive and negative articles
    const positive = newsItems
      .filter(item => item.sentiment === 'positive')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
    
    const negative = newsItems
      .filter(item => item.sentiment === 'negative')
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
    
    // Combine and sort by date
    return [...positive, ...negative].sort(
      (a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
    );
  }
  
  private isEarningsRelated(item: NewsItem): boolean {
    const earningsKeywords = [
      'earnings', 'revenue', 'profit', 'loss', 'guidance', 
      'forecast', 'outlook', 'quarterly results', 'q1', 'q2', 'q3', 'q4',
      'beat', 'miss', 'consensus', 'eps', 'ebitda'
    ];
    
    const text = `${item.title} ${item.summary}`.toLowerCase();
    return earningsKeywords.some(keyword => text.includes(keyword));
  }
  
  private classifyEarningsEvent(item: NewsItem): string {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    
    if (text.includes('beat') || text.includes('exceed')) return 'earnings_beat';
    if (text.includes('miss') || text.includes('below')) return 'earnings_miss';
    if (text.includes('guidance') || text.includes('outlook')) return 'guidance_update';
    if (text.includes('forecast') || text.includes('estimate')) return 'forecast_revision';
    
    return 'earnings_announcement';
  }
  
  private classifyEvent(item: NewsItem): string {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    
    // Product/Service events
    if (/launch|introduce|unveil|release|announce.*product/i.test(text)) {
      return 'product_launch';
    }
    
    // M&A events
    if (/acquire|acquisition|merge|merger|buyout|takeover/i.test(text)) {
      return 'merger_acquisition';
    }
    
    // Management changes
    if (/ceo|cfo|cto|executive|appoint|resign|retire|hire/i.test(text)) {
      return 'management_change';
    }
    
    // Legal/Regulatory
    if (/lawsuit|litigation|regulatory|investigation|fine|penalty/i.test(text)) {
      return 'legal_regulatory';
    }
    
    // Partnership/Strategic
    if (/partnership|collaboration|alliance|joint venture|agreement/i.test(text)) {
      return 'partnership';
    }
    
    // Financial events
    if (/dividend|buyback|share repurchase|stock split|offering/i.test(text)) {
      return 'financial_event';
    }
    
    return 'other';
  }
  
  private assessImpact(item: NewsItem): 'high' | 'medium' | 'low' {
    // High relevance + strong sentiment = high impact
    if (item.relevanceScore > 0.8 && item.sentiment !== 'neutral') {
      return 'high';
    }
    
    // Medium relevance or moderate sentiment = medium impact
    if (item.relevanceScore > 0.5 || 
        (item.relevanceScore > 0.3 && item.sentiment !== 'neutral')) {
      return 'medium';
    }
    
    return 'low';
  }
  
  private getImpactScore(impact: 'high' | 'medium' | 'low'): number {
    switch (impact) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  }
  
  private extractKeyMetrics(item: NewsItem): any[] {
    // Extract financial metrics mentioned in the article
    const text = `${item.title} ${item.summary}`;
    const metrics = [];
    
    // Look for dollar amounts
    const dollarMatches = text.match(/\$[\d,]+\.?\d*\s*(billion|million|thousand)?/gi);
    if (dollarMatches) {
      metrics.push(...dollarMatches.map(m => ({ type: 'monetary', value: m })));
    }
    
    // Look for percentages
    const percentMatches = text.match(/\d+\.?\d*%/g);
    if (percentMatches) {
      metrics.push(...percentMatches.map(m => ({ type: 'percentage', value: m })));
    }
    
    return metrics;
  }
  
  private async getCompanyName(ticker: string): Promise<string> {
    // This would typically call a company info API
    // For now, use a mapping for common tickers
    const tickerToName: { [key: string]: string } = {
      'NVDA': 'NVIDIA Corporation',
      'AAPL': 'Apple Inc',
      'GOOGL': 'Alphabet Inc',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla Inc',
      'AMZN': 'Amazon.com Inc',
      'META': 'Meta Platforms Inc',
      'NFLX': 'Netflix Inc'
    };
    
    return tickerToName[ticker] || ticker;
  }
  
  /**
   * Enriches news items with additional metadata and scoring
   */
  private async enrichNewsItems(
    items: NewsItem[],
    ticker: string,
    options: any
  ): Promise<NewsItem[]> {
    return Promise.all(items.map(async item => {
      // Add source credibility score
      const sourceWeight = this.getSourceWeight(item.source, item.url);
      
      // Enhance relevance scoring
      const enhancedRelevance = this.calculateEnhancedRelevance(item, ticker, options);
      
      // Add temporal relevance
      const temporalScore = this.calculateTemporalRelevance(item.publishedDate);
      
      // Estimate market impact
      const impactScore = this.estimateImpactScore(item);
      
      return {
        ...item,
        relevanceScore: enhancedRelevance,
        metadata: {
          ...item.metadata,
          sourceCredibility: sourceWeight,
          temporalRelevance: temporalScore,
          impactScore: impactScore,
          compositeScore: this.calculateCompositeScore({
            relevance: enhancedRelevance,
            credibility: sourceWeight,
            temporal: temporalScore,
            impact: impactScore
          })
        }
      };
    }));
  }
  
  /**
   * Calculates a composite score for news ranking
   */
  private calculateNewsScore(item: NewsItem): number {
    return item.metadata?.compositeScore || this.calculateCompositeScore({
      relevance: item.relevanceScore || 0,
      credibility: item.metadata?.sourceCredibility || 0.5,
      temporal: item.metadata?.temporalRelevance || 0.5,
      impact: item.metadata?.impactScore || 0.5
    });
  }
  
  /**
   * Calculates composite score from individual components
   */
  private calculateCompositeScore(scores: {
    relevance: number;
    credibility: number;
    temporal: number;
    impact: number;
  }): number {
    // Weighted combination
    return (scores.relevance * 0.3) + 
           (scores.credibility * 0.3) + 
           (scores.temporal * 0.2) + 
           (scores.impact * 0.2);
  }
  
  /**
   * Gets source credibility weight based on trusted sources list
   */
  private getSourceWeight(source: string, url: string): number {
    const normalizedSource = source.toLowerCase();
    const normalizedUrl = url.toLowerCase();
    
    // Check against trusted sources
    const trusted = this.TRUSTED_SOURCES.find(s => 
      normalizedSource.includes(s.name.toLowerCase()) ||
      normalizedUrl.includes(s.domain)
    );
    
    return trusted?.weight || 0.5; // Default weight for unknown sources
  }
  
  /**
   * Calculates enhanced relevance based on multiple factors
   */
  private calculateEnhancedRelevance(
    item: NewsItem,
    ticker: string,
    options: any
  ): number {
    let score = item.relevanceScore || 0;
    
    // Boost if focus areas are mentioned
    if (options.focusAreas && item.metadata?.keyTopics) {
      const topicMatches = options.focusAreas.filter(area =>
        item.metadata.keyTopics.some(topic => 
          topic.toLowerCase().includes(area.toLowerCase())
        )
      );
      score += topicMatches.length * 0.1;
    }
    
    // Boost for exclusive or breaking news
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('exclusive') || 
        titleLower.includes('breaking') ||
        titleLower.includes('first')) {
      score += 0.15;
    }
    
    // Boost for earnings or major announcements
    const importantKeywords = [
      'earnings', 'acquisition', 'merger', 'guidance', 'forecast',
      'breakthrough', 'approval', 'partnership', 'contract', 'deal'
    ];
    
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();
    const keywordMatches = importantKeywords.filter(keyword => text.includes(keyword));
    score += keywordMatches.length * 0.1;
    
    // Boost for specific ticker mentions in title
    if (item.title.toUpperCase().includes(ticker)) {
      score += 0.2;
    }
    
    return Math.min(score, 1); // Cap at 1
  }
  
  /**
   * Calculates temporal relevance (how recent the news is)
   */
  private calculateTemporalRelevance(publishedDate: string): number {
    const now = Date.now();
    const published = new Date(publishedDate).getTime();
    const hoursSincePublished = (now - published) / (1000 * 60 * 60);
    
    // Exponential decay over time
    if (hoursSincePublished < 1) return 1.0;     // Last hour
    if (hoursSincePublished < 6) return 0.95;    // Last 6 hours
    if (hoursSincePublished < 24) return 0.9;    // Last day
    if (hoursSincePublished < 72) return 0.8;    // Last 3 days
    if (hoursSincePublished < 168) return 0.6;   // Last week
    if (hoursSincePublished < 720) return 0.4;   // Last month
    if (hoursSincePublished < 2160) return 0.2;  // Last quarter
    return 0.1; // Older than 3 months
  }
  
  /**
   * Estimates the potential market impact of news
   */
  private estimateImpactScore(item: NewsItem): number {
    let score = 0.5; // Base score
    
    // High impact keywords
    const highImpact = [
      'merger', 'acquisition', 'bankruptcy', 'fraud', 'investigation',
      'breakthrough', 'approval', 'contract', 'partnership', 'lawsuit',
      'recall', 'scandal', 'crisis', 'layoffs', 'restructuring'
    ];
    
    const mediumImpact = [
      'earnings', 'revenue', 'guidance', 'forecast', 'upgrade', 'downgrade',
      'expansion', 'launch', 'innovation', 'patent', 'milestone'
    ];
    
    const text = `${item.title} ${item.summary || ''}`.toLowerCase();
    
    // Check for high impact keywords
    highImpact.forEach(keyword => {
      if (text.includes(keyword)) score = Math.max(score, 0.9);
    });
    
    // Check for medium impact keywords
    mediumImpact.forEach(keyword => {
      if (text.includes(keyword)) score = Math.max(score, 0.7);
    });
    
    // Adjust based on sentiment strength
    if (item.sentiment === 'positive' && score > 0.7) score = Math.min(score + 0.1, 1);
    if (item.sentiment === 'negative' && score > 0.7) score = Math.min(score + 0.15, 1);
    
    // Boost for multiple exclamation points or all caps (often indicates significance)
    if (item.title.includes('!') || /[A-Z]{5,}/.test(item.title)) {
      score = Math.min(score + 0.1, 1);
    }
    
    return score;
  }
  
  /**
   * Filters news items by time range
   */
  private filterByTimeRange(items: NewsItem[], range: string): NewsItem[] {
    const now = Date.now();
    const ranges: { [key: string]: number } = {
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000,
      'quarter': 90 * 24 * 60 * 60 * 1000
    };
    
    const cutoff = now - (ranges[range] || ranges['week']);
    
    return items.filter(item => 
      new Date(item.publishedDate).getTime() > cutoff
    );
  }
  
  /**
   * Fetches news from Finnhub financial news API
   */
  private async fetchFinnhubNews(ticker: string): Promise<NewsItem[]> {
    try {
      const toDate = new Date().toISOString().split('T')[0];
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await axios.get(`${this.FINNHUB_URL}/company-news`, {
        params: {
          symbol: ticker,
          from: fromDate,
          to: toDate,
          token: this.finnhubApiKey
        },
        timeout: 10000
      });
      
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }
      
      return response.data.map((article: any) => ({
        id: `finnhub_${article.id}`,
        title: article.headline,
        summary: article.summary,
        url: article.url,
        source: article.source,
        publishedDate: new Date(article.datetime * 1000).toISOString(),
        sentiment: this.categorizeSentiment(article.sentiment),
        relevanceScore: 0.8, // Finnhub is highly relevant
        metadata: {
          provider: 'finnhub',
          category: article.category,
          imageUrl: article.image,
          relatedTickers: article.related ? article.related.split(',') : [ticker]
        }
      }));
    } catch (error) {
      logDebug('NewsAdapter', `Finnhub fetch failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Fetches news from Alpha Vantage news & sentiment API
   */
  private async fetchAlphaVantageNews(ticker: string): Promise<NewsItem[]> {
    try {
      const response = await axios.get(this.ALPHA_VANTAGE_URL, {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: ticker,
          apikey: this.alphaVantageApiKey,
          limit: 50
        },
        timeout: 10000
      });
      
      if (!response.data?.feed || !Array.isArray(response.data.feed)) {
        return [];
      }
      
      return response.data.feed.map((article: any) => {
        // Find ticker-specific sentiment
        const tickerSentiment = article.ticker_sentiment?.find(
          (ts: any) => ts.ticker === ticker
        ) || {};
        
        return {
          id: `av_${article.url.split('/').pop()}`,
          title: article.title,
          summary: article.summary,
          url: article.url,
          source: article.source || article.source_domain,
          publishedDate: article.time_published,
          sentiment: this.mapAlphaVantageSentiment(tickerSentiment.ticker_sentiment_label),
          relevanceScore: parseFloat(tickerSentiment.relevance_score || '0.5'),
          metadata: {
            provider: 'alphavantage',
            authors: article.authors,
            topics: article.topics?.map((t: any) => t.topic),
            overallSentimentScore: parseFloat(article.overall_sentiment_score || '0'),
            tickerSentimentScore: parseFloat(tickerSentiment.ticker_sentiment_score || '0')
          }
        };
      });
    } catch (error) {
      logDebug('NewsAdapter', `Alpha Vantage fetch failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Fetches news from NewsAPI.org
   */
  private async fetchNewsApiNews(companyName: string, ticker: string): Promise<NewsItem[]> {
    try {
      const query = `"${companyName}" OR "${ticker}" stock market`;
      
      const response = await axios.get(`${this.NEWS_API_URL}/everything`, {
        params: {
          q: query,
          sortBy: 'relevancy',
          language: 'en',
          pageSize: 50,
          apiKey: this.newsApiKey
        },
        timeout: 10000
      });
      
      if (!response.data?.articles || !Array.isArray(response.data.articles)) {
        return [];
      }
      
      return response.data.articles
        .filter((article: any) => article.url && article.title)
        .map((article: any) => ({
          id: `newsapi_${article.url.split('/').pop()}`,
          title: article.title,
          summary: article.description || article.content?.substring(0, 200),
          url: article.url,
          source: article.source.name,
          publishedDate: article.publishedAt,
          sentiment: 'neutral', // NewsAPI doesn't provide sentiment
          relevanceScore: 0.6, // Default relevance
          metadata: {
            provider: 'newsapi',
            author: article.author,
            imageUrl: article.urlToImage
          }
        }));
    } catch (error) {
      logDebug('NewsAdapter', `NewsAPI fetch failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Deduplicates news items by URL
   */
  private deduplicateNews(items: NewsItem[]): NewsItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const normalizedUrl = item.url.toLowerCase().replace(/[?#].*$/, '');
      if (seen.has(normalizedUrl)) {
        return false;
      }
      seen.add(normalizedUrl);
      return true;
    });
  }
  
  /**
   * Maps Alpha Vantage sentiment labels to our format
   */
  private mapAlphaVantageSentiment(label?: string): 'positive' | 'neutral' | 'negative' {
    if (!label) return 'neutral';
    
    const normalized = label.toLowerCase();
    if (normalized.includes('bullish') || normalized.includes('positive')) {
      return 'positive';
    }
    if (normalized.includes('bearish') || normalized.includes('negative')) {
      return 'negative';
    }
    return 'neutral';
  }
  
  /**
   * Categorizes numeric sentiment scores
   */
  private categorizeSentiment(score?: number): 'positive' | 'neutral' | 'negative' {
    if (score === undefined || score === null) return 'neutral';
    
    if (score > 0.2) return 'positive';
    if (score < -0.2) return 'negative';
    return 'neutral';
  }
}