// src/reportGeneration/examples/reportsInterfaceDemo.ts
// Demonstrates the Reports interface integration with report generation
// Context: Shows how the UI widgets connect to the backend functionality

import { 
  createDataFetcher,
  createDataProcessor,
  createReportTemplateEngine,
  createVisualizationEngine,
  createExportEngine,
  ReportType,
  ReportStyle,
  ChartTheme,
  ExportFormat
} from '../index';

/**
 * Example: Generate a report from the Reports interface
 * This simulates what happens when a user clicks "Generate Report" in the UI
 */
export async function generateReportFromUI(
  ticker: string,
  template: ReportType,
  exportFormats: ExportFormat[]
) {
  console.log('🚀 Reports Interface: Generating report');
  console.log(`   Ticker: ${ticker}`);
  console.log(`   Template: ${template}`);
  console.log(`   Export formats: ${exportFormats.join(', ')}`);
  
  try {
    // Step 1: Fetch data (triggered by Data Sources widget)
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    // Step 2: Process data (shown in Analytics widget)
    const processor = createDataProcessor({
      includePatternDetection: true,
      includeSentimentAnalysis: true,
      includeValuationMetrics: true
    });
    const { analysis } = await processor.processData(companyData);
    
    // Step 3: Generate visualizations (previewed in Visualization widget)
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
        title: 'Revenue Trend',
        subtitle: 'Quarterly revenue in billions'
      }
    });
    charts.push(revenueChart);
    
    // Step 4: Generate report (based on selected template)
    const reportEngine = createReportTemplateEngine({
      reportType: template,
      style: ReportStyle.INSTITUTIONAL
    });
    
    const report = await reportEngine.generateReport(companyData, analysis);
    
    // Step 5: Export to selected formats (shown in Export Queue)
    const exportResults = [];
    
    for (const format of exportFormats) {
      const exportEngine = createExportEngine({
        format,
        outputPath: `./output/${ticker}_${Date.now()}.${getFileExtension(format)}`,
        options: {
          paperSize: 'letter',
          responsive: true,
          headerFooter: true
        },
        branding: {
          companyName: 'TriSight Analytics',
          primaryColor: '#0066CC',
          secondaryColor: '#00A651'
        },
        metadata: {
          title: `${ticker} Investment Analysis`,
          author: 'TriSight Research Team',
          subject: 'Generated from Reports Interface',
          keywords: [ticker, 'investment', 'analysis'],
          createdDate: new Date()
        }
      });
      
      const result = await exportEngine.export(report, charts);
      exportResults.push({
        format,
        ...result
      });
    }
    
    // Return results for UI updates
    return {
      reportId: `${ticker}-${Date.now()}`,
      ticker,
      template,
      confidence: analysis.composite.overall,
      exports: exportResults,
      generatedAt: new Date()
    };
    
  } catch (error) {
    console.error('❌ Report generation failed:', error);
    throw error;
  }
}

/**
 * Example: Handle quick action button clicks
 */
export const quickActions = {
  // Generate Report button
  generateReport: async (ticker: string = 'AAPL') => {
    return generateReportFromUI(
      ticker,
      ReportType.EQUITY_RESEARCH,
      [ExportFormat.PDF, ExportFormat.HTML]
    );
  },
  
  // Batch Export button
  batchExport: async (tickers: string[]) => {
    const results = [];
    for (const ticker of tickers) {
      const result = await generateReportFromUI(
        ticker,
        ReportType.QUICK_TAKE,
        [ExportFormat.PDF, ExportFormat.EXCEL]
      );
      results.push(result);
    }
    return results;
  },
  
  // Schedule Report button
  scheduleReport: (ticker: string, schedule: 'daily' | 'weekly' | 'monthly') => {
    console.log(`📅 Scheduling ${schedule} report for ${ticker}`);
    // This would integrate with a job scheduler in production
    return {
      scheduled: true,
      ticker,
      schedule,
      nextRun: getNextRunDate(schedule)
    };
  },
  
  // Custom Template button
  createCustomTemplate: () => {
    console.log('🎨 Opening custom template builder');
    // This would open a template customization interface
    return {
      action: 'open-template-builder'
    };
  }
};

/**
 * Example: Real-time updates for widgets
 */
