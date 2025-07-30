// src/reportGeneration/templates/reportTemplateEngine.ts
// Sophisticated template engine for dynamic report generation
// Context: Transforms analysis data into professional investment narratives

import { CompanyData } from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import Handlebars from 'handlebars';
import { marked } from 'marked';

/**
 * Report configuration options
 * Controls report style, sections, and formatting
 */
export interface ReportConfig {
  reportType: ReportType;
  style: ReportStyle;
  sections: ReportSection[];
  branding: BrandingConfig;
  language: 'en' | 'es' | 'zh' | 'ja';
  includeDisclaimer: boolean;
  includeMetadata: boolean;
}

/**
 * Available report types
 * Each type has different emphasis and structure
 */
export enum ReportType {
  EQUITY_RESEARCH = 'equity_research',        // Full fundamental analysis
  TECHNICAL_ANALYSIS = 'technical_analysis',   // Pattern and price focused
  EARNINGS_PREVIEW = 'earnings_preview',       // Pre-earnings analysis
  EARNINGS_REVIEW = 'earnings_review',         // Post-earnings analysis
  SECTOR_ANALYSIS = 'sector_analysis',         // Industry comparison
  QUICK_TAKE = 'quick_take',                  // 1-page summary
  DEEP_DIVE = 'deep_dive',                    // Comprehensive analysis
  PORTFOLIO_REVIEW = 'portfolio_review'        // Multi-stock analysis
}

/**
 * Report style options
 * Different styles for different audiences
 */
export enum ReportStyle {
  INSTITUTIONAL = 'institutional',   // Goldman Sachs style
  RETAIL = 'retail',                // Robinhood style  
  ACADEMIC = 'academic',            // Journal style
  EXECUTIVE = 'executive',          // Board presentation style
  TECHNICAL = 'technical'           // Quant-focused style
}

/**
 * Report sections that can be included
 */
export interface ReportSection {
  id: string;
  title: string;
  order: number;
  required: boolean;
  condition?: (data: any) => boolean;
  template: string;
}

/**
 * Branding configuration
 */
export interface BrandingConfig {
  companyName: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  disclaimer?: string;
}

/**
 * Generated report structure
 */
export interface GeneratedReport {
  title: string;
  subtitle: string;
  date: string;
  sections: GeneratedSection[];
  metadata: ReportMetadata;
  formatting: FormattingInstructions;
}

/**
 * Generated section with content
 */
export interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  data?: any;
  charts?: ChartSpecification[];
  tables?: TableSpecification[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Chart specification for visualization
 */
export interface ChartSpecification {
  type: 'line' | 'bar' | 'candlestick' | 'pie' | 'scatter' | 'heatmap';
  data: any;
  config: any;
  caption?: string;
}

/**
 * Table specification
 */
export interface TableSpecification {
  headers: string[];
  rows: any[][];
  formatting?: any;
  caption?: string;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  generatedAt: string;
  dataFreshness: string;
  confidence: number;
  warnings: string[];
  sources: string[];
}

/**
 * Formatting instructions for renderers
 */
export interface FormattingInstructions {
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  fontSize: number;
  lineHeight: number;
}

/**
 * Main report template engine
 * Orchestrates report generation from templates and data
 */
export class ReportTemplateEngine {
  private config: ReportConfig;
  private templates: Map<string, HandlebarsTemplateDelegate>;
  private helpers: Map<string, Handlebars.HelperDelegate>;
  
  constructor(config: ReportConfig) {
    this.config = config;
    this.templates = new Map();
    this.helpers = new Map();
    
    // Initialize Handlebars with custom helpers
    this.registerHelpers();
    
    // Load templates based on report type
    this.loadTemplates();
  }
  
  /**
   * Generates a complete report from analysis data
   * Main entry point for report generation
   */
  async generateReport(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): Promise<GeneratedReport> {
    // Prepare data context
    const context = this.prepareContext(companyData, analysis);
    
    // Generate title and subtitle
    const { title, subtitle } = this.generateTitleAndSubtitle(context);
    
    // Generate sections based on configuration
    const sections = await this.generateSections(context);
    
    // Generate metadata
    const metadata = this.generateMetadata(companyData, analysis);
    
    // Determine formatting based on report type and style
    const formatting = this.determineFormatting();
    
    return {
      title,
      subtitle,
      date: new Date().toISOString(),
      sections,
      metadata,
      formatting
    };
  }
  
  /**
   * Registers custom Handlebars helpers for report generation
   * These helpers enable dynamic content in templates
   */
  private registerHelpers(): void {
    // Format currency values
    this.registerHelper('currency', (value: number, currency = 'USD') => {
      if (typeof value !== 'number') return 'N/A';
      
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      
      return formatter.format(value);
    });
    
    // Format percentages
    this.registerHelper('percent', (value: number, decimals = 1) => {
      if (typeof value !== 'number') return 'N/A';
      return `${(value * 100).toFixed(decimals)}%`;
    });
    
    // Format large numbers with abbreviations
    this.registerHelper('abbreviate', (value: number) => {
      if (typeof value !== 'number') return 'N/A';
      
      const abbreviations = [
        { threshold: 1e12, suffix: 'T' },
        { threshold: 1e9, suffix: 'B' },
        { threshold: 1e6, suffix: 'M' },
        { threshold: 1e3, suffix: 'K' }
      ];
      
      for (const { threshold, suffix } of abbreviations) {
        if (Math.abs(value) >= threshold) {
          return `${(value / threshold).toFixed(1)}${suffix}`;
        }
      }
      
      return value.toFixed(0);
    });
    
    // Conditional formatting based on value
    this.registerHelper('sentiment', (value: number) => {
      if (value > 0) return 'positive';
      if (value < 0) return 'negative';
      return 'neutral';
    });
    
    // Trend description
    this.registerHelper('trend', (current: number, previous: number) => {
      if (!previous) return 'N/A';
      
      const change = ((current - previous) / previous) * 100;
      
      if (change > 10) return 'surged';
      if (change > 5) return 'increased significantly';
      if (change > 2) return 'grew';
      if (change > 0) return 'edged higher';
      if (change === 0) return 'remained flat';
      if (change > -2) return 'edged lower';
      if (change > -5) return 'declined';
      if (change > -10) return 'fell significantly';
      return 'plummeted';
    });
    
    // Pluralize helper
    this.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
      return count === 1 ? singular : (plural || `${singular}s`);
    });
    
    // Date formatting
    this.registerHelper('date', (value: string | Date, format = 'MMM DD, YYYY') => {
      if (!value) return 'N/A';
      
      const date = typeof value === 'string' ? new Date(value) : value;
      
      // Simple date formatting (in production would use date-fns or similar)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return format
        .replace('MMM', months[date.getMonth()])
        .replace('DD', date.getDate().toString().padStart(2, '0'))
        .replace('YYYY', date.getFullYear().toString());
    });
    
    // Comparison helper
    this.registerHelper('compare', (a: any, operator: string, b: any) => {
      switch (operator) {
        case '>': return a > b;
        case '<': return a < b;
        case '>=': return a >= b;
        case '<=': return a <= b;
        case '==': return a == b;
        case '!=': return a != b;
        case '===': return a === b;
        case '!==': return a !== b;
        default: return false;
      }
    });
    
    // List formatter
    this.registerHelper('list', (items: string[], separator = ', ', lastSeparator = ' and ') => {
      if (!Array.isArray(items) || items.length === 0) return '';
      if (items.length === 1) return items[0];
      if (items.length === 2) return items.join(lastSeparator);
      
      return items.slice(0, -1).join(separator) + lastSeparator + items[items.length - 1];
    });
    
    // Register all helpers with Handlebars
    this.helpers.forEach((helper, name) => {
      Handlebars.registerHelper(name, helper);
    });
  }
  
  /**
   * Helper method to register a helper
   */
  private registerHelper(name: string, helper: Handlebars.HelperDelegate): void {
    this.helpers.set(name, helper);
  }
  
  /**
   * Loads templates based on report type and style
   */
  private loadTemplates(): void {
    // Load section templates based on report type
    const templates = this.getTemplatesForReportType(this.config.reportType);
    
    templates.forEach(({ name, template }) => {
      this.templates.set(name, Handlebars.compile(template));
    });
  }
  
  /**
   * Gets templates for specific report type
   */
  private getTemplatesForReportType(
    reportType: ReportType
  ): Array<{ name: string; template: string }> {
    // Base templates used across all report types
    const baseTemplates = [
      {
        name: 'executive_summary',
        template: `
# Executive Summary

{{company.companyName}} ({{company.ticker}}) {{#if (compare analysis.composite.recommendation "==" "strongBuy")}}presents a compelling investment opportunity{{else if (compare analysis.composite.recommendation "==" "buy")}}offers an attractive investment case{{else if (compare analysis.composite.recommendation "==" "hold")}}warrants a neutral stance{{else if (compare analysis.composite.recommendation "==" "sell")}}faces significant headwinds{{else}}presents substantial risks{{/if}} with a composite score of {{analysis.composite.overall}}/100.

## Key Investment Points

{{#if (compare analysis.composite.overall ">=" 70)}}
**Bull Case:**
- {{#if (compare analysis.growth.revenueGrowth.yoy ">" 15)}}Strong revenue growth of {{percent analysis.growth.revenueGrowth.yoy 1}} year-over-year{{/if}}
- {{#if (compare analysis.profitability.netMargin ">" 0.15)}}Impressive {{percent analysis.profitability.netMargin}} net margins{{/if}}
- {{#if (compare analysis.valuation.marginOfSafety ">" 20)}}Attractive valuation with {{analysis.valuation.marginOfSafety}}% margin of safety{{/if}}
- {{#if analysis.sentiment}}{{#if (compare analysis.sentiment.score ">" 0.3)}}Positive market sentiment ({{analysis.sentiment.overall}}){{/if}}{{/if}}
{{else if (compare analysis.composite.overall "<=" 30)}}
**Bear Case:**
- {{#if (compare analysis.growth.revenueGrowth.yoy "<" 0)}}Declining revenues at {{percent analysis.growth.revenueGrowth.yoy 1}} year-over-year{{/if}}
- {{#if (compare analysis.profitability.netMargin "<" 0.05)}}Thin margins of only {{percent analysis.profitability.netMargin}}{{/if}}
- {{#if (compare analysis.valuation.marginOfSafety "<" -20)}}Overvalued by {{Math.abs analysis.valuation.marginOfSafety}}%{{/if}}
- {{#if analysis.sentiment}}{{#if (compare analysis.sentiment.score "<" -0.3)}}Negative market sentiment ({{analysis.sentiment.overall}}){{/if}}{{/if}}
{{else}}
**Balanced View:**
- Mixed growth signals with {{percent analysis.growth.revenueGrowth.yoy 1}} revenue growth
- {{#if (compare analysis.profitability.netMargin ">" 0.1)}}Decent{{else}}Modest{{/if}} profitability at {{percent analysis.profitability.netMargin}} margins
- Fair valuation relative to peers
- Neutral market sentiment requiring careful monitoring
{{/if}}

## Investment Recommendation

We {{#if (compare analysis.composite.recommendation "==" "strongBuy")}}strongly recommend purchasing{{else if (compare analysis.composite.recommendation "==" "buy")}}recommend buying{{else if (compare analysis.composite.recommendation "==" "hold")}}suggest holding{{else if (compare analysis.composite.recommendation "==" "sell")}}recommend reducing exposure to{{else}}strongly advise avoiding{{/if}} {{company.ticker}} based on our comprehensive analysis.

{{#if analysis.technicals.patternAnalysis}}
Technical patterns suggest {{#if (compare analysis.technicals.patternAnalysis.bullishPatterns ">" analysis.technicals.patternAnalysis.bearishPatterns)}}bullish{{else if (compare analysis.technicals.patternAnalysis.bearishPatterns ">" analysis.technicals.patternAnalysis.bullishPatterns)}}bearish{{else}}neutral{{/if}} bias with {{analysis.technicals.patternAnalysis.patternCount}} active formations.
{{/if}}
        `
      },
      {
        name: 'financial_analysis',
        template: `
# Financial Analysis

## Revenue Trends

{{company.companyName}} generated revenue over the most recent quarter, {{#if (compare analysis.growth.revenueGrowth.qoq ">" 0)}}{{trend 1 0.9}}{{else}}{{trend 0.9 1}}{{/if}} from the prior quarter.

{{#if (compare analysis.growth.revenueGrowth.yoy ">" 0)}}
The company has demonstrated growth with year-over-year revenue increasing {{percent analysis.growth.revenueGrowth.yoy 1}}.
{{else}}
Revenue has been under pressure, declining at {{percent (Math.abs analysis.growth.revenueGrowth.yoy) 1}} annually.
{{/if}}

### Growth Metrics
- Revenue Growth (YoY): {{percent analysis.growth.revenueGrowth.yoy 1}}
- Revenue Growth (QoQ): {{percent analysis.growth.revenueGrowth.qoq 1}}
- Earnings Growth (YoY): {{percent analysis.growth.earningsGrowth.yoy 1}}
- Revenue Trend: {{analysis.growth.revenueGrowth.trend}}

## Profitability Analysis

### Margin Trends
- Gross Margin: {{percent analysis.profitability.grossMargin}}
- Operating Margin: {{percent analysis.profitability.operatingMargin}}
- Net Margin: {{percent analysis.profitability.netMargin}}

{{#if (compare analysis.profitability.marginTrend "==" "expanding")}}
Margins are expanding, indicating improving operational efficiency and pricing power.
{{else if (compare analysis.profitability.marginTrend "==" "contracting")}}
Margin compression suggests increased competition or rising costs that require monitoring.
{{else}}
Margins remain stable, suggesting steady operational performance.
{{/if}}

### Return Metrics
- Return on Equity (ROE): {{percent analysis.quality.roe}}
- Return on Assets (ROA): {{percent analysis.quality.roa}}
- Return on Invested Capital (ROIC): {{percent analysis.quality.roic}}

{{#if (compare analysis.quality.roic ">" 0.15)}}
The company generates strong returns on invested capital, indicating efficient capital allocation.
{{else if (compare analysis.quality.roic ">" 0.08)}}
Returns on capital are adequate but leave room for improvement.
{{else}}
Low returns on capital suggest the company struggles to generate adequate returns for shareholders.
{{/if}}

## Cash Flow Analysis

### Free Cash Flow
- Free Cash Flow Growth: {{#if analysis.growth.fcfGrowth}}{{percent analysis.growth.fcfGrowth.yoy 1}}{{else}}N/A{{/if}}
- FCF Trend: {{#if analysis.growth.fcfGrowth}}{{analysis.growth.fcfGrowth.trend}}{{else}}N/A{{/if}}

{{#if analysis.growth.fcfGrowth}}{{#if (compare analysis.growth.fcfGrowth.yoy ">" 0.1)}}
Strong free cash flow generation supports capital returns and growth investments.
{{else if (compare analysis.growth.fcfGrowth.yoy ">" 0)}}
Moderate free cash flow provides flexibility for strategic initiatives.
{{else}}
Declining free cash flow generation may constrain financial flexibility.
{{/if}}{{/if}}
        `
      },
      {
        name: 'valuation_analysis',
        template: `
# Valuation Analysis

## Current Valuation

{{company.companyName}} trades at:
- Current Price: {{#if company.financials.historicalPrices.[0]}}{{currency company.financials.historicalPrices.[0].close}}{{else}}N/A{{/if}}
- Market Cap: {{#if company.financials.keyMetrics.marketCap}}{{abbreviate company.financials.keyMetrics.marketCap}}{{else}}N/A{{/if}}

## Intrinsic Value Assessment

Our analysis yields an intrinsic value of {{currency analysis.valuation.intrinsicValue}} per share.

{{#if (compare analysis.valuation.marginOfSafety ">" 20)}}
The stock appears significantly undervalued with a {{analysis.valuation.marginOfSafety}}% margin of safety.
{{else if (compare analysis.valuation.marginOfSafety ">" 0)}}
The stock offers a modest {{analysis.valuation.marginOfSafety}}% margin of safety.
{{else if (compare analysis.valuation.marginOfSafety ">" -20)}}
The stock appears fairly valued with limited margin of safety.
{{else}}
The stock appears overvalued by {{Math.abs analysis.valuation.marginOfSafety}}%.
{{/if}}

### Valuation Summary
- Valuation: {{analysis.valuation.valuation}}
- Margin of Safety: {{analysis.valuation.marginOfSafety}}%
- Intrinsic Value: {{currency analysis.valuation.intrinsicValue}}

{{#if (compare analysis.valuation.valuation "==" "undervalued")}}
**Investment Opportunity**: The current valuation presents an attractive entry point for long-term investors.
{{else if (compare analysis.valuation.valuation "==" "overvalued")}}
**Caution Advised**: The current valuation suggests limited upside potential and elevated downside risk.
{{else}}
**Fair Value**: The stock is trading near its intrinsic value, offering balanced risk/reward.
{{/if}}
        `
      }
    ];
    
    // Add report-type specific templates
    switch (reportType) {
      case ReportType.EQUITY_RESEARCH:
        return [
          ...baseTemplates,
          this.getCompetitiveAnalysisTemplate(),
          this.getRiskAnalysisTemplate(),
          this.getTechnicalAnalysisTemplate()
        ];
        
      case ReportType.TECHNICAL_ANALYSIS:
        return [
          this.getTechnicalAnalysisTemplate(),
          this.getPatternAnalysisTemplate(),
          ...baseTemplates.filter(t => t.name === 'executive_summary')
        ];
        
      case ReportType.EARNINGS_PREVIEW:
        return [
          this.getEarningsPreviewTemplate(),
          ...baseTemplates.filter(t => ['executive_summary', 'valuation_analysis'].includes(t.name))
        ];
        
      default:
        return baseTemplates;
    }
  }
  
  /**
   * Gets competitive analysis template
   */
  private getCompetitiveAnalysisTemplate(): { name: string; template: string } {
    return {
      name: 'competitive_analysis',
      template: `
# Competitive Analysis

## Industry Position

{{company.companyName}} operates in the {{company.industry}} industry within the {{company.sector}} sector.

{{#if analysis.quality.moat}}
### Competitive Moat
The company has a **{{analysis.quality.moat}} moat** based on:
- {{#if (compare analysis.quality.roic ">" 0.15)}}Consistently high returns on invested capital ({{percent analysis.quality.roic}}){{/if}}
- {{#if (compare analysis.profitability.netMargin ">" 0.15)}}Superior profit margins compared to industry peers{{/if}}
- {{#if (compare analysis.growth.revenueGrowth.yoy ">" 0.1)}}Strong revenue growth momentum{{/if}}
{{/if}}

## Quality Assessment

### Business Quality Score: {{analysis.quality.qualityScore}}/100

Key Quality Metrics:
- Return on Equity: {{percent analysis.quality.roe}}
- Return on Assets: {{percent analysis.quality.roa}}
- Return on Invested Capital: {{percent analysis.quality.roic}}
- Earnings Quality: {{analysis.quality.earningsQuality}}/10
- Balance Sheet Strength: {{analysis.quality.balanceSheetStrength}}/10

{{#if (compare analysis.quality.qualityScore ">" 70)}}
The company demonstrates high-quality business characteristics with strong fundamentals.
{{else if (compare analysis.quality.qualityScore ">" 50)}}
The company shows moderate quality with room for operational improvements.
{{else}}
Quality metrics suggest fundamental business challenges that require attention.
{{/if}}
      `
    };
  }
  
  /**
   * Gets risk analysis template
   */
  private getRiskAnalysisTemplate(): { name: string; template: string } {
    return {
      name: 'risk_analysis',
      template: `
# Risk Analysis

## Risk Assessment

### Overall Risk Score: {{analysis.risk.riskScore}}/100

{{#if (compare analysis.risk.riskScore ">" 70)}}
**High Risk**: This investment carries significant risk and is suitable only for risk-tolerant investors.
{{else if (compare analysis.risk.riskScore ">" 40)}}
**Moderate Risk**: This investment has balanced risk characteristics suitable for most portfolios.
{{else}}
**Low Risk**: This investment demonstrates lower risk characteristics with more predictable outcomes.
{{/if}}

### Risk Metrics
- Volatility: {{percent (analysis.risk.volatility / 100) 1}} annualized
- Beta: {{#if analysis.risk.beta}}{{analysis.risk.beta}}{{else}}N/A{{/if}}
- Maximum Drawdown: {{percent (analysis.risk.maxDrawdown / 100) 1}}
- Sharpe Ratio: {{analysis.risk.sharpeRatio}}

### Risk Categories
{{#if (compare analysis.risk.financialRisk ">" 7)}}
- **Financial Risk**: Elevated - Balance sheet concerns require monitoring
{{else if (compare analysis.risk.financialRisk ">" 4)}}
- **Financial Risk**: Moderate - Acceptable leverage and coverage ratios
{{else}}
- **Financial Risk**: Low - Strong balance sheet provides stability
{{/if}}

{{#if (compare analysis.risk.operationalRisk ">" 7)}}
- **Operational Risk**: High - Business model faces significant challenges
{{else if (compare analysis.risk.operationalRisk ">" 4)}}
- **Operational Risk**: Moderate - Normal business execution risks
{{else}}
- **Operational Risk**: Low - Stable operations with predictable outcomes
{{/if}}

{{#if (compare analysis.risk.marketRisk ">" 7)}}
- **Market Risk**: High - Significant exposure to market volatility
{{else if (compare analysis.risk.marketRisk ">" 4)}}
- **Market Risk**: Moderate - Average market sensitivity
{{else}}
- **Market Risk**: Low - Defensive characteristics limit market impact
{{/if}}
      `
    };
  }
  
  /**
   * Gets technical analysis template
   */
  private getTechnicalAnalysisTemplate(): { name: string; template: string } {
    return {
      name: 'technical_analysis',
      template: `
# Technical Analysis

## Price Trend

{{company.ticker}} shows a **{{analysis.technicals.trend}}** trend based on price action and moving averages.

### Technical Indicators
- RSI (14): {{#if analysis.technicals.rsi}}{{analysis.technicals.rsi}}{{else}}N/A{{/if}} {{#if analysis.technicals.rsi}}{{#if (compare analysis.technicals.rsi ">" 70)}}(Overbought){{else if (compare analysis.technicals.rsi "<" 30)}}(Oversold){{else}}(Neutral){{/if}}{{/if}}
- Support Level: {{currency analysis.technicals.support}}
- Resistance Level: {{currency analysis.technicals.resistance}}

## Pattern Recognition

{{#if analysis.technicals.patternAnalysis}}
### Detected Patterns
- Total Patterns: {{analysis.technicals.patternAnalysis.patternCount}}
- Bullish Patterns: {{analysis.technicals.patternAnalysis.bullishPatterns}}
- Bearish Patterns: {{analysis.technicals.patternAnalysis.bearishPatterns}}
- Average Confidence: {{percent (analysis.technicals.patternAnalysis.averageConfidence / 100) 1}}

{{#if (compare analysis.technicals.patternAnalysis.patternCount ">" 0)}}
**Key Patterns Detected:**
{{#each analysis.technicals.patternAnalysis.keyPatterns}}
- {{this.type}} ({{this.direction}}) - Confidence: {{this.confidence}}%
{{/each}}
{{/if}}

### Pattern Momentum
The pattern momentum score of {{analysis.technicals.patternAnalysis.patternMomentum}} suggests {{#if (compare analysis.technicals.patternAnalysis.patternMomentum ">" 0.7)}}strong bullish{{else if (compare analysis.technicals.patternAnalysis.patternMomentum ">" 0.3)}}neutral to bullish{{else}}bearish{{/if}} technical sentiment.
{{else}}
No significant technical patterns detected in recent price action.
{{/if}}

## Technical Summary

Based on technical indicators and pattern analysis, the stock exhibits {{#if (compare analysis.composite.momentum ">" 70)}}strong positive{{else if (compare analysis.composite.momentum ">" 30)}}neutral{{else}}negative{{/if}} momentum with a score of {{analysis.composite.momentum}}/100.
      `
    };
  }
  
  /**
   * Gets pattern analysis template
   */
  private getPatternAnalysisTemplate(): { name: string; template: string } {
    return {
      name: 'pattern_analysis',
      template: `
# Pattern Analysis

## Pattern Detection Summary

{{#if analysis.technicals.patternAnalysis}}
Our pattern detection engine identified **{{analysis.technicals.patternAnalysis.patternCount}} patterns** with an average confidence of {{percent (analysis.technicals.patternAnalysis.averageConfidence / 100) 1}}.

### Pattern Distribution
- **Bullish Patterns**: {{analysis.technicals.patternAnalysis.bullishPatterns}} ({{percent (analysis.technicals.patternAnalysis.bullishPatterns / analysis.technicals.patternAnalysis.patternCount) 0}})
- **Bearish Patterns**: {{analysis.technicals.patternAnalysis.bearishPatterns}} ({{percent (analysis.technicals.patternAnalysis.bearishPatterns / analysis.technicals.patternAnalysis.patternCount) 0}})
- **Neutral Patterns**: {{analysis.technicals.patternAnalysis.neutralPatterns}} ({{percent (analysis.technicals.patternAnalysis.neutralPatterns / analysis.technicals.patternAnalysis.patternCount) 0}})

### High-Confidence Patterns

{{#each analysis.technicals.patternAnalysis.keyPatterns}}
**{{@index}}. {{this.type}}**
- Direction: {{this.direction}}
- Confidence: {{this.confidence}}%
- Target Price: {{currency this.targetPrice}}
- Stop Loss: {{currency this.stopLoss}}
- Risk/Reward: 1:{{this.probability}}
{{/each}}

### Pattern-Based Outlook

{{#if (compare analysis.technicals.patternAnalysis.patternMomentum ">" 0.7)}}
Strong bullish pattern momentum suggests continued upward price movement with high probability.
{{else if (compare analysis.technicals.patternAnalysis.patternMomentum ">" 0.3)}}
Mixed pattern signals indicate a period of consolidation or indecision in price action.
{{else}}
Bearish pattern dominance warns of potential downside risk in the near term.
{{/if}}
{{else}}
No significant patterns detected in the current price structure.
{{/if}}
      `
    };
  }
  
  /**
   * Gets earnings preview template
   */
  private getEarningsPreviewTemplate(): { name: string; template: string } {
    return {
      name: 'earnings_preview',
      template: `
# Earnings Preview

## Upcoming Earnings Report

{{company.companyName}} is scheduled to report earnings for the most recent quarter.

## Historical Performance

### Recent Earnings Track Record
The company has demonstrated {{#if (compare analysis.quality.earningsQuality ">" 7)}}strong{{else if (compare analysis.quality.earningsQuality ">" 5)}}moderate{{else}}weak{{/if}} earnings quality with a score of {{analysis.quality.earningsQuality}}/10.

### Key Metrics to Watch
1. **Revenue Growth**: Current trend at {{percent analysis.growth.revenueGrowth.yoy 1}} YoY
2. **Margin Performance**: Net margin at {{percent analysis.profitability.netMargin}}
3. **Cash Flow Generation**: FCF trend {{analysis.growth.fcfGrowth.trend}}

## Pre-Earnings Analysis

{{#if analysis.sentiment}}
### Market Sentiment
Current market sentiment is **{{analysis.sentiment.overall}}** with a score of {{analysis.sentiment.score}}.

{{#if analysis.sentiment.themes}}
**Key Themes:**
{{#each analysis.sentiment.themes}}
- {{this.name}} ({{this.sentiment}})
{{/each}}
{{/if}}
{{/if}}

### Technical Position
- Current Price: {{#if company.financials.historicalPrices.[0]}}{{currency company.financials.historicalPrices.[0].close}}{{else}}N/A{{/if}}
- Trend: {{analysis.technicals.trend}}
- Momentum: {{analysis.composite.momentum}}/100

## Earnings Outlook

Based on our comprehensive analysis:
- **Growth Trajectory**: {{analysis.growth.revenueGrowth.trend}}
- **Quality Score**: {{analysis.quality.qualityScore}}/100
- **Risk Level**: {{analysis.risk.riskScore}}/100

{{#if (compare analysis.composite.overall ">" 70)}}
Strong fundamentals suggest potential for positive earnings surprise.
{{else if (compare analysis.composite.overall ">" 40)}}
Mixed signals indicate earnings in line with expectations.
{{else}}
Challenging conditions may lead to earnings disappointment.
{{/if}}
      `
    };
  }
  
  /**
   * Prepares data context for template rendering
   * Enriches data with calculated fields and formatting
   */
  private prepareContext(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): any {
    return {
      company: companyData,
      analysis,
      report: {
        date: new Date(),
        type: this.config.reportType,
        style: this.config.style
      },
      // Helper data for templates
      Math: Math,
      JSON: JSON
    };
  }
  
  /**
   * Generates dynamic title and subtitle based on data
   */
  private generateTitleAndSubtitle(context: any): { title: string; subtitle: string } {
    const { company, analysis } = context;
    
    let title: string;
    let subtitle: string;
    
    switch (this.config.reportType) {
      case ReportType.EQUITY_RESEARCH:
        title = `${company.companyName} (${company.ticker}) - Equity Research Report`;
        subtitle = `${analysis.composite.recommendation.toUpperCase()} - Score: ${analysis.composite.overall}/100`;
        break;
        
      case ReportType.TECHNICAL_ANALYSIS:
        title = `${company.ticker} - Technical Analysis`;
        subtitle = `${analysis.technicals.trend} Trend - Momentum: ${analysis.composite.momentum}/100`;
        break;
        
      case ReportType.EARNINGS_PREVIEW:
        title = `${company.ticker} - Earnings Preview`;
        subtitle = `Investment Score: ${analysis.composite.overall}/100`;
        break;
        
      case ReportType.QUICK_TAKE:
        title = `${company.ticker} Quick Take`;
        subtitle = this.generateQuickTakeSubtitle(analysis);
        break;
        
      default:
        title = `${company.companyName} - Investment Analysis`;
        subtitle = new Date().toLocaleDateString();
    }
    
    return { title, subtitle };
  }
  
  /**
   * Generates subtitle for quick take reports
   */
  private generateQuickTakeSubtitle(analysis: AnalysisResults): string {
    const score = analysis.composite.overall;
    const trend = analysis.growth.revenueGrowth.yoy > 0 ? 'Growing' : 'Declining';
    const valuation = analysis.valuation.valuation;
    
    return `${trend} | ${valuation} | Score: ${score}/100`;
  }
  
  /**
   * Generates report sections based on configuration and data
   */
  private async generateSections(context: any): Promise<GeneratedSection[]> {
    const sections: GeneratedSection[] = [];
    
    for (const sectionConfig of this.config.sections) {
      // Check if section should be included
      if (sectionConfig.condition && !sectionConfig.condition(context)) {
        continue;
      }
      
      try {
        const section = await this.generateSection(sectionConfig, context);
        sections.push(section);
      } catch (error) {
        console.error(`Error generating section ${sectionConfig.id}:`, error);
        
        if (sectionConfig.required) {
          throw error;
        }
      }
    }
    
    // Sort sections by order
    sections.sort((a, b) => {
      const orderA = this.config.sections.find(s => s.id === a.id)?.order || 999;
      const orderB = this.config.sections.find(s => s.id === b.id)?.order || 999;
      return orderA - orderB;
    });
    
    return sections;
  }
  
  /**
   * Generates a single section
   */
  private async generateSection(
    sectionConfig: ReportSection,
    context: any
  ): Promise<GeneratedSection> {
    // Get template
    const template = this.templates.get(sectionConfig.id);
    if (!template) {
      throw new Error(`Template not found for section: ${sectionConfig.id}`);
    }
    
    // Render content
    const content = template(context);
    
    // Determine section priority based on content
    const priority = this.determineSectionPriority(sectionConfig.id, context);
    
    // Extract charts and tables if applicable
    const charts = this.extractCharts(sectionConfig.id, context);
    const tables = this.extractTables(sectionConfig.id, context);
    
    return {
      id: sectionConfig.id,
      title: sectionConfig.title,
      content,
      data: context,
      charts,
      tables,
      priority
    };
  }
  
  /**
   * Determines section priority based on data significance
   */
  private determineSectionPriority(
    sectionId: string,
    context: any
  ): 'high' | 'medium' | 'low' {
    const { analysis } = context;
    
    switch (sectionId) {
      case 'executive_summary':
        return 'high';
        
      case 'financial_analysis':
        // High priority if strong growth or concerning decline
        if (Math.abs(analysis.growth.revenueGrowth.yoy) > 20) {
          return 'high';
        }
        return 'medium';
        
      case 'valuation_analysis':
        // High priority if significantly mispriced
        if (Math.abs(analysis.valuation.marginOfSafety) > 30) {
          return 'high';
        }
        return 'medium';
        
      case 'risk_analysis':
        // High priority if high risk scores
        if (analysis.risk.riskScore > 70) {
          return 'high';
        }
        return 'low';
        
      default:
        return 'medium';
    }
  }
  
  /**
   * Extracts chart specifications for a section
   */
  private extractCharts(sectionId: string, context: any): ChartSpecification[] {
    const charts: ChartSpecification[] = [];
    const { company, analysis } = context;
    
    switch (sectionId) {
      case 'financial_analysis':
        // Revenue trend chart
        if (company.financials.incomeStatement && company.financials.incomeStatement.length > 0) {
          const revenueData = company.financials.incomeStatement
            .slice(0, 8)
            .reverse()
            .map((statement: any) => statement.revenue || 0);
          
          const dates = company.financials.incomeStatement
            .slice(0, 8)
            .reverse()
            .map((statement: any) => statement.date);
          
          charts.push({
            type: 'line',
            data: {
              labels: dates,
              datasets: [{
                label: 'Quarterly Revenue',
                data: revenueData
              }]
            },
            config: {
              title: 'Revenue Trend',
              yAxis: { format: 'currency' }
            },
            caption: 'Quarterly revenue progression'
          });
        }
        
        // Margin trend chart
        charts.push({
          type: 'line',
          data: {
            labels: ['Current'],
            datasets: [
              {
                label: 'Gross Margin',
                data: [analysis.profitability.grossMargin * 100]
              },
              {
                label: 'Operating Margin',
                data: [analysis.profitability.operatingMargin * 100]
              },
              {
                label: 'Net Margin',
                data: [analysis.profitability.netMargin * 100]
              }
            ]
          },
          config: {
            title: 'Margin Analysis',
            yAxis: { format: 'percent' }
          },
          caption: 'Current profitability margins'
        });
        break;
        
      case 'technical_analysis':
        // Price chart with volume
        if (company.financials.historicalPrices && company.financials.historicalPrices.length > 0) {
          charts.push({
            type: 'candlestick',
            data: {
              candles: company.financials.historicalPrices.slice(0, 60)
            },
            config: {
              title: 'Price Action (60 Days)',
              indicators: ['volume']
            },
            caption: 'Daily price movement with volume'
          });
        }
        break;
        
      case 'valuation_analysis':
        // Valuation metrics chart
        charts.push({
          type: 'bar',
          data: {
            labels: ['Current Price', 'Intrinsic Value'],
            datasets: [{
              label: 'Price Comparison',
              data: [
                company.financials.historicalPrices?.[0]?.close || 0,
                analysis.valuation.intrinsicValue
              ]
            }]
          },
          config: {
            title: 'Valuation Comparison'
          },
          caption: 'Current price vs intrinsic value'
        });
        break;
    }
    
    return charts;
  }
  
  /**
   * Extracts table specifications for a section
   */
  private extractTables(sectionId: string, context: any): TableSpecification[] {
    const tables: TableSpecification[] = [];
    const { company, analysis } = context;
    
    switch (sectionId) {
      case 'financial_analysis':
        // Key metrics table
        tables.push({
          headers: ['Metric', 'Value', 'Assessment'],
          rows: [
            ['Revenue Growth (YoY)', 
             `${(analysis.growth.revenueGrowth.yoy * 100).toFixed(1)}%`,
             analysis.growth.revenueGrowth.trend],
            ['Net Margin',
             `${(analysis.profitability.netMargin * 100).toFixed(1)}%`,
             analysis.profitability.marginTrend || 'stable'],
            ['Return on Equity',
             `${(analysis.quality.roe * 100).toFixed(1)}%`,
             analysis.quality.roe > 0.15 ? 'strong' : 'adequate']
          ],
          caption: 'Key financial metrics summary'
        });
        break;
        
      case 'risk_analysis':
        // Risk metrics table
        tables.push({
          headers: ['Risk Category', 'Score', 'Level'],
          rows: [
            ['Financial Risk', 
             `${analysis.risk.financialRisk}/10`,
             analysis.risk.financialRisk > 7 ? 'High' : analysis.risk.financialRisk > 4 ? 'Moderate' : 'Low'],
            ['Operational Risk',
             `${analysis.risk.operationalRisk}/10`,
             analysis.risk.operationalRisk > 7 ? 'High' : analysis.risk.operationalRisk > 4 ? 'Moderate' : 'Low'],
            ['Market Risk',
             `${analysis.risk.marketRisk}/10`,
             analysis.risk.marketRisk > 7 ? 'High' : analysis.risk.marketRisk > 4 ? 'Moderate' : 'Low']
          ],
          caption: 'Risk assessment breakdown'
        });
        break;
    }
    
    return tables;
  }
  
  /**
   * Generates report metadata
   */
  private generateMetadata(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportMetadata {
    const warnings: string[] = [];
    
    // Check data freshness
    let daysSinceUpdate = 0;
    if (companyData.financials.historicalPrices && companyData.financials.historicalPrices.length > 0) {
      const latestPrice = new Date(companyData.financials.historicalPrices[0].date);
      daysSinceUpdate = (Date.now() - latestPrice.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 1) {
        warnings.push(`Price data is ${Math.floor(daysSinceUpdate)} days old`);
      }
    } else {
      warnings.push('No price data available');
    }
    
    // Check for missing data
    if (!companyData.news || companyData.news.length === 0) {
      warnings.push('No recent news data available');
    }
    
    if (!companyData.transcripts || companyData.transcripts.length === 0) {
      warnings.push('No earnings transcript data available');
    }
    
    // Determine confidence based on data completeness
    let confidence = 1.0;
    if (warnings.length > 0) confidence -= warnings.length * 0.1;
    if (!analysis.technicals.patternAnalysis) confidence -= 0.1;
    if (!analysis.sentiment) confidence -= 0.1;
    
    return {
      generatedAt: new Date().toISOString(),
      dataFreshness: `${Math.floor(daysSinceUpdate)} days`,
      confidence: Math.max(0.5, confidence),
      warnings,
      sources: this.extractSources(companyData)
    };
  }
  
  /**
   * Extracts data sources used in the report
   */
  private extractSources(companyData: CompanyData): string[] {
    const sources: string[] = [];
    
    sources.push('Financial data: TwelveData API');
    
    if (companyData.news && companyData.news.length > 0) {
      const newsSources = [...new Set(companyData.news.map(n => n.source))];
      sources.push(`News: ${newsSources.slice(0, 3).join(', ')}`);
    }
    
    if (companyData.transcripts && companyData.transcripts.length > 0) {
      sources.push('Earnings transcripts: Company filings');
    }
    
    return sources;
  }
  
  /**
   * Determines formatting based on report type and style
   */
  private determineFormatting(): FormattingInstructions {
    const baseFormatting: FormattingInstructions = {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: { top: 72, right: 72, bottom: 72, left: 72 },
      fontSize: 11,
      lineHeight: 1.5
    };
    
    // Adjust based on style
    switch (this.config.style) {
      case ReportStyle.INSTITUTIONAL:
        baseFormatting.fontSize = 10;
        baseFormatting.lineHeight = 1.4;
        break;
        
      case ReportStyle.RETAIL:
        baseFormatting.fontSize = 12;
        baseFormatting.lineHeight = 1.6;
        break;
        
      case ReportStyle.EXECUTIVE:
        baseFormatting.fontSize = 12;
        baseFormatting.margins = { top: 96, right: 96, bottom: 96, left: 96 };
        break;
    }
    
    // Adjust based on report type
    if (this.config.reportType === ReportType.QUICK_TAKE) {
      baseFormatting.margins = { top: 54, right: 54, bottom: 54, left: 54 };
    }
    
    return baseFormatting;
  }
}

