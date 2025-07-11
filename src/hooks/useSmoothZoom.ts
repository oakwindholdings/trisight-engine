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
  const zoomOriginRef = useRef<number | null>(null);
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
      onZoomChange(newZoom, zoomOriginRef.current);
    } else {
      onZoomChange(newZoom);
    }

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [smoothingFactor, onZoomChange]);

  // Raw wheel handler implementation
  const _handleWheelImpl = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const currentTime = Date.now();
    const timeSinceLastWheel = currentTime - lastWheelTimeRef.current;
    
    // Reset accumulated delta if too much time has passed
    if (timeSinceLastWheel > 100) {
      accumulatedDeltaRef.current = 0;
    }
    
    // Accumulate delta for smoother zoom on trackpads
    accumulatedDeltaRef.current += e.deltaY;
    lastWheelTimeRef.current = currentTime;
    
    // Apply zoom based on accumulated delta
    const zoomDelta = -accumulatedDeltaRef.current * zoomSensitivity;
    const zoomMultiplier = Math.exp(zoomDelta);
    
    // Calculate new target zoom
    const newTargetZoom = Math.max(
      minZoom,
      Math.min(maxZoom, targetZoomRef.current * zoomMultiplier)
    );
    
    // Update target zoom
    targetZoomRef.current = newTargetZoom;
    
    // Get mouse position for zoom origin
    const rect = e.currentTarget.getBoundingClientRect();
    const originX = e.clientX - rect.left;
    
    // Store zoom origin for the entire animation
    zoomOriginRef.current = originX;
    
    // Start animation if not already running
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    // Decay accumulated delta
    accumulatedDeltaRef.current *= 0.95;
  }, [minZoom, maxZoom, zoomSensitivity, animate, onZoomChange]);

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
