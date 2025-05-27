// src/components/Chart/CanvasManager.ts
// Creates and resizes chart canvases
// Provides references for double-buffer drawing
import { useRef, useEffect } from 'react';

export function useCanvasManager(width: number, height: number) {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternsCanvasRef = useRef<HTMLCanvasElement>(null);
  const interactionCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvases = [
      mainCanvasRef.current,
      bufferCanvasRef.current,
      patternsCanvasRef.current,
      interactionCanvasRef.current
    ];
    canvases.forEach(canvas => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    });
  }, [width, height]);

  return { mainCanvasRef, bufferCanvasRef, patternsCanvasRef, interactionCanvasRef };
}
