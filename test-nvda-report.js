// test-nvda-report.js
// Test script to generate NVDA report and validate fixes
// Rule: Reliability - Test all fixes systematically

const { ReportGenerator } = require('./src/reportGeneration/core/reportGenerator');
const { createDataFetcher } = require('./src/reportGeneration/core/dataFetcher');
const fs = require('fs');
const path = require('path');

async function testNVDAReportGeneration() {
  console.log('🧪 TESTING NVDA REPORT GENERATION');
  console.log('=' .repeat(50));
  
  try {
    // Step 1: Create data fetcher
    console.log('1. Creating data fetcher...');
    const dataFetcher = createDataFetcher({
      enableCache: true,
      timeout: 30000
    });
    
    // Step 2: Fetch NVDA data
    console.log('2. Fetching NVDA company data...');
    const companyData = await dataFetcher.fetchCompanyData('NVDA');
    
    console.log('✓ Company data fetched:');
    console.log(`  - Company: ${companyData.companyName}`);
    console.log(`  - Ticker: ${companyData.ticker}`);
    console.log(`  - Sector: ${companyData.sector}`);
    console.log(`  - Market Cap: $${(companyData.marketCap / 1e9).toFixed(1)}B`);
    
    // Step 3: Create report generator
    console.log('\n3. Creating report generator...');
    const reportGenerator = new ReportGenerator({
      ticker: 'NVDA',
      reportType: 'equity_research',
      outputFormat: 'pdf',
      sections: [
        'executive_summary',
        'financial_analysis', 
        'technical_analysis',
        'risk_assessment',
        'recommendation'
      ],
      includeCharts: true,
      theme: 'professional'
    });
    
    // Step 4: Generate report
    console.log('4. Generating NVDA report...');
    const startTime = Date.now();
    
    const report = await reportGenerator.generateReport();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`✅ Report generated successfully in ${duration.toFixed(1)}s`);
    console.log(`📄 Report saved to: ${report.outputPath}`);
    console.log(`📊 Generated ${report.slides?.length || 0} slides`);
    
    // Step 5: Validate report content
    console.log('\n5. Validating report content...');
    
    if (fs.existsSync(report.outputPath)) {
      const stats = fs.statSync(report.outputPath);
      console.log(`✓ File exists: ${(stats.size / 1024).toFixed(1)} KB`);
      
      // Check if file is not empty
      if (stats.size > 1000) {
        console.log('✓ File size indicates content was generated');
      } else {
        console.log('❌ File size too small - may indicate generation issues');
      }
    } else {
      console.log('❌ Report file not found');
    }
    
    // Step 6: Check for truncation issues
    console.log('\n6. Checking for truncation issues...');
    
    // Read the generated report metadata
    if (report.metadata?.aiContent) {
      const aiContent = report.metadata.aiContent;
      
      // Check executive summary
      if (aiContent.executiveSummary) {
        const summary = aiContent.executiveSummary;
        if (summary.includes('...') || summary.includes('....')) {
          console.log('❌ Executive summary contains truncation ellipsis');
          console.log(`   Content: "${summary.substring(0, 100)}..."`);
        } else {
          console.log('✓ Executive summary appears complete');
          console.log(`   Length: ${summary.length} characters`);
        }
      } else {
        console.log('❌ Executive summary missing from AI content');
      }
      
      // Check other sections
      const sections = ['keyInsights', 'riskAnalysis', 'futureOutlook', 'recommendationRationale'];
      sections.forEach(section => {
        if (aiContent[section]) {
          const content = aiContent[section];
          const contentStr = Array.isArray(content) ? content.join(' ') : content;
          if (contentStr.includes('...') || contentStr.includes('....')) {
            console.log(`❌ ${section} contains truncation ellipsis`);
          } else {
            console.log(`✓ ${section} appears complete (${contentStr.length} chars)`);
          }
        } else {
          console.log(`❌ ${section} missing from AI content`);
        }
      });
    } else {
      console.log('❌ No AI content metadata found');
    }
    
    // Step 7: Check for diagnostic messages
    console.log('\n7. Checking for diagnostic messages...');
    
    const reportContent = JSON.stringify(report);
    if (reportContent.includes('[DIAGNOSTIC]')) {
      console.log('⚠️  Diagnostic messages found in report:');
      const diagnosticMatches = reportContent.match(/\[DIAGNOSTIC\][^"]+/g);
      if (diagnosticMatches) {
        diagnosticMatches.slice(0, 3).forEach(match => {
          console.log(`   ${match}`);
        });
      }
    } else {
      console.log('✓ No diagnostic messages found');
    }
    
    // Step 8: Summary
    console.log('\n📋 TEST SUMMARY');
    console.log('=' .repeat(30));
    console.log(`✅ Report Generation: SUCCESS`);
    console.log(`📄 Output File: ${path.basename(report.outputPath)}`);
    console.log(`⏱️  Generation Time: ${duration.toFixed(1)}s`);
    console.log(`📊 Slides Generated: ${report.slides?.length || 0}`);
    
    return {
      success: true,
      reportPath: report.outputPath,
      duration,
      slideCount: report.slides?.length || 0
    };
    
  } catch (error) {
    console.error('\n❌ REPORT GENERATION FAILED');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
if (require.main === module) {
  testNVDAReportGeneration()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 NVDA REPORT TEST COMPLETED SUCCESSFULLY');
        process.exit(0);
      } else {
        console.log('\n💥 NVDA REPORT TEST FAILED');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 UNEXPECTED ERROR:', error);
      process.exit(1);
    });
}

module.exports = { testNVDAReportGeneration };
