// api/reports/generate-real-data.js
// Real data only report generation - NO FAKE DATA ALLOWED
// Rule: Zero Tolerance for Fake Data - Only use confirmed working APIs

const axios = require('axios');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
};

module.exports = async function handler(req, res) {
  try {
    // Set CORS headers
    Object.keys(corsHeaders).forEach(key => {
      res.setHeader(key, corsHeaders[key]);
    });

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ 
        success: false, 
        error: 'Method not allowed' 
      });
    }

    const startTime = Date.now();
    
    const { ticker, title, template, author } = req.body;
    
    if (!ticker) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: ticker'
      });
    }

    console.log(`[RealData] Generating report for ${ticker} - NO FAKE DATA`);
    
    // Get API keys from environment - check both REACT_APP_ and plain versions
    const twelveDataApiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY || '764fb86962cc46ebbe5e1c89a1761623';
    const anthropicApiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;

    console.log(`[RealData] TwelveData API Key status: ${twelveDataApiKey ? 'Present' : 'Missing'}`);
    console.log(`[RealData] Anthropic API Key status: ${anthropicApiKey ? 'Present' : 'Missing'}`);

    if (!twelveDataApiKey) {
      return res.status(500).json({
        success: false,
        error: 'TwelveData API key not configured'
      });
    }

    // Initialize real data generator with AI capabilities
    const generator = new RealDataReportGenerator(ticker.toUpperCase(), twelveDataApiKey, anthropicApiKey);
    
    // Generate report with only real data
    const report = await generator.generateRealDataReport({
      title: title || `${ticker.toUpperCase()} Real Data Analysis`,
      template: template || 'institutional',
      author: author || 'TriSight Real Data Research'
    });

    const generationTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      reportId: `real-${ticker}-${Date.now()}`,
      generationTime,
      ...report,
      metadata: {
        ...report.metadata,
        generationTime,
        dataSource: 'TwelveData API',
        realDataOnly: true,
        noFakeData: true
      }
    });

  } catch (error) {
    const generationTime = Date.now() - (req.startTime || Date.now());
    console.error('[RealData] Report generation failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Real data report generation failed',
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
        dataSource: 'TwelveData API',
        realDataOnly: true,
        noFakeData: true
      }
    });
  }
};

class RealDataReportGenerator {
  constructor(ticker, twelveDataApiKey, anthropicApiKey) {
    this.ticker = ticker;
    this.twelveDataApiKey = twelveDataApiKey;
    this.anthropicApiKey = anthropicApiKey;
    this.realData = {};
    this.dataStatus = {};
    this.aiAnalysis = {};
  }

