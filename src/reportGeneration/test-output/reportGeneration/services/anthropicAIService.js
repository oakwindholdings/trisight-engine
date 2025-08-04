"use strict";
// src/reportGeneration/services/anthropicAIService.ts
// Anthropic Claude AI integration for intelligent content generation
// Context: THIS IS THE MOMENT - Adding the WOW factor to reports!
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
exports.getAnthropicAIService = exports.AnthropicAIService = void 0;
var sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
var logger_1 = require("../../utils/logger");
/**
 * Section-specific prompts for different report types
 */
var SECTION_PROMPTS = {
    executiveSummary: {
        equity: "You are a senior equity analyst at a top-tier investment firm. Write a compelling executive summary that captures the investment opportunity in 3-4 paragraphs. Focus on: 1) Current business position and market dynamics, 2) Key financial highlights and trends, 3) Investment recommendation with clear rationale. Use specific numbers and percentages from the data.",
        technical: "You are a chief technical analyst. Write an executive summary focusing on price action, key technical levels, and trading opportunities. Include specific support/resistance levels, trend analysis, and actionable entry/exit points.",
        risk: "You are a risk management director. Write an executive summary that clearly outlines the risk profile, potential downside scenarios, and risk mitigation strategies. Be specific about risk metrics and thresholds."
    },
    investmentThesis: "Based on the comprehensive data provided, craft a compelling investment thesis that would convince an investment committee. Include:\n- The core investment narrative (why this stock, why now?)\n- 3-4 key catalysts that will drive performance\n- Competitive advantages and moat analysis\n- Expected return profile with specific targets\n- Time horizon and key milestones to monitor",
    futureOutlook: "Project the company's trajectory over the next 12-24 months. Consider:\n- Industry trends and disruptions\n- Company's strategic initiatives\n- Financial projections based on current metrics\n- Potential headwinds and tailwinds\n- Scenario analysis (base, bull, bear cases)\nProvide specific, data-driven predictions.",
    competitiveAnalysis: "Analyze the company's competitive position:\n- Market share dynamics and trends\n- Competitive advantages/disadvantages\n- Industry structure and barriers to entry\n- Threat of disruption or new entrants\n- Strategic positioning vs peers\nBe specific with comparisons and use metrics where available."
};
/**
 * Anthropic AI Service
 * Leverages Claude for intelligent, context-aware content generation
 */
