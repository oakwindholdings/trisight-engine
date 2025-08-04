// src/services/reportStorageService.ts
// Client-side report storage service
// Context: Uses API endpoints instead of direct file access

import axios from 'axios';
import { reportApiService } from './reportApiService';
import { StoredReport } from '../types/reportTypes';
import { logDebug, logError } from '../utils/logger';

/**
 * Client-side storage service for reports
 * Communicates with the server API for all operations
 */
class ReportStorageService {
  constructor() {
    // No need for apiUrl, reportApiService handles it
  }

  /**
   * Lists all stored reports
   */
  async listReports(): Promise<StoredReport[]> {
    try {
      const response = await reportApiService.listReports();
      
      return response.reports.map((report: any) => ({
        id: report.filename?.replace(/\.(pdf|pptx)$/, '') || report.id,
        ticker: report.ticker || this.extractTickerFromFilename(report.filename),
        title: report.title || this.formatTitle(report.filename),
        generatedAt: report.created,
        size: report.size,
        format: report.filename.endsWith('.pptx') ? 'pptx' : 'pdf',
        metadata: {},
        downloadUrl: report.downloadUrl
      }));
    } catch (error) {
      logError('Failed to list reports', error);
      return [];
    }
  }

  /**
   * Gets a specific report
   */
  async getReport(reportId: string): Promise<StoredReport | null> {
    const reports = await this.listReports();
    return reports.find(r => r.id === reportId) || null;
  }

  /**
   * Downloads a report
   */
  async downloadReport(reportId: string): Promise<Blob> {
    const report = await this.getReport(reportId);
    if (!report || !report.downloadUrl) {
      throw new Error('Report not found');
    }

    const response = await axios.get(report.downloadUrl, {
      responseType: 'blob'
    });

    return response.data;
  }

  /**
   * Deletes a report (if API supports it)
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      await reportApiService.downloadReport(reportId); // TODO: Add delete method to reportApiService
    } catch (error) {
      // If delete endpoint doesn't exist, log and continue
      logDebug('Delete endpoint not available');
    }
  }

  /**
   * Extracts ticker from filename
   */
  private extractTickerFromFilename(filename: string): string {
    // Assumes format like "NVDA_Technical_Analysis_2024-01-31.pdf"
    const parts = filename.split('_');
    return parts[0] || 'UNKNOWN';
  }

  /**
   * Formats filename into readable title
   */
  private formatTitle(filename: string): string {
    // Remove extension and replace underscores with spaces
    return filename
      .replace(/\.(pdf|pptx)$/, '')
      .replace(/_/g, ' ')
      .replace(/(\d{4})-(\d{2})-(\d{2})/, '$2/$3/$1');
  }
}

// Export singleton instance
export const reportStorageService = new ReportStorageService();

// Export function for compatibility
export function getStorageService() {
  return reportStorageService;
}