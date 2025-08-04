// e2e/pages/reports/ReportWizardPage.ts
// Enhanced Page Object Model for Report Generation Wizard
// Context: Encapsulates all report wizard interactions based on actual UI

import { Page, expect, Locator } from '@playwright/test';

export class ReportWizardPage {
  readonly page: Page;
  
  // Step indicators
  readonly templateStep: Locator;
  readonly detailsStep: Locator;
  readonly dataStep: Locator;
  readonly configStep: Locator;
  
  // Template selection (Step 1)
  readonly equityResearchCard: Locator;
  readonly technicalAnalysisCard: Locator;
  readonly riskAssessmentCard: Locator;
  readonly quickTakeCard: Locator;
  readonly earningsPreviewCard: Locator;
  readonly sectorAnalysisCard: Locator;
  
  // Details form (Step 2)
  readonly titleInput: Locator;
  readonly tickerInput: Locator;
  readonly authorInput: Locator;
  
  // Data sources (Step 3)
  readonly marketDataCheckbox: Locator;
  readonly financialStatementsCheckbox: Locator;
  readonly newsCheckbox: Locator;
  readonly patternDetectionCheckbox: Locator;
  readonly aiAnalysisCheckbox: Locator;
  
  // Configuration (Step 4)
  readonly pdfFormatRadio: Locator;
  readonly pptxFormatRadio: Locator;
  readonly includeChartsCheckbox: Locator;
  readonly includeAISummaryCheckbox: Locator;
  readonly aiToneSelect: Locator;
  
  // Navigation buttons
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly generateButton: Locator;
  readonly cancelButton: Locator;
  
  // Success state
  readonly successMessage: Locator;
  readonly viewReportButton: Locator;
  readonly createNewReportButton: Locator;
  readonly slidesList: Locator;
  
  // Loading and error states
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Step indicators
    this.templateStep = page.locator('text=Template').first();
    this.detailsStep = page.locator('text=Details').first();
    this.dataStep = page.locator('text=Data').first();
    this.configStep = page.locator('text=Configure').first();
    
    // Template cards
    this.equityResearchCard = page.locator('text=Equity Research').closest('div[role="button"]');
    this.technicalAnalysisCard = page.locator('text=Technical Analysis').closest('div[role="button"]');
    this.riskAssessmentCard = page.locator('text=Risk Assessment').closest('div[role="button"]');
    this.quickTakeCard = page.locator('text=Quick Take').closest('div[role="button"]');
    this.earningsPreviewCard = page.locator('text=Earnings Preview').closest('div[role="button"]');
    this.sectorAnalysisCard = page.locator('text=Sector Analysis').closest('div[role="button"]');
    
    // Details inputs
    this.titleInput = page.getByPlaceholder('e.g., Apple Inc. Q4 2024 Equity Analysis');
    this.tickerInput = page.getByPlaceholder('AAPL');
    this.authorInput = page.getByPlaceholder('e.g., John Smith');
    
    // Data source checkboxes
    this.marketDataCheckbox = page.getByRole('checkbox', { name: /Market Data/i });
    this.financialStatementsCheckbox = page.getByRole('checkbox', { name: /Financial Statements/i });
    this.newsCheckbox = page.getByRole('checkbox', { name: /News & Sentiment/i });
    this.patternDetectionCheckbox = page.getByRole('checkbox', { name: /Pattern Detection/i });
    this.aiAnalysisCheckbox = page.getByRole('checkbox', { name: /AI Analysis/i });
    
    // Configuration options
    this.pdfFormatRadio = page.getByLabel('PDF Document');
    this.pptxFormatRadio = page.getByLabel('PowerPoint Presentation');
    this.includeChartsCheckbox = page.getByRole('checkbox', { name: /Include Charts/i });
    this.includeAISummaryCheckbox = page.getByRole('checkbox', { name: /Include AI Summary/i });
    this.aiToneSelect = page.locator('select').filter({ hasText: /professional|executive|technical/i });
    
