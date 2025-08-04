// src/__tests__/mocks/node-mocks-http.ts
// Mock for node-mocks-http library used in API tests
// Context: Provides request/response mocking for Vercel serverless functions

export interface MockRequest {
  method?: string;
  query?: any;
  body?: any;
  headers?: any;
}

export interface MockResponse {
  _getStatusCode(): number;
  _getData(): string;
  _getHeaders(): Record<string, string>;
  status(code: number): MockResponse;
  json(data: any): MockResponse;
  send(data: any): MockResponse;
  setHeader(key: string, value: string): MockResponse;
  end(): MockResponse;
}

export function createMocks(options: MockRequest = {}) {
  let statusCode = 200;
  let responseData: any = '';
  const headers: Record<string, string> = {};

  const req: MockRequest = {
    method: options.method || 'GET',
    query: options.query || {},
    body: options.body || {},
    headers: options.headers || {}
  };

  const res: MockResponse = {
    _getStatusCode: () => statusCode,
    _getData: () => typeof responseData === 'string' ? responseData : JSON.stringify(responseData),
    _getHeaders: () => ({ ...headers }),
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      headers['content-type'] = 'application/json';
      return res;
    },
    send: (data: any) => {
      responseData = data;
      return res;
    },
    setHeader: (key: string, value: string) => {
      headers[key.toLowerCase()] = value;
      return res;
    },
    end: () => res
  };

  return { req, res };
}