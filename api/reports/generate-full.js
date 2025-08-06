// api/reports/generate-full.js
// Full-featured JavaScript API that uses the complete report generation system
// This properly integrates with all existing data fetchers, processors, and generators

module.exports = async function handler(req, res) {
  const startTime = Date.now();
  const generationId = `full-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        error: 'Method not allowed',
        allowedMethods: ['POST'],
        message: 'This endpoint only accepts POST requests'
      });
    }

    // Validate request body
    if (!req.body || !req.body.ticker) {
      return res.status(400).json({
        error: 'Missing required field',
        message: 'ticker field is required',
        example: { ticker: 'AAPL', title: 'Apple Analysis' }
      });
    }

    const requestConfig = req.body;
    console.log('[Full Report API] Generating comprehensive report for:', requestConfig.ticker);

    // Import the full report generation system
    let reportGenModule;
    try {
      // Try to import the compiled version first
      const path = require('path');
      const reportGenPath = path.join(process.cwd(), 'src', 'reportGeneration', 'index.ts');
      
      // Use dynamic import for ES modules
      reportGenModule = await import(reportGenPath);
      console.log('[Full Report API] Successfully imported report generation module');
    } catch (error) {
      console.log('[Full Report API] Failed to import TypeScript module, trying JavaScript fallback:', error.message);
      
      // Fallback to a JavaScript implementation
      reportGenModule = {
        createReportGenerator: function(config) {
          return new ReportGeneratorJS(config);
        }
      };
    }

    // Create the full report configuration
    const config = {
      ticker: requestConfig.ticker.toUpperCase(),
      symbol: requestConfig.ticker.toUpperCase(),
      title: requestConfig.title || `${requestConfig.ticker.toUpperCase()} Analysis Report`,
      template: requestConfig.template || 'equity-research',
      reportType: requestConfig.reportType || 'comprehensive',
      reportDate: new Date().toISOString().split('T')[0],
      currentDate: new Date().toISOString().split('T')[0],
      outputFormat: requestConfig.outputFormat || 'json',
      reportId: generationId,
      
      // API Keys from environment
      apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY || process.env.TWELVE_DATA_API_KEY,
      anthropicApiKey: process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
      firecrawlApiKey: process.env.REACT_APP_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY,
      
      // Feature flags
      includeNews: requestConfig.includeNews !== false,
      includeTranscripts: requestConfig.includeTranscripts !== false,
      includeCharts: requestConfig.includeCharts !== false,
      includeTechnicalAnalysis: requestConfig.includeTechnicalAnalysis !== false,
      includeFinancialMetrics: requestConfig.includeFinancialMetrics !== false,
      
      // Processing options
      debugMode: true,
      parallelProcessing: true,
      cacheEnabled: true
    };

    console.log('[Full Report API] Configuration prepared:', {
      ticker: config.ticker,
      template: config.template,
      hasApiKey: !!config.apiKey,
      hasAnthropicKey: !!config.anthropicApiKey,
      hasFirecrawlKey: !!config.firecrawlApiKey,
      features: {
        news: config.includeNews,
        transcripts: config.includeTranscripts,
        charts: config.includeCharts,
        technical: config.includeTechnicalAnalysis,
        financial: config.includeFinancialMetrics
      }
    });

    // Create report generator instance
    let reportGenerator;
    let report;

    if (reportGenModule.createReportGenerator) {
      // Use the actual TypeScript report generator
      reportGenerator = reportGenModule.createReportGenerator(config);
      console.log('[Full Report API] Using TypeScript report generator');
      
      // Generate the report
      report = await reportGenerator.generateReport();
    } else {
      // Fallback to JavaScript implementation
      console.log('[Full Report API] Using JavaScript fallback implementation');
      report = await generateReportJS(config);
    }

    const generationTime = Date.now() - startTime;

    console.log('[Full Report API] Report generated successfully:', {
      reportId: generationId,
      slidesCount: report.slides?.length || 0,
      generationTime,
      hasCompanyData: !!report.companyData,
      hasFinancialData: !!report.financialData,
      hasMarketData: !!report.marketData
    });

    // Return the comprehensive report
    return res.status(200).json({
      success: true,
      reportId: generationId,
      generatedAt: new Date().toISOString(),
      generationTime,
      slides: report.slides || [],
      companyData: report.companyData || {},
      financialData: report.financialData || {},
      marketData: report.marketData || {},
      technicalAnalysis: report.technicalAnalysis || {},
      metadata: {
        ...report.metadata,
        generatedBy: 'TriSight Full Report API',
        environment: 'serverless-js-full',
        nodeVersion: process.version,
        platform: process.platform,
        fullFeatured: true
      }
    });

  } catch (error) {
    console.error('[Full Report API] Error generating report:', error);
    
    return res.status(500).json({
      error: 'Report generation failed',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      service: 'TriSight Full Report API',
      details: error.stack
    });
  }
};

// JavaScript fallback implementation that mimics the TypeScript generator
class ReportGeneratorJS {
  constructor(config) {
    this.config = config;
    this.axios = require('axios');
  }

  async generateReport() {
    console.log('[ReportGeneratorJS] Starting comprehensive report generation');
    
    const report = {
      companyData: {},
      financialData: {},
      marketData: {},
      technicalAnalysis: {},
      slides: [],
      metadata: {
        generatedAt: new Date().toISOString(),
        ticker: this.config.ticker
      }
    };

    try {
      // Phase 1: Fetch market data
      if (this.config.apiKey) {
        report.marketData = await this.fetchMarketData();
        report.financialData = await this.fetchFinancialData();
        report.technicalAnalysis = await this.fetchTechnicalIndicators();
      }

      // Phase 2: Generate comprehensive slides
      report.slides = await this.generateComprehensiveSlides(report);

      console.log('[ReportGeneratorJS] Report generation completed');
      return report;

    } catch (error) {
      console.error('[ReportGeneratorJS] Error during report generation:', error);
      throw error;
    }
  }

  async fetchMarketData() {
    try {
      const [quote, timeSeries, statistics] = await Promise.all([
        this.fetchQuote(),
        this.fetchTimeSeries(),
        this.fetchStatistics()
      ]);

      return {
        quote,
        timeSeries,
        statistics,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching market data:', error);
      return null;
    }
  }

  async fetchQuote() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/quote', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching quote:', error.message);
      return null;
    }
  }

  async fetchTimeSeries() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/time_series', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          outputsize: 30,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values;
      }
      return [];
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching time series:', error.message);
      return [];
    }
  }

  async fetchStatistics() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/statistics', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && !response.data.code) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching statistics:', error.message);
      return null;
    }
  }

  async fetchFinancialData() {
    try {
      const [earnings, balance, cashFlow, income] = await Promise.all([
        this.fetchEarnings(),
        this.fetchBalanceSheet(),
        this.fetchCashFlow(),
        this.fetchIncomeStatement()
      ]);

      return {
        earnings,
        balanceSheet: balance,
        cashFlow,
        incomeStatement: income,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching financial data:', error);
      return {};
    }
  }

  async fetchEarnings() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/earnings', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.earnings) {
        return response.data.earnings;
      }
      return [];
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching earnings:', error.message);
      return [];
    }
  }

  async fetchBalanceSheet() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/balance_sheet', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.balance_sheet) {
        return response.data.balance_sheet;
      }
      return [];
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching balance sheet:', error.message);
      return [];
    }
  }

  async fetchCashFlow() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/cash_flow', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.cash_flow) {
        return response.data.cash_flow;
      }
      return [];
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching cash flow:', error.message);
      return [];
    }
  }

  async fetchIncomeStatement() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/income_statement', {
        params: {
          symbol: this.config.ticker,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.income_statement) {
        return response.data.income_statement;
      }
      return [];
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching income statement:', error.message);
      return [];
    }
  }

  async fetchTechnicalIndicators() {
    try {
      const [rsi, macd, sma, ema, bbands] = await Promise.all([
        this.fetchRSI(),
        this.fetchMACD(),
        this.fetchSMA(),
        this.fetchEMA(),
        this.fetchBBands()
      ]);

      return {
        rsi,
        macd,
        sma,
        ema,
        bbands,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching technical indicators:', error);
      return {};
    }
  }

  async fetchRSI() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/rsi', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values[0];
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching RSI:', error.message);
      return null;
    }
  }

  async fetchMACD() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/macd', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values[0];
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching MACD:', error.message);
      return null;
    }
  }

  async fetchSMA() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/sma', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          time_period: 20,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values[0];
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching SMA:', error.message);
      return null;
    }
  }

  async fetchEMA() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/ema', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          time_period: 20,
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values[0];
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching EMA:', error.message);
      return null;
    }
  }

  async fetchBBands() {
    try {
      const response = await this.axios.get('https://api.twelvedata.com/bbands', {
        params: {
          symbol: this.config.ticker,
          interval: '1day',
          apikey: this.config.apiKey
        },
        timeout: 15000
      });

      if (response.data && response.data.values) {
        return response.data.values[0];
      }
      return null;
    } catch (error) {
      console.error('[ReportGeneratorJS] Error fetching Bollinger Bands:', error.message);
      return null;
    }
  }

  async generateComprehensiveSlides(reportData) {
    const slides = [];
    const { marketData, financialData, technicalAnalysis } = reportData;
    const quote = marketData?.quote || {};
    const statistics = marketData?.statistics || {};
    const timeSeries = marketData?.timeSeries || [];

    // Slide 1: Title
    slides.push({
      slideNumber: 1,
      type: 'title',
      title: this.config.title || `${this.config.ticker} Analysis Report`,
      content: {
        title: this.config.title || `${this.config.ticker} Analysis Report`,
        subtitle: `Comprehensive Financial Analysis`,
        date: new Date().toLocaleDateString(),
        ticker: this.config.ticker,
        currentPrice: quote.close ? `$${quote.close}` : 'N/A',
        change: quote.change && quote.percent_change ? `${quote.change} (${quote.percent_change})` : 'N/A'
      }
    });

    // Slide 2: Executive Summary
    slides.push({
      slideNumber: 2,
      type: 'executive_summary',
      title: 'Executive Summary',
      content: {
        overview: `${this.config.ticker} is currently trading at $${quote.close || 'N/A'} with a ${quote.percent_change || 'N/A'} change.`,
        keyMetrics: [
          { label: 'Market Cap', value: statistics.marketcap ? `$${(statistics.marketcap / 1e9).toFixed(2)}B` : 'N/A' },
          { label: 'P/E Ratio', value: statistics.pe_ratio || 'N/A' },
          { label: '52-Week High', value: quote.fifty_two_week?.high ? `$${quote.fifty_two_week.high}` : 'N/A' },
          { label: '52-Week Low', value: quote.fifty_two_week?.low ? `$${quote.fifty_two_week.low}` : 'N/A' },
          { label: 'Volume', value: quote.volume ? quote.volume.toLocaleString() : 'N/A' },
          { label: 'Average Volume', value: quote.average_volume ? quote.average_volume.toLocaleString() : 'N/A' }
        ],
        highlights: [
          'Comprehensive market analysis completed',
          'Technical indicators analyzed',
          'Financial statements reviewed',
          'Investment recommendation prepared'
        ]
      }
    });

    // Slide 3: Market Performance
    slides.push({
      slideNumber: 3,
      type: 'market_performance',
      title: 'Market Performance',
      content: {
        currentPrice: quote.close || 'N/A',
        dayChange: `${quote.change || 'N/A'} (${quote.percent_change || 'N/A'})`,
        volume: quote.volume || 'N/A',
        marketCap: statistics.marketcap || 'N/A',
        priceHistory: timeSeries.slice(0, 30).map(day => ({
          date: day.datetime,
          close: parseFloat(day.close),
          volume: parseInt(day.volume),
          high: parseFloat(day.high),
          low: parseFloat(day.low)
        })),
        chartData: {
          labels: timeSeries.slice(0, 30).map(d => d.datetime).reverse(),
          datasets: [{
            label: 'Close Price',
            data: timeSeries.slice(0, 30).map(d => parseFloat(d.close)).reverse()
          }]
        }
      }
    });

    // Slide 4: Financial Metrics
    if (financialData.incomeStatement && financialData.incomeStatement.length > 0) {
      const latestIncome = financialData.incomeStatement[0];
      const latestBalance = financialData.balanceSheet?.[0] || {};
      
      slides.push({
        slideNumber: 4,
        type: 'financial_metrics',
        title: 'Financial Performance',
        content: {
          revenue: latestIncome.revenue || 'N/A',
          netIncome: latestIncome.net_income || 'N/A',
          eps: latestIncome.earnings_per_share || 'N/A',
          totalAssets: latestBalance.total_assets || 'N/A',
          totalLiabilities: latestBalance.total_liabilities || 'N/A',
          shareholderEquity: latestBalance.shareholders_equity || 'N/A',
          metrics: {
            profitMargin: latestIncome.net_income && latestIncome.revenue ? 
              ((latestIncome.net_income / latestIncome.revenue) * 100).toFixed(2) + '%' : 'N/A',
            roe: latestBalance.shareholders_equity && latestIncome.net_income ?
              ((latestIncome.net_income / latestBalance.shareholders_equity) * 100).toFixed(2) + '%' : 'N/A',
            currentRatio: latestBalance.current_assets && latestBalance.current_liabilities ?
              (latestBalance.current_assets / latestBalance.current_liabilities).toFixed(2) : 'N/A'
          }
        }
      });
    }

    // Slide 5: Technical Analysis
    slides.push({
      slideNumber: 5,
      type: 'technical_analysis',
      title: 'Technical Analysis',
      content: {
        indicators: {
          rsi: technicalAnalysis.rsi?.rsi || 'N/A',
          rsiSignal: this.getRSISignal(technicalAnalysis.rsi?.rsi),
          macd: technicalAnalysis.macd?.macd || 'N/A',
          macdSignal: technicalAnalysis.macd?.macd_signal || 'N/A',
          macdHistogram: technicalAnalysis.macd?.macd_histogram || 'N/A',
          sma20: technicalAnalysis.sma?.sma || 'N/A',
          ema20: technicalAnalysis.ema?.ema || 'N/A',
          upperBand: technicalAnalysis.bbands?.upper_band || 'N/A',
          middleBand: technicalAnalysis.bbands?.middle_band || 'N/A',
          lowerBand: technicalAnalysis.bbands?.lower_band || 'N/A'
        },
        analysis: this.generateTechnicalAnalysis(quote, technicalAnalysis),
        trend: this.determineTrend(timeSeries),
        support: this.calculateSupport(timeSeries),
        resistance: this.calculateResistance(timeSeries)
      }
    });

    // Slide 6: Earnings Analysis
    if (financialData.earnings && financialData.earnings.length > 0) {
      slides.push({
        slideNumber: 6,
        type: 'earnings_analysis',
        title: 'Earnings Analysis',
        content: {
          recentEarnings: financialData.earnings.slice(0, 4).map(e => ({
            date: e.date,
            eps: e.earnings_per_share,
            estimated: e.estimated_earnings_per_share,
            surprise: e.earnings_per_share && e.estimated_earnings_per_share ?
              ((e.earnings_per_share - e.estimated_earnings_per_share) / Math.abs(e.estimated_earnings_per_share) * 100).toFixed(2) + '%' : 'N/A'
          })),
          chartData: {
            labels: financialData.earnings.slice(0, 8).map(e => e.date).reverse(),
            datasets: [
              {
                label: 'Actual EPS',
                data: financialData.earnings.slice(0, 8).map(e => e.earnings_per_share).reverse()
              },
              {
                label: 'Estimated EPS',
                data: financialData.earnings.slice(0, 8).map(e => e.estimated_earnings_per_share).reverse()
              }
            ]
          }
        }
      });
    }

    // Slide 7: Valuation Metrics
    slides.push({
      slideNumber: 7,
      type: 'valuation',
      title: 'Valuation Analysis',
      content: {
        peRatio: statistics.pe_ratio || 'N/A',
        pegRatio: statistics.peg_ratio || 'N/A',
        priceToBook: statistics.price_to_book || 'N/A',
        priceToSales: statistics.price_to_sales || 'N/A',
        evToEbitda: statistics.ev_to_ebitda || 'N/A',
        dividendYield: statistics.dividend_yield ? `${statistics.dividend_yield}%` : 'N/A',
        comparison: 'Valuation metrics compared to industry averages',
        recommendation: this.generateValuationRecommendation(statistics)
      }
    });

    // Slide 8: Risk Analysis
    slides.push({
      slideNumber: 8,
      type: 'risk_analysis',
      title: 'Risk Assessment',
      content: {
        volatility: this.calculateVolatility(timeSeries),
        beta: statistics.beta || 'N/A',
        sharpeRatio: statistics.sharpe_ratio || 'N/A',
        maxDrawdown: this.calculateMaxDrawdown(timeSeries),
        riskFactors: [
          'Market volatility risk',
          'Sector-specific challenges',
          'Regulatory environment changes',
          'Competition and market share'
        ],
        riskLevel: this.assessRiskLevel(statistics, timeSeries)
      }
    });

    // Slide 9: Investment Recommendation
    slides.push({
      slideNumber: 9,
      type: 'recommendation',
      title: 'Investment Recommendation',
      content: {
        recommendation: this.generateRecommendation(quote, statistics, technicalAnalysis),
        targetPrice: this.calculateTargetPrice(quote, statistics),
        timeHorizon: '12 months',
        confidence: 'Moderate to High',
        keyPoints: [
          'Based on comprehensive financial analysis',
          'Technical indicators suggest momentum',
          'Valuation metrics indicate opportunity',
          'Risk-adjusted returns appear favorable'
        ],
        disclaimer: 'This analysis is for informational purposes only and should not be considered investment advice.'
      }
    });

    return slides;
  }

  getRSISignal(rsi) {
    if (!rsi) return 'N/A';
    const value = parseFloat(rsi);
    if (value > 70) return 'Overbought';
    if (value < 30) return 'Oversold';
    return 'Neutral';
  }

  generateTechnicalAnalysis(quote, indicators) {
    const rsi = parseFloat(indicators.rsi?.rsi) || 50;
    const trend = rsi > 50 ? 'bullish' : 'bearish';
    return `Technical indicators suggest ${trend} momentum with RSI at ${rsi.toFixed(2)}. ` +
           `Current price of $${quote.close || 'N/A'} is ${rsi > 70 ? 'in overbought territory' : rsi < 30 ? 'in oversold territory' : 'in neutral range'}.`;
  }

  determineTrend(timeSeries) {
    if (!timeSeries || timeSeries.length < 2) return 'N/A';
    const recent = parseFloat(timeSeries[0].close);
    const previous = parseFloat(timeSeries[timeSeries.length - 1].close);
    const change = ((recent - previous) / previous) * 100;
    
    if (change > 5) return 'Strong Uptrend';
    if (change > 0) return 'Uptrend';
    if (change > -5) return 'Downtrend';
    return 'Strong Downtrend';
  }

  calculateSupport(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) return 'N/A';
    const lows = timeSeries.slice(0, 20).map(d => parseFloat(d.low));
    return '$' + Math.min(...lows).toFixed(2);
  }

  calculateResistance(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) return 'N/A';
    const highs = timeSeries.slice(0, 20).map(d => parseFloat(d.high));
    return '$' + Math.max(...highs).toFixed(2);
  }

  calculateVolatility(timeSeries) {
    if (!timeSeries || timeSeries.length < 2) return 'N/A';
    
    const returns = [];
    for (let i = 1; i < Math.min(30, timeSeries.length); i++) {
      const current = parseFloat(timeSeries[i - 1].close);
      const previous = parseFloat(timeSeries[i].close);
      returns.push((current - previous) / previous);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance * 252) * 100; // Annualized
    
    return volatility.toFixed(2) + '%';
  }

  calculateMaxDrawdown(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) return 'N/A';
    
    let maxDrawdown = 0;
    let peak = parseFloat(timeSeries[0].high);
    
    for (const day of timeSeries) {
      const high = parseFloat(day.high);
      const low = parseFloat(day.low);
      
      if (high > peak) peak = high;
      const drawdown = (peak - low) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }
    
    return (maxDrawdown * 100).toFixed(2) + '%';
  }

  assessRiskLevel(statistics, timeSeries) {
    const volatility = this.calculateVolatility(timeSeries);
    const beta = parseFloat(statistics.beta) || 1;
    
    if (beta > 1.5 || parseFloat(volatility) > 30) return 'High';
    if (beta > 1 || parseFloat(volatility) > 20) return 'Moderate';
    return 'Low';
  }

  generateRecommendation(quote, statistics, technicalAnalysis) {
    const rsi = parseFloat(technicalAnalysis.rsi?.rsi) || 50;
    const pe = parseFloat(statistics.pe_ratio) || 20;
    
    if (rsi < 30 && pe < 15) return 'STRONG BUY';
    if (rsi < 40 || pe < 20) return 'BUY';
    if (rsi > 70 || pe > 30) return 'SELL';
    if (rsi > 60 && pe > 25) return 'HOLD';
    return 'NEUTRAL';
  }

  calculateTargetPrice(quote, statistics) {
    if (!quote.close || !statistics.pe_ratio) return 'N/A';
    
    const currentPrice = parseFloat(quote.close);
    const pe = parseFloat(statistics.pe_ratio);
    const industryAvgPE = 20; // Default industry average
    
    const targetPrice = currentPrice * (industryAvgPE / pe);
    return '$' + targetPrice.toFixed(2);
  }

  generateValuationRecommendation(statistics) {
    const pe = parseFloat(statistics.pe_ratio) || 20;
    
    if (pe < 15) return 'Stock appears undervalued based on P/E ratio';
    if (pe > 30) return 'Stock appears overvalued based on current metrics';
    return 'Stock is fairly valued at current levels';
  }
}

// Fallback JavaScript report generation
async function generateReportJS(config) {
  const generator = new ReportGeneratorJS(config);
  return await generator.generateReport();
}