// src/hooks/useSmoothZoom.ts
// Provides smooth zoom functionality with interpolation
// Handles both discrete scroll and continuous zoom gestures

import { useRef, useCallback, useEffect } from 'react';
import { debounce, GESTURE_THROTTLE_CONFIG } from '../utils/gestureThrottle';

interface SmoothZoomOptions {
  minZoom: number;
  maxZoom: number;
  zoomSensitivity?: number; // How sensitive zoom is to scroll input
  smoothingFactor?: number; // How smooth the zoom animation is (0-1)
  onZoomChange: (newZoom: number, originX?: number) => void;
}

export const useSmoothZoom = (
  currentZoom: number,
  options: SmoothZoomOptions
) => {
  const {
    minZoom,
    maxZoom,
    zoomSensitivity = 0.001, // Much more fine-grained control
    smoothingFactor = 0.15, // Smooth interpolation
    onZoomChange
  } = options;

  // Track target zoom and current animated zoom
  const targetZoomRef = useRef(currentZoom);
  const animatedZoomRef = useRef(currentZoom);
  const animationFrameRef = useRef<number | null>(null);
  const accumulatedDeltaRef = useRef(0);
  const lastWheelTimeRef = useRef(Date.now());
  const zoomOriginRef = useRef<{ x: number; y: number } | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize refs only once
  useEffect(() => {
    if (!isInitializedRef.current) {
      targetZoomRef.current = currentZoom;
      animatedZoomRef.current = currentZoom;
      isInitializedRef.current = true;
    }
  }, [currentZoom]);

  // Smooth animation function
  const animate = useCallback(() => {
    const target = targetZoomRef.current;
    const current = animatedZoomRef.current;
    const diff = target - current;

    // If we're close enough, snap to target
    if (Math.abs(diff) < 0.001) {
      animatedZoomRef.current = target;
      animationFrameRef.current = null;
      return;
    }

    // Interpolate towards target
    const newZoom = current + diff * smoothingFactor;
    animatedZoomRef.current = newZoom;
    
    // Call the zoom change handler with origin if available
    if (zoomOriginRef.current !== null) {
      onZoomChange(newZoom, zoomOriginRef.current.x);
    } else {
      onZoomChange(newZoom);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [smoothingFactor, onZoomChange]);

  // Raw wheel handler implementation
  const _handleWheelImpl = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    // Track mouse position for zoom origin
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    
    // Store the zoom origin immediately
    zoomOriginRef.current = { x: originX, y: e.clientY - rect.top };
    
    // Accumulate zoom delta with sensitivity
    const delta = -e.deltaY * zoomSensitivity;
    accumulatedDeltaRef.current += delta;
    
    // Clear any existing animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // Schedule smooth zoom update
    animationFrameRef.current = requestAnimationFrame(() => {
      if (Math.abs(accumulatedDeltaRef.current) > 0.001) {
        const zoomFactor = 1 + accumulatedDeltaRef.current;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomFactor));
        
        if (newZoom !== currentZoom) {
          // Always pass the current mouse position for proper centering
          onZoomChange(newZoom, originX);
        }
        
        // Apply damping
        accumulatedDeltaRef.current *= 0.95;
        
        // Continue animation if delta is significant
        if (Math.abs(accumulatedDeltaRef.current) > 0.001) {
          animationFrameRef.current = requestAnimationFrame(() => {
            // Don't recursively call handleWheel, just process the accumulated delta
            const zoomFactor = 1 + accumulatedDeltaRef.current;
            const newZoom = Math.max(minZoom, Math.min(maxZoom, currentZoom * zoomFactor));
            
            if (newZoom !== currentZoom) {
              onZoomChange(newZoom, zoomOriginRef.current?.x);
            }
            
            accumulatedDeltaRef.current *= 0.95;
            
            if (Math.abs(accumulatedDeltaRef.current) <= 0.001) {
              accumulatedDeltaRef.current = 0;
            }
          });
        } else {
          accumulatedDeltaRef.current = 0;
        }
      }
    });
  }, [currentZoom, minZoom, maxZoom, onZoomChange, zoomSensitivity]);

  // Debounced wheel handler using configurable delay
  const _debouncedZoomComplete = useRef(
    debounce(() => {
      // Reset accumulated delta and zoom origin when zoom gesture completes
      accumulatedDeltaRef.current = 0;
      zoomOriginRef.current = null;
    }, GESTURE_THROTTLE_CONFIG.ZOOM_DEBOUNCE_MS)
  ).current;

  // Wrapped wheel handler with debounce
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    _handleWheelImpl(e);
    _debouncedZoomComplete();
  }, [_handleWheelImpl, _debouncedZoomComplete]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Direct zoom methods (for buttons, keyboard, etc.)
  const zoomTo = useCallback((newZoom: number, immediate = false) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    
    if (immediate) {
      targetZoomRef.current = clampedZoom;
      animatedZoomRef.current = clampedZoom;
      onZoomChange(clampedZoom);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    } else {
      targetZoomRef.current = clampedZoom;
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    }
  }, [minZoom, maxZoom, animate, onZoomChange]);

  const zoomIn = useCallback(() => {
    zoomTo(targetZoomRef.current * 0.8);
  }, [zoomTo]);

  const zoomOut = useCallback(() => {
    zoomTo(targetZoomRef.current * 1.25);
  }, [zoomTo]);

  const resetZoom = useCallback(() => {
    zoomTo(1, true);
  }, [zoomTo]);

  return {
    handleWheel,
    zoomTo,
    zoomIn,
    zoomOut,
    resetZoom,
    currentZoom: animatedZoomRef.current,
    targetZoom: targetZoomRef.current
  };
};
