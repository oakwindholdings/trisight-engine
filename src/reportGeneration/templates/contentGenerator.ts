// @ts-nocheck
// src/reportGeneration/templates/contentGenerator.ts
// Intelligent content generation for dynamic report narratives
// Context: Creates contextual, data-driven content that reads naturally

import { AnalysisResults } from '../models/financialMetrics';
import { CompanyData } from '../models/reportTypes';

/**
 * Content generation strategies
 * Different approaches based on data patterns
 */
export enum ContentStrategy {
  GROWTH_STORY = 'growth_story',
  TURNAROUND = 'turnaround',
  VALUE_PLAY = 'value_play',
  MOMENTUM = 'momentum',
  DEFENSIVE = 'defensive',
  SPECULATIVE = 'speculative',
  DISTRESSED = 'distressed'
}

/**
 * Narrative tone options
 */
export enum NarrativeTone {
  BULLISH = 'bullish',
  CAUTIOUS = 'cautious',
  NEUTRAL = 'neutral',
  BEARISH = 'bearish'
}

/**
 * Dynamic content generator
 * Creates intelligent narratives based on data patterns
 */
export class ContentGenerator {
  
  /**
   * Determines the appropriate content strategy based on analysis
   */
  determineStrategy(analysis: AnalysisResults): ContentStrategy {
    const { growth, valuation, profitability, risk } = analysis;
    
    // High growth with reasonable valuation
    if (growth.revenueGrowth.yoy > 0.15 && valuation.marginOfSafety > 0) {
      return ContentStrategy.GROWTH_STORY;
    }
    
    // Improving fundamentals from low base
    if (growth.revenueGrowth.yoy > 0 && profitability.marginTrend === 'expanding' &&
        analysis.sentiment?.temporalAnalysis?.trend === 'improving') {
      return ContentStrategy.TURNAROUND;
    }
    
    // Cheap valuation with stable business
    if (valuation.valuation === 'undervalued' && 
        Math.abs(growth.revenueGrowth.yoy) < 0.05) {
      return ContentStrategy.VALUE_PLAY;
    }
    
    // Strong price momentum with positive sentiment
    if (analysis.technicals.trend === 'bullish' &&
        analysis.sentiment?.score > 0.5) {
      return ContentStrategy.MOMENTUM;
    }
    
    // Stable, dividend-paying with low volatility
    if (risk.beta && risk.beta < 0.8 && profitability.netMargin > 0.1) {
      return ContentStrategy.DEFENSIVE;
    }
    
    // High risk, high reward
    if (risk.riskScore > 70 && growth.revenueGrowth.yoy > 0.25) {
      return ContentStrategy.SPECULATIVE;
    }
    
    // Financial distress
    if (risk.financialRisk > 8) {
      return ContentStrategy.DISTRESSED;
    }
    
    // Default to value play
    return ContentStrategy.VALUE_PLAY;
  }
  
  /**
   * Determines narrative tone based on composite score and risks
   */
  determineTone(analysis: AnalysisResults): NarrativeTone {
    const score = analysis.composite.overall;
    const highRiskFactors = (analysis.risk.financialRisk > 7 ? 1 : 0) +
                           (analysis.risk.operationalRisk > 7 ? 1 : 0) +
                           (analysis.risk.marketRisk > 7 ? 1 : 0);
    
    if (score >= 70 && highRiskFactors <= 1) return NarrativeTone.BULLISH;
    if (score >= 50 && highRiskFactors <= 2) return NarrativeTone.NEUTRAL;
    if (score >= 30 || highRiskFactors <= 3) return NarrativeTone.CAUTIOUS;
    return NarrativeTone.BEARISH;
  }
  
