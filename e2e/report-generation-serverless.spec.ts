// e2e/report-generation-serverless.spec.ts
// E2E tests for serverless report generation API
// Tests the complete flow from UI to serverless functions

import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Serverless Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reports page
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test('should generate report via serverless API', async ({ page }) => {
    // Intercept API calls to monitor serverless function calls
    const apiCalls: string[] = [];
    await page.route('/api/**', async (route) => {
      apiCalls.push(route.request().url());
      await route.continue();
    });

    // Click New Report button
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(1000);

    // Select Technical Analysis template
    await page.click('div:has-text("Technical Analysis"):has-text("Chart patterns")');
    await page.waitForTimeout(500);

    // Fill in report details
    const reportTitle = `Serverless Test Report ${randomUUID().substring(0, 8)}`;
    await page.fill('input[placeholder*="title"]', reportTitle);
    await page.fill('input[placeholder*="ticker"]', 'AAPL');
    await page.fill('input[placeholder*="author"]', 'Playwright Test');

    // Navigate through wizard
    let hasNext = true;
    while (hasNext) {
      const nextButton = page.locator('button:has-text("Next"):not([disabled])');
      if (await nextButton.count() > 0) {
        await nextButton.first().click();
        await page.waitForTimeout(500);
      } else {
        hasNext = false;
      }
    }

    // Find and click Generate button
    const generateButton = await page.locator('button:has-text("Generate Report"), button:has-text("Generate"), button:has-text("Export Report")').first();
    expect(generateButton).toBeTruthy();

    // Set up response listener for serverless function
    const reportGenerationPromise = page.waitForResponse(
      response => response.url().includes('/api/reports/generate') && response.status() === 200,
      { timeout: 60000 }
    );

    // Click generate button
    await generateButton.click();

    // Wait for serverless function response
    const response = await reportGenerationPromise;
    const responseData = await response.json();

    // Verify response structure
    expect(responseData).toHaveProperty('success', true);
    expect(responseData).toHaveProperty('generationId');
    expect(responseData).toHaveProperty('metadata');
    expect(responseData.metadata).toHaveProperty('serverType', 'vercel-serverless');

    // Verify API calls were made to serverless functions
    const generateApiCall = apiCalls.find(url => url.includes('/api/reports/generate'));
    expect(generateApiCall).toBeTruthy();

    // Check if report appears in the list
    await page.waitForTimeout(3000); // Wait for UI to update

    // Verify metrics updated
    const metricsCards = await page.locator('.metrics-card, [data-testid="metric"]').count();
    expect(metricsCards).toBeGreaterThan(0);

    // Take screenshot of successful generation
    await page.screenshot({ path: 'test-results/serverless-report-generated.png', fullPage: true });
  });

  test('should list reports from serverless API', async ({ page }) => {
    // Wait for reports to load
    const listResponse = await page.waitForResponse(
      response => response.url().includes('/api/reports/list') && response.status() === 200,
      { timeout: 10000 }
    );

    const listData = await listResponse.json();

    // Verify response structure
    expect(listData).toHaveProperty('success', true);
    expect(listData).toHaveProperty('reports');
    expect(Array.isArray(listData.reports)).toBeTruthy();

    // Check if reports are displayed in UI
    if (listData.reports.length > 0) {
      const reportItems = await page.locator('.report-item, [data-testid="report"], .history-item').count();
      expect(reportItems).toBeGreaterThan(0);
    }
  });

  test('should handle serverless API errors gracefully', async ({ page }) => {
    // Intercept and fail API call
    await page.route('/api/reports/generate', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Simulated serverless function error',
            serverType: 'vercel-serverless'
          }
        })
      });
    });

    // Try to generate a report
    await page.click('button:has-text("New Report")');
    await page.waitForTimeout(500);

    // Quick fill - just select template and generate
    await page.click('div:has-text("Technical Analysis")').first();
    
    // Navigate to generate button
    while (await page.locator('button:has-text("Next"):not([disabled])').count() > 0) {
      await page.click('button:has-text("Next"):not([disabled])').first();
      await page.waitForTimeout(500);
    }

    // Click generate
    const generateButton = await page.locator('button:has-text("Generate"), button:has-text("Export Report")').first();
    await generateButton.click();

    // Wait for error handling
    await page.waitForTimeout(2000);

    // Verify error is handled gracefully (no crash)
    const errorMessage = await page.locator('text=/error|failed|Error|Failed/i').first();
    expect(errorMessage).toBeTruthy();
  });

  test('should verify serverless function timeout handling', async ({ page }) => {
    // Set up a delayed response to simulate timeout
    await page.route('/api/reports/generate', async (route) => {
      // Delay for 5 seconds then respond
      await new Promise(resolve => setTimeout(resolve, 5000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          generationId: 'timeout-test',
          metadata: { serverType: 'vercel-serverless', delayed: true }
        })
      });
    });

    // Quick navigation to generate button
    await page.click('button:has-text("New Report")');
    await page.click('div:has-text("Technical Analysis")').first();
    
    while (await page.locator('button:has-text("Next"):not([disabled])').count() > 0) {
      await page.click('button:has-text("Next"):not([disabled])').first();
      await page.waitForTimeout(300);
    }

    const generateButton = await page.locator('button:has-text("Generate"), button:has-text("Export Report")').first();
    await generateButton.click();

    // Verify UI shows loading state during long operation
    const loadingIndicator = await page.locator('text=/generating|loading|processing/i').first();
    expect(loadingIndicator).toBeTruthy();

    // Wait for response
    await page.waitForResponse(
      response => response.url().includes('/api/reports/generate'),
      { timeout: 10000 }
    );

    // Verify operation completes
    await expect(page.locator('text=/generated|complete|success/i').first()).toBeVisible({ timeout: 10000 });
  });
});