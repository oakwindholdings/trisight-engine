// jest.setup.ts
// Canvas and ResizeObserver mocks for Jest tests
// Imported by src/setupTests.ts

import 'jest-canvas-mock';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;
