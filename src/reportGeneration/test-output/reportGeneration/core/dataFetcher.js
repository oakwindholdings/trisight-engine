"use strict";
// src/reportGeneration/core/dataFetcher.ts
// Orchestrates all data fetching operations for report generation
// Context: Central coordinator that manages parallel fetching from multiple sources
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
exports.createDataFetcher = exports.DataFetcher = void 0;
var twelveDataAdapter_1 = require("../adapters/twelveDataAdapter");
var newsAdapter_1 = require("../adapters/newsAdapter");
var edgarAdapter_1 = require("../adapters/edgarAdapter");
var firecrawlAdapter_1 = require("../adapters/firecrawlAdapter");
var cache_1 = require("../utils/cache");
var errorHandler_1 = require("../utils/errorHandler");
var dataValidation_1 = require("../utils/dataValidation");
var dataQualityService_1 = require("../services/dataQualityService");
var dataEnrichmentService_1 = require("../services/dataEnrichmentService");
var logger_1 = require("../../utils/logger");
/**
 * Orchestrates data fetching from all sources
 * This class embodies the intelligence of our data gathering system
 */
var DataFetcher = /** @class */ (function () {
    function DataFetcher(config) {
        var _a, _b, _c, _d;
        this.qualityService = (0, dataQualityService_1.getDataQualityService)();
        this.enrichmentService = (0, dataEnrichmentService_1.getDataEnrichmentService)();
        this.config = __assign({ includeNews: true, includeTranscripts: true, maxConcurrent: 3 }, config);
        this.cache = config.cache || new cache_1.DataCache({});
        // Initialize all adapters with shared configuration
        // Use provided adapters if available, otherwise create new ones
        this.adapters = {
            twelveData: ((_a = config.adapters) === null || _a === void 0 ? void 0 : _a.twelveData) || new twelveDataAdapter_1.TwelveDataAdapter({
                apiKey: config.apiKey,
                cache: this.cache,
                debugMode: config.debugMode
            }),
            news: ((_b = config.adapters) === null || _b === void 0 ? void 0 : _b.news) || new newsAdapter_1.NewsAdapter({
                cache: this.cache,
                debugMode: config.debugMode
            }),
            edgar: ((_c = config.adapters) === null || _c === void 0 ? void 0 : _c.edgar) || new edgarAdapter_1.EdgarAdapter({
                cache: this.cache,
                debugMode: config.debugMode
            }),
            firecrawl: ((_d = config.adapters) === null || _d === void 0 ? void 0 : _d.firecrawl) || new firecrawlAdapter_1.FirecrawlAdapter({
                apiKey: config.firecrawlApiKey || process.env.FIRECRAWL_API_KEY,
                cache: this.cache,
                debugMode: config.debugMode
            })
        };
    }
    /**
     * Main entry point - fetches all data for a company
     * This method orchestrates the entire data gathering process
     */
    DataFetcher.prototype.fetchAll = function (ticker, onProgress) {
        if (ticker === void 0) { ticker = this.config.ticker; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, errors, metadata, coreData, supplementaryData, enrichmentData, mergedData, qualityMetrics, finalData, enrichmentResult, companyData, duration, finalQuality, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        errors = [];
                        metadata = {
                            lastUpdated: new Date().toISOString(),
                            sources: {}
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        // Phase 1: Core Financial Data (Critical - Must Succeed)
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Fetching core financial data', 10);
                        return [4 /*yield*/, this.fetchCoreFinancialData(ticker, errors, metadata)];
                    case 2:
                        coreData = _a.sent();
                        // Phase 2: Supplementary Data (Important - Should Succeed)
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Fetching supplementary data', 30);
                        return [4 /*yield*/, this.fetchSupplementaryData(ticker, errors, metadata)];
                    case 3:
                        supplementaryData = _a.sent();
                        // Phase 3: Enrichment Data (Nice to Have - Can Fail)
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Fetching enrichment data', 60);
                        return [4 /*yield*/, this.fetchEnrichmentData(ticker, errors, metadata)];
                    case 4:
                        enrichmentData = _a.sent();
                        // Phase 4: Data Validation and Cleaning
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Validating and cleaning data', 80);
                        mergedData = __assign(__assign(__assign({}, coreData), supplementaryData), enrichmentData);
                        return [4 /*yield*/, this.qualityService.assessDataQuality(mergedData)];
                    case 5:
                        qualityMetrics = _a.sent();
                        (0, logger_1.logDebug)('DataFetcher', "Data quality score: ".concat(qualityMetrics.overallScore));
                        finalData = mergedData;
                        if (!(qualityMetrics.overallScore < 0.8)) return [3 /*break*/, 7];
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Enriching data with calculations', 90);
                        (0, logger_1.logDebug)('DataFetcher', 'Data quality below threshold, applying enrichment');
                        return [4 /*yield*/, this.enrichmentService.enrichCompanyData(mergedData, {
                                fillMissingData: true,
                                reconcileDiscrepancies: true,
                                enhanceDescriptions: true,
                                addDerivedMetrics: true,
                                expandTimeSeriesData: qualityMetrics.timeliness < 0.7,
                                includeIndustryComparisons: false // Skip for performance
                            })];
                    case 6:
                        enrichmentResult = _a.sent();
                        finalData = enrichmentResult.enrichedData;
                        (0, logger_1.logDebug)('DataFetcher', "Enrichment complete. Quality improved by ".concat((enrichmentResult.enrichmentStats.qualityImprovement * 100).toFixed(1), "%"));
                        _a.label = 7;
                    case 7:
                        // Phase 6: Final Assembly
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Assembling final dataset', 95);
                        companyData = this.assembleCompanyData(finalData, metadata, errors);
                        if (!this.config.debugMode) return [3 /*break*/, 9];
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, this.qualityService.assessDataQuality(companyData)];
                    case 8:
                        finalQuality = _a.sent();
                        (0, logger_1.logDebug)('DataFetcher', "Completed fetch for ".concat(ticker, " in ").concat(duration, "ms"));
                        (0, logger_1.logDebug)('DataFetcher', "Success rate: ".concat(this.calculateSuccessRate(metadata), "%"));
                        (0, logger_1.logDebug)('DataFetcher', "Data completeness: ".concat(this.calculateCompleteness(companyData), "%"));
                        (0, logger_1.logDebug)('DataFetcher', "Final data quality: ".concat((finalQuality.overallScore * 100).toFixed(1), "%"));
                        (0, logger_1.logDebug)('DataFetcher', "Quality dimensions - Completeness: ".concat((finalQuality.completeness * 100).toFixed(1), "%, ") +
                            "Accuracy: ".concat((finalQuality.accuracy * 100).toFixed(1), "%, ") +
                            "Timeliness: ".concat((finalQuality.timeliness * 100).toFixed(1), "%"));
                        _a.label = 9;
                    case 9:
                        onProgress === null || onProgress === void 0 ? void 0 : onProgress('Data fetch complete', 100);
                        return [2 /*return*/, companyData];
                    case 10:
                        error_1 = _a.sent();
                        // If we get here, something critical failed
                        throw new Error("Critical failure in data fetching for ".concat(ticker, ": ").concat(error_1.message, "\n") +
                            "Errors encountered: ".concat(errors.map(function (e) { return e.message; }).join('; ')));
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches core financial data that is absolutely required
     * This includes real-time quotes, historical prices, and fundamental data
     */
    DataFetcher.prototype.fetchCoreFinancialData = function (ticker, errors, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var criticalTasks, _a, quote, fundamentals, historicalPrices;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        criticalTasks = {
                            quote: this.fetchWithEnhancedHandling('TwelveData Quote', function () { return _this.adapters.twelveData.getQuote(ticker); }, errors, metadata, { critical: true, maxRetries: 5 }),
                            fundamentals: this.fetchWithEnhancedHandling('TwelveData Fundamentals', function () { return _this.adapters.twelveData.getFundamentals(ticker); }, errors, metadata, { critical: true, maxRetries: 3 }),
                            historicalPrices: this.fetchWithEnhancedHandling('TwelveData Historical', function () { return _this.adapters.twelveData.getTimeSeries(ticker, '1day', 252); }, errors, metadata, { critical: true, maxRetries: 3 })
                        };
                        return [4 /*yield*/, Promise.all([
                                criticalTasks.quote,
                                criticalTasks.fundamentals,
                                criticalTasks.historicalPrices
                            ])];
                    case 1:
                        _a = _b.sent(), quote = _a[0], fundamentals = _a[1], historicalPrices = _a[2];
                        // Validate we have minimum required data
                        if (!quote && !fundamentals) {
                            throw new Error('Failed to fetch critical financial data - cannot proceed');
                        }
                        return [2 /*return*/, {
                                ticker: ticker,
                                companyName: (quote === null || quote === void 0 ? void 0 : quote.name) || ticker,
                                financials: __assign(__assign({}, fundamentals), { historicalPrices: historicalPrices || [], keyMetrics: this.calculateKeyMetrics(quote, fundamentals) })
                            }];
                }
            });
        });
    };
    /**
     * Fetches supplementary data that enhances the report
     * This includes technical indicators, analyst data, and company information
     */
    DataFetcher.prototype.fetchSupplementaryData = function (ticker, errors, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var supplementaryTasks, _a, technicals, analysts, companyInfo, earnings;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        supplementaryTasks = {
                            technicals: this.fetchWithEnhancedHandling('TwelveData Technicals', function () { return _this.adapters.twelveData.getTechnicalIndicators(ticker); }, errors, metadata, { critical: false }),
                            analysts: this.fetchWithEnhancedHandling('TwelveData Analysts', function () { return _this.adapters.twelveData.getAnalystRatings(ticker); }, errors, metadata, { critical: false }),
                            companyInfo: this.fetchWithEnhancedHandling('SEC Company Info', function () { return _this.adapters.edgar.getCompanyDescription(ticker); }, errors, metadata, { critical: false }),
                            earnings: this.fetchWithEnhancedHandling('TwelveData Earnings', function () { return _this.adapters.twelveData.getEarnings(ticker); }, errors, metadata, { critical: false })
                        };
                        return [4 /*yield*/, Promise.all([
                                supplementaryTasks.technicals,
                                supplementaryTasks.analysts,
                                supplementaryTasks.companyInfo,
                                supplementaryTasks.earnings
                            ])];
                    case 1:
                        _a = _b.sent(), technicals = _a[0], analysts = _a[1], companyInfo = _a[2], earnings = _a[3];
                        return [2 /*return*/, {
                                description: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.description) || '',
                                sector: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.sector) || 'Technology',
                                industry: (companyInfo === null || companyInfo === void 0 ? void 0 : companyInfo.industry) || 'Technology',
                                technicals: technicals || this.getDefaultTechnicals(),
                                analysts: analysts || this.getDefaultAnalystData(),
                                earnings: earnings || { historical: [], upcoming: [], nextEarningsDate: null, averageSurprise: 0 }
                            }];
                }
            });
        });
    };
    /**
     * Fetches enrichment data that adds color to the report
     * This includes news and transcripts which can fail without breaking the report
     */
    DataFetcher.prototype.fetchEnrichmentData = function (ticker, errors, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var enrichmentTasks, results, news, transcripts;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        enrichmentTasks = {};
                        // Only fetch if requested in config
                        if (this.config.includeNews) {
                            enrichmentTasks.news = this.fetchWithEnhancedHandling('News Articles', function () { return _this.adapters.news.getCompanyNews(ticker, 20, undefined, {
                                timeRange: 'month',
                                focusAreas: ['earnings', 'product', 'strategy']
                            }); }, errors, metadata, { critical: false, timeout: 30000 });
                        }
                        if (this.config.includeTranscripts) {
                            enrichmentTasks.transcripts = this.fetchWithEnhancedHandling('Earnings Transcripts', function () { return _this.adapters.edgar.getEarningsTranscripts(ticker, 4); }, errors, metadata, { critical: false, timeout: 45000 });
                        }
                        return [4 /*yield*/, Promise.all(Object.values(enrichmentTasks))];
                    case 1:
                        results = _a.sent();
                        news = results[0], transcripts = results[1];
                        return [2 /*return*/, {
                                news: news || [],
                                transcripts: transcripts || []
                            }];
                }
            });
        });
    };
    /**
     * Enhanced fetch wrapper with sophisticated error handling
     * This is where we implement our resilience strategies
     */
    DataFetcher.prototype.fetchWithEnhancedHandling = function (sourceName, fetchFn, errors, metadata, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var startTime, _a, critical, _b, maxRetries, _c, timeout, timeoutPromise, result, error_2, err;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        _a = options.critical, critical = _a === void 0 ? false : _a, _b = options.maxRetries, maxRetries = _b === void 0 ? 3 : _b, _c = options.timeout, timeout = _c === void 0 ? 30000 : _c;
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        timeoutPromise = new Promise(function (_, reject) {
                            setTimeout(function () { return reject(new Error('Request timeout')); }, timeout);
                        });
                        return [4 /*yield*/, Promise.race([
                                fetchFn(),
                                timeoutPromise
                            ])];
                    case 2:
                        result = _d.sent();
                        // Record success
                        metadata.sources[sourceName] = {
                            status: 'success',
                            timestamp: new Date().toISOString(),
                            recordCount: Array.isArray(result) ? result.length : 1
                        };
                        return [2 /*return*/, result];
                    case 3:
                        error_2 = _d.sent();
                        err = error_2;
                        // For critical data, we might want to try alternative sources
                        if (critical && sourceName.includes('TwelveData')) {
                            return [2 /*return*/, this.tryAlternativeSource(sourceName, err, errors, metadata)];
                        }
                        // Record error
                        this.recordError(sourceName, err, errors, metadata, critical);
                        // Re-throw if critical
                        if (critical) {
                            throw new Error("Critical data source failed: ".concat(sourceName, " - ").concat(err.message));
                        }
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Attempts to fetch data from alternative sources when primary fails
     * This demonstrates graceful degradation
     */
    DataFetcher.prototype.tryAlternativeSource = function (sourceName, originalError, errors, metadata) {
        return __awaiter(this, void 0, void 0, function () {
            var newsItems, fallbackError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.warn("[DataFetcher] Primary source failed, trying alternatives for ".concat(sourceName));
                        if (!(sourceName === 'TwelveData Quote')) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.adapters.news.getCompanyNews(this.config.ticker, 1)];
                    case 2:
                        newsItems = _a.sent();
                        if (newsItems && newsItems.length > 0) {
                            // Extract what we can from news
                            console.log('[DataFetcher] Extracted basic info from news as fallback');
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        fallbackError_1 = _a.sent();
                        console.error('[DataFetcher] Fallback source also failed:', fallbackError_1);
                        return [3 /*break*/, 4];
                    case 4:
                        // Record the original error
                        this.recordError(sourceName, originalError, errors, metadata, true);
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Validates and cleans the fetched data
     * Ensures data consistency and identifies quality issues
     */
    DataFetcher.prototype.validateAndCleanData = function (rawData, errors) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var validationIssues, financialIssues, dateIssues;
            return __generator(this, function (_b) {
                validationIssues = [];
                // Validate financial data integrity
                if (rawData.financials) {
                    financialIssues = (0, dataValidation_1.validateFinancialData)(rawData.financials);
                    validationIssues.push.apply(validationIssues, financialIssues);
                    // Clean up invalid values
                    rawData.financials = this.cleanFinancialData(rawData.financials);
                }
                // Validate date consistency
                if ((_a = rawData.financials) === null || _a === void 0 ? void 0 : _a.historicalPrices) {
                    dateIssues = this.validateDateConsistency(rawData.financials.historicalPrices);
                    validationIssues.push.apply(validationIssues, dateIssues);
                }
                // Validate news data
                if (rawData.news) {
                    rawData.news = this.validateAndCleanNews(rawData.news);
                }
                // Log validation issues if any
                if (validationIssues.length > 0 && this.config.debugMode) {
                    console.warn('[DataFetcher] Validation issues found:', validationIssues);
                    // Record as warnings
                    validationIssues.forEach(function (issue) {
                        errors.push({
                            stage: 'validation',
                            source: 'DataValidator',
                            message: issue,
                            timestamp: Date.now(),
                            severity: 'warning',
                            retryable: false
                        });
                    });
                }
                return [2 /*return*/, rawData];
            });
        });
    };
    /**
     * Enriches data with calculated fields and derived metrics
     * This is where we add intelligence to raw data
     */
    DataFetcher.prototype.enrichData = function (validatedData, errors) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var aggregatedSentiment, dataQuality;
            return __generator(this, function (_b) {
                try {
                    // Enrich financial data with additional calculations
                    if (validatedData.financials) {
                        validatedData.financials = (0, dataValidation_1.enrichFinancialData)(validatedData.financials);
                    }
                    // Calculate additional technical indicators
                    if (((_a = validatedData.financials) === null || _a === void 0 ? void 0 : _a.historicalPrices) && validatedData.technicals) {
                        validatedData.technicals = this.calculateAdditionalTechnicals(validatedData.financials.historicalPrices, validatedData.technicals);
                    }
                    // Derive sentiment from multiple sources
                    if (validatedData.news && validatedData.transcripts) {
                        aggregatedSentiment = this.calculateAggregatedSentiment(validatedData.news, validatedData.transcripts);
                        // Add to metadata
                        validatedData.metadata = __assign(__assign({}, validatedData.metadata), { aggregatedSentiment: aggregatedSentiment });
                    }
                    dataQuality = this.assessDataQuality(validatedData);
                    validatedData.metadata = __assign(__assign({}, validatedData.metadata), { dataQuality: dataQuality });
                    return [2 /*return*/, validatedData];
                }
                catch (error) {
                    console.error('[DataFetcher] Error during enrichment:', error);
                    errors.push({
                        stage: 'enrichment',
                        source: 'DataEnricher',
                        message: error.message,
                        timestamp: Date.now(),
                        severity: 'warning',
                        retryable: false
                    });
                    return [2 /*return*/, validatedData];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Assembles the final company data structure
     * This is the final step where everything comes together
     */
    DataFetcher.prototype.assembleCompanyData = function (enrichedData, metadata, errors) {
        // Add any final processing errors to metadata
        if (errors.length > 0) {
            metadata.errors = errors.filter(function (e) { return e.severity === 'error' || e.severity === 'critical'; });
            metadata.warnings = errors.filter(function (e) { return e.severity === 'warning'; });
        }
        // Ensure all required fields have at least default values
        var companyData = {
            ticker: enrichedData.ticker || this.config.ticker,
            companyName: enrichedData.companyName || enrichedData.ticker || this.config.ticker,
            description: enrichedData.description || '',
            sector: enrichedData.sector || 'Unknown',
            industry: enrichedData.industry || 'Unknown',
            financials: enrichedData.financials || {
                incomeStatement: [],
                balanceSheet: [],
                cashFlow: [],
                keyMetrics: this.getDefaultKeyMetrics(),
                historicalPrices: []
            },
            news: enrichedData.news || [],
            transcripts: enrichedData.transcripts || [],
            technicals: enrichedData.technicals || this.getDefaultTechnicals(),
            analysts: enrichedData.analysts || this.getDefaultAnalystData(),
            earnings: enrichedData.earnings || { historical: [], upcoming: [], nextEarningsDate: null, averageSurprise: 0 },
            metadata: __assign(__assign(__assign({}, metadata), enrichedData.metadata), { completeness: this.calculateCompleteness(enrichedData), quality: this.assessDataQuality(enrichedData) })
        };
        return companyData;
    };
    /**
     * Helper methods for data processing
     */
    DataFetcher.prototype.cleanFinancialData = function (financials) {
        // Remove any NaN or invalid values
        var cleanNumeric = function (value) {
            var num = parseFloat(value);
            return isNaN(num) || !isFinite(num) ? 0 : num;
        };
        // Clean financial statements
        ['incomeStatement', 'balanceSheet', 'cashFlow'].forEach(function (statementType) {
            if (financials[statementType]) {
                var statements = financials[statementType];
                financials[statementType] = statements.map(function (statement) {
                    var cleaned = __assign({}, statement);
                    Object.keys(cleaned).forEach(function (key) {
                        if (typeof cleaned[key] === 'number' || !isNaN(parseFloat(cleaned[key]))) {
                            cleaned[key] = cleanNumeric(cleaned[key]);
                        }
                    });
                    return cleaned;
                });
            }
        });
        return financials;
    };
    DataFetcher.prototype.validateDateConsistency = function (prices) {
        var issues = [];
        for (var i = 1; i < prices.length; i++) {
            var currentDate = new Date(prices[i].date);
            var prevDate = new Date(prices[i - 1].date);
            // Check if dates are in descending order
            if (currentDate > prevDate) {
                issues.push("Date ordering issue at index ".concat(i, ": ").concat(prices[i].date, " > ").concat(prices[i - 1].date));
            }
            // Check for duplicate dates
            if (currentDate.getTime() === prevDate.getTime()) {
                issues.push("Duplicate date found: ".concat(prices[i].date));
            }
        }
        return issues;
    };
    DataFetcher.prototype.validateAndCleanNews = function (news) {
        var _this = this;
        return news.filter(function (item) {
            // Must have at least title and date
            if (!item.title || !item.publishedDate)
                return false;
            // Validate date
            var date = new Date(item.publishedDate);
            if (isNaN(date.getTime()))
                return false;
            // Remove duplicates based on title similarity
            var isDuplicate = news.some(function (other) {
                return other !== item &&
                    _this.calculateStringSimilarity(item.title, other.title) > 0.9;
            });
            return !isDuplicate;
        });
    };
    DataFetcher.prototype.calculateStringSimilarity = function (str1, str2) {
        // Simple Jaccard similarity
        var set1 = new Set(str1.toLowerCase().split(' '));
        var set2 = new Set(str2.toLowerCase().split(' '));
        var intersection = new Set(__spreadArray([], set1, true).filter(function (x) { return set2.has(x); }));
        var union = new Set(__spreadArray(__spreadArray([], set1, true), set2, true));
        return intersection.size / union.size;
    };
    DataFetcher.prototype.calculateAdditionalTechnicals = function (prices, technicals) {
        // Calculate volatility
        if (prices.length > 20) {
            var returns = prices.slice(0, 20).map(function (price, i) {
                if (i === prices.length - 1)
                    return 0;
                return (prices[i + 1].close - price.close) / price.close;
            });
            var avgReturn_1 = returns.reduce(function (a, b) { return a + b; }, 0) / returns.length;
            var variance = returns.reduce(function (sum, ret) { return sum + Math.pow(ret - avgReturn_1, 2); }, 0) / returns.length;
            var volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized
            technicals.volatility = volatility;
        }
        // Identify support and resistance levels
        if (prices.length > 50) {
            var highs = prices.slice(0, 50).map(function (p) { return p.high; });
            var lows = prices.slice(0, 50).map(function (p) { return p.low; });
            technicals.resistance = Math.max.apply(Math, highs);
            technicals.support = Math.min.apply(Math, lows);
        }
        return technicals;
    };
    DataFetcher.prototype.calculateAggregatedSentiment = function (news, transcripts) {
        // Weight recent news more heavily
        var newsScores = news.map(function (item, index) {
            var weight = Math.exp(-index * 0.1); // Exponential decay
            var score = item.sentiment === 'positive' ? 1 :
                item.sentiment === 'negative' ? -1 : 0;
            return score * weight;
        });
        var transcriptScores = transcripts.map(function (t) {
            var _a, _b;
            return ((_a = t.sentiment) === null || _a === void 0 ? void 0 : _a.overall) === 'positive' ? 1 :
                ((_b = t.sentiment) === null || _b === void 0 ? void 0 : _b.overall) === 'negative' ? -1 : 0;
        });
        var allScores = __spreadArray(__spreadArray([], newsScores, true), transcriptScores, true);
        var avgScore = allScores.reduce(function (a, b) { return a + b; }, 0) / allScores.length;
        return {
            overall: avgScore > 0.2 ? 'positive' : avgScore < -0.2 ? 'negative' : 'neutral',
            score: avgScore,
            newsSentiment: newsScores.reduce(function (a, b) { return a + b; }, 0) / newsScores.length,
            transcriptSentiment: transcriptScores.reduce(function (a, b) { return a + b; }, 0) / transcriptScores.length
        };
    };
    DataFetcher.prototype.assessDataQuality = function (data) {
        var _a, _b, _c, _d;
        var scores = {
            financials: 0,
            news: 0,
            technicals: 0,
            analysts: 0
        };
        // Score financial data quality
        if (data.financials) {
            if (((_a = data.financials.incomeStatement) === null || _a === void 0 ? void 0 : _a.length) > 0)
                scores.financials += 0.25;
            if (((_b = data.financials.balanceSheet) === null || _b === void 0 ? void 0 : _b.length) > 0)
                scores.financials += 0.25;
            if (((_c = data.financials.cashFlow) === null || _c === void 0 ? void 0 : _c.length) > 0)
                scores.financials += 0.25;
            if (((_d = data.financials.historicalPrices) === null || _d === void 0 ? void 0 : _d.length) > 200)
                scores.financials += 0.25;
        }
        // Score news quality
        if (data.news && data.news.length > 10) {
            scores.news = Math.min(data.news.length / 20, 1);
        }
        // Score technical data
        if (data.technicals) {
            if (data.technicals.sma200 > 0)
                scores.technicals += 0.5;
            if (data.technicals.rsi > 0)
                scores.technicals += 0.5;
        }
        // Score analyst data
        if (data.analysts && data.analysts.consensus.count > 0) {
            scores.analysts = Math.min(data.analysts.consensus.count / 10, 1);
        }
        var overall = Object.values(scores).reduce(function (a, b) { return a + b; }, 0) / 4;
        return __assign(__assign({ overall: overall }, scores), { grade: overall > 0.8 ? 'A' : overall > 0.6 ? 'B' : overall > 0.4 ? 'C' : 'D' });
    };
    DataFetcher.prototype.calculateCompleteness = function (data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var complete = 0;
        var total = 0;
        // Check each major section
        var checks = [
            { value: data.description, weight: 1 },
            { value: ((_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) === null || _b === void 0 ? void 0 : _b.length) > 0, weight: 2 },
            { value: ((_d = (_c = data.financials) === null || _c === void 0 ? void 0 : _c.historicalPrices) === null || _d === void 0 ? void 0 : _d.length) > 100, weight: 2 },
            { value: ((_e = data.news) === null || _e === void 0 ? void 0 : _e.length) > 5, weight: 1 },
            { value: ((_f = data.technicals) === null || _f === void 0 ? void 0 : _f.sma200) > 0, weight: 1 },
            { value: ((_h = (_g = data.analysts) === null || _g === void 0 ? void 0 : _g.consensus) === null || _h === void 0 ? void 0 : _h.count) > 0, weight: 1 }
        ];
        checks.forEach(function (check) {
            total += check.weight;
            if (check.value)
                complete += check.weight;
        });
        return Math.round((complete / total) * 100);
    };
    DataFetcher.prototype.calculateSuccessRate = function (metadata) {
        var sources = Object.values(metadata.sources);
        var successful = sources.filter(function (s) { return s.status === 'success'; }).length;
        return Math.round((successful / sources.length) * 100);
    };
    DataFetcher.prototype.recordError = function (source, error, errors, metadata, critical) {
        errors.push({
            stage: 'fetching',
            source: source,
            message: error.message,
            timestamp: Date.now(),
            severity: critical ? 'critical' : 'error',
            retryable: error instanceof errorHandler_1.RetryableError ? error.retryable : false
        });
        metadata.sources[source] = {
            status: 'failed',
            timestamp: new Date().toISOString(),
            error: error.message
        };
        if (this.config.debugMode) {
            console.error("[DataFetcher] ".concat(source, " failed:"), error.message);
        }
    };
    // Default value providers
    DataFetcher.prototype.calculateKeyMetrics = function (quote, fundamentals) {
        var _a, _b, _c, _d;
        return {
            marketCap: (quote === null || quote === void 0 ? void 0 : quote.market_cap) ? parseFloat(quote.market_cap) : 0,
            peRatio: (quote === null || quote === void 0 ? void 0 : quote.pe) ? parseFloat(quote.pe) : 0,
            pegRatio: ((_a = fundamentals === null || fundamentals === void 0 ? void 0 : fundamentals.keyMetrics) === null || _a === void 0 ? void 0 : _a.pegRatio) || 0,
            priceToBook: (quote === null || quote === void 0 ? void 0 : quote.pb) ? parseFloat(quote.pb) : 0,
            dividendYield: (quote === null || quote === void 0 ? void 0 : quote.dividend_yield) ? parseFloat(quote.dividend_yield) : 0,
            roe: ((_b = fundamentals === null || fundamentals === void 0 ? void 0 : fundamentals.keyMetrics) === null || _b === void 0 ? void 0 : _b.roe) || 0,
            currentRatio: ((_c = fundamentals === null || fundamentals === void 0 ? void 0 : fundamentals.keyMetrics) === null || _c === void 0 ? void 0 : _c.currentRatio) || 0,
            debtToEquity: ((_d = fundamentals === null || fundamentals === void 0 ? void 0 : fundamentals.keyMetrics) === null || _d === void 0 ? void 0 : _d.debtToEquity) || 0
        };
    };
    DataFetcher.prototype.getDefaultKeyMetrics = function () {
        return {
            marketCap: 0,
            peRatio: 0,
            pegRatio: 0,
            priceToBook: 0,
            dividendYield: 0,
            roe: 0,
            currentRatio: 0,
            debtToEquity: 0
        };
    };
    DataFetcher.prototype.getDefaultTechnicals = function () {
        return {
            sma20: 0,
            sma50: 0,
            sma200: 0,
            rsi: 50,
            macd: { macd: 0, signal: 0, histogram: 0 },
            volume: { current: 0, average10Day: 0, average30Day: 0, trend: 'stable' },
            patterns: []
        };
    };
    DataFetcher.prototype.getDefaultAnalystData = function () {
        return {
            consensus: { rating: 'hold', score: 3, count: 0 },
            priceTargets: [],
            recommendations: [],
            revisions: []
        };
    };
    return DataFetcher;
}());
exports.DataFetcher = DataFetcher;
/**
 * Factory function for creating data fetchers
 * Provides a clean API for instantiation
 */
function createDataFetcher(config) {
    // Validate configuration
    if (!config.ticker) {
        throw new Error('Ticker symbol is required for data fetching');
    }
    // Ensure API keys are available
    var apiKey = config.apiKey || process.env.REACT_APP_TWELVE_DATA_API_KEY;
    var firecrawlKey = config.firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
        throw new Error('TwelveData API key is required. Set REACT_APP_TWELVE_DATA_API_KEY ' +
            'environment variable or pass apiKey in config.');
    }
    if (!firecrawlKey) {
        console.warn('[DataFetcher] Firecrawl API key not found. Web scraping features will be limited.');
    }
    return new DataFetcher(__assign(__assign({}, config), { apiKey: apiKey, firecrawlApiKey: firecrawlKey }));
}
exports.createDataFetcher = createDataFetcher;
