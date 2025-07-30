// src/reportGeneration/examples/visualizationDemo.ts
// Demonstrates visualization engine capabilities
// Context: Shows how to create professional financial charts

import {
  createVisualizationEngine,
  ChartTheme,
  OutputFormat,
  selectChartType
} from '../visualization/visualizationEngine';
import { createDataFetcher } from '../core/dataFetcher';
import { createDataProcessor } from '../processing/dataProcessor';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Demonstrates line chart generation for financial trends
 */
async function demonstrateLineChart() {
  console.log('\n📈 Line Chart Demo - Revenue Trend\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.INSTITUTIONAL,
    size: {
      width: 800,
      height: 500,
      margins: { top: 20, right: 20, bottom: 40, left: 60 }
    }
  });
  
  // Prepare quarterly revenue data
  const spec = {
    type: 'line',
    data: {
      labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
      datasets: [
        {
          label: 'Revenue',
          data: [2500, 2800, 3100, 3400, 3800],
          color: '#0066CC'
        },
        {
          label: 'Profit',
          data: [500, 580, 650, 720, 850],
          color: '#00A651'
        }
      ]
    },
    config: {
      title: 'Quarterly Financial Performance',
      subtitle: 'Revenue and Profit Trends',
      xAxis: { label: 'Quarter' },
      yAxis: { label: 'Amount ($M)', format: 'currency' },
      annotations: [
        {
          type: 'line',
          x1: 'Q4 2023',
          y1: 3400,
          x2: 'Q1 2024',
          y2: 3800,
          text: 'Strong Growth',
          color: '#00A651'
        }
      ]
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Line chart generated successfully');
    console.log(`Type: ${result.type}`);
    console.log(`Title: ${result.metadata.title}`);
    console.log(`Chart includes ${spec.data.datasets.length} datasets`);
    
    // Save to file
    saveChart(result.svg!, 'line-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Line chart generation failed:', error);
  }
}

/**
 * Demonstrates bar chart for peer comparison
 */
async function demonstrateBarChart() {
  console.log('\n📊 Bar Chart Demo - Peer Comparison\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.MODERN
  });
  
  const spec = {
    type: 'bar',
    data: {
      labels: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'META'],
      datasets: [
        {
          label: 'P/E Ratio',
          data: [28.5, 24.2, 32.1, 48.3, 22.7],
          color: '#3B82F6'
        },
        {
          label: 'Industry Avg',
          data: [30, 30, 30, 30, 30],
          color: '#E5E7EB'
        }
      ]
    },
    config: {
      title: 'Valuation Comparison - Tech Giants',
      subtitle: 'P/E Ratio vs Industry Average',
      showValues: true,
      yAxis: { 
        label: 'P/E Ratio',
        format: 'number'
      }
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Bar chart generated successfully');
    console.log('Comparing', spec.data.labels.length, 'companies');
    
    saveChart(result.svg!, 'bar-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Bar chart generation failed:', error);
  }
}

/**
 * Demonstrates candlestick chart for price data
 */
async function demonstrateCandlestickChart() {
  console.log('\n🕯️ Candlestick Chart Demo - Stock Price\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.DARK,
    interactive: true
  });
  
  // Generate sample price data
  const candles = [];
  let price = 100;
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const change = (Math.random() - 0.5) * 4;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    const volume = 1000000 + Math.random() * 500000;
    
    candles.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume
    });
    
    price = close;
  }
  
  const spec = {
    type: 'candlestick',
    data: {
      candles
    },
    config: {
      title: 'NVDA - Daily Price Chart',
      subtitle: 'Last 30 Days with Volume',
      indicators: ['ma20'],
      yAxis: { format: 'currency' }
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Candlestick chart generated successfully');
    console.log(`Showing ${candles.length} days of price data`);
    console.log(`Price range: $${Math.min(...candles.map(c => c.low)).toFixed(2)} - $${Math.max(...candles.map(c => c.high)).toFixed(2)}`);
    
    saveChart(result.svg!, 'candlestick-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Candlestick chart generation failed:', error);
  }
}

/**
 * Demonstrates pie chart for portfolio allocation
 */
