"use strict";
// src/reportGeneration/utils/nodeCanvasChartGenerator.ts
// Generates charts using node-canvas for server-side rendering
// Context: Creates PNG/JPEG images from Canvas for PDF/PPTX reports in Node.js
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
exports.__esModule = true;
exports.NodeCanvasChartGenerator = void 0;
var canvas_1 = require("canvas");
var logger_1 = require("../../utils/logger");
/**
 * Generates charts using node-canvas for server-side rendering
 * This works in Node.js environment for report generation
 */
var NodeCanvasChartGenerator = /** @class */ (function () {
    function NodeCanvasChartGenerator() {
        this.defaultConfig = {
            width: 800,
            height: 400,
            format: 'png',
            quality: 0.95,
            backgroundColor: '#FFFFFF'
        };
    }
    /**
     * Generate a simple candlestick chart
     */
    NodeCanvasChartGenerator.prototype.generateCandlestickChart = function (data, config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var finalConfig, width, height, format, backgroundColor, canvas, ctx, margin, chartWidth, chartHeight, prices, minPrice_1, maxPrice, priceRange_1, candleWidth_1, buffer, base64;
            return __generator(this, function (_a) {
                finalConfig = __assign(__assign({}, this.defaultConfig), config);
                width = finalConfig.width, height = finalConfig.height, format = finalConfig.format, backgroundColor = finalConfig.backgroundColor;
                (0, logger_1.logDebug)('NodeCanvasChartGenerator', "Generating candlestick chart: ".concat(width, "x").concat(height, ", format=").concat(format));
                canvas = (0, canvas_1.createCanvas)(width, height);
                ctx = canvas.getContext('2d');
                // Fill background
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                margin = { top: 20, right: 60, bottom: 40, left: 60 };
                chartWidth = width - margin.left - margin.right;
                chartHeight = height - margin.top - margin.bottom;
                if (!data || data.length === 0) {
                    // No data message
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('No price data available', width / 2, height / 2);
                }
                else {
                    prices = data.flatMap(function (d) { return [d.high, d.low]; });
                    minPrice_1 = Math.min.apply(Math, prices) * 0.98;
                    maxPrice = Math.max.apply(Math, prices) * 1.02;
                    priceRange_1 = maxPrice - minPrice_1;
                    // Draw chart area
                    ctx.save();
                    ctx.translate(margin.left, margin.top);
                    // Draw grid
                    this.drawGrid(ctx, chartWidth, chartHeight);
                    candleWidth_1 = Math.max(1, (chartWidth / data.length) * 0.8);
                    data.forEach(function (candle, i) {
                        var x = (i + 0.5) * (chartWidth / data.length);
                        var openY = chartHeight - ((candle.open - minPrice_1) / priceRange_1) * chartHeight;
                        var closeY = chartHeight - ((candle.close - minPrice_1) / priceRange_1) * chartHeight;
                        var highY = chartHeight - ((candle.high - minPrice_1) / priceRange_1) * chartHeight;
                        var lowY = chartHeight - ((candle.low - minPrice_1) / priceRange_1) * chartHeight;
                        var isBullish = candle.close > candle.open;
                        // Set colors
                        if (isBullish) {
                            ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
                            ctx.strokeStyle = '#059669';
                        }
                        else {
                            ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                            ctx.strokeStyle = '#dc2626';
                        }
                        // Draw wick
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x, highY);
                        ctx.lineTo(x, lowY);
                        ctx.stroke();
                        // Draw body
                        var bodyHeight = Math.abs(closeY - openY) || 1;
                        var bodyY = Math.min(openY, closeY);
                        ctx.fillRect(x - candleWidth_1 / 2, bodyY, candleWidth_1, bodyHeight);
                        ctx.strokeRect(x - candleWidth_1 / 2, bodyY, candleWidth_1, bodyHeight);
                    });
                    // Draw axes
                    this.drawAxes(ctx, chartWidth, chartHeight, minPrice_1, maxPrice, data);
                    ctx.restore();
                }
                buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
                base64 = buffer.toString('base64');
                return [2 /*return*/, {
                        type: 'candlestick',
                        format: format,
                        data: base64,
                        dimensions: { width: width, height: height }
                    }];
            });
        });
    };
    /**
     * Generate a simple line chart
     */
    NodeCanvasChartGenerator.prototype.generateLineChart = function (data, series, config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var finalConfig, width, height, format, backgroundColor, canvas, ctx, margin, chartWidth, chartHeight, allValues, minValue_1, maxValue, valueRange_1, colors_1, buffer, base64;
            return __generator(this, function (_a) {
                finalConfig = __assign(__assign({}, this.defaultConfig), config);
                width = finalConfig.width, height = finalConfig.height, format = finalConfig.format, backgroundColor = finalConfig.backgroundColor;
                (0, logger_1.logDebug)('NodeCanvasChartGenerator', "Generating line chart: ".concat(width, "x").concat(height, ", series=").concat(series.join(',')));
                canvas = (0, canvas_1.createCanvas)(width, height);
                ctx = canvas.getContext('2d');
                // Fill background
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                margin = { top: 20, right: 60, bottom: 40, left: 60 };
                chartWidth = width - margin.left - margin.right;
                chartHeight = height - margin.top - margin.bottom;
                if (!data || data.length === 0) {
                    // No data message
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('No data available', width / 2, height / 2);
                }
                else {
                    allValues = data.flatMap(function (d) { return series.map(function (s) { return d[s]; }); }).filter(function (v) { return v != null && !isNaN(v); });
                    minValue_1 = Math.min.apply(Math, allValues) * 0.95;
                    maxValue = Math.max.apply(Math, allValues) * 1.05;
                    valueRange_1 = maxValue - minValue_1;
                    // Draw chart area
                    ctx.save();
                    ctx.translate(margin.left, margin.top);
                    // Draw grid
                    this.drawGrid(ctx, chartWidth, chartHeight);
                    colors_1 = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                    series.forEach(function (seriesName, idx) {
                        ctx.strokeStyle = colors_1[idx % colors_1.length];
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        var firstPoint = true;
                        data.forEach(function (d, i) {
                            var value = d[seriesName];
                            if (value != null && !isNaN(value)) {
                                var x = (i / (data.length - 1)) * chartWidth;
                                var y = chartHeight - ((value - minValue_1) / valueRange_1) * chartHeight;
                                if (firstPoint) {
                                    ctx.moveTo(x, y);
                                    firstPoint = false;
                                }
                                else {
                                    ctx.lineTo(x, y);
                                }
                            }
                        });
                        ctx.stroke();
                    });
                    // Draw axes with simple labels
                    this.drawSimpleAxes(ctx, chartWidth, chartHeight, minValue_1, maxValue);
                    ctx.restore();
                }
                buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
                base64 = buffer.toString('base64');
                return [2 /*return*/, {
                        type: 'line',
                        format: format,
                        data: base64,
                        dimensions: { width: width, height: height }
                    }];
            });
        });
    };
    /**
     * Generate a simple bar chart
     */
    NodeCanvasChartGenerator.prototype.generateBarChart = function (data, categoryField, valueFields, config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var finalConfig, width, height, format, backgroundColor, canvas, ctx, margin, chartWidth, chartHeight, allValues, maxValue_1, colors_2, barWidth_1, groupWidth_1, buffer, base64;
            return __generator(this, function (_a) {
                finalConfig = __assign(__assign({}, this.defaultConfig), config);
                width = finalConfig.width, height = finalConfig.height, format = finalConfig.format, backgroundColor = finalConfig.backgroundColor;
                (0, logger_1.logDebug)('NodeCanvasChartGenerator', "Generating bar chart: ".concat(width, "x").concat(height));
                canvas = (0, canvas_1.createCanvas)(width, height);
                ctx = canvas.getContext('2d');
                // Fill background
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                margin = { top: 20, right: 60, bottom: 60, left: 60 };
                chartWidth = width - margin.left - margin.right;
                chartHeight = height - margin.top - margin.bottom;
                if (!data || data.length === 0) {
                    // No data message
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('No data available', width / 2, height / 2);
                }
                else {
                    allValues = data.flatMap(function (d) { return valueFields.map(function (f) { return d[f]; }); }).filter(function (v) { return v != null && !isNaN(v); });
                    maxValue_1 = Math.max.apply(Math, allValues) * 1.1;
                    // Draw chart area
                    ctx.save();
                    ctx.translate(margin.left, margin.top);
                    // Draw grid
                    this.drawGrid(ctx, chartWidth, chartHeight);
                    colors_2 = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
                    barWidth_1 = chartWidth / (data.length * (valueFields.length + 1));
                    groupWidth_1 = barWidth_1 * valueFields.length;
                    data.forEach(function (d, i) {
                        var x = (i * (groupWidth_1 + barWidth_1)) + barWidth_1 / 2;
                        valueFields.forEach(function (field, j) {
                            var value = d[field] || 0;
                            var barHeight = (value / maxValue_1) * chartHeight;
                            var barX = x + (j * barWidth_1);
                            var barY = chartHeight - barHeight;
                            ctx.fillStyle = colors_2[j % colors_2.length];
                            ctx.fillRect(barX, barY, barWidth_1 * 0.8, barHeight);
                        });
                        // Draw category label
                        ctx.fillStyle = '#374151';
                        ctx.font = '10px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.save();
                        ctx.translate(x + groupWidth_1 / 2, chartHeight + 15);
                        ctx.rotate(-Math.PI / 6);
                        ctx.fillText(d[categoryField] || '', 0, 0);
                        ctx.restore();
                    });
                    // Draw axes
                    this.drawSimpleAxes(ctx, chartWidth, chartHeight, 0, maxValue_1);
                    ctx.restore();
                }
                buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
                base64 = buffer.toString('base64');
                return [2 /*return*/, {
                        type: 'bar',
                        format: format,
                        data: base64,
                        dimensions: { width: width, height: height }
                    }];
            });
        });
    };
    /**
     * Generate a simple pie chart
     */
    NodeCanvasChartGenerator.prototype.generatePieChart = function (data, config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var finalConfig, width, height, format, backgroundColor, canvas, ctx, total, centerX_1, centerY_1, radius_1, colors_3, currentAngle_1, legendX_1, legendY_1, buffer, base64;
            return __generator(this, function (_a) {
                finalConfig = __assign(__assign({}, this.defaultConfig), config);
                width = finalConfig.width, height = finalConfig.height, format = finalConfig.format, backgroundColor = finalConfig.backgroundColor;
                (0, logger_1.logDebug)('NodeCanvasChartGenerator', "Generating pie chart: ".concat(width, "x").concat(height));
                canvas = (0, canvas_1.createCanvas)(width, height);
                ctx = canvas.getContext('2d');
                // Fill background
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height);
                total = data.reduce(function (sum, d) { return sum + (d.value || 0); }, 0);
                if (total === 0 || data.length === 0) {
                    // No data message
                    ctx.fillStyle = '#6b7280';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText('No data available', width / 2, height / 2);
                }
                else {
                    centerX_1 = width / 2;
                    centerY_1 = height / 2;
                    radius_1 = Math.min(width, height) * 0.35;
                    colors_3 = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                    currentAngle_1 = -Math.PI / 2;
                    data.forEach(function (d, i) {
                        var sliceAngle = (d.value / total) * 2 * Math.PI;
                        // Draw slice
                        ctx.beginPath();
                        ctx.moveTo(centerX_1, centerY_1);
                        ctx.arc(centerX_1, centerY_1, radius_1, currentAngle_1, currentAngle_1 + sliceAngle);
                        ctx.closePath();
                        ctx.fillStyle = colors_3[i % colors_3.length];
                        ctx.fill();
                        // Draw label if slice is big enough
                        if (sliceAngle > 0.1) { // Only show labels for slices > ~6%
                            var labelAngle = currentAngle_1 + sliceAngle / 2;
                            var labelX = centerX_1 + Math.cos(labelAngle) * (radius_1 * 0.7);
                            var labelY = centerY_1 + Math.sin(labelAngle) * (radius_1 * 0.7);
                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 12px sans-serif';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText("".concat(((d.value / total) * 100).toFixed(0), "%"), labelX, labelY);
                        }
                        currentAngle_1 += sliceAngle;
                    });
                    legendX_1 = width * 0.75;
                    legendY_1 = height * 0.2;
                    ctx.font = '12px sans-serif';
                    ctx.textAlign = 'left';
                    data.forEach(function (d, i) {
                        ctx.fillStyle = colors_3[i % colors_3.length];
                        ctx.fillRect(legendX_1, legendY_1, 12, 12);
                        ctx.fillStyle = '#1f2937';
                        ctx.fillText(d.label, legendX_1 + 18, legendY_1 + 10);
                        legendY_1 += 20;
                    });
                }
                buffer = format === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', { quality: finalConfig.quality });
                base64 = buffer.toString('base64');
                return [2 /*return*/, {
                        type: 'pie',
                        format: format,
                        data: base64,
                        dimensions: { width: width, height: height }
                    }];
            });
        });
    };
    /**
     * Draw grid lines
     */
    NodeCanvasChartGenerator.prototype.drawGrid = function (ctx, width, height) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        // Horizontal grid lines
        var hLines = 5;
        for (var i = 0; i <= hLines; i++) {
            var y = (height / hLines) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        // Vertical grid lines
        var vLines = 8;
        for (var i = 0; i <= vLines; i++) {
            var x = (width / vLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
    };
    /**
     * Draw axes for candlestick chart
     */
    NodeCanvasChartGenerator.prototype.drawAxes = function (ctx, width, height, minPrice, maxPrice, data) {
        var _a;
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#374151';
        // Draw axes lines
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        // Draw price axis labels
        var priceLabels = 5;
        var priceRange = maxPrice - minPrice;
        for (var i = 0; i <= priceLabels; i++) {
            var y = (height / priceLabels) * i;
            var price = maxPrice - (priceRange * (i / priceLabels));
            ctx.textAlign = 'right';
            ctx.fillText(price.toFixed(2), -5, y + 4);
        }
        // Draw time axis labels
        var timeLabels = Math.min(5, data.length);
        var step = Math.floor(data.length / timeLabels);
        for (var i = 0; i < timeLabels; i++) {
            var idx = i * step;
            var x = (idx / data.length) * width + width / (2 * data.length);
            var date = ((_a = data[idx]) === null || _a === void 0 ? void 0 : _a.date) || '';
            ctx.textAlign = 'center';
            ctx.fillText(date.substring(5, 10), x, height + 20); // MM-DD format
        }
    };
    /**
     * Draw simple axes
     */
    NodeCanvasChartGenerator.prototype.drawSimpleAxes = function (ctx, width, height, minValue, maxValue) {
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#374151';
        // Draw axes lines
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, height);
        ctx.stroke();
        // Draw value axis labels
        var valueLabels = 5;
        var valueRange = maxValue - minValue;
        for (var i = 0; i <= valueLabels; i++) {
            var y = (height / valueLabels) * i;
            var value = maxValue - (valueRange * (i / valueLabels));
            ctx.textAlign = 'right';
            ctx.fillText(value.toFixed(0), -5, y + 4);
        }
    };
    return NodeCanvasChartGenerator;
}());
exports.NodeCanvasChartGenerator = NodeCanvasChartGenerator;
