"use strict";
// src/reportGeneration/services/storageService.ts
// Real storage service for report persistence and retrieval
// Context: Handles file operations, browser storage, and cloud sync
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.getStorageService = exports.StorageService = void 0;
var compression_1 = require("../utils/compression");
var thumbnailGenerator_1 = require("../utils/thumbnailGenerator");
var encryption_1 = require("../utils/encryption");
var logger_1 = require("../../utils/logger");
/**
 * Production Storage Service
 * Handles all report storage and retrieval operations
 */
var StorageService = /** @class */ (function () {
    function StorageService(config) {
        this.dbName = 'TrisightReports';
        this.storeName = 'reports';
        this.db = null;
        this.encryptionKey = null;
        this.config = __assign({ maxLocalReports: 100, maxFileSize: 50, autoCleanupDays: 90, enableCloudSync: false, compressionEnabled: true }, config);
        this.thumbnailGenerator = new thumbnailGenerator_1.ThumbnailGenerator();
        this.initializeStorage();
    }
    /**
     * Initializes storage systems
     */
    StorageService.prototype.initializeStorage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Initialize IndexedDB for structured data
                        return [4 /*yield*/, this.initializeIndexedDB()];
                    case 1:
                        // Initialize IndexedDB for structured data
                        _a.sent();
                        // Initialize encryption if available
                        return [4 /*yield*/, this.initializeEncryption()];
                    case 2:
                        // Initialize encryption if available
                        _a.sent();
                        // Check and cleanup old reports
                        return [4 /*yield*/, this.cleanupOldReports()];
                    case 3:
                        // Check and cleanup old reports
                        _a.sent();
                        // Migrate from localStorage if needed
                        return [4 /*yield*/, this.migrateFromLocalStorage()];
                    case 4:
                        // Migrate from localStorage if needed
                        _a.sent();
                        (0, logger_1.logDebug)('StorageService', 'Storage initialized successfully');
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to initialize storage', error_1);
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize encryption key
     */
    StorageService.prototype.initializeEncryption = function () {
        return __awaiter(this, void 0, void 0, function () {
            var storedKey, _a, _b, exportedKey, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!encryption_1.EncryptionUtils.isAvailable()) {
                            (0, logger_1.logDebug)('StorageService', 'Encryption not available in this environment');
                            return [2 /*return*/];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 7, , 8]);
                        storedKey = localStorage.getItem('trisight_report_key');
                        if (!storedKey) return [3 /*break*/, 3];
                        _a = this;
                        return [4 /*yield*/, encryption_1.EncryptionUtils.importKey(storedKey)];
                    case 2:
                        _a.encryptionKey = _c.sent();
                        return [3 /*break*/, 6];
                    case 3:
                        // Generate new key
                        _b = this;
                        return [4 /*yield*/, encryption_1.EncryptionUtils.generateKey()];
                    case 4:
                        // Generate new key
                        _b.encryptionKey = _c.sent();
                        return [4 /*yield*/, encryption_1.EncryptionUtils.exportKey(this.encryptionKey)];
                    case 5:
                        exportedKey = _c.sent();
                        localStorage.setItem('trisight_report_key', exportedKey);
                        _c.label = 6;
                    case 6:
                        (0, logger_1.logDebug)('StorageService', 'Encryption initialized');
                        return [3 /*break*/, 8];
                    case 7:
                        error_2 = _c.sent();
                        (0, logger_1.logDebug)('StorageService', "Encryption initialization failed: ".concat(error_2));
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initializes IndexedDB for report storage
     */
    StorageService.prototype.initializeIndexedDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var request = indexedDB.open(_this.dbName, 1);
                        request.onerror = function () {
                            reject(new Error('Failed to open IndexedDB'));
                        };
                        request.onsuccess = function () {
                            _this.db = request.result;
                            resolve();
                        };
                        request.onupgradeneeded = function (event) {
                            var db = event.target.result;
                            // Create reports store
                            if (!db.objectStoreNames.contains(_this.storeName)) {
                                var store = db.createObjectStore(_this.storeName, { keyPath: 'id' });
                                // Create indexes for efficient querying
                                store.createIndex('ticker', 'ticker', { unique: false });
                                store.createIndex('createdAt', 'createdAt', { unique: false });
                                store.createIndex('status', 'status', { unique: false });
                                store.createIndex('template', 'template', { unique: false });
                                store.createIndex('author', 'author', { unique: false });
                            }
                        };
                    })];
            });
        });
    };
    /**
     * Saves a generated report
     */
    StorageService.prototype.saveReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var reportId, now, storedReport, _a, error_3;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (0, logger_1.logDebug)('StorageService', "Saving report for ".concat(report.companyData.ticker));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 8, , 9]);
                        reportId = this.generateReportId();
                        now = new Date().toISOString();
                        _b = {
                            id: reportId,
                            metadata: report.metadata,
                            ticker: report.companyData.ticker,
                            title: report.config.title || "".concat(report.companyData.companyName, " Analysis"),
                            template: report.config.reportType || 'custom',
                            author: report.config.author || 'Unknown',
                            createdAt: now,
                            lastAccessedAt: now
                        };
                        return [4 /*yield*/, this.calculateFileSize(report)];
                    case 2:
                        _b.fileSize = _c.sent(),
                            _b.outputFormat = report.config.outputFormat || 'pdf',
                            _b.status = 'completed',
                            _b.tags = this.extractTags(report);
                        return [4 /*yield*/, this.generateThumbnail(report)];
                    case 3:
                        _b.thumbnail = _c.sent();
                        return [4 /*yield*/, this.compressReportData(report)];
                    case 4:
                        storedReport = (_b.reportData = _c.sent(),
                            _b.isCompressed = this.config.compressionEnabled,
                            _b.isEncrypted = false,
                            _b);
                        // Save to IndexedDB
                        return [4 /*yield*/, this.saveToIndexedDB(storedReport)];
                    case 5:
                        // Save to IndexedDB
                        _c.sent();
                        // Save to localStorage for quick access
                        this.updateRecentReports(storedReport);
                        if (!report.outputPath) return [3 /*break*/, 7];
                        _a = storedReport;
                        return [4 /*yield*/, this.saveReportFile(report, reportId)];
                    case 6:
                        _a.localPath = _c.sent();
                        _c.label = 7;
                    case 7:
                        // Trigger cloud sync if enabled
                        if (this.config.enableCloudSync) {
                            this.scheduleCloudSync(storedReport);
                        }
                        (0, logger_1.logDebug)('StorageService', "Report saved successfully: ".concat(reportId));
                        return [2 /*return*/, storedReport];
                    case 8:
                        error_3 = _c.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to save report', error_3);
                        throw error_3;
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Retrieves a report by ID
     */
    StorageService.prototype.getReport = function (reportId) {
        return __awaiter(this, void 0, void 0, function () {
            var report, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getFromIndexedDB(reportId)];
                    case 1:
                        report = _a.sent();
                        if (!report) return [3 /*break*/, 3];
                        // Update last accessed time
                        report.lastAccessedAt = new Date().toISOString();
                        return [4 /*yield*/, this.updateReport(report)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [2 /*return*/, report];
                    case 4:
                        error_4 = _a.sent();
                        (0, logger_1.logError)('StorageService', "Failed to get report ".concat(reportId), error_4);
                        return [2 /*return*/, null];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Lists all reports with filtering
     */
    StorageService.prototype.listReports = function (filter) {
        return __awaiter(this, void 0, void 0, function () {
            var reports, filtered, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAllFromIndexedDB()];
                    case 1:
                        reports = _a.sent();
                        filtered = reports;
                        if (filter === null || filter === void 0 ? void 0 : filter.ticker) {
                            filtered = filtered.filter(function (r) { return r.ticker === filter.ticker; });
                        }
                        if (filter === null || filter === void 0 ? void 0 : filter.template) {
                            filtered = filtered.filter(function (r) { return r.template === filter.template; });
                        }
                        if (filter === null || filter === void 0 ? void 0 : filter.author) {
                            filtered = filtered.filter(function (r) { return r.author === filter.author; });
                        }
                        if (filter === null || filter === void 0 ? void 0 : filter.status) {
                            filtered = filtered.filter(function (r) { return r.status === filter.status; });
                        }
                        if (filter === null || filter === void 0 ? void 0 : filter.startDate) {
                            filtered = filtered.filter(function (r) { return new Date(r.createdAt) >= filter.startDate; });
                        }
                        if (filter === null || filter === void 0 ? void 0 : filter.endDate) {
                            filtered = filtered.filter(function (r) { return new Date(r.createdAt) <= filter.endDate; });
                        }
                        if ((filter === null || filter === void 0 ? void 0 : filter.tags) && filter.tags.length > 0) {
                            filtered = filtered.filter(function (r) {
                                return filter.tags.some(function (tag) { return r.tags.includes(tag); });
                            });
                        }
                        // Sort by creation date (newest first)
                        filtered.sort(function (a, b) {
                            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                        });
                        return [2 /*return*/, filtered];
                    case 2:
                        error_5 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to list reports', error_5);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Exports a report in specified format
     */
    StorageService.prototype.exportReport = function (reportId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var report, fullReport, exportData, _a, error_6;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        (0, logger_1.logDebug)('StorageService', "Exporting report ".concat(reportId, " as ").concat(options.format));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 22, , 23]);
                        return [4 /*yield*/, this.getReport(reportId)];
                    case 2:
                        report = _b.sent();
                        if (!report) {
                            throw new Error('Report not found');
                        }
                        fullReport = null;
                        if (!report.reportData) return [3 /*break*/, 5];
                        if (!(typeof report.reportData === 'string' && report.isCompressed)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.decompressReportData(report.reportData)];
                    case 3:
                        fullReport = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        if (typeof report.reportData === 'object') {
                            fullReport = report.reportData;
                        }
                        _b.label = 5;
                    case 5:
                        if (!fullReport) {
                            throw new Error('Report data not available');
                        }
                        exportData = void 0;
                        _a = options.format;
                        switch (_a) {
                            case 'pdf': return [3 /*break*/, 6];
                            case 'pptx': return [3 /*break*/, 8];
                            case 'json': return [3 /*break*/, 10];
                            case 'html': return [3 /*break*/, 12];
                            case 'xlsx': return [3 /*break*/, 14];
                        }
                        return [3 /*break*/, 16];
                    case 6: return [4 /*yield*/, this.exportAsPDF(fullReport, options)];
                    case 7:
                        exportData = _b.sent();
                        return [3 /*break*/, 17];
                    case 8: return [4 /*yield*/, this.exportAsPPTX(fullReport, options)];
                    case 9:
                        exportData = _b.sent();
                        return [3 /*break*/, 17];
                    case 10: return [4 /*yield*/, this.exportAsJSON(fullReport, options)];
                    case 11:
                        exportData = _b.sent();
                        return [3 /*break*/, 17];
                    case 12: return [4 /*yield*/, this.exportAsHTML(fullReport, options)];
                    case 13:
                        exportData = _b.sent();
                        return [3 /*break*/, 17];
                    case 14: return [4 /*yield*/, this.exportAsExcel(fullReport, options)];
                    case 15:
                        exportData = _b.sent();
                        return [3 /*break*/, 17];
                    case 16: throw new Error("Unsupported export format: ".concat(options.format));
                    case 17:
                        if (!options.compressionLevel) return [3 /*break*/, 19];
                        return [4 /*yield*/, this.compressBlob(exportData, options.compressionLevel)];
                    case 18:
                        exportData = _b.sent();
                        _b.label = 19;
                    case 19:
                        if (!options.password) return [3 /*break*/, 21];
                        return [4 /*yield*/, this.encryptBlob(exportData, options.password)];
                    case 20:
                        exportData = _b.sent();
                        _b.label = 21;
                    case 21: return [2 /*return*/, exportData];
                    case 22:
                        error_6 = _b.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to export report', error_6);
                        throw error_6;
                    case 23: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Downloads a report file
     */
    StorageService.prototype.downloadReport = function (reportId, options) {
        return __awaiter(this, void 0, void 0, function () {
            var report, exportOptions, blob, url, a, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getReport(reportId)];
                    case 1:
                        report = _a.sent();
                        if (!report) {
                            throw new Error('Report not found');
                        }
                        exportOptions = options || {
                            format: report.outputFormat,
                            includeCharts: true,
                            includeRawData: false
                        };
                        return [4 /*yield*/, this.exportReport(reportId, exportOptions)];
                    case 2:
                        blob = _a.sent();
                        url = URL.createObjectURL(blob);
                        a = document.createElement('a');
                        a.href = url;
                        a.download = "".concat(report.ticker, "_").concat(report.template, "_").concat(new Date().toISOString().split('T')[0], ".").concat(exportOptions.format);
                        // Trigger download
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        // Cleanup
                        URL.revokeObjectURL(url);
                        (0, logger_1.logDebug)('StorageService', "Downloaded report: ".concat(report.id));
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to download report', error_7);
                        throw error_7;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deletes a report
     */
    StorageService.prototype.deleteReport = function (reportId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.deleteFromIndexedDB(reportId)];
                    case 1:
                        _a.sent();
                        this.removeFromRecentReports(reportId);
                        (0, logger_1.logDebug)('StorageService', "Deleted report: ".concat(reportId));
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to delete report', error_8);
                        throw error_8;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Archives old reports
     */
    StorageService.prototype.archiveReport = function (reportId) {
        return __awaiter(this, void 0, void 0, function () {
            var report, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.getReport(reportId)];
                    case 1:
                        report = _a.sent();
                        if (!report) return [3 /*break*/, 3];
                        report.status = 'archived';
                        return [4 /*yield*/, this.updateReport(report)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_9 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to archive report', error_9);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets storage statistics
     */
    StorageService.prototype.getStorageStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reports, stats_1, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAllFromIndexedDB()];
                    case 1:
                        reports = _a.sent();
                        stats_1 = {
                            totalReports: reports.length,
                            totalSize: reports.reduce(function (sum, r) { return sum + r.fileSize; }, 0),
                            byTemplate: {},
                            byStatus: {},
                            oldestReport: null,
                            newestReport: null
                        };
                        // Calculate statistics
                        reports.forEach(function (report) {
                            // By template
                            stats_1.byTemplate[report.template] = (stats_1.byTemplate[report.template] || 0) + 1;
                            // By status
                            stats_1.byStatus[report.status] = (stats_1.byStatus[report.status] || 0) + 1;
                            // Date ranges
                            var createdDate = new Date(report.createdAt);
                            if (!stats_1.oldestReport || createdDate < stats_1.oldestReport) {
                                stats_1.oldestReport = createdDate;
                            }
                            if (!stats_1.newestReport || createdDate > stats_1.newestReport) {
                                stats_1.newestReport = createdDate;
                            }
                        });
                        return [2 /*return*/, stats_1];
                    case 2:
                        error_10 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to get storage stats', error_10);
                        return [2 /*return*/, {
                                totalReports: 0,
                                totalSize: 0,
                                byTemplate: {},
                                byStatus: {},
                                oldestReport: null,
                                newestReport: null
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Private helper methods
     */
    StorageService.prototype.generateReportId = function () {
        return "report_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
    };
    StorageService.prototype.calculateFileSize = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var jsonString;
            return __generator(this, function (_a) {
                jsonString = JSON.stringify(report);
                return [2 /*return*/, jsonString.length / (1024 * 1024)]; // Convert to MB
            });
        });
    };
    StorageService.prototype.extractTags = function (report) {
        var tags = [];
        // Add template tag
        if (report.config.reportType) {
            tags.push(report.config.reportType);
        }
        // Add ticker tag
        tags.push(report.companyData.ticker);
        // Add timeframe tag
        if (report.config.timeframe) {
            tags.push(report.config.timeframe);
        }
        // Add recommendation tag
        if (report.metadata.recommendation) {
            tags.push(report.metadata.recommendation);
        }
        return tags;
    };
    StorageService.prototype.generateThumbnail = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.thumbnailGenerator.generateFromReport(report, {
                                width: 300,
                                height: 200,
                                quality: 0.9,
                                format: 'jpeg'
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_11 = _a.sent();
                        (0, logger_1.logDebug)('StorageService', "Failed to generate thumbnail: ".concat(error_11));
                        return [2 /*return*/, undefined];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.compressReportData = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var compressed, ratio, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.compressionEnabled) {
                            return [2 /*return*/, JSON.stringify(report)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, compression_1.CompressionUtils.compressObject(report)];
                    case 2:
                        compressed = _a.sent();
                        ratio = compression_1.CompressionUtils.calculateCompressionRatio(JSON.stringify(report), compressed);
                        (0, logger_1.logDebug)('StorageService', "Compressed report data by ".concat((ratio * 100).toFixed(1), "%"));
                        return [2 /*return*/, compressed];
                    case 3:
                        error_12 = _a.sent();
                        (0, logger_1.logDebug)('StorageService', "Compression failed, storing uncompressed: ".concat(error_12));
                        return [2 /*return*/, JSON.stringify(report)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.decompressReportData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!data.match(/^[A-Za-z0-9+/]+=*$/)) return [3 /*break*/, 2];
                        return [4 /*yield*/, compression_1.CompressionUtils.decompressObject(data)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: 
                    // Not compressed, parse as JSON
                    return [2 /*return*/, JSON.parse(data)];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_13 = _a.sent();
                        (0, logger_1.logDebug)('StorageService', "Decompression failed: ".concat(error_13));
                        throw new Error('Failed to decompress report data');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.saveToIndexedDB = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.db) {
                            reject(new Error('Database not initialized'));
                            return;
                        }
                        var transaction = _this.db.transaction([_this.storeName], 'readwrite');
                        var store = transaction.objectStore(_this.storeName);
                        var request = store.put(report);
                        request.onsuccess = function () { return resolve(); };
                        request.onerror = function () { return reject(request.error); };
                    })];
            });
        });
    };
    StorageService.prototype.getFromIndexedDB = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.db) {
                            reject(new Error('Database not initialized'));
                            return;
                        }
                        var transaction = _this.db.transaction([_this.storeName], 'readonly');
                        var store = transaction.objectStore(_this.storeName);
                        var request = store.get(id);
                        request.onsuccess = function () { return resolve(request.result || null); };
                        request.onerror = function () { return reject(request.error); };
                    })];
            });
        });
    };
    StorageService.prototype.getAllFromIndexedDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.db) {
                            reject(new Error('Database not initialized'));
                            return;
                        }
                        var transaction = _this.db.transaction([_this.storeName], 'readonly');
                        var store = transaction.objectStore(_this.storeName);
                        var request = store.getAll();
                        request.onsuccess = function () { return resolve(request.result || []); };
                        request.onerror = function () { return reject(request.error); };
                    })];
            });
        });
    };
    StorageService.prototype.deleteFromIndexedDB = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        if (!_this.db) {
                            reject(new Error('Database not initialized'));
                            return;
                        }
                        var transaction = _this.db.transaction([_this.storeName], 'readwrite');
                        var store = transaction.objectStore(_this.storeName);
                        var request = store["delete"](id);
                        request.onsuccess = function () { return resolve(); };
                        request.onerror = function () { return reject(request.error); };
                    })];
            });
        });
    };
    StorageService.prototype.updateReport = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.saveToIndexedDB(report)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.updateRecentReports = function (report) {
        try {
            var recentKey = 'trisight_recent_reports';
            var recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
            // Add to recent, limit to 10
            recent.unshift({
                id: report.id,
                ticker: report.ticker,
                title: report.title,
                createdAt: report.createdAt
            });
            localStorage.setItem(recentKey, JSON.stringify(recent.slice(0, 10)));
        }
        catch (error) {
            // Ignore localStorage errors
        }
    };
    StorageService.prototype.removeFromRecentReports = function (reportId) {
        try {
            var recentKey = 'trisight_recent_reports';
            var recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
            var filtered = recent.filter(function (r) { return r.id !== reportId; });
            localStorage.setItem(recentKey, JSON.stringify(filtered));
        }
        catch (error) {
            // Ignore localStorage errors
        }
    };
    StorageService.prototype.cleanupOldReports = function () {
        return __awaiter(this, void 0, void 0, function () {
            var reports, cutoffDate, _i, reports_1, report, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, this.getAllFromIndexedDB()];
                    case 1:
                        reports = _a.sent();
                        cutoffDate = new Date();
                        cutoffDate.setDate(cutoffDate.getDate() - this.config.autoCleanupDays);
                        _i = 0, reports_1 = reports;
                        _a.label = 2;
                    case 2:
                        if (!(_i < reports_1.length)) return [3 /*break*/, 5];
                        report = reports_1[_i];
                        if (!(report.status === 'draft' && new Date(report.createdAt) < cutoffDate)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.deleteReport(report.id)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_14 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to cleanup old reports', error_14);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.migrateFromLocalStorage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oldReportsKey, oldReports, reports, _i, reports_2, report, storedReport, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        oldReportsKey = 'generatedReports';
                        oldReports = localStorage.getItem(oldReportsKey);
                        if (!oldReports) return [3 /*break*/, 5];
                        reports = JSON.parse(oldReports);
                        _i = 0, reports_2 = reports;
                        _a.label = 1;
                    case 1:
                        if (!(_i < reports_2.length)) return [3 /*break*/, 4];
                        report = reports_2[_i];
                        storedReport = {
                            id: report.id || this.generateReportId(),
                            metadata: report.metadata || {},
                            ticker: report.ticker,
                            title: report.title,
                            template: report.template || 'custom',
                            author: report.author || 'Unknown',
                            createdAt: report.createdAt || report.completedAt,
                            lastAccessedAt: new Date().toISOString(),
                            fileSize: 0,
                            outputFormat: 'pdf',
                            status: 'completed',
                            tags: [],
                            reportData: report
                        };
                        return [4 /*yield*/, this.saveToIndexedDB(storedReport)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        // Remove old data
                        localStorage.removeItem(oldReportsKey);
                        (0, logger_1.logDebug)('StorageService', "Migrated ".concat(reports.length, " reports from localStorage"));
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_15 = _a.sent();
                        (0, logger_1.logError)('StorageService', 'Failed to migrate from localStorage', error_15);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    StorageService.prototype.saveReportFile = function (report, reportId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In browser environment, we can't save to filesystem
                // Return a data URL instead
                return [2 /*return*/, "data:application/json;base64,".concat(btoa(JSON.stringify(report)))];
            });
        });
    };
    StorageService.prototype.scheduleCloudSync = function (report) {
        // Placeholder for cloud sync implementation
        // Would integrate with Supabase or other cloud storage
        (0, logger_1.logDebug)('StorageService', "Cloud sync scheduled for report ".concat(report.id));
    };
    StorageService.prototype.exportAsPDF = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var PDFEngine, engine, pdfData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../engines/pdfEngine')); })];
                    case 1:
                        PDFEngine = (_a.sent()).PDFEngine;
                        engine = new PDFEngine();
                        return [4 /*yield*/, engine.generatePDF(report.companyData, report.analysis || {}, report.slides, [] // Charts would be passed here
                            )];
                    case 2:
                        pdfData = _a.sent();
                        return [2 /*return*/, new Blob([pdfData], { type: 'application/pdf' })];
                }
            });
        });
    };
    StorageService.prototype.exportAsPPTX = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var PPTXEngine, engine, pptxData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../engines/pptxEngine')); })];
                    case 1:
                        PPTXEngine = (_a.sent()).PPTXEngine;
                        engine = new PPTXEngine();
                        return [4 /*yield*/, engine.generatePPTX(report.companyData, report.analysis || {}, report.slides, [] // Charts would be passed here
                            )];
                    case 2:
                        pptxData = _a.sent();
                        return [2 /*return*/, new Blob([pptxData], {
                                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                            })];
                }
            });
        });
    };
    StorageService.prototype.exportAsJSON = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var jsonData;
            return __generator(this, function (_a) {
                jsonData = options.includeRawData ? report : {
                    config: report.config,
                    metadata: report.metadata,
                    slides: report.slides
                };
                return [2 /*return*/, new Blob([JSON.stringify(jsonData, null, 2)], {
                        type: 'application/json'
                    })];
            });
        });
    };
    StorageService.prototype.exportAsHTML = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var html;
            return __generator(this, function (_a) {
                html = "<!DOCTYPE html>\n<html>\n<head>\n  <title>".concat(report.companyData.companyName, " - ").concat(report.config.reportType, "</title>\n  <style>\n    body { font-family: Arial, sans-serif; margin: 2em; }\n    .slide { page-break-after: always; margin-bottom: 2em; }\n    h1 { color: #1e293b; }\n    h2 { color: #334155; }\n    .metrics { display: flex; gap: 2em; margin: 1em 0; }\n    .metric { background: #f1f5f9; padding: 1em; border-radius: 8px; }\n  </style>\n</head>\n<body>");
                // Add slides
                report.slides.forEach(function (slide) {
                    html += "<div class=\"slide\">\n        <h2>".concat(slide.title, "</h2>");
                    slide.content.forEach(function (content) {
                        switch (content.type) {
                            case 'text':
                                html += "<p>".concat(content.data.text || '', "</p>");
                                break;
                            case 'table':
                                html += '<table border="1">';
                                if (content.data.headers) {
                                    html += '<tr>' + content.data.headers.map(function (h) { return "<th>".concat(h, "</th>"); }).join('') + '</tr>';
                                }
                                if (content.data.rows) {
                                    content.data.rows.forEach(function (row) {
                                        html += '<tr>' + row.map(function (cell) { return "<td>".concat(cell, "</td>"); }).join('') + '</tr>';
                                    });
                                }
                                html += '</table>';
                                break;
                        }
                    });
                    html += '</div>';
                });
                html += '</body></html>';
                return [2 /*return*/, new Blob([html], { type: 'text/html' })];
            });
        });
    };
    StorageService.prototype.exportAsExcel = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var csv;
            return __generator(this, function (_a) {
                csv = "".concat(report.companyData.companyName, " Report\n");
                csv += "Generated: ".concat(new Date().toISOString(), "\n\n");
                // Add financial data as CSV
                report.slides.forEach(function (slide) {
                    slide.content.forEach(function (content) {
                        if (content.type === 'table' && content.data.rows) {
                            if (content.data.headers) {
                                csv += content.data.headers.join(',') + '\n';
                            }
                            content.data.rows.forEach(function (row) {
                                csv += row.join(',') + '\n';
                            });
                            csv += '\n';
                        }
                    });
                });
                return [2 /*return*/, new Blob([csv], { type: 'text/csv' })];
            });
        });
    };
    StorageService.prototype.compressBlob = function (blob, level) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would use compression library
                return [2 /*return*/, blob];
            });
        });
    };
    StorageService.prototype.encryptBlob = function (blob, password) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would use encryption library
                return [2 /*return*/, blob];
            });
        });
    };
    return StorageService;
}());
exports.StorageService = StorageService;
// Singleton instance
var storageInstance = null;
/**
 * Gets the storage service instance
 */
function getStorageService() {
    if (!storageInstance) {
        storageInstance = new StorageService();
    }
    return storageInstance;
}
exports.getStorageService = getStorageService;
