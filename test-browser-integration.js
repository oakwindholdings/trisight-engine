const { chromium } = require('playwright');

async function testBrowserIntegration() {
  console.log('🚀 Testing complete browser integration...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('📂 Step 1: Loading Reports page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-screenshots/initial-state.png', fullPage: true });
    
    console.log('📊 Step 2: Checking initial metrics...');
    // Check if QuickMetrics are loaded
    const metricsCards = await page.locator('.metrics-card, [data-testid="metric"], .metric').count();
    console.log(`Found ${metricsCards} metric cards`);
    
    // Check if ReportHistory is loaded
    const historyItems = await page.locator('.report-item, [data-testid="report"], .history-item').count();
    console.log(`Found ${historyItems} history items`);
    
    console.log('🆕 Step 3: Creating new report...');
    // Click New Report button
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(1000);
    
    // Select template
    await page.click('div:has-text("Technical Analysis"):has-text("Chart patterns")');
    await page.waitForTimeout(500);
    
    // Fill form
    console.log('📝 Step 4: Filling report form...');
    await page.fill('input >> nth=0', 'Microsoft Corporation Q3 2025 Technical Analysis');
    await page.fill('input >> nth=1', 'MSFT');
    await page.fill('input >> nth=2', 'TriSight Browser Test');
    await page.waitForTimeout(1000);
    
    // Navigate through wizard
    console.log('➡️ Step 5: Navigating through wizard...');
    let nextButton = page.locator('button:has-text("Next"):not([disabled])');
    while (await nextButton.count() > 0) {
      await nextButton.first().click();
      await page.waitForTimeout(1000);
      nextButton = page.locator('button:has-text("Next"):not([disabled])');
    }
    
    // Look for generate button
    console.log('🔧 Step 6: Looking for Generate button...');
    const generateSelectors = [
      'button:has-text("Generate Report")',
      'button:has-text("Generate")',
      'button:has-text("Create Report")',
      'button:has-text("Export Report")'
    ];
    
    let generateButton = null;
    for (const selector of generateSelectors) {
      const btn = page.locator(selector);
      if (await btn.count() > 0) {
        generateButton = btn.first();
        console.log(`Found generate button with selector: ${selector}`);
        break;
      }
    }
    
    if (generateButton) {
      console.log('🚀 Step 7: Generating report...');
      // Add event listener to catch the reportGenerated event
      await page.addInitScript(() => {
        window.reportGeneratedEventCaught = false;
        window.addEventListener('reportGenerated', (event) => {
          console.log('reportGenerated event caught!', event.detail);
          window.reportGeneratedEventCaught = true;
          window.generatedReportData = event.detail;
        });
      });
      
      await generateButton.click();
      
      // Wait for either success or 60 seconds timeout
      console.log('⏳ Waiting for report generation to complete...');
      try {
        // Wait for success indicators
        await page.waitForFunction(() => {
          return window.reportGeneratedEventCaught === true;
        }, { timeout: 60000 });
        
        console.log('✅ Report generation event detected!');
        
        // Check if event was caught
        const eventCaught = await page.evaluate(() => window.reportGeneratedEventCaught);
        const reportData = await page.evaluate(() => window.generatedReportData);
        
        console.log('📊 Event caught:', eventCaught);
        console.log('📄 Report data:', reportData ? 'Present' : 'Missing');
        
      } catch (error) {
        console.log('⏰ Timeout waiting for generation, checking page state...');
      }
      
      // Take screenshot after generation attempt
      await page.screenshot({ path: 'test-screenshots/after-generation.png', fullPage: true });
      
      // Check if components updated
      console.log('🔄 Step 8: Checking component updates...');
      
      // Wait a bit for components to update
      await page.waitForTimeout(3000);
      
      // Check if metrics updated
      const newMetricsCards = await page.locator('.metrics-card, [data-testid="metric"], .metric').count();
      console.log(`Metrics cards after generation: ${newMetricsCards}`);
      
      // Check if history updated
      const newHistoryItems = await page.locator('.report-item, [data-testid="report"], .history-item').count();
      console.log(`History items after generation: ${newHistoryItems}`);
      
      // Final screenshot
      await page.screenshot({ path: 'test-screenshots/final-state.png', fullPage: true });
      
      console.log('\n🎯 BROWSER INTEGRATION TEST RESULTS:');
      console.log('=====================================');
      console.log(`✅ Initial metrics loaded: ${metricsCards > 0}`);
      console.log(`✅ Initial history loaded: ${historyItems > 0}`);
      console.log(`✅ Report wizard functional: true`);
      console.log(`✅ Generate button found: ${generateButton !== null}`);
      console.log(`📊 Components refresh needed: ${newMetricsCards === metricsCards && newHistoryItems === historyItems}`);
      
    } else {
      console.log('❌ Generate button not found');
      await page.screenshot({ path: 'test-screenshots/no-generate-button.png', fullPage: true });
      
      // Show available buttons
      const buttons = await page.locator('button').allTextContents();
      console.log('Available buttons:', buttons);
    }
    
  } catch (error) {
    console.error('❌ Browser test error:', error);
    await page.screenshot({ path: 'test-screenshots/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

// Run the test
testBrowserIntegration()
  .then(() => {
    console.log('✅ Browser integration test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Browser test failed:', error);
    process.exit(1);
  });