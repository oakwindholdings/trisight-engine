#!/usr/bin/env node

// test-nvda-comprehensive-report.js
// Comprehensive NVDA report generation test with validation
// Tests all data sections and compares output quality

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  ticker: 'NVDA',
  baseUrl: 'http://localhost:3001',
  timeout: 180000, // 3 minutes
  expectedSections: [
    'companyData',
    'marketData', 
    'financialData',
    'technicalAnalysis',
    'newsAndSentiment',
    'aiAnalysis',
    'slides',
    'metadata'
  ],
  expectedSlides: [
    'title',
    'trisight_summary',
    'company_profile',
    'guidance_profile',
    'performance_profile',
    'company_news',
    'analyst_strengths',
    'analyst_weaknesses', 
    'trend_analysis',
    'income_statement',
    'balance_sheet',
    'cash_flows',
    'recommendation'
  ]
};

// Validation functions
function validateCompanyData(companyData) {
  const required = ['name', 'exchange', 'sector', 'industry', 'description'];
  const issues = [];
  
  for (const field of required) {
    if (!companyData[field]) {
      issues.push(`Missing ${field}`);
    }
  }
  
  if (companyData.description && companyData.description.length < 50) {
    issues.push('Description too short');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 20))
  };
}

function validateFinancialData(financialData) {
  const issues = [];
  let dataPoints = 0;
  
  // Check income statement
  if (!financialData.incomeStatement || financialData.incomeStatement.length === 0) {
    issues.push('No income statement data');
  } else {
    dataPoints += financialData.incomeStatement.length;
    const latest = financialData.incomeStatement[0];
    if (!latest.revenue || !latest.net_income) {
      issues.push('Missing key income statement metrics');
    }
  }
  
  // Check balance sheet
  if (!financialData.balanceSheet || financialData.balanceSheet.length === 0) {
    issues.push('No balance sheet data');
  } else {
    dataPoints += financialData.balanceSheet.length;
  }
  
  // Check cash flow
  if (!financialData.cashFlow || financialData.cashFlow.length === 0) {
    issues.push('No cash flow data');
  } else {
    dataPoints += financialData.cashFlow.length;
  }
  
  // Check earnings
  if (!financialData.earnings || financialData.earnings.length === 0) {
    issues.push('No earnings data');
  } else {
    dataPoints += financialData.earnings.length;
  }
  
  return {
    valid: issues.length <= 1, // Allow one missing section
    issues,
    dataPoints,
    score: Math.min(100, dataPoints * 5)
  };
}

function validateTechnicalData(technicalData) {
  const issues = [];
  const indicators = ['rsi', 'macd', 'sma50', 'ema200'];
  let validIndicators = 0;
  
  for (const indicator of indicators) {
    if (technicalData[indicator] && technicalData[indicator] !== null) {
      validIndicators++;
    } else {
      issues.push(`Missing ${indicator} indicator`);
    }
  }
  
  if (!technicalData.analysis) {
    issues.push('Missing technical analysis');
  }
  
  return {
    valid: validIndicators >= 2,
    issues,
    validIndicators,
    score: (validIndicators / indicators.length) * 100
  };
}

function validateMarketData(marketData) {
  const issues = [];
  const required = ['currentPrice', 'volume', 'dayHigh', 'dayLow', 'yearHigh', 'yearLow'];
  let validFields = 0;
  
  for (const field of required) {
    if (marketData[field] && marketData[field] !== null) {
      validFields++;
    } else {
      issues.push(`Missing ${field}`);
    }
  }
  
  if (!marketData.priceHistory || marketData.priceHistory.length < 50) {
    issues.push('Insufficient price history');
  }
  
  return {
    valid: validFields >= 4,
    issues,
    validFields,
    score: (validFields / required.length) * 100
  };
}

