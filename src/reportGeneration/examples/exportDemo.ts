// src/reportGeneration/examples/exportDemo.ts
// Demonstrates multi-format export capabilities
// Context: Shows how to export reports to PDF, HTML, PowerPoint, Excel, and Markdown

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { createReportTemplateEngine, ReportType, ReportStyle } from '../templates/reportTemplateEngine';
import { createVisualizationEngine, ChartTheme } from '../visualization/visualizationEngine';
import {
  createExportEngine,
  ExportFormat,
  ExportConfig,
  batchExport
} from '../export/exportEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates exporting a report to all available formats
 */
async function demonstrateMultiFormatExport(ticker: string = 'AAPL') {
  console.log('📤 Multi-Format Export Demo');
  console.log('=' .repeat(50));
  console.log(`Generating and exporting report for ${ticker}\n`);
  
  try {
    // Step 1: Generate a complete report with data and visualizations
    console.log('📊 Generating report...');
    
    // Fetch data
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    // Process data
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true
    });
    const { analysis } = await processor.processData(companyData);
    
    // Generate visualizations
    const vizEngine = createVisualizationEngine({
      theme: ChartTheme.INSTITUTIONAL
    });
    
    const charts = [];
    
    // Revenue trend chart
    const revenueChart = await vizEngine.generateChart({
      type: 'line',
      data: {
        labels: companyData.financials.incomeStatement.slice(0, 8).map(s => s.date),
        datasets: [{
          label: 'Revenue',
          data: companyData.financials.incomeStatement.slice(0, 8).map(s => s.revenue / 1e9),
          color: '#0066CC'
        }]
      },
      config: {
        title: 'Quarterly Revenue Trend',
        subtitle: 'in billions USD'
      }
    });
    charts.push(revenueChart);
    
    // Profitability gauge
    const profitabilityChart = await vizEngine.generateChart({
      type: 'gauge',
      data: {
        value: analysis.composite.overall
      },
      config: {
        title: 'Investment Score',
        min: 0,
        max: 100,
        target: 75
      }
    });
    charts.push(profitabilityChart);
    
    // Generate report
    const reportEngine = createReportTemplateEngine({
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL
    });
    
    const report = await reportEngine.generateReport(companyData, analysis);
    
    console.log('✅ Report generated\n');
    
    // Step 2: Export to different formats
    const outputDir = path.join(__dirname, 'output', 'exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const baseConfig: Omit<ExportConfig, 'format' | 'outputPath'> = {
      options: {
        // PDF options
        paperSize: 'letter',
        headerFooter: true,
        tableOfContents: true,
        pageNumbers: true,
        
        // HTML options
        responsive: true,
        includeNavigation: true,
        includeSearch: true,
        theme: 'light',
        
        // PowerPoint options
        slideSize: 'widescreen',
        includeNotes: true,
        
        // Excel options
        includeCharts: true,
        includeRawData: true,
        addFormulas: true
      },
      branding: {
        companyName: 'TriSight Analytics',
        primaryColor: '#0066CC',
        secondaryColor: '#00A651',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        disclaimer: 'This report is for informational purposes only and does not constitute investment advice.'
      },
      metadata: {
        title: `${ticker} Investment Analysis`,
        author: 'TriSight AI Research Team',
        subject: `Comprehensive analysis of ${ticker} investment opportunity`,
        keywords: ['investment', 'analysis', ticker, 'equity research'],
        createdDate: new Date(),
        confidentiality: 'internal'
      }
    };
    
    // Export to PDF
    console.log('📄 Exporting to PDF...');
    const pdfConfig: ExportConfig = {
      ...baseConfig,
      format: ExportFormat.PDF,
      outputPath: path.join(outputDir, `${ticker}_analysis.pdf`)
    };
    
    const pdfEngine = createExportEngine(pdfConfig);
    const pdfResult = await pdfEngine.export(report, charts);
    
    console.log(`✅ PDF exported: ${pdfResult.filePath}`);
    console.log(`   Size: ${(pdfResult.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Pages: ${pdfResult.pages || 'N/A'}\n`);
    
    // Export to HTML
    console.log('🌐 Exporting to HTML...');
    const htmlConfig: ExportConfig = {
      ...baseConfig,
      format: ExportFormat.HTML,
      outputPath: path.join(outputDir, `${ticker}_analysis.html`)
    };
    
    const htmlEngine = createExportEngine(htmlConfig);
    const htmlResult = await htmlEngine.export(report, charts);
    
    console.log(`✅ HTML exported: ${htmlResult.filePath}`);
    console.log(`   Size: ${(htmlResult.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Features: Navigation, Search, Responsive\n`);
    
    // Export to PowerPoint
    console.log('📊 Exporting to PowerPoint...');
    const pptxConfig: ExportConfig = {
      ...baseConfig,
      format: ExportFormat.POWERPOINT,
      outputPath: path.join(outputDir, `${ticker}_analysis.pptx`)
    };
    
    const pptxEngine = createExportEngine(pptxConfig);
    const pptxResult = await pptxEngine.export(report, charts);
    
    console.log(`✅ PowerPoint exported: ${pptxResult.filePath}`);
    console.log(`   Size: ${(pptxResult.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Slides: ${pptxResult.pages || 'N/A'}\n`);
    
    // Export to Excel
    console.log('📊 Exporting to Excel...');
    const excelConfig: ExportConfig = {
      ...baseConfig,
      format: ExportFormat.EXCEL,
      outputPath: path.join(outputDir, `${ticker}_analysis.xlsx`)
    };
    
    const excelEngine = createExportEngine(excelConfig);
    const excelResult = await excelEngine.export(report, charts);
    
    console.log(`✅ Excel exported: ${excelResult.filePath}`);
    console.log(`   Size: ${(excelResult.fileSize / 1024).toFixed(1)} KB`);
    console.log(`   Sheets: Summary, Data, Charts, Metadata\n`);
    
    // Export to Markdown
    console.log('📝 Exporting to Markdown...');
    const markdownConfig: ExportConfig = {
      ...baseConfig,
      format: ExportFormat.MARKDOWN,
      outputPath: path.join(outputDir, `${ticker}_analysis.md`)
    };
    
    const markdownEngine = createExportEngine(markdownConfig);
    const markdownResult = await markdownEngine.export(report, charts);
    
    console.log(`✅ Markdown exported: ${markdownResult.filePath}`);
    console.log(`   Size: ${(markdownResult.fileSize / 1024).toFixed(1)} KB`);
    if (markdownResult.warnings.length > 0) {
      console.log(`   Notes: ${markdownResult.warnings.join(', ')}\n`);
    }
    
    // Summary
    console.log('📊 Export Summary');
    console.log('─'.repeat(50));
    console.log(`Total formats exported: 5`);
    const totalSize = [pdfResult, htmlResult, pptxResult, excelResult, markdownResult]
      .reduce((sum, r) => sum + r.fileSize, 0);
    console.log(`Total size: ${(totalSize / 1024).toFixed(1)} KB`);
    console.log(`Output directory: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

/**
 * Demonstrates batch export to multiple formats at once
 */
async function demonstrateBatchExport(ticker: string = 'MSFT') {
  console.log('\n🚀 Batch Export Demo');
  console.log('=' .repeat(50));
  console.log(`Batch exporting report for ${ticker}\n`);
  
  try {
    // Generate report (simplified for demo)
    const report = {
      id: `${ticker}-batch-${Date.now()}`,
      title: `${ticker} Quick Analysis`,
      subtitle: 'Batch Export Demonstration',
      date: new Date(),
      sections: [
        {
          id: 'overview',
          title: 'Company Overview',
          content: `${ticker} is a leading technology company with strong fundamentals.`,
          priority: 'high' as const,
          tables: [
            {
              headers: ['Metric', 'Value'],
              rows: [
                ['Market Cap', '$2.8T'],
                ['P/E Ratio', '35.2'],
                ['Revenue Growth', '12.4%']
              ],
              caption: 'Key Metrics'
            }
          ]
        }
      ],
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TriSight Batch Export',
        version: '1.0',
        dataFreshness: 'Real-time',
        confidence: 0.92
      },
      style: ReportStyle.INSTITUTIONAL
    };
    
    // Batch export configuration
    const outputDir = path.join(__dirname, 'output', 'batch-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const baseConfig = {
      options: {
        paperSize: 'letter' as const,
        responsive: true,
        slideSize: 'widescreen' as const,
        includeRawData: true
      },
      branding: {
        companyName: 'TriSight Analytics',
        primaryColor: '#0066CC',
        secondaryColor: '#00A651'
      },
      metadata: {
        title: `${ticker} Batch Export`,
        author: 'TriSight Team',
        subject: 'Batch export demonstration',
        keywords: [ticker, 'batch', 'export'],
        createdDate: new Date()
      }
    };
    
    // Define formats to export
    const formats = [
      ExportFormat.PDF,
      ExportFormat.HTML,
      ExportFormat.POWERPOINT,
      ExportFormat.EXCEL,
      ExportFormat.MARKDOWN
    ];
    
    console.log(`📦 Exporting to ${formats.length} formats simultaneously...`);
    const startTime = Date.now();
    
    // Perform batch export
    const results = await batchExport(
      report,
      [], // No charts for this demo
      formats,
      baseConfig
    );
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ Batch export completed in ${duration}ms\n`);
    
    // Display results
    console.log('Export Results:');
    console.log('─'.repeat(50));
    
    results.forEach(result => {
      const status = result.warnings.length === 0 ? '✅' : '⚠️';
      const size = result.fileSize > 0 ? `${(result.fileSize / 1024).toFixed(1)} KB` : 'Failed';
      console.log(`${status} ${result.format.toUpperCase().padEnd(12)} ${size.padEnd(10)} ${result.warnings.join(', ') || 'Success'}`);
    });
    
    const successCount = results.filter(r => r.warnings.length === 0).length;
    console.log(`\nSuccess rate: ${successCount}/${results.length} formats`);
    
  } catch (error) {
    console.error('❌ Batch export failed:', error);
  }
}

