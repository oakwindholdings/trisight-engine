// src/components/Chart/ConvictionCloudRenderer.tsx
// Canvas-based renderer for TriSight Conviction Clouds
// Renders score-weighted signal aggregations as dynamic label clouds

import { logConvictionCloudRender, measureRenderPerformance } from './RenderDiagnostics';
import { emitPatternFeedSignal } from '../../framework/emitPatternFeedSignal';

export interface ConvictionCloudItem {
  symbol: string;
  convictionRating: number; // 0-100
  confidenceLevel: number; // 0-1
  traction: number;
  timing: number;
  riskRating: number;
  signalCount: number;
  patternTypes: string[];
  lastUpdated: Date;
}

interface ConvictionCloudSettings {
  enabled: boolean;
  anchorPosition: 'top-left' | 'top-right';
  maxItems: number;
  sortMode: 'conviction' | 'traction' | 'timing' | 'risk';
  showHoverDetails: boolean;
  minConvictionThreshold: number; // 0-100
}

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface CloudPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  item: ConvictionCloudItem;
}

/**
 * Main conviction cloud renderer - creates score-weighted label cloud
 */
export const renderConvictionCloud = (
  ctx: CanvasRenderingContext2D,
  items: ConvictionCloudItem[],
  dimensions: { width: number; height: number; margin: { top: number; right: number; bottom: number; left: number } },
  settings: ConvictionCloudSettings = defaultConvictionCloudSettings,
  hoveredItem: ConvictionCloudItem | null = null
): CloudPosition[] => {
  // Check localStorage for ConvictionCloud visibility setting from ChartSettingsPanel
  const showConvictionCloudSetting = localStorage.getItem('trisight.chart.showConvictionCloud');
  const isVisibilityEnabled = showConvictionCloudSetting ? JSON.parse(showConvictionCloudSetting) : false; // Default off
  
  // Override settings.enabled with localStorage visibility setting
  const effectiveSettings = {
    ...settings,
    enabled: settings.enabled && isVisibilityEnabled
  };
  
  // 🔍 RENDER VISIBILITY AUDIT: Early exit logging
  if (!items?.length || !effectiveSettings.enabled) {
    if (!isVisibilityEnabled) {
      console.log('[ConvictionCloud] 🔍 AUDIT: ConvictionCloud disabled via Chart Settings - renderer not invoked');
    } else {
      console.log('[ConvictionCloud] 🔍 AUDIT: No items to render - renderer not invoked');
    }
    return [];
  }

  // 🔍 RENDER VISIBILITY AUDIT: Log rendering activity
  const cloudArea = calculateCloudArea(dimensions, settings.anchorPosition);
  const canvasCoords = {
    x: cloudArea.x,
    y: cloudArea.y,
    width: cloudArea.width,
    height: cloudArea.height
  };
  
  logConvictionCloudRender(items, canvasCoords, hoveredItem);

  ctx.save();

  // Filter and sort items based on settings
  const filteredItems = items
    .filter(item => item.convictionRating >= settings.minConvictionThreshold)
    .sort((a, b) => {
      switch (settings.sortMode) {
        case 'conviction': return b.convictionRating - a.convictionRating;
        case 'traction': return b.traction - a.traction;
        case 'timing': return b.timing - a.timing;
        case 'risk': return a.riskRating - b.riskRating; // Lower risk is better
        default: return b.convictionRating - a.convictionRating;
      }
    })
    .slice(0, settings.maxItems);

  // Emit feed signal once per render with aggregate strength (dev)
  if (filteredItems.length) {
    emitPatternFeedSignal('CMC', { itemCount: filteredItems.length }, filteredItems[0].symbol);
    console.log('[DEBUG] CMC rendered with', filteredItems.length, 'items');
  }

  // Generate positions for cloud items with collision detection
  const positions = measureRenderPerformance('ConvictionCloud Item Positioning', () => {
    console.log(`[ConvictionCloud] 🎯 AUDIT: Positioning ${filteredItems.length} labels at canvas coordinates (${cloudArea.x}, ${cloudArea.y})`);
    return generateCloudPositions(ctx, filteredItems, cloudArea, effectiveSettings);
  });

  // Render cloud items
  measureRenderPerformance('ConvictionCloud Items Rendering', () => {
    positions.forEach(position => {
      renderCloudItem(ctx, position, position.item === hoveredItem);
    });
  });

  // Render hover details if enabled
  if (hoveredItem && effectiveSettings.showHoverDetails) {
    const hoveredPosition = positions.find(p => p.item === hoveredItem);
    if (hoveredPosition) {
      console.log(`[ConvictionCloud] 🔍 AUDIT: Rendering hover details for ${hoveredItem.symbol}`);
      renderHoverDetails(ctx, hoveredPosition, dimensions);
    }
  }

  ctx.restore();
  return positions;
}

