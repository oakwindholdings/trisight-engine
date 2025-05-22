// src/components/Visualizations/RocketmanVisualization.tsx
// Visualization for Rocketman pattern
// Illustrates thrust stages
import React from 'react';
// Add type declarations for react-financial-charts
// @ts-ignore - Ignore missing type declarations for react-financial-charts
import { ScatterSeries, LineSeries, AreaSeries } from 'react-financial-charts';
import { format } from 'd3-format';
import { RocketmanPattern, ThrustDirection } from '../../models/PatternTypes';
import { formatDate } from '../../utils/formatters';

// Define data types for visualization
interface CurveDataPoint {
  x: Date;
  y: number;
  intensity: number;
}

interface AreaDataPoint {
  x: Date;
  y1: number;
  y2: number;
}

interface RocketmanVisualizationProps {
  pattern: RocketmanPattern;
  xScale: any;
  yScale: any;
  onClick?: (pattern: RocketmanPattern) => void;
}

/**
 * Component for visualizing Rocketman patterns on the chart
 * 
 * Renders a parabolic curve with acceleration highlighting and a peak marker
 */
const RocketmanVisualization: React.FC<RocketmanVisualizationProps> = ({
  pattern,
  xScale,
  yScale,
  onClick
}) => {
  const { 
    startTime, 
    endTime, 
    direction, 
    peakTime, 
    peakPrice, 
    intensity, 
    priceChanges 
  } = pattern;

  // Calculate time points for visualization
  const timeRange = endTime.getTime() - startTime.getTime();
  const numPoints = 15; // Number of points to visualize the acceleration curve
  
  // Generate curve data points
  const curveData: CurveDataPoint[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1); // Normalized time (0 to 1)
    const timestamp = new Date(startTime.getTime() + t * timeRange);
    
    // Create parabolic curve based on direction and intensity
    // t^2 for acceleration effect, scaled by intensity
    let price;
    if (direction === ThrustDirection.BULLISH) {
      // Bullish: upward acceleration
      const verticalRange = pattern.highPrice - pattern.lowPrice;
      price = pattern.lowPrice + verticalRange * Math.pow(t, 2 - t * intensity);
    } else {
      // Bearish: downward acceleration
      const verticalRange = pattern.highPrice - pattern.lowPrice;
      price = pattern.highPrice - verticalRange * Math.pow(t, 2 - t * intensity);
    }
    
    curveData.push({
      x: timestamp,
      y: price,
      intensity: intensity * Math.pow(t, 1.5) // Increasing intensity along the curve
    });
  }
  
  // Generate area data (filled area beneath the curve)
  const areaData: AreaDataPoint[] = curveData.map(point => ({
    x: point.x,
    y1: point.y,
    y2: direction === ThrustDirection.BULLISH ? pattern.lowPrice : pattern.highPrice
  }));
  
  // Define colors based on direction
  const baseColor = direction === ThrustDirection.BULLISH ? "#4CAF50" : "#F44336";
  const peakColor = direction === ThrustDirection.BULLISH ? "#00C853" : "#D50000";
  const areaColor = direction === ThrustDirection.BULLISH ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)";
  
  // Format pattern information for tooltip
  const formatPercent = format(".2f");
  const tooltipContent = `
    Rocketman Pattern (${direction.toLowerCase()})
    Acceleration: ${formatPercent(pattern.accelerationRate)}x
    Intensity: ${formatPercent(pattern.intensity * 100)}%
    Confidence: ${formatPercent(pattern.confidence * 100)}%
    Date: ${formatDate(pattern.startTime, true)} - ${formatDate(pattern.endTime, true)}
  `;

  // Handle pattern click
  const handleClick = () => {
    if (onClick) {
      onClick(pattern);
    }
  };

  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }} data-testid="rocketman-pattern">
      {/* Area under the curve */}
      <AreaSeries
        yAccessor={(d: AreaDataPoint) => ({ y1: d.y1, y2: d.y2 })}
        strokeStyle="none"
        fillStyle={areaColor}
        interpolation={(d: any) => d}
        canvasGradient={(ctx: CanvasRenderingContext2D, moreProps: any) => {
          const gradient = ctx.createLinearGradient(
            0, yScale(pattern.lowPrice),
            0, yScale(pattern.highPrice)
          );
          gradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
          gradient.addColorStop(1, areaColor);
          return gradient;
        }}
        data={areaData}
      />
      
      {/* Main acceleration curve */}
      <LineSeries
        yAccessor={(d: CurveDataPoint) => d.y}
        strokeStyle={baseColor}
        strokeWidth={2}
        interpolation={(d: any) => d}
        hoverStrokeWidth={3}
        data={curveData}
        highlightOnHover
        defined={(d: any) => !isNaN(d.y)}
      />
      
      {/* Peak point marker */}
      <ScatterSeries
        yAccessor={() => peakPrice}
        marker="circle"
        markerSize={12}
        fillStyle={peakColor}
        strokeStyle="#FFFFFF"
        strokeWidth={1}
        data={[{ x: peakTime, y: peakPrice }]}
        tooltip={tooltipContent}
      />
      
      {/* Show trend direction with smaller points */}
      <ScatterSeries
        yAccessor={(d: CurveDataPoint) => d.y}
        marker="circle"
        markerSize={(d: any) => 3 + d.intensity * 5}
        fillStyle={baseColor}
        strokeStyle="#FFFFFF"
        strokeWidth={0.5}
        data={curveData.filter((_, i) => i % 3 === 0)} // Only show every 3rd point
      />
    </g>
  );
};

export default RocketmanVisualization;
