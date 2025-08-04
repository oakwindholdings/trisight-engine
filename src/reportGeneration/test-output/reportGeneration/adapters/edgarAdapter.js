"use strict";
// src/reportGeneration/adapters/edgarAdapter.ts
// SEC EDGAR integration for regulatory filings using Firecrawl for extraction
// Context: Intelligently extracts structured data from 10-K, 10-Q, and other SEC filings
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.EdgarAdapter = void 0;
var baseAdapter_1 = require("../core/baseAdapter");
var firecrawlAdapter_1 = require("./firecrawlAdapter");
var errorHandler_1 = require("../utils/errorHandler");
/**
 * Enhanced EDGAR adapter implementation
 * Combines SEC EDGAR API with Firecrawl's intelligent extraction
 */
var EdgarAdapter = /** @class */ (function (_super) {
    __extends(EdgarAdapter, _super);
    function EdgarAdapter(config) {
        var _this = _super.call(this, 'EDGAR', {
            cache: config.cache,
            debugMode: config.debugMode,
            rateLimitConfig: {
                requestsPerMinute: 10,
                burstSize: 2
            }
        }) || this;
        _this.edgarBaseUrl = 'https://www.sec.gov';
        _this.dataBaseUrl = 'https://data.sec.gov';
        // CIK cache to avoid repeated lookups
        _this.cikCache = new Map();
        // Use provided Firecrawl adapter or create new one
        _this.firecrawl = config.firecrawlAdapter || new firecrawlAdapter_1.FirecrawlAdapter({
            cache: config.cache,
            debugMode: config.debugMode
        });
        _this.baseUrl = config.baseUrl || 'https://efts.sec.gov/LATEST';
        // Set required User-Agent for SEC EDGAR API
        _this.requestConfig.headers['User-Agent'] = config.userAgent ||
            'TriSight Report Generator bob@bobstewart.com';
        _this.requestConfig.headers['Accept'] = 'application/json';
        // Create cached versions of methods
        _this.getCompanyInfo = _this.createCachedMethod(_this.getCompanyInfo, 'company_info', 86400000 // Cache for 24 hours
        );
        return _this;
    }
    /**
     * Gets company description from latest 10-K filing
     * Uses Firecrawl to intelligently extract the business description
     */
    EdgarAdapter.prototype.getCompanyDescription = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var filing, filingUrl, extractedData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getLatestFiling(ticker, '10-K')];
                    case 1:
                        filing = _a.sent();
                        if (!filing) {
                            throw new Error("No 10-K filing found for ".concat(ticker));
                        }
                        filingUrl = this.getFilingUrl(filing);
                        return [4 /*yield*/, this.firecrawl.extractCompanyProfile(filingUrl)];
                    case 2:
                        extractedData = _a.sent();
                        return [2 /*return*/, extractedData.description || 'No business description found'];
                    case 3:
                        error_1 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_1, {
                            source: 'EDGAR',
                            operation: 'getCompanyDescription',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches earnings call transcripts
     * Note: EDGAR doesn't typically have transcripts, so we search for 8-K earnings releases
     */
    EdgarAdapter.prototype.getEarningsTranscripts = function (ticker, limit) {
        if (limit === void 0) { limit = 4; }
        return __awaiter(this, void 0, void 0, function () {
            var filings, transcripts, _i, filings_1, filing, filingUrl, extractedData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.searchFilings(ticker, '8-K', limit)];
                    case 1:
                        filings = _a.sent();
                        transcripts = [];
                        _i = 0, filings_1 = filings;
                        _a.label = 2;
                    case 2:
                        if (!(_i < filings_1.length)) return [3 /*break*/, 5];
                        filing = filings_1[_i];
                        filingUrl = this.getFilingUrl(filing);
                        return [4 /*yield*/, this.extractEarningsContent(filingUrl, filing.filingDate)];
                    case 3:
                        extractedData = _a.sent();
                        if (extractedData && this.isEarningsRelated(extractedData)) {
                            transcripts.push({
                                date: filing.filingDate,
                                quarter: this.inferQuarter(filing.filingDate),
                                year: new Date(filing.filingDate).getFullYear(),
                                participants: extractedData.participants || [],
                                content: extractedData.content || '',
                                qaSection: extractedData.qaSection || '',
                                keyHighlights: extractedData.keyHighlights || []
                            });
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, transcripts];
                    case 6:
                        error_2 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_2, {
                            source: 'EDGAR',
                            operation: 'getEarningsTranscripts',
                            ticker: ticker
                        });
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches the latest 10-K annual report
     */
    EdgarAdapter.prototype.get10K = function (ticker, year) {
        return __awaiter(this, void 0, void 0, function () {
            var targetYear_1, filings, filing, filingUrl, extractedData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        targetYear_1 = year || new Date().getFullYear() - 1;
                        return [4 /*yield*/, this.searchFilings(ticker, '10-K', 5)];
                    case 1:
                        filings = _a.sent();
                        filing = filings.find(function (f) {
                            var filingYear = new Date(f.periodEndDate || f.filingDate).getFullYear();
                            return filingYear === targetYear_1;
                        }) || filings[0];
                        if (!filing) {
                            throw new Error("No 10-K filing found for ".concat(ticker, " in ").concat(targetYear_1));
                        }
                        filingUrl = this.getFilingUrl(filing);
                        return [4 /*yield*/, this.extract10KData(filingUrl, filing)];
                    case 2:
                        extractedData = _a.sent();
                        return [2 /*return*/, __assign(__assign(__assign({}, filing), extractedData), { url: filingUrl })];
                    case 3:
                        error_3 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_3, {
                            source: 'EDGAR',
                            operation: 'get10K',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches quarterly 10-Q report
     */
    EdgarAdapter.prototype.get10Q = function (ticker, quarter) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var filings, filing, _b, year_1, q_1, filingUrl, extractedData, error_4;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.searchFilings(ticker, '10-Q', 4)];
                    case 1:
                        filings = _c.sent();
                        filing = void 0;
                        if (quarter) {
                            _b = ((_a = quarter.match(/(\d{4})Q(\d)/)) === null || _a === void 0 ? void 0 : _a.slice(1)) || [], year_1 = _b[0], q_1 = _b[1];
                            filing = filings.find(function (f) {
                                var filingDate = new Date(f.periodEndDate || f.filingDate);
                                var filingQuarter = Math.ceil((filingDate.getMonth() + 1) / 3);
                                return filingDate.getFullYear() === parseInt(year_1) && filingQuarter === parseInt(q_1);
                            });
                        }
                        else {
                            filing = filings[0]; // Most recent
                        }
                        if (!filing) {
                            throw new Error("No 10-Q filing found for ".concat(ticker, " ").concat(quarter || 'recent'));
                        }
                        filingUrl = this.getFilingUrl(filing);
                        return [4 /*yield*/, this.extract10QData(filingUrl, filing)];
                    case 2:
                        extractedData = _c.sent();
                        return [2 /*return*/, __assign(__assign(__assign({}, filing), extractedData), { url: filingUrl })];
                    case 3:
                        error_4 = _c.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_4, {
                            source: 'EDGAR',
                            operation: 'get10Q',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches recent 8-K current reports
     */
    EdgarAdapter.prototype.get8K = function (ticker, limit) {
        if (limit === void 0) { limit = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var filings, enrichedFilings, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.searchFilings(ticker, '8-K', limit)];
                    case 1:
                        filings = _a.sent();
                        return [4 /*yield*/, Promise.all(filings.map(function (filing) { return __awaiter(_this, void 0, void 0, function () {
                                var filingUrl, extractedData;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            filingUrl = this.getFilingUrl(filing);
                                            return [4 /*yield*/, this.extract8KData(filingUrl, filing)];
                                        case 1:
                                            extractedData = _a.sent();
                                            return [2 /*return*/, __assign(__assign(__assign({}, filing), extractedData), { url: filingUrl })];
                                    }
                                });
                            }); }))];
                    case 2:
                        enrichedFilings = _a.sent();
                        return [2 /*return*/, enrichedFilings];
                    case 3:
                        error_5 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_5, {
                            source: 'EDGAR',
                            operation: 'get8K',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extracts financial statements from latest 10-K/10-Q
     * Uses Firecrawl's AI to parse tables and financial data
     */
    EdgarAdapter.prototype.getFinancialStatements = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var annualFiling, annualData, _a, quarterlyFilings, quarterlyData, error_6;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, this.getLatestFiling(ticker, '10-K')];
                    case 1:
                        annualFiling = _b.sent();
                        if (!annualFiling) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.extractFinancialStatements(this.getFilingUrl(annualFiling), 'annual')];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = [];
                        _b.label = 4;
                    case 4:
                        annualData = _a;
                        return [4 /*yield*/, this.searchFilings(ticker, '10-Q', 4)];
                    case 5:
                        quarterlyFilings = _b.sent();
                        return [4 /*yield*/, Promise.all(quarterlyFilings.map(function (filing) {
                                return _this.extractFinancialStatements(_this.getFilingUrl(filing), 'quarterly');
                            }))];
                    case 6:
                        quarterlyData = _b.sent();
                        return [2 /*return*/, {
                                annual: annualData,
                                quarterly: quarterlyData.flat()
                            }];
                    case 7:
                        error_6 = _b.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_6, {
                            source: 'EDGAR',
                            operation: 'getFinancialStatements',
                            ticker: ticker
                        });
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets insider trading data from Form 4 filings
     */
    EdgarAdapter.prototype.getInsiderTrading = function (ticker, limit) {
        if (limit === void 0) { limit = 20; }
        return __awaiter(this, void 0, void 0, function () {
            var filings, trades, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.searchFilings(ticker, '4', limit)];
                    case 1:
                        filings = _a.sent();
                        return [4 /*yield*/, Promise.all(filings.map(function (filing) { return __awaiter(_this, void 0, void 0, function () {
                                var filingUrl;
                                return __generator(this, function (_a) {
                                    filingUrl = this.getFilingUrl(filing);
                                    return [2 /*return*/, this.extractInsiderTrade(filingUrl, filing)];
                                });
                            }); }))];
                    case 2:
                        trades = _a.sent();
                        return [2 /*return*/, trades.filter(function (trade) { return trade !== null; })];
                    case 3:
                        error_7 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_7, {
                            source: 'EDGAR',
                            operation: 'getInsiderTrading',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper methods for EDGAR data extraction
     */
    EdgarAdapter.prototype.getCIK = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var response, company, cik, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Check cache first
                        if (this.cikCache.has(ticker)) {
                            return [2 /*return*/, this.cikCache.get(ticker)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest('https://www.sec.gov/files/company_tickers.json')];
                    case 2:
                        response = _a.sent();
                        company = Object.values(response).find(function (c) { return c.ticker === ticker.toUpperCase(); });
                        if (!company) {
                            throw new Error("Ticker ".concat(ticker, " not found in SEC database"));
                        }
                        cik = String(company.cik_str).padStart(10, '0');
                        this.cikCache.set(ticker, cik);
                        return [2 /*return*/, cik];
                    case 3:
                        error_8 = _a.sent();
                        throw new errorHandler_1.RetryableError("Failed to get CIK for ".concat(ticker), errorHandler_1.ErrorCategory.PARSING, false);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EdgarAdapter.prototype.getCompanyInfo = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var cik, url;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCIK(ticker)];
                    case 1:
                        cik = _a.sent();
                        url = "".concat(this.dataBaseUrl, "/submissions/CIK").concat(cik, ".json");
                        return [2 /*return*/, this.makeRequest(url)];
                }
            });
        });
    };
    EdgarAdapter.prototype.searchFilings = function (ticker, formType, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var cik, companyInfo, recentFilings, results, i;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getCIK(ticker)];
                    case 1:
                        cik = _a.sent();
                        return [4 /*yield*/, this.getCompanyInfo(ticker)];
                    case 2:
                        companyInfo = _a.sent();
                        recentFilings = companyInfo.filings.recent;
                        results = [];
                        for (i = 0; i < recentFilings.form.length && results.length < limit; i++) {
                            if (recentFilings.form[i] === formType) {
                                results.push({
                                    accessionNumber: recentFilings.accessionNumber[i],
                                    filingDate: recentFilings.filingDate[i],
                                    formType: recentFilings.form[i],
                                    reportDate: recentFilings.reportDate[i],
                                    fileNumber: recentFilings.fileNumber[i],
                                    filmNumber: recentFilings.filmNumber[i],
                                    acceptTime: recentFilings.acceptanceDateTime[i],
                                    periodEndDate: recentFilings.reportDate[i],
                                    documents: [{
                                            documentType: formType,
                                            documentName: recentFilings.primaryDocument[i],
                                            description: recentFilings.primaryDocDescription[i]
                                        }]
                                });
                            }
                        }
                        return [2 /*return*/, results];
                }
            });
        });
    };
    EdgarAdapter.prototype.getLatestFiling = function (ticker, formType) {
        return __awaiter(this, void 0, void 0, function () {
            var filings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.searchFilings(ticker, formType, 1)];
                    case 1:
                        filings = _a.sent();
                        return [2 /*return*/, filings[0] || null];
                }
            });
        });
    };
    EdgarAdapter.prototype.getFilingUrl = function (filing) {
        var _a, _b;
        var accessionNumberNoDashes = filing.accessionNumber.replace(/-/g, '');
        var document = ((_b = (_a = filing.documents) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.documentName) || "".concat(filing.accessionNumber, ".txt");
        return "".concat(this.edgarBaseUrl, "/Archives/edgar/data/").concat(accessionNumberNoDashes.slice(0, 10), "/").concat(accessionNumberNoDashes, "/").concat(document);
    };
    /**
     * Extraction methods using Firecrawl's AI capabilities
     */
    EdgarAdapter.prototype.extract10KData = function (url, filing) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.firecrawl.extractCompanyProfile(url)];
            });
        });
    };
    EdgarAdapter.prototype.extract10QData = function (url, filing) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firecrawl.scrapeUrl(url)];
                    case 1:
                        content = _a.sent();
                        // Simple extraction for now - can be enhanced with custom schemas
                        return [2 /*return*/, {
                                mdAndA: this.extractSection(content, "Management's Discussion and Analysis"),
                                financialCondition: this.extractSection(content, "Financial Condition"),
                                resultsOfOperations: this.extractSection(content, "Results of Operations")
                            }];
                }
            });
        });
    };
    EdgarAdapter.prototype.extract8KData = function (url, filing) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firecrawl.scrapeUrl(url)];
                    case 1:
                        content = _a.sent();
                        return [2 /*return*/, {
                                items: this.extractItems(content),
                                signatures: this.extractSignatures(content),
                                exhibits: this.extractExhibits(content)
                            }];
                }
            });
        });
    };
    EdgarAdapter.prototype.extractEarningsContent = function (url, filingDate) {
        return __awaiter(this, void 0, void 0, function () {
            var content, isEarnings;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firecrawl.scrapeUrl(url)];
                    case 1:
                        content = _a.sent();
                        isEarnings = /earnings|revenue|quarter|guidance|outlook/i.test(content);
                        if (!isEarnings)
                            return [2 /*return*/, null];
                        return [2 /*return*/, {
                                content: this.extractSection(content, "Item 2.02"),
                                keyHighlights: this.extractHighlights(content),
                                participants: [] // 8-Ks don't have participant lists like transcripts
                            }];
                }
            });
        });
    };
    EdgarAdapter.prototype.extractFinancialStatements = function (url, period) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firecrawl.scrapeUrl(url)];
                    case 1:
                        content = _a.sent();
                        // This is simplified - real implementation would parse XBRL or tables
                        return [2 /*return*/, [{
                                    date: new Date().toISOString(),
                                    period: period,
                                    revenue: 0,
                                    grossProfit: 0,
                                    operatingIncome: 0,
                                    netIncome: 0,
                                    eps: 0
                                }]];
                }
            });
        });
    };
    EdgarAdapter.prototype.extractInsiderTrade = function (url, filing) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.firecrawl.scrapeUrl(url)];
                    case 1:
                        content = _a.sent();
                        // Extract key Form 4 data
                        return [2 /*return*/, {
                                filingDate: filing.filingDate,
                                reportingPerson: this.extractReportingPerson(content),
                                transactions: this.extractTransactions(content)
                            }];
                }
            });
        });
    };
    /**
     * Text extraction utilities
     */
    EdgarAdapter.prototype.extractSection = function (content, sectionName) {
        var regex = new RegExp("".concat(sectionName, "[\\s\\S]*?(?=Item \\d|SIGNATURES|$)"), 'i');
        var match = content.match(regex);
        return match ? match[0].trim() : '';
    };
    EdgarAdapter.prototype.extractItems = function (content) {
        var itemRegex = /Item \d+\.\d+[^\n]*/gi;
        return content.match(itemRegex) || [];
    };
    EdgarAdapter.prototype.extractSignatures = function (content) {
        var sigRegex = /SIGNATURES[\s\S]*$/i;
        var match = content.match(sigRegex);
        return match ? match[0].trim() : '';
    };
    EdgarAdapter.prototype.extractExhibits = function (content) {
        var exhibitRegex = /Exhibit \d+\.\d+[^\n]*/gi;
        return content.match(exhibitRegex) || [];
    };
    EdgarAdapter.prototype.extractHighlights = function (content) {
        // Extract sentences with financial metrics
        var sentences = content.match(/[^.!?]+[.!?]+/g) || [];
        return sentences
            .filter(function (s) { return /\$[\d,]+|\d+%|revenue|earnings|growth/i.test(s); })
            .slice(0, 5);
    };
    EdgarAdapter.prototype.extractReportingPerson = function (content) {
        var match = content.match(/Reporting Person[:\s]*([^\n]+)/i);
        return match ? match[1].trim() : 'Unknown';
    };
    EdgarAdapter.prototype.extractTransactions = function (content) {
        // Simplified - real implementation would parse the transaction table
        return [];
    };
    EdgarAdapter.prototype.isEarningsRelated = function (data) {
        return data && data.content && data.content.length > 100;
    };
    EdgarAdapter.prototype.inferQuarter = function (date) {
        var d = new Date(date);
        var quarter = Math.ceil((d.getMonth() + 1) / 3);
        return "Q".concat(quarter);
    };
    return EdgarAdapter;
}(baseAdapter_1.BaseAdapter));
exports.EdgarAdapter = EdgarAdapter;
