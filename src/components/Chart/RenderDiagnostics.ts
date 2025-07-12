// src/components/Chart/RenderDiagnostics.ts
// TriSight Render Surface Visibility Audit & Diagnostics
// Provides comprehensive logging and verification for ConvictionCloud & TargetReportTable rendering

import { ConvictionCloudItem } from './ConvictionCloudRenderer';
import { TargetReportRow } from './TargetReportTableRenderer';

// Global frame counter for render tracking
let renderFrameCounter = 0;
let lastRenderTimestamp = Date.now();

interface RenderDiagnostics {
  frameId: number;
  timestamp: number;
  frameDuration: number;
  convictionCloudActive: boolean;
  convictionCloudItemCount: number;
  targetReportTableActive: boolean;
  targetReportRowCount: number;
  canvasLayerOrder: string[];
  dataSourceTypes: {
    convictionCloud: 'dummy' | 'live' | 'empty';
    targetReportTable: 'dummy' | 'live' | 'empty';
  };
}

/**
 * Initialize render diagnostics logging
 */
export const initializeRenderDiagnostics = (): void => {
  console.log('🔍 [RenderDiagnostics] TriSight Render Surface Visibility Audit INITIALIZED');
  console.log('📊 Monitoring: ConvictionCloud + TargetReportTable rendering activity');
  renderFrameCounter = 0;
  lastRenderTimestamp = Date.now();
};

/**
 * Log ConvictionCloud rendering activity with detailed metrics
 */
export const logConvictionCloudRender = (
  items: ConvictionCloudItem[] | null | undefined,
  canvasCoords: { x: number; y: number; width: number; height: number },
  hoveredItem: ConvictionCloudItem | null = null
): void => {
  const currentTime = Date.now();
  const frameDuration = currentTime - lastRenderTimestamp;
  renderFrameCounter++;

  const itemCount = items?.length || 0;
  const dataSourceType = determineConvictionDataSource(items);
  
  console.group(`🌟 [ConvictionCloud] Frame ${renderFrameCounter} Render`);
  console.log(`📈 Items: ${itemCount} labels rendered`);
  console.log(`📍 Canvas Area: (${canvasCoords.x}, ${canvasCoords.y}) ${canvasCoords.width}×${canvasCoords.height}px`);
  console.log(`⏱️ Frame Duration: ${frameDuration}ms`);
  console.log(`🔢 Data Source: ${dataSourceType}`);
  
  if (itemCount > 0 && items) {
    const scoreRange = {
      min: Math.min(...items.map(item => item.convictionRating)),
      max: Math.max(...items.map(item => item.convictionRating)),
      avg: items.reduce((sum, item) => sum + item.convictionRating, 0) / items.length
    };
    console.log(`📊 Score Range: ${scoreRange.min}-${scoreRange.max} (avg: ${scoreRange.avg.toFixed(1)})`);
    
    // Log top 3 items by conviction
    const topItems = [...items]
      .sort((a, b) => b.convictionRating - a.convictionRating)
      .slice(0, 3)
      .map(item => `${item.symbol}(${item.convictionRating})`)
      .join(', ');
    console.log(`🏆 Top Convictions: ${topItems}`);
  }
  
  if (hoveredItem) {
    console.log(`👆 Hovered: ${hoveredItem.symbol} (${hoveredItem.convictionRating}/100)`);
  }
  
  console.groupEnd();
  lastRenderTimestamp = currentTime;
};

/**
 * Log TargetReportTable rendering activity with detailed metrics
 */
