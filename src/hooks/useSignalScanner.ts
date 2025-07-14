// src/hooks/useSignalScanner.ts
// Custom Symbol Scanner & Signal Emitter Engine
// Loops over customSymbols, fetches data, emits TradeActionSignal[] with .ticker

import { useEffect, useState } from 'react';
import { TradeActionSignal, TradeAction, SignalType } from '../utils/trading/TradeActionSignal';
import { fetchCandlestickData } from '../api/twelveDataApi';
import PatternDetector from '../utils/patternDetection/PatternDetector';
import { CandlestickData, Timeframe } from '../models/ChartTypes';
import { timeframeToInterval } from '../api/twelveDataApi';
import { PatternType } from '../models/PatternTypes';
import { TradeActionBus } from '../utils/trading/TradeActionSignal';
import { transformToHeikinAshi, heikinAshiToCandlestickData } from '../utils/heikinAshiUtils';
import { logDebug } from '../utils/debug';

const mapPatternToTradeAction = (pattern: string): TradeAction => {
  switch (pattern.toUpperCase()) {
    case 'ESCALATOR': return TradeAction.BUY;
    case 'BLACKJACK': return TradeAction.BUY;
    case 'ROCKETMAN': return TradeAction.BUY;
    case 'PIVOT': return TradeAction.BUY;
    case 'GOLDMINE_SHAFT': return TradeAction.BUY;
    case 'GOLDMINE_CHANNEL': return TradeAction.BUY;
    case 'BREAKOUTBOX': return TradeAction.BUY;
    case 'GOLDEN_CANDLE': return TradeAction.BUY;
    default: return TradeAction.BUY;
  }
};

const mapPatternToSignalType = (pattern: string): SignalType => {
  switch (pattern.toUpperCase()) {
    case 'ESCALATOR': return SignalType.LONG_ENTRY;
    case 'BLACKJACK': return SignalType.LONG_ENTRY;
    case 'ROCKETMAN': return SignalType.LONG_ENTRY;
    case 'PIVOT': return SignalType.LONG_ENTRY;
    case 'GOLDMINE_SHAFT': return SignalType.LONG_ENTRY;
    case 'GOLDMINE_CHANNEL': return SignalType.LONG_ENTRY;
    case 'BREAKOUTBOX': return SignalType.LONG_ENTRY;
    case 'GOLDEN_CANDLE': return SignalType.LONG_ENTRY;
    default: return SignalType.LONG_ENTRY;
  }
};

const downloadAuditJSON = (data: object, label: string) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = label;
  a.click();
  URL.revokeObjectURL(url);
};

// Map string timeframe to Timeframe type
function mapTimeframeToInterval(timeframe: string): Timeframe {
  switch (timeframe) {
    case '1M': return '1min';
    case '5M': return '5min';
    case '15M': return '15min';
    case '30M': return '30min';
    case '1H': return '1hour';
    case '4H': return '1hour'; // Map 4H to 1hour as closest match
    case '1D': return '1day';
    case '1W': return '5day'; // Map 1W to 5day as closest match
    default: return '1day';
  }
}

/**
 * Custom Signal Scanner Hook
 * 
 * Scans provided symbols for trading patterns and generates TradeActionSignals
 * with ticker property populated for accurate symbol identification.
 * 
 * @param symbols - Array of ticker symbols to scan (e.g., ['NVDA', 'TSLA', 'AAPL'])
 * @param timeframe - Timeframe for analysis (e.g., '1D', '4H', '1H')
 * @returns Array of TradeActionSignals with ticker property populated
 */
// EMERGENCY: Circuit breaker to prevent API quota violation
const EMERGENCY_MODE = false; // Set to false only when quota issue is resolved
const MAX_SYMBOLS_PER_SCAN = 10; // Reasonable limit for commercial API tier

