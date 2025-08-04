"use strict";
// src/reportGeneration/templates/reportTemplates.ts
// Comprehensive report template definitions
// Context: Maps wizard selections to actual report content structure
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.generateSlidesFromTemplate = exports.mapWizardToReportConfig = exports.CONTENT_TEMPLATES = exports.CHART_TEMPLATES = exports.SECTION_DEFINITIONS = exports.REPORT_TEMPLATES = void 0;
/**
 * Master template registry
 */
exports.REPORT_TEMPLATES = {
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
                condition: function (config) { return config.sections.financialAnalysis; }
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
                condition: function (config) { return config.sections.financialAnalysis; }
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
                condition: function (config) { return config.sections.technicalAnalysis; }
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
                condition: function (config) { return config.sections.riskAssessment; }
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
                condition: function (config) { return config.dataSources.includes('patterns'); }
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
                condition: function (config) { return config.sections.scenarioAnalysis; }
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
exports.SECTION_DEFINITIONS = {
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
exports.CHART_TEMPLATES = {
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
exports.CONTENT_TEMPLATES = {
    investmentThesis: {
        template: "{{companyName}} presents a {{composite.recommendation}} opportunity based on:\n    \u2022 {{analysis.primaryStrength}}\n    \u2022 Current valuation {{valuation.assessment}} with {{valuation.marginOfSafety}}% margin of safety\n    \u2022 {{growth.trend}} growth trajectory with {{growth.revenueGrowth.yoy}}% YoY revenue increase\n    \u2022 {{quality.moat}} competitive moat with ROIC of {{quality.roic}}%",
        requiredData: ['companyName', 'composite', 'valuation', 'growth', 'quality']
    },
    riskSummary: {
        template: "Key risks include:\n    \u2022 Market risk: Beta of {{risk.beta}} indicates {{risk.betaAssessment}} market sensitivity\n    \u2022 Volatility: {{risk.volatility}}% annualized volatility\n    \u2022 Maximum drawdown: {{risk.maxDrawdown}}% in the analysis period\n    \u2022 Overall risk score: {{risk.riskScore}}/100 ({{risk.riskLevel}})",
        requiredData: ['risk']
    },
    technicalOutlook: {
        template: "Technical indicators suggest a {{technicals.trend}} trend with {{technicals.momentum}} momentum.\n    Key levels:\n    \u2022 Support: ${{technicals.support}}\n    \u2022 Resistance: ${{technicals.resistance}}\n    \u2022 Entry point: ${{technicals.entry}}\n    \u2022 Stop loss: ${{technicals.stopLoss}}",
        requiredData: ['technicals']
    }
};
/**
 * Maps wizard selections to report configuration
 */
function mapWizardToReportConfig(wizardConfig) {
    var _a;
    var template = exports.REPORT_TEMPLATES[wizardConfig.template];
    if (!template) {
        throw new Error("Unknown template: ".concat(wizardConfig.template));
    }
    // Build sections based on wizard selections
    var sections = [];
    // Add required sections
    template.requiredSections.forEach(function (sectionId) {
        if (exports.SECTION_DEFINITIONS[sectionId]) {
            sections.push(exports.SECTION_DEFINITIONS[sectionId]);
        }
    });
    // Add optional sections based on wizard config
    Object.entries(wizardConfig.sections).forEach(function (_a) {
        var key = _a[0], enabled = _a[1];
        if (enabled) {
            var sectionId_1 = key.replace(/([A-Z])/g, '-$1').toLowerCase();
            if (exports.SECTION_DEFINITIONS[sectionId_1] && !sections.find(function (s) { return s.id === sectionId_1; })) {
                sections.push(exports.SECTION_DEFINITIONS[sectionId_1]);
            }
        }
    });
    // Build data source priorities
    var dataSourcePriorities = wizardConfig.dataSources.map(function (source) { return ({
        dataType: source.replace('-', ''),
        sources: getDataSourceProviders(source)
    }); });
    // Build chart configurations
    var chartConfigs = [];
    if (wizardConfig.visualizations.priceChart) {
        chartConfigs.push(exports.CHART_TEMPLATES['price-history']);
    }
    if (wizardConfig.visualizations.volumeAnalysis) {
        chartConfigs.push(__assign(__assign({}, exports.CHART_TEMPLATES['price-history']), { indicators: ['volume'] }));
    }
    if (wizardConfig.visualizations.patternDetection) {
        chartConfigs.push(exports.CHART_TEMPLATES['pattern-overlay']);
    }
    if (wizardConfig.visualizations.performanceMetrics) {
        chartConfigs.push(exports.CHART_TEMPLATES['revenue-growth']);
    }
    return {
        ticker: wizardConfig.ticker,
        companyName: ((_a = wizardConfig.title) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || wizardConfig.ticker,
        reportType: wizardConfig.template,
        reportDate: new Date().toISOString().split('T')[0],
        timeframe: wizardConfig.timeframe,
        author: wizardConfig.author,
        sections: sections,
        dataSourcePriorities: dataSourcePriorities,
        chartConfigs: chartConfigs,
        outputFormat: wizardConfig.outputFormat || 'pdf',
        includeCharts: Object.values(wizardConfig.visualizations).some(function (v) { return v; }),
        template: template
    };
}
exports.mapWizardToReportConfig = mapWizardToReportConfig;
/**
 * Maps data sources to provider configurations
 */
function getDataSourceProviders(source) {
    var providers = {
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
function generateSlidesFromTemplate(template, companyData, analysis, config) {
    var slides = [];
    template.slideTemplates.forEach(function (slideTemplate) {
        // Check if slide should be included based on conditions
        if (slideTemplate.condition && !slideTemplate.condition(config)) {
            return;
        }
        // Generate slide content
        var content = slideTemplate.contentBlocks.map(function (block) {
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
                            text: getContentFromTemplate(block.template || block.dataSource, __assign(__assign({}, companyData), analysis))
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
            content: content
        });
    });
    return slides;
}
exports.generateSlidesFromTemplate = generateSlidesFromTemplate;
/**
 * Helper functions for content generation
 */
function interpolateTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, function (match, key) {
        return data[key] || match;
    });
}
function getContentFromTemplate(templateId, data) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Check for AI-generated content first
    if (templateId === 'executive-summary' && ((_b = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.aiContent) === null || _b === void 0 ? void 0 : _b.executiveSummary)) {
        return data.metadata.aiContent.executiveSummary;
    }
    if (templateId === 'investment-thesis' && ((_d = (_c = data.metadata) === null || _c === void 0 ? void 0 : _c.aiContent) === null || _d === void 0 ? void 0 : _d.investmentThesis)) {
        return data.metadata.aiContent.investmentThesis;
    }
    if (templateId === 'risk-analysis' && ((_f = (_e = data.metadata) === null || _e === void 0 ? void 0 : _e.aiContent) === null || _f === void 0 ? void 0 : _f.riskAnalysis)) {
        return data.metadata.aiContent.riskAnalysis;
    }
    if (templateId === 'future-outlook' && ((_h = (_g = data.metadata) === null || _g === void 0 ? void 0 : _g.aiContent) === null || _h === void 0 ? void 0 : _h.futureOutlook)) {
        return data.metadata.aiContent.futureOutlook;
    }
    if (templateId === 'recommendation-rationale' && ((_k = (_j = data.metadata) === null || _j === void 0 ? void 0 : _j.aiContent) === null || _k === void 0 ? void 0 : _k.recommendationRationale)) {
        return data.metadata.aiContent.recommendationRationale;
    }
    // Fall back to template
    var template = exports.CONTENT_TEMPLATES[templateId];
    if (template) {
        return interpolateTemplate(template.template, data);
    }
    return '';
}
function getChartType(dataSource) {
    var chartTypes = {
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
function getChartTitle(dataSource) {
    var titles = {
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
function getTableData(dataSource, companyData, analysis) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    // Generate table data based on source
    switch (dataSource) {
        case 'key-statistics':
            return {
                headers: ['Metric', 'Value'],
                rows: [
                    ['Market Cap', formatCurrency(companyData.marketCap)],
                    ['P/E Ratio', ((_b = (_a = analysis.valuation) === null || _a === void 0 ? void 0 : _a.peRatio) === null || _b === void 0 ? void 0 : _b.toFixed(2)) || 'N/A'],
                    ['Revenue Growth', "".concat((_e = (_d = (_c = analysis.growth) === null || _c === void 0 ? void 0 : _c.revenueGrowth) === null || _d === void 0 ? void 0 : _d.yoy) === null || _e === void 0 ? void 0 : _e.toFixed(1), "%") || 'N/A'],
                    ['ROE', "".concat((_g = (((_f = analysis.quality) === null || _f === void 0 ? void 0 : _f.roe) * 100)) === null || _g === void 0 ? void 0 : _g.toFixed(1), "%") || 'N/A']
                ]
            };
        case 'financial-highlights':
            return {
                headers: ['Period', 'Revenue', 'Net Income', 'EPS'],
                rows: ((_j = (_h = companyData.financials) === null || _h === void 0 ? void 0 : _h.incomeStatement) === null || _j === void 0 ? void 0 : _j.slice(0, 4).map(function (stmt) {
                    var _a;
                    return [
                        formatQuarter(stmt.date),
                        formatCurrency(stmt.revenue),
                        formatCurrency(stmt.netIncome),
                        "$".concat(((_a = stmt.eps) === null || _a === void 0 ? void 0 : _a.toFixed(2)) || 'N/A')
                    ];
                })) || []
            };
        default:
            return { headers: [], rows: [] };
    }
}
function getMetricsData(dataSource, analysis) {
    var _a, _b, _c, _d, _e, _f, _g;
    switch (dataSource) {
        case 'composite-scores':
            return {
                overall: ((_a = analysis.composite) === null || _a === void 0 ? void 0 : _a.overall) || 0,
                growth: ((_b = analysis.composite) === null || _b === void 0 ? void 0 : _b.growth) || 0,
                value: ((_c = analysis.composite) === null || _c === void 0 ? void 0 : _c.value) || 0,
                quality: ((_d = analysis.composite) === null || _d === void 0 ? void 0 : _d.quality) || 0,
                momentum: ((_e = analysis.composite) === null || _e === void 0 ? void 0 : _e.momentum) || 0
            };
        case 'recommendation':
            return {
                recommendation: ((_f = analysis.composite) === null || _f === void 0 ? void 0 : _f.recommendation) || 'HOLD',
                confidence: ((_g = analysis.composite) === null || _g === void 0 ? void 0 : _g.confidence) || 0
            };
        default:
            return {};
    }
}
function getBulletPoints(dataSource, companyData, analysis) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // Use AI-generated insights if available
    if (dataSource === 'key-findings' && ((_b = (_a = companyData.metadata) === null || _a === void 0 ? void 0 : _a.aiContent) === null || _b === void 0 ? void 0 : _b.keyInsights)) {
        return {
            items: companyData.metadata.aiContent.keyInsights
        };
    }
    if (dataSource === 'investment-rationale' && ((_d = (_c = companyData.metadata) === null || _c === void 0 ? void 0 : _c.aiContent) === null || _d === void 0 ? void 0 : _d.actionItems)) {
        return {
            items: companyData.metadata.aiContent.actionItems
        };
    }
    // Fallback to calculated bullet points
    switch (dataSource) {
        case 'key-findings':
            return {
                items: [
                    "Revenue growth of ".concat((_g = (_f = (_e = analysis.growth) === null || _e === void 0 ? void 0 : _e.revenueGrowth) === null || _f === void 0 ? void 0 : _f.yoy) === null || _g === void 0 ? void 0 : _g.toFixed(1), "% YoY"),
                    "Trading at ".concat((_h = analysis.valuation) === null || _h === void 0 ? void 0 : _h.valuation, " valuation"),
                    "".concat((_j = analysis.quality) === null || _j === void 0 ? void 0 : _j.moat, " competitive moat"),
                    "".concat(getRiskLevel((_k = analysis.risk) === null || _k === void 0 ? void 0 : _k.riskScore), " risk profile")
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
function formatCurrency(value) {
    if (!value)
        return 'N/A';
    if (value >= 1e9)
        return "$".concat((value / 1e9).toFixed(2), "B");
    if (value >= 1e6)
        return "$".concat((value / 1e6).toFixed(2), "M");
    return "$".concat(value.toFixed(2));
}
function formatQuarter(dateStr) {
    var date = new Date(dateStr);
    var quarter = Math.ceil((date.getMonth() + 1) / 3);
    return "Q".concat(quarter, " ").concat(date.getFullYear());
}
function getRiskLevel(score) {
    if (score < 30)
        return 'Low';
    if (score < 60)
        return 'Moderate';
    return 'High';
}
