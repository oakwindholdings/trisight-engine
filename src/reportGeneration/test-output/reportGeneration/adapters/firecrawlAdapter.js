"use strict";
// src/reportGeneration/adapters/firecrawlAdapter.ts
// Firecrawl integration for intelligent web scraping and content extraction
// Context: Handles all web scraping needs with AI-powered extraction capabilities
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.FirecrawlAdapter = void 0;
var baseAdapter_1 = require("../core/baseAdapter");
var errorHandler_1 = require("../utils/errorHandler");
var logger_1 = require("../../utils/logger");
/**
 * Schema definitions for Firecrawl EXTRACT
 * These tell Firecrawl's AI what information we want to extract
 */
var EXTRACTION_SCHEMAS = {
    newsArticle: {
        type: 'object',
        properties: {
            title: {
                type: 'string',
                description: 'The main headline of the article'
            },
            author: {
                type: 'string',
                description: 'Author name or news organization'
            },
            publishedDate: {
                type: 'string',
                description: 'Publication date in ISO format'
            },
            content: {
                type: 'string',
                description: 'Main article text, excluding ads and navigation'
            },
            summary: {
                type: 'string',
                description: 'First 2-3 sentences that summarize the article'
            },
            sentiment: {
                type: 'string',
                "enum": ['positive', 'neutral', 'negative'],
                description: 'Overall sentiment of the article towards the subject company'
            },
            keyTopics: {
                type: 'array',
                items: { type: 'string' },
                description: 'Main topics discussed (e.g., earnings, product launch, regulation)'
            },
            quotes: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        speaker: { type: 'string' },
                        quote: { type: 'string' }
                    }
                },
                description: 'Important quotes from executives or analysts'
            }
        },
        required: ['title', 'content', 'publishedDate']
    },
    companyProfile: {
        type: 'object',
        properties: {
            companyName: {
                type: 'string',
                description: 'Official company name'
            },
            description: {
                type: 'string',
                description: 'Company business description'
            },
            industry: {
                type: 'string',
                description: 'Primary industry classification'
            },
            founded: {
                type: 'string',
                description: 'Year company was founded'
            },
            headquarters: {
                type: 'string',
                description: 'Headquarters location'
            },
            employees: {
                type: 'number',
                description: 'Number of employees'
            },
            website: {
                type: 'string',
                description: 'Official company website'
            },
            executives: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        title: { type: 'string' }
                    }
                },
                description: 'Key executives and their titles'
            }
        }
    },
    financialFiling: {
        type: 'object',
        properties: {
            formType: {
                type: 'string',
                description: 'SEC form type (10-K, 10-Q, 8-K, etc.)'
            },
            filingDate: {
                type: 'string',
                description: 'Filing date in ISO format'
            },
            periodEndDate: {
                type: 'string',
                description: 'Period end date for the filing'
            },
            businessDescription: {
                type: 'string',
                description: 'Item 1 - Business description section'
            },
            riskFactors: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key risk factors mentioned'
            },
            mdAndA: {
                type: 'string',
                description: 'Management Discussion and Analysis section'
            },
            financialHighlights: {
                type: 'object',
                properties: {
                    revenue: { type: 'number' },
                    netIncome: { type: 'number' },
                    eps: { type: 'number' },
                    totalAssets: { type: 'number' },
                    totalLiabilities: { type: 'number' }
                },
                description: 'Key financial metrics from the filing'
            }
        }
    }
};
/**
 * Firecrawl adapter implementation
 * Provides intelligent web scraping with AI-powered extraction
 */
