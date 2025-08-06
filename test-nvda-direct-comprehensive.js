#!/usr/bin/env node

// test-nvda-direct-comprehensive.js
// Direct test of NVDA comprehensive report generation using the comprehensive API file
// Bypasses server routing and tests the core functionality

const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Import the comprehensive report generator directly
const comprehensiveReportHandler = require('./api/reports/generate-comprehensive.js');

// Mock request and response objects
class MockRequest {
  constructor(body, method = 'POST') {
    this.body = body;
    this.method = method;
  }
}

class MockResponse {
  constructor() {
    this.statusCode = 200;
    this.headers = {};
    this.data = null;
    this.ended = false;
  }
  
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }
  
  status(code) {
    this.statusCode = code;
    return this;
  }
  
  json(data) {
    this.data = data;
    this.ended = true;
    return this;
  }
  
  end() {
    this.ended = true;
    return this;
  }
}

// Validation functions
function validateReportStructure(reportData) {
  console.log('\n🔍 Validating Report Structure...');
  const issues = [];
  
  // Check top-level structure
  const requiredFields = ['companyData', 'marketData', 'financialData', 'technicalAnalysis', 'slides', 'metadata'];
  for (const field of requiredFields) {
    if (!reportData[field]) {
      issues.push(`Missing ${field}`);
    }
  }
  
  // Validate company data
  if (reportData.companyData) {
    if (!reportData.companyData.name || reportData.companyData.name === 'N/A') {
      issues.push('Company name not populated');
    }
    if (!reportData.companyData.description || reportData.companyData.description.length < 50) {
      issues.push('Company description insufficient');
    }
  }
  
  // Validate financial data
  if (reportData.financialData) {
    if (!reportData.financialData.incomeStatement || reportData.financialData.incomeStatement.length === 0) {
      issues.push('No income statement data');
    }
    if (!reportData.financialData.balanceSheet || reportData.financialData.balanceSheet.length === 0) {
      issues.push('No balance sheet data');
    }
    if (!reportData.financialData.cashFlow || reportData.financialData.cashFlow.length === 0) {
      issues.push('No cash flow data');
    }
  }
  
  // Validate market data
  if (reportData.marketData) {
    const marketFields = ['currentPrice', 'volume', 'yearHigh', 'yearLow'];
    for (const field of marketFields) {
      if (!reportData.marketData[field]) {
        issues.push(`Market data missing ${field}`);
      }
    }
  }
  
  // Validate slides
  if (reportData.slides) {
    if (!Array.isArray(reportData.slides)) {
      issues.push('Slides is not an array');
    } else if (reportData.slides.length < 10) {
      issues.push(`Only ${reportData.slides.length} slides generated (expected 13)`);
    }
    
    // Check for key slide types
    const expectedSlideTypes = ['title', 'trisight_summary', 'company_profile', 'income_statement', 'recommendation'];
    const foundTypes = new Set();
    
    for (const slide of reportData.slides) {
      if (slide.type) {
        foundTypes.add(slide.type);
      }
    }
    
    const missingTypes = expectedSlideTypes.filter(type => !foundTypes.has(type));
    issues.push(...missingTypes.map(type => `Missing ${type} slide`));
  }
  
  // Validate technical analysis
  if (reportData.technicalAnalysis) {
    const indicators = ['rsi', 'macd'];
    const missingIndicators = indicators.filter(indicator => !reportData.technicalAnalysis[indicator]);
    issues.push(...missingIndicators.map(indicator => `Missing ${indicator} indicator`));
  }
  
  return {
    valid: issues.length <= 3, // Allow some minor issues
    issues,
    score: Math.max(0, 100 - (issues.length * 10))
  };
}

