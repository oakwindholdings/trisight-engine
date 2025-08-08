// api/reports/utils/multi-model-enhancer.js
// Reusable Multi-Model Enhancement Pattern
// Extracted from successful market-overview-enhanced.js implementation

const axios = require('axios');

/**
 * SAFE MULTI-MODEL ENHANCEMENT PATTERN
 * 
 * Pattern that worked in Phase 1:
 * 1. Always start with working Claude analysis (PRIMARY)
 * 2. Optionally add GPT-4 perspective (SECONDARY)
 * 3. Optionally add Perplexity news context (TERTIARY)
 * 4. Graceful fallbacks at every level
 * 5. Timeout protection (8 seconds max)
 * 6. Return in same format as original
 */
class MultiModelEnhancer {
  constructor(options = {}) {
    this.timeout = options.timeout || 8000; // 8 second timeout
    this.models = {
      gpt: options.enableGPT ?? false,
      perplexity: options.enablePerplexity ?? false
    };
    this.debug = options.debug ?? true;
  }

  /**
   * MAIN ENHANCEMENT METHOD
   * Uses the exact pattern that worked in market-overview-enhanced.js
   */
  async enhance(primaryAnalysis, ticker, realData, sectionType = 'analysis') {
    const enhancementStatus = { claude: 'success' };
    let enhancedAnalysis = primaryAnalysis;

    // Only enhance if multi-model is enabled
    if (!this.models.gpt && !this.models.perplexity) {
      enhancementStatus.enhancement = 'disabled';
      return { analysis: enhancedAnalysis, status: enhancementStatus };
    }

    if (this.debug) {
      console.log(`[Multi-Model Enhancer] Starting enhancement for ${ticker} (${sectionType})`);
    }

    try {
      const enhancements = {};

      // Try GPT-4 enhancement (OPTIONAL)
      if (this.models.gpt) {
        const gptAnalysis = await this.getGPTAnalysis(ticker, realData, sectionType);
        if (gptAnalysis) {
          enhancements.gpt = gptAnalysis;
          enhancementStatus.gpt = 'success';
          if (this.debug) console.log(`[Multi-Model Enhancer] GPT analysis added`);
        } else {
          enhancementStatus.gpt = 'skipped';
        }
      }

      // Try Perplexity news context (OPTIONAL)
      if (this.models.perplexity) {
        const newsContext = await this.getPerplexityNews(ticker, sectionType);
        if (newsContext) {
          enhancements.perplexity = newsContext;
          enhancementStatus.perplexity = 'success';
          if (this.debug) console.log(`[Multi-Model Enhancer] Perplexity news added`);
        } else {
          enhancementStatus.perplexity = 'skipped';
        }
      }

      // Combine analyses if we got enhancements
      if (enhancements.gpt || enhancements.perplexity) {
        enhancedAnalysis = this.combineAnalyses(
          primaryAnalysis, 
          enhancements.gpt, 
          enhancements.perplexity, 
          ticker, 
          sectionType
        );
        if (this.debug) console.log(`[Multi-Model Enhancer] Multi-model analysis combined`);
      }

    } catch (enhancementError) {
      // IF ENHANCEMENT FAILS, FALL BACK TO WORKING ANALYSIS
      if (this.debug) {
        console.log('[Multi-Model Enhancer] Enhancement failed, using primary analysis:', enhancementError.message);
      }
      enhancedAnalysis = primaryAnalysis; // Fallback to working version
      enhancementStatus.enhancement = 'failed';
    }

    return { 
      analysis: enhancedAnalysis, 
      status: enhancementStatus 
    };
  }

