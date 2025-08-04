// src/components/Reports/__tests__/unit/ReportWizard.test.tsx
// Unit tests for ReportWizard component
// Context: Tests 4-step report generation wizard flow

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ReportWizard } from '../../ReportWizard';
import { logDebug, logError } from '../../../../utils/logger';

// Mock dependencies
jest.mock('../../../../utils/logger', () => ({
  logDebug: jest.fn(),
  logError: jest.fn(),
}));

jest.mock('../../../../services/reportApiService', () => ({
  generateReport: jest.fn(),
}));

// Mock Lucide icons
jest.mock('lucide-react', () => ({
  ChevronRight: () => <div data-testid="chevron-right" />,
  ChevronLeft: () => <div data-testid="chevron-left" />,
  FileText: () => <div data-testid="file-text" />,
  CheckCircle: () => <div data-testid="check-circle" />,
  AlertCircle: () => <div data-testid="alert-circle" />,
  Loader2: () => <div data-testid="loader" />,
  FileSearch: () => <div data-testid="file-search" />,
  PieChart: () => <div data-testid="pie-chart" />,
  TrendingUp: () => <div data-testid="trending-up" />,
  Shield: () => <div data-testid="shield" />,
  Zap: () => <div data-testid="zap" />,
  Calendar: () => <div data-testid="calendar" />,
  Building: () => <div data-testid="building" />,
  ArrowRight: () => <div data-testid="arrow-right" />,
}));

