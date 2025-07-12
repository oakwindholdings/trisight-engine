// src/components/Chart/controllers/PanController.ts
// Handles mouse drag panning and momentum
// Provides event handlers for pan interactions
import { useRef, useCallback, useEffect } from 'react';

export interface PanState {
  isPanning: boolean;
  startX: number;
  previousTranslateX: number;
  translateX: number;
  momentum: number;
}

export function usePanController(
  panState: PanState,
  setPanState: React.Dispatch<React.SetStateAction<PanState>>,
  updateVisibleRangeFromPan: (tx: number) => void
) {
  const momentumRAF = useRef(0);
  const panTimeStamp = useRef(0);
  const previousPanX = useRef(0);
  const currentMomentumRef = useRef(0);
  const currentTranslateXRef = useRef(0);

  const applyPanMomentum = useCallback(() => {
    currentMomentumRef.current *= 0.95;
    currentTranslateXRef.current += currentMomentumRef.current;
    setPanState(prev => ({ ...prev, translateX: currentTranslateXRef.current, momentum: currentMomentumRef.current }));
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    if (Math.abs(currentMomentumRef.current) > 0.1) {
      momentumRAF.current = requestAnimationFrame(applyPanMomentum);
    } else {
      momentumRAF.current = 0;
    }
  }, [setPanState, updateVisibleRangeFromPan]);

  const handleDocumentMouseMove = useCallback((e: MouseEvent) => {
    if (!panState.isPanning) return;
    const x = e.clientX;
    const dx = x - panState.startX;
    // Apply damping factor to reduce sensitivity
    const dampingFactor = 0.3;
    const dampedDx = dx * dampingFactor;
    currentTranslateXRef.current = panState.previousTranslateX + dampedDx;
    const now = Date.now();
    const dt = now - panTimeStamp.current;
    if (dt > 0) {
      const velocity = (x - previousPanX.current) / dt;
      // Reduce momentum sensitivity with damping
      currentMomentumRef.current = velocity * 15 * dampingFactor;
    }
    panTimeStamp.current = now;
    previousPanX.current = x;
    setPanState(prev => ({ ...prev, translateX: currentTranslateXRef.current, momentum: currentMomentumRef.current }));
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    e.preventDefault();
  }, [panState, setPanState, updateVisibleRangeFromPan]);

  const handleMouseUp = useCallback(() => {
    setPanState(prev => ({ ...prev, isPanning: false }));
    if (Math.abs(panState.momentum) > 1) {
      currentMomentumRef.current = panState.momentum;
      currentTranslateXRef.current = panState.translateX;
      applyPanMomentum();
    }
    document.removeEventListener('mousemove', handleDocumentMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [panState, setPanState, applyPanMomentum, handleDocumentMouseMove]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const mouseX = e.clientX;
    if (momentumRAF.current) {
      cancelAnimationFrame(momentumRAF.current);
      momentumRAF.current = 0;
    }
    setPanState(prev => ({ ...prev, isPanning: true, startX: mouseX, previousTranslateX: prev.translateX, momentum: 0 }));
    panTimeStamp.current = Date.now();
    previousPanX.current = mouseX;
    document.addEventListener('mousemove', handleDocumentMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  }, [setPanState, handleDocumentMouseMove, handleMouseUp]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!panState.isPanning) return;
    const x = e.clientX;
    const dx = x - panState.startX;
    const dampingFactor = 0.3;
    const dampedDx = dx * dampingFactor;
    currentTranslateXRef.current = panState.previousTranslateX + dampedDx;
    const now = Date.now();
    const dt = now - panTimeStamp.current;
    if (dt > 0) {
      const velocity = (x - previousPanX.current) / dt;
      currentMomentumRef.current = velocity * 15 * dampingFactor;
    }
    panTimeStamp.current = now;
    previousPanX.current = x;
    setPanState(prev => ({ ...prev, translateX: currentTranslateXRef.current, momentum: currentMomentumRef.current }));
    updateVisibleRangeFromPan(currentTranslateXRef.current);
    e.preventDefault();
  }, [panState, setPanState, updateVisibleRangeFromPan]);

  const handleMouseLeave = useCallback(() => {}, []);

  useEffect(() => {
    return () => {
      if (momentumRAF.current) cancelAnimationFrame(momentumRAF.current);
    };
  }, []);

  return { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave };
}
