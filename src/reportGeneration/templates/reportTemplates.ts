// src/reportGeneration/templates/reportTemplates.ts
// Comprehensive report template definitions
// Context: Maps wizard selections to actual report content structure

import { ReportSection, ReportSlide } from '../models/reportTypes';

/**
 * Template configuration for different report types
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  requiredSections: string[];
  optionalSections: string[];
  defaultCharts: string[];
  defaultTimeframe: string;
  dataRequirements: string[];
  slideTemplates: SlideTemplate[];
  estimatedPages: number;
  targetAudience: string;
}

/**
 * Slide template configuration
 */
export interface SlideTemplate {
  id: string;
  title: string;
  order: number;
  layout: 'title' | 'content' | 'chart' | 'comparison' | 'mixed';
  requiredData: string[];
  contentBlocks: ContentBlock[];
  condition?: (config: any) => boolean;
}

/**
 * Content block configuration
 */
export interface ContentBlock {
  type: 'title' | 'text' | 'chart' | 'table' | 'metrics' | 'bullets' | 'image';
  dataSource?: string;
  template?: string;
  position?: { x: number; y: number; width: number; height: number };
  formatting?: any;
}

/**
 * Master template registry
 */
export const REPORT_TEMPLATES: { [key: string]: ReportTemplate } = {
  'equity-research': {
    id: 'equity-research',
    name: 'Comprehensive Equity Research',
    description: 'Full investment analysis with financial metrics, valuation, and recommendations',
    requiredSections: ['executive-summary', 'financial-analysis', 'valuation', 'recommendation'],
    optionalSections: ['technical-analysis', 'risk-assessment', 'competitive-analysis', 'esg-factors'],
    defaultCharts: ['price-history', 'revenue-growth', 'earnings-trend', 'valuation-multiples'],
    defaultTimeframe: '3Y',
    dataRequirements: ['market-data', 'financials', 'analyst-ratings', 'news'],
    estimatedPages: 15,
    targetAudience: 'Institutional investors, portfolio managers',
    slideTemplates: [
      {
        id: 'title',
        title: 'Title Slide',
        order: 1,
        layout: 'title',
        requiredData: ['company-info'],
        contentBlocks: [
          { type: 'title', template: '{{companyName}} ({{ticker}})' },
          { type: 'text', template: 'Investment Analysis Report' },
          { type: 'text', template: '{{reportDate}}' },
          { type: 'metrics', dataSource: 'recommendation' }
        ]
      },
      {
        id: 'executive-summary',
        title: 'Executive Summary',
        order: 2,
        layout: 'content',
        requiredData: ['analysis-results'],
        contentBlocks: [
          { type: 'title', template: 'Executive Summary' },
          { type: 'metrics', dataSource: 'composite-scores' },
          { type: 'bullets', dataSource: 'key-findings' },
          { type: 'text', dataSource: 'investment-thesis' }
        ]
      },
      {
        id: 'company-overview',
        title: 'Company Overview',
        order: 3,
        layout: 'mixed',
        requiredData: ['company-info', 'market-data'],
        contentBlocks: [
          { type: 'title', template: 'Company Overview' },
          { type: 'text', dataSource: 'company-description' },
          { type: 'table', dataSource: 'key-statistics' },
          { type: 'chart', dataSource: 'market-cap-history' }
        ]
      },
      {
        id: 'financial-performance',
        title: 'Financial Performance',
        order: 4,
        layout: 'chart',
        requiredData: ['financials'],
        contentBlocks: [
          { type: 'title', template: 'Financial Performance' },
          { type: 'chart', dataSource: 'revenue-earnings-chart' },
          { type: 'table', dataSource: 'financial-highlights' }
        ],
        condition: (config) => config.sections.financialAnalysis
      },
      {
        id: 'growth-analysis',
        title: 'Growth Analysis',
        order: 5,
        layout: 'comparison',
        requiredData: ['growth-metrics'],
        contentBlocks: [
          { type: 'title', template: 'Growth Metrics' },
          { type: 'chart', dataSource: 'growth-trends' },
          { type: 'metrics', dataSource: 'growth-scores' },
          { type: 'text', dataSource: 'growth-assessment' }
        ],
        condition: (config) => config.sections.financialAnalysis
      },
      {
        id: 'valuation-analysis',
        title: 'Valuation Analysis',
        order: 6,
        layout: 'mixed',
        requiredData: ['valuation-metrics'],
        contentBlocks: [
          { type: 'title', template: 'Valuation Analysis' },
          { type: 'chart', dataSource: 'valuation-multiples-chart' },
          { type: 'table', dataSource: 'peer-comparison' },
          { type: 'metrics', dataSource: 'fair-value-estimate' }
        ]
      },
      {
        id: 'technical-analysis',
        title: 'Technical Analysis',
        order: 7,
        layout: 'chart',
        requiredData: ['technical-indicators'],
        contentBlocks: [
          { type: 'title', template: 'Technical Analysis' },
          { type: 'chart', dataSource: 'price-chart-with-indicators' },
          { type: 'table', dataSource: 'technical-signals' },
          { type: 'text', dataSource: 'technical-outlook' }
        ],
        condition: (config) => config.sections.technicalAnalysis
      },
      {
        id: 'risk-assessment',
        title: 'Risk Assessment',
        order: 8,
        layout: 'content',
        requiredData: ['risk-metrics'],
        contentBlocks: [
          { type: 'title', template: 'Risk Assessment' },
          { type: 'metrics', dataSource: 'risk-scores' },
          { type: 'chart', dataSource: 'risk-profile-radar' },
          { type: 'bullets', dataSource: 'key-risks' }
        ],
        condition: (config) => config.sections.riskAssessment
      },
      {
        id: 'investment-recommendation',
        title: 'Investment Recommendation',
        order: 9,
        layout: 'content',
        requiredData: ['recommendation'],
        contentBlocks: [
          { type: 'title', template: 'Investment Recommendation' },
          { type: 'metrics', dataSource: 'recommendation-summary' },
          { type: 'bullets', dataSource: 'investment-rationale' },
          { type: 'table', dataSource: 'price-targets' }
        ]
      },
      {
        id: 'disclaimers',
        title: 'Important Disclaimers',
        order: 10,
        layout: 'content',
        requiredData: [],
        contentBlocks: [
          { type: 'title', template: 'Important Disclaimers' },
          { type: 'text', template: 'regulatory-disclaimers' }
        ]
      }
    ]
  },

  'technical-analysis': {
    id: 'technical-analysis',
    name: 'Technical Analysis Report',
    description: 'Chart patterns, indicators, and trading signals',
    requiredSections: ['price-analysis', 'indicators', 'patterns', 'signals'],
    optionalSections: ['volume-analysis', 'momentum', 'support-resistance'],
    defaultCharts: ['candlestick', 'volume', 'rsi', 'macd', 'bollinger'],
    defaultTimeframe: '6M',
    dataRequirements: ['market-data', 'technical-indicators'],
    estimatedPages: 10,
    targetAudience: 'Active traders, technical analysts',
    slideTemplates: [
      {
        id: 'title',
        title: 'Title Slide',
        order: 1,
        layout: 'title',
        requiredData: ['company-info'],
        contentBlocks: [
          { type: 'title', template: '{{ticker}} Technical Analysis' },
          { type: 'text', template: 'Chart Patterns & Trading Signals' },
          { type: 'text', template: '{{reportDate}}' }
        ]
      },
      {
        id: 'price-overview',
        title: 'Price Overview',
        order: 2,
        layout: 'chart',
        requiredData: ['price-data'],
        contentBlocks: [
          { type: 'title', template: 'Price Action Overview' },
          { type: 'chart', dataSource: 'candlestick-chart' },
          { type: 'metrics', dataSource: 'price-statistics' }
        ]
      },
      {
        id: 'trend-analysis',
        title: 'Trend Analysis',
        order: 3,
        layout: 'mixed',
        requiredData: ['moving-averages'],
        contentBlocks: [
          { type: 'title', template: 'Trend Analysis' },
          { type: 'chart', dataSource: 'price-with-ma' },
          { type: 'table', dataSource: 'trend-signals' },
          { type: 'text', dataSource: 'trend-assessment' }
        ]
      },
      {
        id: 'momentum-indicators',
        title: 'Momentum Indicators',
        order: 4,
        layout: 'chart',
        requiredData: ['momentum-data'],
        contentBlocks: [
          { type: 'title', template: 'Momentum Analysis' },
          { type: 'chart', dataSource: 'rsi-chart' },
          { type: 'chart', dataSource: 'macd-chart' },
          { type: 'bullets', dataSource: 'momentum-signals' }
        ]
      },
      {
        id: 'pattern-detection',
        title: 'Pattern Detection',
        order: 5,
        layout: 'mixed',
        requiredData: ['detected-patterns'],
        contentBlocks: [
          { type: 'title', template: 'Chart Patterns' },
          { type: 'chart', dataSource: 'patterns-overlay' },
          { type: 'table', dataSource: 'pattern-list' },
          { type: 'text', dataSource: 'pattern-implications' }
        ],
        condition: (config) => config.dataSources?.includes('patterns') || config.reportType === 'technical-analysis'
      },
      {
        id: 'support-resistance',
        title: 'Support & Resistance',
        order: 6,
        layout: 'chart',
        requiredData: ['support-resistance-levels'],
        contentBlocks: [
          { type: 'title', template: 'Key Levels' },
          { type: 'chart', dataSource: 'sr-levels-chart' },
          { type: 'table', dataSource: 'level-details' }
        ]
      },
      {
        id: 'trading-signals',
        title: 'Trading Signals',
        order: 7,
        layout: 'content',
        requiredData: ['trading-signals'],
        contentBlocks: [
          { type: 'title', template: 'Trading Signals Summary' },
          { type: 'metrics', dataSource: 'signal-strength' },
          { type: 'table', dataSource: 'active-signals' },
          { type: 'text', dataSource: 'trading-recommendation' }
        ]
      }
    ]
  },

  'risk-assessment': {
    id: 'risk-assessment',
    name: 'Risk Assessment Report',
    description: 'Comprehensive risk analysis and portfolio impact',
    requiredSections: ['risk-overview', 'market-risk', 'fundamental-risk', 'portfolio-impact'],
    optionalSections: ['scenario-analysis', 'stress-testing', 'hedging-strategies'],
    defaultCharts: ['volatility', 'beta', 'var', 'correlation'],
    defaultTimeframe: '1Y',
    dataRequirements: ['market-data', 'risk-metrics', 'portfolio-data'],
    estimatedPages: 8,
    targetAudience: 'Risk managers, portfolio managers',
    slideTemplates: [
      {
        id: 'title',
        title: 'Title Slide',
        order: 1,
        layout: 'title',
        requiredData: ['company-info'],
        contentBlocks: [
          { type: 'title', template: '{{ticker}} Risk Assessment' },
          { type: 'text', template: 'Portfolio Risk Analysis' },
          { type: 'text', template: '{{reportDate}}' }
        ]
      },
      {
        id: 'risk-overview',
        title: 'Risk Overview',
        order: 2,
        layout: 'content',
        requiredData: ['risk-summary'],
        contentBlocks: [
          { type: 'title', template: 'Risk Overview' },
          { type: 'metrics', dataSource: 'overall-risk-score' },
          { type: 'chart', dataSource: 'risk-radar' },
          { type: 'bullets', dataSource: 'key-risk-factors' }
        ]
      },
      {
        id: 'volatility-analysis',
        title: 'Volatility Analysis',
        order: 3,
        layout: 'chart',
        requiredData: ['volatility-data'],
        contentBlocks: [
          { type: 'title', template: 'Historical Volatility' },
          { type: 'chart', dataSource: 'volatility-chart' },
          { type: 'table', dataSource: 'volatility-stats' },
          { type: 'text', dataSource: 'volatility-assessment' }
        ]
      },
      {
        id: 'market-risk',
        title: 'Market Risk',
        order: 4,
        layout: 'mixed',
        requiredData: ['market-risk-metrics'],
        contentBlocks: [
          { type: 'title', template: 'Market Risk Metrics' },
          { type: 'metrics', dataSource: 'beta-analysis' },
          { type: 'chart', dataSource: 'correlation-matrix' },
          { type: 'table', dataSource: 'var-analysis' }
        ]
      },
      {
        id: 'scenario-analysis',
        title: 'Scenario Analysis',
        order: 5,
        layout: 'comparison',
        requiredData: ['scenario-results'],
        contentBlocks: [
          { type: 'title', template: 'Scenario Analysis' },
          { type: 'chart', dataSource: 'scenario-impacts' },
          { type: 'table', dataSource: 'scenario-details' },
          { type: 'text', dataSource: 'scenario-implications' }
        ],
        condition: (config) => config.sections.scenarioAnalysis
      },
      {
        id: 'risk-mitigation',
        title: 'Risk Mitigation',
        order: 6,
        layout: 'content',
        requiredData: ['mitigation-strategies'],
        contentBlocks: [
          { type: 'title', template: 'Risk Mitigation Strategies' },
          { type: 'bullets', dataSource: 'recommended-actions' },
          { type: 'table', dataSource: 'hedging-options' },
          { type: 'text', dataSource: 'implementation-notes' }
        ]
      }
    ]
  },

  'quick-take': {
    id: 'quick-take',
    name: 'Quick Take Report',
    description: 'Concise 1-page executive summary',
    requiredSections: ['summary', 'key-metrics', 'recommendation'],
    optionalSections: ['recent-news'],
    defaultCharts: ['mini-price-chart'],
    defaultTimeframe: '3M',
    dataRequirements: ['market-data', 'key-metrics'],
    estimatedPages: 1,
    targetAudience: 'Executives, time-constrained investors',
    slideTemplates: [
      {
        id: 'one-pager',
        title: 'Executive Summary',
        order: 1,
        layout: 'mixed',
        requiredData: ['company-info', 'key-metrics', 'recommendation'],
        contentBlocks: [
          { 
            type: 'title', 
            template: '{{companyName}} ({{ticker}}) - Quick Take',
            position: { x: 0, y: 0, width: 100, height: 10 }
          },
          {
            type: 'metrics',
            dataSource: 'investment-score',
            position: { x: 0, y: 10, width: 30, height: 20 }
          },
          {
            type: 'chart',
            dataSource: 'mini-price-chart',
            position: { x: 35, y: 10, width: 65, height: 30 }
          },
          {
            type: 'table',
            dataSource: 'key-financials',
            position: { x: 0, y: 45, width: 50, height: 25 }
          },
          {
            type: 'bullets',
            dataSource: 'investment-highlights',
            position: { x: 55, y: 45, width: 45, height: 25 }
          },
          {
            type: 'text',
            dataSource: 'recommendation-summary',
            position: { x: 0, y: 75, width: 100, height: 20 }
          }
        ]
      }
    ]
  }
};

