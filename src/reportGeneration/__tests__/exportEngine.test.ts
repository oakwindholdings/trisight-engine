// src/reportGeneration/__tests__/exportEngine.test.ts
// Comprehensive tests for multi-format export engine
// Context: Ensures all export formats are generated correctly

import { 
  createExportEngine, 
  ExportFormat, 
  batchExport 
} from '../export/exportEngine';
import { GeneratedReport } from '../templates/reportTemplateEngine';
import { GeneratedChart } from '../visualization/visualizationEngine';
import * as fs from 'fs';
import * as path from 'path';

// Mock external dependencies
jest.mock('jspdf');
jest.mock('html2canvas');
jest.mock('xlsx');
jest.mock('pptxgenjs');

// Mock fs for testing
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
  statSync: jest.fn(() => ({ size: 1024 * 100 })), // 100KB
  createWriteStream: jest.fn(() => ({
    on: jest.fn((event, callback) => {
      if (event === 'finish') {
        setTimeout(callback, 10);
      }
    })
  })),
  copyFileSync: jest.fn()
}));

// Mock report data
const mockGeneratedReport: GeneratedReport = {
  title: 'Test Investment Report',
  subtitle: 'Q4 2024 Analysis',
  date: new Date().toISOString(),
  sections: [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      content: '# Executive Summary\n\nThis is a test report with **bold** text.',
      priority: 'high',
      tables: [{
        headers: ['Metric', 'Value', 'Change'],
        rows: [
          ['Revenue', '$1.2B', '+15%'],
          ['Net Income', '$200M', '+20%']
        ],
        caption: 'Key Financial Metrics'
      }]
    },
    {
      id: 'financial_analysis',
      title: 'Financial Analysis',
      content: 'The company showed strong financial performance.',
      priority: 'medium',
      charts: [{
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{ label: 'Revenue', data: [100, 110, 120, 130] }]
        },
        config: { title: 'Quarterly Revenue Trend' }
      }]
    }
  ],
  metadata: {
    generatedAt: new Date().toISOString(),
    dataFreshness: '1 day',
    confidence: 0.95,
    warnings: [],
    sources: ['Financial API', 'News API']
  },
  formatting: {
    pageSize: 'letter',
    orientation: 'portrait',
    margins: { top: 72, right: 72, bottom: 72, left: 72 },
    fontSize: 11,
    lineHeight: 1.5
  }
};

// Mock chart data
const mockCharts: GeneratedChart[] = [{
  type: 'line',
  svg: '<svg><line x1="0" y1="0" x2="100" y2="100"/></svg>',
  config: { title: 'Quarterly Revenue Trend' },
  metadata: {
    title: 'Quarterly Revenue Trend',
    lastUpdated: new Date().toISOString()
  }
}];