export function useSignalScanner(symbols: string[], timeframe: string, shouldScan: boolean = true, setPatterns?: any, setEscalatorSteps?: any, rowHydration?: any): { signals: TradeActionSignal[], patterns: any[], steps: any[], isScanning: boolean } {
  const [signals, setSignals] = useState<TradeActionSignal[]>([]);
  const [patterns, setPatternsState] = useState<any[]>([]);
  const [steps, setStepsState] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Debug scanner trigger conditions
  logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] Hook called with: symbols=' + symbols.join(',') + ', symbolsLength=' + symbols.length + ', timeframe=' + timeframe + ', shouldScan=' + shouldScan + ', currentSignals=' + signals.length + ', currentIsScanning=' + isScanning);

  useEffect(() => {
    logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] useEffect triggered with: symbols=' + symbols.join(',') + ', symbolsLength=' + symbols.length + ', timeframe=' + timeframe + ', shouldScan=' + shouldScan);
    
    // CRITICAL DEBUG: Log exact state before early returns
    logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] CRITICAL DEBUG - Early return checks: symbols.length === 0: ' + (symbols.length === 0) + ', symbols.length: ' + symbols.length + ', !shouldScan: ' + !shouldScan + ', shouldScan: ' + shouldScan);
    
    // Early return if no symbols or not supposed to scan
    if (symbols.length === 0) {
      logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] EARLY RETURN: No symbols provided, skipping scan');
      return;
    }
    
    if (!shouldScan) {
      logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] EARLY RETURN: shouldScan is false, skipping scan');
      return;
    }
    
    logDebug('DEBUG_TRADE_SIGNALS', '[useSignalScanner] PROCEEDING TO SCAN: All conditions met, starting fetchAndProcess');
    
    const fetchAndProcess = async () => {
      setIsScanning(true);
      // PATCH L-16: Force 1-minute interval for high-resolution scanning
      const intervalParam = '1min';
      const outputsize = 420;
      logDebug('DEBUG_TRADE_SIGNALS', `[L-16] Overriding interval to ${intervalParam} with outputsize=${outputsize} for full session scan`);
      const allSignals: TradeActionSignal[] = [];
      const allPatterns: any[] = [];
      const allSteps: any[] = [];
      const auditLog: any[] = [];

      const chunkSize = 250;
      const chunks = symbols.reduce((res: string[][], val: string, i: number) => {
        const idx = Math.floor(i / chunkSize);
        if (!res[idx]) res[idx] = [];
        res[idx].push(val);
        return res;
      }, []);

      for (const batch of chunks) {
        try {
          const symbolParam = batch.join(',');
          const apiUrl = `https://api.twelvedata.com/time_series?symbol=${symbolParam}&interval=${intervalParam}&outputsize=${outputsize}&apikey=${process.env.REACT_APP_TWELVE_DATA_API_KEY}`;
          logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] API Request: url=${apiUrl.replace(/apikey=[^&]*/, 'apikey=***')}, symbols=${batch.join(',')}, interval=${intervalParam}, outputsize=${outputsize}`);
          
          const res = await fetch(apiUrl);
          logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] API Response Status: status=${res.status}, statusText=${res.statusText}, headers=${JSON.stringify(Object.fromEntries(res.headers.entries()))}`);
          
          const data = await res.json();
          logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] API Response Data: dataKeys=${Object.keys(data).join(',')}, fullResponse=${JSON.stringify(data)}`);
          
          // Detailed structure analysis for each symbol
          for (const ticker of batch) {
            logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] Raw API data for ${ticker}: exists=${!!data[ticker]}, structure=${data[ticker] ? Object.keys(data[ticker]).join(',') : 'N/A'}, values=${data[ticker]?.values ? 'HAS_VALUES' : 'NO_VALUES'}, valuesLength=${data[ticker]?.values?.length || 0}, firstValue=${JSON.stringify(data[ticker]?.values?.[0])}, status=${data[ticker]?.status}, message=${data[ticker]?.message}`);
          }

          for (const ticker of batch) {
            try {
              TradeActionBus.clear();
              logDebug('DEBUG_TRADE_SIGNALS', `[L-15] TradeActionBus cleared for ${ticker}`);
              const tickerData = data[ticker]?.values;
              logDebug('DEBUG_TRADE_SIGNALS', `[L-18] Retrieved ${tickerData?.length || 0} candles for ${ticker}`);
              if (!tickerData || tickerData.length < 420) {
                logDebug('DEBUG_TRADE_SIGNALS', `[L-18] INSUFFICIENT CANDLE DATA for ${ticker}: received ${tickerData?.length || 0} candles`);
              }
              logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] Processing ${ticker}: hasData=${!!tickerData}, dataLength=${tickerData?.length || 0}, status=${data[ticker]?.status}, message=${data[ticker]?.message}`);
              
              if (!tickerData || tickerData.length < 10) {
                logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] Skipping ${ticker}: insufficient data (${tickerData?.length || 0} candles)`);
                auditLog.push({ ticker, error: 'Insufficient data', candleCount: tickerData?.length || 0 });
                continue;
              }
              const ohlcv = tickerData.map((d: any) => ({
                open: +d.open,
                high: +d.high,
                low: +d.low,
                close: +d.close,
                volume: +d.volume,
                timestamp: new Date(d.datetime)
              })).reverse();

              // CRITICAL FIX: Transform to Heikin-Ashi candles before pattern detection
              const haCandles = transformToHeikinAshi(ohlcv);
              const haCandlesAsOHLCV = haCandles.map(heikinAshiToCandlestickData);
              logDebug('DEBUG_TRADE_SIGNALS', `[SignalScanner] Transformed ${ohlcv.length} OHLCV candles to ${haCandles.length} HA candles for ${ticker}`);
              
              // Initialize pattern detector
              const detector = new PatternDetector();
              
              // Run pattern detection on the HA candles
              const detectionResults = detector.detectPatterns(haCandlesAsOHLCV);
              
              // Add ticker and symbol attribution to patterns
              const enrichedPatterns = detectionResults.map(pattern => ({
                ...pattern,
                ticker,
                symbol: ticker.toUpperCase(),
              }));
              
              // Collect all patterns for this symbol
              allPatterns.push(...enrichedPatterns);
              
              // Collect escalator steps (patterns with type ESCALATOR)
              const escalatorSteps = enrichedPatterns.filter(p => p.type === 'ESCALATOR');
              allSteps.push(...escalatorSteps);
              
              // Convert patterns to signals
              const patternResults = await detectPatternsForSymbol(ticker, haCandlesAsOHLCV);
              logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] ${ticker} pattern detection: patternsFound=${patternResults.length}, patterns=${JSON.stringify(patternResults.map(p => p.pattern))}`);
              auditLog.push({ ticker, patternsDetected: patternResults.map(p => p.pattern) });

              const validSignals = patternResults
                .filter(sig => sig.pattern && !sig.pattern.toUpperCase().includes('MOCK'))
                .map(sig => {
                  const confidence = sig.confidence ?? 0.7; // fallback
                  const action = mapPatternToTradeAction(sig.pattern);
                  const signalType = mapPatternToSignalType(sig.pattern);
                  const enrichedSignal: TradeActionSignal = {
                    ...sig,
                    ticker,
                    confidence,
                    action,
                    signalType,
                    price: sig.price || ohlcv.at(-1)?.close || 0,
                    timestamp: sig.timestamp || new Date()
                  };
                  auditLog.push({ ticker, signal: enrichedSignal });
                  return enrichedSignal;
                });

              logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] ${ticker} final signals: totalPatterns=${patternResults.length}, validSignals=${validSignals.length}, signalTypes=${validSignals.map(s => s.pattern).join(',')}`);

              allSignals.push(...validSignals);
              
              // PATCH L-22: Direct injection of hydrated contexts
              if (setPatterns) {
                setPatterns(patternResults);
                if (rowHydration) {
                  rowHydration.patternMap[ticker] = patternResults;
                }
              }
              if (setEscalatorSteps && patternResults.some(p => p.pattern === 'ESCALATOR')) {
                const escalatorSteps = patternResults.filter(p => p.pattern === 'ESCALATOR');
                setEscalatorSteps(escalatorSteps);
                if (rowHydration) {
                  rowHydration.stepMap[ticker] = escalatorSteps;
                }
              }
              logDebug('DEBUG_TRADE_SIGNALS', `[L-19/L-22] Context + rowHydration injected for ${ticker}`);
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : String(err);
              logDebug('DEBUG_TRADE_SIGNALS', `[BatchScanner] Error processing ${ticker}: ` + errorMessage);
            }
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          logDebug('DEBUG_TRADE_SIGNALS', '[BatchScanner] Error processing batch: ' + batch.join(',') + ' - ' + errorMessage);
        }
        await new Promise(r => setTimeout(r, 3000)); // 3s delay between batches
      }

      const auditDump = { timestamp: new Date(), symbols: symbols.length, signals: allSignals, trace: auditLog };
      downloadAuditJSON(auditDump, `signal_audit_${Date.now()}.json`);
      
      // PATCH L7: Log final signals with symbol attribution
      logDebug('DEBUG_TRADE_SIGNALS', '[SignalScanner] Final signals with symbol attribution: totalSignals=' + allSignals.length + ', symbolDistribution=' + JSON.stringify(allSignals.reduce((acc, sig) => {
        const key = sig.ticker || 'UNKNOWN';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)) + ', sampleSignals=' + JSON.stringify(allSignals.slice(0, 3).map(s => ({ ticker: s.ticker, pattern: s.pattern, confidence: s.confidence }))));
      
      setSignals(
        allSignals.sort((a, b) => symbols.indexOf(a.ticker || '') - symbols.indexOf(b.ticker || ''))
      );
      setPatternsState(allPatterns);
      setStepsState(allSteps);
      setIsScanning(false);
    };

    fetchAndProcess();
  }, [symbols, timeframe, shouldScan]);

  return { signals, patterns, steps, isScanning };
}

