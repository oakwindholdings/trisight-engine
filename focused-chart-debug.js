// focused-chart-debug.js
// Focused debugging script for chart generation issues

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');

async function focusedChartDebug() {
  console.log('🎯 FOCUSED CHART DEBUGGING\n');
  
  // 1. Test Server API Directly
  console.log('1️⃣ Testing Server API...');
  try {
    const reportConfig = {
      ticker: 'NVDA',
      title: 'Focused Debug Test',
      template: 'equity-research',
      outputFormat: 'json',
      includeCharts: true,
      debugMode: true
    };
    
    const response = await axios.post('http://localhost:3001/api/reports/generate', reportConfig, {
      timeout: 30000 // 30 second timeout
    });
    
    if (response.data.success) {
      console.log('✅ Server API working - report generated');
      
      // Analyze chart data
      const report = response.data;
      let chartCount = 0;
      
      if (report.slides) {
        for (const slide of report.slides) {
          if (slide.content) {
            for (const content of slide.content) {
              if (content.type === 'chart') {
                chartCount++;
                console.log(`📊 Chart found: ${content.data?.title || 'Untitled'} (${content.data?.type || 'unknown'})`);
              }
            }
          }
        }
      }
      
      console.log(`🎯 Total charts in JSON: ${chartCount}`);
      
      // Save the JSON report for analysis
      fs.writeFileSync('debug-json-report.json', JSON.stringify(report, null, 2));
      console.log('💾 JSON report saved to debug-json-report.json');
      
    } else {
      console.log('❌ Server API failed:', response.data.error);
    }
    
  } catch (error) {
    console.log('❌ Server API error:', error.message);
    if (error.response?.data) {
      console.log('Response data:', error.response.data);
    }
  }
  
  // 2. Test PDF Generation
  console.log('\n2️⃣ Testing PDF Generation...');
  try {
    const pdfConfig = {
      ticker: 'NVDA',
      title: 'PDF Debug Test',
      template: 'equity-research',
      outputFormat: 'pdf',
      includeCharts: true,
      debugMode: true
    };
    
    const pdfResponse = await axios.post('http://localhost:3001/api/reports/generate', pdfConfig, {
      timeout: 30000
    });
    
    if (pdfResponse.data.success) {
      console.log('✅ PDF generation successful');
      console.log('📄 PDF path:', pdfResponse.data.outputPath);
      
      // Check PDF size
      if (pdfResponse.data.outputPath && fs.existsSync(pdfResponse.data.outputPath)) {
        const stats = fs.statSync(pdfResponse.data.outputPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`📊 PDF size: ${sizeKB} KB`);
        
        if (sizeKB > 100) {
          console.log('🎉 PDF size suggests charts are working!');
        } else {
          console.log('⚠️ PDF size is small - charts may not be rendering');
        }
      }
    } else {
      console.log('❌ PDF generation failed:', pdfResponse.data.error);
    }
    
  } catch (error) {
    console.log('❌ PDF generation error:', error.message);
  }
  
  // 3. Test Browser Report Viewer
  console.log('\n3️⃣ Testing Browser Report Viewer...');
  
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = `${msg.type()}: ${msg.text()}`;
    consoleLogs.push(logEntry);
    if (logEntry.includes('chart') || logEntry.includes('Chart') || logEntry.includes('CHART')) {
      console.log(`[CHART LOG] ${logEntry}`);
    }
  });
  
  try {
    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Navigate to Reports
    const reportsLink = await page.locator('text=Reports').first();
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Navigated to Reports page');
      
      // Look for debug buttons
      const debugButtons = await page.locator('button[title="Debug in Browser"]').all();
      console.log(`✅ Found ${debugButtons.length} debug buttons`);
      
      if (debugButtons.length > 0) {
        // Click first debug button
        await debugButtons[0].click();
        await page.waitForTimeout(3000);
        
        console.log('✅ Clicked debug button - browser viewer opened');
        
        // Take screenshot
        await page.screenshot({ path: 'debug-browser-viewer.png' });
        console.log('📸 Screenshot saved: debug-browser-viewer.png');
        
        // Look for chart elements
        const chartElements = await page.locator('canvas, svg, [data-testid*="chart"]').all();
        console.log(`📊 Found ${chartElements.length} potential chart elements`);
        
        // Check for error messages
        const errorMessages = await page.locator('text=/error|Error|ERROR|failed|Failed|FAILED/').all();
        console.log(`⚠️ Found ${errorMessages.length} potential error messages`);
        
        // Look for diagnostic messages
        const diagnosticMessages = await page.locator('text=/DIAGNOSTIC|diagnostic/').all();
        console.log(`🔍 Found ${diagnosticMessages.length} diagnostic messages`);
        
      } else {
        console.log('❌ No debug buttons found');
      }
      
    } else {
      console.log('❌ Reports link not found');
    }
    
  } catch (error) {
    console.log('❌ Browser testing failed:', error.message);
  } finally {
    await browser.close();
  }
  
  // 4. Generate Summary Report
  console.log('\n4️⃣ Generating Debug Summary...');
  
  const debugSummary = {
    timestamp: new Date().toISOString(),
    findings: {
      serverAPI: 'Tested',
      pdfGeneration: 'Tested',
      browserViewer: 'Tested',
      chartElements: 'Analyzed'
    },
    consoleLogs: consoleLogs.filter(log => 
      log.includes('chart') || log.includes('Chart') || log.includes('CHART')
    ),
    recommendations: [
      'Check server logs for chart generation errors',
      'Verify chart data pipeline from API to PDF',
      'Test individual chart generators',
      'Check PDF embedding logic'
    ]
  };
  
  fs.writeFileSync('debug-summary.json', JSON.stringify(debugSummary, null, 2));
  console.log('📋 Debug summary saved to debug-summary.json');
  
  console.log('\n🎯 FOCUSED DEBUGGING COMPLETE!');
  console.log('📁 Check generated files:');
  console.log('  - debug-json-report.json (JSON report structure)');
  console.log('  - debug-browser-viewer.png (Browser viewer screenshot)');
  console.log('  - debug-summary.json (Complete debug summary)');
}

focusedChartDebug().catch(console.error);
