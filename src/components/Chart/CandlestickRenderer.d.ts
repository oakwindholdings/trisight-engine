// src/components/Chart/CandlestickRenderer.d.ts
// Type defs for CandlestickRenderer
// Matches canvas implementation
import { CandlestickData } from '../../models/ChartTypes';


interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showingTradingHoursOnly?: boolean;
}

interface CandlestickRendererProps {
  data: CandlestickData[];
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
}

// Use a namespace to avoid duplicate identifier errors
declare namespace CandlestickRendererTypes {
  interface RendererInterface {
    render: (ctx: CanvasRenderingContext2D, data: CandlestickData[], timeScale: any, priceScale: any, dimensions: ChartDimensions) => void;
  }
}

declare const CandlestickRenderer: CandlestickRendererTypes.RendererInterface;
export default CandlestickRenderer;
