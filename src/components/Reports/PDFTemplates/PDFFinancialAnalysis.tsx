// src/components/Reports/PDFTemplates/PDFFinancialAnalysis.tsx
// Financial analysis page with income statement, balance sheet, and cash flow data
// Professional financial tables and AI insights integration

import React from 'react';
import { Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface PDFFinancialAnalysisProps {
  reportData: {
    ticker: string;
    rawData: {
      incomeStatement?: any;
      balanceSheet?: any;
      cashFlow?: any;
      statistics?: {
        revenue_ttm?: string;
        gross_profit_margin?: number;
        operating_margin?: number;
        net_margin?: number;
        roe?: number;
        roa?: number;
        debt_to_equity?: number;
      };
    };
    aiAnalysis?: {
      financialHealth?: string;
    };
    dataStatus?: {
      incomeStatement?: { success: boolean };
      balanceSheet?: { success: boolean };
      cashFlow?: { success: boolean };
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
  statusTable: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  statusRowHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e3a8a',
    width: '50%',
  },
  statusValue: {
    fontSize: 12,
    color: '#374151',
    width: '50%',
  },
  statusSuccess: {
    color: '#059669',
    fontWeight: 'bold',
  },
  statusFailed: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  ratiosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratioCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: 15,
    marginBottom: 10,
  },
  ratioLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ratioValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  ratioValueGood: {
    color: '#059669',
  },
  ratioValuePoor: {
    color: '#dc2626',
  },
  financialTable: {
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
    width: '60%',
    fontWeight: 'bold',
  },
  tableCellValue: {
    fontSize: 12,
    color: '#374151',
    width: '40%',
    textAlign: 'right',
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
  warningBox: {
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  warningText: {
    fontSize: 11,
    color: '#92400e',
    textAlign: 'center',
  },
});

export const PDFFinancialAnalysis: React.FC<PDFFinancialAnalysisProps> = ({ reportData }) => {
  const { ticker, rawData, aiAnalysis, dataStatus } = reportData;
  const statistics = rawData?.statistics || {};

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)}%`;
  };

  const formatRatio = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return value.toFixed(2);
  };

  const getDataStatus = (source: string): string => {
    const status = dataStatus?.[source as keyof typeof dataStatus];
    return status?.success ? '✓ Available' : '✗ Not Available';
  };

  const getStatusStyle = (source: string) => {
    const status = dataStatus?.[source as keyof typeof dataStatus];
    return status?.success ? styles.statusSuccess : styles.statusFailed;
  };

  const getRatioStyle = (value: number | undefined, goodThreshold: number, isHigherBetter: boolean = true) => {
    if (value === undefined || value === null) return {};
    
    if (isHigherBetter) {
      return value >= goodThreshold ? styles.ratioValueGood : styles.ratioValuePoor;
    } else {
      return value <= goodThreshold ? styles.ratioValueGood : styles.ratioValuePoor;
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Analysis</Text>
        <Text style={styles.headerSubtitle}>Income Statement, Balance Sheet & Cash Flow</Text>
      </View>

      {/* AI Financial Analysis */}
      {aiAnalysis?.financialHealth ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Financial Health Assessment</Text>
          <View style={styles.aiInsight}>
            <Text style={styles.aiLabel}>AI Financial Analysis</Text>
            <Text style={styles.aiContent}>{aiAnalysis.financialHealth}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Financial Health Assessment</Text>
          <Text style={styles.noDataMessage}>
            AI financial analysis not available. This may indicate missing Anthropic API configuration.
          </Text>
        </View>
      )}

      {/* Financial Data Availability */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Data Availability</Text>
        <View style={styles.statusTable}>
          <View style={[styles.statusRow, styles.statusRowHeader]}>
            <Text style={styles.statusLabel}>Financial Statement</Text>
            <Text style={styles.statusLabel}>Status</Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusValue}>Income Statement</Text>
            <Text style={[styles.statusValue, getStatusStyle('incomeStatement')]}>
              {getDataStatus('incomeStatement')}
            </Text>
          </View>
          
          <View style={[styles.statusRow, { backgroundColor: '#f9fafb' }]}>
            <Text style={styles.statusValue}>Balance Sheet</Text>
            <Text style={[styles.statusValue, getStatusStyle('balanceSheet')]}>
              {getDataStatus('balanceSheet')}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusValue}>Cash Flow Statement</Text>
            <Text style={[styles.statusValue, getStatusStyle('cashFlow')]}>
              {getDataStatus('cashFlow')}
            </Text>
          </View>
        </View>
      </View>

      {/* Key Financial Ratios */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Financial Ratios</Text>
        
        {Object.keys(statistics).length > 0 ? (
          <View style={styles.ratiosGrid}>
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Gross Profit Margin</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.gross_profit_margin, 20)]}>
                {formatPercentage(statistics.gross_profit_margin)}
              </Text>
            </View>
            
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Operating Margin</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.operating_margin, 15)]}>
                {formatPercentage(statistics.operating_margin)}
              </Text>
            </View>
            
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Net Margin</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.net_margin, 10)]}>
                {formatPercentage(statistics.net_margin)}
              </Text>
            </View>
            
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Return on Equity</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.roe, 15)]}>
                {formatPercentage(statistics.roe)}
              </Text>
            </View>
            
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Return on Assets</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.roa, 5)]}>
                {formatPercentage(statistics.roa)}
              </Text>
            </View>
            
            <View style={styles.ratioCard}>
              <Text style={styles.ratioLabel}>Debt-to-Equity</Text>
              <Text style={[styles.ratioValue, getRatioStyle(statistics.debt_to_equity, 1, false)]}>
                {formatRatio(statistics.debt_to_equity)}
              </Text>
            </View>
          </View>
        ) : (
          <Text style={styles.noDataMessage}>
            Financial ratio data not available from current data sources.
          </Text>
        )}
      </View>

      {/* Revenue Information */}
      {statistics.revenue_ttm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenue Analysis</Text>
          <View style={styles.financialTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { width: '60%' }]}>Metric</Text>
              <Text style={[styles.tableHeaderText, { width: '40%', textAlign: 'right' }]}>Value</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>Revenue (TTM)</Text>
              <Text style={styles.tableCellValue}>{statistics.revenue_ttm}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Data Limitation Warning */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Note: Detailed financial statement data may require premium API access. 
          This analysis is based on available summary statistics and real-time market data.
        </Text>
      </View>
    </Page>
  );
};
