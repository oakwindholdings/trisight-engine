// src/components/Reports/PDFTemplates/PDFGuidanceProfile.tsx
// Investment guidance and risk assessment page with AI recommendations
// Professional risk analysis and investment thesis presentation

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFGuidanceProfileProps {
  reportData: {
    ticker: string;
    aiAnalysis?: {
      riskAssessment?: string;
      investmentRecommendation?: string;
      marketAssessment?: string;
    };
    rawData: {
      quote?: {
        close?: number;
        change?: number;
        percent_change?: number;
      };
      profile?: {
        name?: string;
        sector?: string;
      };
      statistics?: {
        beta?: number;
        pe_ratio?: number;
        dividend_yield?: number;
      };
    };
    metadata?: {
      dataQuality?: number;
      realDataSources?: number;
    };
  };
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a, #0891b2)',
    color: '#ffffff',
    padding: 30,
    marginBottom: 30,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#1e3a8a',
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottom: '2px solid #0891b2',
    paddingBottom: 8,
  },
  aiInsight: {
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #0891b2',
    padding: 20,
    marginBottom: 20,
    borderRadius: '0 8px 8px 0',
  },
  aiLabel: {
    fontSize: 11,
    color: '#0891b2',
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  aiContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
  },
  recommendationBox: {
    backgroundColor: '#fefce8',
    border: '2px solid #facc15',
    borderRadius: 8,
    padding: 25,
    marginBottom: 20,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 15,
    textAlign: 'center',
  },
  riskMatrix: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  riskTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
  },
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  riskCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
  },
  riskLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  riskValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  riskLow: {
    color: '#059669',
  },
  riskMedium: {
    color: '#f59e0b',
  },
  riskHigh: {
    color: '#dc2626',
  },
  keyFactors: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  factorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 12,
  },
  factorItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  factorBullet: {
    fontSize: 12,
    color: '#0891b2',
    marginRight: 8,
    marginTop: 2,
  },
  factorText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    lineHeight: 1.5,
  },
  disclaimerBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 10,
  },
  disclaimerText: {
    fontSize: 10,
    color: '#7f1d1d',
    lineHeight: 1.5,
  },
  investmentProfile: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 15,
  },
  profileGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileMetric: {
    alignItems: 'center',
    flex: 1,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  profileLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  noDataMessage: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
  },
});