var AnthropicAIService = /** @class */ (function () {
    function AnthropicAIService(apiKey) {
        this.model = 'claude-3-opus-20240229'; // Using the most powerful model
        this.maxTokens = 4000;
        var key = apiKey || process.env.REACT_APP_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
        if (!key) {
            throw new Error('Anthropic API key is required. Please set ANTHROPIC_API_KEY or REACT_APP_ANTHROPIC_API_KEY');
        }
        this.client = new sdk_1["default"]({
            apiKey: key
        });
        (0, logger_1.logDebug)('AnthropicAIService', 'Initialized with Claude API');
    }
    /**
     * Generates comprehensive AI content for the entire report
     * THIS IS WHERE THE MAGIC HAPPENS!
     */
    AnthropicAIService.prototype.generateReportContent = function (companyData, analysis, options) {
        var _a, _b;
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var context, _c, executiveSummary, investmentThesis, keyInsights, riskAnalysis, futureOutlook, recommendationRationale, technicalCommentary, _d, competitiveAnalysis, _e, actionItems, error_1;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        (0, logger_1.logDebug)('AnthropicAIService', "Generating AI content for ".concat(companyData.ticker));
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 10, , 11]);
                        context = this.prepareComprehensiveContext(companyData, analysis);
                        return [4 /*yield*/, Promise.all([
                                this.generateExecutiveSummary(context, options),
                                this.generateInvestmentThesis(context, options),
                                this.generateKeyInsights(context, options),
                                this.generateRiskAnalysis(context, options),
                                this.generateFutureOutlook(context, options),
                                this.generateRecommendationRationale(context, analysis, options)
                            ])];
                    case 2:
                        _c = _f.sent(), executiveSummary = _c[0], investmentThesis = _c[1], keyInsights = _c[2], riskAnalysis = _c[3], futureOutlook = _c[4], recommendationRationale = _c[5];
                        if (!((_a = options.focusAreas) === null || _a === void 0 ? void 0 : _a.includes('technical'))) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.generateTechnicalCommentary(context, companyData.technicals)];
                    case 3:
                        _d = _f.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _d = undefined;
                        _f.label = 5;
                    case 5:
                        technicalCommentary = _d;
                        if (!((_b = options.focusAreas) === null || _b === void 0 ? void 0 : _b.includes('competitive'))) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.generateCompetitiveAnalysis(context, companyData)];
                    case 6:
                        _e = _f.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _e = undefined;
                        _f.label = 8;
                    case 8:
                        competitiveAnalysis = _e;
                        return [4 /*yield*/, this.generateActionItems(context, analysis, options)];
                    case 9:
                        actionItems = _f.sent();
                        (0, logger_1.logDebug)('AnthropicAIService', 'AI content generation complete');
                        return [2 /*return*/, {
                                executiveSummary: executiveSummary,
                                investmentThesis: investmentThesis,
                                keyInsights: keyInsights,
                                riskAnalysis: riskAnalysis,
                                futureOutlook: futureOutlook,
                                technicalCommentary: technicalCommentary,
                                competitiveAnalysis: competitiveAnalysis,
                                recommendationRationale: recommendationRationale,
                                actionItems: actionItems
                            }];
                    case 10:
                        error_1 = _f.sent();
                        (0, logger_1.logError)('AnthropicAIService', 'Failed to generate AI content', error_1);
                        throw error_1;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generates an AI-enhanced slide with dynamic content
     */
    AnthropicAIService.prototype.generateEnhancedSlide = function (slideTitle, data, slideType, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = this.buildSlidePrompt(slideTitle, data, slideType, options);
                        return [4 /*yield*/, this.client.messages.create({
                                model: this.model,
                                max_tokens: 1000,
                                messages: [{
                                        role: 'user',
                                        content: prompt
                                    }],
                                temperature: 0.7 // Balanced creativity and accuracy
                            })];
                    case 1:
                        response = _a.sent();
                        content = response.content[0].text;
                        return [2 /*return*/, this.parseSlideContent(slideTitle, content, slideType)];
                }
            });
        });
    };
    /**
     * Private content generation methods
     */
    AnthropicAIService.prototype.generateExecutiveSummary = function (context, options) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var reportType, prompt, response;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        reportType = ((_a = options.focusAreas) === null || _a === void 0 ? void 0 : _a[0]) || 'equity';
                        prompt = SECTION_PROMPTS.executiveSummary[reportType] ||
                            SECTION_PROMPTS.executiveSummary.equity;
                        return [4 /*yield*/, this.client.messages.create({
                                model: this.model,
                                max_tokens: 800,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert financial analyst creating reports for institutional investors. Be specific, data-driven, and insightful.'
                                    },
                                    {
                                        role: 'user',
                                        content: "".concat(prompt, "\n\nCompany Data and Analysis:\n").concat(context)
                                    }
                                ],
                                temperature: 0.7
                            })];
                    case 1:
                        response = _b.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateInvestmentThesis = function (context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 1000,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a portfolio manager at a hedge fund known for identifying exceptional investment opportunities.'
                                },
                                {
                                    role: 'user',
                                    content: "".concat(SECTION_PROMPTS.investmentThesis, "\n\nCompany Data and Analysis:\n").concat(context, "\n\nRisk Tolerance: ").concat(options.riskTolerance || 'moderate')
                                }
                            ],
                            temperature: 0.8 // Slightly more creative for compelling narrative
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateKeyInsights = function (context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, jsonMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 800,
                            messages: [
                                {
                                    role: 'user',
                                    content: "Based on this comprehensive analysis, identify the 5-7 most important insights that investors must know. Each insight should be:\n- Specific and quantified where possible\n- Non-obvious and genuinely insightful\n- Actionable for investment decisions\n- Backed by the data provided\n\nFormat as a JSON array of strings.\n\nCompany Data and Analysis:\n".concat(context)
                                }
                            ],
                            temperature: 0.7
                        })];
                    case 1:
                        response = _a.sent();
                        try {
                            content = response.content[0].text;
                            jsonMatch = content.match(/\[[\s\S]*\]/);
                            if (jsonMatch) {
                                return [2 /*return*/, JSON.parse(jsonMatch[0])];
                            }
                        }
                        catch (error) {
                            (0, logger_1.logError)('AnthropicAIService', 'Failed to parse key insights', error);
                        }
                        // Fallback: split by newlines if JSON parsing fails
                        return [2 /*return*/, response.content[0].text
                                .split('\n')
                                .filter(function (line) { return line.trim().length > 10; })
                                .slice(0, 7)];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateRiskAnalysis = function (context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 1000,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a chief risk officer conducting thorough risk assessments. Be comprehensive but balanced.'
                                },
                                {
                                    role: 'user',
                                    content: "Provide a detailed risk analysis covering:\n1. Market risks (beta, volatility, correlation)\n2. Company-specific risks (operational, financial, strategic)\n3. Industry and macro risks\n4. ESG and regulatory risks\n5. Risk mitigation strategies\n\nUse specific metrics and data points. Quantify risks where possible.\n\nCompany Data and Analysis:\n".concat(context)
                                }
                            ],
                            temperature: 0.6 // Lower temperature for risk analysis
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateFutureOutlook = function (context, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 1000,
                            messages: [
                                {
                                    role: 'user',
                                    content: "".concat(SECTION_PROMPTS.futureOutlook, "\n\nCompany Data and Analysis:\n").concat(context)
                                }
                            ],
                            temperature: 0.8 // Higher creativity for future projections
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateRecommendationRationale = function (context, analysis, options) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendation, confidence, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        recommendation = analysis.composite.recommendation.toUpperCase();
                        confidence = (analysis.composite.confidence * 100).toFixed(0);
                        return [4 /*yield*/, this.client.messages.create({
                                model: this.model,
                                max_tokens: 600,
                                messages: [
                                    {
                                        role: 'user',
                                        content: "The quantitative analysis resulted in a ".concat(recommendation, " recommendation with ").concat(confidence, "% confidence.\n\nWrite a compelling rationale that:\n1. Explains why this recommendation makes sense given the data\n2. Highlights the 2-3 most important factors driving this recommendation\n3. Addresses potential concerns or counterarguments\n4. Provides specific price targets or return expectations\n5. Sets clear conditions that would change this recommendation\n\nCompany Data and Analysis:\n").concat(context)
                                    }
                                ],
                                temperature: 0.7
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateTechnicalCommentary = function (context, technicals) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!technicals)
                            return [2 /*return*/, ''];
                        return [4 /*yield*/, this.client.messages.create({
                                model: this.model,
                                max_tokens: 800,
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are a CMT (Chartered Market Technician) providing expert technical analysis.'
                                    },
                                    {
                                        role: 'user',
                                        content: "Provide professional technical analysis covering:\n- Current trend and momentum\n- Key support and resistance levels\n- Important chart patterns\n- Volume analysis\n- Technical indicators (RSI, MACD, etc.)\n- Trading strategy and entry/exit points\n\nTechnical Data: ".concat(JSON.stringify(technicals, null, 2), "\nContext: ").concat(context)
                                    }
                                ],
                                temperature: 0.7
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateCompetitiveAnalysis = function (context, companyData) {
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 1000,
                            messages: [
                                {
                                    role: 'user',
                                    content: "".concat(SECTION_PROMPTS.competitiveAnalysis, "\n\nCompany: ").concat(companyData.companyName, " (").concat(companyData.ticker, ")\nIndustry: ").concat(companyData.industry, "\n\nContext:\n").concat(context)
                                }
                            ],
                            temperature: 0.7
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    AnthropicAIService.prototype.generateActionItems = function (context, analysis, options) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, jsonMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 600,
                            messages: [
                                {
                                    role: 'user',
                                    content: "Based on the analysis and ".concat(analysis.composite.recommendation, " recommendation, provide 5-7 specific action items for investors. Include:\n- Immediate actions (what to do now)\n- Monitoring points (what to watch)\n- Risk management actions (stop-loss, position sizing)\n- Follow-up research needed\n- Key dates or events to track\n\nFormat as a JSON array of actionable strings.\n\nContext: ").concat(context)
                                }
                            ],
                            temperature: 0.7
                        })];
                    case 1:
                        response = _a.sent();
                        try {
                            content = response.content[0].text;
                            jsonMatch = content.match(/\[[\s\S]*\]/);
                            if (jsonMatch) {
                                return [2 /*return*/, JSON.parse(jsonMatch[0])];
                            }
                        }
                        catch (error) {
                            (0, logger_1.logError)('AnthropicAIService', 'Failed to parse action items', error);
                        }
                        // Fallback
                        return [2 /*return*/, [
                                "Initiate ".concat(analysis.composite.recommendation, " position in ").concat(analysis.composite.confidence > 0.8 ? 'full' : 'half', " size"),
                                'Set stop-loss at key technical support level',
                                'Monitor upcoming earnings for guidance updates',
                                'Track competitive developments in the industry',
                                'Review position after next quarterly results'
                            ]];
                }
            });
        });
    };
    /**
     * Prepares comprehensive context for AI
     */
    AnthropicAIService.prototype.prepareComprehensiveContext = function (companyData, analysis) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
        var context = {
            company: {
                name: companyData.companyName,
                ticker: companyData.ticker,
                sector: companyData.sector,
                industry: companyData.industry,
                description: companyData.description
            },
            financials: {
                marketCap: (_b = (_a = companyData.financials) === null || _a === void 0 ? void 0 : _a.keyMetrics) === null || _b === void 0 ? void 0 : _b.marketCap,
                peRatio: (_d = (_c = companyData.financials) === null || _c === void 0 ? void 0 : _c.keyMetrics) === null || _d === void 0 ? void 0 : _d.peRatio,
                revenue: (_g = (_f = (_e = companyData.financials) === null || _e === void 0 ? void 0 : _e.incomeStatement) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.revenue,
                netIncome: (_k = (_j = (_h = companyData.financials) === null || _h === void 0 ? void 0 : _h.incomeStatement) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.netIncome,
                revenueGrowth: (_l = analysis.growth) === null || _l === void 0 ? void 0 : _l.revenueGrowth,
                margins: {
                    gross: (_o = (_m = companyData.financials) === null || _m === void 0 ? void 0 : _m.keyMetrics) === null || _o === void 0 ? void 0 : _o.grossMargin,
                    operating: (_q = (_p = companyData.financials) === null || _p === void 0 ? void 0 : _p.keyMetrics) === null || _q === void 0 ? void 0 : _q.operatingMargin,
                    net: (_s = (_r = companyData.financials) === null || _r === void 0 ? void 0 : _r.keyMetrics) === null || _s === void 0 ? void 0 : _s.netMargin
                }
            },
            analysis: {
                scores: {
                    overall: analysis.composite.overall,
                    growth: analysis.composite.growth,
                    value: analysis.composite.value,
                    quality: analysis.composite.quality,
                    momentum: analysis.composite.momentum
                },
                valuation: {
                    intrinsicValue: (_t = analysis.valuation) === null || _t === void 0 ? void 0 : _t.intrinsicValue,
                    marginOfSafety: (_u = analysis.valuation) === null || _u === void 0 ? void 0 : _u.marginOfSafety,
                    assessment: (_v = analysis.valuation) === null || _v === void 0 ? void 0 : _v.valuation
                },
                risk: {
                    score: (_w = analysis.risk) === null || _w === void 0 ? void 0 : _w.riskScore,
                    beta: (_x = analysis.risk) === null || _x === void 0 ? void 0 : _x.beta,
                    volatility: (_y = analysis.risk) === null || _y === void 0 ? void 0 : _y.volatility
                },
                recommendation: analysis.composite.recommendation,
                confidence: analysis.composite.confidence
            },
            technicals: companyData.technicals ? {
                trend: (_z = analysis.technicals) === null || _z === void 0 ? void 0 : _z.trend,
                support: (_0 = analysis.technicals) === null || _0 === void 0 ? void 0 : _0.support,
                resistance: (_1 = analysis.technicals) === null || _1 === void 0 ? void 0 : _1.resistance,
                signals: (_2 = analysis.technicals) === null || _2 === void 0 ? void 0 : _2.signals
            } : undefined,
            news: companyData.news ? {
                sentiment: companyData.news.filter(function (n) { return n.sentiment === 'positive'; }).length >
                    companyData.news.filter(function (n) { return n.sentiment === 'negative'; }).length ? 'positive' : 'mixed',
                recentHeadlines: companyData.news.slice(0, 5).map(function (n) { return n.title; })
            } : undefined
        };
        return JSON.stringify(context, null, 2);
    };
    /**
     * Builds dynamic prompts for slide generation
     */
    AnthropicAIService.prototype.buildSlidePrompt = function (title, data, slideType, options) {
        var tone = options.tone || 'professional';
        var depth = options.depth || 'standard';
        return "Create content for a ".concat(slideType, " slide titled \"").concat(title, "\".\n\nTone: ").concat(tone, "\nDetail Level: ").concat(depth, "\n\nData available:\n").concat(JSON.stringify(data, null, 2), "\n\nGenerate:\n1. A compelling narrative paragraph (2-3 sentences)\n2. 3-5 key bullet points with specific data\n3. One insight that isn't immediately obvious from the data\n4. A forward-looking statement or implication\n\nFormat the response clearly with sections.");
    };
    /**
     * Parses AI response into slide format
     */
    AnthropicAIService.prototype.parseSlideContent = function (title, aiContent, slideType) {
        // Parse the AI response into structured content
        var sections = aiContent.split(/\n\n+/);
        var bullets = this.extractBulletPoints(aiContent);
        return {
            slideNumber: 0,
            title: title,
            layout: slideType === 'summary' ? 'title' : 'content',
            content: [
                {
                    type: 'text',
                    data: {
                        text: sections[0] || aiContent.slice(0, 200),
                        bullets: bullets.length > 0 ? bullets : undefined
                    }
                }
            ],
            notes: aiContent // Store full AI response in notes
        };
    };
    /**
     * Extracts bullet points from AI response
     */
    AnthropicAIService.prototype.extractBulletPoints = function (content) {
        var bulletRegex = /^[-•*]\s+(.+)$/gm;
        var matches = content.match(bulletRegex) || [];
        return matches.map(function (match) { return match.replace(/^[-•*]\s+/, '').trim(); });
    };
    /**
     * Generates a complete narrative report
     */
    AnthropicAIService.prototype.generateNarrativeReport = function (companyData, analysis, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.client.messages.create({
                            model: this.model,
                            max_tokens: 4000,
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are writing a comprehensive investment report for sophisticated institutional investors. Be thorough, insightful, and data-driven.'
                                },
                                {
                                    role: 'user',
                                    content: "Write a complete investment report with the following sections:\n1. Executive Summary\n2. Company Overview\n3. Financial Analysis\n4. Investment Thesis\n5. Risk Assessment\n6. Valuation Analysis\n7. Technical Analysis (if applicable)\n8. Recommendation and Price Targets\n9. Appendix: Key Metrics\n\nCompany Data: ".concat(this.prepareComprehensiveContext(companyData, analysis), "\n\nMake it compelling, professional, and actionable. Use specific numbers and avoid generic statements.")
                                }
                            ],
                            temperature: 0.8
                        })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                }
            });
        });
    };
    return AnthropicAIService;
}());
exports.AnthropicAIService = AnthropicAIService;
// Singleton instance
var aiServiceInstance = null;
/**
 * Gets the AI service instance
 */
function getAnthropicAIService(apiKey) {
    if (!aiServiceInstance) {
        aiServiceInstance = new AnthropicAIService(apiKey);
    }
    return aiServiceInstance;
}
exports.getAnthropicAIService = getAnthropicAIService;
