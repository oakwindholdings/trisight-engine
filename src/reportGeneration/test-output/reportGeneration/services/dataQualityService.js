"use strict";
// src/reportGeneration/services/dataQualityService.ts
// Comprehensive data quality assessment and validation service
// Context: Ensures high-quality data for AI content generation
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
exports.getDataQualityService = exports.DataQualityService = void 0;
var logger_1 = require("../../utils/logger");
/**
 * Data Quality Service
 * Validates, scores, and enriches data for AI consumption
 */
var DataQualityService = /** @class */ (function () {
    function DataQualityService() {
        this.validationRules = [
            // Financial data rules
            {
                field: 'financials.incomeStatement',
                type: 'required',
                validator: function (value) { return Array.isArray(value) && value.length > 0; },
                message: 'Income statement data is missing',
                severity: 'error'
            },
            {
                field: 'financials.balanceSheet',
                type: 'required',
                validator: function (value) { return Array.isArray(value) && value.length > 0; },
                message: 'Balance sheet data is missing',
                severity: 'error'
            },
            {
                field: 'financials.keyMetrics.peRatio',
                type: 'range',
                validator: function (value) { return value === null || (value > -100 && value < 1000); },
                message: 'P/E ratio is outside reasonable range',
                severity: 'warning'
            },
            {
                field: 'financials.keyMetrics.marketCap',
                type: 'range',
                validator: function (value) { return value > 0; },
                message: 'Market cap must be positive',
                severity: 'error'
            },
            // Company data rules
            {
                field: 'ticker',
                type: 'format',
                validator: function (value) { return /^[A-Z]{1,5}$/.test(value); },
                message: 'Invalid ticker format',
                severity: 'error'
            },
            {
                field: 'companyName',
                type: 'required',
                validator: function (value) { return value && value.length > 0; },
                message: 'Company name is required',
                severity: 'error'
            },
            // Freshness rules
            {
                field: 'metadata.lastUpdated',
                type: 'freshness',
                validator: function (value) {
                    if (!value)
                        return false;
                    var age = Date.now() - new Date(value).getTime();
                    return age < 24 * 60 * 60 * 1000; // Less than 24 hours old
                },
                message: 'Data is more than 24 hours old',
                severity: 'warning'
            }
        ];
    }
    /**
     * Assesses overall data quality for company data
     */
    DataQualityService.prototype.assessDataQuality = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var fieldAssessments, issues, financialQuality, companyQuality, newsQuality, technicalQuality, completeness, accuracy, consistency, timeliness, relevance, overallScore;
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('DataQualityService', "Assessing data quality for ".concat(data.ticker));
                fieldAssessments = [];
                issues = {
                    missingFields: [],
                    staleData: [],
                    inconsistencies: [],
                    warnings: [],
                    recommendations: []
                };
                financialQuality = this.assessFinancialData(data.financials, issues);
                companyQuality = this.assessCompanyInfo(data, issues);
                newsQuality = this.assessNewsData(data.news, issues);
                technicalQuality = this.assessTechnicalData(data.technicals, issues);
                completeness = this.calculateCompleteness(data, issues);
                accuracy = this.calculateAccuracy(data, issues);
                consistency = this.calculateConsistency(data, issues);
                timeliness = this.calculateTimeliness(data, issues);
                relevance = this.calculateRelevance(data, issues);
                overallScore = (completeness * 0.25 +
                    accuracy * 0.25 +
                    consistency * 0.20 +
                    timeliness * 0.20 +
                    relevance * 0.10);
                // Generate recommendations
                this.generateRecommendations(data, issues, overallScore);
                return [2 /*return*/, {
                        overallScore: Math.round(overallScore * 100) / 100,
                        completeness: Math.round(completeness * 100) / 100,
                        accuracy: Math.round(accuracy * 100) / 100,
                        consistency: Math.round(consistency * 100) / 100,
                        timeliness: Math.round(timeliness * 100) / 100,
                        relevance: Math.round(relevance * 100) / 100,
                        details: issues
                    }];
            });
        });
    };
    /**
     * Validates data against predefined rules
     */
    DataQualityService.prototype.validateData = function (data) {
        var errors = [];
        var warnings = [];
        for (var _i = 0, _a = this.validationRules; _i < _a.length; _i++) {
            var rule = _a[_i];
            var value = this.getNestedValue(data, rule.field);
            var isValid = rule.validator(value, data);
            if (!isValid) {
                if (rule.severity === 'error') {
                    errors.push(rule.message);
                }
                else {
                    warnings.push(rule.message);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    };
    /**
     * Enriches data with quality metadata
     */
    DataQualityService.prototype.enrichWithQualityMetadata = function (data, metrics) {
        return __assign(__assign({}, data), { metadata: __assign(__assign({}, data.metadata), { quality: {
                    overall: metrics.overallScore,
                    completeness: metrics.completeness,
                    accuracy: metrics.accuracy,
                    consistency: metrics.consistency,
                    timeliness: metrics.timeliness,
                    relevance: metrics.relevance,
                    assessedAt: new Date().toISOString(),
                    issues: metrics.details.warnings.length + metrics.details.inconsistencies.length,
                    recommendations: metrics.details.recommendations
                } }) });
    };
    /**
     * Cross-validates data across multiple sources
     */
    DataQualityService.prototype.crossValidateData = function (data) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        var discrepancies = [];
        // Check market cap consistency
        if (((_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics) === null || _b === void 0 ? void 0 : _b.marketCap) && ((_c = data.technicals) === null || _c === void 0 ? void 0 : _c.marketCap)) {
            var financialMktCap = data.financials.keyMetrics.marketCap;
            var technicalMktCap = data.technicals.marketCap;
            var diff = Math.abs(financialMktCap - technicalMktCap) / financialMktCap;
            if (diff > 0.05) { // More than 5% difference
                discrepancies.push({
                    field: 'marketCap',
                    sources: {
                        financials: financialMktCap,
                        technicals: technicalMktCap
                    }
                });
            }
        }
        // Check P/E ratio consistency
        if (((_e = (_d = data.financials) === null || _d === void 0 ? void 0 : _d.keyMetrics) === null || _e === void 0 ? void 0 : _e.peRatio) && ((_g = (_f = data.financials) === null || _f === void 0 ? void 0 : _f.incomeStatement) === null || _g === void 0 ? void 0 : _g[0])) {
            var reportedPE = data.financials.keyMetrics.peRatio;
            var latestIncome = data.financials.incomeStatement[0];
            if (latestIncome.eps && ((_h = data.technicals) === null || _h === void 0 ? void 0 : _h.currentPrice)) {
                var calculatedPE = data.technicals.currentPrice / latestIncome.eps;
                var diff = Math.abs(reportedPE - calculatedPE) / reportedPE;
                if (diff > 0.1) { // More than 10% difference
                    discrepancies.push({
                        field: 'peRatio',
                        sources: {
                            reported: reportedPE,
                            calculated: calculatedPE
                        }
                    });
                }
            }
        }
        // Calculate confidence based on discrepancies
        var confidence = Math.max(0, 1 - (discrepancies.length * 0.1));
        return { discrepancies: discrepancies, confidence: confidence };
    };
    /**
     * Private assessment methods
     */
    DataQualityService.prototype.assessFinancialData = function (financials, issues) {
        if (!financials) {
            issues.missingFields.push('Financial data');
            return 0;
        }
        var score = 0;
        var checks = 0;
        // Check income statement
        if (financials.incomeStatement && financials.incomeStatement.length > 0) {
            score += 1;
            // Check data freshness
            var latestDate = new Date(financials.incomeStatement[0].date);
            var monthsOld = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
            if (monthsOld > 4) {
                issues.staleData.push('Income statement data is more than 4 months old');
            }
            // Check completeness
            var requiredFields = ['revenue', 'netIncome', 'eps'];
            var missingIncomeFields = requiredFields.filter(function (field) {
                return !financials.incomeStatement[0][field];
            });
            if (missingIncomeFields.length > 0) {
                issues.missingFields.push("Income statement: ".concat(missingIncomeFields.join(', ')));
                score -= 0.1 * missingIncomeFields.length;
            }
        }
        else {
            issues.missingFields.push('Income statement');
        }
        checks += 1;
        // Check balance sheet
        if (financials.balanceSheet && financials.balanceSheet.length > 0) {
            score += 1;
            // Check accounting equation
            var bs = financials.balanceSheet[0];
            if (bs.totalAssets && bs.totalLiabilities && bs.totalEquity) {
                var diff = Math.abs(bs.totalAssets - (bs.totalLiabilities + bs.totalEquity));
                var tolerance = bs.totalAssets * 0.01; // 1% tolerance
                if (diff > tolerance) {
                    issues.inconsistencies.push('Balance sheet equation does not balance');
                }
            }
        }
        else {
            issues.missingFields.push('Balance sheet');
        }
        checks += 1;
        // Check key metrics
        if (financials.keyMetrics) {
            score += 0.5;
            // Validate metric ranges
            var metrics = financials.keyMetrics;
            if (metrics.peRatio && (metrics.peRatio < -100 || metrics.peRatio > 1000)) {
                issues.warnings.push('P/E ratio appears unusual');
            }
            if (metrics.debtToEquity && metrics.debtToEquity < 0) {
                issues.inconsistencies.push('Debt-to-equity ratio cannot be negative');
            }
        }
        else {
            issues.missingFields.push('Key financial metrics');
        }
        checks += 0.5;
        return Math.max(0, score / checks);
    };
    DataQualityService.prototype.assessCompanyInfo = function (data, issues) {
        var score = 0;
        var checks = 0;
        // Required fields
        var requiredFields = ['ticker', 'companyName', 'sector', 'industry'];
        requiredFields.forEach(function (field) {
            if (data[field]) {
                score += 1;
            }
            else {
                issues.missingFields.push(field);
            }
            checks += 1;
        });
        // Description quality
        if (data.description) {
            score += 1;
            if (data.description.length < 50) {
                issues.warnings.push('Company description is very brief');
                score -= 0.3;
            }
        }
        else {
            issues.missingFields.push('Company description');
        }
        checks += 1;
        return score / checks;
    };
    DataQualityService.prototype.assessNewsData = function (news, issues) {
        if (!news || news.length === 0) {
            issues.missingFields.push('News data');
            return 0.3; // Not critical
        }
        var totalScore = 0;
        var validArticles = 0;
        news.forEach(function (article) {
            var _a, _b;
            var articleScore = 0;
            // Check required fields
            if (article.title)
                articleScore += 0.25;
            if (article.source)
                articleScore += 0.25;
            if (article.publishedDate)
                articleScore += 0.25;
            if (article.url)
                articleScore += 0.25;
            // Check metadata quality
            if ((_b = (_a = article.metadata) === null || _a === void 0 ? void 0 : _a.dataQuality) === null || _b === void 0 ? void 0 : _b.score) {
                articleScore *= article.metadata.dataQuality.score;
            }
            if (articleScore > 0.5) {
                validArticles++;
                totalScore += articleScore;
            }
        });
        var avgScore = validArticles > 0 ? totalScore / validArticles : 0;
        if (validArticles < 5) {
            issues.warnings.push("Only ".concat(validArticles, " high-quality news articles found"));
        }
        return avgScore;
    };
    DataQualityService.prototype.assessTechnicalData = function (technicals, issues) {
        if (!technicals) {
            issues.missingFields.push('Technical data');
            return 0.5; // Somewhat optional
        }
        var score = 0;
        var checks = 0;
        // Price data
        if (technicals.currentPrice && technicals.currentPrice > 0) {
            score += 1;
        }
        else {
            issues.missingFields.push('Current price');
        }
        checks += 1;
        // Historical prices
        if (technicals.historicalPrices && technicals.historicalPrices.length > 20) {
            score += 1;
            // Check data continuity
            var prices = technicals.historicalPrices;
            var gaps = 0;
            for (var i = 1; i < prices.length; i++) {
                var prevDate = new Date(prices[i - 1].date);
                var currDate = new Date(prices[i].date);
                var daysDiff = (prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 5) { // More than 5 days gap (accounting for weekends)
                    gaps++;
                }
            }
            if (gaps > prices.length * 0.1) {
                issues.warnings.push('Historical price data has significant gaps');
                score -= 0.3;
            }
        }
        else {
            issues.missingFields.push('Sufficient historical price data');
        }
        checks += 1;
        return score / checks;
    };
    DataQualityService.prototype.calculateCompleteness = function (data, issues) {
        var totalFields = issues.missingFields.length;
        var expectedFields = 20; // Approximate number of key fields
        return Math.max(0, 1 - (totalFields / expectedFields));
    };
    DataQualityService.prototype.calculateAccuracy = function (data, issues) {
        var inconsistencies = issues.inconsistencies.length;
        var warnings = issues.warnings.length;
        // Start with perfect score and deduct
        var score = 1.0;
        score -= inconsistencies * 0.15; // Each inconsistency reduces score
        score -= warnings * 0.05; // Warnings have less impact
        return Math.max(0, score);
    };
    DataQualityService.prototype.calculateConsistency = function (data, issues) {
        var _a = this.crossValidateData(data), discrepancies = _a.discrepancies, confidence = _a.confidence;
        // Add discrepancies to issues
        discrepancies.forEach(function (d) {
            issues.inconsistencies.push("".concat(d.field, " has different values across sources: ").concat(JSON.stringify(d.sources)));
        });
        return confidence;
    };
    DataQualityService.prototype.calculateTimeliness = function (data, issues) {
        var _a, _b, _c, _d;
        var now = Date.now();
        var totalScore = 0;
        var weights = 0;
        // Check financial data freshness (most important)
        if ((_b = (_a = data.financials) === null || _a === void 0 ? void 0 : _a.incomeStatement) === null || _b === void 0 ? void 0 : _b[0]) {
            var latestFinancialDate = new Date(data.financials.incomeStatement[0].date);
            var financialAge = (now - latestFinancialDate.getTime()) / (1000 * 60 * 60 * 24);
            var financialScore = 1.0;
            if (financialAge > 120)
                financialScore = 0.3; // More than 4 months
            else if (financialAge > 90)
                financialScore = 0.6; // More than 3 months
            else if (financialAge > 45)
                financialScore = 0.8; // More than 1.5 months
            totalScore += financialScore * 0.4;
            weights += 0.4;
        }
        // Check price data freshness
        if ((_c = data.technicals) === null || _c === void 0 ? void 0 : _c.lastUpdated) {
            var priceAge = (now - new Date(data.technicals.lastUpdated).getTime()) / (1000 * 60 * 60);
            var priceScore = 1.0;
            if (priceAge > 24)
                priceScore = 0.5; // More than 1 day
            else if (priceAge > 1)
                priceScore = 0.9; // More than 1 hour
            totalScore += priceScore * 0.3;
            weights += 0.3;
        }
        // Check metadata freshness
        if ((_d = data.metadata) === null || _d === void 0 ? void 0 : _d.lastUpdated) {
            var metadataAge = (now - new Date(data.metadata.lastUpdated).getTime()) / (1000 * 60 * 60);
            var metadataScore = 1.0;
            if (metadataAge > 24)
                metadataScore = 0.7;
            else if (metadataAge > 6)
                metadataScore = 0.9;
            totalScore += metadataScore * 0.3;
            weights += 0.3;
        }
        return weights > 0 ? totalScore / weights : 0.5;
    };
    DataQualityService.prototype.calculateRelevance = function (data, issues) {
        // Relevance is contextual, but we can check for basic indicators
        var score = 0.8; // Base relevance
        // Check if we have recent pattern data
        if (data.patterns && data.patterns.length > 0) {
            var recentPatterns = data.patterns.filter(function (p) {
                var age = Date.now() - new Date(p.detectedAt).getTime();
                return age < 7 * 24 * 60 * 60 * 1000; // Within last week
            });
            if (recentPatterns.length > 0) {
                score += 0.1;
            }
        }
        // Check news relevance
        if (data.news && data.news.length > 0) {
            var avgRelevance = data.news.reduce(function (sum, n) { return sum + (n.relevanceScore || 0); }, 0) / data.news.length;
            score += avgRelevance * 0.1;
        }
        return Math.min(1.0, score);
    };
    DataQualityService.prototype.generateRecommendations = function (data, issues, overallScore) {
        // High-priority recommendations
        if (issues.missingFields.includes('Income statement')) {
            issues.recommendations.push('Fetch latest financial statements from TwelveData or SEC filings');
        }
        if (issues.staleData.length > 0) {
            issues.recommendations.push('Refresh financial data to ensure analysis is based on latest information');
        }
        if (issues.inconsistencies.length > 2) {
            issues.recommendations.push('Reconcile data discrepancies across sources for accurate analysis');
        }
        // Quality improvement recommendations
        if (overallScore < 0.7) {
            issues.recommendations.push('Consider fetching data from additional sources to improve coverage');
        }
        if (!data.news || data.news.length < 5) {
            issues.recommendations.push('Gather more news articles for comprehensive sentiment analysis');
        }
        if (!data.transcripts || data.transcripts.length === 0) {
            issues.recommendations.push('Add earnings call transcripts for deeper insights');
        }
    };
    DataQualityService.prototype.getNestedValue = function (obj, path) {
        return path.split('.').reduce(function (current, key) { return current === null || current === void 0 ? void 0 : current[key]; }, obj);
    };
    return DataQualityService;
}());
exports.DataQualityService = DataQualityService;
// Singleton instance
var qualityServiceInstance = null;
/**
 * Gets the data quality service instance
 */
function getDataQualityService() {
    if (!qualityServiceInstance) {
        qualityServiceInstance = new DataQualityService();
    }
    return qualityServiceInstance;
}
exports.getDataQualityService = getDataQualityService;
