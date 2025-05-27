// src/components/Chart/TimeAxis.tsx
// Canvas time axis renderer
// Formats timestamps for chart
import { formatDateForAxis } from '../../utils/scaling';
import { isDuringTradingHours } from '../../utils/marketHours';

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
const TimeAxisImpl = {
  render(
    ctx: CanvasRenderingContext2D,
    timeScale: any,
    dimensions: ChartDimensions,
    timeframe: string,
    showOnlyTradingHours: boolean = false
  ) {
    const { width, height, margin } = dimensions;
    
    // Draw the x-axis line
    ctx.beginPath();
    ctx.moveTo(margin.left, height - margin.bottom);
    ctx.lineTo(width - margin.right, height - margin.bottom);
    ctx.strokeStyle = '#757575';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Generate ticks
    let ticks = timeScale.ticks(10);
    
    // If we're showing only trading hours, filter the ticks
    if (showOnlyTradingHours) {
      ticks = ticks.filter((tick: Date) => isDuringTradingHours(tick));
      
      // If we filtered out too many ticks, generate more
      if (ticks.length < 5) {
        const moreTicks = timeScale.ticks(20).filter((tick: Date) => isDuringTradingHours(tick));
        ticks = moreTicks.slice(0, 10); // Take up to 10
      }
    }
    
    // Draw tick marks and labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Arial';
    ctx.fillStyle = '#212121';
    
    ticks.forEach((tick: Date) => {
      const x = timeScale.scale(tick);
      
      // Draw tick mark
      ctx.beginPath();
      ctx.moveTo(x, height - margin.bottom);
      ctx.lineTo(x, height - margin.bottom + 4);
      ctx.stroke();
      
      // Format the date based on timeframe
      const formattedDate = formatDateForAxis(tick, timeframe);
      
      // Draw the label
      ctx.fillText(
        formattedDate,
        x,
        height - margin.bottom + 6
      );
    });
    
    // Draw the axis label
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      'Time',
      width / 2,
      height - 10
    );
  }
};

// Export directly with the name expected by importers
const TimeAxis = TimeAxisImpl;
export default TimeAxis;
