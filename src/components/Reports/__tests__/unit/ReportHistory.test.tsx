// src/components/Reports/__tests__/unit/ReportHistory.test.tsx
// Unit tests for ReportHistory component
// Context: Tests recent reports list functionality

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReportHistory } from '../../ReportHistory';
import { getStorageService } from '../../../../services/reportStorageService';
import { deleteReport } from '../../../../services/reportApiService';
import { logDebug, logError } from '../../../../utils/logger';

// Mock dependencies
jest.mock('../../../../services/reportStorageService', () => ({
  getStorageService: jest.fn(() => ({
    listReports: jest.fn(),
    downloadReport: jest.fn()
  }))
}));

jest.mock('../../../../services/reportApiService', () => ({
  deleteReport: jest.fn()
}));

jest.mock('../../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  Calendar: () => <div data-testid="calendar-icon" />,
  FileType: () => <div data-testid="filetype-icon" />,
  HardDrive: () => <div data-testid="harddrive-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  ChevronDown: () => <div data-testid="chevron-down" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

describe('ReportHistory Component', () => {
  const mockOnReportSelect = jest.fn();
  const mockOnReportDelete = jest.fn();
  
  // Mock current date to 2025-08-02 for consistent date calculations
  const mockCurrentDate = new Date('2025-08-02T15:00:00.000Z');
  const originalDate = Date;
  
  beforeAll(() => {
    // Mock Date constructor to return our fixed date
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockCurrentDate.getTime());
        } else {
          super(...args);
        }
      }
    } as any;
    global.Date.now = () => mockCurrentDate.getTime();
    global.Date.parse = originalDate.parse;
    global.Date.UTC = originalDate.UTC;
  });
  
  afterAll(() => {
    global.Date = originalDate;
  });
  
  const mockReports = [
    {
      id: 'report-1',
      title: 'AAPL report 08/02/2025T14-51-58-698Z',
      ticker: 'AAPL',
      template: 'equity-research',
      format: 'pdf',
      fileSize: 32768,
      createdAt: '2025-08-02T14:51:58.698Z',
      completedAt: '2025-08-02T14:52:00.000Z',
      slides: Array(6).fill(null).map((_, i) => ({ slideNumber: i + 1, title: `Slide ${i + 1}` })),
      companyData: { ticker: 'AAPL', companyName: 'Apple Inc.' },
      metadata: { author: 'TriSight' }
    },
    {
      id: 'report-2',
      title: 'NVDA report 08/01/2025T12-05-57-185Z',
      ticker: 'NVDA',
      template: 'technical-analysis',
      format: 'pptx',
      fileSize: 113664,
      createdAt: '2025-08-01T12:05:57.185Z',
      completedAt: '2025-08-01T12:06:00.000Z',
      slides: Array(8).fill(null).map((_, i) => ({ slideNumber: i + 1, title: `Slide ${i + 1}` })),
      companyData: { ticker: 'NVDA', companyName: 'NVIDIA Corporation' }
    },
    {
      id: 'report-3',
      title: 'MSFT report 07/31/2025T14-36-55-544Z',
      ticker: 'MSFT',
      template: 'risk-assessment',
      format: 'pdf',
      fileSize: 34816,
      createdAt: '2025-07-31T14:36:55.544Z',
      completedAt: '2025-07-31T14:37:00.000Z',
      slides: Array(5).fill(null).map((_, i) => ({ slideNumber: i + 1, title: `Slide ${i + 1}` })),
      companyData: { ticker: 'MSFT', companyName: 'Microsoft Corporation' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const mockStorageService = getStorageService as jest.Mock;
    mockStorageService.mockReturnValue({
      listReports: jest.fn().mockResolvedValue(mockReports),
      downloadReport: jest.fn().mockResolvedValue(new Blob(['test']))
    });
  });

  describe('Rendering', () => {
    it('should render search bar and filter buttons', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Search reports...')).toBeInTheDocument();
        expect(screen.getByText('All Types')).toBeInTheDocument();
        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('PowerPoint')).toBeInTheDocument();
        expect(screen.getByText('Excel')).toBeInTheDocument();
      });
    });

    it('should render reports list', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
        expect(screen.getByText('NVDA report 08/01/2025T12-05-57-185Z')).toBeInTheDocument();
        expect(screen.getByText('MSFT report 07/31/2025T14-36-55-544Z')).toBeInTheDocument();
      });
    });

    it('should display report metadata correctly', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        // First report (today)
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('32 KB')).toBeInTheDocument();
        expect(screen.getByText('PDF for AAPL')).toBeInTheDocument();
        
        // Second report (yesterday)
        expect(screen.getByText('Yesterday')).toBeInTheDocument();
        expect(screen.getByText('111 KB')).toBeInTheDocument();
        expect(screen.getByText('PPTX for NVDA')).toBeInTheDocument();
        
        // Third report (2 days ago)
        expect(screen.getByText('2 days ago')).toBeInTheDocument();
      });
    });

    it('should show empty state when no reports', async () => {
      const mockStorageService = getStorageService as jest.Mock;
      mockStorageService.mockReturnValue({
        listReports: jest.fn().mockResolvedValue([])
      });

      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('No reports found')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter reports by search term', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search reports...');
      fireEvent.change(searchInput, { target: { value: 'NVDA' } });

      await waitFor(() => {
        expect(screen.queryByText('AAPL report 08/02/2025T14-51-58-698Z')).not.toBeInTheDocument();
        expect(screen.getByText('NVDA report 08/01/2025T12-05-57-185Z')).toBeInTheDocument();
        expect(screen.queryByText('MSFT report 07/31/2025T14-36-55-544Z')).not.toBeInTheDocument();
      });
    });

    it('should search by ticker in title', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      const searchInput = screen.getByPlaceholderText('Search reports...');
      fireEvent.change(searchInput, { target: { value: 'AAPL' } });

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
        expect(screen.queryByText('NVDA report 08/01/2025T12-05-57-185Z')).not.toBeInTheDocument();
      });
    });

    it('should be case insensitive', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      const searchInput = screen.getByPlaceholderText('Search reports...');
      fireEvent.change(searchInput, { target: { value: 'aapl' } });

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });
    });
  });

  describe('Type Filtering', () => {
    it('should filter by PDF type', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      fireEvent.click(screen.getByText('PDF'));

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
        expect(screen.queryByText('NVDA report 08/01/2025T12-05-57-185Z')).not.toBeInTheDocument();
        expect(screen.getByText('MSFT report 07/31/2025T14-36-55-544Z')).toBeInTheDocument();
      });
    });

    it('should filter by PowerPoint type', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      fireEvent.click(screen.getByText('PowerPoint'));

      await waitFor(() => {
        expect(screen.queryByText('AAPL report 08/02/2025T14-51-58-698Z')).not.toBeInTheDocument();
        expect(screen.getByText('NVDA report 08/01/2025T12-05-57-185Z')).toBeInTheDocument();
        expect(screen.queryByText('MSFT report 07/31/2025T14-36-55-544Z')).not.toBeInTheDocument();
      });
    });

    it('should show all types when All Types clicked', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });

      // First filter by PDF
      fireEvent.click(screen.getByText('PDF'));
      await waitFor(() => {
        expect(screen.queryByText('NVDA report 08/01/2025T12-05-57-185Z')).not.toBeInTheDocument();
      });

      // Then show all
      fireEvent.click(screen.getByText('All Types'));
      await waitFor(() => {
        expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
      });
    });
  });

  describe('Report Actions', () => {
    it('should handle view report action', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByLabelText('View report');
      fireEvent.click(viewButtons[0]);

      expect(mockOnReportSelect).toHaveBeenCalledWith(expect.objectContaining({
        id: 'report-1',
        ticker: 'AAPL',
        slides: expect.any(Array)
      }));
    });

    it('should handle download report action', async () => {
      const mockDownload = jest.fn().mockResolvedValue(new Blob(['test']));
      const mockStorageService = getStorageService as jest.Mock;
      mockStorageService.mockReturnValue({
        listReports: jest.fn().mockResolvedValue(mockReports),
        downloadReport: mockDownload
      });

      global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = jest.fn();

      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const downloadButtons = screen.getAllByLabelText('Download');
      fireEvent.click(downloadButtons[0]);

      await waitFor(() => {
        expect(mockDownload).toHaveBeenCalledWith('report-1');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('should handle delete report action', async () => {
      (deleteReport as jest.Mock).mockResolvedValue({ success: true });
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this report?');
      
      await waitFor(() => {
        expect(deleteReport).toHaveBeenCalledWith('report-1');
        expect(mockOnReportDelete).toHaveBeenCalledWith('report-1');
      });

      confirmSpy.mockRestore();
    });

    it('should handle delete cancellation', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);

      expect(deleteReport).not.toHaveBeenCalled();
      expect(mockOnReportDelete).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should handle delete error', async () => {
      (deleteReport as jest.Mock).mockRejectedValue(new Error('Delete failed'));
      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByLabelText('Delete');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith(
          'ReportHistory',
          'Failed to delete report:',
          expect.any(Error)
        );
      });

      confirmSpy.mockRestore();
    });
  });

  describe('Date Formatting', () => {
    it('should format today correctly', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        const todayElements = screen.getAllByText('Today');
        expect(todayElements.length).toBeGreaterThan(0);
      });
    });

    it('should format yesterday correctly', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Yesterday')).toBeInTheDocument();
      });
    });

    it('should format older dates correctly', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('2 days ago')).toBeInTheDocument();
      });
    });
  });

  describe('File Size Formatting', () => {
    it('should format KB sizes correctly', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('32 KB')).toBeInTheDocument();
        expect(screen.getByText('111 KB')).toBeInTheDocument();
        expect(screen.getByText('34 KB')).toBeInTheDocument();
      });
    });

    it('should handle missing file size', async () => {
      const reportsWithoutSize = [
        { ...mockReports[0], fileSize: undefined }
      ];
      
      const mockStorageService = getStorageService as jest.Mock;
      mockStorageService.mockReturnValue({
        listReports: jest.fn().mockResolvedValue(reportsWithoutSize)
      });

      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  describe('Report Click', () => {
    it('should select report when card is clicked', async () => {
      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('AAPL report 08/02/2025T14-51-58-698Z')).toBeInTheDocument();
      });

      const reportCard = screen.getByText('AAPL report 08/02/2025T14-51-58-698Z').closest('div[role="button"]');
      fireEvent.click(reportCard!);

      expect(mockOnReportSelect).toHaveBeenCalledWith(expect.objectContaining({
        id: 'report-1',
        ticker: 'AAPL'
      }));
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      const mockStorageService = getStorageService as jest.Mock;
      mockStorageService.mockReturnValue({
        listReports: jest.fn(() => new Promise(() => {})) // Never resolves
      });

      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      expect(screen.getByPlaceholderText('Search reports...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle load error gracefully', async () => {
      const mockStorageService = getStorageService as jest.Mock;
      mockStorageService.mockReturnValue({
        listReports: jest.fn().mockRejectedValue(new Error('Load failed'))
      });

      render(
        <ReportHistory
          onReportSelect={mockOnReportSelect}
          onReportDelete={mockOnReportDelete}
        />
      );

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith(
          'ReportHistory',
          'Error loading reports:',
          expect.any(Error)
        );
      });
    });
  });
});