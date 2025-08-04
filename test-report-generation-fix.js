// test-report-generation-fix.js
// Tests the report generation to ensure all slides are created

const path = require('path');
const fs = require('fs');

// Set up environment
process.env.REACT_APP_TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '764fb86962cc46ebbe5e1c89a1761623';
process.env.NODE_ENV = 'test';

// Import the modules
const { ReportGenerator } = require('./src/reportGeneration/core/reportGenerator');
const { ComprehensiveSlideGenerator } = require('./src/reportGeneration/core/comprehensiveSlideGenerator');

async function testReportGeneration() {
  console.log('Testing Report Generation Fix...\n');
  
  try {
    // Create test config
    const config = {
      ticker: 'AAPL',
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      reportType: 'equity-research',
      reportDate: new Date().toISOString().split('T')[0],
      sections: [
        { id: 'executive-summary', title: 'Executive Summary', type: 'text', order: 1, required: true, dataRequirements: [] },
        { id: 'financial-analysis', title: 'Financial Analysis', type: 'mixed', order: 2, required: true, dataRequirements: [] },
        { id: 'valuation', title: 'Valuation Analysis', type: 'mixed', order: 3, required: true, dataRequirements: [] },
        { id: 'technical-analysis', title: 'Technical Analysis', type: 'chart', order: 4, required: true, dataRequirements: [] },
        { id: 'risk-assessment', title: 'Risk Assessment', type: 'mixed', order: 5, required: true, dataRequirements: [] },
        { id: 'recommendation', title: 'Investment Recommendation', type: 'text', order: 6, required: true, dataRequirements: [] }
      ],
      outputFormat: 'json',
      includeCharts: true
    };
    
    // Test data
    const testCompanyData = {
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
          marketCap: 3.45e12
        },
        currentPrice: 225.79,
        historicalPrices: []
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        sources: { financials: 'TwelveData' },
        quality: { overall: 0.85 }
      }
    };
    
    const testAnalysis = {
      growth: {
        revenueGrowth: 0.06,
        revenueCAGR: 0.08,
        growthScore: 0.75,
        epsGrowth: 0.09,
        ebitdaGrowth: 0.07,
        fcfGrowth: 0.10
      },
      valuation: {
        intrinsicValue: 250.00,
        marginOfSafety: 0.107,
        valuation: 'undervalued',
        industryPE: 25.5,
        industryPB: 6.2,
        industryEVEBITDA: 18.5
      },
      risk: {
        beta: 1.25,
        volatility: 0.28,
        riskScore: 0.45,
        valueAtRisk: 0.05
      },
      quality: {
        qualityScore: 0.82,
        roe: 1.38,
        roic: 0.51,
        consistency: 0.88,
        earningsQuality: 8,
        balanceSheetStrength: 7,
        moat: 'wide'
      },
      technicals: {
        trend: 'bullish',
        rsi: 58,
        macd: { signal: 'buy', histogram: 2.3 },
        support: 220,
        resistance: 235,
        trendStrength: 0.72,
        patternAnalysis: {
          patternMomentum: 0.68,
          keyPatterns: [{
            pattern: 'ascending-triangle',
            targetPrice: 245,
            confidence: 0.75
          }],
          bullishPatterns: 3,
          bearishPatterns: 1
        }
      },
      composite: {
        overall: 0.78,
        growth: 0.75,
        value: 0.82,
        quality: 0.82,
        momentum: 0.72,
        recommendation: 'buy',
        confidence: 0.85
      },
      profitability: {
        netMargin: 0.155,
        operatingMargin: 0.312,
        marginTrend: 'expanding'
      },
      sentiment: {
        score: 0.65,
        overall: 'positive',
        themes: [
          { name: 'innovation', sentiment: 0.8 },
          { name: 'growth', sentiment: 0.7 }
        ],
        temporalAnalysis: {
          trend: 'improving',
          momentum: 0.6
        }
      }
    };
    
    // Test direct slide generation
    console.log('Testing ComprehensiveSlideGenerator...');
    const slides = ComprehensiveSlideGenerator.generateAllSlides(
      testCompanyData,
      testAnalysis,
      null,
      config
    );
    
    console.log(`✓ Generated ${slides.length} slides (expected: 15-20)`);
    console.log('\nSlide titles:');
    slides.forEach((slide, index) => {
      console.log(`  ${index + 1}. ${slide.title}`);
    });
    
    // Verify slide count
    if (slides.length < 15) {
      console.error('\n❌ ERROR: Not enough slides generated!');
      console.error(`Expected at least 15 slides, but got ${slides.length}`);
      process.exit(1);
    }
    
    // Verify key slides exist
    const requiredSlides = [
      'Investment Analysis',
      'Executive Summary',
      'Investment Thesis',
      'Company Overview',
      'Financial Performance Overview',
      'Revenue & Growth Analysis',
      'Profitability Analysis',
      'Balance Sheet Strength',
      'Valuation Analysis',
      'Technical Analysis',
      'Risk Assessment',
      'Competitive Positioning',
      'Future Outlook',
      'Investment Recommendation',
      'Key Metrics Dashboard'
    ];
    
    const slideTitles = slides.map(s => s.title);
    const missingSlides = requiredSlides.filter(title => 
      !slideTitles.some(slideTitle => slideTitle.includes(title))
    );
    
    if (missingSlides.length > 0) {
      console.error('\n❌ Missing required slides:');
      missingSlides.forEach(title => console.error(`  - ${title}`));
    } else {
      console.log('\n✓ All required slides are present');
    }
    
    // Check slide content
    console.log('\nChecking slide content...');
    let contentIssues = 0;
    
    slides.forEach((slide, index) => {
      if (!slide.content || slide.content.length === 0) {
        console.error(`❌ Slide ${index + 1} (${slide.title}) has no content`);
        contentIssues++;
      }
    });
    
    if (contentIssues === 0) {
      console.log('✓ All slides have content');
    }
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total slides generated: ${slides.length}`);
    console.log(`Required slides present: ${requiredSlides.length - missingSlides.length}/${requiredSlides.length}`);
    console.log(`Slides with content: ${slides.length - contentIssues}/${slides.length}`);
    
    if (slides.length >= 15 && missingSlides.length === 0 && contentIssues === 0) {
      console.log('\n✅ SUCCESS: Report generation fix is working correctly!');
      console.log('The comprehensive slide generator is producing all expected content.');
    } else {
      console.log('\n⚠️  WARNING: Some issues remain with report generation');
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testReportGeneration();