// src/__mocks__/supabaseTestClient.ts
// Comprehensive Supabase mock for testing
// Context: Provides a full mock implementation of Supabase client

import { mockReports, mockSchedules } from '../__fixtures__/supabase.fixtures';

interface MockQueryBuilder {
  select: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  eq: jest.Mock;
  neq: jest.Mock;
  gt: jest.Mock;
  gte: jest.Mock;
  lt: jest.Mock;
  lte: jest.Mock;
  like: jest.Mock;
  ilike: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  limit: jest.Mock;
  range: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
}

class MockSupabaseQueryBuilder implements MockQueryBuilder {
  private data: any[] = [];
  private error: any = null;
  private filters: any[] = [];
  private orderBy: { column: string; ascending: boolean } | null = null;
  private limitCount: number | null = null;
  private rangeStart: number | null = null;
  private rangeEnd: number | null = null;
  
  constructor(private tableName: string, private mockData: any[]) {
    this.data = [...mockData];
  }
  
  select = jest.fn(() => {
    this.applyFilters();
    return this;
  });
  
  insert = jest.fn((values: any | any[]) => {
    const newItems = Array.isArray(values) ? values : [values];
    const insertedItems = newItems.map((item, index) => ({
      ...item,
      id: item.id || `${this.tableName}-${Date.now()}-${index}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString()
    }));
    
    this.data = insertedItems;
    return this;
  });
  
  update = jest.fn((values: any) => {
    this.applyFilters();
    this.data = this.data.map(item => ({
      ...item,
      ...values,
      updated_at: new Date().toISOString()
    }));
    return this;
  });
  
  delete = jest.fn(() => {
    this.applyFilters();
    // In a real scenario, items would be removed from the mock data store
    return this;
  });
  
  eq = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'eq', column, value });
    return this;
  });
  
  neq = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'neq', column, value });
    return this;
  });
  
  gt = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'gt', column, value });
    return this;
  });
  
  gte = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'gte', column, value });
    return this;
  });
  
  lt = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'lt', column, value });
    return this;
  });
  
  lte = jest.fn((column: string, value: any) => {
    this.filters.push({ type: 'lte', column, value });
    return this;
  });
  
  like = jest.fn((column: string, pattern: string) => {
    this.filters.push({ type: 'like', column, pattern });
    return this;
  });
  
  ilike = jest.fn((column: string, pattern: string) => {
    this.filters.push({ type: 'ilike', column, pattern });
    return this;
  });
  
  or = jest.fn((filters: string) => {
    // Simplified OR filter parsing
    this.filters.push({ type: 'or', filters });
    return this;
  });
  
  order = jest.fn((column: string, options?: { ascending?: boolean }) => {
    this.orderBy = { column, ascending: options?.ascending ?? true };
    return this;
  });
  
  limit = jest.fn((count: number) => {
    this.limitCount = count;
    return this;
  });
  
  range = jest.fn((start: number, end: number) => {
    this.rangeStart = start;
    this.rangeEnd = end;
    return this;
  });
  
  single = jest.fn(() => {
    this.applyFilters();
    const result = this.data[0] || null;
    return Promise.resolve({ data: result, error: this.error });
  });
  
  maybeSingle = jest.fn(() => {
    this.applyFilters();
    const result = this.data.length <= 1 ? this.data[0] || null : null;
    return Promise.resolve({ data: result, error: this.error });
  });
  
  private applyFilters() {
    let filteredData = [...this.mockData];
    
    // Apply filters
    this.filters.forEach(filter => {
      switch (filter.type) {
        case 'eq':
          filteredData = filteredData.filter(item => item[filter.column] === filter.value);
          break;
        case 'neq':
          filteredData = filteredData.filter(item => item[filter.column] !== filter.value);
          break;
        case 'gt':
          filteredData = filteredData.filter(item => item[filter.column] > filter.value);
          break;
        case 'lt':
          filteredData = filteredData.filter(item => item[filter.column] < filter.value);
          break;
        case 'like':
        case 'ilike':
          const pattern = filter.pattern.replace(/%/g, '.*');
          const regex = new RegExp(pattern, filter.type === 'ilike' ? 'i' : '');
          filteredData = filteredData.filter(item => regex.test(item[filter.column]));
          break;
      }
    });
    
    // Apply ordering
    if (this.orderBy) {
      filteredData.sort((a, b) => {
        const aVal = a[this.orderBy!.column];
        const bVal = b[this.orderBy!.column];
        const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderBy!.ascending ? result : -result;
      });
    }
    
    // Apply range/limit
    if (this.rangeStart !== null && this.rangeEnd !== null) {
      filteredData = filteredData.slice(this.rangeStart, this.rangeEnd + 1);
    } else if (this.limitCount !== null) {
      filteredData = filteredData.slice(0, this.limitCount);
    }
    
    this.data = filteredData;
  }
  
  // Return promise for async operations
  then(onFulfilled?: (value: any) => any) {
    this.applyFilters();
    const result = { data: this.data, error: this.error };
    return Promise.resolve(result).then(onFulfilled);
  }
}

// Storage mock
class MockSupabaseStorage {
  private buckets: Map<string, Map<string, any>> = new Map();
  
  from(bucket: string) {
    if (!this.buckets.has(bucket)) {
      this.buckets.set(bucket, new Map());
    }
    
    return {
      upload: jest.fn((path: string, file: File | Blob | ArrayBuffer, options?: any) => {
        const bucketData = this.buckets.get(bucket)!;
        bucketData.set(path, { file, metadata: options?.metadata || {} });
        
        return Promise.resolve({
          data: { path, fullPath: `${bucket}/${path}` },
          error: null
        });
      }),
      
      download: jest.fn((path: string) => {
        const bucketData = this.buckets.get(bucket)!;
        const fileData = bucketData.get(path);
        
        if (!fileData) {
          return Promise.resolve({
            data: null,
            error: { message: 'File not found', statusCode: '404' }
          });
        }
        
        return Promise.resolve({
          data: fileData.file,
          error: null
        });
      }),
      
      remove: jest.fn((paths: string[]) => {
        const bucketData = this.buckets.get(bucket)!;
        paths.forEach(path => bucketData.delete(path));
        
        return Promise.resolve({
          data: paths.map(path => ({ path })),
          error: null
        });
      }),
      
      getPublicUrl: jest.fn((path: string) => {
        return {
          data: { publicUrl: `https://storage.example.com/${bucket}/${path}` }
        };
      })
    };
  }
}

