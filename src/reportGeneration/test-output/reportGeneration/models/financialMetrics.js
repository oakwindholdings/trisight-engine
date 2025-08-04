"use strict";
// src/reportGeneration/models/financialMetrics.ts
// Financial calculation types and formulas
// Context: Ensures consistency in all financial computations
exports.__esModule = true;
exports.PRECISION = exports.isValidFinancialMetric = exports.isValidGrowthRate = exports.FORMULAS = void 0;
exports.FORMULAS = [
    {
        name: 'revenueGrowthRate',
        formula: '((currentRevenue - previousRevenue) / previousRevenue) * 100',
        inputs: ['currentRevenue', 'previousRevenue'],
        description: 'Calculates year-over-year revenue growth percentage',
        category: 'growth'
    },
    {
        name: 'peRatio',
        formula: 'marketPrice / earningsPerShare',
        inputs: ['marketPrice', 'earningsPerShare'],
        description: 'Price to Earnings ratio for valuation comparison',
        category: 'valuation'
    },
    {
        name: 'dcfValue',
        formula: 'Σ(FCF_t / (1 + r)^t) + TerminalValue / (1 + r)^n',
        inputs: ['freeCashFlows', 'discountRate', 'terminalValue', 'periods'],
        description: 'Discounted Cash Flow intrinsic value calculation',
        category: 'valuation'
    },
    {
        name: 'roic',
        formula: '(NOPAT / InvestedCapital) * 100',
        inputs: ['netOperatingProfitAfterTax', 'investedCapital'],
        description: 'Return on Invested Capital measures efficiency',
        category: 'quality'
    },
    {
        name: 'sharpeRatio',
        formula: '(portfolioReturn - riskFreeRate) / portfolioStdDev',
        inputs: ['portfolioReturn', 'riskFreeRate', 'portfolioStandardDeviation'],
        description: 'Risk-adjusted return metric',
        category: 'risk'
    }
];
// Type guards for runtime validation
function isValidGrowthRate(value) {
    return (typeof value === 'object' &&
        typeof value.yoy === 'number' &&
        typeof value.qoq === 'number' &&
        typeof value.cagr3 === 'number' &&
        typeof value.cagr5 === 'number' &&
        ['accelerating', 'stable', 'decelerating'].includes(value.trend));
}
exports.isValidGrowthRate = isValidGrowthRate;
function isValidFinancialMetric(value) {
    return !isNaN(value) && isFinite(value);
}
exports.isValidFinancialMetric = isValidFinancialMetric;
// Calculation precision constants
exports.PRECISION = {
    PRICE: 2,
    PERCENTAGE: 2,
    RATIO: 3,
    LARGE_NUMBER: 0,
    FINANCIAL_STATEMENT: 0
};
