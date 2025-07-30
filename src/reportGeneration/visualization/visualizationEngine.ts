// src/reportGeneration/visualization/visualizationEngine.ts
// Sophisticated visualization engine for financial charts and graphs
// Context: Transforms data into professional investment visualizations

import * as d3 from 'd3';
import { ChartSpecification } from '../templates/reportTemplateEngine';

/**
 * Visualization configuration options
 */
export interface VisualizationConfig {
  theme: ChartTheme;
  size: ChartSize;
  format: OutputFormat;
  interactive: boolean;
  animations: boolean;
  annotations: boolean;
  branding?: BrandingConfig;
}

/**
 * Chart themes for different contexts
 */
export enum ChartTheme {
  INSTITUTIONAL = 'institutional',  // Bloomberg/Reuters style
  MODERN = 'modern',                // Tech-forward style
  CLASSIC = 'classic',              // Traditional finance style
  DARK = 'dark',                    // Dark mode
  PRINT = 'print'                   // Print-optimized
}

/**
 * Chart size presets
 */
export interface ChartSize {
  width: number;
  height: number;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Output format affects rendering decisions
 */
export enum OutputFormat {
  WEB = 'web',
  PDF = 'pdf',
  PNG = 'png',
  SVG = 'svg',
  POWERPOINT = 'powerpoint'
}

/**
 * Branding configuration for charts
 */
export interface BrandingConfig {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  watermark?: string;
}

/**
 * Generated chart output
 */
export interface GeneratedChart {
  type: string;
  svg?: string;
  canvas?: HTMLCanvasElement;
  config: any;
  metadata: ChartMetadata;
}

/**
 * Chart metadata for rendering
 */
export interface ChartMetadata {
  title: string;
  subtitle?: string;
  source?: string;
  notes?: string;
  lastUpdated: string;
}

/**
 * Color palettes for different themes
 */
const COLOR_PALETTES = {
  institutional: {
    primary: '#0066CC',
    secondary: '#FF6B35',
    positive: '#00A651',
    negative: '#DC3545',
    neutral: '#6C757D',
    background: '#FFFFFF',
    grid: '#E0E0E0',
    text: '#212529',
    series: ['#0066CC', '#FF6B35', '#00A651', '#6C757D', '#FFC107', '#6F42C1']
  },
  modern: {
    primary: '#10B981',
    secondary: '#3B82F6',
    positive: '#10B981',
    negative: '#EF4444',
    neutral: '#6B7280',
    background: '#FFFFFF',
    grid: '#F3F4F6',
    text: '#111827',
    series: ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899']
  },
  dark: {
    primary: '#60A5FA',
    secondary: '#34D399',
    positive: '#34D399',
    negative: '#F87171',
    neutral: '#9CA3AF',
    background: '#111827',
    grid: '#374151',
    text: '#F9FAFB',
    series: ['#60A5FA', '#34D399', '#A78BFA', '#FBBF24', '#F87171', '#F472B6']
  },
  classic: {
    primary: '#004080',
    secondary: '#800040',
    positive: '#006400',
    negative: '#8B0000',
    neutral: '#4A4A4A',
    background: '#F8F8F8',
    grid: '#CCCCCC',
    text: '#000000',
    series: ['#004080', '#800040', '#006400', '#FF8C00', '#8B0000', '#4B0082']
  },
  print: {
    primary: '#000000',
    secondary: '#666666',
    positive: '#000000',
    negative: '#666666',
    neutral: '#999999',
    background: '#FFFFFF',
    grid: '#CCCCCC',
    text: '#000000',
    series: ['#000000', '#666666', '#999999', '#CCCCCC', '#333333', '#E6E6E6']
  }
};

/**
 * Main visualization engine
 * Creates professional financial charts from specifications
 */
export class VisualizationEngine {
  private config: VisualizationConfig;
  private colorPalette: any;
  
  constructor(config: Partial<VisualizationConfig> = {}) {
    this.config = {
      theme: ChartTheme.INSTITUTIONAL,
      size: this.getDefaultSize(),
      format: OutputFormat.WEB,
      interactive: true,
      animations: true,
      annotations: true,
      ...config
    };
    
    this.colorPalette = COLOR_PALETTES[this.config.theme];
  }
  
  /**
   * Generates a chart from specification
   * Main entry point for chart creation
   */
  async generateChart(spec: ChartSpecification): Promise<GeneratedChart> {
    // Select appropriate generator based on chart type
    const generator = this.getChartGenerator(spec.type);
    
    if (!generator) {
      throw new Error(`Unsupported chart type: ${spec.type}`);
    }
    
    // Prepare chart metadata
    const metadata: ChartMetadata = {
      title: spec.config.title || '',
      subtitle: spec.config.subtitle,
      source: spec.config.source || 'TriSight Analysis',
      notes: spec.config.notes,
      lastUpdated: new Date().toISOString()
    };
    
    // Generate the chart
    const chart = await generator.call(this, spec, metadata);
    
    return {
      type: spec.type,
      ...chart,
      metadata
    };
  }
  
  /**
   * Gets the appropriate chart generator function
   */
  private getChartGenerator(type: string): Function | null {
    const generators: { [key: string]: Function } = {
      'line': this.generateLineChart,
      'bar': this.generateBarChart,
      'candlestick': this.generateCandlestickChart,
      'pie': this.generatePieChart,
      'scatter': this.generateScatterChart,
      'heatmap': this.generateHeatmap,
      'waterfall': this.generateWaterfallChart,
      'treemap': this.generateTreemap,
      'gauge': this.generateGaugeChart,
      'sankey': this.generateSankeyChart
    };
    
    return generators[type] || null;
  }
  
  /**
   * Generates a line chart for time series data
   * Commonly used for revenue, price trends, etc.
   */
  private async generateLineChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG container
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add title and subtitle
    this.addChartHeader(svg, metadata, width);
    
