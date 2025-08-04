// api/__tests__/unit/download.test.ts
// Unit tests for report download API endpoint
// Context: Tests Vercel serverless function for report downloads

import { createMocks } from 'node-mocks-http';
import handler from '../../reports/download';
import { createClient } from '@supabase/supabase-js';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        download: jest.fn()
      }))
    }
  }))
}));

// Mock environment variables
process.env.REACT_APP_SUPABASE_URL = 'https://test.supabase.co';
process.env.REACT_APP_SUPABASE_ANON_KEY = 'test-anon-key';

describe('Download API Endpoint', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      storage: {
        from: jest.fn(() => ({
          download: jest.fn()
        }))
      }
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
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
        'access-control-allow-methods': 'GET,OPTIONS',
        'access-control-allow-headers': expect.stringContaining('Content-Type')
      });
    });

    it('should include CORS headers in all responses', async () => {
      const { req, res } = createMocks({
        method: 'POST' // Invalid method to trigger error
      });

      await handler(req as any, res as any);

      expect(res._getHeaders()).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Method Validation', () => {
    it('should reject non-GET methods', async () => {
      const { req, res } = createMocks({
        method: 'POST'
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Method not allowed',
        allowedMethods: ['GET']
      });
    });

    it('should accept GET method', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' } // Not found
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).not.toBe(405);
    });
  });

  describe('Request Validation', () => {
    it('should validate report ID parameter', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: {} // Missing ID
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toEqual({
        error: 'Missing or invalid report ID',
        required: 'id query parameter'
      });
    });

    it('should validate ID is string', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { id: ['array', 'value'] } // Invalid type
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: 'Missing or invalid report ID'
      });
    });
  });

  describe('Report Retrieval', () => {
    it('should retrieve report from database', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'AAPL',
        title: 'Test Report',
        storage_path: null,
        data: {
          slides: [
            { slideNumber: 1, title: 'Title' },
            { slideNumber: 2, title: 'Summary' }
          ],
          companyData: { ticker: 'AAPL' }
        },
        slides: [
          { slideNumber: 1, title: 'Title' },
          { slideNumber: 2, title: 'Summary' }
        ],
        company_data: { ticker: 'AAPL' },
        metadata: { version: '1.0' },
        format: 'pdf',
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(mockSupabase.from).toHaveBeenCalledWith('reports');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'report-123');
      expect(mockSupabase.single).toHaveBeenCalled();
    });

    it('should handle report not found', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'nonexistent-report' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Report not found',
        reportId: 'nonexistent-report'
      });
    });
  });

  describe('File Download from Storage', () => {
    it('should download file from Supabase storage', async () => {
      const mockReport = {
        id: 'report-123',
        storage_path: 'reports/report-123.pdf',
        mime_type: 'application/pdf',
        filename: 'report-123.pdf'
      };

      const mockFileData = new Blob(['PDF content']);

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValueOnce({
          data: mockFileData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('reports');
      expect(mockSupabase.storage.from('reports').download).toHaveBeenCalledWith(
        'reports/report-123.pdf'
      );

      expect(res._getStatusCode()).toBe(200);
      expect(res._getHeaders()).toMatchObject({
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="report-123.pdf"'
      });
    });

    it('should handle storage download errors', async () => {
      const mockReport = {
        id: 'report-123',
        storage_path: 'reports/report-123.pdf'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'File not found in storage' }
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: {
          message: 'Failed to download report',
          details: 'File not found in storage'
        }
      });
    });
  });

  describe('JSON Data Response', () => {
    it('should return JSON data when no storage path exists', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'AAPL',
        title: 'Test Report',
        template: 'equity-research',
        author: 'Test User',
        format: 'pdf',
        storage_path: null,
        data: {
          slides: [
            { slideNumber: 1, title: 'Title Slide' },
            { slideNumber: 2, title: 'Executive Summary' }
          ],
          companyData: {
            ticker: 'AAPL',
            companyName: 'Apple Inc.'
          }
        },
        slides: [
          { slideNumber: 1, title: 'Title Slide' },
          { slideNumber: 2, title: 'Executive Summary' }
        ],
        company_data: {
          ticker: 'AAPL',
          companyName: 'Apple Inc.'
        },
        metadata: { generatedAt: '2024-01-15T10:00:00Z' },
        created_at: '2024-01-15T10:00:00Z'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(200);
      const response = JSON.parse(res._getData());

      expect(response).toMatchObject({
        success: true,
        reportId: 'report-123',
        reportData: mockReport.data,
        slides: mockReport.slides,
        companyData: mockReport.company_data,
        metadata: mockReport.metadata,
        title: 'Test Report',
        ticker: 'AAPL',
        template: 'equity-research',
        author: 'Test User',
        format: 'pdf',
        filename: 'AAPL_report_2024-01-15T10:00:00Z.pdf',
        message: 'Report data retrieved for client-side generation'
      });
    });

    it('should handle reports without data field', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'AAPL',
        storage_path: null,
        data: null,
        slides: null,
        company_data: null
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toEqual({
        success: false,
        error: 'Report data not found',
        reportId: 'report-123'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: {
          message: 'Failed to download report',
          details: 'Database connection failed'
        }
      });
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.single.mockRejectedValueOnce(new Error('Unexpected error'));

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        success: false,
        error: {
          message: 'Failed to download report',
          details: 'Unexpected error'
        }
      });
    });
  });

  describe('Content Headers', () => {
    it('should set correct headers for PDF files', async () => {
      const mockReport = {
        id: 'report-123',
        storage_path: 'reports/report-123.pdf',
        mime_type: 'application/pdf',
        filename: 'AAPL_Q4_2024.pdf'
      };

      const mockFileData = new Blob(['PDF content'], { type: 'application/pdf' });

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValueOnce({
          data: mockFileData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getHeaders()).toMatchObject({
        'content-type': 'application/pdf',
        'content-disposition': 'attachment; filename="AAPL_Q4_2024.pdf"',
        'content-length': '11' // Length of 'PDF content'
      });
    });

    it('should set correct headers for PPTX files', async () => {
      const mockReport = {
        id: 'report-123',
        storage_path: 'reports/report-123.pptx',
        mime_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        filename: 'presentation.pptx'
      };

      const mockFileData = new Blob(['PPTX content']);

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValueOnce({
          data: mockFileData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getHeaders()['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
    });

    it('should use default MIME type if not specified', async () => {
      const mockReport = {
        id: 'report-123',
        storage_path: 'reports/report-123.pptx',
        mime_type: null,
        filename: 'report.pptx'
      };

      const mockFileData = new Blob(['content']);

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      mockSupabase.storage.from.mockReturnValue({
        download: jest.fn().mockResolvedValueOnce({
          data: mockFileData,
          error: null
        })
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      expect(res._getHeaders()['content-type']).toBe(
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      );
    });
  });

  describe('Filename Handling', () => {
    it('should generate filename from report metadata', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'NVDA',
        format: 'pdf',
        created_at: '2024-01-15T14:30:00Z',
        storage_path: null,
        data: { slides: [] },
        filename: null
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      const response = JSON.parse(res._getData());
      expect(response.filename).toBe('NVDA_report_2024-01-15T14:30:00Z.pdf');
    });

    it('should use existing filename if available', async () => {
      const mockReport = {
        id: 'report-123',
        ticker: 'NVDA',
        format: 'pdf',
        filename: 'NVDA_Technical_Analysis_Q4_2024.pdf',
        storage_path: null,
        data: { slides: [] }
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockReport,
        error: null
      });

      const { req, res } = createMocks({
        method: 'GET',
        query: { id: 'report-123' }
      });

      await handler(req as any, res as any);

      const response = JSON.parse(res._getData());
      expect(response.filename).toBe('NVDA_Technical_Analysis_Q4_2024.pdf');
    });
  });
});