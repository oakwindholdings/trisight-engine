// src/components/Reports/PDFTemplates/PDFExecutiveSummary.tsx
// Executive summary page with AI-generated market assessment and investment thesis
// Professional layout matching institutional report standards

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFExecutiveSummaryProps {
  reportData: {
    ticker: string;
    aiAnalysis?: {
      marketAssessment?: string;
      financialHealth?: string;
      investmentRecommendation?: string;
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
  keyHighlights: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 12,
    color: '#0891b2',
    marginRight: 8,
    marginTop: 2,
  },
  highlightText: {
    fontSize: 12,
    color: '#374151',
    flex: 1,
    lineHeight: 1.5,
  },
  investmentBox: {
    backgroundColor: '#fefce8',
    border: '1px solid #facc15',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  investmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
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
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  priceLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  priceChange: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pricePositive: {
    color: '#059669',
  },
  priceNegative: {
    color: '#dc2626',
  },
});

export const PDFExecutiveSummary: React.FC<PDFExecutiveSummaryProps> = ({ reportData }) => {
  const { ticker, aiAnalysis, rawData } = reportData;
  const quote = rawData?.quote || {};
  const profile = rawData?.profile || {};

  const formatChange = (change: number | undefined, percentChange: number | undefined) => {
    if (change === undefined || percentChange === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change} (${sign}${percentChange}%)`;
  };

  const getChangeStyle = (change: number | undefined) => {
    if (change === undefined) return {};
    return change >= 0 ? styles.pricePositive : styles.priceNegative;
  };

  const extractKeyPoints = (text: string | undefined): string[] => {
    if (!text) return [];
    
    // Simple extraction of key points from AI analysis
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    return sentences.slice(0, 4).map(s => s.trim());
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Executive Summary</Text>
        <Text style={styles.headerSubtitle}>AI-Powered Market Assessment</Text>
      </View>

      {/* Current Price Information */}
      <View style={styles.priceInfo}>
        <View>
          <Text style={styles.priceLabel}>Current Price</Text>
          <Text style={styles.priceValue}>${quote.close?.toFixed(2) || 'N/A'}</Text>
        </View>
        <View>
          <Text style={styles.priceLabel}>Daily Change</Text>
          <Text style={[styles.priceChange, getChangeStyle(quote.change)]}>
            {formatChange(quote.change, quote.percent_change)}
          </Text>
        </View>
        <View>
          <Text style={styles.priceLabel}>Sector</Text>
          <Text style={styles.priceValue}>{profile.sector || 'N/A'}</Text>
        </View>
      </View>

      {/* AI Market Assessment */}
      {aiAnalysis?.marketAssessment ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Assessment</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Market Analysis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.marketAssessment}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Assessment</Text>
          <Text style={styles.noDataMessage}>
            AI market assessment not available. This may indicate missing Anthropic API configuration.
          </Text>
        </View>
      )}

      {/* Financial Health Analysis */}
      {aiAnalysis?.financialHealth ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Health</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Financial Analysis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.financialHealth}</Text>
          </View>
        </View>
      ) : null}

      {/* Key Highlights */}
      {aiAnalysis?.marketAssessment && (
        <View style={styles.keyHighlights}>
          <Text style={styles.highlightTitle}>Key Investment Highlights</Text>
          {extractKeyPoints(aiAnalysis.marketAssessment).map((point, index) => (
            <View key={index} style={styles.highlightItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.highlightText}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Investment Recommendation */}
      {aiAnalysis?.investmentRecommendation ? (
        <View style={styles.investmentBox}>
          <Text style={styles.investmentTitle}>Investment Recommendation</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Investment Thesis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.investmentRecommendation}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.investmentBox}>
          <Text style={styles.investmentTitle}>Investment Recommendation</Text>
          <Text style={styles.noDataMessage}>
            Investment recommendation pending AI analysis completion.
          </Text>
        </View>
      )}
    </Page>
  );
};
