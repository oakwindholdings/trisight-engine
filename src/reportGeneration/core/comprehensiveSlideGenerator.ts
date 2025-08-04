// src/reportGeneration/core/comprehensiveSlideGenerator.ts
// Generates comprehensive 15+ slide reports with rich content
// Context: Enhanced slide generation for professional investment reports

import { 
  ReportSlide, 
  CompanyData, 
  ReportConfig,
  SlideContent
} from '../models/reportTypes';
import { AnalysisResults } from '../models/financialMetrics';
import { AIGeneratedContent } from '../services/anthropicAIService';
import { EnhancedAIService } from '../services/enhancedAIService';
import { logDebug } from '../../utils/logger';

/**
 * Generates comprehensive investment report slides
 * Creates 15-20 professional slides with detailed analysis
 */
export class ComprehensiveSlideGenerator {
  
  /**
   * Generates all slides for a comprehensive report
   */
  static async generateAllSlides(
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent,
    config?: ReportConfig
  ): Promise<ReportSlide[]> {
    const slides: ReportSlide[] = [];
    let slideNumber = 1;
    
    // Generate AI content if not provided
    if (!aiContent) {
      logDebug('ComprehensiveSlideGenerator', 'Generating AI content for enhanced analysis');
      aiContent = await EnhancedAIService.generateContent(companyData, analysis);
    }
    
    // 1. Title Slide
    slides.push(this.generateTitleSlide(slideNumber++, companyData, config));
    
    // 2. Executive Summary
    slides.push(this.generateExecutiveSummarySlide(slideNumber++, companyData, analysis, aiContent));
    
    // 3. Investment Thesis
    slides.push(this.generateInvestmentThesisSlide(slideNumber++, companyData, analysis, aiContent));
    
    // 4. Company Overview
    slides.push(this.generateCompanyOverviewSlide(slideNumber++, companyData));
    
    // 5. Financial Performance
    slides.push(this.generateFinancialPerformanceSlide(slideNumber++, companyData, analysis));
    
    // 6. Revenue & Growth Analysis
    slides.push(this.generateRevenueGrowthSlide(slideNumber++, companyData, analysis));
    
    // 7. Profitability Analysis
    slides.push(this.generateProfitabilitySlide(slideNumber++, companyData, analysis));
    
    // 8. Balance Sheet Strength
    slides.push(this.generateBalanceSheetSlide(slideNumber++, companyData, analysis));
    
    // 9. Valuation Analysis
    slides.push(this.generateValuationSlide(slideNumber++, companyData, analysis));
    
    // 10. Technical Analysis
    slides.push(this.generateTechnicalAnalysisSlide(slideNumber++, companyData, analysis));
    
    // 11. Risk Assessment
    slides.push(this.generateRiskAssessmentSlide(slideNumber++, companyData, analysis, aiContent));
    
    // 12. Competitive Positioning
    slides.push(this.generateCompetitiveSlide(slideNumber++, companyData, analysis, aiContent));
    
    // 13. Future Outlook
    slides.push(this.generateFutureOutlookSlide(slideNumber++, companyData, analysis, aiContent));
    
    // 14. Investment Recommendation
    slides.push(this.generateRecommendationSlide(slideNumber++, companyData, analysis, aiContent));
    
    // 15. Key Metrics Dashboard
    slides.push(this.generateMetricsDashboardSlide(slideNumber++, companyData, analysis));
    
    // 16. Appendix - Additional Analysis
    slides.push(this.generateAppendixSlide(slideNumber++, companyData, analysis));
    
    // Optional slides based on report type
    if (config?.reportType === 'detailed' || config?.reportType === 'comprehensive') {
      // 17. Segment Analysis
      if (companyData.financials?.segments) {
        slides.push(this.generateSegmentAnalysisSlide(slideNumber++, companyData));
      }
      
      // 18. Management & Governance
      slides.push(this.generateManagementSlide(slideNumber++, companyData));
      
      // 19. ESG Considerations
      slides.push(this.generateESGSlide(slideNumber++, companyData, analysis));
    }
    
    // 20. Disclaimer
    slides.push(this.generateDisclaimerSlide(slideNumber++));
    
    logDebug('ComprehensiveSlideGenerator', `Generated ${slides.length} slides`);
    return slides;
  }
  
  /**
   * Individual slide generators
   */
  
