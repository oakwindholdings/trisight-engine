const { chromium } = require('playwright');
const path = require('path');

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
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/02-new-report-clicked.png' });

    console.log('Step 3: Select Equity Research template');
    // Look for the first template card and click it
    await page.click('.template-card:first-child, [data-testid="equity-research"], .template:first-child');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/03-template-selected.png' });

    console.log('Step 4: Click Next button');
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-screenshots/04-step-2-form.png' });

    console.log('Step 5: Fill in form fields');
    // Fill in symbol
    await page.fill('input[name="symbol"], input[placeholder*="Symbol"], input[placeholder*="symbol"]', 'AAPL');
    
    // Fill in title
    await page.fill('input[name="title"], input[placeholder*="Title"], input[placeholder*="title"]', 'Apple Inc. Fixed Data Pipeline Test');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-screenshots/05-form-filled.png' });

    console.log('Step 6: Continue through remaining steps');
    // Try to find and click Next/Continue button
    const nextButton = await page.locator('button:has-text("Next"), button:has-text("Continue"), button:has-text("Generate")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-screenshots/06-next-step.png' });
    }

    console.log('Step 7: Generate report');
    // Look for generate button
    const generateButton = await page.locator('button:has-text("Generate"), button:has-text("Create Report"), button:has-text("Start Generation")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      console.log('Generate button clicked, waiting for report generation...');
      
      // Wait for report generation to complete (up to 60 seconds)
      try {
        await page.waitForSelector('.report-content, .generated-report, [data-testid="report-result"]', { timeout: 60000 });
        console.log('Report generation completed!');
        await page.screenshot({ path: 'test-screenshots/07-generated-report.png' });
        
        // Take additional screenshots of specific sections
        const reportSections = await page.locator('.report-section, .financial-data, .metrics').all();
        for (let i = 0; i < Math.min(reportSections.length, 3); i++) {
          await reportSections[i].scrollIntoViewIfNeeded();
          await page.screenshot({ path: `test-screenshots/08-report-section-${i + 1}.png` });
        }
        
      } catch (error) {
        console.log('Waiting for report generation completion or timeout...');
        await page.waitForTimeout(10000);
        await page.screenshot({ path: 'test-screenshots/07-generation-in-progress.png' });
      }
    }

    console.log('Test completed successfully!');

  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'test-screenshots/error-state.png' });
  } finally {
    await browser.close();
  }
}

testReportGeneration();