function validateSlides(slides) {
  const issues = [];
  const foundSlideTypes = new Set();
  
  if (!Array.isArray(slides)) {
    issues.push('Slides is not an array');
    return { valid: false, issues, score: 0 };
  }
  
  // Check slide count
  if (slides.length < 10) {
    issues.push(`Only ${slides.length} slides generated (expected 13)`);
  }
  
  // Check slide types
  for (const slide of slides) {
    if (!slide.type) {
      issues.push('Slide missing type');
      continue;
    }
    foundSlideTypes.add(slide.type);
    
    if (!slide.title) {
      issues.push(`Slide ${slide.type} missing title`);
    }
    
    if (!slide.content) {
      issues.push(`Slide ${slide.type} missing content`);
    }
  }
  
  // Check for required slide types
  const missingSlides = config.expectedSlides.filter(type => !foundSlideTypes.has(type));
  issues.push(...missingSlides.map(type => `Missing ${type} slide`));
  
  return {
    valid: missingSlides.length <= 2,
    issues,
    slideCount: slides.length,
    foundTypes: Array.from(foundSlideTypes),
    score: (foundSlideTypes.size / config.expectedSlides.length) * 100
  };
}

function validateAIAnalysis(aiAnalysis) {
  const issues = [];
  const required = ['executiveSummary', 'investmentThesis', 'riskAssessment', 'keyInsights', 'recommendation'];
  let validSections = 0;
  
  for (const section of required) {
    if (aiAnalysis[section]) {
      validSections++;
      
      // Check content length
      if (typeof aiAnalysis[section] === 'string' && aiAnalysis[section].length < 50) {
        issues.push(`${section} content too short`);
      }
    } else {
      issues.push(`Missing ${section}`);
    }
  }
  
  // Validate recommendation structure
  if (aiAnalysis.recommendation && typeof aiAnalysis.recommendation === 'object') {
    const recRequired = ['rating', 'targetPrice', 'timeHorizon'];
    for (const field of recRequired) {
      if (!aiAnalysis.recommendation[field]) {
        issues.push(`Recommendation missing ${field}`);
      }
    }
  }
  
  return {
    valid: validSections >= 4,
    issues,
    validSections,
    score: (validSections / required.length) * 100
  };
}

function generateReportCard(validationResults) {
  const sections = [
    { name: 'Company Data', result: validationResults.companyData },
    { name: 'Market Data', result: validationResults.marketData },
    { name: 'Financial Data', result: validationResults.financialData },
    { name: 'Technical Analysis', result: validationResults.technicalAnalysis },
    { name: 'AI Analysis', result: validationResults.aiAnalysis },
    { name: 'Slides Structure', result: validationResults.slides }
  ];
  
  let totalScore = 0;
  let sectionCount = 0;
  
  console.log('\n📊 NVDA REPORT VALIDATION RESULTS');
  console.log('=====================================');
  
  for (const section of sections) {
    const { name, result } = section;
    const status = result.valid ? '✅' : '❌';
    const score = Math.round(result.score || 0);
    
    console.log(`\n${status} ${name}: ${score}/100`);
    if (result.issues && result.issues.length > 0) {
      console.log(`   Issues: ${result.issues.join(', ')}`);
    }
    
    if (result.dataPoints) {
      console.log(`   Data points: ${result.dataPoints}`);
    }
    
    if (result.validFields) {
      console.log(`   Valid fields: ${result.validFields}`);
    }
    
    if (result.slideCount) {
      console.log(`   Slides generated: ${result.slideCount}`);
    }
    
    totalScore += score;
    sectionCount++;
  }
  
  const overallScore = Math.round(totalScore / sectionCount);
  console.log(`\n🎯 OVERALL SCORE: ${overallScore}/100`);
  
  if (overallScore >= 80) {
    console.log('🏆 EXCELLENT - Report meets high quality standards');
  } else if (overallScore >= 60) {
    console.log('👍 GOOD - Report meets basic quality standards');
  } else if (overallScore >= 40) {
    console.log('⚠️  NEEDS IMPROVEMENT - Several quality issues detected');
  } else {
    console.log('❌ POOR - Major quality issues need to be addressed');
  }
  
  return overallScore;
}