/**
 * Calculate cloud area based on anchor position
 */
function calculateCloudArea(
  dimensions: ChartDimensions,
  anchorPosition: 'top-left' | 'top-right'
): { x: number; y: number; width: number; height: number } {
  const cloudWidth = 280;
  const cloudHeight = 120;
  const padding = 20;

  switch (anchorPosition) {
    case 'top-left':
      return {
        x: dimensions.margin.left + padding,
        y: dimensions.margin.top + padding,
        width: cloudWidth,
        height: cloudHeight
      };
    case 'top-right':
      return {
        x: dimensions.width - dimensions.margin.right - cloudWidth - padding,
        y: dimensions.margin.top + padding,
        width: cloudWidth,
        height: cloudHeight
      };
    default:
      return {
        x: dimensions.margin.left + padding,
        y: dimensions.margin.top + padding,
        width: cloudWidth,
        height: cloudHeight
      };
  }
}

/**
 * Generate positions for cloud items with collision detection
 */
function generateCloudPositions(
  ctx: CanvasRenderingContext2D,
  items: ConvictionCloudItem[],
  cloudArea: { x: number; y: number; width: number; height: number },
  settings: ConvictionCloudSettings
): CloudPosition[] {
  const positions: CloudPosition[] = [];
  const padding = 8;

  // 🔍 AUDIT: Measure render performance
  measureRenderPerformance('ConvictionCloud Item Positioning', () => {
    console.log(`[ConvictionCloud] 🎯 AUDIT: Positioning ${items.length} labels at canvas coordinates (${cloudArea.x}, ${cloudArea.y})`);
    
    items.forEach((item, index) => {
      // Calculate font size based on conviction rating (10px-26px range)
      const fontSize = Math.max(10, Math.min(26, 10 + (item.convictionRating / 100) * 16));
      
      // Calculate color based on confidence level (yellow to emerald gradient)
      const color = getConfidenceColor(item.confidenceLevel);
      
      // Set font for text measurement
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      const textWidth = ctx.measureText(item.symbol).width;
      const textHeight = fontSize;
      
      // Find position with collision avoidance
      const position = findNonCollidingPosition(
        {
          x: cloudArea.x,
          y: cloudArea.y,
          width: textWidth + padding * 2,
          height: textHeight + padding * 2,
          fontSize,
          color,
          item
        },
        positions,
        cloudArea,
        padding
      );
      
      if (position) {
        positions.push(position);
      }
    });
  }); // End performance measurement

  return positions;
}

/**
 * Find non-colliding position for cloud item
 */
function findNonCollidingPosition(
  candidate: CloudPosition,
  existingPositions: CloudPosition[],
  cloudArea: { x: number; y: number; width: number; height: number },
  padding: number
): CloudPosition | null {
  const maxAttempts = 50;
  let attempts = 0;

  while (attempts < maxAttempts) {
    // Random position within cloud area
    const x = cloudArea.x + Math.random() * (cloudArea.width - candidate.width);
    const y = cloudArea.y + Math.random() * (cloudArea.height - candidate.height);
    
    const testPosition = { ...candidate, x, y };
    
    // Check for collisions with existing positions
    const hasCollision = existingPositions.some(existing => 
      isRectColliding(testPosition, existing, padding)
    );
    
    if (!hasCollision) {
      return testPosition;
    }
    
    attempts++;
  }
  
  // If no non-colliding position found, return a position anyway (with reduced priority)
  return {
    ...candidate,
    x: cloudArea.x + (attempts % 3) * (candidate.width + padding),
    y: cloudArea.y + Math.floor(attempts / 3) * (candidate.height + padding)
  };
}

/**
 * Check if two rectangles are colliding
 */
function isRectColliding(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number },
  padding: number
): boolean {
  return !(
    rect1.x + rect1.width + padding < rect2.x ||
    rect2.x + rect2.width + padding < rect1.x ||
    rect1.y + rect1.height + padding < rect2.y ||
    rect2.y + rect2.height + padding < rect1.y
  );
}

/**
 * Render individual cloud item
 */