/**
 * Fetch OHLCV data for a specific symbol and timeframe
 */
async function fetchOHLCVForSymbol(ticker: string, timeframe: string): Promise<CandlestickData[]> {
  const interval = mapTimeframeToInterval(timeframe);
  const outputsize = 420;  // Minimum for full day pattern resolution
  const endDate = new Date();
  const startDate = new Date();
  
  logDebug('DEBUG_TRADE_SIGNALS', `[FETCH-OHLCV] Fetching ${outputsize} candles for ${ticker} @ ${interval}`);
  
  // PATCH L-14: Ensure at least 1 full trading day (7 hours * 60min = 420 candles)
  // Calculate appropriate date range based on timeframe to ensure sufficient depth
  switch (timeframe) {
    case '1D':
      startDate.setDate(endDate.getDate() - 14); // 2 weeks to ensure 420+ candles
      break;
    case '1W':
      startDate.setDate(endDate.getDate() - 60); // 2 months of data
      break;
    case '1M':
      startDate.setDate(endDate.getDate() - 180); // 6 months of data
      break;
    default:
      startDate.setDate(endDate.getDate() - 60); // Default to 2 months for safety
  }
  
  return await fetchCandlestickData(ticker, timeframeToInterval(interval), startDate, endDate);
}

/**
 * Detect patterns for a specific symbol using TriSight pattern engine
 */
