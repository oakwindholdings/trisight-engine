// src/utils/export/CSVExporter.ts
// TriSight CSV Export Utility for ConvictionCloud and TargetReportTable data
// Implements Dick's formula-compliant data export with timestamp and metadata

import { ConvictionCloudItem } from '../../components/Chart/ConvictionCloudRenderer';
import { TargetReportRow } from '../../components/Chart/TargetReportTableRenderer';

export interface ExportOptions {
  includeTimestamp: boolean;
  includeMetadata: boolean;
  dateFormat: 'ISO' | 'US' | 'EU';
  delimiter: ',' | ';' | '\t';
  encoding: 'UTF-8' | 'UTF-16';
}

export const defaultExportOptions: ExportOptions = {
  includeTimestamp: true,
  includeMetadata: true,
  dateFormat: 'US',
  delimiter: ',',
  encoding: 'UTF-8'
};

/**
 * Export TargetReportTable data to CSV format
 * Follows Dick's worksheet formula structure for Excel compatibility
 */
export const exportTargetReportToCSV = (
  rows: TargetReportRow[],
  options: ExportOptions = defaultExportOptions
): string => {
  if (!rows || rows.length === 0) {
    throw new Error('No data to export');
  }

  const delimiter = options.delimiter;
  
  // CSV Headers (Dick's Formula Compliant)
  const headers = [
    'Symbol',
    'Conviction Score (Success)',
    'Acceleration Factor', 
    'Momentum Factor',
    'Intrinsic Strength',
    'Relative Strength',
    'Composite Score (Avg 4 Factors)',
    'Trigger Type',
    'Trigger Price',
    'Trigger Date',
    'Trigger Time'
  ];

  if (options.includeTimestamp) {
    headers.push('Export Timestamp');
  }

  if (options.includeMetadata) {
    headers.push('Data Source', 'TriSight Version');
  }

  // Format data rows
  const dataRows = rows.map(row => {
    // Calculate composite score (Dick's formula: average of 4 subfactors)
    const compositeScore = Math.round(
      (row.accelerationScore + row.momentumScore + row.intrinsicStrengthScore + row.relativeStrengthScore) / 4
    );

    const rowData = [
      escapeCSVField(row.symbol),
      row.successScore.toString(),
      row.accelerationScore.toString(),
      row.momentumScore.toString(), 
      row.intrinsicStrengthScore.toString(),
      row.relativeStrengthScore.toString(),
      compositeScore.toString(),
      escapeCSVField(row.triggerType),
      row.triggerPrice.toFixed(2),
      formatDate(row.triggerDate, options.dateFormat),
      escapeCSVField(row.triggerTime)
    ];

    if (options.includeTimestamp) {
      rowData.push(formatDate(new Date(), options.dateFormat));
    }

    if (options.includeMetadata) {
      rowData.push('TriSight AI Analytics');
      rowData.push('v1.0.0');
    }

    return rowData.join(delimiter);
  });

  // Combine headers and data
  const csvContent = [
    headers.join(delimiter),
    ...dataRows
  ].join('\n');

  console.log(`[CSVExporter] Exported ${rows.length} target report rows to CSV`);
  return csvContent;
};

/**
 * Export ConvictionCloud data to CSV format
 * Includes conviction ratings, pattern analysis, and signal metadata
 */
export const exportConvictionCloudToCSV = (
  items: ConvictionCloudItem[],
  options: ExportOptions = defaultExportOptions
): string => {
  if (!items || items.length === 0) {
    throw new Error('No conviction cloud data to export');
  }

  const delimiter = options.delimiter;
  
  // CSV Headers for ConvictionCloud
  const headers = [
    'Symbol',
    'Conviction Rating (0-100)',
    'Confidence Level (0-1)',
    'Traction Score',
    'Timing Score',
    'Risk Rating',
    'Signal Count',
    'Pattern Types',
    'Last Updated'
  ];

  if (options.includeTimestamp) {
    headers.push('Export Timestamp');
  }

  if (options.includeMetadata) {
    headers.push('Data Source', 'Analysis Type');
  }

  // Format data rows
  const dataRows = items.map(item => {
    const rowData = [
      escapeCSVField(item.symbol),
      item.convictionRating.toString(),
      item.confidenceLevel.toFixed(3),
      item.traction.toFixed(1),
      item.timing.toFixed(1),
      item.riskRating.toFixed(1),
      item.signalCount.toString(),
      escapeCSVField(item.patternTypes.join('|')),
      formatDate(item.lastUpdated, options.dateFormat)
    ];

    if (options.includeTimestamp) {
      rowData.push(formatDate(new Date(), options.dateFormat));
    }

    if (options.includeMetadata) {
      rowData.push('TriSight ConvictionCloud');
      rowData.push('AI Pattern Analysis');
    }

    return rowData.join(delimiter);
  });

  // Combine headers and data
  const csvContent = [
    headers.join(delimiter),
    ...dataRows
  ].join('\n');

  console.log(`[CSVExporter] Exported ${items.length} conviction cloud items to CSV`);
  return csvContent;
};

