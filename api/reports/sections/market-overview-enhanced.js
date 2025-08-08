// api/reports/sections/market-overview-enhanced.js
// ENHANCED market overview with multi-model AI capabilities
// SAFE PARALLEL VERSION - Falls back to working Claude-only analysis

// Use the existing generator class (PROVEN TO WORK)
const { IntelligentRealDataGenerator } = require('../generate-intelligent-real-data.js');
const axios = require('axios');

module.exports = async function handler(req, res) {
  const { ticker, customPrompt, useMultiModel } = req.body;
  
  try {
    console.log(`[Enhanced Market Overview] Starting for ${ticker}, multiModel: ${useMultiModel}`);
    
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

    // Template variables for custom prompts (EXISTING FUNCTIONALITY)
    const variables = {
      TICKER: ticker,
      PRICE: generator.realData.quote?.close,
      CHANGE_PERCENT: generator.realData.quote?.percent_change,
      VOLUME: generator.realData.quote?.volume,
      MARKET_CAP: generator.realData.statistics?.valuations_metrics?.market_capitalization,
      PE_RATIO: generator.realData.statistics?.valuations_metrics?.trailing_pe
    };

    // Get PRIMARY Claude analysis (PROVEN TO WORK)
    let primaryAnalysis;
    if (customPrompt) {
      const prompt = customPrompt.replace(/\{\{(\w+)\}\}/g, (match, key) => variables[key] || match);
      primaryAnalysis = await generator.callClaudeAPI(prompt, 'market_overview');
    } else {
      primaryAnalysis = await generator.analyzeMarketPosition();
    }

    console.log(`[Enhanced Market Overview] Claude analysis completed`);

    // ENHANCEMENT: Add multi-model if requested (OPTIONAL, SAFE)
    let enhancedAnalysis = primaryAnalysis;
    let enhancementStatus = { claude: 'success' };

    if (useMultiModel) {
      console.log(`[Enhanced Market Overview] Attempting multi-model enhancement...`);
      
      try {
        // Try to get GPT perspective (OPTIONAL ENHANCEMENT)
        const gptAnalysis = await getGPTAnalysis(ticker, generator.realData, variables);
        if (gptAnalysis) {
          enhancementStatus.gpt = 'success';
          console.log(`[Enhanced Market Overview] GPT analysis added`);
        } else {
          enhancementStatus.gpt = 'skipped';
        }
        
        // Try to get Perplexity news context (OPTIONAL ENHANCEMENT)
        const newsContext = await getPerplexityNews(ticker);
        if (newsContext) {
          enhancementStatus.perplexity = 'success';
          console.log(`[Enhanced Market Overview] Perplexity news added`);
        } else {
          enhancementStatus.perplexity = 'skipped';
        }
        
        // Combine analyses if we got enhancements
        if (gptAnalysis || newsContext) {
          enhancedAnalysis = combineAnalyses(primaryAnalysis, gptAnalysis, newsContext, ticker);
          console.log(`[Enhanced Market Overview] Multi-model analysis combined`);
        }
        
      } catch (enhancementError) {
        // IF ENHANCEMENT FAILS, FALL BACK TO WORKING CLAUDE ANALYSIS
        console.log('[Enhanced Market Overview] Enhancement failed, using standard analysis:', enhancementError.message);
        enhancedAnalysis = primaryAnalysis; // Fallback to working version
        enhancementStatus.enhancement = 'failed';
      }
    } else {
      enhancementStatus.enhancement = 'disabled';
    }

    // Return in EXACT SAME FORMAT as working version (GUARANTEED COMPATIBILITY)
    return res.json({
      success: true,
      section: 'market-overview',
      slides: [{
        id: 'market-overview',
        title: 'Market Overview',
        content: enhancedAnalysis,
        type: 'analysis'
      }],
      rawData: generator.realData,
      aiAnalysis: { 
        marketAssessment: enhancedAnalysis 
      },
      enhancementStatus: enhancementStatus // Debug info
    });
    
  } catch (error) {
    console.error('[Enhanced Market Overview] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// SAFE ENHANCEMENT FUNCTIONS

/**
 * Get GPT-4 analysis (OPTIONAL ENHANCEMENT)
 */
async function getGPTAnalysis(ticker, realData, variables) {
  // Only if we have the key
  if (!process.env.REACT_APP_OPENAI_API_KEY) {
    console.log('[GPT Enhancement] API key not available');
    return null;
  }
  
  try {
    const prompt = `As a senior financial analyst, provide a concise market analysis for ${ticker}:

Current Data:
- Price: $${realData.quote?.close || 'N/A'}
- Change: ${realData.quote?.percent_change || 'N/A'}%
- Volume: ${realData.quote?.volume || 'N/A'}
- Market Cap: ${realData.statistics?.market_cap || 'N/A'}
- P/E Ratio: ${realData.statistics?.valuations_metrics?.trailing_pe || 'N/A'}

Provide a 2-3 paragraph analysis focusing on:
1. Current market positioning
2. Key valuation metrics
3. Near-term outlook

Keep it concise and data-driven.`;

    // Quick GPT call with timeout (SAFE)
    const response = await Promise.race([
      axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a senior financial analyst providing concise market analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000 // 8 second timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('GPT timeout')), 8000)
      )
    ]);
    
    console.log('[GPT Enhancement] Analysis completed');
    return response.data.choices[0].message.content;
    
  } catch (error) {
    console.log('[GPT Enhancement] Skipped:', error.message);
    return null;
  }
}

/**
 * Get Perplexity news context (OPTIONAL ENHANCEMENT)
 */
async function getPerplexityNews(ticker) {
  // Only if we have the key
  if (!process.env.REACT_APP_PERPLEXITY_API_KEY) {
    console.log('[Perplexity Enhancement] API key not available');
    return null;
  }
  
  try {
    const query = `${ticker} stock latest news market analysis ${new Date().getFullYear()}`;
    
    // Quick Perplexity call with timeout (SAFE)
    const response = await Promise.race([
      axios.post('https://api.perplexity.ai/chat/completions', {
        model: 'sonar-medium-online',
        messages: [
          { role: 'system', content: 'Provide a brief summary of recent market news and sentiment.' },
          { role: 'user', content: `Summarize recent news and market sentiment for ${ticker} in 2-3 sentences.` }
        ],
        temperature: 0.1,
        max_tokens: 500,
        search_recency_filter: 'month'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 8000 // 8 second timeout
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Perplexity timeout')), 8000)
      )
    ]);
    
    console.log('[Perplexity Enhancement] News context completed');
    return response.data.choices[0].message.content;
    
  } catch (error) {
    console.log('[Perplexity Enhancement] Skipped:', error.message);
    return null;
  }
}

/**
 * Combine multiple AI analyses (SAFE COMBINATION)
 */
function combineAnalyses(claudeAnalysis, gptAnalysis, newsContext, ticker) {
  let combined = `# ${ticker} Market Analysis\n\n`;
  
  // Always start with Claude (PRIMARY)
  combined += `## Market Assessment\n${claudeAnalysis}\n\n`;
  
  // Add GPT perspective if available
  if (gptAnalysis) {
    combined += `## Alternative Perspective\n${gptAnalysis}\n\n`;
  }
  
  // Add news context if available
  if (newsContext) {
    combined += `## Recent Market Context\n${newsContext}\n\n`;
  }
  
  // Add synthesis if we have multiple sources
  if (gptAnalysis || newsContext) {
    combined += `## Synthesis\nThis analysis combines multiple AI perspectives with current market data to provide a comprehensive view of ${ticker}'s market position.`;
  }
  
  return combined;
}
