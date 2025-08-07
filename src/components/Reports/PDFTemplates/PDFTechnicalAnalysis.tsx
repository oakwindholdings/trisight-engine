// src/components/Reports/PDFTemplates/PDFTechnicalAnalysis.tsx
// Technical analysis page with indicators, chart patterns, and AI insights
// RSI, MACD, SMA analysis with professional formatting

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFTechnicalAnalysisProps {
  reportData: {
    ticker: string;
    rawData: {
      rsi?: {
        values?: Array<{ rsi: number; datetime: string }>;
      };
      macd?: {
        values?: Array<{ macd: number; macd_signal: number; macd_hist: number; datetime: string }>;
      };
      sma?: {
        values?: Array<{ sma: number; datetime: string }>;
      };
      quote?: {
        close?: number;
        high?: number;
        low?: number;
        volume?: number;
      };
    };
    aiAnalysis?: {
      technicalAnalysis?: string;
    };
    charts?: Array<{
      id: string;
      type: string;
      title: string;
      data: any;
      aiInsights?: string;
    }>;
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
  indicatorsTable: {
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
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  tableRowAlt: {
    backgroundColor: '#f9fafb',
  },
  tableCellIndicator: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    width: '25%',
  },
  tableCellValue: {
    fontSize: 12,
    color: '#374151',
    width: '25%',
    textAlign: 'center',
  },
  tableCellSignal: {
    fontSize: 12,
    fontWeight: 'bold',
    width: '25%',
    textAlign: 'center',
  },
  tableCellDescription: {
    fontSize: 11,
    color: '#64748b',
    width: '25%',
  },
  signalBullish: {
    color: '#059669',
  },
  signalBearish: {
    color: '#dc2626',
  },
  signalNeutral: {
    color: '#64748b',
  },
  indicatorCard: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
  },
  indicatorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 10,
  },
  indicatorGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  indicatorMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'center',
  },
  chartPlaceholder: {
    backgroundColor: '#f0f9ff',
    border: '2px dashed #0891b2',
    borderRadius: 8,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: 12,
    color: '#0891b2',
    textAlign: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 15,
    borderRadius: 6,
    marginBottom: 20,
  },
  priceMetric: {
    alignItems: 'center',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 5,
  },
  priceLabel: {
    fontSize: 10,
    color: '#64748b',
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
  summaryBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 8,
    padding: 20,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 12,
    color: '#92400e',
    lineHeight: 1.5,
  },
});

