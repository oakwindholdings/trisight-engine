// src/components/Chart/TargetReportTableRenderer.tsx
// Canvas-based TriSight Target Report Table renderer with fixed header and scrolling
// Implements Dick's worksheet formulas: Success = Conviction, Composite = Avg(4 subfactors)

import { logTargetReportTableRender, measureRenderPerformance } from './RenderDiagnostics';

import React from 'react';

export interface TargetReportRow {
  symbol: string;
  successScore: number; // Conviction Score from Dick's formulas
  accelerationScore: number;
  momentumScore: number;
  intrinsicStrengthScore: number;
  relativeStrengthScore: number;
  compositeScore: number; // Average of 4 subfactors
  triggerType: "Long Entry" | "Short Entry";
  triggerPrice: number;
  triggerDate: Date;
  triggerTime: string;
}

export interface TargetReportTableSettings {
  enabled: boolean;
  height: number; // Fixed table height
  sortableColumns: boolean;
  showTooltips: boolean;
  alternatingRowShading: boolean;
  maxVisibleRows: number;
  sortColumn: keyof TargetReportRow | null;
  sortDirection: 'asc' | 'desc';
  highlightedRow: string | null; // Symbol to highlight (for ConvictionCloud integration)
}

interface TableDimensions {
  x: number;
  y: number;
  width: number;
  height: number;
  headerHeight: number;
  rowHeight: number;
  scrollOffset: number;
}

interface ColumnDefinition {
  key: keyof TargetReportRow;
  label: string;
  width: number;
  align: 'left' | 'center' | 'right';
  format?: (value: any) => string;
}

// Table column definitions based on Dick's worksheet
const TABLE_COLUMNS: ColumnDefinition[] = [
  { key: 'symbol', label: 'Symbol', width: 80, align: 'left' },
  { key: 'successScore', label: 'Success', width: 70, align: 'right', format: (v: number) => v.toFixed(1) },
  { key: 'accelerationScore', label: 'Accel', width: 65, align: 'right', format: (v: number) => v.toFixed(1) },
  { key: 'momentumScore', label: 'Momentum', width: 80, align: 'right', format: (v: number) => v.toFixed(1) },
  { key: 'intrinsicStrengthScore', label: 'Intrinsic', width: 75, align: 'right', format: (v: number) => v.toFixed(1) },
  { key: 'relativeStrengthScore', label: 'Relative', width: 75, align: 'right', format: (v: number) => v.toFixed(1) },
  { key: 'compositeScore', label: 'Composite', width: 85, align: 'right', format: (v: number) => v.toFixed(2) },
  { key: 'triggerType', label: 'Trigger', width: 90, align: 'center' },
  { key: 'triggerPrice', label: 'Price', width: 70, align: 'right', format: (v: number) => `$${v.toFixed(2)}` },
  { key: 'triggerDate', label: 'Date', width: 80, align: 'center', format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) },
  { key: 'triggerTime', label: 'Time', width: 60, align: 'center' }
];

/**
 * Main canvas renderer for Target Report Table
 */
export const renderTargetReportTable = (
  ctx: CanvasRenderingContext2D,
  rows: TargetReportRow[],
  dimensions: TableDimensions,
  settings: TargetReportTableSettings,
  hoveredCell: { row: number; column: number } | null = null
): { visibleRows: TargetReportRow[]; totalRows: number } => {
  // 🔍 RENDER VISIBILITY AUDIT: Early exit logging
  if (!rows?.length || !settings.enabled) {
    console.log('[TargetTable] 🔍 AUDIT: No rows to render or table disabled - renderer not invoked');
    return { visibleRows: [], totalRows: 0 };
  }

  // 🔍 RENDER VISIBILITY AUDIT: Log table rendering activity
  const visibleRowCount = Math.min(rows.length, Math.floor((dimensions.height - dimensions.headerHeight) / dimensions.rowHeight));
  logTargetReportTableRender(
    rows,
    dimensions,
    visibleRowCount,
    settings.sortColumn || undefined,
    settings.sortDirection,
    hoveredCell
  );

  ctx.save();

  // Sort rows if sorting is enabled
  const sortedRows = settings.sortableColumns && settings.sortColumn 
    ? sortRows(rows, settings.sortColumn, settings.sortDirection)
    : rows;

  // Calculate visible rows based on scroll offset
  const startRow = Math.floor(dimensions.scrollOffset / dimensions.rowHeight);
  const endRow = Math.min(startRow + settings.maxVisibleRows, sortedRows.length);
  const visibleRows = sortedRows.slice(startRow, endRow);

  // Clear table area
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);

  // Draw table border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(dimensions.x, dimensions.y, dimensions.width, dimensions.height);

  // 📊 AUDIT: Measure header render performance
  measureRenderPerformance('TargetTable Header Rendering', () => {
    console.log(`[TargetTable] 🎯 AUDIT: Rendering table header at (${dimensions.x}, ${dimensions.y})`);
    renderTableHeader(ctx, dimensions, settings);
  });

  // 📊 AUDIT: Measure rows render performance  
  measureRenderPerformance('TargetTable Rows Rendering', () => {
    console.log(`[TargetTable] 📋 AUDIT: Rendering ${sortedRows.length} table rows`);
    renderTableRows(ctx, visibleRows, dimensions, settings, startRow, hoveredCell);
  });

  // Render scroll indicator if needed
  if (sortedRows.length > visibleRowCount) {
    console.log(`[TargetTable] 📊 AUDIT: Rendering scroll indicator (${sortedRows.length} total, ${visibleRowCount} visible)`);
    renderScrollIndicator(ctx, dimensions, sortedRows.length, visibleRowCount, startRow);
  }

  ctx.restore();
  return { visibleRows, totalRows: sortedRows.length };
}