var FirecrawlAdapter = /** @class */ (function (_super) {
    __extends(FirecrawlAdapter, _super);
    function FirecrawlAdapter(config) {
        var _this = _super.call(this, 'Firecrawl', {
            cache: config.cache,
            debugMode: config.debugMode,
            rateLimitConfig: {
                requestsPerMinute: 60,
                burstSize: 10
            }
        }) || this;
        _this.activeRequests = 0;
        // Debug environment variables
        (0, logger_1.logDebug)('FirecrawlAdapter', 'Available env vars:', {
            FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ? '***set***' : 'undefined',
            REACT_APP_FIRECRAWL_API_KEY: process.env.REACT_APP_FIRECRAWL_API_KEY ? '***set***' : 'undefined',
            configApiKey: config.apiKey ? '***set***' : 'undefined'
        });
        _this.apiKey = config.apiKey || process.env.FIRECRAWL_API_KEY || process.env.REACT_APP_FIRECRAWL_API_KEY;
        if (!_this.apiKey) {
            (0, logger_1.logDebug)('FirecrawlAdapter', 'No Firecrawl API key found, will use alternative scraping methods');
            // Don't throw - we'll use alternative methods
        }
        _this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v1';
        _this.maxConcurrent = config.maxConcurrent || 5;
        // Override request config for Firecrawl if API key is available
        if (_this.apiKey) {
            _this.requestConfig.headers['Authorization'] = "Bearer ".concat(_this.apiKey);
        }
        return _this;
    }
    /**
     * Searches for news articles about a company
     * Uses web search to find relevant URLs, then extracts content
     */
    FirecrawlAdapter.prototype.getCompanyNews = function (companyName, ticker, limit) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var searchQuery, searchResults, extractionPromises, newsItems, validItems, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // If no API key, use alternative web scraping
                        if (!this.apiKey) {
                            return [2 /*return*/, this.getCompanyNewsAlternative(companyName, ticker, limit)];
                        }
                        searchQuery = "".concat(companyName, " ").concat(ticker, " news ").concat(new Date().getFullYear());
                        return [4 /*yield*/, this.searchWeb(searchQuery, limit * 2)];
                    case 1:
                        searchResults = _a.sent();
                        if (!searchResults || searchResults.length === 0) {
                            (0, logger_1.logDebug)('FirecrawlAdapter', "No search results found for ".concat(companyName));
                            return [2 /*return*/, []];
                        }
                        extractionPromises = searchResults
                            .slice(0, limit)
                            .map(function (result) { return _this.extractNewsArticle(result.url, companyName); });
                        return [4 /*yield*/, this.processConcurrently(extractionPromises, this.maxConcurrent)];
                    case 2:
                        newsItems = _a.sent();
                        validItems = newsItems
                            .filter(function (item) { return item !== null; })
                            .map(function (article) { return _this.transformToNewsItem(article, ticker); });
                        // Add data quality scores
                        return [2 /*return*/, this.addDataQualityScores(validItems)];
                    case 3:
                        error_1 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_1, {
                            source: 'Firecrawl',
                            operation: 'getCompanyNews',
                            ticker: ticker
                        });
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Searches the web for relevant URLs
     * This is a lightweight operation that doesn't extract content
     */
    FirecrawlAdapter.prototype.searchWeb = function (query, limit) {
        return __awaiter(this, void 0, void 0, function () {
            var url, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = new URL("".concat(this.baseUrl, "/search"));
                        return [4 /*yield*/, this.makeRequest(url.toString(), {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, this.requestConfig.headers),
                                body: JSON.stringify({
                                    query: query,
                                    limit: limit,
                                    includeDomains: [
                                        'reuters.com', 'bloomberg.com', 'cnbc.com', 'wsj.com',
                                        'ft.com', 'marketwatch.com', 'seekingalpha.com',
                                        'yahoo.com/finance', 'businesswire.com'
                                    ],
                                    excludeDomains: [
                                        'reddit.com', 'twitter.com', 'facebook.com' // Avoid social media
                                    ]
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.success) {
                            throw new errorHandler_1.RetryableError("Search failed: ".concat(response.error), errorHandler_1.ErrorCategory.NETWORK, true);
                        }
                        return [2 /*return*/, response.data || []];
                }
            });
        });
    };
    /**
     * Extracts structured data from a news article using AI
     * This is where Firecrawl's EXTRACT magic happens
     */
    FirecrawlAdapter.prototype.extractNewsArticle = function (url, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            var extractUrl, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        extractUrl = new URL("".concat(this.baseUrl, "/extract"));
                        return [4 /*yield*/, this.makeRequest(extractUrl.toString(), {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, this.requestConfig.headers),
                                body: JSON.stringify({
                                    url: url,
                                    schema: EXTRACTION_SCHEMAS.newsArticle,
                                    options: {
                                        formats: ['markdown', 'llm_extraction'],
                                        waitFor: 3000,
                                        screenshot: false,
                                        removeImages: true,
                                        removeForms: true
                                    },
                                    prompt: "Extract information about ".concat(companyName, " from this article. \n                    Focus on financial impact, strategic decisions, and market implications.\n                    Determine sentiment based on how the article portrays the company's prospects.")
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.success || !response.data) {
                            (0, logger_1.logDebug)('FirecrawlAdapter', "Failed to extract from ".concat(url, ": ").concat(response.error));
                            return [2 /*return*/, null];
                        }
                        // Log credits used and update tracking
                        if (response.creditsUsed) {
                            (0, logger_1.logDebug)('FirecrawlAdapter', "Credits used for extraction: ".concat(response.creditsUsed));
                            this.updateCreditUsage(response.creditsUsed);
                        }
                        return [2 /*return*/, response.data];
                    case 2:
                        error_2 = _a.sent();
                        // Don't let individual article failures break the entire news fetch
                        (0, logger_1.logDebug)('FirecrawlAdapter', "Error extracting ".concat(url, ":"), error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transforms extracted article data into our NewsItem format
     * Handles missing fields gracefully
     */
    FirecrawlAdapter.prototype.transformToNewsItem = function (article, ticker) {
        // Calculate relevance score based on how often the company is mentioned
        var content = article.content || '';
        var mentions = (content.match(new RegExp(ticker, 'gi')) || []).length;
        var relevanceScore = Math.min(mentions / 10, 1); // Normalize to 0-1
        return {
            title: article.title || 'Untitled Article',
            url: article.url || '',
            source: article.author || this.extractDomain(article.url),
            publishedDate: this.normalizeDate(article.publishedDate),
            summary: article.summary || this.generateSummary(article.content),
            sentiment: article.sentiment || 'neutral',
            relevanceScore: relevanceScore,
            // Store additional extracted data for potential use
            metadata: {
                keyTopics: article.keyTopics,
                quotes: article.quotes
            }
        };
    };
    /**
     * Scrapes a single URL and returns raw content
     * Useful for pages that don't need structured extraction
     */
    FirecrawlAdapter.prototype.scrapeUrl = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var scrapeUrl, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scrapeUrl = new URL("".concat(this.baseUrl, "/scrape"));
                        return [4 /*yield*/, this.makeRequest(scrapeUrl.toString(), {
                                method: 'POST',
                                headers: __assign({ 'Content-Type': 'application/json' }, this.requestConfig.headers),
                                body: JSON.stringify({
                                    url: url,
                                    formats: ['markdown'],
                                    waitFor: 3000,
                                    removeImages: true
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.success || !response.data) {
                            throw new errorHandler_1.RetryableError("Scrape failed: ".concat(response.error), errorHandler_1.ErrorCategory.NETWORK, true);
                        }
                        return [2 /*return*/, response.data.markdown || response.data.content || ''];
                }
            });
        });
    };
    /**
     * Extracts company profile information from a corporate website
     * Useful for getting official company information
     */
    FirecrawlAdapter.prototype.extractCompanyProfile = function (websiteUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.makeRequest("".concat(this.baseUrl, "/extract"), {
                            method: 'POST',
                            headers: __assign({ 'Content-Type': 'application/json' }, this.requestConfig.headers),
                            body: JSON.stringify({
                                url: websiteUrl,
                                schema: EXTRACTION_SCHEMAS.companyProfile,
                                options: {
                                    formats: ['llm_extraction'],
                                    waitFor: 5000
                                },
                                prompt: 'Extract company information from the about/company page. Focus on official information.'
                            })
                        })];
                    case 1:
                        response = _a.sent();
                        if (!response.success) {
                            throw new errorHandler_1.RetryableError("Company profile extraction failed: ".concat(response.error), errorHandler_1.ErrorCategory.PARSING, false);
                        }
                        return [2 /*return*/, response.data];
                }
            });
        });
    };
    /**
     * Processes promises concurrently with a limit
     * Prevents overwhelming Firecrawl's API with too many simultaneous requests
     */
    FirecrawlAdapter.prototype.processConcurrently = function (promises, maxConcurrent) {
        return __awaiter(this, void 0, void 0, function () {
            var results, executing, _loop_1, _i, promises_1, promise;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        results = [];
                        executing = [];
                        _loop_1 = function (promise) {
                            var wrapped;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        wrapped = promise
                                            .then(function (result) {
                                            results.push(result);
                                        })["catch"](function (error) {
                                            if (_this.debugMode) {
                                                console.error('[Firecrawl] Concurrent processing error:', error);
                                            }
                                            results.push(null); // Push null for failed items
                                        });
                                        executing.push(wrapped);
                                        if (!(executing.length >= maxConcurrent)) return [3 /*break*/, 2];
                                        return [4 /*yield*/, Promise.race(executing)];
                                    case 1:
                                        _b.sent();
                                        executing.splice(executing.findIndex(function (p) { return p === wrapped; }), 1);
                                        _b.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, promises_1 = promises;
                        _a.label = 1;
                    case 1:
                        if (!(_i < promises_1.length)) return [3 /*break*/, 4];
                        promise = promises_1[_i];
                        return [5 /*yield**/, _loop_1(promise)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [4 /*yield*/, Promise.all(executing)];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Alternative news fetching without Firecrawl API
     * Uses direct HTTP requests with content extraction
     */
    FirecrawlAdapter.prototype.getCompanyNewsAlternative = function (companyName, ticker, limit) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                (0, logger_1.logDebug)('FirecrawlAdapter', 'Using alternative news fetching method');
                // For now, return empty array - this would be implemented with
                // direct RSS feeds, Google News RSS, or other public APIs
                return [2 /*return*/, []];
            });
        });
    };
    /**
     * Adds data quality scores to news items
     * This helps AI models understand data reliability
     */
    FirecrawlAdapter.prototype.addDataQualityScores = function (items) {
        var _this = this;
        return items.map(function (item) {
            var qualityScore = _this.calculateDataQuality(item);
            return __assign(__assign({}, item), { metadata: __assign(__assign({}, item.metadata), { dataQuality: {
                        score: qualityScore,
                        completeness: _this.assessCompleteness(item),
                        freshness: _this.assessFreshness(item.publishedDate),
                        sourceReliability: _this.assessSourceReliability(item.source),
                        contentDepth: _this.assessContentDepth(item)
                    } }) });
        });
    };
    /**
     * Calculates overall data quality score
     */
    FirecrawlAdapter.prototype.calculateDataQuality = function (item) {
        var scores = [
            this.assessCompleteness(item),
            this.assessFreshness(item.publishedDate),
            this.assessSourceReliability(item.source),
            this.assessContentDepth(item)
        ];
        // Weighted average
        var weights = [0.2, 0.3, 0.3, 0.2];
        var weightedSum = scores.reduce(function (sum, score, i) { return sum + score * weights[i]; }, 0);
        return Math.round(weightedSum * 100) / 100;
    };
    /**
     * Assesses completeness of news item data
     */
    FirecrawlAdapter.prototype.assessCompleteness = function (item) {
        var requiredFields = ['title', 'url', 'source', 'publishedDate', 'summary'];
        var optionalFields = ['sentiment', 'relevanceScore', 'metadata'];
        var score = 0;
        var requiredWeight = 0.7 / requiredFields.length;
        var optionalWeight = 0.3 / optionalFields.length;
        // Check required fields
        requiredFields.forEach(function (field) {
            if (item[field])
                score += requiredWeight;
        });
        // Check optional fields
        optionalFields.forEach(function (field) {
            if (item[field])
                score += optionalWeight;
        });
        return score;
    };
    /**
     * Assesses freshness of the data
     */
    FirecrawlAdapter.prototype.assessFreshness = function (publishedDate) {
        var ageInHours = (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60);
        if (ageInHours < 1)
            return 1.0;
        if (ageInHours < 6)
            return 0.95;
        if (ageInHours < 24)
            return 0.9;
        if (ageInHours < 72)
            return 0.7;
        if (ageInHours < 168)
            return 0.5;
        if (ageInHours < 720)
            return 0.3;
        return 0.1;
    };
    /**
     * Assesses source reliability
     */
    FirecrawlAdapter.prototype.assessSourceReliability = function (source) {
        var trustedSources = [
            'reuters', 'bloomberg', 'wsj', 'ft', 'cnbc',
            'marketwatch', 'barrons', 'businesswire'
        ];
        var sourceLower = source.toLowerCase();
        if (trustedSources.some(function (trusted) { return sourceLower.includes(trusted); })) {
            return 1.0;
        }
        // Medium reliability sources
        var mediumSources = ['yahoo', 'seekingalpha', 'fool', 'benzinga'];
        if (mediumSources.some(function (medium) { return sourceLower.includes(medium); })) {
            return 0.7;
        }
        return 0.5; // Unknown sources
    };
    /**
     * Assesses content depth
     */
    FirecrawlAdapter.prototype.assessContentDepth = function (item) {
        var score = 0;
        // Check summary length
        if (item.summary) {
            var summaryLength = item.summary.length;
            if (summaryLength > 200)
                score += 0.3;
            else if (summaryLength > 100)
                score += 0.2;
            else if (summaryLength > 50)
                score += 0.1;
        }
        // Check for metadata richness
        if (item.metadata) {
            if (item.metadata.keyTopics && item.metadata.keyTopics.length > 0)
                score += 0.2;
            if (item.metadata.quotes && item.metadata.quotes.length > 0)
                score += 0.3;
            if (item.metadata.impactScore)
                score += 0.1;
            if (item.metadata.sourceCredibility)
                score += 0.1;
        }
        return Math.min(score, 1.0);
    };
    /**
     * Utility functions for data transformation
     */
    FirecrawlAdapter.prototype.extractDomain = function (url) {
        try {
            var domain = new URL(url).hostname;
            return domain.replace('www.', '').split('.')[0];
        }
        catch (_a) {
            return 'Unknown Source';
        }
    };
    FirecrawlAdapter.prototype.normalizeDate = function (dateStr) {
        if (!dateStr)
            return new Date().toISOString();
        try {
            var date = new Date(dateStr);
            return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        }
        catch (_a) {
            return new Date().toISOString();
        }
    };
    FirecrawlAdapter.prototype.generateSummary = function (content, maxLength) {
        if (maxLength === void 0) { maxLength = 200; }
        if (!content)
            return '';
        // Simple summary: first two sentences
        var sentences = content.match(/[^.!?]+[.!?]+/g) || [];
        var summary = sentences.slice(0, 2).join(' ').trim();
        return summary.length > maxLength
            ? summary.substring(0, maxLength - 3) + '...'
            : summary;
    };
    /**
     * Gets current API usage information
     * Firecrawl provides credit-based billing
     */
    FirecrawlAdapter.prototype.getUsageInfo = function () {
        return __awaiter(this, void 0, void 0, function () {
            var usageKey, today, stored, usage, monthlyLimit, dailyLimit;
            return __generator(this, function (_a) {
                usageKey = 'trisight_firecrawl_usage';
                today = new Date().toISOString().split('T')[0];
                try {
                    stored = localStorage.getItem(usageKey);
                    usage = stored ? JSON.parse(stored) : { date: today, credits: 0 };
                    // Reset daily if new day
                    if (usage.date !== today) {
                        usage.date = today;
                        usage.credits = 0;
                    }
                    monthlyLimit = 500;
                    dailyLimit = Math.floor(monthlyLimit / 30);
                    return [2 /*return*/, {
                            creditsUsed: usage.credits,
                            creditsRemaining: Math.max(0, dailyLimit - usage.credits)
                        }];
                }
                catch (error) {
                    // If localStorage fails, return conservative estimate
                    return [2 /*return*/, {
                            creditsUsed: 0,
                            creditsRemaining: 10 // Conservative daily limit
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Updates credit usage after API call
     */
    FirecrawlAdapter.prototype.updateCreditUsage = function (credits) {
        try {
            var usageKey = 'trisight_firecrawl_usage';
            var today = new Date().toISOString().split('T')[0];
            var stored = localStorage.getItem(usageKey);
            var usage = stored ? JSON.parse(stored) : { date: today, credits: 0 };
            if (usage.date !== today) {
                usage.date = today;
                usage.credits = 0;
            }
            usage.credits += credits;
            localStorage.setItem(usageKey, JSON.stringify(usage));
        }
        catch (error) {
            console.warn('[Firecrawl] Failed to update credit usage:', error);
        }
    };
    return FirecrawlAdapter;
}(baseAdapter_1.BaseAdapter));
exports.FirecrawlAdapter = FirecrawlAdapter;