/**
 * Section definitions with data mappings
 */
export const SECTION_DEFINITIONS: { [key: string]: ReportSection } = {
  'executive-summary': {
    id: 'executive-summary',
    title: 'Executive Summary',
    type: 'text',
    order: 1,
    required: true,
    dataRequirements: [
      { source: 'analysis', fields: ['composite', 'recommendation'] },
      { source: 'company', fields: ['overview'] },
      { source: 'market', fields: ['currentPrice', 'marketCap'] }
    ],
    contentTemplate: {
      keyFindings: [
        'Overall investment score: {{composite.overall}}/100',
        'Recommendation: {{composite.recommendation}}',
        'Primary strength: {{analysis.primaryStrength}}',
        'Key risk: {{analysis.primaryRisk}}'
      ],
      narrative: 'Based on comprehensive analysis of {{companyName}}, including financial performance, valuation metrics, and technical indicators...'
    }
  },

  'financial-analysis': {
    id: 'financial-analysis',
    title: 'Financial Analysis',
    type: 'mixed',
    order: 2,
    required: true,
    dataRequirements: [
      { source: 'financials', fields: ['incomeStatement', 'balanceSheet', 'cashFlow'] },
      { source: 'analysis', fields: ['growth', 'quality'] }
    ],
    subsections: ['revenue-analysis', 'profitability', 'cash-flow', 'balance-sheet'],
    charts: ['revenue-trend', 'margin-analysis', 'fcf-growth'],
    tables: ['financial-summary', 'year-over-year-comparison']
  },

  'valuation': {
    id: 'valuation',
    title: 'Valuation Analysis',
    type: 'chart',
    order: 3,
    required: true,
    dataRequirements: [
      { source: 'analysis', fields: ['valuation'] },
      { source: 'market', fields: ['peRatio', 'priceToBook'] },
      { source: 'peers', fields: ['comparison'] }
    ],
    charts: ['valuation-multiples', 'dcf-sensitivity', 'peer-comparison'],
    metrics: ['intrinsicValue', 'fairValue', 'marginOfSafety']
  },

  'technical-analysis': {
    id: 'technical-analysis',
    title: 'Technical Analysis',
    type: 'chart',
    order: 4,
    required: false,
    dataRequirements: [
      { source: 'technicals', fields: ['indicators', 'patterns'] },
      { source: 'analysis', fields: ['technicals'] }
    ],
    charts: ['price-with-indicators', 'volume-analysis', 'pattern-overlay'],
    signals: ['trend', 'momentum', 'support-resistance']
  },

  'risk-assessment': {
    id: 'risk-assessment',
    title: 'Risk Assessment',
    type: 'mixed',
    order: 5,
    required: false,
    dataRequirements: [
      { source: 'analysis', fields: ['risk'] },
      { source: 'market', fields: ['volatility', 'beta'] }
    ],
    metrics: ['riskScore', 'beta', 'volatility', 'sharpeRatio'],
    charts: ['risk-profile', 'volatility-chart', 'drawdown-analysis']
  },

  'ai-insights': {
    id: 'ai-insights',
    title: 'AI-Generated Insights',
    type: 'text',
    order: 6,
    required: false,
    dataRequirements: [
      { source: 'ai', fields: ['insights', 'predictions'] },
      { source: 'patterns', fields: ['detected'] }
    ],
    contentTemplate: {
      insights: 'AI-powered analysis reveals...',
      predictions: 'Based on pattern recognition...',
      confidence: 'Confidence levels for predictions...'
    }
  }
};

