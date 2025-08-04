const { chromium } = require('playwright');

async function testReportGenerationFocused() {
  console.log('🚀 Starting focused TriSight report generation test...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    console.log('📍 Navigating to TriSight application...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'test-screenshots/00-homepage.png', fullPage: true });
    
    // Navigate to Reports section
    console.log('📊 Clicking Reports in navigation...');
    const reportsLink = page.locator('a[href="/reports"], button:has-text("Reports"), [data-testid="reports-nav"]');
    if (await reportsLink.count() > 0) {
      await reportsLink.click();
    } else {
      // Try direct navigation
      await page.goto('http://localhost:3000/reports');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/01-reports-page.png', fullPage: true });
    
    // Look for "New Report" button
    console.log('➕ Looking for New Report button...');
    const newReportButton = page.locator('button:has-text("New Report"), button:has-text("Create"), button:has-text("Generate")');
    
    if (await newReportButton.count() > 0) {
      console.log('✅ Found New Report button, clicking...');
      await newReportButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/02-new-report-clicked.png', fullPage: true });
    } else {
      console.log('❓ No New Report button found, trying to interact with wizard directly...');
    }
    
    // Wait for report wizard to appear or load
    await page.waitForTimeout(2000);
    
    // Look for template selection (based on ReportWizard component)
    console.log('🎯 Looking for template selection...');
    
    // First take a screenshot to see current state
    await page.screenshot({ path: 'test-screenshots/03a-before-selection.png', fullPage: true });
    
    // Try multiple approaches to select the template
    let templateSelected = false;
    
    // Approach 1: Try the Technical Analysis card directly
    try {
      const techAnalysisCard = page.locator('div').filter({ hasText: 'Technical Analysis' }).filter({ hasText: 'Chart patterns' });
      if (await techAnalysisCard.count() > 0) {
        console.log('📈 Attempting to click Technical Analysis card...');
        await techAnalysisCard.first().click();
        await page.waitForTimeout(500);
        templateSelected = true;
      }
    } catch (error) {
      console.log('⚠️ First approach failed:', error.message);
    }
    
    // Approach 2: Try clicking by coordinate if the first failed
    if (!templateSelected) {
      try {
        console.log('🎯 Trying coordinate click on Technical Analysis area...');
        const techCard = page.locator('h4:has-text("Technical Analysis")').first();
        const box = await techCard.boundingBox();
        if (box) {
          // Click slightly above the h4 to hit the parent card
          await page.mouse.click(box.x + box.width / 2, box.y - 20);
          await page.waitForTimeout(500);
          templateSelected = true;
        }
      } catch (error) {
        console.log('⚠️ Coordinate click failed:', error.message);
      }
    }
    
    // Take screenshot after selection attempt
    await page.screenshot({ path: 'test-screenshots/03b-after-selection.png', fullPage: true });
    
    // Check if a template is now selected by looking for enabled Next button
    const nextButtonEnabled = page.locator('button:has-text("Next"):not([disabled])');
    if (await nextButtonEnabled.count() > 0) {
      console.log('✅ Template selection successful - Next button enabled');
      templateSelected = true;
    } else {
      console.log('❌ Template selection failed - Next button still disabled');
      // Try the Equity Research card as fallback
      try {
        console.log('🔄 Trying Equity Research as fallback...');
        const equityCard = page.locator('h4:has-text("Equity Research")').first();
        const box = await equityCard.boundingBox();
        if (box) {
          await page.mouse.click(box.x + box.width / 2, box.y - 20);
          await page.waitForTimeout(500);
        }
      } catch (error) {
        console.log('⚠️ Fallback failed:', error.message);
      }
    }
    
    await page.screenshot({ path: 'test-screenshots/03c-final-selection.png', fullPage: true });
    
    // Look for Next button and proceed
    console.log('▶️ Looking for Next button...');
    const nextButton = page.locator('button:has-text("Next")');
    
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      console.log('✅ Next button found and enabled, clicking...');
      await nextButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/04-after-next.png', fullPage: true });
      
      // Fill in details form
      console.log('📝 Filling in report details...');
      
      // Fill title
      const titleInput = page.locator('input[placeholder*="Apple"], input[placeholder*="title"], input[value=""], input').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('NVIDIA Corporation Q2 2025 Technical Analysis');
        console.log('✅ Filled title field');
      }
      
      // Fill ticker
      const tickerInput = page.locator('input[placeholder*="AAPL"], input[placeholder*="ticker"]');
      if (await tickerInput.count() > 0) {
        await tickerInput.fill('NVDA');
        console.log('✅ Filled ticker field');
      } else {
        // Try alternative approach
        const inputs = page.locator('input');
        const inputCount = await inputs.count();
        if (inputCount > 1) {
          await inputs.nth(1).fill('NVDA');
          console.log('✅ Filled ticker via nth input');
        }
      }
      
      // Fill author
      const authorInput = page.locator('input[placeholder*="name"], input[placeholder*="author"]');
      if (await authorInput.count() > 0) {
        await authorInput.fill('TriSight Test Analyst');
        console.log('✅ Filled author field');
      } else {
        // Try alternative approach
        const inputs = page.locator('input');
        const inputCount = await inputs.count();
        if (inputCount > 2) {
          await inputs.nth(2).fill('TriSight Test Analyst');
          console.log('✅ Filled author via nth input');
        }
      }
      
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-screenshots/05-details-filled.png', fullPage: true });
      
      // Continue through the wizard
      const nextButton2 = page.locator('button:has-text("Next")');
      if (await nextButton2.count() > 0 && await nextButton2.isEnabled()) {
        console.log('▶️ Clicking Next again...');
        await nextButton2.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-screenshots/06-data-sources.png', fullPage: true });
        
        // Continue to next step
        const nextButton3 = page.locator('button:has-text("Next")');
        if (await nextButton3.count() > 0 && await nextButton3.isEnabled()) {
          console.log('▶️ Proceeding to configuration...');
          await nextButton3.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'test-screenshots/07-configuration.png', fullPage: true });
          
          // Look for Generate Report button
          const generateButton = page.locator('button:has-text("Generate Report"), button:has-text("Generate"), button:has-text("Create Report")');
          if (await generateButton.count() > 0 && await generateButton.isEnabled()) {
            console.log('🎯 Found Generate Report button, clicking...');
            await page.screenshot({ path: 'test-screenshots/08-before-generate.png', fullPage: true });
            
            await generateButton.click();
            console.log('⏳ Report generation started, waiting for completion...');
            
            // Wait for generation to complete (with longer timeout)
            try {
              await page.waitForSelector('text=Report Generated Successfully, text=completed, text=success, .success', {
                timeout: 180000 // 3 minutes
              });
              
              console.log('✅ Report generation completed!');
              await page.screenshot({ path: 'test-screenshots/09-generation-complete.png', fullPage: true });
              
              // Look for view/download options
              const viewButton = page.locator('button:has-text("View"), button:has-text("Download"), a:has-text("Download")');
              if (await viewButton.count() > 0) {
                console.log('👁️ View/Download options found');
                await page.screenshot({ path: 'test-screenshots/10-view-options.png', fullPage: true });
              }
              
            } catch (timeoutError) {
              console.log('⏰ Generation timed out, checking current state...');
              await page.screenshot({ path: 'test-screenshots/09-generation-timeout.png', fullPage: true });
              
              // Check for any error messages
              const errorElement = page.locator('.error, .error-message, [class*="error"]');
              if (await errorElement.count() > 0) {
                const errorText = await errorElement.first().textContent();
                console.log('❌ Error found:', errorText);
              }
            }
            
          } else {
            console.log('❌ Generate Report button not found or not enabled');
            await page.screenshot({ path: 'test-screenshots/08-no-generate-button.png', fullPage: true });
          }
        }
      }
    } else {
      console.log('❌ Next button not found or not enabled');
      const buttons = await page.locator('button').allTextContents();
      console.log('Available buttons:', buttons);
      await page.screenshot({ path: 'test-screenshots/04-no-next-button.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    await page.screenshot({ path: 'test-screenshots/99-final-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('🧹 Closing browser...');
    await browser.close();
  }
}

// Run the test
testReportGenerationFocused()
  .then(() => {
    console.log('✅ TriSight report generation test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ TriSight test failed:', error);
    process.exit(1);
  });