export const PDFGuidanceProfile: React.FC<PDFGuidanceProfileProps> = ({ reportData }) => {
  const { ticker, aiAnalysis, rawData, metadata } = reportData;
  const quote = rawData?.quote || {};
  const profile = rawData?.profile || {};
  const statistics = rawData?.statistics || {};

  const getRiskLevel = (beta: number | undefined): { level: string; style: any } => {
    if (beta === undefined) return { level: 'Unknown', style: {} };
    
    if (beta < 0.8) return { level: 'Low', style: styles.riskLow };
    if (beta <= 1.2) return { level: 'Medium', style: styles.riskMedium };
    return { level: 'High', style: styles.riskHigh };
  };

  const getValuationLevel = (pe: number | undefined): { level: string; style: any } => {
    if (pe === undefined) return { level: 'Unknown', style: {} };
    
    if (pe < 15) return { level: 'Undervalued', style: styles.riskLow };
    if (pe <= 25) return { level: 'Fair Value', style: styles.riskMedium };
    return { level: 'Overvalued', style: styles.riskHigh };
  };

  const getDividendLevel = (yield_pct: number | undefined): { level: string; style: any } => {
    if (yield_pct === undefined) return { level: 'None', style: {} };
    
    if (yield_pct > 3) return { level: 'High Yield', style: styles.riskLow };
    if (yield_pct > 1) return { level: 'Moderate', style: styles.riskMedium };
    return { level: 'Low Yield', style: styles.riskHigh };
  };

  const riskLevel = getRiskLevel(statistics.beta);
  const valuationLevel = getValuationLevel(statistics.pe_ratio);
  const dividendLevel = getDividendLevel(statistics.dividend_yield);

  const extractKeyFactors = (text: string | undefined): string[] => {
    if (!text) return ['Comprehensive analysis pending AI completion'];
    
    // Extract key investment factors from AI analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    return sentences.slice(0, 5).map(s => s.trim());
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Investment Guidance</Text>
        <Text style={styles.headerSubtitle}>Risk Assessment & Investment Recommendations</Text>
      </View>

      {/* Investment Profile Summary */}
      <View style={styles.investmentProfile}>
        <Text style={styles.profileTitle}>Investment Profile Summary</Text>
        <View style={styles.profileGrid}>
          <View style={styles.profileMetric}>
            <Text style={styles.profileValue}>${quote.close?.toFixed(2) || 'N/A'}</Text>
            <Text style={styles.profileLabel}>Current Price</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={[styles.profileValue, quote.change && quote.change >= 0 ? styles.riskLow : styles.riskHigh]}>
              {quote.change ? (quote.change >= 0 ? '+' : '') + quote.change.toFixed(2) : 'N/A'}
            </Text>
            <Text style={styles.profileLabel}>Daily Change</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileValue}>{profile.sector || 'N/A'}</Text>
            <Text style={styles.profileLabel}>Sector</Text>
          </View>
          <View style={styles.profileMetric}>
            <Text style={styles.profileValue}>{metadata?.dataQuality || 0}%</Text>
            <Text style={styles.profileLabel}>Data Quality</Text>
          </View>
        </View>
      </View>

      {/* AI Investment Recommendation */}
      {aiAnalysis?.investmentRecommendation ? (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationTitle}>AI Investment Recommendation</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>Investment Thesis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.investmentRecommendation}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.recommendationBox}>
          <Text style={styles.recommendationTitle}>AI Investment Recommendation</Text>
          <Text style={styles.noDataMessage}>
            Investment recommendation pending AI analysis completion. Ensure Anthropic API is properly configured.
          </Text>
        </View>
      )}

      {/* Risk Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Assessment</Text>
        
        {aiAnalysis?.riskAssessment ? (
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Risk Analysis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.riskAssessment}</Text>
          </View>
        ) : (
          <Text style={styles.noDataMessage}>
            Detailed risk assessment not available. This may indicate missing AI analysis.
          </Text>
        )}

        <View style={styles.riskMatrix}>
          <Text style={styles.riskTitle}>Risk Metrics</Text>
          <View style={styles.riskGrid}>
            <View style={styles.riskCard}>
              <Text style={styles.riskLabel}>Market Risk (Beta)</Text>
              <Text style={[styles.riskValue, riskLevel.style]}>
                {statistics.beta?.toFixed(2) || 'N/A'} ({riskLevel.level})
              </Text>
            </View>
            
            <View style={styles.riskCard}>
              <Text style={styles.riskLabel}>Valuation Risk</Text>
              <Text style={[styles.riskValue, valuationLevel.style]}>
                P/E {statistics.pe_ratio?.toFixed(1) || 'N/A'} ({valuationLevel.level})
              </Text>
            </View>
            
            <View style={styles.riskCard}>
              <Text style={styles.riskLabel}>Income Risk</Text>
              <Text style={[styles.riskValue, dividendLevel.style]}>
                {statistics.dividend_yield?.toFixed(2) || '0'}% ({dividendLevel.level})
              </Text>
            </View>
            
            <View style={styles.riskCard}>
              <Text style={styles.riskLabel}>Data Quality</Text>
              <Text style={[styles.riskValue, (metadata?.dataQuality || 0) > 80 ? styles.riskLow : styles.riskHigh]}>
                {metadata?.dataQuality || 0}% Quality
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Key Investment Factors */}
      <View style={styles.keyFactors}>
        <Text style={styles.factorsTitle}>Key Investment Considerations</Text>
        {extractKeyFactors(aiAnalysis?.marketAssessment || aiAnalysis?.investmentRecommendation).map((factor, index) => (
          <View key={index} style={styles.factorItem}>
            <Text style={styles.factorBullet}>•</Text>
            <Text style={styles.factorText}>{factor}</Text>
          </View>
        ))}
      </View>

      {/* Investment Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>Important Investment Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This analysis is for informational purposes only and does not constitute investment advice. 
          All investments carry risk of loss. Past performance does not guarantee future results. 
          The AI analysis is based on available data and market conditions at the time of generation. 
          Consult with a qualified financial advisor before making investment decisions. 
          Data quality: {metadata?.dataQuality || 0}% based on {metadata?.realDataSources || 0} successful API sources.
        </Text>
      </View>
    </Page>
  );
};