export const logTargetReportTableRender = (
  rows: TargetReportRow[] | null | undefined,
  tableDimensions: { x: number; y: number; width: number; height: number; headerHeight: number; rowHeight: number },
  visibleRowCount: number,
  sortColumn?: string,
  sortDirection?: 'asc' | 'desc',
  hoveredCell?: { row: number; column: number } | null
): void => {
  const currentTime = Date.now();
  const frameDuration = currentTime - lastRenderTimestamp;
  renderFrameCounter++;

  const rowCount = rows?.length || 0;
  const dataSourceType = determineTargetReportDataSource(rows);
  const visibleColumns = ['Symbol', 'Conviction', 'Acceleration', 'Momentum', 'Intrinsic', 'Relative', 'Composite', 'Trigger', 'Price', 'Date', 'Time'];
  
  console.group(`📊 [TargetTable] Frame ${renderFrameCounter} Render`);
  console.log(`📋 Rows: ${rowCount} total, ${visibleRowCount} visible`);
  console.log(`📐 Table Dimensions: (${tableDimensions.x}, ${tableDimensions.y}) ${tableDimensions.width}×${tableDimensions.height}px`);
  console.log(`📏 Row Layout: ${tableDimensions.headerHeight}px header, ${tableDimensions.rowHeight}px rows`);
  console.log(`📊 Columns: ${visibleColumns.length} (${visibleColumns.join(', ')})`);
  console.log(`⏱️ Frame Duration: ${frameDuration}ms`);
  console.log(`🔢 Data Source: ${dataSourceType}`);
  
  if (sortColumn) {
    console.log(`🔀 Sort: ${sortColumn} (${sortDirection})`);
  }
  
  if (rowCount > 0 && rows) {
    const convictionScores = rows.map(row => row.successScore);
    const scoreStats = {
      min: Math.min(...convictionScores),
      max: Math.max(...convictionScores),
      avg: convictionScores.reduce((sum, score) => sum + score, 0) / convictionScores.length
    };
    console.log(`📈 Conviction Scores: ${scoreStats.min}-${scoreStats.max} (avg: ${scoreStats.avg.toFixed(1)})`);
    
    // Log trigger type distribution
    const triggerTypes = rows.reduce((acc, row) => {
      acc[row.triggerType] = (acc[row.triggerType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(`🎯 Triggers: ${Object.entries(triggerTypes).map(([type, count]) => `${type}(${count})`).join(', ')}`);
  }
  
  if (hoveredCell) {
    console.log(`👆 Hovered: Row ${hoveredCell.row}, Col ${hoveredCell.column}`);
  }
  
  console.groupEnd();
  lastRenderTimestamp = currentTime;
};

/**
 * Log overall render orchestration status
 */
export const logRenderOrchestrationStatus = (
  convictionCloudEnabled: boolean,
  convictionCloudItemCount: number,
  targetReportEnabled: boolean,
  targetReportRowCount: number,
  canvasRefs: {
    main: HTMLCanvasElement | null;
    buffer: HTMLCanvasElement | null;
    patterns: HTMLCanvasElement | null;
  }
): void => {
  const currentTime = Date.now();
  renderFrameCounter++;
  
  console.group(`🎭 [RenderOrchestrator] Frame ${renderFrameCounter} Status`);
  console.log(`🌟 ConvictionCloud: ${convictionCloudEnabled ? '✅ ACTIVE' : '❌ INACTIVE'} (${convictionCloudItemCount} items)`);
  console.log(`📊 TargetReportTable: ${targetReportEnabled ? '✅ ACTIVE' : '❌ INACTIVE'} (${targetReportRowCount} rows)`);
  
  // Canvas layer verification
  const canvasLayers = [];
  if (canvasRefs.main) canvasLayers.push('main');
  if (canvasRefs.buffer) canvasLayers.push('buffer');  
  if (canvasRefs.patterns) canvasLayers.push('patterns');
  
  console.log(`🎨 Canvas Layers: ${canvasLayers.join(' → ')} (${canvasLayers.length} active)`);
  
  // Z-index verification
  if (canvasRefs.main && canvasRefs.patterns) {
    const mainZIndex = parseInt(getComputedStyle(canvasRefs.main).zIndex || '0');
    const patternsZIndex = parseInt(getComputedStyle(canvasRefs.patterns).zIndex || '0');
    const layerOrderCorrect = mainZIndex > patternsZIndex;
    console.log(`📚 Layer Order: ${layerOrderCorrect ? '✅ CORRECT' : '❌ INCORRECT'} (main:${mainZIndex} > patterns:${patternsZIndex})`);
  }
  
  console.groupEnd();
};

/**
 * Determine data source type for ConvictionCloud
 */
const determineConvictionDataSource = (items: ConvictionCloudItem[] | null | undefined): 'dummy' | 'live' | 'empty' => {
  if (!items || items.length === 0) return 'empty';
  
  // Check if data looks like dummy data (has specific test symbols)
  const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
  const hasTestSymbols = items.some(item => testSymbols.includes(item.symbol));
  
  // Check if conviction ratings are round numbers (likely dummy)
  const hasRoundRatings = items.every(item => item.convictionRating % 5 === 0);
  
  if (hasTestSymbols && hasRoundRatings) return 'dummy';
  return 'live';
};

/**
 * Determine data source type for TargetReportTable
 */
const determineTargetReportDataSource = (rows: TargetReportRow[] | null | undefined): 'dummy' | 'live' | 'empty' => {
  if (!rows || rows.length === 0) return 'empty';
  
  // Check if data looks like dummy data (has specific test symbols)
  const testSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
  const hasTestSymbols = rows.some(row => testSymbols.includes(row.symbol));
  
  // Check if scores are round numbers (likely dummy)
  const hasRoundScores = rows.every(row => 
    row.successScore % 5 === 0 && 
    row.accelerationScore % 10 === 0
  );
  
  if (hasTestSymbols && hasRoundScores) return 'dummy';
  return 'live';
};

/**
 * Performance monitoring for render cycles
 */
export const measureRenderPerformance = <T>(
  operation: string,
  renderFunction: () => T
): T => {
  const startTime = performance.now();
  const result = renderFunction();
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 16.67) { // More than one frame at 60fps
    console.warn(`⚠️ [Performance] ${operation} took ${duration.toFixed(2)}ms (>16.67ms threshold)`);
  } else {
    console.log(`⚡ [Performance] ${operation}: ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

/**
 * Export diagnostic summary for debugging
 */
export const exportDiagnosticSummary = (): RenderDiagnostics => {
  return {
    frameId: renderFrameCounter,
    timestamp: Date.now(),
    frameDuration: Date.now() - lastRenderTimestamp,
    convictionCloudActive: false, // Will be set by callers
    convictionCloudItemCount: 0,
    targetReportTableActive: false,
    targetReportRowCount: 0,
    canvasLayerOrder: ['buffer', 'patterns', 'main'],
    dataSourceTypes: {
      convictionCloud: 'empty',
      targetReportTable: 'empty'
    }
  };
};

export default {
  initializeRenderDiagnostics,
  logConvictionCloudRender,
  logTargetReportTableRender,
  logRenderOrchestrationStatus,
  measureRenderPerformance,
  exportDiagnosticSummary
};
