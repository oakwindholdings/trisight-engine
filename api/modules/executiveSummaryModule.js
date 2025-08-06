// api/modules/executiveSummaryModule.js
// Executive Summary Intelligence Module - Leverages AI for institutional-quality analysis

const axios = require('axios');

class ExecutiveSummaryModule {
  constructor(config) {
    this.config = config;
    this.ticker = config.ticker.toUpperCase();
    this.anthropicApiKey = config.anthropicApiKey;
  }

  async generateIntelligentSection(rawData, previousSections) {
    console.log('[ExecutiveSummary] Generating intelligent executive summary...');

    try {
      // Extract key data points for analysis
      const analysisContext = this.extractAnalysisContext(rawData);
      
      // Generate AI-powered executive summary
      const aiSummary = await this.generateAISummary(analysisContext);
      
      // Create structured executive summary
      const executiveSummary = this.structureExecutiveSummary(aiSummary, analysisContext);
      
      // Generate supporting charts and tables
      const visualizations = this.generateVisualizations(analysisContext);
      
      console.log('[ExecutiveSummary] Intelligent executive summary generated');
      
      return {
        title: 'Executive Summary',
        content: executiveSummary,
        charts: visualizations.charts,
        tables: visualizations.tables,
        keyMetrics: analysisContext.keyMetrics,
        recommendation: executiveSummary.recommendation,
        confidence: aiSummary.confidence || 0.85,
        generatedAt: new Date().toISOString(),
        source: 'AI-Powered Analysis'
      };

    } catch (error) {
      console.error('[ExecutiveSummary] Error generating intelligent summary:', error);
      
      // Return fallback summary with available data
      return this.generateFallbackSummary(rawData);
    }
  }

  extractAnalysisContext(rawData) {
    console.log('[ExecutiveSummary] Extracting analysis context...');

    const context = {
      ticker: this.ticker,
      timestamp: new Date().toISOString(),
      keyMetrics: {},
      financialHighlights: {},
      marketPosition: {},
      riskFactors: [],
      opportunities: []
    };

    // Extract market data
    if (rawData.marketData?.success && rawData.marketData.currentQuote) {
      const quote = rawData.marketData.currentQuote;
      context.keyMetrics = {
        currentPrice: quote.close || quote.price,
        dailyChange: quote.change,
        dailyChangePercent: quote.percent_change,
        volume: quote.volume,
        marketCap: quote.market_cap,
        peRatio: quote.pe_ratio,
        high52Week: quote.fifty_two_week?.high,
        low52Week: quote.fifty_two_week?.low
      };
    }

    // Extract financial highlights
    if (rawData.financials?.success) {
      const financials = rawData.financials;
      
      if (financials.incomeStatement?.data?.[0]) {
        const latestIncome = financials.incomeStatement.data[0];
        context.financialHighlights = {
          revenue: latestIncome.revenue,
          netIncome: latestIncome.net_income,
          grossProfit: latestIncome.gross_profit,
          operatingIncome: latestIncome.operating_income,
          eps: latestIncome.earnings_per_share
        };
      }

      if (financials.balanceSheet?.data?.[0]) {
        const latestBalance = financials.balanceSheet.data[0];
        context.financialHighlights.totalAssets = latestBalance.total_assets;
        context.financialHighlights.totalDebt = latestBalance.total_debt;
        context.financialHighlights.shareholderEquity = latestBalance.total_shareholders_equity;
      }
    }

    // Extract company profile
    if (rawData.companyProfile?.success && rawData.companyProfile.profile) {
      const profile = rawData.companyProfile.profile;
      context.companyInfo = {
        name: profile.name,
        sector: profile.sector,
        industry: profile.industry,
        description: profile.description,
        employees: profile.employees,
        founded: profile.founded
      };
    }

    // Extract analyst data
    if (rawData.analystData?.success && rawData.analystData.analystRatings) {
      const ratings = rawData.analystData.analystRatings;
      context.analystConsensus = {
        rating: ratings.consensus_rating,
        priceTarget: ratings.price_target,
        strongBuy: ratings.strong_buy,
        buy: ratings.buy,
        hold: ratings.hold,
        sell: ratings.sell,
        strongSell: ratings.strong_sell
      };
    }

    // Extract technical indicators
    if (rawData.technicalIndicators?.success) {
      const technical = rawData.technicalIndicators;
      context.technicalSignals = {
        rsi: technical.rsi?.data?.[0]?.rsi,
        sma50: technical.sma50?.data?.[0]?.sma,
        macdSignal: technical.macd?.data?.[0]?.macd_signal
      };
    }

    // Extract AI insights
    if (rawData.aiInsights?.success) {
      context.aiInsights = rawData.aiInsights.insights;
    }

    console.log('[ExecutiveSummary] Analysis context extracted:', {
      hasMarketData: !!context.keyMetrics.currentPrice,
      hasFinancials: !!context.financialHighlights.revenue,
      hasCompanyInfo: !!context.companyInfo?.name,
      hasAnalystData: !!context.analystConsensus?.rating
    });

    return context;
  }

