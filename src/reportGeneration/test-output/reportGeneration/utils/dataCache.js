"use strict";
// src/reportGeneration/utils/dataCache.ts
// In-memory cache with TTL support for API response caching
// Context: Reduces API calls and improves development experience
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
exports.memoizeAsync = exports.DataCache = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Time-based cache with LRU/FIFO eviction
 * Designed for financial data that changes at different rates
 */
var DataCache = /** @class */ (function () {
    function DataCache(config) {
        if (config === void 0) { config = {}; }
        this.cache = new Map();
        this.totalMemoryBytes = 0;
        this.config = __assign({ defaultTTLMs: 5 * 60 * 1000, maxSize: 100, maxMemoryMB: 50, enableCompression: false, evictionStrategy: 'LRU' }, config);
    }
    /**
     * Generates a cache key from request parameters
     * This ensures identical requests share the same cache entry
     */
    DataCache.createKey = function (prefix) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        // Handle different parameter types
        var parts = params.map(function (param) {
            if (typeof param === 'object') {
                // Sort object keys for consistent key generation
                var sorted = Object.entries(param)
                    .sort(function (_a, _b) {
                    var a = _a[0];
                    var b = _b[0];
                    return a.localeCompare(b);
                })
                    .map(function (_a) {
                    var key = _a[0], value = _a[1];
                    return "".concat(key, "=").concat(JSON.stringify(value));
                })
                    .join('&');
                return sorted;
            }
            return String(param);
        });
        return "".concat(prefix, ":").concat(parts.join(':'));
    };
    /**
     * Gets data from cache if fresh
     * Returns null if data is stale or missing
     */
    DataCache.prototype.get = function (key, ttlMs) {
        var entry = this.cache.get(key);
        if (!entry) {
            (0, logger_1.logDebug)('DataCache', "Cache miss for key: ".concat(key));
            return null;
        }
        var age = Date.now() - entry.timestamp;
        var ttl = ttlMs || entry.ttl || this.config.defaultTTLMs;
        if (age > ttl) {
            (0, logger_1.logDebug)('DataCache', "Cache expired for key: ".concat(key, " (age: ").concat(age, "ms)"));
            this["delete"](key);
            return null;
        }
        // Update hit count for LRU tracking
        entry.hits++;
        (0, logger_1.logDebug)('DataCache', "Cache hit for key: ".concat(key, " (age: ").concat(age, "ms, hits: ").concat(entry.hits, ")"));
        return entry.value;
    };
    /**
     * Stores data in cache with automatic eviction if needed
     */
    DataCache.prototype.set = function (key, data, ttlMs) {
        var size = this.estimateSize(data);
        // Check memory limit
        var maxMemoryBytes = (this.config.maxMemoryMB || 50) * 1024 * 1024;
        if (this.totalMemoryBytes + size > maxMemoryBytes) {
            this.evictUntilMemoryAvailable(size);
        }
        // Check entry count limit
        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictOne();
        }
        // Remove old entry if updating
        if (this.cache.has(key)) {
            this["delete"](key);
        }
        var entry = {
            value: data,
            timestamp: Date.now(),
            ttl: ttlMs || this.config.defaultTTLMs,
            hits: 0,
            size: size
        };
        this.cache.set(key, entry);
        this.totalMemoryBytes += size;
        (0, logger_1.logDebug)('DataCache', "Cached key: ".concat(key, " (size: ").concat(size, " bytes, ttl: ").concat(entry.ttl, "ms)"));
    };
    /**
     * Checks if a key exists and hasn't expired
     * Useful for conditional fetching logic
     */
    DataCache.prototype.has = function (key) {
        return this.get(key) !== null;
    };
    /**
     * Removes a specific entry from the cache
     * Useful when data is known to be invalidated
     */
    DataCache.prototype["delete"] = function (key) {
        var entry = this.cache.get(key);
        if (entry) {
            this.totalMemoryBytes -= entry.size;
            return this.cache["delete"](key);
        }
        return false;
    };
    /**
     * Invalidates specific cache entries matching a pattern
     * Useful when we know data has changed
     */
    DataCache.prototype.invalidate = function (pattern) {
        var invalidated = 0;
        for (var _i = 0, _a = this.cache.keys(); _i < _a.length; _i++) {
            var key = _a[_i];
            if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
                if (this["delete"](key)) {
                    invalidated++;
                }
            }
        }
        (0, logger_1.logDebug)('DataCache', "Invalidated ".concat(invalidated, " entries matching: ").concat(pattern));
        return invalidated;
    };
    /**
     * Gets cache statistics for monitoring and debugging
     */
    DataCache.prototype.getStats = function () {
        var totalHits = 0;
        var totalAccess = 0;
        var totalAge = 0;
        var oldestTimestamp = Date.now();
        var now = Date.now();
        for (var _i = 0, _a = this.cache.values(); _i < _a.length; _i++) {
            var entry = _a[_i];
            totalAccess += entry.hits + 1; // +1 for initial set
            totalHits += entry.hits;
            totalAge += now - entry.timestamp;
            oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
        }
        return {
            size: this.cache.size,
            totalHits: totalHits,
            hitRate: totalAccess > 0 ? totalHits / totalAccess : 0,
            totalMemoryMB: this.totalMemoryBytes / (1024 * 1024),
            avgAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
            oldestEntry: now - oldestTimestamp
        };
    };
    /**
     * Clears the entire cache
     */
    DataCache.prototype.clear = function () {
        var size = this.cache.size;
        this.cache.clear();
        this.totalMemoryBytes = 0;
        (0, logger_1.logDebug)('DataCache', "Cleared ".concat(size, " cache entries"));
    };
    Object.defineProperty(DataCache.prototype, "size", {
        /**
         * Gets current cache size for monitoring
         */
        get: function () {
            return this.cache.size;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Evicts entries based on configured strategy
     */
    DataCache.prototype.evictOne = function () {
        if (this.config.evictionStrategy === 'FIFO') {
            this.evictOldest();
        }
        else {
            this.evictLRU();
        }
    };
    /**
     * Evicts oldest entry (FIFO strategy)
     */
    DataCache.prototype.evictOldest = function () {
        var oldestKey = null;
        var oldestTime = Infinity;
        for (var _i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            this["delete"](oldestKey);
            (0, logger_1.logDebug)('DataCache', "Evicted oldest entry: ".concat(oldestKey));
        }
    };
    /**
     * Evicts least recently used entry (LRU strategy)
     */
    DataCache.prototype.evictLRU = function () {
        var lruKey = null;
        var minScore = Infinity;
        for (var _i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            var age = Date.now() - entry.timestamp;
            // Score combines hit count and age - lower score = less useful
            var score = entry.hits * 1000 - age; // Favor frequently accessed, recent entries
            if (score < minScore) {
                minScore = score;
                lruKey = key;
            }
        }
        if (lruKey) {
            this["delete"](lruKey);
            (0, logger_1.logDebug)('DataCache', "Evicted LRU entry: ".concat(lruKey));
        }
    };
    /**
     * Evicts entries until enough memory is available
     */
    DataCache.prototype.evictUntilMemoryAvailable = function (requiredBytes) {
        var maxMemoryBytes = (this.config.maxMemoryMB || 50) * 1024 * 1024;
        while (this.totalMemoryBytes + requiredBytes > maxMemoryBytes && this.cache.size > 0) {
            this.evictOne();
        }
    };
    /**
     * Estimates the memory size of data
     * Used for cache size management
     */
    DataCache.prototype.estimateSize = function (data) {
        try {
            return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
        }
        catch (_a) {
            return 1000; // Default estimate for non-serializable data
        }
    };
    return DataCache;
}());
exports.DataCache = DataCache;
/**
 * Creates a memoized version of an async function with caching
 * This is a higher-order function that adds caching to any API call
 */
function memoizeAsync(fn, options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var cache = options.cache || new DataCache();
    var keyGen = options.keyGenerator || (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        var prefix = options.keyPrefix || fn.name || 'memoized';
        return DataCache.createKey.apply(DataCache, __spreadArray([prefix], args, false));
    });
    return (function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return __awaiter(_this, void 0, void 0, function () {
            var key, cached, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = keyGen.apply(void 0, args);
                        cached = cache.get(key, options.ttlMs);
                        if (cached !== null) {
                            return [2 /*return*/, cached];
                        }
                        return [4 /*yield*/, fn.apply(void 0, args)];
                    case 1:
                        result = _a.sent();
                        cache.set(key, result, options.ttlMs);
                        return [2 /*return*/, result];
                }
            });
        });
    });
}
exports.memoizeAsync = memoizeAsync;