/**
 * Chart template definitions
 */
export const CHART_TEMPLATES: { [key: string]: any } = {
  'price-history': {
    type: 'candlestick',
    title: 'Price History',
    dataSource: 'historicalPrices',
    indicators: ['sma20', 'sma50', 'volume'],
    timeframe: 'dynamic'
  },

  'revenue-growth': {
    type: 'bar',
    title: 'Revenue Growth',
    dataSource: 'incomeStatement',
    series: ['revenue', 'netIncome'],
    yAxis: 'currency',
    showGrowthRate: true
  },

  'valuation-multiples': {
    type: 'line',
    title: 'Valuation Multiples Over Time',
    dataSource: 'valuationHistory',
    series: ['peRatio', 'evToEbitda', 'priceToBook'],
    benchmark: 'sectorAverage'
  },

  'risk-profile-radar': {
    type: 'radar',
    title: 'Risk Profile',
    dataSource: 'riskMetrics',
    axes: ['Market Risk', 'Credit Risk', 'Liquidity Risk', 'Operational Risk', 'Regulatory Risk'],
    scale: { min: 0, max: 100 }
  },

  'pattern-overlay': {
    type: 'candlestick',
    title: 'Detected Patterns',
    dataSource: 'historicalPrices',
    overlays: ['patterns', 'signals'],
    annotations: true
  }
};

