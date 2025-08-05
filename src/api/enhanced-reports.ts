// src/api/enhanced-reports.ts
// Enhanced API endpoint for superior report generation
// Context: Integrates all advanced tools for enterprise-grade reports

import { EnhancedReportOrchestrator } from '../reportGeneration/enhanced/EnhancedReportOrchestrator';
import { EnhancedPDFGenerator } from '../reportGeneration/enhanced/EnhancedPDFGenerator';
import { logDebug, logError } from '../utils/logger';

interface EnhancedReportRequest {
  symbol: string;
  reportType?: 'comprehensive' | 'technical' | 'fundamental' | 'risk';
  timeframe?: '1M' | '3M' | '6M' | '1Y' | '2Y';
  includePatterns?: boolean;
  includeNews?: boolean;
  includeRisk?: boolean;
  outputFormat?: 'pdf' | 'pptx' | 'json';
}

interface EnhancedReportResponse {
  success: boolean;
  reportId: string;
  downloadUrl?: string;
  data?: any;
  error?: string;
  metadata: {
    processingTime: number;
    dataQuality: number;
    confidence: number;
  };
}

/**
 * Enhanced report generation API endpoint
 * Leverages all advanced tools for superior report quality
 */
export class EnhancedReportsAPI {
  private orchestrator: EnhancedReportOrchestrator;
  private pdfGenerator: EnhancedPDFGenerator;

  constructor() {
    this.orchestrator = new EnhancedReportOrchestrator();
    this.pdfGenerator = new EnhancedPDFGenerator();
  }

  /**
   * Generate enhanced report with all advanced capabilities
   */
  async generateReport(request: EnhancedReportRequest): Promise<EnhancedReportResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request
      this.validateRequest(request);

      // Set defaults for enhanced experience
      const config = {
        symbol: request.symbol.toUpperCase(),
        reportType: request.reportType || 'comprehensive',
        timeframe: request.timeframe || '1Y',
        includePatterns: request.includePatterns !== false, // Default true
        includeNews: request.includeNews !== false, // Default true
        includeRisk: request.includeRisk !== false, // Default true
        outputFormat: request.outputFormat || 'pdf'
      };

      logDebug('EnhancedReportsAPI', `Generating enhanced report for ${config.symbol}`, config);

      // Generate comprehensive report using orchestrator
      const reportData = await this.orchestrator.generateEnhancedReport(config);

      let downloadUrl: string | undefined;
      let responseData: any;

      // Generate output based on format
      if (config.outputFormat === 'pdf') {
        downloadUrl = await this.pdfGenerator.generateEnhancedPDF(reportData);
        logDebug('EnhancedReportsAPI', `PDF generated: ${downloadUrl}`);
      } else if (config.outputFormat === 'json') {
        responseData = reportData;
      }

      const processingTime = Date.now() - startTime;

      const response: EnhancedReportResponse = {
        success: true,
        reportId: reportData.reportId,
        downloadUrl,
        data: responseData,
        metadata: {
          processingTime,
          dataQuality: reportData.metadata.dataQuality,
          confidence: reportData.analysis.confidence
        }
      };

      logDebug('EnhancedReportsAPI', `Enhanced report completed in ${processingTime}ms`);
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logError('EnhancedReportsAPI', 'Enhanced report generation failed', error);

      return {
        success: false,
        reportId: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: {
          processingTime,
          dataQuality: 0,
          confidence: 0
        }
      };
    }
  }

  /**
   * Get report status and metadata
   */
  async getReportStatus(reportId: string): Promise<any> {
    try {
      // In a full implementation, this would check Supabase for report status
      // For now, return a simple status
      return {
        reportId,
        status: 'completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('EnhancedReportsAPI', 'Failed to get report status', error);
      throw error;
    }
  }

  /**
   * List available reports for a symbol
   */
  async listReports(symbol: string, limit: number = 10): Promise<any[]> {
    try {
      // In a full implementation, this would query Supabase
      // For now, return empty array
      return [];
    } catch (error) {
      logError('EnhancedReportsAPI', 'Failed to list reports', error);
      throw error;
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: EnhancedReportRequest): void {
    if (!request.symbol) {
      throw new Error('Symbol is required');
    }

    if (request.symbol.length > 10) {
      throw new Error('Symbol must be 10 characters or less');
    }

    const validReportTypes = ['comprehensive', 'technical', 'fundamental', 'risk'];
    if (request.reportType && !validReportTypes.includes(request.reportType)) {
      throw new Error(`Invalid report type. Must be one of: ${validReportTypes.join(', ')}`);
    }

    const validTimeframes = ['1M', '3M', '6M', '1Y', '2Y'];
    if (request.timeframe && !validTimeframes.includes(request.timeframe)) {
      throw new Error(`Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}`);
    }

    const validFormats = ['pdf', 'pptx', 'json'];
    if (request.outputFormat && !validFormats.includes(request.outputFormat)) {
      throw new Error(`Invalid output format. Must be one of: ${validFormats.join(', ')}`);
    }
  }
}

/**
 * Express.js route handlers for enhanced reports
 */
export const enhancedReportsRoutes = {
  /**
   * POST /api/enhanced-reports/generate
   */
  async generateReport(req: any, res: any): Promise<void> {
    try {
      const api = new EnhancedReportsAPI();
      const result = await api.generateReport(req.body);
      
      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      logError('enhancedReportsRoutes', 'Generate report failed', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        reportId: '',
        metadata: {
          processingTime: 0,
          dataQuality: 0,
          confidence: 0
        }
      });
    }
  },

  /**
   * GET /api/enhanced-reports/:reportId/status
   */
  async getReportStatus(req: any, res: any): Promise<void> {
    try {
      const api = new EnhancedReportsAPI();
      const status = await api.getReportStatus(req.params.reportId);
      res.status(200).json(status);
    } catch (error) {
      logError('enhancedReportsRoutes', 'Get report status failed', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  /**
   * GET /api/enhanced-reports/list/:symbol
   */
  async listReports(req: any, res: any): Promise<void> {
    try {
      const api = new EnhancedReportsAPI();
      const limit = parseInt(req.query.limit) || 10;
      const reports = await api.listReports(req.params.symbol, limit);
      res.status(200).json(reports);
    } catch (error) {
      logError('enhancedReportsRoutes', 'List reports failed', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default EnhancedReportsAPI;
