// api/reports/sections/financial-analysis-enhanced.js
// Enhanced Financial Analysis using the EXACT pattern that worked in market-overview-enhanced.js
// Rule: Safe parallel enhanced version with graceful fallbacks

const { IntelligentRealDataGenerator } = require('../generate-intelligent-real-data.js');
const { MultiModelEnhancer } = require('../utils/multi-model-enhancer');

module.exports = async (req, res) => {
  try {
    const { ticker, useMultiModel = false } = req.body;
    
    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    console.log(`[Enhanced Financial Analysis] Starting for ${ticker}, multiModel: ${useMultiModel}`);

    // START WITH EXISTING WORKING CODE (GUARANTEED TO WORK)
    const generator = new IntelligentRealDataGenerator(ticker, process.env.TWELVE_DATA_API_KEY, process.env.ANTHROPIC_API_KEY);
    
    // Parallel fetch using EXISTING methods (PROVEN TO WORK)
    const [quote, profile, statistics, timeSeries] = await Promise.all([
      generator.fetchQuote(),
      generator.fetchProfile(),
      generator.fetchStatistics(),
      generator.fetchTimeSeries()
    ]);

    // DON'T OVERWRITE generator.realData - it's populated by the fetch methods!
    // Use EXISTING analysis method like the working version
    const marketContext = {
      quote: generator.realData.quote,
      profile: generator.realData.profile,
      statistics: generator.realData.statistics,
      timeSeries: generator.realData.timeSeries
    };

    // Build variables for analysis (SAME AS WORKING VERSION)
    const variables = {
      TICKER: ticker,
      CURRENT_PRICE: generator.realData.quote?.close,
      PRICE_CHANGE: generator.realData.quote?.change,
      PRICE_CHANGE_PERCENT: generator.realData.quote?.percent_change,
      VOLUME: generator.realData.quote?.volume,
      MARKET_CAP: generator.realData.statistics?.valuations_metrics?.market_capitalization,
      PE_RATIO: generator.realData.statistics?.valuations_metrics?.trailing_pe,
      REVENUE: generator.realData.statistics?.financials?.income_statement?.revenue,
      NET_INCOME: generator.realData.statistics?.financials?.income_statement?.net_income,
      DEBT_TO_EQUITY: generator.realData.statistics?.financials?.balance_sheet?.debt_to_equity,
      ROE: generator.realData.statistics?.financials?.profitability?.return_on_equity,
      PROFIT_MARGIN: generator.realData.statistics?.financials?.profitability?.profit_margin
    };

    // Get PRIMARY analysis using EXISTING working method
    let primaryAnalysis;
    if (generator.analyzeFinancialHealth) {
      primaryAnalysis = await generator.analyzeFinancialHealth();
    } else {
      // Fallback to general analysis if specific method doesn't exist
      primaryAnalysis = await generator.generateAnalysis('financial-analysis', variables);
    }

    console.log(`[Enhanced Financial Analysis] Claude analysis completed`);

    // ENHANCEMENT: Add multi-model if requested (OPTIONAL, SAFE)
    let enhancedAnalysis = primaryAnalysis;
    let enhancementStatus = { claude: 'success' };

    if (useMultiModel) {
      console.log(`[Enhanced Financial Analysis] Attempting multi-model enhancement...`);
      
      // Use the reusable enhancer with the EXACT pattern that worked
      const enhancer = new MultiModelEnhancer({
        enableGPT: true,
        enablePerplexity: true,
        timeout: 8000,
        debug: true
      });

      const enhancement = await enhancer.enhance(
        primaryAnalysis, 
        ticker, 
        generator.realData, 
        'financial-analysis'
      );

      enhancedAnalysis = enhancement.analysis;
      enhancementStatus = { ...enhancementStatus, ...enhancement.status };
    } else {
      enhancementStatus.enhancement = 'disabled';
    }

    // Return in EXACT SAME FORMAT as working version (GUARANTEED COMPATIBILITY)
    return res.json({
      success: true,
      section: 'financial-analysis',
      slides: [{
        id: 'financial-analysis',
        title: 'Financial Analysis',
        content: enhancedAnalysis,
        type: 'analysis'
      }],
      rawData: generator.realData,
      aiAnalysis: { 
        financialAssessment: enhancedAnalysis 
      },
      enhancementStatus: enhancementStatus // Debug info
    });
    
  } catch (error) {
    console.error('[Enhanced Financial Analysis] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
