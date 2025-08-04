// e2e/pages/ReportsListPage.ts
// Page Object Model for Reports List/History Page
// Context: Encapsulates report listing and management UI interactions

import { Page, expect } from '@playwright/test';

export interface ReportListItem {
  id: string;
  ticker: string;
  title: string;
  date: string;
  status: string;
  size: string;
}

export class ReportsListPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto('/reports');
    await this.page.waitForLoadState('networkidle');
  }

  // Filtering
  async filterByTicker(ticker: string) {
    await this.page.fill('[data-testid="ticker-filter"]', ticker);
    await this.page.press('[data-testid="ticker-filter"]', 'Enter');
    
    // Wait for filter to apply
    await this.page.waitForTimeout(500);
  }

  async filterByDateRange(startDate: string, endDate: string) {
    await this.page.fill('[data-testid="date-start"]', startDate);
    await this.page.fill('[data-testid="date-end"]', endDate);
    await this.page.click('[data-testid="apply-date-filter"]');
  }

  async filterByStatus(status: 'all' | 'completed' | 'draft' | 'archived') {
    await this.page.selectOption('[data-testid="status-filter"]', status);
  }

  async filterByReportType(type: string) {
    await this.page.selectOption('[data-testid="report-type-filter"]', type);
  }

  async clearFilters() {
    await this.page.click('[data-testid="clear-filters"]');
  }

  // Searching
  async search(query: string) {
    await this.page.fill('[data-testid="search-reports"]', query);
    await this.page.press('[data-testid="search-reports"]', 'Enter');
  }

  // Sorting
  async sortBy(field: 'date' | 'ticker' | 'title' | 'size', order: 'asc' | 'desc' = 'desc') {
    await this.page.click(`[data-testid="sort-${field}"]`);
    
    // Click again if we need to change order
    const currentOrder = await this.page.getAttribute(`[data-testid="sort-${field}"]`, 'data-order');
    if (currentOrder !== order) {
      await this.page.click(`[data-testid="sort-${field}"]`);
    }
  }

  // Report List Operations
  async getReportCount(): Promise<number> {
    const countText = await this.page.textContent('[data-testid="report-count"]');
    return parseInt(countText?.match(/\d+/)?.[0] || '0');
  }

  async getReports(): Promise<ReportListItem[]> {
    const reports: ReportListItem[] = [];
    const rows = await this.page.$$('[data-testid^="report-row-"]');
    
    for (const row of rows) {
      const id = await row.getAttribute('data-report-id') || '';
      const ticker = await row.$eval('[data-testid="report-ticker"]', el => el.textContent) || '';
      const title = await row.$eval('[data-testid="report-title"]', el => el.textContent) || '';
      const date = await row.$eval('[data-testid="report-date"]', el => el.textContent) || '';
      const status = await row.$eval('[data-testid="report-status"]', el => el.textContent) || '';
      const size = await row.$eval('[data-testid="report-size"]', el => el.textContent) || '';
      
      reports.push({ id, ticker, title, date, status, size });
    }
    
    return reports;
  }

  async getReportById(reportId: string): Promise<ReportListItem | null> {
    const reports = await this.getReports();
    return reports.find(r => r.id === reportId) || null;
  }

  // Report Actions
  async clickReport(reportId: string) {
    await this.page.click(`[data-testid="report-row-${reportId}"]`);
  }

  async openReport(reportId: string) {
    await this.page.click(`[data-testid="open-report-${reportId}"]`);
  }

  async downloadReport(reportId: string) {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(`[data-testid="download-report-${reportId}"]`)
    ]);
    
    return download;
  }

  async deleteReport(reportId: string) {
    await this.page.click(`[data-testid="delete-report-${reportId}"]`);
    
    // Confirm deletion
    await this.page.click('[data-testid="confirm-delete"]');
    
    // Wait for deletion to complete
    await this.page.waitForSelector(`[data-testid="report-row-${reportId}"]`, { state: 'detached' });
  }

  async archiveReport(reportId: string) {
    await this.page.click(`[data-testid="archive-report-${reportId}"]`);
    
    // Wait for status update
    await this.page.waitForSelector(`[data-testid="report-row-${reportId}"] [data-testid="report-status"]:has-text("archived")`);
  }

  // Bulk Operations
  async selectReport(reportId: string) {
    await this.page.check(`[data-testid="select-report-${reportId}"]`);
  }

  async selectAllReports() {
    await this.page.check('[data-testid="select-all-reports"]');
  }

  async getSelectedCount(): Promise<number> {
    const text = await this.page.textContent('[data-testid="selected-count"]');
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async bulkDownload() {
    await this.page.click('[data-testid="bulk-download"]');
  }

  async bulkDelete() {
    await this.page.click('[data-testid="bulk-delete"]');
    await this.page.click('[data-testid="confirm-bulk-delete"]');
  }

  async bulkArchive() {
    await this.page.click('[data-testid="bulk-archive"]');
  }

  // Pagination
  async getCurrentPage(): Promise<number> {
    const text = await this.page.textContent('[data-testid="current-page"]');
    return parseInt(text || '1');
  }

  async getTotalPages(): Promise<number> {
    const text = await this.page.textContent('[data-testid="total-pages"]');
    return parseInt(text || '1');
  }

  async goToPage(pageNumber: number) {
    await this.page.fill('[data-testid="page-input"]', pageNumber.toString());
    await this.page.press('[data-testid="page-input"]', 'Enter');
  }

  async nextPage() {
    await this.page.click('[data-testid="next-page"]');
  }

  async previousPage() {
    await this.page.click('[data-testid="previous-page"]');
  }

  async setItemsPerPage(count: 10 | 25 | 50 | 100) {
    await this.page.selectOption('[data-testid="items-per-page"]', count.toString());
  }

  // View Options
  async switchToGridView() {
    await this.page.click('[data-testid="grid-view"]');
  }

  async switchToListView() {
    await this.page.click('[data-testid="list-view"]');
  }

  async toggleCompactMode() {
    await this.page.click('[data-testid="compact-mode"]');
  }

  // Storage Stats
  async getStorageStats() {
    return {
      totalReports: await this.page.textContent('[data-testid="total-reports"]') || '0',
      totalSize: await this.page.textContent('[data-testid="total-size"]') || '0',
      storageUsed: await this.page.textContent('[data-testid="storage-used"]') || '0%'
    };
  }

  // Empty State
  async hasNoReports(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="no-reports"]');
  }

  async clickCreateFirstReport() {
    await this.page.click('[data-testid="create-first-report"]');
  }

  // Loading States
  async isLoading(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="reports-loading"]');
  }

  async waitForReportsToLoad() {
    await this.page.waitForSelector('[data-testid="reports-loaded"]', { timeout: 10000 });
  }

  // Error States
  async hasError(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="reports-error"]');
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.textContent('[data-testid="error-message"]') || '';
  }

  async clickRetryLoad() {
    await this.page.click('[data-testid="retry-load"]');
  }

  // Quick Actions
  async createNewReport() {
    await this.page.click('[data-testid="create-new-report"]');
  }

  async refreshReports() {
    await this.page.click('[data-testid="refresh-reports"]');
    await this.waitForReportsToLoad();
  }

  // Report Preview
  async hoverReport(reportId: string) {
    await this.page.hover(`[data-testid="report-row-${reportId}"]`);
  }

  async getPreviewThumbnail(reportId: string): Promise<string | null> {
    const thumbnail = await this.page.$(`[data-testid="preview-thumbnail-${reportId}"]`);
    return thumbnail ? await thumbnail.getAttribute('src') : null;
  }
}