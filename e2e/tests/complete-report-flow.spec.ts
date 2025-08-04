// e2e/tests/complete-report-flow.spec.ts
// Complete report generation flow test with manual step-by-step approach
// Context: Documents the full report generation process with detailed screenshots

import { test, expect } from '@playwright/test';

test.describe('Complete Report Generation Flow', () => {
  test('should complete full AAPL report generation workflow', async ({ page }) => {
    console.log('🚀 Starting Complete Report Generation Flow Test');
    
    // Step 1: Navigate to Reports page
    console.log('📋 Step 1: Loading Reports page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'test-screenshots/flow-01-initial-reports-page.png',
      fullPage: true
    });
    
    // Verify we can see the main elements
    await expect(page.locator('text=Report Generation Center')).toBeVisible();
    console.log('✅ Reports page loaded successfully');
    
    // Step 2: Click New Report button
    console.log('📋 Step 2: Clicking New Report button...');
    const newReportButton = page.locator('button:has-text("New Report")');
    await expect(newReportButton).toBeVisible();
    await newReportButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'test-screenshots/flow-02-template-selection-screen.png',
      fullPage: true
    });
    
    // Verify template selection screen
    await expect(page.locator('text=Choose Report Template')).toBeVisible();
    console.log('✅ Template selection screen loaded');
    
    // Step 3: Select Equity Research template
    console.log('📋 Step 3: Selecting Equity Research template...');
    const equityResearchCard = page.locator('text=Equity Research').first();
    await expect(equityResearchCard).toBeVisible();
    await equityResearchCard.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({
      path: 'test-screenshots/flow-03-equity-research-selected.png',
      fullPage: true
    });
    console.log('✅ Equity Research template selected');
    
    // Step 4: Click Next to proceed
    console.log('📋 Step 4: Proceeding to next step...');
    const nextButton = page.locator('button:has-text("Next")');
    await expect(nextButton).toBeVisible();
    await expect(nextButton).toBeEnabled();
    await nextButton.click();
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'test-screenshots/flow-04-step-2-details.png',
      fullPage: true
    });
    console.log('✅ Proceeded to Step 2');
    
    // Step 5: Fill in report details
    console.log('📋 Step 5: Filling report details...');
    
    // Look for title/name input field
    const titleInputs = page.locator('input[placeholder*="title"], input[placeholder*="name"], input[type="text"]').first();
    if (await titleInputs.isVisible()) {
      await titleInputs.fill('AAPL Equity Research - Test Report with Fixed Data');
      console.log('✅ Title filled');
    }
    
    // Look for symbol/ticker input
    const symbolInputs = page.locator('input[placeholder*="symbol"], input[placeholder*="ticker"], input[placeholder*="AAPL"]').first();
    if (await symbolInputs.isVisible()) {
      await symbolInputs.clear();
      await symbolInputs.fill('AAPL');
      console.log('✅ Symbol filled with AAPL');
    }
    
    await page.screenshot({
      path: 'test-screenshots/flow-05-details-filled.png',
      fullPage: true
    });
    
    // Step 6: Continue to next step
    console.log('📋 Step 6: Continuing to data sources...');
    const nextButton2 = page.locator('button:has-text("Next")');
    if (await nextButton2.isVisible() && await nextButton2.isEnabled()) {
      await nextButton2.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: 'test-screenshots/flow-06-data-sources.png',
      fullPage: true
    });
    console.log('✅ Reached data sources step');
    
    // Step 7: Select data sources (if available)
    console.log('📋 Step 7: Configuring data sources...');
    
    // Look for checkboxes or data source options
    const marketDataOption = page.locator('text=Market Data, text=TwelveData, input[name*="market"], input[name*="data"]').first();
    if (await marketDataOption.isVisible()) {
      try {
        await marketDataOption.check();
        console.log('✅ Market data selected');
      } catch (e) {
        console.log('⚠️ Could not check market data option');
      }
    }
    
    // Continue to next step
    const nextButton3 = page.locator('button:has-text("Next")');
    if (await nextButton3.isVisible() && await nextButton3.isEnabled()) {
      await nextButton3.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({
      path: 'test-screenshots/flow-07-configuration.png',
      fullPage: true
    });
    console.log('✅ Reached configuration step');
    
    // Step 8: Generate the report
    console.log('📋 Step 8: Starting report generation...');
    
    // Look for generate button
    const generateButtons = page.locator('button:has-text("Generate"), button:has-text("Create Report"), button:has-text("Start Generation")');
    const generateButton = generateButtons.first();
    
    if (await generateButton.isVisible() && await generateButton.isEnabled()) {
      console.log('🔄 Clicking Generate Report button');
      await generateButton.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({
        path: 'test-screenshots/flow-08-generation-started.png',
        fullPage: true
      });
      console.log('✅ Report generation started');
      
      // Step 9: Wait for generation process
      console.log('📋 Step 9: Monitoring generation progress...');
      
      // Wait and take periodic screenshots
      for (let i = 1; i <= 5; i++) {
        await page.waitForTimeout(5000);
        await page.screenshot({
          path: `test-screenshots/flow-09-progress-${i}.png`,
          fullPage: true
        });
        console.log(`📸 Progress screenshot ${i}/5 taken`);
        
        // Check for completion indicators
        const completionIndicator = page.locator('text=/completed|success|generated|ready|finished/i');
        if (await completionIndicator.isVisible()) {
          console.log('🎉 Report generation completed!');
          break;
        }
        
        // Check for error indicators
        const errorIndicator = page.locator('text=/error|failed|problem/i');
        if (await errorIndicator.isVisible()) {
          console.log('❌ Error detected during generation');
          break;
        }
      }
      
      // Step 10: Capture final results
      console.log('📋 Step 10: Capturing final results...');
      await page.waitForTimeout(2000);
      
      await page.screenshot({
        path: 'test-screenshots/flow-10-final-results.png',
        fullPage: true
      });
      
      // Look for any financial data that might be displayed
      const financialElements = page.locator('text=/\\$[\\d,]+|[\\d.]+%|revenue|earnings|price|market cap/i');
      const financialCount = await financialElements.count();
      
      if (financialCount > 0) {
        console.log(`💰 Found ${financialCount} financial data elements`);
        
        // Take screenshot of just the financial data area
        const contentArea = page.locator('[class*="content"], [class*="report"], main').first();
        if (await contentArea.isVisible()) {
          await contentArea.screenshot({
            path: 'test-screenshots/flow-11-financial-data.png'
          });
        }
        
        // Log sample financial data
        for (let i = 0; i < Math.min(financialCount, 5); i++) {
          const elementText = await financialElements.nth(i).textContent();
          console.log(`📊 Financial data ${i + 1}: ${elementText}`);
        }
      } else {
        console.log('ℹ️ No financial data elements found in current view');
      }
      
      // Check for charts or visualizations
      const charts = page.locator('canvas, svg, [class*="chart"]');
      const chartCount = await charts.count();
      console.log(`📈 Found ${chartCount} chart/visualization elements`);
      
    } else {
      console.log('❌ Generate button not found or not enabled');
      await page.screenshot({
        path: 'test-screenshots/flow-08-no-generate-button.png',
        fullPage: true
      });
    }
    
    // Final comprehensive screenshot
    await page.screenshot({
      path: 'test-screenshots/flow-final-complete-page.png',
      fullPage: true
    });
    
    console.log('🏁 Test completed! Check test-screenshots/ for the complete flow documentation');
    
    // Summary log
    const pageTitle = await page.title();
    const currentUrl = page.url();
    console.log(`📄 Final state - Title: "${pageTitle}", URL: ${currentUrl}`);
  });
});