  /**
   * Generates opening paragraph based on strategy and tone
   */
  generateOpening(
    company: CompanyData,
    analysis: AnalysisResults,
    strategy: ContentStrategy,
    tone: NarrativeTone
  ): string {
    const templates = {
      [ContentStrategy.GROWTH_STORY]: {
        [NarrativeTone.BULLISH]: `${company.companyName} continues to deliver exceptional growth, with revenue expanding at ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% annually and margins trending higher. The company's innovative approach to ${this.identifyGrowthDriver(analysis)} positions it as a compelling growth story in the ${company.industry} sector.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} maintains solid growth momentum with ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% revenue expansion, though valuation has become more demanding. The company's focus on ${this.identifyGrowthDriver(analysis)} drives continued market share gains.`,
        [NarrativeTone.CAUTIOUS]: `While ${company.companyName} continues to grow at ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% annually, emerging challenges in ${this.identifyKeyRisk(analysis)} warrant careful monitoring. The growth story remains intact but requires selective positioning.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s growth rate of ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% faces increasing headwinds from ${this.identifyKeyRisk(analysis)}. The previous growth narrative appears challenged.`
      },
      [ContentStrategy.TURNAROUND]: {
        [NarrativeTone.BULLISH]: `${company.companyName} is executing a successful turnaround with ${this.describeTurnaroundProgress(analysis)}. Early indicators suggest the transformation is gaining traction, creating an attractive entry point for investors.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName}'s turnaround efforts show promise with ${this.describeTurnaroundProgress(analysis)}. While challenges remain, management's strategic initiatives appear to be yielding results.`,
        [NarrativeTone.CAUTIOUS]: `${company.companyName} is attempting a challenging turnaround with mixed results. Despite ${this.describeTurnaroundProgress(analysis)}, execution risks remain elevated.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s turnaround efforts face significant obstacles. Limited progress on ${this.describeTurnaroundProgress(analysis)} raises concerns about execution capability.`
      },
      [ContentStrategy.VALUE_PLAY]: {
        [NarrativeTone.BULLISH]: `${company.companyName} represents a compelling value opportunity, trading at ${analysis.valuation.marginOfSafety}% below intrinsic value despite ${this.identifyValueCatalyst(analysis)}. The disconnect between fundamentals and valuation creates an attractive risk/reward profile.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} trades at a discount to intrinsic value, reflecting ${this.identifyValueConcern(analysis)}. Patient investors may find value, though catalysts remain unclear.`,
        [NarrativeTone.CAUTIOUS]: `While ${company.companyName} appears cheap with ${analysis.valuation.marginOfSafety}% margin of safety, the discount reflects genuine concerns about ${this.identifyValueConcern(analysis)}. Value traps remain a risk without clear catalysts.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s apparent discount reflects fundamental challenges in ${this.identifyValueConcern(analysis)}. The value trap risk outweighs potential upside.`
      },
      [ContentStrategy.MOMENTUM]: {
        [NarrativeTone.BULLISH]: `${company.companyName} rides strong momentum with ${analysis.technicals.trend} technical trend and ${(analysis.composite.momentum)}/100 momentum score. The convergence of positive fundamentals and technicals suggests continued outperformance.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} shows ${analysis.technicals.trend} momentum supported by ${this.identifyMomentumDriver(analysis)}. Trend followers may find opportunities, though valuation requires consideration.`,
        [NarrativeTone.CAUTIOUS]: `${company.companyName}'s momentum faces tests with ${this.identifyMomentumRisk(analysis)}. While the trend remains ${analysis.technicals.trend}, risk management becomes critical.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s momentum shows signs of exhaustion. Deteriorating ${this.identifyMomentumRisk(analysis)} suggests the trend may be reversing.`
      },
      [ContentStrategy.DEFENSIVE]: {
        [NarrativeTone.BULLISH]: `${company.companyName} offers defensive characteristics with beta of ${analysis.risk.beta?.toFixed(2) || 'N/A'} and stable ${(analysis.profitability.netMargin * 100).toFixed(1)}% margins. The combination of stability and growth potential appeals to risk-conscious investors.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} provides portfolio stability with low volatility and consistent profitability. While growth may be limited, downside protection remains attractive.`,
        [NarrativeTone.CAUTIOUS]: `${company.companyName}'s defensive qualities are tested by ${this.identifyDefensiveRisk(analysis)}. Traditional safety may not fully protect in current conditions.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s defensive characteristics offer limited protection against ${this.identifyDefensiveRisk(analysis)}. Even quality names face headwinds.`
      },
      [ContentStrategy.SPECULATIVE]: {
        [NarrativeTone.BULLISH]: `${company.companyName} presents a high-risk, high-reward opportunity with ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% growth despite elevated risks. Aggressive investors may find the risk/reward compelling.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} offers speculative appeal with significant upside potential balanced by ${analysis.risk.riskScore}/100 risk score. Position sizing becomes critical.`,
        [NarrativeTone.CAUTIOUS]: `${company.companyName} carries substantial risks with ${analysis.risk.riskScore}/100 risk score. Only the most risk-tolerant investors should consider exposure.`,
        [NarrativeTone.BEARISH]: `${company.companyName}'s speculative nature and ${analysis.risk.riskScore}/100 risk score suggest avoiding exposure. The risk/reward appears unfavorable.`
      },
      [ContentStrategy.DISTRESSED]: {
        [NarrativeTone.BULLISH]: `${company.companyName} emerges from distress with improving fundamentals. Contrarian investors may find opportunity as the company stabilizes.`,
        [NarrativeTone.NEUTRAL]: `${company.companyName} navigates financial challenges with ${this.describeDistressedProgress(analysis)}. Recovery remains possible but uncertain.`,
        [NarrativeTone.CAUTIOUS]: `${company.companyName} faces severe financial stress with elevated bankruptcy risk. Only specialized distressed investors should engage.`,
        [NarrativeTone.BEARISH]: `${company.companyName} approaches financial crisis with limited options. Equity holders face substantial dilution or total loss risk.`
      }
    };
    
    // Get template based on strategy and tone
    const strategyTemplates = templates[strategy] || templates[ContentStrategy.VALUE_PLAY];
    const template = strategyTemplates[tone] || strategyTemplates[NarrativeTone.NEUTRAL] || '';
    
    return template || this.generateGenericOpening(company, analysis);
  }
  
