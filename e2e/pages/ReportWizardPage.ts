// e2e/pages/ReportWizardPage.ts
// Page Object Model for Report Generation Wizard
// Context: Encapsulates all report creation UI interactions

import { Page, expect } from '@playwright/test';

export class ReportWizardPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/reports/new');
    await this.page.waitForLoadState('networkidle');
  }

  // Step 1: Ticker Selection
  async selectTicker(ticker: string) {
    await this.page.fill('[data-testid="ticker-input"]', ticker);
    
    // Wait for ticker validation
    await this.page.waitForSelector('[data-testid="ticker-valid"]', { timeout: 5000 });
  }

  async verifyTickerInfo(expectedCompany: string) {
    const companyName = await this.page.textContent('[data-testid="company-name"]');
    expect(companyName).toContain(expectedCompany);
  }

  // Step 2: Report Type Selection
  async selectReportType(type: 'technical_analysis' | 'earnings_preview' | 'equity_research') {
    await this.page.click(`[data-testid="report-type-${type}"]`);
    
    // Verify selection
    const selected = await this.page.getAttribute(`[data-testid="report-type-${type}"]`, 'data-selected');
    expect(selected).toBe('true');
  }

  // Step 3: Configuration Options
  async setTimeframe(timeframe: '1D' | '1W' | '1M' | '3M' | '1Y') {
    await this.page.selectOption('[data-testid="timeframe-select"]', timeframe);
  }

  async enableCharts(enable: boolean = true) {
    const checkbox = this.page.locator('[data-testid="include-charts-checkbox"]');
    const isChecked = await checkbox.isChecked();
    
    if (enable !== isChecked) {
      await checkbox.click();
    }
  }

  async selectChartTypes(types: string[]) {
    for (const type of types) {
      await this.page.check(`[data-testid="chart-type-${type}"]`);
    }
  }

  async setOutputFormat(format: 'pdf' | 'pptx') {
    await this.page.click(`[data-testid="output-format-${format}"]`);
  }

  // Step 4: Additional Settings
  async setTitle(title: string) {
    await this.page.fill('[data-testid="report-title"]', title);
  }

  async setAuthor(author: string) {
    await this.page.fill('[data-testid="report-author"]', author);
  }

  async setConfidentiality(level: 'public' | 'internal' | 'confidential') {
    await this.page.selectOption('[data-testid="confidentiality-level"]', level);
  }

  async includeSections(sections: string[]) {
    for (const section of sections) {
      await this.page.check(`[data-testid="section-${section}"]`);
    }
  }

  // Generation Actions
  async clickGenerate() {
    await this.page.click('[data-testid="generate-button"]');
  }

  async waitForGeneration(timeout: number = 60000) {
    // Wait for progress bar to appear
    await this.page.waitForSelector('[data-testid="generation-progress"]', { timeout: 5000 });
    
    // Wait for completion
    await this.page.waitForSelector('[data-testid="generation-complete"]', { timeout });
  }

  // Progress Monitoring
  async getProgressPercentage(): Promise<number> {
    const progressText = await this.page.textContent('[data-testid="progress-percentage"]');
    return parseInt(progressText?.replace('%', '') || '0');
  }

  async getCurrentStep(): Promise<string> {
    return await this.page.textContent('[data-testid="current-step"]') || '';
  }

  async getSubSteps(): Promise<string[]> {
    const elements = await this.page.$$('[data-testid^="substep-"]');
    const steps = [];
    
    for (const element of elements) {
      const text = await element.textContent();
      if (text) steps.push(text);
    }
    
    return steps;
  }

  // Result Verification
  async getGeneratedReportPath(): Promise<string> {
    return await this.page.textContent('[data-testid="report-path"]') || '';
  }

  async getReportId(): Promise<string> {
    return await this.page.getAttribute('[data-testid="report-link"]', 'data-report-id') || '';
  }

  async clickViewReport() {
    await this.page.click('[data-testid="view-report-button"]');
  }

  async clickDownloadReport() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('[data-testid="download-report-button"]')
    ]);
    
    return download;
  }

  // Error Handling
  async hasError(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="generation-error"]');
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.textContent('[data-testid="error-message"]') || '';
  }

  async clickRetry() {
    await this.page.click('[data-testid="retry-button"]');
  }

  // Navigation
  async clickBack() {
    await this.page.click('[data-testid="back-button"]');
  }

  async clickCancel() {
    await this.page.click('[data-testid="cancel-button"]');
  }

  // Validation
  async verifyStepActive(step: number) {
    const activeStep = await this.page.getAttribute(`[data-testid="wizard-step-${step}"]`, 'data-active');
    expect(activeStep).toBe('true');
  }

  async verifyFormValidation() {
    const isValid = await this.page.getAttribute('[data-testid="wizard-form"]', 'data-valid');
    return isValid === 'true';
  }

  // Helper Methods
  async fillQuickReport(ticker: string, type: string = 'technical_analysis') {
    await this.selectTicker(ticker);
    await this.selectReportType(type as any);
    await this.enableCharts(true);
    await this.setOutputFormat('pdf');
  }

  async waitForApiData() {
    // Wait for API data to load
    await this.page.waitForSelector('[data-testid="api-data-loaded"]', { timeout: 10000 });
  }

  async getEstimatedTime(): Promise<string> {
    return await this.page.textContent('[data-testid="estimated-time"]') || '';
  }

  async isGenerating(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="generation-in-progress"]');
  }
}