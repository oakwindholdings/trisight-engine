"use strict";
// src/reportGeneration/utils/errorHandler.ts
// Intelligent error handling with categorization and retry strategies
// Context: Ensures data fetching resilience against transient failures
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
exports.wrapDataFetchError = exports.withRetry = exports.calculateBackoffDelay = exports.isRetryable = exports.categorizeError = exports.DEFAULT_RETRY_CONFIG = exports.RetryableError = exports.ErrorCategory = void 0;
/**
 * Categories of errors that determine retry behavior
 * Network and timeout errors are typically transient and worth retrying
 * Auth and parsing errors indicate configuration issues that won't resolve with retries
 */
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["TIMEOUT"] = "TIMEOUT";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["AUTH"] = "AUTH";
    ErrorCategory["PARSING"] = "PARSING";
    ErrorCategory["UNKNOWN"] = "UNKNOWN";
})(ErrorCategory = exports.ErrorCategory || (exports.ErrorCategory = {}));
/**
 * Custom error class that includes retry information
 * This helps the system make intelligent decisions about error recovery
 */
var RetryableError = /** @class */ (function (_super) {
    __extends(RetryableError, _super);
    function RetryableError(message, category, retryable, originalError) {
        var _this = _super.call(this, message) || this;
        _this.category = category;
        _this.retryable = retryable;
        _this.originalError = originalError;
        _this.name = 'RetryableError';
        return _this;
    }
    return RetryableError;
}(Error));
exports.RetryableError = RetryableError;
exports.DEFAULT_RETRY_CONFIG = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 32000,
    backoffMultiplier: 2
};
/**
 * Categorizes errors to determine if they should be retried
 * This function embodies our knowledge about common API failure modes
 */
function categorizeError(error) {
    var message = error.message.toLowerCase();
    var name = error.name.toLowerCase();
    // Network-related errors that are typically transient
    if (message.includes('network') ||
        message.includes('fetch failed') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('econnreset') ||
        name.includes('fetcherror')) {
        return ErrorCategory.NETWORK;
    }
    // Timeout errors that might succeed with more time
    if (message.includes('timeout') ||
        message.includes('timedout') ||
        message.includes('request timeout')) {
        return ErrorCategory.TIMEOUT;
    }
    // Rate limiting requires backing off
    if (message.includes('rate limit') ||
        message.includes('429') ||
        message.includes('too many requests')) {
        return ErrorCategory.RATE_LIMIT;
    }
    // Authentication failures won't resolve with retries
    if (message.includes('unauthorized') ||
        message.includes('401') ||
        message.includes('forbidden') ||
        message.includes('403') ||
        message.includes('invalid api key')) {
        return ErrorCategory.AUTH;
    }
    // Data parsing errors indicate unexpected response format
    if (message.includes('parsing') ||
        message.includes('invalid json') ||
        message.includes('unexpected token') ||
        name.includes('syntaxerror')) {
        return ErrorCategory.PARSING;
    }
    return ErrorCategory.UNKNOWN;
}
exports.categorizeError = categorizeError;
/**
 * Determines if an error should be retried based on its category
 * This encodes our retry policy across the system
 */
function isRetryable(category) {
    return [
        ErrorCategory.NETWORK,
        ErrorCategory.TIMEOUT,
        ErrorCategory.RATE_LIMIT
    ].includes(category);
}
exports.isRetryable = isRetryable;
/**
 * Calculates delay before next retry attempt using exponential backoff
 * This prevents overwhelming APIs while recovering as quickly as possible
 */
function calculateBackoffDelay(attempt, config) {
    var exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
    var jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5); // Add jitter to prevent thundering herd
    return Math.min(jitteredDelay, config.maxDelayMs);
}
exports.calculateBackoffDelay = calculateBackoffDelay;
/**
 * Executes a function with automatic retry logic
 * This is the main utility that other parts of the system will use
 */
function withRetry(fn, config, onRetry) {
    if (config === void 0) { config = exports.DEFAULT_RETRY_CONFIG; }
    return __awaiter(this, void 0, void 0, function () {
        var lastError, _loop_1, attempt, state_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lastError = null;
                    _loop_1 = function (attempt) {
                        var _b, error_1, category, delayMs_1;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    _c.trys.push([0, 2, , 4]);
                                    _b = {};
                                    return [4 /*yield*/, fn()];
                                case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                case 2:
                                    error_1 = _c.sent();
                                    lastError = error_1;
                                    category = categorizeError(lastError);
                                    // Don't retry if this error type isn't retryable or we're out of attempts
                                    if (!isRetryable(category) || attempt === config.maxAttempts) {
                                        throw new RetryableError("Failed after ".concat(attempt, " attempts: ").concat(lastError.message), category, false, lastError);
                                    }
                                    delayMs_1 = calculateBackoffDelay(attempt, config);
                                    if (onRetry) {
                                        onRetry(attempt, lastError, delayMs_1);
                                    }
                                    // Wait before retrying
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delayMs_1); })];
                                case 3:
                                    // Wait before retrying
                                    _c.sent();
                                    return [3 /*break*/, 4];
                                case 4: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 1;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= config.maxAttempts)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: 
                // This should never be reached due to the logic above, but TypeScript needs it
                throw lastError;
            }
        });
    });
}
exports.withRetry = withRetry;
/**
 * Wraps an error with additional context about data fetching
 * This helps with debugging when errors bubble up through multiple layers
 */
function wrapDataFetchError(error, context) {
    var category = categorizeError(error);
    var message = "".concat(context.source, " ").concat(context.operation, " failed").concat(context.ticker ? " for ".concat(context.ticker) : '', ": ").concat(error.message);
    return new RetryableError(message, category, isRetryable(category), error);
}
exports.wrapDataFetchError = wrapDataFetchError;
