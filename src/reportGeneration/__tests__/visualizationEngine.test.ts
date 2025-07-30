// src/reportGeneration/__tests__/visualizationEngine.test.ts
// Unit tests for visualization engine
// Context: Ensures chart generation produces correct, professional visualizations

import {
  createVisualizationEngine,
  VisualizationEngine,
  ChartTheme,
  OutputFormat,
  selectChartType
} from '../visualization/visualizationEngine';
import { createFinancialCharts } from '../visualization/financialCharts';
import * as d3 from 'd3';

// Mock d3 to avoid JSDOM issues
jest.mock('d3', () => ({
  ...jest.requireActual('d3'),
  create: jest.fn(() => ({
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    append: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    ease: jest.fn().mockReturnThis(),
    delay: jest.fn().mockReturnThis(),
    attrTween: jest.fn().mockReturnThis(),
    tween: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    html: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    node: jest.fn(() => ({
      outerHTML: '<svg>Test Chart</svg>',
      getTotalLength: () => 100
    }))
  })),
  scaleLinear: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    nice: jest.fn().mockReturnThis(),
    ticks: jest.fn(() => [0, 50, 100])
  })),
  scaleTime: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis()
  })),
  scaleBand: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    padding: jest.fn().mockReturnThis(),
    bandwidth: jest.fn(() => 20)
  })),
  scaleOrdinal: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis()
  })),
  scaleSequential: jest.fn(() => ({
    interpolator: jest.fn().mockReturnThis(),
    domain: jest.fn().mockReturnThis()
  })),
  line: jest.fn(() => ({
    defined: jest.fn().mockReturnThis(),
    x: jest.fn().mockReturnThis(),
    y: jest.fn().mockReturnThis()
  })),
  arc: jest.fn(() => ({
    innerRadius: jest.fn().mockReturnThis(),
    outerRadius: jest.fn().mockReturnThis(),
    startAngle: jest.fn().mockReturnThis(),
    endAngle: jest.fn().mockReturnThis()
  })),
  pie: jest.fn(() => ({
    value: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis()
  })),
  axisBottom: jest.fn(() => ({
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis()
  })),
  axisLeft: jest.fn(() => ({
    ticks: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis()
  })),
  extent: jest.fn(data => [0, 100]),
  min: jest.fn(() => 0),
  max: jest.fn(() => 100),
  sum: jest.fn(() => 100),
  bisector: jest.fn(() => ({
    left: jest.fn(() => 0)
  })),
  hierarchy: jest.fn(data => ({
    sum: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    leaves: jest.fn(() => [
      { data: { name: 'Test', value: 100, category: 'A' }, x0: 0, y0: 0, x1: 100, y1: 100 }
    ])
  })),
  treemap: jest.fn(() => ({
    size: jest.fn().mockReturnThis(),
    padding: jest.fn().mockReturnThis()
  })),
  interpolate: jest.fn((a, b) => t => a + (b - a) * t),
  interpolateNumber: jest.fn((a, b) => t => a + (b - a) * t),
  interpolateRdBu: jest.fn(),
  easeLinear: jest.fn(),
  timeParse: jest.fn(format => (dateStr: string) => new Date(dateStr)),
  timeFormat: jest.fn(format => (date: Date) => date.toLocaleDateString()),
  select: jest.fn(() => ({
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis()
  })),
  pointer: jest.fn(() => [50, 50])
}));