function generateDetailedAnalysis(reportData) {
  console.log('\n📊 DETAILED REPORT ANALYSIS');
  console.log('============================');
  
  // Company Analysis
  if (reportData.companyData) {
    console.log(`\n🏢 Company: ${reportData.companyData.name || 'N/A'}`);
    console.log(`   Sector: ${reportData.companyData.sector || 'N/A'}`);
    console.log(`   Industry: ${reportData.companyData.industry || 'N/A'}`);
    console.log(`   Description Length: ${(reportData.companyData.description || '').length} chars`);
    console.log(`   Market Cap: ${reportData.companyData.marketCap || 'N/A'}`);
  }
  
  // Market Data Analysis
  if (reportData.marketData) {
    console.log(`\n📈 Market Data:`);
    console.log(`   Current Price: $${reportData.marketData.currentPrice || 'N/A'}`);
    console.log(`   Day Change: ${reportData.marketData.changePercent || 'N/A'}%`);
    console.log(`   Volume: ${reportData.marketData.volume?.toLocaleString() || 'N/A'}`);
    console.log(`   52W Range: $${reportData.marketData.yearLow || 'N/A'} - $${reportData.marketData.yearHigh || 'N/A'}`);
    console.log(`   Price History Points: ${reportData.marketData.priceHistory?.length || 0}`);
  }
  
  // Financial Data Analysis
  if (reportData.financialData) {
    console.log(`\n💰 Financial Data:`);
    console.log(`   Income Statement Quarters: ${reportData.financialData.incomeStatement?.length || 0}`);
    console.log(`   Balance Sheet Quarters: ${reportData.financialData.balanceSheet?.length || 0}`);
    console.log(`   Cash Flow Quarters: ${reportData.financialData.cashFlow?.length || 0}`);
    console.log(`   Earnings Reports: ${reportData.financialData.earnings?.length || 0}`);
    
    // Latest financial highlights
    const latestIncome = reportData.financialData.incomeStatement?.[0];
    if (latestIncome) {
      console.log(`   Latest Revenue: ${latestIncome.revenue ? `$${(latestIncome.revenue / 1e9).toFixed(2)}B` : 'N/A'}`);
      console.log(`   Latest Net Income: ${latestIncome.net_income ? `$${(latestIncome.net_income / 1e9).toFixed(2)}B` : 'N/A'}`);
      console.log(`   Latest EPS: ${latestIncome.eps || 'N/A'}`);
    }
  }
  
  // Technical Analysis
  if (reportData.technicalAnalysis) {
    console.log(`\n📊 Technical Analysis:`);
    console.log(`   RSI: ${reportData.technicalAnalysis.rsi?.rsi || 'N/A'}`);
    console.log(`   MACD: ${reportData.technicalAnalysis.macd?.macd || 'N/A'}`);
    console.log(`   SMA 50: ${reportData.technicalAnalysis.sma50?.sma || 'N/A'}`);
    console.log(`   EMA 200: ${reportData.technicalAnalysis.ema200?.ema || 'N/A'}`);
    console.log(`   Analysis Signal: ${reportData.technicalAnalysis.analysis?.signal || 'N/A'}`);
  }
  
  // AI Analysis
  if (reportData.aiAnalysis) {
    console.log(`\n🧠 AI Analysis:`);
    console.log(`   Executive Summary Length: ${(reportData.aiAnalysis.executiveSummary || '').length} chars`);
    console.log(`   Investment Thesis Length: ${(reportData.aiAnalysis.investmentThesis || '').length} chars`);
    console.log(`   Key Insights: ${reportData.aiAnalysis.keyInsights?.length || 0} points`);
    console.log(`   Recommendation: ${reportData.aiAnalysis.recommendation?.rating || 'N/A'}`);
    console.log(`   Target Price: $${reportData.aiAnalysis.recommendation?.targetPrice || 'N/A'}`);
  }
  
  // Slides Analysis
  if (reportData.slides) {
    console.log(`\n📋 Slides Analysis:`);
    console.log(`   Total Slides: ${reportData.slides.length}`);
    
    const slideTypes = {};
    for (const slide of reportData.slides) {
      slideTypes[slide.type] = (slideTypes[slide.type] || 0) + 1;
    }
    
    console.log(`   Slide Types:`, Object.keys(slideTypes).join(', '));
  }
  
  // Metadata Analysis
  if (reportData.metadata) {
    console.log(`\n📊 Metadata:`);
    console.log(`   Data Completeness: ${reportData.metadata.dataCompleteness || 0}/100`);
    console.log(`   Confidence Score: ${reportData.metadata.confidence || 0}/100`);
    console.log(`   Generated At: ${reportData.metadata.generatedAt || 'N/A'}`);
  }
}

