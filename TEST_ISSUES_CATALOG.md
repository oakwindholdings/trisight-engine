# Test Issues Catalog - TriSight Project

## Overview
This document catalogs all test-related issues found during comprehensive test suite analysis.

## Test Statistics
- Total test files: 70
- Test categories:
  - Unit tests
  - Integration tests  
  - E2E tests
  - Stress/Performance tests

## Issue Categories

### 1. Test Timeout Issues
Tests that exceed the configured timeout limit.

### 2. Mock-Related Issues
Tests failing due to missing or incorrect mocks.

### 3. Component Rendering Issues
React component tests with rendering failures.

### 4. API/Service Integration Issues
Tests failing due to API or service dependencies.

### 5. Type/Interface Mismatches
TypeScript-related test failures.

### 6. Missing Test Coverage
Components/functions without adequate test coverage.

## Detailed Issue List

### Critical Issues (Blocking Coverage)

#### 1. ReportHistory Component Tests
- **Issue**: Multiple elements with text "Today" causing test failure
- **File**: `src/components/Reports/__tests__/unit/ReportHistory.test.tsx`
- **Impact**: 14 test failures in this suite
- **Root Cause**: Date mocking returning same date for all reports
- **Fix**: Update mock data to have different dates

#### 2. useFeedback Hook Tests
- **Issue**: `getFeedbackHistory is not a function`
- **File**: `src/hooks/__tests__/useFeedback.test.ts`
- **Impact**: All tests in suite failing
- **Root Cause**: Missing mock for patternApi.getFeedbackHistory
- **Fix**: Add proper mock for the function

#### 3. TwelveDataAdapter Tests
- **Issue**: Multiple timeout errors (30s timeout)
- **File**: `src/reportGeneration/__tests__/unit/twelveDataAdapter.test.ts`
- **Impact**: 4+ tests timing out
- **Root Cause**: Tests waiting for promises that never resolve
- **Fix**: Ensure all mocked promises resolve/reject properly

#### 4. InfiniteZoomChart Tests
- **Issue**: `Cannot read properties of undefined (reading 'domain')`
- **File**: `src/components/Chart/__tests__/infiniteZoomChartPattern.test.tsx`
- **Impact**: Component fails to render
- **Root Cause**: d3.scaleLinear mock not returning proper scale object
- **Fix**: Update d3 mock to return complete scale interface

### High Priority Issues

#### 5. Performance Test Timeouts
- **Files**: 
  - `src/reportGeneration/__tests__/dataFetcherPerformance.test.ts`
  - `src/reportGeneration/__tests__/dataFetcherStress.test.ts`
- **Issue**: Tests timing out even with 30s limit
- **Impact**: Cannot measure performance metrics
- **Fix**: Exclude from unit test runs, create separate performance test command

#### 6. Integration Test Failures
- **Files**:
  - `src/reportGeneration/__tests__/dataFetcherIntegration.test.ts`
  - Various API integration tests
- **Issue**: Real API calls being made despite mocks
- **Impact**: Tests fail due to missing API keys
- **Fix**: Ensure mocks are properly applied before imports

### Medium Priority Issues

#### 7. Missing Icon Mocks
- **Issue**: Various lucide-react icons not mocked
- **Impact**: Component render failures
- **Fix**: Add comprehensive lucide-react mock file

#### 8. File Size Formatting
- **Issue**: Tests expecting "N/A" but getting "0 KB"
- **File**: `src/components/Reports/__tests__/unit/ReportHistory.test.tsx`
- **Impact**: Test assertion failures
- **Fix**: Update test expectations or component logic

#### 9. Report Click Handler
- **Issue**: `Unable to fire a "click" event - please provide a DOM element`
- **Impact**: Interaction tests failing
- **Fix**: Update selector to find clickable element

### Low Priority Issues

#### 10. Console Warnings/Errors
- **Issue**: Unhandled promise rejections and console errors
- **Impact**: Noise in test output
- **Fix**: Add proper error boundaries and promise catch handlers

## Test Coverage Gaps

### Components Missing Tests
1. Several new report generation components
2. Pattern detection components
3. Real-time data components

### Hooks Missing Tests
1. useReportGeneration (partial coverage)
2. usePatternDetection
3. useMarketData (partial coverage)

### Services Missing Tests
1. Comprehensive report assembly
2. AI integration services
3. Data validation services

## Recommended Actions

### Immediate Actions (Week 1)
1. Fix all Critical Issues (1-4)
2. Create separate test commands for unit vs integration/performance
3. Update all component mocks to be comprehensive

### Short-term Actions (Week 2-3)
1. Fix High Priority Issues (5-6)
2. Add missing test coverage for critical paths
3. Update test timeouts appropriately

### Long-term Actions (Month 1)
1. Achieve 85% coverage target
2. Set up automated test monitoring
3. Create test best practices documentation

## Test Configuration Improvements

### jest.config.js Updates Needed
```javascript
{
  // Separate configs for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}'],
      testPathIgnorePatterns: ['integration', 'stress', 'performance', 'e2e']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/src/**/*.integration.test.{ts,tsx}']
    }
  ]
}
```

### Package.json Scripts
```json
{
  "test:unit": "jest --selectProjects unit",
  "test:integration": "jest --selectProjects integration",
  "test:performance": "jest --selectProjects performance --runInBand"
}
```

## Priority Matrix for Fixes

### Immediate (Fix Today)
1. **useFeedback Hook Mock** - Simple fix, high impact
   - Change `getPatternHistory` to `getFeedbackHistory` in mock
   - File: `src/hooks/__tests__/useFeedback.test.ts`

2. **ReportHistory Date Mock** - Affects 14 tests
   - Update mock data to have staggered dates
   - File: `src/components/Reports/__tests__/unit/ReportHistory.test.tsx`

3. **D3 ScaleLinear Mock** - Blocking chart tests
   - Ensure mock returns proper domain/range methods
   - File: `src/__mocks__/d3.js`

### High Priority (This Week)
4. **Test Separation** - Critical for CI/CD
   - Move integration/stress tests to separate directory
   - Update jest.config.js with projects configuration
   - Create new npm scripts

5. **TwelveDataAdapter Timeouts** - Fix async handling
   - Ensure all promises resolve/reject
   - Add proper cleanup in afterEach

### Medium Priority (Next Sprint)
6. **Missing Test Coverage**
   - Add tests for report generation components
   - Add tests for new hooks
   - Increase service coverage

## Test File Distribution
- Total test files: 70
- Unit tests: 57 files (81%)
- Integration tests: ~5 files (7%)
- Performance/Stress tests: ~3 files (4%)
- E2E tests: ~5 files (7%)

## Success Metrics
- Unit test coverage: 85%+
- All unit tests passing
- Test execution time < 2 minutes for unit tests
- Zero flaky tests
- Clear separation of test types

## Next Steps
1. Fix the 3 immediate issues
2. Run unit tests only to get accurate coverage
3. Set up separate test commands
4. Create CI pipeline with staged testing