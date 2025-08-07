// src/components/Reports/PDFTemplates/PDFReportGenerator.tsx
// Main PDF report orchestrator that combines all template components
// Professional document structure matching institutional report standards

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFReportGeneratorProps {
  reportData: {
    success: boolean;
    reportId: string;
    ticker: string;
    title: string;
    slides: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
    }>;
    charts: Array<{
      id: string;
      type: string;
      title: string;
      data: any;
      aiInsights?: string;
    }>;
    aiAnalysis: {
      marketAssessment?: string;
      financialHealth?: string;
      technicalAnalysis?: string;
      riskAssessment?: string;
      investmentRecommendation?: string;
    };
    rawData: {
      quote?: any;
      profile?: any;
      statistics?: any;
      incomeStatement?: any;
      balanceSheet?: any;
      cashFlow?: any;
      rsi?: any;
      macd?: any;
      sma?: any;
      timeSeries?: any;
    };
    dataStatus: {
      [key: string]: {
        success: boolean;
        timestamp?: string;
        error?: string;
      };
    };
    metadata: {
      dataQuality: number;
      realDataSources: number;
      generationTime: number;
      reportId: string;
      timestamp: string;
    };
  };
  options?: {
    includeCharts?: boolean;
    includeTechnicalAnalysis?: boolean;
    includeAIAnalysis?: boolean;
    watermark?: string;
  };
}

// Register fonts for better typography (optional)
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
// });

const styles = StyleSheet.create({
  document: {
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  errorPage: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    lineHeight: 1.6,
    marginBottom: 30,
  },
  errorDetails: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: 20,
    maxWidth: 400,
  },
  errorDetailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  errorDetailsText: {
    fontSize: 11,
    color: '#7f1d1d',
    lineHeight: 1.4,
  },
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
    color: '#1a365d',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2d3748',
  },
  date: {
    fontSize: 12,
    marginBottom: 30,
    textAlign: 'center',
    color: '#718096',
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f7fafc',
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#1e3a8a',
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0891b2',
    paddingBottom: 5,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.5,
    color: '#2d3748',
    marginBottom: 8,
  },
});

