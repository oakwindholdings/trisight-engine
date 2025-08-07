// api/reports/generate-intelligent-real-data.js
// Enhanced real data report generation with Claude AI analysis
// Rule: MVP - Focus on intelligent analysis, not just raw data dumps
// Rule: Simple - Progressive intelligence where each section builds on previous insights

const axios = require('axios');

module.exports = async function handler(req, res) {
  const startTime = Date.now();
  const generationId = `intelligent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`[IntelligentRealData] Starting intelligent report generation...`);
    
    // Validate request
    const { ticker, title, template, author } = req.body;
    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticker'
      });
    }

    console.log(`[IntelligentRealData] Generating intelligent report for ${ticker}`);
    
    // Get API keys from environment
    const twelveDataApiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY || '764fb86962cc46ebbe5e1c89a1761623';
    const anthropicApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    
    console.log(`[IntelligentRealData] TwelveData API Key: ${twelveDataApiKey ? 'Present' : 'Missing'}`);
    console.log(`[IntelligentRealData] Anthropic API Key: ${anthropicApiKey ? 'Present' : 'Missing'}`);

    // Debug: Log first few characters of API key to verify it's being read
    if (anthropicApiKey) {
      console.log(`[IntelligentRealData] Anthropic API Key Preview: ${anthropicApiKey.substring(0, 10)}...`);
    } else {
      console.log(`[IntelligentRealData] Anthropic API Key Debug: REACT_APP_=${process.env.REACT_APP_ANTHROPIC_API_KEY ? 'exists' : 'missing'}, plain=${process.env.ANTHROPIC_API_KEY ? 'exists' : 'missing'}`);
    }
    
    if (!twelveDataApiKey) {
      return res.status(500).json({
        success: false,
        error: 'TwelveData API key not configured'
      });
    }

    // Initialize intelligent report generator
    const generator = new IntelligentRealDataGenerator(ticker.toUpperCase(), twelveDataApiKey, anthropicApiKey);
    
    // Generate intelligent report with progressive AI analysis
    const report = await generator.generateIntelligentReport({
      title: title || `${ticker.toUpperCase()} Intelligent Analysis`,
      template: template || 'intelligent-institutional',
      author: author || 'TriSight AI Research Team'
    });

    const generationTime = Date.now() - startTime;
    console.log(`[IntelligentRealData] Report generated in ${generationTime}ms`);

    return res.status(200).json({
      success: true,
      reportId: generationId,
      ticker: ticker.toUpperCase(),
      title: report.title,
      slides: report.slides,
      charts: report.charts,
      aiAnalysis: report.aiAnalysis,
      rawData: report.rawData,
      dataStatus: report.dataStatus,
      dataSources: {
        working: Object.keys(report.dataStatus).filter(key => report.dataStatus[key].success),
        failed: Object.keys(report.dataStatus).filter(key => !report.dataStatus[key].success)
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        generationTime,
        ticker: ticker.toUpperCase(),
        realDataSources: Object.keys(report.dataStatus).filter(key => report.dataStatus[key].success).length,
        failedDataSources: Object.keys(report.dataStatus).filter(key => !report.dataStatus[key].success).length,
        dataQuality: report.metadata.dataQuality,
        hasCharts: report.charts.length > 0,
        slideCount: report.slides.length,
        aiAnalysisAvailable: !!anthropicApiKey,
        intelligenceLevel: anthropicApiKey ? 'ENHANCED_AI' : 'BASIC_DATA'
      }
    });

  } catch (error) {
    const generationTime = Date.now() - startTime;
    console.error('[IntelligentRealData] Report generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Intelligent real data report generation failed',
      message: error.message,
      generationTime,
      metadata: {
        generatedAt: new Date().toISOString(),
        ticker: req.body?.ticker || 'unknown',
        realDataSources: 0,
        failedDataSources: 0,
        dataQuality: 0,
        hasCharts: false,
        slideCount: 0,
        aiAnalysisAvailable: false,
        intelligenceLevel: 'ERROR'
      }
    });
  }
};

class IntelligentRealDataGenerator {
  constructor(ticker, twelveDataApiKey, anthropicApiKey) {
    this.ticker = ticker;
    this.twelveDataApiKey = twelveDataApiKey;
    this.anthropicApiKey = anthropicApiKey;
    this.realData = {};
    this.dataStatus = {};
    this.aiAnalysis = {};
    this.progressiveContext = {}; // Builds context as we analyze each section
  }

  async generateIntelligentReport(config) {
    console.log(`[IntelligentRealData] Starting progressive intelligent analysis for ${this.ticker}`);
    
    // PHASE 1: Fetch all real data sources
    console.log(`[IntelligentRealData] Phase 1: Fetching real market data...`);
    await this.fetchAllRealData();
    
    // PHASE 2: Progressive AI analysis - each section builds on previous insights
    if (this.anthropicApiKey) {
      console.log(`[IntelligentRealData] Phase 2: Progressive AI analysis...`);
      await this.generateProgressiveAIAnalysis();
    } else {
      console.log(`[IntelligentRealData] Phase 2: Skipped - No AI key available`);
    }
    
    // PHASE 3: Generate intelligent slides with contextual insights
    console.log(`[IntelligentRealData] Phase 3: Creating intelligent slides...`);
    const slides = await this.generateIntelligentSlides(config);
    
    // PHASE 4: Generate enhanced charts with AI annotations
    console.log(`[IntelligentRealData] Phase 4: Creating enhanced charts...`);
    const charts = this.generateEnhancedCharts();
    
    return {
      ticker: this.ticker,
      title: config.title,
      template: config.template,
      author: config.author,
      slides,
      charts,
      aiAnalysis: this.aiAnalysis,
      rawData: this.realData,
      dataStatus: this.dataStatus,
      progressiveContext: this.progressiveContext,
      metadata: {
        generatedAt: new Date().toISOString(),
        ticker: this.ticker,
        realDataSources: Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success).length,
        failedDataSources: Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success).length,
        dataQuality: this.calculateDataQuality(),
        hasCharts: charts.length > 0,
        slideCount: slides.length,
        aiAnalysisComplete: Object.keys(this.aiAnalysis).length > 0,
        intelligenceLevel: this.anthropicApiKey ? 'ENHANCED_AI' : 'BASIC_DATA'
      }
    };
  }

  async fetchAllRealData() {
    console.log('[IntelligentRealData] Fetching comprehensive market data...');
    
    // Fetch core data in parallel for efficiency
    await Promise.all([
      this.fetchQuote(),
      this.fetchProfile(),
      this.fetchTimeSeries(),
      this.fetchStatistics()
    ]);
    
    // Fetch financial statements
    await Promise.all([
      this.fetchIncomeStatement(),
      this.fetchBalanceSheet(),
      this.fetchCashFlow()
    ]);
    
    // Fetch technical indicators
    await Promise.all([
      this.fetchRSI(),
      this.fetchMACD(),
      this.fetchSMA()
    ]);
    
    this.logDataStatus();
  }

  async generateProgressiveAIAnalysis() {
    console.log('[IntelligentRealData] Starting progressive AI analysis...');
    
    try {
      // Step 1: Initial market assessment
      this.progressiveContext.marketAssessment = await this.analyzeMarketPosition();
      
      // Step 2: Financial health analysis (builds on market assessment)
      this.progressiveContext.financialHealth = await this.analyzeFinancialHealth();
      
      // Step 3: Technical analysis (incorporates previous insights)
      this.progressiveContext.technicalAnalysis = await this.analyzeTechnicalPosition();
      
      // Step 4: Risk assessment (considers all previous analysis)
      this.progressiveContext.riskAssessment = await this.analyzeRiskProfile();
      
      // Step 5: Investment recommendation (synthesizes all insights)
      this.progressiveContext.investmentRecommendation = await this.generateInvestmentRecommendation();
      
      console.log('[IntelligentRealData] Progressive AI analysis completed');
      
    } catch (error) {
      console.error('[IntelligentRealData] AI analysis failed:', error.message);
      this.aiAnalysis.error = error.message;
    }
  }

  calculateDataQuality() {
    const total = Object.keys(this.dataStatus).length;
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success).length;
    return total > 0 ? Math.round((successful / total) * 100) : 0;
  }

  logDataStatus() {
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success);
    const failed = Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success);

    console.log(`[IntelligentRealData] Data Status: ${successful.length} successful, ${failed.length} failed`);
    console.log(`[IntelligentRealData] Data Quality: ${this.calculateDataQuality()}%`);
  }

  // Add all the data fetching methods from the original endpoint
  async fetchQuote() {
    try {
      const response = await axios.get('https://api.twelvedata.com/quote', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.quote = response.data;
        this.dataStatus.quote = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Quote data fetched successfully for ${this.ticker}`);
      } else {
        throw new Error(response.data?.message || 'Invalid quote response');
      }
    } catch (error) {
      this.dataStatus.quote = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Quote fetch failed: ${error.message}`);
    }
  }

  async fetchProfile() {
    try {
      const response = await axios.get('https://api.twelvedata.com/profile', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.profile = response.data;
        this.dataStatus.profile = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Profile data fetched successfully for ${this.ticker}`);
      } else {
        throw new Error(response.data?.message || 'Invalid profile response');
      }
    } catch (error) {
      this.dataStatus.profile = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Profile fetch failed: ${error.message}`);
    }
  }

  async fetchTimeSeries() {
    try {
      const response = await axios.get('https://api.twelvedata.com/time_series', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          outputsize: 30,
          apikey: this.twelveDataApiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && !response.data.code) {
        this.realData.timeSeries = response.data.values;
        this.dataStatus.timeSeries = { success: true, timestamp: new Date().toISOString(), dataPoints: response.data.values.length };
        console.log(`[IntelligentRealData] Time series data fetched: ${response.data.values.length} points`);
      } else {
        throw new Error(response.data?.message || 'Invalid time series response');
      }
    } catch (error) {
      this.dataStatus.timeSeries = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Time series fetch failed: ${error.message}`);
    }
  }

  async generateIntelligentSlides(config) {
    console.log('[IntelligentRealData] Generating intelligent slides with AI insights...');
    const slides = [];

    // Create basic slides with AI enhancement
    slides.push({
      id: 'title',
      title: config.title,
      content: `Intelligent Analysis for ${this.ticker}`,
      type: 'title'
    });

    if (this.progressiveContext.marketAssessment) {
      slides.push({
        id: 'market-assessment',
        title: 'AI Market Assessment',
        content: this.progressiveContext.marketAssessment,
        type: 'analysis'
      });
    }

    if (this.progressiveContext.financialHealth) {
      slides.push({
        id: 'financial-health',
        title: 'AI Financial Health Analysis',
        content: this.progressiveContext.financialHealth,
        type: 'analysis'
      });
    }

    if (this.progressiveContext.technicalAnalysis) {
      slides.push({
        id: 'technical-analysis',
        title: 'AI Technical Analysis',
        content: this.progressiveContext.technicalAnalysis,
        type: 'analysis'
      });
    }

    // Add data transparency slide
    slides.push({
      id: 'data-transparency',
      title: 'Data Transparency Report',
      content: this.generateDataTransparencyReport(),
      type: 'transparency'
    });

    console.log(`[IntelligentRealData] Generated ${slides.length} intelligent slides`);
    return slides;
  }

  generateEnhancedCharts() {
    console.log('[IntelligentRealData] Generating enhanced charts...');
    const charts = [];

    if (this.realData.timeSeries && this.realData.timeSeries.length > 0) {
      charts.push({
        id: 'price-chart',
        type: 'candlestick',
        title: `${this.ticker} Price Chart with AI Insights`,
        data: this.realData.timeSeries,
        aiInsights: this.progressiveContext.technicalAnalysis || 'Technical analysis pending'
      });
    }

    console.log(`[IntelligentRealData] Generated ${charts.length} enhanced charts`);
    return charts;
  }

  generateDataTransparencyReport() {
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success);
    const failed = Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success);

    let report = `Data Transparency Report\n`;
    report += `Total Data Sources: ${Object.keys(this.dataStatus).length}\n`;
    report += `Successful Sources: ${successful.length}\n`;
    report += `Failed Sources: ${failed.length}\n`;
    report += `Data Quality: ${this.calculateDataQuality()}%\n\n`;

    if (successful.length > 0) {
      report += `Successful APIs:\n`;
      successful.forEach(api => {
        const status = this.dataStatus[api];
        report += `${api}: SUCCESS (${status.timestamp})\n`;
      });
    }

    if (failed.length > 0) {
      report += `\nFailed APIs:\n`;
      failed.forEach(api => {
        const status = this.dataStatus[api];
        report += `${api}: FAILED - ${status.error}\n`;
      });
    }

    report += `\nDisclaimer: This report contains only real market data from TwelveData API. No simulated data has been used.`;
    return report;
  }

  async analyzeMarketPosition() {
    const prompt = `As a senior equity analyst, analyze the current market position for ${this.ticker}:

CURRENT MARKET DATA:
- Company: ${this.realData.profile?.name || this.ticker}
- Price: $${this.realData.quote?.close || 'N/A'}
- Change: ${this.realData.quote?.change || 'N/A'} (${this.realData.quote?.percent_change || 'N/A'}%)
- Volume: ${this.realData.quote?.volume || 'N/A'}
- Sector: ${this.realData.profile?.sector || 'N/A'}
- Market Cap: ${this.realData.profile?.market_capitalization || 'N/A'}

ANALYSIS REQUIRED:
1. **Current Valuation Context** - Is the stock fairly valued, overvalued, or undervalued based on sector comparisons?
2. **Market Momentum** - What does the price action and volume suggest about investor sentiment?
3. **Sector Positioning** - How does this company position within its sector landscape?
4. **Key Market Drivers** - What are the primary factors driving current performance?

Provide specific, data-driven insights. This analysis will inform subsequent financial and technical analysis.`;

    return await this.callClaudeAPI(prompt, 'market_position');
  }

  async analyzeFinancialHealth() {
    const marketContext = this.progressiveContext.marketAssessment || 'No prior market analysis available';

    const prompt = `Building on the market analysis, evaluate ${this.ticker}'s financial health:

PREVIOUS MARKET INSIGHTS:
${marketContext}

FINANCIAL DATA AVAILABLE:
${this.dataStatus.incomeStatement?.success ? '✓ Income Statement' : '✗ Income Statement'}
${this.dataStatus.balanceSheet?.success ? '✓ Balance Sheet' : '✗ Balance Sheet'}
${this.dataStatus.cashFlow?.success ? '✓ Cash Flow' : '✗ Cash Flow'}
${this.dataStatus.statistics?.success ? '✓ Key Statistics' : '✗ Key Statistics'}

ANALYSIS REQUIRED:
1. **Financial Strength Assessment** - Based on available data, how financially robust is this company?
2. **Growth Trajectory** - What do the financials suggest about growth prospects?
3. **Profitability Analysis** - How efficient is the company at generating profits?
4. **Balance Sheet Health** - What's the debt situation and capital structure?
5. **Cash Flow Quality** - How sustainable are the cash flows?

Connect this financial analysis to the market positioning insights. Be specific about data limitations.`;

    return await this.callClaudeAPI(prompt, 'financial_health');
  }

  async analyzeTechnicalPosition() {
    const marketContext = this.progressiveContext.marketAssessment || '';
    const financialContext = this.progressiveContext.financialHealth || '';

    const prompt = `Integrate technical analysis with fundamental insights for ${this.ticker}:

FUNDAMENTAL CONTEXT:
Market Position: ${marketContext.substring(0, 500)}...
Financial Health: ${financialContext.substring(0, 500)}...

TECHNICAL INDICATORS:
- RSI (14): ${this.realData.rsi?.values?.[0]?.rsi || 'N/A'}
- MACD: ${this.realData.macd?.values?.[0]?.macd || 'N/A'}
- Signal: ${this.realData.macd?.values?.[0]?.macd_signal || 'N/A'}
- SMA(20): ${this.realData.sma?.values?.[0]?.sma || 'N/A'}
- Current Price: $${this.realData.quote?.close || 'N/A'}

ANALYSIS REQUIRED:
1. **Technical Momentum** - What do the indicators suggest about price momentum?
2. **Support/Resistance Levels** - Key technical levels to watch
3. **Fundamental-Technical Alignment** - Do technicals support the fundamental story?
4. **Entry/Exit Considerations** - Optimal timing based on technical setup
5. **Risk Management** - Technical stop-loss and target levels

Synthesize technical and fundamental analysis for a comprehensive view.`;

    return await this.callClaudeAPI(prompt, 'technical_analysis');
  }

  async analyzeRiskProfile() {
    const marketContext = this.progressiveContext.marketAssessment || '';
    const financialContext = this.progressiveContext.financialHealth || '';
    const technicalContext = this.progressiveContext.technicalAnalysis || '';

    const prompt = `Conduct comprehensive risk assessment for ${this.ticker} integrating all previous analysis:

INTEGRATED CONTEXT:
Market Assessment: ${marketContext.substring(0, 300)}...
Financial Health: ${financialContext.substring(0, 300)}...
Technical Analysis: ${technicalContext.substring(0, 300)}...

CURRENT MARKET DATA:
- Price: $${this.realData.quote?.close || 'N/A'}
- Volume: ${this.realData.quote?.volume || 'N/A'}
- Sector: ${this.realData.profile?.sector || 'N/A'}
- RSI: ${this.realData.rsi?.values?.[0]?.rsi || 'N/A'}

COMPREHENSIVE RISK ANALYSIS REQUIRED:
1. **Market Risk Assessment** - Sector volatility, economic sensitivity, market correlation
2. **Company-Specific Risks** - Operational, competitive, management, regulatory
3. **Financial Risks** - Liquidity, leverage, cash flow sustainability
4. **Technical Risk Signals** - Momentum divergence, support/resistance breaks
5. **Risk Mitigation Strategies** - Position sizing, stop-loss levels, diversification
6. **Overall Risk Rating** - LOW/MODERATE/HIGH with specific justification

Provide actionable risk insights that synthesize fundamental and technical perspectives.`;

    return await this.callClaudeAPI(prompt, 'risk_assessment');
  }

  async generateInvestmentRecommendation() {
    const marketContext = this.progressiveContext.marketAssessment || '';
    const financialContext = this.progressiveContext.financialHealth || '';
    const technicalContext = this.progressiveContext.technicalAnalysis || '';
    const riskContext = this.progressiveContext.riskAssessment || '';

    const prompt = `Generate final investment recommendation for ${this.ticker} synthesizing all analysis:

COMPREHENSIVE ANALYSIS SUMMARY:
Market Position: ${marketContext.substring(0, 250)}...
Financial Health: ${financialContext.substring(0, 250)}...
Technical Setup: ${technicalContext.substring(0, 250)}...
Risk Profile: ${riskContext.substring(0, 250)}...

FINAL RECOMMENDATION FRAMEWORK:
1. **Investment Thesis Summary** - Key bull/bear arguments
2. **Recommendation** - BUY/HOLD/SELL with conviction level (1-10)
3. **Target Price Range** - Based on fundamental and technical analysis
4. **Time Horizon** - Short-term (1-3 months), Medium-term (3-12 months)
5. **Position Sizing** - Recommended allocation based on risk profile
6. **Entry Strategy** - Optimal entry points and timing
7. **Exit Strategy** - Profit targets and stop-loss levels
8. **Key Catalysts** - Events that could drive performance
9. **Monitoring Points** - Metrics to track for thesis validation

Provide a clear, actionable investment recommendation that institutional investors can implement.`;

    return await this.callClaudeAPI(prompt, 'investment_recommendation');
  }

  async callClaudeAPI(prompt, analysisType) {
    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: 'claude-3-5-sonnet-20241022',
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

      console.log(`[IntelligentRealData] AI ${analysisType} completed`);
      return response.data.content[0].text;

    } catch (error) {
      console.error(`[IntelligentRealData] AI ${analysisType} failed:`, error.message);
      return `AI analysis unavailable for ${analysisType}. Error: ${error.message}`;
    }
  }

  // Add remaining data fetching methods
  async fetchIncomeStatement() {
    try {
      const response = await axios.get('https://api.twelvedata.com/income_statement', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.incomeStatement = response.data;
        this.dataStatus.incomeStatement = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Income statement fetched successfully`);
      } else {
        throw new Error(response.data?.message || 'Invalid income statement response');
      }
    } catch (error) {
      this.dataStatus.incomeStatement = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Income statement fetch failed: ${error.message}`);
    }
  }

  async fetchBalanceSheet() {
    try {
      const response = await axios.get('https://api.twelvedata.com/balance_sheet', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.balanceSheet = response.data;
        this.dataStatus.balanceSheet = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Balance sheet fetched successfully`);
      } else {
        throw new Error(response.data?.message || 'Invalid balance sheet response');
      }
    } catch (error) {
      this.dataStatus.balanceSheet = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Balance sheet fetch failed: ${error.message}`);
    }
  }

  async fetchStatistics() {
    try {
      const response = await axios.get('https://api.twelvedata.com/statistics', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.statistics = response.data;
        this.dataStatus.statistics = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Statistics fetched successfully`);
      } else {
        throw new Error(response.data?.message || 'Invalid statistics response');
      }
    } catch (error) {
      this.dataStatus.statistics = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Statistics fetch failed: ${error.message}`);
    }
  }

  async fetchRSI() {
    try {
      const response = await axios.get('https://api.twelvedata.com/rsi', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 14,
          apikey: this.twelveDataApiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && !response.data.code) {
        this.realData.rsi = response.data;
        this.dataStatus.rsi = { success: true, timestamp: new Date().toISOString(), dataPoints: response.data.values.length };
        console.log(`[IntelligentRealData] RSI fetched: ${response.data.values.length} points`);
      } else {
        throw new Error(response.data?.message || 'Invalid RSI response');
      }
    } catch (error) {
      this.dataStatus.rsi = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] RSI fetch failed: ${error.message}`);
    }
  }

  async fetchMACD() {
    try {
      const response = await axios.get('https://api.twelvedata.com/macd', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          apikey: this.twelveDataApiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && !response.data.code) {
        this.realData.macd = response.data;
        this.dataStatus.macd = { success: true, timestamp: new Date().toISOString(), dataPoints: response.data.values.length };
        console.log(`[IntelligentRealData] MACD fetched: ${response.data.values.length} points`);
      } else {
        throw new Error(response.data?.message || 'Invalid MACD response');
      }
    } catch (error) {
      this.dataStatus.macd = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] MACD fetch failed: ${error.message}`);
    }
  }

  async fetchSMA() {
    try {
      const response = await axios.get('https://api.twelvedata.com/sma', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 20,
          apikey: this.twelveDataApiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && !response.data.code) {
        this.realData.sma = response.data;
        this.dataStatus.sma = { success: true, timestamp: new Date().toISOString(), dataPoints: response.data.values.length };
        console.log(`[IntelligentRealData] SMA fetched: ${response.data.values.length} points`);
      } else {
        throw new Error(response.data?.message || 'Invalid SMA response');
      }
    } catch (error) {
      this.dataStatus.sma = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] SMA fetch failed: ${error.message}`);
    }
  }

  async fetchCashFlow() {
    try {
      const response = await axios.get('https://api.twelvedata.com/cash_flow', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.cashFlow = response.data;
        this.dataStatus.cashFlow = { success: true, timestamp: new Date().toISOString() };
        console.log(`[IntelligentRealData] Cash flow fetched successfully`);
      } else {
        throw new Error(response.data?.message || 'Invalid cash flow response');
      }
    } catch (error) {
      this.dataStatus.cashFlow = { success: false, error: error.message, timestamp: new Date().toISOString() };
      console.error(`[IntelligentRealData] Cash flow fetch failed: ${error.message}`);
    }
  }
}

// Export the class for use by modular endpoints
module.exports.IntelligentRealDataGenerator = IntelligentRealDataGenerator;
