// src/setupTests.ts
// Jest configuration for create-react-app
// Imported automatically before test runs

// Import jest-canvas-mock and setup ResizeObserver globally
import './jest.setup';
import '@testing-library/jest-dom';

// Mock canvas
global.HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Array(4),
  })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
  transform: jest.fn(),
  beginPath: jest.fn(),
  closePath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  bezierCurveTo: jest.fn(),
  quadraticCurveTo: jest.fn(),
  arc: jest.fn(),
  arcTo: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  clip: jest.fn(),
  isPointInPath: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  strokeStyle: '',
  fillStyle: '',
  globalAlpha: 1,
  lineWidth: 1,
  lineCap: 'butt',
  lineJoin: 'miter',
  miterLimit: 10,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: 'transparent',
  font: '10px sans-serif',
  textAlign: 'start',
  textBaseline: 'alphabetic',
} as any));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0);
  return 0;
});
global.cancelAnimationFrame = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock the TwelveData API module
jest.mock('./api/twelveDataApi', () => ({
  twelveDataApi: {
    fetchHistoricalData: jest.fn().mockResolvedValue([]),
    fetchLiveData: jest.fn().mockResolvedValue([]),
    searchSymbols: jest.fn().mockResolvedValue([]),
  }
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => {
    const { mockSupabaseClient } = require('./__mocks__/supabaseTestClient');
    return mockSupabaseClient;
  })
}));

// Mock environment variables for tests
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.REACT_APP_TWELVE_DATA_API_KEY = 'test-api-key';

// Suppress console errors during tests unless explicitly checking for them
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(30000);


// Admin API manual mock for smoke tests
jest.mock('./services/adminApi');

// Safe fetch mock default; tests may override
if (!(global as any).fetch) {
  (global as any).fetch = jest.fn(async (input: RequestInfo, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/admin/preview-section')) {
      return { json: async () => ({ success: true, data: { content: 'OK', format: 'markdown', meta: {} } }) } as any;
    }
    return { json: async () => ({}) } as any;
  });
}