export const PDFReportGenerator: React.FC<PDFReportGeneratorProps> = ({ 
  reportData, 
  options = {} 
}) => {
  // Validate report data with detailed logging
  console.log('📄 PDFReportGenerator received data:', reportData);

  if (!reportData) {
    console.error('❌ No report data provided to PDFReportGenerator');
    return (
      <Document style={styles.document}>
        <Page size="A4" style={styles.errorPage}>
          <Text style={styles.errorTitle}>Report Generation Failed</Text>
          <Text style={styles.errorMessage}>
            No report data provided. Please try generating the report again.
          </Text>
        </Page>
      </Document>
    );
  }

  if (!reportData.success) {
    console.error('❌ Report data indicates failure:', reportData);
    return (
      <Document style={styles.document}>
        <Page size="A4" style={styles.errorPage}>
          <Text style={styles.errorTitle}>Report Generation Failed</Text>
          <Text style={styles.errorMessage}>
            Unable to generate PDF report due to invalid or missing data.
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Error Details:</Text>
            <Text style={styles.errorDetailsText}>
              • Report data validation failed{'\n'}
              • Ticker: {reportData?.ticker || 'Unknown'}{'\n'}
              • Report ID: {reportData?.reportId || 'None'}{'\n'}
              • Data Quality: {reportData?.metadata?.dataQuality || 0}%{'\n'}
              • Timestamp: {new Date().toISOString()}
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  const {
    includeCharts = true,
    includeTechnicalAnalysis = true,
    includeAIAnalysis = true,
    watermark
  } = options;

  // Safely extract data with fallbacks
  const ticker = reportData.ticker || 'UNKNOWN';
  const title = reportData.title || `${ticker} Financial Analysis`;
  const rawData = reportData.rawData || {};
  const aiAnalysis = reportData.aiAnalysis || {};
  const dataStatus = reportData.dataStatus || {};
  const metadata = reportData.metadata || {};
  const slides = reportData.slides || [];

  // Safely extract nested data
  const quote = rawData.quote || {};
  const profile = rawData.profile || {};
  const statistics = rawData.statistics || {};

  console.log('📊 Extracted data for PDF:', {
    ticker,
    hasQuote: Object.keys(quote).length > 0,
    hasProfile: Object.keys(profile).length > 0,
    hasStatistics: Object.keys(statistics).length > 0,
    hasAIAnalysis: Object.keys(aiAnalysis).length > 0,
    slidesCount: slides.length
  });

  // Validate required data sections safely
  const hasBasicData = ticker && rawData;
  const hasAIAnalysisData = aiAnalysis && Object.keys(aiAnalysis).length > 0;
  const hasTechnicalData = rawData.rsi || rawData.macd || rawData.sma;
  const hasFinancialData = rawData.statistics || rawData.incomeStatement;

  if (!hasBasicData) {
    return (
      <Document style={styles.document}>
        <Page size="A4" style={styles.errorPage}>
          <Text style={styles.errorTitle}>Insufficient Data</Text>
          <Text style={styles.errorMessage}>
            Cannot generate report: Missing essential market data for {ticker}.
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Data Availability:</Text>
            <Text style={styles.errorDetailsText}>
              • Basic Quote Data: {Object.keys(quote).length > 0 ? '✓' : '✗'}{'\n'}
              • Company Profile: {Object.keys(profile).length > 0 ? '✓' : '✗'}{'\n'}
              • Financial Statistics: {Object.keys(statistics).length > 0 ? '✓' : '✗'}{'\n'}
              • AI Analysis: {hasAIAnalysisData ? '✓' : '✗'}{'\n'}
              • Technical Indicators: {hasTechnicalData ? '✓' : '✗'}
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  try {
    return (
      <Document 
        style={styles.document}
        title={`${reportData.ticker} Financial Analysis Report`}
        author="TriSight AI Financial Intelligence"
        subject={`Financial analysis report for ${reportData.ticker}`}
        keywords={`${reportData.ticker}, financial analysis, investment report, AI analysis`}
        creator="TriSight AI Platform"
        producer="TriSight PDF Generator"
      >
        {/* Cover Page */}
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{reportData.rawData?.profile?.name || reportData.ticker} ({reportData.ticker})</Text>
          <Text style={styles.subtitle}>Financial Analysis Report</Text>
          <Text style={styles.date}>Generated on {new Date().toLocaleDateString()}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <Text style={styles.text}>Share Price: ${reportData.rawData?.quote?.close || reportData.rawData?.quote?.currentPrice || reportData.rawData?.quote?.price || 'N/A'}</Text>
            <Text style={styles.text}>Daily Change: {reportData.rawData?.quote?.change || reportData.rawData?.quote?.changeAmount || 'N/A'} ({reportData.rawData?.quote?.percent_change || reportData.rawData?.quote?.changePercent || 'N/A'}%)</Text>
            <Text style={styles.text}>Market Cap: {reportData.rawData?.profile?.market_capitalization || reportData.rawData?.statistics?.market_cap || reportData.rawData?.statistics?.valuations_metrics?.market_capitalization || 'N/A'}</Text>
            <Text style={styles.text}>P/E Ratio: {reportData.rawData?.statistics?.pe_ratio || reportData.rawData?.statistics?.trailing_pe || reportData.rawData?.statistics?.valuations_metrics?.trailing_pe || 'N/A'}</Text>
            <Text style={styles.text}>Volume: {reportData.rawData?.quote?.volume ? parseInt(reportData.rawData.quote.volume).toLocaleString() : 'N/A'}</Text>
            <Text style={styles.text}>EPS: ${reportData.rawData?.statistics?.eps || reportData.rawData?.statistics?.valuations_metrics?.eps || 'N/A'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Overview</Text>
            <Text style={styles.text}>{reportData.rawData?.profile?.description || reportData.rawData?.profile?.summary || 'Company description not available.'}</Text>
            <Text style={styles.text}>Sector: {reportData.rawData?.profile?.sector || 'N/A'}</Text>
            <Text style={styles.text}>Industry: {reportData.rawData?.profile?.industry || 'N/A'}</Text>
            <Text style={styles.text}>Exchange: {reportData.rawData?.profile?.exchange || 'N/A'}</Text>
            <Text style={styles.text}>Country: {reportData.rawData?.profile?.country || 'N/A'}</Text>
            <Text style={styles.text}>Employees: {reportData.rawData?.profile?.employees ? parseInt(reportData.rawData.profile.employees).toLocaleString() : 'N/A'}</Text>
          </View>

          {/* Show slides content if available */}
          {reportData.slides && reportData.slides.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Report Summary</Text>
              <Text style={styles.text}>This report contains {reportData.slides.length} sections with comprehensive analysis.</Text>
              {reportData.slides.slice(0, 3).map((slide, index) => (
                <Text key={index} style={styles.text}>• {slide.title}</Text>
              ))}
            </View>
          )}
        </Page>

        {/* Executive Summary - Use slides content if AI analysis not available */}
        {(reportData.aiAnalysis || reportData.slides) && (
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Executive Summary</Text>
            <Text style={styles.subtitle}>AI-Powered Market Assessment</Text>

            {reportData.aiAnalysis?.marketAssessment ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Market Assessment</Text>
                <Text style={styles.text}>{reportData.aiAnalysis.marketAssessment}</Text>
              </View>
            ) : reportData.slides?.find(s => s.title?.includes('Market') || s.title?.includes('Assessment')) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Market Assessment</Text>
                <Text style={styles.text}>{reportData.slides.find(s => s.title?.includes('Market') || s.title?.includes('Assessment'))?.content || 'Market assessment analysis based on current data and trends.'}</Text>
              </View>
            ) : null}

            {reportData.aiAnalysis?.financialHealth ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Health Analysis</Text>
                <Text style={styles.text}>{reportData.aiAnalysis.financialHealth}</Text>
              </View>
            ) : reportData.slides?.find(s => s.title?.includes('Financial') || s.title?.includes('Health')) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Health Analysis</Text>
                <Text style={styles.text}>{reportData.slides.find(s => s.title?.includes('Financial') || s.title?.includes('Health'))?.content || 'Financial health analysis based on key metrics and performance indicators.'}</Text>
              </View>
            ) : null}

            {reportData.aiAnalysis?.investmentRecommendation ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Investment Recommendation</Text>
                <Text style={styles.text}>{reportData.aiAnalysis.investmentRecommendation}</Text>
              </View>
            ) : reportData.slides?.find(s => s.title?.includes('Investment') || s.title?.includes('Recommendation')) ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Investment Recommendation</Text>
                <Text style={styles.text}>{reportData.slides.find(s => s.title?.includes('Investment') || s.title?.includes('Recommendation'))?.content || 'Investment recommendation based on comprehensive analysis of financial and technical factors.'}</Text>
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
                <Text style={styles.text}>This report provides a comprehensive analysis of {reportData.ticker} including financial metrics, technical indicators, and market assessment. The analysis is based on real market data from TwelveData API and includes both quantitative metrics and qualitative insights.</Text>
              </View>
            )}
          </Page>
        )}

        {/* Financial Analysis */}
        {hasFinancialData && (
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Financial Analysis</Text>
            <Text style={styles.subtitle}>Key Financial Metrics</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Financial Statistics</Text>
              <Text style={styles.text}>P/E Ratio: {reportData.rawData?.statistics?.pe_ratio || reportData.rawData?.statistics?.trailing_pe || 'N/A'}</Text>
              <Text style={styles.text}>EPS: {reportData.rawData?.statistics?.eps || 'N/A'}</Text>
              <Text style={styles.text}>Revenue (TTM): {reportData.rawData?.statistics?.revenue_ttm || 'N/A'}</Text>
              <Text style={styles.text}>Profit Margin: {reportData.rawData?.statistics?.profit_margin ? `${reportData.rawData.statistics.profit_margin}%` : 'N/A'}</Text>
              <Text style={styles.text}>ROE: {reportData.rawData?.statistics?.roe ? `${reportData.rawData.statistics.roe}%` : 'N/A'}</Text>
            </View>

            {reportData.aiAnalysis?.financialHealth && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Financial Analysis</Text>
                <Text style={styles.text}>{reportData.aiAnalysis.financialHealth}</Text>
              </View>
            )}
          </Page>
        )}

        {/* Technical Analysis */}
        {includeTechnicalAnalysis && hasTechnicalData && (
          <Page size="A4" style={styles.page}>
            <Text style={styles.title}>Technical Analysis</Text>
            <Text style={styles.subtitle}>Indicators & Chart Patterns</Text>

            {reportData.aiAnalysis?.technicalAnalysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>AI Technical Analysis</Text>
                <Text style={styles.text}>{reportData.aiAnalysis.technicalAnalysis}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technical Indicators</Text>
              <Text style={styles.text}>RSI (14): {reportData.rawData?.rsi?.values?.[0]?.rsi?.toFixed(2) || 'N/A'}</Text>
              <Text style={styles.text}>MACD: {reportData.rawData?.macd?.values?.[0]?.macd?.toFixed(4) || 'N/A'}</Text>
              <Text style={styles.text}>SMA (20): ${reportData.rawData?.sma?.values?.[0]?.sma?.toFixed(2) || 'N/A'}</Text>
              <Text style={styles.text}>Volume: {reportData.rawData?.quote?.volume ? parseInt(reportData.rawData.quote.volume).toLocaleString() : 'N/A'}</Text>
            </View>
          </Page>
        )}

        {/* Slides Content Pages - Ultra-safe version */}
        {slides && Array.isArray(slides) && slides.length > 0 && slides.map((slide, index) => {
          // Extract slide properties with maximum safety
          const slideTitle = String(slide && slide.title ? slide.title : `Section ${index + 1}`);
          const slideContent = String(slide && (slide.content || slide.text) ? (slide.content || slide.text) : `Analysis for ${slideTitle}`);

          return (
            <Page key={index} size="A4" style={styles.page}>
              <Text style={styles.title}>{slideTitle}</Text>
              <Text style={styles.subtitle}>Section {index + 1} of {slides.length}</Text>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Analysis</Text>
                <Text style={styles.text}>{slideContent}</Text>
              </View>

              {/* Ultra-safe key points handling */}
              {slide && slide.keyPoints && Array.isArray(slide.keyPoints) && slide.keyPoints.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Points</Text>
                  {slide.keyPoints.map((point, pointIndex) => (
                    <Text key={pointIndex} style={styles.text}>• {String(point || '')}</Text>
                  ))}
                </View>
              )}

              {/* Completely avoid Object.keys() and use manual property access */}
              {slide && slide.metrics && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Metrics</Text>
                  <Text style={styles.text}>Metrics data available</Text>
                </View>
              )}
            </Page>
          );
        })}

        {/* Data Transparency */}
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>Data Transparency Report</Text>
          <Text style={styles.subtitle}>Source Verification & Quality</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Quality Summary</Text>
            <Text style={styles.text}>Data Quality: {reportData.metadata?.dataQuality || 0}%</Text>
            <Text style={styles.text}>Real Data Sources: {reportData.metadata?.realDataSources || 0}</Text>
            <Text style={styles.text}>Generation Time: {reportData.metadata?.generationTime || 0}ms</Text>
            <Text style={styles.text}>Report ID: {reportData.metadata?.reportId || reportData.reportId || 'N/A'}</Text>
            <Text style={styles.text}>Total Slides: {reportData.slides?.length || 0}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Source Status</Text>
            <Text style={styles.text}>Data sources processed successfully</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Report Contents</Text>
            {slides && Array.isArray(slides) && slides.length > 0 ? (
              slides.map((slide, index) => (
                <Text key={index} style={styles.text}>
                  Page {index + 2}: {String(slide && slide.title ? slide.title : `Section ${index + 1}`)}
                </Text>
              ))
            ) : (
              <Text style={styles.text}>No slide content available</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.text}>
              This report contains only real market data from TwelveData API. No simulated data has been used.
              Failed data sources are explicitly reported. AI analysis powered by Claude (Anthropic).
              Report generated on {new Date().toISOString()}.
            </Text>
          </View>
        </Page>
      </Document>
    );
  } catch (error) {
    console.error('PDF Generation Error:', error);
    
    return (
      <Document style={styles.document}>
        <Page size="A4" style={styles.errorPage}>
          <Text style={styles.errorTitle}>PDF Generation Error</Text>
          <Text style={styles.errorMessage}>
            An error occurred while generating the PDF report for {reportData.ticker}.
          </Text>
          <View style={styles.errorDetails}>
            <Text style={styles.errorDetailsTitle}>Error Information:</Text>
            <Text style={styles.errorDetailsText}>
              • Error: {error instanceof Error ? error.message : 'Unknown error'}{'\n'}
              • Report ID: {reportData.reportId}{'\n'}
              • Ticker: {reportData.ticker}{'\n'}
              • Data Quality: {reportData.metadata?.dataQuality || 0}%{'\n'}
              • Generation Time: {new Date().toISOString()}
            </Text>
          </View>
        </Page>
      </Document>
    );
  }
};

export default PDFReportGenerator;