/**
 * Factory function to create report template engines
 */
export function createReportTemplateEngine(
  config: Partial<ReportConfig>
): ReportTemplateEngine {
  const defaultConfig: ReportConfig = {
    reportType: config.reportType || ReportType.EQUITY_RESEARCH,
    style: config.style || ReportStyle.INSTITUTIONAL,
    sections: getDefaultSections(config.reportType || ReportType.EQUITY_RESEARCH),
    branding: {
      companyName: 'TriSight',
      primaryColor: '#10b981',
      secondaryColor: '#1e293b',
      fontFamily: 'Inter, sans-serif',
      ...config.branding
    },
    language: config.language || 'en',
    includeDisclaimer: config.includeDisclaimer !== false,
    includeMetadata: config.includeMetadata !== false
  };
  
  return new ReportTemplateEngine(defaultConfig);
}

/**
 * Gets default sections for a report type
 */
function getDefaultSections(reportType: ReportType): ReportSection[] {
  const sections: ReportSection[] = [
    {
      id: 'executive_summary',
      title: 'Executive Summary',
      order: 1,
      required: true,
      template: 'executive_summary'
    }
  ];
  
  switch (reportType) {
    case ReportType.EQUITY_RESEARCH:
      sections.push(
        {
          id: 'financial_analysis',
          title: 'Financial Analysis',
          order: 2,
          required: true,
          template: 'financial_analysis'
        },
        {
          id: 'valuation_analysis',
          title: 'Valuation Analysis',
          order: 3,
          required: true,
          template: 'valuation_analysis'
        },
        {
          id: 'competitive_analysis',
          title: 'Competitive Analysis',
          order: 4,
          required: false,
          condition: (data) => data.analysis.quality !== undefined,
          template: 'competitive_analysis'
        },
        {
          id: 'technical_analysis',
          title: 'Technical Analysis',
          order: 5,
          required: false,
          condition: (data) => data.analysis.technicals.patternAnalysis !== undefined,
          template: 'technical_analysis'
        },
        {
          id: 'risk_analysis',
          title: 'Risk Analysis',
          order: 6,
          required: true,
          template: 'risk_analysis'
        }
      );
      break;
      
    case ReportType.TECHNICAL_ANALYSIS:
      sections.push(
        {
          id: 'technical_analysis',
          title: 'Technical Analysis',
          order: 2,
          required: true,
          template: 'technical_analysis'
        },
        {
          id: 'pattern_analysis',
          title: 'Pattern Analysis',
          order: 3,
          required: true,
          condition: (data) => data.analysis.technicals.patternAnalysis?.patternCount > 0,
          template: 'pattern_analysis'
        }
      );
      break;
      
    case ReportType.EARNINGS_PREVIEW:
      sections.push(
        {
          id: 'earnings_preview',
          title: 'Earnings Preview',
          order: 2,
          required: true,
          template: 'earnings_preview'
        },
        {
          id: 'valuation_analysis',
          title: 'Valuation Context',
          order: 3,
          required: false,
          template: 'valuation_analysis'
        }
      );
      break;
  }
  
  return sections;
}