// src/reportGeneration/services/anthropicAIService.ts
// Anthropic Claude AI integration for intelligent content generation
// Context: THIS IS THE MOMENT - Adding the WOW factor to reports!

import Anthropic from '@anthropic-ai/sdk';
import { CompanyData, ReportSlide } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { logDebug, logError } from '../../utils/logger';

/**
 * AI-generated content types
 */
export interface AIGeneratedContent {
  executiveSummary: string;
  investmentThesis: string;
  keyInsights: string[];
  riskAnalysis: string;
  futureOutlook: string;
  technicalCommentary?: string;
  competitiveAnalysis?: string;
  recommendationRationale: string;
  actionItems: string[];
}

/**
 * AI generation options
 */
export interface AIGenerationOptions {
  tone?: 'professional' | 'conversational' | 'executive';
  depth?: 'concise' | 'standard' | 'comprehensive';
  focusAreas?: string[];
  includeCharts?: boolean;
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
}

/**
 * Section-specific prompts for different report types
 */
const SECTION_PROMPTS = {
  executiveSummary: {
    equity: `You are a senior equity analyst at a top-tier investment firm. Write a compelling executive summary that captures the investment opportunity in 3-4 paragraphs. Focus on: 1) Current business position and market dynamics, 2) Key financial highlights and trends, 3) Investment recommendation with clear rationale. Use specific numbers and percentages from the data.`,
    technical: `You are a chief technical analyst. Write an executive summary focusing on price action, key technical levels, and trading opportunities. Include specific support/resistance levels, trend analysis, and actionable entry/exit points.`,
    risk: `You are a risk management director. Write an executive summary that clearly outlines the risk profile, potential downside scenarios, and risk mitigation strategies. Be specific about risk metrics and thresholds.`
  },
  
  investmentThesis: `Based on the comprehensive data provided, craft a compelling investment thesis that would convince an investment committee. Include:
- The core investment narrative (why this stock, why now?)
- 3-4 key catalysts that will drive performance
- Competitive advantages and moat analysis
- Expected return profile with specific targets
- Time horizon and key milestones to monitor`,
  
  futureOutlook: `Project the company's trajectory over the next 12-24 months. Consider:
- Industry trends and disruptions
- Company's strategic initiatives
- Financial projections based on current metrics
- Potential headwinds and tailwinds
- Scenario analysis (base, bull, bear cases)
Provide specific, data-driven predictions.`,
  
  competitiveAnalysis: `Analyze the company's competitive position:
- Market share dynamics and trends
- Competitive advantages/disadvantages
- Industry structure and barriers to entry
- Threat of disruption or new entrants
- Strategic positioning vs peers
Be specific with comparisons and use metrics where available.`
};

/**
 * Anthropic AI Service
 * Leverages Claude for intelligent, context-aware content generation
 */