    // Navigation
    this.backButton = page.getByRole('button', { name: 'Back' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.generateButton = page.getByRole('button', { name: 'Generate Report' });
    this.cancelButton = page.getByRole('button', { name: 'Cancel' });
    
    // Success state
    this.successMessage = page.locator('text=Report Generated Successfully!');
    this.viewReportButton = page.getByRole('button', { name: /View in Reports Tab/i });
    this.createNewReportButton = page.getByRole('button', { name: 'Create New Report' });
    this.slidesList = page.locator('text=Report Contents:').locator('..').locator('ul');
    
    // Loading and errors
    this.loadingSpinner = page.locator('[data-testid="loader"]');
    this.errorMessage = page.locator('text=/Failed to generate report|Error generating report/');
    this.retryButton = page.getByRole('button', { name: 'Retry' });
  }

  // Navigation methods
  async goto() {
    await this.page.goto('/reports');
    await this.page.waitForLoadState('networkidle');
  }

  async navigateToReportWizard() {
    // If we're not on the wizard already
    if (!(await this.templateStep.isVisible())) {
      // Look for the wizard in the reports page
      const wizardSection = this.page.locator('text=Report Wizard').first();
      await expect(wizardSection).toBeVisible();
    }
  }

  // Step 1: Template Selection
  async selectTemplate(template: 'equity-research' | 'technical-analysis' | 'risk-assessment' | 'quick-take' | 'earnings-preview' | 'sector-analysis') {
    const templateMap = {
      'equity-research': this.equityResearchCard,
      'technical-analysis': this.technicalAnalysisCard,
      'risk-assessment': this.riskAssessmentCard,
      'quick-take': this.quickTakeCard,
      'earnings-preview': this.earningsPreviewCard,
      'sector-analysis': this.sectorAnalysisCard
    };
    
    await templateMap[template].click();
    await expect(templateMap[template]).toHaveAttribute('data-selected', 'true');
  }

  async proceedToDetails() {
    await this.nextButton.click();
    await expect(this.page.locator('text=Report Details')).toBeVisible();
  }

  // Step 2: Report Details
  async fillReportDetails(title: string, ticker: string, author?: string) {
    await this.titleInput.fill(title);
    await this.tickerInput.fill(ticker);
    
    if (author) {
      await this.authorInput.fill(author);
    }
  }

  async validateTickerInput() {
    // Check if ticker input has valid state
    await expect(this.tickerInput).toHaveAttribute('aria-invalid', 'false');
  }

  async proceedToDataSources() {
    await this.nextButton.click();
    await expect(this.page.locator('text=Select Data Sources')).toBeVisible();
  }

  // Step 3: Data Sources
  async selectDataSources(sources: string[]) {
    const sourceMap: Record<string, Locator> = {
      'market-data': this.marketDataCheckbox,
      'financial-statements': this.financialStatementsCheckbox,
      'news': this.newsCheckbox,
      'pattern-detection': this.patternDetectionCheckbox,
      'ai-analysis': this.aiAnalysisCheckbox
    };
    
    for (const source of sources) {
      if (sourceMap[source]) {
        await sourceMap[source].check();
      }
    }
  }

  async proceedToConfiguration() {
    await this.nextButton.click();
    await expect(this.page.locator('text=Report Configuration')).toBeVisible();
  }

  // Step 4: Configuration
  async selectOutputFormat(format: 'pdf' | 'pptx') {
    if (format === 'pdf') {
      await this.pdfFormatRadio.click();
    } else {
      await this.pptxFormatRadio.click();
    }
  }

  async configureOptions(options: {
    includeCharts?: boolean;
    includeAISummary?: boolean;
    aiTone?: 'professional' | 'executive' | 'technical';
  }) {
    if (options.includeCharts !== undefined) {
      if (options.includeCharts) {
        await this.includeChartsCheckbox.check();
      } else {
        await this.includeChartsCheckbox.uncheck();
      }
    }
    
    if (options.includeAISummary !== undefined) {
      if (options.includeAISummary) {
        await this.includeAISummaryCheckbox.check();
      } else {
        await this.includeAISummaryCheckbox.uncheck();
      }
    }
    
    if (options.aiTone) {
      await this.aiToneSelect.selectOption(options.aiTone);
    }
  }

  async generateReport() {
    await this.generateButton.click();
  }

  // Progress monitoring
  async waitForGeneration(timeout: number = 60000) {
    // Wait for loading state
    await expect(this.loadingSpinner).toBeVisible();
    await expect(this.page.locator('text=Generating your report...')).toBeVisible();
    
    // Wait for completion
    await expect(this.successMessage).toBeVisible({ timeout });
  }

  async getGenerationProgress(): Promise<string> {
    const progressElement = this.page.locator('text=/Fetching data|Processing|Generating|Assembling/');
    return await progressElement.textContent() || '';
  }

  // Success state verification
  async verifySuccessState() {
    await expect(this.successMessage).toBeVisible();
    await expect(this.viewReportButton).toBeVisible();
    await expect(this.createNewReportButton).toBeVisible();
  }

  async getReportSummary(): Promise<{
    totalSlides: number;
    generatedTime: string;
    template: string;
    ticker: string;
  }> {
    const summaryText = await this.page.locator('text=Report Summary').locator('..').textContent() || '';
    
    return {
      totalSlides: parseInt(summaryText.match(/Total slides: (\d+)/)?.[1] || '0'),
      generatedTime: summaryText.match(/Generated: (.+?)(?=Template|$)/)?.[1]?.trim() || '',
      template: summaryText.match(/Template: (.+?)(?=Ticker|$)/)?.[1]?.trim() || '',
      ticker: summaryText.match(/Ticker: (.+?)$/)?.[1]?.trim() || ''
    };
  }

  async getSlidesList(): Promise<string[]> {
    const slides = await this.slidesList.locator('li').allTextContents();
    return slides;
  }

  async viewGeneratedReport() {
    await this.viewReportButton.click();
  }

  async createNewReport() {
    await this.createNewReportButton.click();
    await expect(this.templateStep).toBeVisible();
  }

  // Error handling
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    return await this.errorMessage.textContent() || '';
  }

