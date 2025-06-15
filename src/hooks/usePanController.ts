// src/hooks/usePanController.ts
// Handles pan/drag interactions for chart navigation
// Manages momentum-based scrolling and boundary constraints

import { useCallback, useRef, useEffect } from 'react';

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
  const lastTimeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);

  // Handle momentum animation
  const animateMomentum = useCallback(() => {
    if (Math.abs(velocityRef.current) < 0.1) {
      velocityRef.current = 0;
      return;
    }

    // Apply friction
    velocityRef.current *= 0.95;
    
    setPanState(prev => {
      const newTranslateX = prev.translateX + velocityRef.current;
      onPanUpdate(newTranslateX);
      return {
        ...prev,
        translateX: newTranslateX
      };
    });

    animationRef.current = requestAnimationFrame(animateMomentum);
  }, [setPanState, onPanUpdate]);

  // Start panning
  const startPan = useCallback((clientX: number) => {
    // Cancel any ongoing momentum animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    velocityRef.current = 0;
    lastTimeRef.current = Date.now();

    setPanState(prev => ({
      ...prev,
      isPanning: true,
      startX: clientX,
      previousTranslateX: prev.translateX,
      momentum: 0
    }));
  }, [setPanState]);

  // Update pan position
  const updatePan = useCallback((clientX: number) => {
    if (!panState.isPanning) return;

    const currentTime = Date.now();
    const deltaTime = currentTime - lastTimeRef.current;
    const deltaX = clientX - panState.startX;
    const newTranslateX = panState.previousTranslateX + deltaX;

    // Calculate velocity for momentum
    if (deltaTime > 0) {
      // Reduced velocity calculation with zoom-aware damping
      const baseDamping = 0.3;
      const zoomDamping = Math.min(100 / targetCandles, 2); // More damping when fewer candles visible
      const dampingFactor = baseDamping / zoomDamping;
      velocityRef.current = (deltaX / deltaTime * 16) * dampingFactor; // Normalize to 60fps with damping
    }

    lastTimeRef.current = currentTime;

    setPanState(prev => ({
      ...prev,
      translateX: newTranslateX
    }));

    onPanUpdate(newTranslateX);
  }, [panState.isPanning, panState.startX, panState.previousTranslateX, setPanState, onPanUpdate, targetCandles]);

  // End panning
  const endPan = useCallback(() => {
    if (!panState.isPanning) return;

    setPanState(prev => ({
      ...prev,
      isPanning: false,
      previousTranslateX: prev.translateX
    }));

    // Start momentum animation if there's velocity
    if (Math.abs(velocityRef.current) > 0.1) {
      animationRef.current = requestAnimationFrame(animateMomentum);
    }
  }, [panState.isPanning, setPanState, animateMomentum]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    startPan(e.clientX);
  }, [startPan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    updatePan(e.clientX);
  }, [updatePan]);

  const handleMouseUp = useCallback(() => {
    endPan();
  }, [endPan]);

  const handleMouseLeave = useCallback(() => {
    endPan();
  }, [endPan]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      startPan(e.touches[0].clientX);
    }
  }, [startPan]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      updatePan(e.touches[0].clientX);
    }
  }, [updatePan]);

  const handleTouchEnd = useCallback(() => {
    endPan();
  }, [endPan]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isPanning: panState.isPanning
  };
};
