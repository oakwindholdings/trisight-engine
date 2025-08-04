// src/reportGeneration/testNVDAReport.ts
// Test script for NVDA report generation with real API
// Context: Validates the complete report generation pipeline

import * as dotenv from 'dotenv';
import * as path from 'path';
import { ReportGenerator } from './core/reportGenerator';
import { ReportConfig } from './models/reportTypes';
import { logDebug, logError } from '../utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testNVDAReport() {
  console.log('=== NVDA Report Generation Test ===\n');

  try {
    // Check API key
    const apiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('REACT_APP_TWELVE_DATA_API_KEY not found in .env.local');
    }
    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');

    // Create report config
    const config: ReportConfig = {
      ticker: 'NVDA',
      reportDate: new Date().toISOString().split('T')[0],
      currentDate: new Date().toISOString().split('T')[0],
      reportType: 'technical_analysis',
      outputFormat: 'pdf',
      includeCharts: true,
      debugMode: true,
      apiKey: apiKey
    };

    console.log('\n📊 Generating report for NVDA...');
    console.log('Config:', JSON.stringify(config, null, 2));

    // Create generator
    const generator = new ReportGenerator(config);

    // Generate report
    console.log('\n🚀 Starting report generation...');
    const startTime = Date.now();
    
    const report = await generator.generateReport();
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Report generated in ${(duration / 1000).toFixed(1)}s!`);

    // Display results
    console.log('\n📋 Generated Report:');
    console.log('- Company:', report.companyData.companyName);
    console.log('- Ticker:', report.companyData.ticker);
    console.log('- Slides:', report.slides.length);
    console.log('- Output Path:', report.outputPath || 'Not saved');

    // Display company data
    console.log('\n🏢 Company Data:');
    console.log('- Description:', report.companyData.description?.substring(0, 100) + '...');
    console.log('- Sector:', report.companyData.sector);
    console.log('- Industry:', report.companyData.industry);

    // Display financial metrics
    if (report.companyData.financials?.keyMetrics) {
      const metrics = report.companyData.financials.keyMetrics;
      console.log('\n💰 Key Financial Metrics:');
      console.log('- Market Cap:', metrics.marketCap?.toLocaleString() || 'N/A');
      console.log('- PE Ratio:', metrics.peRatio || 'N/A');
      console.log('- PEG Ratio:', metrics.pegRatio || 'N/A');
      console.log('- Dividend Yield:', metrics.dividendYield || 'N/A');
      console.log('- ROE:', metrics.roe || 'N/A');
      console.log('- Debt to Equity:', metrics.debtToEquity || 'N/A');
    }

    // Display technical indicators
    if (report.companyData.technicals) {
      const tech = report.companyData.technicals;
      console.log('\n📈 Technical Indicators:');
      console.log('- SMA 20:', tech.sma20);
      console.log('- SMA 50:', tech.sma50);
      console.log('- SMA 200:', tech.sma200);
      console.log('- RSI:', tech.rsi);
      console.log('- Patterns Detected:', tech.patterns?.length || 0);
    }

    // Display slides
    console.log('\n📑 Report Slides:');
    report.slides.forEach((slide, i) => {
      console.log(`  ${i + 1}. ${slide.title} (${slide.layout})`);
      console.log(`     - Content items: ${slide.content.length}`);
      slide.content.forEach(content => {
        console.log(`       • ${content.type}`);
      });
    });

    // Display metadata
    console.log('\n📊 Report Metadata:');
    console.log('- Generated At:', new Date(report.metadata.generatedAt).toLocaleString());
    console.log('- Version:', report.metadata.version);
    console.log('- Author:', report.metadata.author);
    console.log('- Confidentiality:', report.metadata.confidentialityLevel);

    // Check the generated file
    if (report.outputPath) {
      console.log('\n📄 Output File:');
      console.log('- Path:', report.outputPath);
      
      const fs = await import('fs');
      if (fs.existsSync(report.outputPath)) {
        const stats = fs.statSync(report.outputPath);
        console.log('- Size:', (stats.size / 1024).toFixed(1), 'KB');
        console.log('- Created:', stats.birthtime.toLocaleString());
        
        // Try to open with Playwright if PDF
        if (report.outputPath.endsWith('.pdf')) {
          console.log('\n🔍 To view the PDF:');
          console.log(`- Use browser_navigate with URL: file:///${report.outputPath.replace(/\\/g, '/')}`);
        }
      } else {
        console.log('- Status: File not found');
      }
    }

    // Test storage
    console.log('\n💾 Testing storage service...');
    const { getStorageService } = await import('./services/storageService');
    const storage = getStorageService();
    
    const storedReport = await storage.saveReport(report);
    console.log('- Saved with ID:', storedReport.id);
    console.log('- File Size:', storedReport.fileSize.toFixed(2), 'MB');
    console.log('- Compressed:', storedReport.isCompressed ? 'Yes' : 'No');
    console.log('- Has Thumbnail:', storedReport.thumbnail ? 'Yes' : 'No');
    
    // Test retrieval
    const retrieved = await storage.getReport(storedReport.id);
    console.log('- Retrieved:', retrieved ? 'Success' : 'Failed');

    // List all NVDA reports
    const reports = await storage.listReports({ ticker: 'NVDA' });
    console.log('- Total NVDA reports in storage:', reports.length);

    console.log('\n✨ Test completed successfully!');
    
    return report;

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testNVDAReport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { testNVDAReport };