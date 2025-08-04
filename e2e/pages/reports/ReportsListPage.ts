// e2e/pages/reports/ReportsListPage.ts
// Page Object Model for Reports List/History
// Context: Encapsulates all report list and history interactions

import { Page, expect, Locator, Download } from '@playwright/test';

export class ReportsListPage {
  readonly page: Page;
  
  // Search and filters
  readonly searchInput: Locator;
  readonly allTypesButton: Locator;
  readonly pdfFilterButton: Locator;
  readonly powerPointFilterButton: Locator;
  readonly excelFilterButton: Locator;
  
  // Report list
  readonly reportsList: Locator;
  readonly reportCards: Locator;
  readonly emptyState: Locator;
  
  // Report card elements
  readonly viewReportButtons: Locator;
  readonly downloadButtons: Locator;
  readonly deleteButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Search and filters
    this.searchInput = page.getByPlaceholder('Search reports...');
    this.allTypesButton = page.getByRole('button', { name: 'All Types' });
    this.pdfFilterButton = page.getByRole('button', { name: 'PDF' }).filter({ hasText: 'PDF' });
    this.powerPointFilterButton = page.getByRole('button', { name: 'PowerPoint' });
    this.excelFilterButton = page.getByRole('button', { name: 'Excel' });
    
    // Report list
    this.reportsList = page.locator('text=Recent Reports').locator('..').locator('..').locator('[role="button"]');
    this.reportCards = page.locator('[role="button"]').filter({ has: page.locator('h3') });
    this.emptyState = page.locator('text=No reports found');
    