  async generateRealDataReport(config) {
    console.log(`[RealData] Fetching real data for ${this.ticker}`);

    // PHASE 1: Fetch all real data sources
    await this.fetchAllRealData();

    // PHASE 2: Generate AI analysis using Claude (if API key available)
    if (this.anthropicApiKey) {
      console.log(`[RealData] Generating AI analysis with Claude...`);
      await this.generateAIAnalysis();
    } else {
      console.log(`[RealData] No Anthropic API key - skipping AI analysis`);
    }

    // PHASE 3: Generate intelligent slides with AI insights
    const slides = this.generateIntelligentSlides(config);

    // PHASE 4: Generate charts with real data
    const charts = this.generateRealDataCharts();
    
    return {
      ticker: this.ticker,
      title: config.title,
      template: config.template,
      author: config.author,
      slides,
      charts,
      rawData: this.realData,
      dataStatus: this.dataStatus,
      metadata: {
        generatedAt: new Date().toISOString(),
        ticker: this.ticker,
        realDataSources: Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success).length,
        failedDataSources: Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success).length,
        dataQuality: this.calculateDataQuality(),
        hasCharts: charts.length > 0,
        slideCount: slides.length
      }
    };
  }

  async fetchAllRealData() {
    console.log('[RealData] Starting SERIAL data fetching - each section independent...');

    // SERIAL FETCHING - Each section independent with explicit status
    console.log('[RealData] Step 1/10: Fetching Quote Data...');
    await this.fetchQuote();

    console.log('[RealData] Step 2/10: Fetching Company Profile...');
    await this.fetchProfile();

    console.log('[RealData] Step 3/10: Fetching Time Series...');
    await this.fetchTimeSeries();

    console.log('[RealData] Step 4/10: Fetching Income Statement...');
    await this.fetchIncomeStatement();

    console.log('[RealData] Step 5/10: Fetching Balance Sheet...');
    await this.fetchBalanceSheet();

    console.log('[RealData] Step 6/10: Fetching Cash Flow...');
    await this.fetchCashFlow();

    console.log('[RealData] Step 7/10: Fetching Statistics...');
    await this.fetchStatistics();

    console.log('[RealData] Step 8/10: Fetching RSI...');
    await this.fetchRSI();

    console.log('[RealData] Step 9/10: Fetching MACD...');
    await this.fetchMACD();

    console.log('[RealData] Step 10/10: Fetching SMA...');
    await this.fetchSMA();

    console.log('[RealData] SERIAL data fetching completed');
    this.logDataStatus();
  }

  async fetchQuote() {
    try {
      const response = await axios.get('https://api.twelvedata.com/quote', {
        params: { symbol: this.ticker, apikey: this.twelveDataApiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.quote = response.data;
        this.dataStatus.quote = { success: true, timestamp: new Date().toISOString() };
      } else {
        this.dataStatus.quote = { success: false, error: response.data?.message || 'API error' };
      }
    } catch (error) {
      this.dataStatus.quote = { success: false, error: error.message };
    }
  }

  async fetchProfile() {
    try {
      const response = await axios.get('https://api.twelvedata.com/profile', {
        params: { symbol: this.ticker, apikey: this.apiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.profile = response.data;
        this.dataStatus.profile = { success: true, timestamp: new Date().toISOString() };
      } else {
        this.dataStatus.profile = { success: false, error: response.data?.message || 'API error' };
      }
    } catch (error) {
      this.dataStatus.profile = { success: false, error: error.message };
    }
  }

  async fetchTimeSeries() {
    try {
      console.log('[RealData] Calling TwelveData time_series API...');
      const response = await axios.get('https://api.twelvedata.com/time_series', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          outputsize: 30,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.realData.timeSeries = response.data;
        this.dataStatus.timeSeries = {
          success: true,
          dataPoints: response.data.values.length,
          timestamp: new Date().toISOString()
        };
        console.log(`[RealData] Time Series SUCCESS: ${response.data.values.length} data points`);
      } else {
        this.dataStatus.timeSeries = { success: false, error: response.data?.message || 'No values array' };
        console.log(`[RealData] Time Series FAILED: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.dataStatus.timeSeries = { success: false, error: error.message };
      console.log(`[RealData] Time Series ERROR: ${error.message}`);
    }
  }

  async fetchIncomeStatement() {
    try {
      console.log('[RealData] Calling TwelveData income_statement API...');
      const response = await axios.get('https://api.twelvedata.com/income_statement', {
        params: { symbol: this.ticker, apikey: this.apiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.incomeStatement = response.data;
        this.dataStatus.incomeStatement = { success: true, timestamp: new Date().toISOString() };
        console.log('[RealData] Income Statement SUCCESS');
      } else {
        this.dataStatus.incomeStatement = { success: false, error: response.data?.message || 'API error' };
        console.log(`[RealData] Income Statement FAILED: ${response.data?.message || 'API error'}`);
      }
    } catch (error) {
      this.dataStatus.incomeStatement = { success: false, error: error.message };
      console.log(`[RealData] Income Statement ERROR: ${error.message}`);
    }
  }

  async fetchBalanceSheet() {
    try {
      console.log('[RealData] Calling TwelveData balance_sheet API...');
      const response = await axios.get('https://api.twelvedata.com/balance_sheet', {
        params: { symbol: this.ticker, apikey: this.apiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.balanceSheet = response.data;
        this.dataStatus.balanceSheet = { success: true, timestamp: new Date().toISOString() };
        console.log('[RealData] Balance Sheet SUCCESS');
      } else {
        this.dataStatus.balanceSheet = { success: false, error: response.data?.message || 'API error' };
        console.log(`[RealData] Balance Sheet FAILED: ${response.data?.message || 'API error'}`);
      }
    } catch (error) {
      this.dataStatus.balanceSheet = { success: false, error: error.message };
      console.log(`[RealData] Balance Sheet ERROR: ${error.message}`);
    }
  }

  async fetchCashFlow() {
    try {
      console.log('[RealData] Calling TwelveData cash_flow API...');
      const response = await axios.get('https://api.twelvedata.com/cash_flow', {
        params: { symbol: this.ticker, apikey: this.apiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.cashFlow = response.data;
        this.dataStatus.cashFlow = { success: true, timestamp: new Date().toISOString() };
        console.log('[RealData] Cash Flow SUCCESS');
      } else {
        this.dataStatus.cashFlow = { success: false, error: response.data?.message || 'API error' };
        console.log(`[RealData] Cash Flow FAILED: ${response.data?.message || 'API error'}`);
      }
    } catch (error) {
      this.dataStatus.cashFlow = { success: false, error: error.message };
      console.log(`[RealData] Cash Flow ERROR: ${error.message}`);
    }
  }

  async fetchStatistics() {
    try {
      console.log('[RealData] Calling TwelveData statistics API...');
      const response = await axios.get('https://api.twelvedata.com/statistics', {
        params: { symbol: this.ticker, apikey: this.apiKey },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        this.realData.statistics = response.data;
        this.dataStatus.statistics = { success: true, timestamp: new Date().toISOString() };
        console.log('[RealData] Statistics SUCCESS');
      } else {
        this.dataStatus.statistics = { success: false, error: response.data?.message || 'API error' };
        console.log(`[RealData] Statistics FAILED: ${response.data?.message || 'API error'}`);
      }
    } catch (error) {
      this.dataStatus.statistics = { success: false, error: error.message };
      console.log(`[RealData] Statistics ERROR: ${error.message}`);
    }
  }

  async fetchRSI() {
    try {
      console.log('[RealData] Calling TwelveData RSI API...');
      const response = await axios.get('https://api.twelvedata.com/rsi', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 14,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.realData.rsi = response.data;
        this.dataStatus.rsi = {
          success: true,
          dataPoints: response.data.values.length,
          timestamp: new Date().toISOString()
        };
        console.log(`[RealData] RSI SUCCESS: ${response.data.values.length} data points`);
      } else {
        this.dataStatus.rsi = { success: false, error: response.data?.message || 'No values array' };
        console.log(`[RealData] RSI FAILED: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.dataStatus.rsi = { success: false, error: error.message };
      console.log(`[RealData] RSI ERROR: ${error.message}`);
    }
  }

  async fetchMACD() {
    try {
      console.log('[RealData] Calling TwelveData MACD API...');
      const response = await axios.get('https://api.twelvedata.com/macd', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.realData.macd = response.data;
        this.dataStatus.macd = {
          success: true,
          dataPoints: response.data.values.length,
          timestamp: new Date().toISOString()
        };
        console.log(`[RealData] MACD SUCCESS: ${response.data.values.length} data points`);
      } else {
        this.dataStatus.macd = { success: false, error: response.data?.message || 'No values array' };
        console.log(`[RealData] MACD FAILED: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.dataStatus.macd = { success: false, error: error.message };
      console.log(`[RealData] MACD ERROR: ${error.message}`);
    }
  }

  async fetchSMA() {
    try {
      console.log('[RealData] Calling TwelveData SMA API...');
      const response = await axios.get('https://api.twelvedata.com/sma', {
        params: {
          symbol: this.ticker,
          interval: '1day',
          time_period: 20,
          apikey: this.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values && Array.isArray(response.data.values)) {
        this.realData.sma = response.data;
        this.dataStatus.sma = {
          success: true,
          dataPoints: response.data.values.length,
          timestamp: new Date().toISOString()
        };
        console.log(`[RealData] SMA SUCCESS: ${response.data.values.length} data points`);
      } else {
        this.dataStatus.sma = { success: false, error: response.data?.message || 'No values array' };
        console.log(`[RealData] SMA FAILED: ${response.data?.message || 'No values array'}`);
      }
    } catch (error) {
      this.dataStatus.sma = { success: false, error: error.message };
      console.log(`[RealData] SMA ERROR: ${error.message}`);
    }
  }

  logDataStatus() {
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success);
    const failed = Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success);
    
    console.log(`[RealData] Data Status: ${successful.length} successful, ${failed.length} failed`);
    
    if (successful.length > 0) {
      console.log(`[RealData] Working: ${successful.join(', ')}`);
    }
    
    if (failed.length > 0) {
      console.log(`[RealData] Failed: ${failed.join(', ')}`);
    }
  }

  calculateDataQuality() {
    const total = Object.keys(this.dataStatus).length;
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success).length;
    return Math.round((successful / total) * 100);
  }

  async generateAIAnalysis() {
    try {
      console.log('[RealData] Starting AI analysis with Claude...');

      // Prepare comprehensive context for Claude
      const context = this.prepareAIContext();

      // Generate executive summary
      this.aiAnalysis.executiveSummary = await this.generateExecutiveSummary(context);

      // Generate investment thesis
      this.aiAnalysis.investmentThesis = await this.generateInvestmentThesis(context);

      // Generate risk assessment
      this.aiAnalysis.riskAssessment = await this.generateRiskAssessment(context);

      // Generate technical analysis insights
      this.aiAnalysis.technicalInsights = await this.generateTechnicalInsights(context);

      // Generate financial analysis
      this.aiAnalysis.financialAnalysis = await this.generateFinancialAnalysis(context);

      console.log('[RealData] AI analysis completed successfully');

    } catch (error) {
      console.error('[RealData] AI analysis failed:', error.message);
      this.aiAnalysis = {
        error: 'AI analysis unavailable',
        message: error.message,
        fallback: true
      };
    }
  }

  prepareAIContext() {
    return {
      ticker: this.ticker,
      quote: this.realData.quote,
      profile: this.realData.profile,
      timeSeries: this.realData.timeSeries,
      incomeStatement: this.realData.incomeStatement,
      balanceSheet: this.realData.balanceSheet,
      cashFlow: this.realData.cashFlow,
      statistics: this.realData.statistics,
      technicalIndicators: {
        rsi: this.realData.rsi,
        macd: this.realData.macd,
        sma: this.realData.sma
      },
      dataQuality: this.calculateDataQuality(),
      dataStatus: this.dataStatus
    };
  }

  async generateExecutiveSummary(context) {
    const prompt = `As a senior financial analyst, provide a comprehensive executive summary for ${context.ticker} based on the following real market data:

Company: ${context.profile?.name || context.ticker}
Current Price: $${context.quote?.close || 'N/A'}
Change: ${context.quote?.change || 'N/A'} (${context.quote?.percent_change || 'N/A'}%)
Sector: ${context.profile?.sector || 'N/A'}
Market Cap: ${context.profile?.market_capitalization || 'N/A'}

Technical Indicators:
- RSI: ${context.technicalIndicators?.rsi?.values?.[0]?.rsi || 'N/A'}
- MACD: ${context.technicalIndicators?.macd?.values?.[0]?.macd || 'N/A'}
- SMA(20): ${context.technicalIndicators?.sma?.values?.[0]?.sma || 'N/A'}

Data Quality: ${context.dataQuality}% (${Object.keys(context.dataStatus).filter(k => context.dataStatus[k].success).length}/${Object.keys(context.dataStatus).length} sources successful)

Provide a 2-3 paragraph executive summary that:
1. Summarizes the current financial position and market performance
2. Highlights key strengths and concerns based on the data
3. Provides a clear investment perspective

Be specific, data-driven, and professional. Focus only on what the data shows.`;

    return await this.callClaudeAPI(prompt, 'executive_summary');
  }

  async generateInvestmentThesis(context) {
    const prompt = `Based on the comprehensive financial data for ${context.ticker}, develop a detailed investment thesis:

Financial Metrics Available:
${context.incomeStatement ? '✓ Income Statement' : '✗ Income Statement'}
${context.balanceSheet ? '✓ Balance Sheet' : '✗ Balance Sheet'}
${context.cashFlow ? '✓ Cash Flow' : '✗ Cash Flow'}
${context.statistics ? '✓ Statistics' : '✗ Statistics'}

Technical Analysis:
- Current Price: $${context.quote?.close || 'N/A'}
- RSI: ${context.technicalIndicators?.rsi?.values?.[0]?.rsi || 'N/A'}
- MACD Signal: ${context.technicalIndicators?.macd?.values?.[0]?.macd_signal || 'N/A'}

Provide a structured investment thesis with:
1. **Bull Case** (3-4 key positive factors)
2. **Bear Case** (3-4 key risk factors)
3. **Catalysts** (upcoming events or trends that could drive performance)
4. **Valuation Assessment** (based on available metrics)

Format as clear bullet points under each section. Be analytical and balanced.`;

    return await this.callClaudeAPI(prompt, 'investment_thesis');
  }

  async generateRiskAssessment(context) {
    const prompt = `Conduct a comprehensive risk assessment for ${context.ticker} investment:

Company Profile:
- Sector: ${context.profile?.sector || 'Unknown'}
- Industry: ${context.profile?.industry || 'Unknown'}
- Market Cap: ${context.profile?.market_capitalization || 'Unknown'}

Current Market Position:
- Price: $${context.quote?.close || 'N/A'}
- Daily Change: ${context.quote?.percent_change || 'N/A'}%
- Volume: ${context.quote?.volume || 'N/A'}

Identify and analyze:
1. **Market Risks** (sector-specific, economic factors)
2. **Company-Specific Risks** (operational, financial, competitive)
3. **Technical Risks** (chart patterns, momentum indicators)
4. **Liquidity Risks** (trading volume, market depth)
5. **Risk Mitigation Strategies**

Provide specific, actionable risk insights based on the available data. Rate overall risk level as LOW/MODERATE/HIGH with justification.`;

    return await this.callClaudeAPI(prompt, 'risk_assessment');
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

      console.log(`[RealData] AI ${analysisType} generated successfully`);
      return response.data.content[0].text;

    } catch (error) {
      console.error(`[RealData] AI ${analysisType} failed:`, error.message);
      return `AI analysis unavailable for ${analysisType}. Error: ${error.message}`;
    }
  }

  generateIntelligentSlides(config) {
    console.log('[RealData] Generating slides with AI insights and real data');

    const slides = [];

    // SECTION 1: Title slide (always generated)
    console.log('[RealData] Section 1: Creating Title Slide...');
    slides.push(this.createTitleSlide(config));

    // SECTION 2: Executive Summary with AI insights
    console.log('[RealData] Section 2: Creating AI Executive Summary...');
    slides.push(this.createAIExecutiveSummarySlide());

    // SECTION 3: Company profile with AI analysis
    console.log('[RealData] Section 3: Creating Enhanced Company Profile...');
    slides.push(this.createEnhancedCompanyProfileSlide());

    // SECTION 4: Investment Thesis with AI insights
    console.log('[RealData] Section 4: Creating AI Investment Thesis...');
    slides.push(this.createAIInvestmentThesisSlide());

    // SECTION 5: Financial Analysis with AI insights
    console.log('[RealData] Section 5: Creating AI Financial Analysis...');
    slides.push(this.createAIFinancialAnalysisSlide());

    // SECTION 6: Technical Analysis with AI interpretation
    console.log('[RealData] Section 6: Creating AI Technical Analysis...');
    slides.push(this.createAITechnicalAnalysisSlide());

    // SECTION 7: Data status slide (transparency about what data is available)
    console.log('[RealData] Section 7: Creating Data Status Slide...');
    slides.push(this.createDataStatusSlide());

    console.log(`[RealData] Generated ${slides.length} slides - ALL SECTIONS COMPLETE`);
    return slides;
  }

  createTitleSlide(config) {
    const quote = this.realData.quote;
    const profile = this.realData.profile;
    
    return {
      slideNumber: 1,
      type: 'title',
      title: profile?.name || `${this.ticker} Analysis`,
      content: {
        ticker: this.ticker,
        companyName: profile?.name || `${this.ticker} Corporation`,
        currentPrice: quote?.close ? `$${quote.close}` : 'Price data unavailable',
        change: quote?.change && quote?.percent_change ? 
          `${quote.change} (${quote.percent_change}%)` : 'Change data unavailable',
        sector: profile?.sector || 'Sector data unavailable',
        industry: profile?.industry || 'Industry data unavailable',
        date: new Date().toLocaleDateString(),
        author: config.author,
        reportType: 'Real Data Analysis',
        dataDisclaimer: 'This report contains only real market data. No simulated data is used.'
      }
    };
  }

  createCompanyProfileSlide() {
    const profile = this.realData.profile;
    
    return {
      slideNumber: 2,
      type: 'company_profile',
      title: 'Company Profile',
      content: {
        companyName: profile.name,
        description: profile.description || 'Company description not available from API',
        sector: profile.sector || 'Sector data not available',
        industry: profile.industry || 'Industry data not available',
        exchange: profile.exchange || 'Exchange data not available',
        website: profile.website || 'Website data not available',
        employees: profile.employees || 'Employee count not available',
        marketCap: profile.market_capitalization || 'Market cap data not available',
        dataSource: 'TwelveData Profile API',
        lastUpdated: this.dataStatus.profile.timestamp
      }
    };
  }

  createMarketDataSlide() {
    const quote = this.realData.quote;
    
    return {
      slideNumber: 3,
      type: 'market_data',
      title: 'Current Market Data',
      content: {
        currentPrice: `$${quote.close}`,
        change: `$${quote.change}`,
        changePercent: `${quote.percent_change}%`,
        volume: quote.volume?.toLocaleString() || 'Volume data not available',
        dayHigh: quote.high ? `$${quote.high}` : 'Day high not available',
        dayLow: quote.low ? `$${quote.low}` : 'Day low not available',
        open: quote.open ? `$${quote.open}` : 'Opening price not available',
        previousClose: quote.previous_close ? `$${quote.previous_close}` : 'Previous close not available',
        dataSource: 'TwelveData Quote API',
        lastUpdated: this.dataStatus.quote.timestamp,
        realTimeData: true
      }
    };
  }

  createPricePerformanceSlide() {
    const timeSeries = this.realData.timeSeries;
    const values = timeSeries.values || [];
    
    const latest = values[0];
    const oneWeekAgo = values[7];
    const oneMonthAgo = values[30] || values[values.length - 1];
    
    const oneWeekReturn = oneWeekAgo ? 
      (((latest.close - oneWeekAgo.close) / oneWeekAgo.close) * 100).toFixed(2) : 
      'Insufficient data for 1-week return';
    
    const oneMonthReturn = oneMonthAgo ? 
      (((latest.close - oneMonthAgo.close) / oneMonthAgo.close) * 100).toFixed(2) : 
      'Insufficient data for 1-month return';
    
    return {
      slideNumber: 4,
      type: 'price_performance',
      title: 'Price Performance',
      content: {
        currentPrice: `$${latest.close}`,
        oneWeekReturn: typeof oneWeekReturn === 'string' ? oneWeekReturn : `${oneWeekReturn}%`,
        oneMonthReturn: typeof oneMonthReturn === 'string' ? oneMonthReturn : `${oneMonthReturn}%`,
        dataPoints: values.length,
        dateRange: `${values[values.length - 1]?.datetime} to ${latest.datetime}`,
        highestPrice: `$${Math.max(...values.map(v => parseFloat(v.high))).toFixed(2)}`,
        lowestPrice: `$${Math.min(...values.map(v => parseFloat(v.low))).toFixed(2)}`,
        averageVolume: Math.round(values.reduce((sum, v) => sum + parseInt(v.volume), 0) / values.length).toLocaleString(),
        dataSource: 'TwelveData Time Series API',
        lastUpdated: this.dataStatus.timeSeries.timestamp,
        realHistoricalData: true
      }
    };
  }

  createDataStatusSlide() {
    const successful = Object.keys(this.dataStatus).filter(key => this.dataStatus[key].success);
    const failed = Object.keys(this.dataStatus).filter(key => !this.dataStatus[key].success);
    
    return {
      slideNumber: 7,
      type: 'data_status',
      title: 'Data Transparency Report',
      content: {
        totalDataSources: Object.keys(this.dataStatus).length,
        successfulSources: successful.length,
        failedSources: failed.length,
        dataQuality: this.calculateDataQuality(),
        successfulAPIs: successful.map(key => ({
          name: key,
          status: 'SUCCESS',
          timestamp: this.dataStatus[key].timestamp,
          dataPoints: this.dataStatus[key].dataPoints || 'N/A'
        })),
        failedAPIs: failed.map(key => ({
          name: key,
          status: 'FAILED',
          error: this.dataStatus[key].error
        })),
        disclaimer: 'This report contains only real market data from TwelveData API. No simulated data has been used. Failed data sources are explicitly reported.',
        apiProvider: 'TwelveData',
        realDataOnly: true
      }
    };
  }

  createFinancialDataSlide() {
    console.log('[RealData] Creating Financial Data Slide - checking all sources...');

    const income = this.realData.incomeStatement;
    const balance = this.realData.balanceSheet;
    const cashFlow = this.realData.cashFlow;
    const statistics = this.realData.statistics;

    const content = {
      slideNumber: 5,
      type: 'financial_data',
      title: 'Financial Data Analysis',
      dataAvailability: {
        incomeStatement: this.dataStatus.incomeStatement?.success || false,
        balanceSheet: this.dataStatus.balanceSheet?.success || false,
        cashFlow: this.dataStatus.cashFlow?.success || false,
        statistics: this.dataStatus.statistics?.success || false
      }
    };

    // Income Statement Section
    if (this.dataStatus.incomeStatement?.success && income) {
      console.log('[RealData] Income Statement data available');
      content.incomeStatement = {
        available: true,
        status: 'Data successfully retrieved from TwelveData API',
        data: income.income_statement || income,
        lastUpdated: this.dataStatus.incomeStatement.timestamp,
        summary: 'Real financial statement data from regulatory filings'
      };
    } else {
      console.log(`[RealData] Income Statement failed: ${this.dataStatus.incomeStatement?.error || 'Not fetched'}`);
      content.incomeStatement = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.incomeStatement?.error || 'Income statement data not available',
        explanation: 'TwelveData API did not return income statement data for this ticker'
      };
    }

    // Balance Sheet Section
    if (this.dataStatus.balanceSheet?.success && balance) {
      console.log('[RealData] Balance Sheet data available');
      content.balanceSheet = {
        available: true,
        status: 'Data successfully retrieved from TwelveData API',
        data: balance.balance_sheet || balance,
        lastUpdated: this.dataStatus.balanceSheet.timestamp,
        summary: 'Real balance sheet data from regulatory filings'
      };
    } else {
      console.log(`[RealData] Balance Sheet failed: ${this.dataStatus.balanceSheet?.error || 'Not fetched'}`);
      content.balanceSheet = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.balanceSheet?.error || 'Balance sheet data not available',
        explanation: 'TwelveData API did not return balance sheet data for this ticker'
      };
    }

    // Cash Flow Section
    if (this.dataStatus.cashFlow?.success && cashFlow) {
      console.log('[RealData] Cash Flow data available');
      content.cashFlow = {
        available: true,
        status: 'Data successfully retrieved from TwelveData API',
        data: cashFlow.cash_flow || cashFlow,
        lastUpdated: this.dataStatus.cashFlow.timestamp,
        summary: 'Real cash flow data from regulatory filings'
      };
    } else {
      console.log(`[RealData] Cash Flow failed: ${this.dataStatus.cashFlow?.error || 'Not fetched'}`);
      content.cashFlow = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.cashFlow?.error || 'Cash flow data not available',
        explanation: 'TwelveData API did not return cash flow data for this ticker'
      };
    }

    // Statistics Section
    if (this.dataStatus.statistics?.success && statistics) {
      console.log('[RealData] Statistics data available');
      content.statistics = {
        available: true,
        status: 'Data successfully retrieved from TwelveData API',
        data: statistics.statistics || statistics,
        lastUpdated: this.dataStatus.statistics.timestamp,
        summary: 'Real statistical metrics and ratios'
      };
    } else {
      console.log(`[RealData] Statistics failed: ${this.dataStatus.statistics?.error || 'Not fetched'}`);
      content.statistics = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.statistics?.error || 'Statistics data not available',
        explanation: 'TwelveData API did not return statistics data for this ticker'
      };
    }

    return {
      slideNumber: 5,
      type: 'financial_data',
      title: 'Financial Data Analysis',
      content
    };
  }

  createTechnicalAnalysisSlide() {
    console.log('[RealData] Creating Technical Analysis Slide - checking all indicators...');

    const rsi = this.realData.rsi;
    const macd = this.realData.macd;
    const sma = this.realData.sma;

    const content = {
      slideNumber: 6,
      type: 'technical_analysis',
      title: 'Technical Analysis',
      dataAvailability: {
        rsi: this.dataStatus.rsi?.success || false,
        macd: this.dataStatus.macd?.success || false,
        sma: this.dataStatus.sma?.success || false
      }
    };

    // RSI Section
    if (this.dataStatus.rsi?.success && rsi && rsi.values?.length > 0) {
      const latestRSI = rsi.values[0];
      console.log(`[RealData] RSI data available: ${latestRSI.rsi}`);
      content.rsi = {
        available: true,
        status: 'Real RSI data from TwelveData API',
        currentValue: parseFloat(latestRSI.rsi),
        date: latestRSI.datetime,
        interpretation: this.interpretRSI(parseFloat(latestRSI.rsi)),
        dataPoints: rsi.values.length,
        lastUpdated: this.dataStatus.rsi.timestamp,
        period: '14-day RSI'
      };
    } else {
      console.log(`[RealData] RSI failed: ${this.dataStatus.rsi?.error || 'Not available'}`);
      content.rsi = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.rsi?.error || 'RSI data not available',
        explanation: 'TwelveData API did not return RSI indicator data'
      };
    }

    // MACD Section
    if (this.dataStatus.macd?.success && macd && macd.values?.length > 0) {
      const latestMACD = macd.values[0];
      console.log(`[RealData] MACD data available: ${latestMACD.macd}`);
      content.macd = {
        available: true,
        status: 'Real MACD data from TwelveData API',
        macd: parseFloat(latestMACD.macd),
        signal: parseFloat(latestMACD.macd_signal),
        histogram: parseFloat(latestMACD.macd_hist),
        date: latestMACD.datetime,
        interpretation: this.interpretMACD(latestMACD),
        dataPoints: macd.values.length,
        lastUpdated: this.dataStatus.macd.timestamp
      };
    } else {
      console.log(`[RealData] MACD failed: ${this.dataStatus.macd?.error || 'Not available'}`);
      content.macd = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.macd?.error || 'MACD data not available',
        explanation: 'TwelveData API did not return MACD indicator data'
      };
    }

    // SMA Section
    if (this.dataStatus.sma?.success && sma && sma.values?.length > 0) {
      const latestSMA = sma.values[0];
      const currentPrice = this.realData.quote?.close;
      console.log(`[RealData] SMA data available: ${latestSMA.sma}`);
      content.sma = {
        available: true,
        status: 'Real SMA data from TwelveData API',
        currentValue: parseFloat(latestSMA.sma),
        date: latestSMA.datetime,
        priceVsSMA: currentPrice ? this.comparePriceToSMA(parseFloat(currentPrice), parseFloat(latestSMA.sma)) : 'Cannot compare - no current price',
        dataPoints: sma.values.length,
        lastUpdated: this.dataStatus.sma.timestamp,
        period: '20-day SMA'
      };
    } else {
      console.log(`[RealData] SMA failed: ${this.dataStatus.sma?.error || 'Not available'}`);
      content.sma = {
        available: false,
        status: 'FAILED',
        error: this.dataStatus.sma?.error || 'SMA data not available',
        explanation: 'TwelveData API did not return SMA indicator data'
      };
    }

    return {
      slideNumber: 6,
      type: 'technical_analysis',
      title: 'Technical Analysis',
      content
    };
  }

  generateRealDataCharts() {
    console.log('[RealData] Generating charts with real data - EVERY CHART INDEPENDENT');

    const charts = [];

    // CHART 1: Price chart (always attempt to generate)
    console.log('[RealData] Chart 1: Creating Price Chart...');
    if (this.dataStatus.timeSeries?.success && this.realData.timeSeries?.values?.length > 0) {
      charts.push(this.createPriceChart());
      console.log('[RealData] Price Chart SUCCESS');
    } else {
      console.log(`[RealData] Price Chart FAILED: ${this.dataStatus.timeSeries?.error || 'No time series data'}`);
      charts.push(this.createFailedChart('price', 'Price Chart', this.dataStatus.timeSeries?.error || 'No time series data'));
    }

    // CHART 2: Technical indicators chart (always attempt to generate)
    console.log('[RealData] Chart 2: Creating Technical Indicators Chart...');
    const hasAnyTechnical = this.dataStatus.rsi?.success || this.dataStatus.macd?.success || this.dataStatus.sma?.success;
    if (hasAnyTechnical) {
      charts.push(this.createTechnicalChart());
      console.log('[RealData] Technical Chart SUCCESS');
    } else {
      console.log('[RealData] Technical Chart FAILED: No technical indicators available');
      charts.push(this.createFailedChart('technical', 'Technical Indicators', 'No technical indicator data available'));
    }

    // CHART 3: Volume chart (always attempt to generate)
    console.log('[RealData] Chart 3: Creating Volume Chart...');
    if (this.dataStatus.timeSeries?.success && this.realData.timeSeries?.values?.length > 0) {
      charts.push(this.createVolumeChart());
      console.log('[RealData] Volume Chart SUCCESS');
    } else {
      console.log(`[RealData] Volume Chart FAILED: ${this.dataStatus.timeSeries?.error || 'No time series data'}`);
      charts.push(this.createFailedChart('volume', 'Volume Chart', this.dataStatus.timeSeries?.error || 'No time series data'));
    }

    console.log(`[RealData] Generated ${charts.length} charts - ALL CHARTS COMPLETE`);
    return charts;
  }

  createFailedChart(chartId, chartTitle, errorMessage) {
    return {
      id: `failed-${chartId}-chart`,
      type: 'error',
      title: `${chartTitle} - Data Unavailable`,
      error: true,
      data: [],
      config: {
        height: 300,
        errorMessage: errorMessage,
        dataSource: 'TwelveData API',
        realData: false,
        status: 'FAILED'
      }
    };
  }

  createPriceChart() {
    const timeSeries = this.realData.timeSeries;
    const values = timeSeries.values || [];

    return {
      id: 'real-price-chart',
      type: 'candlestick',
      title: `${this.ticker} Price Chart (Real Data)`,
      data: values.map(point => ({
        date: point.datetime,
        open: parseFloat(point.open),
        high: parseFloat(point.high),
        low: parseFloat(point.low),
        close: parseFloat(point.close),
        volume: parseInt(point.volume)
      })),
      config: {
        height: 400,
        dataSource: 'TwelveData Time Series API',
        dataPoints: values.length,
        realData: true,
        lastUpdated: this.dataStatus.timeSeries.timestamp,
        dateRange: `${values[values.length - 1]?.datetime} to ${values[0]?.datetime}`,
        priceRange: {
          high: Math.max(...values.map(v => parseFloat(v.high))),
          low: Math.min(...values.map(v => parseFloat(v.low)))
        }
      }
    };
  }

  createTechnicalChart() {
    const indicators = [];

    // Add RSI if available
    if (this.dataStatus.rsi?.success && this.realData.rsi?.values?.length > 0) {
      indicators.push({
        name: 'RSI',
        type: 'oscillator',
        data: this.realData.rsi.values.map(point => ({
          date: point.datetime,
          value: parseFloat(point.rsi)
        })),
        currentValue: parseFloat(this.realData.rsi.values[0].rsi),
        interpretation: this.interpretRSI(parseFloat(this.realData.rsi.values[0].rsi))
      });
    }

    // Add MACD if available
    if (this.dataStatus.macd?.success && this.realData.macd?.values?.length > 0) {
      indicators.push({
        name: 'MACD',
        type: 'momentum',
        data: this.realData.macd.values.map(point => ({
          date: point.datetime,
          macd: parseFloat(point.macd),
          signal: parseFloat(point.macd_signal),
          histogram: parseFloat(point.macd_hist)
        })),
        currentValue: this.realData.macd.values[0],
        interpretation: this.interpretMACD(this.realData.macd.values[0])
      });
    }

    // Add SMA if available
    if (this.dataStatus.sma?.success && this.realData.sma?.values?.length > 0) {
      indicators.push({
        name: 'SMA',
        type: 'trend',
        data: this.realData.sma.values.map(point => ({
          date: point.datetime,
          value: parseFloat(point.sma)
        })),
        currentValue: parseFloat(this.realData.sma.values[0].sma),
        interpretation: this.comparePriceToSMA(
          this.realData.quote?.close ? parseFloat(this.realData.quote.close) : null,
          parseFloat(this.realData.sma.values[0].sma)
        )
      });
    }

    return {
      id: 'real-technical-chart',
      type: 'technical_indicators',
      title: `${this.ticker} Technical Indicators (Real Data)`,
      indicators: indicators,
      config: {
        height: 350,
        dataSource: 'TwelveData Technical APIs',
        realData: true,
        availableIndicators: indicators.map(i => i.name),
        indicatorCount: indicators.length
      }
    };
  }

  createVolumeChart() {
    const timeSeries = this.realData.timeSeries;
    const values = timeSeries.values || [];

    const volumeData = values.map(point => ({
      date: point.datetime,
      volume: parseInt(point.volume),
      price: parseFloat(point.close)
    }));

    const avgVolume = Math.round(values.reduce((sum, v) => sum + parseInt(v.volume), 0) / values.length);

    return {
      id: 'real-volume-chart',
      type: 'volume',
      title: `${this.ticker} Volume Analysis (Real Data)`,
      data: volumeData,
      config: {
        height: 250,
        dataSource: 'TwelveData Time Series API',
        dataPoints: values.length,
        realData: true,
        averageVolume: avgVolume,
        lastUpdated: this.dataStatus.timeSeries.timestamp,
        volumeRange: {
          max: Math.max(...values.map(v => parseInt(v.volume))),
          min: Math.min(...values.map(v => parseInt(v.volume)))
        }
      }
    };
  }

  // Helper methods for technical analysis interpretation
  interpretRSI(rsiValue) {
    if (rsiValue >= 70) {
      return `Overbought condition (${rsiValue.toFixed(2)}) - potential sell signal`;
    } else if (rsiValue <= 30) {
      return `Oversold condition (${rsiValue.toFixed(2)}) - potential buy signal`;
    } else if (rsiValue >= 50) {
      return `Bullish momentum (${rsiValue.toFixed(2)}) - above midline`;
    } else {
      return `Bearish momentum (${rsiValue.toFixed(2)}) - below midline`;
    }
  }

  interpretMACD(macdData) {
    const { macd, macd_signal, macd_hist } = macdData;
    const histogram = parseFloat(macd_hist);

    if (histogram > 0) {
      return `Bullish signal - MACD (${parseFloat(macd).toFixed(3)}) above signal line (${parseFloat(macd_signal).toFixed(3)})`;
    } else if (histogram < 0) {
      return `Bearish signal - MACD (${parseFloat(macd).toFixed(3)}) below signal line (${parseFloat(macd_signal).toFixed(3)})`;
    } else {
      return `Neutral - MACD at signal line crossover point`;
    }
  }

  comparePriceToSMA(currentPrice, smaValue) {
    if (!currentPrice || !smaValue) {
      return 'Cannot compare - missing price or SMA data';
    }

    const priceDiff = ((currentPrice - smaValue) / smaValue) * 100;

    if (priceDiff > 2) {
      return `Price $${currentPrice.toFixed(2)} is ${priceDiff.toFixed(2)}% above SMA $${smaValue.toFixed(2)} - bullish`;
    } else if (priceDiff < -2) {
      return `Price $${currentPrice.toFixed(2)} is ${Math.abs(priceDiff).toFixed(2)}% below SMA $${smaValue.toFixed(2)} - bearish`;
    } else {
      return `Price $${currentPrice.toFixed(2)} near SMA $${smaValue.toFixed(2)} (${priceDiff.toFixed(2)}%) - neutral`;
    }
  }
}
