// src/reportGeneration/examples/exportExample.ts  
// Demonstrates multi-format export capabilities
// Context: Shows how to export reports in various formats

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { createReportTemplateEngine, ReportType, ReportStyle } from '../templates/reportTemplateEngine';
import { createVisualizationEngine, ChartTheme } from '../visualization/visualizationEngine';
import { 
  createExportEngine,
  ExportFormat,
  batchExport
} from '../export/exportEngine';
import * as path from 'path';
import * as fs from 'fs';

async function demonstrateExportSystem() {
  console.log('=== TriSight Multi-Format Export Demo ===\n');
  
  try {
    // Output directory
    const outputDir = path.join(__dirname, 'output', 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Step 1: Generate a complete report
    console.log('Generating sample report for export...');
    
    // Fetch data
    const fetcher = createDataFetcher({ ticker: 'AAPL' });
    const rawData = await fetcher.fetchAll('AAPL');
    
    // Process data
    const processor = createDataProcessor();
    const { companyData, analysis } = await processor.processData(rawData);
    
    // Generate report
    const templateEngine = createReportTemplateEngine({
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL
    });
    
    const report = await templateEngine.generateReport(companyData, analysis);
    
    // Generate charts
    const vizEngine = createVisualizationEngine({
      theme: ChartTheme.INSTITUTIONAL
    });
    
    const charts = [];
    for (const section of report.sections) {
      if (section.charts) {
        for (const chartSpec of section.charts) {
          const chart = await vizEngine.generateChart(chartSpec);
          charts.push(chart);
        }
      }
    }
    
    console.log('✓ Report generated with', charts.length, 'charts\n');
    
    // Step 2: Export to different formats
    const exportConfig = {
      branding: {
        companyName: 'TriSight Capital Research',
        primaryColor: '#0066CC',
        secondaryColor: '#666666',
        fontFamily: 'Inter, sans-serif',
        disclaimer: 'This report is for informational purposes only and does not constitute investment advice.'
      },
      metadata: {
        title: `${companyData.ticker} Investment Analysis`,
        author: 'TriSight Research Team',
        subject: `Comprehensive analysis of ${companyData.profile.name}`,
        keywords: ['equity research', companyData.ticker, companyData.profile.industry],
        createdDate: new Date(),
        confidentiality: 'internal' as const
      }
    };
    
    // 2a. PDF Export (Professional Document)
    console.log('1. EXPORTING TO PDF');
    console.log('─'.repeat(40));
    
    const pdfEngine = createExportEngine({
      format: ExportFormat.PDF,
      outputPath: path.join(outputDir, `${companyData.ticker}_Research_Report.pdf`),
      options: {
        paperSize: 'letter',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        headerFooter: true,
        tableOfContents: true,
        pageNumbers: true
      },
      ...exportConfig
    });
    
    const pdfResult = await pdfEngine.export(report, charts);
    console.log(`✓ PDF exported: ${path.basename(pdfResult.filePath)}`);
    console.log(`  Size: ${(pdfResult.fileSize / 1024).toFixed(1)} KB`);
    if (pdfResult.pages) {
      console.log(`  Pages: ${pdfResult.pages}`);
    }
    
    // 2b. HTML Export (Interactive Web Report)
    console.log('\n2. EXPORTING TO HTML');
    console.log('─'.repeat(40));
    
    const htmlEngine = createExportEngine({
      format: ExportFormat.HTML,
      outputPath: path.join(outputDir, `${companyData.ticker}_Interactive_Report.html`),
      options: {
        responsive: true,
        includeNavigation: true,
        includeSearch: true,
        theme: 'light'
      },
      ...exportConfig
    });
    
    const htmlResult = await htmlEngine.export(report, charts);
    console.log(`✓ HTML exported: ${path.basename(htmlResult.filePath)}`);
    console.log(`  Size: ${(htmlResult.fileSize / 1024).toFixed(1)} KB`);
    console.log('  Features: Navigation, Search, Responsive Design');
    
    // 2c. PowerPoint Export (Presentation)
    console.log('\n3. EXPORTING TO POWERPOINT');
    console.log('─'.repeat(40));
    
    const pptxEngine = createExportEngine({
      format: ExportFormat.POWERPOINT,
      outputPath: path.join(outputDir, `${companyData.ticker}_Presentation.pptx`),
      options: {
        slideSize: 'widescreen',
        includeNotes: true
      },
      ...exportConfig
    });
    
    const pptxResult = await pptxEngine.export(report, charts);
    console.log(`✓ PowerPoint exported: ${path.basename(pptxResult.filePath)}`);
    console.log(`  Size: ${(pptxResult.fileSize / 1024).toFixed(1)} KB`);
    console.log(`  Slides: ${pptxResult.pages || 'N/A'}`);
    
    // 2d. Excel Export (Data Workbook)
    console.log('\n4. EXPORTING TO EXCEL');
    console.log('─'.repeat(40));
    
    const excelEngine = createExportEngine({
      format: ExportFormat.EXCEL,
      outputPath: path.join(outputDir, `${companyData.ticker}_Data_Workbook.xlsx`),
      options: {
        includeCharts: true,
        includeRawData: true,
        addFormulas: true,
        protectSheets: false
      },
      ...exportConfig
    });
    
    const excelResult = await excelEngine.export(report, charts);
    console.log(`✓ Excel exported: ${path.basename(excelResult.filePath)}`);
    console.log(`  Size: ${(excelResult.fileSize / 1024).toFixed(1)} KB`);
    console.log('  Contents: Summary, Data Sheets, Charts Reference');
    
    // 2e. Markdown Export (Version Control Friendly)
    console.log('\n5. EXPORTING TO MARKDOWN');
    console.log('─'.repeat(40));
    
    const markdownEngine = createExportEngine({
      format: ExportFormat.MARKDOWN,
      outputPath: path.join(outputDir, `${companyData.ticker}_Report.md`),
      options: {},
      ...exportConfig
    });
    
    const markdownResult = await markdownEngine.export(report, charts);
    console.log(`✓ Markdown exported: ${path.basename(markdownResult.filePath)}`);
    console.log(`  Size: ${(markdownResult.fileSize / 1024).toFixed(1)} KB`);
    if (markdownResult.warnings.length > 0) {
      console.log(`  Note: ${markdownResult.warnings[0]}`);
    }
    
    // Step 3: Demonstrate batch export
    console.log('\n6. BATCH EXPORT (ALL FORMATS)');
    console.log('─'.repeat(40));
    
    const batchFormats = [
      ExportFormat.PDF,
      ExportFormat.HTML,
      ExportFormat.EXCEL
    ];
    
    console.log('Exporting to multiple formats simultaneously...');
    
    const batchResults = await batchExport(
      report,
      charts,
      batchFormats,
      {
        options: {
          paperSize: 'letter',
          responsive: true,
          includeCharts: true
        },
        ...exportConfig
      }
    );
    
    console.log('\nBatch export results:');
    batchResults.forEach(result => {
      const status = result.warnings.length === 0 ? '✓' : '⚠';
      console.log(`  ${status} ${result.format}: ${path.basename(result.filePath)}`);
    });
    
    // Step 4: Custom export scenarios
    console.log('\n7. CUSTOM EXPORT SCENARIOS');
    console.log('─'.repeat(40));
    
    // Dark theme HTML
    console.log('\n  a) Dark Theme HTML Export');
    const darkHtmlEngine = createExportEngine({
      format: ExportFormat.HTML,
      outputPath: path.join(outputDir, `${companyData.ticker}_Dark_Theme.html`),
      options: {
        responsive: true,
        includeNavigation: true,
        theme: 'dark'
      },
      ...exportConfig
    });
    
    await darkHtmlEngine.export(report, charts);
    console.log('  ✓ Dark theme HTML exported');
    
    // Confidential PDF with watermark
    console.log('\n  b) Confidential PDF with Watermark');
    const confidentialPdfEngine = createExportEngine({
      format: ExportFormat.PDF,
      outputPath: path.join(outputDir, `${companyData.ticker}_CONFIDENTIAL.pdf`),
      options: {
        paperSize: 'letter',
        headerFooter: true
      },
      branding: {
        ...exportConfig.branding,
        watermark: 'CONFIDENTIAL - DO NOT DISTRIBUTE'
      },
      metadata: {
        ...exportConfig.metadata,
        confidentiality: 'confidential'
      }
    });
    
    await confidentialPdfEngine.export(report, charts);
    console.log('  ✓ Confidential PDF exported');
    
    // Executive summary only
    console.log('\n  c) Executive Summary Export');
    const execSummaryReport = {
      ...report,
      sections: report.sections.filter(s => s.id === 'executive_summary')
    };
    
    const execSummaryEngine = createExportEngine({
      format: ExportFormat.PDF,
      outputPath: path.join(outputDir, `${companyData.ticker}_Executive_Summary.pdf`),
      options: {
        paperSize: 'letter'
      },
      ...exportConfig,
      metadata: {
        ...exportConfig.metadata,
        title: `${companyData.ticker} Executive Summary`
      }
    });
    
    await execSummaryEngine.export(execSummaryReport, []);
    console.log('  ✓ Executive summary exported');
    
    // Step 5: Export statistics
    console.log('\n8. EXPORT SUMMARY');
    console.log('─'.repeat(40));
    
    const exportedFiles = fs.readdirSync(outputDir);
    const totalSize = exportedFiles.reduce((sum, file) => {
      const stats = fs.statSync(path.join(outputDir, file));
      return sum + stats.size;
    }, 0);
    
    console.log(`Total files exported: ${exportedFiles.length}`);
    console.log(`Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Output directory: ${outputDir}`);
    
    console.log('\nExported files:');
    exportedFiles.forEach(file => {
      const stats = fs.statSync(path.join(outputDir, file));
      console.log(`  - ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });
    
    // Step 6: Format recommendations
    console.log('\n9. FORMAT RECOMMENDATIONS');
    console.log('─'.repeat(40));
    
    console.log('• PDF: Best for formal reports, printing, email attachments');
    console.log('• HTML: Best for web viewing, interactivity, sharing links');
    console.log('• PowerPoint: Best for presentations, board meetings');
    console.log('• Excel: Best for data analysis, financial modeling');
    console.log('• Markdown: Best for version control, documentation');
    
    console.log('\n✅ Multi-format export demonstration complete!');
    
  } catch (error) {
    console.error('❌ Export demonstration failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demonstrateExportSystem()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { demonstrateExportSystem };