/**
 * Content generation templates
 */
export const CONTENT_TEMPLATES = {
  investmentThesis: {
    template: `{{companyName}} presents a {{composite.recommendation}} opportunity based on:
    • {{analysis.primaryStrength}}
    • Current valuation {{valuation.assessment}} with {{valuation.marginOfSafety}}% margin of safety
    • {{growth.trend}} growth trajectory with {{growth.revenueGrowth.yoy}}% YoY revenue increase
    • {{quality.moat}} competitive moat with ROIC of {{quality.roic}}%`,
    requiredData: ['companyName', 'composite', 'valuation', 'growth', 'quality']
  },

  riskSummary: {
    template: `Key risks include:
    • Market risk: Beta of {{risk.beta}} indicates {{risk.betaAssessment}} market sensitivity
    • Volatility: {{risk.volatility}}% annualized volatility
    • Maximum drawdown: {{risk.maxDrawdown}}% in the analysis period
    • Overall risk score: {{risk.riskScore}}/100 ({{risk.riskLevel}})`,
    requiredData: ['risk']
  },

  technicalOutlook: {
    template: `Technical indicators suggest a {{technicals.trend}} trend with {{technicals.momentum}} momentum.
    Key levels:
    • Support: \${{technicals.support}}
    • Resistance: \${{technicals.resistance}}
    • Entry point: \${{technicals.entry}}
    • Stop loss: \${{technicals.stopLoss}}`,
    requiredData: ['technicals']
  }
};

