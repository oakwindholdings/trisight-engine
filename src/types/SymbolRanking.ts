// src/types/SymbolRanking.ts
// Type definitions for symbol ranking table data
// Defines structure for ranked symbol metrics

export interface SymbolRanking {
  symbol: string;
  riskRating: number; // 0-100, lower is better
  tractionRating: number; // Institutional demand score
  strengthRating: number; // Long-term performance signal
  timingRating: number; // Short-term price action alignment
  businessModelRatio: number; // TOM ratio
  acceleration: number; // Momentum-based directional thrust
  sectorRating: number; // Relative sector strength
  currentPrice: number; // Last traded price
  // Future fields
  detectedPattern?: string; // e.g., "Rocket", "Shaft"
  lastEarnings?: Date;
  surprisePercent?: number;
  profitMargin?: number;
}

export interface SymbolRankingTableProps {
  rankings: SymbolRanking[];
  selectedSymbol?: string;
  onSymbolSelect: (symbol: string) => void;
  loading?: boolean;
}
