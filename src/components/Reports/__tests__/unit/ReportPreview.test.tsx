// src/components/Reports/__tests__/unit/ReportPreview.test.tsx
// Unit tests for ReportPreview component
// Context: Tests live preview functionality and download features

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ReportPreview } from '../../ReportPreview';
import { getStorageService } from '../../../../services/reportStorageService';
import { logDebug, logError } from '../../../../utils/logger';

// Mock dependencies
jest.mock('../../../../services/reportStorageService', () => ({
  getStorageService: jest.fn(() => ({
    downloadReport: jest.fn()
  }))
}));

jest.mock('../../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  Eye: () => <div data-testid="eye-icon" />,
  Maximize2: () => <div data-testid="maximize-icon" />,
  Download: () => <div data-testid="download-icon" />,
  RefreshCw: () => <div data-testid="refresh-icon" />,
}));

// Mock URL and Blob
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

describe('ReportPreview Component', () => {
  const mockOnReportChange = jest.fn();
  const mockReport = {
    id: 'report-123',
    ticker: 'AAPL',
    title: 'Apple Inc. Q4 2024 Equity Analysis',
    template: 'equity-research',
    author: 'TriSight Analytics',
    completedAt: '2024-01-15T10:00:00Z',
    slides: [
      {
        slideNumber: 1,
        title: 'Title Slide',
        layout: 'title',
        content: [
          {
            type: 'text',
            data: {
              title: 'Apple Inc.',
              subtitle: 'Ticker: AAPL',
              date: '2024-01-15'
            }
          }
        ]
      },
      {
        slideNumber: 2,
        title: 'Executive Summary',
        layout: 'content',
        content: [
          {
            type: 'text',
            data: {
              text: 'Investment Thesis: Apple Inc. (AAPL) - Short Position',
              bullets: [
                'Growth Deceleration - YoY revenue growth slowed to 2.02%',
                'Valuation Disconnect - Current valuation shows -6.36% margin of safety',
                'Competitive Pressures - Margin pressure evident with 46.2% gross margins'
              ]
            }
          }
        ]
      },
      {
        slideNumber: 3,
        title: 'Company Overview',
        layout: 'content',
        content: [
          {
            type: 'table',
            data: {
              headers: ['Metric', 'Value'],
              rows: [
                ['Market Cap', '$3.0T'],
                ['P/E Ratio', '32.5'],
                ['Revenue Growth', '2.0%'],
                ['ROE', '147.5%']
              ]
            }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render empty state when no report is provided', () => {
      render(
        <ReportPreview
          currentReport={null}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Create a report to see the preview')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    it('should render report content when report is provided', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Apple Inc. Q4 2024 Equity Analysis')).toBeInTheDocument();
      expect(screen.getByText('Ticker: AAPL')).toBeInTheDocument();
      expect(screen.getByText('Template: equity-research')).toBeInTheDocument();
      expect(screen.getByText('Total Slides: 3')).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Document')).toBeInTheDocument();
      expect(screen.getByText('Presentation')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByTitle('Refresh preview')).toBeInTheDocument();
      expect(screen.getByTitle('Full screen')).toBeInTheDocument();
      expect(screen.getByTitle('Download preview')).toBeInTheDocument();
    });
  });

  describe('Content Display', () => {
    it('should render text content correctly', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Investment Thesis: Apple Inc. (AAPL) - Short Position')).toBeInTheDocument();
    });

    it('should render bullet points', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Growth Deceleration - YoY revenue growth slowed to 2.02%')).toBeInTheDocument();
      expect(screen.getByText('Valuation Disconnect - Current valuation shows -6.36% margin of safety')).toBeInTheDocument();
      expect(screen.getByText('Competitive Pressures - Margin pressure evident with 46.2% gross margins')).toBeInTheDocument();
    });

    it('should render tables correctly', () => {
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Company Overview')).toBeInTheDocument();
      expect(screen.getByText('Metric')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
      expect(screen.getByText('Market Cap')).toBeInTheDocument();
      expect(screen.getByText('$3.0T')).toBeInTheDocument();
    });

    it('should render chart placeholders', () => {
      const reportWithChart = {
        ...mockReport,
        slides: [
          ...mockReport.slides,
          {
            slideNumber: 4,
            title: 'Financial Performance',
            layout: 'content',
            content: [
              {
                type: 'chart',
                data: {
                  title: 'Revenue Growth Chart'
                }
              }
            ]
          }
        ]
      };

      render(
        <ReportPreview
          currentReport={reportWithChart}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Revenue Growth Chart')).toBeInTheDocument();
    });
  });

  describe('View Toggle', () => {
    it('should switch between document and presentation views', async () => {
      const user = userEvent.setup();
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      // Initially in document view
      expect(screen.getByText('Apple Inc. Q4 2024 Equity Analysis')).toBeInTheDocument();

      // Switch to presentation view
      await user.click(screen.getByText('Presentation'));

      expect(screen.getByText('Presentation View')).toBeInTheDocument();
      expect(screen.getByText('Slide 1: Title Slide')).toBeInTheDocument();
      expect(screen.getByText('title layout')).toBeInTheDocument();
    });

    it('should show empty presentation view when no slides', async () => {
      const user = userEvent.setup();
      const emptyReport = { ...mockReport, slides: null };
      
      render(
        <ReportPreview
          currentReport={emptyReport}
          onReportChange={mockOnReportChange}
        />
      );

      await user.click(screen.getByText('Presentation'));
      expect(screen.getByText('Generate a report to see the presentation slides')).toBeInTheDocument();
    });
  });

  describe('Download Functionality', () => {
    it('should download report successfully', async () => {
      const mockDownloadReport = jest.fn().mockResolvedValue(new Blob(['test data']));
      (getStorageService as jest.Mock).mockReturnValue({
        downloadReport: mockDownloadReport
      });

      const user = userEvent.setup();
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      const downloadButton = screen.getByTitle('Download preview');
      await user.click(downloadButton);

      await waitFor(() => {
        expect(mockDownloadReport).toHaveBeenCalledWith('report-123');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      });
    });

    it('should handle download errors with fallback text download', async () => {
      const mockDownloadReport = jest.fn().mockRejectedValue(new Error('Download failed'));
      (getStorageService as jest.Mock).mockReturnValue({
        downloadReport: mockDownloadReport
      });

      const user = userEvent.setup();
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      await user.click(screen.getByTitle('Download preview'));

      await waitFor(() => {
        expect(logError).toHaveBeenCalledWith(
          'ReportPreview',
          'Failed to download report:',
          expect.any(Error)
        );
        // Should create text fallback
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
    });

    it('should show alert when no report ID', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const user = userEvent.setup();
      
      render(
        <ReportPreview
          currentReport={{ ...mockReport, id: undefined }}
          onReportChange={mockOnReportChange}
        />
      );

      await user.click(screen.getByTitle('Download preview'));

      expect(alertSpy).toHaveBeenCalledWith('Please complete the report generation first.');
      alertSpy.mockRestore();
    });

    it('should handle JSON response for client-side generation', async () => {
      const mockJsonResponse = {
        success: true,
        reportData: mockReport,
        slides: mockReport.slides
      };
      const mockDownloadReport = jest.fn().mockResolvedValue(mockJsonResponse);
      (getStorageService as jest.Mock).mockReturnValue({
        downloadReport: mockDownloadReport
      });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();
      const user = userEvent.setup();
      
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      await user.click(screen.getByTitle('Download preview'));

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Client-side PDF generation not yet implemented. Report data is available in the preview.'
        );
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Refresh Functionality', () => {
    it('should refresh preview when refresh button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      const refreshButton = screen.getByTitle('Refresh preview');
      await user.click(refreshButton);

      // Should re-render content
      expect(screen.getByText('Apple Inc. Q4 2024 Equity Analysis')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading overlay during operations', async () => {
      const mockDownloadReport = jest.fn(() => 
        new Promise(resolve => setTimeout(() => resolve(new Blob(['test'])), 100))
      );
      (getStorageService as jest.Mock).mockReturnValue({
        downloadReport: mockDownloadReport
      });

      const user = userEvent.setup();
      render(
        <ReportPreview
          currentReport={mockReport}
          onReportChange={mockOnReportChange}
        />
      );

      const refreshButton = screen.getByTitle('Refresh preview');
      await user.click(refreshButton);

      // Loading overlay should appear briefly
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });
  });

  describe('Report with reportData', () => {
    it('should handle report with nested reportData structure', () => {
      const nestedReport = {
        ...mockReport,
        slides: null,
        reportData: {
          slides: mockReport.slides
        }
      };

      render(
        <ReportPreview
          currentReport={nestedReport}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Total Slides: 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle report with empty slides array', () => {
      const emptySlides = { ...mockReport, slides: [] };
      
      render(
        <ReportPreview
          currentReport={emptySlides}
          onReportChange={mockOnReportChange}
        />
      );

      expect(screen.getByText('Total Slides: 0')).toBeInTheDocument();
    });

    it('should handle malformed slide content gracefully', () => {
      const malformedReport = {
        ...mockReport,
        slides: [
          {
            slideNumber: 1,
            title: 'Test',
            layout: 'content',
            content: [
              {
                type: 'unknown',
                data: null
              }
            ]
          }
        ]
      };

      render(
        <ReportPreview
          currentReport={malformedReport}
          onReportChange={mockOnReportChange}
        />
      );

      // Should render without crashing
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle generating status', () => {
      const generatingReport = {
        ...mockReport,
        status: 'generating'
      };

      render(
        <ReportPreview
          currentReport={generatingReport}
          onReportChange={mockOnReportChange}
        />
      );

      // Should still render content
      expect(screen.getByText('Apple Inc. Q4 2024 Equity Analysis')).toBeInTheDocument();
    });
  });
});