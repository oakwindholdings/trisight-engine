"use strict";
// src/reportGeneration/utils/dataValidation.ts
// Data validation and enrichment utilities for report generation
// Context: Ensures data quality and adds calculated fields
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
exports.__esModule = true;
exports.normalizeFinancialValue = exports.validateDateFormat = exports.enrichFinancialData = exports.validateFinancialData = void 0;
/**
 * Validates financial data for consistency and completeness
 * Returns array of validation issues found
 */
function validateFinancialData(financials) {
    var issues = [];
    // Check for required sections
    if (!financials.incomeStatement || financials.incomeStatement.length === 0) {
        issues.push('Missing income statement data');
    }
    if (!financials.balanceSheet || financials.balanceSheet.length === 0) {
        issues.push('Missing balance sheet data');
    }
    if (!financials.cashFlow || financials.cashFlow.length === 0) {
        issues.push('Missing cash flow data');
    }
    // Validate income statement consistency
    if (financials.incomeStatement && financials.incomeStatement.length > 0) {
        financials.incomeStatement.forEach(function (statement, index) {
            // Check for required fields
            if (!statement.revenue || statement.revenue <= 0) {
                issues.push("Income statement ".concat(index, ": Invalid revenue value"));
            }
            // Check logical consistency
            if (statement.grossProfit && statement.revenue && statement.costOfRevenue) {
                var calculatedGrossProfit = statement.revenue - statement.costOfRevenue;
                var diff = Math.abs(calculatedGrossProfit - statement.grossProfit);
                if (diff > statement.revenue * 0.01) { // 1% tolerance
                    issues.push("Income statement ".concat(index, ": Gross profit calculation mismatch"));
                }
            }
            // Check for negative margins that don't make sense
            if (statement.grossProfit && statement.revenue) {
                var grossMargin = statement.grossProfit / statement.revenue;
                if (grossMargin < -0.5 || grossMargin > 1) {
                    issues.push("Income statement ".concat(index, ": Unusual gross margin ").concat((grossMargin * 100).toFixed(1), "%"));
                }
            }
        });
    }
    // Validate balance sheet consistency
    if (financials.balanceSheet && financials.balanceSheet.length > 0) {
        financials.balanceSheet.forEach(function (statement, index) {
            // Assets = Liabilities + Equity check
            if (statement.totalAssets && statement.totalLiabilities && statement.totalEquity) {
                var calculatedAssets = statement.totalLiabilities + statement.totalEquity;
                var diff = Math.abs(calculatedAssets - statement.totalAssets);
                if (diff > statement.totalAssets * 0.01) { // 1% tolerance
                    issues.push("Balance sheet ".concat(index, ": Assets don't equal liabilities + equity"));
                }
            }
            // Check for negative values that shouldn't be
            if (statement.totalAssets && statement.totalAssets < 0) {
                issues.push("Balance sheet ".concat(index, ": Negative total assets"));
            }
        });
    }
    // Validate historical prices
    if (financials.historicalPrices && financials.historicalPrices.length > 0) {
        var invalidPrices_1 = 0;
        financials.historicalPrices.forEach(function (price, index) {
            if (!price.date || !price.close || price.close <= 0) {
                invalidPrices_1++;
            }
            // Check for unrealistic price movements
            if (index > 0) {
                var prevPrice = financials.historicalPrices[index - 1].close;
                var changePercent = Math.abs((price.close - prevPrice) / prevPrice);
                if (changePercent > 0.5) { // 50% daily change is suspicious
                    issues.push("Historical prices: Suspicious ".concat((changePercent * 100).toFixed(1), "% change on ").concat(price.date));
                }
            }
        });
        if (invalidPrices_1 > 0) {
            issues.push("Historical prices: ".concat(invalidPrices_1, " invalid price entries"));
        }
    }
    // Validate key metrics
    if (financials.keyMetrics) {
        var metrics = financials.keyMetrics;
        // PE ratio sanity check
        if (metrics.peRatio && (metrics.peRatio < 0 || metrics.peRatio > 1000)) {
            issues.push("Key metrics: Unusual PE ratio ".concat(metrics.peRatio));
        }
        // Current ratio sanity check
        if (metrics.currentRatio && metrics.currentRatio < 0) {
            issues.push('Key metrics: Negative current ratio');
        }
        // Debt to equity sanity check
        if (metrics.debtToEquity && metrics.debtToEquity < 0) {
            issues.push('Key metrics: Negative debt to equity ratio');
        }
    }
    return issues;
}
exports.validateFinancialData = validateFinancialData;
/**
 * Enriches financial data with calculated metrics and ratios
 * Adds derived fields that provide additional insights
 */
