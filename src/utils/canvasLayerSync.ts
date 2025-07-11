// src/utils/canvasLayerSync.ts
// Synchronizes all canvas layers after gestures and interactions
// Ensures visual consistency across candles, patterns, signals, and hover layers

import { RefObject } from 'react';

export interface CanvasLayerRefs {
  mainCanvasRef: RefObject<HTMLCanvasElement | null>;
  bufferCanvasRef: RefObject<HTMLCanvasElement | null>;
  patternsCanvasRef: RefObject<HTMLCanvasElement | null>;
  interactionCanvasRef: RefObject<HTMLCanvasElement | null>;
}

export interface SyncLayerOptions {
  redrawMain?: boolean;
  redrawPatterns?: boolean;
  redrawInteraction?: boolean;
  clearBeforeRedraw?: boolean;
  onSyncComplete?: () => void;
}

/**
 * Synchronizes all canvas layers to maintain visual consistency
 * Called after zoom/pan gestures to ensure all layers are aligned
 */
export function syncChartLayers(
  refs: CanvasLayerRefs,
  options: SyncLayerOptions = {}
): void {
  const {
    redrawMain = true,
    redrawPatterns = true,
    redrawInteraction = true,
    clearBeforeRedraw = true,
    onSyncComplete
  } = options;

  // Use requestAnimationFrame to batch redraws
  requestAnimationFrame(() => {
    // Clear canvases if requested
    if (clearBeforeRedraw) {
      clearCanvasLayer(refs.mainCanvasRef);
      clearCanvasLayer(refs.patternsCanvasRef);
      clearCanvasLayer(refs.interactionCanvasRef);
    }

    // Copy buffer to main if main redraw is requested
    if (redrawMain && refs.bufferCanvasRef.current && refs.mainCanvasRef.current) {
      const bufferCtx = refs.bufferCanvasRef.current.getContext('2d');
      const mainCtx = refs.mainCanvasRef.current.getContext('2d');
      
      if (bufferCtx && mainCtx) {
        mainCtx.drawImage(refs.bufferCanvasRef.current, 0, 0);
      }
    }

    // Pattern and interaction layers will be redrawn by their respective components
    // This function just ensures they're cleared and ready for redraw
    
    // Notify completion
    if (onSyncComplete) {
      onSyncComplete();
    }
  });
}

/**
 * Clear a single canvas layer
 */
function clearCanvasLayer(canvasRef: RefObject<HTMLCanvasElement | null>): void {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Force a full redraw of all layers
 * More expensive than sync but ensures complete visual update
 */
export function forceRedrawAllLayers(
  refs: CanvasLayerRefs,
  renderCallback: () => void
): void {
  // Clear all layers first
  Object.values(refs).forEach(ref => clearCanvasLayer(ref));

  // Schedule the render callback
  requestAnimationFrame(() => {
    renderCallback();
  });
}

/**
 * Sync layer dimensions after window resize
 */
export function syncLayerDimensions(
  refs: CanvasLayerRefs,
  width: number,
  height: number,
  dpr: number = window.devicePixelRatio || 1
): void {
  Object.values(refs).forEach(ref => {
    const canvas = ref.current;
    if (!canvas) return;

    // Set display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // Set actual canvas resolution
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Scale context for HiDPI displays
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  });
}

/**
 * Create a debounced sync function for high-frequency updates
 */
export function createDebouncedSync(
  syncFn: () => void,
  delay: number = 16 // ~60fps
): () => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      syncFn();
      timeoutId = null;
    }, delay);
  };
}
