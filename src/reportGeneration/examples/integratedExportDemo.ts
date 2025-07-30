// src/reportGeneration/examples/integratedExportDemo.ts
// Demonstrates the complete report generation and export pipeline
// Context: Full end-to-end example from data to multi-format output

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { createReportTemplateEngine, ReportType, ReportStyle } from '../templates/reportTemplateEngine';
import { createVisualizationEngine, ChartTheme, OutputFormat } from '../visualization/visualizationEngine';
import { createFinancialCharts } from '../visualization/financialCharts';
import {
  createExportEngine,
  ExportFormat,
  ExportConfig,
  batchExport
} from '../export/exportEngine';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates the complete pipeline: Data → Analysis → Visualization → Report → Export
 */
async function demonstrateCompleteReportPipeline(ticker: string = 'AAPL') {
  console.log('🏭 Complete Report Generation Pipeline');
  console.log('=' .repeat(60));
  console.log(`Processing ${ticker} from data to multi-format exports\n`);
  
  const startTime = Date.now();
  
  try {
    // PHASE 1: DATA ACQUISITION & PROCESSING
    console.log('📊 PHASE 1: Data Acquisition & Processing');
    console.log('─'.repeat(50));
    
    console.log('📥 Fetching market data...');
    const fetcher = createDataFetcher({ 
      ticker,
      includeHistoricalPrices: true,
      includeFinancials: true,
      includeAnalystData: true
    });
    const companyData = await fetcher.fetchAll(ticker);
    console.log(`✅ Fetched data for ${companyData.company.name}`);
    console.log(`   Historical prices: ${companyData.financials.historicalPrices.length} data points`);
    console.log(`   Financial statements: ${companyData.financials.incomeStatement.length} quarters`);
    
    console.log('🔍 Processing and analyzing data...');
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true,
      includeValuationMetrics: true,
      includeRiskAssessment: true
    });
    const { analysis, metadata } = await processor.processData(companyData);
    console.log(`✅ Analysis complete - confidence: ${(analysis.composite.overall).toFixed(1)}/100`);
    console.log(`   Pattern signals: ${analysis.technicals.patternAnalysis?.patternCount || 0}`);
    console.log(`   Sentiment score: ${(analysis.market.sentiment.overall * 100).toFixed(1)}%\n`);
    
    // PHASE 2: VISUALIZATION GENERATION
    console.log('📈 PHASE 2: Visualization Generation');
    console.log('─'.repeat(50));
    
    const vizEngine = createVisualizationEngine({
      theme: ChartTheme.INSTITUTIONAL,
      format: OutputFormat.WEB,
      animations: false,
      size: {
        width: 800,
        height: 500,
        margins: { top: 40, right: 40, bottom: 60, left: 80 }
      }
    });
    
    const finCharts = createFinancialCharts({
      theme: ChartTheme.INSTITUTIONAL
    });
    
    const charts = [];
    
    console.log('📊 Creating revenue trend visualization...');
    const revenueChart = await vizEngine.generateChart({
      type: 'line',
      data: {
        labels: companyData.financials.incomeStatement.slice(0, 12).map(s => s.date),
        datasets: [{
          label: 'Revenue (Billions)',
          data: companyData.financials.incomeStatement.slice(0, 12).map(s => s.revenue / 1e9),
          color: '#0066CC'
        }]
      },
      config: {
        title: 'Revenue Trend Analysis',
        subtitle: 'Quarterly revenue over 3 years',
        xAxis: { label: 'Quarter', format: 'date' },
        yAxis: { label: 'Revenue (Billions USD)', format: 'currency' }
      }
    });
    charts.push(revenueChart);
    
    console.log('📊 Creating profitability analysis...');
    const profitabilityChart = await vizEngine.generateChart({
      type: 'bar',
      data: {
        labels: ['Gross Margin', 'Operating Margin', 'Net Margin', 'FCF Margin'],
        datasets: [{
          label: 'Margins (%)',
          data: [
            analysis.profitability.grossMargin * 100,
            analysis.profitability.operatingMargin * 100,
            analysis.profitability.netMargin * 100,
            analysis.profitability.fcfMargin * 100
          ],
          color: '#00A651'
        }]
      },
      config: {
        title: 'Profitability Metrics',
        subtitle: 'Current margin analysis',
        yAxis: { format: 'percent', max: 100 },
        showValues: true
      }
    });
    charts.push(profitabilityChart);
    
    console.log('📊 Creating valuation gauge...');
    const valuationChart = await vizEngine.generateChart({
      type: 'gauge',
      data: {
        value: analysis.composite.overall
      },
      config: {
        title: 'Investment Score',
        subtitle: 'Overall attractiveness rating',
        min: 0,
        max: 100,
        target: 75,
        label: 'Score',
        zones: [
          { min: 0, max: 40, color: '#F44336' },
          { min: 40, max: 70, color: '#FF9800' },
          { min: 70, max: 100, color: '#4CAF50' }
        ]
      }
    });
    charts.push(valuationChart);
    
    // Create financial-specific charts
    console.log('📊 Creating risk/return analysis...');
    const sectorComparison = [
      { 
        name: ticker, 
        return: analysis.profitability.roe || 0.15, 
        risk: 0.25, 
        marketCap: companyData.financials.keyMetrics.marketCap,
        category: 'Target'
      },
      { name: 'Sector Average', return: 0.12, risk: 0.20, marketCap: 100e9, category: 'Benchmark' },
      { name: 'S&P 500', return: 0.10, risk: 0.15, marketCap: 500e9, category: 'Market' }
    ];
    
    const riskReturnChart = await finCharts.createRiskReturnScatter(
      sectorComparison,
      { 
        title: 'Risk/Return Profile',
        subtitle: 'Compared to benchmarks'
      }
    );
    charts.push(riskReturnChart);
    
    // Create correlation matrix if we have comparison data
    console.log('📊 Creating correlation analysis...');
    const correlationMatrix = await finCharts.createCorrelationMatrix(
      ['Stock', 'Sector', 'Market', 'Bonds', 'Gold'],
      [
        [1.00, 0.75, 0.65, -0.10, -0.20],
        [0.75, 1.00, 0.80, -0.05, -0.15],
        [0.65, 0.80, 1.00, 0.10, 0.05],
        [-0.10, -0.05, 0.10, 1.00, 0.30],
        [-0.20, -0.15, 0.05, 0.30, 1.00]
      ],
      {
        title: 'Asset Correlation Matrix',
        subtitle: '12-month rolling correlation'
      }
    );
    charts.push(correlationMatrix);
    
    console.log(`✅ Generated ${charts.length} visualizations\n`);
    
    // PHASE 3: REPORT GENERATION
    console.log('📋 PHASE 3: Report Generation');
    console.log('─'.repeat(50));
    
    console.log('📝 Generating comprehensive report...');
    const reportEngine = createReportTemplateEngine({
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL,
      includeCharts: true,
      includeTables: true,
      includeExecutiveSummary: true,
      includeDisclaimer: true
    });
    
    const report = await reportEngine.generateReport(companyData, analysis);
    
    // Enhance report with charts
    report.sections = report.sections.map(section => {
      switch (section.id) {
        case 'financial_analysis':
          return {
            ...section,
            charts: [
              {
                type: 'line' as const,
                data: revenueChart.svg,
                config: revenueChart.config,
                caption: 'Revenue growth showing consistent expansion over the past 3 years'
              },
              {
                type: 'bar' as const,
                data: profitabilityChart.svg,
                config: profitabilityChart.config,
                caption: 'Profitability margins demonstrate strong operational efficiency'
              }
            ]
          };
          
        case 'valuation_analysis':
          return {
            ...section,
            charts: [
              {
                type: 'gauge' as const,
                data: valuationChart.svg,
                config: valuationChart.config,
                caption: `Overall investment attractiveness score: ${analysis.composite.overall.toFixed(1)}/100`
              },
              {
                type: 'scatter' as const,
                data: riskReturnChart.svg,
                config: riskReturnChart.config,
                caption: 'Risk-adjusted returns compared to sector and market benchmarks'
              }
            ]
          };
          
        case 'risk_assessment':
          return {
            ...section,
            charts: [
              {
                type: 'heatmap' as const,
                data: correlationMatrix.svg,
                config: correlationMatrix.config,
                caption: 'Correlation with major asset classes for portfolio diversification analysis'
              }
            ]
          };
          
        default:
          return section;
      }
    });
    
    console.log(`✅ Report generated with ${report.sections.length} sections`);
    console.log(`   Charts embedded: ${report.sections.reduce((sum, s) => sum + (s.charts?.length || 0), 0)}`);
    console.log(`   Tables included: ${report.sections.reduce((sum, s) => sum + (s.tables?.length || 0), 0)}\n`);
    
    // PHASE 4: MULTI-FORMAT EXPORT
    console.log('📤 PHASE 4: Multi-Format Export');
    console.log('─'.repeat(50));
    
    const outputDir = path.join(__dirname, 'output', 'integrated-pipeline', ticker);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Common branding and metadata for all exports
    const brandingConfig = {
      companyName: 'TriSight Investment Research',
      primaryColor: '#1565C0',
      secondaryColor: '#43A047',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      disclaimer: `This report contains forward-looking statements and is based on current market conditions as of ${new Date().toLocaleDateString()}. Past performance does not guarantee future results. All investments carry risk of loss.`
    };
    
    const metadataConfig = {
      title: `${ticker} Comprehensive Investment Analysis`,
      author: 'TriSight AI Research Team',
      subject: `In-depth analysis of ${companyData.company.name} investment opportunity`,
      keywords: ['investment', 'equity research', ticker, companyData.company.sector, 'analysis'],
      createdDate: new Date(),
      confidentiality: 'internal' as const
    };
    
    // Export configurations for different use cases
    const exportConfigs = [
      {
        name: 'Executive Presentation',
        format: ExportFormat.POWERPOINT,
        filename: `${ticker}_executive_presentation.pptx`,
        options: {
          slideSize: 'widescreen' as const,
          includeNotes: true
        },
        audience: 'C-level executives and board members'
      },
      {
        name: 'Analyst Report',
        format: ExportFormat.PDF,
        filename: `${ticker}_analyst_report.pdf`,
        options: {
          paperSize: 'letter' as const,
          headerFooter: true,
          tableOfContents: true,
          pageNumbers: true,
          margins: { top: 72, right: 72, bottom: 72, left: 72 }
        },
        audience: 'Portfolio managers and research analysts'
      },
      {
        name: 'Interactive Web Report',
        format: ExportFormat.HTML,
        filename: `${ticker}_interactive_report.html`,
        options: {
          responsive: true,
          includeNavigation: true,
          includeSearch: true,
          theme: 'light' as const
        },
        audience: 'Investment committee and stakeholders'
      },
      {
        name: 'Data Workbook',
        format: ExportFormat.EXCEL,
        filename: `${ticker}_data_workbook.xlsx`,
        options: {
          includeCharts: true,
          includeRawData: true,
          addFormulas: true,
          protectSheets: false
        },
        audience: 'Quantitative analysts and data scientists'
      },
      {
        name: 'Research Notes',
        format: ExportFormat.MARKDOWN,
        filename: `${ticker}_research_notes.md`,
        options: {},
        audience: 'Research team collaboration and version control'
      }
    ];
    
    console.log(`🚀 Exporting to ${exportConfigs.length} different formats for various audiences...\n`);
    
    const exportResults = [];
    
    for (const config of exportConfigs) {
      console.log(`📄 Creating ${config.name}...`);
      console.log(`   Format: ${config.format.toUpperCase()}`);
      console.log(`   Audience: ${config.audience}`);
      
      const exportConfig: ExportConfig = {
        format: config.format,
        outputPath: path.join(outputDir, config.filename),
        options: config.options,
        branding: brandingConfig,
        metadata: {
          ...metadataConfig,
          title: `${config.name} - ${metadataConfig.title}`
        }
      };
      
      try {
        const engine = createExportEngine(exportConfig);
        const result = await engine.export(report, charts);
        
        exportResults.push({
          ...result,
          name: config.name,
          audience: config.audience
        });
        
        console.log(`   ✅ Exported: ${path.basename(result.filePath)}`);
        console.log(`   Size: ${(result.fileSize / 1024).toFixed(1)} KB`);
        if (result.pages) {
          console.log(`   Pages/Slides: ${result.pages}`);
        }
        if (result.warnings.length > 0) {
          console.log(`   Warnings: ${result.warnings.join(', ')}`);
        }
        console.log();
        
      } catch (error) {
        console.error(`   ❌ Export failed: ${error.message}\n`);
        exportResults.push({
          format: config.format,
          name: config.name,
          audience: config.audience,
          filePath: '',
          fileSize: 0,
          warnings: [`Export failed: ${error.message}`],
          metadata: metadataConfig
        });
      }
    }
    
    // PHASE 5: PIPELINE SUMMARY & ANALYTICS
    console.log('📊 PHASE 5: Pipeline Summary & Analytics');
    console.log('─'.repeat(50));
    
    const totalDuration = Date.now() - startTime;
    const successfulExports = exportResults.filter(r => r.fileSize > 0);
    const totalSize = exportResults.reduce((sum, r) => sum + r.fileSize, 0);
    
    console.log('Pipeline Performance:');
    console.log(`⏱️  Total execution time: ${(totalDuration / 1000).toFixed(2)} seconds`);
    console.log(`📊 Data points processed: ${companyData.financials.historicalPrices.length}`);
    console.log(`📈 Visualizations created: ${charts.length}`);
    console.log(`📝 Report sections generated: ${report.sections.length}`);
    console.log(`📤 Export formats attempted: ${exportConfigs.length}`);
    console.log(`✅ Successful exports: ${successfulExports.length}/${exportConfigs.length}`);
    console.log(`💾 Total output size: ${(totalSize / 1024).toFixed(1)} KB\n`);
    
    console.log('Export Summary by Audience:');
    console.log('─'.repeat(30));
    exportResults.forEach(result => {
      const status = result.fileSize > 0 ? '✅' : '❌';
      const size = result.fileSize > 0 ? `${(result.fileSize / 1024).toFixed(1)} KB` : 'Failed';
      console.log(`${status} ${result.name.padEnd(25)} ${size.padStart(10)}`);
      console.log(`   📋 ${result.audience}`);
    });
    
    console.log(`\n📁 All outputs saved to: ${outputDir}`);
    
    // Generate usage recommendations
    console.log('\n💡 Usage Recommendations:');
    console.log('─'.repeat(30));
    console.log('📊 Executive Presentation: Use for board meetings and high-level strategy discussions');
    console.log('📋 Analyst Report: Primary document for investment decision-making');
    console.log('🌐 Interactive Web Report: Share with investment committee for collaborative review');
    console.log('📊 Data Workbook: Provide to quants for detailed model validation');
    console.log('📝 Research Notes: Archive in research repository for future reference');
    
    // Performance insights
    console.log('\n📈 Analysis Insights:');
    console.log('─'.repeat(30));
    console.log(`💰 Current investment score: ${analysis.composite.overall.toFixed(1)}/100`);
    console.log(`📊 Revenue growth trend: ${analysis.growth.revenueGrowth > 0 ? 'Positive' : 'Negative'}`);
    console.log(`💼 Profitability assessment: ${analysis.profitability.netMargin > 0.1 ? 'Strong' : 'Moderate'}`);
    console.log(`⚠️  Risk level: ${analysis.risk.overall < 0.3 ? 'Low' : analysis.risk.overall < 0.7 ? 'Medium' : 'High'}`);
    
    console.log('\n✨ Complete pipeline execution successful!');
    console.log(`📊 ${ticker} analysis available in ${successfulExports.length} formats for different stakeholders`);
    
    return {
      ticker,
      companyName: companyData.company.name,
      analysisScore: analysis.composite.overall,
      chartsGenerated: charts.length,
      exportResults,
      totalDuration,
      outputDirectory: outputDir
    };
    
  } catch (error) {
    console.error('❌ Pipeline failed:', error);
    throw error;
  }
}

