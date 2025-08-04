// playwright.config.ts
// Playwright E2E test configuration
// Context: Configuration for end-to-end tests following testing.mdc guidelines

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e/tests',
  
  // Test file patterns
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  
  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'e2e/playwright-report' }],
    ['junit', { outputFile: 'test-results/e2e/results.xml' }],
    ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL for tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Trace and screenshot settings
    trace: process.env.CI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',
    
    // Action timeout
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Browser settings
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
    
    // Locale and timezone
    locale: 'en-US',
    timezoneId: 'America/New_York',
    
    // User agent (if needed)
    userAgent: 'TriSight E2E Tests',
    
    // Permission and features
    permissions: ['clipboard-read', 'clipboard-write'],
    
    // Device emulation
    ...devices['Desktop Chrome'],
  },
  
  // Project configuration for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewports
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    // Tablet viewport
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    }
  ],
  
  // Dev server configuration
  webServer: process.env.CI ? undefined : {
    command: 'npm start',
    port: 3000,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
    env: {
      BROWSER: 'none', // Don't open browser automatically
      CI: 'true', // Prevent interactive mode
    },
  },
  
  // Global setup and teardown
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  
  // Output directory for test artifacts
  outputDir: 'test-results/e2e',
  
  // Timeout settings
  timeout: 60 * 1000, // 60 seconds per test
  expect: {
    timeout: 10 * 1000, // 10 seconds for expect assertions
  },
  
  // Preserve test output
  preserveOutput: 'failures-only',
  
  // Quiet mode for CI
  quiet: !!process.env.CI,
  
  // Update snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
  
  // Maximum failures before stopping
  maxFailures: process.env.CI ? 10 : undefined,
});