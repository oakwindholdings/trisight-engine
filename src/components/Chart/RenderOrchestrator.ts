// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows a 5-stage lifecycle: detect → emit → context → render → score.
// src/components/Chart/RenderOrchestrator.ts
// Orchestrates chart rendering across multiple canvases
// Ensures all data displays contiguously

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
  goldmineQual?: boolean[]; // Golden Candle indicators
  // Chart settings for Heikin-Ashi and display options
  chartSettings?: {
    isHeikinAshi: boolean;
    showVolume: boolean;
    showGrid: boolean;
  };
}

export function renderChart(args: RenderArgs) {
  const {
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
    escalatorSettings = { enabled: true, showLabels: true, showBreakoutBoxes: true },
    breakoutBoxes = [],
    breakoutBoxSettings = { enabled: true, showBreakoutBoxes: true, minStallLength: 3, breakoutMultiplier: 2, stallThreshold: 0.5 },
    goldmineQual = [],
    chartSettings = { isHeikinAshi: false, showVolume: true, showGrid: true }
  } = args;

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
  
  PatternRenderer.render(patternsCtx, visiblePatterns, timeScale, priceScale, { width, height, margin }, selectedPattern || null, escalatorSteps, escalatorSettings, breakoutBoxes, filteredData, breakoutBoxSettings);
  TimeAxis.render(mainCtx, timeScale, { width, height, margin }, timeframe, showOnlyTradingHours);
  PriceAxis.render(mainCtx, priceScale, { width, height, margin });
}
