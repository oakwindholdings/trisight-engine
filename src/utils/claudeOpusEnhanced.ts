// src/utils/claudeOpusEnhanced.ts
// Enhanced Claude Opus 4 Max integration with thinking capabilities
// Context: Leverages Claude Opus 4 Max for superior AI analysis and reasoning

import axios from 'axios';
import { logDebug, logError } from './logger';

interface ClaudeConfig {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  enableThinking?: boolean;
  debugMode?: boolean;
}

interface ThinkingAnalysisRequest {
  symbol: string;
  patternData: any;
  marketData: any;
  technicalIndicators: any;
  newsContext: string[];
  analysisType: 'comprehensive' | 'technical' | 'fundamental' | 'risk';
}

interface ThinkingAnalysisResponse {
  reasoning: string;
  keyFactors: string[];
  actionableInsights: string[];
  risks: string[];
  confidence: number;
  thinkingProcess: string;
}

/**
 * Enhanced Claude Opus 4 Max client with thinking capabilities
 * Provides superior AI analysis for investment research
 */
class ClaudeOpusEnhanced {
  private apiKey: string;
  private baseUrl: string;
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig = {}) {
    this.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.config = {
      model: 'claude-3-opus-20240229',
      maxTokens: 4096,
      temperature: 0.1,
      enableThinking: true,
      debugMode: false,
      ...config
    };

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required. Set ANTHROPIC_API_KEY or REACT_APP_ANTHROPIC_API_KEY');
    }

    logDebug('ClaudeOpusEnhanced', 'Initialized with Opus 4 Max thinking capabilities');
  }

  /**
   * Perform comprehensive thinking analysis
   */
  async performThinkingAnalysis(request: ThinkingAnalysisRequest): Promise<ThinkingAnalysisResponse> {
    try {
      const prompt = this.buildThinkingPrompt(request);
      
      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);

      return this.parseThinkingResponse(response.content[0].text);

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Thinking analysis failed', error);
      throw error;
    }
  }

  /**
   * Analyze pattern with advanced reasoning
   */
  async analyzePatternWithThinking(patternRequest: any): Promise<any> {
    try {
      const prompt = `
<thinking>
I need to analyze this trading pattern using advanced reasoning. Let me think through this systematically:

1. Pattern Recognition: What patterns are present in the data?
2. Market Context: How does this fit with current market conditions?
3. Technical Analysis: What do the indicators suggest?
4. Risk Assessment: What are the potential risks?
5. Confidence Level: How confident am I in this analysis?
</thinking>

Analyze the following trading pattern data with advanced reasoning:

Pattern Type: ${patternRequest.patternType}
Market Data: ${JSON.stringify(patternRequest.marketContext, null, 2)}
Historical Performance: ${JSON.stringify(patternRequest.historicalPerformance?.values?.slice(0, 10) || [], null, 2)}

Provide a comprehensive analysis including:
1. Pattern identification and characteristics
2. Market context and relevance
3. Technical indicator alignment
4. Risk factors and considerations
5. Confidence score (0-1)
6. Actionable insights

Format your response as JSON with the following structure:
{
  "patternType": "identified pattern name",
  "characteristics": ["list of pattern characteristics"],
  "marketAlignment": "how pattern aligns with market",
  "technicalConfirmation": "technical indicator confirmation",
  "riskFactors": ["list of risk factors"],
  "confidence": 0.85,
  "actionableInsights": ["list of actionable insights"],
  "reasoning": "detailed reasoning process"
}
      `;

      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);

      return this.parseJSONResponse(response.content[0].text);

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Pattern analysis failed', error);
      throw error;
    }
  }

  /**
   * Perform comprehensive risk assessment
   */
  async performRiskAssessment(symbol: string, marketData: any, riskFactors: any): Promise<any> {
    try {
      const prompt = `
<thinking>
I need to perform a comprehensive risk assessment for ${symbol}. Let me analyze:

1. Market Risk: Volatility, beta, correlation with market
2. Company-Specific Risk: Fundamentals, earnings, management
3. Sector Risk: Industry trends, competition, regulation
4. Technical Risk: Support/resistance levels, momentum
5. Macro Risk: Economic indicators, interest rates, geopolitical
</thinking>

Perform a comprehensive risk assessment for ${symbol}:

Market Data: ${JSON.stringify(marketData, null, 2)}
Risk Factors: ${JSON.stringify(riskFactors, null, 2)}

Analyze the following risk categories:
1. Market Risk (systematic risk)
2. Company-Specific Risk (unsystematic risk)
3. Liquidity Risk
4. Volatility Risk
5. Sector/Industry Risk
6. Macroeconomic Risk

Provide risk scores (1-10) for each category and overall risk assessment.

Format as JSON:
{
  "overallRiskScore": 6.5,
  "riskCategories": {
    "marketRisk": 7,
    "companyRisk": 5,
    "liquidityRisk": 3,
    "volatilityRisk": 8,
    "sectorRisk": 6,
    "macroRisk": 7
  },
  "keyRisks": ["list of key risk factors"],
  "mitigationStrategies": ["list of risk mitigation strategies"],
  "riskReward": "risk-reward assessment",
  "confidence": 0.8
}
      `;

      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);

      return this.parseJSONResponse(response.content[0].text);

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Risk assessment failed', error);
      throw error;
    }
  }

  /**
   * Generate investment thesis with reasoning
   */
  async generateInvestmentThesis(symbol: string, data: any): Promise<any> {
    try {
      const prompt = `
<thinking>
I need to generate a comprehensive investment thesis for ${symbol}. This requires:

1. Fundamental Analysis: Financial health, growth prospects, valuation
2. Technical Analysis: Price trends, momentum, support/resistance
3. Competitive Position: Market share, competitive advantages
4. Growth Catalysts: What could drive future growth?
5. Valuation: Is the stock fairly valued, undervalued, or overvalued?
6. Investment Recommendation: Buy, Hold, or Sell with rationale
</thinking>

Generate a comprehensive investment thesis for ${symbol}:

Data: ${JSON.stringify(data, null, 2)}

Provide:
1. Executive Summary (2-3 sentences)
2. Investment Highlights (3-5 key points)
3. Growth Catalysts
4. Risk Factors
5. Valuation Assessment
6. Investment Recommendation (Buy/Hold/Sell)
7. Price Target with rationale
8. Time Horizon

Format as JSON with detailed reasoning.
      `;

      const response = await this.makeRequest([
        {
          role: 'user',
          content: prompt
        }
      ]);

      return this.parseJSONResponse(response.content[0].text);

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Investment thesis generation failed', error);
      throw error;
    }
  }

  /**
   * Build thinking prompt for comprehensive analysis
   */
  private buildThinkingPrompt(request: ThinkingAnalysisRequest): string {
    return `
<thinking>
I need to perform a comprehensive ${request.analysisType} analysis for ${request.symbol}. Let me think through this systematically:

1. Data Review: What data do I have available?
2. Pattern Recognition: What patterns or trends do I see?
3. Context Analysis: How does this fit with market conditions?
4. Risk Assessment: What are the key risks?
5. Opportunity Identification: What opportunities exist?
6. Confidence Assessment: How confident am I in my analysis?

Let me work through each of these areas carefully...
</thinking>

Perform a comprehensive ${request.analysisType} analysis for ${request.symbol}:

Market Data: ${JSON.stringify(request.marketData, null, 2)}
Technical Indicators: ${JSON.stringify(request.technicalIndicators, null, 2)}
News Context: ${request.newsContext.join('; ')}

Provide:
1. Executive summary of key findings
2. Key factors driving the analysis
3. Actionable insights and recommendations
4. Risk factors and considerations
5. Confidence level (0-1)

Be thorough in your reasoning and provide specific, actionable insights.
    `;
  }

  /**
   * Parse thinking response into structured format
   */
  private parseThinkingResponse(content: string): ThinkingAnalysisResponse {
    try {
      // Extract thinking process if present
      const thinkingMatch = content.match(/<thinking>(.*?)<\/thinking>/s);
      const thinkingProcess = thinkingMatch ? thinkingMatch[1].trim() : '';

      // Parse the main content
      const lines = content.split('\n').filter(line => line.trim());
      
      return {
        reasoning: this.extractSection(content, 'Executive summary') || content,
        keyFactors: this.extractListItems(content, 'Key factors') || [],
        actionableInsights: this.extractListItems(content, 'Actionable insights') || [],
        risks: this.extractListItems(content, 'Risk factors') || [],
        confidence: this.extractConfidence(content) || 0.7,
        thinkingProcess
      };

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Failed to parse thinking response', error);
      
      // Diagnostic fallback response
      return {
        reasoning: `[DIAGNOSTIC] ClaudeOpusEnhanced parsing failed: ${(error as Error).message}. Raw content: ${content}`,
        keyFactors: ['[DIAGNOSTIC] Content parsing component failed'],
        actionableInsights: ['[DIAGNOSTIC] ClaudeOpusEnhanced.parseThinkingResponse() requires investigation'],
        risks: ['[DIAGNOSTIC] Analysis pipeline integrity compromised'],
        confidence: 0.0,
        thinkingProcess: `[DIAGNOSTIC] Parsing error: ${(error as Error).message}`
      };
    }
  }

  /**
   * Parse JSON response with error handling
   */
  private parseJSONResponse(content: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: create structured response from text
      return {
        analysis: content,
        confidence: 0.7,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'Failed to parse JSON response', error);
      return {
        analysis: content,
        confidence: 0.5,
        error: 'JSON parsing failed'
      };
    }
  }

  /**
   * Extract section content from response
   */
  private extractSection(content: string, sectionName: string): string | null {
    const regex = new RegExp(`${sectionName}[:\\s]*([^\\n]+(?:\\n(?!\\d+\\.|[A-Z][a-z]+:)[^\\n]+)*)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract list items from response
   */
  private extractListItems(content: string, sectionName: string): string[] {
    const section = this.extractSection(content, sectionName);
    if (!section) return [];

    return section
      .split('\n')
      .map(line => line.replace(/^[-•*]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  /**
   * Extract confidence score from response
   */
  private extractConfidence(content: string): number | null {
    const confidenceMatch = content.match(/confidence[:\s]*(\d*\.?\d+)/i);
    if (confidenceMatch) {
      const confidence = parseFloat(confidenceMatch[1]);
      return confidence > 1 ? confidence / 100 : confidence;
    }
    return null;
  }

  /**
   * Make API request to Claude
   */
  private async makeRequest(messages: any[]): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.config.model,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          messages
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          timeout: 60000 // 60 second timeout
        }
      );

      if (this.config.debugMode) {
        logDebug('ClaudeOpusEnhanced', 'Request successful');
      }

      return response.data;

    } catch (error) {
      logError('ClaudeOpusEnhanced', 'API request failed', error);
      throw error;
    }
  }
}

// Singleton instance
let instance: ClaudeOpusEnhanced | null = null;

/**
 * Get enhanced Claude Opus instance
 */
export function getClaudeOpusEnhanced(config?: ClaudeConfig): ClaudeOpusEnhanced {
  if (!instance) {
    instance = new ClaudeOpusEnhanced(config);
  }
  return instance;
}

export default ClaudeOpusEnhanced;
