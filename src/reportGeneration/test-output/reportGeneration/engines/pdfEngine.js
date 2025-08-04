"use strict";
// src/reportGeneration/engines/pdfEngine.ts
// Real PDF generation engine for regulatory-compliant reports
// Context: Creates actual PDF files with embedded charts and formatted content
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
exports.PDFEngine = void 0;
var jspdf_1 = require("jspdf");
var logger_1 = require("../../utils/logger");
/**
 * Production PDF Generation Engine
 * Creates regulatory-compliant PDF reports with real data
 */
var PDFEngine = /** @class */ (function () {
    function PDFEngine(config) {
        this.currentPage = 1;
        this.margins = {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
        };
        // Professional color scheme
        this.colors = {
            primary: '#1e293b',
            secondary: '#64748b',
            accent: '#10b981',
            danger: '#ef4444',
            warning: '#f59e0b',
            success: '#22c55e',
            text: '#0f172a',
            textLight: '#64748b',
            background: '#f8fafc',
            border: '#e2e8f0' // Slate 200
        };
        this.config = __assign({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, title: 'Investment Analysis Report', author: 'TriSight Analytics', subject: 'Equity Research Report', keywords: ['financial', 'analysis', 'investment'], creator: 'TriSight Report Generator v2.0' }, config);
        // Initialize jsPDF
        this.doc = new jspdf_1.jsPDF({
            orientation: this.config.orientation,
            unit: this.config.unit,
            format: this.config.format,
            compress: this.config.compress
        });
        // Set document properties
        this.doc.setProperties({
            title: this.config.title,
            subject: this.config.subject,
            author: this.config.author,
            keywords: this.config.keywords.join(', '),
            creator: this.config.creator
        });
        // Get page dimensions
        this.pageWidth = this.doc.internal.pageSize.getWidth();
        this.pageHeight = this.doc.internal.pageSize.getHeight();
        // Add custom fonts if needed
        this.setupFonts();
    }
    /**
     * Generates a complete PDF report
     */
    PDFEngine.prototype.generatePDF = function (companyData, analysis, slides, charts) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, slides_1, slide, pdfOutput, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebug)('PDFEngine', "Generating PDF for ".concat(companyData.ticker));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        // Add cover page
                        this.addCoverPage(companyData, analysis);
                        // Add table of contents
                        this.addTableOfContents(slides);
                        // Add executive summary
                        this.addExecutiveSummary(companyData, analysis);
                        _i = 0, slides_1 = slides;
                        _a.label = 2;
                    case 2:
                        if (!(_i < slides_1.length)) return [3 /*break*/, 5];
                        slide = slides_1[_i];
                        if (!(slide.slideNumber > 3)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processSlide(slide, charts, companyData, analysis)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        // Add disclaimers and footer
                        this.addDisclaimers();
                        pdfOutput = this.doc.output('arraybuffer');
                        return [2 /*return*/, new Uint8Array(pdfOutput)];
                    case 6:
                        error_1 = _a.sent();
                        (0, logger_1.logDebug)('PDFEngine', "Error generating PDF: ".concat(error_1));
                        throw error_1;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sets up custom fonts for professional appearance
     */
    PDFEngine.prototype.setupFonts = function () {
        // Default fonts are sufficient for now
        // In production, could add custom corporate fonts
        this.doc.setFont('helvetica');
    };
    /**
     * Adds professional cover page
     */
    PDFEngine.prototype.addCoverPage = function (data, analysis) {
        var _this = this;
        var centerX = this.pageWidth / 2;
        // Company logo placeholder
        this.doc.setFillColor(this.colors.primary);
        this.doc.rect(centerX - 30, 30, 60, 20, 'F');
        // Title
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(32);
        this.doc.setTextColor(this.colors.primary);
        this.doc.text(data.companyName, centerX, 80, { align: 'center' });
        // Subtitle
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(20);
        this.doc.setTextColor(this.colors.secondary);
        this.doc.text('Investment Analysis Report', centerX, 95, { align: 'center' });
        // Ticker and date
        this.doc.setFontSize(16);
        this.doc.text("".concat(data.ticker, " | ").concat(new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })), centerX, 110, { align: 'center' });
        // Key metrics box
        var boxY = 140;
        var boxHeight = 80;
        this.doc.setDrawColor(this.colors.border);
        this.doc.setLineWidth(0.5);
        this.doc.rect(40, boxY, this.pageWidth - 80, boxHeight);
        // Recommendation
        var recommendation = analysis.composite.recommendation.toUpperCase();
        var recColor = this.getRecommendationColor(recommendation);
        this.doc.setFillColor(recColor);
        this.doc.rect(50, boxY + 10, 60, 25, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(18);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(recommendation, 80, boxY + 27, { align: 'center' });
        // Score
        this.doc.setTextColor(this.colors.text);
        this.doc.setFontSize(24);
        this.doc.text("".concat(analysis.composite.overall, "/100"), centerX + 40, boxY + 27, { align: 'center' });
        this.doc.setFontSize(12);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text('Overall Score', centerX + 40, boxY + 35, { align: 'center' });
        // Key metrics grid
        var metricsY = boxY + 50;
        this.doc.setFontSize(14);
        var metrics = [
            { label: 'Growth', value: analysis.composite.growth },
            { label: 'Value', value: analysis.composite.value },
            { label: 'Quality', value: analysis.composite.quality },
            { label: 'Momentum', value: analysis.composite.momentum }
        ];
        metrics.forEach(function (metric, i) {
            var x = 50 + (i * 35);
            _this.doc.setFont('helvetica', 'bold');
            _this.doc.text(metric.label, x, metricsY);
            _this.doc.setFont('helvetica', 'normal');
            _this.doc.text("".concat(metric.value), x, metricsY + 8);
        });
        // Footer
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight);
        this.doc.text('Generated by TriSight Analytics', centerX, this.pageHeight - 20, { align: 'center' });
        this.addNewPage();
    };
    /**
     * Adds table of contents
     */
    PDFEngine.prototype.addTableOfContents = function (slides) {
        var _this = this;
        this.addSectionHeader('Table of Contents');
        var yPosition = 60;
        var sections = [
            { title: 'Executive Summary', page: 3 },
            { title: 'Financial Analysis', page: 4 },
            { title: 'Technical Analysis', page: 5 },
            { title: 'Valuation Metrics', page: 6 },
            { title: 'Risk Assessment', page: 7 },
            { title: 'Investment Thesis', page: 8 },
            { title: 'Appendix', page: 9 }
        ];
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(12);
        sections.forEach(function (section) {
            // Section title
            _this.doc.setTextColor(_this.colors.text);
            _this.doc.text(section.title, _this.margins.left, yPosition);
            // Dotted line
            var titleWidth = _this.doc.getTextWidth(section.title);
            var dotsStart = _this.margins.left + titleWidth + 5;
            var dotsEnd = _this.pageWidth - _this.margins.right - 20;
            for (var x = dotsStart; x < dotsEnd; x += 3) {
                _this.doc.text('.', x, yPosition);
            }
            // Page number
            _this.doc.text(section.page.toString(), _this.pageWidth - _this.margins.right - 10, yPosition);
            yPosition += 10;
        });
        this.addNewPage();
    };
    /**
     * Adds executive summary with real metrics
     */
    PDFEngine.prototype.addExecutiveSummary = function (data, analysis) {
        var _this = this;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        this.addSectionHeader('Executive Summary');
        var yPosition = 60;
        // Investment recommendation box
        var recBox = {
            x: this.margins.left,
            y: yPosition,
            width: this.pageWidth - this.margins.left - this.margins.right,
            height: 30
        };
        var recommendation = analysis.composite.recommendation.toUpperCase();
        var recColor = this.getRecommendationColor(recommendation);
        this.doc.setFillColor(recColor);
        this.doc.rect(recBox.x, recBox.y, recBox.width, recBox.height, 'F');
        this.doc.setTextColor(255, 255, 255);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(16);
        this.doc.text("Investment Recommendation: ".concat(recommendation), this.pageWidth / 2, yPosition + 18, { align: 'center' });
        yPosition += 40;
        // Key findings
        this.doc.setTextColor(this.colors.text);
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
        this.doc.text('Key Findings:', this.margins.left, yPosition);
        yPosition += 10;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);
        var findings = [
            "\u2022 Overall investment score of ".concat(analysis.composite.overall, "/100 with ").concat((analysis.composite.confidence * 100).toFixed(0), "% confidence"),
            "\u2022 ".concat(data.companyName, " shows ").concat(analysis.growth.revenueGrowth.trend, " revenue growth with ").concat(analysis.growth.revenueGrowth.yoy.toFixed(1), "% YoY increase"),
            "\u2022 Current valuation appears ".concat(analysis.valuation.valuation, " with ").concat((analysis.valuation.marginOfSafety * 100).toFixed(1), "% margin of safety"),
            "\u2022 Risk assessment indicates ".concat(this.getRiskLevel(analysis.risk.riskScore), " risk profile with beta of ").concat(analysis.risk.beta.toFixed(2)),
            "\u2022 Quality metrics show ".concat(analysis.quality.moat, " moat with ROIC of ").concat(analysis.quality.roic.toFixed(1), "%")
        ];
        findings.forEach(function (finding) {
            var lines = _this.doc.splitTextToSize(finding, _this.pageWidth - _this.margins.left - _this.margins.right - 10);
            lines.forEach(function (line) {
                _this.doc.text(line, _this.margins.left + 5, yPosition);
                yPosition += 6;
            });
        });
        yPosition += 10;
        // Financial highlights table
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(14);
        this.doc.text('Financial Highlights:', this.margins.left, yPosition);
        yPosition += 10;
        // Create metrics table
        var tableData = [
            ['Metric', 'Current', 'YoY Change', 'Assessment'],
            ['Revenue Growth', "".concat(analysis.growth.revenueGrowth.yoy.toFixed(1), "%"), "".concat(analysis.growth.revenueGrowth.trend), this.getAssessment(analysis.growth.revenueGrowth.yoy)],
            ['P/E Ratio', ((_c = (_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics) === null || _b === void 0 ? void 0 : _b.peRatio) === null || _c === void 0 ? void 0 : _c.toFixed(1)) || 'N/A', '-', this.getValuationAssessment(((_e = (_d = data.financials) === null || _d === void 0 ? void 0 : _d.keyMetrics) === null || _e === void 0 ? void 0 : _e.peRatio) || 0)],
            ['ROE', "".concat(((((_g = (_f = data.financials) === null || _f === void 0 ? void 0 : _f.keyMetrics) === null || _g === void 0 ? void 0 : _g.roe) || 0) * 100).toFixed(1), "%"), '-', this.getQualityAssessment(((_j = (_h = data.financials) === null || _h === void 0 ? void 0 : _h.keyMetrics) === null || _j === void 0 ? void 0 : _j.roe) || 0)],
            ['Debt/Equity', ((_m = (_l = (_k = data.financials) === null || _k === void 0 ? void 0 : _k.keyMetrics) === null || _l === void 0 ? void 0 : _l.debtToEquity) === null || _m === void 0 ? void 0 : _m.toFixed(2)) || 'N/A', '-', this.getLeverageAssessment(((_p = (_o = data.financials) === null || _o === void 0 ? void 0 : _o.keyMetrics) === null || _p === void 0 ? void 0 : _p.debtToEquity) || 0)]
        ];
        this.addTable(this.margins.left, yPosition, tableData);
        this.addNewPage();
    };
    /**
     * Processes individual slides
     */
    PDFEngine.prototype.processSlide = function (slide, charts, data, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var yPosition, _i, _a, content, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.addSectionHeader(slide.title);
                        yPosition = 60;
                        _i = 0, _a = slide.content;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 9];
                        content = _a[_i];
                        _b = content.type;
                        switch (_b) {
                            case 'text': return [3 /*break*/, 2];
                            case 'chart': return [3 /*break*/, 3];
                            case 'table': return [3 /*break*/, 5];
                            case 'bullets': return [3 /*break*/, 6];
                        }
                        return [3 /*break*/, 7];
                    case 2:
                        yPosition = this.addTextContent(content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 3: return [4 /*yield*/, this.addChartContent(content.data, charts, yPosition)];
                    case 4:
                        yPosition = _c.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        yPosition = this.addTableContent(content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 6:
                        yPosition = this.addBulletPoints(content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 7:
                        // Check if we need a new page
                        if (yPosition > this.pageHeight - 50) {
                            this.addNewPage();
                            yPosition = 60;
                        }
                        _c.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 1];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds text content to PDF
     */
    PDFEngine.prototype.addTextContent = function (data, yPosition) {
        var _this = this;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);
        this.doc.setTextColor(this.colors.text);
        if (data.title) {
            this.doc.setFont('helvetica', 'bold');
            this.doc.setFontSize(14);
            this.doc.text(data.title, this.margins.left, yPosition);
            yPosition += 10;
        }
        if (data.text) {
            this.doc.setFont('helvetica', 'normal');
            this.doc.setFontSize(11);
            var lines = this.doc.splitTextToSize(data.text, this.pageWidth - this.margins.left - this.margins.right);
            lines.forEach(function (line) {
                _this.doc.text(line, _this.margins.left, yPosition);
                yPosition += 6;
            });
        }
        if (data.bullets) {
            yPosition = this.addBulletPoints({ items: data.bullets }, yPosition);
        }
        return yPosition + 10;
    };
    /**
     * Adds chart to PDF
     */
    PDFEngine.prototype.addChartContent = function (data, charts, yPosition) {
        return __awaiter(this, void 0, void 0, function () {
            var chart, chartWidth, chartHeight, imageFormat;
            return __generator(this, function (_a) {
                chart = charts.find(function (c) { return c.type === data.type; });
                (0, logger_1.logDebug)('PDFEngine', "addChartContent called with data.type=".concat(data.type, ", found chart=").concat(!!chart, ", charts.length=").concat(charts.length));
                if (chart) {
                    try {
                        chartWidth = this.pageWidth - this.margins.left - this.margins.right;
                        chartHeight = 100;
                        if (chart.format === 'svg') {
                            // For SVG charts, we need to convert to PNG for better PDF compatibility
                            // In a real implementation, we'd use node-canvas or similar to convert SVG to PNG
                            (0, logger_1.logDebug)('PDFEngine', 'SVG chart detected - conversion to PNG needed for PDF embedding');
                            // For now, we'll skip SVG charts as jsPDF has limited SVG support
                            // A proper implementation would:
                            // 1. Use node-canvas to render SVG to Canvas
                            // 2. Export Canvas to PNG
                            // 3. Embed PNG in PDF
                            // Placeholder for chart
                            this.doc.setDrawColor(this.colors.border);
                            this.doc.setLineWidth(0.5);
                            this.doc.rect(this.margins.left, yPosition, chartWidth, chartHeight);
                            // Add chart title in center
                            this.doc.setTextColor(this.colors.textLight);
                            this.doc.setFontSize(10);
                            this.doc.text("[".concat(data.title || 'Chart', " - ").concat(data.type, "]"), this.pageWidth / 2, yPosition + chartHeight / 2, { align: 'center' });
                            return [2 /*return*/, yPosition + chartHeight + 10];
                        }
                        else if (chart.format === 'png' || chart.format === 'jpeg') {
                            imageFormat = chart.format.toUpperCase();
                            // Add the image
                            this.doc.addImage(chart.data, // Base64 data
                            imageFormat, this.margins.left, yPosition, chartWidth, chartHeight);
                            return [2 /*return*/, yPosition + chartHeight + 10];
                        }
                    }
                    catch (error) {
                        (0, logger_1.logDebug)('PDFEngine', "Failed to embed chart: ".concat(error));
                        // Fallback: render chart placeholder with title
                        this.doc.setDrawColor(this.colors.border);
                        this.doc.setLineWidth(0.5);
                        this.doc.rect(this.margins.left, yPosition, this.pageWidth - this.margins.left - this.margins.right, 100);
                        // Add chart title in center
                        this.doc.setTextColor(this.colors.textLight);
                        this.doc.setFontSize(10);
                        this.doc.text("[".concat(data.title || 'Chart', " - ").concat(data.type, "]"), this.pageWidth / 2, yPosition + 50, { align: 'center' });
                        return [2 /*return*/, yPosition + 110];
                    }
                }
                // No chart found, skip
                return [2 /*return*/, yPosition];
            });
        });
    };
    /**
     * Adds table to PDF
     */
    PDFEngine.prototype.addTableContent = function (data, yPosition) {
        if (!data.headers || !data.rows)
            return yPosition;
        var tableData = __spreadArray([data.headers], data.rows, true);
        return this.addTable(this.margins.left, yPosition, tableData) + 10;
    };
    /**
     * Adds bullet points
     */
    PDFEngine.prototype.addBulletPoints = function (data, yPosition) {
        var _this = this;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(11);
        this.doc.setTextColor(this.colors.text);
        var items = data.items || [];
        items.forEach(function (item) {
            _this.doc.text('•', _this.margins.left, yPosition);
            var lines = _this.doc.splitTextToSize(item, _this.pageWidth - _this.margins.left - _this.margins.right - 10);
            lines.forEach(function (line, i) {
                _this.doc.text(line, _this.margins.left + 10, yPosition + (i * 6));
            });
            yPosition += lines.length * 6 + 3;
        });
        return yPosition;
    };
    /**
     * Adds a formatted table
     */
    PDFEngine.prototype.addTable = function (x, y, data) {
        var _this = this;
        var cellWidth = (this.pageWidth - this.margins.left - this.margins.right) / data[0].length;
        var cellHeight = 8;
        var currentY = y;
        // Draw table
        data.forEach(function (row, rowIndex) {
            var currentX = x;
            row.forEach(function (cell, colIndex) {
                // Cell background for header
                if (rowIndex === 0) {
                    _this.doc.setFillColor(_this.colors.primary);
                    _this.doc.rect(currentX, currentY, cellWidth, cellHeight, 'F');
                    _this.doc.setTextColor(255, 255, 255);
                    _this.doc.setFont('helvetica', 'bold');
                }
                else {
                    _this.doc.setDrawColor(_this.colors.border);
                    _this.doc.rect(currentX, currentY, cellWidth, cellHeight);
                    _this.doc.setTextColor(_this.colors.text);
                    _this.doc.setFont('helvetica', 'normal');
                }
                // Center text in cell
                _this.doc.setFontSize(10);
                var textWidth = _this.doc.getTextWidth(cell);
                var textX = currentX + (cellWidth - textWidth) / 2;
                _this.doc.text(cell, textX, currentY + 5.5);
                currentX += cellWidth;
            });
            currentY += cellHeight;
        });
        return currentY;
    };
    /**
     * Adds section header
     */
    PDFEngine.prototype.addSectionHeader = function (title) {
        this.doc.setFont('helvetica', 'bold');
        this.doc.setFontSize(18);
        this.doc.setTextColor(this.colors.primary);
        this.doc.text(title, this.margins.left, 40);
        // Add horizontal line
        this.doc.setDrawColor(this.colors.accent);
        this.doc.setLineWidth(1);
        this.doc.line(this.margins.left, 45, this.pageWidth - this.margins.right, 45);
        // Add page number
        this.addPageNumber();
    };
    /**
     * Adds disclaimers page
     */
    PDFEngine.prototype.addDisclaimers = function () {
        var _this = this;
        this.addNewPage();
        this.addSectionHeader('Important Disclaimers');
        var disclaimers = [
            'This report is for informational purposes only and does not constitute investment advice.',
            'Past performance is not indicative of future results.',
            'All investments carry risk, including the potential loss of principal.',
            'The analysis and recommendations in this report are based on publicly available information.',
            'TriSight Analytics does not guarantee the accuracy or completeness of the information.',
            'Investors should conduct their own due diligence before making investment decisions.',
            'This report may contain forward-looking statements subject to risks and uncertainties.'
        ];
        var yPosition = 60;
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight);
        disclaimers.forEach(function (disclaimer, i) {
            var lines = _this.doc.splitTextToSize("".concat(i + 1, ". ").concat(disclaimer), _this.pageWidth - _this.margins.left - _this.margins.right);
            lines.forEach(function (line) {
                _this.doc.text(line, _this.margins.left, yPosition);
                yPosition += 6;
            });
            yPosition += 4;
        });
        // Add generation timestamp
        yPosition += 20;
        this.doc.setFont('helvetica', 'italic');
        this.doc.setFontSize(9);
        this.doc.text("Report generated on ".concat(new Date().toLocaleString(), " by TriSight Analytics v2.0"), this.pageWidth / 2, yPosition, { align: 'center' });
    };
    /**
     * Adds new page and increments counter
     */
    PDFEngine.prototype.addNewPage = function () {
        this.doc.addPage();
        this.currentPage++;
    };
    /**
     * Adds page number to current page
     */
    PDFEngine.prototype.addPageNumber = function () {
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        this.doc.setTextColor(this.colors.textLight);
        this.doc.text("Page ".concat(this.currentPage), this.pageWidth - this.margins.right, this.pageHeight - 10, { align: 'right' });
    };
    /**
     * Helper methods for assessments
     */
    PDFEngine.prototype.getRecommendationColor = function (recommendation) {
        switch (recommendation) {
            case 'STRONGBUY': return this.colors.success;
            case 'BUY': return this.colors.accent;
            case 'HOLD': return this.colors.warning;
            case 'SELL': return this.colors.danger;
            case 'STRONGSELL': return this.colors.danger;
            default: return this.colors.secondary;
        }
    };
    PDFEngine.prototype.getRiskLevel = function (score) {
        if (score < 30)
            return 'low';
        if (score < 60)
            return 'moderate';
        return 'high';
    };
    PDFEngine.prototype.getAssessment = function (value) {
        if (value > 20)
            return 'Strong';
        if (value > 10)
            return 'Good';
        if (value > 0)
            return 'Moderate';
        if (value > -10)
            return 'Weak';
        return 'Poor';
    };
    PDFEngine.prototype.getValuationAssessment = function (pe) {
        if (pe < 15)
            return 'Undervalued';
        if (pe < 25)
            return 'Fair';
        if (pe < 35)
            return 'Premium';
        return 'Overvalued';
    };
    PDFEngine.prototype.getQualityAssessment = function (roe) {
        if (roe > 0.20)
            return 'Excellent';
        if (roe > 0.15)
            return 'Good';
        if (roe > 0.10)
            return 'Average';
        return 'Poor';
    };
    PDFEngine.prototype.getLeverageAssessment = function (de) {
        if (de < 0.5)
            return 'Conservative';
        if (de < 1.0)
            return 'Moderate';
        if (de < 2.0)
            return 'Aggressive';
        return 'High Risk';
    };
    /**
     * Saves PDF to file (for Node.js environment)
     */
    PDFEngine.prototype.saveToFile = function (pdfData, filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var writeFileSync, blob, url, a;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof window === 'undefined')) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('fs')); })];
                    case 1:
                        writeFileSync = (_a.sent()).writeFileSync;
                        writeFileSync(filepath, Buffer.from(pdfData));
                        return [3 /*break*/, 3];
                    case 2:
                        blob = new Blob([pdfData], { type: 'application/pdf' });
                        url = URL.createObjectURL(blob);
                        a = document.createElement('a');
                        a.href = url;
                        a.download = filepath.split('/').pop() || 'report.pdf';
                        a.click();
                        URL.revokeObjectURL(url);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PDFEngine;
}());
exports.PDFEngine = PDFEngine;
