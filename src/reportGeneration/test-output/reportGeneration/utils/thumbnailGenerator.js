"use strict";
// src/reportGeneration/utils/thumbnailGenerator.ts  
// Generates thumbnail previews for reports
// Context: Creates visual previews of report first pages
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
exports.ThumbnailGenerator = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Generates thumbnail previews of reports
 */
var ThumbnailGenerator = /** @class */ (function () {
    function ThumbnailGenerator() {
        this.defaultOptions = {
            width: 200,
            height: 150,
            quality: 0.8,
            format: 'jpeg'
        };
    }
    /**
     * Generate thumbnail from report
     */
    ThumbnailGenerator.prototype.generateFromReport = function (report, options) {
        return __awaiter(this, void 0, void 0, function () {
            var opts, titleSlide, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = __assign(__assign({}, this.defaultOptions), options);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        titleSlide = report.slides.find(function (s) { return s.layout === 'title'; }) || report.slides[0];
                        if (!titleSlide) {
                            return [2 /*return*/, this.generatePlaceholder(report.config.ticker || 'Report', opts)];
                        }
                        return [4 /*yield*/, this.generateFromSlide(titleSlide, report, opts)];
                    case 2: 
                    // Generate thumbnail from slide content
                    return [2 /*return*/, _a.sent()];
                    case 3:
                        error_1 = _a.sent();
                        (0, logger_1.logDebug)('ThumbnailGenerator', "Failed to generate thumbnail: ".concat(error_1));
                        return [2 /*return*/, this.generatePlaceholder(report.config.ticker || 'Report', opts)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate thumbnail from a specific slide
     */
    ThumbnailGenerator.prototype.generateFromSlide = function (slide, report, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (typeof window === 'undefined') {
                    // Node.js environment - use node-canvas
                    return [2 /*return*/, this.generateNodeCanvasThumbnail(slide, report, options)];
                }
                else {
                    // Browser environment - use HTML Canvas
                    return [2 /*return*/, this.generateBrowserThumbnail(slide, report, options)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate thumbnail in browser environment
     */
    ThumbnailGenerator.prototype.generateBrowserThumbnail = function (slide, report, options) {
        var _a;
        var canvas = document.createElement('canvas');
        canvas.width = options.width;
        canvas.height = options.height;
        var ctx = canvas.getContext('2d');
        if (!ctx) {
            return this.generatePlaceholder(report.config.ticker || 'Report', options);
        }
        // Fill background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, options.width, options.height);
        // Draw border
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, options.width, options.height);
        // Draw company name
        var companyName = ((_a = report.companyData) === null || _a === void 0 ? void 0 : _a.companyName) || report.config.ticker || 'Report';
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(companyName, options.width / 2, 30);
        // Draw ticker
        if (report.config.ticker) {
            ctx.font = '12px Arial';
            ctx.fillStyle = '#64748b';
            ctx.fillText(report.config.ticker, options.width / 2, 50);
        }
        // Draw slide title
        ctx.font = '14px Arial';
        ctx.fillStyle = '#374151';
        var lines = this.wrapText(ctx, slide.title, options.width - 20);
        lines.forEach(function (line, i) {
            ctx.fillText(line, options.width / 2, 80 + (i * 20));
        });
        // Draw report type badge
        if (report.config.reportType) {
            var badge = report.config.reportType.toUpperCase();
            ctx.font = 'bold 10px Arial';
            var badgeWidth = ctx.measureText(badge).width + 10;
            // Badge background
            ctx.fillStyle = '#10b981';
            ctx.fillRect(options.width - badgeWidth - 10, 10, badgeWidth, 20);
            // Badge text
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.fillText(badge, options.width - 15, 24);
        }
        // Add date
        ctx.font = '10px Arial';
        ctx.fillStyle = '#9ca3af';
        ctx.textAlign = 'center';
        var date = new Date().toLocaleDateString();
        ctx.fillText(date, options.width / 2, options.height - 10);
        // Convert to data URL
        return canvas.toDataURL("image/".concat(options.format), options.quality);
    };
    /**
     * Generate thumbnail in Node.js environment
     */
    ThumbnailGenerator.prototype.generateNodeCanvasThumbnail = function (slide, report, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var createCanvas, canvas, ctx, companyName, buffer, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('canvas')); })];
                    case 1:
                        createCanvas = (_b.sent()).createCanvas;
                        canvas = createCanvas(options.width, options.height);
                        ctx = canvas.getContext('2d');
                        // Similar drawing logic as browser version
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, options.width, options.height);
                        ctx.strokeStyle = '#e5e7eb';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(0, 0, options.width, options.height);
                        companyName = ((_a = report.companyData) === null || _a === void 0 ? void 0 : _a.companyName) || report.config.ticker || 'Report';
                        ctx.font = 'bold 16px Arial';
                        ctx.fillStyle = '#1e293b';
                        ctx.textAlign = 'center';
                        ctx.fillText(companyName, options.width / 2, 30);
                        if (report.config.ticker) {
                            ctx.font = '12px Arial';
                            ctx.fillStyle = '#64748b';
                            ctx.fillText(report.config.ticker, options.width / 2, 50);
                        }
                        buffer = canvas.toBuffer(options.format === 'png' ? 'image/png' : 'image/jpeg', {
                            quality: options.quality
                        });
                        return [2 /*return*/, "data:image/".concat(options.format, ";base64,").concat(buffer.toString('base64'))];
                    case 2:
                        error_2 = _b.sent();
                        (0, logger_1.logDebug)('ThumbnailGenerator', "Node canvas error: ".concat(error_2));
                        return [2 /*return*/, this.generatePlaceholder(report.config.ticker || 'Report', options)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a placeholder thumbnail
     */
    ThumbnailGenerator.prototype.generatePlaceholder = function (text, options) {
        // Generate a simple SVG placeholder
        var svg = "\n      <svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">\n        <rect width=\"").concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"#f3f4f6\"/>\n        <rect x=\"0\" y=\"0\" width=\"").concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"none\" stroke=\"#e5e7eb\" stroke-width=\"1\"/>\n        <text x=\"").concat(options.width / 2, "\" y=\"").concat(options.height / 2, "\" text-anchor=\"middle\" font-family=\"Arial\" font-size=\"14\" fill=\"#6b7280\">\n          ").concat(text, "\n        </text>\n      </svg>\n    ");
        return "data:image/svg+xml;base64,".concat(btoa(svg));
    };
    /**
     * Wrap text to fit within width
     */
    ThumbnailGenerator.prototype.wrapText = function (ctx, text, maxWidth) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var testLine = currentLine ? "".concat(currentLine, " ").concat(word) : word;
            var metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines.slice(0, 2); // Max 2 lines
    };
    /**
     * Extract color from report type
     */
    ThumbnailGenerator.prototype.getReportTypeColor = function (reportType) {
        var colors = {
            'comprehensive': '#10b981',
            'technical': '#3b82f6',
            'fundamental': '#8b5cf6',
            'risk': '#ef4444',
            'esg': '#06b6d4',
            'earnings': '#f59e0b'
        };
        return colors[reportType] || '#6b7280';
    };
    return ThumbnailGenerator;
}());
exports.ThumbnailGenerator = ThumbnailGenerator;
