// src/components/Chart/PriceAxis.tsx
// Canvas price axis renderer
// Formats price labels
import { formatPriceForAxis } from '../../utils/scaling';

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

// Implementation with 'Impl' suffix to match declaration in ChartComponents.d.ts
const PriceAxisImpl = {
  render(
    ctx: CanvasRenderingContext2D,
    priceScale: any,
    dimensions: ChartDimensions
  ) {
    const { width, height, margin } = dimensions;
    
    // Draw the y-axis line
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, height - margin.bottom);
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Generate price ticks
    const ticks = priceScale.ticks(8);
    
    // Draw tick marks and labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#212121';
    
    ticks.forEach((tick: number) => {
      const y = priceScale.scale(tick);
      
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left - 4, y);
      ctx.stroke();
      
      // Format the price
      const formattedPrice = formatPriceForAxis(tick);
      
      // Draw the label
      ctx.fillText(
        formattedPrice,
        margin.left - 8,
        y
      );
      
      // Draw light grid line across the chart
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.stroke();
      ctx.strokeStyle = '#757575';
    });
    
    // Draw the axis label
    ctx.save();
    ctx.translate(14, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Price', 0, 0);
    ctx.restore();
    
    // Draw volume section y-axis
    const volumeHeight = (height - margin.top - margin.bottom) * 0.2;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const volumeTop = height - margin.bottom - volumeHeight;
    
    // Draw right-side price scale
    ctx.textAlign = 'left';
    ticks.forEach((tick: number) => {
      const y = priceScale.scale(tick);
      
      // Draw tick mark on right side
      ctx.beginPath();
      ctx.moveTo(width - margin.right, y);
      ctx.lineTo(width - margin.right + 4, y);
      ctx.stroke();
      
      // Format the price
      const formattedPrice = formatPriceForAxis(tick);
      
      // Draw the label
      ctx.fillText(
        formattedPrice,
        width - margin.right + 8,
        y
      );
    });
  }
};

// Export directly with the name expected by importers
const PriceAxis = PriceAxisImpl;
export default PriceAxis;
