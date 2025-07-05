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
      evaluateAllPatterns(candles);
      console.debug('[LivePolling] Rehydrated @', new Date().toISOString());
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [enabled]);
}
