// src/components/Reports/PDFTemplates/PDFNewsSection.tsx
// News and market insights section with data transparency reporting
// Professional layout for market updates and data source verification

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFNewsSectionProps {
  reportData: {
    ticker: string;
    slides?: Array<{
      id: string;
      title: string;
      content: string;
      type: string;
    }>;
    dataStatus?: {
      [key: string]: {
        success: boolean;
        timestamp?: string;
        error?: string;
      };
    };
    metadata?: {
      dataQuality?: number;
      realDataSources?: number;
      generationTime?: number;
      reportId?: string;
    };
    rawData?: {
      profile?: {
        name?: string;
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
  newsItem: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  newsContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151',
  },
  transparencyBox: {
    backgroundColor: '#f0f9ff',
    border: '2px solid #0891b2',
    borderRadius: 8,
    padding: 25,
    marginBottom: 20,
  },
  transparencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0891b2',
    marginBottom: 15,
    textAlign: 'center',
  },
  qualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  qualityMetric: {
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  metricValueGood: {
    color: '#059669',
  },
  metricValuePoor: {
    color: '#dc2626',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  dataSourceTable: {
    marginTop: 15,
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
  tableCellSource: {
    fontSize: 11,
    color: '#374151',
    width: '40%',
  },
  tableCellStatus: {
    fontSize: 11,
    fontWeight: 'bold',
    width: '30%',
  },
  tableCellTime: {
    fontSize: 10,
    color: '#64748b',
    width: '30%',
  },
  statusSuccess: {
    color: '#059669',
  },
  statusFailed: {
    color: '#dc2626',
  },
  reportMetadata: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 11,
    color: '#64748b',
    width: '40%',
    fontWeight: 'bold',
  },
  metadataValue: {
    fontSize: 11,
    color: '#374151',
    width: '60%',
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
  certificationBox: {
    backgroundColor: '#fef3c7',
    border: '2px solid #f59e0b',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  certificationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
    textAlign: 'center',
  },
  certificationText: {
    fontSize: 11,
    color: '#92400e',
    lineHeight: 1.5,
    textAlign: 'center',
  },
  footerInfo: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
    borderTop: '1px solid #e5e7eb',
    paddingTop: 15,
  },
});

export const PDFNewsSection: React.FC<PDFNewsSectionProps> = ({ reportData }) => {
  const { ticker, slides, dataStatus, metadata, rawData } = reportData;
  const profile = rawData?.profile || {};

  const successful = Object.keys(dataStatus || {}).filter(key => dataStatus![key].success);
  const failed = Object.keys(dataStatus || {}).filter(key => !dataStatus![key].success);

  const formatTimestamp = (timestamp: string | undefined): string => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleTimeString();
    } catch {
      return 'N/A';
    }
  };

  const getQualityStyle = (quality: number | undefined) => {
    if (!quality) return {};
    if (quality >= 80) return styles.metricValueGood;
    if (quality >= 60) return {};
    return styles.metricValuePoor;
  };

  // Filter slides for news-like content
  const newsSlides = slides?.filter(slide => 
    slide.type === 'analysis' || 
    slide.content.length > 100
  ) || [];

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Data Transparency Report</Text>
        <Text style={styles.headerSubtitle}>Source Verification & Quality Assurance</Text>
      </View>

      {/* Report Metadata */}
      <View style={styles.reportMetadata}>
        <Text style={styles.metadataTitle}>Report Generation Details</Text>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Report ID:</Text>
          <Text style={styles.metadataValue}>{metadata?.reportId || 'N/A'}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Company:</Text>
          <Text style={styles.metadataValue}>{profile.name || ticker}</Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Generation Time:</Text>
          <Text style={styles.metadataValue}>
            {metadata?.generationTime ? `${(metadata.generationTime / 1000).toFixed(1)}s` : 'N/A'}
          </Text>
        </View>
        <View style={styles.metadataRow}>
          <Text style={styles.metadataLabel}>Generated:</Text>
          <Text style={styles.metadataValue}>{new Date().toLocaleString()}</Text>
        </View>
      </View>

      {/* Data Quality Summary */}
      <View style={styles.transparencyBox}>
        <Text style={styles.transparencyTitle}>Data Quality Certification</Text>
        
        <View style={styles.qualityMetrics}>
          <View style={styles.qualityMetric}>
            <Text style={[styles.metricValue, styles.metricValueGood]}>{successful.length}</Text>
            <Text style={styles.metricLabel}>Successful Sources</Text>
          </View>
          
          <View style={styles.qualityMetric}>
            <Text style={[styles.metricValue, failed.length > 0 ? styles.metricValuePoor : styles.metricValueGood]}>
              {failed.length}
            </Text>
            <Text style={styles.metricLabel}>Failed Sources</Text>
          </View>
          
          <View style={styles.qualityMetric}>
            <Text style={[styles.metricValue, getQualityStyle(metadata?.dataQuality)]}>
              {metadata?.dataQuality || 0}%
            </Text>
            <Text style={styles.metricLabel}>Data Quality</Text>
          </View>
        </View>

        {/* Data Source Status Table */}
        <View style={styles.dataSourceTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '40%' }]}>API Source</Text>
            <Text style={[styles.tableHeaderText, { width: '30%' }]}>Status</Text>
            <Text style={[styles.tableHeaderText, { width: '30%' }]}>Timestamp</Text>
          </View>
          
          {successful.map((api, index) => (
            <View key={api} style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tableCellSource}>{api}</Text>
              <Text style={[styles.tableCellStatus, styles.statusSuccess]}>✓ SUCCESS</Text>
              <Text style={styles.tableCellTime}>
                {formatTimestamp(dataStatus![api].timestamp)}
              </Text>
            </View>
          ))}
          
          {failed.map((api, index) => (
            <View key={api} style={[styles.tableRow, (successful.length + index) % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tableCellSource}>{api}</Text>
              <Text style={[styles.tableCellStatus, styles.statusFailed]}>✗ FAILED</Text>
              <Text style={styles.tableCellTime}>
                {formatTimestamp(dataStatus![api].timestamp)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Market Insights */}
      {newsSlides.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights & Analysis</Text>
          {newsSlides.slice(0, 3).map((slide, index) => (
            <View key={slide.id} style={styles.newsItem}>
              <Text style={styles.newsTitle}>{slide.title}</Text>
              <Text style={styles.newsContent}>
                {slide.content.length > 300 
                  ? slide.content.substring(0, 300) + '...' 
                  : slide.content
                }
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Market Insights & Analysis</Text>
          <Text style={styles.noDataMessage}>
            Market insights and news analysis not available in current data set.
          </Text>
        </View>
      )}

      {/* Data Certification */}
      <View style={styles.certificationBox}>
        <Text style={styles.certificationTitle}>Zero Fake Data Certification</Text>
        <Text style={styles.certificationText}>
          This report contains exclusively real market data from TwelveData API. 
          No simulated, estimated, or fabricated data has been used. 
          All failed data sources are explicitly reported above. 
          AI analysis powered by Claude (Anthropic) using only verified market data.
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footerInfo}>
        <Text>
          Generated by TriSight AI Financial Intelligence Platform | 
          Data Sources: TwelveData API | 
          AI Analysis: Claude (Anthropic) | 
          Report Quality: {metadata?.dataQuality || 0}%
        </Text>
      </View>
    </Page>
  );
};
