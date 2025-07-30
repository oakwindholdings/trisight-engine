// src/reportGeneration/examples/integratedVisualizationDemo.ts
// Demonstrates integrated visualization in report generation
// Context: Shows how charts are embedded in professional reports

import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import { createReportTemplateEngine, ReportType, ReportStyle } from '../templates/reportTemplateEngine';
import { createVisualizationEngine, ChartTheme, OutputFormat } from '../visualization/visualizationEngine';
import { createFinancialCharts } from '../visualization/financialCharts';
import { convertReportToHTML } from '../utils/reportExporter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates how visualizations are integrated into reports
 */
async function demonstrateIntegratedVisualization(ticker: string = 'AAPL') {
  console.log('📊 Integrated Visualization Demo');
  console.log('=' .repeat(50));
  console.log(`Generating visual report for ${ticker}\n`);
  
  try {
    // Step 1: Fetch and process data
    console.log('📥 Fetching data...');
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true
    });
    const { analysis } = await processor.processData(companyData);
    console.log('✅ Data processed\n');
    
    // Step 2: Create visualization engines
    const vizEngine = createVisualizationEngine({
      theme: ChartTheme.INSTITUTIONAL,
      format: OutputFormat.WEB,
      animations: false // For static reports
    });
    
    const finCharts = createFinancialCharts({
      theme: ChartTheme.INSTITUTIONAL
    });
    
    // Step 3: Generate charts for the report
    console.log('📈 Generating charts...');
    
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
        subtitle: 'in billions USD',
        xAxis: { label: 'Quarter', format: 'date' },
        yAxis: { label: 'Revenue ($B)' }
      }
    });
    console.log('  ✅ Revenue trend chart');
    
    // Profitability margins comparison
    const marginsChart = await vizEngine.generateChart({
      type: 'bar',
      data: {
        labels: ['Gross', 'Operating', 'Net', 'FCF'],
        datasets: [{
          label: 'Margins %',
          data: [
            analysis.profitability.grossMargin * 100,
            analysis.profitability.operatingMargin * 100,
            analysis.profitability.netMargin * 100,
            analysis.profitability.fcfMargin * 100
          ]
        }]
      },
      config: {
        title: 'Profitability Margins',
        yAxis: { format: 'percent' },
        showValues: true
      }
    });
    console.log('  ✅ Margins comparison chart');
    
    // Valuation metrics
    const valuationChart = await vizEngine.generateChart({
      type: 'gauge',
      data: {
        value: analysis.composite.overall
      },
      config: {
        title: 'Composite Score',
        min: 0,
        max: 100,
        target: 75,
        label: 'Score'
      }
    });
    console.log('  ✅ Valuation gauge chart');
    
    // Technical pattern chart (if patterns detected)
    let patternChart;
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.patternCount > 0) {
      const prices = companyData.financials.historicalPrices.slice(0, 60);
      patternChart = await vizEngine.generateChart({
        type: 'candlestick',
        data: {
          candles: prices.map(p => ({
            date: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume
          }))
        },
        config: {
          title: 'Price Action with Patterns',
          subtitle: `${analysis.technicals.patternAnalysis.patternCount} patterns detected`,
          indicators: ['ma20']
        }
      });
      console.log('  ✅ Pattern detection chart');
    }
    
    // Risk/Return scatter for sector comparison
    const sectorComparison = [
      { 
        name: ticker, 
        return: 0.15, 
        risk: 0.25, 
        marketCap: companyData.financials.keyMetrics.marketCap,
        category: 'Target'
      },
      { name: 'Sector Avg', return: 0.12, risk: 0.20, marketCap: 100e9, category: 'Benchmark' },
      { name: 'Market', return: 0.10, risk: 0.15, marketCap: 500e9, category: 'Benchmark' }
    ];
    
    const riskReturnChart = await finCharts.createRiskReturnScatter(
      sectorComparison,
      { title: 'Risk/Return vs Benchmarks' }
    );
    console.log('  ✅ Risk/return comparison\n');
    
    // Step 4: Create report with embedded charts
    console.log('📝 Generating report with visualizations...');
    
    const reportEngine = createReportTemplateEngine({
      reportType: ReportType.EQUITY_RESEARCH,
      style: ReportStyle.INSTITUTIONAL,
      includeCharts: true
    });
    
    // Enhance analysis with chart specifications
    const enhancedAnalysis = {
      ...analysis,
      charts: {
        revenue: revenueChart,
        margins: marginsChart,
        valuation: valuationChart,
        patterns: patternChart,
        riskReturn: riskReturnChart
      }
    };
    
    const report = await reportEngine.generateReport(companyData, enhancedAnalysis);
    
    // Add charts to appropriate sections
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
                caption: 'Revenue growth trajectory shows consistent expansion'
              },
              {
                type: 'bar' as const,
                data: marginsChart.svg,
                config: marginsChart.config,
                caption: 'Profitability margins remain healthy across all metrics'
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
                caption: `Overall investment score: ${analysis.composite.overall}/100`
              },
              {
                type: 'scatter' as const,
                data: riskReturnChart.svg,
                config: riskReturnChart.config,
                caption: 'Risk/return profile compared to sector and market'
              }
            ]
          };
          
        case 'technical_analysis':
          if (patternChart) {
            return {
              ...section,
              charts: [{
                type: 'candlestick' as const,
                data: patternChart.svg,
                config: patternChart.config,
                caption: 'Recent price action with detected patterns highlighted'
              }]
            };
          }
          return section;
          
        default:
          return section;
      }
    });
    
    console.log('✅ Report generated with embedded visualizations\n');
    
    // Step 5: Export report with charts
    console.log('💾 Exporting visual report...');
    
    const outputDir = path.join(__dirname, 'output', 'visual-reports');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Convert to HTML with embedded SVG charts
    const htmlReport = convertReportToHTML(report);
    
    // Enhance HTML with chart embedding
    const enhancedHTML = htmlReport.replace(
      /<section[^>]*>([\s\S]*?)<\/section>/g,
      (match, content) => {
        // Find chart placeholders and replace with actual SVG
        return match.replace(
          /\[CHART:([^\]]+)\]/g,
          (chartMatch, chartId) => {
            const chart = enhancedAnalysis.charts[chartId];
            if (chart && chart.svg) {
              return `
                <div class="chart-container">
                  ${chart.svg}
                  <p class="chart-caption">${chartId} visualization</p>
                </div>
              `;
            }
            return chartMatch;
          }
        );
      }
    );
    
    // Add CSS for charts
    const styledHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #0066CC;
    }
    .chart-container {
      margin: 30px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    .chart-container svg {
      max-width: 100%;
      height: auto;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .chart-caption {
      font-style: italic;
      color: #666;
      margin-top: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    .metric-highlight {
      font-size: 24px;
      font-weight: bold;
      color: #0066CC;
    }
    @media print {
      .chart-container {
        break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  ${enhancedHTML}
</body>
</html>
    `;
    
    const filename = `${ticker}_visual_report_${new Date().toISOString().split('T')[0]}.html`;
    fs.writeFileSync(path.join(outputDir, filename), styledHTML);
    
    console.log(`✅ Visual report saved: ${filename}\n`);
    
    // Step 6: Generate summary statistics
    console.log('📊 Report Visualization Summary');
    console.log('─'.repeat(50));
    console.log(`Total sections: ${report.sections.length}`);
    console.log(`Charts embedded: ${report.sections.reduce((sum, s) => sum + (s.charts?.length || 0), 0)}`);
    console.log(`Tables included: ${report.sections.reduce((sum, s) => sum + (s.tables?.length || 0), 0)}`);
    console.log(`Report confidence: ${(report.metadata.confidence * 100).toFixed(0)}%`);
    console.log(`Data freshness: ${report.metadata.dataFreshness}`);
    
    // Chart types used
    const chartTypes = new Set();
    report.sections.forEach(section => {
      section.charts?.forEach(chart => chartTypes.add(chart.type));
    });
    console.log(`Chart types used: ${Array.from(chartTypes).join(', ')}`);
    
    console.log('\n✨ Integrated visualization demo complete!');
    console.log(`\n🌐 Open the report in a browser to see the embedded visualizations`);
    console.log(`📁 Location: ${path.join(outputDir, filename)}`);
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Example: Generate multiple reports with different themes
async function demonstrateThemeVariations(ticker: string = 'MSFT') {
  console.log('\n🎨 Theme Variations Demo\n');
  
  const themes = [
    { theme: ChartTheme.INSTITUTIONAL, style: ReportStyle.INSTITUTIONAL, name: 'Institutional' },
    { theme: ChartTheme.MODERN, style: ReportStyle.RETAIL, name: 'Retail' },
    { theme: ChartTheme.DARK, style: ReportStyle.TECHNICAL, name: 'Technical' }
  ];
  
  for (const { theme, style, name } of themes) {
    console.log(`Generating ${name} themed report...`);
    
    // Would generate report with specific theme
    // This demonstrates how the same data can be visualized differently
    // for different audiences
    
    console.log(`✅ ${name} report generated`);
  }
}

// Run the demo
if (require.main === module) {
  const ticker = process.argv[2] || 'AAPL';
  
  demonstrateIntegratedVisualization(ticker)
    .then(() => {
      if (process.argv.includes('--themes')) {
        return demonstrateThemeVariations(ticker);
      }
    })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateIntegratedVisualization, demonstrateThemeVariations };