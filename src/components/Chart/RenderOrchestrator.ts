// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/components/Chart/RenderOrchestrator.ts
// Orchestrates chart rendering across multiple canvases
// Ensures all data displays contiguously
// HA Infrastructure Alignment Patch v1.0.0: Now supports HA candle rendering

// NOTE: This component controls all drawing flows across chart and pattern overlays.
// CRITICAL: We use CANVAS for all rendering, NEVER SVG or other technologies.
// BreakoutBoxes must be drawn using Canvas 2D context methods in PatternRenderer.

import { RefObject } from 'react';
import { CandlestickData, VisibleRange } from '../../models/ChartTypes';
import { Pattern } from '../../models/PatternTypes';
import CandlestickRenderer from './CandlestickRenderer';
import PatternRenderer from './PatternRenderer';
import { createPriceScale } from '../../utils/scaling';
import { createSequentialTimeScale } from '../../utils/sequentialScale';
import TimeAxis from './TimeAxis';
import PriceAxis from './PriceAxis';
import { convertToHeikinAshi } from '../../utils/candleTransform'; // HA Infrastructure Alignment Patch v1.0.0
import { TradeActionSignal } from '../../utils/trading/TradeActionSignal'; // 🔗 TradeActionSignal Integration
import { renderConvictionCloud, ConvictionCloudItem, defaultConvictionCloudSettings } from './ConvictionCloudRenderer';
import { renderTargetReportTable, TargetReportRow, TargetReportTableSettings, defaultTargetReportTableSettings } from './TargetReportTableRenderer';
import { logRenderOrchestrationStatus, initializeRenderDiagnostics, measureRenderPerformance } from './RenderDiagnostics';
import { SignalFidelityValidator, FIDELITY_MODE_SETTINGS, LifecycleInstrumentation, dataAnalysisLock, patternEngineTracker } from '../../utils/signalFidelityPatch';

interface RenderArgs {
  mainCanvasRef: RefObject<HTMLCanvasElement | null>;
  bufferCanvasRef: RefObject<HTMLCanvasElement | null>;
  patternsCanvasRef: RefObject<HTMLCanvasElement | null>;
  filteredData: CandlestickData[];
  visibleDataIndices: { start: number; end: number };
  visibleRange: VisibleRange;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  visiblePatterns: Pattern[];
  selectedPattern: Pattern | null;
  timeframe: string;
  showOnlyTradingHours: boolean;
  escalatorSteps?: any[];
  escalatorSettings?: { enabled: boolean; showLabels: boolean; showBreakoutBoxes: boolean };
  breakoutBoxes?: any[];
  breakoutBoxSettings?: { enabled: boolean; showBreakoutBoxes: boolean; minStallLength: number; breakoutMultiplier: number; stallThreshold: number };
  blackjackSettings?: { showLabels: boolean };
  goldmineQual?: boolean[]; // Golden Candle indicators
  goldenCandleSettings?: { showLabels: boolean; showNearMiss: boolean }; // Golden Candle settings including near-miss toggle
  goldenNearMisses?: boolean[]; // Golden Candle near-miss overlays
  // 🔗 TradeActionSignal Integration
  tradeActionSignals?: TradeActionSignal[]; // Trade action signals for rendering
  tradeActionSettings?: { showAggressive: boolean; showLabels: boolean; showIcons: boolean }; // Trade action signal settings
  // 🌟 Conviction Cloud Integration
  convictionCloudItems?: ConvictionCloudItem[]; // Conviction cloud data for rendering
  convictionCloudSettings?: typeof defaultConvictionCloudSettings; // 🌟 Conviction Cloud Settings
  hoveredConvictionItem?: ConvictionCloudItem | null; // Currently hovered conviction item
  // 📊 Target Report Table Integration
  targetReportRows?: TargetReportRow[]; // Target report table data
  targetReportSettings?: TargetReportTableSettings; // Target report table settings
  hoveredTableCell?: { row: number; column: number } | null; // Currently hovered table cell
  // Chart settings for Heikin-Ashi and display options
  chartSettings?: {
    isHeikinAshi: boolean;
    showVolume: boolean;
    showGrid: boolean;
  };
}

