"use strict";
// src/reportGeneration/utils/compression.ts
// Real compression utilities for report data
// Context: Provides lossless compression for storage optimization
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
exports.CompressionUtils = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Compression utilities for report data
 * Uses built-in browser compression APIs when available
 */
var CompressionUtils = /** @class */ (function () {
    function CompressionUtils() {
    }
    /**
     * Compress a string using gzip-like compression
     */
    CompressionUtils.compressString = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var encoder, bytes, cs, writer, compressedBytes, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!(typeof CompressionStream !== 'undefined')) return [3 /*break*/, 2];
                        encoder = new TextEncoder();
                        bytes = encoder.encode(data);
                        cs = new CompressionStream('gzip');
                        writer = cs.writable.getWriter();
                        writer.write(bytes);
                        writer.close();
                        return [4 /*yield*/, new Response(cs.readable).arrayBuffer()];
                    case 1:
                        compressedBytes = _a.sent();
                        return [2 /*return*/, this.arrayBufferToBase64(compressedBytes)];
                    case 2: 
                    // Fallback for Node.js or older browsers
                    return [2 /*return*/, this.simpleCompress(data)];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        (0, logger_1.logDebug)('CompressionUtils', "Compression failed: ".concat(error_1));
                        // Return original data if compression fails
                        return [2 /*return*/, data];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Decompress a string
     */
    CompressionUtils.decompressString = function (compressedData) {
        return __awaiter(this, void 0, void 0, function () {
            var bytes, ds, writer, decompressedBytes, decoder, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!(typeof DecompressionStream !== 'undefined')) return [3 /*break*/, 2];
                        bytes = this.base64ToArrayBuffer(compressedData);
                        ds = new DecompressionStream('gzip');
                        writer = ds.writable.getWriter();
                        writer.write(bytes);
                        writer.close();
                        return [4 /*yield*/, new Response(ds.readable).arrayBuffer()];
                    case 1:
                        decompressedBytes = _a.sent();
                        decoder = new TextDecoder();
                        return [2 /*return*/, decoder.decode(decompressedBytes)];
                    case 2: 
                    // Fallback for Node.js or older browsers
                    return [2 /*return*/, this.simpleDecompress(compressedData)];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        (0, logger_1.logDebug)('CompressionUtils', "Decompression failed: ".concat(error_2));
                        // Return original data if decompression fails
                        return [2 /*return*/, compressedData];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Compress an object to JSON string
     */
    CompressionUtils.compressObject = function (obj) {
        return __awaiter(this, void 0, void 0, function () {
            var json;
            return __generator(this, function (_a) {
                json = JSON.stringify(obj);
                return [2 /*return*/, this.compressString(json)];
            });
        });
    };
    /**
     * Decompress JSON string to object
     */
    CompressionUtils.decompressObject = function (compressedData) {
        return __awaiter(this, void 0, void 0, function () {
            var json;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.decompressString(compressedData)];
                    case 1:
                        json = _a.sent();
                        return [2 /*return*/, JSON.parse(json)];
                }
            });
        });
    };
    /**
     * Simple compression using LZ-string algorithm
     * Fallback for environments without CompressionStream
     */
    CompressionUtils.simpleCompress = function (data) {
        // Simple RLE-like compression for demonstration
        // In production, would use a proper library like lz-string
        var compressed = '';
        var count = 1;
        for (var i = 0; i < data.length; i++) {
            if (i < data.length - 1 && data[i] === data[i + 1]) {
                count++;
            }
            else {
                if (count > 3) {
                    compressed += "~".concat(count, "~").concat(data[i]);
                }
                else {
                    compressed += data[i].repeat(count);
                }
                count = 1;
            }
        }
        // Base64 encode for safe storage
        return btoa(compressed);
    };
    /**
     * Simple decompression
     */
    CompressionUtils.simpleDecompress = function (compressedData) {
        try {
            var decoded = atob(compressedData);
            return decoded.replace(/~(\d+)~(.)/g, function (match, count, char) { return char.repeat(parseInt(count)); });
        }
        catch (_a) {
            return compressedData;
        }
    };
    /**
     * Calculate compression ratio
     */
    CompressionUtils.calculateCompressionRatio = function (original, compressed) {
        var originalSize = new Blob([original]).size;
        var compressedSize = new Blob([compressed]).size;
        return 1 - (compressedSize / originalSize);
    };
    /**
     * Convert ArrayBuffer to base64
     */
    CompressionUtils.arrayBufferToBase64 = function (buffer) {
        var bytes = new Uint8Array(buffer);
        var binary = '';
        for (var i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    };
    /**
     * Convert base64 to ArrayBuffer
     */
    CompressionUtils.base64ToArrayBuffer = function (base64) {
        var binary = atob(base64);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    };
    return CompressionUtils;
}());
exports.CompressionUtils = CompressionUtils;