export const PDFTechnicalAnalysis: React.FC<PDFTechnicalAnalysisProps> = ({ reportData }) => {
  const { ticker, rawData, aiAnalysis, charts } = reportData;
  const quote = rawData?.quote || {};
  
  // Get latest indicator values
  const rsiValue = rawData?.rsi?.values?.[0]?.rsi;
  const macdData = rawData?.macd?.values?.[0];
  const smaValue = rawData?.sma?.values?.[0]?.sma;

  const getRSISignal = (rsi: number | undefined): { signal: string; style: any; description: string } => {
    if (rsi === undefined) return { signal: 'N/A', style: styles.signalNeutral, description: 'No data' };
    
    if (rsi > 70) return { signal: 'Overbought', style: styles.signalBearish, description: 'Potential sell signal' };
    if (rsi < 30) return { signal: 'Oversold', style: styles.signalBullish, description: 'Potential buy signal' };
    return { signal: 'Neutral', style: styles.signalNeutral, description: 'No clear signal' };
  };

  const getMACDSignal = (macd: number | undefined, signal: number | undefined): { signal: string; style: any; description: string } => {
    if (macd === undefined || signal === undefined) return { signal: 'N/A', style: styles.signalNeutral, description: 'No data' };
    
    if (macd > signal) return { signal: 'Bullish', style: styles.signalBullish, description: 'MACD above signal line' };
    if (macd < signal) return { signal: 'Bearish', style: styles.signalBearish, description: 'MACD below signal line' };
    return { signal: 'Neutral', style: styles.signalNeutral, description: 'MACD near signal line' };
  };

  const getSMASignal = (price: number | undefined, sma: number | undefined): { signal: string; style: any; description: string } => {
    if (price === undefined || sma === undefined) return { signal: 'N/A', style: styles.signalNeutral, description: 'No data' };
    
    if (price > sma) return { signal: 'Above SMA', style: styles.signalBullish, description: 'Price above moving average' };
    if (price < sma) return { signal: 'Below SMA', style: styles.signalBearish, description: 'Price below moving average' };
    return { signal: 'At SMA', style: styles.signalNeutral, description: 'Price near moving average' };
  };

  const rsiSignal = getRSISignal(rsiValue);
  const macdSignal = getMACDSignal(macdData?.macd, macdData?.macd_signal);
  const smaSignal = getSMASignal(quote.close, smaValue);

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Technical Analysis</Text>
        <Text style={styles.headerSubtitle}>Indicators, Chart Patterns & Trading Signals</Text>
      </View>

      {/* Current Price Information */}
      <View style={styles.priceInfo}>
        <View style={styles.priceMetric}>
          <Text style={styles.priceValue}>${quote.close?.toFixed(2) || 'N/A'}</Text>
          <Text style={styles.priceLabel}>Current Price</Text>
        </View>
        <View style={styles.priceMetric}>
          <Text style={styles.priceValue}>${quote.high?.toFixed(2) || 'N/A'}</Text>
          <Text style={styles.priceLabel}>Day High</Text>
        </View>
        <View style={styles.priceMetric}>
          <Text style={styles.priceValue}>${quote.low?.toFixed(2) || 'N/A'}</Text>
          <Text style={styles.priceLabel}>Day Low</Text>
        </View>
        <View style={styles.priceMetric}>
          <Text style={styles.priceValue}>{quote.volume ? (quote.volume / 1000000).toFixed(1) + 'M' : 'N/A'}</Text>
          <Text style={styles.priceLabel}>Volume</Text>
        </View>
      </View>

      {/* AI Technical Analysis */}
      {aiAnalysis?.technicalAnalysis ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Technical Assessment</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Technical Analysis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.technicalAnalysis}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Technical Assessment</Text>
          <Text style={styles.noDataMessage}>
            AI technical analysis not available. This may indicate missing Anthropic API configuration.
          </Text>
        </View>
      )}

      {/* Technical Indicators Table */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Indicators Summary</Text>
        <View style={styles.indicatorsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '25%' }]}>Indicator</Text>
            <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'center' }]}>Value</Text>
            <Text style={[styles.tableHeaderText, { width: '25%', textAlign: 'center' }]}>Signal</Text>
            <Text style={[styles.tableHeaderText, { width: '25%' }]}>Interpretation</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCellIndicator}>RSI (14)</Text>
            <Text style={styles.tableCellValue}>{rsiValue?.toFixed(2) || 'N/A'}</Text>
            <Text style={[styles.tableCellSignal, rsiSignal.style]}>{rsiSignal.signal}</Text>
            <Text style={styles.tableCellDescription}>{rsiSignal.description}</Text>
          </View>
          
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.tableCellIndicator}>MACD</Text>
            <Text style={styles.tableCellValue}>{macdData?.macd?.toFixed(4) || 'N/A'}</Text>
            <Text style={[styles.tableCellSignal, macdSignal.style]}>{macdSignal.signal}</Text>
            <Text style={styles.tableCellDescription}>{macdSignal.description}</Text>
          </View>
          
          <View style={styles.tableRow}>
            <Text style={styles.tableCellIndicator}>SMA (20)</Text>
            <Text style={styles.tableCellValue}>${smaValue?.toFixed(2) || 'N/A'}</Text>
            <Text style={[styles.tableCellSignal, smaSignal.style]}>{smaSignal.signal}</Text>
            <Text style={styles.tableCellDescription}>{smaSignal.description}</Text>
          </View>
        </View>
      </View>

      {/* Detailed Indicator Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detailed Indicator Analysis</Text>
        
        {/* RSI Analysis */}
        <View style={styles.indicatorCard}>
          <Text style={styles.indicatorTitle}>Relative Strength Index (RSI)</Text>
          <View style={styles.indicatorGrid}>
            <View style={styles.indicatorMetric}>
              <Text style={[styles.metricValue, rsiSignal.style]}>
                {rsiValue?.toFixed(1) || 'N/A'}
              </Text>
              <Text style={styles.metricLabel}>Current RSI</Text>
            </View>
            <View style={styles.indicatorMetric}>
              <Text style={styles.metricValue}>70</Text>
              <Text style={styles.metricLabel}>Overbought Level</Text>
            </View>
            <View style={styles.indicatorMetric}>
              <Text style={styles.metricValue}>30</Text>
              <Text style={styles.metricLabel}>Oversold Level</Text>
            </View>
          </View>
        </View>

        {/* MACD Analysis */}
        {macdData && (
          <View style={styles.indicatorCard}>
            <Text style={styles.indicatorTitle}>MACD (Moving Average Convergence Divergence)</Text>
            <View style={styles.indicatorGrid}>
              <View style={styles.indicatorMetric}>
                <Text style={[styles.metricValue, macdSignal.style]}>
                  {macdData.macd?.toFixed(4) || 'N/A'}
                </Text>
                <Text style={styles.metricLabel}>MACD Line</Text>
              </View>
              <View style={styles.indicatorMetric}>
                <Text style={styles.metricValue}>
                  {macdData.macd_signal?.toFixed(4) || 'N/A'}
                </Text>
                <Text style={styles.metricLabel}>Signal Line</Text>
              </View>
              <View style={styles.indicatorMetric}>
                <Text style={styles.metricValue}>
                  {macdData.macd_hist?.toFixed(4) || 'N/A'}
                </Text>
                <Text style={styles.metricLabel}>Histogram</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Chart Placeholder */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Price Chart Analysis</Text>
        <View style={styles.chartPlaceholder}>
          <Text style={styles.chartPlaceholderText}>
            Price Chart with Technical Indicators{'\n'}
            (Chart visualization available in web interface)
          </Text>
        </View>
        
        {charts?.find(chart => chart.aiInsights) && (
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>Chart Pattern Analysis</Text>
            <Text style={styles.aiContent}>
              {charts.find(chart => chart.aiInsights)?.aiInsights}
            </Text>
          </View>
        )}
      </View>

      {/* Technical Summary */}
      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Technical Analysis Summary</Text>
        <Text style={styles.summaryText}>
          Based on current technical indicators: RSI shows {rsiSignal.signal.toLowerCase()} conditions, 
          MACD indicates {macdSignal.signal.toLowerCase()} momentum, and price is {smaSignal.signal.toLowerCase()}. 
          Consider multiple timeframes and fundamental analysis before making trading decisions.
        </Text>
      </View>
    </Page>
  );
};
