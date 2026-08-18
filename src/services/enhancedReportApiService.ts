// src/services/enhancedReportApiService.ts
// Enhanced API service for superior report generation
// Context: Provides enhanced reporting capabilities to the UI

import axios from 'axios';
import { logDebug, logError } from '../utils/logger';

// Determine API base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.REACT_APP_SERVERLESS === 'true' ? '/api' : 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api'));

// Create axios instance with enhanced configuration
const enhancedApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for enhanced report generation
  headers: {
    'Content-Type': 'application/json',
    'X-Enhanced-Reports': 'true'
  }
});

// Add request interceptor for enhanced features
enhancedApiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add enhanced reporting headers
  config.headers['X-Report-Version'] = '3.0-enhanced';
  config.headers['X-Client-Timestamp'] = new Date().toISOString();
  
  return config;
});

// Add response interceptor for enhanced error handling
enhancedApiClient.interceptors.response.use(
  (response) => {
    // Log enhanced report metadata
    if (response.data?.metadata?.enhancedFeatures) {
      logDebug('EnhancedReportAPI', 'Enhanced features used:', response.data.metadata.enhancedFeatures);
    }
    return response;
  },
  (error) => {
    logError('EnhancedReportAPI', 'Enhanced API Error:', error.response?.data || error.message);
    throw error;
  }
);

export interface EnhancedReportGenerationRequest {
  ticker: string;
  template: string;
  title: string;
  author: string;
  outputFormat?: 'pptx' | 'pdf' | 'json';
  reportType?: string;
  dataSources?: string[];
  sections?: string[];
  timeframe?: string;
  additionalOptions?: Record<string, any>;
}

export interface EnhancedReportGenerationResponse {
  success: boolean;
  generationId: string;
  reportId: string;
  companyData?: any;
  slides?: any[];
  metadata?: {
    generatedAt: string;
    generationTime: number;
    dataQuality: number;
    confidence: number;
    sources: string[];
    enhancedFeatures: string[];
    aiModel: string;
    version: string;
  };
  outputPath?: string;
  downloadUrl?: string;
  fileSize?: number;
  format?: string;
  error?: {
    message: string;
    code: string;
    details?: string;
  };
}

export interface EnhancedReportCapabilities {
  enhanced: boolean;
  version: string;
  capabilities: {
    dataProviders: Array<{
      name: string;
      features: string[];
    }>;
    reportTypes: string[];
    outputFormats: string[];
    advancedFeatures: string[];
  };
}

export interface EnhancedReportHealth {
  status: string;
  enhanced: boolean;
  services: {
    enhancedReportService: boolean;
    twelveDataUltra: boolean;
    claudeOpus4Max: boolean;
    firecrawl: boolean;
  };
  capabilities: string;
  timestamp: string;
}

/**
 * Enhanced Report API Service
 * Provides superior report generation with advanced AI and data capabilities
 */
