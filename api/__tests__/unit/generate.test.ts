// api/__tests__/unit/generate.test.ts
// Unit tests for report generation API endpoint
// Context: Tests Vercel serverless function for report generation

import { createMocks } from 'node-mocks-http';
import handler from '../../reports/generate';
import { createClient } from '@supabase/supabase-js';
import { ReportGenerator } from '../../../src/reportGeneration/core/reportGenerator';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

jest.mock('../../../src/reportGeneration/core/reportGenerator', () => ({
  ReportGenerator: jest.fn().mockImplementation(() => ({
    generateReport: jest.fn()
  }))
}));

// Mock environment variables
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.TWELVE_DATA_API_KEY = 'test-api-key';

describe('Generate API Endpoint', () => {
  let mockSupabase: any;
  let mockReportGenerator: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn()
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    
    mockReportGenerator = {
      generateReport: jest.fn()
    };
    
    (ReportGenerator as jest.Mock).mockImplementation(() => mockReportGenerator);
  });

  describe('CORS Headers', () => {
    it('should handle preflight OPTIONS request', async () => {
      const { req, res } = createMocks({
        method: 'OPTIONS'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()).toMatchObject({
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,OPTIONS,POST',
        'access-control-allow-headers': expect.stringContaining('Content-Type')
      });
    });

    it('should include CORS headers in all responses', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req as any, res as any);

      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Method Validation', () => {
    it('should reject non-POST methods', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
        allowedMethods: ['POST']
      });
    });

    it('should accept POST method', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      mockReportGenerator.generateReport.mockResolvedValueOnce({
        slides: [],
        companyData: {},
        metadata: {}
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).not.toBe(405);
    });
  });

  describe('Request Validation', () => {
    it('should validate required fields', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          // Missing required fields
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      const response = JSON.parse(res._getData());
      expect(response.error).toBe('Missing required fields');
      expect(response.required).toEqual(['ticker', 'title', 'template']);
    });

    it('should validate ticker format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: '123', // Invalid ticker
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: 'Invalid ticker format'
      });
    });

    it('should validate template type', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'invalid-template'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: 'Invalid template type'
      });
    });
  });

  describe('Report Generation', () => {
    it('should generate report successfully', async () => {
      const mockReport = {
        slides: [
          { slideNumber: 1, title: 'Title Slide', content: [] },
          { slideNumber: 2, title: 'Executive Summary', content: [] }
        ],
        companyData: {
          ticker: 'AAPL',
          companyName: 'Apple Inc.',
          marketCap: 3000000000000
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

      mockReportGenerator.generateReport.mockResolvedValueOnce(mockReport);
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Apple Q4 2024 Report',
          template: 'equity-research',
          author: 'Test User',
          format: 'pdf'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());
      
      expect(response).toMatchObject({
        success: true,
        reportId: expect.stringContaining('report-'),
        message: 'Report generated successfully',
        data: mockReport
      });

      expect(ReportGenerator).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: 'AAPL',
          companyName: 'Apple Q4 2024 Report',
          reportDate: expect.any(String),
          currentDate: expect.any(String),
          outputFormat: 'pdf',
          template: expect.objectContaining({
            id: 'equity-research'
          })
        })
      );
    });

    it('should use default values for optional fields', async () => {
      mockReportGenerator.generateReport.mockResolvedValueOnce({
        slides: [],
        companyData: {},
        metadata: {}
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(ReportGenerator).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'TriSight Analytics',
          outputFormat: 'pdf'
        })
      );
    });

    it('should store report in Supabase', async () => {
      const mockReport = {
        slides: [{ slideNumber: 1, title: 'Test', content: [] }],
        companyData: { ticker: 'AAPL' },
        metadata: {},
        fileSize: 32768
      };

      mockReportGenerator.generateReport.mockResolvedValueOnce(mockReport);
      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          format: 'pdf'
        }
      });

      await handler(req as any, res as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('reports');
      expect(mockSupabase.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          format: 'pdf',
          status: 'completed',
          slides: mockReport.slides,
          company_data: mockReport.companyData,
          data: mockReport,
          file_size: 32768
        })
      ]);
    });

    it('should handle Supabase storage errors', async () => {
      mockReportGenerator.generateReport.mockResolvedValueOnce({
        slides: [],
        companyData: {},
        metadata: {}
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: {
          message: 'Failed to save report to database',
          details: 'Database error'
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle report generation errors', async () => {
      mockReportGenerator.generateReport.mockRejectedValueOnce(
        new Error('TwelveData API rate limit exceeded')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      const response = JSON.parse(res._getData());
      
      expect(response).toMatchObject({
        success: false,
        error: {
          message: 'Failed to generate report',
          details: 'TwelveData API rate limit exceeded'
        }
      });
    });

    it('should handle missing API keys', async () => {
      delete process.env.TWELVE_DATA_API_KEY;

      mockReportGenerator.generateReport.mockRejectedValueOnce(
        new Error('Missing API key')
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      
      // Restore for other tests
      process.env.TWELVE_DATA_API_KEY = 'test-api-key';
    });

    it('should handle timeout errors', async () => {
      mockReportGenerator.generateReport.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 100)
        )
      );

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
    });
  });

  describe('Response Format', () => {
    it('should return consistent success response format', async () => {
      mockReportGenerator.generateReport.mockResolvedValueOnce({
        slides: [],
        companyData: {},
        metadata: {}
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research'
        }
      });

      await handler(req as any, res as any);

      const response = JSON.parse(res._getData());
      
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('reportId');
      expect(response).toHaveProperty('message');
      expect(response).toHaveProperty('data');
      expect(response).toHaveProperty('metadata');
      expect(response.metadata).toHaveProperty('generatedAt');
      expect(response.metadata).toHaveProperty('processingTime');
    });

    it('should return consistent error response format', async () => {
      const { req, res } = createMocks({
        method: 'POST',
        body: {} // Invalid body
      });

      await handler(req as any, res as any);

      const response = JSON.parse(res._getData());
      
      expect(response).toHaveProperty('success', false);
      expect(response).toHaveProperty('error');
      expect(response.error).toHaveProperty('message');
      expect(response.error).toHaveProperty('timestamp');
    });
  });

  describe('Data Source Configuration', () => {
    it('should pass data source configuration to report generator', async () => {
      mockReportGenerator.generateReport.mockResolvedValueOnce({
        slides: [],
        companyData: {},
        metadata: {}
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'report-123' },
        error: null
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          dataSources: ['market-data', 'financials'],
          visualizations: ['price-chart']
        }
      });

      await handler(req as any, res as any);

      expect(ReportGenerator).toHaveBeenCalledWith(
        expect.objectContaining({
          dataSources: ['market-data', 'financials'],
          visualizations: ['price-chart']
        })
      );
    });
  });
});