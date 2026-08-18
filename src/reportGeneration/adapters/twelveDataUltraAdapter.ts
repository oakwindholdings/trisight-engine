// src/reportGeneration/adapters/twelveDataUltraAdapter.ts
// Enhanced TwelveData adapter leveraging ULTRA-level access
// Features: 30+ years history, all indicators, unlimited calls, WebSocket streaming

import axios from 'axios';
import { TwelveDataAdapter } from './twelveDataAdapter';
import { CandlestickData } from '../../models/ChartTypes';
import { logDebug, logError } from '../../utils/logger';

// ULTRA features available with our access level
export interface UltraFeatures {
  extendedHistory: {
    enabled: boolean;
    yearsBack: number; // Up to 30+ years
  };
  technicalIndicators: {
    all: boolean;
    specific: string[]; // RSI, MACD, BB, SMA, EMA, etc.
  };
  fundamentals: {
    extended: boolean;
    realTime: boolean;
  };
  streaming: {
    websocket: boolean;
    priceAlerts: boolean;
  };
  apiLimits: {
    unlimited: boolean;
    rateLimit: number | null;
  };
}

export class TwelveDataUltraAdapter extends TwelveDataAdapter {
  private ultraFeatures: UltraFeatures = {
    extendedHistory: {
      enabled: true,
      yearsBack: 30
    },
    technicalIndicators: {
      all: true,
      specific: ['RSI', 'MACD', 'BB', 'SMA', 'EMA', 'ATR', 'ADX', 'CCI', 'STOCH']
    },
    fundamentals: {
      extended: true,
      realTime: true
    },
    streaming: {
      websocket: true,
      priceAlerts: true
    },
    apiLimits: {
      unlimited: true,
      rateLimit: null
    }
  };

  constructor(apiKey: string) {
    super({ apiKey, isUltraTier: true });
    logDebug('TwelveDataUltraAdapter', 'Initialized with ULTRA features');
  }

  /**
   * Fetches extended historical data (30+ years)
   */
  async fetchExtendedHistory(
    symbol: string,
    interval: string = '1day',
    yearsBack: number = 30
  ): Promise<CandlestickData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(endDate.getFullYear() - yearsBack);

      logDebug('TwelveDataUltraAdapter', `Fetching ${yearsBack} years of data for ${symbol}`);

      const params = {
        symbol,
        interval,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        outputsize: 10000, // ULTRA allows large output sizes
        format: 'JSON',
        apikey: this.apiKey
      };

      const response = await axios.get(`${this.baseUrl}/time_series`, { params });
      
      if (response.data.status === 'error') {
        throw new Error(response.data.message || 'API error');
      }

      const values = response.data.values || [];
      logDebug('TwelveDataUltraAdapter', `Retrieved ${values.length} candles for ${symbol}`);

