// src/services/reportApiService.ts
// API service for interacting with serverless report generation endpoints
// Handles both local Express server and Vercel serverless functions

import axios from 'axios';

// Determine API base URL based on environment
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.REACT_APP_SERVERLESS === 'true' ? '/api' : 
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api'));

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds for report generation
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth if needed
apiClient.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export interface ReportGenerationRequest {
  ticker: string;
  template: string;
  title: string;
  author: string;
  outputFormat?: 'pptx' | 'pdf' | 'html';
  reportType?: string;
  dataSources?: string[];
  sections?: string[];
  additionalOptions?: Record<string, any>;
}

export interface ReportGenerationResponse {
  success: boolean;
  generationId?: string;
  reportId?: string;
  companyData?: any;
  slides?: any[];
  metadata?: any;
  downloadInfo?: {
    filename: string;
    format: string;
    generatedAt: string;
  };
  error?: {
    message: string;
    details?: string;
  };
}

export interface ReportListResponse {
  success: boolean;
  reports: Array<{
    id: string;
    filename: string;
    created: string;
    size: number;
    downloadUrl: string;
    ticker?: string;
    title?: string;
    template?: string;
    author?: string;
    status?: string;
    metadata?: any;
  }>;
  total: number;
  timestamp: string;
}

export interface ReportStatusResponse {
  success: boolean;
  reportId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: any;
}

class ReportApiService {
  /**
   * Generate a new report
   */
  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    try {
      // Use the working JavaScript endpoint instead of the broken TypeScript one
      const response = await apiClient.post<ReportGenerationResponse>('/reports/generate-js', request);
      
      // Emit custom event for UI updates
      if (response.data.success) {
        const event = new CustomEvent('reportGenerated', {
          detail: {
            reportId: response.data.generationId || response.data.reportId,
            ticker: request.ticker,
            title: request.title,
            timestamp: new Date().toISOString()
          }
        });
        window.dispatchEvent(event);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to generate report');
    }
  }

  /**
   * List all reports
   */
  async listReports(params?: { limit?: number; ticker?: string }): Promise<ReportListResponse> {
    try {
      const response = await apiClient.get<ReportListResponse>('/reports/list', { params });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to list reports');
    }
  }

  /**
   * Check report generation status
   */
  async getReportStatus(reportId: string): Promise<ReportStatusResponse> {
    try {
      const response = await apiClient.get<ReportStatusResponse>('/reports/status', {
        params: { id: reportId }
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get report status');
    }
  }

  /**
   * Download a report
   */
  async downloadReport(reportId: string): Promise<Blob | any> {
    try {
      const response = await apiClient.get(`/reports/download`, {
        params: { id: reportId },
        responseType: 'blob'
      });
      
      // Check if response is JSON (for serverless data response)
      if (response.headers['content-type']?.includes('application/json')) {
        // Convert blob to JSON
        const text = await response.data.text();
        return JSON.parse(text);
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to download report');
    }
  }

  /**
   * Cancel report generation
   */
  async cancelReport(reportId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/reports/cancel', { id: reportId });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to cancel report');
    }
  }

  /**
   * Poll for report completion
   */
  async pollReportStatus(
    reportId: string,
    onProgress?: (progress: number) => void,
    maxAttempts: number = 60,
    interval: number = 1000
  ): Promise<ReportStatusResponse> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const status = await this.getReportStatus(reportId);
      
      if (onProgress && status.progress !== undefined) {
        onProgress(status.progress);
      }
      
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        return status;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
      attempts++;
    }
    
    throw new Error('Report generation timed out');
  }
}

// Export singleton instance
export const reportApiService = new ReportApiService();

// Export types
export type { ReportApiService };