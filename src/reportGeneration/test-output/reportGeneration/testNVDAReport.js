"use strict";
// src/reportGeneration/testNVDAReport.ts
// Test script for NVDA report generation with real API
// Context: Validates the complete report generation pipeline
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
exports.testNVDAReport = void 0;
var dotenv = __importStar(require("dotenv"));
var path = __importStar(require("path"));
var reportGenerator_1 = require("./core/reportGenerator");
// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
function testNVDAReport() {
    var _a, _b, _c, _d;
    return __awaiter(this, void 0, void 0, function () {
        var apiKey, config, generator, startTime, report, duration, metrics, tech, fs, stats, getStorageService, storage, storedReport, retrieved, reports, error_1;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    console.log('=== NVDA Report Generation Test ===\n');
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 9, , 10]);
                    apiKey = process.env.REACT_APP_TWELVE_DATA_API_KEY;
                    if (!apiKey) {
                        throw new Error('REACT_APP_TWELVE_DATA_API_KEY not found in .env.local');
                    }
                    console.log('✅ API key found:', apiKey.substring(0, 8) + '...');
                    config = {
                        ticker: 'NVDA',
                        reportDate: new Date().toISOString().split('T')[0],
                        currentDate: new Date().toISOString().split('T')[0],
                        reportType: 'technical_analysis',
                        outputFormat: 'pdf',
                        includeCharts: true,
                        debugMode: true,
                        apiKey: apiKey
                    };
                    console.log('\n📊 Generating report for NVDA...');
                    console.log('Config:', JSON.stringify(config, null, 2));
                    generator = new reportGenerator_1.ReportGenerator(config);
                    // Generate report
                    console.log('\n🚀 Starting report generation...');
                    startTime = Date.now();
                    return [4 /*yield*/, generator.generateReport()];
                case 2:
                    report = _e.sent();
                    duration = Date.now() - startTime;
                    console.log("\n\u2705 Report generated in ".concat((duration / 1000).toFixed(1), "s!"));
                    // Display results
                    console.log('\n📋 Generated Report:');
                    console.log('- Company:', report.companyData.companyName);
                    console.log('- Ticker:', report.companyData.ticker);
                    console.log('- Slides:', report.slides.length);
                    console.log('- Output Path:', report.outputPath || 'Not saved');
                    // Display company data
                    console.log('\n🏢 Company Data:');
                    console.log('- Description:', ((_a = report.companyData.description) === null || _a === void 0 ? void 0 : _a.substring(0, 100)) + '...');
                    console.log('- Sector:', report.companyData.sector);
                    console.log('- Industry:', report.companyData.industry);
                    // Display financial metrics
                    if ((_b = report.companyData.financials) === null || _b === void 0 ? void 0 : _b.keyMetrics) {
                        metrics = report.companyData.financials.keyMetrics;
                        console.log('\n💰 Key Financial Metrics:');
                        console.log('- Market Cap:', ((_c = metrics.marketCap) === null || _c === void 0 ? void 0 : _c.toLocaleString()) || 'N/A');
                        console.log('- PE Ratio:', metrics.peRatio || 'N/A');
                        console.log('- PEG Ratio:', metrics.pegRatio || 'N/A');
                        console.log('- Dividend Yield:', metrics.dividendYield || 'N/A');
                        console.log('- ROE:', metrics.roe || 'N/A');
                        console.log('- Debt to Equity:', metrics.debtToEquity || 'N/A');
                    }
                    // Display technical indicators
                    if (report.companyData.technicals) {
                        tech = report.companyData.technicals;
                        console.log('\n📈 Technical Indicators:');
                        console.log('- SMA 20:', tech.sma20);
                        console.log('- SMA 50:', tech.sma50);
                        console.log('- SMA 200:', tech.sma200);
                        console.log('- RSI:', tech.rsi);
                        console.log('- Patterns Detected:', ((_d = tech.patterns) === null || _d === void 0 ? void 0 : _d.length) || 0);
                    }
                    // Display slides
                    console.log('\n📑 Report Slides:');
                    report.slides.forEach(function (slide, i) {
                        console.log("  ".concat(i + 1, ". ").concat(slide.title, " (").concat(slide.layout, ")"));
                        console.log("     - Content items: ".concat(slide.content.length));
                        slide.content.forEach(function (content) {
                            console.log("       \u2022 ".concat(content.type));
                        });
                    });
                    // Display metadata
                    console.log('\n📊 Report Metadata:');
                    console.log('- Generated At:', new Date(report.metadata.generatedAt).toLocaleString());
                    console.log('- Version:', report.metadata.version);
                    console.log('- Author:', report.metadata.author);
                    console.log('- Confidentiality:', report.metadata.confidentialityLevel);
                    if (!report.outputPath) return [3 /*break*/, 4];
                    console.log('\n📄 Output File:');
                    console.log('- Path:', report.outputPath);
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('fs')); })];
                case 3:
                    fs = _e.sent();
                    if (fs.existsSync(report.outputPath)) {
                        stats = fs.statSync(report.outputPath);
                        console.log('- Size:', (stats.size / 1024).toFixed(1), 'KB');
                        console.log('- Created:', stats.birthtime.toLocaleString());
                        // Try to open with Playwright if PDF
                        if (report.outputPath.endsWith('.pdf')) {
                            console.log('\n🔍 To view the PDF:');
                            console.log("- Use browser_navigate with URL: file:///".concat(report.outputPath.replace(/\\/g, '/')));
                        }
                    }
                    else {
                        console.log('- Status: File not found');
                    }
                    _e.label = 4;
                case 4:
                    // Test storage
                    console.log('\n💾 Testing storage service...');
                    return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('./services/storageService')); })];
                case 5:
                    getStorageService = (_e.sent()).getStorageService;
                    storage = getStorageService();
                    return [4 /*yield*/, storage.saveReport(report)];
                case 6:
                    storedReport = _e.sent();
                    console.log('- Saved with ID:', storedReport.id);
                    console.log('- File Size:', storedReport.fileSize.toFixed(2), 'MB');
                    console.log('- Compressed:', storedReport.isCompressed ? 'Yes' : 'No');
                    console.log('- Has Thumbnail:', storedReport.thumbnail ? 'Yes' : 'No');
                    return [4 /*yield*/, storage.getReport(storedReport.id)];
                case 7:
                    retrieved = _e.sent();
                    console.log('- Retrieved:', retrieved ? 'Success' : 'Failed');
                    return [4 /*yield*/, storage.listReports({ ticker: 'NVDA' })];
                case 8:
                    reports = _e.sent();
                    console.log('- Total NVDA reports in storage:', reports.length);
                    console.log('\n✨ Test completed successfully!');
                    return [2 /*return*/, report];
                case 9:
                    error_1 = _e.sent();
                    console.error('\n❌ Test failed:', error_1);
                    if (error_1 instanceof Error) {
                        console.error('Stack:', error_1.stack);
                    }
                    process.exit(1);
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
exports.testNVDAReport = testNVDAReport;
// Run the test
if (require.main === module) {
    testNVDAReport()
        .then(function () { return process.exit(0); })["catch"](function () { return process.exit(1); });
}
