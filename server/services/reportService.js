// server/services/reportService.js
// Report generation service that handles the actual report creation
// Context: Runs server-side to avoid browser limitations

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Import the built report generation module
// Clear ALL caches to ensure we load the latest version
Object.keys(require.cache).forEach(key => {
  if (key.includes('reportGeneration') || key.includes('dist')) {
    delete require.cache[key];
  }
});
const { createReportGenerator } = require('../../dist/reportGeneration/index.js');

/**
 * Report generation service
 * Handles report generation with file system access
 */
class ReportService {
  constructor() {
    this.outputDir = path.join(__dirname, '../../generated-reports');
    this.ensureOutputDirectory();
  }

  async ensureOutputDirectory() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  /**
   * Generates a report based on configuration
   * Uses the actual report generation module
   */
  async generateReport(config) {
    const reportId = uuidv4();
    const startTime = Date.now();
    
    console.log('[ReportService] Starting report generation:', {
      reportId,
      ticker: config.ticker,
      reportType: config.reportType,
      outputFormat: config.outputFormat
    });

    try {
      console.log('[ReportService] Creating report generator with config:', {
        ticker: config.ticker,
        reportType: config.reportType,
        outputFormat: config.outputFormat,
        reportId,
        hasApiKey: !!process.env.REACT_APP_TWELVE_DATA_API_KEY
      });
      
      // Use the actual report generator with API key
      const generator = createReportGenerator({
        ...config,
        reportId,
        currentDate: new Date().toISOString().split('T')[0],
        reportDate: new Date().toISOString().split('T')[0], // Add required reportDate
        apiKey: process.env.REACT_APP_TWELVE_DATA_API_KEY
      });
      
      console.log('[ReportService] Generator created, calling generateReport()');
      
      // Generate the report
      const report = await generator.generateReport();
      
      console.log('[ReportService] Report generated:', {
        hasCompanyData: !!report.companyData,
        companyName: report.companyData?.companyName,
        description: report.companyData?.description,
        slidesCount: report.slides?.length,
        outputPath: report.outputPath
      });
      
      // Ensure the report has the expected file path
      if (report.outputPath) {
        // Move the file to our output directory if needed
        const originalPath = report.outputPath;
        const filename = path.basename(originalPath);
        const newPath = path.join(this.outputDir, filename);
        
        // If the file was generated elsewhere, move it
        if (originalPath !== newPath) {
          try {
            // Check if the file exists first
            const fileExists = await fs.access(originalPath).then(() => true).catch(() => false);
            if (fileExists) {
              await fs.rename(originalPath, newPath);
              report.outputPath = newPath;
            } else {
              console.log('[ReportService] Generated file not found at:', originalPath);
              // File might be in the output directory already
              const outputFileExists = await fs.access(newPath).then(() => true).catch(() => false);
              if (outputFileExists) {
                report.outputPath = newPath;
              }
            }
          } catch (error) {
            // If rename fails, try copy and delete
            try {
              await fs.copyFile(originalPath, newPath);
              await fs.unlink(originalPath);
              report.outputPath = newPath;
            } catch (copyError) {
              console.error('[ReportService] Error moving file:', copyError);
            }
          }
        }
        
        report.downloadUrl = `/generated-reports/${filename}`;
      }
      
      const generationTime = Date.now() - startTime;
      
      // Add server metadata
      report.metadata = {
        ...report.metadata,
        generationId: reportId,
        serverTimestamp: new Date().toISOString(),
        generationTime,
        apiVersion: '1.0'
      };
      
      console.log('[ReportService] Report generated successfully:', {
        ticker: config.ticker,
        generationTime,
        outputPath: report.outputPath
      });
      
      return report;
      
    } catch (error) {
      console.error('[ReportService] Generation failed:', error);
      throw error;
    }
  }

  /**
   * Gets report status
   */
  getStatus(reportId) {
    // Placeholder for status tracking
    return {
      stage: 'processing',
      progress: 50,
      currentTask: 'Generating report content',
      errors: [],
      startTime: Date.now()
    };
  }

  /**
   * Cancels report generation
   */
  cancel(reportId) {
    // Placeholder for cancellation logic
    console.log('[ReportService] Cancelling report:', reportId);
    return true;
  }
}

module.exports = ReportService;