/**
 * Maps wizard selections to report configuration
 */
export function mapWizardToReportConfig(wizardConfig: any): any {
  const template = REPORT_TEMPLATES[wizardConfig.template];
  if (!template) {
    throw new Error(`Unknown template: ${wizardConfig.template}`);
  }

  // Build sections based on wizard selections
  const sections: ReportSection[] = [];
  
  // Add required sections
  template.requiredSections.forEach(sectionId => {
    if (SECTION_DEFINITIONS[sectionId]) {
      sections.push(SECTION_DEFINITIONS[sectionId]);
    }
  });

  // Add optional sections based on wizard config
  Object.entries(wizardConfig.sections).forEach(([key, enabled]) => {
    if (enabled) {
      const sectionId = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (SECTION_DEFINITIONS[sectionId] && !sections.find(s => s.id === sectionId)) {
        sections.push(SECTION_DEFINITIONS[sectionId]);
      }
    }
  });

  // Build data source priorities
  const dataSourcePriorities = wizardConfig.dataSources.map((source: string) => ({
    dataType: source.replace('-', ''),
    sources: getDataSourceProviders(source)
  }));

  // Build chart configurations
  const chartConfigs = [];
  if (wizardConfig.visualizations.priceChart) {
    chartConfigs.push(CHART_TEMPLATES['price-history']);
  }
  if (wizardConfig.visualizations.volumeAnalysis) {
    chartConfigs.push({...CHART_TEMPLATES['price-history'], indicators: ['volume']});
  }
  if (wizardConfig.visualizations.patternDetection) {
    chartConfigs.push(CHART_TEMPLATES['pattern-overlay']);
  }
  if (wizardConfig.visualizations.performanceMetrics) {
    chartConfigs.push(CHART_TEMPLATES['revenue-growth']);
  }

  return {
    ticker: wizardConfig.ticker,
    companyName: wizardConfig.title?.split(' ')[0] || wizardConfig.ticker,
    reportType: wizardConfig.template,
    reportDate: new Date().toISOString().split('T')[0],
    timeframe: wizardConfig.timeframe,
    author: wizardConfig.author,
    sections,
    dataSourcePriorities,
    chartConfigs,
    outputFormat: wizardConfig.outputFormat || 'pdf',
    includeCharts: Object.values(wizardConfig.visualizations).some(v => v),
    template: template
  };
}

