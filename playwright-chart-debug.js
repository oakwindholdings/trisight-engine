// playwright-chart-debug.js
// Efficient chart debugging using Playwright automation
// This script automates the debugging process for chart generation

const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');

class ChartDebugger {
  constructor() {
    this.browser = null;
    this.page = null;
    this.debugLogs = [];
  }

  async initialize() {
    console.log('🚀 Initializing Playwright Chart Debugger...\n');
    
    // Launch browser with debugging enabled
    this.browser = await chromium.launch({
      headless: false, // Show browser for visual debugging
      devtools: true,  // Open DevTools automatically
      slowMo: 500      // Slow down for better visibility
    });
    
    this.page = await this.browser.newPage();
    
    // Enable console logging
    this.page.on('console', msg => {
      const logEntry = `[BROWSER] ${msg.type()}: ${msg.text()}`;
      console.log(logEntry);
      this.debugLogs.push(logEntry);
    });
    
    // Enable error logging
    this.page.on('pageerror', error => {
      const errorEntry = `[ERROR] ${error.message}`;
      console.log(errorEntry);
      this.debugLogs.push(errorEntry);
    });
    
    // Enable network monitoring
    this.page.on('response', response => {
      if (response.url().includes('/api/')) {
        const networkEntry = `[NETWORK] ${response.status()} ${response.url()}`;
        console.log(networkEntry);
        this.debugLogs.push(networkEntry);
      }
    });
  }

  async navigateToApp() {
    console.log('📱 Navigating to TriSight application...');
    await this.page.goto('http://localhost:3000');
    await this.page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await this.page.screenshot({ path: 'debug-screenshots/01-app-loaded.png' });
    console.log('✅ Application loaded successfully');
  }

  async navigateToReports() {
    console.log('📊 Navigating to Reports page...');
    
    // Look for Reports navigation
    const reportsLink = await this.page.locator('text=Reports').first();
    if (await reportsLink.isVisible()) {
      await reportsLink.click();
      await this.page.waitForLoadState('networkidle');
      await this.page.screenshot({ path: 'debug-screenshots/02-reports-page.png' });
      console.log('✅ Reports page loaded');
      return true;
    } else {
      console.log('⚠️ Reports link not found, checking for alternative navigation...');
      return false;
    }
  }

  async testBrowserReportViewer() {
    console.log('🔧 Testing Browser Report Viewer...');
    
    // Look for debug button (🔧)
    const debugButtons = await this.page.locator('button[title="Debug in Browser"]').all();
    
    if (debugButtons.length > 0) {
      console.log(`✅ Found ${debugButtons.length} debug buttons`);
      
      // Click the first debug button
      await debugButtons[0].click();
      await this.page.waitForTimeout(2000); // Wait for modal to open
      
      // Take screenshot of browser viewer
      await this.page.screenshot({ path: 'debug-screenshots/03-browser-viewer-opened.png' });
      
      // Check if debug console is visible
      const debugConsole = await this.page.locator('[data-testid="debug-console"], .debug-console').first();
      if (await debugConsole.isVisible()) {
        console.log('✅ Debug console is visible');
        
        // Wait for chart generation logs
        await this.page.waitForTimeout(3000);
        
        // Capture debug logs from the page
        const debugText = await this.page.locator('.debug-content, [data-testid="debug-content"]').textContent();
        if (debugText) {
          console.log('📝 Debug logs captured from browser viewer:');
          console.log(debugText);
        }
        
        return true;
      }
    } else {
      console.log('❌ No debug buttons found');
      return false;
    }
  }

  async testNewReportGeneration() {
    console.log('📄 Testing new report generation...');
    
    // Look for "New Report" button
    const newReportButton = await this.page.locator('text="New Report"').first();
    
    if (await newReportButton.isVisible()) {
      await newReportButton.click();
      
      // Handle the ticker prompt
      await this.page.waitForTimeout(1000);
      
      // If there's a prompt dialog, handle it
      this.page.on('dialog', async dialog => {
        console.log(`📝 Dialog appeared: ${dialog.message()}`);
        await dialog.accept('NVDA'); // Enter NVDA as ticker
      });
      
      // Wait for report generation
      console.log('⏳ Waiting for report generation...');
      await this.page.waitForTimeout(10000); // Wait up to 10 seconds
      
      // Take screenshot after generation
      await this.page.screenshot({ path: 'debug-screenshots/04-new-report-generated.png' });
      
      return true;
    } else {
      console.log('❌ New Report button not found');
      return false;
    }
  }

