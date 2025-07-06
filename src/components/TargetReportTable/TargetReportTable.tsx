// src/components/TargetReportTable/TargetReportTable.tsx
// Dick's TriSight Target Report Table with actual formulas and real calculated data
// Replaces SymbolRankingTable with comprehensive scoring system

import React, { useState, useMemo, useEffect } from 'react';
import { useChartContext } from '../../contexts/ChartContext';
import styled from 'styled-components';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { TradeActionSignal } from '../../utils/trading/TradeActionSignal';
import { PatternBase } from '../../models/PatternTypes';
import { StepBox } from '../../types/pattern';
import { fetchMultipleSymbolChanges } from '../../utils/twelvedata';
import { useSignalScanner } from '../../hooks/useSignalScanner';
import { downloadAuditJSON } from '../../utils/auditLogger';
import { computeTriSightMetrics } from '../../utils/scoring/scoreEngine';

// Dick's TriSight Target Report Row Interface
export interface TargetReportRow {
  symbol: string;
  // Dick's Core Metrics (calculated from real data)
  triSightRating: number;      // (Success + Acceleration + Intrinsic + Momentum) / 4
  triSightRatingPercentile?: number;
  triSightRatingRank?: number;
  successProfile: number;       // TriSight Conviction Rating (AI Calculation)
  successProfilePercentile?: number;
  successProfileRank?: number;
  acceleration: number;         // Escalator Step Count
  accelerationPercentile?: number;
  accelerationRank?: number;
  intrinsicStrength: number;    // Blackjack Trailing 5
  intrinsicStrengthPercentile?: number;
  intrinsicStrengthRank?: number;
  momentum: number;             // sum(5 Day % Gain + 10 Day % Gain) / 2
  momentumPercentile?: number;
  momentumRank?: number;
  relativeStrength: number;     // Blackjack Continuance Score
  relativeStrengthPercentile?: number;
  relativeStrengthRank?: number;
  goldenCandle: number;         // Step Breakout Candle with +/- 1 BJ and +/- 2 Escalator
  
  // Additional Context
  patternType: string;
  triggerPrice: number;
  triggerDate: Date;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Raw Data for Calculations
  rawData: {
    signal: TradeActionSignal;
    patterns: PatternBase[];
    escalatorSteps: StepBox[];
    priceGains: {
      day5Gain: number;
      day10Gain: number;
    };
    blackjackScores: {
      trailing5: number;
      continuanceScore: number;
    };
  };
}

export interface TargetReportTableProps {
  // signals removed (now dynamic)
  patterns: PatternBase[];
  escalatorSteps: StepBox[];
  selectedSymbol?: string;
  onSymbolSelect?: (symbol: string) => void;
  loading?: boolean;
  customSymbols: string[];
  scanning: boolean;
  onScanComplete?: () => void;
}

// Styled Components
const TableContainer = styled.div<{ isFullscreen?: boolean }>`
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  
  ${props => props.isFullscreen && `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    height: 100vh;
    border-radius: 0;
    border: none;
    box-shadow: none;
  `}
`;

const TableWrapper = styled.div<{ isFullscreen?: boolean }>`
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
  
  ${props => props.isFullscreen && `
    max-height: calc(100vh - 120px);
  `}
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
    
    &:hover {
      background: #94a3b8;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1200px; // Ensure all columns fit
`;

const TableHeader = styled.thead`
  background: #1e293b;
  color: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const HeaderCell = styled.th<{ sortable?: boolean }>`
  padding: 6px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 10px;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  user-select: none;
  white-space: nowrap;
  border-right: 1px solid #374151;
  
  &:hover {
    background: ${props => props.sortable ? '#374151' : 'transparent'};
  }
  
  &:last-child {
    border-right: none;
  }
`;

const SortIcon = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 10px;
  color: #94a3b8;
`;

const TableBody = styled.tbody`
  background: #ffffff;
`;

const TableRow = styled.tr<{ selected?: boolean }>`
  cursor: pointer;
  transition: background-color 0.2s;
  background: ${props => props.selected ? '#e0f2fe' : 'transparent'};
  
  &:hover {
    background: ${props => props.selected ? '#e0f2fe' : '#f8fafc'};
  }
  
  &:nth-child(even) {
    background: ${props => props.selected ? '#e0f2fe' : '#f9fafb'};
  }
  
  &:not(:last-child) {
    border-bottom: 1px solid #f1f5f9;
  }
`;

