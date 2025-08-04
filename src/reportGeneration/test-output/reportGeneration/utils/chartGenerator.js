"use strict";
// src/reportGeneration/utils/chartGenerator.ts
// Chart generation for reports using D3.js
// Context: Creates static charts for embedding in PPTX/PDF reports
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
exports.ChartGenerator = void 0;
var d3 = __importStar(require("d3"));
var logger_1 = require("../../utils/logger");
var ChartGenerator = /** @class */ (function () {
    function ChartGenerator() {
    }
    /**
     * Generates a candlestick chart using D3.js
     */
    ChartGenerator.prototype.generateCandlestickChart = function (priceData, options) {
        if (options === void 0) { options = { width: 800, height: 400 }; }
        return __awaiter(this, void 0, void 0, function () {
            var margin, width, height, xScale, yScale, svgString;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('ChartGenerator', 'Generating candlestick chart');
                if (!priceData || priceData.length === 0) {
                    throw new Error('No price data provided for candlestick chart');
                }
                margin = { top: 20, right: 30, bottom: 40, left: 50 };
                width = options.width - margin.left - margin.right;
                height = options.height - margin.top - margin.bottom;
                xScale = d3.scaleTime()
                    .domain(d3.extent(priceData, function (d) { return new Date(d.date); }))
                    .range([0, width]);
                yScale = d3.scaleLinear()
                    .domain(d3.extent(priceData, function (d) { return Math.max(d.high, d.low); }))
                    .range([height, 0]);
                svgString = "<svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">");
                svgString += "<g transform=\"translate(".concat(margin.left, ",").concat(margin.top, ")\">");
                // Add candlesticks
                priceData.forEach(function (d) {
                    var x = xScale(new Date(d.date));
                    var yHigh = yScale(d.high);
                    var yLow = yScale(d.low);
                    var yOpen = yScale(d.open);
                    var yClose = yScale(d.close);
                    var color = d.close >= d.open ? '#00C851' : '#FF4444';
                    var bodyHeight = Math.abs(yClose - yOpen);
                    // High-low line
                    svgString += "<line x1=\"".concat(x, "\" y1=\"").concat(yHigh, "\" x2=\"").concat(x, "\" y2=\"").concat(yLow, "\" stroke=\"").concat(color, "\" stroke-width=\"1\"/>");
                    // Body rectangle
                    svgString += "<rect x=\"".concat(x - 2, "\" y=\"").concat(Math.min(yOpen, yClose), "\" width=\"4\" height=\"").concat(bodyHeight, "\" fill=\"").concat(color, "\"/>");
                });
                // Add axes
                svgString += this.createAxis(xScale, yScale, width, height);
                svgString += '</g></svg>';
                return [2 /*return*/, {
                        type: 'candlestick',
                        data: svgString,
                        format: 'svg',
                        dimensions: { width: options.width, height: options.height }
                    }];
            });
        });
    };
    /**
     * Generates a line chart
     */
    ChartGenerator.prototype.generateLineChart = function (data, series, options) {
        if (options === void 0) { options = { width: 800, height: 400 }; }
        return __awaiter(this, void 0, void 0, function () {
            var margin, width, height, theme, colors, parsedData, xScale, allValues, yScale, svgString;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('ChartGenerator', 'Generating line chart');
                if (!data || data.length === 0) {
                    throw new Error('No data provided for line chart');
                }
                margin = { top: 20, right: 120, bottom: 40, left: 60 };
                width = options.width - margin.left - margin.right;
                height = options.height - margin.top - margin.bottom;
                theme = options.theme || 'light';
                colors = this.getColorPalette(theme);
                parsedData = data.map(function (d) { return (__assign(__assign({}, d), { date: new Date(d.date) })); });
                xScale = d3.scaleTime()
                    .domain(d3.extent(parsedData, function (d) { return d.date; }))
                    .range([0, width]);
                allValues = series.flatMap(function (s) { return parsedData.map(function (d) { return d[s] || 0; }); });
                yScale = d3.scaleLinear()
                    .domain([d3.min(allValues) || 0, d3.max(allValues) || 0])
                    .nice()
                    .range([height, 0]);
                svgString = "<svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">");
                svgString += "<rect width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"").concat(theme === 'dark' ? '#1e1e1e' : 'white', "\"/>");
                svgString += "<g transform=\"translate(".concat(margin.left, ",").concat(margin.top, ")\">");
                // Add grid lines
                svgString += this.createGridLines(xScale, yScale, width, height, theme);
                // Draw lines for each series
                series.forEach(function (seriesName, index) {
                    var lineData = parsedData.filter(function (d) { return d[seriesName] !== null && d[seriesName] !== undefined; });
                    if (lineData.length === 0)
                        return;
                    var color = colors[index % colors.length];
                    // Create path
                    var pathData = 'M';
                    lineData.forEach(function (d, i) {
                        var x = xScale(d.date);
                        var y = yScale(d[seriesName]);
                        pathData += "".concat(i === 0 ? '' : 'L').concat(x, ",").concat(y);
                    });
                    svgString += "<path d=\"".concat(pathData, "\" fill=\"none\" stroke=\"").concat(color, "\" stroke-width=\"2\"/>");
                    // Add data points
                    lineData.forEach(function (d) {
                        var x = xScale(d.date);
                        var y = yScale(d[seriesName]);
                        svgString += "<circle cx=\"".concat(x, "\" cy=\"").concat(y, "\" r=\"3\" fill=\"").concat(color, "\"/>");
                    });
                });
                // Add axes
                svgString += this.createAxis(xScale, yScale, width, height, theme);
                // Add legend
                svgString += this.createLegend(series, colors, width, theme);
                svgString += '</g></svg>';
                return [2 /*return*/, {
                        type: 'line',
                        data: svgString,
                        format: 'svg',
                        dimensions: { width: options.width, height: options.height }
                    }];
            });
        });
    };
    /**
     * Generates a bar chart
     */
    ChartGenerator.prototype.generateBarChart = function (data, categoryKey, valueKeys, options) {
        if (options === void 0) { options = { width: 800, height: 400 }; }
        return __awaiter(this, void 0, void 0, function () {
            var margin, width, height, theme, colors, x0Scale, x1Scale, maxValue, yScale, svgString;
            var _this = this;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('ChartGenerator', 'Generating bar chart');
                if (!data || data.length === 0) {
                    throw new Error('No data provided for bar chart');
                }
                margin = { top: 20, right: 120, bottom: 60, left: 80 };
                width = options.width - margin.left - margin.right;
                height = options.height - margin.top - margin.bottom;
                theme = options.theme || 'light';
                colors = this.getColorPalette(theme);
                x0Scale = d3.scaleBand()
                    .domain(data.map(function (d) { return d[categoryKey]; }))
                    .range([0, width])
                    .padding(0.1);
                x1Scale = d3.scaleBand()
                    .domain(valueKeys)
                    .range([0, x0Scale.bandwidth()])
                    .padding(0.05);
                maxValue = d3.max(data, function (d) {
                    return d3.max(valueKeys, function (key) { return d[key] || 0; });
                }) || 0;
                yScale = d3.scaleLinear()
                    .domain([0, maxValue * 1.1]) // Add 10% padding
                    .nice()
                    .range([height, 0]);
                svgString = "<svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">");
                svgString += "<rect width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"").concat(theme === 'dark' ? '#1e1e1e' : 'white', "\"/>");
                svgString += "<g transform=\"translate(".concat(margin.left, ",").concat(margin.top, ")\">");
                // Add grid lines
                svgString += this.createGridLines(x0Scale, yScale, width, height, theme);
                // Draw bars
                data.forEach(function (d) {
                    var x0 = x0Scale(d[categoryKey]) || 0;
                    valueKeys.forEach(function (key, index) {
                        var value = d[key] || 0;
                        var x = x0 + (x1Scale(key) || 0);
                        var y = yScale(value);
                        var barHeight = height - y;
                        var color = colors[index % colors.length];
                        svgString += "<rect x=\"".concat(x, "\" y=\"").concat(y, "\" width=\"").concat(x1Scale.bandwidth(), "\" height=\"").concat(barHeight, "\" fill=\"").concat(color, "\"/>");
                        // Add value label on top of bar
                        if (barHeight > 20) {
                            svgString += "<text x=\"".concat(x + x1Scale.bandwidth() / 2, "\" y=\"").concat(y - 5, "\" ");
                            svgString += "text-anchor=\"middle\" font-size=\"12\" fill=\"".concat(theme === 'dark' ? '#fff' : '#333', "\">");
                            svgString += "".concat(_this.formatValue(value), "</text>");
                        }
                    });
                });
                // Add axes
                svgString += this.createBarChartAxis(x0Scale, yScale, width, height, theme);
                // Add legend
                svgString += this.createLegend(valueKeys, colors, width, theme);
                svgString += '</g></svg>';
                return [2 /*return*/, {
                        type: 'bar',
                        data: svgString,
                        format: 'svg',
                        dimensions: { width: options.width, height: options.height }
                    }];
            });
        });
    };
    /**
     * Converts SVG to image format
     * Note: In browser environment, this requires canvas support
     */
    ChartGenerator.prototype.convertToImage = function (svgString, format) {
        if (format === void 0) { format = 'png'; }
        return __awaiter(this, void 0, void 0, function () {
            var base64;
            return __generator(this, function (_a) {
                // In Node.js environment, we would use a library like sharp or canvas
                // For now, return the SVG as-is with a data URI wrapper
                // Production implementation would use node-canvas or puppeteer
                if (typeof window !== 'undefined' && window.document) {
                    // Browser environment - use canvas
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            var img = new Image();
                            var canvas = document.createElement('canvas');
                            var ctx = canvas.getContext('2d');
                            img.onload = function () {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(img, 0, 0);
                                canvas.toBlob(function (blob) {
                                    if (blob) {
                                        var reader_1 = new FileReader();
                                        reader_1.onloadend = function () {
                                            resolve(reader_1.result);
                                        };
                                        reader_1.readAsDataURL(blob);
                                    }
                                    else {
                                        reject(new Error('Failed to convert canvas to blob'));
                                    }
                                }, "image/".concat(format));
                            };
                            img.onerror = function () { return reject(new Error('Failed to load SVG')); };
                            // Convert SVG string to data URL
                            var svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                            var url = URL.createObjectURL(svgBlob);
                            img.src = url;
                        })];
                }
                else {
                    base64 = Buffer.from(svgString).toString('base64');
                    return [2 /*return*/, "data:image/svg+xml;base64,".concat(base64)];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Gets available chart types
     */
    ChartGenerator.prototype.getAvailableChartTypes = function () {
        return ['candlestick', 'line', 'bar', 'pie', 'scatter', 'heatmap'];
    };
    /**
     * Generates a pie chart
     */
    ChartGenerator.prototype.generatePieChart = function (data, options) {
        if (options === void 0) { options = { width: 400, height: 400 }; }
        return __awaiter(this, void 0, void 0, function () {
            var margin, radius, centerX, centerY, theme, colors, total, currentAngle, arcs, svgString, legendX, legendY;
            var _this = this;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('ChartGenerator', 'Generating pie chart');
                if (!data || data.length === 0) {
                    throw new Error('No data provided for pie chart');
                }
                margin = 40;
                radius = Math.min(options.width, options.height) / 2 - margin;
                centerX = options.width / 2;
                centerY = options.height / 2;
                theme = options.theme || 'light';
                colors = this.getColorPalette(theme);
                total = d3.sum(data, function (d) { return d.value; });
                currentAngle = -Math.PI / 2;
                arcs = data.map(function (d, i) {
                    var startAngle = currentAngle;
                    var endAngle = currentAngle + (d.value / total) * 2 * Math.PI;
                    currentAngle = endAngle;
                    return __assign(__assign({}, d), { startAngle: startAngle, endAngle: endAngle, color: colors[i % colors.length] });
                });
                svgString = "<svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">");
                svgString += "<rect width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"").concat(theme === 'dark' ? '#1e1e1e' : 'white', "\"/>");
                // Draw pie slices
                arcs.forEach(function (arc) {
                    var x1 = centerX + radius * Math.cos(arc.startAngle);
                    var y1 = centerY + radius * Math.sin(arc.startAngle);
                    var x2 = centerX + radius * Math.cos(arc.endAngle);
                    var y2 = centerY + radius * Math.sin(arc.endAngle);
                    var largeArc = arc.endAngle - arc.startAngle > Math.PI ? 1 : 0;
                    svgString += "<path d=\"M".concat(centerX, ",").concat(centerY, " L").concat(x1, ",").concat(y1, " A").concat(radius, ",").concat(radius, " 0 ").concat(largeArc, " 1 ").concat(x2, ",").concat(y2, " Z\" ");
                    svgString += "fill=\"".concat(arc.color, "\" stroke=\"").concat(theme === 'dark' ? '#1e1e1e' : 'white', "\" stroke-width=\"2\"/>");
                    // Add percentage label
                    var percentage = ((arc.value / total) * 100).toFixed(1);
                    var labelAngle = (arc.startAngle + arc.endAngle) / 2;
                    var labelX = centerX + (radius * 0.7) * Math.cos(labelAngle);
                    var labelY = centerY + (radius * 0.7) * Math.sin(labelAngle);
                    if (arc.value / total > 0.05) { // Only show label if slice is > 5%
                        svgString += "<text x=\"".concat(labelX, "\" y=\"").concat(labelY, "\" text-anchor=\"middle\" alignment-baseline=\"middle\" ");
                        svgString += "font-size=\"14\" font-weight=\"bold\" fill=\"white\">".concat(percentage, "%</text>");
                    }
                });
                legendX = 20;
                legendY = 20;
                data.forEach(function (d, i) {
                    var color = colors[i % colors.length];
                    svgString += "<rect x=\"".concat(legendX, "\" y=\"").concat(legendY, "\" width=\"15\" height=\"15\" fill=\"").concat(color, "\"/>");
                    svgString += "<text x=\"".concat(legendX + 20, "\" y=\"").concat(legendY + 12, "\" font-size=\"14\" ");
                    svgString += "fill=\"".concat(theme === 'dark' ? '#fff' : '#333', "\">").concat(d.label, ": ").concat(_this.formatValue(d.value), "</text>");
                    legendY += 25;
                });
                svgString += '</svg>';
                return [2 /*return*/, {
                        type: 'pie',
                        data: svgString,
                        format: 'svg',
                        dimensions: { width: options.width, height: options.height }
                    }];
            });
        });
    };
    /**
     * Generates a scatter plot
     */
    ChartGenerator.prototype.generateScatterPlot = function (data, options) {
        if (options === void 0) { options = { width: 800, height: 400 }; }
        return __awaiter(this, void 0, void 0, function () {
            var margin, width, height, theme, primaryColor, xScale, yScale, svgString;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('ChartGenerator', 'Generating scatter plot');
                if (!data || data.length === 0) {
                    throw new Error('No data provided for scatter plot');
                }
                margin = { top: 20, right: 20, bottom: 60, left: 60 };
                width = options.width - margin.left - margin.right;
                height = options.height - margin.top - margin.bottom;
                theme = options.theme || 'light';
                primaryColor = theme === 'dark' ? '#4CAF50' : '#2196F3';
                xScale = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) { return d.x; }))
                    .nice()
                    .range([0, width]);
                yScale = d3.scaleLinear()
                    .domain(d3.extent(data, function (d) { return d.y; }))
                    .nice()
                    .range([height, 0]);
                svgString = "<svg width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" xmlns=\"http://www.w3.org/2000/svg\">");
                svgString += "<rect width=\"".concat(options.width, "\" height=\"").concat(options.height, "\" fill=\"").concat(theme === 'dark' ? '#1e1e1e' : 'white', "\"/>");
                svgString += "<g transform=\"translate(".concat(margin.left, ",").concat(margin.top, ")\">");
                // Add grid lines
                svgString += this.createGridLines(xScale, yScale, width, height, theme);
                // Draw points
                data.forEach(function (d) {
                    var x = xScale(d.x);
                    var y = yScale(d.y);
                    var size = d.size || 5;
                    svgString += "<circle cx=\"".concat(x, "\" cy=\"").concat(y, "\" r=\"").concat(size, "\" fill=\"").concat(primaryColor, "\" opacity=\"0.7\"/>");
                    // Add label if provided
                    if (d.label) {
                        svgString += "<text x=\"".concat(x + size + 3, "\" y=\"").concat(y + 3, "\" font-size=\"10\" ");
                        svgString += "fill=\"".concat(theme === 'dark' ? '#fff' : '#333', "\">").concat(d.label, "</text>");
                    }
                });
                // Add axes
                svgString += this.createAxis(xScale, yScale, width, height, theme);
                // Add axis labels
                if (options.xLabel) {
                    svgString += "<text x=\"".concat(width / 2, "\" y=\"").concat(height + 50, "\" text-anchor=\"middle\" font-size=\"14\" ");
                    svgString += "fill=\"".concat(theme === 'dark' ? '#fff' : '#333', "\">").concat(options.xLabel, "</text>");
                }
                if (options.yLabel) {
                    svgString += "<text x=\"".concat(-height / 2, "\" y=\"-40\" text-anchor=\"middle\" font-size=\"14\" ");
                    svgString += "transform=\"rotate(-90 -40 ".concat(-height / 2, ")\" ");
                    svgString += "fill=\"".concat(theme === 'dark' ? '#fff' : '#333', "\">").concat(options.yLabel, "</text>");
                }
                svgString += '</g></svg>';
                return [2 /*return*/, {
                        type: 'scatter',
                        data: svgString,
                        format: 'svg',
                        dimensions: { width: options.width, height: options.height }
                    }];
            });
        });
    };
    /**
     * Helper method to create axis elements for SVG
     */
    ChartGenerator.prototype.createAxis = function (xScale, yScale, width, height, theme) {
        var _this = this;
        if (theme === void 0) { theme = 'light'; }
        var axisString = '';
        var strokeColor = theme === 'dark' ? '#666' : '#000';
        var textColor = theme === 'dark' ? '#ccc' : '#333';
        // X-axis
        axisString += "<g transform=\"translate(0,".concat(height, ")\">");
        axisString += "<line x1=\"0\" y1=\"0\" x2=\"".concat(width, "\" y2=\"0\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
        // X-axis ticks
        var xTicks = xScale.ticks ? xScale.ticks(6) : xScale.domain();
        xTicks.forEach(function (tick) {
            var x = xScale(tick);
            var tickText = tick instanceof Date ? tick.toLocaleDateString() : tick.toString();
            axisString += "<line x1=\"".concat(x, "\" y1=\"0\" x2=\"").concat(x, "\" y2=\"6\" stroke=\"").concat(theme === 'dark' ? '#666' : '#000', "\" stroke-width=\"1\"/>");
            axisString += "<text x=\"".concat(x, "\" y=\"20\" text-anchor=\"middle\" font-size=\"12\" fill=\"").concat(theme === 'dark' ? '#ccc' : '#333', "\">").concat(tickText, "</text>");
        });
        axisString += '</g>';
        // Y-axis
        axisString += '<g>';
        axisString += "<line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"".concat(height, "\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
        // Y-axis ticks
        var yTicks = yScale.ticks ? yScale.ticks(6) : yScale.domain();
        yTicks.forEach(function (tick) {
            var y = yScale(tick);
            axisString += "<line x1=\"0\" y1=\"".concat(y, "\" x2=\"-6\" y2=\"").concat(y, "\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
            axisString += "<text x=\"-10\" y=\"".concat(y + 4, "\" text-anchor=\"end\" font-size=\"12\" fill=\"").concat(textColor, "\">").concat(_this.formatValue(tick), "</text>");
        });
        axisString += '</g>';
        return axisString;
    };
    /**
     * Creates axis for bar charts with rotated labels
     */
    ChartGenerator.prototype.createBarChartAxis = function (xScale, yScale, width, height, theme) {
        var _this = this;
        if (theme === void 0) { theme = 'light'; }
        var axisString = '';
        var strokeColor = theme === 'dark' ? '#666' : '#000';
        var textColor = theme === 'dark' ? '#ccc' : '#333';
        // X-axis
        axisString += "<g transform=\"translate(0,".concat(height, ")\">");
        axisString += "<line x1=\"0\" y1=\"0\" x2=\"".concat(width, "\" y2=\"0\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
        // X-axis labels (rotated for bar chart)
        var xDomain = xScale.domain();
        xDomain.forEach(function (label) {
            var x = xScale(label) + xScale.bandwidth() / 2;
            axisString += "<text x=\"".concat(x, "\" y=\"15\" text-anchor=\"start\" font-size=\"12\" fill=\"").concat(textColor, "\" ");
            axisString += "transform=\"rotate(45 ".concat(x, " 15)\">").concat(label, "</text>");
        });
        axisString += '</g>';
        // Y-axis
        axisString += '<g>';
        axisString += "<line x1=\"0\" y1=\"0\" x2=\"0\" y2=\"".concat(height, "\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
        var yTicks = yScale.ticks(6);
        yTicks.forEach(function (tick) {
            var y = yScale(tick);
            axisString += "<line x1=\"0\" y1=\"".concat(y, "\" x2=\"-6\" y2=\"").concat(y, "\" stroke=\"").concat(strokeColor, "\" stroke-width=\"1\"/>");
            axisString += "<text x=\"-10\" y=\"".concat(y + 4, "\" text-anchor=\"end\" font-size=\"12\" fill=\"").concat(textColor, "\">").concat(_this.formatValue(tick), "</text>");
        });
        axisString += '</g>';
        return axisString;
    };
    /**
     * Creates grid lines for charts
     */
    ChartGenerator.prototype.createGridLines = function (xScale, yScale, width, height, theme) {
        if (theme === void 0) { theme = 'light'; }
        var gridString = '';
        var gridColor = theme === 'dark' ? '#333' : '#e0e0e0';
        // Horizontal grid lines
        var yTicks = yScale.ticks ? yScale.ticks(6) : yScale.domain();
        yTicks.forEach(function (tick) {
            var y = yScale(tick);
            gridString += "<line x1=\"0\" y1=\"".concat(y, "\" x2=\"").concat(width, "\" y2=\"").concat(y, "\" stroke=\"").concat(gridColor, "\" stroke-width=\"0.5\" opacity=\"0.5\"/>");
        });
        return gridString;
    };
    /**
     * Creates legend for multi-series charts
     */
    ChartGenerator.prototype.createLegend = function (series, colors, width, theme) {
        if (theme === void 0) { theme = 'light'; }
        var legendString = '<g transform="translate(' + (width + 10) + ', 20)">';
        var textColor = theme === 'dark' ? '#ccc' : '#333';
        series.forEach(function (name, i) {
            var y = i * 25;
            legendString += "<rect x=\"0\" y=\"".concat(y, "\" width=\"15\" height=\"15\" fill=\"").concat(colors[i % colors.length], "\"/>");
            legendString += "<text x=\"20\" y=\"".concat(y + 12, "\" font-size=\"12\" fill=\"").concat(textColor, "\">").concat(name, "</text>");
        });
        legendString += '</g>';
        return legendString;
    };
    /**
     * Gets color palette based on theme
     */
    ChartGenerator.prototype.getColorPalette = function (theme) {
        if (theme === 'dark') {
            return ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#FFEB3B', '#795548'];
        }
        return ['#2E7D32', '#1565C0', '#E65100', '#C2185B', '#6A1B9A', '#00838F', '#F9A825', '#4E342E'];
    };
    /**
     * Formats numeric values for display
     */
    ChartGenerator.prototype.formatValue = function (value) {
        if (Math.abs(value) >= 1e9) {
            return "".concat((value / 1e9).toFixed(1), "B");
        }
        else if (Math.abs(value) >= 1e6) {
            return "".concat((value / 1e6).toFixed(1), "M");
        }
        else if (Math.abs(value) >= 1e3) {
            return "".concat((value / 1e3).toFixed(1), "K");
        }
        else if (value % 1 === 0) {
            return value.toString();
        }
        else {
            return value.toFixed(2);
        }
    };
    return ChartGenerator;
}());
exports.ChartGenerator = ChartGenerator;