async function demonstratePieChart() {
  console.log('\n🥧 Pie Chart Demo - Portfolio Allocation\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.INSTITUTIONAL
  });
  
  const spec = {
    type: 'pie',
    data: {
      labels: ['Equities', 'Fixed Income', 'Real Estate', 'Commodities', 'Cash'],
      datasets: [{
        data: [45, 25, 15, 10, 5]
      }]
    },
    config: {
      title: 'Strategic Asset Allocation',
      subtitle: 'Target Portfolio Weights',
      donut: true,
      centerText: '100%'
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Pie chart generated successfully');
    console.log('Asset classes:', spec.data.labels.join(', '));
    
    saveChart(result.svg!, 'pie-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Pie chart generation failed:', error);
  }
}

/**
 * Demonstrates scatter plot with regression
 */
async function demonstrateScatterChart() {
  console.log('\n📊 Scatter Plot Demo - Risk vs Return\n');
  
  const engine = createVisualizationEngine();
  
  // Generate sample portfolio data
  const portfolios = [
    { name: 'Conservative', risk: 5, return: 6 },
    { name: 'Moderate', risk: 10, return: 9 },
    { name: 'Growth', risk: 15, return: 12 },
    { name: 'Aggressive', risk: 20, return: 15 },
    { name: 'Speculative', risk: 25, return: 18 },
    { name: 'Index Fund', risk: 12, return: 10 },
    { name: 'Value Fund', risk: 8, return: 8 },
    { name: 'Small Cap', risk: 18, return: 14 }
  ];
  
  const spec = {
    type: 'scatter',
    data: {
      points: portfolios.map(p => ({
        x: p.risk,
        y: p.return,
        label: p.name,
        size: 6
      }))
    },
    config: {
      title: 'Risk-Return Profile',
      subtitle: 'Portfolio Comparison',
      showRegression: true,
      xAxis: { label: 'Risk (Standard Deviation %)' },
      yAxis: { label: 'Expected Return (%)' }
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Scatter plot generated successfully');
    console.log(`Analyzing ${portfolios.length} portfolios`);
    
    saveChart(result.svg!, 'scatter-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Scatter plot generation failed:', error);
  }
}

/**
 * Demonstrates heatmap for correlation matrix
 */
async function demonstrateHeatmap() {
  console.log('\n🌡️ Heatmap Demo - Asset Correlation\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.MODERN
  });
  
  const assets = ['Stocks', 'Bonds', 'Gold', 'Real Estate', 'Commodities'];
  const correlations = [
    [1.00, -0.15, 0.10, 0.65, 0.40],
    [-0.15, 1.00, 0.25, -0.10, -0.20],
    [0.10, 0.25, 1.00, 0.30, 0.55],
    [0.65, -0.10, 0.30, 1.00, 0.45],
    [0.40, -0.20, 0.55, 0.45, 1.00]
  ];
  
  const spec = {
    type: 'heatmap',
    data: {
      rows: assets,
      columns: assets,
      values: correlations
    },
    config: {
      title: 'Asset Class Correlation Matrix',
      subtitle: '5-Year Historical Correlation'
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Heatmap generated successfully');
    console.log(`${assets.length}x${assets.length} correlation matrix`);
    
    saveChart(result.svg!, 'heatmap-demo.svg');
    
  } catch (error) {
    console.error('❌ Heatmap generation failed:', error);
  }
}

/**
 * Demonstrates waterfall chart for variance analysis
 */
async function demonstrateWaterfallChart() {
  console.log('\n💧 Waterfall Chart Demo - P&L Analysis\n');
  
  const engine = createVisualizationEngine({
    theme: ChartTheme.INSTITUTIONAL
  });
  
  const spec = {
    type: 'waterfall',
    data: {
      steps: [
        { label: 'Starting Revenue', value: 5000, type: 'initial' },
        { label: 'New Customers', value: 800, type: 'positive' },
        { label: 'Upsells', value: 400, type: 'positive' },
        { label: 'Churn', value: -600, type: 'negative' },
        { label: 'Price Increase', value: 300, type: 'positive' },
        { label: 'Discounts', value: -200, type: 'negative' },
        { label: 'Ending Revenue', value: 5700, type: 'total' }
      ]
    },
    config: {
      title: 'Revenue Bridge Analysis',
      subtitle: 'Q4 2023 to Q1 2024',
      valueFormat: 'currency',
      yAxis: { 
        label: 'Revenue ($K)',
        format: 'currency' 
      }
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Waterfall chart generated successfully');
    console.log('Starting:', spec.data.steps[0].value);
    console.log('Ending:', spec.data.steps[spec.data.steps.length - 1].value);
    
    saveChart(result.svg!, 'waterfall-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Waterfall chart generation failed:', error);
  }
}

/**
 * Demonstrates gauge chart for single metrics
 */
async function demonstrateGaugeChart() {
  console.log('\n🎯 Gauge Chart Demo - Performance Score\n');
  
  const engine = createVisualizationEngine();
  
  const spec = {
    type: 'gauge',
    data: {
      value: 78
    },
    config: {
      title: 'ESG Score',
      subtitle: 'Environmental, Social & Governance Rating',
      min: 0,
      max: 100,
      target: 85,
      label: 'Score'
    }
  };
  
  try {
    const result = await engine.generateChart(spec);
    
    console.log('✅ Gauge chart generated successfully');
    console.log(`Current value: ${spec.data.value}`);
    console.log(`Target: ${spec.config.target}`);
    
    saveChart(result.svg!, 'gauge-chart-demo.svg');
    
  } catch (error) {
    console.error('❌ Gauge chart generation failed:', error);
  }
}

/**
 * Demonstrates theme variations
 */
async function demonstrateThemes() {
  console.log('\n🎨 Theme Variations Demo\n');
  
  const themes = [
    ChartTheme.INSTITUTIONAL,
    ChartTheme.MODERN,
    ChartTheme.DARK,
    ChartTheme.CLASSIC,
    ChartTheme.PRINT
  ];
  
  const baseSpec = {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Performance',
        data: [100, 105, 103, 108, 112, 118]
      }]
    },
    config: {
      title: 'Monthly Performance',
      yAxis: { format: 'currency' }
    }
  };
  
  for (const theme of themes) {
    const engine = createVisualizationEngine({ theme });
    
    try {
      const result = await engine.generateChart(baseSpec);
      
      console.log(`✅ ${theme} theme chart generated`);
      saveChart(result.svg!, `theme-${theme}-demo.svg`);
      
    } catch (error) {
      console.error(`❌ ${theme} theme generation failed:`, error);
    }
  }
}

