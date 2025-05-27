// src/components/Chart/RenderOrchestrator.ts
// Coordinates canvas drawing order for the chart
// Handles double-buffer rendering and axis drawing
import { RefObject } from 'react';
import { CandlestickData, VisibleRange } from '../../models/ChartTypes';
import { Pattern } from '../../models/PatternTypes';
import { createTimeScale, createPriceScale } from '../../utils/scaling';
import CandlestickRenderer from './CandlestickRenderer';
import PatternRenderer from './PatternRenderer';
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
  margin: { left: number; right: number; top: number; bottom: number };
  visiblePatterns: Pattern[];
  selectedPattern: Pattern | null;
  timeframe: string;
  showOnlyTradingHours: boolean;
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
    showOnlyTradingHours
  } = args;

  const mainCanvas = mainCanvasRef.current;
  const bufferCanvas = bufferCanvasRef.current;
  const patternsCanvas = patternsCanvasRef.current;
  if (!mainCanvas || !bufferCanvas || !patternsCanvas || filteredData.length === 0) return;

  const mainCtx = mainCanvas.getContext('2d');
  const bufferCtx = bufferCanvas.getContext('2d');
  const patternsCtx = patternsCanvas.getContext('2d');
  if (!mainCtx || !bufferCtx || !patternsCtx) return;

  mainCtx.clearRect(0, 0, width, height);
  bufferCtx.clearRect(0, 0, width, height);
  patternsCtx.clearRect(0, 0, width, height);

  const visibleData = filteredData.slice(visibleDataIndices.start, visibleDataIndices.end + 1);
  const timeScale = createTimeScale(width - margin.left - margin.right, [visibleRange.startTime, visibleRange.endTime], [margin.left, width - margin.right]);
  const priceScale = createPriceScale(height - margin.top - margin.bottom, [visibleRange.minPrice, visibleRange.maxPrice], [height - margin.bottom, margin.top]);

  CandlestickRenderer.render(bufferCtx, visibleData, timeScale, priceScale, { width, height, margin });
  mainCtx.drawImage(bufferCanvas, 0, 0);
  PatternRenderer.render(patternsCtx, visiblePatterns, timeScale, priceScale, { width, height, margin }, selectedPattern || null);
  TimeAxis.render(mainCtx, timeScale, { width, height, margin }, timeframe, showOnlyTradingHours);
  PriceAxis.render(mainCtx, priceScale, { width, height, margin });
}
