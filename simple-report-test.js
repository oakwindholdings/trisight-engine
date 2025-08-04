const { chromium } = require('playwright');

async function simpleReportTest() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to Reports page');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/simple-01-reports.png' });

    console.log('Step 2: Click New Report');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/simple-02-wizard.png' });

    console.log('Step 3: Click Equity Research template card');
    // Click on the first template card (Equity Research)
    const equityCard = page.locator('text=Equity Research').first();
    const cardContainer = equityCard.locator('..');
    await cardContainer.click();
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/simple-03-template-selected.png' });

    console.log('Step 4: Check if Next is enabled and click');
    const nextButton = page.locator('button:has-text("Next")');
    
    // Wait for Next to be enabled
    await nextButton.waitFor({ state: 'attached' });
    
    if (await nextButton.isEnabled()) {
      console.log('✅ Next button is enabled, clicking...');
      await nextButton.click();
    } else {
      console.log('❌ Next button is disabled, trying to select template again...');
      // Try clicking the entire card area
      await page.click('[data-testid="template-equity-research"], .template-card:first-child, div:has-text("Equity Research") svg', { force: true });
      await page.waitForTimeout(1000);
      
      if (await nextButton.isEnabled()) {
        await nextButton.click();
      } else {
        console.log('Still disabled, ending test');
        return;
      }
    }

    await page.waitForTimeout(4000);
    await page.screenshot({ path: 'test-screenshots/simple-04-form-step.png' });

    console.log('Step 5: Fill form');
    // Wait for inputs to be visible
    await page.waitForSelector('input', { timeout: 10000 });
    
    const inputs = await page.locator('input[type="text"], input:not([type])').all();
    console.log(`Found ${inputs.length} text inputs`);
    
    if (inputs.length >= 1) {
      await inputs[0].fill('AAPL');
      console.log('✅ Filled symbol: AAPL');
    }
    
    if (inputs.length >= 2) {
      await inputs[1].fill('Apple Inc. Fixed Data Pipeline Test');
      console.log('✅ Filled title');
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/simple-05-filled.png' });

    console.log('Step 6: Navigate to generation');
    // Continue clicking Next/Generate buttons
    for (let i = 0; i < 4; i++) {
      const buttons = await page.locator('button:visible:not([disabled])').all();
      let clicked = false;
      
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && (text.includes('Next') || text.includes('Generate') || text.includes('Create'))) {
          console.log(`Clicking: ${text.trim()}`);
          await button.click();
          clicked = true;
          
          if (text.includes('Generate') || text.includes('Create')) {
            console.log('🎉 Generation button clicked!');
            
            // Wait for report generation
            console.log('Waiting for report generation...');
            
            try {
              // Wait for content to appear (2 minute timeout)
              await page.waitForFunction(() => {
                const text = document.body.innerText.toLowerCase();
                return text.includes('apple') || 
                       text.includes('executive summary') ||
                       text.includes('financial analysis') ||
                       text.includes('p/e') ||
                       document.querySelector('.report-content') !== null;
              }, { timeout: 120000 });
              
              console.log('✅ Report generated successfully!');
              await page.screenshot({ path: 'test-screenshots/simple-06-report.png', fullPage: true });
              
              // Get the generated content
              const textContent = await page.evaluate(() => document.body.innerText);
              
              // Check for financial metrics
              const hasApple = textContent.includes('Apple') || textContent.includes('AAPL');
              const hasPE = textContent.includes('P/E') || textContent.includes('Price-to-Earnings');
              const hasROE = textContent.includes('ROE') || textContent.includes('Return on Equity');
              const hasDebt = textContent.includes('Debt') || textContent.includes('Leverage');
              
              console.log('📊 Report Analysis:');
              console.log(`✅ Apple content: ${hasApple}`);
              console.log(`${hasPE ? '✅' : '❌'} P/E ratio: ${hasPE}`);
              console.log(`${hasROE ? '✅' : '❌'} ROE: ${hasROE}`);
              console.log(`${hasDebt ? '✅' : '❌'} Debt metrics: ${hasDebt}`);
              
              // Look for specific values
              const pe31 = /P\/E.*3[0-9]|Price.*Earnings.*3[0-9]/.test(textContent);
              const roe138 = /ROE.*13[0-9]%|Return.*Equity.*13[0-9]%/.test(textContent);
              const debt147 = /Debt.*Equity.*14[0-9]%/.test(textContent);
              
              console.log('🎯 Target Values:');
              console.log(`${pe31 ? '✅' : '❌'} P/E ~31: ${pe31}`);
              console.log(`${roe138 ? '✅' : '❌'} ROE ~138%: ${roe138}`);
              console.log(`${debt147 ? '✅' : '❌'} Debt/Equity ~147%: ${debt147}`);
              
              // Save full content
              require('fs').writeFileSync('test-screenshots/report-full-content.txt', textContent);
              console.log('💾 Full report saved to report-full-content.txt');
              
            } catch (error) {
              console.log('⚠️ Report generation timed out');
              await page.screenshot({ path: 'test-screenshots/simple-06-timeout.png' });
            }
            
            return; // Exit after generation
          }
          
          break;
        }
      }
      
      if (!clicked) {
        console.log('No more buttons to click');
        break;
      }
      
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `test-screenshots/simple-step-${i + 6}.png` });
    }

  } catch (error) {
    console.error('Error:', error);
    await page.screenshot({ path: 'test-screenshots/simple-error.png' });
  } finally {
    console.log('Test completed, keeping browser open for inspection...');
    await page.waitForTimeout(45000);
    await browser.close();
  }
}

simpleReportTest();