module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Downgrade unused vars to warnings instead of errors
    '@typescript-eslint/no-unused-vars': 'warn',
    
    // Downgrade dependency array warnings to warnings instead of errors
    'react-hooks/exhaustive-deps': 'warn',
    
    // Downgrade mixed operators to warnings
    'no-mixed-operators': 'warn'
  },
  overrides: [
    {
      files: ['**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
      rules: {
        'testing-library/no-container': 'warn',
        'testing-library/no-node-access': 'warn',
        'testing-library/no-unnecessary-act': 'warn',
        'jest/no-conditional-expect': 'warn'
      }
    }
  ]
};