export class AnthropicAIService {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022'; // Using the latest model
  private maxTokens: number = 4000;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    if (!key) {
      logDebug('AnthropicAIService', 'No API key provided - service will use intelligent fallbacks');
      // Don't throw error - allow service to work with fallbacks
      this.client = null as any;
    } else {
      this.client = new Anthropic({
        apiKey: key
      });
      logDebug('AnthropicAIService', 'Initialized with Claude API');
    }
  }

  /**
   * Generates comprehensive AI content for the entire report
   * THIS IS WHERE THE MAGIC HAPPENS!
   */
  async generateReportContent(
    companyData: CompanyData,
    analysis: AnalysisResults,
    options: AIGenerationOptions = {}
  ): Promise<AIGeneratedContent> {
    logDebug('AnthropicAIService', `Generating AI content for ${companyData.ticker}`);
    
    // If no API client, use intelligent fallbacks
    if (!this.client) {
      logDebug('AnthropicAIService', 'Using intelligent fallback content generation');
      return this.generateFallbackContent(companyData, analysis, options);
    }
    
    try {
      // Prepare context with all available data
      const context = this.prepareComprehensiveContext(companyData, analysis);
      
      // Generate each section with tailored prompts
      const [
        executiveSummary,
        investmentThesis,
        keyInsights,
        riskAnalysis,
        futureOutlook,
        recommendationRationale
      ] = await Promise.all([
        this.generateExecutiveSummary(context, options),
        this.generateInvestmentThesis(context, options),
        this.generateKeyInsights(context, options),
        this.generateRiskAnalysis(context, options),
        this.generateFutureOutlook(context, options),
        this.generateRecommendationRationale(context, analysis, options)
      ]);
      
      // Generate optional sections based on report type
      const technicalCommentary = options.focusAreas?.includes('technical') 
        ? await this.generateTechnicalCommentary(context, companyData.technicals)
        : undefined;
        
      const competitiveAnalysis = options.focusAreas?.includes('competitive')
        ? await this.generateCompetitiveAnalysis(context, companyData)
        : undefined;
      
      // Generate actionable recommendations
      const actionItems = await this.generateActionItems(context, analysis, options);
      
      logDebug('AnthropicAIService', 'AI content generation complete');
      
      return {
        executiveSummary,
        investmentThesis,
        keyInsights,
        riskAnalysis,
        futureOutlook,
        technicalCommentary,
        competitiveAnalysis,
        recommendationRationale,
        actionItems
      };
      
    } catch (error) {
      logError('AnthropicAIService', 'Failed to generate AI content', error);
      throw error;
    }
  }

  /**
   * Generates an AI-enhanced slide with dynamic content
   */
  async generateEnhancedSlide(
    slideTitle: string,
    data: any,
    slideType: 'summary' | 'analysis' | 'metrics' | 'outlook',
    options: AIGenerationOptions = {}
  ): Promise<ReportSlide> {
    const prompt = this.buildSlidePrompt(slideTitle, data, slideType, options);
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7 // Balanced creativity and accuracy
    });
    
    const content = response.content[0].text;
    return this.parseSlideContent(slideTitle, content, slideType);
  }

  /**
   * Private content generation methods
   */

  private async generateExecutiveSummary(
    context: string,
    options: AIGenerationOptions
  ): Promise<string> {
    const reportType = options.focusAreas?.[0] || 'equity';
    const prompt = SECTION_PROMPTS.executiveSummary[reportType as keyof typeof SECTION_PROMPTS.executiveSummary] || 
                  SECTION_PROMPTS.executiveSummary.equity;
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: 'You are an expert financial analyst creating reports for institutional investors. Be specific, data-driven, and insightful.',
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nCompany Data and Analysis:\n${context}`
        }
      ],
      temperature: 0.7
    });
    
    return response.content[0].text;
  }

  private async generateInvestmentThesis(
    context: string,
    options: AIGenerationOptions
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: 'You are a portfolio manager at a hedge fund known for identifying exceptional investment opportunities.',
      messages: [
        {
          role: 'user',
          content: `${SECTION_PROMPTS.investmentThesis}\n\nCompany Data and Analysis:\n${context}\n\nRisk Tolerance: ${options.riskTolerance || 'moderate'}`
        }
      ],
      temperature: 0.8 // Slightly more creative for compelling narrative
    });
    
    return response.content[0].text;
  }

  private async generateKeyInsights(
    context: string,
    options: AIGenerationOptions
  ): Promise<string[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: `Based on this comprehensive analysis, identify the 5-7 most important insights that investors must know. Each insight should be:
- Specific and quantified where possible
- Non-obvious and genuinely insightful
- Actionable for investment decisions
- Backed by the data provided

Format as a JSON array of strings.

Company Data and Analysis:
${context}`
        }
      ],
      temperature: 0.7
    });
    
    try {
      const content = response.content[0].text;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logError('AnthropicAIService', 'Failed to parse key insights', error);
    }
    
    // Fallback: split by newlines if JSON parsing fails
    return response.content[0].text
      .split('\n')
      .filter(line => line.trim().length > 10)
      .slice(0, 7);
  }

  private async generateRiskAnalysis(
    context: string,
    options: AIGenerationOptions
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      system: 'You are a chief risk officer conducting thorough risk assessments. Be comprehensive but balanced.',
      messages: [
        {
          role: 'user',
          content: `Provide a detailed risk analysis covering:
1. Market risks (beta, volatility, correlation)
2. Company-specific risks (operational, financial, strategic)
3. Industry and macro risks
4. ESG and regulatory risks
5. Risk mitigation strategies

Use specific metrics and data points. Quantify risks where possible.

Company Data and Analysis:
${context}`
        }
      ],
      temperature: 0.6 // Lower temperature for risk analysis
    });
    
    return response.content[0].text;
  }

  private async generateFutureOutlook(
    context: string,
    options: AIGenerationOptions
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${SECTION_PROMPTS.futureOutlook}\n\nCompany Data and Analysis:\n${context}`
        }
      ],
      temperature: 0.8 // Higher creativity for future projections
    });
    
    return response.content[0].text;
  }

  private async generateRecommendationRationale(
    context: string,
    analysis: AnalysisResults,
    options: AIGenerationOptions
  ): Promise<string> {
    const recommendation = analysis.composite.recommendation.toUpperCase();
    const confidence = (analysis.composite.confidence * 100).toFixed(0);
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `The quantitative analysis resulted in a ${recommendation} recommendation with ${confidence}% confidence.

Write a compelling rationale that:
1. Explains why this recommendation makes sense given the data
2. Highlights the 2-3 most important factors driving this recommendation
3. Addresses potential concerns or counterarguments
4. Provides specific price targets or return expectations
5. Sets clear conditions that would change this recommendation

Company Data and Analysis:
${context}`
        }
      ],
      temperature: 0.7
    });
    
    return response.content[0].text;
  }

  private async generateTechnicalCommentary(
    context: string,
    technicals?: any
  ): Promise<string> {
    if (!technicals) return '';
    
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      system: 'You are a CMT (Chartered Market Technician) providing expert technical analysis.',
      messages: [
        {
          role: 'user',
          content: `Provide professional technical analysis covering:
- Current trend and momentum
- Key support and resistance levels
- Important chart patterns
- Volume analysis
- Technical indicators (RSI, MACD, etc.)
- Trading strategy and entry/exit points

Technical Data: ${JSON.stringify(technicals, null, 2)}
Context: ${context}`
        }
      ],
      temperature: 0.7
    });
    
    return response.content[0].text;
  }

  private async generateCompetitiveAnalysis(
    context: string,
    companyData: CompanyData
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `${SECTION_PROMPTS.competitiveAnalysis}\n\nCompany: ${companyData.companyName} (${companyData.ticker})\nIndustry: ${companyData.industry}\n\nContext:\n${context}`
        }
      ],
      temperature: 0.7
    });
    
    return response.content[0].text;
  }

  private async generateActionItems(
    context: string,
    analysis: AnalysisResults,
    options: AIGenerationOptions
  ): Promise<string[]> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: `Based on the analysis and ${analysis.composite.recommendation} recommendation, provide 5-7 specific action items for investors. Include:
- Immediate actions (what to do now)
- Monitoring points (what to watch)
- Risk management actions (stop-loss, position sizing)
- Follow-up research needed
- Key dates or events to track

Format as a JSON array of actionable strings.

Context: ${context}`
        }
      ],
      temperature: 0.7
    });
    
    try {
      const content = response.content[0].text;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logError('AnthropicAIService', 'Failed to parse action items', error);
    }
    
    // Fallback
    return [
      `Initiate ${analysis.composite.recommendation} position in ${analysis.composite.confidence > 0.8 ? 'full' : 'half'} size`,
      'Set stop-loss at key technical support level',
      'Monitor upcoming earnings for guidance updates',
      'Track competitive developments in the industry',
      'Review position after next quarterly results'
    ];
  }

  /**
   * Prepares comprehensive context for AI
   */
  private prepareComprehensiveContext(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    const context = {
      company: {
        name: companyData.companyName,
        ticker: companyData.ticker,
        sector: companyData.sector,
        industry: companyData.industry,
        description: companyData.description
      },
      financials: {
        marketCap: companyData.financials?.keyMetrics?.marketCap,
        peRatio: companyData.financials?.keyMetrics?.peRatio,
        revenue: companyData.financials?.incomeStatement?.[0]?.revenue,
        netIncome: companyData.financials?.incomeStatement?.[0]?.netIncome,
        revenueGrowth: analysis.growth?.revenueGrowth,
        margins: {
          gross: companyData.financials?.keyMetrics?.grossMargin,
          operating: companyData.financials?.keyMetrics?.operatingMargin,
          net: companyData.financials?.keyMetrics?.netMargin
        }
      },
      analysis: {
        scores: {
          overall: analysis.composite.overall,
          growth: analysis.composite.growth,
          value: analysis.composite.value,
          quality: analysis.composite.quality,
          momentum: analysis.composite.momentum
        },
        valuation: {
          intrinsicValue: analysis.valuation?.intrinsicValue,
          marginOfSafety: analysis.valuation?.marginOfSafety,
          assessment: analysis.valuation?.valuation
        },
        risk: {
          score: analysis.risk?.riskScore,
          beta: analysis.risk?.beta,
          volatility: analysis.risk?.volatility
        },
        recommendation: analysis.composite.recommendation,
        confidence: analysis.composite.confidence
      },
      technicals: companyData.technicals ? {
        trend: analysis.technicals?.trend,
        support: analysis.technicals?.support,
        resistance: analysis.technicals?.resistance,
        signals: analysis.technicals?.signals
      } : undefined,
      news: companyData.news ? {
        sentiment: companyData.news.filter(n => n.sentiment === 'positive').length > 
                  companyData.news.filter(n => n.sentiment === 'negative').length ? 'positive' : 'mixed',
        recentHeadlines: companyData.news.slice(0, 5).map(n => n.title)
      } : undefined
    };
    
    return JSON.stringify(context, null, 2);
  }

  /**
   * Builds dynamic prompts for slide generation
   */
  private buildSlidePrompt(
    title: string,
    data: any,
    slideType: string,
    options: AIGenerationOptions
  ): string {
    const tone = options.tone || 'professional';
    const depth = options.depth || 'standard';
    
    return `Create content for a ${slideType} slide titled "${title}".

Tone: ${tone}
Detail Level: ${depth}

Data available:
${JSON.stringify(data, null, 2)}

Generate:
1. A compelling narrative paragraph (2-3 sentences)
2. 3-5 key bullet points with specific data
3. One insight that isn't immediately obvious from the data
4. A forward-looking statement or implication

Format the response clearly with sections.`;
  }

  /**
   * Parses AI response into slide format
   */
  private parseSlideContent(
    title: string,
    aiContent: string,
    slideType: string
  ): ReportSlide {
    // Parse the AI response into structured content
    const sections = aiContent.split(/\n\n+/);
    const bullets = this.extractBulletPoints(aiContent);
    
    return {
      slideNumber: 0, // Will be set by caller
      title,
      layout: slideType === 'summary' ? 'title' : 'content',
      content: [
        {
          type: 'text',
          data: {
            text: sections[0] || aiContent.slice(0, 200),
            bullets: bullets.length > 0 ? bullets : undefined
          }
        }
      ],
      notes: aiContent // Store full AI response in notes
    };
  }

  /**
   * Extracts bullet points from AI response
   */
  private extractBulletPoints(content: string): string[] {
    const bulletRegex = /^[-•*]\s+(.+)$/gm;
    const matches = content.match(bulletRegex) || [];
    return matches.map(match => match.replace(/^[-•*]\s+/, '').trim());
  }

  /**
   * Generates a complete narrative report
   */
  async generateNarrativeReport(
    companyData: CompanyData,
    analysis: AnalysisResults,
    options: AIGenerationOptions = {}
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4000,
      system: 'You are writing a comprehensive investment report for sophisticated institutional investors. Be thorough, insightful, and data-driven.',
      messages: [
        {
          role: 'user',
          content: `Write a complete investment report with the following sections:
1. Executive Summary
2. Company Overview
3. Financial Analysis
4. Investment Thesis
5. Risk Assessment
6. Valuation Analysis
7. Technical Analysis (if applicable)
8. Recommendation and Price Targets
9. Appendix: Key Metrics

Company Data: ${this.prepareComprehensiveContext(companyData, analysis)}

Make it compelling, professional, and actionable. Use specific numbers and avoid generic statements.`
        }
      ],
      temperature: 0.8
    });
    
    return response.content[0].text;
  }

  /**
   * Generates high-quality fallback content when API is unavailable
   * Uses sophisticated templates and data analysis
   */
  private async generateFallbackContent(
    companyData: CompanyData,
    analysis: AnalysisResults,
    options: AIGenerationOptions = {}
  ): Promise<AIGeneratedContent> {
    const ticker = companyData.ticker;
    const name = companyData.companyName;
    const sector = companyData.sector || 'Unknown';
    
    // Generate comprehensive executive summary
    const executiveSummary = this.generateFallbackExecutiveSummary(companyData, analysis, options);
    
    // Generate investment thesis
    const investmentThesis = this.generateFallbackInvestmentThesis(companyData, analysis, options);
    
    // Generate key insights
    const keyInsights = this.generateFallbackKeyInsights(companyData, analysis);
    
    // Generate risk analysis
    const riskAnalysis = this.generateFallbackRiskAnalysis(companyData, analysis);
    
    // Generate future outlook
    const futureOutlook = this.generateFallbackFutureOutlook(companyData, analysis);
    
    // Generate recommendation rationale
    const recommendationRationale = this.generateFallbackRecommendationRationale(companyData, analysis);
    
    // Generate action items
    const actionItems = this.generateFallbackActionItems(companyData, analysis);
    
    // Optional sections
    const technicalCommentary = options.focusAreas?.includes('technical') 
      ? this.generateFallbackTechnicalCommentary(companyData, analysis)
      : undefined;
      
    const competitiveAnalysis = options.focusAreas?.includes('competitive')
      ? this.generateFallbackCompetitiveAnalysis(companyData, analysis)
      : undefined;
    
    return {
      executiveSummary,
      investmentThesis,
      keyInsights,
      riskAnalysis,
      futureOutlook,
      technicalCommentary,
      competitiveAnalysis,
      recommendationRationale,
      actionItems
    };
  }

  private generateFallbackExecutiveSummary(
    companyData: CompanyData,
    analysis: AnalysisResults,
    options: AIGenerationOptions
  ): string {
    const score = analysis.composite.overall;
    const recommendation = analysis.composite.recommendation.toUpperCase();
    const confidence = (analysis.composite.confidence * 100).toFixed(0);
    
    let summary = `${companyData.companyName} (${companyData.ticker}) `;
    
    // Company overview
    if (companyData.description) {
      summary += `${companyData.description.slice(0, 150)}... `;
    } else {
      summary += `operates in the ${companyData.sector} sector within the ${companyData.industry || 'industry'}. `;
    }
    
    // Financial performance
    const financials = companyData.financials;
    if (financials?.incomeStatement?.[0]) {
      const revenue = (financials.incomeStatement[0].revenue / 1e9).toFixed(1);
      const netIncome = (financials.incomeStatement[0].netIncome / 1e9).toFixed(1);
      const margin = ((financials.incomeStatement[0].netIncome / financials.incomeStatement[0].revenue) * 100).toFixed(1);
      
      summary += `The company reported revenue of $${revenue}B and net income of $${netIncome}B, ` +
                 `representing a ${margin}% net profit margin. `;
    }
    
    // Valuation
    if (analysis.valuation) {
      const valuation = analysis.valuation.valuation;
      const marginOfSafety = (analysis.valuation.marginOfSafety * 100).toFixed(0);
      
      summary += `From a valuation perspective, the stock appears ${valuation.toLowerCase()} ` +
                 `with a ${marginOfSafety}% margin of safety based on our intrinsic value calculations. `;
    }
    
    // Growth metrics
    if (analysis.growth) {
      const revenueGrowth = (analysis.growth.revenueGrowth * 100).toFixed(1);
      const epsGrowth = (analysis.growth.epsGrowth * 100).toFixed(1);
      
      summary += `Growth metrics show ${revenueGrowth}% revenue growth and ${epsGrowth}% EPS growth year-over-year. `;
    }
    
    // Final recommendation
    summary += `Based on our comprehensive multi-factor analysis scoring ${(score * 100).toFixed(0)}/100, ` +
               `we assign a ${recommendation} rating with ${confidence}% confidence. `;
    
    // Key factors
    const strengths = [];
    const concerns = [];
    
    if (analysis.composite.growth > 0.7) strengths.push('strong growth trajectory');
    if (analysis.composite.quality > 0.7) strengths.push('high-quality fundamentals');
    if (analysis.composite.value > 0.7) strengths.push('attractive valuation');
    if (analysis.composite.momentum > 0.7) strengths.push('positive price momentum');
    
    if (analysis.composite.growth < 0.3) concerns.push('weak growth');
    if (analysis.composite.quality < 0.3) concerns.push('quality issues');
    if (analysis.composite.value < 0.3) concerns.push('expensive valuation');
    if (analysis.risk?.riskScore > 0.7) concerns.push('elevated risk');
    
    if (strengths.length > 0) {
      summary += `Key strengths include ${strengths.join(', ')}. `;
    }
    
    if (concerns.length > 0) {
      summary += `Primary concerns are ${concerns.join(', ')}. `;
    }
    
    return summary;
  }

  private generateFallbackInvestmentThesis(
    companyData: CompanyData,
    analysis: AnalysisResults,
    options: AIGenerationOptions
  ): string {
    const recommendation = analysis.composite.recommendation;
    const score = analysis.composite.overall;
    
    let thesis = `Investment Thesis for ${companyData.companyName} (${companyData.ticker}):\n\n`;
    
    // Core narrative
    thesis += `We ${recommendation === 'buy' ? 'believe' : recommendation === 'sell' ? 'are concerned that' : 'observe that'} `;
    thesis += `${companyData.companyName} `;
    
    if (recommendation === 'buy') {
      thesis += `represents a compelling investment opportunity driven by `;
      
      const catalysts = [];
      if (analysis.growth?.growthScore > 0.7) catalysts.push('accelerating growth metrics');
      if (analysis.valuation?.marginOfSafety > 0.2) catalysts.push('attractive entry valuation');
      if (analysis.quality?.qualityScore > 0.7) catalysts.push('superior operational efficiency');
      if (analysis.composite.momentum > 0.7) catalysts.push('strong technical momentum');
      
      thesis += catalysts.length > 0 ? catalysts.join(', ') : 'multiple positive factors';
      thesis += '. ';
    } else if (recommendation === 'sell') {
      thesis += `faces significant headwinds including `;
      
      const risks = [];
      if (analysis.growth?.growthScore < 0.3) risks.push('deteriorating growth prospects');
      if (analysis.valuation?.marginOfSafety < -0.2) risks.push('stretched valuation multiples');
      if (analysis.quality?.qualityScore < 0.3) risks.push('weakening fundamentals');
      if (analysis.risk?.riskScore > 0.7) risks.push('elevated downside risk');
      
      thesis += risks.length > 0 ? risks.join(', ') : 'multiple concerning factors';
      thesis += '. ';
    } else {
      thesis += `presents a balanced risk-reward profile with both opportunities and challenges. `;
    }
    
    // Competitive positioning
    thesis += `\n\nCompetitive Position:\n`;
    thesis += `Operating in the ${companyData.sector} sector, the company `;
    
    if (analysis.quality?.qualityScore > 0.6) {
      thesis += `maintains a strong competitive position with solid operational metrics. `;
    } else {
      thesis += `faces competitive pressures that require careful monitoring. `;
    }
    
    // Financial strength
    if (companyData.financials?.keyMetrics) {
      const metrics = companyData.financials.keyMetrics;
      thesis += `\n\nFinancial Strength:\n`;
      
      if (metrics.currentRatio && metrics.currentRatio > 1.5) {
        thesis += `Strong liquidity position with current ratio of ${metrics.currentRatio.toFixed(2)}. `;
      }
      
      if (metrics.debtToEquity !== undefined) {
        const debtLevel = metrics.debtToEquity < 0.5 ? 'conservative' : 
                         metrics.debtToEquity < 1.0 ? 'moderate' : 'elevated';
        thesis += `${debtLevel.charAt(0).toUpperCase() + debtLevel.slice(1)} leverage with D/E ratio of ${metrics.debtToEquity.toFixed(2)}. `;
      }
    }
    
    // Catalysts and timeline
    thesis += `\n\nKey Catalysts:\n`;
    thesis += `1. ${analysis.growth?.growthScore > 0.5 ? 'Continued revenue expansion in core markets' : 'Potential for operational improvements'}\n`;
    thesis += `2. ${analysis.quality?.profitability > 0.5 ? 'Margin expansion opportunities' : 'Cost optimization initiatives'}\n`;
    thesis += `3. ${companyData.sector === 'Technology' ? 'Product innovation and market share gains' : 'Industry consolidation benefits'}\n`;
    
    // Price targets
    if (analysis.valuation?.intrinsicValue) {
      const currentPrice = companyData.financials?.currentPrice || 100;
      const upside = ((analysis.valuation.intrinsicValue - currentPrice) / currentPrice * 100).toFixed(0);
      
      thesis += `\n\nValuation & Targets:\n`;
      thesis += `Intrinsic value estimated at $${analysis.valuation.intrinsicValue.toFixed(2)}, `;
      thesis += `representing ${upside}% ${parseInt(upside) > 0 ? 'upside' : 'downside'} potential. `;
      
      // Risk-adjusted targets
      const conservativeTarget = currentPrice * (1 + analysis.composite.overall - 0.5);
      const baseTarget = analysis.valuation.intrinsicValue;
      const optimisticTarget = currentPrice * (1 + (analysis.composite.overall - 0.3) * 1.5);
      
      thesis += `Price targets: Conservative $${conservativeTarget.toFixed(2)}, `;
      thesis += `Base $${baseTarget.toFixed(2)}, Optimistic $${optimisticTarget.toFixed(2)}.`;
    }
    
    return thesis;
  }

  private generateFallbackKeyInsights(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string[] {
    const insights: string[] = [];
    
    // Financial performance insights
    if (companyData.financials?.incomeStatement?.[0]) {
      const revenue = companyData.financials.incomeStatement[0].revenue;
      const netIncome = companyData.financials.incomeStatement[0].netIncome;
      const margin = (netIncome / revenue * 100).toFixed(1);
      
      insights.push(`Net profit margin of ${margin}% ${parseFloat(margin) > 15 ? 'exceeds' : parseFloat(margin) > 10 ? 'meets' : 'trails'} industry standards`);
    }
    
    // Growth insights
    if (analysis.growth) {
      const revenueGrowth = (analysis.growth.revenueGrowth * 100).toFixed(1);
      const epsGrowth = (analysis.growth.epsGrowth * 100).toFixed(1);
      
      if (Math.abs(analysis.growth.revenueGrowth) > 0.1) {
        insights.push(`Revenue ${analysis.growth.revenueGrowth > 0 ? 'grew' : 'declined'} ${Math.abs(parseFloat(revenueGrowth))}% YoY, ${analysis.growth.revenueGrowth > 0.15 ? 'significantly outpacing' : analysis.growth.revenueGrowth > 0.05 ? 'slightly above' : 'below'} sector average`);
      }
      
      if (parseFloat(epsGrowth) !== parseFloat(revenueGrowth)) {
        insights.push(`EPS growth of ${epsGrowth}% ${parseFloat(epsGrowth) > parseFloat(revenueGrowth) ? 'outpaced revenue growth, indicating operational leverage' : 'lagged revenue growth, suggesting margin pressure'}`);
      }
    }
    
    // Valuation insights
    if (analysis.valuation) {
      const marginOfSafety = (analysis.valuation.marginOfSafety * 100).toFixed(0);
      insights.push(`Stock trades at ${Math.abs(parseFloat(marginOfSafety))}% ${analysis.valuation.marginOfSafety > 0 ? 'discount' : 'premium'} to intrinsic value`);
    }
    
    // Quality insights
    if (analysis.quality && companyData.financials?.keyMetrics) {
      if (companyData.financials.keyMetrics.roe) {
        const roe = (companyData.financials.keyMetrics.roe * 100).toFixed(1);
        insights.push(`ROE of ${roe}% ${companyData.financials.keyMetrics.roe > 0.15 ? 'demonstrates strong capital efficiency' : 'suggests room for improvement'}`);
      }
    }
    
    // Risk insights
    if (analysis.risk) {
      const beta = analysis.risk.beta?.toFixed(2) || 'N/A';
      if (beta !== 'N/A') {
        insights.push(`Beta of ${beta} indicates ${parseFloat(beta) > 1.2 ? 'high' : parseFloat(beta) < 0.8 ? 'low' : 'moderate'} systematic risk relative to market`);
      }
    }
    
    // Momentum insights
    if (analysis.technicals) {
      const trend = analysis.technicals.trend;
      if (trend) {
        insights.push(`Technical indicators suggest ${trend} trend with ${analysis.technicals.signals?.filter(s => s.type === 'bullish').length || 0} bullish signals`);
      }
    }
    
    // Ensure we have at least 5 insights
    while (insights.length < 5) {
      const genericInsights = [
        'Management execution remains critical for achieving growth targets',
        'Market positioning provides defensive characteristics in volatile conditions',
        'Capital allocation strategy focuses on high-return investments',
        'Operational efficiency initiatives expected to drive margin expansion',
        'Strong balance sheet provides flexibility for strategic investments'
      ];
      insights.push(genericInsights[insights.length]);
    }
    
    return insights.slice(0, 7);
  }

  private generateFallbackRiskAnalysis(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    let riskAnalysis = `Risk Assessment for ${companyData.companyName}:\n\n`;
    
    // Market risk
    riskAnalysis += `Market Risk:\n`;
    if (analysis.risk?.beta) {
      const beta = analysis.risk.beta;
      riskAnalysis += `With a beta of ${beta.toFixed(2)}, the stock exhibits `;
      riskAnalysis += beta > 1.5 ? 'high sensitivity' : beta > 1.0 ? 'moderate sensitivity' : beta > 0.5 ? 'low sensitivity' : 'minimal correlation';
      riskAnalysis += ` to market movements. `;
    }
    
    if (analysis.risk?.volatility) {
      const vol = (analysis.risk.volatility * 100).toFixed(1);
      riskAnalysis += `Annualized volatility of ${vol}% `;
      riskAnalysis += parseFloat(vol) > 40 ? 'indicates significant price swings' : parseFloat(vol) > 25 ? 'suggests moderate price variation' : 'reflects relatively stable trading';
      riskAnalysis += `. `;
    }
    
    // Financial risk
    riskAnalysis += `\n\nFinancial Risk:\n`;
    if (companyData.financials?.keyMetrics?.debtToEquity !== undefined) {
      const de = companyData.financials.keyMetrics.debtToEquity;
      riskAnalysis += `Debt-to-equity ratio of ${de.toFixed(2)} `;
      riskAnalysis += de > 2.0 ? 'raises leverage concerns' : de > 1.0 ? 'indicates moderate leverage' : 'demonstrates conservative capital structure';
      riskAnalysis += `. `;
    }
    
    if (companyData.financials?.keyMetrics?.currentRatio) {
      const cr = companyData.financials.keyMetrics.currentRatio;
      riskAnalysis += `Current ratio of ${cr.toFixed(2)} `;
      riskAnalysis += cr > 2.0 ? 'provides strong liquidity buffer' : cr > 1.2 ? 'indicates adequate liquidity' : 'may signal liquidity constraints';
      riskAnalysis += `. `;
    }
    
    // Operational risk
    riskAnalysis += `\n\nOperational Risk:\n`;
    if (analysis.quality?.consistency) {
      const consistency = analysis.quality.consistency;
      riskAnalysis += consistency > 0.7 ? 'Historically stable operating performance reduces execution risk. ' :
                     consistency > 0.5 ? 'Moderate earnings variability requires monitoring. ' :
                     'Inconsistent historical performance elevates operational uncertainty. ';
    }
    
    // Sector-specific risks
    riskAnalysis += `\n\nSector-Specific Risks:\n`;
    riskAnalysis += `Operating in the ${companyData.sector} sector, the company faces `;
    
    const sectorRisks: { [key: string]: string } = {
      'Technology': 'rapid technological change, competitive disruption, and regulatory scrutiny',
      'Healthcare': 'regulatory changes, drug pricing pressure, and clinical trial risks',
      'Financial': 'interest rate sensitivity, credit risk, and regulatory capital requirements',
      'Energy': 'commodity price volatility, geopolitical risks, and environmental regulations',
      'Consumer': 'changing consumer preferences, economic sensitivity, and brand reputation risks',
      'Industrial': 'economic cyclicality, supply chain disruptions, and capital intensity'
    };
    
    riskAnalysis += sectorRisks[companyData.sector] || 'industry-specific competitive and regulatory challenges';
    riskAnalysis += `. `;
    
    // Risk mitigation
    riskAnalysis += `\n\nRisk Mitigation Strategies:\n`;
    riskAnalysis += `1. ${analysis.risk?.riskScore && analysis.risk.riskScore > 0.6 ? 'Position sizing to limit portfolio exposure' : 'Standard position sizing appropriate'}\n`;
    riskAnalysis += `2. ${analysis.risk?.volatility && analysis.risk.volatility > 0.3 ? 'Consider options strategies for downside protection' : 'Monitor key support levels for stop-loss placement'}\n`;
    riskAnalysis += `3. Regular monitoring of ${analysis.quality?.qualityScore && analysis.quality.qualityScore < 0.5 ? 'fundamental deterioration signals' : 'competitive positioning and market share'}\n`;
    riskAnalysis += `4. ${companyData.financials?.keyMetrics?.debtToEquity && companyData.financials.keyMetrics.debtToEquity > 1.5 ? 'Track debt refinancing schedule and interest coverage' : 'Assess capital allocation decisions and shareholder returns'}\n`;
    
    return riskAnalysis;
  }

  private generateFallbackFutureOutlook(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    let outlook = `Future Outlook for ${companyData.companyName}:\n\n`;
    
    // Near-term outlook (6-12 months)
    outlook += `Near-Term Outlook (6-12 months):\n`;
    
    if (analysis.composite.momentum > 0.6) {
      outlook += `Positive momentum indicators suggest continued strength in the near term. `;
    } else if (analysis.composite.momentum < 0.4) {
      outlook += `Weak momentum signals caution for near-term performance. `;
    } else {
      outlook += `Mixed technical signals indicate a period of consolidation ahead. `;
    }
    
    if (analysis.growth?.revenueGrowth && analysis.growth.revenueGrowth > 0.1) {
      outlook += `Revenue growth trajectory expected to continue, supported by `;
      outlook += companyData.sector === 'Technology' ? 'product innovation and market expansion' :
                 companyData.sector === 'Healthcare' ? 'pipeline development and demographic trends' :
                 companyData.sector === 'Financial' ? 'rising interest rates and loan growth' :
                 'improving industry fundamentals';
      outlook += `. `;
    }
    
    // Medium-term outlook (1-3 years)
    outlook += `\n\nMedium-Term Outlook (1-3 years):\n`;
    
    const growthScore = analysis.composite.growth;
    const qualityScore = analysis.composite.quality;
    
    if (growthScore > 0.7 && qualityScore > 0.7) {
      outlook += `Strong fundamentals position the company for sustained outperformance. `;
      outlook += `Key drivers include market share gains, operational leverage, and strategic initiatives. `;
    } else if (growthScore < 0.3 || qualityScore < 0.3) {
      outlook += `Structural challenges may limit growth potential without significant strategic changes. `;
      outlook += `Focus areas include operational restructuring, cost optimization, and market repositioning. `;
    } else {
      outlook += `Moderate growth expectations balanced by competitive pressures and market dynamics. `;
      outlook += `Success dependent on execution of current strategic plan and market conditions. `;
    }
    
    // Long-term outlook (3+ years)
    outlook += `\n\nLong-Term Outlook (3+ years):\n`;
    
    outlook += `The company's long-term prospects depend on `;
    
    const criticalFactors = [];
    if (companyData.sector === 'Technology') criticalFactors.push('continued innovation and platform evolution');
    if (analysis.quality?.qualityScore > 0.6) criticalFactors.push('maintaining competitive advantages');
    if (analysis.growth?.growthScore > 0.5) criticalFactors.push('successful market expansion');
    if (companyData.financials?.keyMetrics?.debtToEquity && companyData.financials.keyMetrics.debtToEquity < 1) criticalFactors.push('disciplined capital allocation');
    
    outlook += criticalFactors.length > 0 ? criticalFactors.join(', ') : 'evolving market dynamics and strategic execution';
    outlook += `. `;
    
    // Scenario analysis
    outlook += `\n\nScenario Analysis:\n`;
    
    const currentPrice = companyData.financials?.currentPrice || 100;
    const bullTarget = currentPrice * (1 + 0.3 + analysis.composite.overall * 0.2);
    const baseTarget = analysis.valuation?.intrinsicValue || currentPrice * (1 + 0.1);
    const bearTarget = currentPrice * (1 - 0.2 + analysis.composite.overall * 0.1);
    
    outlook += `Bull Case (30% probability): $${bullTarget.toFixed(2)} - Acceleration in growth, market share gains, multiple expansion\n`;
    outlook += `Base Case (50% probability): $${baseTarget.toFixed(2)} - Steady execution, in-line growth, stable margins\n`;
    outlook += `Bear Case (20% probability): $${bearTarget.toFixed(2)} - Competitive pressure, margin compression, growth disappointment\n`;
    
    // Key milestones
    outlook += `\n\nKey Milestones to Monitor:\n`;
    outlook += `1. Quarterly earnings releases for revenue/margin trends\n`;
    outlook += `2. Management guidance updates and strategic announcements\n`;
    outlook += `3. Industry data points and competitive developments\n`;
    outlook += `4. Macroeconomic indicators affecting sector performance\n`;
    
    return outlook;
  }

  private generateFallbackRecommendationRationale(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    const recommendation = analysis.composite.recommendation.toUpperCase();
    const confidence = (analysis.composite.confidence * 100).toFixed(0);
    const score = (analysis.composite.overall * 100).toFixed(0);
    
    let rationale = `${recommendation} Recommendation Rationale:\n\n`;
    
    rationale += `Our ${recommendation} recommendation with ${confidence}% confidence is based on a comprehensive analysis `;
    rationale += `yielding an overall score of ${score}/100. `;
    
    // Primary drivers
    rationale += `\n\nPrimary Drivers:\n`;
    
    const factors = [
      { name: 'Growth', score: analysis.composite.growth, weight: 0.25 },
      { name: 'Value', score: analysis.composite.value, weight: 0.25 },
      { name: 'Quality', score: analysis.composite.quality, weight: 0.25 },
      { name: 'Momentum', score: analysis.composite.momentum, weight: 0.25 }
    ].sort((a, b) => b.score - a.score);
    
    factors.forEach((factor, index) => {
      rationale += `${index + 1}. ${factor.name}: ${(factor.score * 100).toFixed(0)}/100 - `;
      
      if (factor.score > 0.7) {
        rationale += `Strong ${factor.name.toLowerCase()} characteristics support positive outlook`;
      } else if (factor.score < 0.3) {
        rationale += `Weak ${factor.name.toLowerCase()} metrics raise concerns`;
      } else {
        rationale += `Moderate ${factor.name.toLowerCase()} profile provides limited directional bias`;
      }
      
      rationale += `\n`;
    });
    
    // Supporting evidence
    rationale += `\n\nSupporting Evidence:\n`;
    
    if (recommendation === 'BUY') {
      if (analysis.valuation?.marginOfSafety > 0.15) {
        rationale += `• Attractive valuation with ${(analysis.valuation.marginOfSafety * 100).toFixed(0)}% margin of safety\n`;
      }
      if (analysis.growth?.growthScore > 0.6) {
        rationale += `• Strong growth trajectory with expanding market opportunity\n`;
      }
      if (analysis.quality?.qualityScore > 0.6) {
        rationale += `• High-quality business model with sustainable competitive advantages\n`;
      }
      if (analysis.composite.momentum > 0.6) {
        rationale += `• Positive technical momentum supporting continued upside\n`;
      }
    } else if (recommendation === 'SELL') {
      if (analysis.valuation?.marginOfSafety < -0.15) {
        rationale += `• Overvaluation concerns with ${Math.abs(analysis.valuation.marginOfSafety * 100).toFixed(0)}% downside risk\n`;
      }
      if (analysis.growth?.growthScore < 0.4) {
        rationale += `• Deteriorating growth metrics and market share losses\n`;
      }
      if (analysis.quality?.qualityScore < 0.4) {
        rationale += `• Fundamental weakness and eroding competitive position\n`;
      }
      if (analysis.risk?.riskScore > 0.7) {
        rationale += `• Elevated risk profile with limited margin of safety\n`;
      }
    } else {
      rationale += `• Balanced risk-reward profile with offsetting positive and negative factors\n`;
      rationale += `• Valuation appears fair relative to growth and quality characteristics\n`;
      rationale += `• Technical indicators suggest consolidation phase\n`;
      rationale += `• Await clearer catalysts before taking directional position\n`;
    }
    
    // Risk considerations
    rationale += `\n\nRisk Considerations:\n`;
    if (analysis.risk?.beta && analysis.risk.beta > 1.2) {
      rationale += `• High beta of ${analysis.risk.beta.toFixed(2)} amplifies market risk\n`;
    }
    if (analysis.risk?.volatility && analysis.risk.volatility > 0.3) {
      rationale += `• Elevated volatility of ${(analysis.risk.volatility * 100).toFixed(1)}% requires risk management\n`;
    }
    if (companyData.financials?.keyMetrics?.debtToEquity && companyData.financials.keyMetrics.debtToEquity > 1.5) {
      rationale += `• Leverage ratio of ${companyData.financials.keyMetrics.debtToEquity.toFixed(2)}x warrants monitoring\n`;
    }
    
    // Conditions for change
    rationale += `\n\nConditions That Would Change Our View:\n`;
    if (recommendation === 'BUY') {
      rationale += `• Significant deterioration in fundamental metrics or competitive position\n`;
      rationale += `• Valuation expansion beyond reasonable multiples (>30% above fair value)\n`;
      rationale += `• Major negative regulatory or legal developments\n`;
    } else if (recommendation === 'SELL') {
      rationale += `• Meaningful improvement in growth trajectory or margin profile\n`;
      rationale += `• Valuation correction providing attractive entry point (>20% decline)\n`;
      rationale += `• Strategic actions addressing operational challenges\n`;
    } else {
      rationale += `• Clear breakout above resistance with volume confirmation\n`;
      rationale += `• Fundamental inflection point in growth or profitability\n`;
      rationale += `• M&A activity or strategic repositioning\n`;
    }
    
    return rationale;
  }

  private generateFallbackActionItems(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string[] {
    const recommendation = analysis.composite.recommendation;
    const items: string[] = [];
    
    // Position-specific actions
    if (recommendation === 'buy') {
      items.push(`Initiate position with 2-3% portfolio allocation, scaling in over 2-3 trading sessions`);
      items.push(`Set initial stop-loss at ${analysis.risk?.volatility ? (analysis.risk.volatility * 100 * 1.5).toFixed(0) : '8'}% below entry price`);
      items.push(`Target position size increase on pullbacks to key support levels`);
    } else if (recommendation === 'sell') {
      items.push(`Exit existing positions or consider short position for aggressive traders`);
      items.push(`If holding, implement tight stop-loss at 3-5% above current levels`);
      items.push(`Consider protective puts for remaining long exposure`);
    } else {
      items.push(`Maintain current position size without new commitments`);
      items.push(`Monitor for breakout above resistance or breakdown below support`);
      items.push(`Consider selling covered calls to generate income during consolidation`);
    }
    
    // Monitoring actions
    items.push(`Review position after next quarterly earnings report (typically ${this.getNextEarningsEstimate(companyData)})`);
    items.push(`Track sector rotation and peer performance for relative strength analysis`);
    
    // Risk management
    if (analysis.risk?.volatility && analysis.risk.volatility > 0.25) {
      items.push(`Given ${(analysis.risk.volatility * 100).toFixed(0)}% volatility, consider position sizing adjustments`);
    }
    
    // Technical levels
    if (analysis.technicals) {
      items.push(`Monitor key technical levels: Support at $${analysis.technicals.support}, Resistance at $${analysis.technicals.resistance}`);
    }
    
    return items;
  }

  private generateFallbackTechnicalCommentary(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    if (!analysis.technicals) {
      return 'Technical analysis requires recent price data and indicators.';
    }
    
    let commentary = `Technical Analysis for ${companyData.ticker}:\n\n`;
    
    commentary += `Trend Analysis:\n`;
    commentary += `The stock is currently in a ${analysis.technicals.trend || 'sideways'} trend. `;
    
    if (analysis.technicals.trendStrength) {
      commentary += `Trend strength is ${analysis.technicals.trendStrength > 0.7 ? 'strong' : analysis.technicals.trendStrength > 0.4 ? 'moderate' : 'weak'}. `;
    }
    
    commentary += `\n\nKey Levels:\n`;
    commentary += `Support: $${analysis.technicals.support || 'N/A'}\n`;
    commentary += `Resistance: $${analysis.technicals.resistance || 'N/A'}\n`;
    
    if (analysis.technicals.pivotPoint) {
      commentary += `Pivot Point: $${analysis.technicals.pivotPoint}\n`;
    }
    
    commentary += `\n\nMomentum Indicators:\n`;
    if (analysis.technicals.rsi) {
      const rsi = analysis.technicals.rsi;
      commentary += `RSI (14): ${rsi.toFixed(1)} - ${rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral'}\n`;
    }
    
    if (analysis.technicals.macd) {
      commentary += `MACD: ${analysis.technicals.macd.histogram > 0 ? 'Bullish' : 'Bearish'} histogram\n`;
    }
    
    commentary += `\n\nVolume Analysis:\n`;
    commentary += `Recent volume patterns show ${analysis.technicals.volumeTrend || 'normal'} activity. `;
    
    if (analysis.technicals.signals && analysis.technicals.signals.length > 0) {
      commentary += `\n\nRecent Signals:\n`;
      analysis.technicals.signals.slice(0, 3).forEach(signal => {
        commentary += `• ${signal.type.charAt(0).toUpperCase() + signal.type.slice(1)} signal: ${signal.indicator} at $${signal.price}\n`;
      });
    }
    
    return commentary;
  }

  private generateFallbackCompetitiveAnalysis(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    let competitive = `Competitive Analysis for ${companyData.companyName}:\n\n`;
    
    competitive += `Industry Position:\n`;
    competitive += `${companyData.companyName} operates in the ${companyData.industry || companyData.sector} industry `;
    
    if (analysis.quality?.qualityScore > 0.7) {
      competitive += `as a well-positioned player with strong operational metrics. `;
    } else if (analysis.quality?.qualityScore > 0.5) {
      competitive += `with average competitive positioning. `;
    } else {
      competitive += `facing significant competitive challenges. `;
    }
    
    competitive += `\n\nCompetitive Advantages:\n`;
    
    // Infer advantages from metrics
    const advantages = [];
    if (analysis.quality?.profitability > 0.7) advantages.push('Superior profitability and operational efficiency');
    if (analysis.growth?.growthScore > 0.7) advantages.push('Above-average growth trajectory');
    if (companyData.financials?.keyMetrics?.roe && companyData.financials.keyMetrics.roe > 0.15) advantages.push('Strong return on equity indicating competitive moat');
    if (analysis.quality?.consistency > 0.7) advantages.push('Consistent execution track record');
    
    if (advantages.length === 0) advantages.push('Limited visible competitive advantages');
    
    advantages.forEach((adv, i) => {
      competitive += `${i + 1}. ${adv}\n`;
    });
    
    competitive += `\n\nCompetitive Threats:\n`;
    
    // Industry-specific threats
    const threats: { [key: string]: string[] } = {
      'Technology': ['Rapid technological disruption', 'New market entrants', 'Platform shifts'],
      'Healthcare': ['Regulatory changes', 'Patent expirations', 'Pricing pressure'],
      'Financial': ['Fintech disruption', 'Regulatory burden', 'Interest rate risk'],
      'Consumer': ['Changing preferences', 'E-commerce shift', 'Private label competition'],
      'Industrial': ['Global competition', 'Input cost inflation', 'Automation trends']
    };
    
    const sectorThreats = threats[companyData.sector] || ['Industry consolidation', 'Market saturation', 'Substitute products'];
    sectorThreats.forEach((threat, i) => {
      competitive += `${i + 1}. ${threat}\n`;
    });
    
    competitive += `\n\nMarket Dynamics:\n`;
    competitive += `The ${companyData.sector} sector is experiencing `;
    
    if (analysis.growth?.industryGrowth && analysis.growth.industryGrowth > 0.05) {
      competitive += `healthy growth of ${(analysis.growth.industryGrowth * 100).toFixed(1)}% annually. `;
    } else {
      competitive += `moderate growth with increasing competition. `;
    }
    
    competitive += `Key success factors include innovation, scale, and customer relationships. `;
    
    competitive += `\n\nStrategic Positioning:\n`;
    if (analysis.composite.overall > 0.7) {
      competitive += `The company's strong fundamental scores suggest effective strategic positioning relative to peers. `;
      competitive += `Focus should remain on maintaining competitive advantages while exploring adjacent growth opportunities.`;
    } else if (analysis.composite.overall > 0.5) {
      competitive += `Current positioning appears adequate but requires continued investment to maintain market share. `;
      competitive += `Strategic priorities should include operational efficiency and selective growth investments.`;
    } else {
      competitive += `Weak fundamental scores indicate need for strategic repositioning. `;
      competitive += `Management should consider portfolio optimization, cost restructuring, or strategic partnerships.`;
    }
    
    return competitive;
  }

  private getNextEarningsEstimate(companyData: CompanyData): string {
    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    const nextQuarter = (currentQuarter + 1) % 4;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const quarterStartMonths = [0, 3, 6, 9];
    const nextEarningsMonth = quarterStartMonths[nextQuarter] + 1; // Usually report 1 month after quarter end
    
    return months[nextEarningsMonth];
  }
}

// Singleton instance
let aiServiceInstance: AnthropicAIService | null = null;

/**
 * Gets the AI service instance
 */
export function getAnthropicAIService(apiKey?: string): AnthropicAIService {
  if (!aiServiceInstance) {
    try {
      aiServiceInstance = new AnthropicAIService(apiKey);
    } catch (error) {
      logError('AnthropicAIService', 'Failed to initialize AI service', error);
      // Return a service that will use fallbacks
      aiServiceInstance = new AnthropicAIService();
    }
  }
  return aiServiceInstance;
}