// src/reportGeneration/examples/testComprehensiveSlides.ts
// Tests the comprehensive slide generation to ensure all content is created

import { generateComprehensiveSlides } from '../core/comprehensiveSlideGenerator';
import { CompanyData, ReportConfig } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';

export async function testComprehensiveSlideGeneration() {
  console.log('Testing Comprehensive Slide Generation...\n');
  
  // Test data
  const testCompanyData: CompanyData = {
    ticker: 'AAPL',
    companyName: 'Apple Inc.',
    description: 'Apple Inc. designs, manufactures, and markets consumer electronics, software, and services.',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    financials: {
      incomeStatement: [
        {
          date: '2024-09-30',
          revenue: 94.9e9,
          netIncome: 14.7e9,
          eps: 0.97,
          grossProfit: 43.9e9,
          operatingIncome: 29.6e9
        }
      ],
      balanceSheet: [
        {
          date: '2024-09-30',
          totalAssets: 352.7e9,
          totalCurrentLiabilities: 145.3e9,
          longTermDebt: 106.5e9,
          totalShareholdersEquity: 62.1e9
        }
      ],
      keyMetrics: {
        peRatio: 30.99,
        roe: 1.38,
        debtToEquity: 1.47,
        currentRatio: 0.87,
        marketCap: 3.45e12,
        pbRatio: 55.5,
        evToEbitda: 25.2,
        interestCoverage: 29.5,
        roa: 0.22,
        roic: 0.51,
        grossMargin: 0.463,
        operatingMargin: 0.312,
        netMargin: 0.155,
        fcfMargin: 0.28,
        dividendYield: 0.0044
      },
      currentPrice: 225.79,
      historicalPrices: []
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      sources: { financials: 'TwelveData' },
      quality: { overall: 0.85 },
      employees: 161000,
      founded: '1976',
      headquarters: 'Cupertino, CA',
      website: 'apple.com',
      ceo: 'Tim Cook',
      cfo: 'Luca Maestri'
    }
  };
  
  const testAnalysis: AnalysisResults = {
    growth: {
      revenueGrowth: { yoy: 0.06, qoq: 0.02, trend: 'stable' },
      earningsGrowth: { yoy: 0.09, qoq: 0.03, trend: 'accelerating' },
      fcfGrowth: { yoy: 0.10, qoq: 0.04, trend: 'accelerating' },
      revenueCAGR: 0.08,
      growthScore: 0.75,
      epsGrowth: 0.09,
      ebitdaGrowth: 0.07
    },
    valuation: {
      intrinsicValue: 250.00,
      marginOfSafety: 0.107,
      valuation: 'undervalued',
      peRatio: 30.99,
      industryPE: 25.5,
      industryPB: 6.2,
      industryEVEBITDA: 18.5,
      dcfValue: 255.00,
      grahamValue: 145.00,
      lynchValue: 180.00,
      confidence: 0.82
    },
    risk: {
      beta: 1.25,
      volatility: 28,
      riskScore: 45,
      valueAtRisk: 5,
      maxDrawdown: 15,
      sharpeRatio: 1.8,
      downsideDeviation: 12,
      financialRisk: 4,
      operationalRisk: 3,
      marketRisk: 6
    },
    quality: {
      qualityScore: 82,
      roe: 138,
      roa: 22,
      roic: 51,
      consistency: 0.88,
      earningsQuality: 8,
      balanceSheetStrength: 7,
      moat: 'wide',
      fcfConversion: 1.15,
      accruals: -0.02,
      assetTurnover: 1.14
    },
    profitability: {
      grossMargin: 0.463,
      operatingMargin: 0.312,
      netMargin: 0.155,
      fcfMargin: 0.28,
      marginTrend: 'expanding',
      efficiency: 0.88
    },
    technicals: {
      trend: 'bullish',
      rsi: 58,
      macd: { signal: 'buy', value: 2.3, histogram: 2.3 },
      support: 220,
      resistance: 235,
      trendStrength: 0.72,
      sma20: 223.50,
      sma50: 218.75,
      sma200: 195.25,
      volume: { average: 45000000, trend: 'increasing' },
      patternAnalysis: {
        patternMomentum: 0.68,
        keyPatterns: [{
          pattern: 'ascending-triangle',
          confidence: 75,
          targetPrice: 245,
          timeframe: '2-3 months'
        }],
        bullishPatterns: 3,
        bearishPatterns: 1,
        neutralPatterns: 2
      }
    },
    sentiment: {
      score: 0.65,
      overall: 'positive',
      newsScore: 0.72,
      socialScore: 0.58,
      analystScore: 0.65,
      themes: [
        { name: 'innovation', sentiment: 0.8, weight: 0.3 },
        { name: 'growth', sentiment: 0.7, weight: 0.25 },
        { name: 'competition', sentiment: -0.3, weight: 0.15 }
      ],
      temporalAnalysis: {
        trend: 'improving',
        momentum: 0.6,
        consistency: 0.75
      }
    },
    composite: {
      overall: 0.78,
      growth: 0.75,
      value: 0.82,
      quality: 0.82,
      momentum: 0.72,
      recommendation: 'buy',
      confidence: 0.85,
      timeHorizon: '12 months'
    }
  };
  
  const config: ReportConfig = {
    ticker: 'AAPL',
    reportType: 'comprehensive',
    reportDate: new Date().toISOString().split('T')[0]
  };
  
  // Generate slides
  const slides = generateComprehensiveSlides(
    testCompanyData,
    testAnalysis,
    undefined,
    config
  );
  
  // Output results
  console.log(`Generated ${slides.length} slides\n`);
  console.log('Slide List:');
  console.log('===========');
  
  slides.forEach((slide, index) => {
    console.log(`${index + 1}. ${slide.title}`);
    console.log(`   - Layout: ${slide.layout}`);
    console.log(`   - Content blocks: ${slide.content.length}`);
  });
  
  // Verify expected slides
  const expectedCount = config.reportType === 'comprehensive' ? 19 : 16;
  console.log(`\nExpected slides: ${expectedCount}`);
  console.log(`Actual slides: ${slides.length}`);
  console.log(`Status: ${slides.length >= expectedCount ? '✅ PASS' : '❌ FAIL'}`);
  
  // Check for key slides
  const keySlides = [
    'Executive Summary',
    'Investment Thesis',
    'Financial Performance',
    'Valuation Analysis',
    'Risk Assessment',
    'Investment Recommendation'
  ];
  
  console.log('\nKey Slides Check:');
  keySlides.forEach(title => {
    const found = slides.some(slide => slide.title.includes(title));
    console.log(`${found ? '✅' : '❌'} ${title}`);
  });
  
  return {
    success: slides.length >= expectedCount,
    slideCount: slides.length,
    slides
  };
}

// Run if executed directly
if (require.main === module) {
  testComprehensiveSlideGeneration()
    .then(result => {
      console.log('\nTest completed successfully!');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}