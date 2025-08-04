"use strict";
// src/reportGeneration/adapters/twelveDataAdapter.ts
// TwelveData API integration with intelligent rate limiting and response transformation
// Context: Primary data source for all market data, fundamentals, and analyst information
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
exports.TwelveDataAdapter = void 0;
var baseAdapter_1 = require("../core/baseAdapter");
var errorHandler_1 = require("../utils/errorHandler");
var storageAdapter_1 = require("../utils/storageAdapter");
var typeGuards_1 = require("../utils/typeGuards");
/**
 * Token bucket implementation for rate limiting
 * This ensures we never exceed our API credits even under heavy load
 */
var TokenBucket = /** @class */ (function () {
    function TokenBucket(maxTokens, tokensPerMinute) {
        this.maxTokens = maxTokens;
        this.tokens = maxTokens;
        this.lastRefill = Date.now();
        this.refillRate = tokensPerMinute / 60000; // Convert to per millisecond
    }
    TokenBucket.prototype.waitForTokens = function (count) {
        return __awaiter(this, void 0, void 0, function () {
            var _loop_1, this_1, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function () {
                            var tokensNeeded, waitTime;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        this_1.refill();
                                        if (this_1.tokens >= count) {
                                            this_1.tokens -= count;
                                            return [2 /*return*/, { value: void 0 }];
                                        }
                                        tokensNeeded = count - this_1.tokens;
                                        waitTime = Math.ceil(tokensNeeded / this_1.refillRate);
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, Math.min(waitTime, 1000)); })];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [5 /*yield**/, _loop_1()];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    TokenBucket.prototype.refill = function () {
        var now = Date.now();
        var timePassed = now - this.lastRefill;
        var tokensToAdd = timePassed * this.refillRate;
        this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
        this.lastRefill = now;
    };
    TokenBucket.prototype.getAvailableTokens = function () {
        this.refill();
        return Math.floor(this.tokens);
    };
    return TokenBucket;
}());
/**
 * TwelveData adapter implementation
 * Handles all interactions with the TwelveData API including rate limiting and response transformation
 */