  /**
   * Generates investment thesis based on key factors
   */
  generateInvestmentThesis(
    company: CompanyData,
    analysis: AnalysisResults,
    strategy: ContentStrategy
  ): string[] {
    const thesisPoints: string[] = [];
    
    // Add strategy-specific thesis points
    switch (strategy) {
      case ContentStrategy.GROWTH_STORY:
        thesisPoints.push(
          `Revenue growth of ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% significantly exceeds industry average`,
          `Expanding addressable market in ${company.industry} supports multi-year growth runway`,
          `Operating leverage driving margin expansion and earnings growth`
        );
        break;
        
      case ContentStrategy.TURNAROUND:
        thesisPoints.push(
          `New management team implementing proven operational improvements`,
          `Cost reduction initiatives targeting ${this.estimateCostSavings(analysis)} in savings`,
          `Early indicators suggest turnaround gaining traction with ${this.identifyTurnaroundMetric(analysis)}`
        );
        break;
        
      case ContentStrategy.VALUE_PLAY:
        thesisPoints.push(
          `Trading at ${analysis.valuation.marginOfSafety}% discount to intrinsic value`,
          `Strong balance sheet provides downside protection`,
          `Hidden assets or underappreciated segments could drive revaluation`
        );
        break;
        
      case ContentStrategy.MOMENTUM:
        thesisPoints.push(
          `Technical momentum supported by ${analysis.technicals.trend} trend`,
          `Positive sentiment reinforcing price action`,
          `Pattern targets suggest ${this.calculateUpsidePotential(analysis)}% upside potential`
        );
        break;
        
      case ContentStrategy.DEFENSIVE:
        thesisPoints.push(
          `Low beta of ${analysis.risk.beta?.toFixed(2) || 'N/A'} provides portfolio stability`,
          `Consistent profitability with ${(analysis.profitability.netMargin * 100).toFixed(1)}% margins`,
          `Quality metrics score of ${analysis.quality.qualityScore}/100 indicates business resilience`
        );
        break;
        
      case ContentStrategy.SPECULATIVE:
        thesisPoints.push(
          `High growth potential with ${(analysis.growth.revenueGrowth.yoy * 100).toFixed(0)}% revenue expansion`,
          `Disruptive technology or business model`,
          `Binary outcome with substantial upside if successful`
        );
        break;
        
      case ContentStrategy.DISTRESSED:
        thesisPoints.push(
          `Deep value opportunity for distressed specialists`,
          `Asset value exceeds market capitalization`,
          `Potential for debt restructuring to preserve equity value`
        );
        break;
    }
    
    // Add common thesis points based on strengths
    if (analysis.quality.roic > 0.15) {
      thesisPoints.push(`Superior capital allocation with ${(analysis.quality.roic * 100).toFixed(0)}% ROIC`);
    }
    
    if (analysis.sentiment && analysis.sentiment.score > 0.5) {
      thesisPoints.push(`Positive sentiment momentum with improving market perception`);
    }
    
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.patternMomentum > 0.7) {
      thesisPoints.push(`Technical setup supports upside with bullish pattern formations`);
    }
    