/**
 * Demonstrates theme variations for different audiences
 */
async function demonstrateThemeVariations(ticker: string = 'GOOGL') {
  console.log('\n🎨 Theme Variations Demo');
  console.log('=' .repeat(50));
  console.log(`Exporting ${ticker} report with different themes\n`);
  
  try {
    // Create sample report
    const report = {
      id: `${ticker}-theme-demo`,
      title: `${ticker} Investment Analysis`,
      subtitle: 'Theme Demonstration',
      date: new Date(),
      sections: [
        {
          id: 'summary',
          title: 'Executive Summary',
          content: 'This report demonstrates different visual themes for various audiences.',
          priority: 'high' as const,
          charts: [{
            type: 'bar' as const,
            data: {
              labels: ['Q1', 'Q2', 'Q3', 'Q4'],
              datasets: [{
                label: 'Revenue',
                data: [100, 120, 135, 155]
              }]
            },
            config: { title: 'Quarterly Performance' },
            caption: 'Revenue growth by quarter'
          }]
        }
      ],
      metadata: {
        generatedAt: new Date(),
        generatedBy: 'TriSight Theme Demo',
        version: '1.0',
        dataFreshness: 'Real-time',
        confidence: 0.95
      },
      style: ReportStyle.INSTITUTIONAL
    };
    
    const outputDir = path.join(__dirname, 'output', 'themed-exports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Theme configurations
    const themes = [
      {
        name: 'institutional',
        config: {
          options: { theme: 'light' as const },
          branding: {
            companyName: 'TriSight Institutional Research',
            primaryColor: '#003366',
            secondaryColor: '#0066CC',
            fontFamily: 'Georgia, serif'
          },
          metadata: { confidentiality: 'internal' as const }
        }
      },
      {
        name: 'retail',
        config: {
          options: { theme: 'light' as const },
          branding: {
            companyName: 'TriSight Insights',
            primaryColor: '#2E7D32',
            secondaryColor: '#66BB6A',
            fontFamily: 'Helvetica, sans-serif'
          },
          metadata: { confidentiality: 'public' as const }
        }
      },
      {
        name: 'executive',
        config: {
          options: { theme: 'dark' as const },
          branding: {
            companyName: 'TriSight Executive Analytics',
            primaryColor: '#D32F2F',
            secondaryColor: '#F44336',
            fontFamily: 'Avenir, sans-serif'
          },
          metadata: { confidentiality: 'confidential' as const }
        }
      }
    ];
    
    console.log('🎨 Generating themed exports...\n');
    
    for (const theme of themes) {
      console.log(`📋 ${theme.name.toUpperCase()} Theme`);
      
      // Export HTML with theme
      const htmlConfig: ExportConfig = {
        format: ExportFormat.HTML,
        outputPath: path.join(outputDir, `${ticker}_${theme.name}.html`),
        options: {
          ...theme.config.options,
          responsive: true,
          includeNavigation: true
        },
        branding: {
          ...theme.config.branding,
          disclaimer: `This is a ${theme.name} report.`
        },
        metadata: {
          title: `${ticker} ${theme.name} Report`,
          author: 'TriSight Team',
          subject: `${theme.name} themed analysis`,
          keywords: [ticker, theme.name],
          createdDate: new Date(),
          ...theme.config.metadata
        }
      };
      
      const engine = createExportEngine(htmlConfig);
      const result = await engine.export(report, []);
      
      console.log(`  ✅ Exported: ${path.basename(result.filePath)}`);
      console.log(`  Primary Color: ${theme.config.branding.primaryColor}`);
      console.log(`  Confidentiality: ${theme.config.metadata.confidentiality || 'public'}\n`);
    }
    
    console.log(`📁 All themed exports saved to: ${outputDir}`);
    
  } catch (error) {
    console.error('❌ Theme export failed:', error);
  }
}

/**
 * Demonstrates advanced export features
 */
async function demonstrateAdvancedFeatures() {
  console.log('\n🔧 Advanced Export Features Demo');
  console.log('=' .repeat(50));
  
  // Create a complex report with various elements
  const report = {
    id: 'advanced-demo',
    title: 'Advanced Export Features',
    subtitle: 'Demonstrating Complex Capabilities',
    date: new Date(),
    sections: [
      {
        id: 'complex-content',
        title: 'Complex Content Section',
        content: `
# Markdown Support

This section demonstrates **bold text**, *italic text*, and [links](https://example.com).

## Lists
- Bullet point 1
- Bullet point 2
  - Nested item
- Bullet point 3

## Code Block
\`\`\`javascript
function calculateReturn(principal, rate, time) {
  return principal * Math.pow(1 + rate, time);
}
\`\`\`
        `,
        priority: 'medium' as const,
        tables: [
          {
            headers: ['Feature', 'PDF', 'HTML', 'Excel', 'PowerPoint'],
            rows: [
              ['Interactive Charts', '❌', '✅', '❌', '❌'],
              ['Searchable', '✅', '✅', '✅', '❌'],
              ['Hyperlinks', '✅', '✅', '❌', '✅'],
              ['Page Breaks', '✅', '❌', 'N/A', 'Auto']
            ],
            caption: 'Feature support by format'
          }
        ]
      }
    ],
    metadata: {
      generatedAt: new Date(),
      generatedBy: 'TriSight Advanced Demo',
      version: '1.0',
      dataFreshness: 'Real-time',
      confidence: 0.98
    },
    style: ReportStyle.TECHNICAL
  };
  
  const outputDir = path.join(__dirname, 'output', 'advanced-exports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('\n1️⃣ PDF with Custom Page Layout');
  console.log('─'.repeat(30));
  
  const pdfConfig: ExportConfig = {
    format: ExportFormat.PDF,
    outputPath: path.join(outputDir, 'advanced_custom_layout.pdf'),
    options: {
      paperSize: 'a4',
      margins: { top: 100, right: 50, bottom: 100, left: 50 },
      headerFooter: true,
      tableOfContents: true,
      pageNumbers: true
    },
    branding: {
      companyName: 'TriSight Advanced Analytics',
      primaryColor: '#1976D2',
      secondaryColor: '#FFC107',
      watermark: 'DRAFT',
      disclaimer: 'Contains proprietary algorithms and methodologies.'
    },
    metadata: {
      title: 'Advanced PDF Export',
      author: 'TriSight Research',
      subject: 'Advanced features demonstration',
      keywords: ['advanced', 'pdf', 'layout'],
      createdDate: new Date(),
      confidentiality: 'confidential'
    }
  };
  
  try {
    const pdfEngine = createExportEngine(pdfConfig);
    const pdfResult = await pdfEngine.export(report, []);
    console.log(`✅ Custom PDF exported with A4 size and custom margins`);
    console.log(`   Features: TOC, Headers/Footers, Page Numbers, Watermark`);
  } catch (error) {
    console.error('❌ PDF export failed:', error);
  }
  
  console.log('\n2️⃣ Interactive HTML with Search');
  console.log('─'.repeat(30));
  
  const htmlConfig: ExportConfig = {
    format: ExportFormat.HTML,
    outputPath: path.join(outputDir, 'advanced_interactive.html'),
    options: {
      responsive: true,
      includeNavigation: true,
      includeSearch: true,
      theme: 'dark'
    },
    branding: {
      companyName: 'TriSight Interactive',
      primaryColor: '#00E676',
      secondaryColor: '#FF5722'
    },
    metadata: {
      title: 'Interactive HTML Export',
      author: 'TriSight Team',
      subject: 'Interactive features demo',
      keywords: ['interactive', 'search', 'navigation'],
      createdDate: new Date()
    }
  };
  
  try {
    const htmlEngine = createExportEngine(htmlConfig);
    const htmlResult = await htmlEngine.export(report, []);
    console.log(`✅ Interactive HTML exported with dark theme`);
    console.log(`   Features: Search, Navigation, Responsive Design`);
  } catch (error) {
    console.error('❌ HTML export failed:', error);
  }
  
  console.log('\n3️⃣ Excel with Protected Sheets');
  console.log('─'.repeat(30));
  
  const excelConfig: ExportConfig = {
    format: ExportFormat.EXCEL,
    outputPath: path.join(outputDir, 'advanced_protected.xlsx'),
    options: {
      includeCharts: true,
      includeRawData: true,
      addFormulas: true,
      protectSheets: true
    },
    branding: {
      companyName: 'TriSight Data Analytics',
      primaryColor: '#4CAF50',
      secondaryColor: '#FF9800'
    },
    metadata: {
      title: 'Protected Excel Export',
      author: 'TriSight Analytics',
      subject: 'Excel security features',
      keywords: ['excel', 'protected', 'formulas'],
      createdDate: new Date()
    }
  };
  
  try {
    const excelEngine = createExportEngine(excelConfig);
    const excelResult = await excelEngine.export(report, []);
    console.log(`✅ Protected Excel workbook exported`);
    console.log(`   Features: Protected Sheets, Formulas, Raw Data`);
  } catch (error) {
    console.error('❌ Excel export failed:', error);
  }
  
  console.log('\n✨ Advanced features demonstration complete!');
  console.log(`📁 All exports saved to: ${outputDir}`);
}

// Run the demos
if (require.main === module) {
  const ticker = process.argv[2] || 'AAPL';
  const demoType = process.argv[3] || 'all';
  
  console.log('🚀 TriSight Export Engine Demo');
  console.log('=' .repeat(50));
  
  (async () => {
    try {
      switch (demoType) {
        case 'multi':
          await demonstrateMultiFormatExport(ticker);
          break;
          
        case 'batch':
          await demonstrateBatchExport(ticker);
          break;
          
        case 'themes':
          await demonstrateThemeVariations(ticker);
          break;
          
        case 'advanced':
          await demonstrateAdvancedFeatures();
          break;
          
        case 'all':
        default:
          await demonstrateMultiFormatExport(ticker);
          await demonstrateBatchExport(ticker);
          await demonstrateThemeVariations(ticker);
          await demonstrateAdvancedFeatures();
          break;
      }
      
      console.log('\n✅ All demos completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    }
  })();
}

export {
  demonstrateMultiFormatExport,
  demonstrateBatchExport,
  demonstrateThemeVariations,
  demonstrateAdvancedFeatures
};