function renderCloudItem(
  ctx: CanvasRenderingContext2D,
  position: CloudPosition,
  isHovered: boolean
): void {
  ctx.save();

  // Draw background if hovered
  if (isHovered) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(
      position.x - 4,
      position.y - 4,
      position.width + 8,
      position.height + 8
    );
    
    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      position.x - 4,
      position.y - 4,
      position.width + 8,
      position.height + 8
    );
  }

  // Set font and color
  ctx.font = `bold ${position.fontSize}px Inter, sans-serif`;
  ctx.fillStyle = position.color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw symbol text
  ctx.fillText(
    position.item.symbol,
    position.x + position.width / 2,
    position.y + position.height / 2
  );

  // Draw conviction rating as small overlay
  ctx.font = `${Math.max(8, position.fontSize * 0.4)}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(
    position.item.convictionRating.toString(),
    position.x + position.width - 8,
    position.y + 8
  );

  ctx.restore();
}

/**
 * Render hover details for expanded information
 */
function renderHoverDetails(
  ctx: CanvasRenderingContext2D,
  position: CloudPosition,
  dimensions: ChartDimensions
): void {
  ctx.save();

  const item = position.item;
  const detailsWidth = 200;
  const detailsHeight = 120;
  
  // Position details box to avoid going off-screen
  let detailsX = position.x + position.width + 10;
  let detailsY = position.y;
  
  if (detailsX + detailsWidth > dimensions.width - dimensions.margin.right) {
    detailsX = position.x - detailsWidth - 10;
  }
  
  if (detailsY + detailsHeight > dimensions.height - dimensions.margin.bottom) {
    detailsY = dimensions.height - dimensions.margin.bottom - detailsHeight - 10;
  }

  // Draw details background
  ctx.fillStyle = 'rgba(30, 30, 30, 0.95)';
  ctx.fillRect(detailsX, detailsY, detailsWidth, detailsHeight);
  
  // Draw border
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1;
  ctx.strokeRect(detailsX, detailsY, detailsWidth, detailsHeight);

  // Draw details text
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const textX = detailsX + 12;
  let textY = detailsY + 12;
  const lineHeight = 16;
  
  ctx.fillText(`${item.symbol} - Conviction Analysis`, textX, textY);
  textY += lineHeight + 4;
  
  ctx.fillStyle = '#e5e7eb';
  ctx.font = '11px Inter, sans-serif';
  
  ctx.fillText(`Conviction: ${item.convictionRating}/100`, textX, textY);
  textY += lineHeight;
  
  ctx.fillText(`Traction: ${item.traction.toFixed(1)}`, textX, textY);
  textY += lineHeight;
  
  ctx.fillText(`Timing: ${item.timing.toFixed(1)}`, textX, textY);
  textY += lineHeight;
  
  ctx.fillText(`Risk: ${item.riskRating.toFixed(1)}`, textX, textY);
  textY += lineHeight;
  
  ctx.fillText(`Signals: ${item.signalCount} (${item.patternTypes.join(', ')})`, textX, textY);

  ctx.restore();
}

/**
 * Get color based on confidence level (yellow to emerald gradient)
 */
function getConfidenceColor(confidence: number): string {
  // Clamp confidence to 0-1 range
  const normalizedConfidence = Math.max(0, Math.min(1, confidence));
  
  // Yellow to emerald gradient
  const r = Math.round(255 - (255 - 16) * normalizedConfidence);  // 255 -> 16
  const g = Math.round(255 - (255 - 185) * normalizedConfidence); // 255 -> 185
  const b = Math.round(0 + (129 - 0) * normalizedConfidence);     // 0 -> 129
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Check if mouse position is within cloud item bounds
 */
export function getCloudItemAtPosition(
  positions: CloudPosition[],
  mouseX: number,
  mouseY: number
): ConvictionCloudItem | null {
  for (const position of positions) {
    if (
      mouseX >= position.x &&
      mouseX <= position.x + position.width &&
      mouseY >= position.y &&
      mouseY <= position.y + position.height
    ) {
      return position.item;
    }
  }
  return null;
}

/**
 * Generate dummy conviction data for testing
 */
export function generateDummyConvictionData(): ConvictionCloudItem[] {
  const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 'NVDA', 'META', 'NFLX'];
  
  return symbols.map(symbol => ({
    symbol,
    convictionRating: Math.floor(Math.random() * 100),
    confidenceLevel: Math.random(),
    traction: Math.random() * 10,
    timing: Math.random() * 10,
    riskRating: Math.random() * 10,
    signalCount: Math.floor(Math.random() * 8) + 1,
    patternTypes: ['Escalator', 'Rocketman', 'Pivot'].slice(0, Math.floor(Math.random() * 3) + 1),
    lastUpdated: new Date()
  }));
}

// Default settings
export const defaultConvictionCloudSettings: ConvictionCloudSettings = {
  enabled: true,
  anchorPosition: 'top-left',
  maxItems: 8,
  sortMode: 'conviction',
  showHoverDetails: true,
  minConvictionThreshold: 20
};
