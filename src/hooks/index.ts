// src/hooks/index.ts
// Central export file for all React hooks
// Makes importing hooks easier across the application

// Chart hooks
export { useChartState } from './chart/useChartState';

// Pattern detection hooks
export { usePatternBus } from './usePatternBus';
export { usePatterns } from './usePatterns';
export { usePatternDetectionPreferences } from './usePatternDetectionPreferences';
export { usePatternMetrics } from './usePatternMetrics';

// Market data hooks
export { useMarketData } from './useMarketData';
export { useMarketDataWithSupabase } from './useMarketDataWithSupabase';
export { useLivePolling } from './useLivePolling';
export { useTwelveDataApiKey } from './useTwelveDataApiKey';

// UI control hooks
export { useInfiniteZoomController } from './useInfiniteZoomController';
export { usePanController } from './usePanController';
export { useSmoothZoom } from './useSmoothZoom';
export { useHoverMetrics } from './useHoverMetrics';

// Feature hooks
export { useFeedback } from './useFeedback';
export { useLearning } from './useLearning';
export { usePrivacyConsent } from './usePrivacyConsent';
export { useSignalScanner } from './useSignalScanner';

// Data transformation hooks
export { useHeikinAshiTransform } from './useHeikinAshiTransform';

// Report generation hooks
export { useReportGeneration } from './useReportGeneration';
export { useAutomatedReportGeneration } from './useAutomatedReportGeneration';