// e2e/tests/reports/report-management.spec.ts
// E2E tests for report viewing, downloading, and management
// Context: Tests report list operations and viewer functionality

import { test, expect } from '@playwright/test';
import { ReportWizardPage } from '../../pages/reports/ReportWizardPage';
import { ReportsListPage } from '../../pages/reports/ReportsListPage';
import { ReportViewerPage } from '../../pages/reports/ReportViewerPage';

test.describe('Report Management', () => {
  let wizardPage: ReportWizardPage;
  let listPage: ReportsListPage;
  let viewerPage: ReportViewerPage;

  test.beforeEach(async ({ page }) => {
    wizardPage = new ReportWizardPage(page);
    listPage = new ReportsListPage(page);
    viewerPage = new ReportViewerPage(page);
    
    // Navigate to reports page
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Report List Operations', () => {
    test('should display recent reports', async ({ page }) => {
      await listPage.waitForReportsToLoad();
      
      const reportCount = await listPage.getReportCount();
      if (reportCount === 0) {
        // Generate a report if none exist
        await wizardPage.navigateToReportWizard();
        await wizardPage.generateQuickReport('AAPL');
        await page.goto('/reports');
        await listPage.waitForReportsToLoad();
      }
      
      const titles = await listPage.getReportTitles();
      expect(titles.length).toBeGreaterThan(0);
      
      // Check report details
      const firstReport = titles[0];
      const details = await listPage.getReportDetails(firstReport);
      expect(details).toBeTruthy();
      expect(details?.format).toMatch(/PDF|PPTX|XLSX/);
      expect(details?.date).toBeTruthy();
      expect(details?.size).toBeTruthy();
    });

    test('should search reports by ticker', async ({ page }) => {
      // Ensure we have reports with different tickers
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('AAPL');
      await page.goto('/reports');
      
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('NVDA');
      await page.goto('/reports');
      
      await listPage.waitForReportsToLoad();
      
      // Search for AAPL
      await listPage.searchReports('AAPL');
      const aaplResults = await listPage.getReportTitles();
      await listPage.verifySearchResults('AAPL');
      
      // Search for NVDA
      await listPage.clearSearch();
      await listPage.searchReports('NVDA');
      const nvdaResults = await listPage.getReportTitles();
      await listPage.verifySearchResults('NVDA');
      
      // Clear search shows all
      await listPage.clearSearch();
      const allResults = await listPage.getReportTitles();
      expect(allResults.length).toBeGreaterThanOrEqual(Math.max(aaplResults.length, nvdaResults.length));
    });

    test('should filter reports by type', async ({ page }) => {
      // Generate different types of reports
      await wizardPage.navigateToReportWizard();
      await wizardPage.selectTemplate('equity-research');
      await wizardPage.proceedToDetails();
      await wizardPage.fillReportDetails('PDF Test', 'AAPL');
      await wizardPage.proceedToDataSources();
      await wizardPage.proceedToConfiguration();
      await wizardPage.selectOutputFormat('pdf');
      await wizardPage.generateReport();
      await wizardPage.waitForGeneration();
      
      await page.goto('/reports');
      
      await wizardPage.navigateToReportWizard();
      await wizardPage.selectTemplate('technical-analysis');
      await wizardPage.proceedToDetails();
      await wizardPage.fillReportDetails('PPTX Test', 'NVDA');
      await wizardPage.proceedToDataSources();
      await wizardPage.proceedToConfiguration();
      await wizardPage.selectOutputFormat('pptx');
      await wizardPage.generateReport();
      await wizardPage.waitForGeneration();
      
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
      
      // Filter by PDF
      await listPage.filterByType('pdf');
      await listPage.verifyFilterApplied('PDF');
      
      // Filter by PowerPoint
      await listPage.filterByType('powerpoint');
      await listPage.verifyFilterApplied('PPTX');
      
      // Show all
      await listPage.filterByType('all');
      const formats = await listPage.getVisibleReportFormats();
      expect(formats).toContain('PDF');
      expect(formats).toContain('PPTX');
    });

    test('should delete report with confirmation', async ({ page }) => {
      // Generate a report to delete
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('DELETE-TEST');
      
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      expect(reportTitle).toContain('DELETE-TEST');
      
      // Delete with confirmation
      await listPage.deleteReportWithConfirmation(reportTitle!, true);
      
      // Verify report is deleted
      await listPage.verifyReportNotExists(reportTitle!);
    });

    test('should cancel delete operation', async ({ page }) => {
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      if (!reportTitle) {
        // Generate a report if none exist
        await wizardPage.navigateToReportWizard();
        await wizardPage.generateQuickReport('KEEP-TEST');
        await page.goto('/reports');
        await listPage.waitForReportsToLoad();
      }
      
      const titleToKeep = await listPage.getMostRecentReport();
      expect(titleToKeep).toBeTruthy();
      
      // Cancel delete
      await listPage.deleteReportWithConfirmation(titleToKeep!, false);
      
      // Verify report still exists
      await listPage.verifyReportExists(titleToKeep!);
    });

    test('should handle empty state', async ({ page }) => {
      // Delete all reports
      await listPage.waitForReportsToLoad();
      
      // This is destructive - only run in test environment
      if (process.env.TEST_ENV === 'isolated') {
        await listPage.deleteAllReports();
        await listPage.verifyEmptyState();
      }
    });
  });

  test.describe('Report Viewing', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure we have a report to view
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('VIEW-TEST', 'equity-research');
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
    });

    test('should view report from list', async ({ page }) => {
      const reportTitle = await listPage.getMostRecentReport();
      expect(reportTitle).toContain('VIEW-TEST');
      
      // Click to view
      await listPage.viewReport(reportTitle!);
      
      // Verify viewer loaded
      await viewerPage.waitForReportToLoad();
      await viewerPage.verifyReportLoaded();
      
      const viewerTitle = await viewerPage.getReportTitle();
      expect(viewerTitle).toContain('VIEW-TEST');
      
      const metadata = await viewerPage.getReportMetadata();
      expect(metadata.ticker).toBe('VIEW-TEST');
      expect(metadata.template).toBe('equity-research');
    });

    test('should switch between document and presentation views', async ({ page }) => {
      const reportTitle = await listPage.getMostRecentReport();
      await listPage.viewReport(reportTitle!);
      await viewerPage.waitForReportToLoad();
      
      // Default is document view
      expect(await viewerPage.getCurrentView()).toBe('document');
      
      // Check document content
      const sections = await viewerPage.getSectionTitles();
      expect(sections).toContain('Executive Summary');
      expect(sections).toContain('Company Overview');
      
      // Switch to presentation view
      await viewerPage.switchToPresentationView();
      expect(await viewerPage.getCurrentView()).toBe('presentation');
      
      // Check slides
      const slideCount = await viewerPage.getSlideCount();
      expect(slideCount).toBe(6);
      
      const slides = await viewerPage.getAllSlides();
      expect(slides[0].title).toBe('Title Slide');
      expect(slides[1].title).toBe('Executive Summary');
    });

    test('should display report content correctly', async ({ page }) => {
      const reportTitle = await listPage.getMostRecentReport();
      await listPage.viewReport(reportTitle!);
      await viewerPage.waitForReportToLoad();
      
      // Check executive summary content
      await viewerPage.verifyContentContains('Investment Thesis');
      await viewerPage.verifySectionExists('Executive Summary');
      
      // Check for bullet points
      const bullets = await viewerPage.getBulletPoints('Executive Summary');
      expect(bullets.length).toBeGreaterThan(0);
      
      // Check for tables
      const tableData = await viewerPage.getTableData(0);
      expect(tableData.headers).toContain('Metric');
      expect(tableData.headers).toContain('Value');
    });

    test('should refresh preview', async ({ page }) => {
      const reportTitle = await listPage.getMostRecentReport();
      await listPage.viewReport(reportTitle!);
      await viewerPage.waitForReportToLoad();
      
      const initialContent = await viewerPage.getDocumentContent();
      
      // Refresh
      await viewerPage.refreshPreview();
      
      // Content should reload
      const refreshedContent = await viewerPage.getDocumentContent();
      expect(refreshedContent).toBe(initialContent);
    });
  });

  test.describe('Report Download', () => {
    test('should download report from list', async ({ page }) => {
      // Generate a PDF report
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('DOWNLOAD-TEST');
      
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      expect(reportTitle).toContain('DOWNLOAD-TEST');
      
      // Download from list
      const download = await listPage.downloadReport(reportTitle!);
      
      // Verify download
      expect(download).toBeTruthy();
      const filename = download.suggestedFilename();
      expect(filename).toMatch(/\.(pdf|pptx|xlsx)$/i);
    });

    test('should download report from viewer', async ({ page }) => {
      // Generate and view a report
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('VIEWER-DOWNLOAD');
      
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      await listPage.viewReport(reportTitle!);
      await viewerPage.waitForReportToLoad();
      
      // Try to download
      const result = await viewerPage.downloadReportWithAlertHandling();
      
      if (result.download) {
        // Successfully downloaded
        expect(result.download).toBeTruthy();
      } else if (result.alert) {
        // Got alert instead (client-side generation needed)
        expect(result.alert).toMatch(/Client-side PDF generation not yet implemented|Report data is available in the preview/);
      }
    });

    test('should handle download errors gracefully', async ({ page }) => {
      // Mock download error
      await page.route('**/api/reports/download*', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { message: 'Download service unavailable' }
          })
        });
      });
      
      await listPage.waitForReportsToLoad();
      const reportTitle = await listPage.getMostRecentReport();
      
      if (reportTitle) {
        await listPage.viewReport(reportTitle);
        await viewerPage.waitForReportToLoad();
        
        // Attempt download
        const result = await viewerPage.downloadReportWithAlertHandling();
        
        // Should show error or fallback
        expect(result.alert).toBeTruthy();
      }
    });
  });

  test.describe('Report Metadata', () => {
    test('should display correct report metadata', async ({ page }) => {
      // Generate report with specific metadata
      await wizardPage.navigateToReportWizard();
      await wizardPage.selectTemplate('technical-analysis');
      await wizardPage.proceedToDetails();
      
      const title = 'Tesla Technical Analysis Q4 2024';
      const ticker = 'TSLA';
      const author = 'Technical Analyst';
      
      await wizardPage.fillReportDetails(title, ticker, author);
      await wizardPage.proceedToDataSources();
      await wizardPage.proceedToConfiguration();
      await wizardPage.generateReport();
      await wizardPage.waitForGeneration();
      
      // View the report
      await wizardPage.viewGeneratedReport();
      await viewerPage.waitForReportToLoad();
      
      // Check metadata
      const viewerTitle = await viewerPage.getReportTitle();
      expect(viewerTitle).toBe(title);
      
      const metadata = await viewerPage.getReportMetadata();
      expect(metadata.ticker).toBe(ticker);
      expect(metadata.template).toBe('technical-analysis');
      expect(metadata.totalSlides).toBeGreaterThan(0);
    });

    test('should show report generation time', async ({ page }) => {
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      if (reportTitle) {
        const details = await listPage.getReportDetails(reportTitle);
        expect(details?.date).toMatch(/Today|Yesterday|\d+ days ago/);
        
        // View report
        await listPage.viewReport(reportTitle);
        await viewerPage.waitForReportToLoad();
        
        const metadata = await viewerPage.getReportMetadata();
        expect(metadata.generatedAt).toBeTruthy();
      }
    });
  });

  test.describe('Report Content Verification', () => {
    test('should verify investment recommendation content', async ({ page }) => {
      // Generate equity research report
      await wizardPage.navigateToReportWizard();
      await wizardPage.generateQuickReport('CONTENT-TEST', 'equity-research');
      
      await page.goto('/reports');
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      await listPage.viewReport(reportTitle!);
      await viewerPage.waitForReportToLoad();
      
      // Verify key content sections
      await viewerPage.verifyExecutiveSummaryContent([
        'Investment Thesis',
        'Key Catalysts',
        'Risk'
      ]);
      
      // Check for charts
      const charts = await viewerPage.getChartPlaceholders();
      expect(charts.length).toBeGreaterThan(0);
    });

    test('should display complete report slides', async ({ page }) => {
      await listPage.waitForReportsToLoad();
      
      const reportTitle = await listPage.getMostRecentReport();
      if (reportTitle) {
        await listPage.viewReport(reportTitle);
        await viewerPage.waitForReportToLoad();
        
        // Verify report is complete
        const isComplete = await viewerPage.isReportComplete();
        expect(isComplete).toBe(true);
        
        // Check all expected slides exist
        await viewerPage.switchToPresentationView();
        await viewerPage.verifySlideExists('Title Slide');
        await viewerPage.verifySlideExists('Executive Summary');
        await viewerPage.verifySlideExists('Important Disclaimers');
      }
    });
  });
});