async function testReportGeneration() {
  console.log('🚀 Starting NVDA Comprehensive Report Generation Test');
  console.log('==================================================');
  
  const startTime = Date.now();
  
  try {
    console.log('\n📡 Calling comprehensive report API...');
    const response = await axios.post(`${config.baseUrl}/api/reports/generate-comprehensive`, {
      ticker: config.ticker,
      title: `${config.ticker} Comprehensive Analysis`,
      template: 'equity-research',
      author: 'TriSight Research Team',
      outputFormat: 'json'
    }, {
      timeout: config.timeout,
      validateStatus: () => true // Accept any status for analysis
    });
    
    const generationTime = Date.now() - startTime;
    console.log(`⏱️  Generation completed in ${Math.round(generationTime / 1000)}s`);
    console.log(`📊 Response status: ${response.status}`);
    
    if (response.status !== 200) {
      console.error('❌ API Error:', response.data);
      return false;
    }
    
    const fullResponse = response.data;
    const reportData = fullResponse.data || fullResponse; // Handle nested data structure
    
    // Save the report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NVDA_comprehensive_test_${timestamp}.json`;
    const filepath = path.join('./generated-reports', filename);
    
    fs.writeFileSync(filepath, JSON.stringify(fullResponse, null, 2));
    console.log(`💾 Report saved: ${filepath}`);
    
    // Validate sections
    console.log('\n🔍 Validating report sections...');
    
    const validationResults = {};
    
    // Check basic structure
    const missingTopLevel = config.expectedSections.filter(section => !reportData[section]);
    if (missingTopLevel.length > 0) {
      console.log('❌ Missing top-level sections:', missingTopLevel.join(', '));
    }
    
    // Validate each section
    if (reportData.companyData) {
      validationResults.companyData = validateCompanyData(reportData.companyData);
    }
    
    if (reportData.marketData) {
      validationResults.marketData = validateMarketData(reportData.marketData);
    }
    
    if (reportData.financialData) {
      validationResults.financialData = validateFinancialData(reportData.financialData);
    }
    
    if (reportData.technicalAnalysis) {
      validationResults.technicalAnalysis = validateTechnicalData(reportData.technicalAnalysis);
    }
    
    if (reportData.aiAnalysis) {
      validationResults.aiAnalysis = validateAIAnalysis(reportData.aiAnalysis);
    }
    
    if (reportData.slides) {
      validationResults.slides = validateSlides(reportData.slides);
    }
    
    // Generate report card
    const overallScore = generateReportCard(validationResults);
    
    // Summary statistics
    console.log('\n📈 REPORT STATISTICS');
    console.log('===================');
    console.log(`Company: ${reportData.companyData?.name || 'N/A'}`);
    console.log(`Sector: ${reportData.companyData?.sector || 'N/A'}`);
    console.log(`Current Price: $${reportData.marketData?.currentPrice || 'N/A'}`);
    console.log(`Financial Quarters: ${reportData.financialData?.incomeStatement?.length || 0}`);
    console.log(`Technical Indicators: ${validationResults.technicalAnalysis?.validIndicators || 0}/4`);
    console.log(`Slides Generated: ${reportData.slides?.length || 0}`);
    console.log(`Data Completeness: ${reportData.metadata?.dataCompleteness || 0}/100`);
    console.log(`Confidence Score: ${reportData.metadata?.confidence || 0}/100`);
    
    // PDF Generation Test (if enabled)
    if (reportData.pdfPath) {
      console.log(`📄 PDF Generated: ${reportData.pdfPath}`);
    }
    
    console.log('\n✅ Test completed successfully!');
    return overallScore >= 60;
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    
    return false;
  }
}

// Run the test
if (require.main === module) {
  testReportGeneration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testReportGeneration, validateCompanyData, validateFinancialData };