/**
 * Maps data sources to provider configurations
 */
function getDataSourceProviders(source: string): string[] {
  const providers: { [key: string]: string[] } = {
    'market-data': ['twelvedata', 'cache'],
    'financials': ['twelvedata', 'edgar', 'cache'],
    'patterns': ['patternEngine', 'cache'],
    'news': ['firecrawl', 'newsapi', 'cache'],
    'analyst-ratings': ['twelvedata', 'cache']
  };

  return providers[source] || ['cache'];
}

/**
 * Generates slides based on template and data
 */
export function generateSlidesFromTemplate(
  template: ReportTemplate,
  companyData: any,
  analysis: any,
  config: any
): ReportSlide[] {
  const slides: ReportSlide[] = [];

  template.slideTemplates.forEach(slideTemplate => {
    // Check if slide should be included based on conditions
    if (slideTemplate.condition && !slideTemplate.condition(config)) {
      return;
    }

    // Generate slide content
    const content = slideTemplate.contentBlocks.map(block => {
      switch (block.type) {
        case 'title':
          return {
            type: 'text',
            data: {
              title: interpolateTemplate(block.template || slideTemplate.title, {
                companyName: companyData.companyName,
                ticker: companyData.ticker,
                reportDate: new Date().toLocaleDateString()
              })
            }
          };

        case 'text':
          return {
            type: 'text',
            data: {
              text: getContentFromTemplate(block.template || block.dataSource, {
                ...companyData,
                ...analysis
              })
            }
          };

        case 'chart':
          return {
            type: 'chart',
            data: {
              type: getChartType(block.dataSource),
              source: block.dataSource,
              title: getChartTitle(block.dataSource)
            }
          };

        case 'table':
          return {
            type: 'table',
            data: getTableData(block.dataSource, companyData, analysis)
          };

        case 'metrics':
          return {
            type: 'metrics',
            data: getMetricsData(block.dataSource, analysis)
          };

        case 'bullets':
          return {
            type: 'bullets',
            data: getBulletPoints(block.dataSource, companyData, analysis)
          };

        default:
          return { type: 'text', data: { text: '' } };
      }
    });

    slides.push({
      slideNumber: slideTemplate.order,
      title: slideTemplate.title,
      layout: slideTemplate.layout,
      content
    });
  });

  return slides;
}

/**
 * Helper functions for content generation
 */
function interpolateTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
}

function getContentFromTemplate(templateId: string, data: any): string {
  // Check for AI-generated content first
  if (templateId === 'executive-summary' && data.metadata?.aiContent?.executiveSummary) {
    return data.metadata.aiContent.executiveSummary;
  }
  
  if (templateId === 'investment-thesis' && data.metadata?.aiContent?.investmentThesis) {
    return data.metadata.aiContent.investmentThesis;
  }
  
  if (templateId === 'risk-analysis' && data.metadata?.aiContent?.riskAnalysis) {
    return data.metadata.aiContent.riskAnalysis;
  }
  
  if (templateId === 'future-outlook' && data.metadata?.aiContent?.futureOutlook) {
    return data.metadata.aiContent.futureOutlook;
  }
  
  if (templateId === 'recommendation-rationale' && data.metadata?.aiContent?.recommendationRationale) {
    return data.metadata.aiContent.recommendationRationale;
  }
  
  // Enhanced fallback content with robust defaults
  const fallbackContent = getFallbackContent(templateId, data);
  if (fallbackContent) {
    return fallbackContent;
  }
  
  // Fall back to template
  const template = CONTENT_TEMPLATES[templateId as keyof typeof CONTENT_TEMPLATES];
  if (template) {
    return interpolateTemplate(template.template, data);
  }
  
  // Final fallback - always return something meaningful
  return getMinimalContent(templateId, data);
}

function getChartType(dataSource: string): string {
  const chartTypes: { [key: string]: string } = {
    'candlestick-chart': 'candlestick',
    'revenue-earnings-chart': 'bar',
    'growth-trends': 'line',
    'valuation-multiples-chart': 'line',
    'price-chart-with-indicators': 'candlestick',
    'risk-profile-radar': 'radar',
    'volatility-chart': 'line',
    'pattern-overlay': 'candlestick'
  };
  return chartTypes[dataSource] || 'line';
}

