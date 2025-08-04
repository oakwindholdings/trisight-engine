// src/reportGeneration/index.ts
// Main export file for report generation module
// Context: Public API for the report generation system

export { createReportGenerator, ReportGenerator } from './core/reportGenerator';
export * from './models/reportTypes';
export * from './models/financialMetrics';

// Additional utility exports for advanced usage
export { DataFetcher } from './core/dataFetcher';
export { DataProcessor } from './core/dataProcessor';
export { ReportAssembler } from './core/reportAssembler';
export { generateComprehensiveSlides } from './core/comprehensiveSlideGenerator';
export { AISummarizer } from './utils/aiSummarizer';
export { ChartGenerator } from './utils/chartGenerator';
export * from './utils/errorHandler';

// Adapter exports for direct access if needed
export { TwelveDataAdapter } from './adapters/twelveDataAdapter';
export { FirecrawlAdapter } from './adapters/firecrawlAdapter';
export { EdgarAdapter } from './adapters/edgarAdapter';

/**
 * Quick start example:
 * 
 * import { createReportGenerator } from './reportGeneration';
 * 
 * const config = {
 *   ticker: 'AAPL',
 *   reportDate: '2024-01-15',
 *   currentDate: '2024-01-15',
 *   outputFormat: 'pptx'
 * };
 * 
 * const generator = createReportGenerator(config);
 * const report = await generator.generateReport();
 */