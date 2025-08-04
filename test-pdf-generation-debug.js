// Test PDF generation with debugging
// Import built modules from dist
const fs = require('fs');
const path = require('path');

// Since we can't directly import TS files, let's create a simple test
// that calls the API endpoint instead

async function testPDFGeneration() {
  console.log('Testing PDF generation with comprehensive slides...\n');

  // Create mock data
  const mockCompanyData = {
    ticker: 'TEST',
    companyName: 'Test Company Inc.',
    description: 'A test company for debugging PDF generation',
    sector: 'Technology',
    industry: 'Software',
    exchange: 'NASDAQ',
    financials: {
      currentPrice: 150,
      historicalPrices: [],
      incomeStatement: [
        {
          date: '2024-12-31',
          revenue: 100000000,
          netIncome: 20000000,
          grossProfit: 60000000,
          operatingIncome: 30000000,
          eps: 2.5
        }
      ],
      balanceSheet: [
        {
          date: '2024-12-31',
          totalAssets: 500000000,
          totalLiabilities: 200000000,
          totalShareholdersEquity: 300000000,
          totalCurrentLiabilities: 50000000,
          longTermDebt: 100000000
        }
      ],
      keyMetrics: {
        peRatio: 25,
        pbRatio: 3.5,
        evToEbitda: 15,
        marketCap: 10000000000,
        roe: 0.15,
        roa: 0.08,
        roic: 0.12,
        currentRatio: 2.5,
        debtToEquity: 0.67,
        interestCoverage: 5,
        grossMargin: 0.6,
        operatingMargin: 0.3,
        netMargin: 0.2,
        fcfMargin: 0.15,
        dividendYield: 0.02
      }
    },
    metadata: {
      lastUpdated: new Date().toISOString(),
      sources: {},
      quality: { overall: 0.85 }
    }
  };

  const mockAnalysis = {
    composite: {
      overall: 0.75,
      growth: 0.8,
      value: 0.7,
      quality: 0.85,
      momentum: 0.65,
      recommendation: 'buy',
      confidence: 0.9
    },
    growth: {
      revenueGrowth: 0.15,
      revenueCAGR: 0.12,
      epsGrowth: 0.18,
      ebitdaGrowth: 0.14,
      fcfGrowth: 0.16,
      growthScore: 0.8,
      revenueGrowth: { yoy: 0.15, trend: 'accelerating' }
    },
    valuation: {
      intrinsicValue: 180,
      marginOfSafety: 0.2,
      valuation: 'undervalued',
      industryPE: 30,
      industryPB: 4,
      industryEVEBITDA: 18
    },
    quality: {
      qualityScore: 0.85,
      moat: 'wide',
      consistency: 0.9,
      roic: 0.12
    },
    risk: {
      riskScore: 0.3,
      beta: 1.1,
      volatility: 0.25,
      valueAtRisk: -0.05
    },
    technicals: {
      rsi: 55,
      macd: { signal: 'bullish', histogram: 0.5 },
      support: 140,
      resistance: 160,
      trend: 'uptrend',
      trendStrength: 0.7
    }
  };

  const mockConfig = {
    ticker: 'TEST',
    reportType: 'comprehensive',
    outputFormat: 'pdf',
    includeAI: false,
    companyData: mockCompanyData,
    analysis: mockAnalysis
  };

  try {
    // Generate slides using comprehensive generator
    console.log('Generating comprehensive slides...');
    const slides = ComprehensiveSlideGenerator.generateAllSlides(
      mockCompanyData,
      mockAnalysis,
      undefined,
      mockConfig
    );
    console.log(`Generated ${slides.length} slides\n`);

    // List all slide titles
    console.log('Slide titles:');
    slides.forEach((slide, index) => {
      console.log(`  ${index + 1}. ${slide.title} (layout: ${slide.layout})`);
    });
    console.log('');

    // Create PDF engine
    console.log('Creating PDF engine...');
    const pdfEngine = new PDFEngine({
      title: 'Test Company Investment Report',
      author: 'TriSight Analytics'
    });

    // Generate PDF
    console.log('Generating PDF...');
    const pdfData = await pdfEngine.generatePDF(
      mockCompanyData,
      mockAnalysis,
      slides,
      [] // No charts for this test
    );

    // Save PDF
    const outputPath = path.join(__dirname, 'generated-reports', 'TEST_debug_report.pdf');
    console.log(`Saving PDF to: ${outputPath}`);
    
    fs.writeFileSync(outputPath, Buffer.from(pdfData));
    console.log(`PDF saved successfully! Size: ${(pdfData.length / 1024).toFixed(1)} KB`);

    // Check if file exists and size
    const stats = fs.statSync(outputPath);
    console.log(`File size on disk: ${(stats.size / 1024).toFixed(1)} KB`);

  } catch (error) {
    console.error('Error during PDF generation:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testPDFGeneration();