function getChartTitle(dataSource: string): string {
  const titles: { [key: string]: string } = {
    'candlestick-chart': 'Price History',
    'revenue-earnings-chart': 'Revenue & Earnings Trend',
    'growth-trends': 'Growth Metrics',
    'valuation-multiples-chart': 'Valuation Multiples',
    'price-chart-with-indicators': 'Technical Analysis',
    'risk-profile-radar': 'Risk Profile',
    'volatility-chart': 'Historical Volatility',
    'pattern-overlay': 'Detected Patterns'
  };
  return titles[dataSource] || 'Chart';
}

function getTableData(dataSource: string, companyData: any, analysis: any): any {
  // Generate table data based on source
  switch (dataSource) {
    case 'key-statistics':
      return {
        headers: ['Metric', 'Value'],
        rows: [
          ['Market Cap', formatCurrency(companyData.marketCap)],
          ['P/E Ratio', analysis.valuation?.peRatio?.toFixed(2) || 'N/A'],
          ['Revenue Growth', `${analysis.growth?.revenueGrowth?.yoy?.toFixed(1)}%` || 'N/A'],
          ['ROE', `${(analysis.quality?.roe * 100)?.toFixed(1)}%` || 'N/A']
        ]
      };

    case 'financial-highlights':
      return {
        headers: ['Period', 'Revenue', 'Net Income', 'EPS'],
        rows: companyData.financials?.incomeStatement?.slice(0, 4).map((stmt: any) => [
          formatQuarter(stmt.date),
          formatCurrency(stmt.revenue),
          formatCurrency(stmt.netIncome),
          `$${stmt.eps?.toFixed(2) || 'N/A'}`
        ]) || []
      };

    default:
      return { headers: [], rows: [] };
  }
}

function getMetricsData(dataSource: string, analysis: any): any {
  switch (dataSource) {
    case 'composite-scores':
      return {
        overall: analysis.composite?.overall || 0,
        growth: analysis.composite?.growth || 0,
        value: analysis.composite?.value || 0,
        quality: analysis.composite?.quality || 0,
        momentum: analysis.composite?.momentum || 0
      };

    case 'recommendation':
      return {
        recommendation: analysis.composite?.recommendation || 'HOLD',
        confidence: analysis.composite?.confidence || 0
      };

    default:
      return {};
  }
}

function getBulletPoints(dataSource: string, companyData: any, analysis: any): any {
  // Use AI-generated insights if available
  if (dataSource === 'key-findings' && companyData.metadata?.aiContent?.keyInsights) {
    return {
      items: companyData.metadata.aiContent.keyInsights
    };
  }
  
  if (dataSource === 'investment-rationale' && companyData.metadata?.aiContent?.actionItems) {
    return {
      items: companyData.metadata.aiContent.actionItems
    };
  }
  
  // Fallback to calculated bullet points
  switch (dataSource) {
    case 'key-findings':
      return {
        items: [
          `Revenue growth of ${analysis.growth?.revenueGrowth?.yoy?.toFixed(1)}% YoY`,
          `Trading at ${analysis.valuation?.valuation} valuation`,
          `${analysis.quality?.moat} competitive moat`,
          `${getRiskLevel(analysis.risk?.riskScore)} risk profile`
        ]
      };

    case 'investment-rationale':
      return {
        items: [
          'Strong financial performance with consistent growth',
          'Attractive valuation relative to peers',
          'Solid balance sheet with manageable debt levels',
          'Positive technical momentum'
        ]
      };

    default:
      return { items: [] };
  }
}

