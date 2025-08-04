// Test chart generation directly
const { ChartGenerator } = require('./dist/reportGeneration/utils/chartGenerator');

async function testCharts() {
  console.log('[TEST] Testing chart generation...');
  
  const chartGenerator = new ChartGenerator();
  
  // Test data
  const priceData = [
    { date: '2025-07-30', open: 180, high: 185, low: 178, close: 183, volume: 1000000 },
    { date: '2025-07-31', open: 183, high: 188, low: 182, close: 185, volume: 1200000 }
  ];
  
  try {
    console.log('[TEST] Generating candlestick chart...');
    const chart = await chartGenerator.generateCandlestickChart(priceData);
    
    console.log('[TEST] Chart generated:', {
      type: chart.type,
      format: chart.format,
      dimensions: chart.dimensions,
      dataLength: chart.data.length,
      dataPreview: chart.data.substring(0, 200)
    });
    
    // Save SVG to file to inspect
    const fs = require('fs');
    fs.writeFileSync('test-chart.svg', chart.data);
    console.log('[TEST] Chart saved to test-chart.svg');
    
  } catch (error) {
    console.error('[TEST] Error:', error);
  }
}

testCharts();