/**
 * Export combined ConvictionCloud + TargetReport data
 * Creates a comprehensive export with both datasets
 */
export const exportCombinedAnalysis = (
  convictionItems: ConvictionCloudItem[],
  targetReportRows: TargetReportRow[],
  options: ExportOptions = defaultExportOptions
): string => {
  const delimiter = options.delimiter;
  const timestamp = formatDate(new Date(), options.dateFormat);
  
  // Create multi-sheet CSV with clear separators
  const sections = [
    '# TriSight Combined Analysis Export',
    `# Generated: ${timestamp}`,
    `# Total Conviction Items: ${convictionItems.length}`,
    `# Total Target Report Rows: ${targetReportRows.length}`,
    '',
    '## CONVICTION CLOUD DATA',
    exportConvictionCloudToCSV(convictionItems, options),
    '',
    '',
    '## TARGET REPORT TABLE DATA',
    exportTargetReportToCSV(targetReportRows, options),
    '',
    '# End of TriSight Export'
  ];

  return sections.join('\n');
};

/**
 * Download CSV file to user's browser
 */
export const downloadCSV = (
  csvContent: string,
  filename: string,
  options: ExportOptions = defaultExportOptions
): void => {
  // Create blob with proper encoding
  const blob = new Blob([csvContent], {
    type: `text/csv;charset=${options.encoding}`
  });

  // Create download link
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${getCurrentTimestamp()}.csv`;
  link.style.display = 'none';

  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);

  console.log(`[CSVExporter] Downloaded: ${link.download}`);
};

/**
 * Helper function to escape CSV fields containing special characters
 */
const escapeCSVField = (field: string): string => {
  if (!field) return '';
  
  // Escape fields containing delimiter, quotes, or newlines
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  
  return field;
};

/**
 * Helper function to format dates according to specified format
 */
const formatDate = (date: Date, format: 'ISO' | 'US' | 'EU'): string => {
  switch (format) {
    case 'ISO':
      return date.toISOString();
    case 'US':
      return date.toLocaleDateString('en-US') + ' ' + date.toLocaleTimeString('en-US');
    case 'EU':
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB');
    default:
      return date.toISOString();
  }
};

/**
 * Helper function to get current timestamp for filenames
 */
const getCurrentTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
};

/**
 * Validate export data before processing
 */
export const validateExportData = (data: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data || !Array.isArray(data)) {
    errors.push('Data must be a valid array');
  }
  
  if (data.length === 0) {
    errors.push('Data array cannot be empty');
  }
  
  // Check for required fields in TargetReportRow
  if (data.length > 0 && 'successScore' in data[0]) {
    data.forEach((row, index) => {
      if (!row.symbol) errors.push(`Row ${index + 1}: Missing symbol`);
      if (typeof row.successScore !== 'number') errors.push(`Row ${index + 1}: Invalid success score`);
    });
  }
  
  // Check for required fields in ConvictionCloudItem
  if (data.length > 0 && 'convictionRating' in data[0]) {
    data.forEach((item, index) => {
      if (!item.symbol) errors.push(`Item ${index + 1}: Missing symbol`);
      if (typeof item.convictionRating !== 'number') errors.push(`Item ${index + 1}: Invalid conviction rating`);
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  exportTargetReportToCSV,
  exportConvictionCloudToCSV,
  exportCombinedAnalysis,
  downloadCSV,
  validateExportData,
  defaultExportOptions
};