  /**
   * GPT-4 ANALYSIS (OPTIONAL ENHANCEMENT)
   * Exact pattern from working market-overview-enhanced.js
   */
  async getGPTAnalysis(ticker, realData, sectionType) {
    // Only if we have the key
    if (!process.env.REACT_APP_OPENAI_API_KEY) {
      if (this.debug) console.log('[GPT Enhancement] API key not available');
      return null;
    }

    try {
      const prompt = this.buildGPTPrompt(ticker, realData, sectionType);

      // Quick GPT call with timeout (SAFE)
      const response = await Promise.race([
        axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: 'system', content: this.getGPTSystemPrompt(sectionType) },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 1000
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('GPT timeout')), this.timeout)
        )
      ]);

      if (this.debug) console.log('[GPT Enhancement] Analysis completed');
      return response.data.choices[0].message.content;

    } catch (error) {
      if (this.debug) console.log('[GPT Enhancement] Skipped:', error.message);
      return null;
    }
  }

  /**
   * PERPLEXITY NEWS CONTEXT (OPTIONAL ENHANCEMENT)
   * Exact pattern from working market-overview-enhanced.js
   */
  async getPerplexityNews(ticker, sectionType) {
    // Only if we have the key
    if (!process.env.REACT_APP_PERPLEXITY_API_KEY) {
      if (this.debug) console.log('[Perplexity Enhancement] API key not available');
      return null;
    }

    try {
      const query = this.buildPerplexityQuery(ticker, sectionType);

      // Quick Perplexity call with timeout (SAFE)
      const response = await Promise.race([
        axios.post('https://api.perplexity.ai/chat/completions', {
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: 'You are a financial analyst providing market insights.' },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
          max_tokens: 1000
        }, {
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: this.timeout
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Perplexity timeout')), this.timeout)
        )
      ]);

      if (this.debug) console.log('[Perplexity Enhancement] News context completed');
      return response.data.choices[0].message.content;

    } catch (error) {
      if (this.debug) console.log('[Perplexity Enhancement] Skipped:', error.message);
      return null;
    }
  }

  /**
   * COMBINE ANALYSES (SAFE COMBINATION)
   * Exact pattern from working market-overview-enhanced.js
   */
  combineAnalyses(claudeAnalysis, gptAnalysis, newsContext, ticker, sectionType) {
    let combined = `# ${ticker} ${this.getSectionTitle(sectionType)}\n\n`;

    // Always start with Claude (PRIMARY)
    combined += `## Primary Analysis\n${claudeAnalysis}\n\n`;

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
      combined += `## Synthesis\nThis analysis combines multiple AI perspectives with current market data to provide a comprehensive view of ${ticker}'s ${sectionType.toLowerCase()}.`;
    }

    return combined;
  }

  // HELPER METHODS FOR DIFFERENT SECTION TYPES

  buildGPTPrompt(ticker, realData, sectionType) {
    const baseData = `
Current Data:
- Price: $${realData.quote?.close || 'N/A'}
- Change: ${realData.quote?.percent_change || 'N/A'}%
- Volume: ${realData.quote?.volume || 'N/A'}
- Market Cap: ${realData.statistics?.market_cap || 'N/A'}
- P/E Ratio: ${realData.statistics?.valuations_metrics?.trailing_pe || 'N/A'}`;

    switch (sectionType) {
      case 'market-overview':
        return `As a senior financial analyst, provide a concise market analysis for ${ticker}:${baseData}

Provide a 2-3 paragraph analysis focusing on:
1. Current market positioning
2. Key valuation metrics  
3. Near-term outlook

Keep it concise and data-driven.`;

      case 'financial-analysis':
        return `As a senior financial analyst, provide a concise financial analysis for ${ticker}:${baseData}

Provide a 2-3 paragraph analysis focusing on:
1. Financial health and profitability
2. Key financial ratios and trends
3. Investment considerations

Keep it concise and data-driven.`;

      default:
        return `As a senior financial analyst, provide a concise ${sectionType} analysis for ${ticker}:${baseData}

Provide a 2-3 paragraph analysis. Keep it concise and data-driven.`;
    }
  }

  getGPTSystemPrompt(sectionType) {
    switch (sectionType) {
      case 'market-overview':
        return 'You are a senior financial analyst providing concise market analysis.';
      case 'financial-analysis':
        return 'You are a senior financial analyst providing concise financial analysis.';
      default:
        return 'You are a senior financial analyst providing concise analysis.';
    }
  }

  buildPerplexityQuery(ticker, sectionType) {
    const year = new Date().getFullYear();
    switch (sectionType) {
      case 'market-overview':
        return `Summarize recent news and market sentiment for ${ticker} in 2-3 sentences.`;
      case 'financial-analysis':
        return `Summarize recent financial news and earnings updates for ${ticker} in 2-3 sentences.`;
      default:
        return `Summarize recent news for ${ticker} related to ${sectionType} in 2-3 sentences.`;
    }
  }

  getSectionTitle(sectionType) {
    switch (sectionType) {
      case 'market-overview':
        return 'Market Analysis';
      case 'financial-analysis':
        return 'Financial Analysis';
      default:
        return 'Analysis';
    }
  }
}

module.exports = { MultiModelEnhancer };
