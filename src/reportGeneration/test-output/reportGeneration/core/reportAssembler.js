"use strict";
// src/reportGeneration/core/reportAssembler.ts
// Assembles processed data into final report format
// Context: Creates PPTX/PDF/HTML output with charts and formatted content
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
exports.ReportAssembler = void 0;
var chartGenerator_1 = require("../utils/chartGenerator");
var nodeCanvasChartGenerator_1 = require("../utils/nodeCanvasChartGenerator");
var pdfEngine_1 = require("../engines/pdfEngine");
var pptxEngine_1 = require("../engines/pptxEngine");
var logger_1 = require("../../utils/logger");
var fs = __importStar(require("fs"));
var path = __importStar(require("path"));
var ReportAssembler = /** @class */ (function () {
    function ReportAssembler() {
        this.generatedCharts = [];
        this.chartGenerator = new chartGenerator_1.ChartGenerator();
        this.nodeCanvasChartGenerator = new nodeCanvasChartGenerator_1.NodeCanvasChartGenerator();
        this.pdfEngine = new pdfEngine_1.PDFEngine();
        this.pptxEngine = new pptxEngine_1.PPTXEngine();
        this.outputDirectory = './generated-reports/';
        // Ensure output directory exists
        this.ensureOutputDirectory();
    }
    /**
     * Main entry point for report assembly
     * Creates the final report in the requested format
     */
    ReportAssembler.prototype.assemble = function (config, data, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, slides, outputPath, report;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        (0, logger_1.logDebug)('ReportAssembler', "Assembling report for ".concat((data === null || data === void 0 ? void 0 : data.ticker) || 'unknown'));
                        console.log('[ReportAssembler] Input data structure:', {
                            hasData: !!data,
                            ticker: data === null || data === void 0 ? void 0 : data.ticker,
                            companyName: data === null || data === void 0 ? void 0 : data.companyName,
                            hasFinancials: !!(data === null || data === void 0 ? void 0 : data.financials),
                            hasAnalysis: !!analysis,
                            analysisKeys: analysis ? Object.keys(analysis) : []
                        });
                        slides = this.createSlides(data, analysis);
                        return [4 /*yield*/, this.generateOutput(config, slides)];
                    case 1:
                        outputPath = _a.sent();
                        report = {
                            config: config,
                            companyData: data,
                            slides: slides,
                            metadata: {
                                generatedAt: new Date().toISOString(),
                                generationTime: Date.now() - startTime || 5000,
                                dataFreshness: {
                                    financial: new Date().toISOString(),
                                    market: new Date().toISOString(),
                                    news: new Date().toISOString()
                                },
                                aiModel: 'gpt-4',
                                version: '2.0'
                            },
                            outputPath: outputPath
                        };
                        return [2 /*return*/, report];
                }
            });
        });
    };
    /**
     * Legacy method for backward compatibility
     */
    ReportAssembler.prototype.assembleReport = function (config, processedData, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var slides, outputPath, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        (0, logger_1.logDebug)('ReportAssembler', 'Legacy assemble method called');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        console.log('[ReportAssembler] ProcessedData structure:', {
                            hasCompanyData: !!processedData.companyData,
                            hasCalculations: !!processedData.calculations,
                            hasProcessedSections: !!processedData.processedSections,
                            processedSectionsCount: ((_a = processedData.processedSections) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            calculationsKeys: processedData.calculations ? Object.keys(processedData.calculations) : [],
                            processedDataKeys: Object.keys(processedData)
                        });
                        slides = processedData.processedSections || [];
                        // If no slides but we have company data, generate them
                        if (slides.length === 0 && (processedData.companyData || config.companyData)) {
                            slides = this.createSlides(processedData.companyData || config.companyData, processedData.calculations || config.analysis);
                        }
                        return [4 /*yield*/, this.generateOutput(config, slides)];
                    case 2:
                        outputPath = _b.sent();
                        return [2 /*return*/, {
                                success: true,
                                reportPath: outputPath,
                                errors: []
                            }];
                    case 3:
                        error_1 = _b.sent();
                        console.error('[ReportAssembler] Error in assembleReport:', error_1);
                        return [2 /*return*/, {
                                success: false,
                                errors: [error_1]
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ReportAssembler.prototype.createSlides = function (data, analysis) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u;
        var slides = [];
        // Title slide
        slides.push({
            slideNumber: 1,
            title: "".concat(data.companyName, " Investment Analysis"),
            content: [
                {
                    type: 'text',
                    data: {
                        title: data.companyName,
                        subtitle: "Ticker: ".concat(data.ticker),
                        date: new Date().toLocaleDateString()
                    }
                }
            ],
            layout: 'title'
        });
        // Executive Summary slide
        slides.push({
            slideNumber: 2,
            title: 'Executive Summary',
            content: [
                {
                    type: 'text',
                    data: {
                        text: "Investment recommendation: ".concat(((_b = (_a = analysis === null || analysis === void 0 ? void 0 : analysis.composite) === null || _a === void 0 ? void 0 : _a.recommendation) === null || _b === void 0 ? void 0 : _b.toUpperCase()) || 'HOLD'),
                        bullets: [
                            "Overall Score: ".concat(((_c = analysis === null || analysis === void 0 ? void 0 : analysis.composite) === null || _c === void 0 ? void 0 : _c.overall) || 'N/A', "/100"),
                            "Confidence: ".concat(((_d = analysis === null || analysis === void 0 ? void 0 : analysis.composite) === null || _d === void 0 ? void 0 : _d.confidence) ? (analysis.composite.confidence * 100).toFixed(0) : 'N/A', "%"),
                            "Risk Level: ".concat(((_e = analysis === null || analysis === void 0 ? void 0 : analysis.risk) === null || _e === void 0 ? void 0 : _e.riskScore) ? this.getRiskLevel(analysis.risk.riskScore) : 'N/A')
                        ]
                    }
                }
            ],
            layout: 'content'
        });
        // Financial Metrics slide
        slides.push({
            slideNumber: 3,
            title: 'Key Financial Metrics',
            content: [
                {
                    type: 'table',
                    data: {
                        headers: ['Metric', 'Value', 'Assessment'],
                        rows: [
                            ['P/E Ratio', ((_h = (_g = (_f = data === null || data === void 0 ? void 0 : data.financials) === null || _f === void 0 ? void 0 : _f.keyMetrics) === null || _g === void 0 ? void 0 : _g.peRatio) === null || _h === void 0 ? void 0 : _h.toString()) || 'N/A', ((_k = (_j = data === null || data === void 0 ? void 0 : data.financials) === null || _j === void 0 ? void 0 : _j.keyMetrics) === null || _k === void 0 ? void 0 : _k.peRatio) ? this.getValuationAssessment(data.financials.keyMetrics.peRatio) : 'N/A'],
                            ['ROE', ((_m = (_l = data === null || data === void 0 ? void 0 : data.financials) === null || _l === void 0 ? void 0 : _l.keyMetrics) === null || _m === void 0 ? void 0 : _m.roe) ? "".concat((data.financials.keyMetrics.roe * 100).toFixed(1), "%") : 'N/A', ((_p = (_o = data === null || data === void 0 ? void 0 : data.financials) === null || _o === void 0 ? void 0 : _o.keyMetrics) === null || _p === void 0 ? void 0 : _p.roe) ? this.getQualityAssessment(data.financials.keyMetrics.roe) : 'N/A'],
                            ['Debt/Equity', ((_s = (_r = (_q = data === null || data === void 0 ? void 0 : data.financials) === null || _q === void 0 ? void 0 : _q.keyMetrics) === null || _r === void 0 ? void 0 : _r.debtToEquity) === null || _s === void 0 ? void 0 : _s.toString()) || 'N/A', ((_u = (_t = data === null || data === void 0 ? void 0 : data.financials) === null || _t === void 0 ? void 0 : _t.keyMetrics) === null || _u === void 0 ? void 0 : _u.debtToEquity) !== undefined ? this.getLeverageAssessment(data.financials.keyMetrics.debtToEquity) : 'N/A']
                        ]
                    }
                }
            ],
            layout: 'content'
        });
        // Technical Analysis slide (placeholder)
        slides.push({
            slideNumber: 4,
            title: 'Technical Analysis',
            content: [
                {
                    type: 'chart',
                    data: {
                        type: 'candlestick',
                        title: 'Price Action'
                    }
                }
            ],
            layout: 'chart'
        });
        return slides;
    };
    ReportAssembler.prototype.generateOutput = function (config, slides) {
        return __awaiter(this, void 0, void 0, function () {
            var format, timestamp, filename, outputPath, companyData, analysis, _a, reportData, _b, jsonData, error_2;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        format = config.outputFormat || 'pptx';
                        timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                        filename = "".concat(config.ticker, "_report_").concat(timestamp, ".").concat(format);
                        outputPath = path.join(this.outputDirectory, filename);
                        (0, logger_1.logDebug)('ReportAssembler', "Generating ".concat(format.toUpperCase(), " report: ").concat(outputPath));
                        companyData = config.companyData || this.extractCompanyData(slides);
                        analysis = config.analysis || this.extractAnalysis(slides);
                        // Generate charts for all slides that need them
                        _a = this;
                        return [4 /*yield*/, this.generateChartsForSlides(slides, companyData)];
                    case 1:
                        // Generate charts for all slides that need them
                        _a.generatedCharts = _c.sent();
                        (0, logger_1.logDebug)('ReportAssembler', "Generated ".concat(this.generatedCharts.length, " charts"));
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 12, , 13]);
                        reportData = void 0;
                        _b = format.toLowerCase();
                        switch (_b) {
                            case 'pdf': return [3 /*break*/, 3];
                            case 'pptx': return [3 /*break*/, 6];
                            case 'powerpoint': return [3 /*break*/, 6];
                            case 'json': return [3 /*break*/, 9];
                        }
                        return [3 /*break*/, 10];
                    case 3: return [4 /*yield*/, this.pdfEngine.generatePDF(companyData, analysis, slides, this.generatedCharts)];
                    case 4:
                        reportData = _c.sent();
                        return [4 /*yield*/, this.pdfEngine.saveToFile(reportData, outputPath)];
                    case 5:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 6: return [4 /*yield*/, this.pptxEngine.generatePPTX(companyData, analysis, slides, this.generatedCharts)];
                    case 7:
                        reportData = _c.sent();
                        return [4 /*yield*/, this.pptxEngine.saveToFile(reportData, outputPath)];
                    case 8:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 9:
                        jsonData = {
                            metadata: {
                                ticker: config.ticker,
                                reportType: config.reportType,
                                generatedAt: new Date().toISOString(),
                                format: format
                            },
                            companyData: companyData,
                            analysis: analysis,
                            slides: slides,
                            charts: this.generatedCharts.map(function (c) { return ({
                                type: c.type,
                                format: c.format,
                                dimensions: c.dimensions
                            }); }),
                            summary: this.generateExecutiveSummary(slides)
                        };
                        if (typeof window === 'undefined') {
                            // Node.js environment
                            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
                        }
                        else {
                            // Browser environment - store in memory
                            window.__generatedReport = jsonData;
                        }
                        return [3 /*break*/, 11];
                    case 10: throw new Error("Unsupported output format: ".concat(format));
                    case 11:
                        (0, logger_1.logDebug)('ReportAssembler', "Report successfully generated: ".concat(outputPath));
                        return [2 /*return*/, outputPath];
                    case 12:
                        error_2 = _c.sent();
                        (0, logger_1.logDebug)('ReportAssembler', "Error generating report: ".concat(error_2));
                        throw error_2;
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    ReportAssembler.prototype.getRiskLevel = function (riskScore) {
        if (riskScore < 30)
            return 'Low';
        if (riskScore < 60)
            return 'Moderate';
        return 'High';
    };
    /**
     * Ensures output directory exists
     */
    ReportAssembler.prototype.ensureOutputDirectory = function () {
        if (typeof window === 'undefined') {
            // Node.js environment
            if (!fs.existsSync(this.outputDirectory)) {
                fs.mkdirSync(this.outputDirectory, { recursive: true });
            }
        }
    };
    /**
     * Extracts company data from slides
     */
    ReportAssembler.prototype.extractCompanyData = function (slides) {
        var _a, _b, _c, _d, _e, _f;
        // Extract from title slide or use defaults
        var titleSlide = slides.find(function (s) { return s.layout === 'title'; });
        var ticker = ((_d = (_c = (_b = (_a = titleSlide === null || titleSlide === void 0 ? void 0 : titleSlide.content[0]) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.subtitle) === null || _c === void 0 ? void 0 : _c.match(/Ticker: (\w+)/)) === null || _d === void 0 ? void 0 : _d[1]) || 'UNKNOWN';
        var companyName = ((_f = (_e = titleSlide === null || titleSlide === void 0 ? void 0 : titleSlide.content[0]) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.title) || 'Unknown Company';
        return {
            ticker: ticker,
            companyName: companyName,
            description: '',
            sector: '',
            industry: '',
            financials: {
                incomeStatement: [],
                balanceSheet: [],
                cashFlow: [],
                historicalPrices: [],
                keyMetrics: {} // Empty metrics instead of fake values
            },
            metadata: {
                lastUpdated: new Date().toISOString(),
                sources: {},
                quality: { overall: 0.85 }
            }
        };
    };
    /**
     * Extracts analysis results from slides
     */
    ReportAssembler.prototype.extractAnalysis = function (slides) {
        // Extract from executive summary or use defaults
        var execSlide = slides.find(function (s) { return s.title === 'Executive Summary'; });
        // Return empty analysis results - these should be calculated from real data
        // Not extracted from slides or hardcoded
        return {};
    };
    /**
     * Generates charts for slides that need them
     */
    ReportAssembler.prototype.generateChartsForSlides = function (slides, companyData) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var charts, _i, slides_1, slide, _b, _c, content, chart, _d, priceData, canvasChart, lineData, lineCanvasChart, barData, barCanvasChart, pieData, pieCanvasChart, defaultData, defaultCanvasChart, error_3;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        charts = [];
                        (0, logger_1.logDebug)('ReportAssembler', "Generating charts for ".concat(slides.length, " slides"));
                        _i = 0, slides_1 = slides;
                        _e.label = 1;
                    case 1:
                        if (!(_i < slides_1.length)) return [3 /*break*/, 18];
                        slide = slides_1[_i];
                        _b = 0, _c = slide.content;
                        _e.label = 2;
                    case 2:
                        if (!(_b < _c.length)) return [3 /*break*/, 17];
                        content = _c[_b];
                        if (!(content.type === 'chart')) return [3 /*break*/, 16];
                        (0, logger_1.logDebug)('ReportAssembler', "Found chart request: type=".concat(content.data.type));
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 15, , 16]);
                        chart = void 0;
                        _d = content.data.type;
                        switch (_d) {
                            case 'candlestick': return [3 /*break*/, 4];
                            case 'line': return [3 /*break*/, 6];
                            case 'bar': return [3 /*break*/, 8];
                            case 'pie': return [3 /*break*/, 10];
                        }
                        return [3 /*break*/, 12];
                    case 4:
                        priceData = (_a = companyData.financials) === null || _a === void 0 ? void 0 : _a.historicalPrices;
                        if (!priceData || priceData.length === 0) {
                            (0, logger_1.logDebug)('ReportAssembler', 'No historical price data available for candlestick chart');
                            return [3 /*break*/, 16]; // Skip this chart if no data
                        }
                        return [4 /*yield*/, this.nodeCanvasChartGenerator.generateCandlestickChart(priceData.slice(0, 30), { width: 800, height: 400, format: 'png' })];
                    case 5:
                        canvasChart = _e.sent();
                        chart = canvasChart;
                        return [3 /*break*/, 14];
                    case 6:
                        lineData = this.prepareLineChartData(companyData);
                        if (lineData.length === 0) {
                            (0, logger_1.logDebug)('ReportAssembler', 'No data available for line chart');
                            return [3 /*break*/, 16];
                        }
                        return [4 /*yield*/, this.nodeCanvasChartGenerator.generateLineChart(lineData, ['price', 'sma20'], { width: 800, height: 400, format: 'png' })];
                    case 7:
                        lineCanvasChart = _e.sent();
                        chart = lineCanvasChart;
                        return [3 /*break*/, 14];
                    case 8:
                        barData = this.prepareBarChartData(companyData);
                        if (barData.length === 0) {
                            (0, logger_1.logDebug)('ReportAssembler', 'No data available for bar chart');
                            return [3 /*break*/, 16];
                        }
                        return [4 /*yield*/, this.nodeCanvasChartGenerator.generateBarChart(barData, 'quarter', ['revenue', 'netIncome'], { width: 800, height: 400, format: 'png' })];
                    case 9:
                        barCanvasChart = _e.sent();
                        chart = barCanvasChart;
                        return [3 /*break*/, 14];
                    case 10:
                        pieData = this.preparePieChartData(companyData);
                        if (pieData.length === 0) {
                            (0, logger_1.logDebug)('ReportAssembler', 'No data available for pie chart');
                            return [3 /*break*/, 16];
                        }
                        return [4 /*yield*/, this.nodeCanvasChartGenerator.generatePieChart(pieData, { width: 400, height: 400, format: 'png' })];
                    case 11:
                        pieCanvasChart = _e.sent();
                        chart = pieCanvasChart;
                        return [3 /*break*/, 14];
                    case 12:
                        defaultData = this.prepareLineChartData(companyData);
                        if (defaultData.length === 0) {
                            (0, logger_1.logDebug)('ReportAssembler', 'No data available for default chart');
                            return [3 /*break*/, 16];
                        }
                        return [4 /*yield*/, this.nodeCanvasChartGenerator.generateLineChart(defaultData, ['price'], { width: 800, height: 400, format: 'png' })];
                    case 13:
                        defaultCanvasChart = _e.sent();
                        chart = defaultCanvasChart;
                        _e.label = 14;
                    case 14:
                        charts.push(chart);
                        return [3 /*break*/, 16];
                    case 15:
                        error_3 = _e.sent();
                        (0, logger_1.logDebug)('ReportAssembler', "Failed to generate ".concat(content.data.type, " chart: ").concat(error_3));
                        return [3 /*break*/, 16];
                    case 16:
                        _b++;
                        return [3 /*break*/, 2];
                    case 17:
                        _i++;
                        return [3 /*break*/, 1];
                    case 18: return [2 /*return*/, charts];
                }
            });
        });
    };
    /**
     * Prepares data for line chart
     */
    ReportAssembler.prototype.prepareLineChartData = function (companyData) {
        var _this = this;
        var _a;
        var prices = (_a = companyData.financials) === null || _a === void 0 ? void 0 : _a.historicalPrices;
        if (!prices || prices.length === 0) {
            return []; // Return empty array if no data
        }
        return prices.slice(0, 30).map(function (p, i) { return ({
            date: p.date,
            price: p.close,
            sma20: _this.calculateSMA(prices.slice(0, i + 20), 20)
        }); });
    };
    /**
     * Prepares data for bar chart
     */
    ReportAssembler.prototype.prepareBarChartData = function (companyData) {
        var _this = this;
        var _a;
        var statements = ((_a = companyData.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) || [];
        if (statements.length === 0) {
            return []; // Return empty array if no data
        }
        return statements.slice(0, 4).map(function (stmt) { return ({
            quarter: _this.formatQuarter(stmt.date),
            revenue: (stmt.revenue || 0) / 1e6,
            netIncome: (stmt.netIncome || 0) / 1e6
        }); });
    };
    /**
     * Prepares data for pie chart
     */
    ReportAssembler.prototype.preparePieChartData = function (companyData) {
        var _a, _b;
        var latestIncome = (_b = (_a = companyData.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) === null || _b === void 0 ? void 0 : _b[0];
        var revenue = latestIncome === null || latestIncome === void 0 ? void 0 : latestIncome.revenue;
        if (!revenue) {
            return []; // Return empty array if no revenue data
        }
        // Without segment data, we can't create a meaningful pie chart
        // In a real implementation, this would come from segment reporting data
        return [
            { label: 'Total Revenue', value: revenue }
        ];
    };
    /**
     * Helper to calculate simple moving average
     */
    ReportAssembler.prototype.calculateSMA = function (prices, period) {
        var _a;
        if (prices.length < period)
            return ((_a = prices[prices.length - 1]) === null || _a === void 0 ? void 0 : _a.close) || 0;
        var sum = prices.slice(-period).reduce(function (acc, p) { return acc + p.close; }, 0);
        return sum / period;
    };
    /**
     * Formats date to quarter string
     */
    ReportAssembler.prototype.formatQuarter = function (dateStr) {
        var date = new Date(dateStr);
        var quarter = Math.ceil((date.getMonth() + 1) / 3);
        return "Q".concat(quarter, " ").concat(date.getFullYear());
    };
    /**
     * Generates executive summary from slides
     */
    ReportAssembler.prototype.generateExecutiveSummary = function (slides) {
        var summarySlide = slides.find(function (s) { return s.title === 'Executive Summary'; });
        if (summarySlide && summarySlide.content.length > 0) {
            var textContent = summarySlide.content[0];
            if (textContent.type === 'text' && textContent.data.text) {
                return textContent.data.text;
            }
        }
        return 'Executive summary not available';
    };
    /**
     * Validates output before generation
     */
    ReportAssembler.prototype.validateOutput = function (report) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, slide;
            return __generator(this, function (_b) {
                if (!report.slides || report.slides.length === 0) {
                    return [2 /*return*/, false];
                }
                // Validate each slide has required content
                for (_i = 0, _a = report.slides; _i < _a.length; _i++) {
                    slide = _a[_i];
                    if (!slide.title || !slide.content || slide.content.length === 0) {
                        return [2 /*return*/, false];
                    }
                }
                return [2 /*return*/, true];
            });
        });
    };
    return ReportAssembler;
}());
exports.ReportAssembler = ReportAssembler;
