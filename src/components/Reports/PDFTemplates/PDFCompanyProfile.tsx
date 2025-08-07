// src/components/Reports/PDFTemplates/PDFCompanyProfile.tsx
// Company profile page with detailed financial metrics and business information
// Professional table layouts and data visualization

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFCompanyProfileProps {
  reportData: {
    ticker: string;
    rawData: {
      profile?: {
        name?: string;
        description?: string;
        sector?: string;
        industry?: string;
        exchange?: string;
        country?: string;
        market_capitalization?: string;
        employees?: number;
        website?: string;
        ceo?: string;
      };
      statistics?: {
        market_cap?: string;
        pe_ratio?: number;
        eps?: number;
        revenue_ttm?: string;
        fifty_two_week_high?: number;
        fifty_two_week_low?: number;
        dividend_yield?: number;
        beta?: number;
        shares_outstanding?: number;
      };
      quote?: {
        close?: number;
        volume?: number;
        average_volume?: number;
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
  description: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
    marginBottom: 20,
    textAlign: 'justify',
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCellLabel: {
    fontSize: 12,
    color: '#374151',
    width: '40%',
    fontWeight: 'bold',
  },
  tableCellValue: {
    fontSize: 12,
    color: '#374151',
    width: '60%',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  metricValuePositive: {
    color: '#059669',
  },
  metricValueNegative: {
    color: '#dc2626',
  },
  businessInfo: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  businessTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 12,
  },
  businessRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  businessLabel: {
    fontSize: 11,
    color: '#0369a1',
    width: '30%',
    fontWeight: 'bold',
  },
  businessValue: {
    fontSize: 11,
    color: '#374151',
    width: '70%',
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

export const PDFCompanyProfile: React.FC<PDFCompanyProfileProps> = ({ reportData }) => {
  const { ticker, rawData } = reportData;
  const profile = rawData?.profile || {};
  const statistics = rawData?.statistics || {};
  const quote = rawData?.quote || {};

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toLocaleString();
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Company Profile</Text>
        <Text style={styles.headerSubtitle}>Detailed Financial Metrics & Business Information</Text>
      </View>

      {/* Company Description */}
      {profile.description ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <Text style={styles.description}>{profile.description}</Text>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Overview</Text>
          <Text style={styles.noDataMessage}>Company description not available.</Text>
        </View>
      )}

      {/* Business Information */}
      <View style={styles.businessInfo}>
        <Text style={styles.businessTitle}>Company Information</Text>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Company Name:</Text>
          <Text style={styles.businessValue}>{profile.name || ticker}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Sector:</Text>
          <Text style={styles.businessValue}>{profile.sector || 'N/A'}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Industry:</Text>
          <Text style={styles.businessValue}>{profile.industry || 'N/A'}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Exchange:</Text>
          <Text style={styles.businessValue}>{profile.exchange || 'N/A'}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Country:</Text>
          <Text style={styles.businessValue}>{profile.country || 'N/A'}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Employees:</Text>
          <Text style={styles.businessValue}>{formatNumber(profile.employees)}</Text>
        </View>
        <View style={styles.businessRow}>
          <Text style={styles.businessLabel}>Website:</Text>
          <Text style={styles.businessValue}>{profile.website || 'N/A'}</Text>
        </View>
      </View>

      {/* Key Financial Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Financial Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Market Cap</Text>
            <Text style={styles.metricValue}>
              {statistics.market_cap || profile.market_capitalization || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>P/E Ratio</Text>
            <Text style={styles.metricValue}>
              {statistics.pe_ratio ? statistics.pe_ratio.toFixed(2) : 'N/A'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>EPS (TTM)</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(statistics.eps)}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Revenue (TTM)</Text>
            <Text style={styles.metricValue}>
              {statistics.revenue_ttm || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>52-Week High</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(statistics.fifty_two_week_high)}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>52-Week Low</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(statistics.fifty_two_week_low)}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Dividend Yield</Text>
            <Text style={styles.metricValue}>
              {formatPercentage(statistics.dividend_yield)}
            </Text>
          </View>
          
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Beta</Text>
            <Text style={styles.metricValue}>
              {statistics.beta ? statistics.beta.toFixed(2) : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Trading Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trading Information</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '40%' }]}>Metric</Text>
            <Text style={[styles.tableHeaderText, { width: '60%' }]}>Value</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Current Price</Text>
            <Text style={styles.tableCellValue}>{formatCurrency(quote.close)}</Text>
          </View>
          
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableCellLabel}>Volume</Text>
            <Text style={styles.tableCellValue}>{formatNumber(quote.volume)}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCellLabel}>Average Volume</Text>
            <Text style={styles.tableCellValue}>{formatNumber(quote.average_volume)}</Text>
          </View>
          
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableCellLabel}>Shares Outstanding</Text>
            <Text style={styles.tableCellValue}>{formatNumber(statistics.shares_outstanding)}</Text>
          </View>
        </View>
      </View>
    </Page>
  );
};
