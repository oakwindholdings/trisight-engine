const { chromium } = require('playwright');

async function preciseReportTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('🚀 Navigate to Reports page');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/precise-01-reports.png' });

    console.log('📝 Click New Report button');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/precise-02-wizard.png' });

    console.log('🎯 Select Equity Research template');
    // Try different approaches to select the template
    
    // Approach 1: Click by coordinates on the first template card
    const firstCard = page.locator('div').filter({ hasText: 'Equity Research' }).first();
    const box = await firstCard.boundingBox();
    if (box) {
      await page.click(box.x + box.width / 2, box.y + box.height / 2);
      console.log('✅ Clicked template by coordinates');
    } else {
      // Approach 2: Try clicking the template card container
      await page.click('div:has-text("Equity Research"):has(svg)');
      console.log('✅ Clicked template card container');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/precise-03-template-clicked.png' });

    // Check if Next button is enabled
    const nextButton = page.locator('button:has-text("Next")');
    const isEnabled = await nextButton.isEnabled();
    console.log(`Next button enabled: ${isEnabled}`);
    
    if (!isEnabled) {
      console.log('⚠️ Next button still disabled, trying alternative selection methods...');
      
      // Try clicking on the template card with different selectors
      const selectors = [
        '[data-testid="equity-research"]',
        'div[role="button"]:has-text("Equity Research")',
        'button:has-text("Equity Research")',
        '.template-card:first-child',
        'div:nth-child(1):has-text("Equity Research")'
      ];
      
      for (const selector of selectors) {
        try {
          const element = page.locator(selector);
          if (await element.isVisible({ timeout: 1000 })) {
            await element.click();
            console.log(`✅ Clicked with selector: ${selector}`);
            await page.waitForTimeout(1000);
            if (await nextButton.isEnabled()) {
              console.log('🎉 Next button is now enabled!');
              break;
            }
          }
        } catch (e) {
          // Continue with next selector
        }
      }
    }

    await page.screenshot({ path: 'test-screenshots/precise-04-selection-final.png' });

    if (await nextButton.isEnabled()) {
      console.log('⏭️ Clicking Next button');
      await nextButton.click();
      await page.waitForTimeout(4000);
      await page.screenshot({ path: 'test-screenshots/precise-05-next-step.png' });

      console.log('📋 Looking for form inputs');
      await page.waitForSelector('input', { timeout: 10000 });
      
      const inputs = await page.locator('input').all();
      console.log(`Found ${inputs.length} input fields`);
      
      // Fill the inputs
      if (inputs.length > 0) {
        await inputs[0].fill('AAPL');
        console.log('✅ Filled symbol: AAPL');
      }
      
      if (inputs.length > 1) {
        await inputs[1].fill('Apple Inc. Fixed Data Pipeline Test');
        console.log('✅ Filled title: Apple Inc. Fixed Data Pipeline Test');
      }
      
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/precise-06-form-filled.png' });

      console.log('🔄 Continue through wizard steps');
      let currentStep = 2;
      const maxSteps = 6;
      
      while (currentStep <= maxSteps) {
        console.log(`Step ${currentStep}: Looking for continue button...`);
        
        const buttons = await page.locator('button:not([disabled])').all();
        let progressMade = false;
        
        for (const button of buttons) {
          const text = await button.textContent();
          const isVisible = await button.isVisible();
          
          if (isVisible && text && (
            text.includes('Next') || 
            text.includes('Continue') || 
            text.includes('Generate') ||
            text.includes('Create Report') ||
            text.includes('Start Generation')
          )) {
            console.log(`🔘 Clicking: "${text.trim()}"`);
            
            await button.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: `test-screenshots/precise-07-step-${currentStep}.png` });
            
            if (text.toLowerCase().includes('generate') || text.toLowerCase().includes('create')) {
              console.log('🎉 Generation started!');
              
              // Wait for report generation
              console.log('⏳ Waiting for report to generate...');
              
              try {
                // Wait for any sign of report content
                await page.waitForFunction(() => {
                  return document.body.innerText.includes('Executive Summary') ||
                         document.body.innerText.includes('Financial Analysis') ||
                         document.body.innerText.includes('Apple') ||
                         document.body.innerText.includes('P/E') ||
                         document.querySelector('.report-content') ||
                         document.querySelector('.generated-report');
                }, { timeout: 120000 });
                
                console.log('🎊 Report content detected!');
                await page.screenshot({ path: 'test-screenshots/precise-08-report-generated.png', fullPage: true });
                
                // Analyze content
                const content = await page.content();
                const textContent = await page.evaluate(() => document.body.innerText);
                
                console.log('📊 Analyzing report content...');
                
                const checks = {
                  'Apple mentioned': textContent.includes('Apple') || textContent.includes('AAPL'),
                  'P/E ratio': textContent.includes('P/E') || textContent.includes('Price-to-Earnings'),
                  'ROE mentioned': textContent.includes('ROE') || textContent.includes('Return on Equity'),
                  'Debt mentioned': textContent.includes('Debt') || textContent.includes('Leverage'),
                  'Financial data': textContent.includes('Financial') || textContent.includes('Metrics'),
                  'Executive Summary': textContent.includes('Executive Summary'),
                  'Analysis section': textContent.includes('Analysis')
                };
                
                console.log('✅ Content verification:');
                Object.entries(checks).forEach(([check, passed]) => {
                  console.log(`  ${passed ? '✅' : '❌'} ${check}`);
                });
                
                // Look for specific financial values
                const financialValues = {
                  'P/E ~31': /P\/E.*3[0-9]|Price.*Earnings.*3[0-9]/.test(textContent),
                  'ROE ~138%': /ROE.*13[0-9]%|Return.*Equity.*13[0-9]%/.test(textContent),
                  'Debt/Equity ~147%': /Debt.*Equity.*14[0-9]%|Leverage.*14[0-9]%/.test(textContent)
                };
                
                console.log('🎯 Financial metrics verification:');
                Object.entries(financialValues).forEach(([metric, found]) => {
                  console.log(`  ${found ? '✅' : '❌'} ${metric}`);
                });
                
                // Save text content for manual review
                require('fs').writeFileSync('test-screenshots/report-content.txt', textContent);
                console.log('💾 Report content saved to report-content.txt');
                
              } catch (error) {
                console.log('⚠️ Report generation timeout or error');
                await page.screenshot({ path: 'test-screenshots/precise-08-timeout.png' });
              }
              
              return; // Exit after generation
            }
            
            progressMade = true;
            break;
          }
        }
        
        if (!progressMade) {
          console.log('❌ No more progress buttons found');
          break;
        }
        
        currentStep++;
      }
    } else {
      console.log('❌ Could not enable Next button - template selection failed');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'test-screenshots/precise-error.png' });
  } finally {
    console.log('🔍 Browser staying open for 30 seconds...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

preciseReportTest();