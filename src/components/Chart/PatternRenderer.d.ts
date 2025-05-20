import { Pattern } from '../../models/PatternTypes';

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

interface PatternRendererProps {
  ctx: CanvasRenderingContext2D;
  patterns: Pattern[];
  timeScale: {
    scale: (date: Date) => number;
    invert: (pixel: number) => Date;
    ticks: (count?: number) => Date[];
  };
  priceScale: {
    scale: (price: number) => number;
    invert: (pixel: number) => number;
    ticks: (count?: number) => number[];
  };
  dimensions: ChartDimensions;
  selectedPattern: Pattern | null;
}

// Define the interface for the pattern renderer
declare const PatternRenderer: {
  render(ctx: CanvasRenderingContext2D, 
         patterns: Pattern[], 
         timeScale: any, 
         priceScale: any, 
         dimensions: ChartDimensions, 
         selectedPattern?: Pattern | null): void;
};
export default PatternRenderer;
