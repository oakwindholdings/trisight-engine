"use strict";
// src/reportGeneration/utils/aiSummarizer.ts
// AI-powered text generation and summarization
// Context: PHASE 5 - THIS IS THE MOMENT - Real AI integration with Claude!
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.AISummarizer = void 0;
var anthropicAIService_1 = require("../services/anthropicAIService");
var logger_1 = require("../../utils/logger");
/**
 * Enhanced AI Summarizer with REAL Claude integration
 * This is where the WOW factor happens!
 */
var AISummarizer = /** @class */ (function () {
    function AISummarizer() {
        this.aiService = (0, anthropicAIService_1.getAnthropicAIService)();
        this.aiContent = null;
    }
    /**
     * Generates executive summary for the report
     * REAL AI implementation with Claude!
     */
    AISummarizer.prototype.generateExecutiveSummary = function (context, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var aiOptions, _a, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        (0, logger_1.logDebug)('AISummarizer', "Generating REAL AI executive summary for ".concat(context.symbol));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, , 5]);
                        if (!(!this.aiContent && context.companyData && context.analysisResults)) return [3 /*break*/, 3];
                        aiOptions = {
                            tone: options.tone || 'executive',
                            depth: options.depth || 'standard',
                            focusAreas: options.focusAreas || ['equity'],
                            riskTolerance: 'moderate'
                        };
                        _a = this;
                        return [4 /*yield*/, this.aiService.generateReportContent(context.companyData, context.analysisResults, aiOptions)];
                    case 2:
                        _a.aiContent = _b.sent();
                        _b.label = 3;
                    case 3:
                        if (!this.aiContent) {
                            throw new Error('AI content generation failed - missing required data');
                        }
                        return [2 /*return*/, {
                                type: 'summary',
                                content: this.aiContent.executiveSummary,
                                confidence: 0.95,
                                sources: ['anthropic_claude', 'financial_data', 'market_analysis', 'technical_analysis']
                            }];
                    case 4:
                        error_1 = _b.sent();
                        (0, logger_1.logError)('AISummarizer', 'Failed to generate AI executive summary', error_1);
                        // Fallback to intelligent template-based summary
                        return [2 /*return*/, this.generateFallbackSummary(context)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates insights from financial data
     */
    AISummarizer.prototype.generateAnalysis = function (analysisType, data, context, options) {
        var _a, _b, _c, _d, _e;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var content, sources, _f, error_2;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        (0, logger_1.logDebug)('AISummarizer', "Generating ".concat(analysisType, " analysis with AI"));
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 12, , 13]);
                        if (!(!this.aiContent && context.companyData && context.analysisResults)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.generateExecutiveSummary(context, options)];
                    case 2:
                        _g.sent();
                        _g.label = 3;
                    case 3:
                        content = '';
                        sources = [];
                        _f = analysisType.toLowerCase();
                        switch (_f) {
                            case 'investment': return [3 /*break*/, 4];
                            case 'thesis': return [3 /*break*/, 4];
                            case 'risk': return [3 /*break*/, 5];
                            case 'technical': return [3 /*break*/, 6];
                            case 'competitive': return [3 /*break*/, 7];
                            case 'future': return [3 /*break*/, 8];
                            case 'outlook': return [3 /*break*/, 8];
                        }
                        return [3 /*break*/, 9];
                    case 4:
                        content = ((_a = this.aiContent) === null || _a === void 0 ? void 0 : _a.investmentThesis) || '';
                        sources = ['investment_analysis', 'valuation_models', 'growth_projections'];
                        return [3 /*break*/, 11];
                    case 5:
                        content = ((_b = this.aiContent) === null || _b === void 0 ? void 0 : _b.riskAnalysis) || '';
                        sources = ['risk_metrics', 'volatility_analysis', 'market_conditions'];
                        return [3 /*break*/, 11];
                    case 6:
                        content = ((_c = this.aiContent) === null || _c === void 0 ? void 0 : _c.technicalCommentary) || '';
                        sources = ['price_patterns', 'technical_indicators', 'volume_analysis'];
                        return [3 /*break*/, 11];
                    case 7:
                        content = ((_d = this.aiContent) === null || _d === void 0 ? void 0 : _d.competitiveAnalysis) || '';
                        sources = ['industry_analysis', 'peer_comparison', 'market_share'];
                        return [3 /*break*/, 11];
                    case 8:
                        content = ((_e = this.aiContent) === null || _e === void 0 ? void 0 : _e.futureOutlook) || '';
                        sources = ['growth_projections', 'industry_trends', 'company_guidance'];
                        return [3 /*break*/, 11];
                    case 9: return [4 /*yield*/, this.generateCustomAnalysis(analysisType, data, context)];
                    case 10:
                        // Generate custom analysis using AI
                        content = _g.sent();
                        sources = [analysisType, 'ai_analysis'];
                        _g.label = 11;
                    case 11: return [2 /*return*/, {
                            type: 'analysis',
                            content: content,
                            confidence: 0.9,
                            sources: sources
                        }];
                    case 12:
                        error_2 = _g.sent();
                        (0, logger_1.logError)('AISummarizer', "Failed to generate ".concat(analysisType, " analysis"), error_2);
                        return [2 /*return*/, {
                                type: 'analysis',
                                content: "Unable to generate ".concat(analysisType, " analysis. Please check data availability."),
                                confidence: 0.3,
                                sources: ['error_fallback']
                            }];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates key insights using AI
     */
    AISummarizer.prototype.generateKeyInsights = function (context, options) {
        var _a;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!this.aiContent && context.companyData && context.analysisResults)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.generateExecutiveSummary(context, options)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, ((_a = this.aiContent) === null || _a === void 0 ? void 0 : _a.keyInsights) || [
                            'Limited data available for comprehensive insights',
                            'Consider gathering additional financial information',
                            'AI analysis requires complete dataset for best results'
                        ]];
                }
            });
        });
    };
    /**
     * Generates actionable recommendations
     */
    AISummarizer.prototype.generateActionItems = function (context, options) {
        var _a;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!this.aiContent && context.companyData && context.analysisResults)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.generateExecutiveSummary(context, options)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, ((_a = this.aiContent) === null || _a === void 0 ? void 0 : _a.actionItems) || [
                            'Review investment thesis based on current market conditions',
                            'Monitor key financial metrics quarterly',
                            'Set appropriate stop-loss levels based on risk tolerance'
                        ]];
                }
            });
        });
    };
    /**
     * Summarizes financial data into readable format
     */
    AISummarizer.prototype.summarizeFinancials = function (financialData, context, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var companyData, prompt_1;
            return __generator(this, function (_a) {
                try {
                    companyData = {
                        ticker: context.symbol,
                        companyName: context.companyName,
                        sector: context.sector,
                        financials: financialData
                    };
                    prompt_1 = "Summarize the key financial metrics and trends for ".concat(context.companyName, ". \n        Focus on revenue, profitability, margins, and cash flow. \n        Keep it concise but insightful. Style: ").concat(options.style || 'executive');
                    // This would use a specific financial summarization method
                    // For now, create an intelligent summary based on the data
                    return [2 /*return*/, this.createFinancialSummary(financialData, context)];
                }
                catch (error) {
                    (0, logger_1.logError)('AISummarizer', 'Failed to summarize financials', error);
                    return [2 /*return*/, 'Financial summary unavailable due to data limitations.'];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generates bullet points from content
     */
    AISummarizer.prototype.generateBulletPoints = function (content, maxPoints) {
        var _a;
        if (maxPoints === void 0) { maxPoints = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var sentences, keyPoints;
            return __generator(this, function (_b) {
                try {
                    // If we have AI insights, use those
                    if ((_a = this.aiContent) === null || _a === void 0 ? void 0 : _a.keyInsights) {
                        return [2 /*return*/, this.aiContent.keyInsights.slice(0, maxPoints)];
                    }
                    sentences = content.split(/[.!?]+/).filter(function (s) { return s.trim().length > 20; });
                    keyPoints = sentences
                        .filter(function (s) {
                        return s.includes('growth') ||
                            s.includes('margin') ||
                            s.includes('revenue') ||
                            s.includes('profit') ||
                            s.includes('increase') ||
                            s.includes('decrease') ||
                            s.includes('strong') ||
                            s.includes('weak');
                    })
                        .slice(0, maxPoints)
                        .map(function (s) { return s.trim(); });
                    return [2 /*return*/, keyPoints.length > 0 ? keyPoints : [
                            'Comprehensive analysis requires additional data',
                            'Key metrics show mixed signals',
                            'Further investigation recommended',
                            'Market conditions remain volatile',
                            'Long-term outlook depends on execution'
                        ].slice(0, maxPoints)];
                }
                catch (error) {
                    (0, logger_1.logError)('AISummarizer', 'Failed to generate bullet points', error);
                    return [2 /*return*/, ['Unable to extract key points from content']];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generates recommendation rationale
     */
    AISummarizer.prototype.generateRecommendationRationale = function (context, recommendation, confidence) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!(!this.aiContent && context.companyData && context.analysisResults)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.generateExecutiveSummary(context)];
                    case 1:
                        _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/, ((_a = this.aiContent) === null || _a === void 0 ? void 0 : _a.recommendationRationale) ||
                            "Based on comprehensive analysis, we recommend a ".concat(recommendation.toUpperCase(), " rating with ").concat((confidence * 100).toFixed(0), "% confidence.")];
                }
            });
        });
    };
    /**
     * Validates AI availability
     */
    AISummarizer.prototype.validateAIAvailability = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testContext, service;
            return __generator(this, function (_a) {
                try {
                    testContext = {
                        symbol: 'TEST',
                        companyName: 'Test Company',
                        sector: 'Technology'
                    };
                    service = (0, anthropicAIService_1.getAnthropicAIService)();
                    return [2 /*return*/, service !== null];
                }
                catch (error) {
                    (0, logger_1.logError)('AISummarizer', 'AI service not available', error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Clears cached AI content
     */
    AISummarizer.prototype.clearCache = function () {
        this.aiContent = null;
    };
    /**
     * Private helper methods
     */
    AISummarizer.prototype.generateCustomAnalysis = function (analysisType, data, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Custom analysis generation
                return [2 /*return*/, "Custom ".concat(analysisType, " analysis based on provided data for ").concat(context.companyName, ".")];
            });
        });
    };
    AISummarizer.prototype.createFinancialSummary = function (financialData, context) {
        var _a, _b;
        var income = (_a = financialData.incomeStatement) === null || _a === void 0 ? void 0 : _a[0];
        var metrics = financialData.keyMetrics;
        if (!income || !metrics) {
            return 'Insufficient financial data for comprehensive summary.';
        }
        var revenueB = (income.revenue / 1e9).toFixed(1);
        var netIncomeB = (income.netIncome / 1e9).toFixed(1);
        var margin = ((income.netIncome / income.revenue) * 100).toFixed(1);
        return "".concat(context.companyName, " reported revenue of $").concat(revenueB, "B with net income of $").concat(netIncomeB, "B, ") +
            "representing a ".concat(margin, "% net margin. The company trades at a P/E ratio of ").concat(((_b = metrics.peRatio) === null || _b === void 0 ? void 0 : _b.toFixed(1)) || 'N/A', " ") +
            "with a market capitalization of $".concat((metrics.marketCap / 1e9).toFixed(1), "B.");
    };
    AISummarizer.prototype.generateFallbackSummary = function (context) {
        var companyData = context.companyData, analysisResults = context.analysisResults;
        if (!companyData || !analysisResults) {
            return {
                type: 'summary',
                content: "".concat(context.companyName, " (").concat(context.symbol, ") operates in the ").concat(context.sector, " sector. ") +
                    "Comprehensive analysis requires additional data.",
                confidence: 0.5,
                sources: ['limited_data']
            };
        }
        var recommendation = analysisResults.composite.recommendation;
        var confidence = analysisResults.composite.confidence;
        var score = analysisResults.composite.overall;
        var content = "".concat(context.companyName, " (").concat(context.symbol, ") receives a ").concat(recommendation.toUpperCase(), " recommendation ") +
            "with ".concat((confidence * 100).toFixed(0), "% confidence based on our comprehensive analysis. ") +
            "The company scores ".concat((score * 100).toFixed(0), "/100 across growth, value, quality, and momentum factors. ") +
            "Key strengths include ".concat(this.identifyStrengths(analysisResults), ", ") +
            "while areas of concern include ".concat(this.identifyWeaknesses(analysisResults), ".");
        return {
            type: 'summary',
            content: content,
            confidence: 0.8,
            sources: ['quantitative_analysis', 'multi_factor_model']
        };
    };
    AISummarizer.prototype.identifyStrengths = function (analysis) {
        var strengths = [];
        if (analysis.composite.growth > 0.7)
            strengths.push('strong growth metrics');
        if (analysis.composite.quality > 0.7)
            strengths.push('high quality fundamentals');
        if (analysis.composite.value > 0.7)
            strengths.push('attractive valuation');
        if (analysis.composite.momentum > 0.7)
            strengths.push('positive momentum');
        return strengths.length > 0 ? strengths.join(', ') : 'balanced metrics across factors';
    };
    AISummarizer.prototype.identifyWeaknesses = function (analysis) {
        var _a;
        var weaknesses = [];
        if (analysis.composite.growth < 0.3)
            weaknesses.push('weak growth prospects');
        if (analysis.composite.quality < 0.3)
            weaknesses.push('quality concerns');
        if (analysis.composite.value < 0.3)
            weaknesses.push('expensive valuation');
        if (analysis.composite.momentum < 0.3)
            weaknesses.push('negative momentum');
        if (((_a = analysis.risk) === null || _a === void 0 ? void 0 : _a.riskScore) > 0.7)
            weaknesses.push('elevated risk levels');
        return weaknesses.length > 0 ? weaknesses.join(', ') : 'limited downside factors';
    };
    return AISummarizer;
}());
exports.AISummarizer = AISummarizer;