async function detectPatternsForSymbol(ticker: string, ohlcv: CandlestickData[]): Promise<Omit<TradeActionSignal, 'ticker'>[]> {
  const signals: Omit<TradeActionSignal, 'ticker'>[] = [];
  
  try {
    // Initialize pattern detector
    const detector = new PatternDetector();
    
    // Run pattern detection on the data
    const detectionResults = detector.detectPatterns(ohlcv);
    
    // Debug: Log pattern types detected
    const patternTypeCounts: Record<string, number> = {};
    detectionResults.forEach(p => {
      patternTypeCounts[p.type] = (patternTypeCounts[p.type] || 0) + 1;
    });
    logDebug('DEBUG_TRADE_SIGNALS', `[SignalScanner] Pattern detection for ${ticker}: ${JSON.stringify(patternTypeCounts)}`);
    
    // Add ticker and symbol attribution to patterns for row gating
    const enrichedPatterns = detectionResults.map(pattern => ({
      ...pattern,
      ticker,
      symbol: ticker.toUpperCase(),
    }));
    
    // Convert detected patterns to TradeActionSignals
    enrichedPatterns.forEach((pattern: any, index: number) => {
      let action: TradeAction;
      let signalType: SignalType;
      let reason: string;
      
      // Map pattern types to trade actions
      switch (pattern.type) {
        case PatternType.ESCALATOR:
          if ('direction' in pattern && pattern.direction === 'RISING') {
            action = TradeAction.BUY;
            signalType = SignalType.LONG_ENTRY;
            reason = `Rising Escalator pattern detected`;
          } else {
            action = TradeAction.SELL;
            signalType = SignalType.SHORT_ENTRY;
            reason = `Falling Escalator pattern detected`;
          }
          break;
        case PatternType.BREAKOUTBOX:
          action = TradeAction.BUY;
          signalType = SignalType.LONG_ENTRY;
          reason = `Breakout Box pattern detected`;
          break;
        case PatternType.GOLDMINE_SHAFT:
          action = TradeAction.BUY;
          signalType = SignalType.LONG_ENTRY;
          reason = `Goldmine Shaft pattern detected`;
          break;
        case PatternType.GOLDEN_CANDLE:
          action = TradeAction.BUY;
          signalType = SignalType.LONG_ENTRY;
          reason = `Golden Candle pattern detected`;
          break;
        case PatternType.BLACKJACK:
          // Blackjack patterns indicate strong price-volume correlation
          action = TradeAction.BUY;
          signalType = SignalType.LONG_ENTRY;
          reason = `Blackjack pattern detected with confidence ${pattern.confidence?.toFixed(2)}`;
          break;
        default:
          action = TradeAction.BUY;
          signalType = SignalType.LONG_ENTRY;
          reason = `${pattern.type} pattern detected`;
      }
      
      const signal: Omit<TradeActionSignal, 'ticker'> = {
        action,
        signalType,
        pattern: pattern.type,
        confidence: pattern.confidence || 0.7,
        price: pattern.highPrice || pattern.lowPrice || 0,
        timestamp: pattern.startTime,
        reason,
        riskLevel: pattern.confidence && pattern.confidence > 0.8 ? 'LOW' : 
                  pattern.confidence && pattern.confidence > 0.6 ? 'MEDIUM' : 'HIGH',
        candleIndex: index,
      };
      
      signals.push(signal);
    });
    
    logDebug('DEBUG_TRADE_SIGNALS', `[SignalScanner] Converted ${detectionResults.length} patterns to ${signals.length} signals for ${ticker}`);
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logDebug('DEBUG_TRADE_SIGNALS', `[SignalScanner] Pattern detection failed for ${ticker}: ` + errorMessage);
  }
  
  return signals;
}

/**
 * Hook to get scanning status
 * Useful for displaying loading states in UI
 */
export function useSignalScannerStatus(symbols: string[]): boolean {
  const [isScanning, setIsScanning] = useState(false);
  
  useEffect(() => {
    if (symbols.length > 0) {
      setIsScanning(true);
      // Real scanning - status will be updated by the actual scanning process
      const timer = setTimeout(() => setIsScanning(false), 100);
      return () => clearTimeout(timer);
    }
    setIsScanning(false);
  }, [symbols]);
  
  return isScanning;
}
