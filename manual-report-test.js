const { chromium } = require('playwright');

async function manualReportTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    console.log('Step 1: Navigate to Reports page');
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/manual-01-reports-page.png' });

    console.log('Step 2: Click New Report button');
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-screenshots/manual-02-new-report-modal.png' });

    console.log('Step 3: Click Equity Research template');
    await page.click('text=Equity Research');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/manual-03-template-selected.png' });

    console.log('Step 4: Click Next button');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-screenshots/manual-04-form-step.png' });

    console.log('Waiting for form to appear...');
    // Wait for the actual form elements to appear
    await page.waitForTimeout(2000);
    
    // Check what form elements are available
    const formElements = await page.locator('input, select, textarea').all();
    console.log(`Found ${formElements.length} form elements`);
    
    for (let i = 0; i < Math.min(formElements.length, 5); i++) {
      const placeholder = await formElements[i].getAttribute('placeholder');
      const name = await formElements[i].getAttribute('name');
      const type = await formElements[i].getAttribute('type');
      console.log(`Form element ${i}: name="${name}", placeholder="${placeholder}", type="${type}"`);
    }

    // Try to fill the symbol field more specifically
    try {
      // Look for symbol input field
      const symbolField = page.locator('input').filter({ hasText: /symbol|ticker/i }).first();
      if (await symbolField.isVisible({ timeout: 5000 })) {
        await symbolField.fill('AAPL');
        console.log('Filled symbol field with AAPL');
      } else {
        // Try any text input field
        const textInputs = await page.locator('input[type="text"], input:not([type])').all();
        if (textInputs.length > 0) {
          await textInputs[0].fill('AAPL');
          console.log('Filled first text input with AAPL');
        }
      }
    } catch (error) {
      console.log('Could not fill symbol field:', error.message);
    }

    // Try to fill title field
    try {
      const titleField = page.locator('input').filter({ hasText: /title|name/i }).first();
      if (await titleField.isVisible({ timeout: 5000 })) {
        await titleField.fill('Apple Inc. Fixed Data Pipeline Test');
        console.log('Filled title field');
      } else {
        // Try second text input field
        const textInputs = await page.locator('input[type="text"], input:not([type])').all();
        if (textInputs.length > 1) {
          await textInputs[1].fill('Apple Inc. Fixed Data Pipeline Test');
          console.log('Filled second text input with title');
        }
      }
    } catch (error) {
      console.log('Could not fill title field:', error.message);
    }

    await page.screenshot({ path: 'test-screenshots/manual-05-form-filled.png' });

    console.log('Step 5: Continue through wizard steps');
    // Keep clicking Next until we reach Generate
    for (let step = 0; step < 5; step++) {
      console.log(`Looking for Next/Continue/Generate button - step ${step}`);
      
      const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Generate Report"), button:has-text("Generate")').first();
      
      if (await nextButton.isVisible({ timeout: 5000 })) {
        const buttonText = await nextButton.textContent();
        console.log(`Clicking button: "${buttonText}"`);
        
        await nextButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `test-screenshots/manual-06-step-${step}.png` });
        
        if (buttonText && buttonText.toLowerCase().includes('generate')) {
          console.log('Found Generate button! Report generation starting...');
          
          // Wait for report generation to complete
          console.log('Waiting for report generation to complete (up to 2 minutes)...');
          
          try {
            // Wait for report content to appear
            await page.waitForSelector('.report-content, .generated-report, .report-section, [data-testid="report"]', { timeout: 120000 });
            console.log('Report generation completed successfully!');
            
            // Take screenshots of the generated report
            await page.screenshot({ path: 'test-screenshots/manual-07-report-generated.png', fullPage: true });
            
            // Look for financial metrics specifically
            const pageContent = await page.content();
            const hasFinancialData = pageContent.includes('P/E') || pageContent.includes('ROE') || pageContent.includes('Debt');
            
            if (hasFinancialData) {
              console.log('✅ Financial metrics found in the generated report!');
              
              // Try to scroll to financial section
              const financialElements = await page.locator('text=P/E, text=ROE, text=Debt').all();
              if (financialElements.length > 0) {
                await financialElements[0].scrollIntoViewIfNeeded();
                await page.screenshot({ path: 'test-screenshots/manual-08-financial-section.png' });
              }
            } else {
              console.log('❌ No financial metrics found in the report');
            }
            
            // Check for specific values we're testing
            if (pageContent.includes('31') && pageContent.includes('P/E')) {
              console.log('✅ P/E ratio ~31 found!');
            }
            if (pageContent.includes('138') && pageContent.includes('ROE')) {
              console.log('✅ ROE ~138% found!');
            }
            if (pageContent.includes('147') && pageContent.includes('Debt')) {
              console.log('✅ Debt/Equity ~147% found!');
            }
            
          } catch (error) {
            console.log('⚠️ Report generation timed out or failed');
            await page.screenshot({ path: 'test-screenshots/manual-07-generation-timeout.png' });
          }
          
          break; // Exit the loop after generation attempt
        }
      } else {
        console.log('No more Next/Continue buttons found');
        break;
      }
    }

    console.log('Test completed!');
    
    // Keep browser open for manual inspection
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-screenshots/manual-error.png' });
  } finally {
    await browser.close();
  }
}

manualReportTest();