/**
 * Demonstrates automatic chart type selection
 */
async function demonstrateAutoSelection() {
  console.log('\n🤖 Automatic Chart Type Selection Demo\n');
  
  const scenarios = [
    {
      name: 'Time Series Data',
      data: {
        labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
        datasets: [{ data: [100, 120, 115] }]
      },
      context: 'trend'
    },
    {
      name: 'Category Comparison',
      data: {
        labels: ['Product A', 'Product B', 'Product C'],
        datasets: [{ data: [300, 450, 600] }]
      },
      context: 'comparison'
    },
    {
      name: 'Composition Data',
      data: {
        labels: ['Segment 1', 'Segment 2', 'Segment 3'],
        datasets: [{ data: [40, 35, 25] }]
      },
      context: 'composition'
    },
    {
      name: 'Correlation Data',
      data: {
        points: [
          { x: 10, y: 20 },
          { x: 20, y: 35 },
          { x: 30, y: 48 }
        ]
      },
      context: 'correlation'
    },
    {
      name: 'Single Metric',
      data: {
        value: 85
      },
      context: 'metric'
    }
  ];
  
  scenarios.forEach(scenario => {
    const selectedType = selectChartType(scenario.data, scenario.context);
    console.log(`${scenario.name}: Selected ${selectedType} chart`);
  });
}

/**
 * Demonstrates real-world financial report charts
 */
