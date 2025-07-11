// src/pages/TargetsPage.tsx
// Dedicated Targets Tab with Independent TargetReportTable Mounting
// Provides async isolation for symbol scanning and analysis

import React, { useState, useRef, useEffect } from 'react';
import { TargetReportTable } from '../components/TargetReportTable/TargetReportTable';
import { PatternBase } from '../models/PatternTypes';
import { StepBox } from '../types/pattern';
import * as XLSX from 'xlsx';
import { useMarketDataContext } from '../contexts/MarketDataContext';
import { TradeActionBus } from '../utils/trading/TradeActionSignal';
import { useSymbolSet } from '../contexts/SymbolSetContext';
import SymbolTabs from '../components/SymbolTabs';
import './TargetsPage.css';

const dummyPatterns: PatternBase[] = [];
const dummySteps: StepBox[] = [];

const TargetsPage: React.FC = () => {
  const { symbol } = useMarketDataContext();
  const { currentSet, symbols: symbolSetSymbols, loading: symbolSetLoading } = useSymbolSet();

  const [customSymbols, setCustomSymbols] = useState<string[]>(() => {
    return symbol ? [symbol.toUpperCase()] : [];
  });

  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    TradeActionBus.clear();
    console.log('[L-17] TradeActionBus flushed on Targets tab mount');

    return () => {
      TradeActionBus.clear();
      console.log('[L-17] TradeActionBus flushed on Targets tab unmount');
    };
  }, []);

  useEffect(() => {
    return () => {
      setCustomSymbols([]);
    };
  }, []);

  useEffect(() => {
    if (currentSet && symbolSetSymbols.length > 0 && !symbolSetLoading) {
      console.log(`[TargetsPage] Loading ${symbolSetSymbols.length} symbols from ${currentSet}`);
      setCustomSymbols(symbolSetSymbols);
    }
  }, [currentSet, symbolSetSymbols, symbolSetLoading]);

  function handleImportExcel(rows: any[]) {
    TradeActionBus.clear();
    console.log('[L-17] TradeActionBus flushed on Excel import');
    
    // Clean and validate symbols
    const cleanedSymbols = rows
      .map(r => {
        let symbol = r.Symbol || '';
        
        // Extract ticker from "Company Name (TICKER)" format
        const tickerMatch = symbol.match(/\(([A-Z]{1,5})\)/);
        if (tickerMatch) {
          symbol = tickerMatch[1];
        }
        
        // Clean whitespace, quotes, and convert to uppercase
        symbol = symbol.trim().replace(/['"]/g, '').toUpperCase();
        
        return symbol;
      })
      .filter(symbol => /^[A-Z]{1,5}$/.test(symbol)) // Only valid ticker formats
      .filter((symbol, index, arr) => arr.indexOf(symbol) === index); // Remove duplicates
    
    console.log(`[TargetsPage] Imported ${rows.length} rows, cleaned to ${cleanedSymbols.length} valid symbols`);
    setCustomSymbols(cleanedSymbols);
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label 
            htmlFor="symbol-import" 
            style={{ 
              background: '#f8fafc', 
              border: '1px solid #e2e8f0', 
              padding: '6px 12px', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontSize: '12px',
              color: '#475569'
            }}
          >
            📂 Import Symbols (.xlsx)
          </label>
          <input
            id="symbol-import"
            type="file"
            accept=".xlsx"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const wb = XLSX.read(data, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json<{ Symbol: string }>(ws);
                
                handleImportExcel(rows);
              };
              reader.readAsArrayBuffer(file);
            }}
          />
          <span 
            style={{ 
              fontSize: '11px', 
              color: '#64748b', 
              fontStyle: 'italic' 
            }}
            title="Expected format: Excel file (.xlsx) with 'Symbol' column containing ticker symbols (e.g., AAPL, TSLA, MSFT)"
          >
            💡 Format: Excel with 'Symbol' column
          </span>
        </div>
        <button
          onClick={() => {
            const ws = XLSX.utils.json_to_sheet(customSymbols.map(s => ({ Symbol: s })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Symbols');
            XLSX.writeFile(wb, 'TriSight_SymbolUniverse.xlsx');
          }}
        >Export</button>
        <button
          style={{ background: '#0ea5e9', color: 'white', padding: '6px 12px' }}
          onClick={() => setShowScanner(true)}
        >Scan Symbols</button>
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#475569' }}>
          Showing {customSymbols.length} symbol{customSymbols.length === 1 ? '' : 's'}
        </span>
      </div>
      <div style={{ height: '100vh', overflow: 'auto' }}>
      <h2 style={{ 
        fontSize: '20px', 
        marginBottom: '16px',
        fontWeight: '600',
        color: '#1e293b'
      }}>
        TriSight Targets Analysis
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '24px'
      }}>
        Dynamic symbol scanning and pattern analysis for imported ticker universe
      </p>
        <TargetReportTable
          patterns={dummyPatterns}
          escalatorSteps={dummySteps}
          selectedSymbol={''}
          onSymbolSelect={() => {}}
          loading={false}
          customSymbols={customSymbols}
          scanning={showScanner}
          onScanComplete={() => {
            console.log('[TargetsPage] Scan completed, resetting scanner state');
            setShowScanner(false);
          }}
        />
      </div>
      <SymbolTabs />
    </div>
  );
};

export default TargetsPage;