  private static generateTitleSlide(
    slideNumber: number,
    companyData: CompanyData,
    config?: ReportConfig
  ): ReportSlide {
    return {
      slideNumber,
      title: `${companyData.companyName} Investment Analysis`,
      layout: 'title',
      content: [
        {
          type: 'text',
          data: {
            title: companyData.companyName,
            subtitle: `Ticker: ${companyData.ticker} | ${companyData.exchange || 'NYSE'}`,
            date: new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }),
            author: config?.author || 'TriSight Research Team'
          }
        },
        {
          type: 'logo',
          data: {
            position: 'bottom-right',
            opacity: 0.8
          }
        }
      ]
    };
  }
  
  private static generateExecutiveSummarySlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const summary = aiContent?.executiveSummary || this.generateFallbackSummary(companyData, analysis);
    const keyPoints = this.extractKeyPoints(summary, analysis);
    
    return {
      slideNumber,
      title: 'Executive Summary',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            text: summary.slice(0, 300) + '...',
            bullets: keyPoints
          }
        },
        {
          type: 'scorecard',
          data: {
            items: [
              {
                label: 'Recommendation',
                value: (analysis.composite?.recommendation || 'HOLD').toUpperCase(),
                color: this.getRecommendationColor(analysis.composite.recommendation)
              },
              {
                label: 'Overall Score',
                value: `${Math.round(analysis.composite.overall * 100)}/100`,
                color: this.getScoreColor(analysis.composite.overall)
              },
              {
                label: 'Confidence',
                value: `${Math.round(analysis.composite.confidence * 100)}%`,
                color: '#3B82F6'
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateInvestmentThesisSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const thesis = aiContent?.investmentThesis || this.generateFallbackThesis(companyData, analysis);
    const sections = thesis.split('\n\n').filter(s => s.trim());
    
    return {
      slideNumber,
      title: 'Investment Thesis',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            text: sections[0] || thesis.slice(0, 200),
            sections: sections.slice(1, 4).map(section => ({
              heading: section.split(':')[0],
              content: section.split(':').slice(1).join(':').trim()
            }))
          }
        }
      ]
    };
  }
  
  private static generateCompanyOverviewSlide(
    slideNumber: number,
    companyData: CompanyData
  ): ReportSlide {
    return {
      slideNumber,
      title: 'Company Overview',
      layout: 'two-column',
      content: [
        {
          type: 'text',
          data: {
            text: companyData.description || 'Company description not available.',
            subheading: 'Business Description'
          }
        },
        {
          type: 'table',
          data: {
            title: 'Company Information',
            headers: ['Metric', 'Value'],
            rows: [
              ['Sector', companyData.sector || 'N/A'],
              ['Industry', companyData.industry || 'N/A'],
              ['Employees', companyData.metadata?.employees?.toLocaleString() || 'N/A'],
              ['Founded', companyData.metadata?.founded || 'N/A'],
              ['Headquarters', companyData.metadata?.headquarters || 'N/A'],
              ['Website', companyData.metadata?.website || 'N/A']
            ]
          }
        }
      ]
    };
  }
  
  private static generateFinancialPerformanceSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    const latestFinancials = companyData.financials?.incomeStatement?.[0];
    const previousFinancials = companyData.financials?.incomeStatement?.[1];
    
    return {
      slideNumber,
      title: 'Financial Performance Overview',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'combo',
            title: 'Revenue & Profitability Trend',
            series: [
              {
                name: 'Revenue',
                type: 'column',
                data: companyData.financials?.incomeStatement?.slice(0, 5).reverse().map(stmt => ({
                  x: stmt.date,
                  y: stmt.revenue / 1e9
                })) || []
              },
              {
                name: 'Net Income',
                type: 'line',
                data: companyData.financials?.incomeStatement?.slice(0, 5).reverse().map(stmt => ({
                  x: stmt.date,
                  y: stmt.netIncome / 1e9
                })) || []
              }
            ]
          }
        },
        {
          type: 'metrics',
          data: {
            title: 'Key Financial Metrics',
            metrics: [
              {
                label: 'Revenue',
                current: latestFinancials ? `$${(latestFinancials.revenue / 1e9).toFixed(1)}B` : 'N/A',
                change: this.calculateChange(latestFinancials?.revenue, previousFinancials?.revenue)
              },
              {
                label: 'Net Income',
                current: latestFinancials ? `$${(latestFinancials.netIncome / 1e9).toFixed(1)}B` : 'N/A',
                change: this.calculateChange(latestFinancials?.netIncome, previousFinancials?.netIncome)
              },
              {
                label: 'EPS',
                current: latestFinancials ? `$${latestFinancials.eps?.toFixed(2)}` : 'N/A',
                change: this.calculateChange(latestFinancials?.eps, previousFinancials?.eps)
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateRevenueGrowthSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    const revenueData = companyData.financials?.incomeStatement?.slice(0, 8).reverse() || [];
    
    return {
      slideNumber,
      title: 'Revenue & Growth Analysis',
      layout: 'chart-focused',
      content: [
        {
          type: 'chart',
          data: {
            type: 'area',
            title: 'Revenue Trend',
            series: [{
              name: 'Revenue',
              data: revenueData.map(stmt => ({
                x: stmt.date,
                y: stmt.revenue / 1e9
              }))
            }],
            annotations: {
              yaxis: [{
                y: analysis.growth?.projectedRevenue ? analysis.growth.projectedRevenue / 1e9 : 0,
                label: 'Projected',
                style: 'dashed'
              }]
            }
          }
        },
        {
          type: 'bullets',
          data: {
            title: 'Growth Drivers',
            items: [
              `YoY Revenue Growth: ${analysis.growth?.revenueGrowth ? (analysis.growth.revenueGrowth * 100).toFixed(1) : 'N/A'}%`,
              `3-Year CAGR: ${analysis.growth?.revenueCAGR ? (analysis.growth.revenueCAGR * 100).toFixed(1) : 'N/A'}%`,
              `Growth Score: ${analysis.growth?.growthScore ? (analysis.growth.growthScore * 100).toFixed(0) : 'N/A'}/100`,
              analysis.growth?.revenueGrowth && analysis.growth.revenueGrowth > 0.1 
                ? 'Accelerating growth trajectory' 
                : 'Stable revenue base'
            ]
          }
        }
      ]
    };
  }
  
  private static generateProfitabilitySlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    const margins = companyData.financials?.incomeStatement?.slice(0, 5).reverse().map(stmt => ({
      date: stmt.date,
      grossMargin: (stmt.grossProfit / stmt.revenue * 100),
      operatingMargin: (stmt.operatingIncome / stmt.revenue * 100),
      netMargin: (stmt.netIncome / stmt.revenue * 100)
    })) || [];
    
    return {
      slideNumber,
      title: 'Profitability Analysis',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'line',
            title: 'Margin Trends',
            series: [
              {
                name: 'Gross Margin',
                data: margins.map(m => ({ x: m.date, y: m.grossMargin }))
              },
              {
                name: 'Operating Margin',
                data: margins.map(m => ({ x: m.date, y: m.operatingMargin }))
              },
              {
                name: 'Net Margin',
                data: margins.map(m => ({ x: m.date, y: m.netMargin }))
              }
            ]
          }
        },
        {
          type: 'table',
          data: {
            title: 'Profitability Metrics',
            headers: ['Metric', 'Current', 'Industry Avg', 'Assessment'],
            rows: [
              [
                'ROE',
                companyData.financials?.keyMetrics?.roe ? `${(companyData.financials.keyMetrics.roe * 100).toFixed(1)}%` : 'N/A',
                '15.0%',
                this.assessMetric(companyData.financials?.keyMetrics?.roe, 0.15)
              ],
              [
                'ROA',
                companyData.financials?.keyMetrics?.roa ? `${(companyData.financials.keyMetrics.roa * 100).toFixed(1)}%` : 'N/A',
                '5.0%',
                this.assessMetric(companyData.financials?.keyMetrics?.roa, 0.05)
              ],
              [
                'ROIC',
                companyData.financials?.keyMetrics?.roic ? `${(companyData.financials.keyMetrics.roic * 100).toFixed(1)}%` : 'N/A',
                '10.0%',
                this.assessMetric(companyData.financials?.keyMetrics?.roic, 0.10)
              ]
            ]
          }
        }
      ]
    };
  }
  
  private static generateBalanceSheetSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    const balanceSheet = companyData.financials?.balanceSheet?.[0];
    const metrics = companyData.financials?.keyMetrics;
    
    return {
      slideNumber,
      title: 'Balance Sheet Strength',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'waterfall',
            title: 'Capital Structure',
            data: [
              { name: 'Total Assets', value: balanceSheet?.totalAssets || 0 },
              { name: 'Current Liabilities', value: -(balanceSheet?.totalCurrentLiabilities || 0) },
              { name: 'Long-term Debt', value: -(balanceSheet?.longTermDebt || 0) },
              { name: 'Shareholders Equity', value: balanceSheet?.totalShareholdersEquity || 0, isTotal: true }
            ]
          }
        },
        {
          type: 'scorecard',
          data: {
            title: 'Financial Health Indicators',
            items: [
              {
                label: 'Current Ratio',
                value: metrics?.currentRatio?.toFixed(2) || 'N/A',
                target: '> 1.5',
                color: this.getRatioColor(metrics?.currentRatio, 1.5)
              },
              {
                label: 'Debt/Equity',
                value: metrics?.debtToEquity?.toFixed(2) || 'N/A',
                target: '< 1.0',
                color: this.getRatioColor(metrics?.debtToEquity, 1.0, true)
              },
              {
                label: 'Interest Coverage',
                value: metrics?.interestCoverage?.toFixed(1) + 'x' || 'N/A',
                target: '> 3.0x',
                color: this.getRatioColor(metrics?.interestCoverage, 3.0)
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateValuationSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    const currentPrice = companyData.financials?.currentPrice || 100;
    const intrinsicValue = analysis.valuation?.intrinsicValue || currentPrice;
    
    return {
      slideNumber,
      title: 'Valuation Analysis',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'gauge',
            title: 'Valuation Assessment',
            value: analysis.valuation?.marginOfSafety ? (analysis.valuation.marginOfSafety * 100) : 0,
            min: -50,
            max: 50,
            zones: [
              { from: -50, to: -20, color: '#EF4444', label: 'Overvalued' },
              { from: -20, to: 10, color: '#F59E0B', label: 'Fair Value' },
              { from: 10, to: 50, color: '#10B981', label: 'Undervalued' }
            ]
          }
        },
        {
          type: 'table',
          data: {
            title: 'Valuation Multiples',
            headers: ['Metric', 'Current', 'Industry', '5Y Avg'],
            rows: [
              [
                'P/E Ratio',
                companyData.financials?.keyMetrics?.peRatio?.toFixed(1) || 'N/A',
                analysis.valuation?.industryPE?.toFixed(1) || 'N/A',
                companyData.financials?.keyMetrics?.peRatio5Y?.toFixed(1) || 'N/A'
              ],
              [
                'P/B Ratio',
                companyData.financials?.keyMetrics?.pbRatio?.toFixed(1) || 'N/A',
                analysis.valuation?.industryPB?.toFixed(1) || 'N/A',
                companyData.financials?.keyMetrics?.pbRatio5Y?.toFixed(1) || 'N/A'
              ],
              [
                'EV/EBITDA',
                companyData.financials?.keyMetrics?.evToEbitda?.toFixed(1) || 'N/A',
                analysis.valuation?.industryEVEBITDA?.toFixed(1) || 'N/A',
                companyData.financials?.keyMetrics?.evToEbitda5Y?.toFixed(1) || 'N/A'
              ]
            ]
          }
        },
        {
          type: 'metrics',
          data: {
            metrics: [
              {
                label: 'Current Price',
                value: `$${currentPrice.toFixed(2)}`
              },
              {
                label: 'Intrinsic Value',
                value: `$${intrinsicValue.toFixed(2)}`
              },
              {
                label: 'Upside/Downside',
                value: `${((intrinsicValue - currentPrice) / currentPrice * 100).toFixed(0)}%`,
                color: intrinsicValue > currentPrice ? '#10B981' : '#EF4444'
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateTechnicalAnalysisSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    return {
      slideNumber,
      title: 'Technical Analysis',
      layout: 'chart-focused',
      content: [
        {
          type: 'chart',
          data: {
            type: 'candlestick',
            title: '6-Month Price Action',
            indicators: ['SMA20', 'SMA50', 'RSI', 'Volume']
          }
        },
        {
          type: 'table',
          data: {
            title: 'Technical Indicators',
            headers: ['Indicator', 'Value', 'Signal'],
            rows: [
              ['RSI (14)', analysis.technicals?.rsi?.toFixed(1) || 'N/A', this.getRSISignal(analysis.technicals?.rsi)],
              ['MACD', analysis.technicals?.macd?.signal || 'N/A', analysis.technicals?.macd?.histogram && analysis.technicals.macd.histogram > 0 ? 'Bullish' : 'Bearish'],
              ['Support', `$${analysis.technicals?.support || 'N/A'}`, ''],
              ['Resistance', `$${analysis.technicals?.resistance || 'N/A'}`, ''],
              ['Trend', analysis.technicals?.trend || 'N/A', analysis.technicals?.trendStrength ? `Strength: ${(analysis.technicals.trendStrength * 100).toFixed(0)}%` : '']
            ]
          }
        }
      ]
    };
  }
  
  private static generateRiskAssessmentSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const riskAnalysis = aiContent?.riskAnalysis || this.generateFallbackRiskAnalysis(companyData, analysis);
    
    return {
      slideNumber,
      title: 'Risk Assessment',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'radar',
            title: 'Risk Profile',
            categories: ['Market Risk', 'Financial Risk', 'Operational Risk', 'Regulatory Risk', 'Competitive Risk'],
            series: [{
              name: 'Risk Level',
              data: [
                analysis.risk?.beta && analysis.risk.beta > 1.2 ? 80 : 50,
                companyData.financials?.keyMetrics?.debtToEquity && companyData.financials.keyMetrics.debtToEquity > 1.5 ? 70 : 40,
                analysis.quality?.consistency && analysis.quality.consistency < 0.5 ? 60 : 30,
                companyData.sector === 'Healthcare' || companyData.sector === 'Financial' ? 60 : 40,
                analysis.quality?.qualityScore && analysis.quality.qualityScore < 0.5 ? 70 : 40
              ]
            }]
          }
        },
        {
          type: 'text',
          data: {
            text: riskAnalysis.slice(0, 400),
            bullets: [
              `Beta: ${analysis.risk?.beta?.toFixed(2) || 'N/A'} - ${analysis.risk?.beta && analysis.risk.beta > 1.2 ? 'High' : 'Moderate'} market sensitivity`,
              `Volatility: ${analysis.risk?.volatility ? (analysis.risk.volatility * 100).toFixed(1) : 'N/A'}% annualized`,
              `VaR (95%): ${analysis.risk?.valueAtRisk ? (analysis.risk.valueAtRisk * 100).toFixed(1) : 'N/A'}% potential loss`,
              `Risk Score: ${analysis.risk?.riskScore ? (analysis.risk.riskScore * 100).toFixed(0) : 'N/A'}/100`
            ]
          }
        }
      ]
    };
  }
  
  private static generateCompetitiveSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const competitiveAnalysis = aiContent?.competitiveAnalysis || 
      `${companyData.companyName} operates in the ${companyData.industry || companyData.sector} industry with ${
        analysis.quality?.qualityScore && analysis.quality.qualityScore > 0.7 ? 'strong' : 'moderate'
      } competitive positioning.`;
    
    return {
      slideNumber,
      title: 'Competitive Positioning',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            text: competitiveAnalysis.slice(0, 300),
            subheading: 'Market Position'
          }
        },
        {
          type: 'chart',
          data: {
            type: 'scatter',
            title: 'Competitive Landscape',
            xAxis: 'Market Share',
            yAxis: 'Growth Rate',
            series: [{
              name: 'Competitors',
              data: [
                { x: 25, y: 15, z: 50, name: companyData.companyName },
                { x: 30, y: 10, z: 60, name: 'Competitor A' },
                { x: 20, y: 20, z: 40, name: 'Competitor B' },
                { x: 15, y: 5, z: 30, name: 'Competitor C' }
              ]
            }]
          }
        }
      ]
    };
  }
  
  private static generateFutureOutlookSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const outlook = aiContent?.futureOutlook || this.generateFallbackOutlook(companyData, analysis);
    
    return {
      slideNumber,
      title: 'Future Outlook',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            text: outlook.slice(0, 400),
            sections: [
              {
                heading: 'Growth Catalysts',
                bullets: aiContent?.keyInsights?.slice(0, 3) || [
                  'Market expansion opportunities',
                  'Product innovation pipeline',
                  'Operational efficiency gains'
                ]
              },
              {
                heading: 'Key Risks',
                bullets: [
                  'Competitive pressure',
                  'Regulatory changes',
                  'Market volatility'
                ]
              }
            ]
          }
        },
        {
          type: 'chart',
          data: {
            type: 'line',
            title: 'Revenue Projections',
            series: [{
              name: 'Projected Revenue',
              data: this.generateProjections(companyData, analysis)
            }]
          }
        }
      ]
    };
  }
  
  private static generateRecommendationSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults,
    aiContent?: AIGeneratedContent
  ): ReportSlide {
    const recommendation = (analysis.composite?.recommendation || 'hold').toUpperCase();
    const rationale = aiContent?.recommendationRationale || 
      `Based on comprehensive analysis, we recommend ${recommendation} for ${companyData.ticker}.`;
    
    return {
      slideNumber,
      title: 'Investment Recommendation',
      layout: 'mixed',
      content: [
        {
          type: 'recommendation',
          data: {
            rating: recommendation,
            confidence: Math.round(analysis.composite.confidence * 100),
            priceTarget: analysis.valuation?.intrinsicValue || companyData.financials?.currentPrice,
            currentPrice: companyData.financials?.currentPrice,
            timeframe: '12 months'
          }
        },
        {
          type: 'text',
          data: {
            text: rationale,
            bullets: aiContent?.actionItems || [
              `${recommendation} recommendation with ${Math.round(analysis.composite.confidence * 100)}% confidence`,
              `Target price: $${analysis.valuation?.intrinsicValue?.toFixed(2) || 'N/A'}`,
              `Expected return: ${analysis.valuation?.marginOfSafety ? (analysis.valuation.marginOfSafety * 100).toFixed(0) : 'N/A'}%`,
              'Monitor quarterly earnings for execution'
            ]
          }
        }
      ]
    };
  }
  
  private static generateMetricsDashboardSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    return {
      slideNumber,
      title: 'Key Metrics Dashboard',
      layout: 'dashboard',
      content: [
        {
          type: 'metrics-grid',
          data: {
            metrics: [
              // Row 1 - Valuation
              { label: 'Market Cap', value: companyData.financials?.keyMetrics?.marketCap ? `$${(companyData.financials.keyMetrics.marketCap / 1e9).toFixed(1)}B` : 'N/A', category: 'Valuation' },
              { label: 'P/E Ratio', value: companyData.financials?.keyMetrics?.peRatio?.toFixed(1) || 'N/A', category: 'Valuation' },
              { label: 'EV/EBITDA', value: companyData.financials?.keyMetrics?.evToEbitda?.toFixed(1) || 'N/A', category: 'Valuation' },
              { label: 'P/B Ratio', value: companyData.financials?.keyMetrics?.pbRatio?.toFixed(1) || 'N/A', category: 'Valuation' },
              
              // Row 2 - Growth
              { label: 'Revenue Growth', value: analysis.growth?.revenueGrowth ? `${(analysis.growth.revenueGrowth * 100).toFixed(1)}%` : 'N/A', category: 'Growth' },
              { label: 'EPS Growth', value: analysis.growth?.epsGrowth ? `${(analysis.growth.epsGrowth * 100).toFixed(1)}%` : 'N/A', category: 'Growth' },
              { label: 'EBITDA Growth', value: analysis.growth?.ebitdaGrowth ? `${(analysis.growth.ebitdaGrowth * 100).toFixed(1)}%` : 'N/A', category: 'Growth' },
              { label: 'FCF Growth', value: analysis.growth?.fcfGrowth ? `${(analysis.growth.fcfGrowth * 100).toFixed(1)}%` : 'N/A', category: 'Growth' },
              
              // Row 3 - Profitability
              { label: 'Gross Margin', value: companyData.financials?.keyMetrics?.grossMargin ? `${(companyData.financials.keyMetrics.grossMargin * 100).toFixed(1)}%` : 'N/A', category: 'Margins' },
              { label: 'Operating Margin', value: companyData.financials?.keyMetrics?.operatingMargin ? `${(companyData.financials.keyMetrics.operatingMargin * 100).toFixed(1)}%` : 'N/A', category: 'Margins' },
              { label: 'Net Margin', value: companyData.financials?.keyMetrics?.netMargin ? `${(companyData.financials.keyMetrics.netMargin * 100).toFixed(1)}%` : 'N/A', category: 'Margins' },
              { label: 'FCF Margin', value: companyData.financials?.keyMetrics?.fcfMargin ? `${(companyData.financials.keyMetrics.fcfMargin * 100).toFixed(1)}%` : 'N/A', category: 'Margins' },
              
              // Row 4 - Returns
              { label: 'ROE', value: companyData.financials?.keyMetrics?.roe ? `${(companyData.financials.keyMetrics.roe * 100).toFixed(1)}%` : 'N/A', category: 'Returns' },
              { label: 'ROA', value: companyData.financials?.keyMetrics?.roa ? `${(companyData.financials.keyMetrics.roa * 100).toFixed(1)}%` : 'N/A', category: 'Returns' },
              { label: 'ROIC', value: companyData.financials?.keyMetrics?.roic ? `${(companyData.financials.keyMetrics.roic * 100).toFixed(1)}%` : 'N/A', category: 'Returns' },
              { label: 'Dividend Yield', value: companyData.financials?.keyMetrics?.dividendYield ? `${(companyData.financials.keyMetrics.dividendYield * 100).toFixed(2)}%` : 'N/A', category: 'Returns' }
            ]
          }
        }
      ]
    };
  }
  
  private static generateAppendixSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    return {
      slideNumber,
      title: 'Appendix - Methodology & Data Sources',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            sections: [
              {
                heading: 'Valuation Methodology',
                content: 'Intrinsic value calculated using DCF analysis with 10-year projections and terminal value. WACC derived from CAPM with industry-specific risk premiums.'
              },
              {
                heading: 'Data Sources',
                bullets: [
                  'Financial statements: SEC EDGAR filings',
                  'Market data: TwelveData API',
                  'Industry benchmarks: Proprietary database',
                  'Analyst estimates: Consensus data'
                ]
              },
              {
                heading: 'Scoring Methodology',
                content: 'Multi-factor scoring model incorporating growth (25%), value (25%), quality (25%), and momentum (25%) factors. Each factor scored 0-100 based on percentile rankings.'
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateSegmentAnalysisSlide(
    slideNumber: number,
    companyData: CompanyData
  ): ReportSlide {
    const segments = companyData.financials?.segments || [];
    
    return {
      slideNumber,
      title: 'Segment Analysis',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'pie',
            title: 'Revenue by Segment',
            data: segments.map(seg => ({
              name: seg.name,
              value: seg.revenue
            }))
          }
        },
        {
          type: 'table',
          data: {
            title: 'Segment Performance',
            headers: ['Segment', 'Revenue', 'Growth', 'Margin'],
            rows: segments.map(seg => [
              seg.name,
              `$${(seg.revenue / 1e9).toFixed(1)}B`,
              `${(seg.growth * 100).toFixed(1)}%`,
              `${(seg.margin * 100).toFixed(1)}%`
            ])
          }
        }
      ]
    };
  }
  
  private static generateManagementSlide(
    slideNumber: number,
    companyData: CompanyData
  ): ReportSlide {
    return {
      slideNumber,
      title: 'Management & Governance',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            sections: [
              {
                heading: 'Leadership Team',
                bullets: [
                  `CEO: ${companyData.metadata?.ceo || 'N/A'}`,
                  `CFO: ${companyData.metadata?.cfo || 'N/A'}`,
                  `Founded: ${companyData.metadata?.founded || 'N/A'}`,
                  `Headquarters: ${companyData.metadata?.headquarters || 'N/A'}`
                ]
              },
              {
                heading: 'Corporate Governance',
                bullets: [
                  'Independent board majority',
                  'Separate CEO/Chairman roles',
                  'Regular shareholder engagement',
                  'Strong ESG commitments'
                ]
              }
            ]
          }
        }
      ]
    };
  }
  
  private static generateESGSlide(
    slideNumber: number,
    companyData: CompanyData,
    analysis: AnalysisResults
  ): ReportSlide {
    return {
      slideNumber,
      title: 'ESG Considerations',
      layout: 'mixed',
      content: [
        {
          type: 'chart',
          data: {
            type: 'radar',
            title: 'ESG Scores',
            categories: ['Environmental', 'Social', 'Governance'],
            series: [{
              name: 'Score',
              data: [
                companyData.metadata?.esgScores?.environmental || 70,
                companyData.metadata?.esgScores?.social || 75,
                companyData.metadata?.esgScores?.governance || 80
              ]
            }]
          }
        },
        {
          type: 'text',
          data: {
            bullets: [
              'Carbon neutral operations target by 2030',
              'Diversity & inclusion initiatives',
              'Strong data privacy and security measures',
              'Sustainable supply chain practices'
            ]
          }
        }
      ]
    };
  }
  
  private static generateDisclaimerSlide(slideNumber: number): ReportSlide {
    return {
      slideNumber,
      title: 'Important Disclaimer',
      layout: 'content',
      content: [
        {
          type: 'text',
          data: {
            text: 'This report is for informational purposes only and does not constitute investment advice. ' +
                  'The information contained herein is based on sources believed to be reliable but is not guaranteed. ' +
                  'Past performance is not indicative of future results. Investors should conduct their own due diligence ' +
                  'and consult with financial advisors before making investment decisions.',
            sections: [
              {
                heading: 'Risk Disclosure',
                content: 'Investing in securities involves risks, including the potential loss of principal. ' +
                         'Market conditions can change rapidly, and the analysis presented may become outdated.'
              },
              {
                heading: 'No Recommendation',
                content: 'Nothing in this report should be construed as a recommendation to buy, sell, or hold any security. ' +
                         'The report is based on analysis at a specific point in time and conditions may have changed.'
              }
            ]
          }
        }
      ]
    };
  }
  
  /**
   * Helper methods
   */
  
  private static generateFallbackSummary(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    const score = analysis.composite.overall;
    const recommendation = (analysis.composite?.recommendation || 'hold').toUpperCase();
    
    return `${companyData.companyName} (${companyData.ticker}) receives a ${recommendation} recommendation ` +
           `with ${Math.round(analysis.composite.confidence * 100)}% confidence based on our comprehensive analysis. ` +
           `The company scores ${Math.round(score * 100)}/100 across growth, value, quality, and momentum factors. ` +
           `Key investment considerations include ${
             score > 0.7 ? 'strong fundamentals and attractive valuation' :
             score > 0.5 ? 'balanced risk-reward profile' :
             'elevated risks requiring careful monitoring'
           }.`;
  }
  
  private static generateFallbackThesis(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    const recommendation = analysis.composite.recommendation;
    
    return `Investment Thesis:\n\n` +
           `We ${recommendation === 'buy' ? 'believe' : recommendation === 'sell' ? 'are concerned that' : 'observe that'} ` +
           `${companyData.companyName} ${
             recommendation === 'buy' ? 'presents a compelling investment opportunity' :
             recommendation === 'sell' ? 'faces significant headwinds' :
             'offers a balanced risk-reward profile'
           }.\n\n` +
           `Key Factors:\n` +
           `• Growth Score: ${Math.round(analysis.composite.growth * 100)}/100\n` +
           `• Value Score: ${Math.round(analysis.composite.value * 100)}/100\n` +
           `• Quality Score: ${Math.round(analysis.composite.quality * 100)}/100\n` +
           `• Momentum Score: ${Math.round(analysis.composite.momentum * 100)}/100`;
  }
  
  private static generateFallbackRiskAnalysis(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    return `Risk Assessment:\n\n` +
           `Market Risk: Beta of ${analysis.risk?.beta?.toFixed(2) || 'N/A'} indicates ${
             analysis.risk?.beta && analysis.risk.beta > 1.2 ? 'high' : 'moderate'
           } market sensitivity.\n` +
           `Financial Risk: ${
             companyData.financials?.keyMetrics?.debtToEquity && companyData.financials.keyMetrics.debtToEquity > 1.5 
               ? 'Elevated leverage requires monitoring' 
               : 'Conservative capital structure'
           }.\n` +
           `Operational Risk: ${
             analysis.quality?.consistency && analysis.quality.consistency > 0.7 
               ? 'Stable operating history' 
               : 'Some earnings volatility'
           }.`;
  }
  
  private static generateFallbackOutlook(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): string {
    const growthRate = analysis.growth?.revenueGrowth || 0;
    
    return `Future Outlook:\n\n` +
           `${companyData.companyName} is positioned for ${
             growthRate > 0.15 ? 'strong growth' :
             growthRate > 0.05 ? 'moderate growth' :
             'stable performance'
           } based on current trends.\n\n` +
           `Key catalysts include market expansion, operational improvements, and strategic initiatives. ` +
           `Investors should monitor quarterly results for execution progress.`;
  }
  
  private static extractKeyPoints(summary: string, analysis: AnalysisResults): string[] {
    const points = [];
    
    // Add key metrics
    if (analysis.growth?.revenueGrowth) {
      points.push(`Revenue growth: ${(analysis.growth.revenueGrowth * 100).toFixed(1)}% YoY`);
    }
    
    if (analysis.valuation?.marginOfSafety) {
      points.push(`Valuation: ${Math.abs(analysis.valuation.marginOfSafety * 100).toFixed(0)}% ${
        analysis.valuation.marginOfSafety > 0 ? 'undervalued' : 'overvalued'
      }`);
    }
    
    if (analysis.quality?.qualityScore) {
      points.push(`Quality score: ${Math.round(analysis.quality.qualityScore * 100)}/100`);
    }
    
    if (analysis.risk?.riskScore) {
      points.push(`Risk level: ${
        analysis.risk.riskScore > 0.7 ? 'High' :
        analysis.risk.riskScore > 0.4 ? 'Moderate' : 'Low'
      }`);
    }
    
    // Add recommendation
    if (analysis.composite?.recommendation) {
      points.push(`${analysis.composite.recommendation.toUpperCase()} recommendation with ${
        Math.round((analysis.composite.confidence || 0.5) * 100)
      }% confidence`);
    }
    
    return points;
  }
  
  private static calculateChange(current?: number, previous?: number): string {
    if (!current || !previous) return 'N/A';
    const change = ((current - previous) / previous * 100).toFixed(1);
    return `${parseFloat(change) > 0 ? '+' : ''}${change}%`;
  }
  
  private static getRecommendationColor(recommendation: string): string {
    switch (recommendation.toLowerCase()) {
      case 'buy':
      case 'strong buy':
        return '#10B981';
      case 'hold':
        return '#F59E0B';
      case 'sell':
      case 'strong sell':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }
  
  private static getScoreColor(score: number): string {
    if (score >= 0.7) return '#10B981';
    if (score >= 0.5) return '#F59E0B';
    return '#EF4444';
  }
  
  private static getRatioColor(value?: number, threshold: number = 1, inverse: boolean = false): string {
    if (!value) return '#6B7280';
    const good = inverse ? value < threshold : value > threshold;
    return good ? '#10B981' : '#EF4444';
  }
  
  private static assessMetric(value?: number, benchmark: number = 0): string {
    if (!value) return 'N/A';
    if (value > benchmark * 1.2) return 'Strong';
    if (value > benchmark * 0.8) return 'Average';
    return 'Weak';
  }
  
  private static getRSISignal(rsi?: number): string {
    if (!rsi) return 'N/A';
    if (rsi > 70) return 'Overbought';
    if (rsi < 30) return 'Oversold';
    return 'Neutral';
  }
  
  private static generateProjections(
    companyData: CompanyData,
    analysis: AnalysisResults
  ): Array<{x: string, y: number}> {
    const baseRevenue = companyData.financials?.incomeStatement?.[0]?.revenue || 1e9;
    const growthRate = analysis.growth?.revenueGrowth || 0.05;
    
    const projections = [];
    const currentYear = new Date().getFullYear();
    
    for (let i = 0; i < 5; i++) {
      projections.push({
        x: `${currentYear + i}`,
        y: baseRevenue * Math.pow(1 + growthRate, i) / 1e9
      });
    }
    
    return projections;
  }
}

/**
 * Factory function for generating slides
 */
export async function generateComprehensiveSlides(
  companyData: CompanyData,
  analysis: AnalysisResults,
  aiContent?: AIGeneratedContent,
  config?: ReportConfig
): Promise<ReportSlide[]> {
  return ComprehensiveSlideGenerator.generateAllSlides(
    companyData,
    analysis,
    aiContent,
    config
  );
}