async function demonstrateFinancialReportCharts(ticker: string = 'NVDA') {
  console.log(`\n📊 Financial Report Charts Demo - ${ticker}\n`);
  
  try {
    // Fetch real data
    const fetcher = createDataFetcher({ ticker });
    const companyData = await fetcher.fetchAll(ticker);
    
    const processor = createDataProcessor();
    const { analysis } = await processor.processData(companyData);
    
    const engine = createVisualizationEngine({
      theme: ChartTheme.INSTITUTIONAL,
      size: {
        width: 1000,
        height: 600,
        margins: { top: 30, right: 30, bottom: 50, left: 70 }
      }
    });
    
    // 1. Revenue Growth Chart
    if (companyData.financials.incomeStatement.length > 0) {
      const revenueSpec = {
        type: 'line',
        data: {
          labels: companyData.financials.incomeStatement.map(s => s.date),
          datasets: [{
            label: 'Revenue',
            data: companyData.financials.incomeStatement.map(s => s.revenue / 1e9),
            color: '#0066CC'
          }]
        },
        config: {
          title: `${ticker} Revenue Trend`,
          subtitle: 'Quarterly Revenue (in Billions)',
          xAxis: { label: 'Quarter', format: 'date' },
          yAxis: { label: 'Revenue ($B)' }
        }
      };
      
      const revenueChart = await engine.generateChart(revenueSpec);
      console.log('✅ Revenue chart generated');
      saveChart(revenueChart.svg!, `${ticker}-revenue-chart.svg`);
    }
    
    // 2. Profitability Margins Chart
    if (analysis.profitability) {
      const marginSpec = {
        type: 'bar',
        data: {
          labels: ['Gross', 'Operating', 'Net', 'FCF'],
          datasets: [{
            label: 'Margins',
            data: [
              analysis.profitability.grossMargin * 100,
              analysis.profitability.operatingMargin * 100,
              analysis.profitability.netMargin * 100,
              analysis.profitability.fcfMargin * 100
            ]
          }]
        },
        config: {
          title: `${ticker} Profitability Margins`,
          subtitle: 'Key Operating Metrics',
          showValues: true,
          yAxis: { label: 'Margin (%)', format: 'percent' }
        }
      };
      
      const marginChart = await engine.generateChart(marginSpec);
      console.log('✅ Margins chart generated');
      saveChart(marginChart.svg!, `${ticker}-margins-chart.svg`);
    }
    
    // 3. Technical Pattern Chart
    if (companyData.financials.historicalPrices.length > 0) {
      const prices = companyData.financials.historicalPrices.slice(0, 30);
      const candleSpec = {
        type: 'candlestick',
        data: {
          candles: prices.map(p => ({
            date: p.date,
            open: p.open,
            high: p.high,
            low: p.low,
            close: p.close,
            volume: p.volume
          }))
        },
        config: {
          title: `${ticker} Price Action`,
          subtitle: 'Daily Chart with Technical Indicators',
          indicators: ['ma20']
        }
      };
      
      const priceChart = await engine.generateChart(candleSpec);
      console.log('✅ Price chart generated');
      saveChart(priceChart.svg!, `${ticker}-price-chart.svg`);
    }
    
  } catch (error) {
    console.error('❌ Financial report charts failed:', error);
  }
}

/**
 * Helper function to save chart to file
 */
function saveChart(svg: string, filename: string): void {
  const outputDir = path.join(__dirname, 'output');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, svg);
  
  console.log(`💾 Chart saved to: ${filepath}`);
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('🎨 TriSight Visualization Engine Demo');
  console.log('=' .repeat(50));
  
  await demonstrateLineChart();
  await demonstrateBarChart();
  await demonstrateCandlestickChart();
  await demonstratePieChart();
  await demonstrateScatterChart();
  await demonstrateHeatmap();
  await demonstrateWaterfallChart();
  await demonstrateGaugeChart();
  await demonstrateThemes();
  await demonstrateAutoSelection();
  
  // Optionally run with real data
  if (process.argv.includes('--real-data')) {
    const ticker = process.argv[process.argv.indexOf('--real-data') + 1] || 'NVDA';
    await demonstrateFinancialReportCharts(ticker);
  }
  
  console.log('\n✨ All demos completed!');
}

// Run demos if executed directly
if (require.main === module) {
  runAllDemos()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Demo failed:', error);
      process.exit(1);
    });
}

// Export individual demos for testing
export {
  demonstrateLineChart,
  demonstrateBarChart,
  demonstrateCandlestickChart,
  demonstratePieChart,
  demonstrateScatterChart,
  demonstrateHeatmap,
  demonstrateWaterfallChart,
  demonstrateGaugeChart,
  demonstrateThemes,
  demonstrateAutoSelection,
  demonstrateFinancialReportCharts
};