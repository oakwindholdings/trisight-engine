// e2e/pages/reports/ReportViewerPage.ts
// Page Object Model for Report Viewer/Preview
// Context: Encapsulates all report viewing and interaction functionality

import { Page, expect, Locator, Download } from '@playwright/test';

export class ReportViewerPage {
  readonly page: Page;
  
  // View toggle
  readonly documentViewButton: Locator;
  readonly presentationViewButton: Locator;
  
  // Action buttons
  readonly refreshButton: Locator;
  readonly fullScreenButton: Locator;
  readonly downloadButton: Locator;
  
  // Report content
  readonly reportTitle: Locator;
  readonly reportMetadata: Locator;
  readonly reportContent: Locator;
  readonly slideCards: Locator;
  
  // Empty states
  readonly emptyPreview: Locator;
  readonly emptyPresentation: Locator;
  
  // Loading and error states
  readonly loadingOverlay: Locator;
  readonly errorMessage: Locator;
  readonly downloadError: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // View toggle buttons
    this.documentViewButton = page.getByRole('button', { name: 'Document' });
    this.presentationViewButton = page.getByRole('button', { name: 'Presentation' });
    
    // Action buttons
    this.refreshButton = page.getByTitle('Refresh preview');
    this.fullScreenButton = page.getByTitle('Full screen');
    this.downloadButton = page.getByTitle('Download preview');
    
    // Report content
    this.reportTitle = page.locator('h1').first();
    this.reportMetadata = page.locator('[style*="background: #f8f9fa"]').first();
    this.reportContent = page.locator('[class*="PreviewDocument"]');
    this.slideCards = page.locator('[style*="border: 1px solid #e5e7eb"][style*="border-radius: 0.5rem"]');
    
    // Empty states
    this.emptyPreview = page.locator('text=Create a report to see the preview');
    this.emptyPresentation = page.locator('text=Generate a report to see the presentation slides');
    