    // Action buttons
    this.viewReportButtons = page.getByLabel('View report');
    this.downloadButtons = page.getByLabel('Download');
    this.deleteButtons = page.getByLabel('Delete');
  }

  // Navigation
  async goto() {
    await this.page.goto('/reports');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForReportsToLoad() {
    // Wait for either reports or empty state
    await this.page.waitForSelector('[role="button"] h3, text=No reports found', { timeout: 10000 });
  }

  // Search functionality
  async searchReports(query: string) {
    await this.searchInput.fill(query);
    // Wait for search to filter results
    await this.page.waitForTimeout(500);
  }

  async clearSearch() {
    await this.searchInput.clear();
    await this.page.waitForTimeout(500);
  }

  // Filter functionality
  async filterByType(type: 'all' | 'pdf' | 'powerpoint' | 'excel') {
    switch (type) {
      case 'all':
        await this.allTypesButton.click();
        break;
      case 'pdf':
        await this.pdfFilterButton.click();
        break;
      case 'powerpoint':
        await this.powerPointFilterButton.click();
        break;
      case 'excel':
        await this.excelFilterButton.click();
        break;
    }
    
    // Wait for filter to apply
    await this.page.waitForTimeout(500);
  }

  // Report list operations
  async getReportCount(): Promise<number> {
    if (await this.emptyState.isVisible()) {
      return 0;
    }
    
    const reports = await this.reportCards.all();
    return reports.length;
  }

  async getReportTitles(): Promise<string[]> {
    const titles: string[] = [];
    const reportHeaders = await this.reportCards.locator('h3').all();
    
    for (const header of reportHeaders) {
      const title = await header.textContent();
      if (title) titles.push(title);
    }
    
    return titles;
  }

  async getReportByTitle(title: string): Promise<Locator | null> {
    const report = this.reportCards.filter({ hasText: title }).first();
    if (await report.count() > 0) {
      return report;
    }
    return null;
  }

  async getReportDetails(reportTitle: string): Promise<{
    title: string;
    date: string;
    format: string;
    size: string;
    description: string;
  } | null> {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) return null;
    
    const title = await report.locator('h3').textContent() || '';
    const metadata = await report.locator('div').nth(1).allTextContents();
    const description = await report.locator('p').textContent() || '';
    
    // Parse metadata (format: "Today PDF 32 KB")
    const metadataText = metadata.join(' ');
    const [date, format, ...sizeparts] = metadataText.split(/\s+/);
    const size = sizeparts.join(' ');
    
    return {
      title,
      date: date || '',
      format: format || '',
      size: size || '',
      description
    };
  }

  // Report actions
  async viewReport(reportTitle: string) {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) throw new Error(`Report "${reportTitle}" not found`);
    
    const viewButton = report.getByLabel('View report');
    await viewButton.click();
  }

  async downloadReport(reportTitle: string): Promise<Download> {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) throw new Error(`Report "${reportTitle}" not found`);
    
    const downloadButton = report.getByLabel('Download');
    
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      downloadButton.click()
    ]);
    
    return download;
  }

  async deleteReport(reportTitle: string) {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) throw new Error(`Report "${reportTitle}" not found`);
    
    const deleteButton = report.getByLabel('Delete');
    
    // Handle confirmation dialog
    this.page.once('dialog', dialog => dialog.accept());
    await deleteButton.click();
    
    // Wait for report to be removed
    await expect(report).not.toBeVisible();
  }

  async deleteReportWithConfirmation(reportTitle: string, confirm: boolean = true) {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) throw new Error(`Report "${reportTitle}" not found`);
    
    const deleteButton = report.getByLabel('Delete');
    
    // Handle confirmation dialog
    this.page.once('dialog', dialog => {
      if (confirm) {
        dialog.accept();
      } else {
        dialog.dismiss();
      }
    });
    
    await deleteButton.click();
    
    if (confirm) {
      // Wait for report to be removed
      await expect(report).not.toBeVisible();
    } else {
      // Report should still be visible
      await expect(report).toBeVisible();
    }
  }

  // Sorting and pagination (if implemented)
  async sortByDate(order: 'newest' | 'oldest') {
    // Implementation depends on UI
    // For now, reports are sorted by date by default
  }

  // Verification helpers
  async verifyReportExists(reportTitle: string) {
    const report = await this.getReportByTitle(reportTitle);
    expect(report).not.toBeNull();
  }

  async verifyReportNotExists(reportTitle: string) {
    const report = await this.getReportByTitle(reportTitle);
    expect(report).toBeNull();
  }

  async verifyEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async verifyReportFormat(reportTitle: string, expectedFormat: 'PDF' | 'PPTX' | 'XLSX') {
    const details = await this.getReportDetails(reportTitle);
    expect(details?.format).toBe(expectedFormat);
  }

  async verifyReportDate(reportTitle: string, expectedDate: 'Today' | 'Yesterday' | string) {
    const details = await this.getReportDetails(reportTitle);
    expect(details?.date).toContain(expectedDate);
  }

  // Batch operations
  async deleteAllReports() {
    const deleteButtons = await this.deleteButtons.all();
    
    for (let i = deleteButtons.length - 1; i >= 0; i--) {
      this.page.once('dialog', dialog => dialog.accept());
      await deleteButtons[i].click();
      await this.page.waitForTimeout(500); // Wait between deletions
    }
  }

  async downloadMultipleReports(reportTitles: string[]): Promise<Download[]> {
    const downloads: Download[] = [];
    
    for (const title of reportTitles) {
      const download = await this.downloadReport(title);
      downloads.push(download);
    }
    
    return downloads;
  }

  // Filter verification
  async getVisibleReportFormats(): Promise<string[]> {
    const formats: string[] = [];
    const reports = await this.reportCards.all();
    
    for (const report of reports) {
      const metadataText = await report.locator('div').nth(1).textContent() || '';
      const format = metadataText.match(/(PDF|PPTX|XLSX)/)?.[1];
      if (format) formats.push(format);
    }
    
    return formats;
  }

  async verifyFilterApplied(format: 'PDF' | 'PPTX' | 'XLSX') {
    const visibleFormats = await this.getVisibleReportFormats();
    for (const visibleFormat of visibleFormats) {
      expect(visibleFormat).toBe(format);
    }
  }

  // Search verification
  async verifySearchResults(searchTerm: string) {
    const titles = await this.getReportTitles();
    for (const title of titles) {
      expect(title.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  }

  // Recent report helpers
  async getMostRecentReport(): Promise<string | null> {
    const titles = await this.getReportTitles();
    return titles[0] || null;
  }

  async waitForNewReport(previousCount: number, timeout: number = 10000) {
    await expect(async () => {
      const currentCount = await this.getReportCount();
      expect(currentCount).toBeGreaterThan(previousCount);
    }).toPass({ timeout });
  }

  // Click report card directly to view
  async clickReportCard(reportTitle: string) {
    const report = await this.getReportByTitle(reportTitle);
    if (!report) throw new Error(`Report "${reportTitle}" not found`);
    
    await report.click();
  }

  // Get report metadata
  async getReportMetadata(reportTitle: string): Promise<{
    ticker?: string;
    template?: string;
    fileSize?: string;
  } | null> {
    const details = await this.getReportDetails(reportTitle);
    if (!details) return null;
    
    // Extract ticker from description (e.g., "PDF for AAPL")
    const ticker = details.description.match(/for ([A-Z]+)$/)?.[1];
    
    // Extract template from title if possible
    const template = details.title.toLowerCase().includes('equity') ? 'equity-research' :
                    details.title.toLowerCase().includes('technical') ? 'technical-analysis' :
                    details.title.toLowerCase().includes('risk') ? 'risk-assessment' : undefined;
    
    return {
      ticker,
      template,
      fileSize: details.size
    };
  }
}