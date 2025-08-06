#!/usr/bin/env node

// compare-reports.js
// Compares our generated NVDA report with existing example reports
// Provides detailed analysis of data completeness and quality

const fs = require('fs');
const path = require('path');

function analyzeReportQuality(reportData, reportName) {
  console.log(`\n📊 ANALYZING: ${reportName}`);
  console.log('='.repeat(50));
  
  let totalScore = 0;
  let sectionCount = 0;
  
  // 1. Company Data Quality (20 points)
  let companyScore = 0;
  if (reportData.companyData) {
    if (reportData.companyData.name && reportData.companyData.name !== 'N/A') companyScore += 5;
    if (reportData.companyData.description && reportData.companyData.description.length > 100) companyScore += 5;
    if (reportData.companyData.sector && reportData.companyData.sector !== 'N/A') companyScore += 3;
    if (reportData.companyData.industry && reportData.companyData.industry !== 'N/A') companyScore += 3;
    if (reportData.companyData.website || reportData.companyData.address) companyScore += 2;
    if (reportData.companyData.employees || reportData.companyData.ceo) companyScore += 2;
  }
  console.log(`   Company Data: ${companyScore}/20`);
  totalScore += companyScore;
  sectionCount++;
  
  // 2. Market Data Quality (15 points)
  let marketScore = 0;
  if (reportData.marketData) {
    if (reportData.marketData.currentPrice) marketScore += 4;
    if (reportData.marketData.volume) marketScore += 2;
    if (reportData.marketData.yearHigh && reportData.marketData.yearLow) marketScore += 3;
    if (reportData.marketData.changePercent !== undefined) marketScore += 2;
    if (reportData.marketData.priceHistory && reportData.marketData.priceHistory.length > 100) marketScore += 4;
  }
  console.log(`   Market Data: ${marketScore}/15`);
  totalScore += marketScore;
  sectionCount++;
  
  // 3. Financial Data Quality (25 points)
  let financialScore = 0;
  if (reportData.financialData) {
    if (reportData.financialData.incomeStatement && reportData.financialData.incomeStatement.length >= 4) financialScore += 8;
    if (reportData.financialData.balanceSheet && reportData.financialData.balanceSheet.length >= 4) financialScore += 8;
    if (reportData.financialData.cashFlow && reportData.financialData.cashFlow.length >= 4) financialScore += 6;
    if (reportData.financialData.earnings && reportData.financialData.earnings.length > 0) financialScore += 3;
  }
  console.log(`   Financial Data: ${financialScore}/25`);
  totalScore += financialScore;
  sectionCount++;
  
  // 4. Technical Analysis Quality (10 points)
  let technicalScore = 0;
  if (reportData.technicalAnalysis || reportData.technicalData) {
    const technical = reportData.technicalAnalysis || reportData.technicalData;
    if (technical.rsi && technical.rsi.rsi) technicalScore += 3;
    if (technical.macd && technical.macd.macd) technicalScore += 3;
    if (technical.sma50 || technical.ema200) technicalScore += 2;
    if (technical.analysis && technical.analysis.signal) technicalScore += 2;
  }
  console.log(`   Technical Analysis: ${technicalScore}/10`);
  totalScore += technicalScore;
  sectionCount++;
  
  // 5. AI Analysis Quality (15 points)
  let aiScore = 0;
  if (reportData.aiAnalysis) {
    if (reportData.aiAnalysis.executiveSummary && reportData.aiAnalysis.executiveSummary.length > 200) aiScore += 4;
    if (reportData.aiAnalysis.investmentThesis && reportData.aiAnalysis.investmentThesis.length > 200) aiScore += 4;
    if (reportData.aiAnalysis.riskAssessment) aiScore += 3;
    if (reportData.aiAnalysis.keyInsights && reportData.aiAnalysis.keyInsights.length >= 3) aiScore += 2;
    if (reportData.aiAnalysis.recommendation && reportData.aiAnalysis.recommendation.rating) aiScore += 2;
  }
  console.log(`   AI Analysis: ${aiScore}/15`);
  totalScore += aiScore;
  sectionCount++;
  
  // 6. Slides Quality (15 points)
  let slidesScore = 0;
  if (reportData.slides && Array.isArray(reportData.slides)) {
    if (reportData.slides.length >= 10) slidesScore += 5;
    if (reportData.slides.length >= 13) slidesScore += 3;
    
    // Check for key slide types
    const slideTypes = new Set(reportData.slides.map(s => s.type));
    if (slideTypes.has('title')) slidesScore += 1;
    if (slideTypes.has('trisight_summary') || slideTypes.has('summary')) slidesScore += 2;
    if (slideTypes.has('company_profile')) slidesScore += 1;
    if (slideTypes.has('income_statement')) slidesScore += 1;
    if (slideTypes.has('recommendation')) slidesScore += 2;
  }
  console.log(`   Slides Quality: ${slidesScore}/15`);
  totalScore += slidesScore;
  sectionCount++;
  
  const averageScore = totalScore / sectionCount;
  console.log(`\n   🎯 TOTAL SCORE: ${averageScore.toFixed(1)}/100`);
  
  if (averageScore >= 85) {
    console.log('   🏆 EXCELLENT - Professional grade report');
  } else if (averageScore >= 70) {
    console.log('   👍 GOOD - High quality report with minor gaps');
  } else if (averageScore >= 55) {
    console.log('   ⚠️  ADEQUATE - Meets basic standards');
  } else {
    console.log('   ❌ POOR - Significant quality issues');
  }
  
  return averageScore;
}

