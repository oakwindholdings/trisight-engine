"use strict";
// src/reportGeneration/utils/typeGuards.ts
// Type guards for validating API responses at runtime
// Context: Ensures data integrity when processing external API responses
exports.__esModule = true;
exports.cleanObject = exports.isAuthError = exports.isRateLimitError = exports.extractErrorMessage = exports.isValidIndicatorResponse = exports.isValidTimeSeriesResponse = exports.isValidQuoteResponse = exports.safeGet = exports.validateArray = exports.isValidAnalystRating = exports.isValidPriceData = exports.isValidFinancialStatement = exports.hasRequiredProperties = exports.isValidDateString = exports.safeParseInt = exports.safeParseFloat = exports.isValidNumber = void 0;
/**
 * Validates that a value is a valid number
 * Handles string numbers from APIs and filters out invalid values
 */
function isValidNumber(value) {
    if (typeof value === 'number') {
        return !isNaN(value) && isFinite(value);
    }
    if (typeof value === 'string') {
        var parsed = parseFloat(value);
        return !isNaN(parsed) && isFinite(parsed);
    }
    return false;
}
exports.isValidNumber = isValidNumber;
/**
 * Safely parses a numeric value from API response
 * Returns default value if parsing fails
 */
function safeParseFloat(value, defaultValue) {
    if (defaultValue === void 0) { defaultValue = 0; }
    if (isValidNumber(value)) {
        return typeof value === 'number' ? value : parseFloat(value);
    }
    return defaultValue;
}
exports.safeParseFloat = safeParseFloat;
/**
 * Safely parses an integer value from API response
 * Returns default value if parsing fails
 */
function safeParseInt(value, defaultValue) {
    if (defaultValue === void 0) { defaultValue = 0; }
    if (isValidNumber(value)) {
        return typeof value === 'number' ? Math.floor(value) : parseInt(value);
    }
    return defaultValue;
}
exports.safeParseInt = safeParseInt;
/**
 * Validates date string format
 * Ensures dates are in expected format before processing
 */
function isValidDateString(value) {
    if (typeof value !== 'string')
        return false;
    var date = new Date(value);
    return !isNaN(date.getTime());
}
exports.isValidDateString = isValidDateString;
/**
 * Validates that an object has required properties
 * Useful for checking API response structure
 */
function hasRequiredProperties(obj, properties) {
    if (!obj || typeof obj !== 'object')
        return false;
    return properties.every(function (prop) { return prop in obj; });
}
exports.hasRequiredProperties = hasRequiredProperties;
/**
 * Type guard for financial statement data
 */
function isValidFinancialStatement(data) {
    return (hasRequiredProperties(data, ['date']) &&
        isValidDateString(data.date) &&
        (isValidNumber(data.revenue) || data.revenue === undefined) &&
        (isValidNumber(data.netIncome) || data.netIncome === undefined) &&
        (isValidNumber(data.eps) || data.eps === undefined));
}
exports.isValidFinancialStatement = isValidFinancialStatement;
/**
 * Type guard for price data (OHLCV)
 */
function isValidPriceData(data) {
    return (hasRequiredProperties(data, ['datetime', 'open', 'high', 'low', 'close', 'volume']) &&
        isValidDateString(data.datetime) &&
        isValidNumber(data.open) &&
        isValidNumber(data.high) &&
        isValidNumber(data.low) &&
        isValidNumber(data.close) &&
        isValidNumber(data.volume));
}
exports.isValidPriceData = isValidPriceData;
/**
 * Type guard for analyst rating data
 */
function isValidAnalystRating(data) {
    return (hasRequiredProperties(data, ['date', 'firm', 'rating']) &&
        isValidDateString(data.date) &&
        typeof data.firm === 'string' &&
        typeof data.rating === 'string');
}
exports.isValidAnalystRating = isValidAnalystRating;
/**
 * Validates array of items with a type guard
 * Filters out invalid items and returns typed array
 */
function validateArray(items, validator) {
    if (!Array.isArray(items))
        return [];
    return items.filter(validator);
}
exports.validateArray = validateArray;
/**
 * Safely extracts nested property from object
 * Returns undefined if path doesn't exist
 */