export const widgetUpdates = {
  // Update Recent Reports widget
  addRecentReport: (report: any) => {
    return {
      type: 'ADD_RECENT_REPORT',
      payload: {
        id: report.reportId,
        title: `${report.ticker} ${getTemplateName(report.template)}`,
        ticker: report.ticker,
        createdAt: report.generatedAt,
        type: report.template,
        status: 'completed',
        confidence: report.confidence
      }
    };
  },
  
  // Update Export Queue widget
  updateExportProgress: (reportId: string, progress: number) => {
    return {
      type: 'UPDATE_EXPORT_PROGRESS',
      payload: {
        reportId,
        progress
      }
    };
  },
  
  // Update Analytics widget
  updateAnalytics: (metrics: any) => {
    return {
      type: 'UPDATE_ANALYTICS',
      payload: {
        reportsGenerated: metrics.count,
        avgConfidence: metrics.avgConfidence,
        exportSuccess: metrics.exportSuccessRate,
        timeSaved: metrics.timeSaved
      }
    };
  },
  
  // Update AI Insights widget
  addInsight: (insight: string, type: 'success' | 'warning' | 'info') => {
    return {
      type: 'ADD_AI_INSIGHT',
      payload: {
        text: insight,
        type,
        timestamp: new Date()
      }
    };
  }
};

// Helper functions
function getFileExtension(format: ExportFormat): string {
  const extensions: Record<ExportFormat, string> = {
    [ExportFormat.PDF]: 'pdf',
    [ExportFormat.HTML]: 'html',
    [ExportFormat.POWERPOINT]: 'pptx',
    [ExportFormat.EXCEL]: 'xlsx',
    [ExportFormat.MARKDOWN]: 'md'
  };
  return extensions[format] || 'pdf';
}

function getTemplateName(template: ReportType): string {
  const names: Record<ReportType, string> = {
    [ReportType.EQUITY_RESEARCH]: 'Equity Research',
    [ReportType.SCREENING]: 'Market Screening',
    [ReportType.TECHNICAL]: 'Technical Analysis',
    [ReportType.QUICK_TAKE]: 'Quick Take',
    [ReportType.EARNINGS_PREVIEW]: 'Earnings Preview',
    [ReportType.SECTOR_ANALYSIS]: 'Sector Analysis'
  };
  return names[template] || 'Report';
}

function getNextRunDate(schedule: 'daily' | 'weekly' | 'monthly'): Date {
  const now = new Date();
  const next = new Date(now);
  
  switch (schedule) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0); // 9 AM
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(9, 0, 0, 0);
      break;
  }
  
  return next;
}

// Demo runner
if (require.main === module) {
  (async () => {
    console.log('🎯 Reports Interface Integration Demo');
    console.log('=' .repeat(50));
    
    // Simulate user clicking "Generate Report" quick action
    console.log('\n1️⃣ User clicks "Generate Report" button');
    const report = await quickActions.generateReport('AAPL');
    console.log('✅ Report generated:', report.reportId);
    console.log(`   Confidence: ${(report.confidence * 100).toFixed(1)}%`);
    console.log(`   Exports: ${report.exports.map(e => e.format).join(', ')}`);
    
    // Simulate updating widgets
    console.log('\n2️⃣ Updating UI widgets');
    const updates = [
      widgetUpdates.addRecentReport(report),
      widgetUpdates.updateExportProgress(report.reportId, 100),
      widgetUpdates.updateAnalytics({
        count: 248,
        avgConfidence: 0.87,
        exportSuccessRate: 0.992,
        timeSaved: 142
      }),
      widgetUpdates.addInsight(
        'AAPL reports have 15% higher engagement with risk/return visualizations',
        'success'
      )
    ];
    
    updates.forEach(update => {
      console.log(`   📨 Dispatched: ${update.type}`);
    });
    
    // Simulate batch export
    console.log('\n3️⃣ User clicks "Batch Export" button');
    const batchResults = await quickActions.batchExport(['MSFT', 'GOOGL']);
    console.log(`✅ Batch export completed: ${batchResults.length} reports`);
    
    // Simulate scheduling
    console.log('\n4️⃣ User schedules weekly reports');
    const scheduled = quickActions.scheduleReport('AAPL', 'weekly');
    console.log(`✅ Scheduled: Next run on ${scheduled.nextRun.toLocaleDateString()}`);
    
    console.log('\n✨ Reports interface integration demo complete!');
  })();
}

export default {
  generateReportFromUI,
  quickActions,
  widgetUpdates
};