function compareDataCompleteness(reports) {
  console.log('\n📈 DATA COMPLETENESS COMPARISON');
  console.log('================================');
  
  const metrics = {
    'Company Name': [],
    'Company Description': [],
    'Current Price': [],
    'Financial Quarters': [],
    'Technical Indicators': [],
    'AI Analysis': [],
    'Slides Count': []
  };
  
  for (const [name, report] of Object.entries(reports)) {
    metrics['Company Name'].push({
      name,
      value: report.companyData?.name ? '✅' : '❌',
      score: report.companyData?.name ? 1 : 0
    });
    
    metrics['Company Description'].push({
      name,
      value: report.companyData?.description?.length > 100 ? '✅' : '❌',
      score: report.companyData?.description?.length > 100 ? 1 : 0
    });
    
    metrics['Current Price'].push({
      name,
      value: report.marketData?.currentPrice ? `$${report.marketData.currentPrice}` : '❌',
      score: report.marketData?.currentPrice ? 1 : 0
    });
    
    const financialQuarters = (report.financialData?.incomeStatement?.length || 0);
    metrics['Financial Quarters'].push({
      name,
      value: financialQuarters > 0 ? `${financialQuarters}Q` : '❌',
      score: financialQuarters >= 4 ? 1 : financialQuarters > 0 ? 0.5 : 0
    });
    
    const technicalData = report.technicalAnalysis || report.technicalData;
    const hasRSI = technicalData?.rsi?.rsi ? 1 : 0;
    const hasMACD = technicalData?.macd?.macd ? 1 : 0;
    const techScore = hasRSI + hasMACD;
    metrics['Technical Indicators'].push({
      name,
      value: techScore > 0 ? `${techScore}/2` : '❌',
      score: techScore / 2
    });
    
    const aiLength = (report.aiAnalysis?.executiveSummary?.length || 0) + 
                    (report.aiAnalysis?.investmentThesis?.length || 0);
    metrics['AI Analysis'].push({
      name,
      value: aiLength > 500 ? '✅' : aiLength > 200 ? '⚠️' : '❌',
      score: aiLength > 500 ? 1 : aiLength > 200 ? 0.5 : 0
    });
    
    const slidesCount = report.slides?.length || 0;
    metrics['Slides Count'].push({
      name,
      value: slidesCount > 0 ? `${slidesCount}` : '❌',
      score: slidesCount >= 13 ? 1 : slidesCount >= 10 ? 0.8 : slidesCount > 0 ? 0.5 : 0
    });
  }
  
  for (const [metric, values] of Object.entries(metrics)) {
    console.log(`\n${metric}:`);
    for (const item of values) {
      const status = item.score >= 0.8 ? '🟢' : item.score >= 0.5 ? '🟡' : '🔴';
      console.log(`   ${status} ${item.name}: ${item.value}`);
    }
  }
}

async function runComparison() {
  console.log('🔍 NVDA REPORT COMPARISON ANALYSIS');
  console.log('===================================');
  
  const reportsDir = './generated-reports';
  const reports = {};
  
  try {
    // Find the most recent NVDA reports
    const files = fs.readdirSync(reportsDir);
    const nvdaFiles = files.filter(f => 
      f.includes('NVDA') && 
      f.endsWith('.json') && 
      !f.includes('test')
    ).sort().reverse().slice(0, 3); // Get 3 most recent
    
    console.log(`\nFound ${nvdaFiles.length} NVDA report files:`);
    nvdaFiles.forEach((file, i) => console.log(`   ${i + 1}. ${file}`));
    
    // Load and analyze each report
    const scores = [];
    
    for (const file of nvdaFiles) {
      try {
        const filePath = path.join(reportsDir, file);
        const reportData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const reportName = file.replace('.json', '').replace('NVDA_', '').replace(/^\w+_/, '');
        
        reports[reportName] = reportData;
        const score = analyzeReportQuality(reportData, reportName);
        scores.push({ name: reportName, score });
        
      } catch (error) {
        console.error(`❌ Error loading ${file}:`, error.message);
      }
    }
    
    // Compare data completeness
    if (Object.keys(reports).length > 1) {
      compareDataCompleteness(reports);
    }
    
    // Summary
    console.log('\n🏆 FINAL COMPARISON SUMMARY');
    console.log('============================');
    
    scores.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < scores.length; i++) {
      const { name, score } = scores[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
      console.log(`   ${medal} ${name}: ${score.toFixed(1)}/100`);
    }
    
    if (scores.length > 0) {
      const topScore = scores[0];
      console.log(`\n✨ Best Report: ${topScore.name} (${topScore.score.toFixed(1)}/100)`);
      
      if (topScore.score >= 85) {
        console.log('🎯 CONCLUSION: Report generation is working excellently!');
      } else if (topScore.score >= 70) {
        console.log('👍 CONCLUSION: Report generation is working well with minor improvements needed');
      } else {
        console.log('⚠️  CONCLUSION: Report generation needs improvement in key areas');
      }
    }
    
  } catch (error) {
    console.error('❌ Comparison failed:', error.message);
  }
}

if (require.main === module) {
  runComparison();
}

module.exports = { analyzeReportQuality, compareDataCompleteness };