    return thesisPoints;
  }
  
  /**
   * Generates risk summary based on identified risks
   */
  generateRiskSummary(analysis: AnalysisResults): string {
    const risks: string[] = [];
    
    // Financial risks
    if (analysis.risk.financialRisk > 7) {
      risks.push('elevated financial leverage');
    }
    
    // Operational risks
    if (analysis.risk.operationalRisk > 7) {
      risks.push('operational execution challenges');
    }
    
    // Market risks
    if (analysis.risk.marketRisk > 7) {
      risks.push('high market sensitivity');
    }
    
    // Specific risk factors
    if (analysis.risk.volatility > 30) {
      risks.push(`high volatility of ${(analysis.risk.volatility).toFixed(0)}%`);
    }
    
    if (analysis.quality.earningsQuality < 5) {
      risks.push('questionable earnings quality');
    }
    
    let summary = '';
    
    if (risks.length > 0) {
      summary = `Key risks include ${this.listItems(risks)}. `;
    }
    
    // Add risk score context
    summary += `Overall risk score of ${analysis.risk.riskScore}/100 suggests `;
    if (analysis.risk.riskScore > 70) {
      summary += 'high risk requiring careful position sizing.';
    } else if (analysis.risk.riskScore > 40) {
      summary += 'moderate risk appropriate for diversified portfolios.';
    } else {
      summary += 'lower risk suitable for conservative investors.';
    }
    
    return summary;
  }
  
  /**
   * Generates catalyst description based on potential drivers
   */
  generateCatalystDescription(
    company: CompanyData,
    analysis: AnalysisResults
  ): string[] {
    const catalysts: string[] = [];
    
    // Earnings catalysts
    if (analysis.growth.earningsGrowth.yoy > 0.15) {
      catalysts.push('Continued earnings momentum with double-digit growth');
    }
    
    // Product/Innovation catalysts  
    if (analysis.sentiment && analysis.sentiment.themes.some(t => t.name === 'innovation' && t.sentiment > 0)) {
      catalysts.push('New product launches driving market share gains');
    }
    
    // Balance sheet catalysts
    if (analysis.quality.balanceSheetStrength > 7) {
      catalysts.push('Strong balance sheet enabling strategic flexibility');
    }
    
    // Macro catalysts
    if (analysis.sentiment && analysis.sentiment.themes.some(t => t.name === 'growth' && t.sentiment > 0)) {
      catalysts.push('Favorable industry tailwinds supporting growth');
    }
    
    // Technical catalysts
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.bullishPatterns > analysis.technicals.patternAnalysis.bearishPatterns) {
      catalysts.push('Technical breakout suggesting momentum acceleration');
    }
    
    // Valuation catalysts
    if (analysis.valuation.valuation === 'undervalued') {
      catalysts.push('Valuation re-rating as market recognizes improving fundamentals');
    }
    
    // Margin catalysts
    if (analysis.profitability.marginTrend === 'expanding') {
      catalysts.push('Margin expansion from operational improvements');
    }
    
    return catalysts.length > 0 ? catalysts : ['Earnings growth continuation', 'Market share expansion'];
  }
  
  /**
   * Generates timeline description for expected developments
   */
  generateTimeline(
    company: CompanyData,
    analysis: AnalysisResults
  ): Array<{ timeframe: string; event: string; impact: string }> {
    const timeline: Array<{ timeframe: string; event: string; impact: string }> = [];
    
    // Near-term (0-3 months)
    timeline.push({
      timeframe: 'Next Quarter',
      event: 'Earnings release',
      impact: 'Key catalyst for near-term price action'
    });
    
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.keyPatterns.length > 0) {
      const pattern = analysis.technicals.patternAnalysis.keyPatterns[0];
      timeline.push({
        timeframe: '1-3 months',
        event: 'Technical pattern completion',
        impact: `Potential move to $${pattern.targetPrice}`
      });
    }
    
    // Medium-term (3-12 months)
    timeline.push({
      timeframe: '6 months',
      event: 'Full-year results',
      impact: 'Validation of growth trajectory'
    });
    
    if (analysis.profitability.marginTrend === 'expanding') {
      timeline.push({
        timeframe: '6-9 months',
        event: 'Margin improvement realization',
        impact: 'Earnings acceleration'
      });
    }
    
    // Long-term (12+ months)
    timeline.push({
      timeframe: '12-18 months',
      event: 'Strategic plan execution',
      impact: 'Fundamental business transformation'
    });
    
    if (analysis.valuation.valuation === 'undervalued') {
      timeline.push({
        timeframe: '12-24 months',
        event: 'Valuation normalization',
        impact: `${analysis.valuation.marginOfSafety}% upside to fair value`
      });
    }
    
    return timeline;
  }
  
  // Helper methods for generating specific content pieces
  
  private identifyGrowthDriver(analysis: AnalysisResults): string {
    if (analysis.sentiment && analysis.sentiment.themes.length > 0) {
      const growthTheme = analysis.sentiment.themes.find(t => 
        t.name === 'innovation' || t.name === 'growth' || t.name === 'expansion'
      );
      if (growthTheme) {
        return growthTheme.name;
      }
    }
    
    if (analysis.growth.revenueGrowth.yoy > 0.20) {
      return 'market share expansion';
    }
    
    if (analysis.profitability.marginTrend === 'expanding') {
      return 'operational efficiency';
    }
    
    return 'core business strength';
  }
  
  private identifyKeyRisk(analysis: AnalysisResults): string {
    if (analysis.risk.financialRisk > 7) {
      return 'financial leverage';
    }
    
    if (analysis.risk.operationalRisk > 7) {
      return 'operational execution';
    }
    
    if (analysis.risk.marketRisk > 7) {
      return 'market volatility';
    }
    
    return 'competitive pressures';
  }
  
  private describeTurnaroundProgress(analysis: AnalysisResults): string {
    const improvements: string[] = [];
    
    if (analysis.profitability.marginTrend === 'expanding') {
      improvements.push('expanding margins');
    }
    
    if (analysis.growth.revenueGrowth.yoy > 0) {
      improvements.push('returning to growth');
    }
    
    if (analysis.sentiment && analysis.sentiment.temporalAnalysis?.trend === 'improving') {
      improvements.push('improving sentiment');
    }
    
    if (analysis.quality.earningsQuality > 6) {
      improvements.push('higher quality earnings');
    }
    
    return improvements.length > 0 ? improvements.join(', ') : 'early progress on key initiatives';
  }
  
  private identifyValueCatalyst(analysis: AnalysisResults): string {
    if (analysis.quality.roe > 0.15) {
      return `${(analysis.quality.roe * 100).toFixed(0)}% return on equity`;
    }
    
    if (analysis.growth.fcfGrowth.yoy > 0.10) {
      return 'robust free cash flow growth';
    }
    
    if (analysis.quality.moat === 'wide') {
      return 'wide competitive moat';
    }
    
    return 'solid fundamental performance';
  }
  
  private identifyValueConcern(analysis: AnalysisResults): string {
    if (analysis.growth.revenueGrowth.yoy < 0) {
      return 'revenue headwinds';
    }
    
    if (analysis.profitability.marginTrend === 'contracting') {
      return 'margin pressure';
    }
    
    if (analysis.sentiment && analysis.sentiment.overall === 'negative') {
      return 'negative market sentiment';
    }
    
    return 'limited growth catalysts';
  }
  
  private identifyMomentumDriver(analysis: AnalysisResults): string {
    if (analysis.growth.revenueGrowth.trend === 'accelerating') {
      return 'accelerating revenue growth';
    }
    
    if (analysis.sentiment && analysis.sentiment.temporalAnalysis?.momentum > 0.5) {
      return 'improving sentiment momentum';
    }
    
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.patternMomentum > 0.7) {
      return 'bullish technical patterns';
    }
    
    return 'positive price action';
  }
  
  private identifyMomentumRisk(analysis: AnalysisResults): string {
    if (analysis.risk.volatility > 40) {
      return 'extreme volatility';
    }
    
    if (analysis.valuation.marginOfSafety < -30) {
      return 'stretched valuation';
    }
    
    if (analysis.technicals.rsi && analysis.technicals.rsi > 70) {
      return 'overbought conditions';
    }
    
    return 'momentum exhaustion';
  }
  
  private identifyDefensiveRisk(analysis: AnalysisResults): string {
    if (analysis.growth.revenueGrowth.yoy < -0.05) {
      return 'secular decline';
    }
    
    if (analysis.risk.marketRisk > 6) {
      return 'systematic market risk';
    }
    
    return 'economic headwinds';
  }
  
  private estimateCostSavings(analysis: AnalysisResults): string {
    const currentMargin = analysis.profitability.operatingMargin;
    const potentialMargin = 0.15; // Industry standard target
    const marginImprovement = Math.max(0, potentialMargin - currentMargin);
    
    // Rough estimate based on margin improvement potential
    const estimatedSavings = marginImprovement * 1000000000; // Placeholder calculation
    
    if (estimatedSavings > 1e9) {
      return `$${(estimatedSavings / 1e9).toFixed(1)}B`;
    }
    return `$${(estimatedSavings / 1e6).toFixed(0)}M`;
  }
  
  private identifyTurnaroundMetric(analysis: AnalysisResults): string {
    if (analysis.profitability.marginTrend === 'expanding') {
      return 'margin expansion';
    }
    
    if (analysis.growth.revenueGrowth.trend === 'accelerating') {
      return 'accelerating growth';
    }
    
    if (analysis.quality.earningsQuality > 7) {
      return 'improving earnings quality';
    }
    
    return 'operational improvements';
  }
  
  private calculateUpsidePotential(analysis: AnalysisResults): number {
    if (analysis.technicals.patternAnalysis && analysis.technicals.patternAnalysis.keyPatterns.length > 0) {
      const pattern = analysis.technicals.patternAnalysis.keyPatterns[0];
      // Estimate based on pattern target
      return Math.round(pattern.confidence * 0.5); // Simplified calculation
    }
    
    if (analysis.valuation.marginOfSafety > 0) {
      return Math.round(analysis.valuation.marginOfSafety);
    }
    
    return 10; // Default conservative estimate
  }
  
  private describeDistressedProgress(analysis: AnalysisResults): string {
    const progress: string[] = [];
    
    if (analysis.risk.financialRisk < 8) {
      progress.push('improving financial stability');
    }
    
    if (analysis.growth.revenueGrowth.yoy > -0.10) {
      progress.push('revenue stabilization');
    }
    
    if (analysis.quality.balanceSheetStrength > 3) {
      progress.push('balance sheet improvements');
    }
    
    return progress.length > 0 ? progress.join(' and ') : 'restructuring efforts';
  }
  
  private listItems(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return items.join(' and ');
    
    return items.slice(0, -1).join(', ') + ', and ' + items[items.length - 1];
  }
  
  private generateGenericOpening(company: CompanyData, analysis: AnalysisResults): string {
    return `${company.companyName} presents a ${analysis.composite.recommendation} opportunity ` +
           `with a composite score of ${analysis.composite.overall}/100. ` +
           `The company operates in the ${company.industry} sector ` +
           `with current market dynamics suggesting ${analysis.technicals.trend} momentum.`;
  }
}