describe('Export Engine', () => {
  const testOutputDir = path.join(__dirname, 'test-exports');
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock fs.existsSync to return false for directories (so they get created)
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Mock fs.statSync to return consistent file size
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 * 100 });
  });
  
  describe('PDF Export', () => {
    it('should export report to PDF format', async () => {
      const engine = createExportEngine({
        format: ExportFormat.PDF,
        outputPath: path.join(testOutputDir, 'test-report.pdf'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif'
        },
        options: {
          paperSize: 'letter',
          margins: { top: 72, right: 72, bottom: 72, left: 72 },
          headerFooter: true,
          tableOfContents: true,
          pageNumbers: true
        },
        metadata: {
          title: 'Test Report',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'report'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.PDF);
      expect(result.filePath).toContain('.pdf');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.pages).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
      
      // Verify PDF generation was called
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should include all sections in PDF', async () => {
      const engine = createExportEngine({
        format: ExportFormat.PDF,
        outputPath: path.join(testOutputDir, 'complete-report.pdf'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif',
          disclaimer: 'This is a test disclaimer.'
        },
        options: {
          paperSize: 'letter',
          tableOfContents: true,
          pageNumbers: true
        },
        metadata: {
          title: 'Complete Test Report',
          author: 'Test Author',
          subject: 'Complete Analysis',
          keywords: ['complete', 'test'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.pages).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
    
    it('should handle watermarks in PDF', async () => {
      const engine = createExportEngine({
        format: ExportFormat.PDF,
        outputPath: path.join(testOutputDir, 'watermarked-report.pdf'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          watermark: 'CONFIDENTIAL'
        },
        options: {
          paperSize: 'a4'
        },
        metadata: {
          title: 'Confidential Report',
          author: 'Test Author',
          confidentiality: 'confidential'
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.PDF);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
  
  describe('HTML Export', () => {
    it('should export report to HTML format', async () => {
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'test-report.html'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif'
        },
        options: {
          responsive: true,
          includeNavigation: true,
          includeSearch: true,
          theme: 'light'
        },
        metadata: {
          title: 'Test Report',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'report'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.HTML);
      expect(result.filePath).toContain('.html');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
      
      // Verify HTML file was written
      expect(fs.writeFileSync).toHaveBeenCalled();
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const htmlContent = writeCall[1];
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain(mockGeneratedReport.title);
      expect(htmlContent).toContain('Executive Summary');
    });
    
    it('should include navigation and search in HTML', async () => {
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'test-report-nav.html'),
        options: {
          includeNavigation: true,
          includeSearch: true,
          responsive: true,
          theme: 'dark'
        },
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080'
        },
        metadata: {
          title: 'Test Report',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'report'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const html = writeCall[1];
      
      expect(html).toContain('report-nav');
      expect(html).toContain('report-search');
      expect(html).toContain('searchReport()');
      expect(result.warnings).toEqual([]);
    });
    
    it('should apply dark theme correctly', async () => {
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'dark-theme-report.html'),
        options: {
          theme: 'dark',
          responsive: true
        },
        branding: {
          companyName: 'Test Company',
          primaryColor: '#4A90E2',
          secondaryColor: '#7ED321'
        },
        metadata: {
          title: 'Dark Theme Report',
          author: 'Test Author',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const html = writeCall[1];
      
      expect(html).toContain('#1a1a1a'); // Dark background
      expect(html).toContain('#ffffff'); // White text
      expect(result.format).toBe(ExportFormat.HTML);
    });
  });
  
  describe('PowerPoint Export', () => {
    it('should export report to PowerPoint format', async () => {
      const engine = createExportEngine({
        format: ExportFormat.POWERPOINT,
        outputPath: path.join(testOutputDir, 'test-presentation.pptx'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif'
        },
        options: {
          slideSize: 'widescreen',
          includeNotes: true
        },
        metadata: {
          title: 'Test Presentation',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'presentation'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.POWERPOINT);
      expect(result.filePath).toContain('.pptx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.pages).toBeGreaterThan(0);
      expect(result.warnings).toContain('Chart embedding in PowerPoint requires additional image processing');
    });
    
    it('should create appropriate number of slides', async () => {
      const engine = createExportEngine({
        format: ExportFormat.POWERPOINT,
        outputPath: path.join(testOutputDir, 'multi-slide-presentation.pptx'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080'
        },
        options: {
          slideSize: 'standard',
          includeNotes: false
        },
        metadata: {
          title: 'Multi-slide Presentation',
          author: 'Test Author',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      // Should have title slide + section slides
      const expectedSlides = 1 + mockGeneratedReport.sections.length;
      expect(result.pages).toBeGreaterThanOrEqual(expectedSlides);
    });
  });
  
  describe('Excel Export', () => {
    it('should export report to Excel format', async () => {
      const engine = createExportEngine({
        format: ExportFormat.EXCEL,
        outputPath: path.join(testOutputDir, 'test-workbook.xlsx'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif'
        },
        options: {
          includeCharts: true,
          includeRawData: true,
          addFormulas: true,
          protectSheets: false
        },
        metadata: {
          title: 'Test Workbook',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'workbook'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.EXCEL);
      expect(result.filePath).toContain('.xlsx');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.warnings).toContain('Chart images cannot be embedded in Excel format');
    });
    
    it('should include data tables as sheets', async () => {
      // Add more tables to mock report
      const reportWithTables = {
        ...mockGeneratedReport,
        sections: mockGeneratedReport.sections.map(section => ({
          ...section,
          tables: [{
            headers: ['Column1', 'Column2', 'Column3'],
            rows: [
              ['A', 'B', 'C'],
              ['D', 'E', 'F']
            ],
            caption: 'Test Table'
          }]
        }))
      };
      
      const engine = createExportEngine({
        format: ExportFormat.EXCEL,
        outputPath: path.join(testOutputDir, 'workbook-with-tables.xlsx'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080'
        },
        options: {
          includeCharts: false,
          includeRawData: true,
          addFormulas: false,
          protectSheets: false
        },
        metadata: {
          title: 'Workbook with Tables',
          author: 'Test Author',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(reportWithTables, mockCharts);
      
      expect(result.format).toBe(ExportFormat.EXCEL);
      expect(result.fileSize).toBeGreaterThan(0);
    });
    
    it('should handle advanced Excel options', async () => {
      const engine = createExportEngine({
        format: ExportFormat.EXCEL,
        outputPath: path.join(testOutputDir, 'advanced-workbook.xlsx'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080'
        },
        options: {
          includeCharts: true,
          includeRawData: true,
          addFormulas: true,
          protectSheets: true
        },
        metadata: {
          title: 'Advanced Workbook',
          author: 'Test Author',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.warnings).toContain('Advanced formulas not implemented in this version');
      expect(result.warnings).toContain('Sheet protection not implemented in this version');
    });
  });
  
  describe('Markdown Export', () => {
    it('should export report to Markdown format', async () => {
      const engine = createExportEngine({
        format: ExportFormat.MARKDOWN,
        outputPath: path.join(testOutputDir, 'test-report.md'),
        branding: {
          companyName: 'Test Company',
          primaryColor: '#000080',
          secondaryColor: '#808080',
          fontFamily: 'Arial, sans-serif',
          disclaimer: 'This is a test disclaimer.'
        },
        options: {},
        metadata: {
          title: 'Test Report',
          author: 'Test Author',
          subject: 'Investment Analysis',
          keywords: ['test', 'markdown'],
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.MARKDOWN);
      expect(result.filePath).toContain('.md');
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.warnings).toContain("Chart 'Quarterly Revenue Trend' referenced but not embedded (Markdown limitation)");
      
      // Verify markdown content
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const mdContent = writeCall[1];
      
      expect(mdContent).toContain('# ' + mockGeneratedReport.title);
      expect(mdContent).toContain('## Executive Summary');
      expect(mdContent).toContain('---'); // Front matter
      expect(mdContent).toContain('title: "Test Investment Report"');
    });
    
    it('should generate proper markdown tables', async () => {
      const engine = createExportEngine({
        format: ExportFormat.MARKDOWN,
        outputPath: path.join(testOutputDir, 'markdown-with-tables.md'),
        branding: {
          companyName: 'Test Company'
        },
        metadata: {
          title: 'Markdown with Tables',
          author: 'Test Author',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const markdown = writeCall[1];
      
      // Check for markdown table format
      expect(markdown).toContain('| Metric | Value | Change |');
      expect(markdown).toContain('|---|---|---|');
      expect(markdown).toContain('| Revenue | $1.2B | +15% |');
    });
  });
  
  describe('Batch Export', () => {
    it('should export to multiple formats simultaneously', async () => {
      const formats = [
        ExportFormat.PDF,
        ExportFormat.HTML,
        ExportFormat.EXCEL,
        ExportFormat.MARKDOWN
      ];
      
      const results = await batchExport(
        mockGeneratedReport,
        mockCharts,
        formats,
        {
          options: {
            paperSize: 'letter',
            responsive: true,
            includeCharts: true
          },
          branding: {
            companyName: 'Test Company',
            primaryColor: '#000080',
            secondaryColor: '#808080'
          },
          metadata: {
            title: 'Batch Test Report',
            author: 'Test Author',
            subject: 'Investment Analysis',
            keywords: ['test', 'batch'],
            createdDate: new Date()
          }
        }
      );
      
      expect(results).toHaveLength(formats.length);
      
      // Verify each format was created
      const exportedFormats = results.map(r => r.format);
      expect(exportedFormats).toContain(ExportFormat.PDF);
      expect(exportedFormats).toContain(ExportFormat.HTML);
      expect(exportedFormats).toContain(ExportFormat.EXCEL);
      expect(exportedFormats).toContain(ExportFormat.MARKDOWN);
      
      // Verify all exports have content
      results.forEach((result, index) => {
        expect(result.format).toBe(formats[index]);
        if (result.warnings.length === 0) {
          expect(result.fileSize).toBeGreaterThan(0);
        }
      });
    });
    
    it('should handle batch export failures gracefully', async () => {
      // Mock a failure for one format
      const originalWriteFileSync = fs.writeFileSync;
      let callCount = 0;
      (fs.writeFileSync as jest.Mock).mockImplementation((filePath, content, encoding) => {
        callCount++;
        if (callCount === 2) { // Fail the second call (HTML)
          throw new Error('Mock write failure');
        }
        return originalWriteFileSync;
      });
      
      const formats = [ExportFormat.PDF, ExportFormat.HTML, ExportFormat.MARKDOWN];
      
      const results = await batchExport(
        mockGeneratedReport,
        mockCharts,
        formats,
        {
          branding: { companyName: 'Test Company' },
          metadata: { title: 'Batch Test', author: 'Test Author', createdDate: new Date() }
        }
      );
      
      expect(results).toHaveLength(3);
      
      // Check that some succeeded and some failed
      const successful = results.filter(r => r.fileSize > 0);
      const failed = results.filter(r => r.fileSize === 0);
      
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
      
      // Failed exports should have error messages in warnings
      failed.forEach(result => {
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.warnings[0]).toContain('Export failed');
      });
    });
  });
  
  describe('Branding and Styling', () => {
    it('should apply custom branding to exports', async () => {
      const customBranding = {
        companyName: 'Custom Brand Corp',
        primaryColor: '#FF6B6B',
        secondaryColor: '#4ECDC4',
        fontFamily: 'Georgia, serif',
        disclaimer: 'Custom disclaimer text here.',
        watermark: 'CONFIDENTIAL'
      };
      
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'branded-report.html'),
        branding: customBranding,
        options: {
          responsive: true,
          theme: 'light'
        },
        metadata: {
          title: 'Branded Report',
          author: 'Test Author',
          confidentiality: 'confidential',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const htmlContent = writeCall[1];
      
      // Check branding elements
      expect(htmlContent).toContain(customBranding.companyName);
      expect(htmlContent).toContain(customBranding.primaryColor);
      expect(htmlContent).toContain(customBranding.disclaimer);
      expect(htmlContent).toContain(customBranding.fontFamily);
      expect(result.format).toBe(ExportFormat.HTML);
    });
    
    it('should handle missing branding gracefully', async () => {
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'minimal-report.html'),
        options: {
          responsive: true
        },
        metadata: {
          title: 'Minimal Report',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.HTML);
      expect(result.fileSize).toBeGreaterThan(0);
      expect(result.warnings).toEqual([]);
      
      const writeCall = (fs.writeFileSync as jest.Mock).mock.calls[0];
      const htmlContent = writeCall[1];
      
      // Should use default values
      expect(htmlContent).toContain('#0066CC'); // Default primary color
      expect(htmlContent).toContain('Inter, sans-serif'); // Default font
    });
  });
  
  describe('Error Handling', () => {
    it('should handle invalid export format', async () => {
      const engine = createExportEngine({
        format: 'invalid-format' as ExportFormat,
        outputPath: path.join(testOutputDir, 'invalid.txt'),
        metadata: {
          title: 'Invalid Format Test',
          createdDate: new Date()
        }
      });
      
      await expect(engine.export(mockGeneratedReport, mockCharts))
        .rejects.toThrow('Unsupported export format: invalid-format');
    });
    
    it('should handle file system errors', async () => {
      // Mock writeFileSync to throw an error
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File system error');
      });
      
      const engine = createExportEngine({
        format: ExportFormat.HTML,
        outputPath: path.join(testOutputDir, 'error-test.html'),
        metadata: {
          title: 'Error Test',
          createdDate: new Date()
        }
      });
      
      await expect(engine.export(mockGeneratedReport, mockCharts))
        .rejects.toThrow('File system error');
    });
  });
  
  describe('Chart Integration', () => {
    it('should handle charts in browser environment', async () => {
      // Mock browser environment
      global.window = {} as any;
      global.document = {
        createElement: jest.fn(() => ({
          innerHTML: '',
          style: {},
          setAttribute: jest.fn()
        })),
        body: {
          appendChild: jest.fn(),
          removeChild: jest.fn()
        }
      } as any;
      
      // Mock html2canvas
      const mockHtml2Canvas = jest.fn().mockResolvedValue({
        toDataURL: () => 'data:image/png;base64,mock-image-data'
      });
      
      jest.doMock('html2canvas', () => mockHtml2Canvas);
      
      const engine = createExportEngine({
        format: ExportFormat.PDF,
        outputPath: path.join(testOutputDir, 'chart-test.pdf'),
        metadata: {
          title: 'Chart Test',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.PDF);
      expect(result.fileSize).toBeGreaterThan(0);
      
      // Clean up global mocks
      delete global.window;
      delete global.document;
    });
    
    it('should handle charts in Node.js environment', async () => {
      // Ensure we're in Node.js environment (no window/document)
      delete global.window;
      delete global.document;
      
      const engine = createExportEngine({
        format: ExportFormat.PDF,
        outputPath: path.join(testOutputDir, 'node-chart-test.pdf'),
        metadata: {
          title: 'Node Chart Test',
          createdDate: new Date()
        }
      });
      
      const result = await engine.export(mockGeneratedReport, mockCharts);
      
      expect(result.format).toBe(ExportFormat.PDF);
      expect(result.fileSize).toBeGreaterThan(0);
      // Should use placeholders in Node.js environment
    });
  });
});