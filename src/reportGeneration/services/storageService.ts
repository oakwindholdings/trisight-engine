// src/reportGeneration/services/storageService.ts
// Real storage service for report persistence and retrieval
// Context: Handles file operations, browser storage, and cloud sync

import { GeneratedReport, ReportMetadata } from '../models/reportTypes';
import { CompressionUtils } from '../utils/compression';
import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import { EncryptionUtils } from '../utils/encryption';
import { logDebug, logError } from '../../utils/logger';

/**
 * Storage configuration
 */
interface StorageConfig {
  maxLocalReports: number;
  maxFileSize: number; // MB
  autoCleanupDays: number;
  enableCloudSync: boolean;
  compressionEnabled: boolean;
}

/**
 * Stored report format
 */
interface StoredReport {
  id: string;
  metadata: ReportMetadata;
  ticker: string;
  title: string;
  template: string;
  author: string;
  createdAt: string;
  lastAccessedAt: string;
  fileSize: number;
  outputFormat: string;
  status: 'draft' | 'completed' | 'archived';
  tags: string[];
  thumbnail?: string;
  // File references
  localPath?: string;
  cloudUrl?: string;
  // Report data - can be compressed string or object
  reportData?: string | Partial<GeneratedReport>;
  isCompressed?: boolean;
  isEncrypted?: boolean;
}

/**
 * Export options
 */
interface ExportOptions {
  format: 'pdf' | 'pptx' | 'json' | 'html' | 'xlsx';
  includeCharts: boolean;
  includeRawData: boolean;
  compressionLevel?: number;
  password?: string;
  watermark?: boolean;
}

/**
 * Production Storage Service
 * Handles all report storage and retrieval operations
 */
export class StorageService {
  private config: StorageConfig;
  private dbName = 'TrisightReports';
  private storeName = 'reports';
  private db: IDBDatabase | null = null;
  private thumbnailGenerator: ThumbnailGenerator;
  private encryptionKey: CryptoKey | null = null;
  
  constructor(config?: Partial<StorageConfig>) {
    this.config = {
      maxLocalReports: 100,
      maxFileSize: 50, // 50MB
      autoCleanupDays: 90,
      enableCloudSync: false,
      compressionEnabled: true,
      ...config
    };
    
    this.thumbnailGenerator = new ThumbnailGenerator();
    this.initializeStorage();
  }

  /**
   * Initializes storage systems
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Initialize IndexedDB for structured data
      await this.initializeIndexedDB();
      
      // Initialize encryption if available
      await this.initializeEncryption();
      
      // Check and cleanup old reports
      await this.cleanupOldReports();
      
      // Migrate from localStorage if needed
      await this.migrateFromLocalStorage();
      
      logDebug('StorageService', 'Storage initialized successfully');
    } catch (error) {
      logError('StorageService', 'Failed to initialize storage', error);
    }
  }

  /**
   * Initialize encryption key
   */
  private async initializeEncryption(): Promise<void> {
    if (!EncryptionUtils.isAvailable()) {
      logDebug('StorageService', 'Encryption not available in this environment');
      return;
    }

    try {
      // Try to load existing key from secure storage
      const storedKey = localStorage.getItem('trisight_report_key');
      
      if (storedKey) {
        this.encryptionKey = await EncryptionUtils.importKey(storedKey);
      } else {
        // Generate new key
        this.encryptionKey = await EncryptionUtils.generateKey();
        const exportedKey = await EncryptionUtils.exportKey(this.encryptionKey);
        localStorage.setItem('trisight_report_key', exportedKey);
      }
      
      logDebug('StorageService', 'Encryption initialized');
    } catch (error) {
      logDebug('StorageService', `Encryption initialization failed: ${error}`);
    }
  }

