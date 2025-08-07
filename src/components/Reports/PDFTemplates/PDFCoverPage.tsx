// src/components/Reports/PDFTemplates/PDFCoverPage.tsx
// PDF cover page component matching NVIDIA report style
// Displays company info, key metrics, and professional branding

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFCoverPageProps {
  reportData: {
    ticker: string;
    rawData: {
      quote?: {
        close?: number;
        change?: number;
        percent_change?: number;
        volume?: number;
      };
      profile?: {
        name?: string;
        description?: string;
        sector?: string;
        industry?: string;
        exchange?: string;
        country?: string;
        market_capitalization?: string;
      };
    };
    metadata: {
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
    padding: 40,
    marginBottom: 30,
    borderRadius: 8,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ticker: {
    fontSize: 18,
    opacity: 0.9,
    marginBottom: 20,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: 'normal',
    opacity: 0.8,
  },
  generatedDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 15,
  },
  metricsContainer: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 25,
    marginBottom: 30,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  metricValuePositive: {
    color: '#059669',
  },
  metricValueNegative: {
    color: '#dc2626',
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
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
  },
  infoTable: {
    marginTop: 15,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 8,
  },
  tableLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
    width: '30%',
  },
  tableValue: {
    fontSize: 12,
    color: '#374151',
    width: '70%',
  },
  disclaimer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: '#64748b',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 4,
    textAlign: 'center',
  },
});

export const PDFCoverPage: React.FC<PDFCoverPageProps> = ({ reportData }) => {
  const { ticker, rawData, metadata } = reportData;
  const quote = rawData?.quote || {};
  const profile = rawData?.profile || {};

  const formatChange = (change: number | undefined, percentChange: number | undefined) => {
    if (change === undefined || percentChange === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change} (${sign}${percentChange}%)`;
  };

  const getChangeStyle = (change: number | undefined) => {
    if (change === undefined) return {};
    return change >= 0 ? styles.metricValuePositive : styles.metricValueNegative;
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.companyName}>
          {profile.name || ticker}
        </Text>
        <Text style={styles.ticker}>
          ({ticker})
        </Text>
        <Text style={styles.reportTitle}>
          Financial Analysis Report
        </Text>
        <Text style={styles.generatedDate}>
          Generated on {new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </Text>
      </View>

      {/* Key Metrics Section */}
      <View style={styles.metricsContainer}>
        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>
              ${quote.close?.toFixed(2) || 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Share Price</Text>
          </View>
          
          <View style={styles.metricBox}>
            <Text style={[styles.metricValue, getChangeStyle(quote.change)]}>
              {formatChange(quote.change, quote.percent_change)}
            </Text>
            <Text style={styles.metricLabel}>Daily Change</Text>
          </View>
          
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>
              {profile.market_capitalization || 'N/A'}
            </Text>
            <Text style={styles.metricLabel}>Market Cap</Text>
          </View>
        </View>
      </View>

      {/* Company Overview Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company Overview</Text>
        
        <Text style={styles.description}>
          {profile.description || 'Company description not available.'}
        </Text>

        <View style={styles.infoTable}>
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Sector:</Text>
            <Text style={styles.tableValue}>{profile.sector || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Industry:</Text>
            <Text style={styles.tableValue}>{profile.industry || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Exchange:</Text>
            <Text style={styles.tableValue}>{profile.exchange || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Country:</Text>
            <Text style={styles.tableValue}>{profile.country || 'N/A'}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableLabel}>Volume:</Text>
            <Text style={styles.tableValue}>
              {quote.volume ? quote.volume.toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text>
          This report contains real market data from TwelveData API. Analysis generated using AI-powered financial intelligence. 
          Data quality: {metadata?.dataQuality || 0}% ({metadata?.realDataSources || 0} successful sources).
          No simulated data has been used.
        </Text>
      </View>
    </Page>
  );
};