function enrichFinancialData(financials) {
    var _a, _b, _c;
    var enriched = __assign({}, financials);
    // Calculate additional income statement metrics
    if (enriched.incomeStatement && enriched.incomeStatement.length > 0) {
        enriched.incomeStatement = enriched.incomeStatement.map(function (statement) {
            var enhanced = __assign({}, statement);
            // Calculate margins if not present
            if (statement.revenue && statement.revenue > 0) {
                if (statement.grossProfit && !enhanced.grossMargin) {
                    enhanced.grossMargin = statement.grossProfit / statement.revenue;
                }
                if (statement.operatingIncome && !enhanced.operatingMargin) {
                    enhanced.operatingMargin = statement.operatingIncome / statement.revenue;
                }
                if (statement.netIncome && !enhanced.netMargin) {
                    enhanced.netMargin = statement.netIncome / statement.revenue;
                }
            }
            // Calculate year-over-year growth if we have previous period
            var prevIndex = enriched.incomeStatement.findIndex(function (s) {
                return s.date && statement.date &&
                    new Date(s.date).getFullYear() === new Date(statement.date).getFullYear() - 1;
            });
            if (prevIndex >= 0) {
                var prevStatement = enriched.incomeStatement[prevIndex];
                if (prevStatement.revenue && statement.revenue) {
                    enhanced.revenueGrowth = (statement.revenue - prevStatement.revenue) / prevStatement.revenue;
                }
                if (prevStatement.netIncome && statement.netIncome) {
                    enhanced.earningsGrowth = (statement.netIncome - prevStatement.netIncome) / Math.abs(prevStatement.netIncome);
                }
            }
            return enhanced;
        });
    }
    // Calculate additional balance sheet metrics
    if (enriched.balanceSheet && enriched.balanceSheet.length > 0) {
        enriched.balanceSheet = enriched.balanceSheet.map(function (statement) {
            var enhanced = __assign({}, statement);
            // Calculate working capital
            if (statement.currentAssets && statement.currentLiabilities) {
                enhanced.workingCapital = statement.currentAssets - statement.currentLiabilities;
            }
            // Calculate book value per share if we have share count
            if (statement.totalEquity && statement.sharesOutstanding && statement.sharesOutstanding > 0) {
                enhanced.bookValuePerShare = statement.totalEquity / statement.sharesOutstanding;
            }
            // Calculate debt ratios
            if (statement.totalDebt && statement.totalAssets && statement.totalAssets > 0) {
                enhanced.debtToAssets = statement.totalDebt / statement.totalAssets;
            }
            return enhanced;
        });
    }
    // Calculate additional cash flow metrics
    if (enriched.cashFlow && enriched.cashFlow.length > 0) {
        enriched.cashFlow = enriched.cashFlow.map(function (statement) {
            var _a;
            var enhanced = __assign({}, statement);
            // Calculate free cash flow
            if (statement.operatingCashFlow && statement.capitalExpenditures) {
                enhanced.freeCashFlow = statement.operatingCashFlow - Math.abs(statement.capitalExpenditures);
            }
            // Calculate cash flow margins if we have revenue
            var incomeStatement = (_a = enriched.incomeStatement) === null || _a === void 0 ? void 0 : _a.find(function (is) {
                return is.date && statement.date &&
                    new Date(is.date).getTime() === new Date(statement.date).getTime();
            });
            if ((incomeStatement === null || incomeStatement === void 0 ? void 0 : incomeStatement.revenue) && statement.operatingCashFlow) {
                enhanced.operatingCashFlowMargin = statement.operatingCashFlow / incomeStatement.revenue;
                if (enhanced.freeCashFlow) {
                    enhanced.freeCashFlowMargin = enhanced.freeCashFlow / incomeStatement.revenue;
                }
            }
            return enhanced;
        });
    }
    // Enhance key metrics with additional calculations
    if (enriched.keyMetrics) {
        var latestIncome = (_a = enriched.incomeStatement) === null || _a === void 0 ? void 0 : _a[0];
        var latestBalance = (_b = enriched.balanceSheet) === null || _b === void 0 ? void 0 : _b[0];
        var latestCashFlow = (_c = enriched.cashFlow) === null || _c === void 0 ? void 0 : _c[0];
        // Calculate ROE if not present
        if (!enriched.keyMetrics.roe && (latestIncome === null || latestIncome === void 0 ? void 0 : latestIncome.netIncome) && (latestBalance === null || latestBalance === void 0 ? void 0 : latestBalance.totalEquity)) {
            enriched.keyMetrics.roe = latestIncome.netIncome / latestBalance.totalEquity;
        }
        // Calculate ROA
        if ((latestIncome === null || latestIncome === void 0 ? void 0 : latestIncome.netIncome) && (latestBalance === null || latestBalance === void 0 ? void 0 : latestBalance.totalAssets)) {
            enriched.keyMetrics.roa = latestIncome.netIncome / latestBalance.totalAssets;
        }
        // Calculate FCF yield if we have market cap
        if ((latestCashFlow === null || latestCashFlow === void 0 ? void 0 : latestCashFlow.freeCashFlow) && enriched.keyMetrics.marketCap && enriched.keyMetrics.marketCap > 0) {
            enriched.keyMetrics.fcfYield = latestCashFlow.freeCashFlow / enriched.keyMetrics.marketCap;
        }
        // Calculate earnings yield (inverse of PE)
        if (enriched.keyMetrics.peRatio && enriched.keyMetrics.peRatio > 0) {
            enriched.keyMetrics.earningsYield = 1 / enriched.keyMetrics.peRatio;
        }
    }
    // Add data quality metrics
    enriched.dataQuality = assessFinancialDataQuality(enriched);
    return enriched;
}
exports.enrichFinancialData = enrichFinancialData;
/**
 * Assesses the quality and completeness of financial data
 */
