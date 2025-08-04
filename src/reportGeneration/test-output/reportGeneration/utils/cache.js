"use strict";
// src/reportGeneration/utils/cache.ts
// Compatibility wrapper for dataCache.ts
// Context: Maintains backward compatibility while using enhanced caching system
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
exports.__esModule = true;
exports["default"] = exports.withCache = exports.memoizeAsync = exports.DataCache = exports.MemoryCache = void 0;
var dataCache_1 = require("./dataCache");
__createBinding(exports, dataCache_1, "DataCache", "MemoryCache");
__createBinding(exports, dataCache_1, "DataCache");
__createBinding(exports, dataCache_1, "memoizeAsync");
__createBinding(exports, dataCache_1, "memoizeAsync", "withCache");
// Re-export with original function signature for backward compatibility
var dataCache_2 = require("./dataCache");
__createBinding(exports, dataCache_2, "DataCache", "default");
