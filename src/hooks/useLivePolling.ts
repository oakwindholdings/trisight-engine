import { useEffect } from 'react';
import { getPollingInterval } from '../settings/globalSettings';
import { evaluateAllPatterns } from '../utils/patternHydration';
import { fetchLatestCandleData } from '../utils/dataFetcher';

export function useLivePolling(enabled: boolean = true): void {
  useEffect(() => {
    if (!enabled) return;

    const interval = getPollingInterval();
    const timer = setInterval(async () => {
      const candles = await fetchLatestCandleData(); // must return Candle[]
      const start = performance.now();
      evaluateAllPatterns(candles);
      const duration = performance.now() - start;
      console.log(`[PerformanceDebug] Pattern evaluation took ${duration}ms`);
      console.debug('[LivePolling] Rehydrated @', new Date().toISOString());
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [enabled]);
}
