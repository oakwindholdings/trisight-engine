// src/utils/symbolPresets.ts
// Hardcoded symbol presets for tab selection
// Contains Top-40, Core-40, Index-40, and TriSight-500 symbol lists

export interface SymbolPreset {
  id: string;
  name: string;
  description: string;
  symbols: string[];
}

// Top 40 Tech/Growth stocks
const TOP_40_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JNJ',
  'WMT', 'JPM', 'MA', 'PG', 'UNH', 'DIS', 'HD', 'PYPL', 'BAC', 'ADBE',
  'NFLX', 'CRM', 'PFE', 'TMO', 'CSCO', 'PEP', 'ABT', 'CVX', 'ABBV', 'NKE',
  'ACN', 'COST', 'AVGO', 'TXN', 'MCD', 'NEE', 'UPS', 'QCOM', 'HON', 'UNP'
];

// Core 40 Blue-chip dividend stocks
const CORE_40_SYMBOLS = [
  'JNJ', 'PG', 'KO', 'PEP', 'WMT', 'MCD', 'MMM', 'CAT', 'GE', 'BA',
  'HD', 'DIS', 'IBM', 'INTC', 'MRK', 'PFE', 'VZ', 'T', 'CVX', 'XOM',
  'C', 'WFC', 'GS', 'MS', 'AXP', 'BLK', 'SCHW', 'COF', 'USB', 'PNC',
  'TGT', 'LOW', 'CVS', 'WBA', 'CL', 'GIS', 'K', 'CPB', 'HSY', 'MDLZ'
];

// Index ETFs and major indices
const INDEX_40_SYMBOLS = [
  'SPY', 'QQQ', 'DIA', 'IWM', 'VOO', 'VTI', 'EEM', 'GLD', 'TLT', 'HYG',
  'XLF', 'XLK', 'XLE', 'XLV', 'XLI', 'XLB', 'XLY', 'XLP', 'XLU', 'XLRE',
  'VNQ', 'AGG', 'BND', 'LQD', 'EMB', 'SHY', 'IEF', 'TIP', 'VCIT', 'VCSH',
  'ARKK', 'ARKG', 'ARKQ', 'ARKW', 'ARKF', 'ICLN', 'SOXX', 'SMH', 'XBI', 'IBB'
];

// TriSight 500 - Extended universe (showing first 40 for demo, would be 500 in production)
const TRISIGHT_500_SYMBOLS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'BRK.B', 'V', 'JNJ',
  'WMT', 'JPM', 'MA', 'PG', 'UNH', 'DIS', 'HD', 'PYPL', 'BAC', 'ADBE',
  'NFLX', 'CRM', 'PFE', 'TMO', 'CSCO', 'PEP', 'ABT', 'CVX', 'ABBV', 'NKE',
  'ACN', 'COST', 'AVGO', 'TXN', 'MCD', 'NEE', 'UPS', 'QCOM', 'HON', 'UNP',
  'ORCL', 'AMD', 'LIN', 'DHR', 'BMY', 'RTX', 'SPGI', 'NOW', 'AMT', 'LOW',
  'INTU', 'ISRG', 'SYK', 'BKNG', 'GILD', 'MDLZ', 'ADP', 'SBUX', 'BDX', 'TJX',
  'LMT', 'MMC', 'LRCX', 'ZTS', 'TMUS', 'REGN', 'PLD', 'CI', 'CB', 'ETN'
  // In production, this would contain 500 symbols
];

export const SYMBOL_PRESETS: SymbolPreset[] = [
  {
    id: 'top-40',
    name: 'Top-40',
    description: 'Top 40 technology and growth stocks',
    symbols: TOP_40_SYMBOLS
  },
  {
    id: 'core-40',
    name: 'Core-40',
    description: 'Core 40 blue-chip dividend stocks',
    symbols: CORE_40_SYMBOLS
  },
  {
    id: 'index-40',
    name: 'Index-40',
    description: '40 major index ETFs and sector funds',
    symbols: INDEX_40_SYMBOLS
  },
  {
    id: 'trisight-500',
    name: 'TriSight-500',
    description: 'Extended TriSight universe of 500 stocks',
    symbols: TRISIGHT_500_SYMBOLS
  }
];

/**
 * Get a symbol preset by ID
 */
export function getSymbolSet(id: string): SymbolPreset | undefined {
  return SYMBOL_PRESETS.find(preset => preset.id === id);
}

/**
 * Get all available symbol sets
 */
export function getAllSymbolSets(): SymbolPreset[] {
  return SYMBOL_PRESETS;
}

/**
 * Validate if a symbol exists in any preset
 */
export function isSymbolInPresets(symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_PRESETS.some(preset => 
    preset.symbols.includes(upperSymbol)
  );
}

/**
 * Get preset IDs that contain a specific symbol
 */
export function getPresetsContainingSymbol(symbol: string): string[] {
  const upperSymbol = symbol.toUpperCase();
  return SYMBOL_PRESETS
    .filter(preset => preset.symbols.includes(upperSymbol))
    .map(preset => preset.id);
}