function safeGet(obj, path, defaultValue) {
    var keys = path.split('.');
    var result = obj;
    for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
        var key = keys_1[_i];
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        }
        else {
            return defaultValue;
        }
    }
    return result;
}
exports.safeGet = safeGet;
/**
 * Type guard for TwelveData quote response
 */
function isValidQuoteResponse(data) {
    return (hasRequiredProperties(data, ['symbol', 'close', 'volume']) &&
        typeof data.symbol === 'string' &&
        isValidNumber(data.close) &&
        isValidNumber(data.volume));
}
exports.isValidQuoteResponse = isValidQuoteResponse;
/**
 * Type guard for TwelveData time series response
 */
function isValidTimeSeriesResponse(data) {
    return (hasRequiredProperties(data, ['meta', 'values']) &&
        data.meta &&
        typeof data.meta === 'object' &&
        Array.isArray(data.values) &&
        data.values.every(isValidPriceData));
}
exports.isValidTimeSeriesResponse = isValidTimeSeriesResponse;
/**
 * Type guard for technical indicator response
 */
function isValidIndicatorResponse(data) {
    return (hasRequiredProperties(data, ['meta', 'values']) &&
        data.meta &&
        typeof data.meta === 'object' &&
        Array.isArray(data.values) &&
        data.values.length > 0);
}
exports.isValidIndicatorResponse = isValidIndicatorResponse;
/**
 * Validates and transforms error response
 * Extracts meaningful error message from various formats
 */
function extractErrorMessage(error) {
    var _a, _b, _c, _d, _e, _f;
    if (typeof error === 'string')
        return error;
    if (error === null || error === void 0 ? void 0 : error.message)
        return error.message;
    if ((_a = error === null || error === void 0 ? void 0 : error.error) === null || _a === void 0 ? void 0 : _a.message)
        return error.error.message;
    if ((_c = (_b = error === null || error === void 0 ? void 0 : error.errors) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message)
        return error.errors[0].message;
    if ((_e = (_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.message)
        return error.response.data.message;
    if ((_f = error === null || error === void 0 ? void 0 : error.response) === null || _f === void 0 ? void 0 : _f.statusText)
        return error.response.statusText;
    return 'Unknown error occurred';
}
exports.extractErrorMessage = extractErrorMessage;
/**
 * Type guard for rate limit error
 */
function isRateLimitError(error) {
    var _a;
    var message = extractErrorMessage(error).toLowerCase();
    return (message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429') ||
        (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 429) ||
        ((error === null || error === void 0 ? void 0 : error.status) === 429));
}
exports.isRateLimitError = isRateLimitError;
/**
 * Type guard for authentication error
 */
function isAuthError(error) {
    var _a, _b;
    var message = extractErrorMessage(error).toLowerCase();
    return (message.includes('unauthorized') ||
        message.includes('invalid api key') ||
        message.includes('401') ||
        message.includes('403') ||
        (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) ||
        (((_b = error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status) === 403) ||
        ((error === null || error === void 0 ? void 0 : error.status) === 401) ||
        ((error === null || error === void 0 ? void 0 : error.status) === 403));
}
exports.isAuthError = isAuthError;
/**
 * Validates and cleans object by removing invalid values
 * Useful for cleaning API responses before storage
 */
function cleanObject(obj, options) {
    if (options === void 0) { options = {}; }
    var _a = options.removeNull, removeNull = _a === void 0 ? true : _a, _b = options.removeUndefined, removeUndefined = _b === void 0 ? true : _b, _c = options.removeEmpty, removeEmpty = _c === void 0 ? false : _c;
    var cleaned = {};
    for (var _i = 0, _d = Object.entries(obj); _i < _d.length; _i++) {
        var _e = _d[_i], key = _e[0], value = _e[1];
        if (removeNull && value === null)
            continue;
        if (removeUndefined && value === undefined)
            continue;
        if (removeEmpty && value === '')
            continue;
        cleaned[key] = value;
    }
    return cleaned;
}
exports.cleanObject = cleanObject;
