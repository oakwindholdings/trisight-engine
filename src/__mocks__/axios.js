// src/__mocks__/axios.js
// Mock for axios module
// Context: Used by Jest to mock HTTP requests

const mockAxios = {
  get: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  request: jest.fn(() => Promise.resolve({ data: {} })),
  create: jest.fn(function() { return this }),
  defaults: {
    headers: {
      common: {},
      get: {},
      post: {},
      put: {},
      delete: {},
      patch: {}
    },
    baseURL: ''
  },
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn()
    },
    response: {
      use: jest.fn(),
      eject: jest.fn()
    }
  },
  CancelToken: {
    source: jest.fn(() => ({
      token: 'mock-cancel-token',
      cancel: jest.fn()
    }))
  },
  isCancel: jest.fn(() => false),
  isAxiosError: jest.fn(() => false)
};

// Bind create to return mockAxios
mockAxios.create = jest.fn(() => mockAxios);

module.exports = mockAxios;
module.exports.default = mockAxios;