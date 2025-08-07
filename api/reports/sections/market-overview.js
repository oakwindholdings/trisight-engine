// Use the existing generator class
const { IntelligentRealDataGenerator } = require('../generate-intelligent-real-data.js');

module.exports = async function handler(req, res) {
  const { ticker, customPrompt } = req.body;
  
  try {
    const generator = new IntelligentRealDataGenerator(ticker, process.env.TWELVE_DATA_API_KEY, process.env.ANTHROPIC_API_KEY);
    
    // Parallel fetch using EXISTING methods
    const [quote, profile, statistics, timeSeries] = await Promise.all([
      generator.fetchQuote(),
      generator.fetchProfile(),
      generator.fetchStatistics(),
      generator.fetchTimeSeries()
    ]);
    
    // Use EXISTING analysis method
    const marketContext = {
      quote: generator.realData.quote,
      profile: generator.realData.profile,
      statistics: generator.realData.statistics,
      timeSeries: generator.realData.timeSeries
    };
    
    // Template variables for custom prompts
    const variables = {
      TICKER: ticker,
      PRICE: generator.realData.quote?.close,
      CHANGE_PERCENT: generator.realData.quote?.percent_change,
      VOLUME: generator.realData.quote?.volume,
      MARKET_CAP: generator.realData.statistics?.valuations_metrics?.market_capitalization,
      PE_RATIO: generator.realData.statistics?.valuations_metrics?.trailing_pe
    };
    
    // Use custom prompt or existing analysis
    let analysis;
    if (customPrompt) {
      const prompt = customPrompt.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
      analysis = await generator.callClaudeAPI(prompt, 'market_overview');
    } else {
      analysis = await generator.analyzeMarketPosition();
    }
    
    // Return in EXISTING format
    return res.json({
      success: true,
      section: 'market-overview',
      slides: [{
        id: 'market-overview',
        title: 'Market Overview',
        content: analysis,
        type: 'analysis'
      }],
      rawData: { 
        quote: generator.realData.quote, 
        profile: generator.realData.profile, 
        statistics: generator.realData.statistics, 
        timeSeries: generator.realData.timeSeries 
      },
      aiAnalysis: { marketAssessment: analysis },
      variables
    });
    
  } catch (error) {
    console.error('[Market Overview] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
