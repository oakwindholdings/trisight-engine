// e2e/global-setup.ts
// Global setup for E2E tests
// Context: Prepares test environment before all tests

import { chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  // Load environment variables
  dotenv.config({ path: '.env.local' });
  
  // Verify required environment variables
  const requiredEnvVars = [
    'REACT_APP_TWELVE_DATA_API_KEY',
    'REACT_APP_SUPABASE_URL',
    'REACT_APP_SUPABASE_ANON_KEY'
  ];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  
  console.log('✅ Environment variables verified');
  
  // Create a browser instance to perform setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the app
    await page.goto(config.projects[0].use.baseURL || 'http://localhost:3000');
    
    // Wait for app to be ready
    await page.waitForLoadState('networkidle');
    
    // Optionally set up test data
    // For example, clear existing test reports
    await page.evaluate(() => {
      // Clear IndexedDB test data
      if ('indexedDB' in window) {
        indexedDB.deleteDatabase('TrisightReports_Test');
      }
      
      // Clear localStorage test data
      const testKeys = Object.keys(localStorage).filter(key => key.includes('_test'));
      testKeys.forEach(key => localStorage.removeItem(key));
    });
    
    console.log('✅ Test environment prepared');
    
    // Store any global state needed for tests
    process.env.TEST_SETUP_COMPLETE = 'true';
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ E2E test setup complete');
}

export default globalSetup;