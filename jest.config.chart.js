module.exports = {
  preset: 'react-scripts',
  testMatch: ['**/src/components/Chart/__tests__/*.test.tsx'],
  verbose: true,
  bail: true,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
