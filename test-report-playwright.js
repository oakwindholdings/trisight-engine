const { chromium } = require('playwright');

async function testReportGeneration() {
  console.log('Starting Playwright test for report generation...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    slowMo: 1000 // Slow down for visibility
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the reports page
    console.log('Navigating to reports page...');
    await page.goto('http://localhost:3000/reports');
    await page.waitForTimeout(2000);
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'test-screenshots/01-reports-page.png', fullPage: true });
    
    // Click "New Report" button
    console.log('Clicking New Report button...');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(1000);
    
    // Take screenshot of wizard
    await page.screenshot({ path: 'test-screenshots/02-new-report-wizard.png', fullPage: true });
    
    // Select Technical Analysis template (look for the card containing "Technical Analysis")
    console.log('Selecting Technical Analysis template...');
    await page.click('div:has-text("Technical Analysis"):has-text("Chart patterns & indicators")');
    await page.waitForTimeout(500);
    
    // Fill in report details
    console.log('Filling in report details...');
    
    // Wait for form inputs to be visible
    await page.waitForSelector('input', { timeout: 5000 });
    
    // Fill title with exact placeholder text
    const titleInput = page.locator('input[placeholder="e.g., Apple Inc. Q4 2024 Analysis"]');
    if (await titleInput.count() > 0) {
      console.log('Filling title field...');
      await titleInput.fill('NVIDIA Corporation Q2 2025 Technical Analysis');
    } else {
      console.log('Title input not found, trying alternative...');
      await page.fill('input >> nth=0', 'NVIDIA Corporation Q2 2025 Technical Analysis');
    }
    
    // Fill ticker with exact placeholder text
    const tickerInput = page.locator('input[placeholder="e.g., AAPL"]');
    if (await tickerInput.count() > 0) {
      console.log('Filling ticker field...');
      await tickerInput.fill('NVDA');
    } else {
      console.log('Ticker input not found, trying alternative...');
      await page.fill('input >> nth=1', 'NVDA');
    }
    
    // Fill author with exact placeholder text
    const authorInput = page.locator('input[placeholder="Your name"]');
    if (await authorInput.count() > 0) {
      console.log('Filling author field...');
      await authorInput.fill('TriSight Analyst');
    } else {
      console.log('Author input not found, trying alternative...');
      await page.fill('input >> nth=2', 'TriSight Analyst');
    }
    
    await page.waitForTimeout(1000);
    
    // Take screenshot after filling details
    await page.screenshot({ path: 'test-screenshots/03-filled-details.png', fullPage: true });
    
    // Wait for Next button to be enabled and proceed to next step
    console.log('Waiting for Next button to be enabled...');
    await page.waitForSelector('button:has-text("Next"):not([disabled])', { timeout: 10000 });
    
    const nextButton = page.locator('button:has-text("Next"):not([disabled])').first();
    if (await nextButton.count() > 0) {
      console.log('Clicking Next button...');
      await nextButton.click();
      await page.waitForTimeout(1000);
      
      // Take screenshot of next step
      await page.screenshot({ path: 'test-screenshots/04-next-step.png', fullPage: true });
    }
    
    // Proceed through remaining wizard steps
    console.log('Looking for additional Next buttons...');
    let additionalNextButton = page.locator('button:has-text("Next"):not([disabled])');
    while (await additionalNextButton.count() > 0) {
      console.log('Found another Next button, clicking...');
      await additionalNextButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `test-screenshots/step-${Date.now()}.png`, fullPage: true });
      additionalNextButton = page.locator('button:has-text("Next"):not([disabled])');
    }
    
    // Look for Generate Report or Export button
    console.log('Looking for Generate/Export Report button...');
    const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("Generate"), button:has-text("Export Report"), button:has-text("Create Report")');
    
    if (await generateButton.count() > 0) {
      console.log('Found Generate Report button, clicking...');
      
      // Take screenshot before generating
      await page.screenshot({ path: 'test-screenshots/05-before-generate.png', fullPage: true });
      
      // Click generate and wait for the request
      await generateButton.click();
      
      console.log('Waiting for report generation (this may take a while)...');
      
      // Wait for success message or completed report
      try {
        // Wait for either success message or error with longer timeout
        await page.waitForSelector('[data-testid="report-success"], .success-message, .report-completed, .error-message', {
          timeout: 120000 // 2 minutes timeout
        });
        
        // Take screenshot of result
        await page.screenshot({ path: 'test-screenshots/06-generation-result.png', fullPage: true });
        
        // Check if generation was successful
        const successElement = await page.locator('.success-message, .report-completed, [data-testid="report-success"]').count();
        const errorElement = await page.locator('.error-message').count();
        
        if (successElement > 0) {
          console.log('✅ Report generation completed successfully!');
          
          // Look for download button or link
          const downloadButton = page.locator('button:has-text("Download"), a:has-text("Download")');
          if (await downloadButton.count() > 0) {
            console.log('Download button found - report generation fully working!');
          }
          
        } else if (errorElement > 0) {
          console.log('❌ Report generation failed with error');
          const errorText = await page.locator('.error-message').textContent();
          console.log('Error:', errorText);
        } else {
          console.log('⚠️ Generation completed but status unclear');
        }
        
      } catch (error) {
        console.log('⏰ Timeout waiting for generation result');
        
        // Take screenshot of timeout state
        await page.screenshot({ path: 'test-screenshots/07-timeout-state.png', fullPage: true });
        
        // Check if there are any error messages or loading states
        const loadingElements = await page.locator('.loading, .spinner, [data-testid="loading"]').count();
        const errorElements = await page.locator('.error, .error-message').count();
        
        console.log(`Loading elements: ${loadingElements}`);
        console.log(`Error elements: ${errorElements}`);
        
        if (errorElements > 0) {
          const errorText = await page.locator('.error, .error-message').first().textContent();
          console.log('Error found:', errorText);
        }
        
        throw error;
      }
      
    } else {
      console.log('❌ Generate Report button not found');
      
      // Take screenshot showing current state
      await page.screenshot({ path: 'test-screenshots/05-no-generate-button.png', fullPage: true });
      
      // Log all buttons visible on page
      const buttons = await page.locator('button').allTextContents();
      console.log('Available buttons:', buttons);
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    
    // Take screenshot of error state
    await page.screenshot({ path: 'test-screenshots/99-error-state.png', fullPage: true });
    
    throw error;
  } finally {
    // Close browser
    await browser.close();
  }
}

// Run the test
testReportGeneration()
  .then(() => {
    console.log('✅ Playwright test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Playwright test failed:', error);
    process.exit(1);
  });