  async retryGeneration() {
    if (await this.retryButton.isVisible()) {
      await this.retryButton.click();
    }
  }

  // Navigation helpers
  async goBack() {
    await this.backButton.click();
  }

  async cancel() {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    }
  }

  // Validation helpers
  async isNextButtonEnabled(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  async isGenerateButtonEnabled(): Promise<boolean> {
    return await this.generateButton.isEnabled();
  }

  async getCurrentStep(): Promise<number> {
    if (await this.page.locator('text=Choose a Template').isVisible()) return 1;
    if (await this.page.locator('text=Report Details').isVisible()) return 2;
    if (await this.page.locator('text=Select Data Sources').isVisible()) return 3;
    if (await this.page.locator('text=Report Configuration').isVisible()) return 4;
    return 0;
  }

  // Quick report generation helper
  async generateQuickReport(ticker: string, template: string = 'equity-research') {
    await this.selectTemplate(template as any);
    await this.proceedToDetails();
    
    await this.fillReportDetails(
      `${ticker} ${template.replace('-', ' ')} Report`,
      ticker
    );
    await this.proceedToDataSources();
    
    // Use default data sources
    await this.proceedToConfiguration();
    
    // Use PDF format by default
    await this.selectOutputFormat('pdf');
    await this.generateReport();
    
    await this.waitForGeneration();
  }

  // Form validation helpers
  async verifyTickerValidation(ticker: string, shouldBeValid: boolean) {
    await this.tickerInput.fill(ticker);
    
    if (shouldBeValid) {
      await expect(this.tickerInput).not.toHaveAttribute('aria-invalid', 'true');
    } else {
      await expect(this.tickerInput).toHaveAttribute('aria-invalid', 'true');
    }
  }

  async verifyTitleCharacterLimit() {
    const longTitle = 'A'.repeat(101);
    await this.titleInput.fill(longTitle);
    
    const actualValue = await this.titleInput.inputValue();
    expect(actualValue.length).toBe(100);
  }
}