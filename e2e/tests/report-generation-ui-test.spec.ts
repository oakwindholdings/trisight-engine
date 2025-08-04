// e2e/tests/report-generation-ui-test.spec.ts
// Targeted test for report generation UI flow based on actual interface
// Context: Tests the report generation flow with the current UI implementation

import { test, expect } from '@playwright/test';

test.describe('Report Generation - Actual UI Flow', () => {
  test('should navigate through report generation UI and document the process', async ({ page }) => {
    // Navigate to reports page
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    // Take initial screenshot
    await page.screenshot({
      path: 'test-screenshots/step-01-reports-page-loaded.png',
      fullPage: true
    });
    
    console.log('=== STEP 1: Initial Reports Page ===');
    console.log('Page loaded successfully');
    
    // Verify we're on the reports page
    await expect(page.locator('text=Report Generation Center')).toBeVisible();
    await expect(page.locator('text=Report Wizard')).toBeVisible();
    
    // Check if there's already a symbol in the input
    const symbolInput = page.locator('input[placeholder*="NVDA, TSI"], input[placeholder*="Symbol"]').first();
    if (await symbolInput.isVisible()) {
      const currentValue = await symbolInput.inputValue();
      console.log('Current symbol in input:', currentValue);
    }
    
    // Look for the "New Report" button
    const newReportButton = page.locator('button:has-text("New Report")');
    if (await newReportButton.isVisible()) {
      console.log('Found "New Report" button');
      await newReportButton.click();
      
      await page.screenshot({
        path: 'test-screenshots/step-02-new-report-clicked.png',
        fullPage: true
      });
      
      console.log('=== STEP 2: New Report Button Clicked ===');
    } else {
      console.log('New Report button not found, continuing with wizard');
    }
    
    // Look for template selection in the Templates section
    const templatesSection = page.locator('text=Templates').locator('..');
    if (await templatesSection.isVisible()) {
      console.log('Found Templates section');
      
      // Look for Equity Research template
      const equityTemplate = templatesSection.locator('text=Equity Research').first();
      if (await equityTemplate.isVisible()) {
        console.log('Found Equity Research template');
        
        // Try to click it - use force if needed due to styling
        try {
          await equityTemplate.click({ timeout: 5000 });
        } catch (e) {
          console.log('Direct click failed, trying with force');
          await equityTemplate.click({ force: true });
        }
        
        await page.screenshot({
          path: 'test-screenshots/step-03-template-selected.png',
          fullPage: true
        });
        
        console.log('=== STEP 3: Template Selected ===');
      }
    }
    
    // Check if there's a symbol input field and fill it with AAPL
    const addSymbolInput = page.locator('input[placeholder*="NVDA, TSI"], input[placeholder*="Symbol"], input[placeholder*="Add Symbol"]').first();
    if (await addSymbolInput.isVisible()) {
      console.log('Found symbol input field');
      
      // Clear and add AAPL
      await addSymbolInput.clear();
      await addSymbolInput.fill('AAPL');
      
      // Look for Add Symbol button
      const addSymbolButton = page.locator('button:has-text("Add Symbol")');
      if (await addSymbolButton.isVisible()) {
        await addSymbolButton.click();
        console.log('Added AAPL symbol');
      }
      
      await page.screenshot({
        path: 'test-screenshots/step-04-symbol-added.png',
        fullPage: true
      });
      
      console.log('=== STEP 4: AAPL Symbol Added ===');
    }
    
    // Look for Next button in the wizard
    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isVisible() && await nextButton.isEnabled()) {
      console.log('Found enabled Next button');
      await nextButton.click();
      
      await page.screenshot({
        path: 'test-screenshots/step-05-next-clicked.png',
        fullPage: true
      });
      
      console.log('=== STEP 5: Next Button Clicked ===');
      
      // Wait for the next step to load
      await page.waitForTimeout(2000);
    }
    
    // Look for any form fields or configuration options
    const titleInput = page.locator('input[placeholder*="title"], input[name="title"]').first();
    if (await titleInput.isVisible()) {
      console.log('Found title input field');
      await titleInput.fill('Test Report with Fixed Data - AAPL Analysis');
      
      await page.screenshot({
        path: 'test-screenshots/step-06-title-filled.png',
        fullPage: true
      });
      
      console.log('=== STEP 6: Title Filled ===');
    }
    
    // Look for generate/create/submit buttons
    const actionButtons = page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("Submit")');
    const actionButtonCount = await actionButtons.count();
    
    if (actionButtonCount > 0) {
      console.log(`Found ${actionButtonCount} action buttons`);
      
      for (let i = 0; i < actionButtonCount; i++) {
        const button = actionButtons.nth(i);
        const buttonText = await button.textContent();
        const isEnabled = await button.isEnabled();
        console.log(`Button ${i + 1}: "${buttonText}" - Enabled: ${isEnabled}`);
      }
      
      // Try to click the first enabled button
      const firstEnabledButton = actionButtons.first();
      if (await firstEnabledButton.isEnabled()) {
        console.log('Clicking first enabled action button');
        await firstEnabledButton.click();
        
        await page.screenshot({
          path: 'test-screenshots/step-07-generation-started.png',
          fullPage: true
        });
        
        console.log('=== STEP 7: Report Generation Started ===');
        
        // Wait a bit to see if there's any loading state
        await page.waitForTimeout(5000);
        
        await page.screenshot({
          path: 'test-screenshots/step-08-generation-progress.png',
          fullPage: true
        });
        
        console.log('=== STEP 8: Generation Progress ===');
        
        // Look for success indicators or results
        const successIndicators = page.locator('text=/success|complete|generated|report.*ready/i');
        const errorIndicators = page.locator('text=/error|failed|problem/i');
        
        if (await successIndicators.count() > 0) {
          console.log('Found success indicators:', await successIndicators.allTextContents());
        }
        
        if (await errorIndicators.count() > 0) {
          console.log('Found error indicators:', await errorIndicators.allTextContents());
        }
        
        // Look for any financial data displayed
        const financialDataElements = page.locator('text=/\\$[0-9]+|[0-9]+\\.[0-9]+%|revenue|earnings|price/i');
        const dataCount = await financialDataElements.count();
        
        if (dataCount > 0) {
          console.log(`Found ${dataCount} financial data elements`);
          const sampleData = await financialDataElements.first().textContent();
          console.log('Sample financial data:', sampleData);
        }
        
        await page.screenshot({
          path: 'test-screenshots/step-09-final-result.png',
          fullPage: true
        });
        
        console.log('=== STEP 9: Final Result ===');
      }
    }
    
    // Take a comprehensive final screenshot
    await page.screenshot({
      path: 'test-screenshots/step-10-comprehensive-final.png',
      fullPage: true
    });
    
    // Log current page state
    const pageTitle = await page.title();
    const url = page.url();
    console.log(`Final state - Title: ${pageTitle}, URL: ${url}`);
    
    // Check for any visible charts or data visualizations
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"]');
    const chartCount = await charts.count();
    console.log(`Found ${chartCount} potential chart elements`);
    
    console.log('=== TEST COMPLETED ===');
    console.log('Screenshots saved to test-screenshots/ directory');
  });
  
  test('should capture detailed state of report wizard', async ({ page }) => {
    await page.goto('http://localhost:3000/reports');
    await page.waitForLoadState('networkidle');
    
    // Focus on the Report Wizard section
    const wizardSection = page.locator('text=Report Wizard').locator('..');
    
    if (await wizardSection.isVisible()) {
      await wizardSection.screenshot({
        path: 'test-screenshots/wizard-section-detail.png'
      });
      
      // Log wizard content
      const wizardText = await wizardSection.textContent();
      console.log('Report Wizard content:', wizardText?.substring(0, 500));
      
      // Check step indicator
      const stepIndicator = page.locator('text=Step 1 of 4');
      if (await stepIndicator.isVisible()) {
        console.log('Currently on Step 1 of 4');
      }
    }
    
    // Capture Templates section
    const templatesSection = page.locator('text=Templates').locator('..');
    if (await templatesSection.isVisible()) {
      await templatesSection.screenshot({
        path: 'test-screenshots/templates-section-detail.png'
      });
      
      const templateItems = templatesSection.locator('[class*="template"], li, div').filter({ hasText: /research|analysis|report/i });
      const templateCount = await templateItems.count();
      console.log(`Found ${templateCount} template items`);
      
      for (let i = 0; i < Math.min(templateCount, 5); i++) {
        const templateText = await templateItems.nth(i).textContent();
        console.log(`Template ${i + 1}:`, templateText?.trim());
      }
    }
  });
});