// src/reportGeneration/__tests__/reportTemplateEngine.test.ts
// Comprehensive tests for report template engine
// Context: Ensures report generation produces correct, complete documents

import { createReportTemplateEngine, ReportType, ReportStyle } from '../templates/reportTemplateEngine';
import { mockCompanyData, mockAnalysisResults } from '../__mocks__/reportMocks';

describe('Report Template Engine', () => {
  describe('Report Generation', () => {
    it('should generate complete equity research report', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH,
        style: ReportStyle.INSTITUTIONAL
      });
      
      const report = await engine.generateReport(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(report.title).toContain('Equity Research Report');
      expect(report.sections.length).toBeGreaterThanOrEqual(5);
      
      // Verify required sections
      const sectionIds = report.sections.map(s => s.id);
      expect(sectionIds).toContain('executive_summary');
      expect(sectionIds).toContain('financial_analysis');
      expect(sectionIds).toContain('valuation_analysis');
    });
    
    it('should adapt content based on analysis results', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH
      });
      
      // Test with bullish data
      const bullishAnalysis = {
        ...mockAnalysisResults,
        composite: { overall: 85, recommendation: 'strongBuy' },
        growth: { revenueGrowth: 0.25 }
      };
      
      const bullishReport = await engine.generateReport(
        mockCompanyData,
        bullishAnalysis
      );
      
      const execSummary = bullishReport.sections.find(s => s.id === 'executive_summary');
      expect(execSummary?.content).toContain('compelling investment opportunity');
      
      // Test with bearish data
      const bearishAnalysis = {
        ...mockAnalysisResults,
        composite: { overall: 25, recommendation: 'sell' },
        growth: { revenueGrowth: -0.15 }
      };
      
      const bearishReport = await engine.generateReport(
        mockCompanyData,
        bearishAnalysis
      );
      
      const bearishSummary = bearishReport.sections.find(s => s.id === 'executive_summary');
      expect(bearishSummary?.content).toContain('faces significant headwinds');
    });
    
    it('should include conditional sections based on data availability', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH
      });
      
      // Test with pattern data
      const withPatterns = {
        ...mockAnalysisResults,
        patterns: {
          patterns: [{ type: 'channel', confidence: 80 }],
          analysis: { bias: 'bullish' }
        }
      };
      
      const reportWithPatterns = await engine.generateReport(
        mockCompanyData,
        withPatterns
      );
      
      expect(reportWithPatterns.sections.some(s => s.id === 'technical_analysis')).toBe(true);
      
      // Test without pattern data
      const withoutPatterns = {
        ...mockAnalysisResults,
        patterns: undefined
      };
      
      const reportWithoutPatterns = await engine.generateReport(
        mockCompanyData,
        withoutPatterns
      );
      
      expect(reportWithoutPatterns.sections.some(s => s.id === 'technical_analysis')).toBe(false);
    });
  });
  
  describe('Content Formatting', () => {
    it('should format financial values correctly', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.QUICK_TAKE
      });
      
      const report = await engine.generateReport(
        mockCompanyData,
        mockAnalysisResults
      );
      
      const financialSection = report.sections.find(s => s.id === 'financial_analysis');
      
      // Check currency formatting
      expect(financialSection?.content).toMatch(/\$[\d,]+\.?\d*[BMK]?/);
      
      // Check percentage formatting
      expect(financialSection?.content).toMatch(/\d+\.?\d*%/);
    });
    
    it('should generate appropriate charts for sections', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH
      });
      
      const report = await engine.generateReport(
        mockCompanyData,
        mockAnalysisResults
      );
      
      const financialSection = report.sections.find(s => s.id === 'financial_analysis');
      expect(financialSection?.charts?.length).toBeGreaterThan(0);
      
      const revenueChart = financialSection?.charts?.find(c => c.config.title.includes('Revenue'));
      expect(revenueChart).toBeDefined();
      expect(revenueChart?.type).toBe('line');
    });
  });
  
  describe('Multi-Language Support', () => {
    it('should generate report in specified language', async () => {
      // This would be implemented with proper i18n
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH,
        language: 'es'
      });
      
      // For now, just verify the config is set
      expect(engine['config'].language).toBe('es');
    });
  });
  
  describe('Report Metadata', () => {
    it('should include accurate metadata', async () => {
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH,
        includeMetadata: true
      });
      
      const report = await engine.generateReport(
        mockCompanyData,
        mockAnalysisResults
      );
      
      expect(report.metadata).toBeDefined();
      expect(report.metadata.generatedAt).toBeDefined();
      expect(report.metadata.sources.length).toBeGreaterThan(0);
      expect(report.metadata.confidence).toBeGreaterThan(0.5);
    });
    
    it('should include warnings for stale data', async () => {
      const staleData = {
        ...mockCompanyData,
        financials: {
          ...mockCompanyData.financials,
          historicalPrices: [{
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days old
            close: 100
          }]
        }
      };
      
      const engine = createReportTemplateEngine({
        reportType: ReportType.EQUITY_RESEARCH
      });
      
      const report = await engine.generateReport(staleData, mockAnalysisResults);
      
      expect(report.metadata.warnings).toContain(expect.stringContaining('days old'));
    });
  });
});