async function runDirectComprehensiveTest() {
  console.log('🚀 DIRECT NVDA COMPREHENSIVE REPORT TEST');
  console.log('==========================================');
  
  const startTime = Date.now();
  
  try {
    // Create mock request for NVDA comprehensive report
    const mockReq = new MockRequest({
      ticker: 'NVDA',
      title: 'NVDA Comprehensive Analysis',
      template: 'equity-research',
      author: 'TriSight Research Team',
      outputFormat: 'pdf'
    });
    
    const mockRes = new MockResponse();
    
    console.log('\n📡 Calling comprehensive report handler directly...');
    console.log(`   Ticker: ${mockReq.body.ticker}`);
    console.log(`   Output Format: ${mockReq.body.outputFormat}`);
    
    // Call the comprehensive report handler
    await comprehensiveReportHandler(mockReq, mockRes);
    
    const generationTime = Date.now() - startTime;
    console.log(`⏱️  Generation completed in ${Math.round(generationTime / 1000)}s`);
    
    if (!mockRes.ended) {
      console.error('❌ Response not ended - handler may have failed');
      return false;
    }
    
    if (mockRes.statusCode !== 200) {
      console.error('❌ Non-200 status code:', mockRes.statusCode);
      console.error('Response data:', mockRes.data);
      return false;
    }
    
    const reportData = mockRes.data;
    
    if (!reportData || !reportData.success) {
      console.error('❌ Report generation failed:', reportData?.error || 'Unknown error');
      return false;
    }
    
    // Save the report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NVDA_comprehensive_direct_${timestamp}.json`;
    const filepath = path.join('./generated-reports', filename);
    
    // Ensure directory exists
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    console.log(`💾 Report saved: ${filepath}`);
    
    // Validate the report structure
    const validation = validateReportStructure(reportData);
    
    console.log(`\n✅ VALIDATION RESULTS:`);
    console.log(`   Overall Score: ${validation.score}/100`);
    console.log(`   Status: ${validation.valid ? '✅ VALID' : '❌ ISSUES FOUND'}`);
    
    if (validation.issues.length > 0) {
      console.log(`   Issues Found:`);
      validation.issues.forEach(issue => console.log(`     - ${issue}`));
    }
    
    // Generate detailed analysis
    generateDetailedAnalysis(reportData);
    
    // Check for PDF generation
    if (reportData.pdfPath && fs.existsSync(reportData.pdfPath)) {
      const pdfStats = fs.statSync(reportData.pdfPath);
      console.log(`\n📄 PDF Generated:`);
      console.log(`   Path: ${reportData.pdfPath}`);
      console.log(`   Size: ${(pdfStats.size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    // Final assessment
    console.log(`\n🎯 FINAL ASSESSMENT:`);
    if (validation.score >= 80) {
      console.log('🏆 EXCELLENT - Report meets high quality standards');
    } else if (validation.score >= 60) {
      console.log('👍 GOOD - Report meets basic requirements with minor issues');
    } else if (validation.score >= 40) {
      console.log('⚠️  NEEDS IMPROVEMENT - Several important sections missing or incomplete');
    } else {
      console.log('❌ POOR - Major issues prevent report from meeting standards');
    }
    
    console.log('\n✅ Direct comprehensive test completed!');
    return validation.score >= 60;
    
  } catch (error) {
    console.error('\n❌ Direct test failed with error:');
    console.error('Error:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

// Run the test
if (require.main === module) {
  runDirectComprehensiveTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { runDirectComprehensiveTest };