  async generateAISummary(context) {
    console.log('[ExecutiveSummary] Generating AI-powered summary...');

    if (!this.anthropicApiKey) {
      console.log('[ExecutiveSummary] Anthropic API key not available, using structured analysis');
      return this.generateStructuredSummary(context);
    }

    try {
      const prompt = this.buildAnalysisPrompt(context);
      
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        timeout: 30000
      });

      const aiAnalysis = response.data.content[0].text;
      
      // Parse AI response into structured format
      return this.parseAIResponse(aiAnalysis, context);

    } catch (error) {
      console.error('[ExecutiveSummary] AI generation error:', error.message);
      return this.generateStructuredSummary(context);
    }
  }

  buildAnalysisPrompt(context) {
    return `As a senior equity research analyst, provide a comprehensive executive summary for ${context.ticker}. 

COMPANY DATA:
- Current Price: $${context.keyMetrics.currentPrice}
- Daily Change: ${context.keyMetrics.dailyChangePercent}%
- Market Cap: $${context.keyMetrics.marketCap}
- P/E Ratio: ${context.keyMetrics.peRatio}
- Revenue: $${context.financialHighlights.revenue}
- Net Income: $${context.financialHighlights.netIncome}
- Sector: ${context.companyInfo?.sector}
- Industry: ${context.companyInfo?.industry}

ANALYST CONSENSUS:
- Rating: ${context.analystConsensus?.rating}
- Price Target: $${context.analystConsensus?.priceTarget}

Please provide:
1. INVESTMENT THESIS (2-3 sentences)
2. KEY FINANCIAL HIGHLIGHTS (3-4 bullet points)
3. INVESTMENT RECOMMENDATION (BUY/HOLD/SELL with rationale)
4. PRICE TARGET (12-month target with justification)
5. KEY RISKS (3 main risk factors)
6. KEY CATALYSTS (3 potential positive drivers)
7. CONFIDENCE LEVEL (0.0-1.0)

Format as JSON with these exact keys: investmentThesis, financialHighlights, recommendation, priceTarget, keyRisks, keyCatalysts, confidence.`;
  }

  parseAIResponse(aiResponse, context) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiResponse);
      return {
        ...parsed,
        source: 'Anthropic Claude',
        confidence: parsed.confidence || 0.85
      };
    } catch (error) {
      // If JSON parsing fails, extract structured data from text
      return this.extractStructuredData(aiResponse, context);
    }
  }

  extractStructuredData(text, context) {
    // Extract key sections from AI text response
    const sections = {
      investmentThesis: this.extractSection(text, 'INVESTMENT THESIS', 'KEY FINANCIAL'),
      recommendation: this.extractSection(text, 'RECOMMENDATION', 'PRICE TARGET'),
      priceTarget: this.extractSection(text, 'PRICE TARGET', 'KEY RISKS'),
      keyRisks: this.extractListItems(text, 'KEY RISKS'),
      keyCatalysts: this.extractListItems(text, 'KEY CATALYSTS'),
      confidence: 0.80
    };

    return sections;
  }

  extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    const endIndex = text.indexOf(endMarker);
    
    if (startIndex === -1) return '';
    
    const section = text.substring(
      startIndex + startMarker.length,
      endIndex === -1 ? text.length : endIndex
    ).trim();
    
    return section.replace(/^\d+\.\s*/, '').trim();
  }

  extractListItems(text, marker) {
    const section = this.extractSection(text, marker, '');
    const lines = section.split('\n');
    
    return lines
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .slice(0, 3); // Limit to 3 items
  }

  generateStructuredSummary(context) {
    console.log('[ExecutiveSummary] Generating structured summary...');

    const currentPrice = parseFloat(context.keyMetrics.currentPrice) || 0;
    const dailyChange = parseFloat(context.keyMetrics.dailyChangePercent) || 0;
    const peRatio = parseFloat(context.keyMetrics.peRatio) || 0;

    // Generate recommendation based on available data
    let recommendation = 'HOLD';
    let priceTarget = currentPrice * 1.1; // Default 10% upside

    if (dailyChange > 2 && peRatio < 20) {
      recommendation = 'BUY';
      priceTarget = currentPrice * 1.2;
    } else if (dailyChange < -3 || peRatio > 30) {
      recommendation = 'SELL';
      priceTarget = currentPrice * 0.9;
    }

    return {
      investmentThesis: `${context.ticker} presents a ${recommendation.toLowerCase()} opportunity based on current market positioning and financial metrics. The company trades at ${currentPrice.toFixed(2)} with a P/E ratio of ${peRatio.toFixed(1)}.`,
      
      financialHighlights: [
        `Current trading price: $${currentPrice.toFixed(2)} (${dailyChange > 0 ? '+' : ''}${dailyChange.toFixed(2)}%)`,
        `Market capitalization: $${context.keyMetrics.marketCap || 'N/A'}`,
        `P/E Ratio: ${peRatio.toFixed(1)}`,
        `Revenue: $${context.financialHighlights.revenue || 'N/A'}`
      ],
      
      recommendation: recommendation,
      priceTarget: priceTarget.toFixed(2),
      
      keyRisks: [
        'Market volatility and economic uncertainty',
        'Sector-specific competitive pressures',
        'Regulatory and compliance risks'
      ],
      
      keyCatalysts: [
        'Strong financial performance and growth metrics',
        'Market expansion opportunities',
        'Operational efficiency improvements'
      ],
      
      confidence: 0.75,
      source: 'Structured Analysis'
    };
  }

  structureExecutiveSummary(aiSummary, context) {
    return {
      overview: {
        ticker: context.ticker,
        companyName: context.companyInfo?.name || context.ticker,
        sector: context.companyInfo?.sector || 'N/A',
        currentPrice: context.keyMetrics.currentPrice,
        recommendation: aiSummary.recommendation,
        priceTarget: aiSummary.priceTarget
      },
      
      investmentThesis: aiSummary.investmentThesis,
      
      keyFinancials: {
        marketCap: context.keyMetrics.marketCap,
        peRatio: context.keyMetrics.peRatio,
        revenue: context.financialHighlights.revenue,
        netIncome: context.financialHighlights.netIncome,
        eps: context.financialHighlights.eps
      },
      
      recommendation: {
        rating: aiSummary.recommendation,
        priceTarget: aiSummary.priceTarget,
        upside: ((parseFloat(aiSummary.priceTarget) / parseFloat(context.keyMetrics.currentPrice) - 1) * 100).toFixed(1)
      },
      
      keyRisks: aiSummary.keyRisks,
      keyCatalysts: aiSummary.keyCatalysts,
      
      analystConsensus: context.analystConsensus || {},
      
      summary: `${context.ticker} is rated ${aiSummary.recommendation} with a 12-month price target of $${aiSummary.priceTarget}, representing ${((parseFloat(aiSummary.priceTarget) / parseFloat(context.keyMetrics.currentPrice) - 1) * 100).toFixed(1)}% potential upside.`
    };
  }

  generateVisualizations(context) {
    return {
      charts: [
        {
          type: 'price_performance',
          title: `${context.ticker} Price Performance`,
          data: context.keyMetrics,
          config: { timeframe: '1Y', showVolume: true }
        },
        {
          type: 'key_metrics',
          title: 'Key Financial Metrics',
          data: context.financialHighlights,
          config: { format: 'bar', currency: true }
        }
      ],
      
      tables: [
        {
          title: 'Investment Summary',
          headers: ['Metric', 'Value', 'Analysis'],
          rows: [
            ['Current Price', `$${context.keyMetrics.currentPrice}`, 'Market pricing'],
            ['Price Target', context.analystConsensus?.priceTarget || 'N/A', 'Analyst consensus'],
            ['P/E Ratio', context.keyMetrics.peRatio || 'N/A', 'Valuation multiple'],
            ['Market Cap', context.keyMetrics.marketCap || 'N/A', 'Company size']
          ]
        }
      ]
    };
  }

  generateFallbackSummary(rawData) {
    console.log('[ExecutiveSummary] Generating fallback summary...');
    
    return {
      title: 'Executive Summary',
      content: {
        overview: {
          ticker: this.ticker,
          status: 'Analysis in progress'
        },
        summary: `Executive summary for ${this.ticker} is being generated using comprehensive market and financial data analysis.`
      },
      fallback: true,
      generatedAt: new Date().toISOString()
    };
  }
}

module.exports = { ExecutiveSummaryModule };