const TableCell = styled.td`
  padding: 4px 8px;
  color: #1e293b;
  font-size: 10px;
  border-right: 1px solid #f1f5f9;
  
  &:last-child {
    border-right: none;
  }
`;

const SymbolCell = styled(TableCell)`
  font-weight: 600;
  color: #0ea5e9;
  font-size: 12px;
  max-width: 80px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const ScoreCell = styled(TableCell)<{ value: number; isTriSightRating?: boolean }>`
  font-weight: 500;
  text-align: center;
  color: ${props => {
    // TriSight Rating uses different scale (0-100)
    if (props.isTriSightRating) {
      if (props.value >= 80) return '#10b981'; // Excellent
      if (props.value >= 60) return '#f59e0b'; // Good
      if (props.value >= 40) return '#ef4444'; // Fair
      return '#7c2d12'; // Poor
    }
    
    // Standard scoring (0-100, higher is better)
    if (props.value >= 70) return '#10b981'; // Green
    if (props.value >= 50) return '#f59e0b'; // Yellow
    if (props.value >= 30) return '#ef4444'; // Red
    return '#7c2d12'; // Dark red
  }};
  background: ${props => props.isTriSightRating ? '#f0f9ff' : 'transparent'};
`;

const PatternCell = styled(TableCell)`
  font-size: 10px;
  color: #6b7280;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const PriceCell = styled(TableCell)`
  font-family: 'Monaco', 'Courier New', monospace;
  text-align: right;
  font-weight: 500;
