module.exports = {
  // Test environment setup
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  // File patterns
  roots: ['<rootDir>/src', '<rootDir>/api'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
    '<rootDir>/api/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/api/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ],
  
  // Exclude integration and stress tests from default runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '.*integration.*',
    '.*Integration.*',
    '.*stress.*',
    '.*Stress.*',
    '.*e2e.*',
    '.*E2E.*',
    '.*real.*',
    '.*Real.*',
    '.*demo.*',
    '.*Demo.*',
    '.*performance.*',
    '.*Performance.*',
    'dataFetcherStress\\.test\\.ts$'
  ],
  
  // Coverage configuration - Targeting 85%+ as per testing.mdc
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    'api/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/serviceWorker.ts',
    '!src/serviceWorkerRegistration.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!api/**/__tests__/**',
    '!api/**/*.test.{js,ts}',
    '!src/reportGeneration/__mocks__/**',
    '!src/reportGeneration/jest.*.js',
    '!src/reportGeneration/examples/**',
    '!src/**/test*.{js,ts}',
    '!src/**/*Demo.{ts,tsx}',
    '!src/setupProxy.js',
    '!src/jest.setup.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '\\.(integration|stress|e2e|real|demo)\\.(test|spec)\\.(ts|tsx|js|jsx)$',
    '__tests__/integration/',
    '__tests__/e2e/',
    'src/reportGeneration/__tests__/(integration|stress|e2e)/',
    'src/reportGeneration/examples/',
    'test-.*\\.(js|ts)$'
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    // Critical paths with higher thresholds
    './src/services/reportApiService.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/hooks/useReportGeneration.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
  
  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react'] }]
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(d3-scale|d3-array|d3-time-format|d3-shape|d3|node-mocks-http|axios|lucide-react)/)',
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/src/reportGeneration/__mocks__/fileMock.js',
    '^lucide-react$': '<rootDir>/src/__mocks__/lucide-react.js',
    '^@supabase/supabase-js$': '<rootDir>/src/__mocks__/@supabase/supabase-js.js',
    '^axios$': '<rootDir>/src/__mocks__/axios.js',
    '^d3$': '<rootDir>/src/__mocks__/d3.js',
    '^d3-(.*)$': '<rootDir>/src/__mocks__/d3.js',
    '^.*/marketApi$': '<rootDir>/src/__mocks__/marketApi.ts',
    '^.*/anthropicAIService$': '<rootDir>/src/__mocks__/anthropicAIService.ts'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/jest.setup.ts'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Performance and debugging
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // Test utilities
  resetMocks: true,
  clearMocks: true,
  restoreMocks: true,
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        strict: false
      }
    }
  },
  
  // Verbose output for CI
  verbose: process.env.CI === 'true',
  
  // Watch mode settings
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/coverage/',
    '<rootDir>/dist/',
    '<rootDir>/generated-reports/'
  ]
};