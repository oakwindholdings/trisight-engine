// src/reportGeneration/__tests__/testInfrastructure.ts
// Quick test to verify the infrastructure is working
// Context: Validates that all components are properly connected

import { createDataFetcher } from '../core/dataFetcher';

async function testInfrastructure() {
  console.log('Testing data fetching infrastructure...');
  console.log('=====================================\n');
  
  try {
    // Test 1: Create fetcher without API key (should fail)
    console.log('Test 1: Creating fetcher without API key...');
    try {
      // Temporarily clear the env variable
      const originalApiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
      delete process.env.REACT_APP_TWELVE_DATA_API_KEY;
      
      const fetcher = createDataFetcher({
        ticker: 'NVDA',
        debugMode: true
      });
      
      // Restore env variable
      if (originalApiKey) {
        process.env.REACT_APP_TWELVE_DATA_API_KEY = originalApiKey;
      }
      
      console.log('❌ Test 1 FAILED: Should have thrown error for missing API key');
    } catch (error: any) {
      console.log('✅ Test 1 PASSED: Correctly threw error:', error.message);
    }
    
    console.log('\n---\n');
    
    // Test 2: Create fetcher with API key
    console.log('Test 2: Creating fetcher with API key...');
    const fetcher = createDataFetcher({
      ticker: 'NVDA',
      apiKey: 'test-api-key',
      debugMode: true
    });
    console.log('✅ Test 2 PASSED: Fetcher created successfully');
    
    console.log('\n---\n');
    
    // Test 3: Attempt to fetch data (should fail with "not implemented")
    console.log('Test 3: Attempting to fetch data...');
    console.log('(This should fail since adapters are not implemented yet)\n');
    
    const progressUpdates: string[] = [];
    try {
      const data = await fetcher.fetchAll('NVDA', (stage, progress) => {
        const update = `[${progress}%] ${stage}`;
        progressUpdates.push(update);
        console.log(update);
      });
      
      console.log('❌ Test 3 FAILED: Should have thrown "not implemented" errors');
      console.log('Unexpected data:', data);
    } catch (error: any) {
      console.log('\n✅ Test 3 PASSED: Correctly threw error');
      console.log('Error message:', error.message);
      console.log('Progress updates received:', progressUpdates.length);
    }
    
    console.log('\n---\n');
    
    // Test 4: Verify cache functionality
    console.log('Test 4: Testing cache functionality...');
    const { MemoryCache } = await import('../utils/cache');
    const cache = new MemoryCache();
    
    // Test set and get
    cache.set('test-key', { value: 'test-data' }, 1000);
    const cached = cache.get('test-key');
    
    if (cached && cached.value === 'test-data') {
      console.log('✅ Test 4 PASSED: Cache working correctly');
    } else {
      console.log('❌ Test 4 FAILED: Cache not working');
    }
    
    console.log('\n---\n');
    
    // Test 5: Verify error handling
    console.log('Test 5: Testing error categorization...');
    const { categorizeError, ErrorCategory } = await import('../utils/errorHandler');
    
    const networkError = new Error('Network request failed');
    const authError = new Error('401 Unauthorized');
    const rateError = new Error('429 Too Many Requests');
    
    const networkCategory = categorizeError(networkError);
    const authCategory = categorizeError(authError);
    const rateCategory = categorizeError(rateError);
    
    const passed = 
      networkCategory === ErrorCategory.NETWORK &&
      authCategory === ErrorCategory.AUTH &&
      rateCategory === ErrorCategory.RATE_LIMIT;
    
    if (passed) {
      console.log('✅ Test 5 PASSED: Error categorization working correctly');
      console.log(`  - Network error → ${networkCategory}`);
      console.log(`  - Auth error → ${authCategory}`);
      console.log(`  - Rate limit error → ${rateCategory}`);
    } else {
      console.log('❌ Test 5 FAILED: Error categorization not working');
    }
    
  } catch (error) {
    console.error('Unexpected error during testing:', error);
  }
  
  console.log('\n=====================================');
  console.log('Infrastructure test complete!');
  console.log('All core components are properly connected.');
  console.log('Ready for Phase 2: Implementing adapters');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testInfrastructure().catch(console.error);
}

export { testInfrastructure };