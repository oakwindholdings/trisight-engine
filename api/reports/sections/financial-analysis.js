const { IntelligentRealDataGenerator } = require('../generate-intelligent-real-data.js');

module.exports = async function handler(req, res) {
  const { ticker, customPrompt } = req.body;
  
  try {
    const generator = new IntelligentRealDataGenerator(ticker, process.env.TWELVE_DATA_API_KEY, process.env.ANTHROPIC_API_KEY);
    
    // Parallel fetch using EXISTING methods
    const [incomeStatement, balanceSheet, cashFlow] = await Promise.all([
      generator.fetchIncomeStatement(),
      generator.fetchBalanceSheet(),
      generator.fetchCashFlow()
    ]);
    
    const financialContext = {
      incomeStatement: generator.realData.incomeStatement,
      balanceSheet: generator.realData.balanceSheet,
      cashFlow: generator.realData.cashFlow
    };
    
    // Calculate variables for templates
    const latestIncome = generator.realData.incomeStatement?.data?.[0] || {};
    const latestBalance = generator.realData.balanceSheet?.data?.[0] || {};
    
    const variables = {
      TICKER: ticker,
      REVENUE: latestIncome.sales,
      NET_INCOME: latestIncome.net_income,
      EPS: latestIncome.eps_diluted,
      GROSS_MARGIN: latestIncome.gross_profit ? (latestIncome.gross_profit / latestIncome.sales * 100).toFixed(2) : 'N/A',
      TOTAL_ASSETS: latestBalance.assets?.total_assets,
      TOTAL_DEBT: latestBalance.liabilities?.total_liabilities
    };
    
    // Use custom prompt or existing analysis
    let analysis;
    if (customPrompt) {
      const prompt = customPrompt.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
      analysis = await generator.callClaudeAPI(prompt, 'financial_analysis');
    } else {
      analysis = await generator.analyzeFinancialHealth();
    }
    
    return res.json({
      success: true,
      section: 'financial-analysis',
      slides: [{
        id: 'financial-analysis',
        title: 'Financial Analysis',
        content: analysis,
        type: 'analysis'
      }],
      rawData: { 
        incomeStatement: generator.realData.incomeStatement, 
        balanceSheet: generator.realData.balanceSheet, 
        cashFlow: generator.realData.cashFlow 
      },
      aiAnalysis: { financialHealth: analysis },
      variables
    });
    
  } catch (error) {
    console.error('[Financial Analysis] Error:', error);
    res.status(500).json({ error: error.message });
  }
};
