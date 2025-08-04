"use strict";
exports.__esModule = true;
exports.zoomLevels = void 0;
exports.zoomLevels = [
    // Detailed timeframes with 1-minute candles
    { name: '5m_detail', timeframe: '1min', candleCount: 5, label: '5m (1min)' },
    { name: '15m_detail', timeframe: '1min', candleCount: 15, label: '15m (1min)' },
    { name: '30m_detail', timeframe: '1min', candleCount: 30, label: '30m (1min)' },
    { name: '1h_detail', timeframe: '1min', candleCount: 60, label: '1h (1min)' },
    { name: '2h_detail', timeframe: '1min', candleCount: 120, label: '2h (1min)' },
    { name: 'trading_day_view', timeframe: '1min', candleCount: 390, label: 'Trading Day (1min)' },
    // Medium timeframes with 5-minute candles
    { name: '1h_medium', timeframe: '5min', candleCount: 12, label: '1h (5min)' },
    { name: '4h_medium', timeframe: '5min', candleCount: 48, label: '4h (5min)' },
    { name: '1d_medium', timeframe: '5min', candleCount: 78, label: '1d (5min)' },
    // Broader timeframes with 15-minute candles
    { name: '4h_broad', timeframe: '15min', candleCount: 16, label: '4h (15min)' },
    { name: '1d_broad', timeframe: '15min', candleCount: 26, label: '1d (15min)' },
    { name: '1w_broad', timeframe: '15min', candleCount: 130, label: '1w (15min)' },
    // Extended view
    { name: '1month', timeframe: '1hour', candleCount: 160, label: '1M' }
];
