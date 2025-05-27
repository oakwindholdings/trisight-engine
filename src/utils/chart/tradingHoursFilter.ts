// src/utils/chart/tradingHoursFilter.ts
// Utilities for trading hours data filtering
// Keeps business rules separate from chart rendering
import { CandlestickData } from '../../models/ChartTypes';
import { filterTradingHoursData } from '../marketHours';

export function applyTradingHoursFilter(data: CandlestickData[], showOnly: boolean) {
  if (!data || data.length === 0) return [] as CandlestickData[];
  return showOnly ? filterTradingHoursData(data) : data;
}