// Auth mock
class MockSupabaseAuth {
  private currentUser: any = null;
  
  signUp = jest.fn(({ email, password }) => {
    this.currentUser = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };
    
    return Promise.resolve({
      data: { user: this.currentUser, session: { access_token: 'mock-token' } },
      error: null
    });
  });
  
  signInWithPassword = jest.fn(({ email, password }) => {
    this.currentUser = {
      id: `user-${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };
    
    return Promise.resolve({
      data: { user: this.currentUser, session: { access_token: 'mock-token' } },
      error: null
    });
  });
  
  signOut = jest.fn(() => {
    this.currentUser = null;
    return Promise.resolve({ error: null });
  });
  
  getUser = jest.fn(() => {
    return Promise.resolve({
      data: { user: this.currentUser },
      error: null
    });
  });
  
  getSession = jest.fn(() => {
    return Promise.resolve({
      data: { session: this.currentUser ? { access_token: 'mock-token' } : null },
      error: null
    });
  });
  
  onAuthStateChange = jest.fn((callback) => {
    // Return unsubscribe function
    return { data: { subscription: { unsubscribe: jest.fn() } } };
  });
}

// Main mock client
export class MockSupabaseClient {
  auth: MockSupabaseAuth;
  storage: MockSupabaseStorage;
  
  // Mock data stores
  private mockData: Record<string, any[]> = {
    generated_reports: [...mockReports],
    report_schedules: [...mockSchedules],
    report_templates: [],
    user_preferences: []
  };
  
  constructor() {
    this.auth = new MockSupabaseAuth();
    this.storage = new MockSupabaseStorage();
  }
  
  from(table: string) {
    const tableData = this.mockData[table] || [];
    return new MockSupabaseQueryBuilder(table, tableData);
  }
  
  // Helper methods for tests
  _resetMockData() {
    this.mockData = {
      generated_reports: [...mockReports],
      report_schedules: [...mockSchedules],
      report_templates: [],
      user_preferences: []
    };
  }
  
  _setMockData(table: string, data: any[]) {
    this.mockData[table] = data;
  }
  
  _getMockData(table: string) {
    return this.mockData[table] || [];
  }
}

// Export a singleton instance
export const mockSupabaseClient = new MockSupabaseClient();

// Export factory function for creating new instances
export function createMockSupabaseClient() {
  return new MockSupabaseClient();
}