var TwelveDataAdapter = /** @class */ (function (_super) {
    __extends(TwelveDataAdapter, _super);
    function TwelveDataAdapter(config) {
        var _this = _super.call(this, 'TwelveData', {
            cache: config.cache,
            debugMode: config.debugMode,
            rateLimitConfig: {
                requestsPerMinute: 60,
                burstSize: 10
            }
        }) || this;
        // API credit costs for different endpoints (Ultra tier)
        _this.CREDIT_COSTS = {
            quote: 1,
            timeSeries: 10,
            fundamentals: 50,
            analystRatings: 5,
            technicalIndicator: 5,
            statistics: 25
        };
        _this.apiKey = config.apiKey || process.env.REACT_APP_TWELVE_DATA_API_KEY;
        if (!_this.apiKey) {
            throw new Error('REACT_APP_TWELVE_DATA_API_KEY environment variable is required');
        }
        _this.baseUrl = config.baseUrl || 'https://api.twelvedata.com';
        _this.isUltraTier = config.isUltraTier !== false; // Default to true
        // Initialize token bucket with Ultra tier limits (10,946 credits/minute)
        var creditsPerMinute = _this.isUltraTier ? 10946 : 60;
        _this.tokenBucket = new TokenBucket(creditsPerMinute, creditsPerMinute);
        // Initialize localStorage cache layer
        _this.initializeLocalStorageCache();
        // Create cached versions of frequently called methods
        _this.getQuote = _this.createCachedMethod(_this.getQuote, 'quote', 60000 // Cache quotes for 1 minute
        );
        _this.getTimeSeries = _this.createCachedMethod(_this.getTimeSeries, 'timeseries', 300000 // Cache time series for 5 minutes
        );
        _this.getFundamentals = _this.createCachedMethod(_this.getFundamentals, 'fundamentals', 3600000 // Cache fundamentals for 1 hour
        );
        _this.getEarnings = _this.createCachedMethod(_this.getEarnings, 'earnings', 3600000 // Cache earnings for 1 hour
        );
        return _this;
    }
    /**
     * Fetches current quote data for a symbol
     * This provides real-time price information and key statistics
     */
    TwelveDataAdapter.prototype.getQuote = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.tokenBucket.waitForTokens(this.CREDIT_COSTS.quote)];
                    case 1:
                        _a.sent();
                        url = new URL("".concat(this.baseUrl, "/quote"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        data = _a.sent();
                        // Validate response
                        if (!(0, typeGuards_1.isValidQuoteResponse)(data) || data.symbol !== symbol) {
                            throw new errorHandler_1.RetryableError("Invalid quote response for ".concat(symbol), errorHandler_1.ErrorCategory.PARSING, false);
                        }
                        return [2 /*return*/, data];
                }
            });
        });
    };
    /**
     * Fetches historical price data
     * Supports multiple intervals and output sizes for different analysis needs
     */
    TwelveDataAdapter.prototype.getTimeSeries = function (symbol, interval, outputsize // Default to 1 year of daily data
    ) {
        if (interval === void 0) { interval = '1day'; }
        if (outputsize === void 0) { outputsize = 252; }
        return __awaiter(this, void 0, void 0, function () {
            var credits, url, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        credits = this.CREDIT_COSTS.timeSeries;
                        return [4 /*yield*/, this.tokenBucket.waitForTokens(credits)];
                    case 1:
                        _a.sent();
                        url = new URL("".concat(this.baseUrl, "/time_series"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('interval', interval);
                        url.searchParams.append('outputsize', outputsize.toString());
                        url.searchParams.append('apikey', this.apiKey);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        data = _a.sent();
                        // Validate response
                        if (!(0, typeGuards_1.isValidTimeSeriesResponse)(data)) {
                            throw new errorHandler_1.RetryableError("Failed to fetch time series for ".concat(symbol, ": Invalid response structure"), errorHandler_1.ErrorCategory.PARSING, false);
                        }
                        // Transform to our format with safe parsing
                        return [2 /*return*/, data.values.map(function (candle) { return ({
                                date: candle.datetime,
                                open: (0, typeGuards_1.safeParseFloat)(candle.open),
                                high: (0, typeGuards_1.safeParseFloat)(candle.high),
                                low: (0, typeGuards_1.safeParseFloat)(candle.low),
                                close: (0, typeGuards_1.safeParseFloat)(candle.close),
                                volume: (0, typeGuards_1.safeParseInt)(candle.volume),
                                adjustedClose: (0, typeGuards_1.safeParseFloat)(candle.close) // TwelveData returns adjusted prices by default
                            }); })];
                }
            });
        });
    };
    /**
     * Fetches comprehensive fundamental data
     * This is one of the most credit-expensive operations but provides rich financial data
     * NOTE: TwelveData doesn't have a /fundamentals endpoint, so we fetch individual components
     */
    TwelveDataAdapter.prototype.getFundamentals = function (symbol) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var totalCredits, _d, statistics, incomeStatement, balanceSheet, cashFlow, transformStatement, keyMetrics, incomeStatements, data, balanceSheets, data, cashFlows, data;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        totalCredits = this.CREDIT_COSTS.fundamentals * 4;
                        return [4 /*yield*/, this.tokenBucket.waitForTokens(totalCredits)];
                    case 1:
                        _e.sent();
                        if (this.debugMode) {
                            console.log("[TwelveData] Fetching fundamentals for ".concat(symbol, " using individual endpoints"));
                        }
                        return [4 /*yield*/, Promise.allSettled([
                                this.fetchStatistics(symbol),
                                this.fetchIncomeStatement(symbol),
                                this.fetchBalanceSheet(symbol),
                                this.fetchCashFlow(symbol)
                            ])];
                    case 2:
                        _d = _e.sent(), statistics = _d[0], incomeStatement = _d[1], balanceSheet = _d[2], cashFlow = _d[3];
                        transformStatement = function (statement) { return (__assign({ date: statement.date || statement.fiscal_date, period: statement.period || 'annual', revenue: (0, typeGuards_1.safeParseFloat)(statement.sales || statement.revenue), grossProfit: (0, typeGuards_1.safeParseFloat)(statement.gross_profit), operatingIncome: (0, typeGuards_1.safeParseFloat)(statement.operating_income), netIncome: (0, typeGuards_1.safeParseFloat)(statement.net_income), eps: (0, typeGuards_1.safeParseFloat)(statement.eps_basic || statement.eps_diluted || statement.eps) }, statement)); };
                        keyMetrics = this.getDefaultKeyMetrics();
                        if (statistics.status === 'fulfilled' && statistics.value) {
                            keyMetrics = this.extractKeyMetrics(statistics.value);
                        }
                        incomeStatements = [];
                        if (incomeStatement.status === 'fulfilled' && incomeStatement.value) {
                            data = incomeStatement.value;
                            incomeStatements = ((_a = data.income_statement) === null || _a === void 0 ? void 0 : _a.map(transformStatement)) || [];
                        }
                        balanceSheets = [];
                        if (balanceSheet.status === 'fulfilled' && balanceSheet.value) {
                            data = balanceSheet.value;
                            balanceSheets = ((_b = data.balance_sheet) === null || _b === void 0 ? void 0 : _b.map(transformStatement)) || [];
                        }
                        cashFlows = [];
                        if (cashFlow.status === 'fulfilled' && cashFlow.value) {
                            data = cashFlow.value;
                            cashFlows = ((_c = data.cash_flow) === null || _c === void 0 ? void 0 : _c.map(transformStatement)) || [];
                        }
                        // Log any failures for debugging
                        if (this.debugMode) {
                            if (statistics.status === 'rejected')
                                console.error('[TwelveData] Statistics fetch failed:', statistics.reason);
                            if (incomeStatement.status === 'rejected')
                                console.error('[TwelveData] Income statement fetch failed:', incomeStatement.reason);
                            if (balanceSheet.status === 'rejected')
                                console.error('[TwelveData] Balance sheet fetch failed:', balanceSheet.reason);
                            if (cashFlow.status === 'rejected')
                                console.error('[TwelveData] Cash flow fetch failed:', cashFlow.reason);
                        }
                        return [2 /*return*/, {
                                incomeStatement: incomeStatements.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); }),
                                balanceSheet: balanceSheets.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); }),
                                cashFlow: cashFlows.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); }),
                                keyMetrics: keyMetrics,
                                historicalPrices: [] // Will be filled by getTimeSeries
                            }];
                }
            });
        });
    };
    /**
     * Fetches statistics data for key metrics
     */
    TwelveDataAdapter.prototype.fetchStatistics = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL("".concat(this.baseUrl, "/statistics"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 3:
                        error_1 = _a.sent();
                        console.warn("[TwelveData] Failed to fetch statistics for ".concat(symbol, ":"), error_1);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches income statement data
     */
    TwelveDataAdapter.prototype.fetchIncomeStatement = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL("".concat(this.baseUrl, "/income_statement"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 3:
                        error_2 = _a.sent();
                        console.warn("[TwelveData] Failed to fetch income statement for ".concat(symbol, ":"), error_2);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches balance sheet data
     */
    TwelveDataAdapter.prototype.fetchBalanceSheet = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL("".concat(this.baseUrl, "/balance_sheet"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 3:
                        error_3 = _a.sent();
                        console.warn("[TwelveData] Failed to fetch balance sheet for ".concat(symbol, ":"), error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches cash flow data
     */
    TwelveDataAdapter.prototype.fetchCashFlow = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL("".concat(this.baseUrl, "/cash_flow"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, response];
                    case 3:
                        error_4 = _a.sent();
                        console.warn("[TwelveData] Failed to fetch cash flow for ".concat(symbol, ":"), error_4);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches analyst ratings and price targets
     * Ultra tier exclusive feature that provides valuable consensus data
     */
    TwelveDataAdapter.prototype.getAnalystRatings = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data, ratings, recentRatings, ratingScores, totalScore, ratingCount, priceTargets, recommendations, avgScore, consensusRating;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isUltraTier) {
                            // Return empty data for non-Ultra subscriptions
                            return [2 /*return*/, {
                                    consensus: { rating: 'hold', score: 3, count: 0 },
                                    priceTargets: [],
                                    recommendations: [],
                                    revisions: []
                                }];
                        }
                        return [4 /*yield*/, this.tokenBucket.waitForTokens(this.CREDIT_COSTS.analystRatings)];
                    case 1:
                        _a.sent();
                        url = new URL("".concat(this.baseUrl, "/analyst_ratings"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 2:
                        data = _a.sent();
                        ratings = data.ratings || [];
                        recentRatings = ratings.slice(0, 20);
                        ratingScores = {
                            'strong buy': 5,
                            'buy': 4,
                            'hold': 3,
                            'sell': 2,
                            'strong sell': 1
                        };
                        totalScore = 0;
                        ratingCount = 0;
                        priceTargets = [];
                        recommendations = [];
                        recentRatings.forEach(function (rating) {
                            // Add to recommendations
                            recommendations.push({
                                analyst: rating.analyst_name || 'Unknown',
                                firm: rating.firm,
                                rating: rating.rating,
                                previousRating: rating.rating_change,
                                date: rating.date
                            });
                            // Extract price targets
                            if (rating.price_target) {
                                priceTargets.push({
                                    analyst: rating.analyst_name || 'Unknown',
                                    firm: rating.firm,
                                    target: (0, typeGuards_1.safeParseFloat)(rating.price_target),
                                    date: rating.date,
                                    horizon: '12m' // TwelveData typically provides 12-month targets
                                });
                            }
                            // Calculate consensus score
                            var score = ratingScores[rating.rating.toLowerCase()];
                            if (score) {
                                totalScore += score;
                                ratingCount++;
                            }
                        });
                        avgScore = ratingCount > 0 ? totalScore / ratingCount : 3;
                        consensusRating = this.scoreToRating(avgScore);
                        return [2 /*return*/, {
                                consensus: {
                                    rating: consensusRating,
                                    score: parseFloat(avgScore.toFixed(2)),
                                    count: ratingCount
                                },
                                priceTargets: priceTargets,
                                recommendations: recommendations,
                                revisions: [] // TwelveData doesn't provide revision history in standard API
                            }];
                }
            });
        });
    };
    /**
     * Fetches technical indicators
     * Calculates common indicators like SMA, RSI, MACD for technical analysis
     */
    TwelveDataAdapter.prototype.getTechnicalIndicators = function (symbol, indicators) {
        if (indicators === void 0) { indicators = ['sma', 'rsi', 'macd']; }
        return __awaiter(this, void 0, void 0, function () {
            var totalCredits, indicatorPromises, results, quote, technicals;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        totalCredits = indicators.length * this.CREDIT_COSTS.technicalIndicator;
                        return [4 /*yield*/, this.tokenBucket.waitForTokens(totalCredits)];
                    case 1:
                        _a.sent();
                        indicatorPromises = indicators.map(function (indicator) { return __awaiter(_this, void 0, void 0, function () {
                            var url;
                            return __generator(this, function (_a) {
                                url = new URL("".concat(this.baseUrl, "/").concat(indicator));
                                url.searchParams.append('symbol', symbol);
                                url.searchParams.append('interval', '1day');
                                url.searchParams.append('apikey', this.apiKey);
                                // Add indicator-specific parameters
                                switch (indicator) {
                                    case 'sma':
                                        url.searchParams.append('time_period', '20');
                                        break;
                                    case 'rsi':
                                        url.searchParams.append('time_period', '14');
                                        break;
                                    case 'macd':
                                        url.searchParams.append('fast_period', '12');
                                        url.searchParams.append('slow_period', '26');
                                        url.searchParams.append('signal_period', '9');
                                        break;
                                }
                                return [2 /*return*/, this.makeRequest(url.toString())];
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(indicatorPromises)];
                    case 2:
                        results = _a.sent();
                        return [4 /*yield*/, this.getQuote(symbol)];
                    case 3:
                        quote = _a.sent();
                        technicals = {
                            sma20: 0,
                            sma50: 0,
                            sma200: 0,
                            rsi: 50,
                            macd: { macd: 0, signal: 0, histogram: 0 },
                            volume: {
                                current: (0, typeGuards_1.safeParseInt)(quote.volume),
                                average10Day: (0, typeGuards_1.safeParseInt)(quote.average_volume),
                                average30Day: (0, typeGuards_1.safeParseInt)(quote.average_volume),
                                trend: this.calculateVolumeTrend((0, typeGuards_1.safeParseInt)(quote.volume), (0, typeGuards_1.safeParseInt)(quote.average_volume))
                            },
                            patterns: [] // Will be filled by pattern detection engine
                        };
                        // Extract latest values from indicator responses
                        results.forEach(function (result, index) {
                            var indicator = indicators[index];
                            if (result.values && result.values.length > 0) {
                                var latestValue = result.values[0];
                                switch (indicator) {
                                    case 'sma':
                                        technicals.sma20 = (0, typeGuards_1.safeParseFloat)(latestValue.sma);
                                        break;
                                    case 'rsi':
                                        technicals.rsi = (0, typeGuards_1.safeParseFloat)(latestValue.rsi, 50);
                                        break;
                                    case 'macd':
                                        technicals.macd = {
                                            macd: (0, typeGuards_1.safeParseFloat)(latestValue.macd),
                                            signal: (0, typeGuards_1.safeParseFloat)(latestValue.macd_signal),
                                            histogram: (0, typeGuards_1.safeParseFloat)(latestValue.macd_hist)
                                        };
                                        break;
                                }
                            }
                        });
                        // Fetch additional SMAs for 50 and 200 periods
                        return [4 /*yield*/, this.fetchAdditionalSMAs(symbol, technicals)];
                    case 4:
                        // Fetch additional SMAs for 50 and 200 periods
                        _a.sent();
                        return [2 /*return*/, technicals];
                }
            });
        });
    };
    /**
     * Fetches additional SMA periods
     * We need 50 and 200 day SMAs in addition to the 20 day
     */
    TwelveDataAdapter.prototype.fetchAdditionalSMAs = function (symbol, technicals) {
        return __awaiter(this, void 0, void 0, function () {
            var periods, credits, smaPromises, smaResults;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        periods = [50, 200];
                        credits = periods.length * this.CREDIT_COSTS.technicalIndicator;
                        return [4 /*yield*/, this.tokenBucket.waitForTokens(credits)];
                    case 1:
                        _a.sent();
                        smaPromises = periods.map(function (period) { return __awaiter(_this, void 0, void 0, function () {
                            var url, result;
                            var _a, _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        url = new URL("".concat(this.baseUrl, "/sma"));
                                        url.searchParams.append('symbol', symbol);
                                        url.searchParams.append('interval', '1day');
                                        url.searchParams.append('time_period', period.toString());
                                        url.searchParams.append('apikey', this.apiKey);
                                        return [4 /*yield*/, this.makeRequest(url.toString())];
                                    case 1:
                                        result = _c.sent();
                                        return [2 /*return*/, { period: period, value: ((_b = (_a = result.values) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.sma) || 0 }];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.all(smaPromises)];
                    case 2:
                        smaResults = _a.sent();
                        smaResults.forEach(function (_a) {
                            var period = _a.period, value = _a.value;
                            if (period === 50)
                                technicals.sma50 = (0, typeGuards_1.safeParseFloat)(value);
                            if (period === 200)
                                technicals.sma200 = (0, typeGuards_1.safeParseFloat)(value);
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extracts key financial metrics from statistics data
     * Transforms TwelveData's statistics response into our standardized format
     */
    TwelveDataAdapter.prototype.extractKeyMetrics = function (data) {
        var _a;
        // Handle the actual statistics API response format
        var stats = (data === null || data === void 0 ? void 0 : data.statistics) || data;
        var valuations = (stats === null || stats === void 0 ? void 0 : stats.valuations_metrics) || {};
        var financials = (stats === null || stats === void 0 ? void 0 : stats.financials) || {};
        var balanceSheet = (financials === null || financials === void 0 ? void 0 : financials.balance_sheet) || {};
        var incomeStatement = (financials === null || financials === void 0 ? void 0 : financials.income_statement) || {};
        return {
            marketCap: (0, typeGuards_1.safeParseFloat)(valuations.market_capitalization) || 0,
            peRatio: (0, typeGuards_1.safeParseFloat)(valuations.trailing_pe) || 0,
            pegRatio: (0, typeGuards_1.safeParseFloat)(valuations.peg_ratio) || 0,
            priceToBook: (0, typeGuards_1.safeParseFloat)(valuations.price_to_book_mrq) || (0, typeGuards_1.safeParseFloat)(valuations.price_to_book) || 0,
            dividendYield: (0, typeGuards_1.safeParseFloat)((_a = stats === null || stats === void 0 ? void 0 : stats.dividends_and_splits) === null || _a === void 0 ? void 0 : _a.trailing_annual_dividend_yield) || 0,
            roe: (0, typeGuards_1.safeParseFloat)(financials.return_on_equity_ttm) || 0,
            currentRatio: (0, typeGuards_1.safeParseFloat)(balanceSheet.current_ratio_mrq) || 0,
            debtToEquity: (0, typeGuards_1.safeParseFloat)(balanceSheet.total_debt_to_equity_mrq) || 0
        };
    };
    /**
     * Returns default key metrics when data is unavailable
     */
    TwelveDataAdapter.prototype.getDefaultKeyMetrics = function () {
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
    /**
     * Converts numeric score to rating category
     */
    TwelveDataAdapter.prototype.scoreToRating = function (score) {
        if (score >= 4.5)
            return 'strongBuy';
        if (score >= 3.5)
            return 'buy';
        if (score >= 2.5)
            return 'hold';
        if (score >= 1.5)
            return 'sell';
        return 'strongSell';
    };
    /**
     * Calculates volume trend based on current vs average
     */
    TwelveDataAdapter.prototype.calculateVolumeTrend = function (current, average) {
        var ratio = current / average;
        if (ratio > 1.2)
            return 'increasing';
        if (ratio < 0.8)
            return 'decreasing';
        return 'stable';
    };
    /**
     * Gets information about current API usage
     * Useful for monitoring and debugging rate limit issues
     */
    TwelveDataAdapter.prototype.getApiUsageInfo = function () {
        return {
            availableCredits: this.tokenBucket.getAvailableTokens(),
            creditsPerMinute: this.isUltraTier ? 10946 : 60,
            isUltraTier: this.isUltraTier
        };
    };
    /**
     * Validates that we can make a request with given credit cost
     * Useful for pre-flight checks before expensive operations
     */
    TwelveDataAdapter.prototype.canMakeRequest = function (creditCost) {
        return this.tokenBucket.getAvailableTokens() >= creditCost;
    };
    /**
     * Fetches earnings data including historical and upcoming earnings
     * This provides crucial quarterly performance data
     */
    TwelveDataAdapter.prototype.getEarnings = function (symbol) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var url, data, historical, upcoming, error_5, fundamentals;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.tokenBucket.waitForTokens(this.CREDIT_COSTS.fundamentals)];
                    case 1:
                        _b.sent();
                        url = new URL("".concat(this.baseUrl, "/earnings"));
                        url.searchParams.append('symbol', symbol);
                        url.searchParams.append('apikey', this.apiKey);
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.makeRequest(url.toString())];
                    case 3:
                        data = _b.sent();
                        historical = (data.earnings_announcements || []).map(function (e) { return ({
                            date: e.date,
                            fiscalQuarter: e.fiscal_quarter,
                            fiscalYear: parseInt(e.fiscal_year),
                            epsEstimate: (0, typeGuards_1.safeParseFloat)(e.eps_estimate),
                            epsActual: (0, typeGuards_1.safeParseFloat)(e.eps_actual),
                            epsSurprise: (0, typeGuards_1.safeParseFloat)(e.eps_actual) - (0, typeGuards_1.safeParseFloat)(e.eps_estimate),
                            revenueEstimate: (0, typeGuards_1.safeParseFloat)(e.revenue_estimate),
                            revenueActual: (0, typeGuards_1.safeParseFloat)(e.revenue_actual),
                            revenueSurprise: (0, typeGuards_1.safeParseFloat)(e.revenue_actual) - (0, typeGuards_1.safeParseFloat)(e.revenue_estimate)
                        }); });
                        upcoming = (data.earnings_calendar || []).map(function (e) { return ({
                            date: e.date,
                            fiscalQuarter: e.fiscal_quarter,
                            fiscalYear: parseInt(e.fiscal_year),
                            epsEstimate: (0, typeGuards_1.safeParseFloat)(e.eps_estimate),
                            revenueEstimate: (0, typeGuards_1.safeParseFloat)(e.revenue_estimate)
                        }); });
                        return [2 /*return*/, {
                                historical: historical.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); }),
                                upcoming: upcoming.sort(function (a, b) { return new Date(a.date).getTime() - new Date(b.date).getTime(); }),
                                nextEarningsDate: ((_a = upcoming[0]) === null || _a === void 0 ? void 0 : _a.date) || null,
                                averageSurprise: this.calculateAverageSurprise(historical)
                            }];
                    case 4:
                        error_5 = _b.sent();
                        // Fallback to extracting from fundamentals if earnings endpoint fails
                        console.warn('[TwelveData] Earnings endpoint failed, falling back to fundamentals');
                        return [4 /*yield*/, this.getFundamentals(symbol)];
                    case 5:
                        fundamentals = _b.sent();
                        return [2 /*return*/, this.extractEarningsFromFundamentals(fundamentals)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Alias for getFundamentals to match expected interface
     * Returns complete financial statements data
     */
    TwelveDataAdapter.prototype.getFinancials = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.getFundamentals(symbol)];
            });
        });
    };
    /**
     * Initializes storage caching with proper expiration
     */
    TwelveDataAdapter.prototype.initializeLocalStorageCache = function () {
        // Clean up expired cache entries on initialization
        try {
            var keys = storageAdapter_1.storageAdapter.keys();
            var now_1 = Date.now();
            keys.forEach(function (key) {
                if (key.startsWith('trisight_td_')) {
                    try {
                        var cached = JSON.parse(storageAdapter_1.storageAdapter.getItem(key) || '{}');
                        if (cached.expires && cached.expires < now_1) {
                            storageAdapter_1.storageAdapter.removeItem(key);
                        }
                    }
                    catch (e) {
                        // Remove corrupted entries
                        storageAdapter_1.storageAdapter.removeItem(key);
                    }
                }
            });
        }
        catch (error) {
            console.warn('[TwelveData] storage cleanup failed:', error);
        }
    };
    /**
     * Enhanced caching method that uses storage adapter for persistence
     */
    TwelveDataAdapter.prototype.createCachedMethod = function (method, keyPrefix, ttlMs) {
        var _this = this;
        var originalMethod = method.bind(this);
        return (function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return __awaiter(_this, void 0, void 0, function () {
                var cacheKey, cached, parsedCache, result, cacheData;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            cacheKey = "trisight_td_".concat(keyPrefix, "_").concat(JSON.stringify(args));
                            // Check storage first
                            try {
                                cached = storageAdapter_1.storageAdapter.getItem(cacheKey);
                                if (cached) {
                                    parsedCache = JSON.parse(cached);
                                    if (parsedCache.expires > Date.now()) {
                                        if (this.debugMode) {
                                            console.log("[TwelveData] Cache hit for ".concat(keyPrefix));
                                        }
                                        return [2 /*return*/, parsedCache.data];
                                    }
                                }
                            }
                            catch (error) {
                                console.warn('[TwelveData] Cache read error:', error);
                            }
                            return [4 /*yield*/, originalMethod.apply(void 0, args)];
                        case 1:
                            result = _a.sent();
                            // Store in storage with expiration
                            try {
                                cacheData = {
                                    data: result,
                                    expires: Date.now() + (ttlMs || 300000) // Default 5 min
                                };
                                storageAdapter_1.storageAdapter.setItem(cacheKey, JSON.stringify(cacheData));
                            }
                            catch (error) {
                                // Handle quota exceeded or other storage errors
                                console.warn('[TwelveData] Cache write error:', error);
                                // Try to clear old entries and retry
                                this.clearOldCacheEntries();
                            }
                            return [2 /*return*/, result];
                    }
                });
            });
        });
    };
    /**
     * Clears old cache entries when storage is full
     */
    TwelveDataAdapter.prototype.clearOldCacheEntries = function () {
        try {
            var entries_1 = [];
            var keys = storageAdapter_1.storageAdapter.keys();
            keys.forEach(function (key) {
                if (key.startsWith('trisight_td_')) {
                    try {
                        var cached = JSON.parse(storageAdapter_1.storageAdapter.getItem(key) || '{}');
                        if (cached.expires) {
                            entries_1.push({ key: key, expires: cached.expires });
                        }
                    }
                    catch (e) {
                        storageAdapter_1.storageAdapter.removeItem(key);
                    }
                }
            });
            // Sort by expiration and remove oldest 25%
            entries_1.sort(function (a, b) { return a.expires - b.expires; });
            var toRemove = Math.ceil(entries_1.length * 0.25);
            for (var i = 0; i < toRemove; i++) {
                storageAdapter_1.storageAdapter.removeItem(entries_1[i].key);
            }
        }
        catch (error) {
            console.error('[TwelveData] Failed to clear cache:', error);
        }
    };
    /**
     * Calculates average earnings surprise from historical data
     */
    TwelveDataAdapter.prototype.calculateAverageSurprise = function (historical) {
        if (historical.length === 0)
            return 0;
        var surprises = historical
            .filter(function (h) { return h.epsSurprise !== undefined && !isNaN(h.epsSurprise); })
            .map(function (h) { return h.epsSurprise; });
        if (surprises.length === 0)
            return 0;
        var avgSurprise = surprises.reduce(function (sum, s) { return sum + s; }, 0) / surprises.length;
        return parseFloat(avgSurprise.toFixed(4));
    };
    /**
     * Extracts earnings data from fundamentals as fallback
     */
    TwelveDataAdapter.prototype.extractEarningsFromFundamentals = function (fundamentals) {
        var _this = this;
        var incomeStatements = fundamentals.incomeStatement || [];
        // Extract quarterly earnings from income statements
        var quarterlyStatements = incomeStatements.filter(function (s) { return s.period === 'quarterly'; });
        var historical = quarterlyStatements.slice(0, 8).map(function (statement) { return ({
            date: statement.date,
            fiscalQuarter: _this.extractQuarter(statement.date),
            fiscalYear: new Date(statement.date).getFullYear(),
            epsActual: statement.eps || 0,
            epsEstimate: 0,
            epsSurprise: 0,
            revenueActual: statement.revenue || 0,
            revenueEstimate: 0,
            revenueSurprise: 0
        }); });
        return {
            historical: historical,
            upcoming: [],
            nextEarningsDate: null,
            averageSurprise: 0
        };
    };
    /**
     * Extracts quarter from date string
     */
    TwelveDataAdapter.prototype.extractQuarter = function (dateStr) {
        var date = new Date(dateStr);
        var month = date.getMonth();
        var quarter = Math.floor(month / 3) + 1;
        return "Q".concat(quarter);
    };
    return TwelveDataAdapter;
}(baseAdapter_1.BaseAdapter));
exports.TwelveDataAdapter = TwelveDataAdapter;
