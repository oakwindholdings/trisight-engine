// src/hooks/usePanController.ts
// Hook for handling pan gestures on the chart canvas
// Manages pan state and momentum scrolling

import { useState, useCallback, useRef, useEffect } from 'react';
import { logDebug } from '../utils/debug';

const DEBUG_PAN = false; // Toggle for pan debugging

export interface PanState {
  isPanning: boolean;
  startX: number;
  previousTranslateX: number;
  translateX: number;
  momentum: number;
}

interface UsePanControllerProps {
  panState: PanState;
  setPanState: React.Dispatch<React.SetStateAction<PanState>>;
  updateVisibleRangeFromPan: (translateX: number) => void;
  targetCandles: number;
}

const MOMENTUM_DECAY = 0.95;
const MOMENTUM_THRESHOLD = 0.5;
const DOUBLE_CLICK_DELAY = 300; // ms

export const usePanController = (
  panState: PanState,
  setPanState: React.Dispatch<React.SetStateAction<PanState>>,
  updateVisibleRangeFromPan: (translateX: number) => void,
  targetCandles: number
) => {
  const animationFrameRef = useRef<number | null>(null);
  const lastClickTimeRef = useRef<number>(0);
  const globalMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const globalMouseUpRef = useRef<((e: MouseEvent) => void) | null>(null);

  // Add ref to track current pan state to avoid stale closures
  const panStateRef = useRef(panState);
  useEffect(() => {
    panStateRef.current = panState;
  }, [panState]);

  // Momentum animation loop
  useEffect(() => {
    if (Math.abs(panState.momentum) > MOMENTUM_THRESHOLD && !panState.isPanning) {
      const animate = () => {
        setPanState(prev => {
          const newMomentum = prev.momentum * MOMENTUM_DECAY;
          const newTranslateX = prev.translateX + newMomentum;
          
          updateVisibleRangeFromPan(newTranslateX);
          
          if (Math.abs(newMomentum) < MOMENTUM_THRESHOLD) {
            return { ...prev, momentum: 0 };
          }
          
          return {
            ...prev,
            translateX: newTranslateX,
            momentum: newMomentum
          };
        });
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [panState.momentum, panState.isPanning, setPanState, updateVisibleRangeFromPan]);

  // Mouse move handler (global)
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    const currentPanState = panStateRef.current;
    if (!currentPanState.isPanning) return;
      
    const deltaX = e.clientX - currentPanState.startX;
    const newTranslateX = currentPanState.previousTranslateX + deltaX;
      
    // Update visible range outside of setState to prevent infinite loop
      updateVisibleRangeFromPan(newTranslateX);
      
    setPanState(prev => ({
        ...prev,
        translateX: newTranslateX,
        momentum: deltaX * 0.1
    }));
  }, [setPanState, updateVisibleRangeFromPan]);

  // Mouse up handler (global)
  const handleGlobalMouseUp = useCallback(() => {
    endPan();
  }, []);

  // Store refs to avoid stale closures
  useEffect(() => {
    globalMouseMoveRef.current = handleGlobalMouseMove;
    globalMouseUpRef.current = handleGlobalMouseUp;
  }, [handleGlobalMouseMove, handleGlobalMouseUp]);

  // Start pan operation
  const startPan = useCallback((clientX: number) => {
    if (DEBUG_PAN) console.log('[PanDebug] startPan called with clientX:', clientX);
    setPanState(prev => ({
      ...prev,
      isPanning: true,
      startX: clientX,
      previousTranslateX: prev.translateX,
      momentum: 0
    }));
  }, [setPanState]);

  // End pan operation
  const endPan = useCallback(() => {
    const currentPanState = panStateRef.current;
    if (DEBUG_PAN) console.log('[PanDebug] endPan called, isPanning:', currentPanState.isPanning);
    if (currentPanState.isPanning) {
      setPanState(prev => ({
        ...prev,
        isPanning: false,
        previousTranslateX: prev.translateX
      }));
      
      // Remove global listeners immediately
      if (DEBUG_PAN) console.log('[PanDebug] Removing global listeners');
      document.removeEventListener('mousemove', globalMouseMoveRef.current!);
      document.removeEventListener('mouseup', globalMouseUpRef.current!);
    }
  }, [setPanState]);

  // Pan by a specific number of candles (for keyboard navigation)
  const panByCandles = useCallback((candleCount: number) => {
    const chartWidth = window.innerWidth - 120; // Approximate chart width
    const candleWidth = chartWidth / targetCandles;
    const pixelDelta = candleCount * candleWidth;
    
    setPanState(prev => {
      const newTranslateX = prev.translateX - pixelDelta;
      updateVisibleRangeFromPan(newTranslateX);
      
      return {
        ...prev,
        translateX: newTranslateX,
        previousTranslateX: newTranslateX
      };
    });
  }, [targetCandles, setPanState, updateVisibleRangeFromPan]);

  // Arrow key handlers
  const handlePanLeft = useCallback(() => {
    panByCandles(-5);
  }, [panByCandles]);

  const handlePanRight = useCallback(() => {
    panByCandles(5);
  }, [panByCandles]);

  // Add global listeners for pan
  const addGlobalListeners = useCallback(() => {
    if (DEBUG_PAN) console.log('[PanDebug] Adding global listeners');
    document.addEventListener('mousemove', globalMouseMoveRef.current!);
    document.addEventListener('mouseup', globalMouseUpRef.current!);
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (DEBUG_PAN) console.log('[PanDebug] handleMouseDown triggered');
    
    // Check if this might be part of a double-click
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTimeRef.current;
    
    if (timeSinceLastClick < DOUBLE_CLICK_DELAY) {
      if (DEBUG_PAN) console.log('[PanDebug] Potential double-click detected, not starting pan');
      // CRITICAL: End any existing pan to reset cursor state
      endPan();
      return; // Don't start pan for double-clicks
    }
    
    lastClickTimeRef.current = now;
    
    // Only prevent default after confirming this isn't a double-click
    e.preventDefault();
    startPan(e.clientX);
  }, [startPan, endPan]);

  // No local mouse move handler

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startPan(e.touches[0].clientX);
    }
  }, [startPan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // updatePan(e.touches[0].clientX); // This line is removed as per the edit hint
    }
  }, []); // Removed updatePan from dependency array

  const handleTouchEnd = useCallback(() => {
    endPan();
  }, [endPan]);

  // Effect to manage global listeners
  useEffect(() => {
    if (panState.isPanning) {
      if (DEBUG_PAN) console.log('[PanDebug] isPanning became true - adding listeners');
      document.addEventListener('mousemove', globalMouseMoveRef.current!);
      document.addEventListener('mouseup', globalMouseUpRef.current!);
    } else {
      if (DEBUG_PAN) console.log('[PanDebug] isPanning became false - removing listeners');
      document.removeEventListener('mousemove', globalMouseMoveRef.current!);
      document.removeEventListener('mouseup', globalMouseUpRef.current!);
    }

    // Cleanup on unmount
    return () => {
      document.removeEventListener('mousemove', globalMouseMoveRef.current!);
      document.removeEventListener('mouseup', globalMouseUpRef.current!);
    };
  }, [panState.isPanning, globalMouseMoveRef.current, globalMouseUpRef.current]);

  useEffect(() => { return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); }; }, []);

  return {
    handleMouseDown,
    handleMouseMove: (e: React.MouseEvent) => {
      if (panState.isPanning) handleGlobalMouseMove(e.nativeEvent);
    },
    handleMouseUp: (e: React.MouseEvent) => {
      globalMouseUpRef.current?.(e.nativeEvent);
    },
    handleMouseLeave: (e: React.MouseEvent) => {
      // globalMouseLeaveRef.current?.(e.nativeEvent); // This line is removed as per the edit hint
    },
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning: panState.isPanning,
    handlePanLeft: handlePanLeft,
    handlePanRight: handlePanRight,
    endPan: endPan  // Export endPan so it can be called externally
  };
};
