// src/components/Chart/TimeAxis.d.ts
// Type defs for TimeAxis
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

interface TimeAxisProps {
  ctx: CanvasRenderingContext2D;
  timeScale: {
    scale: (date: Date) => number;
    invert: (pixel: number) => Date;
    ticks: (count?: number) => Date[];
  };
  dimensions: ChartDimensions;
  timeframe: string;
  showOnlyTradingHours?: boolean;
}

// Define the interface for the time axis renderer
declare const TimeAxis: {
  render(ctx: CanvasRenderingContext2D, 
         timeScale: any, 
         dimensions: ChartDimensions, 
         timeframe: string, 
         showOnlyTradingHours?: boolean): void;
};

export default TimeAxis;
