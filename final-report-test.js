const { chromium } = require('playwright');

async function finalReportTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down actions for better visibility
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Step 1: Navigate to Reports page');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/final-01-reports-page.png' });

    console.log('📝 Step 2: Click New Report button');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/final-02-wizard-opened.png' });

    console.log('🎯 Step 3: Click on Equity Research template card');
    // Try clicking the actual card container instead of just the text
    const templateCard = page.locator('div').filter({ hasText: 'Equity Research' }).first();
    await templateCard.click({ force: true });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/final-03-template-selected.png' });

    console.log('⏭️ Step 4: Click Next button');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(4000); // Wait longer for form to load
    await page.screenshot({ path: 'test-screenshots/final-04-form-loaded.png' });

    console.log('📋 Step 5: Fill form fields');
    
    // Wait for form inputs to be ready
    await page.waitForSelector('input', { timeout: 10000 });
    
    // Fill symbol field (try multiple approaches)
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    // Fill first input with symbol
    if (inputs.length > 0) {
      await inputs[0].fill('AAPL');
      console.log('✅ Filled first input with AAPL');
    }
    
    // Fill second input with title if it exists
    if (inputs.length > 1) {
      await inputs[1].fill('Apple Inc. Fixed Data Pipeline Test');
      console.log('✅ Filled second input with title');
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/final-05-form-filled.png' });

    console.log('🔄 Step 6: Navigate through wizard steps');
    let stepCount = 0;
    const maxSteps = 5;
    
    while (stepCount < maxSteps) {
      console.log(`Step ${stepCount + 1}: Looking for Next/Generate button...`);
      
      // Look for any button that might continue the flow
      const buttons = await page.locator('button').all();
      let foundButton = false;
      
      for (const button of buttons) {
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        
        if (isVisible && text && (
          text.includes('Next') || 
          text.includes('Continue') || 
          text.includes('Generate') ||
          text.includes('Create') ||
          text.includes('Start')
        )) {
          console.log(`🔘 Found button: "${text}"`);
          
          await button.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: `test-screenshots/final-06-step-${stepCount}.png` });
          
          // Check if this was a Generate button
          if (text.toLowerCase().includes('generate') || text.toLowerCase().includes('create')) {
            console.log('🎉 Generate button clicked! Starting report generation...');
            
            // Wait for report generation with longer timeout
            console.log('⏳ Waiting for report generation (up to 3 minutes)...');
            
            try {
              // Try multiple selectors for generated content
              const reportSelectors = [
                '.report-content',
                '.generated-report', 
                '.report-section',
                '[data-testid*="report"]',
                'div:has-text("Executive Summary")',
                'div:has-text("Financial Analysis")',
                'div:has-text("P/E")',
                'div:has-text("Apple")'
              ];
              
              let reportFound = false;
              for (const selector of reportSelectors) {
                try {
                  await page.waitForSelector(selector, { timeout: 30000 });
                  console.log(`✅ Report content found with selector: ${selector}`);
                  reportFound = true;
                  break;
                } catch (e) {
                  // Continue with next selector
                }
              }
              
              if (reportFound) {
                console.log('🎊 Report generation completed successfully!');
                
                // Take comprehensive screenshots
                await page.screenshot({ path: 'test-screenshots/final-07-report-full.png', fullPage: true });
                
                // Get page content for analysis
                const pageContent = await page.content();
                
                // Check for financial metrics
                const metrics = {
                  'P/E ratio': pageContent.includes('P/E') || pageContent.includes('Price-to-Earnings'),
                  'ROE': pageContent.includes('ROE') || pageContent.includes('Return on Equity'),
                  'Debt/Equity': pageContent.includes('Debt') && pageContent.includes('Equity'),
                  'Apple content': pageContent.includes('Apple') || pageContent.includes('AAPL')
                };
                
                console.log('📊 Financial metrics check:');
                Object.entries(metrics).forEach(([metric, found]) => {
                  console.log(`  ${found ? '✅' : '❌'} ${metric}: ${found ? 'Found' : 'Not found'}`);
                });
                
                // Look for specific values we're testing for
                const values = {
                  'P/E ~31': /P\/E.*3[0-9]|Price.*Earnings.*3[0-9]/.test(pageContent),
                  'ROE ~138%': /ROE.*13[0-9]%|Return.*Equity.*13[0-9]%/.test(pageContent),
                  'Debt/Equity ~147%': /Debt.*Equity.*14[0-9]%/.test(pageContent)
                };
                
                console.log('🎯 Target values check:');
                Object.entries(values).forEach(([value, found]) => {
                  console.log(`  ${found ? '✅' : '❌'} ${value}: ${found ? 'Found' : 'Not found'}`);
                });
                
                // Try to capture specific sections
                if (pageContent.includes('Financial') || pageContent.includes('Metrics')) {
                  console.log('📈 Attempting to capture financial section...');
                  const financialText = page.locator('text=/Financial|Metrics|P\/E|ROE|Debt/').first();
                  if (await financialText.isVisible({ timeout: 5000 })) {
                    await financialText.scrollIntoViewIfNeeded();
                    await page.screenshot({ path: 'test-screenshots/final-08-financial-section.png' });
                  }
                }
                
              } else {
                console.log('⚠️ Could not find report content within timeout');
                await page.screenshot({ path: 'test-screenshots/final-07-no-content.png' });
              }
              
            } catch (error) {
              console.log('❌ Report generation failed or timed out:', error.message);
              await page.screenshot({ path: 'test-screenshots/final-07-timeout.png' });
            }
            
            return; // Exit after generation attempt
          }
          
          foundButton = true;
          break;
        }
      }
      
      if (!foundButton) {
        console.log('❌ No more actionable buttons found');
        await page.screenshot({ path: `test-screenshots/final-end-step-${stepCount}.png` });
        break;
      }
      
      stepCount++;
    }

    console.log('✨ Test workflow completed!');

  } catch (error) {
    console.error('💥 Error during test:', error);
    await page.screenshot({ path: 'test-screenshots/final-error.png' });
  } finally {
    console.log('🔍 Keeping browser open for 60 seconds for inspection...');
    await page.waitForTimeout(60000);
    await browser.close();
  }
}

finalReportTest();