function assessFinancialDataQuality(financials) {
    var _a, _b, _c, _d, _e, _f;
    var completeness = 0;
    var consistency = 0;
    var timeliness = 0;
    // Completeness checks
    var completeChecks = [
        ((_a = financials.incomeStatement) === null || _a === void 0 ? void 0 : _a.length) > 0,
        ((_b = financials.balanceSheet) === null || _b === void 0 ? void 0 : _b.length) > 0,
        ((_c = financials.cashFlow) === null || _c === void 0 ? void 0 : _c.length) > 0,
        ((_d = financials.historicalPrices) === null || _d === void 0 ? void 0 : _d.length) > 200,
        ((_e = financials.keyMetrics) === null || _e === void 0 ? void 0 : _e.peRatio) !== undefined,
        ((_f = financials.keyMetrics) === null || _f === void 0 ? void 0 : _f.marketCap) !== undefined
    ];
    completeness = completeChecks.filter(Boolean).length / completeChecks.length;
    // Consistency checks (no validation errors)
    var validationIssues = validateFinancialData(financials);
    consistency = Math.max(0, 1 - (validationIssues.length / 10));
    // Timeliness checks
    if (financials.incomeStatement && financials.incomeStatement.length > 0) {
        var latestDate = new Date(financials.incomeStatement[0].date);
        var daysSinceLatest = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
        timeliness = Math.max(0, 1 - (daysSinceLatest / 180)); // 6 months as baseline
    }
    var score = (completeness * 0.4 + consistency * 0.4 + timeliness * 0.2);
    return {
        score: score,
        completeness: completeness,
        consistency: consistency,
        timeliness: timeliness
    };
}
/**
 * Validates that dates are in the expected format and range
 */
function validateDateFormat(dateStr) {
    var date = new Date(dateStr);
    if (isNaN(date.getTime()))
        return false;
    // Check if date is reasonable (not in future, not too far in past)
    var now = Date.now();
    var dateTime = date.getTime();
    var yearInMs = 365 * 24 * 60 * 60 * 1000;
    return dateTime <= now && dateTime > now - (50 * yearInMs); // Within last 50 years
}
exports.validateDateFormat = validateDateFormat;
/**
 * Cleans and normalizes financial values
 */
function normalizeFinancialValue(value) {
    if (typeof value === 'number')
        return value;
    if (typeof value === 'string') {
        // Remove common formatting
        var cleaned = value.replace(/[$,]/g, '').trim();
        // Handle millions/billions notation
        var multipliers = {
            'K': 1000,
            'M': 1000000,
            'B': 1000000000,
            'T': 1000000000000
        };
        for (var _i = 0, _a = Object.entries(multipliers); _i < _a.length; _i++) {
            var _b = _a[_i], suffix = _b[0], multiplier = _b[1];
            if (cleaned.toUpperCase().endsWith(suffix)) {
                var num_1 = parseFloat(cleaned.slice(0, -1));
                return isNaN(num_1) ? 0 : num_1 * multiplier;
            }
        }
        var num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}
exports.normalizeFinancialValue = normalizeFinancialValue;
