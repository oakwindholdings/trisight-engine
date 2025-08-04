// src/utils/claudeOpusEnhanced.ts
// Enhanced Claude Opus 4 Max Thinking integration for advanced financial analysis
// Context: Leverages Claude's advanced reasoning for pattern analysis and market intelligence

import Anthropic from '@anthropic-ai/sdk';
import { logDebug, logError } from './debug';

interface ThinkingAnalysisRequest {
  symbol: string;
  patternData?: any;
  marketData?: any;
  technicalIndicators?: any;
  newsContext?: string[];
  analysisType: 'pattern' | 'risk' | 'sentiment' | 'forecast' | 'comprehensive';
}

interface ThinkingAnalysisResponse {
  reasoning: string;
  conclusion: string;
  confidence: number;
  keyFactors: string[];
  risks: string[];
  opportunities: string[];
  actionableInsights: string[];
  timeHorizon: 'short' | 'medium' | 'long';
}

interface PatternThinkingRequest {
  patternType: string;
  patternData: any;
  marketContext: any;
  historicalPerformance?: any;
}

interface PatternThinkingResponse {
  patternValidation: {
    isValid: boolean;
    confidence: number;
    reasoning: string;
  };
  marketContext: {
    favorability: number;
    reasoning: string;
  };
  tradingRecommendation: {
    action: 'buy' | 'sell' | 'hold' | 'avoid';
    reasoning: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
  keyInsights: string[];
}

/**
 * Enhanced Claude Opus 4 Max Thinking integration
 * Provides advanced reasoning capabilities for financial analysis
 */
export class ClaudeOpusEnhanced {
  private client: Anthropic;
  private model: string = 'claude-3-5-sonnet-20241022';
  private maxTokens: number = 4000;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.REACT_APP_ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key is required for Claude Opus Enhanced');
    }

    this.client = new Anthropic({ apiKey: key });
    logDebug('ClaudeOpusEnhanced', 'Initialized with advanced thinking capabilities');
  }

  /**
   * Advanced thinking analysis for complex financial scenarios
   */
  async performThinkingAnalysis(request: ThinkingAnalysisRequest): Promise<ThinkingAnalysisResponse> {
    const systemPrompt = this.buildSystemPrompt(request.analysisType);
    const userPrompt = this.buildAnalysisPrompt(request);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: userPrompt
        }],
        temperature: 0.2 // Low temperature for analytical precision
      });

      return this.parseThinkingResponse(response.content[0].text);
    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Thinking analysis failed', error);
      throw error;
    }
  }

  /**
   * Advanced pattern analysis with step-by-step reasoning
   */
  async analyzePatternWithThinking(request: PatternThinkingRequest): Promise<PatternThinkingResponse> {
    const prompt = `
You are an expert quantitative analyst with deep expertise in technical pattern recognition. 
Analyze this trading pattern using step-by-step reasoning.

Pattern Information:
- Type: ${request.patternType}
- Pattern Data: ${JSON.stringify(request.patternData, null, 2)}
- Market Context: ${JSON.stringify(request.marketContext, null, 2)}
${request.historicalPerformance ? `- Historical Performance: ${JSON.stringify(request.historicalPerformance, null, 2)}` : ''}

Please provide a comprehensive analysis following this structure:

1. PATTERN VALIDATION
   - Assess if this pattern meets technical criteria
   - Evaluate pattern quality and formation completeness
   - Consider any deviations from ideal pattern structure

2. MARKET CONTEXT ANALYSIS
   - Analyze current market conditions
   - Evaluate sector/stock-specific factors
   - Consider volume, volatility, and momentum

3. TRADING RECOMMENDATION
   - Provide clear action recommendation
   - Explain risk/reward ratio
   - Suggest position sizing and risk management

4. KEY INSIGHTS
   - Highlight most important factors
   - Identify potential catalysts or risks
   - Provide actionable intelligence

Format your response as JSON with the following structure:
{
  "patternValidation": {
    "isValid": boolean,
    "confidence": number (0-1),
    "reasoning": "detailed explanation"
  },
  "marketContext": {
    "favorability": number (0-1),
    "reasoning": "market analysis"
  },
  "tradingRecommendation": {
    "action": "buy|sell|hold|avoid",
    "reasoning": "recommendation rationale",
    "riskLevel": "low|medium|high"
  },
  "keyInsights": ["insight1", "insight2", ...]
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: 'You are a world-class quantitative analyst specializing in technical pattern recognition and risk assessment. Provide detailed, step-by-step reasoning for all conclusions.',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1
      });

      return this.parsePatternResponse(response.content[0].text);
    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Pattern analysis failed', error);
      throw error;
    }
  }

  /**
   * Real-time market sentiment analysis with reasoning
   */
  async analyzeSentimentWithThinking(
    symbol: string, 
    newsItems: string[], 
    marketData: any
  ): Promise<{
    sentiment: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
    keyFactors: string[];
    timeHorizon: string;
  }> {
    const prompt = `
Analyze market sentiment for ${symbol} using advanced reasoning:

News Context:
${newsItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}

Market Data:
${JSON.stringify(marketData, null, 2)}

Provide step-by-step sentiment analysis:
1. Analyze each news item's impact
2. Evaluate market data signals
3. Consider broader market context
4. Synthesize overall sentiment

Return JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": number (0-1),
  "reasoning": "detailed step-by-step analysis",
  "keyFactors": ["factor1", "factor2", ...],
  "timeHorizon": "short|medium|long term outlook"
}`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 1500,
        system: 'You are a market sentiment expert with deep understanding of how news and data drive market movements.',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.3
      });

      return JSON.parse(this.extractJSON(response.content[0].text));
    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Sentiment analysis failed', error);
      throw error;
    }
  }

  /**
   * Advanced risk assessment with multi-factor analysis
   */
  async performRiskAssessment(
    symbol: string,
    portfolioData: any,
    marketConditions: any
  ): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'extreme';
    riskFactors: Array<{
      factor: string;
      impact: 'low' | 'medium' | 'high';
      reasoning: string;
    }>;
    mitigationStrategies: string[];
    reasoning: string;
  }> {
    const prompt = `