`;

const RiskCell = styled(TableCell)<{ level: 'LOW' | 'MEDIUM' | 'HIGH' }>`
  font-weight: 500;
  text-align: center;
  color: ${props => {
    switch (props.level) {
      case 'LOW': return '#10b981';
      case 'MEDIUM': return '#f59e0b';
      case 'HIGH': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const PlaceholderMessage = styled.div`
  padding: 48px;
  text-align: center;
  color: #64748b;
  font-size: 16px;
`;

// Report Criteria UI Components
const ReportCriteriaContainer = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FilterLabel = styled.label`
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const FilterSelect = styled.select`
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  color: #1f2937;
  background: white;
  min-width: 120px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

// Symbol Management UI Components
const SymbolManagementContainer = styled.div`
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 16px;
`;

const SymbolInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const SymbolInput = styled.input`
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  color: #1f2937;
  background: white;
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ActionButton = styled.button`
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: #2563eb;
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const RemoveButton = styled.button`
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 3px;
  width: 18px;
  height: 18px;
  font-size: 12px;
  cursor: pointer;
  margin-left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: #dc2626;
  }
`;

const SymbolTagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const SymbolTag = styled.div`
  background: #e0f2fe;
  border: 1px solid #0ea5e9;
  color: #0369a1;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
`;

const LoadingIndicator = styled.span`
  color: #6b7280;
  font-size: 11px;
  font-style: italic;
`;

const RefreshButton = styled(ActionButton)`
  background: #10b981;
  
  &:hover {
    background: #059669;
  }
`;

// Toggle Component for Composite vs Raw Signal View
const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
`;

const ToggleLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  user-select: none;
`;

const ToggleInput = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #0ea5e9;
`;

// Symbol Import/Export UI Components
const ImportExportContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  justify-content: space-between;
`;

const ImportExportGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FileInput = styled.input`
  font-size: 11px;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  padding: 4px 6px;
  cursor: pointer;
  
  &:hover {
    border-color: #9ca3af;
  }
`;

const ExportButton = styled(ActionButton)`
  background: #0ea5e9;
  font-size: 11px;
  padding: 6px 12px;
  
  &:hover {
    background: #0284c7;
  }
`;

const SymbolCount = styled.div`
  font-size: 11px;
  color: #475569;
  font-weight: 500;
`;

type SortField = keyof TargetReportRow;
type SortDirection = 'asc' | 'desc';

// Compute percentile rankings for all core metrics
const computeRankings = (rows: TargetReportRow[]): TargetReportRow[] => {
  const metrics: (keyof TargetReportRow)[] = [
    'triSightRating', 'successProfile', 'acceleration', 'momentum', 'intrinsicStrength', 'relativeStrength'
  ];

  return rows.map(row => {
    const ranked = { ...row };
    
    metrics.forEach(metric => {
      const scores = rows.map(r => {
        const value = r[metric];
        return typeof value === 'number' ? value : 0;
      });
      const sorted = [...scores].sort((a, b) => (b as number) - (a as number)); // Descending order (higher is better)
      const currentValue = typeof row[metric] === 'number' ? row[metric] : 0;
      const rank = sorted.findIndex(val => val === currentValue) + 1;
      const percentile = Math.round((1 - (rank - 1) / scores.length) * 100);
      
      // Add percentile and rank fields
      (ranked as any)[`${metric}Rank`] = rank;
      (ranked as any)[`${metric}Percentile`] = percentile;
    });
    
    return ranked;
  });
};

/**
 * Dick's TriSight Target Report Table Component
 * Implements actual formulas with real calculated data
 */
export const TargetReportTable: React.FC<TargetReportTableProps> = ({
  // signals removed (now dynamic)
  patterns,
  escalatorSteps,
  selectedSymbol,
  onSymbolSelect,
  loading = false,
  customSymbols,
  scanning,
  onScanComplete
}) => {
  const { setSymbol } = useChartContext();
  
  const [sortField, setSortField] = useState<SortField>('triSightRating');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Report Criteria UI filters
  const [selectedPattern, setSelectedPattern] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('Daily');
  
  // Composite vs Raw Signal View Toggle
  const [compositeView, setCompositeView] = useState(true);
  
  // Fullscreen Toggle
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Handle body overflow when fullscreen is toggled
  useEffect(() => {
    const body = document.body;
    if (isFullscreen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = 'auto';
    }
    
    // Cleanup function to restore original state
    return () => {
      body.style.overflow = 'auto';
    };
  }, [isFullscreen]);
  
  // Price gain data state for momentum calculation
  const [priceGains5Day, setPriceGains5Day] = useState<Record<string, number>>({});
  const [priceGains10Day, setPriceGains10Day] = useState<Record<string, number>>({});
  const [priceDataLoading, setPriceDataLoading] = useState<boolean>(false);
  
  // Custom symbol management state (now handled in TargetsPage)
  const [newSymbol, setNewSymbol] = useState('');
  
  // Dynamic signal scanning based on custom symbols - only when scanning is explicitly triggered
  const { signals: scannedSignals, isScanning: scannerIsScanning } = useSignalScanner(customSymbols, selectedTimeframe, scanning);

  // Use scanned signals when available, regardless of scanning state
  // This ensures table populates after scan completes
  const signals = scannedSignals.length > 0 ? scannedSignals : [];
  
  // Monitor scanning completion and call onScanComplete when done
  useEffect(() => {
    if (scanning && !scannerIsScanning && scannedSignals.length > 0 && onScanComplete) {
      console.log('[TargetReportTable] Scan completed, calling onScanComplete callback');
      onScanComplete();
    }
  }, [scanning, scannerIsScanning, scannedSignals.length, onScanComplete]);

  // Log signal state for debugging
  console.log('[TargetReportTable] Signal state:', {
    customSymbols: customSymbols.length,
    customSymbolsList: customSymbols,
    scanning,
    scannerIsScanning,
    scannedSignals: scannedSignals.length,
    finalSignals: signals.length,
    signalTickers: signals.map(s => s.ticker),
    uniqueSignalTickers: Array.from(new Set(signals.map(s => s.ticker)))
  });
  
  // Symbol management handlers (now handled in TargetsPage)
  const handleAddSymbol = () => {
    // Symbol management moved to TargetsPage component
    console.log('Symbol management now handled in TargetsPage');
    setNewSymbol('');
  };
  
  const handleRemoveSymbol = (symbol: string) => {
    // Symbol management moved to TargetsPage component
    console.log('Symbol management now handled in TargetsPage');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSymbol();
    }
  };
  
  // Refresh price data manually
  const handleRefreshData = () => {
    // Clear existing price data to force refetch
    setPriceGains5Day({});
    setPriceGains10Day({});
    // The useEffect will automatically trigger a refetch due to dependency change
  };
  
  // Symbol Universe Import/Export Handlers
  const handleSymbolImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const parsed = XLSX.utils.sheet_to_json<{ Symbol: string }>(worksheet);
      const symbols = parsed.map(row => row.Symbol?.trim().toUpperCase()).filter(Boolean);
      // Symbol management now handled in TargetsPage component
      console.log(`[TargetReportTable] Imported ${symbols.length} symbols from ${file.name} (symbol management moved to TargetsPage)`);
    } catch (error) {
      console.error('[TargetReportTable] Error importing symbols:', error);
      alert('Error importing symbols. Please check the file format.');
    }
    
    // Reset file input
    e.target.value = '';
  };
  
  const handleSymbolExport = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(customSymbols.map(symbol => ({ Symbol: symbol })));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Symbols');
      const xlsxBlob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      saveAs(new Blob([xlsxBlob]), 'TriSight_SymbolUniverse.xlsx');
      console.log(`[TargetReportTable] Exported ${customSymbols.length} symbols to TriSight_SymbolUniverse.xlsx`);
    } catch (error) {
      console.error('[TargetReportTable] Error exporting symbols:', error);
      alert('Error exporting symbols. Please try again.');
    }
  };
  
  // Combine all available symbols (from signals + custom symbols)
  const allAvailableSymbols = useMemo(() => {
    const symbolsFromSignals = Array.from(new Set(signals.map(s => s.ticker).filter((ticker): ticker is string => Boolean(ticker))));
    console.log('[TargetReportTable] Building allAvailableSymbols:', {
      symbolsFromSignals,
      customSymbols,
      combined: Array.from(new Set([...symbolsFromSignals, ...customSymbols]))
    });
    return Array.from(new Set([...symbolsFromSignals, ...customSymbols]));
  }, [signals, customSymbols]);
  
  // Group signals by ticker for composite view or use raw signals
  const groupedSignals = useMemo(() => {
    if (!compositeView) {
      // Raw view: return all signals as-is
      return signals;
    }

    // Composite view: group by ticker and return most recent signal per ticker
    const grouped: Record<string, TradeActionSignal[]> = {};
    signals.forEach(signal => {
      const ticker = signal.ticker || 'UNKNOWN';
      if (!grouped[ticker]) grouped[ticker] = [];
      grouped[ticker].push(signal);
    });
    
    console.log('[TargetReportTable] Signal grouping debug:', {
      totalSignals: signals.length,
      groupedKeys: Object.keys(grouped),
      groupSizes: Object.values(grouped).map(g => g.length)
    });
    
    // Return the most recent signal from each ticker group
    return Object.values(grouped).map(group =>
      group.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]
    );
  }, [signals, compositeView]);

  // Create set of all tickers for filtering (includes custom symbols)
  const allTickers = useMemo(() => {
    const tickers = new Set<string>();
    allAvailableSymbols.filter((symbol): symbol is string => Boolean(symbol)).forEach(symbol => tickers.add(symbol));
    return tickers;
  }, [allAvailableSymbols]);

  // Filter signals based on pattern and prioritize custom symbol list
  const filteredSignals = useMemo(() => {
    console.log('[TargetReportTable] Filtering signals:', {
      totalGroupedSignals: groupedSignals.length,
      selectedPattern,
      customSymbols,
      customSymbolsLength: customSymbols.length,
      allSignalTickers: groupedSignals.map(s => s.ticker).filter(Boolean)
    });
    
    const filtered = groupedSignals.filter(sig => {
      const patternSymbol = sig.ticker?.toUpperCase() || 'UNKNOWN';
      const patternMatch = selectedPattern === 'ALL' || sig.pattern === selectedPattern;
      const symbolMatch = customSymbols.length === 0 || customSymbols.includes(patternSymbol);
      
      console.log(`[TargetReportTable] Signal filter check - ${sig.ticker}:`, {
        signalTicker: sig.ticker,
        patternSymbol,
        pattern: sig.pattern,
        patternMatch,
        symbolMatch,
        customSymbolsIncludes: customSymbols.includes(patternSymbol),
        passed: patternMatch && symbolMatch
      });
      
      return patternMatch && symbolMatch;
    });
    
    console.log('[TargetReportTable] Filter results:', {
      originalSignals: groupedSignals.length,
      filteredSignals: filtered.length,
      filteredTickers: filtered.map(s => s.ticker)
    });
    
    return filtered;
  }, [groupedSignals, selectedPattern, customSymbols]);
  
  // Generate pattern options from available signals
  const patternOptions = useMemo(() => {
    const uniquePatterns = Array.from(new Set(signals.map(s => s.pattern))).filter(Boolean);
    return ['ALL', ...uniquePatterns];
  }, [signals]);
  
  const timeframeOptions = ['Hourly', 'Daily', 'Weekly', 'Monthly'];
  
  // Fetch real price gain data for momentum calculation after successful scan completion
  useEffect(() => {
    // Only fetch price data if:
    // 1. Scanner has completed (not scanning)
    // 2. We have signals from the scanner
    // 3. We have symbols to fetch price data for
    if (scannerIsScanning || scannedSignals.length === 0 || allAvailableSymbols.length === 0) {
      console.log('[TargetReportTable] Skipping price data fetch:', {
        scannerIsScanning,
        scannedSignalsCount: scannedSignals.length,
        allAvailableSymbolsCount: allAvailableSymbols.length
      });
      return;
    }
    
    const fetchPriceGainData = async () => {
      setPriceDataLoading(true);
      
      try {
        console.log('[TargetReportTable] Fetching price data after scan completion for symbols:', allAvailableSymbols);
        
        // Fetch 5-day and 10-day price changes concurrently
        const validSymbols = allAvailableSymbols.filter((symbol): symbol is string => Boolean(symbol));
        const [gains5Day, gains10Day] = await Promise.all([
          fetchMultipleSymbolChanges(validSymbols, 5),
          fetchMultipleSymbolChanges(validSymbols, 10)
        ]);
        
        setPriceGains5Day(gains5Day);
        setPriceGains10Day(gains10Day);
        
        console.log('[TargetReportTable] Price data fetched successfully after scan:', {
          symbols: allAvailableSymbols.length,
          gains5Day: Object.keys(gains5Day).length,
          gains10Day: Object.keys(gains10Day).length
        });
      } catch (error) {
        console.error('[TargetReportTable] Error fetching price data:', error);
        // Keep existing proxy data on error
      } finally {
        setPriceDataLoading(false);
      }
    };
    
    fetchPriceGainData();
  }, [scannerIsScanning, scannedSignals.length, allAvailableSymbols]); // Only fetch after scan completion
  
  // PATCH L-4: Row Emission Delay Until Price Gains Ready
  const targetReportRows: TargetReportRow[] = useMemo(() => {
    // Block row build if price gains incomplete for any symbol
    const allGainsAvailable = customSymbols.every(symbol =>
      priceGains5Day.hasOwnProperty(symbol) &&
      priceGains10Day.hasOwnProperty(symbol)
    );

    if (!allGainsAvailable) {
      console.log('[TargetReportTable] Price gains incomplete, blocking row emission:', {
        totalSymbols: customSymbols.length,
        symbols5DayStatus: customSymbols.map(s => ({ symbol: s, has5Day: priceGains5Day.hasOwnProperty(s) })),
        symbols10DayStatus: customSymbols.map(s => ({ symbol: s, has10Day: priceGains10Day.hasOwnProperty(s) }))
      });
      return [];  // Block row build if incomplete gains
    }
    
    console.log('[TargetReportTable] All price gains available, proceeding with row emission');

    // Filter symbols to only those with complete data sets
    const fullyQualifiedSymbols = customSymbols.filter(symbol => {
      const signalCount = signals.filter(sig => sig.ticker?.toUpperCase() === symbol.toUpperCase()).length;
      const patternCount = patterns.filter(p => 
        ((p as any).symbol === symbol || (p as any).ticker === symbol)
      ).length;
      const stepCount = escalatorSteps.filter(s => 
        ((s as any).symbol === symbol || (s as any).ticker === symbol)
      ).length;
      const gain5 = priceGains5Day[symbol] ?? null;
      const gain10 = priceGains10Day[symbol] ?? null;
      
      const isFullyQualified = signalCount > 0 && patternCount > 0 && stepCount > 0 && gain5 !== null && gain10 !== null;
      
      if (!isFullyQualified) {
        console.log(`[TargetReportTable] Symbol ${symbol} not fully qualified:`, {
          signalCount, patternCount, stepCount, hasGain5: gain5 !== null, hasGain10: gain10 !== null
        });
      }
      
      return isFullyQualified;
    });
    
    console.log('[TargetReportTable] Strict gating results:', {
      totalCustomSymbols: customSymbols.length,
      fullyQualifiedCount: fullyQualifiedSymbols.length,
      fullyQualifiedSymbols
    });

    return fullyQualifiedSymbols.map(ticker => {
      // Get signals for this ticker
      const tickerSignals = signals.filter(sig => sig.ticker?.toUpperCase() === ticker.toUpperCase());
      const latestSignal = tickerSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

      // Get associated patterns and steps with debug tracing
      const associatedPatterns = patterns.filter(p => {
        const symbolMatch = (p as any).symbol === ticker || (p as any).ticker === ticker;
        const typeMatch = p.type === latestSignal.pattern;
        const timeMatch = tickerSignals.some(sig => Math.abs(sig.timestamp.getTime() - p.startTime.getTime()) < 60000);
        const match = symbolMatch && typeMatch && timeMatch;
        if (match) {
          console.log(`[DEBUG] Matched pattern for ${ticker}:`, {
            patternType: p.type,
            patternSymbol: (p as any).symbol,
            patternTicker: (p as any).ticker,
            symbolMatch,
            typeMatch,
            timeMatch
          });
        }
        return match;
      });

      const associatedSteps = escalatorSteps.filter(s => {
        const symbolMatch = (s as any).symbol === ticker || (s as any).ticker === ticker;
        const timeMatch = tickerSignals.some(sig => Math.abs(sig.timestamp.getTime() - (s as any).startTime?.getTime()) < 300000);
        const match = symbolMatch && timeMatch;
        if (match) {
          console.log(`[DEBUG] Matched step for ${ticker}:`, {
            stepSymbol: (s as any).symbol,
            stepTicker: (s as any).ticker,
            symbolMatch,
            timeMatch
          });
        }
        return match;
      });

      // Use extracted TriSight scoring engine
      const {
        successProfile,
        acceleration,
        intrinsicStrength,
        relativeStrength,
        momentum,
        goldenCandle,
        triSightRating,
        riskLevel
      } = computeTriSightMetrics(
        ticker,
        latestSignal,
        associatedPatterns,
        associatedSteps,
        { gains5Day: priceGains5Day, gains10Day: priceGains10Day }
      );

      console.log(`[TargetReportTable] TriSight calculation for ${ticker}:`, {
        ticker,
        confidence: latestSignal.confidence,
        successProfile,
        acceleration,
        intrinsicStrength,
        momentum,
        priceGain5Day: priceGains5Day[ticker] || 0,
        priceGain10Day: priceGains10Day[ticker] || 0,
        triSightRating,
        associatedPatternsCount: associatedPatterns.length,
        associatedStepsCount: associatedSteps.length
      });

      return {
        symbol: ticker.toUpperCase(),
        triSightRating,
        successProfile,
        acceleration,
        intrinsicStrength,
        momentum,
        relativeStrength,
        goldenCandle,
        patternType: latestSignal.pattern,
        triggerPrice: latestSignal.price,
        triggerDate: latestSignal.timestamp,
        riskLevel,
        rawData: {
          signal: latestSignal,
          patterns: associatedPatterns,
          escalatorSteps: associatedSteps,
          priceGains: { day5Gain: priceGains5Day[ticker] || 0, day10Gain: priceGains10Day[ticker] || 0 },
          blackjackScores: { trailing5: intrinsicStrength, continuanceScore: relativeStrength }
        }
      };
    });
  }, [customSymbols, signals, patterns, escalatorSteps, priceGains5Day, priceGains10Day]);
  
  // Apply ranking computation to include percentiles
  const rankedRows = useMemo(() => computeRankings(targetReportRows), [targetReportRows]);
  
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  const sortedRows = useMemo(() => {
    return [...rankedRows].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  }, [targetReportRows, sortField, sortDirection]);
  
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatDate = (date: Date) => date.toLocaleDateString();
  
  // Determine content to display
  const hasResults = targetReportRows.length > 0;
  const hasSymbols = customSymbols.length > 0;
  const scanningStatus = scanning ? ' (scanning in progress...)' : '';
  
  const emptyStateMessage = loading 
    ? 'Loading TriSight Target Report...'
    : hasSymbols 
      ? `No trade signals found for ${customSymbols.length} symbol(s)${scanningStatus}. Try adjusting pattern filters below or check symbol validity.`
      : 'No symbols loaded. Import Excel file with Symbol column or click "Scan Symbols" to begin analysis.';
  
  // PATCH K-6: Table Ground Truth Audit Mode
  // Generate comprehensive audit trail: symbol → signal → row
  const auditReport = {
    timestamp: new Date().toISOString(),
    symbols: customSymbols,
    signals,
    rows: targetReportRows,
    trace: targetReportRows.map(r => ({
      symbol: r.symbol,
      successProfile: r.successProfile,
      acceleration: r.acceleration,
      momentum: r.momentum,
      intrinsicStrength: r.intrinsicStrength,
      relativeStrength: r.relativeStrength,
      goldenCandle: r.goldenCandle,
      triSightRating: r.triSightRating,
      rawPatterns: r.rawData.patterns, // Use associated patterns from rawData
      rawSteps: r.rawData.escalatorSteps, // Use associated steps from rawData
      rawSignal: r.rawData.signal,
      priceGains: r.rawData.priceGains
    }))
  };
  
  // Auto-download audit report when calculations complete (for debugging)
  React.useEffect(() => {
    if (targetReportRows.length > 0 && !loading && !scanning) {
      console.log('[TargetReportTable] PATCH K-6: Audit report generated', auditReport);
      // Uncomment to auto-download: downloadAuditJSON(auditReport, `trisight_table_audit_${Date.now()}.json`);
    }
  }, [targetReportRows.length, loading, scanning]);
  
  return (
    <TableContainer isFullscreen={isFullscreen}>
      <ReportCriteriaContainer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <FilterGroup>
              <FilterLabel>Target Pattern</FilterLabel>
              <FilterSelect 
                value={selectedPattern} 
                onChange={(e) => setSelectedPattern(e.target.value)}
              >
                {patternOptions.map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
            <FilterGroup>
              <FilterLabel>Timeframe</FilterLabel>
              <FilterSelect 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
              >
                {timeframeOptions.map(timeframe => (
                  <option key={timeframe} value={timeframe}>{timeframe}</option>
                ))}
              </FilterSelect>
            </FilterGroup>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <ToggleContainer>
              <ToggleInput
                type="checkbox"
                id="composite-view-toggle"
                checked={compositeView}
                onChange={(e) => setCompositeView(e.target.checked)}
              />
              <ToggleLabel htmlFor="composite-view-toggle">
                Composite View (One Row per Ticker)
              </ToggleLabel>
            </ToggleContainer>
            <ToggleContainer>
              <ToggleInput
                type="checkbox"
                id="fullscreen-toggle"
                checked={isFullscreen}
                onChange={(e) => setIsFullscreen(e.target.checked)}
              />
              <ToggleLabel htmlFor="fullscreen-toggle">
                Fullscreen Mode
              </ToggleLabel>
            </ToggleContainer>
          </div>
        </div>
      </ReportCriteriaContainer>
      <SymbolManagementContainer>
        <SymbolInputGroup>
          <SymbolInput
            type="text"
            placeholder="Add Symbol (e.g. NVDA, TSLA)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <ActionButton 
            onClick={handleAddSymbol}
            disabled={!newSymbol.trim() || customSymbols.includes(newSymbol.trim().toUpperCase())}
          >
            Add Symbol
          </ActionButton>
          <RefreshButton onClick={handleRefreshData} disabled={priceDataLoading}>
            {priceDataLoading ? 'Loading...' : 'Refresh Data'}
          </RefreshButton>
          {priceDataLoading && <LoadingIndicator>Fetching price data...</LoadingIndicator>}
        </SymbolInputGroup>
        {customSymbols.length > 0 && (
          <SymbolTagsContainer>
            {customSymbols.map(symbol => (
              <SymbolTag key={symbol}>
                {symbol}
                <RemoveButton onClick={() => handleRemoveSymbol(symbol)}>×</RemoveButton>
              </SymbolTag>
            ))}
          </SymbolTagsContainer>
        )}
        <ImportExportContainer>
          <ImportExportGroup>
            <FileInput
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSymbolImport}
              title="Import symbol list from Excel file"
            />
            <ExportButton 
              onClick={handleSymbolExport}
              disabled={customSymbols.length === 0}
              title="Export current symbol list to Excel file"
            >
              Export Symbols
            </ExportButton>
          </ImportExportGroup>
          <SymbolCount>
            Showing {customSymbols.length} of {customSymbols.length} symbols
          </SymbolCount>
        </ImportExportContainer>
      </SymbolManagementContainer>
      <TableWrapper isFullscreen={isFullscreen}>
        <Table>
          <TableHeader>
            <tr>
              <HeaderCell>Symbol</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('triSightRating')}>
                TriSight Rating
                <SortIcon>{getSortIcon('triSightRating')}</SortIcon>
              </HeaderCell>
              <HeaderCell>TriSight %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('successProfile')}>
                Success
                <SortIcon>{getSortIcon('successProfile')}</SortIcon>
              </HeaderCell>
              <HeaderCell>Success %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('acceleration')}>
                Accel
                <SortIcon>{getSortIcon('acceleration')}</SortIcon>
              </HeaderCell>
              <HeaderCell>Accel %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('momentum')}>
                Momentum
                <SortIcon>{getSortIcon('momentum')}</SortIcon>
              </HeaderCell>
              <HeaderCell>Momentum %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('intrinsicStrength')}>
                Intrinsic
                <SortIcon>{getSortIcon('intrinsicStrength')}</SortIcon>
              </HeaderCell>
              <HeaderCell>Intrinsic %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('relativeStrength')}>
                Rel Strength
                <SortIcon>{getSortIcon('relativeStrength')}</SortIcon>
              </HeaderCell>
              <HeaderCell>Rel %</HeaderCell>
              <HeaderCell sortable onClick={() => handleSort('goldenCandle')}>
                Golden Candle
                <SortIcon>{getSortIcon('goldenCandle')}</SortIcon>
              </HeaderCell>
              {selectedPattern === 'GOLDEN' || selectedPattern === 'BREAKOUT' ? (
                <>
                  <HeaderCell>Trigger Type</HeaderCell>
                  <HeaderCell>Trigger Price</HeaderCell>
                  <HeaderCell>Trigger Date</HeaderCell>
                  <HeaderCell>Trigger Time</HeaderCell>
                </>
              ) : (
                <>
                  <HeaderCell>Pattern Type</HeaderCell>
                  <HeaderCell sortable onClick={() => handleSort('triggerPrice')}>
                    Price
                    <SortIcon>{getSortIcon('triggerPrice')}</SortIcon>
                  </HeaderCell>
                  <HeaderCell sortable onClick={() => handleSort('triggerDate')}>
                    Date
                    <SortIcon>{getSortIcon('triggerDate')}</SortIcon>
                  </HeaderCell>
                </>
              )}
              <HeaderCell sortable onClick={() => handleSort('riskLevel')}>
                Risk
                <SortIcon>{getSortIcon('riskLevel')}</SortIcon>
              </HeaderCell>
            </tr>
          </TableHeader>
          <TableBody>
            {hasResults ? (
              sortedRows.map((row, index) => (
                <TableRow
                  key={`${row.symbol}-${index}`}
                  selected={row.symbol === selectedSymbol}
                  onClick={() => { setSymbol(row.symbol); onSymbolSelect?.(row.symbol); }}
                >
                <SymbolCell>{row.symbol}</SymbolCell>
                <ScoreCell value={row.triSightRating} isTriSightRating>
                  {row.triSightRating}
                </ScoreCell>
                <ScoreCell value={row.triSightRatingPercentile ?? 0}>
                  {row.triSightRatingPercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.successProfile}>
                  {row.successProfile}
                </ScoreCell>
                <ScoreCell value={row.successProfilePercentile ?? 0}>
                  {row.successProfilePercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.acceleration}>
                  {row.acceleration}
                </ScoreCell>
                <ScoreCell value={row.accelerationPercentile ?? 0}>
                  {row.accelerationPercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.momentum}>
                  {Math.round(row.momentum)}
                </ScoreCell>
                <ScoreCell value={row.momentumPercentile ?? 0}>
                  {row.momentumPercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.intrinsicStrength}>
                  {Math.round(row.intrinsicStrength)}
                </ScoreCell>
                <ScoreCell value={row.intrinsicStrengthPercentile ?? 0}>
                  {row.intrinsicStrengthPercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.relativeStrength}>
                  {Math.round(row.relativeStrength)}
                </ScoreCell>
                <ScoreCell value={row.relativeStrengthPercentile ?? 0}>
                  {row.relativeStrengthPercentile ?? 0}%
                </ScoreCell>
                <ScoreCell value={row.goldenCandle}>
                  {row.goldenCandle}
                </ScoreCell>
                {selectedPattern === 'GOLDEN' || selectedPattern === 'BREAKOUT' ? (
                  <>
                    <PatternCell>{row.patternType}</PatternCell>
                    <PriceCell>{formatPrice(row.triggerPrice)}</PriceCell>
                    <TableCell>{formatDate(row.triggerDate)}</TableCell>
                    <TableCell>{row.triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</TableCell>
                  </>
                ) : (
                  <>
                    <PatternCell>{row.patternType}</PatternCell>
                    <PriceCell>{formatPrice(row.triggerPrice)}</PriceCell>
                    <TableCell>{formatDate(row.triggerDate)}</TableCell>
                  </>
                )}
                <RiskCell level={row.riskLevel}>{row.riskLevel}</RiskCell>
              </TableRow>
            ))
            ) : (
              <tr>
                <td colSpan={14} style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '16px' }}>
                  {emptyStateMessage}
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </TableWrapper>
    </TableContainer>
  );
};

export default TargetReportTable;
