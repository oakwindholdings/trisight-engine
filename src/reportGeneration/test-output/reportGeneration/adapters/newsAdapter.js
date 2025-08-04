"use strict";
// src/reportGeneration/adapters/newsAdapter.ts
// News and sentiment data fetching adapter using Firecrawl for intelligent extraction
// Context: Aggregates news from multiple sources with AI-powered sentiment analysis
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
exports.NewsAdapter = void 0;
var baseAdapter_1 = require("../core/baseAdapter");
var firecrawlAdapter_1 = require("./firecrawlAdapter");
var errorHandler_1 = require("../utils/errorHandler");
var logger_1 = require("../../utils/logger");
var axios_1 = __importDefault(require("axios"));
/**
 * Enhanced News adapter implementation
 * Leverages Firecrawl for intelligent news extraction and sentiment analysis
 */
var NewsAdapter = /** @class */ (function (_super) {
    __extends(NewsAdapter, _super);
    function NewsAdapter(config) {
        var _this = _super.call(this, 'News', {
            cache: config.cache,
            debugMode: config.debugMode,
            rateLimitConfig: {
                requestsPerMinute: 30,
                burstSize: 5
            }
        }) || this;
        // API endpoints
        _this.NEWS_API_URL = 'https://newsapi.org/v2';
        _this.ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';
        _this.FINNHUB_URL = 'https://finnhub.io/api/v1';
        // Define reputable financial news sources with credibility weights
        _this.TRUSTED_SOURCES = [
            { domain: 'reuters.com', name: 'Reuters', weight: 1.0 },
            { domain: 'bloomberg.com', name: 'Bloomberg', weight: 1.0 },
            { domain: 'wsj.com', name: 'Wall Street Journal', weight: 0.9 },
            { domain: 'ft.com', name: 'Financial Times', weight: 0.9 },
            { domain: 'cnbc.com', name: 'CNBC', weight: 0.8 },
            { domain: 'marketwatch.com', name: 'MarketWatch', weight: 0.7 },
            { domain: 'seekingalpha.com', name: 'Seeking Alpha', weight: 0.6 },
            { domain: 'businesswire.com', name: 'Business Wire', weight: 0.8 },
            { domain: 'prnewswire.com', name: 'PR Newswire', weight: 0.8 },
            { domain: 'yahoo.com/finance', name: 'Yahoo Finance', weight: 0.7 },
            { domain: 'barrons.com', name: 'Barrons', weight: 0.8 },
            { domain: 'fool.com', name: 'Motley Fool', weight: 0.6 }
        ];
        // Use provided Firecrawl adapter or create new one
        _this.firecrawl = config.firecrawlAdapter || new firecrawlAdapter_1.FirecrawlAdapter({
            cache: config.cache,
            debugMode: config.debugMode
        });
        _this.sentimentThreshold = config.sentimentThreshold || 0.6;
        _this.newsApiKey = config.newsApiKey || process.env.REACT_APP_NEWS_API_KEY;
        _this.alphaVantageApiKey = config.alphaVantageApiKey || process.env.REACT_APP_ALPHA_VANTAGE_API_KEY;
        _this.finnhubApiKey = config.finnhubApiKey || process.env.REACT_APP_FINNHUB_API_KEY;
        // Create cached versions of methods
        _this.getCompanyNews = _this.createCachedMethod(_this.getCompanyNews, 'company_news', 300000 // Cache for 5 minutes
        );
        _this.getThemedNews = _this.createCachedMethod(_this.getThemedNews, 'themed_news', 300000 // Cache for 5 minutes
        );
        return _this;
    }
    /**
     * Gets comprehensive news coverage for a company
     * Aggregates from multiple sources and enriches with metadata
     */
    NewsAdapter.prototype.getCompanyNews = function (ticker, limit, companyName, options) {
        if (limit === void 0) { limit = 20; }
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var name_1, _a, newsPromises, allNewsArrays, newsItems_1, uniqueItems, enrichedItems, filteredItems, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 5, , 6]);
                        _a = companyName;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCompanyName(ticker)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        name_1 = _a;
                        (0, logger_1.logDebug)('NewsAdapter', "Fetching news for ".concat(ticker, " (").concat(name_1, ")"));
                        newsPromises = [];
                        // 1. Finnhub Financial News (if API key available)
                        if (this.finnhubApiKey) {
                            newsPromises.push(this.fetchFinnhubNews(ticker));
                        }
                        // 2. Alpha Vantage News & Sentiment (if API key available)
                        if (this.alphaVantageApiKey) {
                            newsPromises.push(this.fetchAlphaVantageNews(ticker));
                        }
                        // 3. NewsAPI.org (if API key available)
                        if (this.newsApiKey) {
                            newsPromises.push(this.fetchNewsApiNews(name_1, ticker));
                        }
                        // 4. Firecrawl as fallback or supplementary source
                        newsPromises.push(this.firecrawl.getCompanyNews(name_1, ticker, limit));
                        return [4 /*yield*/, Promise.allSettled(newsPromises)];
                    case 3:
                        allNewsArrays = _b.sent();
                        newsItems_1 = [];
                        allNewsArrays.forEach(function (result, index) {
                            if (result.status === 'fulfilled') {
                                (0, logger_1.logDebug)('NewsAdapter', "Source ".concat(index, " returned ").concat(result.value.length, " items"));
                                newsItems_1 = newsItems_1.concat(result.value);
                            }
                            else {
                                (0, logger_1.logDebug)('NewsAdapter', "Source ".concat(index, " failed: ").concat(result.reason));
                            }
                        });
                        uniqueItems = this.deduplicateNews(newsItems_1);
                        return [4 /*yield*/, this.enrichNewsItems(uniqueItems, ticker, options)];
                    case 4:
                        enrichedItems = _b.sent();
                        // Sort by composite score (relevance, credibility, temporal, impact)
                        enrichedItems.sort(function (a, b) {
                            var scoreA = _this.calculateNewsScore(a);
                            var scoreB = _this.calculateNewsScore(b);
                            return scoreB - scoreA;
                        });
                        filteredItems = enrichedItems;
                        if (options.timeRange) {
                            filteredItems = this.filterByTimeRange(enrichedItems, options.timeRange);
                        }
                        // Return top items
                        return [2 /*return*/, filteredItems.slice(0, limit)];
                    case 5:
                        error_1 = _b.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_1, {
                            source: 'News',
                            operation: 'getCompanyNews',
                            ticker: ticker
                        });
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyzes sentiment from recent news articles
     * Provides aggregated sentiment metrics and trends
     */
    NewsAdapter.prototype.getNewsSentiment = function (ticker, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            var newsItems, aggregation, topArticles, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getCompanyNews(ticker, 30, companyName)];
                    case 1:
                        newsItems = _a.sent();
                        if (newsItems.length === 0) {
                            return [2 /*return*/, {
                                    overall: 'neutral',
                                    score: 0,
                                    positiveCount: 0,
                                    negativeCount: 0,
                                    neutralCount: 0,
                                    articles: []
                                }];
                        }
                        aggregation = this.aggregateSentiment(newsItems);
                        topArticles = this.getTopSentimentArticles(newsItems);
                        return [2 /*return*/, {
                                overall: aggregation.overallSentiment,
                                score: aggregation.sentimentScore,
                                positiveCount: aggregation.positiveCount,
                                negativeCount: aggregation.negativeCount,
                                neutralCount: aggregation.neutralCount,
                                articles: topArticles,
                                // Additional insights
                                trend: aggregation.sentimentTrend,
                                keyTopics: aggregation.keyTopics,
                                lastUpdated: new Date().toISOString()
                            }];
                    case 2:
                        error_2 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_2, {
                            source: 'News',
                            operation: 'getNewsSentiment',
                            ticker: ticker
                        });
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Identifies earnings-related news events
     * Filters news for earnings announcements, guidance updates, etc.
     */
    NewsAdapter.prototype.getEarningsEvents = function (ticker, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            var name_2, _a, newsItems, earningsNews, error_3;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        _a = companyName;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCompanyName(ticker)];
                    case 1:
                        _a = (_b.sent());
                        _b.label = 2;
                    case 2:
                        name_2 = _a;
                        return [4 /*yield*/, this.getCompanyNews(ticker, 50, name_2)];
                    case 3:
                        newsItems = _b.sent();
                        earningsNews = newsItems.filter(function (item) {
                            return _this.isEarningsRelated(item);
                        });
                        // Transform to NewsEvent format
                        return [2 /*return*/, earningsNews.map(function (item) { return ({
                                date: item.publishedDate,
                                type: _this.classifyEarningsEvent(item),
                                headline: item.title,
                                description: item.summary,
                                impact: _this.assessImpact(item),
                                source: item.source,
                                url: item.url,
                                metadata: {
                                    sentiment: item.sentiment,
                                    relevanceScore: item.relevanceScore,
                                    keyMetrics: _this.extractKeyMetrics(item)
                                }
                            }); })];
                    case 4:
                        error_3 = _b.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_3, {
                            source: 'News',
                            operation: 'getEarningsEvents',
                            ticker: ticker
                        });
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets themed news for specific analysis focus
     * Allows targeting specific types of news for deeper analysis
     */
    NewsAdapter.prototype.getThemedNews = function (ticker, theme, limit, companyName) {
        if (limit === void 0) { limit = 10; }
        return __awaiter(this, void 0, void 0, function () {
            var themeKeywords, keywords_1, newsItems, themedNews, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        themeKeywords = {
                            technology: ['AI', 'innovation', 'product', 'launch', 'technology', 'patent', 'research', 'development'],
                            financial: ['earnings', 'revenue', 'profit', 'guidance', 'forecast', 'financial', 'quarter'],
                            regulatory: ['SEC', 'regulation', 'compliance', 'investigation', 'lawsuit', 'legal', 'government'],
                            competitive: ['competitor', 'market share', 'rival', 'competition', 'industry', 'versus'],
                            market: ['stock', 'shares', 'trading', 'analyst', 'upgrade', 'downgrade', 'price target']
                        };
                        keywords_1 = themeKeywords[theme] || [];
                        return [4 /*yield*/, this.getCompanyNews(ticker, limit * 2, // Get more to filter
                            companyName, { focusAreas: keywords_1 })];
                    case 1:
                        newsItems = _a.sent();
                        themedNews = newsItems.filter(function (item) {
                            var text = "".concat(item.title, " ").concat(item.summary || '').toLowerCase();
                            return keywords_1.some(function (keyword) { return text.includes(keyword.toLowerCase()); });
                        });
                        return [2 /*return*/, themedNews.slice(0, limit)];
                    case 2:
                        error_4 = _a.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_4, {
                            source: 'News',
                            operation: 'getThemedNews',
                            ticker: ticker
                        });
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets general company events from news
     * Includes product launches, management changes, M&A activity, etc.
     */
    NewsAdapter.prototype.getCompanyEvents = function (ticker, companyName) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var name_3, _b, newsItems, events, _i, newsItems_2, item, eventType, error_5;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 4, , 5]);
                        _b = companyName;
                        if (_b) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCompanyName(ticker)];
                    case 1:
                        _b = (_c.sent());
                        _c.label = 2;
                    case 2:
                        name_3 = _b;
                        return [4 /*yield*/, this.getCompanyNews(ticker, 50, name_3)];
                    case 3:
                        newsItems = _c.sent();
                        events = [];
                        for (_i = 0, newsItems_2 = newsItems; _i < newsItems_2.length; _i++) {
                            item = newsItems_2[_i];
                            eventType = this.classifyEvent(item);
                            if (eventType !== 'other') {
                                events.push({
                                    date: item.publishedDate,
                                    type: eventType,
                                    headline: item.title,
                                    description: item.summary,
                                    impact: this.assessImpact(item),
                                    source: item.source,
                                    url: item.url,
                                    metadata: {
                                        sentiment: item.sentiment,
                                        relevanceScore: item.relevanceScore,
                                        keyTopics: ((_a = item.metadata) === null || _a === void 0 ? void 0 : _a.keyTopics) || []
                                    }
                                });
                            }
                        }
                        // Sort by date and impact
                        return [2 /*return*/, events.sort(function (a, b) {
                                var dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                                if (Math.abs(dateDiff) < 86400000) { // Within same day
                                    return _this.getImpactScore(b.impact) - _this.getImpactScore(a.impact);
                                }
                                return dateDiff;
                            })];
                    case 4:
                        error_5 = _c.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_5, {
                            source: 'News',
                            operation: 'getCompanyEvents',
                            ticker: ticker
                        });
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Gets competitive intelligence by analyzing news about competitors
     * Useful for understanding market positioning and threats
     */
    NewsAdapter.prototype.getCompetitiveIntelligence = function (ticker, competitors, companyName) {
        return __awaiter(this, void 0, void 0, function () {
            var name_4, _a, companyNews, competitorNews, _i, competitors_1, competitor, competitorName, _b, _c, companySentiment, competitorSentiments, avgCompetitorScore, relativeSentiment, threats_1, opportunities_1, error_6;
            var _this = this;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 9, , 10]);
                        _a = companyName;
                        if (_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getCompanyName(ticker)];
                    case 1:
                        _a = (_d.sent());
                        _d.label = 2;
                    case 2:
                        name_4 = _a;
                        return [4 /*yield*/, this.getCompanyNews(ticker, 20, name_4)];
                    case 3:
                        companyNews = _d.sent();
                        competitorNews = {};
                        _i = 0, competitors_1 = competitors;
                        _d.label = 4;
                    case 4:
                        if (!(_i < competitors_1.length)) return [3 /*break*/, 8];
                        competitor = competitors_1[_i];
                        return [4 /*yield*/, this.getCompanyName(competitor)];
                    case 5:
                        competitorName = _d.sent();
                        _b = competitorNews;
                        _c = competitor;
                        return [4 /*yield*/, this.getCompanyNews(competitor, 10, competitorName)];
                    case 6:
                        _b[_c] = _d.sent();
                        _d.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 4];
                    case 8:
                        companySentiment = this.aggregateSentiment(companyNews);
                        competitorSentiments = Object.entries(competitorNews).map(function (_a) {
                            var comp = _a[0], news = _a[1];
                            return ({
                                competitor: comp,
                                sentiment: _this.aggregateSentiment(news)
                            });
                        });
                        avgCompetitorScore = competitorSentiments.reduce(function (sum, c) { return sum + c.sentiment.sentimentScore; }, 0) / competitorSentiments.length;
                        relativeSentiment = companySentiment.sentimentScore > avgCompetitorScore + 0.2 ? 'better' :
                            companySentiment.sentimentScore < avgCompetitorScore - 0.2 ? 'worse' :
                                'similar';
                        threats_1 = [];
                        opportunities_1 = [];
                        // Analyze competitor news for threats
                        Object.values(competitorNews).flat().forEach(function (item) {
                            if (item.sentiment === 'positive') {
                                var text = "".concat(item.title, " ").concat(item.summary || '').toLowerCase();
                                if (text.includes('market share') || text.includes('growth') || text.includes('expansion')) {
                                    threats_1.push("Competitor ".concat(item.title.substring(0, 100)));
                                }
                            }
                        });
                        // Analyze company news for opportunities
                        companyNews.forEach(function (item) {
                            if (item.sentiment === 'positive') {
                                var text = "".concat(item.title, " ").concat(item.summary || '').toLowerCase();
                                if (text.includes('partnership') || text.includes('innovation') || text.includes('breakthrough')) {
                                    opportunities_1.push(item.title.substring(0, 100));
                                }
                            }
                        });
                        return [2 /*return*/, {
                                company: companyNews.slice(0, 10),
                                competitors: Object.fromEntries(Object.entries(competitorNews).map(function (_a) {
                                    var k = _a[0], v = _a[1];
                                    return [k, v.slice(0, 5)];
                                })),
                                analysis: {
                                    relativesentiment: relativeSentiment,
                                    keyThreats: threats_1.slice(0, 5),
                                    keyOpportunities: opportunities_1.slice(0, 5)
                                }
                            }];
                    case 9:
                        error_6 = _d.sent();
                        throw (0, errorHandler_1.wrapDataFetchError)(error_6, {
                            source: 'News',
                            operation: 'getCompetitiveIntelligence',
                            ticker: ticker
                        });
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Helper methods for sentiment analysis and event classification
     */
    NewsAdapter.prototype.aggregateSentiment = function (newsItems) {
        var _a;
        var positiveCount = 0;
        var neutralCount = 0;
        var negativeCount = 0;
        var totalScore = 0;
        // Topic tracking
        var topicMap = new Map();
        // Process each article
        for (var _i = 0, newsItems_3 = newsItems; _i < newsItems_3.length; _i++) {
            var item = newsItems_3[_i];
            // Count sentiment
            switch (item.sentiment) {
                case 'positive':
                    positiveCount++;
                    totalScore += item.relevanceScore;
                    break;
                case 'negative':
                    negativeCount++;
                    totalScore -= item.relevanceScore;
                    break;
                default:
                    neutralCount++;
            }
            // Track topics
            if ((_a = item.metadata) === null || _a === void 0 ? void 0 : _a.keyTopics) {
                for (var _b = 0, _c = item.metadata.keyTopics; _b < _c.length; _b++) {
                    var topic = _c[_b];
                    var existing = topicMap.get(topic) || { count: 0, sentiment: 0 };
                    existing.count++;
                    existing.sentiment += item.sentiment === 'positive' ? 1 :
                        item.sentiment === 'negative' ? -1 : 0;
                    topicMap.set(topic, existing);
                }
            }
        }
        // Calculate overall sentiment
        var totalArticles = newsItems.length;
        var sentimentScore = totalArticles > 0 ? totalScore / totalArticles : 0;
        var overallSentiment = sentimentScore > 0.2 ? 'positive' :
            sentimentScore < -0.2 ? 'negative' : 'neutral';
        // Determine trend (compare recent vs older articles)
        var recentCount = Math.floor(totalArticles / 3);
        var recentScore = this.calculateAverageSentiment(newsItems.slice(0, recentCount));
        var olderScore = this.calculateAverageSentiment(newsItems.slice(recentCount));
        var sentimentTrend = recentScore > olderScore + 0.1 ? 'improving' :
            recentScore < olderScore - 0.1 ? 'declining' : 'stable';
        // Process topics
        var keyTopics = Array.from(topicMap.entries())
            .map(function (_a) {
            var topic = _a[0], data = _a[1];
            return ({
                topic: topic,
                mentions: data.count,
                sentiment: data.sentiment > 0 ? 'positive' :
                    data.sentiment < 0 ? 'negative' : 'neutral'
            });
        })
            .sort(function (a, b) { return b.mentions - a.mentions; })
            .slice(0, 10);
        return {
            overallSentiment: overallSentiment,
            sentimentScore: sentimentScore,
            positiveCount: positiveCount,
            neutralCount: neutralCount,
            negativeCount: negativeCount,
            totalArticles: totalArticles,
            sentimentTrend: sentimentTrend,
            keyTopics: keyTopics
        };
    };
    NewsAdapter.prototype.calculateAverageSentiment = function (items) {
        if (items.length === 0)
            return 0;
        var sum = items.reduce(function (acc, item) {
            return acc + (item.sentiment === 'positive' ? 1 :
                item.sentiment === 'negative' ? -1 : 0) * item.relevanceScore;
        }, 0);
        return sum / items.length;
    };
    NewsAdapter.prototype.getTopSentimentArticles = function (newsItems) {
        // Get top positive and negative articles
        var positive = newsItems
            .filter(function (item) { return item.sentiment === 'positive'; })
            .sort(function (a, b) { return b.relevanceScore - a.relevanceScore; })
            .slice(0, 3);
        var negative = newsItems
            .filter(function (item) { return item.sentiment === 'negative'; })
            .sort(function (a, b) { return b.relevanceScore - a.relevanceScore; })
            .slice(0, 3);
        // Combine and sort by date
        return __spreadArray(__spreadArray([], positive, true), negative, true).sort(function (a, b) { return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime(); });
    };
    NewsAdapter.prototype.isEarningsRelated = function (item) {
        var earningsKeywords = [
            'earnings', 'revenue', 'profit', 'loss', 'guidance',
            'forecast', 'outlook', 'quarterly results', 'q1', 'q2', 'q3', 'q4',
            'beat', 'miss', 'consensus', 'eps', 'ebitda'
        ];
        var text = "".concat(item.title, " ").concat(item.summary).toLowerCase();
        return earningsKeywords.some(function (keyword) { return text.includes(keyword); });
    };
    NewsAdapter.prototype.classifyEarningsEvent = function (item) {
        var text = "".concat(item.title, " ").concat(item.summary).toLowerCase();
        if (text.includes('beat') || text.includes('exceed'))
            return 'earnings_beat';
        if (text.includes('miss') || text.includes('below'))
            return 'earnings_miss';
        if (text.includes('guidance') || text.includes('outlook'))
            return 'guidance_update';
        if (text.includes('forecast') || text.includes('estimate'))
            return 'forecast_revision';
        return 'earnings_announcement';
    };
    NewsAdapter.prototype.classifyEvent = function (item) {
        var text = "".concat(item.title, " ").concat(item.summary).toLowerCase();
        // Product/Service events
        if (/launch|introduce|unveil|release|announce.*product/i.test(text)) {
            return 'product_launch';
        }
        // M&A events
        if (/acquire|acquisition|merge|merger|buyout|takeover/i.test(text)) {
            return 'merger_acquisition';
        }
        // Management changes
        if (/ceo|cfo|cto|executive|appoint|resign|retire|hire/i.test(text)) {
            return 'management_change';
        }
        // Legal/Regulatory
        if (/lawsuit|litigation|regulatory|investigation|fine|penalty/i.test(text)) {
            return 'legal_regulatory';
        }
        // Partnership/Strategic
        if (/partnership|collaboration|alliance|joint venture|agreement/i.test(text)) {
            return 'partnership';
        }
        // Financial events
        if (/dividend|buyback|share repurchase|stock split|offering/i.test(text)) {
            return 'financial_event';
        }
        return 'other';
    };
    NewsAdapter.prototype.assessImpact = function (item) {
        // High relevance + strong sentiment = high impact
        if (item.relevanceScore > 0.8 && item.sentiment !== 'neutral') {
            return 'high';
        }
        // Medium relevance or moderate sentiment = medium impact
        if (item.relevanceScore > 0.5 ||
            (item.relevanceScore > 0.3 && item.sentiment !== 'neutral')) {
            return 'medium';
        }
        return 'low';
    };
    NewsAdapter.prototype.getImpactScore = function (impact) {
        switch (impact) {
            case 'high': return 3;
            case 'medium': return 2;
            case 'low': return 1;
            default: return 0;
        }
    };
    NewsAdapter.prototype.extractKeyMetrics = function (item) {
        // Extract financial metrics mentioned in the article
        var text = "".concat(item.title, " ").concat(item.summary);
        var metrics = [];
        // Look for dollar amounts
        var dollarMatches = text.match(/\$[\d,]+\.?\d*\s*(billion|million|thousand)?/gi);
        if (dollarMatches) {
            metrics.push.apply(metrics, dollarMatches.map(function (m) { return ({ type: 'monetary', value: m }); }));
        }
        // Look for percentages
        var percentMatches = text.match(/\d+\.?\d*%/g);
        if (percentMatches) {
            metrics.push.apply(metrics, percentMatches.map(function (m) { return ({ type: 'percentage', value: m }); }));
        }
        return metrics;
    };
    NewsAdapter.prototype.getCompanyName = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var tickerToName;
            return __generator(this, function (_a) {
                tickerToName = {
                    'NVDA': 'NVIDIA Corporation',
                    'AAPL': 'Apple Inc',
                    'GOOGL': 'Alphabet Inc',
                    'MSFT': 'Microsoft Corporation',
                    'TSLA': 'Tesla Inc',
                    'AMZN': 'Amazon.com Inc',
                    'META': 'Meta Platforms Inc',
                    'NFLX': 'Netflix Inc'
                };
                return [2 /*return*/, tickerToName[ticker] || ticker];
            });
        });
    };
    /**
     * Enriches news items with additional metadata and scoring
     */
    NewsAdapter.prototype.enrichNewsItems = function (items, ticker, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(items.map(function (item) { return __awaiter(_this, void 0, void 0, function () {
                        var sourceWeight, enhancedRelevance, temporalScore, impactScore;
                        return __generator(this, function (_a) {
                            sourceWeight = this.getSourceWeight(item.source, item.url);
                            enhancedRelevance = this.calculateEnhancedRelevance(item, ticker, options);
                            temporalScore = this.calculateTemporalRelevance(item.publishedDate);
                            impactScore = this.estimateImpactScore(item);
                            return [2 /*return*/, __assign(__assign({}, item), { relevanceScore: enhancedRelevance, metadata: __assign(__assign({}, item.metadata), { sourceCredibility: sourceWeight, temporalRelevance: temporalScore, impactScore: impactScore, compositeScore: this.calculateCompositeScore({
                                            relevance: enhancedRelevance,
                                            credibility: sourceWeight,
                                            temporal: temporalScore,
                                            impact: impactScore
                                        }) }) })];
                        });
                    }); }))];
            });
        });
    };
    /**
     * Calculates a composite score for news ranking
     */
    NewsAdapter.prototype.calculateNewsScore = function (item) {
        var _a, _b, _c, _d;
        return ((_a = item.metadata) === null || _a === void 0 ? void 0 : _a.compositeScore) || this.calculateCompositeScore({
            relevance: item.relevanceScore || 0,
            credibility: ((_b = item.metadata) === null || _b === void 0 ? void 0 : _b.sourceCredibility) || 0.5,
            temporal: ((_c = item.metadata) === null || _c === void 0 ? void 0 : _c.temporalRelevance) || 0.5,
            impact: ((_d = item.metadata) === null || _d === void 0 ? void 0 : _d.impactScore) || 0.5
        });
    };
    /**
     * Calculates composite score from individual components
     */
    NewsAdapter.prototype.calculateCompositeScore = function (scores) {
        // Weighted combination
        return (scores.relevance * 0.3) +
            (scores.credibility * 0.3) +
            (scores.temporal * 0.2) +
            (scores.impact * 0.2);
    };
    /**
     * Gets source credibility weight based on trusted sources list
     */
    NewsAdapter.prototype.getSourceWeight = function (source, url) {
        var normalizedSource = source.toLowerCase();
        var normalizedUrl = url.toLowerCase();
        // Check against trusted sources
        var trusted = this.TRUSTED_SOURCES.find(function (s) {
            return normalizedSource.includes(s.name.toLowerCase()) ||
                normalizedUrl.includes(s.domain);
        });
        return (trusted === null || trusted === void 0 ? void 0 : trusted.weight) || 0.5; // Default weight for unknown sources
    };
    /**
     * Calculates enhanced relevance based on multiple factors
     */
    NewsAdapter.prototype.calculateEnhancedRelevance = function (item, ticker, options) {
        var _a;
        var score = item.relevanceScore || 0;
        // Boost if focus areas are mentioned
        if (options.focusAreas && ((_a = item.metadata) === null || _a === void 0 ? void 0 : _a.keyTopics)) {
            var topicMatches = options.focusAreas.filter(function (area) {
                return item.metadata.keyTopics.some(function (topic) {
                    return topic.toLowerCase().includes(area.toLowerCase());
                });
            });
            score += topicMatches.length * 0.1;
        }
        // Boost for exclusive or breaking news
        var titleLower = item.title.toLowerCase();
        if (titleLower.includes('exclusive') ||
            titleLower.includes('breaking') ||
            titleLower.includes('first')) {
            score += 0.15;
        }
        // Boost for earnings or major announcements
        var importantKeywords = [
            'earnings', 'acquisition', 'merger', 'guidance', 'forecast',
            'breakthrough', 'approval', 'partnership', 'contract', 'deal'
        ];
        var text = "".concat(item.title, " ").concat(item.summary || '').toLowerCase();
        var keywordMatches = importantKeywords.filter(function (keyword) { return text.includes(keyword); });
        score += keywordMatches.length * 0.1;
        // Boost for specific ticker mentions in title
        if (item.title.toUpperCase().includes(ticker)) {
            score += 0.2;
        }
        return Math.min(score, 1); // Cap at 1
    };
    /**
     * Calculates temporal relevance (how recent the news is)
     */
    NewsAdapter.prototype.calculateTemporalRelevance = function (publishedDate) {
        var now = Date.now();
        var published = new Date(publishedDate).getTime();
        var hoursSincePublished = (now - published) / (1000 * 60 * 60);
        // Exponential decay over time
        if (hoursSincePublished < 1)
            return 1.0; // Last hour
        if (hoursSincePublished < 6)
            return 0.95; // Last 6 hours
        if (hoursSincePublished < 24)
            return 0.9; // Last day
        if (hoursSincePublished < 72)
            return 0.8; // Last 3 days
        if (hoursSincePublished < 168)
            return 0.6; // Last week
        if (hoursSincePublished < 720)
            return 0.4; // Last month
        if (hoursSincePublished < 2160)
            return 0.2; // Last quarter
        return 0.1; // Older than 3 months
    };
    /**
     * Estimates the potential market impact of news
     */
    NewsAdapter.prototype.estimateImpactScore = function (item) {
        var score = 0.5; // Base score
        // High impact keywords
        var highImpact = [
            'merger', 'acquisition', 'bankruptcy', 'fraud', 'investigation',
            'breakthrough', 'approval', 'contract', 'partnership', 'lawsuit',
            'recall', 'scandal', 'crisis', 'layoffs', 'restructuring'
        ];
        var mediumImpact = [
            'earnings', 'revenue', 'guidance', 'forecast', 'upgrade', 'downgrade',
            'expansion', 'launch', 'innovation', 'patent', 'milestone'
        ];
        var text = "".concat(item.title, " ").concat(item.summary || '').toLowerCase();
        // Check for high impact keywords
        highImpact.forEach(function (keyword) {
            if (text.includes(keyword))
                score = Math.max(score, 0.9);
        });
        // Check for medium impact keywords
        mediumImpact.forEach(function (keyword) {
            if (text.includes(keyword))
                score = Math.max(score, 0.7);
        });
        // Adjust based on sentiment strength
        if (item.sentiment === 'positive' && score > 0.7)
            score = Math.min(score + 0.1, 1);
        if (item.sentiment === 'negative' && score > 0.7)
            score = Math.min(score + 0.15, 1);
        // Boost for multiple exclamation points or all caps (often indicates significance)
        if (item.title.includes('!') || /[A-Z]{5,}/.test(item.title)) {
            score = Math.min(score + 0.1, 1);
        }
        return score;
    };
    /**
     * Filters news items by time range
     */
    NewsAdapter.prototype.filterByTimeRange = function (items, range) {
        var now = Date.now();
        var ranges = {
            'day': 24 * 60 * 60 * 1000,
            'week': 7 * 24 * 60 * 60 * 1000,
            'month': 30 * 24 * 60 * 60 * 1000,
            'quarter': 90 * 24 * 60 * 60 * 1000
        };
        var cutoff = now - (ranges[range] || ranges['week']);
        return items.filter(function (item) {
            return new Date(item.publishedDate).getTime() > cutoff;
        });
    };
    /**
     * Fetches news from Finnhub financial news API
     */
    NewsAdapter.prototype.fetchFinnhubNews = function (ticker) {
        return __awaiter(this, void 0, void 0, function () {
            var toDate, fromDate, response, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        toDate = new Date().toISOString().split('T')[0];
                        fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                        return [4 /*yield*/, axios_1["default"].get("".concat(this.FINNHUB_URL, "/company-news"), {
                                params: {
                                    symbol: ticker,
                                    from: fromDate,
                                    to: toDate,
                                    token: this.finnhubApiKey
                                },
                                timeout: 10000
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.data || !Array.isArray(response.data)) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, response.data.map(function (article) { return ({
                                id: "finnhub_".concat(article.id),
                                title: article.headline,
                                summary: article.summary,
                                url: article.url,
                                source: article.source,
                                publishedDate: new Date(article.datetime * 1000).toISOString(),
                                sentiment: _this.categorizeSentiment(article.sentiment),
                                relevanceScore: 0.8,
                                metadata: {
                                    provider: 'finnhub',
                                    category: article.category,
                                    imageUrl: article.image,
                                    relatedTickers: article.related ? article.related.split(',') : [ticker]
                                }
                            }); })];
                    case 2:
                        error_7 = _a.sent();
                        (0, logger_1.logDebug)('NewsAdapter', "Finnhub fetch failed: ".concat(error_7.message));
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches news from Alpha Vantage news & sentiment API
     */
    NewsAdapter.prototype.fetchAlphaVantageNews = function (ticker) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var response, error_8;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1["default"].get(this.ALPHA_VANTAGE_URL, {
                                params: {
                                    "function": 'NEWS_SENTIMENT',
                                    tickers: ticker,
                                    apikey: this.alphaVantageApiKey,
                                    limit: 50
                                },
                                timeout: 10000
                            })];
                    case 1:
                        response = _b.sent();
                        if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.feed) || !Array.isArray(response.data.feed)) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, response.data.feed.map(function (article) {
                                var _a, _b;
                                // Find ticker-specific sentiment
                                var tickerSentiment = ((_a = article.ticker_sentiment) === null || _a === void 0 ? void 0 : _a.find(function (ts) { return ts.ticker === ticker; })) || {};
                                return {
                                    id: "av_".concat(article.url.split('/').pop()),
                                    title: article.title,
                                    summary: article.summary,
                                    url: article.url,
                                    source: article.source || article.source_domain,
                                    publishedDate: article.time_published,
                                    sentiment: _this.mapAlphaVantageSentiment(tickerSentiment.ticker_sentiment_label),
                                    relevanceScore: parseFloat(tickerSentiment.relevance_score || '0.5'),
                                    metadata: {
                                        provider: 'alphavantage',
                                        authors: article.authors,
                                        topics: (_b = article.topics) === null || _b === void 0 ? void 0 : _b.map(function (t) { return t.topic; }),
                                        overallSentimentScore: parseFloat(article.overall_sentiment_score || '0'),
                                        tickerSentimentScore: parseFloat(tickerSentiment.ticker_sentiment_score || '0')
                                    }
                                };
                            })];
                    case 2:
                        error_8 = _b.sent();
                        (0, logger_1.logDebug)('NewsAdapter', "Alpha Vantage fetch failed: ".concat(error_8.message));
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetches news from NewsAPI.org
     */
    NewsAdapter.prototype.fetchNewsApiNews = function (companyName, ticker) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var query, response, error_9;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        query = "\"".concat(companyName, "\" OR \"").concat(ticker, "\" stock market");
                        return [4 /*yield*/, axios_1["default"].get("".concat(this.NEWS_API_URL, "/everything"), {
                                params: {
                                    q: query,
                                    sortBy: 'relevancy',
                                    language: 'en',
                                    pageSize: 50,
                                    apiKey: this.newsApiKey
                                },
                                timeout: 10000
                            })];
                    case 1:
                        response = _b.sent();
                        if (!((_a = response.data) === null || _a === void 0 ? void 0 : _a.articles) || !Array.isArray(response.data.articles)) {
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, response.data.articles
                                .filter(function (article) { return article.url && article.title; })
                                .map(function (article) {
                                var _a;
                                return ({
                                    id: "newsapi_".concat(article.url.split('/').pop()),
                                    title: article.title,
                                    summary: article.description || ((_a = article.content) === null || _a === void 0 ? void 0 : _a.substring(0, 200)),
                                    url: article.url,
                                    source: article.source.name,
                                    publishedDate: article.publishedAt,
                                    sentiment: 'neutral',
                                    relevanceScore: 0.6,
                                    metadata: {
                                        provider: 'newsapi',
                                        author: article.author,
                                        imageUrl: article.urlToImage
                                    }
                                });
                            })];
                    case 2:
                        error_9 = _b.sent();
                        (0, logger_1.logDebug)('NewsAdapter', "NewsAPI fetch failed: ".concat(error_9.message));
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Deduplicates news items by URL
     */
    NewsAdapter.prototype.deduplicateNews = function (items) {
        var seen = new Set();
        return items.filter(function (item) {
            var normalizedUrl = item.url.toLowerCase().replace(/[?#].*$/, '');
            if (seen.has(normalizedUrl)) {
                return false;
            }
            seen.add(normalizedUrl);
            return true;
        });
    };
    /**
     * Maps Alpha Vantage sentiment labels to our format
     */
    NewsAdapter.prototype.mapAlphaVantageSentiment = function (label) {
        if (!label)
            return 'neutral';
        var normalized = label.toLowerCase();
        if (normalized.includes('bullish') || normalized.includes('positive')) {
            return 'positive';
        }
        if (normalized.includes('bearish') || normalized.includes('negative')) {
            return 'negative';
        }
        return 'neutral';
    };
    /**
     * Categorizes numeric sentiment scores
     */
    NewsAdapter.prototype.categorizeSentiment = function (score) {
        if (score === undefined || score === null)
            return 'neutral';
        if (score > 0.2)
            return 'positive';
        if (score < -0.2)
            return 'negative';
        return 'neutral';
    };
    return NewsAdapter;
}(baseAdapter_1.BaseAdapter));
exports.NewsAdapter = NewsAdapter;