// Original renderChart implementation wrapped for performance monitoring
function _renderChartImpl({
  mainCanvasRef,
  bufferCanvasRef,
  patternsCanvasRef,
  filteredData,
  visibleDataIndices,
  visibleRange,
  width,
  height,
  margin,
  visiblePatterns,
  selectedPattern,
  timeframe,
  showOnlyTradingHours,
  escalatorSteps = [],
  escalatorSettings = { enabled: true, showLabels: false, showBreakoutBoxes: false },
  breakoutBoxes = [],
  breakoutBoxSettings = { enabled: true, showBreakoutBoxes: true, minStallLength: 3, breakoutMultiplier: 1.5, stallThreshold: 0.001 },
  blackjackSettings = { showLabels: false },
  goldmineQual,
  goldenCandleSettings = { showLabels: false, showNearMiss: false },
  goldenNearMisses,
  tradeActionSignals,
  tradeActionSettings = { showAggressive: true, showLabels: true, showIcons: true },
  convictionCloudItems = [],
  convictionCloudSettings = defaultConvictionCloudSettings,
  hoveredConvictionItem = null,
  targetReportRows = [], // 📊 Target Report Table Data
  targetReportSettings = defaultTargetReportTableSettings, // 📊 Target Report Table Settings
  hoveredTableCell = null, // 📊 Hovered Table Cell
  chartSettings = { isHeikinAshi: false, showVolume: true, showGrid: true }
}: RenderArgs): void {
  // Signal Fidelity Mode: Check pattern engine readiness (but don't block basic chart rendering)
  const fidelityEnginesReady = patternEngineTracker.areAllEnginesReady();
  const shouldBlockSignalRendering = SignalFidelityValidator.shouldWaitForEngines(FIDELITY_MODE_SETTINGS) && !fidelityEnginesReady;
  
  if (shouldBlockSignalRendering) {
    console.log("[Fidelity] Pattern engines not ready - signals will be suppressed");
    LifecycleInstrumentation.logMilestone("Signal rendering blocked - waiting for pattern engines", {
      patternEnginesReady: fidelityEnginesReady,
      dataAnalysisReady: dataAnalysisLock.isAnalysisReady(),
      engineStatus: patternEngineTracker.getStatus()
    });
    // Continue with basic chart rendering, but signals will be suppressed
  }

  // 🔍 RENDER VISIBILITY AUDIT: Initialize diagnostics and log orchestration status
  LifecycleInstrumentation.logMilestone("Chart render started", {
    dataLength: filteredData.length,
    visibleRange,
    timestamp: new Date().toISOString()
  });
  logRenderOrchestrationStatus(
    !!(convictionCloudItems?.length && convictionCloudSettings?.enabled !== false),
    convictionCloudItems?.length || 0,
    !!(targetReportRows?.length && targetReportSettings?.enabled !== false),
    targetReportRows?.length || 0,
    {
      main: mainCanvasRef.current,
      buffer: bufferCanvasRef.current,
      patterns: patternsCanvasRef.current
    }
  );

  const mainCanvas = mainCanvasRef.current;
  const bufferCanvas = bufferCanvasRef.current;
  const patternsCanvas = patternsCanvasRef.current;

  // Debug logging
  console.log('[RenderOrchestrator] Starting render with:', {
    dataLength: filteredData.length,
    visibleDataIndices,
    visibleRange,
    width,
    height,
    hasCanvases: !!mainCanvas && !!bufferCanvas && !!patternsCanvas,
    breakoutBoxCount: breakoutBoxes.length
  });

  if (!mainCanvas || !bufferCanvas || !patternsCanvas || filteredData.length === 0) {
    console.warn('[RenderOrchestrator] Missing canvas or data, skipping render');
    return;
  }

  const mainCtx = mainCanvas.getContext('2d');
  const bufferCtx = bufferCanvas.getContext('2d');
  const patternsCtx = patternsCanvas.getContext('2d');
  if (!mainCtx || !bufferCtx || !patternsCtx) {
    console.error('[RenderOrchestrator] Failed to get canvas contexts');
    return;
  }

  mainCtx.clearRect(0, 0, width, height);
  bufferCtx.clearRect(0, 0, width, height);
  patternsCtx.clearRect(0, 0, width, height);

  const visibleData = filteredData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
  console.log('[RenderOrchestrator] Rendering visible data:', {
    visibleDataLength: visibleData.length,
    firstCandle: visibleData[0],
    lastCandle: visibleData[visibleData.length - 1]
  });

  const timeScale = createSequentialTimeScale(width - margin.left - margin.right, visibleData, [margin.left, width - margin.right]);
  const priceScale = createPriceScale(height - margin.top - margin.bottom, [visibleRange.minPrice, visibleRange.maxPrice], [height - margin.bottom, margin.top]);

  // Debug price scale
  console.log('[RenderOrchestrator] Price scale info:', {
    domain: [visibleRange.minPrice, visibleRange.maxPrice],
    range: [height - margin.bottom, margin.top],
    testLowPrice: priceScale.scale(visibleRange.minPrice),
    testHighPrice: priceScale.scale(visibleRange.maxPrice)
  });

  CandlestickRenderer.render(bufferCtx, visibleData, timeScale, priceScale, { 
    width, 
    height, 
    margin,
    showingTradingHoursOnly: showOnlyTradingHours
  }, {
    isHeikinAshi: chartSettings.isHeikinAshi,
    showVolume: chartSettings.showVolume,
    showGrid: chartSettings.showGrid,
    goldmineQual
  });
  mainCtx.drawImage(bufferCanvas, 0, 0);
  
  // Debug pattern rendering
  console.log('[RenderOrchestrator] Rendering patterns:', {
    patternCount: visiblePatterns.length,
    escalatorStepCount: escalatorSteps.length,
    breakoutBoxCount: breakoutBoxes.length,
    patterns: visiblePatterns.map(p => ({
      id: p.id,
      type: p.type,
      highPrice: p.highPrice,
      lowPrice: p.lowPrice,
      scaledHighY: priceScale.scale(p.highPrice),
      scaledLowY: priceScale.scale(p.lowPrice)
    }))
  });
  
  PatternRenderer.render(
    patternsCtx, 
    visiblePatterns, 
    timeScale, 
    priceScale, 
    { width, height, margin }, 
    selectedPattern || null, 
    escalatorSteps, // param 7
    breakoutBoxes, // param 8
    goldenNearMisses, // param 9 - goldenNearMisses
    convertToHeikinAshi(filteredData), // param 10 - haCandles
    blackjackSettings, // param 11 - blackjackSettings
    { showLabels: false }, // param 12 - pivotSettings
    { showLabels: false }, // param 13 - goldmineChannelSettings  
    goldenCandleSettings, // param 14 - goldenCandleSettings
    filteredData, // param 15 - candles (original non-HA)
    tradeActionSignals, // param 16 - signals
    tradeActionSettings, // param 17 - signalSettings
    convictionCloudItems, // param 18 - convictionItems
    convictionCloudSettings, // param 19 - convictionCloudSettings
    hoveredConvictionItem // param 20 - hoveredConvictionItem
  );
  TimeAxis.render(mainCtx, timeScale, { width, height, margin }, timeframe, showOnlyTradingHours);
  PriceAxis.render(mainCtx, priceScale, { width, height, margin });

  // Signal Fidelity Mode: Log chart rendering completion
  LifecycleInstrumentation.logMilestone("Chart rendered after full signal processing", {
    patternCount: visiblePatterns.length,
    escalatorStepCount: escalatorSteps.length,
    breakoutBoxCount: breakoutBoxes.length,
    tradeActionSignalCount: tradeActionSignals?.length || 0,
    timestamp: new Date().toISOString()
  });

  // 📊 Target Report Table Rendering (Bottom of chart)
  // Render table below the main chart area for signal ranking display
  if (targetReportRows && targetReportRows.length > 0 && targetReportSettings.enabled) {
    console.log(`[RenderOrchestrator] Rendering Target Report Table with ${targetReportRows.length} rows`);
    
    const tableY = height - targetReportSettings.height - 10; // 10px margin from bottom
    const tableDimensions = {
      x: margin.left,
      y: tableY,
      width: width - margin.left - margin.right,
      height: targetReportSettings.height,
      headerHeight: 32,
      rowHeight: 24,
      scrollOffset: 0 // Will be managed by parent component
    };
    
    renderTargetReportTable(
      mainCtx,
      targetReportRows,
      tableDimensions,
      targetReportSettings,
      hoveredTableCell
    );
  } else {
    console.log('[RenderOrchestrator] No Target Report Table data to render');
  }
}

