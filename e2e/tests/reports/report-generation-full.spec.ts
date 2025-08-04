// e2e/tests/reports/report-generation-full.spec.ts
// Comprehensive E2E tests for report generation
// Context: Tests complete report generation workflow with all edge cases

import { test, expect } from '@playwright/test';
import { ReportWizardPage } from '../../pages/reports/ReportWizardPage';
import { ReportsListPage } from '../../pages/reports/ReportsListPage';
import { ReportViewerPage } from '../../pages/reports/ReportViewerPage';

test.describe('Report Generation - Full Workflow', () => {
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

  test('should generate equity research report successfully', async ({ page }) => {
    // Navigate to wizard
    await wizardPage.navigateToReportWizard();
    
    // Step 1: Select template
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    
    // Step 2: Fill details
    await wizardPage.fillReportDetails(
      'Apple Inc. Q4 2024 Equity Analysis',
      'AAPL',
      'Test Analyst'
    );
    await wizardPage.validateTickerInput();
    await wizardPage.proceedToDataSources();
    
    // Step 3: Select data sources
    await wizardPage.selectDataSources([
      'market-data',
      'financial-statements',
      'news',
      'ai-analysis'
    ]);
    await wizardPage.proceedToConfiguration();
    
    // Step 4: Configure
    await wizardPage.selectOutputFormat('pdf');
    await wizardPage.configureOptions({
      includeCharts: true,
      includeAISummary: true,
      aiTone: 'professional'
    });
    
    // Generate report
    await wizardPage.generateReport();
    await wizardPage.waitForGeneration();
    
    // Verify success
    await wizardPage.verifySuccessState();
    const summary = await wizardPage.getReportSummary();
    expect(summary.totalSlides).toBeGreaterThan(0);
    expect(summary.ticker).toBe('AAPL');
    expect(summary.template).toBe('equity-research');
    
    // Verify slides
    const slides = await wizardPage.getSlidesList();
    expect(slides).toContain('Title Slide');
    expect(slides).toContain('Executive Summary');
    expect(slides).toContain('Company Overview');
    expect(slides).toContain('Valuation Analysis');
    expect(slides).toContain('Investment Recommendation');
    expect(slides).toContain('Important Disclaimers');
    
    // View the report
    await wizardPage.viewGeneratedReport();
    
    // Verify report viewer
    await viewerPage.waitForReportToLoad();
    await viewerPage.verifyReportLoaded();
    
    const reportTitle = await viewerPage.getReportTitle();
    expect(reportTitle).toContain('Apple Inc. Q4 2024 Equity Analysis');
    
    const metadata = await viewerPage.getReportMetadata();
    expect(metadata.ticker).toBe('AAPL');
    expect(metadata.totalSlides).toBe(6);
  });

  test('should handle technical analysis report with custom settings', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Quick generation
    await wizardPage.selectTemplate('technical-analysis');
    await wizardPage.proceedToDetails();
    
    await wizardPage.fillReportDetails(
      'NVIDIA Technical Analysis Report',
      'NVDA'
    );
    await wizardPage.proceedToDataSources();
    
    // Select only market data and pattern detection
    await wizardPage.selectDataSources(['market-data', 'pattern-detection']);
    await wizardPage.proceedToConfiguration();
    
    // Configure for PPTX output without AI summary
    await wizardPage.selectOutputFormat('pptx');
    await wizardPage.configureOptions({
      includeCharts: true,
      includeAISummary: false
    });
    
    await wizardPage.generateReport();
    await wizardPage.waitForGeneration();
    
    // Verify format
    const summary = await wizardPage.getReportSummary();
    expect(summary.template).toBe('technical-analysis');
    
    // Check report appears in list
    await page.goto('/reports');
    await listPage.waitForReportsToLoad();
    
    const reportTitle = await listPage.getMostRecentReport();
    expect(reportTitle).toContain('NVDA');
    
    const details = await listPage.getReportDetails(reportTitle!);
    expect(details?.format).toBe('PPTX');
  });

  test('should validate form inputs correctly', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Try to proceed without selecting template
    expect(await wizardPage.isNextButtonEnabled()).toBe(false);
    
    await wizardPage.selectTemplate('equity-research');
    expect(await wizardPage.isNextButtonEnabled()).toBe(true);
    
    await wizardPage.proceedToDetails();
    
    // Test ticker validation
    await wizardPage.verifyTickerValidation('123', false); // Invalid
    await wizardPage.verifyTickerValidation('AAPL', true); // Valid
    await wizardPage.verifyTickerValidation('A', true); // Valid single letter
    
    // Test title character limit
    await wizardPage.verifyTitleCharacterLimit();
    
    // Can't proceed without required fields
    await wizardPage.titleInput.clear();
    expect(await wizardPage.isNextButtonEnabled()).toBe(false);
    
    await wizardPage.fillReportDetails('Test Report', 'AAPL');
    expect(await wizardPage.isNextButtonEnabled()).toBe(true);
  });

  test('should handle generation errors gracefully', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Mock API error
    await page.route('**/api/reports/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { message: 'TwelveData API rate limit exceeded' }
        })
      });
    });
    
    // Try to generate report
    await wizardPage.generateQuickReport('AAPL');
    
    // Verify error handling
    await expect(wizardPage.errorMessage).toBeVisible();
    const errorText = await wizardPage.getErrorMessage();
    expect(errorText).toContain('Failed to generate report');
    
    // Retry should be available
    await expect(wizardPage.retryButton).toBeVisible();
  });

  test('should allow navigation between steps', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Go through steps
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    expect(await wizardPage.getCurrentStep()).toBe(2);
    
    // Go back
    await wizardPage.goBack();
    expect(await wizardPage.getCurrentStep()).toBe(1);
    
    // Forward again
    await wizardPage.proceedToDetails();
    await wizardPage.fillReportDetails('Test', 'AAPL');
    await wizardPage.proceedToDataSources();
    expect(await wizardPage.getCurrentStep()).toBe(3);
    
    // Go back twice
    await wizardPage.goBack();
    await wizardPage.goBack();
    expect(await wizardPage.getCurrentStep()).toBe(1);
  });

  test('should maintain form state when navigating between steps', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Fill first steps
    await wizardPage.selectTemplate('risk-assessment');
    await wizardPage.proceedToDetails();
    
    const title = 'Risk Assessment for Tesla';
    const ticker = 'TSLA';
    const author = 'Risk Analyst';
    
    await wizardPage.fillReportDetails(title, ticker, author);
    await wizardPage.proceedToDataSources();
    
    // Go back and verify values are maintained
    await wizardPage.goBack();
    expect(await wizardPage.titleInput.inputValue()).toBe(title);
    expect(await wizardPage.tickerInput.inputValue()).toBe(ticker);
    expect(await wizardPage.authorInput.inputValue()).toBe(author);
    
    // Go back to template and verify selection
    await wizardPage.goBack();
    await expect(wizardPage.riskAssessmentCard).toHaveAttribute('data-selected', 'true');
  });

  test('should handle quick report generation', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Use quick generation helper
    await wizardPage.generateQuickReport('MSFT', 'quick-take');
    
    // Verify success
    await wizardPage.verifySuccessState();
    const summary = await wizardPage.getReportSummary();
    expect(summary.ticker).toBe('MSFT');
    expect(summary.template).toBe('quick-take');
    expect(summary.totalSlides).toBeGreaterThan(0);
  });

  test('should create new report after successful generation', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Generate first report
    await wizardPage.generateQuickReport('GOOGL');
    await wizardPage.verifySuccessState();
    
    // Create new report
    await wizardPage.createNewReport();
    
    // Should be back at template selection
    expect(await wizardPage.getCurrentStep()).toBe(1);
    await expect(wizardPage.templateStep).toBeVisible();
    
    // Form should be reset
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    expect(await wizardPage.titleInput.inputValue()).toBe('');
    expect(await wizardPage.tickerInput.inputValue()).toBe('');
  });

  test('should use PDF as default format', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Navigate to configuration step
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    await wizardPage.fillReportDetails('Test', 'AAPL');
    await wizardPage.proceedToDataSources();
    await wizardPage.proceedToConfiguration();
    
    // Verify PDF is selected by default
    await expect(wizardPage.pdfFormatRadio).toBeChecked();
    await expect(wizardPage.pptxFormatRadio).not.toBeChecked();
  });

  test('should handle concurrent report generation attempts', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Start generation
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    await wizardPage.fillReportDetails('Test 1', 'AAPL');
    await wizardPage.proceedToDataSources();
    await wizardPage.proceedToConfiguration();
    await wizardPage.generateReport();
    
    // Loading should be visible
    await expect(wizardPage.loadingSpinner).toBeVisible();
    
    // Generate button should be disabled during generation
    await expect(wizardPage.generateButton).toBeDisabled();
    
    // Wait for completion
    await wizardPage.waitForGeneration();
    await wizardPage.verifySuccessState();
  });

  test('should persist author name across sessions', async ({ page, context }) => {
    await wizardPage.navigateToReportWizard();
    
    // Set author name
    const authorName = 'Persistent Analyst';
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    await wizardPage.fillReportDetails('Test', 'AAPL', authorName);
    
    // Generate report
    await wizardPage.proceedToDataSources();
    await wizardPage.proceedToConfiguration();
    await wizardPage.generateReport();
    await wizardPage.waitForGeneration();
    
    // Reload page
    await page.reload();
    await wizardPage.navigateToReportWizard();
    
    // Check if author is persisted
    await wizardPage.selectTemplate('equity-research');
    await wizardPage.proceedToDetails();
    
    // Author field should have the previous value
    expect(await wizardPage.authorInput.inputValue()).toBe(authorName);
  });

  test('should show progress during generation', async ({ page }) => {
    await wizardPage.navigateToReportWizard();
    
    // Slow down API response to see progress
    await page.route('**/api/reports/generate', async route => {
      await page.waitForTimeout(2000);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          reportId: 'test-123',
          data: {
            slides: Array(6).fill(null).map((_, i) => ({
              slideNumber: i + 1,
              title: `Slide ${i + 1}`,
              content: []
            }))
          }
        })
      });
    });
    
    await wizardPage.generateQuickReport('AAPL');
    
    // Check progress indicators
    const progress = await wizardPage.getGenerationProgress();
    expect(progress).toMatch(/Fetching data|Processing|Generating|Assembling/);
  });
});