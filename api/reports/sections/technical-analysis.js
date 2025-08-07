const { IntelligentRealDataGenerator } = require('../generate-intelligent-real-data.js');

module.exports = async function handler(req, res) {
  const { ticker, customPrompt } = req.body;
  
  try {
    const generator = new IntelligentRealDataGenerator(ticker, process.env.TWELVE_DATA_API_KEY, process.env.ANTHROPIC_API_KEY);
    
    // Parallel fetch using EXISTING methods
    const [rsi, macd, sma, statistics] = await Promise.all([
      generator.fetchRSI(),
      generator.fetchMACD(),
      generator.fetchSMA(),
      generator.fetchStatistics()
    ]);
    
    const technicalContext = {
      rsi: generator.realData.rsi,
      macd: generator.realData.macd,
      sma: generator.realData.sma,
      statistics: generator.realData.statistics
    };
    
    // Variables for templates
    const latestRSI = generator.realData.rsi?.values?.[0]?.rsi || 'N/A';
    const latestMACD = generator.realData.macd?.values?.[0] || {};
    
    const variables = {
      TICKER: ticker,
      RSI: latestRSI,
      RSI_SIGNAL: latestRSI > 70 ? 'Overbought' : latestRSI < 30 ? 'Oversold' : 'Neutral',
      MACD: latestMACD.macd,
      MACD_SIGNAL: latestMACD.macd > latestMACD.macd_signal ? 'Bullish' : 'Bearish',
      MA_50: generator.realData.statistics?.stock_price_summary?.day_50_ma,
      MA_200: generator.realData.statistics?.stock_price_summary?.day_200_ma
    };
    
    let analysis;
    if (customPrompt) {
      const prompt = customPrompt.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
      analysis = await generator.callClaudeAPI(prompt, 'technical_analysis');
    } else {
      analysis = await generator.analyzeTechnicalPosition();
    }
    
    return res.json({
      success: true,
      section: 'technical-analysis',
      slides: [{
        id: 'technical-analysis',
        title: 'Technical Analysis',
        content: analysis,
        type: 'analysis'
      }],
      rawData: { 
        rsi: generator.realData.rsi, 
        macd: generator.realData.macd, 
        sma: generator.realData.sma, 
        statistics: generator.realData.statistics 
      },
      aiAnalysis: { technicalAnalysis: analysis },
      variables
    });
    
  } catch (error) {
    console.error('[Technical Analysis] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