  /**
   * Initializes IndexedDB for report storage
   */
  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create reports store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient querying
          store.createIndex('ticker', 'ticker', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('template', 'template', { unique: false });
          store.createIndex('author', 'author', { unique: false });
        }
      };
    });
  }

  /**
   * Saves a generated report
   */
  async saveReport(report: GeneratedReport): Promise<StoredReport> {
    logDebug('StorageService', `Saving report for ${report.companyData.ticker}`);
    
    try {
      const reportId = this.generateReportId();
      const now = new Date().toISOString();
      
      // Create stored report object
      const storedReport: StoredReport = {
        id: reportId,
        metadata: report.metadata,
        ticker: report.companyData.ticker,
        title: report.config.title || `${report.companyData.companyName} Analysis`,
        template: report.config.reportType || 'custom',
        author: report.config.author || 'Unknown',
        createdAt: now,
        lastAccessedAt: now,
        fileSize: await this.calculateFileSize(report),
        outputFormat: report.config.outputFormat || 'pdf',
        status: 'completed',
        tags: this.extractTags(report),
        thumbnail: await this.generateThumbnail(report),
        reportData: await this.compressReportData(report),
        isCompressed: this.config.compressionEnabled,
        isEncrypted: false
      };
      
      // Save to IndexedDB
      await this.saveToIndexedDB(storedReport);
      
      // Save to localStorage for quick access
      this.updateRecentReports(storedReport);
      
      // Save actual file if in browser
      if (report.outputPath) {
        storedReport.localPath = await this.saveReportFile(report, reportId);
      }
      
      // Trigger cloud sync if enabled
      if (this.config.enableCloudSync) {
        this.scheduleCloudSync(storedReport);
      }
      
      logDebug('StorageService', `Report saved successfully: ${reportId}`);
      return storedReport;
      
    } catch (error) {
      logError('StorageService', 'Failed to save report', error);
      throw error;
    }
  }

  /**
   * Retrieves a report by ID
   */
  async getReport(reportId: string): Promise<StoredReport | null> {
    try {
      const report = await this.getFromIndexedDB(reportId);
      
      if (report) {
        // Update last accessed time
        report.lastAccessedAt = new Date().toISOString();
        await this.updateReport(report);
      }
      
      return report;
    } catch (error) {
      logError('StorageService', `Failed to get report ${reportId}`, error);
      return null;
    }
  }

  /**
   * Lists all reports with filtering
   */
  async listReports(filter?: {
    ticker?: string;
    template?: string;
    author?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    tags?: string[];
  }): Promise<StoredReport[]> {
    try {
      const reports = await this.getAllFromIndexedDB();
      
      // Apply filters
      let filtered = reports;
      
      if (filter?.ticker) {
        filtered = filtered.filter(r => r.ticker === filter.ticker);
      }
      
      if (filter?.template) {
        filtered = filtered.filter(r => r.template === filter.template);
      }
      
      if (filter?.author) {
        filtered = filtered.filter(r => r.author === filter.author);
      }
      
      if (filter?.status) {
        filtered = filtered.filter(r => r.status === filter.status);
      }
      
      if (filter?.startDate) {
        filtered = filtered.filter(r => new Date(r.createdAt) >= filter.startDate!);
      }
      
      if (filter?.endDate) {
        filtered = filtered.filter(r => new Date(r.createdAt) <= filter.endDate!);
      }
      
      if (filter?.tags && filter.tags.length > 0) {
        filtered = filtered.filter(r => 
          filter.tags!.some(tag => r.tags.includes(tag))
        );
      }
      
      // Sort by creation date (newest first)
      filtered.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return filtered;
    } catch (error) {
      logError('StorageService', 'Failed to list reports', error);
      return [];
    }
  }

  /**
   * Exports a report in specified format
   */
  async exportReport(reportId: string, options: ExportOptions): Promise<Blob> {
    logDebug('StorageService', `Exporting report ${reportId} as ${options.format}`);
    
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      // Decompress report data if needed
      let fullReport: GeneratedReport | null = null;
      
      if (report.reportData) {
        if (typeof report.reportData === 'string' && report.isCompressed) {
          fullReport = await this.decompressReportData(report.reportData);
        } else if (typeof report.reportData === 'object') {
          fullReport = report.reportData as GeneratedReport;
        }
      }
      
      if (!fullReport) {
        throw new Error('Report data not available');
      }
      
      let exportData: Blob;
      
      switch (options.format) {
        case 'pdf':
          exportData = await this.exportAsPDF(fullReport, options);
          break;
          
        case 'pptx':
          exportData = await this.exportAsPPTX(fullReport, options);
          break;
          
        case 'json':
          exportData = await this.exportAsJSON(fullReport, options);
          break;
          
        case 'html':
          exportData = await this.exportAsHTML(fullReport, options);
          break;
          
        case 'xlsx':
          exportData = await this.exportAsExcel(fullReport, options);
          break;
          
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
      
      // Apply compression if requested
      if (options.compressionLevel) {
        exportData = await this.compressBlob(exportData, options.compressionLevel);
      }
      
      // Apply password protection if requested
      if (options.password) {
        exportData = await this.encryptBlob(exportData, options.password);
      }
      
      return exportData;
      
    } catch (error) {
      logError('StorageService', 'Failed to export report', error);
      throw error;
    }
  }

  /**
   * Downloads a report file
   */
  async downloadReport(reportId: string, options?: ExportOptions): Promise<void> {
    try {
      const report = await this.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }
      
      const exportOptions = options || {
        format: report.outputFormat as any,
        includeCharts: true,
        includeRawData: false
      };
      
      const blob = await this.exportReport(reportId, exportOptions);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.ticker}_${report.template}_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      
      // Trigger download
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      URL.revokeObjectURL(url);
      
      logDebug('StorageService', `Downloaded report: ${report.id}`);
      
    } catch (error) {
      logError('StorageService', 'Failed to download report', error);
      throw error;
    }
  }

  /**
   * Deletes a report
   */
  async deleteReport(reportId: string): Promise<void> {
    try {
      await this.deleteFromIndexedDB(reportId);
      this.removeFromRecentReports(reportId);
      
      logDebug('StorageService', `Deleted report: ${reportId}`);
    } catch (error) {
      logError('StorageService', 'Failed to delete report', error);
      throw error;
    }
  }

  /**
   * Archives old reports
   */
  async archiveReport(reportId: string): Promise<void> {
    try {
      const report = await this.getReport(reportId);
      if (report) {
        report.status = 'archived';
        await this.updateReport(report);
      }
    } catch (error) {
      logError('StorageService', 'Failed to archive report', error);
    }
  }

  /**
   * Gets storage statistics
   */
  async getStorageStats(): Promise<{
    totalReports: number;
    totalSize: number;
    byTemplate: { [key: string]: number };
    byStatus: { [key: string]: number };
    oldestReport: Date | null;
    newestReport: Date | null;
  }> {
    try {
      const reports = await this.getAllFromIndexedDB();
      
      const stats = {
        totalReports: reports.length,
        totalSize: reports.reduce((sum, r) => sum + r.fileSize, 0),
        byTemplate: {} as { [key: string]: number },
        byStatus: {} as { [key: string]: number },
        oldestReport: null as Date | null,
        newestReport: null as Date | null
      };
      
      // Calculate statistics
      reports.forEach(report => {
        // By template
        stats.byTemplate[report.template] = (stats.byTemplate[report.template] || 0) + 1;
        
        // By status
        stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1;
        
        // Date ranges
        const createdDate = new Date(report.createdAt);
        if (!stats.oldestReport || createdDate < stats.oldestReport) {
          stats.oldestReport = createdDate;
        }
        if (!stats.newestReport || createdDate > stats.newestReport) {
          stats.newestReport = createdDate;
        }
      });
      
      return stats;
    } catch (error) {
      logError('StorageService', 'Failed to get storage stats', error);
      return {
        totalReports: 0,
        totalSize: 0,
        byTemplate: {},
        byStatus: {},
        oldestReport: null,
        newestReport: null
      };
    }
  }

  /**
   * Private helper methods
   */

  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async calculateFileSize(report: GeneratedReport): Promise<number> {
    // Estimate file size based on content
    const jsonString = JSON.stringify(report);
    return jsonString.length / (1024 * 1024); // Convert to MB
  }

  private extractTags(report: GeneratedReport): string[] {
    const tags: string[] = [];
    
    // Add template tag
    if (report.config.reportType) {
      tags.push(report.config.reportType);
    }
    
    // Add ticker tag
    tags.push(report.companyData.ticker);
    
    // Add timeframe tag
    if (report.config.timeframe) {
      tags.push(report.config.timeframe);
    }
    
    // Add recommendation tag
    if (report.metadata.recommendation) {
      tags.push(report.metadata.recommendation);
    }
    
    return tags;
  }

  private async generateThumbnail(report: GeneratedReport): Promise<string | undefined> {
    try {
      return await this.thumbnailGenerator.generateFromReport(report, {
        width: 300,
        height: 200,
        quality: 0.9,
        format: 'jpeg'
      });
    } catch (error) {
      logDebug('StorageService', `Failed to generate thumbnail: ${error}`);
      return undefined;
    }
  }

  private async compressReportData(report: GeneratedReport): Promise<string> {
    if (!this.config.compressionEnabled) {
      return JSON.stringify(report);
    }

    try {
      const compressed = await CompressionUtils.compressObject(report);
      const ratio = CompressionUtils.calculateCompressionRatio(
        JSON.stringify(report),
        compressed
      );
      logDebug('StorageService', `Compressed report data by ${(ratio * 100).toFixed(1)}%`);
      return compressed;
    } catch (error) {
      logDebug('StorageService', `Compression failed, storing uncompressed: ${error}`);
      return JSON.stringify(report);
    }
  }

  private async decompressReportData(data: string): Promise<GeneratedReport> {
    try {
      // Check if data is compressed (base64 encoded)
      if (data.match(/^[A-Za-z0-9+/]+=*$/)) {
        return await CompressionUtils.decompressObject<GeneratedReport>(data);
      } else {
        // Not compressed, parse as JSON
        return JSON.parse(data);
      }
    } catch (error) {
      logDebug('StorageService', `Decompression failed: ${error}`);
      throw new Error('Failed to decompress report data');
    }
  }

  private async saveToIndexedDB(report: StoredReport): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(report);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getFromIndexedDB(id: string): Promise<StoredReport | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllFromIndexedDB(): Promise<StoredReport[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteFromIndexedDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async updateReport(report: StoredReport): Promise<void> {
    await this.saveToIndexedDB(report);
  }

  private updateRecentReports(report: StoredReport): void {
    try {
      const recentKey = 'trisight_recent_reports';
      const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
      
      // Add to recent, limit to 10
      recent.unshift({
        id: report.id,
        ticker: report.ticker,
        title: report.title,
        createdAt: report.createdAt
      });
      
      localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 10)));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  private removeFromRecentReports(reportId: string): void {
    try {
      const recentKey = 'trisight_recent_reports';
      const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
      const filtered = recent.filter((r: any) => r.id !== reportId);
      localStorage.setItem(recentKey, JSON.stringify(filtered));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  private async cleanupOldReports(): Promise<void> {
    try {
      const reports = await this.getAllFromIndexedDB();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.autoCleanupDays);
      
      for (const report of reports) {
        if (report.status === 'draft' && new Date(report.createdAt) < cutoffDate) {
          await this.deleteReport(report.id);
        }
      }
    } catch (error) {
      logError('StorageService', 'Failed to cleanup old reports', error);
    }
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const oldReportsKey = 'generatedReports';
      const oldReports = localStorage.getItem(oldReportsKey);
      
      if (oldReports) {
        const reports = JSON.parse(oldReports);
        
        for (const report of reports) {
          // Convert old format to new
          const storedReport: StoredReport = {
            id: report.id || this.generateReportId(),
            metadata: report.metadata || {},
            ticker: report.ticker,
            title: report.title,
            template: report.template || 'custom',
            author: report.author || 'Unknown',
            createdAt: report.createdAt || report.completedAt,
            lastAccessedAt: new Date().toISOString(),
            fileSize: 0,
            outputFormat: 'pdf',
            status: 'completed',
            tags: [],
            reportData: report
          };
          
          await this.saveToIndexedDB(storedReport);
        }
        
        // Remove old data
        localStorage.removeItem(oldReportsKey);
        logDebug('StorageService', `Migrated ${reports.length} reports from localStorage`);
      }
    } catch (error) {
      logError('StorageService', 'Failed to migrate from localStorage', error);
    }
  }

  private async saveReportFile(report: GeneratedReport, reportId: string): Promise<string> {
    // In browser environment, we can't save to filesystem
    // Return a data URL instead
    return `data:application/json;base64,${btoa(JSON.stringify(report))}`;
  }

  private scheduleCloudSync(report: StoredReport): void {
    // Placeholder for cloud sync implementation
    // Would integrate with Supabase or other cloud storage
    logDebug('StorageService', `Cloud sync scheduled for report ${report.id}`);
  }

  private async exportAsPDF(report: GeneratedReport, options: ExportOptions): Promise<Blob> {
    // Use the existing PDF engine
    const { PDFEngine } = await import('../engines/pdfEngine');
    const engine = new PDFEngine();
    
    const pdfData = await engine.generatePDF(
      report.companyData,
      report.analysis || {},
      report.slides,
      [] // Charts would be passed here
    );
    
    return new Blob([pdfData], { type: 'application/pdf' });
  }

  private async exportAsPPTX(report: GeneratedReport, options: ExportOptions): Promise<Blob> {
    // Use the existing PPTX engine
    const { PPTXEngine } = await import('../engines/pptxEngine');
    const engine = new PPTXEngine();
    
    const pptxData = await engine.generatePPTX(
      report.companyData,
      report.analysis || {},
      report.slides,
      [] // Charts would be passed here
    );
    
    return new Blob([pptxData], { 
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
    });
  }

  private async exportAsJSON(report: GeneratedReport, options: ExportOptions): Promise<Blob> {
    const jsonData = options.includeRawData ? report : {
      config: report.config,
      metadata: report.metadata,
      slides: report.slides
    };
    
    return new Blob([JSON.stringify(jsonData, null, 2)], { 
      type: 'application/json' 
    });
  }

  private async exportAsHTML(report: GeneratedReport, options: ExportOptions): Promise<Blob> {
    // Generate HTML report
    let html = `<!DOCTYPE html>
<html>
<head>
  <title>${report.companyData.companyName} - ${report.config.reportType}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 2em; }
    .slide { page-break-after: always; margin-bottom: 2em; }
    h1 { color: #1e293b; }
    h2 { color: #334155; }
    .metrics { display: flex; gap: 2em; margin: 1em 0; }
    .metric { background: #f1f5f9; padding: 1em; border-radius: 8px; }
  </style>
</head>
<body>`;
    
    // Add slides
    report.slides.forEach(slide => {
      html += `<div class="slide">
        <h2>${slide.title}</h2>`;
      
      slide.content.forEach(content => {
        switch (content.type) {
          case 'text':
            html += `<p>${content.data.text || ''}</p>`;
            break;
          case 'table':
            html += '<table border="1">';
            if (content.data.headers) {
              html += '<tr>' + content.data.headers.map((h: string) => `<th>${h}</th>`).join('') + '</tr>';
            }
            if (content.data.rows) {
              content.data.rows.forEach((row: any[]) => {
                html += '<tr>' + row.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
              });
            }
            html += '</table>';
            break;
        }
      });
      
      html += '</div>';
    });
    
    html += '</body></html>';
    
    return new Blob([html], { type: 'text/html' });
  }

  private async exportAsExcel(report: GeneratedReport, options: ExportOptions): Promise<Blob> {
    // Would use xlsx library to generate Excel file
    // For now, return CSV
    let csv = `${report.companyData.companyName} Report\n`;
    csv += `Generated: ${new Date().toISOString()}\n\n`;
    
    // Add financial data as CSV
    report.slides.forEach(slide => {
      slide.content.forEach(content => {
        if (content.type === 'table' && content.data.rows) {
          if (content.data.headers) {
            csv += content.data.headers.join(',') + '\n';
          }
          content.data.rows.forEach((row: any[]) => {
            csv += row.join(',') + '\n';
          });
          csv += '\n';
        }
      });
    });
    
    return new Blob([csv], { type: 'text/csv' });
  }

  private async compressBlob(blob: Blob, level: number): Promise<Blob> {
    // In production, would use compression library
    return blob;
  }

  private async encryptBlob(blob: Blob, password: string): Promise<Blob> {
    // In production, would use encryption library
    return blob;
  }
}

// Singleton instance
let storageInstance: StorageService | null = null;

/**
 * Gets the storage service instance
 */
export function getStorageService(): StorageService {
  if (!storageInstance) {
    storageInstance = new StorageService();
  }
  return storageInstance;
}