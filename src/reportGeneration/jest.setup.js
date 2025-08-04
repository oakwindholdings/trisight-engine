// src/reportGeneration/jest.setup.js
// Jest setup file for report generation tests
// Context: Sets up test environment and global mocks

// Mock browser APIs that don't exist in Node
global.crypto = {
  getRandomValues: (arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  },
  subtle: {
    generateKey: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    digest: jest.fn()
  }
};

// Mock CompressionStream and DecompressionStream
global.CompressionStream = jest.fn().mockImplementation(() => ({
  writable: {
    getWriter: jest.fn().mockReturnValue({
      write: jest.fn(),
      close: jest.fn()
    })
  },
  readable: new ReadableStream()
}));

global.DecompressionStream = jest.fn().mockImplementation(() => ({
  writable: {
    getWriter: jest.fn().mockReturnValue({
      write: jest.fn(),
      close: jest.fn()
    })
  },
  readable: new ReadableStream()
}));

// Mock localStorage
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Mock Response for compression utils
global.Response = jest.fn().mockImplementation((stream) => ({
  arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
}));

// Mock TextEncoder/TextDecoder
global.TextEncoder = jest.fn().mockImplementation(() => ({
  encode: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3]))
}));

global.TextDecoder = jest.fn().mockImplementation(() => ({
  decode: jest.fn().mockReturnValue('decoded')
}));

// Mock canvas for node environment
jest.mock('canvas', () => ({
  createCanvas: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: jest.fn(),
      strokeRect: jest.fn(),
      fillText: jest.fn(),
      strokeText: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      save: jest.fn(),
      restore: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      scale: jest.fn(),
      clearRect: jest.fn()
    })),
    toBuffer: jest.fn((format, opts, callback) => {
      if (callback) {
        callback(null, Buffer.from('mock-image-data'));
      }
      return Buffer.from('mock-image-data');
    }),
    toDataURL: jest.fn(() => 'data:image/png;base64,mockdata'),
    width: 800,
    height: 600
  }))
}));

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn(() => ({
    size: 1024,
    birthtime: new Date(),
    mtime: new Date()
  }))
}));

// Mock axios defaults
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.REACT_APP_TWELVE_DATA_API_KEY = 'test-api-key';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}