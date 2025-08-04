// src/reportGeneration/__tests__/unit/storageService.test.ts
// Unit tests for StorageService
// Context: Tests report storage, compression, encryption, and retrieval

import { StorageService } from '../../services/storageService';
import { GeneratedReport, ReportMetadata } from '../../models/reportTypes';
import { CompressionUtils } from '../../utils/compression';
import { ThumbnailGenerator } from '../../utils/thumbnailGenerator';
import { EncryptionUtils } from '../../utils/encryption';

// Mock dependencies
jest.mock('../../utils/compression');
jest.mock('../../utils/thumbnailGenerator');
jest.mock('../../utils/encryption');
jest.mock('../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
  logInfo: jest.fn()
}));

// Mock IndexedDB
const mockObjectStore = {
  put: jest.fn(),
  get: jest.fn(),
  getAll: jest.fn(),
  delete: jest.fn(),
  createIndex: jest.fn(),
  index: jest.fn(() => ({
    openCursor: jest.fn(() => ({
      onsuccess: null,
      onerror: null
    }))
  }))
};

const mockTransaction = {
  objectStore: jest.fn(() => mockObjectStore),
  oncomplete: null,
  onerror: null,
  commit: jest.fn()
};

const mockDB = {
  transaction: jest.fn(() => mockTransaction),
  objectStoreNames: { contains: jest.fn(() => true) },
  createObjectStore: jest.fn(() => mockObjectStore),
  close: jest.fn(),
  version: 1
};

const mockIDBRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: mockDB
};

const mockIDB = {
  open: jest.fn(() => mockIDBRequest),
  deleteDatabase: jest.fn(() => mockIDBRequest)
};

// Setup global mocks
(global as any).indexedDB = mockIDB;
(global as any).IDBDatabase = jest.fn();
(global as any).localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

// Helper to trigger IndexedDB callbacks
const triggerIDBSuccess = (request: any, result?: any) => {
  if (request.onsuccess) {
    request.result = result !== undefined ? result : request.result;
    request.onsuccess({ target: request });
  }
};

const triggerIDBError = (request: any, error: Error) => {
  if (request.onerror) {
    request.error = error;
    request.onerror({ target: request });
  }
};