/**
 * Demonstrates pipeline customization for different report types
 */
async function demonstrateCustomizedPipelines() {
  console.log('\n🔧 Customized Pipeline Demonstrations');
  console.log('=' .repeat(50));
  
  const tickers = ['AAPL', 'GOOGL', 'MSFT'];
  const configurations = [
    {
      name: 'Quick Screening Report',
      reportType: ReportType.SCREENING,
      style: ReportStyle.RETAIL,
      exports: [ExportFormat.HTML, ExportFormat.MARKDOWN],
      theme: ChartTheme.MODERN
    },
    {
      name: 'Deep Dive Analysis',
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL,
      exports: [ExportFormat.PDF, ExportFormat.POWERPOINT, ExportFormat.EXCEL],
      theme: ChartTheme.INSTITUTIONAL
    },
    {
      name: 'Technical Analysis Brief',
      reportType: ReportType.TECHNICAL,
      style: ReportStyle.TECHNICAL,
      exports: [ExportFormat.PDF, ExportFormat.HTML],
      theme: ChartTheme.DARK
    }
  ];
  
  console.log(`🎯 Creating ${configurations.length} different report types for comparison\n`);
  
  const results = [];
  
  for (let i = 0; i < configurations.length; i++) {
    const ticker = tickers[i];
    const config = configurations[i];
    
    console.log(`📊 ${config.name} for ${ticker}`);
    console.log(`   Type: ${config.reportType}`);
    console.log(`   Style: ${config.style}`);
    console.log(`   Exports: ${config.exports.join(', ')}`);
    
    try {
      // Simplified pipeline for demonstration
      const fetcher = createDataFetcher({ ticker });
      const companyData = await fetcher.fetchAll(ticker);
      
      const processor = createDataProcessor({
        includePatternDetection: config.reportType === ReportType.TECHNICAL,
        includeValuationMetrics: config.reportType === ReportType.EQUITY_RESEARCH,
        includeSentimentAnalysis: true
      });
      const { analysis } = await processor.processData(companyData);
      
      const reportEngine = createReportTemplateEngine({
        reportType: config.reportType,
        style: config.style
      });
      const report = await reportEngine.generateReport(companyData, analysis);
      
      // Create minimal visualization
      const vizEngine = createVisualizationEngine({ theme: config.theme });
      const chart = await vizEngine.generateChart({
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Performance',
            data: [100, 105, 108, 112]
          }]
        },
        config: { title: `${ticker} Performance` }
      });
      
      // Export to specified formats
      const outputDir = path.join(__dirname, 'output', 'customized-pipelines', config.name.replace(/\s+/g, '_'));
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      const exportResults = await batchExport(
        report,
        [chart],
        config.exports,
        {
          options: { responsive: true },
          branding: {
            companyName: 'TriSight Customized Analytics',
            primaryColor: '#1976D2',
            secondaryColor: '#FFC107'
          },
          metadata: {
            title: `${config.name} - ${ticker}`,
            author: 'TriSight Team',
            subject: config.name,
            keywords: [ticker, config.reportType, config.style],
            createdDate: new Date()
          }
        }
      );
      
      results.push({
        config: config.name,
        ticker,
        exports: exportResults.length,
        successful: exportResults.filter(r => r.warnings.length === 0).length
      });
      
      console.log(`   ✅ Generated ${exportResults.length} exports\n`);
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}\n`);
      results.push({
        config: config.name,
        ticker,
        exports: 0,
        successful: 0
      });
    }
  }
  
  console.log('📊 Customized Pipeline Results:');
  console.log('─'.repeat(40));
  results.forEach(result => {
    console.log(`${result.config} (${result.ticker}): ${result.successful}/${result.exports} exports`);
  });
}

// CLI execution
if (require.main === module) {
  const ticker = process.argv[2] || 'AAPL';
  const demo = process.argv[3] || 'complete';
  
  console.log('🏭 TriSight Integrated Export Pipeline Demo');
  console.log('=' .repeat(60));
  
  (async () => {
    try {
      if (demo === 'complete') {
        const result = await demonstrateCompleteReportPipeline(ticker);
        console.log('\n📋 Pipeline Result Summary:');
        console.log(`   Company: ${result.companyName}`);
        console.log(`   Score: ${result.analysisScore.toFixed(1)}/100`);
        console.log(`   Duration: ${(result.totalDuration / 1000).toFixed(2)}s`);
        console.log(`   Directory: ${result.outputDirectory}`);
      } else if (demo === 'customized') {
        await demonstrateCustomizedPipelines();
      } else {
        await demonstrateCompleteReportPipeline(ticker);
        await demonstrateCustomizedPipelines();
      }
      
      console.log('\n🎉 All demonstrations completed successfully!');
      
    } catch (error) {
      console.error('\n💥 Pipeline demonstration failed:', error);
      process.exit(1);
    }
  })();
}

export {
  demonstrateCompleteReportPipeline,
  demonstrateCustomizedPipelines
};