describe('VisualizationEngine', () => {
  let engine: VisualizationEngine;
  
  beforeEach(() => {
    engine = createVisualizationEngine();
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Engine Creation', () => {
    it('should create engine with default configuration', () => {
      const engine = createVisualizationEngine();
      expect(engine).toBeInstanceOf(VisualizationEngine);
    });
    
    it('should create engine with custom theme', () => {
      const engine = createVisualizationEngine({
        theme: ChartTheme.DARK
      });
      expect(engine).toBeInstanceOf(VisualizationEngine);
    });
    
    it('should create engine with custom size', () => {
      const engine = createVisualizationEngine({
        size: {
          width: 1200,
          height: 800,
          margins: { top: 40, right: 40, bottom: 60, left: 80 }
        }
      });
      expect(engine).toBeInstanceOf(VisualizationEngine);
    });
  });
  
  describe('Line Chart Generation', () => {
    it('should generate basic line chart', async () => {
      const spec = {
        type: 'line',
        data: {
          labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
          datasets: [{
            label: 'Revenue',
            data: [100, 120, 140],
            color: '#0066CC'
          }]
        },
        config: {
          title: 'Revenue Trend',
          xAxis: { label: 'Date' },
          yAxis: { label: 'Revenue ($)' }
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('line');
      expect(result.svg).toContain('<svg>');
      expect(result.metadata.title).toBe('Revenue Trend');
    });
    
    it('should generate multi-series line chart', async () => {
      const spec = {
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: 'Revenue',
              data: [100, 120, 140, 160]
            },
            {
              label: 'Profit',
              data: [20, 25, 30, 35]
            }
          ]
        },
        config: {
          title: 'Financial Performance'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('line');
      expect(result.svg).toBeDefined();
    });
    
    it('should handle missing data points', async () => {
      const spec = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            label: 'Sales',
            data: [100, null, 150, 180]
          }]
        },
        config: {
          title: 'Sales with Gap'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('line');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Bar Chart Generation', () => {
    it('should generate single series bar chart', async () => {
      const spec = {
        type: 'bar',
        data: {
          labels: ['Product A', 'Product B', 'Product C'],
          datasets: [{
            label: 'Sales',
            data: [300, 450, 600]
          }]
        },
        config: {
          title: 'Product Sales',
          showValues: true
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('bar');
      expect(result.svg).toBeDefined();
      expect(result.metadata.title).toBe('Product Sales');
    });
    
    it('should generate grouped bar chart', async () => {
      const spec = {
        type: 'bar',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [
            {
              label: '2023',
              data: [100, 120, 110, 140]
            },
            {
              label: '2024',
              data: [120, 140, 130, 180]
            }
          ]
        },
        config: {
          title: 'Yearly Comparison'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('bar');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Candlestick Chart Generation', () => {
    it('should generate candlestick chart with volume', async () => {
      const spec = {
        type: 'candlestick',
        data: {
          candles: [
            {
              date: '2024-01-01',
              open: 100,
              high: 105,
              low: 99,
              close: 103,
              volume: 1000000
            },
            {
              date: '2024-01-02',
              open: 103,
              high: 107,
              low: 102,
              close: 106,
              volume: 1200000
            }
          ]
        },
        config: {
          title: 'Stock Price',
          indicators: ['ma20', 'ma50']
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('candlestick');
      expect(result.svg).toBeDefined();
      expect(result.metadata.title).toBe('Stock Price');
    });
  });
  
  describe('Pie Chart Generation', () => {
    it('should generate basic pie chart', async () => {
      const spec = {
        type: 'pie',
        data: {
          labels: ['Segment A', 'Segment B', 'Segment C'],
          datasets: [{
            data: [30, 50, 20]
          }]
        },
        config: {
          title: 'Market Share'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('pie');
      expect(result.svg).toBeDefined();
    });
    
    it('should generate donut chart', async () => {
      const spec = {
        type: 'pie',
        data: {
          labels: ['Category 1', 'Category 2', 'Category 3'],
          datasets: [{
            data: [40, 35, 25]
          }]
        },
        config: {
          title: 'Portfolio Allocation',
          donut: true,
          centerText: 'Total'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('pie');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Scatter Chart Generation', () => {
    it('should generate scatter plot with regression', async () => {
      const spec = {
        type: 'scatter',
        data: {
          points: [
            { x: 10, y: 20 },
            { x: 20, y: 35 },
            { x: 30, y: 48 },
            { x: 40, y: 65 }
          ]
        },
        config: {
          title: 'Correlation Analysis',
          showRegression: true,
          xAxis: { label: 'Variable X' },
          yAxis: { label: 'Variable Y' }
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('scatter');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Heatmap Generation', () => {
    it('should generate correlation heatmap', async () => {
      const spec = {
        type: 'heatmap',
        data: {
          rows: ['Asset A', 'Asset B', 'Asset C'],
          columns: ['Asset A', 'Asset B', 'Asset C'],
          values: [
            [1.0, 0.8, 0.3],
            [0.8, 1.0, 0.5],
            [0.3, 0.5, 1.0]
          ]
        },
        config: {
          title: 'Correlation Matrix'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('heatmap');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Waterfall Chart Generation', () => {
    it('should generate waterfall chart', async () => {
      const spec = {
        type: 'waterfall',
        data: {
          steps: [
            { label: 'Starting', value: 100, type: 'initial' },
            { label: 'Revenue', value: 50, type: 'positive' },
            { label: 'Costs', value: -30, type: 'negative' },
            { label: 'Total', value: 120, type: 'total' }
          ]
        },
        config: {
          title: 'P&L Waterfall',
          valueFormat: 'currency'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('waterfall');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Gauge Chart Generation', () => {
    it('should generate gauge chart', async () => {
      const spec = {
        type: 'gauge',
        data: {
          value: 75
        },
        config: {
          title: 'Performance Score',
          min: 0,
          max: 100,
          target: 80,
          label: 'Score'
        }
      };
      
      const result = await engine.generateChart(spec);
      
      expect(result.type).toBe('gauge');
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Theme Application', () => {
    it('should apply institutional theme', async () => {
      const engine = createVisualizationEngine({
        theme: ChartTheme.INSTITUTIONAL
      });
      
      const spec = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar'],
          datasets: [{
            label: 'Data',
            data: [10, 20, 30]
          }]
        },
        config: {
          title: 'Test Chart'
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
    
    it('should apply dark theme', async () => {
      const engine = createVisualizationEngine({
        theme: ChartTheme.DARK
      });
      
      const spec = {
        type: 'bar',
        data: {
          labels: ['A', 'B', 'C'],
          datasets: [{
            label: 'Values',
            data: [5, 10, 15]
          }]
        },
        config: {
          title: 'Dark Theme Chart'
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Output Format Support', () => {
    it('should generate chart for web format', async () => {
      const engine = createVisualizationEngine({
        format: OutputFormat.WEB,
        interactive: true,
        animations: true
      });
      
      const spec = {
        type: 'line',
        data: {
          labels: ['Q1', 'Q2', 'Q3', 'Q4'],
          datasets: [{
            label: 'Growth',
            data: [10, 15, 12, 20]
          }]
        },
        config: {
          title: 'Interactive Web Chart'
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
    
    it('should generate chart for print format', async () => {
      const engine = createVisualizationEngine({
        theme: ChartTheme.PRINT,
        format: OutputFormat.PDF,
        interactive: false,
        animations: false
      });
      
      const spec = {
        type: 'bar',
        data: {
          labels: ['Category 1', 'Category 2'],
          datasets: [{
            label: 'Values',
            data: [100, 200]
          }]
        },
        config: {
          title: 'Print-Optimized Chart'
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Chart Annotations', () => {
    it('should add annotations to chart', async () => {
      const spec = {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr'],
          datasets: [{
            label: 'Price',
            data: [100, 110, 105, 120]
          }]
        },
        config: {
          title: 'Price with Annotations',
          annotations: [
            {
              type: 'line',
              x1: 'Feb',
              y1: 110,
              x2: 'Mar',
              y2: 105,
              color: 'red',
              text: 'Price Drop'
            }
          ]
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    it('should throw error for unsupported chart type', async () => {
      const spec = {
        type: 'invalid-chart-type',
        data: {},
        config: {}
      };
      
      await expect(engine.generateChart(spec)).rejects.toThrow('Unsupported chart type');
    });
    
    it('should handle empty data gracefully', async () => {
      const spec = {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            label: 'Empty',
            data: []
          }]
        },
        config: {
          title: 'Empty Chart'
        }
      };
      
      const result = await engine.generateChart(spec);
      expect(result.svg).toBeDefined();
    });
  });
  
  describe('Chart Type Selection', () => {
    it('should select line chart for time series', () => {
      const data = {
        labels: ['2024-01-01', '2024-01-02', '2024-01-03'],
        datasets: [{ data: [100, 120, 140] }]
      };
      
      const type = selectChartType(data, 'trend');
      expect(type).toBe('line');
    });
    
    it('should select candlestick for price data', () => {
      const data = {
        labels: ['2024-01-01'],
        candles: [{ open: 100, high: 105, low: 95, close: 102 }]
      };
      
      const type = selectChartType(data, 'price');
      expect(type).toBe('candlestick');
    });
    
    it('should select bar chart for categorical data', () => {
      const data = {
        labels: ['A', 'B', 'C'],
        datasets: [{ data: [10, 20, 30] }]
      };
      
      const type = selectChartType(data, 'comparison');
      expect(type).toBe('bar');
    });
    
    it('should select pie chart for composition', () => {
      const data = {
        labels: ['Part 1', 'Part 2'],
        datasets: [{ data: [60, 40] }]
      };
      
      const type = selectChartType(data, 'composition');
      expect(type).toBe('pie');
    });
    
    it('should select scatter for correlation data', () => {
      const data = {
        points: [{ x: 1, y: 2 }, { x: 2, y: 4 }]
      };
      
      const type = selectChartType(data, 'correlation');
      expect(type).toBe('scatter');
    });
    
    it('should select gauge for single metric', () => {
      const data = {
        value: 75
      };
      
      const type = selectChartType(data, 'metric');
      expect(type).toBe('gauge');
    });
    
    it('should default to bar chart', () => {
      const data = { unknown: 'structure' };
      
      const type = selectChartType(data, 'any');
      expect(type).toBe('bar');
    });
  });
});

describe('Financial Charts', () => {
  let financialCharts: any;
  
  beforeEach(() => {
    financialCharts = createFinancialCharts({
      theme: ChartTheme.INSTITUTIONAL
    });
  });
  
  describe('Correlation Matrix', () => {
    it('should generate correlation matrix heatmap', async () => {
      const assets = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
      const correlations = [
        [1.0, 0.8, 0.6, 0.7],
        [0.8, 1.0, 0.7, 0.6],
        [0.6, 0.7, 1.0, 0.5],
        [0.7, 0.6, 0.5, 1.0]
      ];
      
      const chart = await financialCharts.createCorrelationMatrix(assets, correlations);
      
      expect(chart.svg).toBeDefined();
      expect(chart.svg).toContain('<svg>');
    });
  });
  
  describe('Performance Attribution', () => {
    it('should generate attribution waterfall', async () => {
      const factors = [
        { name: 'Market Return', value: 0.08, category: 'market' },
        { name: 'Stock Selection', value: 0.04, category: 'selection' },
        { name: 'Sector Allocation', value: 0.02, category: 'allocation' },
        { name: 'Fees', value: -0.01, category: 'costs' }
      ];
      
      const chart = await financialCharts.createAttributionWaterfall(factors);
      
      expect(chart.svg).toBeDefined();
      expect(chart.type).toBe('waterfall');
    });
  });
  
  describe('Risk/Return Scatter', () => {
    it('should create risk/return scatter plot', async () => {
      const assets = [
        { name: 'Stock A', return: 0.12, risk: 0.15, marketCap: 100e9, category: 'Tech' },
        { name: 'Stock B', return: 0.08, risk: 0.10, marketCap: 50e9, category: 'Finance' },
        { name: 'Stock C', return: 0.15, risk: 0.20, marketCap: 200e9, category: 'Tech' }
      ];
      
      const chart = await financialCharts.createRiskReturnScatter(assets);
      
      expect(chart.svg).toBeDefined();
      expect(chart.type).toBe('scatter');
    });
  });
  
  describe('Efficient Frontier', () => {
    it('should generate efficient frontier chart', async () => {
      const portfolios = [
        { risk: 0.10, return: 0.06, weights: { bonds: 0.8, stocks: 0.2 } },
        { risk: 0.12, return: 0.08, weights: { bonds: 0.6, stocks: 0.4 } },
        { risk: 0.15, return: 0.10, weights: { bonds: 0.4, stocks: 0.6 } },
        { risk: 0.18, return: 0.12, weights: { bonds: 0.2, stocks: 0.8 } },
        { risk: 0.20, return: 0.13, weights: { bonds: 0, stocks: 1.0 } }
      ];
      
      const currentPortfolio = { risk: 0.14, return: 0.09 };
      
      const chart = await financialCharts.createEfficientFrontier(
        portfolios,
        currentPortfolio
      );
      
      expect(chart.svg).toBeDefined();
      expect(chart.svg).toContain('Efficient Frontier');
      expect(chart.svg).toContain('Current Portfolio');
    });
  });
  
  describe('Dividend Chart', () => {
    it('should generate dividend history chart', async () => {
      const dividends = [
        { date: '2023-03-15', amount: 0.50, type: 'regular' as const },
        { date: '2023-06-15', amount: 0.50, type: 'regular' as const },
        { date: '2023-09-15', amount: 0.52, type: 'regular' as const },
        { date: '2023-12-15', amount: 1.00, type: 'special' as const }
      ];
      
      const stockPrices = [
        { date: '2023-01-01', price: 100 },
        { date: '2023-06-01', price: 110 },
        { date: '2023-12-31', price: 120 }
      ];
      
      const chart = await financialCharts.createDividendChart(dividends, stockPrices);
      
      expect(chart.svg).toBeDefined();
      expect(chart.svg).toContain('Dividend History');
    });
  });
  
  describe('Sector Allocation', () => {
    it('should create sector allocation donut chart', async () => {
      const sectors = [
        { name: 'Technology', value: 35 },
        { name: 'Healthcare', value: 20 },
        { name: 'Finance', value: 15 },
        { name: 'Consumer', value: 30 }
      ];
      
      const chart = await financialCharts.createSectorAllocation(sectors);
      
      expect(chart.svg).toBeDefined();
      expect(chart.type).toBe('pie');
    });
  });
  
  describe('Earnings Calendar', () => {
    it('should generate earnings calendar chart', async () => {
      const earnings = [
        { date: '2023-01-15', quarter: 'Q4 2022', actual: 2.50, estimate: 2.45 },
        { date: '2023-04-15', quarter: 'Q1 2023', actual: 2.60, estimate: 2.55 },
        { date: '2023-07-15', quarter: 'Q2 2023', actual: 2.75, estimate: 2.70 },
        { date: '2023-10-15', quarter: 'Q3 2023', estimate: 2.85 },
        { date: '2024-01-15', quarter: 'Q4 2023', estimate: 3.00 }
      ];
      
      const chart = await financialCharts.createEarningsCalendar(earnings);
      
      expect(chart.svg).toBeDefined();
      expect(chart.type).toBe('bar');
    });
  });
  
  describe('Technical Dashboard', () => {
    it('should create technical indicator dashboard', async () => {
      const priceData = [
        { date: '2024-01-01', close: 100 },
        { date: '2024-01-02', close: 102 },
        { date: '2024-01-03', close: 101 },
        { date: '2024-01-04', close: 103 },
        { date: '2024-01-05', close: 105 }
      ];
      
      const indicators = {
        rsi: [45, 50, 48, 55, 60],
        bollingerBands: {
          upper: [102, 104, 103, 105, 107],
          middle: [100, 102, 101, 103, 105],
          lower: [98, 100, 99, 101, 103]
        }
      };
      
      const result = await financialCharts.createTechnicalDashboard(
        priceData,
        indicators
      );
      
      expect(result.charts).toBeDefined();
      expect(result.charts.length).toBeGreaterThan(0);
      expect(result.layout).toBeDefined();
    });
  });
});