// Performance telemetry tracking
let renderMetrics = {
  frameCount: 0,
  totalRenderTime: 0,
  droppedFrames: 0,
  lastFrameTime: performance.now(),
  fps: 0,
  avgRenderTime: 0
};

// Export performance metrics for Dev HUD
export function getChartPerformanceMetrics() {
  return {
    fps: renderMetrics.fps.toFixed(1),
    avgRenderTime: renderMetrics.avgRenderTime.toFixed(2),
    droppedFrames: renderMetrics.droppedFrames,
    droppedFramePercentage: ((renderMetrics.droppedFrames / Math.max(1, renderMetrics.frameCount)) * 100).toFixed(1)
  };
}

// Wrapped renderChart with performance monitoring
export function renderChart(args: RenderArgs): void {
  const startTime = performance.now();
  
  // Execute the actual render
  measureRenderPerformance('Chart Render', () => {
    _renderChartImpl(args);
  });
  
  // Update performance metrics
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  const timeSinceLastFrame = endTime - renderMetrics.lastFrameTime;
  
  renderMetrics.frameCount++;
  renderMetrics.totalRenderTime += renderTime;
  renderMetrics.avgRenderTime = renderMetrics.totalRenderTime / renderMetrics.frameCount;
  
  // Calculate FPS (frames per second)
  if (timeSinceLastFrame > 0) {
    renderMetrics.fps = 1000 / timeSinceLastFrame;
  }
  
  // Track dropped frames (render time > 16.67ms for 60fps)
  if (renderTime > 16.67) {
    renderMetrics.droppedFrames++;
  }
  
  renderMetrics.lastFrameTime = endTime;
  
  // Log performance warning if render is slow
  if (renderTime > 33.33) { // More than 2 frames at 60fps
    console.warn(`⚠️ [RenderOrchestrator] Slow render detected: ${renderTime.toFixed(2)}ms`, {
      candles: args.filteredData.length,
      patterns: args.visiblePatterns.length,
      signals: args.tradeActionSignals?.length || 0
    });
  }
}
