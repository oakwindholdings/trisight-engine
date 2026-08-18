// src/reportGeneration/examples/sentimentAnalysisDemo.ts
// Demonstrates sentiment analysis capabilities for financial text
// Context: Shows how to extract market sentiment, themes, and entities from news and transcripts

import { createDataFetcher } from '../core/dataFetcher';
import { createSentimentAnalysisEngine } from '../processing/sentimentAnalysis';
import { createDataProcessor } from '../processing/dataProcessor';
import { NewsItem, TranscriptData } from '../models/reportTypes';

/**
 * Demonstrates sentiment analysis on real financial news
 * Shows how sentiment affects investment decisions
 */
async function demonstrateSentimentAnalysis(ticker: string = 'AAPL') {
  console.log(`\n💭 Sentiment Analysis for ${ticker}\n`);
  
  try {
    // Step 1: Fetch company data including news and transcripts
    console.log('Fetching company data...');
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    if (!companyData.news || companyData.news.length === 0) {
      console.log('No news data available for sentiment analysis');
      return;
    }
    
    // Step 2: Initialize sentiment analysis engine
    const sentimentEngine = createSentimentAnalysisEngine({
      enableEntityExtraction: true,
      enableThemeDetection: true,
      enableTemporalAnalysis: true
    });
    
    // Step 3: Analyze news sentiment
    console.log(`\n📰 Analyzing ${companyData.news.length} news articles...\n`);
    const newsSentiment = await sentimentEngine.analyzeNews(companyData.news);
    
    // Display news sentiment results
    console.log('📊 NEWS SENTIMENT ANALYSIS');
    console.log('═'.repeat(50));
    console.log(`Overall Sentiment: ${newsSentiment.overall.toUpperCase()}`);
    console.log(`Sentiment Score: ${newsSentiment.score.toFixed(3)} (-1 to 1 scale)`);
    console.log(`Confidence: ${(newsSentiment.confidence * 100).toFixed(1)}%`);
    console.log(`\nSummary: ${newsSentiment.summary}`);
    
    // Display dimensional analysis
    console.log('\n📈 SENTIMENT DIMENSIONS');
    console.log('─'.repeat(50));
    Object.entries(newsSentiment.dimensions).forEach(([dimension, score]) => {
      const formattedDim = dimension.replace(/([A-Z])/g, ' $1').trim();
      const bar = '█'.repeat(Math.max(0, Math.round((score + 1) * 10)));
      console.log(`${formattedDim.padEnd(15)} ${score.toFixed(2).padStart(6)} ${bar}`);
    });
    
    // Display key themes
    if (newsSentiment.themes.length > 0) {
      console.log('\n🎯 KEY THEMES');
      console.log('─'.repeat(50));
      newsSentiment.themes.slice(0, 5).forEach((theme, idx) => {
        console.log(`\n${idx + 1}. ${theme.name.toUpperCase()}`);
        console.log(`   Mentions: ${theme.mentions} | Relevance: ${(theme.relevance * 100).toFixed(1)}%`);
        console.log(`   Sentiment: ${theme.sentiment > 0 ? '✅ Positive' : theme.sentiment < 0 ? '❌ Negative' : '➖ Neutral'}`);
        if (theme.examples.length > 0) {
          console.log(`   Example: "${theme.examples[0].substring(0, 80)}..."`);
        }
      });
    }
    
    // Display top entities
    if (newsSentiment.entities.length > 0) {
      console.log('\n🏢 TOP ENTITIES MENTIONED');
      console.log('─'.repeat(50));
      console.log('Entity'.padEnd(20) + 'Type'.padEnd(12) + 'Mentions'.padEnd(10) + 'Sentiment');
      console.log('─'.repeat(50));
      
      newsSentiment.entities.slice(0, 10).forEach(entity => {
        const sentiment = entity.sentiment > 0 ? '🟢' : entity.sentiment < 0 ? '🔴' : '⚪';
        console.log(
          entity.name.padEnd(20) +
          entity.type.padEnd(12) +
          entity.mentions.toString().padEnd(10) +
          sentiment + ' ' + entity.sentiment.toFixed(2)
        );
      });
    }
    
    // Display key phrases
    if (newsSentiment.keyPhrases.length > 0) {
      console.log('\n💬 KEY PHRASES');
      console.log('─'.repeat(50));
      newsSentiment.keyPhrases.slice(0, 10).forEach(phrase => {
        const sentiment = phrase.sentiment > 0 ? '✅' : phrase.sentiment < 0 ? '❌' : '➖';
        console.log(`${sentiment} "${phrase.phrase}" (freq: ${phrase.frequency}, importance: ${(phrase.importance * 100).toFixed(0)}%)`);
      });
    }
    
    // Display emotion breakdown
    console.log('\n😊 EMOTIONAL TONE');
    console.log('─'.repeat(50));
    Object.entries(newsSentiment.emotions).forEach(([emotion, value]) => {
      const percentage = (value * 100).toFixed(1);
      const bar = '▓'.repeat(Math.round(value * 20));
      console.log(`${emotion.padEnd(12)} ${percentage.padStart(5)}% ${bar}`);
    });
    
    // Step 4: Analyze transcript sentiment if available
    if (companyData.transcripts && companyData.transcripts.length > 0) {
      console.log(`\n\n📄 Analyzing ${companyData.transcripts.length} earnings transcripts...\n`);
      const transcriptSentiment = await sentimentEngine.analyzeTranscripts(companyData.transcripts);
      
      console.log('🎙️ TRANSCRIPT SENTIMENT ANALYSIS');
      console.log('═'.repeat(50));
      console.log(`Management Tone: ${transcriptSentiment.overall.toUpperCase()}`);
      console.log(`Sentiment Score: ${transcriptSentiment.score.toFixed(3)}`);
      console.log(`Forward-Looking Confidence: ${((transcriptSentiment.dimensions.forwardLookingConfidence || 0) * 100).toFixed(1)}%`);
      console.log(`Guidance Quality: ${((transcriptSentiment.dimensions.guidanceQuality || 0) * 100).toFixed(1)}%`);
      
      // Compare news vs transcript sentiment
      console.log('\n🔄 SENTIMENT ALIGNMENT');
      console.log('─'.repeat(50));
      const alignment = Math.sign(newsSentiment.score) === Math.sign(transcriptSentiment.score);
      console.log(`Market Perception: ${newsSentiment.overall.toUpperCase()} (${newsSentiment.score.toFixed(2)})`);
      console.log(`Management Tone: ${transcriptSentiment.overall.toUpperCase()} (${transcriptSentiment.score.toFixed(2)})`);
      console.log(`Alignment: ${alignment ? '✅ ALIGNED' : '⚠️  DIVERGENT'}`);
      
      if (!alignment) {
        console.log('\n⚠️  Warning: Divergent sentiment between market perception and management communication');
        console.log('This could indicate:');
        console.log('- Market skepticism about management claims');
        console.log('- Information asymmetry');
        console.log('- Upcoming surprises (positive or negative)');
      }
    }
    
    // Step 5: Show temporal sentiment trends if available
    if (newsSentiment.temporalAnalysis) {
      console.log('\n📈 SENTIMENT TREND ANALYSIS');
      console.log('═'.repeat(50));
      const { trend, momentum, volatility, changes } = newsSentiment.temporalAnalysis;
      
      console.log(`Trend: ${trend.toUpperCase()}`);
      console.log(`Momentum: ${momentum > 0 ? '+' : ''}${momentum.toFixed(3)}`);
      console.log(`Volatility: ${volatility.toFixed(3)}`);
      
      if (changes.length > 0) {
        console.log('\nSignificant Sentiment Changes:');
        changes.forEach(change => {
          const direction = change.toScore > change.fromScore ? '📈' : '📉';
          console.log(`${direction} ${change.date}: ${change.fromScore.toFixed(2)} → ${change.toScore.toFixed(2)} (${change.magnitude.toFixed(2)} change)`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Sentiment analysis failed:', error);
  }
}

/**
 * Demonstrates integrated sentiment analysis with financial data
 * Shows how sentiment affects overall investment recommendation
 */
async function demonstrateIntegratedAnalysis(ticker: string = 'NVDA') {
  console.log(`\n🔗 Integrated Analysis with Sentiment for ${ticker}\n`);
  
  try {
    // Use data processor for integrated analysis
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true
    });
    
    const fetcher = createDataFetcher({ ticker });
    const rawData = await fetcher.fetchAll(ticker);
    
    console.log('Processing data with sentiment analysis...\n');
    const { analysis } = await processor.processData(rawData);
    
    // Display integrated results
    console.log('🎯 INTEGRATED ANALYSIS RESULTS');
    console.log('═'.repeat(50));
    
    // Financial metrics
    console.log('\n💰 Financial Health:');
    console.log(`├─ Growth Score: ${analysis.growth.compositeScore}/100`);
    console.log(`├─ Valuation: ${analysis.valuation.valuation.toUpperCase()}`);
    console.log(`├─ Risk Score: ${analysis.risk.riskScore}/100`);
    console.log(`└─ Quality Score: ${analysis.quality.qualityScore}/100`);
    
    // Technical indicators
    console.log('\n📊 Technical Position:');
    console.log(`├─ Trend: ${analysis.technicals.trend.toUpperCase()}`);
    console.log(`├─ Momentum: ${analysis.composite.momentum}/100`);
    console.log(`└─ Pattern Count: ${analysis.technicals.patternAnalysis?.patternCount || 0}`);
    
    // Sentiment analysis
    if (analysis.sentiment) {
      console.log('\n💭 Market Sentiment:');
      console.log(`├─ Overall: ${(analysis.sentiment as any).overall.toUpperCase()}`);
      console.log(`├─ Score: ${analysis.sentiment.score.toFixed(2)}`);
      console.log(`├─ Confidence: ${(analysis.sentiment.confidence * 100).toFixed(0)}%`);
      
      if (analysis.sentiment.themes && analysis.sentiment.themes.length > 0) {
        console.log(`└─ Top Themes: ${analysis.sentiment.themes.slice(0, 3).map(t => t.name).join(', ')}`);
      }
    }
    
    // Composite recommendation
    console.log('\n🎯 INVESTMENT RECOMMENDATION');
    console.log('═'.repeat(50));
    console.log(`Overall Score: ${analysis.composite.overall}/100`);
    console.log(`Recommendation: ${analysis.composite.recommendation.toUpperCase()}`);
    console.log(`Confidence: ${analysis.composite.confidence}%`);
    
    // Sentiment impact on recommendation
    if (analysis.sentiment) {
      const sentimentImpact = analysis.sentiment.overall === 'positive' ? '📈 Positive boost' :
                            analysis.sentiment.overall === 'negative' ? '📉 Negative drag' :
                            '➖ Neutral impact';
      console.log(`\nSentiment Impact: ${sentimentImpact}`);
      
      // Check for red flags
      if (analysis.sentiment.overall === 'negative' && analysis.composite.recommendation === 'buy') {
        console.log('\n⚠️  Caution: Negative sentiment despite positive fundamentals');
        console.log('Consider waiting for sentiment to improve before investing.');
      } else if (analysis.sentiment.overall === 'positive' && analysis.composite.recommendation === 'sell') {
        console.log('\n⚠️  Note: Positive sentiment despite weak fundamentals');
        console.log('Market may be overly optimistic - be cautious.');
      }
    }
    
  } catch (error) {
    console.error('❌ Integrated analysis failed:', error);
  }
}

/**
 * Demonstrates real-time sentiment monitoring
 * Shows how to track sentiment changes for trading decisions
 */
async function demonstrateSentimentMonitoring(tickers: string[] = ['AAPL', 'MSFT', 'GOOGL']) {
  console.log('\n📡 Multi-Stock Sentiment Monitor\n');
  
  const sentimentEngine = createSentimentAnalysisEngine();
  const results: Array<{
    ticker: string;
    sentiment: string;
    score: number;
    trend?: string;
    topTheme?: string;
  }> = [];
  
  for (const ticker of tickers) {
    try {
      console.log(`\nAnalyzing ${ticker}...`);
      
      const fetcher = createDataFetcher({ ticker });
      const data = await fetcher.fetchAll(ticker);
      
      if (data.news && data.news.length > 0) {
        const sentiment = await sentimentEngine.analyzeNews(data.news);
        
        results.push({
          ticker,
          sentiment: sentiment.overall,
          score: sentiment.score,
          trend: sentiment.temporalAnalysis?.trend,
          topTheme: sentiment.themes[0]?.name
        });
        
        console.log(`✓ ${ticker}: ${sentiment.overall} (${sentiment.score.toFixed(2)})`);
      } else {
        console.log(`✗ ${ticker}: No news data available`);
      }
      
    } catch (error) {
      console.log(`✗ ${ticker}: Analysis failed`);
    }
  }
  
  // Display sentiment dashboard
  console.log('\n\n📊 SENTIMENT DASHBOARD');
  console.log('═'.repeat(70));
  console.log('Ticker | Sentiment | Score  | Trend      | Top Theme');
  console.log('─'.repeat(70));
  
  results.forEach(result => {
    const sentimentEmoji = result.sentiment === 'positive' ? '🟢' :
                          result.sentiment === 'negative' ? '🔴' : '⚪';
    const trendEmoji = result.trend === 'improving' ? '📈' :
                      result.trend === 'declining' ? '📉' : '➡️';
    
    console.log(
      `${result.ticker.padEnd(6)} | ` +
      `${sentimentEmoji} ${result.sentiment.padEnd(8)} | ` +
      `${result.score.toFixed(2).padStart(6)} | ` +
      `${trendEmoji} ${(result.trend || 'stable').padEnd(9)} | ` +
      `${result.topTheme || 'N/A'}`
    );
  });
  
  // Investment signals based on sentiment
  console.log('\n\n💡 SENTIMENT-BASED SIGNALS');
  console.log('═'.repeat(50));
  
  const bullishStocks = results.filter(r => r.sentiment === 'positive' && r.trend === 'improving');
  const bearishStocks = results.filter(r => r.sentiment === 'negative' && r.trend === 'declining');
  
  if (bullishStocks.length > 0) {
    console.log('\n🟢 BULLISH OPPORTUNITIES (Positive + Improving):');
    bullishStocks.forEach(stock => {
      console.log(`   ${stock.ticker} - Score: ${stock.score.toFixed(2)}, Theme: ${stock.topTheme}`);
    });
  }
  
  if (bearishStocks.length > 0) {
    console.log('\n🔴 BEARISH WARNINGS (Negative + Declining):');
    bearishStocks.forEach(stock => {
      console.log(`   ${stock.ticker} - Score: ${stock.score.toFixed(2)}, Theme: ${stock.topTheme}`);
    });
  }
}

// Run demonstrations
if (require.main === module) {
  const mode = process.argv[2] || 'single';
  const ticker = process.argv[3] || 'AAPL';
  
  switch (mode) {
    case 'integrated':
      // Integrated analysis with sentiment
      demonstrateIntegratedAnalysis(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'monitor':
      // Multi-stock sentiment monitoring
      const tickers = process.argv.slice(3).length > 0 
        ? process.argv.slice(3) 
        : ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA'];
      demonstrateSentimentMonitoring(tickers)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      // Single stock sentiment analysis
      demonstrateSentimentAnalysis(ticker)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
  }
}

export {
  demonstrateSentimentAnalysis,
  demonstrateIntegratedAnalysis,
  demonstrateSentimentMonitoring
};