// src/components/Chart/TargetReportTableDemo.tsx
// Demo component showing Target Report Table integration with TriSight chart
// Demonstrates Dick's worksheet formulas, sortable columns, and ConvictionCloud integration

import React, { useState, useEffect, useRef } from 'react';
import { renderChart } from './RenderOrchestrator';
import { 
  TargetReportRow, 
  TargetReportTableSettings, 
  defaultTargetReportTableSettings, 
  generateDummyTargetReportData,
  getTableCellAtPosition 
} from './TargetReportTableRenderer';
import { 
  ConvictionCloudItem, 
  generateDummyConvictionData, 
  defaultConvictionCloudSettings,
  getCloudItemAtPosition 
} from './ConvictionCloudRenderer';

interface TargetReportTableDemoProps {
  width?: number;
  height?: number;
  showControls?: boolean;
}

const TargetReportTableDemo: React.FC<TargetReportTableDemoProps> = ({
  width = 1000,
  height = 800,
  showControls = true
}) => {
  // Canvas refs for the demo
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const bufferCanvasRef = useRef<HTMLCanvasElement>(null);
  const patternsCanvasRef = useRef<HTMLCanvasElement>(null);

  // Demo state
  const [targetReportData, setTargetReportData] = useState<TargetReportRow[]>([]);
  const [convictionData, setConvictionData] = useState<ConvictionCloudItem[]>([]);
  const [tableSettings, setTableSettings] = useState<TargetReportTableSettings>(defaultTargetReportTableSettings);
  const [cloudSettings, setCloudSettings] = useState(defaultConvictionCloudSettings);
  const [hoveredTableCell, setHoveredTableCell] = useState<{ row: number; column: number } | null>(null);
  const [hoveredConvictionItem, setHoveredConvictionItem] = useState<ConvictionCloudItem | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Generate dummy data on mount
  useEffect(() => {
    const dummyTableData = generateDummyTargetReportData();
    const dummyCloudData = generateDummyConvictionData();
    
    setTargetReportData(dummyTableData);
    setConvictionData(dummyCloudData);
    
    console.log('[TargetReportTableDemo] Generated dummy data:', {
      tableRows: dummyTableData.length,
      cloudItems: dummyCloudData.length
    });
  }, []);

  // Handle mouse movement for hover detection
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    setMousePosition({ x: mouseX, y: mouseY });

    // Check for table cell hover
    const tableY = height - tableSettings.height - 10;
    const tableDimensions = {
      x: 40, // margin.left
      y: tableY,
      width: width - 80, // width - margins
      height: tableSettings.height,
      headerHeight: 32,
      rowHeight: 24,
      scrollOffset: 0
    };

    const tableCell = getTableCellAtPosition(mouseX, mouseY, tableDimensions, targetReportData.length);
    setHoveredTableCell(tableCell);

    // Check for conviction cloud hover
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
        setHoveredConvictionItem(convictionData[itemIndex]);
      } else {
        setHoveredConvictionItem(null);
      }
    } else {
      setHoveredConvictionItem(null);
    }
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    setHoveredTableCell(null);
    setHoveredConvictionItem(null);
  };

  // Handle ConvictionCloud click to highlight table row
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredConvictionItem) {
      console.log(`[TargetReportTableDemo] ConvictionCloud clicked: ${hoveredConvictionItem.symbol}`);
      
      // Highlight corresponding row in table
      setTableSettings(prev => ({
        ...prev,
        highlightedRow: hoveredConvictionItem.symbol
      }));
      
      // Optional: Scroll to the row if it's not visible
      const rowIndex = targetReportData.findIndex(row => row.symbol === hoveredConvictionItem.symbol);
      if (rowIndex !== -1) {
        console.log(`[TargetReportTableDemo] Highlighting table row for ${hoveredConvictionItem.symbol} at index ${rowIndex}`);
      }
    }
  };

  // Handle table column sorting
  const handleSortColumn = (column: keyof TargetReportRow) => {
    setTableSettings(prev => ({
      ...prev,
      sortColumn: column,
      sortDirection: prev.sortColumn === column && prev.sortDirection === 'desc' ? 'asc' : 'desc'
    }));
  };

  // Render the demo chart with target report table
  const renderDemo = () => {
    const margin = { top: 40, right: 40, bottom: tableSettings.height + 50, left: 40 };
    
    // Chart dimensions (account for table at bottom)
    const chartHeight = height - tableSettings.height - 60; // 60px for margins and spacing
    const dimensions = {
      width,
      height: chartHeight,
      margin
    };

    // Create dummy chart data (empty for demo focus on table)
    const dummyData: any[] = [];
    const visibleDataIndices = { start: 0, end: 0 };
    const visibleRange = { 
      startTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endTime: new Date(),
      minPrice: 100, 
      maxPrice: 200 
    };
    
    // Render with both conviction cloud and target report table
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
      hoveredConvictionItem: hoveredConvictionItem,
      // Target Report Table Integration
      targetReportRows: targetReportData,
      targetReportSettings: tableSettings,
      hoveredTableCell: hoveredTableCell,
      chartSettings: { isHeikinAshi: false, showVolume: true, showGrid: true }
    });
  };

  // Re-render when data or settings change
  useEffect(() => {
    if (targetReportData.length > 0) {
      renderDemo();
    }
  }, [targetReportData, convictionData, tableSettings, cloudSettings, hoveredTableCell, hoveredConvictionItem]);

  return (
    <div className="target-report-table-demo">
      <h3 className="text-lg font-semibold mb-4">TriSight Target Report Table Demo</h3>
      
      {/* Demo Controls */}
      {showControls && (
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tableSettings.enabled}
                onChange={(e) => setTableSettings({
                  ...tableSettings,
                  enabled: e.target.checked
                })}
              />
              Enable Target Report Table
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tableSettings.sortableColumns}
                onChange={(e) => setTableSettings({
                  ...tableSettings,
                  sortableColumns: e.target.checked
                })}
              />
              Sortable Columns
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={tableSettings.alternatingRowShading}
                onChange={(e) => setTableSettings({
                  ...tableSettings,
                  alternatingRowShading: e.target.checked
                })}
              />
              Alternating Row Shading
            </label>
            
            <label className="flex items-center gap-2">
              Table Height:
              <input
                type="number"
                min="200"
                max="600"
                step="50"
                value={tableSettings.height}
                onChange={(e) => setTableSettings({
                  ...tableSettings,
                  height: parseInt(e.target.value)
                })}
                className="w-20 px-2 py-1 border rounded"
              />
            </label>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            <button
              onClick={() => setTargetReportData(generateDummyTargetReportData())}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Regenerate Table Data
            </button>
            
            <button
              onClick={() => setConvictionData(generateDummyConvictionData())}
              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Regenerate Cloud Data
            </button>
            
            <button
              onClick={() => setTableSettings(prev => ({ ...prev, highlightedRow: null }))}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Highlights
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
          onClick={handleCanvasClick}
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
          {hoveredTableCell && (
            <div className="mt-1 text-xs">
              Table: Row {hoveredTableCell.row}, Col {hoveredTableCell.column}
            </div>
          )}
          {hoveredConvictionItem && (
            <div className="mt-1 text-xs">
              Cloud: {hoveredConvictionItem.symbol} ({hoveredConvictionItem.convictionRating}/100)
            </div>
          )}
          {tableSettings.highlightedRow && (
            <div className="mt-1 text-xs text-yellow-600">
              Highlighted: {tableSettings.highlightedRow}
            </div>
          )}
        </div>
      </div>

      {/* Current Data Summary */}
      {showControls && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <h4 className="font-semibold mb-2">Integration Demo Features:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>✅ Canvas-Only Rendering</strong><br />
              Table rendered entirely with Canvas 2D context
            </div>
            <div>
              <strong>✅ Dick's Worksheet Formulas</strong><br />
              Success = Conviction, Composite = Avg(4 subfactors)
            </div>
            <div>
              <strong>✅ ConvictionCloud Integration</strong><br />
              Click cloud labels to highlight table rows
            </div>
            <div>
              <strong>✅ Sortable Columns</strong><br />
              Currently sorted by: {tableSettings.sortColumn} ({tableSettings.sortDirection})
            </div>
            <div>
              <strong>✅ Hover Detection</strong><br />
              Table cells and cloud items respond to mouse
            </div>
            <div>
              <strong>✅ Fixed Header & Scrolling</strong><br />
              Header stays fixed, rows scroll independently
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetReportTableDemo;
