"use strict";
// src/reportGeneration/core/reportGenerator.ts
// Main orchestrator for automated report generation
// Context: Coordinates all phases of report creation from data fetch to final output
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.createReportGenerator = exports.ReportGenerator = void 0;
var dataFetcher_1 = require("./dataFetcher");
var dataProcessor_1 = require("./dataProcessor");
var reportAssembler_1 = require("./reportAssembler");
var aiSummarizer_1 = require("../utils/aiSummarizer");
var progressTracker_1 = require("../utils/progressTracker");
var logger_1 = require("../../utils/logger");
var reportTemplates_1 = require("../templates/reportTemplates");
var ReportGenerator = /** @class */ (function () {
    function ReportGenerator(config) {
        var _this = this;
        this.config = config;
        this.status = {
            stage: 'fetching',
            progress: 0,
            currentTask: 'Initializing report generation',
            errors: [],
            startTime: Date.now()
        };
        this.abortController = new AbortController();
        this.dataFetcher = new dataFetcher_1.DataFetcher({ ticker: config.ticker || config.symbol || '' });
        this.dataProcessor = new dataProcessor_1.DataProcessor();
        this.reportAssembler = new reportAssembler_1.ReportAssembler();
        this.aiSummarizer = new aiSummarizer_1.AISummarizer();
        this.templates = new Map();
        this.progressTracker = new progressTracker_1.ProgressTracker();
        // Wire up progress tracking
        this.progressTracker.onProgress(function (update) {
            _this.updateStatus(update.stage, update.currentTask, update.progress);
        });
        this.initializeTemplates();
    }
    /**
     * Main entry point for report generation
     * Orchestrates the entire pipeline from data fetching to final assembly
     */
    ReportGenerator.prototype.generateReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var template, companyData, analysis, enrichedData, report, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Map wizard config to report config if needed
                        if (this.config.reportType && !this.config.template) {
                            template = reportTemplates_1.REPORT_TEMPLATES[this.config.reportType];
                            if (template) {
                                this.config.template = template;
                                this.config.sections = this.config.sections || template.requiredSections.map(function (id) { return ({
                                    id: id,
                                    title: id.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' '),
                                    type: 'mixed',
                                    order: 1,
                                    required: true,
                                    dataRequirements: []
                                }); });
                            }
                        }
                        // Phase 1: Data Fetching
                        this.progressTracker.startStep('fetch-data');
                        return [4 /*yield*/, this.fetchCompanyData()];
                    case 1:
                        companyData = _a.sent();
                        this.progressTracker.completeStep('fetch-data');
                        // Phase 2: Processing & Calculations
                        this.progressTracker.startStep('process-data');
                        return [4 /*yield*/, this.processData(companyData)];
                    case 2:
                        analysis = _a.sent();
                        this.progressTracker.completeStep('process-data');
                        // Phase 3: AI Content Generation
                        this.progressTracker.startStep('generate-content');
                        return [4 /*yield*/, this.generateAIContent(companyData, analysis)];
                    case 3:
                        enrichedData = _a.sent();
                        this.progressTracker.completeStep('generate-content');
                        // Phase 4: Report Assembly
                        this.progressTracker.startStep('assemble-report');
                        return [4 /*yield*/, this.assembleReport(enrichedData, analysis)];
                    case 4:
                        report = _a.sent();
                        this.progressTracker.completeStep('assemble-report');
                        return [2 /*return*/, report];
                    case 5:
                        error_1 = _a.sent();
                        this.handleError(error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Legacy method for backward compatibility
     */
    ReportGenerator.prototype.generateReportLegacy = function (config, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, errors, warnings, report, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = new Date();
                        errors = [];
                        warnings = [];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        (0, logger_1.logDebug)('ReportGenerator', "Starting report generation for ".concat(config.symbol || config.ticker));
                        return [4 /*yield*/, this.generateReport()];
                    case 2:
                        report = _a.sent();
                        // Convert GeneratedReport to ReportGenerationResult
                        return [2 /*return*/, {
                                success: true,
                                reportPath: report.outputPath,
                                errors: this.status.errors.length > 0 ? this.status.errors.map(function (e) { return ({
                                    code: e.severity.toUpperCase(),
                                    message: e.message,
                                    source: e.source,
                                    section: e.stage,
                                    timestamp: new Date(e.timestamp)
                                }); }) : undefined,
                                warnings: warnings.length > 0 ? warnings : undefined,
                                metadata: {
                                    startTime: startTime,
                                    endTime: new Date(),
                                    dataSources: [],
                                    cacheHits: 0,
                                    cacheMisses: 0
                                }
                            }];
                    case 3:
                        error_2 = _a.sent();
                        (0, logger_1.logError)('ReportGenerator', 'Unexpected error during report generation', error_2);
                        errors.push({
                            code: 'GENERATION_ERROR',
                            message: error_2 instanceof Error ? error_2.message : 'Unknown error',
                            timestamp: new Date()
                        });
                        return [2 /*return*/, this.createErrorResult(errors, startTime)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches all required data from various sources
     * Implements parallel fetching where possible for performance
     */
    ReportGenerator.prototype.fetchCompanyData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var symbol, sections, priorities, companyData;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check for abort signal
                        if (this.abortController.signal.aborted) {
                            throw new Error('Report generation cancelled');
                        }
                        symbol = this.config.ticker || this.config.symbol || '';
                        (0, logger_1.logDebug)('ReportGenerator', "Fetching data for ".concat(symbol));
                        sections = this.config.sections || this.getDefaultSections();
                        priorities = this.config.dataSourcePriorities || this.getDefaultPriorities();
                        return [4 /*yield*/, this.dataFetcher.fetchAll(symbol, {
                                onProgress: function (stage, progress) {
                                    // Map data fetcher stages to our sub-steps
                                    var subStepMap = {
                                        'Fetching core financial data': 'fetch-fundamentals',
                                        'Fetching supplementary data': 'fetch-technicals',
                                        'Fetching enrichment data': 'fetch-news',
                                        'Validating and cleaning data': 'validate-data'
                                    };
                                    var subStepId = subStepMap[stage];
                                    if (subStepId) {
                                        _this.progressTracker.startSubStep('fetch-data', subStepId);
                                        if (progress >= 100) {
                                            _this.progressTracker.completeSubStep('fetch-data', subStepId);
                                        }
                                    }
                                }
                            })];
                    case 1:
                        companyData = _a.sent();
                        // The fetchAll method returns CompanyData directly
                        return [2 /*return*/, companyData];
                }
            });
        });
    };
    /**
     * Processes raw data into actionable insights
     * Applies all financial calculations and pattern detection
     */
    ReportGenerator.prototype.processData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var sections, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check for abort signal
                        if (this.abortController.signal.aborted) {
                            throw new Error('Report generation cancelled');
                        }
                        (0, logger_1.logDebug)('ReportGenerator', 'Processing financial data');
                        sections = this.config.sections || this.getDefaultSections();
                        return [4 /*yield*/, this.dataProcessor.processData(data, sections)];
                    case 1:
                        result = _a.sent();
                        // Transform to AnalysisResults format
                        return [2 /*return*/, this.transformToAnalysisResults(result)];
                }
            });
        });
    };
    /**
     * Generates AI-powered content for the report
     * THIS IS WHERE THE WOW FACTOR HAPPENS!
     */
    ReportGenerator.prototype.generateAIContent = function (data, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var context, aiOptions, _a, executiveSummary, investmentThesis, keyInsights, riskAnalysis, futureOutlook, actionItems, recommendationRationale, enrichedData, financialSummary, _b, _c, technicalAnalysis, competitiveAnalysis;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        // Check for abort signal
                        if (this.abortController.signal.aborted) {
                            throw new Error('Report generation cancelled');
                        }
                        (0, logger_1.logDebug)('ReportGenerator', 'Generating ENHANCED AI insights with Claude!');
                        context = {
                            symbol: data.ticker,
                            companyName: data.companyName,
                            sector: data.sector,
                            metrics: analysis,
                            companyData: data,
                            analysisResults: analysis
                        };
                        aiOptions = {
                            tone: this.config.reportType === 'executive' ? 'executive' : 'professional',
                            depth: this.config.reportType === 'detailed' ? 'comprehensive' : 'standard',
                            focusAreas: this.getFocusAreas(),
                            includeCharts: true,
                            riskTolerance: this.config.riskTolerance || 'moderate'
                        };
                        return [4 /*yield*/, Promise.all([
                                this.aiSummarizer.generateExecutiveSummary(context, aiOptions),
                                this.aiSummarizer.generateAnalysis('investment', data, context, aiOptions),
                                this.aiSummarizer.generateKeyInsights(context, aiOptions),
                                this.aiSummarizer.generateAnalysis('risk', data, context, aiOptions),
                                this.aiSummarizer.generateAnalysis('future', data, context, aiOptions),
                                this.aiSummarizer.generateActionItems(context, aiOptions),
                                this.aiSummarizer.generateRecommendationRationale(context, analysis.composite.recommendation, analysis.composite.confidence)
                            ])];
                    case 1:
                        _a = _e.sent(), executiveSummary = _a[0], investmentThesis = _a[1], keyInsights = _a[2], riskAnalysis = _a[3], futureOutlook = _a[4], actionItems = _a[5], recommendationRationale = _a[6];
                        enrichedData = __assign({}, data);
                        if (!enrichedData.financials) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.aiSummarizer.summarizeFinancials(enrichedData.financials, context, aiOptions)];
                    case 2:
                        financialSummary = _e.sent();
                        _b = enrichedData;
                        _c = [__assign({}, enrichedData.financials)];
                        _d = { aiSummary: financialSummary };
                        return [4 /*yield*/, this.aiSummarizer.generateBulletPoints(financialSummary, 5)];
                    case 3:
                        _b.financials = __assign.apply(void 0, _c.concat([(_d.aiInsights = _e.sent(), _d)]));
                        _e.label = 4;
                    case 4:
                        if (!(enrichedData.technicals && this.config.reportType !== 'executive')) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.aiSummarizer.generateAnalysis('technical', enrichedData.technicals, context, aiOptions)];
                    case 5:
                        technicalAnalysis = _e.sent();
                        enrichedData.technicals = __assign(__assign({}, enrichedData.technicals), { aiAnalysis: technicalAnalysis.content });
                        _e.label = 6;
                    case 6:
                        if (!(this.config.reportType === 'detailed' || this.config.reportType === 'comprehensive')) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.aiSummarizer.generateAnalysis('competitive', data, context, aiOptions)];
                    case 7:
                        competitiveAnalysis = _e.sent();
                        enrichedData.metadata = __assign(__assign({}, enrichedData.metadata), { competitiveAnalysis: competitiveAnalysis.content });
                        _e.label = 8;
                    case 8:
                        // Store all AI-generated content in metadata for easy access
                        enrichedData.metadata = __assign(__assign({}, enrichedData.metadata), { aiContent: {
                                executiveSummary: executiveSummary.content,
                                investmentThesis: investmentThesis.content,
                                keyInsights: keyInsights,
                                riskAnalysis: riskAnalysis.content,
                                futureOutlook: futureOutlook.content,
                                actionItems: actionItems,
                                recommendationRationale: recommendationRationale,
                                generatedAt: new Date().toISOString(),
                                aiProvider: 'anthropic_claude',
                                confidence: executiveSummary.confidence
                            } });
                        // Clear AI cache for next report
                        this.aiSummarizer.clearCache();
                        return [2 /*return*/, enrichedData];
                }
            });
        });
    };
    /**
     * Assembles the final report in the requested format
     * Creates slides, embeds charts, and formats content
     */
    ReportGenerator.prototype.assembleReport = function (data, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var slides, finalConfig, options, assemblyResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check for abort signal
                        if (this.abortController.signal.aborted) {
                            throw new Error('Report generation cancelled');
                        }
                        (0, logger_1.logDebug)('ReportGenerator', 'Assembling final report');
                        slides = [];
                        if (this.config.template) {
                            slides = (0, reportTemplates_1.generateSlidesFromTemplate)(this.config.template, data, analysis, this.config);
                        }
                        else {
                            // Fallback to basic slides
                            slides = this.generateBasicSlides(data, analysis);
                        }
                        finalConfig = __assign(__assign({}, this.config), { companyData: data, analysis: analysis });
                        options = {
                            outputFormat: this.config.outputFormat || 'pptx',
                            includeWatermark: true,
                            aiModelPreference: 'balanced'
                        };
                        return [4 /*yield*/, this.reportAssembler.assembleReport(finalConfig, {
                                processedSections: slides,
                                calculations: analysis,
                                companyData: data
                            }, options)];
                    case 1:
                        assemblyResult = _a.sent();
                        if (!assemblyResult.success) {
                            throw new Error('Failed to assemble report');
                        }
                        return [2 /*return*/, {
                                config: this.config,
                                companyData: data,
                                slides: slides,
                                metadata: {
                                    generatedAt: new Date().toISOString(),
                                    generationTime: Date.now() - this.status.startTime,
                                    dataFreshness: this.getDataFreshness(data),
                                    aiModel: 'gpt-4',
                                    version: '2.0'
                                },
                                outputPath: assemblyResult.reportPath
                            }];
                }
            });
        });
    };
    /**
     * Updates the processing status for progress tracking
     */
    ReportGenerator.prototype.updateStatus = function (stage, task, progress) {
        this.status = __assign(__assign({}, this.status), { stage: stage, currentTask: task, progress: progress, estimatedCompletion: this.estimateCompletion(progress) });
        // Emit status update event (can be connected to UI later)
        this.emitStatusUpdate();
    };
    /**
     * Estimates completion time based on current progress
     */
    ReportGenerator.prototype.estimateCompletion = function (progress) {
        if (progress === 0)
            return 0;
        var elapsed = Date.now() - this.status.startTime;
        var estimatedTotal = elapsed / (progress / 100);
        return this.status.startTime + estimatedTotal;
    };
    /**
     * Handles errors during report generation
     */
    ReportGenerator.prototype.handleError = function (error) {
        this.status.errors.push({
            stage: this.status.stage,
            source: 'ReportGenerator',
            message: error.message,
            timestamp: Date.now(),
            severity: 'error',
            retryable: this.isRetryableError(error)
        });
        this.updateStatus('error', "Error: ".concat(error.message), this.status.progress);
    };
    /**
     * Determines if an error is retryable
     */
    ReportGenerator.prototype.isRetryableError = function (error) {
        var retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'];
        return retryableErrors.some(function (type) { return error.message.includes(type); });
    };
    /**
     * Emits status update for UI consumption
     */
    ReportGenerator.prototype.emitStatusUpdate = function () {
        // This will be connected to a React context or event system
        if (typeof window !== 'undefined' && window.dispatchEvent) {
            window.dispatchEvent(new CustomEvent('reportGenerationStatus', {
                detail: this.status
            }));
        }
    };
    /**
     * Cancels the report generation process
     */
    ReportGenerator.prototype.cancel = function () {
        this.abortController.abort();
        this.progressTracker.abort();
        this.updateStatus('error', 'Report generation cancelled', this.status.progress);
    };
    /**
     * Gets the current processing status
     */
    ReportGenerator.prototype.getStatus = function () {
        return __assign({}, this.status);
    };
    /**
     * Determines focus areas based on report configuration
     */
    ReportGenerator.prototype.getFocusAreas = function () {
        var _a;
        var areas = [];
        if (this.config.reportType === 'technical') {
            areas.push('technical');
        }
        else if (this.config.reportType === 'risk') {
            areas.push('risk');
        }
        else {
            areas.push('equity');
        }
        if ((_a = this.config.sections) === null || _a === void 0 ? void 0 : _a.some(function (s) { return s.id.includes('competitive'); })) {
            areas.push('competitive');
        }
        if (this.config.includeProjections) {
            areas.push('future');
        }
        return areas;
    };
    // Helper methods for data transformation
    ReportGenerator.prototype.transformToCompanyData = function (rawData) {
        return {
            ticker: this.config.ticker || this.config.symbol || '',
            companyName: rawData.companyName || this.config.companyName || '',
            description: rawData.description || '',
            sector: rawData.sector || '',
            industry: rawData.industry || '',
            financials: rawData.financials || {},
            news: rawData.news || [],
            transcripts: rawData.transcripts || [],
            technicals: rawData.technicals || {},
            analysts: rawData.analysts || {},
            metadata: rawData.metadata || {}
        };
    };
    ReportGenerator.prototype.transformToAnalysisResults = function (processedData) {
        var _a;
        return ((_a = processedData.calculations) === null || _a === void 0 ? void 0 : _a.global) || {
            growth: {},
            valuation: {},
            risk: {},
            quality: {},
            technicals: {},
            composite: {}
        };
    };
    ReportGenerator.prototype.getDefaultSections = function () {
        return [
            {
                id: 'executive_summary',
                title: 'Executive Summary',
                type: 'text',
                order: 1,
                required: true,
                dataRequirements: []
            }
        ];
    };
    ReportGenerator.prototype.getDefaultPriorities = function () {
        return [
            { dataType: 'priceData', sources: ['twelvedata'] },
            { dataType: 'fundamentals', sources: ['twelvedata', 'edgar'] }
        ];
    };
    ReportGenerator.prototype.createErrorResult = function (errors, startTime) {
        return {
            success: false,
            errors: errors,
            metadata: {
                startTime: startTime,
                endTime: new Date(),
                dataSources: [],
                cacheHits: 0,
                cacheMisses: 0
            }
        };
    };
    ReportGenerator.prototype.initializeTemplates = function () {
        var _this = this;
        // Load templates from template registry
        Object.entries(reportTemplates_1.REPORT_TEMPLATES).forEach(function (_a) {
            var id = _a[0], template = _a[1];
            _this.templates.set(id, template);
        });
    };
    /**
     * Generates basic slides when no template is available
     */
    ReportGenerator.prototype.generateBasicSlides = function (data, analysis) {
        return [
            {
                slideNumber: 1,
                title: "".concat(data.companyName, " Investment Analysis"),
                layout: 'title',
                content: [
                    {
                        type: 'text',
                        data: {
                            title: data.companyName,
                            subtitle: "Ticker: ".concat(data.ticker),
                            date: new Date().toLocaleDateString()
                        }
                    }
                ]
            },
            {
                slideNumber: 2,
                title: 'Executive Summary',
                layout: 'content',
                content: [
                    {
                        type: 'text',
                        data: {
                            text: "Investment recommendation: ".concat(analysis.composite.recommendation),
                            bullets: [
                                "Overall Score: ".concat(analysis.composite.overall, "/100"),
                                "Primary Strength: ".concat(this.getPrimaryStrength(analysis)),
                                "Risk Level: ".concat(this.getRiskLevel(analysis.risk.riskScore))
                            ]
                        }
                    }
                ]
            }
        ];
    };
    /**
     * Gets data freshness information
     */
    ReportGenerator.prototype.getDataFreshness = function (data) {
        var _a, _b, _c, _d, _e;
        var freshness = {};
        if ((_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) === null || _b === void 0 ? void 0 : _b[0]) {
            freshness.financial = data.financials.incomeStatement[0].date;
        }
        if ((_d = (_c = data.financials) === null || _c === void 0 ? void 0 : _c.historicalPrices) === null || _d === void 0 ? void 0 : _d[0]) {
            freshness.market = data.financials.historicalPrices[0].date;
        }
        if ((_e = data.news) === null || _e === void 0 ? void 0 : _e[0]) {
            freshness.news = data.news[0].publishedDate;
        }
        return freshness;
    };
    ReportGenerator.prototype.getPrimaryStrength = function (analysis) {
        var scores = {
            growth: analysis.composite.growth,
            value: analysis.composite.value,
            quality: analysis.composite.quality,
            momentum: analysis.composite.momentum
        };
        var highest = Object.entries(scores).reduce(function (a, b) {
            return a[1] > b[1] ? a : b;
        });
        return "".concat(highest[0].charAt(0).toUpperCase() + highest[0].slice(1), " (").concat(highest[1], "/100)");
    };
    ReportGenerator.prototype.getRiskLevel = function (score) {
        if (score < 30)
            return 'Low';
        if (score < 60)
            return 'Moderate';
        return 'High';
    };
    ReportGenerator.prototype.previewReport = function (config) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_c) {
                // Generate a preview of the report structure without creating the full report
                return [2 /*return*/, {
                        sections: ((_a = config.sections) === null || _a === void 0 ? void 0 : _a.map(function (s) { return ({
                            id: s.id,
                            title: s.title,
                            type: s.type,
                            required: s.required
                        }); })) || [],
                        estimatedPages: Math.ceil((((_b = config.sections) === null || _b === void 0 ? void 0 : _b.length) || 1) * 1.5),
                        requiredDataSources: config.sections ? __spreadArray([], new Set(config.sections.flatMap(function (s) {
                            return s.dataRequirements.map(function (r) { return r.source; });
                        })), true) : []
                    }];
            });
        });
    };
    return ReportGenerator;
}());
exports.ReportGenerator = ReportGenerator;
// Factory function for creating report generators
function createReportGenerator(config) {
    // Validate config
    if (!config.ticker && !config.symbol) {
        throw new Error('Invalid report configuration: missing ticker or symbol');
    }
    if (!config.reportDate && !config.sections) {
        throw new Error('Invalid report configuration: missing reportDate or sections');
    }
    // Set defaults
    var finalConfig = __assign({ outputFormat: 'pptx', includeCharts: true, debugMode: false, currentDate: new Date().toISOString().split('T')[0] }, config);
    return new ReportGenerator(finalConfig);
}
exports.createReportGenerator = createReportGenerator;
