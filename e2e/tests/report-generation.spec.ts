// e2e/tests/report-generation.spec.ts
// E2E tests for report generation workflow
// Context: Tests complete user journey from report creation to viewing

import { test, expect } from '@playwright/test';
import { ReportWizardPage } from '../pages/ReportWizardPage';
import { ReportsListPage } from '../pages/ReportsListPage';
import { ReportViewerPage } from '../pages/ReportViewerPage';

test.describe('Report Generation E2E Tests', () => {
  let wizardPage: ReportWizardPage;
  let listPage: ReportsListPage;
  let viewerPage: ReportViewerPage;

  test.beforeEach(async ({ page }) => {
    wizardPage = new ReportWizardPage(page);
    listPage = new ReportsListPage(page);
    viewerPage = new ReportViewerPage(page);
  });

  test.describe('Basic Report Generation', () => {
    test('should generate NVDA technical analysis report', async () => {
      // Navigate to wizard
      await wizardPage.goto();
      
      // Step 1: Select ticker
      await wizardPage.selectTicker('NVDA');
      await wizardPage.verifyTickerInfo('NVIDIA Corporation');
      
      // Step 2: Select report type
      await wizardPage.selectReportType('technical_analysis');
      
      // Step 3: Configure options
      await wizardPage.setTimeframe('1M');
      await wizardPage.enableCharts(true);
      await wizardPage.selectChartTypes(['candlestick', 'volume']);
      await wizardPage.setOutputFormat('pdf');
      
      // Step 4: Additional settings
      await wizardPage.setTitle('NVIDIA Technical Analysis - January 2024');
      await wizardPage.setAuthor('QA Tester');
      await wizardPage.setConfidentiality('internal');
      
      // Generate report
      await wizardPage.clickGenerate();
      
      // Monitor progress
      await wizardPage.waitForGeneration();
      
      // Verify completion
      const reportPath = await wizardPage.getGeneratedReportPath();
      expect(reportPath).toContain('.pdf');
      
      const reportId = await wizardPage.getReportId();
      expect(reportId).toMatch(/^report_/);
      
      // View the report
      await wizardPage.clickViewReport();
      await viewerPage.waitForReportLoad();
      
      // Verify report content
      const title = await viewerPage.getReportTitle();
      expect(title).toContain('NVIDIA Technical Analysis');
      
      const ticker = await viewerPage.getReportTicker();
      expect(ticker).toBe('NVDA');
      
      // Verify charts are present
      expect(await viewerPage.hasChart('candlestick')).toBe(true);
      expect(await viewerPage.hasChart('volume')).toBe(true);
    });

    test('should generate earnings preview report', async () => {
      await wizardPage.goto();
      
      // Quick fill for earnings report
      await wizardPage.selectTicker('AAPL');
      await wizardPage.selectReportType('earnings_preview');
      await wizardPage.enableCharts(true);
      await wizardPage.setOutputFormat('pdf');
      await wizardPage.includeSections(['earnings-history', 'estimates', 'guidance']);
      
      // Generate
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration();
      
      // Verify report generated
      const reportId = await wizardPage.getReportId();
      expect(reportId).toBeTruthy();
    });

    test('should generate PowerPoint presentation', async () => {
      await wizardPage.goto();
      
      // Configure for PPTX output
      await wizardPage.selectTicker('MSFT');
      await wizardPage.selectReportType('equity_research');
      await wizardPage.setOutputFormat('pptx');
      await wizardPage.enableCharts(true);
      
      // Generate
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration();
      
      // Download the presentation
      const download = await wizardPage.clickDownloadReport();
      expect(download.suggestedFilename()).toContain('.pptx');
    });
  });

  test.describe('Progress Tracking', () => {
    test('should show detailed progress during generation', async () => {
      await wizardPage.goto();
      await wizardPage.fillQuickReport('NVDA');
      await wizardPage.clickGenerate();
      
      // Check progress updates
      let lastProgress = 0;
      for (let i = 0; i < 10; i++) {
        const progress = await wizardPage.getProgressPercentage();
        expect(progress).toBeGreaterThanOrEqual(lastProgress);
        lastProgress = progress;
        
        const currentStep = await wizardPage.getCurrentStep();
        expect(currentStep).toBeTruthy();
        
        if (progress >= 100) break;
        await test.step(`Progress: ${progress}% - ${currentStep}`, async () => {
          // Log progress for debugging
        });
        
        await wizardPage.page.waitForTimeout(1000);
      }
      
      expect(lastProgress).toBe(100);
    });

    test('should show sub-steps during generation', async () => {
      await wizardPage.goto();
      await wizardPage.fillQuickReport('NVDA');
      await wizardPage.clickGenerate();
      
      // Wait for sub-steps to appear
      await wizardPage.page.waitForTimeout(2000);
      
      const subSteps = await wizardPage.getSubSteps();
      expect(subSteps.length).toBeGreaterThan(0);
      
      // Verify sub-steps have meaningful names
      for (const step of subSteps) {
        expect(step).toBeTruthy();
        expect(step.length).toBeGreaterThan(5);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid ticker gracefully', async () => {
      await wizardPage.goto();
      
      // Enter invalid ticker
      await wizardPage.selectTicker('INVALID123');
      
      // Should show validation error
      const hasError = await wizardPage.hasError();
      expect(hasError).toBe(true);
      
      const errorMessage = await wizardPage.getErrorMessage();
      expect(errorMessage).toContain('Invalid ticker');
    });

    test('should allow retry on generation failure', async ({ page }) => {
      await wizardPage.goto();
      
      // Mock API failure
      await page.route('**/api/reports/generate', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' })
        });
      });
      
      await wizardPage.fillQuickReport('NVDA');
      await wizardPage.clickGenerate();
      
      // Wait for error
      await wizardPage.page.waitForTimeout(2000);
      
      const hasError = await wizardPage.hasError();
      expect(hasError).toBe(true);
      
      // Clear mock and retry
      await page.unroute('**/api/reports/generate');
      await wizardPage.clickRetry();
      
      // Should succeed this time
      await wizardPage.waitForGeneration();
      const reportId = await wizardPage.getReportId();
      expect(reportId).toBeTruthy();
    });
  });

  test.describe('Report Management', () => {
    test('should list generated reports', async () => {
      // First generate a report
      await wizardPage.goto();
      await wizardPage.fillQuickReport('NVDA');
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration();
      
      const reportId = await wizardPage.getReportId();
      
      // Navigate to reports list
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      // Find the report
      const reports = await listPage.getReports();
      const nvdaReport = reports.find(r => r.ticker === 'NVDA');
      
      expect(nvdaReport).toBeTruthy();
      expect(nvdaReport?.id).toBe(reportId);
      expect(nvdaReport?.status).toBe('completed');
    });

    test('should filter reports by ticker', async () => {
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      // Filter by NVDA
      await listPage.filterByTicker('NVDA');
      
      const reports = await listPage.getReports();
      for (const report of reports) {
        expect(report.ticker).toBe('NVDA');
      }
    });

    test('should download report from list', async () => {
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      const reports = await listPage.getReports();
      if (reports.length > 0) {
        const download = await listPage.downloadReport(reports[0].id);
        expect(download.suggestedFilename()).toMatch(/\.(pdf|pptx)$/);
      }
    });

    test('should delete report', async () => {
      // Generate a test report first
      await wizardPage.goto();
      await wizardPage.fillQuickReport('TEST');
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration();
      
      const reportId = await wizardPage.getReportId();
      
      // Go to list and delete
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      await listPage.deleteReport(reportId);
      
      // Verify deletion
      const report = await listPage.getReportById(reportId);
      expect(report).toBeNull();
    });
  });

  test.describe('Report Viewing', () => {
    test('should navigate through report pages', async () => {
      // Generate a report first
      await wizardPage.goto();
      await wizardPage.fillQuickReport('NVDA');
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration();
      
      const reportId = await wizardPage.getReportId();
      
      // View the report
      await viewerPage.goto(reportId);
      await viewerPage.waitForReportLoad();
      
      // Check total pages
      const totalPages = await viewerPage.getTotalPages();
      expect(totalPages).toBeGreaterThan(1);
      
      // Navigate to next page
      await viewerPage.nextPage();
      const currentPage = await viewerPage.getCurrentPage();
      expect(currentPage).toBe(2);
      
      // Go to last page
      await viewerPage.goToLastPage();
      const lastPage = await viewerPage.getCurrentPage();
      expect(lastPage).toBe(totalPages);
    });

    test('should zoom and adjust view', async () => {
      // Assuming we have a report to view
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      const reports = await listPage.getReports();
      if (reports.length > 0) {
        await viewerPage.goto(reports[0].id);
        await viewerPage.waitForReportLoad();
        
        // Test zoom controls
        await viewerPage.zoomIn();
        await viewerPage.zoomIn();
        await viewerPage.zoomOut();
        await viewerPage.resetZoom();
        
        // Test fit options
        await viewerPage.fitToWidth();
        await viewerPage.fitToPage();
      }
    });

    test('should search within report', async () => {
      // View an existing report
      await listPage.goto();
      await listPage.waitForReportsToLoad();
      
      const reports = await listPage.getReports();
      if (reports.length > 0) {
        await viewerPage.goto(reports[0].id);
        await viewerPage.waitForReportLoad();
        
        // Search for common term
        await viewerPage.searchInReport('revenue');
        
        const resultCount = await viewerPage.getSearchResultCount();
        expect(resultCount).toBeGreaterThan(0);
        
        // Navigate through results
        await viewerPage.nextSearchResult();
        await viewerPage.previousSearchResult();
        
        // Clear search
        await viewerPage.clearSearch();
      }
    });
  });

  test.describe('Performance', () => {
    test('should generate report within reasonable time', async () => {
      await wizardPage.goto();
      await wizardPage.fillQuickReport('NVDA');
      
      const startTime = Date.now();
      await wizardPage.clickGenerate();
      await wizardPage.waitForGeneration(30000); // 30 second timeout
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      
      // Log performance metric
      console.log(`Report generation took ${duration}ms`);
    });

    test('should handle concurrent report generation', async ({ browser }) => {
      // Create multiple browser contexts
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ]);
      
      const pages = await Promise.all(
        contexts.map(ctx => ctx.newPage())
      );
      
      // Generate reports concurrently
      const results = await Promise.all(
        pages.map(async (page, index) => {
          const wizard = new ReportWizardPage(page);
          await wizard.goto();
          await wizard.fillQuickReport(['NVDA', 'AAPL', 'MSFT'][index]);
          await wizard.clickGenerate();
          await wizard.waitForGeneration();
          return await wizard.getReportId();
        })
      );
      
      // All should succeed
      for (const reportId of results) {
        expect(reportId).toMatch(/^report_/);
      }
      
      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()));
    });
  });
});