// e2e/global-teardown.ts
// Global teardown for Playwright tests
// Context: Runs once after all tests to clean up test environment

import { FullConfig } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up test data from Supabase
  if (process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.REACT_APP_SUPABASE_ANON_KEY
      );
      
      // Delete all test reports
      const { error: deleteError } = await supabase
        .from('generated_reports')
        .delete()
        .or('title.ilike.%TEST%,title.ilike.%test%,title.ilike.%e2e%');
        
      if (!deleteError) {
        console.log('✅ Cleaned up test reports from database');
      }
      
      // Delete test user if created
      if (process.env.TEST_USER_EMAIL) {
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserByEmail(
          process.env.TEST_USER_EMAIL
        );
        
        if (user && !authError) {
          await supabase.auth.admin.deleteUser(user.id);
          console.log('✅ Deleted test user');
        }
      }
    } catch (error) {
      console.error('Error during database cleanup:', error);
    }
  }
  
  // Clean up test artifacts if in CI
  if (process.env.CI) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      // Keep test results but clean up large files
      const videosPath = path.join(process.cwd(), 'e2e/videos');
      const tracesPath = path.join(process.cwd(), 'e2e/traces');
      
      if (await fs.access(videosPath).then(() => true).catch(() => false)) {
        const files = await fs.readdir(videosPath);
        for (const file of files) {
          if (file.endsWith('.webm') || file.endsWith('.mp4')) {
            await fs.unlink(path.join(videosPath, file));
          }
        }
      }
      
      if (await fs.access(tracesPath).then(() => true).catch(() => false)) {
        const files = await fs.readdir(tracesPath);
        for (const file of files) {
          if (file.endsWith('.zip')) {
            await fs.unlink(path.join(tracesPath, file));
          }
        }
      }
      
      console.log('✅ Cleaned up test artifacts');
    } catch (error) {
      console.error('Error cleaning up artifacts:', error);
    }
  }
  
  // Generate test summary
  console.log('\n📊 Test Run Summary:');
  console.log(`- Environment: ${process.env.CI ? 'CI' : 'Local'}`);
  console.log(`- Base URL: ${process.env.PLAYWRIGHT_BASE_URL}`);
  console.log(`- Test completed at: ${new Date().toISOString()}`);
  
  console.log('\n✅ Global teardown completed');
}

export default globalTeardown;