describe('StorageService', () => {
  let storageService: StorageService;
  let mockReport: GeneratedReport;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock implementations
    (CompressionUtils.compress as jest.Mock).mockResolvedValue('compressed-data');
    (CompressionUtils.decompress as jest.Mock).mockResolvedValue('decompressed-data');
    (ThumbnailGenerator.generateThumbnail as jest.Mock).mockResolvedValue('thumbnail-data-url');
    (EncryptionUtils.encrypt as jest.Mock).mockResolvedValue('encrypted-data');
    (EncryptionUtils.decrypt as jest.Mock).mockResolvedValue('decrypted-data');

    // Mock report data
    mockReport = {
      config: {
        ticker: 'NVDA',
        reportDate: '2024-01-15',
        currentDate: '2024-01-15',
        reportType: 'technical_analysis',
        outputFormat: 'pdf'
      },
      data: {
        ticker: 'NVDA',
        companyName: 'NVIDIA Corporation',
        sector: 'Technology',
        financials: {
          revenue: 1000000000,
          netIncome: 200000000,
          totalAssets: 5000000000
        }
      },
      content: {
        slides: Array(10).fill({}).map((_, i) => ({
          slideNumber: i + 1,
          type: 'content',
          title: `Slide ${i + 1}`,
          content: {}
        }))
      },
      metadata: {
        generatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        version: '1.0',
        dataSource: 'TwelveData'
      }
    };

    storageService = new StorageService();
  });

  describe('initialization', () => {
    it('should initialize IndexedDB on first use', async () => {
      // Trigger initialization
      const initPromise = (storageService as any).ensureDB();
      
      // Simulate successful DB open
      triggerIDBSuccess(mockIDBRequest, mockDB);
      
      await initPromise;
      
      expect(mockIDB.open).toHaveBeenCalledWith('ReportStorage', 1);
    });

    it('should handle IndexedDB initialization errors', async () => {
      const mockError = new Error('Failed to open DB');
      
      // Trigger initialization
      const initPromise = (storageService as any).ensureDB();
      
      // Simulate error
      triggerIDBError(mockIDBRequest, mockError);
      
      await expect(initPromise).rejects.toThrow('Failed to open DB');
    });
  });

  describe('saveReport', () => {
    beforeEach(async () => {
      // Initialize DB
      const initPromise = (storageService as any).ensureDB();
      triggerIDBSuccess(mockIDBRequest, mockDB);
      await initPromise;
    });

    it('should save report with compression and thumbnail', async () => {
      const putRequest = { onsuccess: null, onerror: null };
      mockObjectStore.put.mockReturnValue(putRequest);

      const savePromise = storageService.saveReport(mockReport);
      
      // Simulate successful save
      triggerIDBSuccess(putRequest);
      
      const result = await savePromise;
      
      expect(result.success).toBe(true);
      expect(result.reportId).toBeDefined();
      expect(CompressionUtils.compress).toHaveBeenCalled();
      expect(ThumbnailGenerator.generateThumbnail).toHaveBeenCalled();
      expect(mockObjectStore.put).toHaveBeenCalled();
    });

    it('should generate unique report ID', async () => {
      const putRequest = { onsuccess: null, onerror: null };
      mockObjectStore.put.mockReturnValue(putRequest);

      const savePromise1 = storageService.saveReport(mockReport);
      triggerIDBSuccess(putRequest);
      const result1 = await savePromise1;

      const savePromise2 = storageService.saveReport(mockReport);
      triggerIDBSuccess(putRequest);
      const result2 = await savePromise2;
      
      expect(result1.reportId).not.toBe(result2.reportId);
    });

    it('should update recent reports in localStorage', async () => {
      const putRequest = { onsuccess: null, onerror: null };
      mockObjectStore.put.mockReturnValue(putRequest);

      const savePromise = storageService.saveReport(mockReport);
      triggerIDBSuccess(putRequest);
      await savePromise;
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'recent_reports',
        expect.any(String)
      );
    });

    it('should handle save errors', async () => {
      const putRequest = { onsuccess: null, onerror: null };
      mockObjectStore.put.mockReturnValue(putRequest);
      
      const savePromise = storageService.saveReport(mockReport);
      
      // Simulate error
      triggerIDBError(putRequest, new Error('Save failed'));
      
      const result = await savePromise;
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to save report');
    });
  });

  describe('getReport', () => {
    beforeEach(async () => {
      // Initialize DB
      const initPromise = (storageService as any).ensureDB();
      triggerIDBSuccess(mockIDBRequest, mockDB);
      await initPromise;
    });

    it('should retrieve and decompress report', async () => {
      const mockStoredReport = {
        id: 'report-123',
        data: 'compressed-data',
        metadata: {
          ticker: 'NVDA',
          createdAt: new Date().toISOString()
        }
      };

      const getRequest = { onsuccess: null, onerror: null, result: mockStoredReport };
      mockObjectStore.get.mockReturnValue(getRequest);
      
      (CompressionUtils.decompress as jest.Mock).mockResolvedValue(mockReport);

      const getPromise = storageService.getReport('report-123');
      triggerIDBSuccess(getRequest);
      
      const result = await getPromise;
      
      expect(result).toEqual(mockReport);
      expect(CompressionUtils.decompress).toHaveBeenCalledWith('compressed-data');
    });

    it('should return null for non-existent report', async () => {
      const getRequest = { onsuccess: null, onerror: null, result: null };
      mockObjectStore.get.mockReturnValue(getRequest);

      const getPromise = storageService.getReport('non-existent');
      triggerIDBSuccess(getRequest);
      
      const result = await getPromise;
      
      expect(result).toBeNull();
    });
  });

  describe('listReports', () => {
    beforeEach(async () => {
      // Initialize DB
      const initPromise = (storageService as any).ensureDB();
      triggerIDBSuccess(mockIDBRequest, mockDB);
      await initPromise;
    });

    it('should list all reports with metadata', async () => {
      const mockReports = [
        {
          id: 'report-1',
          metadata: {
            ticker: 'AAPL',
            createdAt: '2024-01-01T10:00:00Z',
            reportType: 'comprehensive'
          }
        },
        {
          id: 'report-2',
          metadata: {
            ticker: 'NVDA',
            createdAt: '2024-01-02T10:00:00Z',
            reportType: 'quick'
          }
        }
      ];

      const getAllRequest = { onsuccess: null, onerror: null, result: mockReports };
      mockObjectStore.getAll.mockReturnValue(getAllRequest);

      const listPromise = storageService.listReports();
      triggerIDBSuccess(getAllRequest);
      
      const result = await listPromise;
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'report-1',
        ticker: 'AAPL'
      });
    });

    it('should filter reports by ticker', async () => {
      const mockReports = [
        {
          id: 'report-1',
          metadata: { ticker: 'AAPL', createdAt: '2024-01-01T10:00:00Z' }
        },
        {
          id: 'report-2',
          metadata: { ticker: 'NVDA', createdAt: '2024-01-02T10:00:00Z' }
        }
      ];

      const getAllRequest = { onsuccess: null, onerror: null, result: mockReports };
      mockObjectStore.getAll.mockReturnValue(getAllRequest);

      const listPromise = storageService.listReports({ ticker: 'AAPL' });
      triggerIDBSuccess(getAllRequest);
      
      const result = await listPromise;
      
      expect(result).toHaveLength(1);
      expect(result[0].ticker).toBe('AAPL');
    });
  });

  describe('deleteReport', () => {
    beforeEach(async () => {
      // Initialize DB
      const initPromise = (storageService as any).ensureDB();
      triggerIDBSuccess(mockIDBRequest, mockDB);
      await initPromise;
    });

    it('should delete report successfully', async () => {
      const deleteRequest = { onsuccess: null, onerror: null };
      mockObjectStore.delete.mockReturnValue(deleteRequest);

      const deletePromise = storageService.deleteReport('report-123');
      triggerIDBSuccess(deleteRequest);
      
      const result = await deletePromise;
      
      expect(result).toBe(true);
      expect(mockObjectStore.delete).toHaveBeenCalledWith('report-123');
    });

    it('should handle delete errors', async () => {
      const deleteRequest = { onsuccess: null, onerror: null };
      mockObjectStore.delete.mockReturnValue(deleteRequest);

      const deletePromise = storageService.deleteReport('report-123');
      triggerIDBError(deleteRequest, new Error('Delete failed'));
      
      const result = await deletePromise;
      
      expect(result).toBe(false);
    });
  });

  describe('clearAllReports', () => {
    it('should clear all reports and reset storage', async () => {
      const deleteDbRequest = { onsuccess: null, onerror: null };
      mockIDB.deleteDatabase.mockReturnValue(deleteDbRequest);

      const clearPromise = storageService.clearAllReports();
      triggerIDBSuccess(deleteDbRequest);
      
      await clearPromise;
      
      expect(mockIDB.deleteDatabase).toHaveBeenCalledWith('ReportStorage');
      expect(localStorage.removeItem).toHaveBeenCalledWith('recent_reports');
    });
  });
});