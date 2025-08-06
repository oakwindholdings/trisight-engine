// src/reportGeneration/visualization/financialCharts.ts
// Specialized financial chart types for investment analysis
// Context: Advanced visualizations specific to financial data

import * as d3 from 'd3';
import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import * as d3Shape from 'd3-shape';
import * as d3TimeFormat from 'd3-time-format';
import * as d3Time from 'd3-time';
import * as d3Axis from 'd3-axis';
import * as d3Selection from 'd3-selection';
import { VisualizationEngine, ChartTheme } from './visualizationEngine';

/**
 * Financial-specific chart types
 */
export class FinancialCharts extends VisualizationEngine {
  
  /**
   * Creates a correlation matrix heatmap
   * Essential for portfolio analysis
   */
  async createCorrelationMatrix(
    assets: string[],
    correlations: number[][],
    config: any = {}
  ): Promise<any> {
    const spec = {
      type: 'heatmap',
      data: {
        rows: assets,
        columns: assets,
        values: correlations
      },
      config: {
        title: 'Asset Correlation Matrix',
        colorScheme: 'correlation',
        showValues: true,
        ...config
      }
    };
    
    return this.generateChart(spec);
  }
  
  /**
   * Creates a performance attribution waterfall
   * Shows contribution of different factors to returns
   */
  async createAttributionWaterfall(
    factors: Array<{ name: string; value: number; category: string }>,
    config: any = {}
  ): Promise<any> {
    // Sort factors by category and magnitude
    const sortedFactors = [...factors].sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return Math.abs(b.value) - Math.abs(a.value);
    });
    
    // Add starting and ending values
    const steps = [
      { label: 'Starting Value', value: 0, type: 'total' },
      ...sortedFactors.map(f => ({
        label: f.name,
        value: f.value,
        type: 'change',
        category: f.category
      })),
      { label: 'Ending Value', value: 0, type: 'total' }
    ];
    
    // Calculate ending value
    steps[steps.length - 1].value = sortedFactors.reduce((sum, f) => sum + f.value, 0);
    
    const spec = {
      type: 'waterfall',
      data: { steps },
      config: {
        title: 'Performance Attribution',
        valueFormat: 'percent',
        ...config
      }
    };
    
    return this.generateChart(spec);
  }
  
  /**
   * Creates a risk/return scatter plot
   * Plots assets by risk and return characteristics
   */
  async createRiskReturnScatter(
    assets: Array<{
      name: string;
      return: number;
      risk: number;
      marketCap?: number;
      category?: string;
    }>,
    config: any = {}
  ): Promise<any> {
    const categories = [...new Set(assets.map(a => a.category || 'Other'))];
    const colorScale = d3Scale.scaleOrdinal()
      .domain(categories)
      .range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']);
    
    const points = assets.map(asset => ({
      x: asset.risk,
      y: asset.return,
      size: asset.marketCap ? Math.sqrt(asset.marketCap / 1e9) * 2 : 5,
      color: colorScale(asset.category || 'Other') as string,
      label: asset.name,
      data: asset
    }));
    
    const spec = {
      type: 'scatter',
      data: { points },
      config: {
        title: 'Risk/Return Profile',
        xAxis: {
          label: 'Risk (Standard Deviation)',
          format: 'percent'
        },
        yAxis: {
          label: 'Expected Return',
          format: 'percent'
        },
        showRegression: true,
        ...config
      }
    };
    
    return this.generateChart(spec);
  }
  
  /**
   * Creates an efficient frontier chart
   * Shows optimal portfolio combinations
   */
  async createEfficientFrontier(
    portfolios: Array<{
      risk: number;
      return: number;
      weights: { [asset: string]: number };
    }>,
    currentPortfolio?: { risk: number; return: number },
    config: any = {}
  ): Promise<any> {
    const width = 800;
    const height = 500;
    const margins = { top: 60, right: 20, bottom: 60, left: 70 };
    
    // Create SVG
    const svg = d3Selection.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Efficient Frontier');
    
    // Create chart area
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;
    
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);
    
    // Create scales
    const xScale = d3Scale.scaleLinear()
      .domain([0, (d3Array.max(portfolios, p => p.risk) || 0) * 1.1])
      .range([0, chartWidth]);

    const yScale = d3Scale.scaleLinear()
      .domain([0, (d3Array.max(portfolios, p => p.return) || 0) * 1.1])
      .range([chartHeight, 0]);
    
    // Add axes
    chart.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3Axis.axisBottom(xScale).tickFormat(d => `${((d as number) * 100).toFixed(0)}%`));

    chart.append('g')
      .call(d3Axis.axisLeft(yScale).tickFormat(d => `${((d as number) * 100).toFixed(0)}%`));
    
    // Add axis labels
    chart.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 40)
      .attr('text-anchor', 'middle')
      .text('Risk (Standard Deviation)');
    
    chart.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Expected Return');
    
    // Draw efficient frontier curve
    const line = d3Shape.line<any>()
      .x(d => xScale(d.risk))
      .y(d => yScale(d.return))
      .curve(d3Shape.curveCardinal);
    
    chart.append('path')
      .datum(portfolios)
      .attr('fill', 'none')
      .attr('stroke', '#0066CC')
      .attr('stroke-width', 3)
      .attr('d', line);
    
    // Add portfolio points
    chart.selectAll('.portfolio-point')
      .data(portfolios)
      .enter().append('circle')
      .attr('cx', d => xScale(d.risk))
      .attr('cy', d => yScale(d.return))
      .attr('r', 3)
      .attr('fill', '#0066CC')
      .attr('opacity', 0.6);
    
    // Add current portfolio if provided
    if (currentPortfolio) {
      chart.append('circle')
        .attr('cx', xScale(currentPortfolio.risk))
        .attr('cy', yScale(currentPortfolio.return))
        .attr('r', 8)
        .attr('fill', '#FF6B35')
        .attr('stroke', '#FFF')
        .attr('stroke-width', 2);
      
      chart.append('text')
        .attr('x', xScale(currentPortfolio.risk) + 10)
        .attr('y', yScale(currentPortfolio.return) - 10)
        .text('Current Portfolio')
        .style('font-size', '12px')
        .style('fill', '#FF6B35');
    }
    
    // Add feasible region shading
    const area = d3Shape.area<any>()
      .x(d => xScale(d.risk))
      .y0(chartHeight)
      .y1(d => yScale(d.return))
      .curve(d3Shape.curveCardinal);
    
    chart.append('path')
      .datum(portfolios)
      .attr('fill', '#0066CC')
      .attr('opacity', 0.1)
      .attr('d', area);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: { ...config }
    };
  }
  
  /**
   * Creates a dividend history chart
   * Shows dividend payments and growth over time
   */
  async createDividendChart(
    dividends: Array<{
      date: string;
      amount: number;
      type: 'regular' | 'special';
    }>,
    stockPrices: Array<{
      date: string;
      price: number;
    }>,
    config: any = {}
  ): Promise<any> {
    const width = 800;
    const height = 400;
    const margins = { top: 60, right: 80, bottom: 40, left: 60 };
    
    // Create SVG
    const svg = d3Selection.create('svg')
      .attr('width', width)
      .attr('height', height);
    
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom;
    
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top})`);
    
    // Parse dates
    const parseDate = d3TimeFormat.timeParse('%Y-%m-%d');
    const parsedDividends = dividends.map(d => ({
      ...d,
      parsedDate: parseDate(d.date) as Date
    }));
    const parsedPrices = stockPrices.map(d => ({
      ...d,
      parsedDate: parseDate(d.date) as Date
    }));

    // Create scales
    const xScale = d3Scale.scaleTime()
      .domain(d3Array.extent(parsedPrices, d => d.parsedDate) as [Date, Date])
      .range([0, chartWidth]);

    const yScalePrice = d3Scale.scaleLinear()
      .domain([0, (d3Array.max(parsedPrices, d => d.price) || 0) * 1.1])
      .range([chartHeight, 0]);

    const yScaleDividend = d3Scale.scaleLinear()
      .domain([0, (d3Array.max(parsedDividends, d => d.amount) || 0) * 1.2])
      .range([chartHeight, 0]);
    
    // Add axes
    chart.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3Axis.axisBottom(xScale));

    chart.append('g')
      .call(d3Axis.axisLeft(yScalePrice))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .style('fill', '#000')
      .text('Stock Price ($)');

    chart.append('g')
      .attr('transform', `translate(${chartWidth},0)`)
      .call(d3Axis.axisRight(yScaleDividend))
      .append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -40)
      .attr('x', chartHeight / 2)
      .attr('text-anchor', 'middle')
      .style('fill', '#00A651')
      .text('Dividend per Share ($)');
    
    // Draw stock price line
    const priceLine = d3Shape.line<any>()
      .x(d => xScale(d.parsedDate))
      .y(d => yScalePrice(d.price));
    
    chart.append('path')
      .datum(parsedPrices)
      .attr('fill', 'none')
      .attr('stroke', '#0066CC')
      .attr('stroke-width', 2)
      .attr('d', priceLine);
    
    // Draw dividend bars
    const regularDividends = parsedDividends.filter(d => d.type === 'regular');
    const specialDividends = parsedDividends.filter(d => d.type === 'special');
    
    // Regular dividends
    chart.selectAll('.dividend-regular')
      .data(regularDividends)
      .enter().append('rect')
      .attr('x', d => xScale(d.parsedDate) - 10)
      .attr('y', d => yScaleDividend(d.amount))
      .attr('width', 20)
      .attr('height', d => chartHeight - yScaleDividend(d.amount))
      .attr('fill', '#00A651')
      .attr('opacity', 0.7);
    
    // Special dividends
    chart.selectAll('.dividend-special')
      .data(specialDividends)
      .enter().append('rect')
      .attr('x', d => xScale(d.parsedDate) - 10)
      .attr('y', d => yScaleDividend(d.amount))
      .attr('width', 20)
      .attr('height', d => chartHeight - yScaleDividend(d.amount))
      .attr('fill', '#FFC107')
      .attr('opacity', 0.7);
    
    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Dividend History & Stock Price');
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 180}, 60)`);
    
    const legendItems = [
      { label: 'Stock Price', color: '#0066CC', type: 'line' },
      { label: 'Regular Dividend', color: '#00A651', type: 'rect' },
      { label: 'Special Dividend', color: '#FFC107', type: 'rect' }
    ];
    
    legendItems.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      if (item.type === 'line') {
        g.append('line')
          .attr('x1', 0)
          .attr('x2', 20)
          .attr('y1', 6)
          .attr('y2', 6)
          .attr('stroke', item.color)
          .attr('stroke-width', 2);
      } else {
        g.append('rect')
          .attr('width', 12)
          .attr('height', 12)
          .attr('fill', item.color)
          .attr('opacity', 0.7);
      }
      
      g.append('text')
        .attr('x', 25)
        .attr('y', 9)
        .style('font-size', '12px')
        .text(item.label);
    });
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: { ...config }
    };
  }
  
  /**
   * Creates a sector allocation donut chart
   * Shows portfolio composition by sector
   */
  async createSectorAllocation(
    sectors: Array<{ name: string; value: number; benchmark?: number }>,
    config: any = {}
  ): Promise<any> {
    // Sort sectors by value
    const sortedSectors = [...sectors].sort((a, b) => b.value - a.value);
    
    const spec = {
      type: 'pie',
      data: {
        labels: sortedSectors.map(s => s.name),
        datasets: [{
          data: sortedSectors.map(s => s.value)
        }]
      },
      config: {
        title: 'Sector Allocation',
        donut: true,
        centerText: 'Portfolio',
        ...config
      }
    };
    
    const baseChart = await this.generateChart(spec);
    
    // Add benchmark comparison if provided
    if (sectors.some(s => s.benchmark !== undefined)) {
      // Would add benchmark overlay here
    }
    
    return baseChart;
  }
  
  /**
   * Creates a earnings calendar visualization
   * Shows past and upcoming earnings with estimates
   */
  async createEarningsCalendar(
    earnings: Array<{
      date: string;
      quarter: string;
      actual?: number;
      estimate?: number;
      surprise?: number;
    }>,
    config: any = {}
  ): Promise<any> {
    const futureEarnings = earnings.filter(e => !e.actual);
    const pastEarnings = earnings.filter(e => e.actual);
    
    // Prepare data for grouped bar chart
    const spec = {
      type: 'bar',
      data: {
        labels: earnings.map(e => e.quarter),
        datasets: [
          {
            label: 'Actual',
            data: earnings.map(e => e.actual || null),
            color: '#00A651'
          },
          {
            label: 'Estimate',
            data: earnings.map(e => e.estimate || null),
            color: '#0066CC'
          }
        ]
      },
      config: {
        title: 'Earnings History & Estimates',
        yAxis: {
          label: 'EPS ($)',
          format: 'currency'
        },
        showValues: true,
        ...config
      }
    };
    
    return this.generateChart(spec);
  }
  
  /**
   * Creates a technical indicator dashboard
   * Multiple mini-charts for various indicators
   */
  async createTechnicalDashboard(
    priceData: any[],
    indicators: {
      rsi?: number[];
      macd?: { macd: number[]; signal: number[]; histogram: number[] };
      bollingerBands?: { upper: number[]; middle: number[]; lower: number[] };
      volume?: number[];
    },
    config: any = {}
  ): Promise<{ charts: any[]; layout: any }> {
    const charts = [];
    
    // Main price chart with Bollinger Bands
    if (indicators.bollingerBands) {
      const priceChart = await this.generateChart({
        type: 'line',
        data: {
          labels: priceData.map(d => d.date),
          datasets: [
            {
              label: 'Price',
              data: priceData.map(d => d.close),
              color: '#000'
            },
            {
              label: 'Upper Band',
              data: indicators.bollingerBands.upper,
              color: '#FF6B35'
            },
            {
              label: 'Lower Band',
              data: indicators.bollingerBands.lower,
              color: '#FF6B35'
            }
          ]
        },
        config: {
          title: 'Price & Bollinger Bands',
          height: 300
        }
      });
      charts.push(priceChart);
    }
    
    // RSI chart
    if (indicators.rsi) {
      const rsiChart = await this.generateChart({
        type: 'line',
        data: {
          labels: priceData.map(d => d.date),
          datasets: [{
            label: 'RSI',
            data: indicators.rsi,
            color: '#0066CC'
          }]
        },
        config: {
          title: 'Relative Strength Index',
          height: 150,
          yAxis: {
            min: 0,
            max: 100
          },
          annotations: [
            { type: 'line', y: 70, color: '#FF6B35', dashed: true },
            { type: 'line', y: 30, color: '#00A651', dashed: true }
          ]
        }
      });
      charts.push(rsiChart);
    }
    
    // MACD chart
    if (indicators.macd) {
      const macdData = {
        type: 'line',
        data: {
          labels: priceData.map(d => d.date),
          datasets: [
            {
              label: 'MACD',
              data: indicators.macd.macd,
              color: '#0066CC'
            },
            {
              label: 'Signal',
              data: indicators.macd.signal,
              color: '#FF6B35'
            }
          ]
        },
        config: {
          title: 'MACD',
          height: 150
        }
      };
      
      const macdChart = await this.generateChart(macdData);
      charts.push(macdChart);
    }
    
    return {
      charts,
      layout: {
        type: 'vertical',
        spacing: 20
      }
    };
  }
}

/**
 * Creates a financial charts engine
 */
export function createFinancialCharts(config?: any): FinancialCharts {
  return new FinancialCharts(config);
}