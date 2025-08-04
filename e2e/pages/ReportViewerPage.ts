// e2e/pages/ReportViewerPage.ts
// Page Object Model for Report Viewer/Display Page
// Context: Encapsulates report viewing and interaction UI

import { Page, expect } from '@playwright/test';

export class ReportViewerPage {
  constructor(private page: Page) {}

  // Navigation
  async goto(reportId: string) {
    await this.page.goto(`/reports/${reportId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForReportLoad() {
    await this.page.waitForSelector('[data-testid="report-loaded"]', { timeout: 30000 });
  }

  // Report Metadata
  async getReportTitle(): Promise<string> {
    return await this.page.textContent('[data-testid="report-title"]') || '';
  }

  async getReportTicker(): Promise<string> {
    return await this.page.textContent('[data-testid="report-ticker"]') || '';
  }

  async getReportDate(): Promise<string> {
    return await this.page.textContent('[data-testid="report-date"]') || '';
  }

  async getReportAuthor(): Promise<string> {
    return await this.page.textContent('[data-testid="report-author"]') || '';
  }

  async getConfidentialityLevel(): Promise<string> {
    return await this.page.textContent('[data-testid="confidentiality-level"]') || '';
  }

  // Viewer Controls
  async zoomIn() {
    await this.page.click('[data-testid="zoom-in"]');
  }

  async zoomOut() {
    await this.page.click('[data-testid="zoom-out"]');
  }

  async resetZoom() {
    await this.page.click('[data-testid="zoom-reset"]');
  }

  async fitToWidth() {
    await this.page.click('[data-testid="fit-width"]');
  }

  async fitToPage() {
    await this.page.click('[data-testid="fit-page"]');
  }

  async toggleFullscreen() {
    await this.page.click('[data-testid="fullscreen-toggle"]');
  }

  // Navigation Controls
  async getCurrentPage(): Promise<number> {
    const text = await this.page.textContent('[data-testid="current-page-number"]');
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

  async goToFirstPage() {
    await this.page.click('[data-testid="first-page"]');
  }

  async goToLastPage() {
    await this.page.click('[data-testid="last-page"]');
  }

  // Content Verification
  async getPageContent(pageNumber?: number): Promise<string> {
    if (pageNumber) {
      await this.goToPage(pageNumber);
    }
    
    return await this.page.textContent('[data-testid="page-content"]') || '';
  }

  async hasChart(chartType: string): Promise<boolean> {
    return await this.page.isVisible(`[data-testid="chart-${chartType}"]`);
  }

  async getChartCount(): Promise<number> {
    const charts = await this.page.$$('[data-testid^="chart-"]');
    return charts.length;
  }

  async hasTable(tableId: string): Promise<boolean> {
    return await this.page.isVisible(`[data-testid="table-${tableId}"]`);
  }

  async getTableData(tableId: string): Promise<string[][]> {
    const rows = await this.page.$$(`[data-testid="table-${tableId}"] tr`);
    const data: string[][] = [];
    
    for (const row of rows) {
      const cells = await row.$$('td, th');
      const rowData: string[] = [];
      
      for (const cell of cells) {
        const text = await cell.textContent();
        rowData.push(text || '');
      }
      
      if (rowData.length > 0) {
        data.push(rowData);
      }
    }
    
    return data;
  }

  // Actions
  async downloadReport() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click('[data-testid="download-report"]')
    ]);
    
    return download;
  }

  async printReport() {
    // Set up print dialog handler
    await this.page.evaluate(() => window.print = () => {
      window.dispatchEvent(new Event('print-triggered'));
    });
    
    const printTriggered = this.page.waitForEvent('print-triggered');
    await this.page.click('[data-testid="print-report"]');
    await printTriggered;
  }

  async shareReport() {
    await this.page.click('[data-testid="share-report"]');
  }

  async getShareLink(): Promise<string> {
    await this.shareReport();
    await this.page.waitForSelector('[data-testid="share-link-input"]');
    return await this.page.inputValue('[data-testid="share-link-input"]');
  }

  async copyShareLink() {
    await this.page.click('[data-testid="copy-share-link"]');
  }

  // Annotations
  async addNote(text: string, pageNumber?: number) {
    if (pageNumber) {
      await this.goToPage(pageNumber);
    }
    
    await this.page.click('[data-testid="add-note"]');
    await this.page.fill('[data-testid="note-input"]', text);
    await this.page.click('[data-testid="save-note"]');
  }

  async getNotes(): Promise<string[]> {
    const notes = await this.page.$$('[data-testid^="note-"]');
    const noteTexts: string[] = [];
    
    for (const note of notes) {
      const text = await note.textContent();
      if (text) noteTexts.push(text);
    }
    
    return noteTexts;
  }

  async addBookmark(pageNumber: number, label: string) {
    await this.goToPage(pageNumber);
    await this.page.click('[data-testid="add-bookmark"]');
    await this.page.fill('[data-testid="bookmark-label"]', label);
    await this.page.click('[data-testid="save-bookmark"]');
  }

  async getBookmarks(): Promise<Array<{ page: number; label: string }>> {
    await this.page.click('[data-testid="bookmarks-menu"]');
    const bookmarks = await this.page.$$('[data-testid^="bookmark-item-"]');
    const bookmarkData: Array<{ page: number; label: string }> = [];
    
    for (const bookmark of bookmarks) {
      const page = parseInt(await bookmark.getAttribute('data-page') || '1');
      const label = await bookmark.textContent() || '';
      bookmarkData.push({ page, label });
    }
    
    return bookmarkData;
  }

  // Search
  async searchInReport(query: string) {
    await this.page.click('[data-testid="search-toggle"]');
    await this.page.fill('[data-testid="search-input"]', query);
    await this.page.press('[data-testid="search-input"]', 'Enter');
  }

  async getSearchResultCount(): Promise<number> {
    const text = await this.page.textContent('[data-testid="search-result-count"]');
    return parseInt(text?.match(/\d+/)?.[0] || '0');
  }

  async nextSearchResult() {
    await this.page.click('[data-testid="next-search-result"]');
  }

  async previousSearchResult() {
    await this.page.click('[data-testid="previous-search-result"]');
  }

  async clearSearch() {
    await this.page.click('[data-testid="clear-search"]');
  }

  // View Options
  async toggleSidebar() {
    await this.page.click('[data-testid="toggle-sidebar"]');
  }

  async isSidebarVisible(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="report-sidebar"]');
  }

  async toggleThumbnailView() {
    await this.page.click('[data-testid="toggle-thumbnails"]');
  }

  async selectThumbnail(pageNumber: number) {
    await this.page.click(`[data-testid="thumbnail-page-${pageNumber}"]`);
  }

  // Export Options
  async exportAs(format: 'pdf' | 'pptx' | 'json' | 'html') {
    await this.page.click('[data-testid="export-menu"]');
    await this.page.click(`[data-testid="export-${format}"]`);
  }

  // Loading States
  async isLoading(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="report-loading"]');
  }

  async hasError(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="report-error"]');
  }

  async getErrorMessage(): Promise<string> {
    return await this.page.textContent('[data-testid="error-message"]') || '';
  }

  // Slide/Page Specific (for presentations)
  async getCurrentSlideTitle(): Promise<string> {
    return await this.page.textContent('[data-testid="slide-title"]') || '';
  }

  async hasSlideNotes(): Promise<boolean> {
    return await this.page.isVisible('[data-testid="slide-notes"]');
  }

  async getSlideNotes(): Promise<string> {
    return await this.page.textContent('[data-testid="slide-notes"]') || '';
  }

  // Keyboard Navigation
  async navigateWithKeyboard(key: string) {
    await this.page.keyboard.press(key);
  }

  // Performance Metrics
  async getLoadTime(): Promise<number> {
    return await this.page.evaluate(() => {
      const timing = performance.timing;
      return timing.loadEventEnd - timing.navigationStart;
    });
  }

  // Close/Exit
  async closeReport() {
    await this.page.click('[data-testid="close-report"]');
  }
}