    // Calculate chart dimensions
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom - 60; // Space for header
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Parse dates if needed
    const parseTime = d3.timeParse('%Y-%m-%d');
    const labels = data.labels.map((d: any) => 
      typeof d === 'string' && d.match(/^\d{4}-\d{2}-\d{2}$/) ? parseTime(d) : d
    );
    
    // Create scales
    const xScale = this.createXScale(labels, [0, chartWidth]);
    const yExtent = this.calculateYExtent(data.datasets);
    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0])
      .nice();
    
    // Add grid lines
    this.addGridLines(chart, xScale, yScale, chartWidth, chartHeight);
    
    // Add axes
    this.addAxes(chart, xScale, yScale, chartWidth, chartHeight, config);
    
    // Create line generator
    const line = d3.line<number>()
      .defined(d => d != null && !isNaN(d))
      .x((d, i) => xScale(labels[i]) as number)
      .y(d => yScale(d) as number);
    
    // Add lines for each dataset
    data.datasets.forEach((dataset: any, index: number) => {
      const color = dataset.color || this.colorPalette.series[index % this.colorPalette.series.length];
      
      // Add line
      const path = chart.append('path')
        .datum(dataset.data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2)
        .attr('d', line as any)
        .attr('class', `line-${index}`);
      
      // Add animation if enabled
      if (this.config.animations && path.node()) {
        const totalLength = (path.node() as SVGPathElement).getTotalLength();
        path
          .attr('stroke-dasharray', totalLength + ' ' + totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1500)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0);
      }
      
      // Add data points if not too many
      if (dataset.data.length <= 50) {
        chart.selectAll(`.dot-${index}`)
          .data(dataset.data)
          .enter().append('circle')
          .attr('class', `dot-${index}`)
          .attr('cx', (d, i) => xScale(labels[i]) as number)
          .attr('cy', d => yScale(d) as number)
          .attr('r', 3)
          .attr('fill', color)
          .style('opacity', 0)
          .transition()
          .delay((d, i) => i * 30)
          .style('opacity', 1);
      }
      
      // Add series label
      if (data.datasets.length > 1) {
        this.addSeriesLabel(chart, dataset, index, labels, xScale, yScale, color);
      }
    });
    
    // Add interactive elements if enabled
    if (this.config.interactive) {
      this.addLineChartInteractivity(chart, data, labels, xScale, yScale, chartWidth, chartHeight);
    }
    
    // Add annotations if any
    if (config.annotations) {
      this.addAnnotations(chart, config.annotations, xScale, yScale);
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale }
      }
    };
  }
  
  /**
   * Generates a bar chart for categorical comparisons
   * Used for peer comparisons, segment breakdowns, etc.
   */
  private async generateBarChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom - 60;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.labels)
      .range([0, chartWidth])
      .padding(0.1);
    
    const yMax = (d3.max(data.datasets.flatMap((d: any) => d.data)) || 0) * 1.1;
    const yScale = d3.scaleLinear()
      .domain([0, yMax])
      .range([chartHeight, 0])
      .nice();
    
    // Add grid
    this.addGridLines(chart, xScale as any, yScale, chartWidth, chartHeight);
    
    // Add axes
    this.addAxes(chart, xScale as any, yScale, chartWidth, chartHeight, config);
    
    // Create bars
    if (data.datasets.length === 1) {
      // Single series - simple bars
      const dataset = data.datasets[0];
      const color = dataset.color || this.colorPalette.primary;
      
      chart.selectAll('.bar')
        .data(dataset.data)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => xScale(data.labels[i]) as number)
        .attr('y', chartHeight)
        .attr('width', xScale.bandwidth())
        .attr('height', 0)
        .attr('fill', color)
        .transition()
        .duration(1000)
        .attr('y', d => yScale(d) as number)
        .attr('height', d => chartHeight - (yScale(d) as number));
      
      // Add value labels
      if (config.showValues) {
        chart.selectAll('.value-label')
          .data(dataset.data)
          .enter().append('text')
          .attr('class', 'value-label')
          .attr('x', (d, i) => (xScale(data.labels[i]) as number) + xScale.bandwidth() / 2)
          .attr('y', d => (yScale(d) as number) - 5)
          .attr('text-anchor', 'middle')
          .style('font-size', '11px')
          .style('fill', this.colorPalette.text)
          .style('opacity', 0)
          .text(d => this.formatValue(d, config.yAxis?.format))
          .transition()
          .delay(1000)
          .style('opacity', 1);
      }
    } else {
      // Multiple series - grouped bars
      const groupScale = d3.scaleBand()
        .domain(data.datasets.map((d: any, i: number) => i.toString()))
        .range([0, xScale.bandwidth()])
        .padding(0.05);
      
      const groups = chart.selectAll('.bar-group')
        .data(data.labels)
        .enter().append('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(${xScale(d)},0)`);
      
      data.datasets.forEach((dataset: any, datasetIndex: number) => {
        const color = dataset.color || this.colorPalette.series[datasetIndex % this.colorPalette.series.length];
        
        groups.selectAll(`.bar-${datasetIndex}`)
          .data([dataset])
          .enter().append('rect')
          .attr('class', `bar-${datasetIndex}`)
          .attr('x', () => groupScale(datasetIndex.toString()) as number)
          .attr('y', chartHeight)
          .attr('width', groupScale.bandwidth())
          .attr('height', 0)
          .attr('fill', color)
          .transition()
          .duration(1000)
          .attr('y', (d, i, nodes) => {
            const parentIndex = this.getParentIndex(groups.nodes(), nodes[i]);
            return yScale(d.data[parentIndex]) as number;
          })
          .attr('height', (d, i, nodes) => {
            const parentIndex = this.getParentIndex(groups.nodes(), nodes[i]);
            return chartHeight - (yScale(d.data[parentIndex]) as number);
          });
      });
      
      // Add legend for multiple series
      this.addLegend(svg, data.datasets, width);
    }
    
    // Add interactivity
    if (this.config.interactive) {
      this.addBarChartInteractivity(chart, data, xScale, yScale);
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale }
      }
    };
  }
  
  /**
   * Generates a candlestick chart for price data
   * Essential for technical analysis sections
   */
  private async generateCandlestickChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions (extra space for volume)
    const chartWidth = width - margins.left - margins.right;
    const mainChartHeight = (height - margins.top - margins.bottom - 60) * 0.7;
    const volumeChartHeight = (height - margins.top - margins.bottom - 60) * 0.2;
    
    // Create main chart group
    const mainChart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Create volume chart group
    const volumeChart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60 + mainChartHeight + 20})`);
    
    // Parse candle data
    const candles = data.candles.map((c: any) => ({
      date: new Date(c.date),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume
    }));
    
    // Create scales
    const xScale = d3.scaleTime()
      .domain(d3.extent(candles, d => d.date) as [Date, Date])
      .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([
        (d3.min(candles, d => d.low) || 0) * 0.98,
        (d3.max(candles, d => d.high) || 0) * 1.02
      ])
      .range([mainChartHeight, 0]);
    
    const volumeScale = d3.scaleLinear()
      .domain([0, d3.max(candles, d => d.volume) || 0])
      .range([volumeChartHeight, 0]);
    
    // Add grid lines to main chart
    this.addGridLines(mainChart, xScale as any, yScale, chartWidth, mainChartHeight);
    
    // Add axes
    this.addAxes(mainChart, xScale as any, yScale, chartWidth, mainChartHeight, {
      ...config,
      xAxis: { ...config.xAxis, format: 'date' }
    });
    
    // Calculate candle width
    const candleWidth = Math.max(1, chartWidth / candles.length * 0.8);
    
    // Draw candlesticks
    const candleGroup = mainChart.append('g').attr('class', 'candles');
    
    candles.forEach((candle, i) => {
      const x = xScale(candle.date);
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? this.colorPalette.positive : this.colorPalette.negative;
      
      // Draw high-low line
      candleGroup.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', yScale(candle.high))
        .attr('y2', yScale(candle.low))
        .attr('stroke', color)
        .attr('stroke-width', 1);
      
      // Draw candle body
      const bodyTop = yScale(Math.max(candle.open, candle.close));
      const bodyBottom = yScale(Math.min(candle.open, candle.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      
      candleGroup.append('rect')
        .attr('x', x - candleWidth / 2)
        .attr('y', bodyTop)
        .attr('width', candleWidth)
        .attr('height', bodyHeight)
        .attr('fill', isGreen ? color : 'none')
        .attr('stroke', color)
        .attr('stroke-width', isGreen ? 0 : 1);
    });
    
    // Add moving averages if specified
    if (config.indicators) {
      this.addMovingAverages(mainChart, candles, config.indicators, xScale, yScale);
    }
    
    // Draw volume bars
    const volumeBars = volumeChart.selectAll('.volume-bar')
      .data(candles)
      .enter().append('rect')
      .attr('class', 'volume-bar')
      .attr('x', d => xScale(d.date) - candleWidth / 2)
      .attr('y', d => volumeScale(d.volume))
      .attr('width', candleWidth)
      .attr('height', d => volumeChartHeight - volumeScale(d.volume))
      .attr('fill', d => d.close >= d.open ? this.colorPalette.positive : this.colorPalette.negative)
      .attr('opacity', 0.5);
    
    // Add volume axis
    const volumeAxis = d3.axisLeft(volumeScale)
      .ticks(3)
      .tickFormat(d => this.formatValue(d as number, 'volume'));
    
    volumeChart.append('g')
      .call(volumeAxis)
      .style('font-size', '10px');
    
    // Add interactivity
    if (this.config.interactive) {
      this.addCandlestickInteractivity(mainChart, candles, xScale, yScale, chartWidth, mainChartHeight);
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale, volume: volumeScale }
      }
    };
  }
  
  /**
   * Generates a pie chart for composition analysis
   * Used for portfolio allocation, segment breakdown, etc.
   */
  private async generatePieChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Calculate dimensions
    const radius = Math.min(width, height - 120) / 2 * 0.8;
    const centerX = width / 2;
    const centerY = (height + 60) / 2;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Prepare data
    const dataset = data.datasets[0];
    const pieData = d3.pie<number>()
      .value(d => d)
      .sort(null)(dataset.data);
    
    // Create arc generator
    const arc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(config.donut ? radius * 0.6 : 0)
      .outerRadius(radius);
    
    // Create label arc
    const labelArc = d3.arc<d3.PieArcDatum<number>>()
      .innerRadius(radius * 0.8)
      .outerRadius(radius * 0.8);
    
    // Draw slices
    const slices = chart.selectAll('.slice')
      .data(pieData)
      .enter().append('g')
      .attr('class', 'slice');
    
    slices.append('path')
      .attr('d', arc as any)
      .attr('fill', (d, i) => this.colorPalette.series[i % this.colorPalette.series.length])
      .attr('stroke', this.colorPalette.background)
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(1000)
      .style('opacity', 1)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t) as any) as string;
        };
      });
    
    // Add labels
    const threshold = 0.05; // Don't show labels for slices < 5%
    
    slices.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .style('fill', this.colorPalette.text)
      .style('opacity', 0)
      .text((d, i) => {
        const percent = (d.endAngle - d.startAngle) / (2 * Math.PI);
        return percent > threshold ? `${data.labels[i]}\n${(percent * 100).toFixed(1)}%` : '';
      })
      .transition()
      .delay(1000)
      .style('opacity', 1);
    
    // Add center text for donut charts
    if (config.donut && config.centerText) {
      chart.append('text')
        .attr('text-anchor', 'middle')
        .attr('y', 0)
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', this.colorPalette.text)
        .text(config.centerText);
    }
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 150}, ${height - data.labels.length * 20 - 20})`);
    
    data.labels.forEach((label: string, i: number) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', this.colorPalette.series[i % this.colorPalette.series.length]);
      
      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 9)
        .style('font-size', '11px')
        .style('fill', this.colorPalette.text)
        .text(`${label} (${(dataset.data[i] / d3.sum(dataset.data) * 100).toFixed(1)}%)`);
    });
    
    // Add interactivity
    if (this.config.interactive) {
      this.addPieChartInteractivity(slices, data, arc);
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        arc,
        radius
      }
    };
  }
  
  /**
   * Generates a scatter plot for correlation analysis
   */
  private async generateScatterChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom - 60;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Create scales
    const xExtent = d3.extent(data.points, (d: any) => d.x) as [number, number];
    const yExtent = d3.extent(data.points, (d: any) => d.y) as [number, number];
    
    const xScale = d3.scaleLinear()
      .domain([xExtent[0] * 0.9, xExtent[1] * 1.1])
      .range([0, chartWidth]);
    
    const yScale = d3.scaleLinear()
      .domain([yExtent[0] * 0.9, yExtent[1] * 1.1])
      .range([chartHeight, 0]);
    
    // Add grid
    this.addGridLines(chart, xScale as any, yScale, chartWidth, chartHeight);
    
    // Add axes
    this.addAxes(chart, xScale as any, yScale, chartWidth, chartHeight, config);
    
    // Add regression line if specified
    if (config.showRegression) {
      const regression = this.calculateRegression(data.points);
      const regressionLine = chart.append('line')
        .attr('x1', xScale(xExtent[0]))
        .attr('y1', yScale(regression.predict(xExtent[0])))
        .attr('x2', xScale(xExtent[1]))
        .attr('y2', yScale(regression.predict(xExtent[1])))
        .attr('stroke', this.colorPalette.primary)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.7);
      
      // Add R² value
      chart.append('text')
        .attr('x', chartWidth - 10)
        .attr('y', 20)
        .attr('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', this.colorPalette.text)
        .text(`R² = ${regression.r2.toFixed(3)}`);
    }
    
    // Add points
    const points = chart.selectAll('.point')
      .data(data.points)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('cx', (d: any) => xScale(d.x))
      .attr('cy', (d: any) => yScale(d.y))
      .attr('r', 0)
      .attr('fill', (d: any) => d.color || this.colorPalette.primary)
      .attr('opacity', 0.7)
      .transition()
      .duration(1000)
      .attr('r', (d: any) => d.size || 4);
    
    // Add interactivity
    if (this.config.interactive) {
      this.addScatterInteractivity(chart, points, data, xScale, yScale);
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale }
      }
    };
  }
  
  /**
   * Generates a heatmap for correlation matrices
   */
  private async generateHeatmap(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions
    const chartWidth = width - margins.left - margins.right - 100; // Extra space for labels
    const chartHeight = height - margins.top - margins.bottom - 100;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left + 50},${margins.top + 60})`);
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(data.columns)
      .range([0, chartWidth])
      .padding(0.05);
    
    const yScale = d3.scaleBand()
      .domain(data.rows)
      .range([0, chartHeight])
      .padding(0.05);
    
    // Create color scale
    const extent = d3.extent(data.values.flat()) as [number, number];
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRdBu)
      .domain([extent[1], extent[0]]); // Reversed for correlation (positive = blue)
    
    // Draw cells
    const cells = chart.selectAll('.cell')
      .data(data.values.flatMap((row: number[], i: number) => 
        row.map((value: number, j: number) => ({
          row: i,
          col: j,
          value: value
        }))
      ))
      .enter().append('g')
      .attr('class', 'cell');
    
    cells.append('rect')
      .attr('x', d => xScale(data.columns[d.col]) as number)
      .attr('y', d => yScale(data.rows[d.row]) as number)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('fill', this.colorPalette.background)
      .transition()
      .duration(1000)
      .attr('fill', d => colorScale(d.value));
    
    // Add text values
    cells.append('text')
      .attr('x', d => (xScale(data.columns[d.col]) as number) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(data.rows[d.row]) as number) + yScale.bandwidth() / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .style('font-size', '11px')
      .style('fill', d => Math.abs(d.value) > 0.5 ? 'white' : this.colorPalette.text)
      .style('opacity', 0)
      .text(d => d.value.toFixed(2))
      .transition()
      .delay(1000)
      .style('opacity', 1);
    
    // Add axes
    chart.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .style('text-anchor', 'end');
    
    chart.append('g')
      .call(d3.axisLeft(yScale));
    
    // Add color legend
    this.addColorLegend(svg, colorScale, width - 80, margins.top + 80);
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale, color: colorScale }
      }
    };
  }
  
  /**
   * Generates a waterfall chart for variance analysis
   */
  private async generateWaterfallChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom - 60;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Process waterfall data
    let cumulative = 0;
    const processedData = data.steps.map((step: any) => {
      const start = cumulative;
      cumulative += step.value;
      return {
        ...step,
        start,
        end: cumulative,
        isTotal: step.type === 'total'
      };
    });
    
    // Create scales
    const xScale = d3.scaleBand()
      .domain(processedData.map(d => d.label))
      .range([0, chartWidth])
      .padding(0.1);
    
    const yExtent = d3.extent(processedData.flatMap(d => [d.start, d.end])) as [number, number];
    const yScale = d3.scaleLinear()
      .domain([Math.min(0, yExtent[0]), Math.max(0, yExtent[1])])
      .range([chartHeight, 0])
      .nice();
    
    // Add grid
    this.addGridLines(chart, xScale as any, yScale, chartWidth, chartHeight);
    
    // Add axes
    this.addAxes(chart, xScale as any, yScale, chartWidth, chartHeight, config);
    
    // Draw bars
    const bars = chart.selectAll('.waterfall-bar')
      .data(processedData)
      .enter().append('g')
      .attr('class', 'waterfall-bar');
    
    bars.append('rect')
      .attr('x', d => xScale(d.label) as number)
      .attr('y', d => d.isTotal ? yScale(d.end) : yScale(Math.max(d.start, d.end)))
      .attr('width', xScale.bandwidth())
      .attr('height', d => d.isTotal ? 
        Math.abs(yScale(0) - yScale(d.end)) :
        Math.abs(yScale(d.start) - yScale(d.end)))
      .attr('fill', d => 
        d.isTotal ? this.colorPalette.primary :
        d.value >= 0 ? this.colorPalette.positive : this.colorPalette.negative)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', d => d.isTotal ? 1 : 0.8);
    
    // Add connectors
    processedData.forEach((d: any, i: number) => {
      if (i > 0 && !d.isTotal) {
        chart.append('line')
          .attr('x1', (xScale(processedData[i - 1].label) as number) + xScale.bandwidth())
          .attr('y1', yScale(d.start))
          .attr('x2', xScale(d.label) as number)
          .attr('y2', yScale(d.start))
          .attr('stroke', this.colorPalette.grid)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0)
          .transition()
          .delay(500)
          .duration(500)
          .attr('opacity', 1);
      }
    });
    
    // Add value labels
    bars.append('text')
      .attr('x', d => (xScale(d.label) as number) + xScale.bandwidth() / 2)
      .attr('y', d => {
        if (d.isTotal) return yScale(d.end) - 5;
        return d.value >= 0 ? yScale(d.end) - 5 : yScale(d.end) + 15;
      })
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', this.colorPalette.text)
      .style('opacity', 0)
      .text(d => this.formatValue(Math.abs(d.value), config.valueFormat))
      .transition()
      .delay(1000)
      .style('opacity', 1);
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scales: { x: xScale, y: yScale }
      }
    };
  }
  
  /**
   * Generates a treemap for hierarchical data
   */
  private async generateTreemap(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height, margins } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Chart dimensions
    const chartWidth = width - margins.left - margins.right;
    const chartHeight = height - margins.top - margins.bottom - 60;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${margins.left},${margins.top + 60})`);
    
    // Create hierarchy
    const root = d3.hierarchy(data)
      .sum((d: any) => d.value)
      .sort((a, b) => (b.value || 0) - (a.value || 0));
    
    // Create treemap layout
    d3.treemap<any>()
      .size([chartWidth, chartHeight])
      .padding(2)
      (root);
    
    // Create color scale
    const categories = [...new Set(root.leaves().map(d => d.data.category))];
    const colorScale = d3.scaleOrdinal()
      .domain(categories)
      .range(this.colorPalette.series);
    
    // Draw rectangles
    const cells = chart.selectAll('.cell')
      .data(root.leaves())
      .enter().append('g')
      .attr('class', 'cell')
      .attr('transform', d => `translate(${(d as any).x0},${(d as any).y0})`);
    
    cells.append('rect')
      .attr('width', d => (d as any).x1 - (d as any).x0)
      .attr('height', d => (d as any).y1 - (d as any).y0)
      .attr('fill', d => colorScale(d.data.category) as string)
      .attr('opacity', 0)
      .transition()
      .duration(1000)
      .attr('opacity', 0.8);
    
    // Add labels for larger cells
    cells.append('text')
      .attr('x', 4)
      .attr('y', 16)
      .style('font-size', d => {
        const width = (d as any).x1 - (d as any).x0;
        const height = (d as any).y1 - (d as any).y0;
        return Math.min(14, width / 8, height / 2) + 'px';
      })
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => {
        const width = (d as any).x1 - (d as any).x0;
        return width > 50 ? d.data.name : '';
      })
      .transition()
      .delay(1000)
      .style('opacity', 1);
    
    // Add value labels for larger cells
    cells.append('text')
      .attr('x', 4)
      .attr('y', 32)
      .style('font-size', d => {
        const width = (d as any).x1 - (d as any).x0;
        const height = (d as any).y1 - (d as any).y0;
        return Math.min(11, width / 10, height / 3) + 'px';
      })
      .style('fill', 'white')
      .style('opacity', 0)
      .text(d => {
        const width = (d as any).x1 - (d as any).x0;
        const height = (d as any).y1 - (d as any).y0;
        return width > 80 && height > 40 ? this.formatValue((d as any).value, config.valueFormat) : '';
      })
      .transition()
      .delay(1000)
      .style('opacity', 0.8);
    
    // Add legend
    this.addCategoryLegend(svg, categories, colorScale, width);
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        colorScale
      }
    };
  }
  
  /**
   * Generates a gauge chart for single metrics
   */
  private async generateGaugeChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    const { data, config } = spec;
    const { width, height } = this.config.size;
    
    // Create SVG
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background-color', this.colorPalette.background);
    
    // Add header
    this.addChartHeader(svg, metadata, width);
    
    // Calculate dimensions
    const radius = Math.min(width, height - 120) / 2 * 0.8;
    const centerX = width / 2;
    const centerY = height / 2 + 30;
    
    // Create chart group
    const chart = svg.append('g')
      .attr('transform', `translate(${centerX},${centerY})`);
    
    // Configuration
    const minValue = config.min || 0;
    const maxValue = config.max || 100;
    const value = Math.max(minValue, Math.min(maxValue, data.value));
    
    // Create arc generator
    const arc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);
    
    // Background arc
    chart.append('path')
      .attr('d', arc as any)
      .attr('fill', this.colorPalette.grid);
    
    // Value arc
    const valueAngle = -Math.PI / 2 + (value - minValue) / (maxValue - minValue) * Math.PI;
    const valueArc = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(valueAngle);
    
    const valuePath = chart.append('path')
      .attr('d', valueArc as any)
      .attr('fill', this.getGaugeColor(value, minValue, maxValue))
      .attr('opacity', 0)
      .transition()
      .duration(1500)
      .attr('opacity', 1)
      .attrTween('d', function() {
        const interpolate = d3.interpolate(-Math.PI / 2, valueAngle);
        return function(t) {
          return d3.arc()
            .innerRadius(radius * 0.7)
            .outerRadius(radius)
            .startAngle(-Math.PI / 2)
            .endAngle(interpolate(t))() as string;
        };
      });
    
    // Add scale markings
    const scale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([-Math.PI / 2, Math.PI / 2]);
    
    const ticks = scale.ticks(5);
    
    ticks.forEach(tick => {
      const angle = scale(tick);
      const x1 = Math.cos(angle) * radius * 0.65;
      const y1 = Math.sin(angle) * radius * 0.65;
      const x2 = Math.cos(angle) * radius * 0.6;
      const y2 = Math.sin(angle) * radius * 0.6;
      
      chart.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', this.colorPalette.text)
        .attr('stroke-width', 1);
      
      chart.append('text')
        .attr('x', Math.cos(angle) * radius * 0.5)
        .attr('y', Math.sin(angle) * radius * 0.5)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '10px')
        .style('fill', this.colorPalette.text)
        .text(tick);
    });
    
    // Add value text
    const valueText = chart.append('text')
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '36px')
      .style('font-weight', 'bold')
      .style('fill', this.colorPalette.text)
      .text('0');
    
    valueText.transition()
      .duration(1500)
      .tween('text', function() {
        const interpolate = d3.interpolateNumber(0, value);
        return function(t) {
          (this as any).textContent = interpolate(t).toFixed(1);
        };
      });
    
    // Add label
    chart.append('text')
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('fill', this.colorPalette.text)
      .text(config.label || 'Value');
    
    // Add target line if specified
    if (config.target !== undefined) {
      const targetAngle = scale(config.target);
      const targetX = Math.cos(targetAngle) * radius * 1.1;
      const targetY = Math.sin(targetAngle) * radius * 1.1;
      
      chart.append('line')
        .attr('x1', Math.cos(targetAngle) * radius * 0.6)
        .attr('y1', Math.sin(targetAngle) * radius * 0.6)
        .attr('x2', targetX)
        .attr('y2', targetY)
        .attr('stroke', this.colorPalette.primary)
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5');
      
      chart.append('text')
        .attr('x', targetX)
        .attr('y', targetY - 5)
        .attr('text-anchor', 'middle')
        .style('font-size', '11px')
        .style('fill', this.colorPalette.primary)
        .text('Target');
    }
    
    // Add footer
    this.addChartFooter(svg, metadata, width, height);
    
    return {
      svg: (svg.node() as SVGSVGElement).outerHTML,
      config: {
        ...config,
        scale
      }
    };
  }
  
  /**
   * Generates a Sankey diagram for flow analysis
   */
  private async generateSankeyChart(
    spec: ChartSpecification,
    metadata: ChartMetadata
  ): Promise<{ svg: string; config: any }> {
    // Sankey implementation would go here
    // This is a placeholder for the complex Sankey logic
    return {
      svg: '<svg></svg>',
      config: spec.config
    };
  }
  
  // Helper methods
  
  /**
   * Gets default chart size based on format
   */
  private getDefaultSize(): ChartSize {
    return {
      width: 800,
      height: 500,
      margins: {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60
      }
    };
  }
  
  /**
   * Adds chart header with title and subtitle
   */
  private addChartHeader(svg: any, metadata: ChartMetadata, width: number): void {
    const header = svg.append('g')
      .attr('class', 'chart-header');
    
    if (metadata.title) {
      header.append('text')
        .attr('x', width / 2)
        .attr('y', 25)
        .attr('text-anchor', 'middle')
        .style('font-size', '18px')
        .style('font-weight', 'bold')
        .style('fill', this.colorPalette.text)
        .text(metadata.title);
    }
    
    if (metadata.subtitle) {
      header.append('text')
        .attr('x', width / 2)
        .attr('y', 45)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('fill', this.colorPalette.text)
        .style('opacity', 0.8)
        .text(metadata.subtitle);
    }
  }
  
  /**
   * Adds chart footer with source and notes
   */
  private addChartFooter(svg: any, metadata: ChartMetadata, width: number, height: number): void {
    const footer = svg.append('g')
      .attr('class', 'chart-footer')
      .attr('transform', `translate(0,${height - 20})`);
    
    if (metadata.source) {
      footer.append('text')
        .attr('x', 10)
        .attr('y', 10)
        .style('font-size', '10px')
        .style('fill', this.colorPalette.text)
        .style('opacity', 0.6)
        .text(`Source: ${metadata.source}`);
    }
    
    if (metadata.notes) {
      footer.append('text')
        .attr('x', width - 10)
        .attr('y', 10)
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .style('fill', this.colorPalette.text)
        .style('opacity', 0.6)
        .text(metadata.notes);
    }
  }
  
  /**
   * Creates appropriate X scale based on data type
   */
  private createXScale(data: any[], range: number[]): any {
    if (data.length === 0) return d3.scaleLinear().domain([0, 1]).range(range);
    
    // Check if dates
    if (data[0] instanceof Date) {
      return d3.scaleTime()
        .domain(d3.extent(data) as [Date, Date])
        .range(range);
    }
    
    // Check if numbers
    if (typeof data[0] === 'number') {
      return d3.scaleLinear()
        .domain(d3.extent(data) as [number, number])
        .range(range);
    }
    
    // Default to band scale for categories
    return d3.scaleBand()
      .domain(data)
      .range(range)
      .padding(0.1);
  }
  
  /**
   * Calculates Y extent for multiple datasets
   */
  private calculateYExtent(datasets: any[]): [number, number] {
    const allValues = datasets.flatMap(d => d.data).filter(v => v != null && !isNaN(v));
    
    if (allValues.length === 0) return [0, 1];
    
    const min = d3.min(allValues) as number;
    const max = d3.max(allValues) as number;
    
    // Add padding
    const padding = (max - min) * 0.1;
    
    return [
      Math.min(0, min - padding), // Include zero if positive only
      max + padding
    ];
  }
  
  /**
   * Adds grid lines to chart
   */
  private addGridLines(
    chart: any,
    xScale: any,
    yScale: any,
    width: number,
    height: number
  ): void {
    // Horizontal grid lines
    chart.append('g')
      .attr('class', 'grid-y')
      .call(d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat(() => '')
      )
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0.3)
      .style('stroke', this.colorPalette.grid);
    
    // Vertical grid lines (only for continuous scales)
    if (xScale.ticks) {
      chart.append('g')
        .attr('class', 'grid-x')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-height)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
        .style('stroke', this.colorPalette.grid);
    }
  }
  
  /**
   * Adds axes to chart
   */
  private addAxes(
    chart: any,
    xScale: any,
    yScale: any,
    width: number,
    height: number,
    config: any
  ): void {
    // X-axis
    const xAxis = d3.axisBottom(xScale);
    
    if (config.xAxis?.format === 'date') {
      xAxis.tickFormat(d3.timeFormat('%b %d'));
    } else if (config.xAxis?.format) {
      xAxis.tickFormat(d => this.formatValue(d as number, config.xAxis.format));
    }
    
    chart.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .style('font-size', '11px');
    
    // X-axis label
    if (config.xAxis?.label) {
      chart.append('text')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', this.colorPalette.text)
        .text(config.xAxis.label);
    }
    
    // Y-axis
    const yAxis = d3.axisLeft(yScale);
    
    if (config.yAxis?.format) {
      yAxis.tickFormat(d => this.formatValue(d as number, config.yAxis.format));
    }
    
    chart.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .style('font-size', '11px');
    
    // Y-axis label
    if (config.yAxis?.label) {
      chart.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -40)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .style('fill', this.colorPalette.text)
        .text(config.yAxis.label);
    }
  }
  
  /**
   * Formats values based on type
   */
  private formatValue(value: number, format?: string): string {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    
    if (format === 'percent') {
      return `${(value * 100).toFixed(1)}%`;
    }
    
    if (format === 'volume') {
      if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
      if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
      return value.toFixed(0);
    }
    
    // Default number formatting
    if (value >= 1e9 || value <= -1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6 || value <= -1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3 || value <= -1e3) return `${(value / 1e3).toFixed(1)}K`;
    
    return value.toFixed(1);
  }
  
  /**
   * Adds series labels to line chart
   */
  private addSeriesLabel(
    chart: any,
    dataset: any,
    index: number,
    labels: any[],
    xScale: any,
    yScale: any,
    color: string
  ): void {
    // Find last non-null value
    let lastIndex = dataset.data.length - 1;
    while (lastIndex >= 0 && (dataset.data[lastIndex] == null || isNaN(dataset.data[lastIndex]))) {
      lastIndex--;
    }
    
    if (lastIndex >= 0) {
      chart.append('text')
        .attr('x', xScale(labels[lastIndex]) + 5)
        .attr('y', yScale(dataset.data[lastIndex]))
        .attr('dominant-baseline', 'middle')
        .style('font-size', '11px')
        .style('fill', color)
        .style('font-weight', 'bold')
        .text(dataset.label);
    }
  }
  
  /**
   * Adds interactivity to line chart
   */
  private addLineChartInteractivity(
    chart: any,
    data: any,
    labels: any[],
    xScale: any,
    yScale: any,
    width: number,
    height: number
  ): void {
    // Create tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'chart-tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', this.colorPalette.background)
      .style('border', `1px solid ${this.colorPalette.grid}`)
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
    
    // Create vertical line
    const hoverLine = chart.append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', this.colorPalette.text)
      .style('stroke-width', 1)
      .style('stroke-dasharray', '3,3')
      .style('opacity', 0);
    
    // Create invisible rect for mouse events
    chart.append('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mousemove', function(event: MouseEvent) {
        const [mouseX] = d3.pointer(event);
        
        // Find closest data point
        const bisect = d3.bisector((d: any, i: number) => xScale(labels[i])).left;
        const index = Math.min(bisect(data.datasets[0].data, mouseX), labels.length - 1);
        
        // Update hover line
        hoverLine
          .attr('x1', xScale(labels[index]))
          .attr('x2', xScale(labels[index]))
          .style('opacity', 1);
        
        // Build tooltip content
        let content = `<strong>${labels[index]}</strong><br/>`;
        data.datasets.forEach((dataset: any, i: number) => {
          const value = dataset.data[index];
          if (value != null) {
            content += `${dataset.label}: ${value.toFixed(2)}<br/>`;
          }
        });
        
        // Show tooltip
        tooltip
          .html(content)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .transition()
          .duration(200)
          .style('opacity', 0.9);
      })
      .on('mouseout', function() {
        hoverLine.style('opacity', 0);
        tooltip.transition().duration(200).style('opacity', 0);
      });
  }
  
  /**
   * Adds moving averages to candlestick chart
   */
  private addMovingAverages(
    chart: any,
    candles: any[],
    indicators: string[],
    xScale: any,
    yScale: any
  ): void {
    const maColors: { [key: string]: string } = {
      ma20: this.colorPalette.series[0],
      ma50: this.colorPalette.series[1],
      ma200: this.colorPalette.series[2]
    };
    
    indicators.forEach(indicator => {
      if (indicator.startsWith('ma')) {
        const period = parseInt(indicator.substring(2));
        const maData = this.calculateMovingAverage(candles.map(c => c.close), period);
        
        const line = d3.line<number | null>()
          .defined(d => d != null)
          .x((d, i) => xScale(candles[i].date))
          .y(d => yScale(d as number));
        
        chart.append('path')
          .datum(maData)
          .attr('fill', 'none')
          .attr('stroke', maColors[indicator] || this.colorPalette.secondary)
          .attr('stroke-width', 1.5)
          .attr('d', line as any);
      }
    });
  }
  
  /**
   * Calculates simple moving average
   */
  private calculateMovingAverage(data: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        result.push(sum / period);
      }
    }
    
    return result;
  }
  
  /**
   * Calculates linear regression
   */
  private calculateRegression(points: any[]): any {
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    let ssTotal = 0, ssResidual = 0;
    
    points.forEach(p => {
      const yPred = slope * p.x + intercept;
      ssTotal += Math.pow(p.y - yMean, 2);
      ssResidual += Math.pow(p.y - yPred, 2);
    });
    
    const r2 = 1 - (ssResidual / ssTotal);
    
    return {
      slope,
      intercept,
      r2,
      predict: (x: number) => slope * x + intercept
    };
  }
  
  /**
   * Gets color for gauge based on value
   */
  private getGaugeColor(value: number, min: number, max: number): string {
    const percent = (value - min) / (max - min);
    
    if (percent < 0.33) return this.colorPalette.negative;
    if (percent < 0.67) return this.colorPalette.neutral;
    return this.colorPalette.positive;
  }
  
  /**
   * Adds legend for multiple series
   */
  private addLegend(svg: any, datasets: any[], width: number): void {
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 70)`);
    
    datasets.forEach((dataset, i) => {
      const legendRow = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      legendRow.append('rect')
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', dataset.color || this.colorPalette.series[i % this.colorPalette.series.length]);
      
      legendRow.append('text')
        .attr('x', 18)
        .attr('y', 9)
        .style('font-size', '11px')
        .style('fill', this.colorPalette.text)
        .text(dataset.label);
    });
  }
  
  /**
   * Adds color legend for continuous scales
   */
  private addColorLegend(svg: any, colorScale: any, x: number, y: number): void {
    const legendHeight = 200;
    const legendWidth = 20;
    
    const legend = svg.append('g')
      .attr('transform', `translate(${x},${y})`);
    
    // Create gradient
    const gradientId = 'gradient-' + Math.random().toString(36).substring(7);
    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');
    
    // Add gradient stops
    const nStops = 10;
    const domain = colorScale.domain();
    
    for (let i = 0; i <= nStops; i++) {
      const value = domain[0] + (domain[1] - domain[0]) * i / nStops;
      gradient.append('stop')
        .attr('offset', `${i * 100 / nStops}%`)
        .attr('stop-color', colorScale(value));
    }
    
    // Draw gradient rect
    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', `url(#${gradientId})`);
    
    // Add scale
    const legendScale = d3.scaleLinear()
      .domain(domain)
      .range([legendHeight, 0]);
    
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5);
    
    legend.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .style('font-size', '10px');
  }
  
  /**
   * Helper to get parent index in selection
   */
  private getParentIndex(nodes: any[], node: any): number {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].contains(node)) return i;
    }
    return 0;
  }
  
  /**
   * Adds annotations to chart
   */
  private addAnnotations(chart: any, annotations: any[], xScale: any, yScale: any): void {
    annotations.forEach(annotation => {
      const g = chart.append('g')
        .attr('class', 'annotation');
      
      // Add line or arrow
      if (annotation.type === 'line') {
        g.append('line')
          .attr('x1', xScale(annotation.x1))
          .attr('y1', yScale(annotation.y1))
          .attr('x2', xScale(annotation.x2))
          .attr('y2', yScale(annotation.y2))
          .attr('stroke', annotation.color || this.colorPalette.text)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', annotation.dashed ? '5,5' : null);
      }
      
      // Add text
      if (annotation.text) {
        g.append('text')
          .attr('x', xScale(annotation.x))
          .attr('y', yScale(annotation.y))
          .attr('text-anchor', annotation.anchor || 'middle')
          .style('font-size', '11px')
          .style('fill', annotation.color || this.colorPalette.text)
          .text(annotation.text);
      }
    });
  }
  
  // Additional interactivity methods would be implemented here...
  private addBarChartInteractivity(chart: any, data: any, xScale: any, yScale: any): void {
    // Implementation
  }
  
  private addCandlestickInteractivity(chart: any, candles: any[], xScale: any, yScale: any, width: number, height: number): void {
    // Implementation
  }
  
  private addPieChartInteractivity(slices: any, data: any, arc: any): void {
    // Implementation
  }
  
  private addScatterInteractivity(chart: any, points: any, data: any, xScale: any, yScale: any): void {
    // Implementation
  }
  
  private addCategoryLegend(svg: any, categories: string[], colorScale: any, width: number): void {
    // Implementation
  }
}

/**
 * Factory function to create visualization engines
 */
export function createVisualizationEngine(
  config?: Partial<VisualizationConfig>
): VisualizationEngine {
  return new VisualizationEngine(config);
}

/**
 * Automatically selects appropriate chart type based on data
 */
export function selectChartType(
  data: any,
  context: string
): string {
  // Time series data
  if (data.labels && data.labels[0]?.match(/^\d{4}-\d{2}-\d{2}$/)) {
    if (data.candles) return 'candlestick';
    return 'line';
  }
  
  // Categorical comparisons
  if (data.labels && data.datasets && data.datasets.length === 1) {
    return 'bar';
  }
  
  // Multiple series comparison
  if (data.datasets && data.datasets.length > 1) {
    if (context === 'composition') return 'pie';
    if (context === 'trend') return 'line';
    return 'bar';
  }
  
  // Correlation data
  if (data.points) return 'scatter';
  
  // Hierarchical data
  if (data.children) return 'treemap';
  
  // Flow data
  if (data.nodes && data.links) return 'sankey';
  
  // Single metric
  if (data.value !== undefined && typeof data.value === 'number') {
    return 'gauge';
  }
  
  // Default to bar chart
  return 'bar';
}