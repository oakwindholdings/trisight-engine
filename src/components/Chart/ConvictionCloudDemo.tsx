// src/components/Chart/ConvictionCloudDemo.tsx
// Demo component showing Conviction Cloud integration with TriSight chart
// Demonstrates score-weighted rendering, hover interactions, and dummy data

import React, { useState, useEffect, useRef } from 'react';
import { generateDummyConvictionData, ConvictionCloudItem, defaultConvictionCloudSettings, getCloudItemAtPosition } from './ConvictionCloudRenderer';
import { renderChart } from './RenderOrchestrator';

interface ConvictionCloudDemoProps {
  width?: number;
  height?: number;
  showControls?: boolean;
}

const ConvictionCloudDemo: React.FC<ConvictionCloudDemoProps> = ({
  width = 800,
  height = 600,
  showControls = true
}) => {
  // Canvas refs for the demo
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Demo state
  const [convictionData, setConvictionData] = useState<ConvictionCloudItem[]>([]);
  const [hoveredItem, setHoveredItem] = useState<ConvictionCloudItem | null>(null);
  const [cloudSettings, setCloudSettings] = useState(defaultConvictionCloudSettings);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate dummy data on mount
  useEffect(() => {
    const dummyData = generateDummyConvictionData();
    setConvictionData(dummyData);
    console.log('[ConvictionCloudDemo] Generated dummy conviction data:', dummyData);
  }, []);

  // Handle mouse movement for hover detection
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setMousePosition({ x: mouseX, y: mouseY });

    // Check if mouse is over a conviction cloud item
    // Note: In a real implementation, this would use the positions returned by renderConvictionCloud
    // For now, we'll simulate hover detection
    const cloudArea = {
      x: width - 300,
      y: 40,
      width: 280,
      height: 120
    };

    if (mouseX >= cloudArea.x && mouseX <= cloudArea.x + cloudArea.width &&
        mouseY >= cloudArea.y && mouseY <= cloudArea.y + cloudArea.height) {
      // Simple hover simulation - in real usage, this would use getCloudItemAtPosition
      const itemIndex = Math.floor((mouseY - cloudArea.y) / 30);
      if (itemIndex >= 0 && itemIndex < convictionData.length) {
        setHoveredItem(convictionData[itemIndex]);
      } else {
        setHoveredItem(null);
      }
    } else {
      setHoveredItem(null);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredItem(null);
  };

  // Render the demo chart with conviction cloud
  const renderDemo = () => {
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };
    
    // Dummy chart dimensions
    const dimensions = {
      width,
      height,
      margin
    };

    // Create dummy data for the chart (empty for demo)
    const dummyData: any[] = [];
    const visibleDataIndices = { start: 0, end: 0 };
    const visibleRange = { 
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      endTime: new Date(), // now
      minPrice: 100, 
      maxPrice: 200 
    };
    
    // Render with conviction cloud
    renderChart({
      mainCanvasRef,
      bufferCanvasRef,  
      patternsCanvasRef,
      filteredData: dummyData,
      visibleDataIndices,
      visibleRange,
      width,
      height,
      margin,
      visiblePatterns: [],
      selectedPattern: null,
      timeframe: '1D',
      showOnlyTradingHours: false,
      // Conviction Cloud Integration
      convictionCloudItems: convictionData,
      convictionCloudSettings: cloudSettings,
      hoveredConvictionItem: hoveredItem,
      chartSettings: { isHeikinAshi: false, showVolume: true, showGrid: true }
    });
  };

  // Re-render when data or settings change
  useEffect(() => {
    if (convictionData.length > 0) {
      renderDemo();
    }
  }, [convictionData, hoveredItem, cloudSettings]);

  return (
    <div className="conviction-cloud-demo">
      <h3 className="text-lg font-semibold mb-4">TriSight Conviction Cloud Demo</h3>
      
      {/* Demo Controls */}
      {showControls && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={cloudSettings.enabled}
                onChange={(e) => setCloudSettings({
                  ...cloudSettings,
                  enabled: e.target.checked
                })}
              />
              Enable Conviction Cloud
            </label>
            
            <label className="flex items-center gap-2">
              Anchor Position:
              <select
                value={cloudSettings.anchorPosition}
                onChange={(e) => setCloudSettings({
                  ...cloudSettings,
                  anchorPosition: e.target.value as 'top-left' | 'top-right'
                })}
                className="px-2 py-1 border rounded"
              >
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
              </select>
            </label>
            
            <label className="flex items-center gap-2">
              Sort By:
              <select
                value={cloudSettings.sortMode}
                onChange={(e) => setCloudSettings({
                  ...cloudSettings,
                  sortMode: e.target.value as 'conviction' | 'traction' | 'timing' | 'risk'
                })}
                className="px-2 py-1 border rounded"
              >
                <option value="conviction">Conviction</option>
                <option value="traction">Traction</option>
                <option value="timing">Timing</option>
                <option value="risk">Risk</option>
              </select>
            </label>
            
            <label className="flex items-center gap-2">
              Max Items:
              <input
                type="number"
                min="1"
                max="12"
                value={cloudSettings.maxItems}
                onChange={(e) => setCloudSettings({
                  ...cloudSettings,
                  maxItems: parseInt(e.target.value)
                })}
                className="w-16 px-2 py-1 border rounded"
              />
            </label>
            
            <button
              onClick={() => setConvictionData(generateDummyConvictionData())}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Regenerate Data
            </button>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="relative border border-gray-300 rounded" style={{ width, height }}>
        {/* Main Canvas */}
        <canvas
          ref={mainCanvasRef}
          width={width}
          height={height}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute top-0 left-0 cursor-crosshair"
          style={{ zIndex: 3 }}
        />
        
        {/* Buffer Canvas (hidden) */}
        <canvas
          ref={bufferCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 1, display: 'none' }}
        />
        
        {/* Patterns Canvas (hidden) */}
        <canvas
          ref={patternsCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 2, display: 'none' }}
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-4 left-4 text-sm text-gray-600 bg-white px-2 py-1 rounded shadow">
          Mouse: ({mousePosition.x}, {mousePosition.y})
          {hoveredItem && (
            <div className="mt-1 text-xs">
              Hovered: {hoveredItem.symbol} ({hoveredItem.convictionRating}/100)
            </div>
          )}
        </div>
      </div>

      {/* Current Data Display */}
      {showControls && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Current Conviction Data:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {convictionData.map((item, index) => (
              <div 
                key={index} 
                className={`p-2 border rounded ${
                  hoveredItem === item ? 'bg-blue-100 border-blue-300' : 'bg-white'
                }`}
              >
                <strong>{item.symbol}</strong> - Conviction: {item.convictionRating}/100
                <br />
                Traction: {item.traction.toFixed(1)}, Timing: {item.timing.toFixed(1)}, Risk: {item.riskRating.toFixed(1)}
                <br />
                Patterns: {item.patternTypes.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConvictionCloudDemo;