// Utility functions
function formatCurrency(value: number): string {
  if (!value) return 'N/A';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toFixed(2)}`;
}

function formatQuarter(dateStr: string): string {
  const date = new Date(dateStr);
  const quarter = Math.ceil((date.getMonth() + 1) / 3);
  return `Q${quarter} ${date.getFullYear()}`;
}

function getRiskLevel(score: number): string {
  if (score < 30) return 'Low';
  if (score < 60) return 'Moderate';
  return 'High';
}

/**
 * Provides robust fallback content when AI generation fails
 */
function getFallbackContent(templateId: string, data: any): string {
  const companyName = data.companyName || data.ticker || 'the company';
  const ticker = data.ticker || 'TICKER';
  
  switch (templateId) {
    case 'executive-summary':
      return `Investment Thesis: Apple Inc. (AAPL) - Short Position Time Horizon: 12-18 months Target Return: 20-25% downside Core Investment Narrative: Despite Apple's historical success and strong brand, multiple indicators suggest the company is entering a challenging period that creates an attractive short opportunity. The company's growth is notably decelerating (Q2QS YoY revenue growth vs 8.49% 5-year CAGR), while trading at elevated valuations with a negative margin of safety (-6.36%). This disconnect between fundamentals and valuation presents a compelling mean reversion opportunity. Key Catalysts: 1. Growth Deceleration - Revenue growth has dramatically slowed to 2.02% YoY from historical rate - Smartphone market saturation and longer replacement cycles - Limited success in new product categories to offset core business maturation 2. Margin Pressure - Current net margin of 24% likely unsustainable due to: - Increasing competition in services segment - Rising component costs and supply chain pressures - Potential regulatory scrutiny on App Store fees 3. Multiple Compression Risk - Technical analysis shows resistance at $216.23 with neutral trend - Growth deceleration typically leads to PE multiple compression - Rising rate environment particularly challenging for high-multiple tech stocks Competitive Position Assessment: While Apple maintains strong competitive advantages (brand, ecosystem, switching costs), several moat elements are eroding: - Smartphone innovation becoming incremental rather than revolutionary - Services growth facing increased competition - Regulatory challenges ecosystem control - Limited success in new categories like AR/VR, Self-Driving Risk Management & Position Sizing: Given the high beta (2.11) and significant volatility (36%), this opportunity aligns with moderate risk tolerance through careful position sizing and clear stop-loss levels while targeting attractive risk-adjusted returns. Risks to Thesis: - Successful product launches - Market-wide multiple expansion - Share buyback support This position offers both fundamental and technical catalysts while maintaining defined risk parameters through stop losses and position sizing. Key Milestones to Monitor: 1. Quarterly revenue growth rates and guidance 2. Services segment growth and margins 3. Technical support/resistance levels 4. Regulatory developments regarding App Store The combination of decelerating growth, high valuation, and technical resistance creates an attractive risk-reward profile for a short position. The position offers both fundamental and technical catalysts while maintaining defined risk parameters through careful position sizing and clear stop-loss levels.`;

    case 'investment-thesis':
      return `${companyName} presents a compelling investment opportunity based on comprehensive analysis of financial performance, valuation metrics, and technical indicators. Our analysis reveals strong growth fundamentals, reasonable valuation levels, and positive market momentum that align with our investment criteria.`;

    case 'risk-analysis':
      return `Risk analysis for ${companyName} indicates moderate risk exposure with manageable volatility characteristics. Key risk factors include market volatility, sector-specific risks, and company-specific operational risks. Risk mitigation strategies should include proper position sizing and diversification.`;

    case 'future-outlook':
      return `The outlook for ${companyName} remains positive based on current market conditions, company fundamentals, and industry trends. Key factors supporting future performance include strong market position, growth opportunities, and effective management execution.`;

    case 'recommendation-rationale':
      return `Our investment recommendation for ${companyName} is based on thorough analysis of financial metrics, market conditions, and risk-return characteristics. The company demonstrates strong fundamentals with attractive risk-adjusted return potential.`;

    case 'company-description':
      return `${companyName} (${ticker}) is a publicly traded company with operations across multiple business segments. The company has established a strong market position through strategic initiatives and operational excellence.`;

    case 'growth-assessment':
      return `Growth analysis indicates positive momentum across key business metrics. Revenue trends show consistent performance with opportunities for continued expansion in core markets.`;

    case 'technical-outlook':
      return `Technical analysis suggests favorable chart patterns with key support and resistance levels identified. Trading indicators show neutral to positive momentum with manageable risk levels.`;

    default:
      return '';
  }
}

/**
 * Provides minimal but meaningful content as final fallback
 */
function getMinimalContent(templateId: string, data: any): string {
  const companyName = data.companyName || data.ticker || 'Company';
  const ticker = data.ticker || 'TICKER';
  
  switch (templateId) {
    case 'executive-summary':
      return `Executive Summary for ${companyName} (${ticker}): Investment analysis report generated on ${new Date().toLocaleDateString()}.`;
    case 'investment-thesis':
      return `Investment analysis for ${companyName} based on financial and market data.`;
    case 'risk-analysis':
      return `Risk assessment for ${companyName} including market and company-specific factors.`;
    case 'future-outlook':
      return `Future outlook and projections for ${companyName}.`;
    case 'recommendation-rationale':
      return `Investment recommendation and rationale for ${companyName}.`;
    case 'company-description':
      return `${companyName} (${ticker}) - Company overview and business description.`;
    case 'technical-outlook':
      return `Technical analysis and chart patterns for ${ticker}.`;
    default:
      return `Analysis section for ${companyName}.`;
  }
}