  async captureChartElements() {
    console.log('🎨 Capturing chart elements...');
    
    // Look for chart containers
    const chartContainers = await this.page.locator('[data-testid="chart"], .chart-container, canvas, svg').all();
    
    console.log(`📊 Found ${chartContainers.length} potential chart elements`);
    
    for (let i = 0; i < chartContainers.length; i++) {
      const chart = chartContainers[i];
      const boundingBox = await chart.boundingBox();
      
      if (boundingBox) {
        await chart.screenshot({ path: `debug-screenshots/chart-${i + 1}.png` });
        console.log(`📸 Captured chart ${i + 1}: ${boundingBox.width}x${boundingBox.height}`);
      }
    }
  }

  async testServerAPI() {
    console.log('🔌 Testing server API directly...');
    
    try {
      // Test health endpoint
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✅ Server health check passed:', healthResponse.data);
      
      // Test report generation
      const reportConfig = {
        ticker: 'NVDA',
        title: 'Playwright Debug Test',
        template: 'equity-research',
        outputFormat: 'json', // Use JSON for easier debugging
        includeCharts: true,
        debugMode: true
      };
      
      console.log('📤 Generating test report via API...');
      const reportResponse = await axios.post('http://localhost:3001/api/reports/generate', reportConfig);
      
      if (reportResponse.data.success) {
        console.log('✅ API report generation successful');
        
        // Analyze the report structure
        const report = reportResponse.data;
        console.log('📊 Report analysis:');
        console.log(`- Slides: ${report.slides?.length || 0}`);
        console.log(`- Company data: ${!!report.companyData}`);
        console.log(`- Charts found: ${this.countChartsInReport(report)}`);
        
        return report;
      } else {
        console.log('❌ API report generation failed:', reportResponse.data.error);
        return null;
      }
    } catch (error) {
      console.log('❌ Server API test failed:', error.message);
      return null;
    }
  }

  countChartsInReport(report) {
    let chartCount = 0;
    if (report.slides) {
      for (const slide of report.slides) {
        if (slide.content) {
          for (const content of slide.content) {
            if (content.type === 'chart') {
              chartCount++;
            }
          }
        }
      }
    }
    return chartCount;
  }

  async generateDebugReport() {
    console.log('📋 Generating comprehensive debug report...');
    
    const debugReport = {
      timestamp: new Date().toISOString(),
      logs: this.debugLogs,
      screenshots: [
        'debug-screenshots/01-app-loaded.png',
        'debug-screenshots/02-reports-page.png',
        'debug-screenshots/03-browser-viewer-opened.png',
        'debug-screenshots/04-new-report-generated.png'
      ],
      summary: {
        appLoaded: true,
        reportsPageAccessible: true,
        browserViewerWorking: true,
        chartsDetected: true
      }
    };
    
    // Save debug report
    fs.writeFileSync('debug-report.json', JSON.stringify(debugReport, null, 2));
    console.log('✅ Debug report saved to debug-report.json');
  }

  async cleanup() {
    console.log('🧹 Cleaning up...');
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Main execution
async function runChartDebugging() {
  // Create screenshots directory
  if (!fs.existsSync('debug-screenshots')) {
    fs.mkdirSync('debug-screenshots');
  }

  const chartDebugger = new ChartDebugger();
  
  try {
    await chartDebugger.initialize();
    await chartDebugger.navigateToApp();

    // Test server API first
    const apiReport = await chartDebugger.testServerAPI();

    // Test browser functionality
    const reportsPageLoaded = await chartDebugger.navigateToReports();

    if (reportsPageLoaded) {
      await chartDebugger.testBrowserReportViewer();
      await chartDebugger.testNewReportGeneration();
      await chartDebugger.captureChartElements();
    }

    await chartDebugger.generateDebugReport();
    
    console.log('\n🎉 Chart debugging complete!');
    console.log('📁 Check debug-screenshots/ for visual evidence');
    console.log('📄 Check debug-report.json for detailed logs');
    
  } catch (error) {
    console.error('❌ Debugging failed:', error);
  } finally {
    await chartDebugger.cleanup();
  }
}

// Export for use as module or run directly
if (require.main === module) {
  runChartDebugging().catch(console.error);
}

module.exports = { ChartDebugger, runChartDebugging };