describe('ReportWizard Component', () => {
  const mockOnReportGenerated = jest.fn();
  const mockOnStepChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render initial template selection step', () => {
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      expect(screen.getByText('Choose a Template')).toBeInTheDocument();
      expect(screen.getByText('Equity Research')).toBeInTheDocument();
      expect(screen.getByText('Technical Analysis')).toBeInTheDocument();
      expect(screen.getByText('Risk Assessment')).toBeInTheDocument();
    });

    it('should display step indicators', () => {
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      expect(screen.getByText('Template')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
      expect(screen.getByText('Data')).toBeInTheDocument();
      expect(screen.getByText('Configure')).toBeInTheDocument();
    });
  });

  describe('Step Navigation', () => {
    it('should navigate to details step when template is selected', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      const equityCard = screen.getByText('Equity Research').closest('div[role="button"]');
      await user.click(equityCard!);
      
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      expect(screen.getByText('Report Details')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis')).toBeInTheDocument();
    });

    it('should validate required fields before allowing navigation', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Select template and go to details
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));

      // Try to go next without filling required fields
      await user.click(screen.getByText('Next'));

      // Should still be on details step
      expect(screen.getByText('Report Details')).toBeInTheDocument();
    });

    it('should allow going back to previous steps', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Navigate to details step
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));

      // Go back
      await user.click(screen.getByText('Back'));

      expect(screen.getByText('Choose a Template')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should validate ticker symbol format', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Navigate to details step
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));

      // Enter invalid ticker
      const tickerInput = screen.getByPlaceholderText('AAPL');
      await user.type(tickerInput, '123');

      // Should show validation error
      expect(tickerInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('should enforce title character limit', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Navigate to details step
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));

      const titleInput = screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis');
      const longTitle = 'A'.repeat(101);
      await user.type(titleInput, longTitle);

      // Should truncate to 100 characters
      expect(titleInput).toHaveValue('A'.repeat(100));
    });
  });

  describe('Report Generation', () => {
    it('should generate report with correct configuration', async () => {
      const { generateReport } = require('../../../../services/reportApiService');
      generateReport.mockResolvedValueOnce({
        success: true,
        reportId: 'test-report-123',
        data: {
          slides: Array(6).fill(null).map((_, i) => ({
            slideNumber: i + 1,
            title: `Slide ${i + 1}`,
            layout: 'content',
            content: []
          })),
          companyData: { ticker: 'AAPL', companyName: 'Apple Inc.' },
          metadata: { format: 'pdf' }
        }
      });

      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Complete all steps
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));

      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'Test Report');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));

      // Data sources step
      await user.click(screen.getByText('Next'));

      // Configuration step
      expect(screen.getByText('Report Configuration')).toBeInTheDocument();
      await user.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(generateReport).toHaveBeenCalledWith({
          ticker: 'AAPL',
          title: 'Test Report',
          template: 'equity-research',
          author: 'TriSight Analytics',
          format: 'pdf',
          outputFormat: 'pdf',
          dataSources: ['market-data', 'financial-statements', 'news'],
          visualizations: ['price-chart', 'volume-chart', 'financial-metrics'],
          includeAISummary: true,
          includeCharts: true,
          aiTone: 'professional'
        });
      });
    });

    it('should handle generation errors gracefully', async () => {
      const { generateReport } = require('../../../../services/reportApiService');
      generateReport.mockRejectedValueOnce(new Error('API Error'));

      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Complete wizard quickly
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));
      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'Test');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to generate report/)).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message with report details', async () => {
      const { generateReport } = require('../../../../services/reportApiService');
      generateReport.mockResolvedValueOnce({
        success: true,
        reportId: 'test-report-123',
        data: {
          slides: [
            { slideNumber: 1, title: 'Title Slide', layout: 'title', content: [] },
            { slideNumber: 2, title: 'Executive Summary', layout: 'content', content: [] },
            { slideNumber: 3, title: 'Company Overview', layout: 'content', content: [] },
            { slideNumber: 4, title: 'Valuation Analysis', layout: 'content', content: [] },
            { slideNumber: 5, title: 'Investment Recommendation', layout: 'content', content: [] },
            { slideNumber: 6, title: 'Important Disclaimers', layout: 'content', content: [] }
          ],
          companyData: { ticker: 'AAPL', companyName: 'Apple Inc.' },
          metadata: { format: 'pdf' }
        }
      });

      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Complete wizard
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));
      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'AAPL Report');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(screen.getByText('Report Generated Successfully!')).toBeInTheDocument();
        expect(screen.getByText('Total slides: 6')).toBeInTheDocument();
        expect(screen.getByText('Template: equity-research')).toBeInTheDocument();
        expect(screen.getByText('Ticker: AAPL')).toBeInTheDocument();
      });

      // Check slide list
      expect(screen.getByText('Title Slide')).toBeInTheDocument();
      expect(screen.getByText('Executive Summary')).toBeInTheDocument();
      expect(screen.getByText('Company Overview')).toBeInTheDocument();
      expect(screen.getByText('Valuation Analysis')).toBeInTheDocument();
      expect(screen.getByText('Investment Recommendation')).toBeInTheDocument();
      expect(screen.getByText('Important Disclaimers')).toBeInTheDocument();
    });

    it('should call onReportGenerated callback', async () => {
      const { generateReport } = require('../../../../services/reportApiService');
      const mockReport = {
        success: true,
        reportId: 'test-123',
        data: {
          slides: [{ slideNumber: 1, title: 'Test', layout: 'title', content: [] }],
          companyData: { ticker: 'AAPL' },
          metadata: {}
        }
      };
      generateReport.mockResolvedValueOnce(mockReport);

      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Quick complete
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));
      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'Test');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Generate Report'));

      await waitFor(() => {
        expect(mockOnReportGenerated).toHaveBeenCalledWith(expect.objectContaining({
          id: expect.stringContaining('report-'),
          ticker: 'AAPL',
          title: 'Test',
          template: 'equity-research',
          status: 'completed',
          completedAt: expect.any(Date),
          slides: mockReport.data.slides,
          companyData: mockReport.data.companyData,
          reportData: mockReport.data
        }));
      });
    });
  });

  describe('PDF Format Default', () => {
    it('should default to PDF format', async () => {
      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Navigate to config step
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));
      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'Test');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));

      // Check PDF is selected by default
      const pdfRadio = screen.getByLabelText('PDF Document');
      expect(pdfRadio).toBeChecked();
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during generation', async () => {
      const { generateReport } = require('../../../../services/reportApiService');
      generateReport.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      const user = userEvent.setup();
      render(
        <ReportWizard
          onReportGenerated={mockOnReportGenerated}
          onStepChange={mockOnStepChange}
        />
      );

      // Quick navigate to generate
      await user.click(screen.getByText('Equity Research').closest('div[role="button"]')!);
      await user.click(screen.getByText('Next'));
      await user.type(screen.getByPlaceholderText('e.g., Apple Inc. Q4 2024 Equity Analysis'), 'Test');
      await user.type(screen.getByPlaceholderText('AAPL'), 'AAPL');
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Next'));
      await user.click(screen.getByText('Generate Report'));

      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Generating your report...')).toBeInTheDocument();
    });
  });
});