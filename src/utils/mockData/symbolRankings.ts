// src/utils/mockData/symbolRankings.ts
// Mock data for symbol ranking table
// Simulates top-ranked symbols from TriSight scoring engine

import { SymbolRanking } from '../../types/SymbolRanking';

export const mockSymbolRankings: SymbolRanking[] = [
  {
    symbol: 'NVDA',
    riskRating: 42,
    tractionRating: 63,
    strengthRating: 24,
    timingRating: 30,
    businessModelRatio: 1.7,
    acceleration: 5.1,
    sectorRating: 88,
    currentPrice: 894.31
  },
  {
    symbol: 'AAPL',
    riskRating: 35,
    tractionRating: 71,
    strengthRating: 82,
    timingRating: 45,
    businessModelRatio: 2.1,
    acceleration: 3.2,
    sectorRating: 75,
    currentPrice: 189.23
  },
  {
    symbol: 'MSFT',
    riskRating: 28,
    tractionRating: 68,
    strengthRating: 76,
    timingRating: 52,
    businessModelRatio: 1.9,
    acceleration: 2.8,
    sectorRating: 80,
    currentPrice: 426.78
  },
  {
    symbol: 'GOOGL',
    riskRating: 38,
    tractionRating: 59,
    strengthRating: 68,
    timingRating: 41,
    businessModelRatio: 1.6,
    acceleration: 4.1,
    sectorRating: 72,
    currentPrice: 142.56
  },
  {
    symbol: 'META',
    riskRating: 45,
    tractionRating: 56,
    strengthRating: 61,
    timingRating: 38,
    businessModelRatio: 1.8,
    acceleration: 4.7,
    sectorRating: 69,
    currentPrice: 498.23
  },
  {
    symbol: 'TSLA',
    riskRating: 58,
    tractionRating: 52,
    strengthRating: 45,
    timingRating: 62,
    businessModelRatio: 1.3,
    acceleration: 6.2,
    sectorRating: 65,
    currentPrice: 176.54
  },
  {
    symbol: 'AMZN',
    riskRating: 32,
    tractionRating: 64,
    strengthRating: 71,
    timingRating: 48,
    businessModelRatio: 1.7,
    acceleration: 3.5,
    sectorRating: 78,
    currentPrice: 178.32
  },
  {
    symbol: 'JPM',
    riskRating: 25,
    tractionRating: 61,
    strengthRating: 73,
    timingRating: 55,
    businessModelRatio: 2.3,
    acceleration: 2.1,
    sectorRating: 82,
    currentPrice: 187.45
  },
  {
    symbol: 'BRK.B',
    riskRating: 22,
    tractionRating: 58,
    strengthRating: 79,
    timingRating: 43,
    businessModelRatio: 2.5,
    acceleration: 1.8,
    sectorRating: 85,
    currentPrice: 432.12
  },
  {
    symbol: 'V',
    riskRating: 27,
    tractionRating: 66,
    strengthRating: 74,
    timingRating: 51,
    businessModelRatio: 2.2,
    acceleration: 2.6,
    sectorRating: 79,
    currentPrice: 276.89
  },
  {
    symbol: 'MA',
    riskRating: 29,
    tractionRating: 65,
    strengthRating: 72,
    timingRating: 49,
    businessModelRatio: 2.1,
    acceleration: 2.7,
    sectorRating: 77,
    currentPrice: 468.34
  },
  {
    symbol: 'UNH',
    riskRating: 31,
    tractionRating: 60,
    strengthRating: 77,
    timingRating: 46,
    businessModelRatio: 1.8,
    acceleration: 2.3,
    sectorRating: 81,
    currentPrice: 524.67
  }
];