    // Loading and errors
    this.loadingOverlay = page.locator('[class*="LoadingOverlay"]');
    this.errorMessage = page.locator('text=Error loading report preview');
    this.downloadError = page.locator('text=/Failed to download report|Error downloading/');
  }

  // Navigation
  async goto(reportId?: string) {
    if (reportId) {
      await this.page.goto(`/reports/view/${reportId}`);
    } else {
      await this.page.goto('/reports');
    }
    await this.page.waitForLoadState('networkidle');
  }

  async waitForReportToLoad() {
    // Wait for either content or empty state
    await this.page.waitForSelector('h1, text=Create a report to see the preview', { timeout: 10000 });
  }

  // View switching
  async switchToDocumentView() {
    await this.documentViewButton.click();
    await expect(this.documentViewButton).toHaveAttribute('data-active', 'true');
  }

  async switchToPresentationView() {
    await this.presentationViewButton.click();
    await expect(this.presentationViewButton).toHaveAttribute('data-active', 'true');
  }

  async getCurrentView(): Promise<'document' | 'presentation'> {
    const documentActive = await this.documentViewButton.getAttribute('data-active');
    return documentActive === 'true' ? 'document' : 'presentation';
  }

  // Report metadata
  async getReportTitle(): Promise<string> {
    return await this.reportTitle.textContent() || '';
  }

  async getReportMetadata(): Promise<{
    ticker?: string;
    template?: string;
    generatedAt?: string;
    totalSlides?: number;
  }> {
    const metadataText = await this.reportMetadata.textContent() || '';
    
    return {
      ticker: metadataText.match(/Ticker:\s*([A-Z]+)/)?.[1],
      template: metadataText.match(/Template:\s*([\w-]+)/)?.[1],
      generatedAt: metadataText.match(/Generated:\s*(.+?)(?=Total|$)/)?.[1]?.trim(),
      totalSlides: parseInt(metadataText.match(/Total Slides:\s*(\d+)/)?.[1] || '0')
    };
  }

  // Document view operations
  async getDocumentContent(): Promise<string> {
    await this.switchToDocumentView();
    return await this.reportContent.textContent() || '';
  }

  async getSectionTitles(): Promise<string[]> {
    await this.switchToDocumentView();
    const headings = await this.reportContent.locator('h2').allTextContents();
    return headings;
  }

  async getSectionContent(sectionTitle: string): Promise<string> {
    await this.switchToDocumentView();
    const section = this.reportContent.locator(`h2:text("${sectionTitle}")`);
    const nextSection = section.locator('~ h2').first();
    
    // Get content between this section and the next
    const content = await section.evaluateHandle((el, nextTitle) => {
      let content = '';
      let current = el.nextElementSibling;
      
      while (current && current.tagName !== 'H2') {
        content += current.textContent || '';
        current = current.nextElementSibling;
      }
      
      return content;
    }, await nextSection.textContent());
    
    return await content.jsonValue();
  }

  async getTableData(tableIndex: number = 0): Promise<{
    headers: string[];
    rows: string[][];
  }> {
    await this.switchToDocumentView();
    const table = this.reportContent.locator('table').nth(tableIndex);
    
    const headers = await table.locator('th').allTextContents();
    const rows: string[][] = [];
    
    const rowElements = await table.locator('tbody tr').all();
    for (const row of rowElements) {
      const cells = await row.locator('td').allTextContents();
      rows.push(cells);
    }
    
    return { headers, rows };
  }

  async getBulletPoints(sectionTitle?: string): Promise<string[]> {
    await this.switchToDocumentView();
    
    let scope = this.reportContent;
    if (sectionTitle) {
      scope = this.reportContent.locator(`h2:text("${sectionTitle}") ~ ul`).first();
    }
    
    return await scope.locator('li').allTextContents();
  }

  // Presentation view operations
  async getSlideCount(): Promise<number> {
    await this.switchToPresentationView();
    
    if (await this.emptyPresentation.isVisible()) {
      return 0;
    }
    
    const slides = await this.slideCards.all();
    return slides.length;
  }

  async getSlideDetails(slideIndex: number): Promise<{
    number: number;
    title: string;
    layout: string;
  } | null> {
    await this.switchToPresentationView();
    
    const slide = this.slideCards.nth(slideIndex);
    if (!(await slide.isVisible())) return null;
    
    const slideText = await slide.textContent() || '';
    const match = slideText.match(/Slide (\d+):\s*(.+?)(\w+) layout/);
    
    if (!match) return null;
    
    return {
      number: parseInt(match[1]),
      title: match[2].trim(),
      layout: match[3]
    };
  }

  async getAllSlides(): Promise<Array<{
    number: number;
    title: string;
    layout: string;
  }>> {
    const slideCount = await this.getSlideCount();
    const slides = [];
    
    for (let i = 0; i < slideCount; i++) {
      const slide = await this.getSlideDetails(i);
      if (slide) slides.push(slide);
    }
    
    return slides;
  }

  // Actions
  async refreshPreview() {
    await this.refreshButton.click();
    
    // Wait for loading to complete
    if (await this.loadingOverlay.isVisible()) {
      await expect(this.loadingOverlay).not.toBeVisible({ timeout: 5000 });
    }
  }

  async enterFullScreen() {
    await this.fullScreenButton.click();
    
    // Note: Full screen behavior may vary in test environment
    // You might need to handle browser-specific full screen APIs
  }

  async downloadReport(): Promise<Download | null> {
    try {
      const [download] = await Promise.all([
        this.page.waitForEvent('download', { timeout: 10000 }),
        this.downloadButton.click()
      ]);
      
      return download;
    } catch (error) {
      // Check if we got an alert instead
      const alertText = await this.page.evaluate(() => {
        return (window as any).lastAlertText;
      });
      
      if (alertText) {
        console.log('Download alert:', alertText);
      }
      
      return null;
    }
  }

  // Download with alert handling
  async downloadReportWithAlertHandling(): Promise<{
    download?: Download;
    alert?: string;
  }> {
    let alertText: string | undefined;
    
    // Set up alert handler
    this.page.once('dialog', async dialog => {
      alertText = dialog.message();
      await dialog.accept();
    });
    
    try {
      const download = await this.downloadReport();
      return { download, alert: alertText };
    } catch (error) {
      return { alert: alertText || 'Download failed' };
    }
  }

  // Chart placeholders
  async getChartPlaceholders(): Promise<string[]> {
    await this.switchToDocumentView();
    const charts = await this.reportContent.locator('.chart-placeholder p').allTextContents();
    return charts;
  }

  // Error states
  async hasError(): Promise<boolean> {
    return await this.errorMessage.isVisible() || await this.downloadError.isVisible();
  }

  async getErrorMessage(): Promise<string> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent() || '';
    }
    if (await this.downloadError.isVisible()) {
      return await this.downloadError.textContent() || '';
    }
    return '';
  }

  // Loading states
  async isLoading(): Promise<boolean> {
    return await this.loadingOverlay.isVisible();
  }

  async waitForLoadingToComplete(timeout: number = 10000) {
    if (await this.isLoading()) {
      await expect(this.loadingOverlay).not.toBeVisible({ timeout });
    }
  }

  // Empty state verification
  async verifyEmptyState() {
    await expect(this.emptyPreview).toBeVisible();
  }

  async verifyReportLoaded() {
    await expect(this.reportTitle).toBeVisible();
    await expect(this.reportMetadata).toBeVisible();
  }

  // Content verification helpers
  async verifySlideExists(slideTitle: string) {
    const slides = await this.getAllSlides();
    const slideExists = slides.some(slide => slide.title === slideTitle);
    expect(slideExists).toBeTruthy();
  }

  async verifySectionExists(sectionTitle: string) {
    const sections = await this.getSectionTitles();
    expect(sections).toContain(sectionTitle);
  }

  async verifyContentContains(text: string) {
    const content = await this.getDocumentContent();
    expect(content).toContain(text);
  }

  async verifyMetricInTable(metric: string, value: string) {
    const tables = await this.reportContent.locator('table').all();
    
    for (const table of tables) {
      const tableText = await table.textContent();
      if (tableText?.includes(metric) && tableText.includes(value)) {
        return true;
      }
    }
    
    throw new Error(`Metric "${metric}" with value "${value}" not found in any table`);
  }

  // PDF-specific content verification
  async verifyExecutiveSummaryContent(expectedContent: string[]) {
    const content = await this.getSectionContent('Executive Summary');
    
    for (const expected of expectedContent) {
      expect(content).toContain(expected);
    }
  }

  async verifyInvestmentRecommendation(recommendation: string) {
    const content = await this.getSectionContent('Investment Recommendation');
    expect(content).toContain(recommendation);
  }

  // Helper to check if report is complete
  async isReportComplete(): Promise<boolean> {
    const metadata = await this.getReportMetadata();
    const slideCount = await this.getSlideCount();
    
    return (metadata.totalSlides || 0) > 0 && slideCount > 0;
  }

  // Print functionality (if available)
  async printReport() {
    await this.page.keyboard.press('Control+P');
    // Handle print dialog as needed
  }

  // Export functionality helpers
  async getAvailableExportFormats(): Promise<string[]> {
    // This would depend on UI implementation
    // For now, return based on what we know
    return ['PDF', 'Text'];
  }

  // Zoom functionality (if implemented)
  async zoomIn() {
    await this.page.keyboard.press('Control+Plus');
  }

  async zoomOut() {
    await this.page.keyboard.press('Control+Minus');
  }

  async resetZoom() {
    await this.page.keyboard.press('Control+0');
  }
}