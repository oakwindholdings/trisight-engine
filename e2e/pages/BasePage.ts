// e2e/pages/BasePage.ts
// Base Page Object Model with common functionality
// Context: Provides shared methods for all page objects

import { Page, expect, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  
  // Common navigation elements
  readonly chartNavButton: Locator;
  readonly dashboardNavButton: Locator;
  readonly targetsNavButton: Locator;
  readonly reportsNavButton: Locator;
  
  // Common UI elements
  readonly loadingSpinner: Locator;
  readonly errorToast: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Navigation buttons
    this.chartNavButton = page.getByRole('button', { name: 'Chart' });
    this.dashboardNavButton = page.getByRole('button', { name: 'Dashboard' });
    this.targetsNavButton = page.getByRole('button', { name: 'Targets' });
    this.reportsNavButton = page.getByRole('button', { name: 'Reports' });
    
    // Common UI elements
    this.loadingSpinner = page.locator('[data-testid="loading-spinner"], [class*="spinner"], svg[class*="animate-spin"]');
    this.errorToast = page.locator('[role="alert"][class*="error"], [class*="toast-error"]');
    this.successToast = page.locator('[role="alert"][class*="success"], [class*="toast-success"]');
  }

  // Navigation methods
  async navigateToChart() {
    await this.chartNavButton.click();
    await this.page.waitForURL('**/chart');
  }

  async navigateToDashboard() {
    await this.dashboardNavButton.click();
    await this.page.waitForURL('**/dashboard');
  }

  async navigateToTargets() {
    await this.targetsNavButton.click();
    await this.page.waitForURL('**/targets');
  }

  async navigateToReports() {
    await this.reportsNavButton.click();
    await this.page.waitForURL('**/reports');
  }

  // Common wait methods
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async waitForApiResponse(apiPath: string, timeout: number = 10000) {
    await this.page.waitForResponse(
      response => response.url().includes(apiPath) && response.status() === 200,
      { timeout }
    );
  }

  async waitForLoadingToComplete(timeout: number = 10000) {
    // Wait for any loading spinners to disappear
    if (await this.loadingSpinner.isVisible()) {
      await expect(this.loadingSpinner).not.toBeVisible({ timeout });
    }
  }

  // Toast/Alert handling
  async waitForSuccessToast(expectedText?: string, timeout: number = 5000) {
    await expect(this.successToast).toBeVisible({ timeout });
    
    if (expectedText) {
      await expect(this.successToast).toContainText(expectedText);
    }
    
    return await this.successToast.textContent();
  }

  async waitForErrorToast(timeout: number = 5000) {
    await expect(this.errorToast).toBeVisible({ timeout });
    return await this.errorToast.textContent();
  }

  async dismissToast() {
    const closeButton = this.page.locator('[role="alert"] button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
  }

  // Dialog handling
  async acceptDialog(expectedText?: string) {
    this.page.once('dialog', async dialog => {
      if (expectedText) {
        expect(dialog.message()).toContain(expectedText);
      }
      await dialog.accept();
    });
  }

  async dismissDialog() {
    this.page.once('dialog', async dialog => {
      await dialog.dismiss();
    });
  }

  async handleDialogWithInput(inputText: string) {
    this.page.once('dialog', async dialog => {
      await dialog.accept(inputText);
    });
  }

  // Screenshot helpers
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `./e2e/screenshots/${name}.png`,
      fullPage: true 
    });
  }

  async takeElementScreenshot(locator: Locator, name: string) {
    await locator.screenshot({ 
      path: `./e2e/screenshots/${name}.png` 
    });
  }

  // Accessibility helpers
  async checkAccessibility(options?: {
    includeNotices?: boolean;
    excludeSelectors?: string[];
  }) {
    // This would integrate with axe-core or similar
    // For now, basic checks
    const images = await this.page.locator('img:not([alt])').count();
    expect(images).toBe(0);
    
    const buttons = await this.page.locator('button:not([aria-label]):not(:has-text(""))').count();
    expect(buttons).toBe(0);
  }

  // Performance helpers
  async measurePageLoadTime(): Promise<number> {
    const navigationTiming = await this.page.evaluate(() => {
      const timing = performance.timing;
      return timing.loadEventEnd - timing.navigationStart;
    });
    
    return navigationTiming;
  }

  async waitForNetworkIdle(timeout: number = 10000) {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  // Local storage helpers
  async getLocalStorageItem(key: string): Promise<any> {
    return await this.page.evaluate((k) => {
      const item = localStorage.getItem(k);
      return item ? JSON.parse(item) : null;
    }, key);
  }

  async setLocalStorageItem(key: string, value: any) {
    await this.page.evaluate(({ k, v }) => {
      localStorage.setItem(k, JSON.stringify(v));
    }, { k: key, v: value });
  }

  async clearLocalStorage() {
    await this.page.evaluate(() => localStorage.clear());
  }

  // Session storage helpers
  async getSessionStorageItem(key: string): Promise<any> {
    return await this.page.evaluate((k) => {
      const item = sessionStorage.getItem(k);
      return item ? JSON.parse(item) : null;
    }, key);
  }

  async setSessionStorageItem(key: string, value: any) {
    await this.page.evaluate(({ k, v }) => {
      sessionStorage.setItem(k, JSON.stringify(v));
    }, { k: key, v: value });
  }

  // Cookie helpers
  async getCookie(name: string) {
    const cookies = await this.page.context().cookies();
    return cookies.find(cookie => cookie.name === name);
  }

  async setCookie(name: string, value: string) {
    await this.page.context().addCookies([{
      name,
      value,
      domain: 'localhost',
      path: '/'
    }]);
  }

  // Network mocking helpers
  async mockApiResponse(urlPattern: string | RegExp, response: any) {
    await this.page.route(urlPattern, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  async mockApiError(urlPattern: string | RegExp, status: number = 500, message: string = 'Internal Server Error') {
    await this.page.route(urlPattern, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error: message })
      });
    });
  }

  // Viewport helpers
  async setMobileViewport() {
    await this.page.setViewportSize({ width: 375, height: 667 });
  }

  async setTabletViewport() {
    await this.page.setViewportSize({ width: 768, height: 1024 });
  }

  async setDesktopViewport() {
    await this.page.setViewportSize({ width: 1920, height: 1080 });
  }

  // Debug helpers
  async pauseTest() {
    if (process.env.DEBUG) {
      await this.page.pause();
    }
  }

  async logConsoleMessages() {
    this.page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
  }

  async logNetworkRequests() {
    this.page.on('request', request => {
      console.log(`>> ${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', response => {
      console.log(`<< ${response.status()} ${response.url()}`);
    });
  }

  // Retry helper for flaky operations
  async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await this.page.waitForTimeout(delay);
        }
      }
    }
    
    throw lastError;
  }
}