/**
 * Render fixed table header with column labels
 */
function renderTableHeader(
  ctx: CanvasRenderingContext2D,
  dimensions: TableDimensions,
  settings: TargetReportTableSettings
): void {
  ctx.save();

  // Header background
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(dimensions.x, dimensions.y, dimensions.width, dimensions.headerHeight);

  // Header border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 1;
  ctx.strokeRect(dimensions.x, dimensions.y, dimensions.width, dimensions.headerHeight);

  // Column headers
  let currentX = dimensions.x;
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.textBaseline = 'middle';

  TABLE_COLUMNS.forEach(column => {
    // Column separator
    if (currentX > dimensions.x) {
      ctx.strokeStyle = '#d1d5db';
      ctx.beginPath();
      ctx.moveTo(currentX, dimensions.y);
      ctx.lineTo(currentX, dimensions.y + dimensions.headerHeight);
      ctx.stroke();
    }

    // Column label
    const textY = dimensions.y + dimensions.headerHeight / 2;
    const padding = 8;

    switch (column.align) {
      case 'left':
        ctx.textAlign = 'left';
        ctx.fillText(column.label, currentX + padding, textY);
        break;
      case 'center':
        ctx.textAlign = 'center';
        ctx.fillText(column.label, currentX + column.width / 2, textY);
        break;
      case 'right':
        ctx.textAlign = 'right';
        ctx.fillText(column.label, currentX + column.width - padding, textY);
        break;
    }

    // Sort indicator if applicable
    if (settings.sortableColumns && settings.sortColumn === column.key) {
      const arrowX = currentX + column.width - 16;
      const arrowY = textY;
      drawSortArrow(ctx, arrowX, arrowY, settings.sortDirection);
    }

    currentX += column.width;
  });

  ctx.restore();
}

/**
 * Render table data rows with alternating shading
 */
function renderTableRows(
  ctx: CanvasRenderingContext2D,
  rows: TargetReportRow[],
  dimensions: TableDimensions,
  settings: TargetReportTableSettings,
  startRowIndex: number,
  hoveredCell: { row: number; column: number } | null
): void {
  ctx.save();

  const dataY = dimensions.y + dimensions.headerHeight;
  ctx.font = '11px Inter, sans-serif';
  ctx.textBaseline = 'middle';

  rows.forEach((row, index) => {
    const rowY = dataY + index * dimensions.rowHeight;
    const globalRowIndex = startRowIndex + index;
    const isHighlighted = settings.highlightedRow === row.symbol;
    const isHovered = hoveredCell?.row === globalRowIndex;

    // Row background with alternating shading
    if (isHighlighted) {
      ctx.fillStyle = '#fef3c7'; // Yellow highlight for ConvictionCloud integration
    } else if (isHovered) {
      ctx.fillStyle = '#f0f9ff'; // Light blue for hover
    } else if (settings.alternatingRowShading && globalRowIndex % 2 === 1) {
      ctx.fillStyle = '#f9fafb'; // Light gray for alternating rows
    } else {
      ctx.fillStyle = '#ffffff';
    }
    
    ctx.fillRect(dimensions.x, rowY, dimensions.width, dimensions.rowHeight);

    // Row data
    let currentX = dimensions.x;
    TABLE_COLUMNS.forEach((column, columnIndex) => {
      // Column separator
      if (currentX > dimensions.x) {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(currentX, rowY);
        ctx.lineTo(currentX, rowY + dimensions.rowHeight);
        ctx.stroke();
      }

      // Cell value
      const value = row[column.key];
      const formattedValue = column.format ? column.format(value) : String(value);
      const textY = rowY + dimensions.rowHeight / 2;
      const padding = 8;

      // Cell text color based on trigger type and scores
      if (column.key === 'triggerType') {
        ctx.fillStyle = row.triggerType === 'Long Entry' ? '#059669' : '#dc2626';
      } else if (column.key === 'successScore' || column.key === 'compositeScore') {
        ctx.fillStyle = getScoreColor(value as number);
      } else {
        ctx.fillStyle = '#374151';
      }

      // Text alignment and rendering
      switch (column.align) {
        case 'left':
          ctx.textAlign = 'left';
          ctx.fillText(formattedValue, currentX + padding, textY);
          break;
        case 'center':
          ctx.textAlign = 'center';
          ctx.fillText(formattedValue, currentX + column.width / 2, textY);
          break;
        case 'right':
          ctx.textAlign = 'right';
          ctx.fillText(formattedValue, currentX + column.width - padding, textY);
          break;
      }

      currentX += column.width;
    });

    // Row border
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(dimensions.x, rowY, dimensions.width, dimensions.rowHeight);
  });

  ctx.restore();
}