      return this.transformToCandles(values);
    } catch (error) {
      logError('TwelveDataUltraAdapter', `Error fetching extended history: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches all technical indicators in one call
   */
  async fetchAllIndicators(
    symbol: string,
    interval: string = '1day',
    outputsize: number = 500
  ): Promise<any> {
    try {
      logDebug('TwelveDataUltraAdapter', `Fetching all indicators for ${symbol}`);

      // ULTRA allows fetching multiple indicators in parallel without rate limits
      const indicatorPromises = this.ultraFeatures.technicalIndicators.specific.map(indicator =>
        this.fetchIndicator(symbol, indicator, interval, outputsize)
      );

      const results = await Promise.all(indicatorPromises);
      
      // Combine all indicator data
      const combinedIndicators: any = {};
      results.forEach((result, index) => {
        const indicatorName = this.ultraFeatures.technicalIndicators.specific[index];
        combinedIndicators[indicatorName] = result;
      });

      return combinedIndicators;
    } catch (error) {
      logError('TwelveDataUltraAdapter', `Error fetching indicators: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches a specific technical indicator
   */
  private async fetchIndicator(
    symbol: string,
    indicator: string,
    interval: string,
    outputsize: number
  ): Promise<any> {
    const params = {
      symbol,
      interval,
      outputsize,
      format: 'JSON',
      apikey: this.apiKey
    };

    // Add indicator-specific parameters
    switch (indicator) {
      case 'RSI':
        Object.assign(params, { time_period: 14 });
        break;
      case 'MACD':
        Object.assign(params, { fast_period: 12, slow_period: 26, signal_period: 9 });
        break;
      case 'BB':
        Object.assign(params, { time_period: 20, std_dev: 2 });
        break;
      case 'SMA':
      case 'EMA':
        Object.assign(params, { time_period: 20 });
        break;
      case 'ATR':
        Object.assign(params, { time_period: 14 });
        break;
    }

    const response = await axios.get(`${this.baseUrl}/${indicator.toLowerCase()}`, { params });
    
    if (response.data.status === 'error') {
      throw new Error(response.data.message || `${indicator} fetch error`);
    }

    return response.data.values || [];
  }

  /**
   * Fetches comprehensive fundamental data with ULTRA access
   */
  async fetchComprehensiveFundamentals(symbol: string): Promise<any> {
    try {
      logDebug('TwelveDataUltraAdapter', `Fetching comprehensive fundamentals for ${symbol}`);

      // With ULTRA, we can fetch all fundamental data types
      const fundamentalTypes = [
        'statistics',
        'income_statement',
        'balance_sheet',
        'cash_flow',
        'earnings',
        'earnings_calendar',
        'dividends',
        'splits',
        'insider_transactions'
      ];

      const promises = fundamentalTypes.map(type =>
        this.fetchFundamentalType(symbol, type)
      );

      const results = await Promise.all(promises);
      
      // Combine all fundamental data
      const comprehensiveFundamentals: any = {};
      results.forEach((result, index) => {
        comprehensiveFundamentals[fundamentalTypes[index]] = result;
      });

      return comprehensiveFundamentals;
    } catch (error) {
      logError('TwelveDataUltraAdapter', `Error fetching fundamentals: ${error}`);
      throw error;
    }
  }

  /**
   * Fetches a specific type of fundamental data
   */
  private async fetchFundamentalType(symbol: string, type: string): Promise<any> {
    const params = {
      symbol,
      apikey: this.apiKey
    };

    try {
      const response = await axios.get(`${this.baseUrl}/${type}`, { params });
      
      if (response.data.status === 'error') {
        logError('TwelveDataUltraAdapter', `Error fetching ${type}: ${response.data.message}`);
        return null;
      }

      return response.data;
    } catch (error) {
      logError('TwelveDataUltraAdapter', `Error fetching ${type}: ${error}`);
      return null;
    }
  }

  /**
   * Real-time streaming is not available: the legacy implementation opened a direct
   * TwelveData websocket, and direct vendor connections are eradicated. All market data
   * flows through the server-side /api/market proxy (poll endpoints instead). No callers
   * existed when this was stubbed out.
   */
  establishWebSocketConnection(_symbols: string[], _onData: (data: any) => void): WebSocket {
    throw new Error('Real-time websocket streaming is not supported; use the /api/market proxy endpoints.');
  }

  /**
   * Transforms raw API candle data to our format
   */
  private transformToCandles(values: any[]): CandlestickData[] {
    return values.map((value, index) => ({
      datetime: value.datetime,
      timestamp: new Date(value.datetime).getTime(),
      open: parseFloat(value.open),
      high: parseFloat(value.high),
      low: parseFloat(value.low),
      close: parseFloat(value.close),
      volume: parseInt(value.volume) || 0,
      sequentialIndex: values.length - 1 - index // Reverse order
    })).reverse(); // API returns newest first, we want oldest first
  }

  /**
   * Gets current ULTRA feature status
   */
  getUltraStatus(): UltraFeatures {
    return { ...this.ultraFeatures };
  }
}

// Factory function
export function createTwelveDataUltraAdapter(apiKey: string): TwelveDataUltraAdapter {
  return new TwelveDataUltraAdapter(apiKey);
}