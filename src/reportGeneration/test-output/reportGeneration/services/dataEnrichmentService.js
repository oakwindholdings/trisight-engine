"use strict";
// src/reportGeneration/services/dataEnrichmentService.ts
// Data enrichment and cross-validation service
// Context: Enhances data quality by filling gaps and reconciling discrepancies
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
exports.__esModule = true;
exports.getDataEnrichmentService = exports.DataEnrichmentService = void 0;
var twelveDataAdapter_1 = require("../adapters/twelveDataAdapter");
var newsAdapter_1 = require("../adapters/newsAdapter");
var dataQualityService_1 = require("./dataQualityService");
var logger_1 = require("../../utils/logger");
/**
 * Data Enrichment Service
 * Enhances data quality through cross-validation and intelligent gap filling
 */
var DataEnrichmentService = /** @class */ (function () {
    function DataEnrichmentService(twelveDataAdapter, newsAdapter) {
        this.qualityService = (0, dataQualityService_1.getDataQualityService)();
        this.twelveDataAdapter = twelveDataAdapter || new twelveDataAdapter_1.TwelveDataAdapter({ debugMode: true });
        this.newsAdapter = newsAdapter || new newsAdapter_1.NewsAdapter({ debugMode: true });
    }
    /**
     * Enriches company data with additional information and validations
     */
    DataEnrichmentService.prototype.enrichCompanyData = function (data, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var enrichmentLog, enrichedData, stats, initialQuality, fillResult, reconcileResult, metricsResult, descResult, timeSeriesResult, comparisonResult, finalQuality;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebug)('DataEnrichmentService', "Starting enrichment for ".concat(data.ticker));
                        enrichmentLog = [];
                        enrichedData = __assign({}, data);
                        stats = {
                            fieldsAdded: 0,
                            fieldsUpdated: 0,
                            discrepanciesResolved: 0,
                            metricsCalculated: 0,
                            qualityImprovement: 0
                        };
                        return [4 /*yield*/, this.qualityService.assessDataQuality(data)];
                    case 1:
                        initialQuality = _a.sent();
                        if (!(options.fillMissingData !== false)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.fillMissingData(enrichedData)];
                    case 2:
                        fillResult = _a.sent();
                        enrichedData = fillResult.data;
                        enrichmentLog.push.apply(enrichmentLog, fillResult.log);
                        stats.fieldsAdded += fillResult.fieldsAdded;
                        _a.label = 3;
                    case 3:
                        if (!(options.reconcileDiscrepancies !== false)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.reconcileDiscrepancies(enrichedData)];
                    case 4:
                        reconcileResult = _a.sent();
                        enrichedData = reconcileResult.data;
                        enrichmentLog.push.apply(enrichmentLog, reconcileResult.log);
                        stats.discrepanciesResolved += reconcileResult.resolved;
                        stats.fieldsUpdated += reconcileResult.updated;
                        _a.label = 5;
                    case 5:
                        // Calculate derived metrics
                        if (options.addDerivedMetrics !== false) {
                            metricsResult = this.calculateDerivedMetrics(enrichedData);
                            enrichedData = metricsResult.data;
                            enrichmentLog.push.apply(enrichmentLog, metricsResult.log);
                            stats.metricsCalculated += metricsResult.calculated;
                        }
                        if (!(options.enhanceDescriptions !== false)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.enhanceDescriptions(enrichedData)];
                    case 6:
                        descResult = _a.sent();
                        enrichedData = descResult.data;
                        enrichmentLog.push.apply(enrichmentLog, descResult.log);
                        stats.fieldsUpdated += descResult.updated;
                        _a.label = 7;
                    case 7:
                        if (!options.expandTimeSeriesData) return [3 /*break*/, 9];
                        return [4 /*yield*/, this.expandTimeSeriesData(enrichedData)];
                    case 8:
                        timeSeriesResult = _a.sent();
                        enrichedData = timeSeriesResult.data;
                        enrichmentLog.push.apply(enrichmentLog, timeSeriesResult.log);
                        stats.fieldsAdded += timeSeriesResult.added;
                        _a.label = 9;
                    case 9:
                        if (!options.includeIndustryComparisons) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.addIndustryComparisons(enrichedData)];
                    case 10:
                        comparisonResult = _a.sent();
                        enrichedData = comparisonResult.data;
                        enrichmentLog.push.apply(enrichmentLog, comparisonResult.log);
                        stats.fieldsAdded += comparisonResult.added;
                        _a.label = 11;
                    case 11: return [4 /*yield*/, this.qualityService.assessDataQuality(enrichedData)];
                    case 12:
                        finalQuality = _a.sent();
                        stats.qualityImprovement = finalQuality.overallScore - initialQuality.overallScore;
                        // Add enrichment metadata
                        enrichedData.metadata = __assign(__assign({}, enrichedData.metadata), { enriched: true, enrichmentDate: new Date().toISOString(), enrichmentStats: stats, dataQuality: finalQuality });
                        (0, logger_1.logDebug)('DataEnrichmentService', "Enrichment complete. Quality improved by ".concat((stats.qualityImprovement * 100).toFixed(1), "%"));
                        return [2 /*return*/, {
                                enrichedData: enrichedData,
                                enrichmentStats: stats,
                                enrichmentLog: enrichmentLog
                            }];
                }
            });
        });
    };
    /**
     * Fills missing data fields using alternative sources
     */
    DataEnrichmentService.prototype.fillMissingData = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var log, fieldsAdded, enriched, profile, error_1, profile, error_2, metrics_1, error_3, news, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log = [];
                        fieldsAdded = 0;
                        enriched = __assign({}, data);
                        if (!(!enriched.description || enriched.description.length < 50)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.twelveDataAdapter.getCompanyProfile(enriched.ticker)];
                    case 2:
                        profile = _b.sent();
                        if (profile.description && profile.description.length > ((_a = enriched.description) === null || _a === void 0 ? void 0 : _a.length)) {
                            log.push({
                                field: 'description',
                                action: 'updated',
                                oldValue: enriched.description,
                                newValue: profile.description,
                                reason: 'Fetched comprehensive description from TwelveData'
                            });
                            enriched.description = profile.description;
                            fieldsAdded++;
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not fetch company profile');
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(!enriched.sector || !enriched.industry)) return [3 /*break*/, 8];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.twelveDataAdapter.getCompanyProfile(enriched.ticker)];
                    case 6:
                        profile = _b.sent();
                        if (!enriched.sector && profile.sector) {
                            enriched.sector = profile.sector;
                            fieldsAdded++;
                            log.push({
                                field: 'sector',
                                action: 'added',
                                newValue: profile.sector,
                                reason: 'Added missing sector information'
                            });
                        }
                        if (!enriched.industry && profile.industry) {
                            enriched.industry = profile.industry;
                            fieldsAdded++;
                            log.push({
                                field: 'industry',
                                action: 'added',
                                newValue: profile.industry,
                                reason: 'Added missing industry information'
                            });
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not fetch sector/industry');
                        return [3 /*break*/, 8];
                    case 8:
                        if (!(enriched.financials && (!enriched.financials.keyMetrics ||
                            Object.keys(enriched.financials.keyMetrics).length < 5))) return [3 /*break*/, 12];
                        _b.label = 9;
                    case 9:
                        _b.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, this.calculateMissingMetrics(enriched.financials)];
                    case 10:
                        metrics_1 = _b.sent();
                        enriched.financials.keyMetrics = __assign(__assign({}, enriched.financials.keyMetrics), metrics_1);
                        Object.keys(metrics_1).forEach(function (key) {
                            if (!enriched.financials.keyMetrics[key]) {
                                fieldsAdded++;
                                log.push({
                                    field: "financials.keyMetrics.".concat(key),
                                    action: 'calculated',
                                    newValue: metrics_1[key],
                                    reason: 'Calculated from available financial data'
                                });
                            }
                        });
                        return [3 /*break*/, 12];
                    case 11:
                        error_3 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not calculate missing metrics');
                        return [3 /*break*/, 12];
                    case 12:
                        if (!(!enriched.news || enriched.news.length === 0)) return [3 /*break*/, 16];
                        _b.label = 13;
                    case 13:
                        _b.trys.push([13, 15, , 16]);
                        return [4 /*yield*/, this.newsAdapter.getCompanyNews(enriched.ticker, 10, enriched.companyName)];
                    case 14:
                        news = _b.sent();
                        if (news.length > 0) {
                            enriched.news = news;
                            fieldsAdded++;
                            log.push({
                                field: 'news',
                                action: 'added',
                                newValue: "".concat(news.length, " articles"),
                                reason: 'Fetched recent news articles'
                            });
                        }
                        return [3 /*break*/, 16];
                    case 15:
                        error_4 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not fetch news data');
                        return [3 /*break*/, 16];
                    case 16: return [2 /*return*/, { data: enriched, log: log, fieldsAdded: fieldsAdded }];
                }
            });
        });
    };
    /**
     * Reconciles data discrepancies across sources
     */
    DataEnrichmentService.prototype.reconcileDiscrepancies = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var log, resolved, updated, enriched, discrepancies, _i, discrepancies_1, discrepancy, sources, values, reconciledValue, sorted, bs, expectedAssets, reconciledAssets;
            return __generator(this, function (_b) {
                log = [];
                resolved = 0;
                updated = 0;
                enriched = __assign({}, data);
                discrepancies = this.qualityService.crossValidateData(data).discrepancies;
                for (_i = 0, discrepancies_1 = discrepancies; _i < discrepancies_1.length; _i++) {
                    discrepancy = discrepancies_1[_i];
                    sources = discrepancy.sources;
                    values = Object.values(sources);
                    reconciledValue = void 0;
                    if (typeof values[0] === 'number') {
                        sorted = values.sort(function (a, b) { return a - b; });
                        reconciledValue = sorted.length % 2 === 0
                            ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
                            : sorted[Math.floor(sorted.length / 2)];
                        // Apply the reconciled value
                        this.applyReconciledValue(enriched, discrepancy.field, reconciledValue);
                        log.push({
                            field: discrepancy.field,
                            action: 'reconciled',
                            oldValue: sources,
                            newValue: reconciledValue,
                            reason: "Reconciled ".concat(Object.keys(sources).length, " different values using median")
                        });
                        resolved++;
                        updated++;
                    }
                }
                // Additional consistency checks
                if (enriched.financials) {
                    bs = (_a = enriched.financials.balanceSheet) === null || _a === void 0 ? void 0 : _a[0];
                    if (bs && bs.totalAssets && bs.totalLiabilities && bs.totalEquity) {
                        expectedAssets = bs.totalLiabilities + bs.totalEquity;
                        if (Math.abs(bs.totalAssets - expectedAssets) > bs.totalAssets * 0.01) {
                            reconciledAssets = bs.totalLiabilities + bs.totalEquity;
                            log.push({
                                field: 'financials.balanceSheet[0].totalAssets',
                                action: 'reconciled',
                                oldValue: bs.totalAssets,
                                newValue: reconciledAssets,
                                reason: 'Adjusted to balance accounting equation'
                            });
                            bs.totalAssets = reconciledAssets;
                            resolved++;
                            updated++;
                        }
                    }
                }
                return [2 /*return*/, { data: enriched, log: log, resolved: resolved, updated: updated }];
            });
        });
    };
    /**
     * Calculates derived financial metrics
     */
    DataEnrichmentService.prototype.calculateDerivedMetrics = function (data) {
        var _a, _b, _c, _d;
        var log = [];
        var calculated = 0;
        var enriched = __assign({}, data);
        if (!enriched.financials) {
            return { data: enriched, log: log, calculated: calculated };
        }
        var metrics = enriched.financials.keyMetrics || {};
        var income = (_a = enriched.financials.incomeStatement) === null || _a === void 0 ? void 0 : _a[0];
        var balance = (_b = enriched.financials.balanceSheet) === null || _b === void 0 ? void 0 : _b[0];
        var cashFlow = (_c = enriched.financials.cashFlow) === null || _c === void 0 ? void 0 : _c[0];
        // Calculate additional ratios
        var derivedMetrics = {};
        // Profitability metrics
        if (income) {
            if (income.revenue && income.grossProfit) {
                derivedMetrics.grossMargin = income.grossProfit / income.revenue;
                calculated++;
            }
            if (income.revenue && income.operatingIncome) {
                derivedMetrics.operatingMargin = income.operatingIncome / income.revenue;
                calculated++;
            }
            if (income.revenue && income.netIncome) {
                derivedMetrics.netMargin = income.netIncome / income.revenue;
                calculated++;
            }
        }
        // Efficiency metrics
        if (balance && income) {
            if (balance.totalAssets && income.revenue) {
                derivedMetrics.assetTurnover = income.revenue / balance.totalAssets;
                calculated++;
            }
            if (balance.inventory && income.costOfRevenue) {
                derivedMetrics.inventoryTurnover = income.costOfRevenue / balance.inventory;
                calculated++;
            }
        }
        // Cash flow metrics
        if (cashFlow && income) {
            if (cashFlow.operatingCashFlow && income.revenue) {
                derivedMetrics.ocfToRevenue = cashFlow.operatingCashFlow / income.revenue;
                calculated++;
            }
            if (cashFlow.freeCashFlow && (balance === null || balance === void 0 ? void 0 : balance.totalEquity)) {
                derivedMetrics.fcfToEquity = cashFlow.freeCashFlow / balance.totalEquity;
                calculated++;
            }
        }
        // Growth metrics (if historical data available)
        if (((_d = enriched.financials.incomeStatement) === null || _d === void 0 ? void 0 : _d.length) >= 2) {
            var current = enriched.financials.incomeStatement[0];
            var previous = enriched.financials.incomeStatement[1];
            if (current.revenue && previous.revenue) {
                derivedMetrics.revenueGrowthRate =
                    (current.revenue - previous.revenue) / previous.revenue;
                calculated++;
            }
            if (current.netIncome && previous.netIncome && previous.netIncome > 0) {
                derivedMetrics.earningsGrowthRate =
                    (current.netIncome - previous.netIncome) / previous.netIncome;
                calculated++;
            }
        }
        // Add derived metrics
        enriched.financials.keyMetrics = __assign(__assign({}, metrics), derivedMetrics);
        // Log calculations
        Object.keys(derivedMetrics).forEach(function (key) {
            log.push({
                field: "financials.keyMetrics.".concat(key),
                action: 'calculated',
                newValue: derivedMetrics[key],
                reason: 'Calculated from financial statements'
            });
        });
        return { data: enriched, log: log, calculated: calculated };
    };
    /**
     * Enhances descriptions and text fields for better AI understanding
     */
    DataEnrichmentService.prototype.enhanceDescriptions = function (data) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var log, updated, enriched, enhancedDesc, businessModel, position;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        log = [];
                        updated = 0;
                        enriched = __assign({}, data);
                        // Enhance company description with structured information
                        if (enriched.description) {
                            enhancedDesc = this.structureDescription(enriched);
                            if (enhancedDesc !== enriched.description) {
                                log.push({
                                    field: 'description',
                                    action: 'updated',
                                    oldValue: enriched.description.substring(0, 50) + '...',
                                    newValue: enhancedDesc.substring(0, 50) + '...',
                                    reason: 'Enhanced with structured business context'
                                });
                                enriched.description = enhancedDesc;
                                updated++;
                            }
                        }
                        // Add business model classification
                        if (!((_a = enriched.metadata) === null || _a === void 0 ? void 0 : _a.businessModel)) {
                            businessModel = this.classifyBusinessModel(enriched);
                            enriched.metadata = __assign(__assign({}, enriched.metadata), { businessModel: businessModel });
                            log.push({
                                field: 'metadata.businessModel',
                                action: 'added',
                                newValue: businessModel,
                                reason: 'Classified business model from available data'
                            });
                            updated++;
                        }
                        if (!!((_b = enriched.metadata) === null || _b === void 0 ? void 0 : _b.competitivePosition)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.assessCompetitivePosition(enriched)];
                    case 1:
                        position = _c.sent();
                        enriched.metadata = __assign(__assign({}, enriched.metadata), { competitivePosition: position });
                        log.push({
                            field: 'metadata.competitivePosition',
                            action: 'added',
                            newValue: position,
                            reason: 'Assessed competitive position from metrics'
                        });
                        updated++;
                        _c.label = 2;
                    case 2: return [2 /*return*/, { data: enriched, log: log, updated: updated }];
                }
            });
        });
    };
    /**
     * Expands time series data for better trend analysis
     */
    DataEnrichmentService.prototype.expandTimeSeriesData = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var log, added, enriched, historicalIncome, addedCount, error_5, prices, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log = [];
                        added = 0;
                        enriched = __assign({}, data);
                        if (!enriched.financials) return [3 /*break*/, 8];
                        if (!(enriched.financials.incomeStatement &&
                            enriched.financials.incomeStatement.length < 8)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.twelveDataAdapter.getIncomeStatement(enriched.ticker, 'quarterly', 12)];
                    case 2:
                        historicalIncome = _b.sent();
                        if (historicalIncome.length > enriched.financials.incomeStatement.length) {
                            addedCount = historicalIncome.length - enriched.financials.incomeStatement.length;
                            enriched.financials.incomeStatement = historicalIncome;
                            added += addedCount;
                            log.push({
                                field: 'financials.incomeStatement',
                                action: 'added',
                                newValue: "".concat(addedCount, " additional quarters"),
                                reason: 'Expanded historical data for trend analysis'
                            });
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not expand income statement data');
                        return [3 /*break*/, 4];
                    case 4:
                        if (!(!enriched.financials.historicalPrices ||
                            enriched.financials.historicalPrices.length < 252)) return [3 /*break*/, 8];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.twelveDataAdapter.getTimeSeries(enriched.ticker, '1day', 252)];
                    case 6:
                        prices = _b.sent();
                        if (prices.length > (((_a = enriched.financials.historicalPrices) === null || _a === void 0 ? void 0 : _a.length) || 0)) {
                            enriched.financials.historicalPrices = prices;
                            added++;
                            log.push({
                                field: 'financials.historicalPrices',
                                action: 'added',
                                newValue: "".concat(prices.length, " daily prices"),
                                reason: 'Added comprehensive price history'
                            });
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        error_6 = _b.sent();
                        (0, logger_1.logDebug)('DataEnrichmentService', 'Could not expand price history');
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, { data: enriched, log: log, added: added }];
                }
            });
        });
    };
    /**
     * Adds industry comparison data
     */
    DataEnrichmentService.prototype.addIndustryComparisons = function (data) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var log, added, enriched, peers, industryMetrics;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        log = [];
                        added = 0;
                        enriched = __assign({}, data);
                        return [4 /*yield*/, this.getIndustryPeers(enriched.ticker, enriched.industry)];
                    case 1:
                        peers = _b.sent();
                        if (!(peers.length > 0)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.calculateIndustryAverages(peers)];
                    case 2:
                        industryMetrics = _b.sent();
                        enriched.metadata = __assign(__assign({}, enriched.metadata), { industryComparison: {
                                peers: peers,
                                industryAverages: industryMetrics,
                                relativePerformance: this.calculateRelativePerformance((_a = enriched.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics, industryMetrics)
                            } });
                        added++;
                        log.push({
                            field: 'metadata.industryComparison',
                            action: 'added',
                            newValue: "Comparison with ".concat(peers.length, " peers"),
                            reason: 'Added industry context for benchmarking'
                        });
                        _b.label = 3;
                    case 3: return [2 /*return*/, { data: enriched, log: log, added: added }];
                }
            });
        });
    };
    /**
     * Helper methods
     */
    DataEnrichmentService.prototype.calculateMissingMetrics = function (financials) {
        var _a, _b, _c, _d, _e, _f, _g;
        var metrics = {};
        var income = (_a = financials.incomeStatement) === null || _a === void 0 ? void 0 : _a[0];
        var balance = (_b = financials.balanceSheet) === null || _b === void 0 ? void 0 : _b[0];
        var cashFlow = (_c = financials.cashFlow) === null || _c === void 0 ? void 0 : _c[0];
        // Calculate ROE if missing
        if (!((_d = financials.keyMetrics) === null || _d === void 0 ? void 0 : _d.roe) && (income === null || income === void 0 ? void 0 : income.netIncome) && (balance === null || balance === void 0 ? void 0 : balance.totalEquity)) {
            metrics.roe = income.netIncome / balance.totalEquity;
        }
        // Calculate ROA if missing
        if (!((_e = financials.keyMetrics) === null || _e === void 0 ? void 0 : _e.roa) && (income === null || income === void 0 ? void 0 : income.netIncome) && (balance === null || balance === void 0 ? void 0 : balance.totalAssets)) {
            metrics.roa = income.netIncome / balance.totalAssets;
        }
        // Calculate current ratio if missing
        if (!((_f = financials.keyMetrics) === null || _f === void 0 ? void 0 : _f.currentRatio) &&
            (balance === null || balance === void 0 ? void 0 : balance.currentAssets) && (balance === null || balance === void 0 ? void 0 : balance.currentLiabilities)) {
            metrics.currentRatio = balance.currentAssets / balance.currentLiabilities;
        }
        // Calculate debt-to-equity if missing
        if (!((_g = financials.keyMetrics) === null || _g === void 0 ? void 0 : _g.debtToEquity) &&
            (balance === null || balance === void 0 ? void 0 : balance.totalDebt) && (balance === null || balance === void 0 ? void 0 : balance.totalEquity)) {
            metrics.debtToEquity = balance.totalDebt / balance.totalEquity;
        }
        return metrics;
    };
    DataEnrichmentService.prototype.applyReconciledValue = function (data, field, value) {
        var keys = field.split('.');
        var current = data;
        for (var i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    };
    DataEnrichmentService.prototype.structureDescription = function (data) {
        var _a, _b, _c, _d, _e;
        var enhanced = data.description || '';
        // Add structured context
        var additions = [];
        if (data.sector && data.industry) {
            additions.push("Operating in the ".concat(data.industry, " industry within the ").concat(data.sector, " sector."));
        }
        if ((_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics) === null || _b === void 0 ? void 0 : _b.marketCap) {
            var marketCapB = (data.financials.keyMetrics.marketCap / 1e9).toFixed(1);
            additions.push("Market capitalization of $".concat(marketCapB, " billion."));
        }
        if ((_e = (_d = (_c = data.financials) === null || _c === void 0 ? void 0 : _c.incomeStatement) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.revenue) {
            var revenueB = (data.financials.incomeStatement[0].revenue / 1e9).toFixed(1);
            additions.push("Annual revenue of $".concat(revenueB, " billion."));
        }
        if (additions.length > 0) {
            enhanced = enhanced.trim() + ' ' + additions.join(' ');
        }
        return enhanced;
    };
    DataEnrichmentService.prototype.classifyBusinessModel = function (data) {
        var _a, _b, _c, _d;
        // Simple business model classification based on metrics
        var income = (_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) === null || _b === void 0 ? void 0 : _b[0];
        var balance = (_d = (_c = data.financials) === null || _c === void 0 ? void 0 : _c.balanceSheet) === null || _d === void 0 ? void 0 : _d[0];
        if (!income || !balance) {
            return 'unknown';
        }
        // High margin, low asset turnover = likely software/services
        var margin = income.netIncome / income.revenue;
        var assetTurnover = income.revenue / balance.totalAssets;
        if (margin > 0.15 && assetTurnover < 1) {
            return 'high-margin-services';
        }
        else if (margin < 0.05 && assetTurnover > 2) {
            return 'low-margin-retail';
        }
        else if (balance.inventory / balance.totalAssets > 0.2) {
            return 'manufacturing';
        }
        else if (balance.totalDebt / balance.totalAssets > 0.6) {
            return 'capital-intensive';
        }
        return 'diversified';
    };
    DataEnrichmentService.prototype.assessCompetitivePosition = function (data) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var metrics, score, income, netMargin;
            return __generator(this, function (_d) {
                metrics = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics;
                if (!metrics)
                    return [2 /*return*/, 'unclear'];
                score = 0;
                // ROE above 15% is strong
                if (metrics.roe && metrics.roe > 0.15)
                    score += 2;
                else if (metrics.roe && metrics.roe > 0.10)
                    score += 1;
                // Low debt is good
                if (metrics.debtToEquity && metrics.debtToEquity < 0.5)
                    score += 2;
                else if (metrics.debtToEquity && metrics.debtToEquity < 1)
                    score += 1;
                income = (_c = (_b = data.financials) === null || _b === void 0 ? void 0 : _b.incomeStatement) === null || _c === void 0 ? void 0 : _c[0];
                if (income) {
                    netMargin = income.netIncome / income.revenue;
                    if (netMargin > 0.15)
                        score += 2;
                    else if (netMargin > 0.08)
                        score += 1;
                }
                if (score >= 5)
                    return [2 /*return*/, 'market-leader'];
                if (score >= 3)
                    return [2 /*return*/, 'strong-competitor'];
                if (score >= 1)
                    return [2 /*return*/, 'established-player'];
                return [2 /*return*/, 'challenger'];
            });
        });
    };
    DataEnrichmentService.prototype.getIndustryPeers = function (ticker, industry) {
        return __awaiter(this, void 0, void 0, function () {
            var peerMap;
            return __generator(this, function (_a) {
                peerMap = {
                    'AAPL': ['MSFT', 'GOOGL', 'AMZN'],
                    'TSLA': ['GM', 'F', 'RIVN'],
                    'JPM': ['BAC', 'WFC', 'C'],
                    'NVDA': ['AMD', 'INTC', 'QCOM']
                };
                return [2 /*return*/, peerMap[ticker] || []];
            });
        });
    };
    DataEnrichmentService.prototype.calculateIndustryAverages = function (peers) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simplified - would fetch real peer data
                return [2 /*return*/, {
                        peRatio: 22.5,
                        roe: 0.15,
                        debtToEquity: 0.8,
                        netMargin: 0.12,
                        revenueGrowth: 0.08
                    }];
            });
        });
    };
    DataEnrichmentService.prototype.calculateRelativePerformance = function (companyMetrics, industryMetrics) {
        if (!companyMetrics || !industryMetrics) {
            return null;
        }
        var performance = {};
        // Compare key metrics
        if (companyMetrics.peRatio && industryMetrics.peRatio) {
            performance.peRatioVsIndustry =
                (companyMetrics.peRatio - industryMetrics.peRatio) / industryMetrics.peRatio;
        }
        if (companyMetrics.roe && industryMetrics.roe) {
            performance.roeVsIndustry =
                (companyMetrics.roe - industryMetrics.roe) / industryMetrics.roe;
        }
        return performance;
    };
    return DataEnrichmentService;
}());
exports.DataEnrichmentService = DataEnrichmentService;
// Singleton instance
var enrichmentServiceInstance = null;
/**
 * Gets the data enrichment service instance
 */
function getDataEnrichmentService(twelveDataAdapter, newsAdapter) {
    if (!enrichmentServiceInstance) {
        enrichmentServiceInstance = new DataEnrichmentService(twelveDataAdapter, newsAdapter);
    }
    return enrichmentServiceInstance;
}
exports.getDataEnrichmentService = getDataEnrichmentService;
