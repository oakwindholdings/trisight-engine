// src/components/Chart/__tests__/basicTest.test.ts
// Most basic test possible
// No external imports

export {}; // Make this a module to satisfy --isolatedModules

describe('Basic Test', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });
  
  it('should match snapshot', () => {
    const data = { test: 'value' };
    expect(data).toMatchInlineSnapshot(`
      {
        "test": "value",
      }
    `);
  });
});
