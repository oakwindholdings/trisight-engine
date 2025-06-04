// src/hooks/useSmoothZoom.ts
// Provides smooth zoom functionality with interpolation
// Handles both discrete scroll and continuous zoom gestures

import { useRef, useCallback, useEffect } from 'react';

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
  const lastWheelTimeRef = useRef(0);
  const accumulatedDeltaRef = useRef(0);

  // Update refs when zoom changes externally
  useEffect(() => {
    targetZoomRef.current = currentZoom;
    animatedZoomRef.current = currentZoom;
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
    
    // Call the zoom change handler
    onZoomChange(newZoom);

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [smoothingFactor, onZoomChange]);

  // Handle wheel events with smooth zoom
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
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
    
    // Start animation if not already running
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => {
        animate();
        // Pass origin for first frame
        onZoomChange(animatedZoomRef.current, originX);
      });
    }
    
    // Decay accumulated delta
    accumulatedDeltaRef.current *= 0.95;
  }, [minZoom, maxZoom, zoomSensitivity, animate, onZoomChange]);

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
