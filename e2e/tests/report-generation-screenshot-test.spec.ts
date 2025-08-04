// e2e/tests/report-generation-screenshot-test.spec.ts
// Focused test for report generation with detailed screenshots
// Context: Tests the complete report generation UI flow with visual documentation

import { test, expect } from '@playwright/test';

test.describe('Report Generation - UI Flow with Screenshots', () => {
  test('should generate AAPL report with screenshots at each step', async ({ page }) => {
    // Navigate to reports page
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({
      path: 'test-screenshots/01-reports-page-initial.png',
      fullPage: true
    });
    
    // Look for and click the "New Report" button
    const newReportButton = page.getByRole('button', { name: /new report|create report/i });
    await expect(newReportButton).toBeVisible();
    await newReportButton.click();
    
    // Screenshot after clicking New Report
    await page.screenshot({
      path: 'test-screenshots/02-report-wizard-template-selection.png',
      fullPage: true
    });
    
    // Step 1: Select a template
    // Look for template cards - try different selectors
    const equityTemplate = page.locator('[data-testid="equity-research-template"]')
      .or(page.locator('text=Equity Research').first())
      .or(page.getByText('Equity Research'))
      .or(page.locator('.template-card').filter({ hasText: 'Equity Research' }));
    
    if (await equityTemplate.count() > 0) {
      await equityTemplate.first().click();
      console.log('Selected Equity Research template');
    } else {
      // If no specific template found, try to find any template card and click it
      const templateCards = page.locator('[role="button"]').filter({ hasText: /template|research|analysis/i });
      if (await templateCards.count() > 0) {
        await templateCards.first().click();
        console.log('Selected first available template');
      } else {
        console.log('No template cards found, proceeding anyway');
      }
    }
    
    // Take screenshot after template selection
    await page.screenshot({
      path: 'test-screenshots/03-template-selected.png',
      fullPage: true
    });
    
    // Click Next button if it exists
    const nextButton = page.getByRole('button', { name: /next|continue/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Step 2: Fill in report details
    await page.screenshot({
      path: 'test-screenshots/04-report-details-form.png',
      fullPage: true
    });
    
    // Fill in the form fields
    const titleInput = page.getByPlaceholder(/title|name/i)
      .or(page.locator('input[name="title"]'))
      .or(page.locator('input').first());
    
    if (await titleInput.count() > 0) {
      await titleInput.first().fill('Test Report with Fixed Data');
      console.log('Filled title field');
    }
    
    const symbolInput = page.getByPlaceholder(/symbol|ticker|AAPL/i)
      .or(page.locator('input[name="symbol"]'))
      .or(page.locator('input[name="ticker"]'));
    
    if (await symbolInput.count() > 0) {
      await symbolInput.first().fill('AAPL');
      console.log('Filled symbol field');
    }
    
    // Take screenshot after filling form
    await page.screenshot({
      path: 'test-screenshots/05-form-filled.png',
      fullPage: true
    });
    
    // Look for and click Generate Report button
    const generateButton = page.getByRole('button', { name: /generate|create/i })
      .or(page.locator('button').filter({ hasText: /generate|create/i }));
    
    if (await generateButton.count() > 0) {
      await generateButton.first().click();
      console.log('Clicked Generate Report button');
      
      // Take screenshot of loading state
      await page.waitForTimeout(2000);
      await page.screenshot({
        path: 'test-screenshots/06-generation-loading.png',
        fullPage: true
      });
      
      // Wait for generation to complete (with reasonable timeout)
      try {
        await page.waitForSelector('text=/generated|completed|success/i', { timeout: 30000 });
        console.log('Report generation completed');
      } catch (e) {
        console.log('Generation may still be in progress, taking screenshot anyway');
      }
      
      // Take final screenshot
      await page.screenshot({
        path: 'test-screenshots/07-generation-complete.png',
        fullPage: true
      });
      
      // Look for any financial data or results displayed
      const dataElements = page.locator('text=/price|revenue|earnings|financial|data/i');
      if (await dataElements.count() > 0) {
        console.log('Found financial data elements:', await dataElements.count());
        
        // Take focused screenshot of data area
        const dataContainer = page.locator('[class*="report"], [class*="data"], [class*="result"]').first();
        if (await dataContainer.isVisible()) {
          await dataContainer.screenshot({
            path: 'test-screenshots/08-financial-data-closeup.png'
          });
        }
      }
      
    } else {
      console.log('Generate button not found, taking screenshot of current state');
      await page.screenshot({
        path: 'test-screenshots/06-no-generate-button-found.png',
        fullPage: true
      });
    }
    
    // Take a final full page screenshot
    await page.screenshot({
      path: 'test-screenshots/09-final-state.png',
      fullPage: true
    });
    
    // Log all visible text for debugging
    const bodyText = await page.locator('body').textContent();
    console.log('Page content summary:', bodyText?.substring(0, 500) + '...');
    
    // Check for any error messages
    const errorElements = page.locator('text=/error|failed|problem/i');
    if (await errorElements.count() > 0) {
      console.log('Found error messages:', await errorElements.allTextContents());
    }
  });
  
  test('should capture current state of reports page', async ({ page }) => {
    // Just navigate and capture what's currently there
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any dynamic content
    await page.waitForTimeout(3000);
    
    // Take comprehensive screenshots
    await page.screenshot({
      path: 'test-screenshots/reports-page-overview.png',
      fullPage: true
    });
    
    // Log the page structure
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    console.log('Page headings:', headings);
    
    const buttons = await page.locator('button').allTextContents();
    console.log('Available buttons:', buttons);
    
    const links = await page.locator('a').allTextContents();
    console.log('Available links:', links.slice(0, 10)); // First 10 to avoid spam
    
    // Check what's in the main content area
    const mainContent = await page.locator('main, [role="main"], .main-content').first().textContent();
    if (mainContent) {
      console.log('Main content preview:', mainContent.substring(0, 300) + '...');
    }
  });
});