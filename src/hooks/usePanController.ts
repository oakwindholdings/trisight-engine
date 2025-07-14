// src/hooks/usePanController.ts
// Handles pan/drag interactions for chart navigation
// Manages momentum-based scrolling and boundary constraints

import { useCallback, useRef, useEffect } from 'react';
import { throttle, GESTURE_THROTTLE_CONFIG } from '../utils/gestureThrottle';

export interface PanState {
  isPanning: boolean;
  startX: number;
  previousTranslateX: number;
  translateX: number;
  momentum: number;
}

export const usePanController = (
  panState: PanState,
  setPanState: React.Dispatch<React.SetStateAction<PanState>>,
  onPanUpdate: (translateX: number) => void,
  targetCandles: number = 100
) => {
  const animationRef = useRef<number | null>(null);
  const translateXRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimeRef = useRef(0);
  const startXRef = useRef(0);
  const lastClientXRef = useRef(0);

  // Handle momentum animation
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.1) {
      velocityRef.current = 0;
      return;
    }

    // Apply friction
    velocityRef.current *= 0.92;
    
    translateXRef.current += velocityRef.current;

    setPanState(prev => ({
      ...prev,
      translateX: translateXRef.current
    }));

    onPanUpdate(translateXRef.current);

    if (Math.abs(velocityRef.current) > 0.5) {
      animationRef.current = requestAnimationFrame(animateMomentum);
    }
  }, [setPanState, onPanUpdate]);

  // Raw pan update logic
  const _updatePanImpl = useCallback((clientX: number) => {
    console.log('[PanDebug] updatePanImpl called with clientX:', clientX);
    if (!panState.isPanning) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const deltaX = clientX - startXRef.current;
    const deltaX_frame = clientX - lastClientXRef.current;
    const newTranslateX = translateXRef.current + deltaX;

    // Calculate velocity for momentum
    if (deltaTime > 0) {
      // Reduced velocity calculation with zoom-aware damping
      const baseDamping = 0.1;
      const zoomDamping = 100 / targetCandles;
      const dampingFactor = baseDamping / zoomDamping;
      velocityRef.current = (deltaX_frame / deltaTime * 16) * dampingFactor; // Increased from 16
    }

    lastTimeRef.current = currentTime;
    lastClientXRef.current = clientX;

    setPanState(prev => ({
      ...prev,
      translateX: newTranslateX
    }));

    onPanUpdate(newTranslateX);
  }, [panState.isPanning, setPanState, onPanUpdate, targetCandles]);

  // Throttled pan update
  // const updatePan = useRef(
  //   throttle(_updatePanImpl, GESTURE_THROTTLE_CONFIG.PAN_DEBOUNCE_MS)
  // ).current;

  const endPanRef = useRef<() => void>(null);
  const globalMouseMoveRef = useRef<((e: MouseEvent) => void) | null>(null);
  const globalMouseUpRef = useRef<((e: MouseEvent) => void) | null>(null);
  const globalMouseLeaveRef = useRef<((e: MouseEvent) => void) | null>(null);

  // Stable global handlers
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    e.preventDefault();
    _updatePanImpl(e.clientX); // Direct call instead of throttled
  }, [_updatePanImpl]);

  const handleGlobalMouseUp = useCallback((e: MouseEvent) => {
    e.preventDefault();
    endPanRef.current?.();
  }, []);

  const handleGlobalMouseLeave = useCallback((e: MouseEvent) => {
    e.preventDefault();
    endPanRef.current?.();
  }, []);

  // End panning
  const endPan = useCallback(() => {
    console.log('[PanDebug] endPan called, isPanning:', panState.isPanning);
    if (!panState.isPanning) return;

    setPanState(prev => ({
      ...prev,
      isPanning: false,
      previousTranslateX: translateXRef.current,
      translateX: translateXRef.current
    }));

    if (Math.abs(velocityRef.current) > 0.1) {
      animationRef.current = requestAnimationFrame(animateMomentum);
    }

    console.log('[PanDebug] Removing global listeners');
    document.removeEventListener('mousemove', handleGlobalMouseMove);
    document.removeEventListener('mouseup', handleGlobalMouseUp);
    document.removeEventListener('mouseleave', handleGlobalMouseLeave);

    globalMouseMoveRef.current = null;
    globalMouseUpRef.current = null;
    globalMouseLeaveRef.current = null;
  }, [panState.isPanning, setPanState, animateMomentum, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalMouseLeave]);

  // Assign endPan to ref
  useEffect(() => {
    endPanRef.current = endPan;
  }, [endPan]);

  // Start panning
  const startPan = useCallback((clientX: number) => {
    console.log('[PanDebug] startPan called with clientX:', clientX);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    startXRef.current = clientX;
    lastClientXRef.current = clientX;
    translateXRef.current = panState.translateX;
    velocityRef.current = 0;
    lastTimeRef.current = Date.now();

    setPanState(prev => ({
      ...prev,
      isPanning: true,
      startX: clientX,
      previousTranslateX: prev.translateX,
      translateX: prev.translateX,
      momentum: 0
    }));

    globalMouseMoveRef.current = handleGlobalMouseMove;
    globalMouseUpRef.current = handleGlobalMouseUp;
    globalMouseLeaveRef.current = handleGlobalMouseLeave;

    console.log('[PanDebug] Adding global listeners');
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mouseleave', handleGlobalMouseLeave);
  }, [setPanState, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalMouseLeave, panState.translateX]);

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    console.log('[PanDebug] handleMouseDown triggered');
    e.preventDefault();
    startPan(e.clientX);
  }, [startPan]);

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
      console.log('[PanDebug] isPanning became true - adding listeners');
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseLeave);
      globalMouseMoveRef.current = handleGlobalMouseMove;
      globalMouseUpRef.current = handleGlobalMouseUp;
      globalMouseLeaveRef.current = handleGlobalMouseLeave;
    } else {
      console.log('[PanDebug] isPanning became false - removing listeners');
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
      globalMouseMoveRef.current = null;
      globalMouseUpRef.current = null;
      globalMouseLeaveRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseLeave);
    };
  }, [panState.isPanning, handleGlobalMouseMove, handleGlobalMouseUp, handleGlobalMouseLeave]);

  useEffect(() => { return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); }; }, []);

  return {
    handleMouseDown,
    handleMouseUp: globalMouseUpRef.current,
    handleMouseLeave: globalMouseLeaveRef.current,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning: panState.isPanning
  };
};
