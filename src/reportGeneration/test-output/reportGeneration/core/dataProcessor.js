"use strict";
// src/reportGeneration/core/dataProcessor.ts
// Processes raw data into calculated metrics and insights
// Context: Applies financial calculations, pattern detection, and analysis
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
exports.DataProcessor = void 0;
var logger_1 = require("../../utils/logger");
var DataProcessor = /** @class */ (function () {
    function DataProcessor() {
    }
    /**
     * Main entry point for data processing
     * Transforms raw company data into actionable insights
     */
    DataProcessor.prototype.process = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var growth, valuation, risk, quality, technicals, composite;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('DataProcessor', "Processing data for ".concat(data.ticker));
                growth = this.calculateGrowthMetrics(data);
                valuation = this.calculateValuationMetrics(data);
                risk = this.calculateRiskMetrics(data);
                quality = this.calculateQualityMetrics(data);
                technicals = this.calculateTechnicalSignals(data);
                composite = this.calculateCompositeScore(growth, valuation, risk, quality, technicals);
                return [2 /*return*/, {
                        growth: growth,
                        valuation: valuation,
                        risk: risk,
                        quality: quality,
                        technicals: technicals,
                        composite: composite
                    }];
            });
        });
    };
    /**
     * Legacy method for backward compatibility
     */
    DataProcessor.prototype.processData = function (rawData, sections) {
        return __awaiter(this, void 0, void 0, function () {
            var analysis;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        (0, logger_1.logDebug)('DataProcessor', 'Legacy process method called');
                        return [4 /*yield*/, this.process(rawData)];
                    case 1:
                        analysis = _a.sent();
                        return [2 /*return*/, {
                                processedSections: [],
                                calculations: { global: analysis },
                                validationErrors: []
                            }];
                }
            });
        });
    };
    DataProcessor.prototype.calculateGrowthMetrics = function (data) {
        var income = data.financials.incomeStatement || [];
        var balance = data.financials.balanceSheet || [];
        var cashFlow = data.financials.cashFlow || [];
        // Calculate revenue growth from actual data
        var revenueGrowth = this.calculateGrowthRates(income.map(function (s) { return ({ date: s.date, value: s.revenue || 0 }); }));
        // Calculate earnings growth
        var earningsGrowth = this.calculateGrowthRates(income.map(function (s) { return ({ date: s.date, value: s.netIncome || 0 }); }));
        // Calculate free cash flow growth
        var fcfData = cashFlow.map(function (cf) { return ({
            date: cf.date,
            value: (cf.operatingCashFlow || 0) - (cf.capitalExpenditures || 0)
        }); });
        var fcfGrowth = this.calculateGrowthRates(fcfData);
        // Calculate book value growth
        var bookValueData = balance.map(function (bs) { return ({
            date: bs.date,
            value: (bs.totalAssets || 0) - (bs.totalLiabilities || 0)
        }); });
        var bookValueGrowth = this.calculateGrowthRates(bookValueData);
        return {
            revenueGrowth: revenueGrowth,
            earningsGrowth: earningsGrowth,
            fcfGrowth: fcfGrowth,
            bookValueGrowth: bookValueGrowth
        };
    };
    DataProcessor.prototype.calculateGrowthRates = function (data) {
        var _a, _b, _c;
        // Sort by date descending
        var sorted = data.sort(function (a, b) { return new Date(b.date).getTime() - new Date(a.date).getTime(); });
        if (sorted.length < 2) {
            return { yoy: 0, qoq: 0, cagr3: 0, cagr5: 0, trend: 'stable' };
        }
        // Year-over-year growth
        var current = ((_a = sorted[0]) === null || _a === void 0 ? void 0 : _a.value) || 0;
        var yearAgo = ((_b = sorted.find(function (d) {
            var diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
            return diff >= 365 * 24 * 60 * 60 * 1000 && diff < 400 * 24 * 60 * 60 * 1000;
        })) === null || _b === void 0 ? void 0 : _b.value) || current;
        var yoy = yearAgo !== 0 ? ((current - yearAgo) / Math.abs(yearAgo)) * 100 : 0;
        // Quarter-over-quarter growth
        var qoq = ((_c = sorted[1]) === null || _c === void 0 ? void 0 : _c.value) !== 0 ?
            ((current - sorted[1].value) / Math.abs(sorted[1].value)) * 100 : 0;
        // 3-year CAGR
        var threeYearAgo = sorted.find(function (d) {
            var diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
            return diff >= 3 * 365 * 24 * 60 * 60 * 1000;
        });
        var cagr3 = threeYearAgo && threeYearAgo.value !== 0 ?
            (Math.pow(current / threeYearAgo.value, 1 / 3) - 1) * 100 : 0;
        // 5-year CAGR
        var fiveYearAgo = sorted.find(function (d) {
            var diff = new Date(sorted[0].date).getTime() - new Date(d.date).getTime();
            return diff >= 5 * 365 * 24 * 60 * 60 * 1000;
        });
        var cagr5 = fiveYearAgo && fiveYearAgo.value !== 0 ?
            (Math.pow(current / fiveYearAgo.value, 1 / 5) - 1) * 100 : 0;
        // Determine trend
        var recentGrowth = [yoy, qoq].filter(function (g) { return g !== 0; });
        var historicalGrowth = [cagr3, cagr5].filter(function (g) { return g !== 0; });
        var avgRecent = recentGrowth.reduce(function (a, b) { return a + b; }, 0) / (recentGrowth.length || 1);
        var avgHistorical = historicalGrowth.reduce(function (a, b) { return a + b; }, 0) / (historicalGrowth.length || 1);
        var trend = 'stable';
        if (avgRecent > avgHistorical * 1.2)
            trend = 'accelerating';
        else if (avgRecent < avgHistorical * 0.8)
            trend = 'decelerating';
        return {
            yoy: parseFloat(yoy.toFixed(2)),
            qoq: parseFloat(qoq.toFixed(2)),
            cagr3: parseFloat(cagr3.toFixed(2)),
            cagr5: parseFloat(cagr5.toFixed(2)),
            trend: trend
        };
    };
    DataProcessor.prototype.calculateValuationMetrics = function (data) {
        var _a;
        var currentPrice = ((_a = data.financials.historicalPrices[0]) === null || _a === void 0 ? void 0 : _a.close) || 0;
        var keyMetrics = data.financials.keyMetrics;
        var latestIncome = data.financials.incomeStatement[0];
        var latestCashFlow = data.financials.cashFlow[0];
        // Calculate intrinsic value using DCF method
        var fcf = latestCashFlow ?
            (latestCashFlow.operatingCashFlow || 0) - (latestCashFlow.capitalExpenditures || 0) : 0;
        // Estimate growth rate based on historical performance
        var growthRate = Math.min(0.15, Math.max(0, keyMetrics.roe * 0.7)); // Conservative estimate
        var discountRate = 0.10; // 10% discount rate
        var terminalGrowth = 0.03; // 3% terminal growth
        // Simple DCF calculation
        var intrinsicValue = 0;
        if (fcf > 0) {
            // Project 5 years of cash flows
            for (var i = 1; i <= 5; i++) {
                var projectedFCF = fcf * Math.pow(1 + growthRate, i);
                intrinsicValue += projectedFCF / Math.pow(1 + discountRate, i);
            }
            // Terminal value
            var terminalFCF = fcf * Math.pow(1 + growthRate, 5) * (1 + terminalGrowth);
            var terminalValue = terminalFCF / (discountRate - terminalGrowth);
            intrinsicValue += terminalValue / Math.pow(1 + discountRate, 5);
            // Per share (estimate shares outstanding from market cap / price)
            var sharesOutstanding = keyMetrics.marketCap / currentPrice;
            intrinsicValue = intrinsicValue / sharesOutstanding;
        }
        // Calculate fair value using multiple approaches
        var peMultiple = 15; // Industry average P/E
        var eps = (latestIncome === null || latestIncome === void 0 ? void 0 : latestIncome.eps) || 0;
        var peValue = eps * peMultiple;
        var pbMultiple = 2.5; // Industry average P/B
        var bookValuePerShare = keyMetrics.priceToBook > 0 ? currentPrice / keyMetrics.priceToBook : 0;
        var pbValue = bookValuePerShare * pbMultiple;
        // Weighted average fair value
        var fairValue = (intrinsicValue * 0.5 + peValue * 0.3 + pbValue * 0.2);
        // Calculate margin of safety
        var marginOfSafety = fairValue > 0 ? (fairValue - currentPrice) / fairValue : 0;
        // Determine valuation status
        var valuation = 'fairlyValued';
        if (marginOfSafety > 0.2)
            valuation = 'undervalued';
        else if (marginOfSafety < -0.2)
            valuation = 'overvalued';
        // Calculate confidence based on data quality
        var hasRecentData = data.financials.incomeStatement.length > 4;
        var hasPositiveEarnings = eps > 0;
        var hasStableGrowth = Math.abs(growthRate) < 0.5;
        var confidence = (hasRecentData ? 0.4 : 0) + (hasPositiveEarnings ? 0.3 : 0) + (hasStableGrowth ? 0.3 : 0);
        return {
            intrinsicValue: parseFloat(intrinsicValue.toFixed(2)),
            fairValue: parseFloat(fairValue.toFixed(2)),
            marginOfSafety: parseFloat(marginOfSafety.toFixed(3)),
            valuation: valuation,
            confidence: parseFloat(confidence.toFixed(2))
        };
    };
    DataProcessor.prototype.calculateRiskMetrics = function (data) {
        var _a;
        var prices = data.financials.historicalPrices || [];
        var keyMetrics = data.financials.keyMetrics;
        // Calculate returns
        var returns = [];
        for (var i = 1; i < prices.length; i++) {
            var dailyReturn = (prices[i - 1].close - prices[i].close) / prices[i].close;
            returns.push(dailyReturn);
        }
        // Calculate volatility (annualized standard deviation)
        var avgReturn = returns.reduce(function (a, b) { return a + b; }, 0) / returns.length;
        var variance = returns.reduce(function (sum, r) { return sum + Math.pow(r - avgReturn, 2); }, 0) / returns.length;
        var dailyVolatility = Math.sqrt(variance);
        var volatility = dailyVolatility * Math.sqrt(252); // Annualize
        // Estimate beta using correlation with market returns
        // For now, use a simplified approach based on volatility
        var marketVolatility = 0.15; // Historical market volatility
        var beta = volatility / marketVolatility;
        // Calculate Sharpe ratio
        var riskFreeRate = 0.04; // 4% risk-free rate
        var annualReturn = avgReturn * 252;
        var sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;
        // Calculate maximum drawdown
        var maxDrawdown = 0;
        var peak = ((_a = prices[0]) === null || _a === void 0 ? void 0 : _a.close) || 0;
        for (var _i = 0, prices_1 = prices; _i < prices_1.length; _i++) {
            var price = prices_1[_i];
            if (price.close > peak)
                peak = price.close;
            var drawdown = (peak - price.close) / peak;
            if (drawdown > maxDrawdown)
                maxDrawdown = drawdown;
        }
        // Calculate Value at Risk (95% confidence)
        var sortedReturns = __spreadArray([], returns, true).sort(function (a, b) { return a - b; });
        var var95Index = Math.floor(sortedReturns.length * 0.05);
        var var95 = Math.abs(sortedReturns[var95Index] || 0);
        // Calculate composite risk score (0-100, lower is better)
        var betaScore = Math.min(beta * 20, 30); // Max 30 points for beta
        var volatilityScore = Math.min(volatility * 100, 30); // Max 30 points for volatility
        var drawdownScore = Math.min(maxDrawdown * 100, 20); // Max 20 points for drawdown
        var leverageScore = Math.min(keyMetrics.debtToEquity * 10, 20); // Max 20 points for leverage
        var riskScore = betaScore + volatilityScore + drawdownScore + leverageScore;
        return {
            beta: parseFloat(beta.toFixed(2)),
            volatility: parseFloat(volatility.toFixed(3)),
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
            maxDrawdown: parseFloat(maxDrawdown.toFixed(3)),
            var95: parseFloat(var95.toFixed(3)),
            riskScore: Math.round(riskScore)
        };
    };
    DataProcessor.prototype.calculateQualityMetrics = function (data) {
        var _a;
        var keyMetrics = data.financials.keyMetrics;
        var latestIncome = data.financials.incomeStatement[0];
        var latestBalance = data.financials.balanceSheet[0];
        var latestCashFlow = data.financials.cashFlow[0];
        var currentPrice = ((_a = data.financials.historicalPrices[0]) === null || _a === void 0 ? void 0 : _a.close) || 0;
        // Calculate Return on Invested Capital (ROIC)
        var nopat = latestIncome ? (latestIncome.operatingIncome || 0) * (1 - 0.25) : 0; // Assume 25% tax rate
        var investedCapital = latestBalance ?
            (latestBalance.totalAssets || 0) - (latestBalance.currentLiabilities || 0) : 0;
        var roic = investedCapital > 0 ? (nopat / investedCapital) * 100 : 0;
        // Calculate Free Cash Flow Yield
        var fcf = latestCashFlow ?
            (latestCashFlow.operatingCashFlow || 0) - (latestCashFlow.capitalExpenditures || 0) : 0;
        var marketCap = keyMetrics.marketCap || 0;
        var fcfYield = marketCap > 0 ? fcf / marketCap : 0;
        // Calculate Earnings Quality Score (0-100)
        // Higher score means higher quality earnings
        var earningsQuality = 50; // Base score
        // Check if operating cash flow > net income (good sign)
        if (latestCashFlow && latestIncome) {
            var ocf = latestCashFlow.operatingCashFlow || 0;
            var netIncome = latestIncome.netIncome || 0;
            if (ocf > netIncome * 1.1)
                earningsQuality += 20;
            else if (ocf > netIncome * 0.9)
                earningsQuality += 10;
        }
        // Check for consistent earnings
        var incomeStatements = data.financials.incomeStatement.slice(0, 4);
        var hasConsistentEarnings = incomeStatements.every(function (stmt) { return (stmt.netIncome || 0) > 0; });
        if (hasConsistentEarnings)
            earningsQuality += 15;
        // Check for low accruals
        if (latestBalance && latestIncome) {
            var totalAssets = latestBalance.totalAssets || 1;
            var accruals = (latestIncome.netIncome || 0) - ((latestCashFlow === null || latestCashFlow === void 0 ? void 0 : latestCashFlow.operatingCashFlow) || 0);
            var accrualRatio = Math.abs(accruals) / totalAssets;
            if (accrualRatio < 0.05)
                earningsQuality += 15;
        }
        // Calculate Balance Sheet Strength (0-100)
        var balanceSheetStrength = 50; // Base score
        // Current ratio
        if (keyMetrics.currentRatio > 2)
            balanceSheetStrength += 15;
        else if (keyMetrics.currentRatio > 1.5)
            balanceSheetStrength += 10;
        else if (keyMetrics.currentRatio > 1)
            balanceSheetStrength += 5;
        // Debt to equity
        if (keyMetrics.debtToEquity < 0.3)
            balanceSheetStrength += 20;
        else if (keyMetrics.debtToEquity < 0.6)
            balanceSheetStrength += 10;
        else if (keyMetrics.debtToEquity < 1)
            balanceSheetStrength += 5;
        // ROE consistency
        if (keyMetrics.roe > 0.15)
            balanceSheetStrength += 15;
        else if (keyMetrics.roe > 0.10)
            balanceSheetStrength += 10;
        // Determine moat based on multiple factors
        var moat = 'none';
        var moatScore = (roic > 15 ? 1 : 0) +
            (keyMetrics.roe > 0.15 ? 1 : 0) +
            (earningsQuality > 75 ? 1 : 0) +
            (fcfYield > 0.05 ? 1 : 0);
        if (moatScore >= 3)
            moat = 'wide';
        else if (moatScore >= 2)
            moat = 'narrow';
        return {
            roic: parseFloat(roic.toFixed(2)),
            fcfYield: parseFloat(fcfYield.toFixed(4)),
            earningsQuality: Math.round(earningsQuality),
            balanceSheetStrength: Math.round(balanceSheetStrength),
            moat: moat
        };
    };
    DataProcessor.prototype.calculateTechnicalSignals = function (data) {
        var _a, _b, _c;
        var prices = data.financials.historicalPrices || [];
        var technicals = data.technicals;
        var currentPrice = ((_a = prices[0]) === null || _a === void 0 ? void 0 : _a.close) || 0;
        // Determine trend based on moving averages
        var trend = 'neutral';
        if (technicals.sma20 > 0 && technicals.sma50 > 0 && technicals.sma200 > 0) {
            if (currentPrice > technicals.sma20 && technicals.sma20 > technicals.sma50 && technicals.sma50 > technicals.sma200) {
                trend = 'bullish';
            }
            else if (currentPrice < technicals.sma20 && technicals.sma20 < technicals.sma50 && technicals.sma50 < technicals.sma200) {
                trend = 'bearish';
            }
        }
        // Determine momentum based on RSI and MACD
        var momentum = 'moderate';
        if (technicals.rsi > 70 || (technicals.rsi > 50 && technicals.macd.histogram > 0)) {
            momentum = 'strong';
        }
        else if (technicals.rsi < 30 || (technicals.rsi < 50 && technicals.macd.histogram < 0)) {
            momentum = 'weak';
        }
        // Calculate support and resistance levels
        var recentPrices = prices.slice(0, 20).map(function (p) { return p.close; });
        var recentHighs = prices.slice(0, 20).map(function (p) { return p.high; });
        var recentLows = prices.slice(0, 20).map(function (p) { return p.low; });
        var resistance = Math.max.apply(Math, recentHighs);
        var support = Math.min.apply(Math, recentLows);
        // Calculate entry and stop loss based on ATR
        var atr = this.calculateATR(prices.slice(0, 14));
        var entry = trend === 'bullish' ? currentPrice + (atr * 0.5) : currentPrice - (atr * 0.5);
        var stopLoss = trend === 'bullish' ? currentPrice - (atr * 2) : currentPrice + (atr * 2);
        // Generate trading signals
        var signals = [];
        // Golden/Death cross signals
        if (prices.length > 1) {
            var prevPrice = prices[1].close;
            var prevSMA50 = this.calculateSMA(prices.slice(1, 51), 50);
            var prevSMA200 = this.calculateSMA(prices.slice(1, 201), 200);
            if (technicals.sma50 > technicals.sma200 && prevSMA50 <= prevSMA200) {
                signals.push({
                    type: 'golden_cross',
                    strength: 0.8,
                    date: prices[0].date,
                    price: currentPrice
                });
            }
            else if (technicals.sma50 < technicals.sma200 && prevSMA50 >= prevSMA200) {
                signals.push({
                    type: 'death_cross',
                    strength: 0.8,
                    date: prices[0].date,
                    price: currentPrice
                });
            }
        }
        // RSI signals
        if (technicals.rsi < 30) {
            signals.push({
                type: 'oversold',
                strength: 0.7,
                date: ((_b = prices[0]) === null || _b === void 0 ? void 0 : _b.date) || new Date().toISOString(),
                price: currentPrice
            });
        }
        else if (technicals.rsi > 70) {
            signals.push({
                type: 'overbought',
                strength: 0.7,
                date: ((_c = prices[0]) === null || _c === void 0 ? void 0 : _c.date) || new Date().toISOString(),
                price: currentPrice
            });
        }
        return {
            trend: trend,
            momentum: momentum,
            support: parseFloat(support.toFixed(2)),
            resistance: parseFloat(resistance.toFixed(2)),
            entry: parseFloat(entry.toFixed(2)),
            stopLoss: parseFloat(stopLoss.toFixed(2)),
            signals: signals
        };
    };
    DataProcessor.prototype.calculateATR = function (prices) {
        if (prices.length < 2)
            return 0;
        var trueRanges = [];
        for (var i = 1; i < prices.length; i++) {
            var high = prices[i].high;
            var low = prices[i].low;
            var prevClose = prices[i - 1].close;
            var tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
            trueRanges.push(tr);
        }
        return trueRanges.reduce(function (a, b) { return a + b; }, 0) / trueRanges.length;
    };
    DataProcessor.prototype.calculateSMA = function (prices, period) {
        var validPrices = prices.slice(0, period).map(function (p) { return p.close; }).filter(function (p) { return !isNaN(p); });
        if (validPrices.length === 0)
            return 0;
        return validPrices.reduce(function (a, b) { return a + b; }, 0) / validPrices.length;
    };
    DataProcessor.prototype.calculateCompositeScore = function (growth, valuation, risk, quality, technicals) {
        // Calculate sub-scores (0-100)
        // Growth score
        var growthScore = Math.min(100, Math.max(0, (growth.revenueGrowth.yoy > 0 ? 20 : 0) +
            (growth.earningsGrowth.yoy > 0 ? 20 : 0) +
            (growth.fcfGrowth.yoy > 0 ? 20 : 0) +
            (growth.revenueGrowth.cagr3 > 10 ? 20 : growth.revenueGrowth.cagr3 * 2) +
            (growth.earningsGrowth.trend === 'accelerating' ? 20 : 10)));
        // Value score
        var valueScore = Math.min(100, Math.max(0, (valuation.marginOfSafety > 0.2 ? 40 : valuation.marginOfSafety * 200) +
            (valuation.valuation === 'undervalued' ? 30 : valuation.valuation === 'fairlyValued' ? 15 : 0) +
            (valuation.confidence * 30)));
        // Quality score
        var qualityScore = Math.min(100, Math.max(0, (quality.roic > 15 ? 25 : quality.roic * 1.67) +
            (quality.earningsQuality * 0.25) +
            (quality.balanceSheetStrength * 0.25) +
            (quality.moat === 'wide' ? 25 : quality.moat === 'narrow' ? 15 : 5)));
        // Momentum score
        var momentumScore = Math.min(100, Math.max(0, (technicals.trend === 'bullish' ? 40 : technicals.trend === 'neutral' ? 20 : 0) +
            (technicals.momentum === 'strong' ? 30 : technicals.momentum === 'moderate' ? 15 : 0) +
            (technicals.signals.filter(function (s) { return s.type === 'golden_cross' || s.type === 'oversold'; }).length * 15)));
        // Sentiment score (based on analyst ratings)
        // This would be enhanced with real sentiment analysis
        var sentimentScore = 70; // Default neutral-positive
        // Risk adjustment
        var riskAdjustment = Math.max(0.5, 1 - (risk.riskScore / 200));
        // Calculate overall score with risk adjustment
        var weights = {
            growth: 0.25,
            value: 0.25,
            quality: 0.30,
            momentum: 0.15,
            sentiment: 0.05
        };
        var rawScore = growthScore * weights.growth +
            valueScore * weights.value +
            qualityScore * weights.quality +
            momentumScore * weights.momentum +
            sentimentScore * weights.sentiment;
        var overall = Math.round(rawScore * riskAdjustment);
        // Determine recommendation
        var recommendation = 'hold';
        if (overall >= 80 && valuation.marginOfSafety > 0.1)
            recommendation = 'strongBuy';
        else if (overall >= 70 && valuation.marginOfSafety > 0)
            recommendation = 'buy';
        else if (overall >= 40)
            recommendation = 'hold';
        else if (overall >= 20)
            recommendation = 'sell';
        else
            recommendation = 'strongSell';
        // Calculate confidence based on data quality and consistency
        var confidence = valuation.confidence * 0.5 +
            (quality.earningsQuality / 100) * 0.3 +
            (risk.riskScore < 50 ? 0.2 : 0.1);
        return {
            overall: overall,
            growth: Math.round(growthScore),
            value: Math.round(valueScore),
            quality: Math.round(qualityScore),
            momentum: Math.round(momentumScore),
            sentiment: Math.round(sentimentScore),
            recommendation: recommendation,
            confidence: parseFloat(confidence.toFixed(2))
        };
    };
    /**
     * Validates processed data for completeness and accuracy
     */
    DataProcessor.prototype.validateResults = function (results) {
        // Check all required fields are present and valid
        var hasGrowthData = results.growth &&
            !isNaN(results.growth.revenueGrowth.yoy) &&
            !isNaN(results.growth.earningsGrowth.yoy);
        var hasValuationData = results.valuation &&
            results.valuation.intrinsicValue > 0 &&
            results.valuation.fairValue > 0;
        var hasRiskData = results.risk &&
            results.risk.beta > 0 &&
            results.risk.volatility >= 0;
        var hasQualityData = results.quality &&
            results.quality.roic >= 0 &&
            results.quality.earningsQuality >= 0;
        var hasTechnicalData = results.technicals &&
            results.technicals.support > 0 &&
            results.technicals.resistance > results.technicals.support;
        var hasCompositeData = results.composite &&
            results.composite.overall >= 0 &&
            results.composite.overall <= 100;
        return hasGrowthData && hasValuationData && hasRiskData &&
            hasQualityData && hasTechnicalData && hasCompositeData;
    };
    return DataProcessor;
}());
exports.DataProcessor = DataProcessor;
