// src/reportGeneration/index.ts
// Main export file for report generation module
// Context: Public API for the report generation system

export { createReportGenerator, ReportGenerator } from './core/reportGenerator';
export * from './models/reportTypes';
// financialMetrics collides with reportTypes on FinancialData/MACDData/PriceData/TechnicalIndicators;
// reportTypes wins those names (its shapes are the pipeline currency). Explicit list for the rest.
export type {
  GrowthMetrics, GrowthRate, ValuationMetrics, RiskMetrics, QualityMetrics,
  CalculationConfig, AnalysisResults, TechnicalSignals, Signal, CompositeScore,
  FormulaDefinition, IndustryBenchmarks
} from './models/financialMetrics';
export {
  FORMULAS, isValidGrowthRate, isValidFinancialMetric, PRECISION
} from './models/financialMetrics';

// Additional utility exports for advanced usage
export { DataFetcher, createDataFetcher } from './core/dataFetcher';
export { DataProcessor } from './core/dataProcessor';
// Factory + enum re-exports the Reports-interface demo consumes (named to avoid
// clashing with the models/reportTypes star export above)
export { createDataProcessor } from './processing/dataProcessor';
export { createReportTemplateEngine, ReportType, ReportStyle } from './templates/reportTemplateEngine';
export { createVisualizationEngine, ChartTheme } from './visualization/visualizationEngine';
export { createExportEngine, ExportFormat } from './export/exportEngine';
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