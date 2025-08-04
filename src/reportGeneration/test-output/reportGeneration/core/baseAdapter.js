"use strict";
// src/reportGeneration/core/baseAdapter.ts
// Abstract base class providing common functionality for all data adapters
// Context: Ensures consistent behavior across all external data sources
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
exports.BaseAdapter = void 0;
var errorHandler_1 = require("../utils/errorHandler");
var cache_1 = require("../utils/cache");
/**
 * Abstract base class for all data source adapters
 * Provides common functionality like retries, caching, and rate limiting
 */
var BaseAdapter = /** @class */ (function () {
    function BaseAdapter(adapterName, options) {
        if (options === void 0) { options = {}; }
        this.adapterName = adapterName;
        this.requestTimestamps = [];
        this.cache = options.cache || new cache_1.DataCache({});
        this.debugMode = options.debugMode || false;
        // Set up default request configuration
        this.requestConfig = __assign({ timeout: 30000, headers: {
                'User-Agent': 'TriSight-ReportGenerator/1.0',
                'Accept': 'application/json'
            }, retryConfig: errorHandler_1.DEFAULT_RETRY_CONFIG }, options.requestConfig);
        this.rateLimitConfig = options.rateLimitConfig;
    }
    /**
     * Makes an HTTP request with built-in retry logic and error handling
     * This is the core method that all adapters will use for external calls
     */
    BaseAdapter.prototype.makeRequest = function (url, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var controller, timeoutId, finalOptions_1, response, contentType, data, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Check rate limits before making request
                    return [4 /*yield*/, this.checkRateLimit()];
                    case 1:
                        // Check rate limits before making request
                        _a.sent();
                        controller = new AbortController();
                        timeoutId = setTimeout(function () { return controller.abort(); }, this.requestConfig.timeout);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 9, 10, 11]);
                        finalOptions_1 = __assign(__assign({}, options), { headers: __assign(__assign({}, this.requestConfig.headers), options.headers), signal: controller.signal });
                        // Log request in debug mode
                        if (this.debugMode) {
                            console.log("[".concat(this.adapterName, "] Making request to:"), url);
                        }
                        return [4 /*yield*/, (0, errorHandler_1.withRetry)(function () { return __awaiter(_this, void 0, void 0, function () {
                                var res, errorText;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, fetch(url, finalOptions_1)];
                                        case 1:
                                            res = _a.sent();
                                            if (!!res.ok) return [3 /*break*/, 3];
                                            return [4 /*yield*/, res.text()["catch"](function () { return 'No error details'; })];
                                        case 2:
                                            errorText = _a.sent();
                                            throw new Error("HTTP ".concat(res.status, ": ").concat(res.statusText, ". Details: ").concat(errorText));
                                        case 3: return [2 /*return*/, res];
                                    }
                                });
                            }); }, this.requestConfig.retryConfig, function (attempt, error, delayMs) {
                                if (_this.debugMode) {
                                    console.log("[".concat(_this.adapterName, "] Retry attempt ").concat(attempt, " after error:"), error.message, "Waiting ".concat(delayMs, "ms..."));
                                }
                            })];
                    case 3:
                        response = _a.sent();
                        contentType = response.headers.get('content-type') || '';
                        data = void 0;
                        if (!contentType.includes('application/json')) return [3 /*break*/, 5];
                        return [4 /*yield*/, response.json()];
                    case 4:
                        data = _a.sent();
                        return [3 /*break*/, 8];
                    case 5:
                        if (!contentType.includes('text/')) return [3 /*break*/, 7];
                        return [4 /*yield*/, response.text()];
                    case 6:
                        data = (_a.sent());
                        return [3 /*break*/, 8];
                    case 7: throw new Error("Unsupported content type: ".concat(contentType));
                    case 8:
                        // Record successful request timestamp for rate limiting
                        this.recordRequestTimestamp();
                        return [2 /*return*/, data];
                    case 9:
                        error_1 = _a.sent();
                        // Wrap error with context for better debugging
                        throw (0, errorHandler_1.wrapDataFetchError)(error_1, {
                            source: this.adapterName,
                            operation: 'fetch',
                            ticker: this.extractTickerFromUrl(url)
                        });
                    case 10:
                        clearTimeout(timeoutId);
                        return [7 /*endfinally*/];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Checks rate limits and waits if necessary
     * This prevents hitting API rate limits which can result in bans
     */
    BaseAdapter.prototype.checkRateLimit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, windowStart, oldestTimestamp, waitTime_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.rateLimitConfig)
                            return [2 /*return*/];
                        now = Date.now();
                        windowStart = now - 60000;
                        // Clean up old timestamps
                        this.requestTimestamps = this.requestTimestamps.filter(function (timestamp) { return timestamp > windowStart; });
                        if (!(this.requestTimestamps.length >= this.rateLimitConfig.requestsPerMinute)) return [3 /*break*/, 2];
                        oldestTimestamp = this.requestTimestamps[0];
                        waitTime_1 = oldestTimestamp + 60000 - now;
                        if (!(waitTime_1 > 0)) return [3 /*break*/, 2];
                        if (this.debugMode) {
                            console.log("[".concat(this.adapterName, "] Rate limit reached. Waiting ").concat(waitTime_1, "ms..."));
                        }
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, waitTime_1); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Records timestamp of successful request for rate limiting
     */
    BaseAdapter.prototype.recordRequestTimestamp = function () {
        this.requestTimestamps.push(Date.now());
    };
    /**
     * Extracts ticker from URL for error context
     * Override in subclasses for API-specific URL patterns
     */
    BaseAdapter.prototype.extractTickerFromUrl = function (url) {
        // Basic implementation - subclasses can override for specific patterns
        var tickerMatch = url.match(/symbol=([A-Z]+)/i) ||
            url.match(/ticker=([A-Z]+)/i) ||
            url.match(/\/([A-Z]+)\//i);
        return tickerMatch ? tickerMatch[1] : undefined;
    };
    /**
     * Creates a cached version of an API method
     * This is a convenience method for subclasses
     */
    BaseAdapter.prototype.createCachedMethod = function (method, keyPrefix, ttlMs) {
        return (0, cache_1.memoizeAsync)(method.bind(this), {
            cache: this.cache,
            keyPrefix: "".concat(this.adapterName, ":").concat(keyPrefix),
            ttlMs: ttlMs
        });
    };
    /**
     * Validates that required environment variables are set
     * Subclasses should call this in their constructor
     */
    BaseAdapter.prototype.validateApiKey = function (envVar) {
        var apiKey = process.env[envVar];
        if (!apiKey) {
            throw new Error("".concat(envVar, " environment variable is not set. ") +
                "Please add it to your .env file.");
        }
        return apiKey;
    };
    /**
     * Gets current cache statistics for monitoring
     */
    BaseAdapter.prototype.getCacheStats = function () {
        return __assign({ adapter: this.adapterName }, this.cache.getStats());
    };
    /**
     * Clears the cache for this adapter
     */
    BaseAdapter.prototype.clearCache = function () {
        this.cache.clear();
    };
    return BaseAdapter;
}());
exports.BaseAdapter = BaseAdapter;
