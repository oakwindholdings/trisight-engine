const { chromium } = require('playwright');

async function testReportGeneration() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to Reports page');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/01-reports-page.png' });

    console.log('Step 2: Click New Report button');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/02-new-report-clicked.png' });

    console.log('Step 3: Look for template options');
    // Wait for any modal or template selection to appear
    await page.waitForTimeout(1000);
    
    // Try different selectors for equity research template
    const templateSelectors = [
      'text=Equity Research',
      'text=equity research',  
      '[data-template="equity-research"]',
      '.template:first-child',
      'button:has-text("Equity")',
      'div:has-text("Equity Research")',
      '.template-card:first-child'
    ];

    let templateFound = false;
    for (const selector of templateSelectors) {
      try {
        const template = page.locator(selector).first();
        if (await template.isVisible({ timeout: 1000 })) {
          console.log(`Found template with selector: ${selector}`);
          await template.click();
          templateFound = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (!templateFound) {
      console.log('No template selector worked, looking for all visible elements...');
      const allElements = await page.locator('div, button, span').all();
      for (let i = 0; i < Math.min(allElements.length, 20); i++) {
        const text = await allElements[i].textContent();
        if (text && text.toLowerCase().includes('equity')) {
          console.log(`Found equity element: "${text}"`);
          await allElements[i].click();
          templateFound = true;
          break;
        }
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/03-template-selection.png' });

    console.log('Step 4: Click Next/Continue');
    const nextSelectors = ['button:has-text("Next")', 'button:has-text("Continue")', 'button:has-text("Proceed")'];
    for (const selector of nextSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/04-step-2-form.png' });

    console.log('Step 5: Fill in form fields');
    // Try multiple ways to find and fill the symbol field
    const symbolSelectors = [
      'input[name="symbol"]',
      'input[placeholder*="symbol"]',
      'input[placeholder*="Symbol"]',
      'input[placeholder*="ticker"]',
      'input[placeholder*="Ticker"]',
      'input:first-of-type'
    ];

    for (const selector of symbolSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          await input.fill('AAPL');
          console.log(`Filled symbol with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Try multiple ways to find and fill the title field
    const titleSelectors = [
      'input[name="title"]',
      'input[placeholder*="title"]',
      'input[placeholder*="Title"]',
      'input[placeholder*="name"]',
      'input[placeholder*="Name"]'
    ];

    for (const selector of titleSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          await input.fill('Apple Inc. Fixed Data Pipeline Test');
          console.log(`Filled title with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/05-form-filled.png' });

    console.log('Step 6: Continue through steps');
    // Keep clicking Next/Continue until we find Generate
    for (let step = 0; step < 5; step++) {
      const buttons = await page.locator('button').all();
      let foundNext = false;
      
      for (const button of buttons) {
        const text = await button.textContent();
        if (text && (text.includes('Next') || text.includes('Continue') || text.includes('Generate'))) {
          console.log(`Clicking button: "${text}"`);
          await button.click();
          foundNext = true;
          
          if (text.includes('Generate')) {
            console.log('Found Generate button, report generation starting...');
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'test-screenshots/06-generation-started.png' });
            
            // Wait for report generation (up to 60 seconds)
            try {
              await page.waitForSelector('.report-content, .generated-report, [data-testid="report-result"], .report-section', { timeout: 60000 });
              console.log('Report generation completed!');
              
              // Scroll and capture the report
              await page.evaluate(() => window.scrollTo(0, 0));
              await page.screenshot({ path: 'test-screenshots/07-final-report-top.png' });
              
              await page.evaluate(() => window.scrollTo(0, window.innerHeight));
              await page.screenshot({ path: 'test-screenshots/08-final-report-middle.png' });
              
              await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
              await page.screenshot({ path: 'test-screenshots/09-final-report-bottom.png' });
              
              // Look for specific financial metrics
              const pageContent = await page.content();
              if (pageContent.includes('P/E') || pageContent.includes('ROE') || pageContent.includes('Debt')) {
                console.log('Financial metrics found in report!');
                
                // Try to capture financial data section specifically
                const financialSection = page.locator('text=P/E').first();
                if (await financialSection.isVisible({ timeout: 5000 })) {
                  await financialSection.scrollIntoViewIfNeeded();
                  await page.screenshot({ path: 'test-screenshots/10-financial-metrics.png' });
                }
              }
              
            } catch (error) {
              console.log('Report generation timeout or error, capturing current state...');
              await page.screenshot({ path: 'test-screenshots/07-generation-timeout.png' });
            }
            
            return; // Exit the function after generation attempt
          }
          
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `test-screenshots/step-${step + 6}.png` });
          break;
        }
      }
      
      if (!foundNext) {
        console.log('No more Next/Continue buttons found');
        break;
      }
    }

    console.log('Test completed!');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

testReportGeneration();