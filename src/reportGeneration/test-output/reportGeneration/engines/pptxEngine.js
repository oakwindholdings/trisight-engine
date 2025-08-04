"use strict";
// src/reportGeneration/engines/pptxEngine.ts
// Real PPTX generation engine for regulatory-compliant presentations
// Context: Creates actual PowerPoint files with embedded charts and formatted content
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.PPTXEngine = void 0;
var pptxgenjs_1 = __importDefault(require("pptxgenjs"));
var logger_1 = require("../../utils/logger");
/**
 * Production PPTX Generation Engine
 * Creates regulatory-compliant PowerPoint presentations with real data
 */
var PPTXEngine = /** @class */ (function () {
    function PPTXEngine(themeName) {
        if (themeName === void 0) { themeName = 'professional'; }
        this.slideWidth = 10; // inches
        this.slideHeight = 7.5; // inches
        // Professional themes
        this.themes = {
            professional: {
                name: 'Professional',
                primary: '1E293B',
                secondary: '64748B',
                accent: '10B981',
                background: 'FFFFFF',
                titleFont: 'Arial',
                bodyFont: 'Arial',
                success: '22C55E',
                warning: 'F59E0B',
                danger: 'EF4444'
            },
            modern: {
                name: 'Modern',
                primary: '0F172A',
                secondary: '475569',
                accent: '3B82F6',
                background: 'F8FAFC',
                titleFont: 'Calibri',
                bodyFont: 'Calibri',
                success: '10B981',
                warning: 'F59E0B',
                danger: 'DC2626'
            }
        };
        this.pptx = new pptxgenjs_1["default"]();
        this.theme = this.themes[themeName];
        // Set presentation properties
        this.pptx.author = 'TriSight Analytics';
        this.pptx.company = 'TriSight';
        this.pptx.subject = 'Investment Analysis Report';
        this.pptx.title = 'Equity Research Presentation';
        // Define layouts
        this.defineLayouts();
        // Set default slide size (16:9 widescreen)
        this.pptx.defineLayout({ name: 'LAYOUT_16x9', width: this.slideWidth, height: this.slideHeight });
        this.pptx.layout = 'LAYOUT_16x9';
    }
    /**
     * Generates a complete PPTX presentation
     */
    PPTXEngine.prototype.generatePPTX = function (companyData, analysis, slides, charts) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, slides_1, slide, pptxData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebug)('PPTXEngine', "Generating PPTX for ".concat(companyData.ticker));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        // Add title slide
                        this.addTitleSlide(companyData, analysis);
                        // Add executive summary
                        this.addExecutiveSummarySlide(companyData, analysis);
                        // Add agenda slide
                        this.addAgendaSlide();
                        _i = 0, slides_1 = slides;
                        _a.label = 2;
                    case 2:
                        if (!(_i < slides_1.length)) return [3 /*break*/, 5];
                        slide = slides_1[_i];
                        if (!(slide.slideNumber > 3)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.processContentSlide(slide, charts, companyData, analysis)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        // Add conclusion slide
                        this.addConclusionSlide(companyData, analysis);
                        // Add disclaimers
                        this.addDisclaimersSlide();
                        return [4 /*yield*/, this.pptx.write({ outputType: 'arraybuffer' })];
                    case 6:
                        pptxData = _a.sent();
                        return [2 /*return*/, new Uint8Array(pptxData)];
                    case 7:
                        error_1 = _a.sent();
                        (0, logger_1.logDebug)('PPTXEngine', "Error generating PPTX: ".concat(error_1));
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Defines master slide layouts
     */
    PPTXEngine.prototype.defineLayouts = function () {
        // Title slide master
        this.pptx.defineSlideMaster({
            title: 'TITLE_SLIDE',
            background: { color: this.theme.background },
            objects: [
                {
                    placeholder: {
                        options: {
                            name: 'title',
                            type: 'title',
                            x: 0.5,
                            y: 2.0,
                            w: 9,
                            h: 2,
                            fontSize: 44,
                            bold: true,
                            color: this.theme.primary,
                            align: 'center',
                            fontFace: this.theme.titleFont
                        },
                        text: 'Title Placeholder'
                    }
                }
            ]
        });
        // Content slide master
        this.pptx.defineSlideMaster({
            title: 'CONTENT_SLIDE',
            background: { color: this.theme.background },
            objects: [
                // Header bar
                {
                    rect: {
                        x: 0,
                        y: 0,
                        w: this.slideWidth,
                        h: 0.75,
                        fill: { color: this.theme.primary }
                    }
                },
                // Title placeholder
                {
                    placeholder: {
                        options: {
                            name: 'title',
                            type: 'title',
                            x: 0.5,
                            y: 0.1,
                            w: 9,
                            h: 0.5,
                            fontSize: 24,
                            bold: true,
                            color: 'FFFFFF',
                            fontFace: this.theme.titleFont
                        },
                        text: 'Slide Title'
                    }
                },
                // Footer
                {
                    text: {
                        text: 'TriSight Analytics',
                        options: {
                            x: 0.5,
                            y: 7.0,
                            w: 2,
                            h: 0.3,
                            fontSize: 10,
                            color: this.theme.secondary,
                            fontFace: this.theme.bodyFont
                        }
                    }
                }
            ]
        });
    };
    /**
     * Adds professional title slide
     */
    PPTXEngine.prototype.addTitleSlide = function (data, analysis) {
        var slide = this.pptx.addSlide({ masterName: 'TITLE_SLIDE' });
        // Company name
        slide.addText(data.companyName, {
            x: 0.5,
            y: 1.5,
            w: 9,
            h: 1,
            fontSize: 48,
            bold: true,
            color: this.theme.primary,
            align: 'center',
            fontFace: this.theme.titleFont
        });
        // Subtitle
        slide.addText('Investment Analysis Report', {
            x: 0.5,
            y: 2.7,
            w: 9,
            h: 0.5,
            fontSize: 28,
            color: this.theme.secondary,
            align: 'center',
            fontFace: this.theme.bodyFont
        });
        // Ticker and date
        slide.addText("".concat(data.ticker, " | ").concat(new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })), {
            x: 0.5,
            y: 3.5,
            w: 9,
            h: 0.5,
            fontSize: 20,
            color: this.theme.secondary,
            align: 'center',
            fontFace: this.theme.bodyFont
        });
        // Recommendation box
        var recommendation = analysis.composite.recommendation.toUpperCase();
        var recColor = this.getRecommendationColor(recommendation);
        slide.addShape('rect', {
            x: 3.5,
            y: 4.5,
            w: 3,
            h: 0.8,
            fill: { color: recColor },
            line: { color: recColor, width: 2 }
        });
        slide.addText(recommendation, {
            x: 3.5,
            y: 4.5,
            w: 3,
            h: 0.8,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            fontFace: this.theme.titleFont
        });
        // Score
        slide.addText("Overall Score: ".concat(analysis.composite.overall, "/100"), {
            x: 0.5,
            y: 5.5,
            w: 9,
            h: 0.5,
            fontSize: 22,
            color: this.theme.primary,
            align: 'center',
            fontFace: this.theme.bodyFont
        });
        // Footer
        slide.addText('Generated by TriSight Analytics', {
            x: 0.5,
            y: 6.8,
            w: 9,
            h: 0.3,
            fontSize: 12,
            color: this.theme.secondary,
            align: 'center',
            fontFace: this.theme.bodyFont,
            italic: true
        });
    };
    /**
     * Adds executive summary slide
     */
    PPTXEngine.prototype.addExecutiveSummarySlide = function (data, analysis) {
        var _this = this;
        var slide = this.pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
        slide.addText('Executive Summary', {
            x: 0.5,
            y: 0.1,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: this.theme.titleFont
        });
        // Key metrics grid
        var metrics = [
            { label: 'Growth Score', value: analysis.composite.growth, color: this.getScoreColor(analysis.composite.growth) },
            { label: 'Value Score', value: analysis.composite.value, color: this.getScoreColor(analysis.composite.value) },
            { label: 'Quality Score', value: analysis.composite.quality, color: this.getScoreColor(analysis.composite.quality) },
            { label: 'Momentum Score', value: analysis.composite.momentum, color: this.getScoreColor(analysis.composite.momentum) }
        ];
        metrics.forEach(function (metric, i) {
            var x = 0.5 + (i % 2) * 4.75;
            var y = 1.0 + Math.floor(i / 2) * 1.5;
            // Metric box
            slide.addShape('rect', {
                x: x,
                y: y,
                w: 4.5,
                h: 1.3,
                fill: { color: 'F8FAFC' },
                line: { color: metric.color, width: 2 }
            });
            // Metric label
            slide.addText(metric.label, {
                x: x + 0.2,
                y: y + 0.1,
                w: 4.1,
                h: 0.4,
                fontSize: 14,
                bold: true,
                color: _this.theme.primary,
                fontFace: _this.theme.bodyFont
            });
            // Metric value
            slide.addText(metric.value.toString(), {
                x: x + 0.2,
                y: y + 0.5,
                w: 4.1,
                h: 0.6,
                fontSize: 36,
                bold: true,
                color: metric.color,
                fontFace: _this.theme.titleFont
            });
        });
        // Key findings
        var findings = [
            "Revenue growth of ".concat(analysis.growth.revenueGrowth.yoy.toFixed(1), "% YoY with ").concat(analysis.growth.revenueGrowth.trend, " trend"),
            "Valuation appears ".concat(analysis.valuation.valuation, " with ").concat((analysis.valuation.marginOfSafety * 100).toFixed(1), "% margin of safety"),
            "".concat(analysis.quality.moat.charAt(0).toUpperCase() + analysis.quality.moat.slice(1), " competitive moat with ROIC of ").concat(analysis.quality.roic.toFixed(1), "%"),
            "Risk profile: ".concat(this.getRiskLevel(analysis.risk.riskScore), " (Beta: ").concat(analysis.risk.beta.toFixed(2), ", Volatility: ").concat((analysis.risk.volatility * 100).toFixed(1), "%)")
        ];
        slide.addText(findings, {
            x: 0.5,
            y: 4.2,
            w: 9,
            h: 2.5,
            fontSize: 16,
            color: this.theme.primary,
            fontFace: this.theme.bodyFont,
            bullet: { type: 'bullet', color: this.theme.accent },
            lineSpacing: 24
        });
    };
    /**
     * Adds agenda slide
     */
    PPTXEngine.prototype.addAgendaSlide = function () {
        var _this = this;
        var slide = this.pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
        slide.addText('Agenda', {
            x: 0.5,
            y: 0.1,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: this.theme.titleFont
        });
        var sections = [
            'Executive Summary',
            'Company Overview',
            'Financial Analysis',
            'Valuation Metrics',
            'Technical Analysis',
            'Risk Assessment',
            'Investment Thesis',
            'Recommendations'
        ];
        sections.forEach(function (section, i) {
            // Number circle
            slide.addShape('ellipse', {
                x: 1.0,
                y: 1.2 + (i * 0.7),
                w: 0.5,
                h: 0.5,
                fill: { color: _this.theme.accent },
                line: 'none'
            });
            slide.addText((i + 1).toString(), {
                x: 1.0,
                y: 1.2 + (i * 0.7),
                w: 0.5,
                h: 0.5,
                fontSize: 16,
                bold: true,
                color: 'FFFFFF',
                align: 'center',
                valign: 'middle',
                fontFace: _this.theme.titleFont
            });
            // Section title
            slide.addText(section, {
                x: 1.8,
                y: 1.2 + (i * 0.7),
                w: 7,
                h: 0.5,
                fontSize: 18,
                color: _this.theme.primary,
                valign: 'middle',
                fontFace: _this.theme.bodyFont
            });
        });
    };
    /**
     * Processes content slides
     */
    PPTXEngine.prototype.processContentSlide = function (slide, charts, data, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var pptxSlide, yPosition, _i, _a, content, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        pptxSlide = this.pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
                        // Add title
                        pptxSlide.addText(slide.title, {
                            x: 0.5,
                            y: 0.1,
                            w: 9,
                            h: 0.5,
                            fontSize: 24,
                            bold: true,
                            color: 'FFFFFF',
                            fontFace: this.theme.titleFont
                        });
                        yPosition = 1.0;
                        _i = 0, _a = slide.content;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
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
                        yPosition = this.addTextContent(pptxSlide, content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 3: return [4 /*yield*/, this.addChartContent(pptxSlide, content.data, charts, yPosition)];
                    case 4:
                        yPosition = _c.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        yPosition = this.addTableContent(pptxSlide, content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 6:
                        yPosition = this.addBulletContent(pptxSlide, content.data, yPosition);
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 1];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adds text content to slide
     */
    PPTXEngine.prototype.addTextContent = function (slide, data, yPosition) {
        if (data.title) {
            slide.addText(data.title, {
                x: 0.5,
                y: yPosition,
                w: 9,
                h: 0.5,
                fontSize: 20,
                bold: true,
                color: this.theme.primary,
                fontFace: this.theme.titleFont
            });
            yPosition += 0.6;
        }
        if (data.text) {
            slide.addText(data.text, {
                x: 0.5,
                y: yPosition,
                w: 9,
                h: 'auto',
                fontSize: 16,
                color: this.theme.primary,
                fontFace: this.theme.bodyFont,
                lineSpacing: 20
            });
            yPosition += 1.0;
        }
        if (data.bullets) {
            return this.addBulletContent(slide, { items: data.bullets }, yPosition);
        }
        return yPosition + 0.3;
    };
    /**
     * Adds chart content to slide
     */
    PPTXEngine.prototype.addChartContent = function (slide, data, charts, yPosition) {
        return __awaiter(this, void 0, void 0, function () {
            var chart;
            return __generator(this, function (_a) {
                chart = charts.find(function (c) { return c.type === data.type; });
                if (chart) {
                    // For SVG charts, we'd need to convert to image first
                    // For now, add a placeholder with chart info
                    slide.addShape('rect', {
                        x: 1.0,
                        y: yPosition,
                        w: 8,
                        h: 4,
                        fill: { color: 'F8FAFC' },
                        line: { color: this.theme.secondary, width: 1 }
                    });
                    slide.addText("[".concat(data.title || data.type.toUpperCase(), " CHART]"), {
                        x: 1.0,
                        y: yPosition + 1.8,
                        w: 8,
                        h: 0.4,
                        fontSize: 14,
                        color: this.theme.secondary,
                        align: 'center',
                        fontFace: this.theme.bodyFont,
                        italic: true
                    });
                    return [2 /*return*/, yPosition + 4.5];
                }
                return [2 /*return*/, yPosition];
            });
        });
    };
    /**
     * Adds table content to slide
     */
    PPTXEngine.prototype.addTableContent = function (slide, data, yPosition) {
        var _this = this;
        if (!data.headers || !data.rows)
            return yPosition;
        var tableData = [];
        // Add headers
        tableData.push(data.headers.map(function (header) { return ({
            text: header,
            options: {
                fontSize: 14,
                bold: true,
                color: 'FFFFFF',
                fill: { color: _this.theme.primary }
            }
        }); }));
        // Add rows
        data.rows.forEach(function (row, i) {
            tableData.push(row.map(function (cell) { return ({
                text: cell,
                options: {
                    fontSize: 12,
                    color: _this.theme.primary,
                    fill: { color: i % 2 === 0 ? 'FFFFFF' : 'F8FAFC' }
                }
            }); }));
        });
        slide.addTable(tableData, {
            x: 0.5,
            y: yPosition,
            w: 9,
            fontSize: 12,
            border: { type: 'solid', color: this.theme.secondary, pt: 0.5 },
            align: 'center',
            valign: 'middle'
        });
        return yPosition + 0.5 + (tableData.length * 0.4);
    };
    /**
     * Adds bullet points to slide
     */
    PPTXEngine.prototype.addBulletContent = function (slide, data, yPosition) {
        var items = data.items || [];
        slide.addText(items, {
            x: 0.5,
            y: yPosition,
            w: 9,
            h: 'auto',
            fontSize: 16,
            color: this.theme.primary,
            fontFace: this.theme.bodyFont,
            bullet: { type: 'bullet', color: this.theme.accent },
            lineSpacing: 22
        });
        return yPosition + (items.length * 0.5) + 0.3;
    };
    /**
     * Adds conclusion slide
     */
    PPTXEngine.prototype.addConclusionSlide = function (data, analysis) {
        var slide = this.pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
        slide.addText('Investment Conclusion', {
            x: 0.5,
            y: 0.1,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: this.theme.titleFont
        });
        // Recommendation summary
        var recommendation = analysis.composite.recommendation.toUpperCase();
        var recColor = this.getRecommendationColor(recommendation);
        slide.addShape('rect', {
            x: 0.5,
            y: 1.0,
            w: 9,
            h: 1.2,
            fill: { color: recColor },
            line: 'none'
        });
        slide.addText("Recommendation: ".concat(recommendation), {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 0.8,
            fontSize: 32,
            bold: true,
            color: 'FFFFFF',
            align: 'center',
            valign: 'middle',
            fontFace: this.theme.titleFont
        });
        // Key takeaways
        var takeaways = [
            "Overall investment score: ".concat(analysis.composite.overall, "/100"),
            "Confidence level: ".concat((analysis.composite.confidence * 100).toFixed(0), "%"),
            "Primary strength: ".concat(this.getPrimaryStrength(analysis)),
            "Primary concern: ".concat(this.getPrimaryConcern(analysis)),
            "Time horizon: ".concat(this.getTimeHorizon(analysis))
        ];
        slide.addText('Key Takeaways:', {
            x: 0.5,
            y: 2.5,
            w: 9,
            h: 0.5,
            fontSize: 20,
            bold: true,
            color: this.theme.primary,
            fontFace: this.theme.titleFont
        });
        slide.addText(takeaways, {
            x: 0.5,
            y: 3.2,
            w: 9,
            h: 3,
            fontSize: 18,
            color: this.theme.primary,
            fontFace: this.theme.bodyFont,
            bullet: { type: 'bullet', color: this.theme.accent },
            lineSpacing: 26
        });
    };
    /**
     * Adds disclaimers slide
     */
    PPTXEngine.prototype.addDisclaimersSlide = function () {
        var slide = this.pptx.addSlide({ masterName: 'CONTENT_SLIDE' });
        slide.addText('Important Disclaimers', {
            x: 0.5,
            y: 0.1,
            w: 9,
            h: 0.5,
            fontSize: 24,
            bold: true,
            color: 'FFFFFF',
            fontFace: this.theme.titleFont
        });
        var disclaimers = [
            'This presentation is for informational purposes only and does not constitute investment advice',
            'Past performance is not indicative of future results',
            'All investments carry risk, including the potential loss of principal',
            'The analysis is based on publicly available information and may not be complete',
            'Investors should conduct their own due diligence before making investment decisions',
            'Forward-looking statements are subject to risks and uncertainties'
        ];
        slide.addText(disclaimers, {
            x: 0.5,
            y: 1.2,
            w: 9,
            h: 5,
            fontSize: 14,
            color: this.theme.secondary,
            fontFace: this.theme.bodyFont,
            bullet: { type: 'bullet', color: this.theme.secondary },
            lineSpacing: 24
        });
        // Footer
        slide.addText("Generated on ".concat(new Date().toLocaleString(), " by TriSight Analytics v2.0"), {
            x: 0.5,
            y: 6.8,
            w: 9,
            h: 0.3,
            fontSize: 10,
            color: this.theme.secondary,
            align: 'center',
            fontFace: this.theme.bodyFont,
            italic: true
        });
    };
    /**
     * Helper methods
     */
    PPTXEngine.prototype.getRecommendationColor = function (recommendation) {
        switch (recommendation) {
            case 'STRONGBUY': return this.theme.success;
            case 'BUY': return this.theme.accent;
            case 'HOLD': return this.theme.warning;
            case 'SELL': return this.theme.danger;
            case 'STRONGSELL': return this.theme.danger;
            default: return this.theme.secondary;
        }
    };
    PPTXEngine.prototype.getScoreColor = function (score) {
        if (score >= 80)
            return this.theme.success;
        if (score >= 60)
            return this.theme.accent;
        if (score >= 40)
            return this.theme.warning;
        return this.theme.danger;
    };
    PPTXEngine.prototype.getRiskLevel = function (score) {
        if (score < 30)
            return 'Low';
        if (score < 60)
            return 'Moderate';
        return 'High';
    };
    PPTXEngine.prototype.getPrimaryStrength = function (analysis) {
        var scores = {
            growth: analysis.composite.growth,
            value: analysis.composite.value,
            quality: analysis.composite.quality,
            momentum: analysis.composite.momentum
        };
        var highest = Object.entries(scores).reduce(function (a, b) {
            return a[1] > b[1] ? a : b;
        });
        return "".concat(highest[0].charAt(0).toUpperCase() + highest[0].slice(1), " (").concat(highest[1], "/100)");
    };
    PPTXEngine.prototype.getPrimaryConcern = function (analysis) {
        if (analysis.risk.riskScore > 70)
            return 'High risk profile';
        if (analysis.valuation.valuation === 'overvalued')
            return 'Valuation concerns';
        if (analysis.quality.balanceSheetStrength < 50)
            return 'Balance sheet weakness';
        if (analysis.growth.revenueGrowth.trend === 'decelerating')
            return 'Slowing growth';
        return 'Limited concerns';
    };
    PPTXEngine.prototype.getTimeHorizon = function (analysis) {
        if (analysis.composite.momentum > 70)
            return 'Short-term (3-6 months)';
        if (analysis.quality.moat === 'wide')
            return 'Long-term (3-5 years)';
        return 'Medium-term (1-2 years)';
    };
    /**
     * Saves PPTX to file
     */
    PPTXEngine.prototype.saveToFile = function (pptxData, filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var fs, blob, url, a;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof window === 'undefined')) return [3 /*break*/, 2];
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('fs')); })];
                    case 1:
                        fs = _a.sent();
                        fs.writeFileSync(filepath, Buffer.from(pptxData));
                        return [3 /*break*/, 3];
                    case 2:
                        blob = new Blob([pptxData], {
                            type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
                        });
                        url = URL.createObjectURL(blob);
                        a = document.createElement('a');
                        a.href = url;
                        a.download = filepath.split('/').pop() || 'report.pptx';
                        a.click();
                        URL.revokeObjectURL(url);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PPTXEngine;
}());
exports.PPTXEngine = PPTXEngine;