class EnhancedReportApiService {
  /**
   * Generate enhanced report with superior quality
   */
  async generateEnhancedReport(request: EnhancedReportGenerationRequest): Promise<EnhancedReportGenerationResponse> {
    try {
      logDebug('EnhancedReportAPI', 'Starting enhanced report generation:', {
        ticker: request.ticker,
        template: request.template,
        outputFormat: request.outputFormat
      });

      const response = await enhancedApiClient.post<EnhancedReportGenerationResponse>(
        '/enhanced-reports/generate', 
        request
      );
      
      // Emit custom event for UI updates
      if (response.data.success) {
        const event = new CustomEvent('enhancedReportGenerated', {
          detail: {
            reportId: response.data.generationId || response.data.reportId,
            ticker: request.ticker,
            title: request.title,
            timestamp: new Date().toISOString(),
            enhanced: true,
            dataQuality: response.data.metadata?.dataQuality,
            confidence: response.data.metadata?.confidence
          }
        });
        window.dispatchEvent(event);
        
        // Also emit the standard event for compatibility
        const standardEvent = new CustomEvent('reportGenerated', {
          detail: {
            reportId: response.data.generationId || response.data.reportId,
            ticker: request.ticker,
            title: request.title,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(standardEvent);
      }
      
      logDebug('EnhancedReportAPI', 'Enhanced report generated successfully:', {
        reportId: response.data.reportId,
        dataQuality: response.data.metadata?.dataQuality,
        confidence: response.data.metadata?.confidence
      });
      
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Enhanced report generation failed:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to generate enhanced report');
    }
  }

  /**
   * Get enhanced report status
   */
  async getEnhancedReportStatus(generationId: string): Promise<any> {
    try {
      const response = await enhancedApiClient.get(`/enhanced-reports/status/${generationId}`);
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Failed to get enhanced report status:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get enhanced report status');
    }
  }

  /**
   * Cancel enhanced report generation
   */
  async cancelEnhancedReport(generationId: string): Promise<any> {
    try {
      const response = await enhancedApiClient.post(`/enhanced-reports/cancel/${generationId}`);
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Failed to cancel enhanced report:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to cancel enhanced report');
    }
  }

  /**
   * List enhanced reports
   */
  async listEnhancedReports(): Promise<any> {
    try {
      const response = await enhancedApiClient.get('/enhanced-reports/list');
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Failed to list enhanced reports:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to list enhanced reports');
    }
  }

  /**
   * Get enhanced reporting capabilities
   */
  async getEnhancedCapabilities(): Promise<EnhancedReportCapabilities> {
    try {
      const response = await enhancedApiClient.get<EnhancedReportCapabilities>('/enhanced-reports/capabilities');
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Failed to get enhanced capabilities:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to get enhanced capabilities');
    }
  }

  /**
   * Check enhanced reporting health
   */
  async checkEnhancedHealth(): Promise<EnhancedReportHealth> {
    try {
      const response = await enhancedApiClient.get<EnhancedReportHealth>('/enhanced-reports/health');
      return response.data;
    } catch (error: any) {
      logError('EnhancedReportAPI', 'Failed to check enhanced health:', error);
      throw new Error(error.response?.data?.error?.message || 'Failed to check enhanced health');
    }
  }

  /**
   * Check if enhanced reporting is available
   */
  async isEnhancedAvailable(): Promise<boolean> {
    try {
      const health = await this.checkEnhancedHealth();
      return health.enhanced && health.status === 'healthy';
    } catch (error) {
      logError('EnhancedReportAPI', 'Enhanced reporting not available:', error);
      return false;
    }
  }

  /**
   * Get enhanced report download URL
   */
  getEnhancedDownloadUrl(filename: string): string {
    return `${API_BASE_URL.replace('/api', '')}/generated-reports/${filename}`;
  }

  /**
   * Fallback to standard report generation if enhanced is not available
   */
  async generateReportWithFallback(request: EnhancedReportGenerationRequest): Promise<EnhancedReportGenerationResponse> {
    try {
      // First try enhanced generation
      return await this.generateEnhancedReport(request);
    } catch (error) {
      logError('EnhancedReportAPI', 'Enhanced generation failed, falling back to standard:', error);
      
      // Fallback to standard report generation
      const { ReportApiService } = await import('./reportApiService');
      const standardService = new ReportApiService();
      
      const standardRequest = {
        ticker: request.ticker,
        template: request.template,
        title: request.title,
        author: request.author,
        outputFormat: request.outputFormat,
        reportType: request.reportType,
        dataSources: request.dataSources,
        sections: request.sections,
        additionalOptions: request.additionalOptions
      };
      
      const standardResponse = await standardService.generateReport(standardRequest);
      
      // Map standard response to enhanced format
      return {
        success: standardResponse.success,
        generationId: standardResponse.generationId || standardResponse.reportId || '',
        reportId: standardResponse.reportId || standardResponse.generationId || '',
        companyData: standardResponse.companyData,
        slides: standardResponse.slides,
        metadata: {
          generatedAt: new Date().toISOString(),
          generationTime: standardResponse.metadata?.generationTime || 0,
          dataQuality: 70, // Standard quality
          confidence: 0.7, // Standard confidence
          sources: ['TwelveData Basic', 'Standard Analytics'],
          enhancedFeatures: [],
          aiModel: 'standard',
          version: '2.0-standard'
        },
        outputPath: standardResponse.outputPath,
        downloadUrl: standardResponse.downloadUrl,
        fileSize: standardResponse.fileSize,
        format: standardResponse.format,
        error: standardResponse.error ? { code: 'UNKNOWN', ...standardResponse.error } : undefined
      };
    }
  }
}

// Singleton instance
let enhancedInstance: EnhancedReportApiService | null = null;

/**
 * Get enhanced report API service instance
 */
export function getEnhancedReportApiService(): EnhancedReportApiService {
  if (!enhancedInstance) {
    enhancedInstance = new EnhancedReportApiService();
  }
  return enhancedInstance;
}

export default EnhancedReportApiService;
