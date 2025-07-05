// src/components/Chart/ExportControls.tsx
// TriSight CSV Export UI Controls for ConvictionCloud and TargetReportTable
// Provides user-friendly export buttons with options and progress feedback

import React, { useState } from 'react';
import { ConvictionCloudItem } from './ConvictionCloudRenderer';
import { TargetReportRow } from './TargetReportTableRenderer';
import { 
  exportTargetReportToCSV, 
  exportConvictionCloudToCSV, 
  exportCombinedAnalysis,
  downloadCSV,
  validateExportData,
  ExportOptions,
  defaultExportOptions
} from '../../utils/export/CSVExporter';

export interface ExportControlsProps {
  convictionCloudItems?: ConvictionCloudItem[];
  targetReportRows?: TargetReportRow[];
  className?: string;
  position?: 'floating' | 'inline';
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  convictionCloudItems = [],
  targetReportRows = [],
  className = '',
  position = 'floating'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>(defaultExportOptions);
  const [exportStatus, setExportStatus] = useState<string>('');

  const handleExportTargetReport = async () => {
    if (targetReportRows.length === 0) {
      setExportStatus('No target report data to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('Exporting target report...');

    try {
      const validation = validateExportData(targetReportRows);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const csvContent = exportTargetReportToCSV(targetReportRows, exportOptions);
      downloadCSV(csvContent, 'TriSight_TargetReport', exportOptions);
      
      setExportStatus(`Successfully exported ${targetReportRows.length} target reports`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('[ExportControls] Target report export failed:', error);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportConvictionCloud = async () => {
    if (convictionCloudItems.length === 0) {
      setExportStatus('No conviction cloud data to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('Exporting conviction cloud...');

    try {
      const validation = validateExportData(convictionCloudItems);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const csvContent = exportConvictionCloudToCSV(convictionCloudItems, exportOptions);
      downloadCSV(csvContent, 'TriSight_ConvictionCloud', exportOptions);
      
      setExportStatus(`Successfully exported ${convictionCloudItems.length} conviction items`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('[ExportControls] Conviction cloud export failed:', error);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCombined = async () => {
    if (convictionCloudItems.length === 0 && targetReportRows.length === 0) {
      setExportStatus('No data to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('Exporting combined analysis...');

    try {
      const csvContent = exportCombinedAnalysis(convictionCloudItems, targetReportRows, exportOptions);
      downloadCSV(csvContent, 'TriSight_CombinedAnalysis', exportOptions);
      
      setExportStatus(`Successfully exported complete analysis (${convictionCloudItems.length + targetReportRows.length} items)`);
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      console.error('[ExportControls] Combined export failed:', error);
      setExportStatus(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setExportStatus(''), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  const updateExportOption = <K extends keyof ExportOptions>(
    key: K, 
    value: ExportOptions[K]
  ) => {
    setExportOptions(prev => ({ ...prev, [key]: value }));
  };

  const baseStyles = `
    export-controls 
    ${position === 'floating' ? 'fixed top-4 right-4 z-50' : 'inline-block'} 
    bg-white border border-gray-200 rounded-lg shadow-lg p-3
    ${className}
  `;

  return (
    <div className={baseStyles}>
      {/* Export Status */}
      {exportStatus && (
        <div className={`text-xs mb-2 p-2 rounded ${
          exportStatus.includes('failed') || exportStatus.includes('error') 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : exportStatus.includes('Successfully') 
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {exportStatus}
        </div>
      )}

      {/* Export Buttons */}
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <button
            onClick={handleExportTargetReport}
            disabled={isExporting || targetReportRows.length === 0}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${targetReportRows.length === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
              }
            `}
            title={`Export ${targetReportRows.length} target report rows`}
          >
            📊 Targets ({targetReportRows.length})
          </button>

          <button
            onClick={handleExportConvictionCloud}
            disabled={isExporting || convictionCloudItems.length === 0}
            className={`
              px-3 py-1 text-xs font-medium rounded transition-colors
              ${convictionCloudItems.length === 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
              }
            `}
            title={`Export ${convictionCloudItems.length} conviction cloud items`}
          >
            ☁️ Cloud ({convictionCloudItems.length})
          </button>
        </div>

        <button
          onClick={handleExportCombined}
          disabled={isExporting || (convictionCloudItems.length === 0 && targetReportRows.length === 0)}
          className={`
            px-3 py-1 text-xs font-medium rounded transition-colors w-full
            ${(convictionCloudItems.length === 0 && targetReportRows.length === 0)
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300'
            }
          `}
          title="Export complete analysis with both datasets"
        >
          📈 Combined Export
        </button>

        {/* Options Toggle */}
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="px-3 py-1 text-xs font-medium rounded transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
        >
          ⚙️ Options {showOptions ? '▲' : '▼'}
        </button>
      </div>

      {/* Export Options Panel */}
      {showOptions && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
          <div className="text-xs font-medium text-gray-700 mb-2">Export Settings</div>
          
          {/* Date Format */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Date Format:</span>
            <select
              value={exportOptions.dateFormat}
              onChange={(e) => updateExportOption('dateFormat', e.target.value as ExportOptions['dateFormat'])}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value="US">US (MM/DD/YYYY)</option>
              <option value="EU">EU (DD/MM/YYYY)</option>
              <option value="ISO">ISO (YYYY-MM-DD)</option>
            </select>
          </div>

          {/* Delimiter */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600">Delimiter:</span>
            <select
              value={exportOptions.delimiter}
              onChange={(e) => updateExportOption('delimiter', e.target.value as ExportOptions['delimiter'])}
              className="text-xs border rounded px-1 py-0.5"
            >
              <option value=",">Comma (,)</option>
              <option value=";">Semicolon (;)</option>
              <option value="\t">Tab</option>
            </select>
          </div>

          {/* Include Options */}
          <div className="space-y-1">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeTimestamp}
                onChange={(e) => updateExportOption('includeTimestamp', e.target.checked)}
                className="text-xs"
              />
              <span className="text-xs text-gray-600">Include timestamp</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exportOptions.includeMetadata}
                onChange={(e) => updateExportOption('includeMetadata', e.target.checked)}
                className="text-xs"
              />
              <span className="text-xs text-gray-600">Include metadata</span>
            </label>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isExporting && (
        <div className="mt-2 flex items-center justify-center">
          <div className="animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-xs text-gray-600">Exporting...</span>
        </div>
      )}
    </div>
  );
};

export default ExportControls;