/**
 * Render scroll indicator for large datasets
 */
function renderScrollIndicator(
  ctx: CanvasRenderingContext2D,
  dimensions: TableDimensions,
  totalRows: number,
  visibleRows: number,
  currentStartRow: number
): void {
  ctx.save();

  const scrollBarWidth = 12;
  const scrollBarX = dimensions.x + dimensions.width - scrollBarWidth - 2;
  const scrollBarY = dimensions.y + dimensions.headerHeight + 2;
  const scrollBarHeight = dimensions.height - dimensions.headerHeight - 4;

  // Scroll track
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);

  // Scroll thumb
  const thumbHeight = Math.max(20, (visibleRows / totalRows) * scrollBarHeight);
  const thumbY = scrollBarY + (currentStartRow / totalRows) * scrollBarHeight;
  
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(scrollBarX + 1, thumbY, scrollBarWidth - 2, thumbHeight);

  ctx.restore();
}

/**
 * Draw sort arrow indicator
 */
function drawSortArrow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'asc' | 'desc'
): void {
  ctx.save();
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();

  const size = 4;
  if (direction === 'asc') {
    // Up arrow
    ctx.moveTo(x, y + size);
    ctx.lineTo(x + size, y - size);
    ctx.lineTo(x - size, y - size);
  } else {
    // Down arrow
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y + size);
    ctx.lineTo(x - size, y + size);
  }
  
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * Get color for score values (green for high, red for low)
 */
function getScoreColor(score: number): string {
  if (score >= 80) return '#059669'; // Green
  if (score >= 60) return '#d97706'; // Orange
  if (score >= 40) return '#dc2626'; // Red
  return '#6b7280'; // Gray
}

/**
 * Sort table rows by column
 */
function sortRows(
  rows: TargetReportRow[],
  column: keyof TargetReportRow,
  direction: 'asc' | 'desc'
): TargetReportRow[] {
  return [...rows].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    
    let comparison = 0;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
      comparison = aVal.getTime() - bVal.getTime();
    }
    
    return direction === 'desc' ? -comparison : comparison;
  });
}

/**
 * Check if mouse position is within table bounds
 */
export function getTableCellAtPosition(
  mouseX: number,
  mouseY: number,
  dimensions: TableDimensions,
  visibleRowCount: number
): { row: number; column: number } | null {
  // Check if mouse is within table bounds
  if (mouseX < dimensions.x || mouseX > dimensions.x + dimensions.width ||
      mouseY < dimensions.y || mouseY > dimensions.y + dimensions.height) {
    return null;
  }

  // Check if in header
  if (mouseY < dimensions.y + dimensions.headerHeight) {
    const column = getColumnIndexAtX(mouseX - dimensions.x);
    return { row: -1, column }; // -1 indicates header row
  }

  // Check if in data area
  const dataY = mouseY - (dimensions.y + dimensions.headerHeight);
  const row = Math.floor(dataY / dimensions.rowHeight);
  
  if (row >= 0 && row < visibleRowCount) {
    const column = getColumnIndexAtX(mouseX - dimensions.x);
    return { row, column };
  }

  return null;
}

/**
 * Get column index from X position
 */
function getColumnIndexAtX(x: number): number {
  let currentX = 0;
  for (let i = 0; i < TABLE_COLUMNS.length; i++) {
    currentX += TABLE_COLUMNS[i].width;
    if (x <= currentX) {
      return i;
    }
  }
  return TABLE_COLUMNS.length - 1;
}

/**
 * Generate dummy target report data for testing
 */
export function generateDummyTargetReportData(): TargetReportRow[] {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX', 'AMD', 'INTC'];
  
  return symbols.map(symbol => {
    const scores = {
      acceleration: Math.random() * 100,
      momentum: Math.random() * 100,
      intrinsic: Math.random() * 100,
      relative: Math.random() * 100
    };
    
    const compositeScore = (scores.acceleration + scores.momentum + scores.intrinsic + scores.relative) / 4;
    const successScore = Math.random() * 100; // Dick's Conviction formula
    
    return {
      symbol,
      successScore,
      accelerationScore: scores.acceleration,
      momentumScore: scores.momentum,
      intrinsicStrengthScore: scores.intrinsic,
      relativeStrengthScore: scores.relative,
      compositeScore,
      triggerType: Math.random() > 0.5 ? 'Long Entry' : 'Short Entry',
      triggerPrice: 100 + Math.random() * 500,
      triggerDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      triggerTime: `${Math.floor(Math.random() * 12) + 1}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`
    };
  });
}

// Default settings
export const defaultTargetReportTableSettings: TargetReportTableSettings = {
  enabled: true,
  height: 300,
  sortableColumns: true,
  showTooltips: true,
  alternatingRowShading: true,
  maxVisibleRows: 12,
  sortColumn: 'successScore',
  sortDirection: 'desc',
  highlightedRow: null
};
