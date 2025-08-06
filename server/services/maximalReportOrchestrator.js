// server/services/maximalReportOrchestrator.js
// Maximal report orchestrator with section-by-section generation
// Each section uses separate API calls with customizable prompts

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class MaximalReportOrchestrator {
  constructor() {
    // API Keys from environment - check REACT_APP_ prefixed first since that's what we have
    this.apiKeys = {
      twelveData: process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY,
      anthropic: process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      firecrawl: process.env.REACT_APP_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY,
      perplexity: process.env.REACT_APP_PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
      openai: process.env.REACT_APP_OPENAI_API_KEY || process.env.OPENAI_API_KEY
    };
    
    console.log('[MaximalOrchestrator] API Keys Status:');
    console.log(`  - TwelveData: ${this.apiKeys.twelveData ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - Anthropic: ${this.apiKeys.anthropic ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - Firecrawl: ${this.apiKeys.firecrawl ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - Perplexity: ${this.apiKeys.perplexity ? '✓ Loaded' : '✗ Missing'}`);
    console.log(`  - OpenAI: ${this.apiKeys.openai ? '✓ Loaded' : '✗ Missing'}`);

    // Default prompts for each section - can be overridden
    this.defaultPrompts = {
      executiveSummary: `Generate an executive summary for {ticker}. Include:
        1. Company overview and current market position
        2. Key financial highlights and recent performance
        3. Major opportunities and risks
        4. Investment recommendation with specific price targets
        Format: Professional, concise, data-driven. Maximum 800 words.`,
      
      companyOverview: `Provide a comprehensive company overview for {ticker}:
        1. Business model and revenue streams
        2. Competitive advantages and market position
        3. Management team and corporate governance
        4. Recent strategic initiatives and partnerships
        5. Industry context and market share
        Include specific data points and percentages.`,
      
      financialAnalysis: `Perform deep financial analysis for {ticker}:
        1. Revenue growth trends and drivers (5-year analysis)
        2. Profitability metrics and margin analysis
        3. Balance sheet strength and liquidity ratios
        4. Cash flow analysis and capital allocation
        5. Peer comparison on key metrics
        6. Valuation multiples (P/E, EV/EBITDA, P/S, PEG)
        Provide specific numbers, YoY changes, and industry benchmarks.`,
      
      technicalAnalysis: `Execute comprehensive technical analysis for {ticker}:
        1. Price action and trend analysis (multiple timeframes)
        2. Support and resistance levels with exact prices
        3. Moving averages (20, 50, 200 SMA/EMA) and crossovers
        4. Momentum indicators (RSI, MACD, Stochastic)
        5. Volume analysis and accumulation/distribution
        6. Chart patterns and their implications
        7. Fibonacci retracements and extensions
        Provide specific entry/exit points and probability assessments.`,
      
      marketSentiment: `Analyze market sentiment and positioning for {ticker}:
        1. Institutional ownership changes and major holders
        2. Insider trading activity and patterns
        3. Options flow and unusual activity
        4. Short interest and days to cover
        5. Analyst ratings distribution and recent changes
        6. Social media sentiment and retail interest
        7. News sentiment analysis
        Include specific data points and trend changes.`,
      
      competitiveAnalysis: `Conduct competitive analysis for {ticker}:
        1. Direct competitors and market share dynamics
        2. Competitive advantages and moats
        3. Product/service comparison matrix
        4. Pricing power and market positioning
        5. Innovation pipeline comparison
        6. Financial metrics benchmarking
        7. Strategic threats and opportunities
        Provide specific comparisons with named competitors.`,
      
      riskAssessment: `Comprehensive risk assessment for {ticker}:
        1. Market risks and beta analysis
        2. Operational risks and dependencies
        3. Regulatory and compliance risks
        4. Technology and disruption risks
        5. Financial risks (debt, liquidity, forex)
        6. ESG risks and controversies
        7. Geopolitical and macro risks
        8. Risk mitigation strategies
        Quantify risks where possible with probability and impact.`,
      
      futureOutlook: `Project future outlook for {ticker}:
        1. Revenue and earnings projections (3-5 years)
        2. Growth catalysts and timeline
        3. Product pipeline and R&D initiatives
        4. Market expansion opportunities
        5. M&A possibilities and strategic options
        6. Industry trends impact assessment
        7. Bull, base, and bear case scenarios with price targets
        Provide specific timelines and probability-weighted outcomes.`,
      
      investmentRecommendation: `Final investment recommendation for {ticker}:
        1. Clear BUY/HOLD/SELL rating with conviction level
        2. 12-month price target with methodology
        3. Risk/reward analysis with specific ratios
        4. Position sizing recommendations
        5. Entry and exit strategies
        6. Key metrics to monitor
        7. Catalysts and milestones timeline
        Be specific, actionable, and data-driven.`
    };

    this.outputDir = path.join(__dirname, '../../generated-reports');
  }

  /**
   * MAIN ORCHESTRATION METHOD - Section by Section
   */
  async generateMaximalReport(ticker, options = {}) {
    const startTime = Date.now();
    const reportId = `maximal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('\n' + '═'.repeat(80));
    console.log('MAXIMAL REPORT ORCHESTRATOR - UNLIMITED DATA EXTRACTION');
    console.log(`Ticker: ${ticker.toUpperCase()}`);
    console.log(`Report ID: ${reportId}`);
    console.log('═'.repeat(80) + '\n');

    const report = {
      reportId,
      ticker: ticker.toUpperCase(),
      generatedAt: new Date().toISOString(),
      sections: {},
      rawData: {},
      metadata: {
        apiCalls: 0,
        dataPoints: 0,
        sources: []
      }
    };

    try {
      // PHASE 1: Gather ALL raw data from all sources
      console.log('[PHASE 1] Extracting ALL available data from all sources...');
      report.rawData = await this.extractAllData(ticker);
      report.metadata.apiCalls += 20; // Approximate API calls
      
      // PHASE 2: Generate each section SEQUENTIALLY with custom prompts
      console.log('[PHASE 2] Generating report sections SECTION BY SECTION...');
      
      // Use custom prompts if provided, otherwise use defaults
      const prompts = { ...this.defaultPrompts, ...(options.prompts || {}) };
      
      // Generate sections SEQUENTIALLY for better control and monitoring
      for (const [sectionName, prompt] of Object.entries(prompts)) {
        // Skip disabled sections
        if (options.sections && options.sections[sectionName] === false) {
          console.log(`  ⊗ Skipping disabled section: ${sectionName}`);
          continue;
        }
        
        console.log(`\n  ━━━ Section: ${sectionName} ━━━`);
        console.log(`  → Prompt: ${prompt.slice(0, 100)}...`);
        
        try {
          const startTime = Date.now();
          const sectionContent = await this.generateSectionWithFallback(
            ticker, 
            sectionName, 
            prompt, 
            report.rawData
          );
          
          const sectionTime = ((Date.now() - startTime) / 1000).toFixed(2);
          
          report.sections[sectionName] = {
            content: sectionContent.content,
            provider: sectionContent.provider,
            generatedAt: new Date().toISOString(),
            generationTime: `${sectionTime}s`,
            prompt: prompt
          };
          
          report.metadata.apiCalls++;
          console.log(`  ✓ Completed with ${sectionContent.provider} in ${sectionTime}s`);
          
        } catch (error) {
          console.error(`  ✗ Failed section ${sectionName}: ${error.message}`);
          report.sections[sectionName] = {
            content: `Error generating ${sectionName} section`,
            error: error.message,
            generatedAt: new Date().toISOString()
          };
        }
      }
      
      // PHASE 3: Generate additional intelligence from web
      console.log('[PHASE 3] Gathering additional web intelligence...');
      const webIntel = await this.gatherWebIntelligence(ticker, report.sections);
      report.sections.webIntelligence = webIntel;
      
      // PHASE 4: Generate charts and visualizations
      console.log('[PHASE 4] Creating data visualizations...');
      report.visualizations = await this.generateVisualizations(ticker, report.rawData);
      
      // PHASE 5: Final synthesis and formatting
      console.log('[PHASE 5] Final synthesis and PDF generation...');
      const finalReport = await this.synthesizeFinalReport(report);
      
      // Generate PDF
      const pdfPath = await this.generateEnhancedPDF(finalReport);
      
      const generationTime = Date.now() - startTime;
      
      console.log('\n' + '═'.repeat(80));
      console.log('MAXIMAL REPORT GENERATION COMPLETE');
      console.log(`Time: ${(generationTime / 1000).toFixed(2)} seconds`);
      console.log(`Sections: ${Object.keys(report.sections).length}`);
      console.log(`API Calls: ${report.metadata.apiCalls}`);
      console.log(`PDF Size: Targeting 450KB+`);
      console.log(`PDF Path: ${pdfPath}`);
      console.log('═'.repeat(80) + '\n');
      
      return {
        success: true,
        reportId,
        ticker,
        pdfPath,
        generationTime,
        metadata: report.metadata,
        report: finalReport
      };
      
    } catch (error) {
      console.error('[ORCHESTRATOR ERROR]', error);
      throw error;
    }
  }

  /**
   * Extract ALL available data from all sources
   */
  async extractAllData(ticker) {
    const data = {
      twelveData: {},
      marketData: {},
      fundamentals: {},
      technicals: {},
      news: [],
      social: {}
    };

    // Parallel extraction from all TwelveData endpoints
    const twelveDataEndpoints = [
      `/quote?symbol=${ticker}`,
      `/profile?symbol=${ticker}`,
      `/statistics?symbol=${ticker}`,
      `/time_series?symbol=${ticker}&interval=1day&outputsize=5000`, // MAX data
      `/time_series?symbol=${ticker}&interval=1week&outputsize=5000`,
      `/time_series?symbol=${ticker}&interval=1month&outputsize=5000`,
      `/earnings?symbol=${ticker}`,
      `/earnings_calendar?symbol=${ticker}`,
      `/income_statement?symbol=${ticker}&period=quarterly&outputsize=20`,
      `/balance_sheet?symbol=${ticker}&period=quarterly&outputsize=20`,
      `/cash_flow?symbol=${ticker}&period=quarterly&outputsize=20`,
      `/dividends?symbol=${ticker}`,
      `/splits?symbol=${ticker}`,
      `/insider_transactions?symbol=${ticker}`,
      `/institutional_holders?symbol=${ticker}`,
      `/fund_holders?symbol=${ticker}`,
      `/options/chain?symbol=${ticker}`,
      `/technical_indicators/rsi?symbol=${ticker}&interval=1day`,
      `/technical_indicators/macd?symbol=${ticker}&interval=1day`,
      `/technical_indicators/bbands?symbol=${ticker}&interval=1day`,
      `/technical_indicators/sma?symbol=${ticker}&interval=1day&time_period=50`,
      `/technical_indicators/ema?symbol=${ticker}&interval=1day&time_period=200`,
      `/technical_indicators/adx?symbol=${ticker}&interval=1day`,
      `/technical_indicators/cci?symbol=${ticker}&interval=1day`,
      `/technical_indicators/aroon?symbol=${ticker}&interval=1day`,
      `/technical_indicators/stoch?symbol=${ticker}&interval=1day`
    ];

    console.log(`  → Fetching ${twelveDataEndpoints.length} TwelveData endpoints...`);
    
    const twelveDataPromises = twelveDataEndpoints.map(endpoint => 
      this.fetchTwelveDataEndpoint(endpoint)
    );
    
    const twelveDataResults = await Promise.all(twelveDataPromises);
    
    // Organize TwelveData results
    data.twelveData = {
      quote: twelveDataResults[0],
      profile: twelveDataResults[1],
      statistics: twelveDataResults[2],
      dailyPrices: twelveDataResults[3],
      weeklyPrices: twelveDataResults[4],
      monthlyPrices: twelveDataResults[5],
      earnings: twelveDataResults[6],
      earningsCalendar: twelveDataResults[7],
      incomeStatement: twelveDataResults[8],
      balanceSheet: twelveDataResults[9],
      cashFlow: twelveDataResults[10],
      dividends: twelveDataResults[11],
      splits: twelveDataResults[12],
      insiderTransactions: twelveDataResults[13],
      institutionalHolders: twelveDataResults[14],
      fundHolders: twelveDataResults[15],
      optionsChain: twelveDataResults[16],
      technicals: {
        rsi: twelveDataResults[17],
        macd: twelveDataResults[18],
        bbands: twelveDataResults[19],
        sma50: twelveDataResults[20],
        ema200: twelveDataResults[21],
        adx: twelveDataResults[22],
        cci: twelveDataResults[23],
        aroon: twelveDataResults[24],
        stoch: twelveDataResults[25]
      }
    };

    console.log(`  → Data extracted: ${Object.keys(data.twelveData).length} categories`);
    
    return data;
  }

  /**
   * Generate section with fallback to multiple AI providers
   */
  async generateSectionWithFallback(ticker, sectionName, prompt, rawData) {
    const providers = [
      { name: 'perplexity', method: this.generateWithPerplexity.bind(this) },
      { name: 'claude', method: this.generateWithClaude.bind(this) },
      { name: 'openai', method: this.generateWithOpenAI.bind(this) }
    ];
    
    // Prepare enhanced prompt with data
    const enhancedPrompt = this.prepareEnhancedPrompt(ticker, sectionName, prompt, rawData);
    
    // Try each provider in order
    for (const provider of providers) {
      try {
        console.log(`    ↳ Attempting with ${provider.name}...`);
        const content = await provider.method(enhancedPrompt, sectionName);
        return {
          content,
          provider: provider.name
        };
      } catch (error) {
        console.warn(`    ⚠ ${provider.name} failed: ${error.message}`);
      }
    }
    
    // If all fail, use fallback
    console.log(`    ↳ Using fallback content`);
    return {
      content: this.generateFallbackContent(ticker, sectionName),
      provider: 'fallback'
    };
  }
  
  /**
   * Generate with Perplexity API (with web search)
   */
  async generateWithPerplexity(prompt, sectionName) {
    if (!this.apiKeys.perplexity) {
      throw new Error('Perplexity API key not configured');
    }
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: 'sonar-medium-online',
        messages: [
          {
            role: 'system',
            content: 'You are a senior financial analyst creating comprehensive investment research reports. Use current market data and cite sources.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000,
        search_recency_filter: 'month' // Get recent data
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.perplexity}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data.choices[0].message.content;
  }
  
  /**
   * Generate with Claude API
   */
  async generateWithClaude(prompt, sectionName) {
    if (!this.apiKeys.anthropic) {
      throw new Error('Claude API key not configured');
    }
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      },
      {
        headers: {
          'x-api-key': this.apiKeys.anthropic,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data.content[0].text;
  }
  
  /**
   * Generate with OpenAI API
   */
  async generateWithOpenAI(prompt, sectionName) {
    if (!this.apiKeys.openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a senior financial analyst creating comprehensive investment research reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 3000
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKeys.openai}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    return response.data.choices[0].message.content;
  }
  
  /**
   * Generate fallback content when all APIs fail
   */
  generateFallbackContent(ticker, sectionName) {
    const fallbacks = {
      executiveSummary: `Executive Summary for ${ticker}: Analysis pending due to API limitations. Please retry.`,
      companyOverview: `${ticker} operates in its respective industry. Detailed analysis unavailable.`,
      financialAnalysis: `Financial metrics for ${ticker} require API access for detailed analysis.`,
      technicalAnalysis: `Technical indicators for ${ticker} show standard patterns. Live data needed.`,
      marketSentiment: `Market sentiment for ${ticker} requires real-time data access.`,
      competitiveAnalysis: `Competitive position of ${ticker} within industry standards.`,
      riskAssessment: `Risk factors for ${ticker} align with industry norms.`,
      futureOutlook: `Future outlook for ${ticker} depends on market conditions.`,
      investmentRecommendation: `Investment recommendation for ${ticker} requires complete analysis.`
    };
    
    return fallbacks[sectionName] || `${sectionName} content unavailable due to API limitations.`;
  }

  /**
   * Prepare enhanced prompt with relevant data
   */
  prepareEnhancedPrompt(ticker, sectionName, basePrompt, rawData) {
    // Replace ticker placeholder
    let prompt = basePrompt.replace(/{ticker}/g, ticker);
    
    // Add relevant data context based on section
    const relevantData = this.selectRelevantData(sectionName, rawData);
    
    prompt += `\n\nHere is the comprehensive data for analysis:\n`;
    prompt += JSON.stringify(relevantData, null, 2).slice(0, 30000); // Stay within context limits
    
    prompt += `\n\nProvide a detailed, data-driven analysis. Be specific with numbers, percentages, and dates.`;
    prompt += `\nFormat the response in clear paragraphs with subheadings where appropriate.`;
    
    return prompt;
  }

  /**
   * Select relevant data for each section
   */
  selectRelevantData(sectionName, rawData) {
    const sectionDataMap = {
      executiveSummary: ['quote', 'profile', 'earnings', 'statistics'],
      companyOverview: ['profile', 'statistics', 'institutionalHolders'],
      financialAnalysis: ['incomeStatement', 'balanceSheet', 'cashFlow', 'earnings'],
      technicalAnalysis: ['dailyPrices', 'technicals', 'quote'],
      marketSentiment: ['insiderTransactions', 'institutionalHolders', 'fundHolders'],
      competitiveAnalysis: ['profile', 'statistics', 'earnings'],
      riskAssessment: ['statistics', 'balanceSheet', 'optionsChain'],
      futureOutlook: ['earnings', 'earningsCalendar', 'profile'],
      investmentRecommendation: ['quote', 'technicals', 'earnings', 'statistics']
    };

    const relevantKeys = sectionDataMap[sectionName] || ['quote', 'profile'];
    const selectedData = {};
    
    relevantKeys.forEach(key => {
      if (rawData.twelveData && rawData.twelveData[key]) {
        selectedData[key] = rawData.twelveData[key];
      }
    });
    
    return selectedData;
  }

  /**
   * Gather additional web intelligence using Firecrawl
   */
  async gatherWebIntelligence(ticker, existingSections) {
    const searchQueries = [
      `${ticker} latest news analysis ${new Date().getFullYear()}`,
      `${ticker} earnings call transcript`,
      `${ticker} investor presentation`,
      `${ticker} competitive analysis market share`,
      `${ticker} technology innovation patents`,
      `${ticker} ESG sustainability report`,
      `${ticker} analyst upgrades downgrades`
    ];

    console.log(`  → Gathering web intelligence (${searchQueries.length} queries)...`);
    
    const webResults = await Promise.all(
      searchQueries.map(query => this.firecrawlSearch(query))
    );
    
    // Synthesize web results with Claude
    const webSynthesis = await this.synthesizeWebIntelligence(ticker, webResults);
    
    return webSynthesis;
  }

  /**
   * Synthesize web intelligence into actionable insights
   */
  async synthesizeWebIntelligence(ticker, webResults) {
    const prompt = `Synthesize this web intelligence for ${ticker} into key insights:
    ${JSON.stringify(webResults, null, 2).slice(0, 20000)}
    
    Provide:
    1. Breaking news and recent developments
    2. Analyst consensus and recent changes
    3. Competitive intelligence
    4. Technology and innovation updates
    5. ESG and regulatory updates
    6. Key risks and opportunities identified
    
    Format as structured insights with specific dates and sources.`;

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 3000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        },
        {
          headers: {
            'x-api-key': this.apiKeys.anthropic,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('[Web Synthesis] Error:', error.message);
      return 'Web intelligence synthesis unavailable.';
    }
  }

  /**
   * Generate visualizations for the report
   */
  async generateVisualizations(ticker, rawData) {
    // This would generate actual charts using a charting library
    // For now, returning structured data for chart generation
    return {
      priceChart: {
        type: 'candlestick',
        data: rawData.twelveData.dailyPrices,
        indicators: ['sma50', 'ema200', 'volume']
      },
      performanceChart: {
        type: 'line',
        data: rawData.twelveData.monthlyPrices,
        comparison: ['SPY', 'QQQ']
      },
      fundamentalsChart: {
        type: 'bar',
        data: rawData.twelveData.earnings,
        metrics: ['revenue', 'earnings', 'margins']
      },
      technicalDashboard: {
        type: 'dashboard',
        indicators: rawData.twelveData.technicals
      },
      ownershipChart: {
        type: 'pie',
        data: rawData.twelveData.institutionalHolders
      }
    };
  }

  /**
   * Final synthesis combining all sections
   */
  async synthesizeFinalReport(report) {
    // Combine all sections into final structured report
    const finalReport = {
      ...report,
      tableOfContents: Object.keys(report.sections),
      executiveSummary: report.sections.executiveSummary,
      sections: report.sections,
      visualizations: report.visualizations,
      appendix: {
        rawData: report.rawData,
        methodology: 'AI-powered analysis using GPT-4, Claude 3.5, and comprehensive market data',
        disclaimer: 'This report is for informational purposes only and does not constitute investment advice.',
        generatedAt: new Date().toISOString()
      }
    };
    
    return finalReport;
  }

  /**
   * Generate enhanced PDF with all sections
   */
  async generateEnhancedPDF(reportData) {
    const { EnhancedPDFGenerator } = require('../../api/reports/pdf-generator-enhanced');
    const generator = new EnhancedPDFGenerator();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${reportData.ticker}_maximal_${timestamp}.pdf`;
    const filepath = path.join(this.outputDir, filename);
    
    await generator.generateEnhancedPDF(reportData, {
      ticker: reportData.ticker,
      companyName: reportData.rawData?.twelveData?.profile?.name || reportData.ticker,
      outputPath: filepath,
      includeCharts: true,
      includeAppendix: true
    });
    
    return filepath;
  }

  // Helper methods
  async fetchTwelveDataEndpoint(endpoint) {
    try {
      const response = await axios.get(
        `https://api.twelvedata.com${endpoint}&apikey=${this.apiKeys.twelveData}`,
        { timeout: 10000 }
      );
      return response.data;
    } catch (error) {
      console.error(`[TwelveData] Failed: ${endpoint.slice(0, 30)}...`);
      return {};
    }
  }

  async firecrawlSearch(query) {
    try {
      const response = await axios.post(
        'https://api.firecrawl.dev/v0/search',
        {
          query,
          limit: 10, // More results for comprehensive analysis
          scrapeOptions: {
            formats: ['markdown', 'html'],
            onlyMainContent: true
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKeys.firecrawl}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      
      return response.data.data || [];
    } catch (error) {
      console.error(`[Firecrawl] Search failed: ${query.slice(0, 30)}...`);
      return [];
    }
  }
}

module.exports = MaximalReportOrchestrator;