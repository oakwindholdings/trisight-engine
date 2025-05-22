// src/components/Chart/PriceAxis.d.ts
// Type defs for PriceAxis
// Matches canvas implementation
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

interface PriceAxisProps {
  ctx: CanvasRenderingContext2D;
  priceScale: {
    scale: (price: number) => number;
    invert: (pixel: number) => number;
    ticks: (count?: number) => number[];
  };
  dimensions: ChartDimensions;
}

// Define the interface for the price axis renderer
declare const PriceAxis: {
  render(ctx: CanvasRenderingContext2D, priceScale: any, dimensions: ChartDimensions): void;
};

export default PriceAxis;