/**
 * Creates a content generator instance
 */
export function createContentGenerator(): ContentGenerator {
  return new ContentGenerator();
}

/**
 * Generates smart conditional content based on data
 * Used in templates for dynamic sections
 */
export function generateConditionalContent(
  condition: string,
  data: any,
  trueContent: string,
  falseContent?: string
): string {
  // Evaluate condition
  const result = evaluateCondition(condition, data);
  
  return result ? trueContent : (falseContent || '');
}

/**
 * Evaluates a condition string against data
 */
function evaluateCondition(condition: string, data: any): boolean {
  try {
    // Simple condition parser
    // In production, use a proper expression evaluator
    const parts = condition.split(' ');
    if (parts.length !== 3) return false;
    
    const [field, operator, value] = parts;
    const fieldValue = getNestedValue(data, field);
    const compareValue = parseValue(value);
    
    switch (operator) {
      case '>': return fieldValue > compareValue;
      case '<': return fieldValue < compareValue;
      case '>=': return fieldValue >= compareValue;
      case '<=': return fieldValue <= compareValue;
      case '==': return fieldValue == compareValue;
      case '!=': return fieldValue != compareValue;
      default: return false;
    }
  } catch {
    return false;
  }
}

/**
 * Gets nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Parses a value string to appropriate type
 */
function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (!isNaN(Number(value))) return Number(value);
  return value.replace(/["']/g, '');
}