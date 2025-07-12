// src/utils/patternHitDetection.ts
// Pattern hit detection for canvas-based click interactions
// Enables pattern modal activation by detecting clicks on pattern areas

import { Pattern, PatternType } from '../models/PatternTypes';

export interface PatternHitBox {
  pattern: Pattern;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Global pattern hitbox registry
let patternHitBoxes: PatternHitBox[] = [];

/**
 * Register a pattern's clickable area
 * Called during pattern rendering to build hit detection map
 */
export function registerPatternHitBox(
  pattern: Pattern,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  patternHitBoxes.push({
    pattern,
    x,
    y,
    width,
    height
  });
}

/**
 * Clear all registered pattern hitboxes
 * Should be called before each render cycle
 */
export function clearPatternHitBoxes(): void {
  patternHitBoxes = [];
}

/**
 * Get pattern at given canvas coordinates
 * Returns the topmost pattern if multiple overlap
 */
export function getPatternAtPoint(
  x: number,
  y: number,
  margin?: { left: number; top: number }
): Pattern | null {
  // Adjust for chart margins if provided
  const adjustedX = x - (margin?.left || 0);
  const adjustedY = y - (margin?.top || 0);

  // Search from end (topmost rendered patterns) to beginning
  for (let i = patternHitBoxes.length - 1; i >= 0; i--) {
    const hitBox = patternHitBoxes[i];
    
    // Check if point is within hitbox bounds
    if (
      adjustedX >= hitBox.x &&
      adjustedX <= hitBox.x + hitBox.width &&
      adjustedY >= hitBox.y &&
      adjustedY <= hitBox.y + hitBox.height
    ) {
      return hitBox.pattern;
    }
  }

  return null;
}

/**
 * Get all pattern hitboxes for debugging
 */
export function getAllPatternHitBoxes(): PatternHitBox[] {
  return [...patternHitBoxes];
}

/**
 * Calculate expanded hitbox for better click targeting
 * Adds padding around the visual element
 */
export function expandHitBox(
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number = 5
): { x: number; y: number; width: number; height: number } {
  return {
    x: x - padding,
    y: y - padding,
    width: width + padding * 2,
    height: height + padding * 2
  };
}

/**
 * Get recommended hitbox dimensions for pattern type
 */
export function getPatternHitBoxDimensions(
  pattern: Pattern,
  timeScale: any,
  priceScale: any
): { x: number; y: number; width: number; height: number } | null {
  switch (pattern.type) {
    case PatternType.BLACKJACK: {
      // Blackjack patterns render at the center, not at start time
      const centerTime = new Date((pattern.startTime.getTime() + pattern.endTime.getTime()) / 2);
      const centerPrice = (pattern.highPrice + pattern.lowPrice) / 2;
      const x = timeScale(centerTime);
      const y = priceScale(centerPrice);
      // Increase hitbox size to cover the score display and symbols
      return expandHitBox(x - 20, y - 15, 40, 30, 10);
    }
    
    case PatternType.ESCALATOR: {
      // Escalator patterns typically span a range
      const startX = timeScale(pattern.startTime);
      const endX = timeScale(pattern.endTime);
      const centerX = (startX + endX) / 2;
      const y = priceScale(pattern.lowPrice);
      const width = Math.abs(endX - startX);
      return expandHitBox(centerX - width/2, y - 15, width, 30, 8);
    }
    
    case PatternType.PIVOT: {
      const x = timeScale(pattern.startTime);
      const y = priceScale(pattern.lowPrice);
      return expandHitBox(x - 20, y - 20, 40, 40, 5);
    }
    
    case PatternType.ROCKETMAN: {
      const x = timeScale(pattern.startTime);
      const y = priceScale(pattern.highPrice);
      return expandHitBox(x - 15, y - 30, 30, 35, 5);
    }
    
    case PatternType.GOLDMINE_CHANNEL:
    case PatternType.GOLDMINE_SHAFT: {
      const startX = timeScale(pattern.startTime);
      const endX = timeScale(pattern.endTime);
      const topY = priceScale(pattern.highPrice);
      const bottomY = priceScale(pattern.lowPrice);
      const width = Math.abs(endX - startX);
      const height = Math.abs(bottomY - topY);
      // Position hitbox to cover the entire channel/shaft area
      return expandHitBox(Math.min(startX, endX), Math.min(topY, bottomY), width, height, 5);
    }
    
    case PatternType.GOLDEN_CANDLE: {
      const x = timeScale(pattern.startTime);
      const y = priceScale(pattern.highPrice);
      return expandHitBox(x - 10, y - 20, 20, 40, 5);
    }
    
    default:
      return null;
  }
}