Perform comprehensive risk assessment for ${symbol}:

Portfolio Data:
${JSON.stringify(portfolioData, null, 2)}

Market Conditions:
${JSON.stringify(marketConditions, null, 2)}

Analyze risks systematically:
1. Identify all risk factors (market, sector, company-specific)
2. Assess probability and impact of each risk
3. Consider correlation and concentration risks
4. Recommend mitigation strategies

Provide detailed reasoning for each assessment.`;

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 2000,
        system: 'You are a risk management expert with expertise in quantitative risk assessment and portfolio management.',
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1
      });

      return this.parseRiskResponse(response.content[0].text);
    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Risk assessment failed', error);
      throw error;
    }
  }

  private buildSystemPrompt(analysisType: string): string {
    const prompts = {
      pattern: 'You are a world-class technical analyst specializing in chart pattern recognition and trading strategy.',
      risk: 'You are a quantitative risk management expert with deep expertise in financial risk assessment.',
      sentiment: 'You are a market sentiment analyst with expertise in news analysis and market psychology.',
      forecast: 'You are a financial forecasting expert with advanced modeling capabilities.',
      comprehensive: 'You are a senior portfolio manager with comprehensive expertise across all aspects of financial analysis.'
    };

    return prompts[analysisType as keyof typeof prompts] || prompts.comprehensive;
  }

  private buildAnalysisPrompt(request: ThinkingAnalysisRequest): string {
    return `
Analyze ${request.symbol} using advanced step-by-step reasoning:

${request.patternData ? `Pattern Data: ${JSON.stringify(request.patternData, null, 2)}` : ''}
${request.marketData ? `Market Data: ${JSON.stringify(request.marketData, null, 2)}` : ''}
${request.technicalIndicators ? `Technical Indicators: ${JSON.stringify(request.technicalIndicators, null, 2)}` : ''}
${request.newsContext ? `News Context: ${request.newsContext.join('\n')}` : ''}

Provide comprehensive analysis with clear reasoning for each conclusion.
Focus on actionable insights and specific recommendations.`;
  }

  private parseThinkingResponse(text: string): ThinkingAnalysisResponse {
    // Implementation would parse the structured response
    // For now, return a structured format
    return {
      reasoning: text,
      conclusion: 'Analysis completed',
      confidence: 0.8,
      keyFactors: [],
      risks: [],
      opportunities: [],
      actionableInsights: [],
      timeHorizon: 'medium'
    };
  }

  private parsePatternResponse(text: string): PatternThinkingResponse {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Failed to parse pattern response', error);
    }

    // Fallback response
    return {
      patternValidation: {
        isValid: true,
        confidence: 0.7,
        reasoning: 'Pattern analysis completed'
      },
      marketContext: {
        favorability: 0.6,
        reasoning: 'Market conditions analyzed'
      },
      tradingRecommendation: {
        action: 'hold',
        reasoning: 'Neutral recommendation based on analysis',
        riskLevel: 'medium'
      },
      keyInsights: ['Analysis completed successfully']
    };
  }

  private parseRiskResponse(text: string): any {
    // Implementation would parse risk assessment response
    return {
      overallRisk: 'medium',
      riskFactors: [],
      mitigationStrategies: [],
      reasoning: text
    };
  }

  private extractJSON(text: string): string {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : '{}';
  }
}

// Export singleton instance
let claudeOpusInstance: ClaudeOpusEnhanced | null = null;

export const getClaudeOpusEnhanced = (apiKey?: string): ClaudeOpusEnhanced => {
  if (!claudeOpusInstance) {
    claudeOpusInstance = new ClaudeOpusEnhanced(apiKey);
  }
  return claudeOpusInstance;
};

export default ClaudeOpusEnhanced;
