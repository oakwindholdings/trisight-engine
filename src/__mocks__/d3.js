// src/__mocks__/d3.js
// Mock for d3 module
// Context: Used by Jest to mock D3 visualization library

module.exports = {
  // Selection
  select: jest.fn(() => ({
    append: jest.fn().mockReturnThis(),
    attr: jest.fn().mockReturnThis(),
    style: jest.fn().mockReturnThis(),
    text: jest.fn().mockReturnThis(),
    selectAll: jest.fn().mockReturnThis(),
    data: jest.fn().mockReturnThis(),
    enter: jest.fn().mockReturnThis(),
    exit: jest.fn().mockReturnThis(),
    remove: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
    transition: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    ease: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    node: jest.fn(() => ({
      getContext: jest.fn(() => ({
        clearRect: jest.fn(),
        fillRect: jest.fn(),
        strokeRect: jest.fn(),
        beginPath: jest.fn(),
        closePath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        fill: jest.fn(),
        arc: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(() => ({ width: 100 }))
      }))
    }))
  })),
  
  // Scales
  scaleLinear: jest.fn(() => {
    const scale = jest.fn((value) => value);
    scale.domain = jest.fn().mockReturnThis();
    scale.range = jest.fn().mockReturnThis();
    scale.nice = jest.fn().mockReturnThis();
    scale.ticks = jest.fn(() => [0, 25, 50, 75, 100]);
    scale.tickFormat = jest.fn(() => (d) => d.toString());
    scale.copy = jest.fn().mockReturnThis();
    scale.invert = jest.fn((value) => value);
    return scale;
  }),
  
  scaleTime: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    nice: jest.fn().mockReturnThis(),
    ticks: jest.fn(() => []),
    tickFormat: jest.fn(() => (d) => d.toString()),
    copy: jest.fn().mockReturnThis()
  })),
  
  scaleBand: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    padding: jest.fn().mockReturnThis(),
    paddingInner: jest.fn().mockReturnThis(),
    paddingOuter: jest.fn().mockReturnThis(),
    bandwidth: jest.fn(() => 10),
    copy: jest.fn().mockReturnThis()
  })),
  
  scaleOrdinal: jest.fn(() => ({
    domain: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    unknown: jest.fn().mockReturnThis()
  })),
  
  // Arrays
  min: jest.fn((arr, accessor) => {
    if (!arr || arr.length === 0) return undefined;
    if (accessor) return Math.min(...arr.map(accessor));
    return Math.min(...arr);
  }),
  
  max: jest.fn((arr, accessor) => {
    if (!arr || arr.length === 0) return undefined;
    if (accessor) return Math.max(...arr.map(accessor));
    return Math.max(...arr);
  }),
  
  extent: jest.fn((arr, accessor) => {
    if (!arr || arr.length === 0) return [undefined, undefined];
    if (accessor) {
      const values = arr.map(accessor);
      return [Math.min(...values), Math.max(...values)];
    }
    return [Math.min(...arr), Math.max(...arr)];
  }),
  
  mean: jest.fn((arr, accessor) => {
    if (!arr || arr.length === 0) return undefined;
    const values = accessor ? arr.map(accessor) : arr;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }),
  
  // Axes
  axisBottom: jest.fn(() => ({
    scale: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis(),
    tickPadding: jest.fn().mockReturnThis()
  })),
  
  axisLeft: jest.fn(() => ({
    scale: jest.fn().mockReturnThis(),
    ticks: jest.fn().mockReturnThis(),
    tickFormat: jest.fn().mockReturnThis(),
    tickSize: jest.fn().mockReturnThis(),
    tickPadding: jest.fn().mockReturnThis()
  })),
  
  // Lines and areas
  line: jest.fn(() => ({
    x: jest.fn().mockReturnThis(),
    y: jest.fn().mockReturnThis(),
    curve: jest.fn().mockReturnThis(),
    context: jest.fn().mockReturnThis()
  })),
  
  area: jest.fn(() => ({
    x: jest.fn().mockReturnThis(),
    y0: jest.fn().mockReturnThis(),
    y1: jest.fn().mockReturnThis(),
    curve: jest.fn().mockReturnThis(),
    context: jest.fn().mockReturnThis()
  })),
  
  // Curves
  curveLinear: {},
  curveStep: {},
  curveBasis: {},
  curveCardinal: {},
  curveMonotoneX: {},
  
  // Format
  format: jest.fn((specifier) => (value) => value.toString()),
  
  // Time format
  timeFormat: jest.fn((specifier) => (date) => date.toString()),
  timeParse: jest.fn((specifier) => (dateString) => new Date(dateString)),
  
  // Color schemes
  schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'],
  schemeSet1: ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00'],
  
  // Utilities
  range: jest.fn((start, stop, step) => {
    const result = [];
    for (let i = start; i < stop; i += (step || 1)) {
      result.push(i);
    }
    return result;
  }),
  
  bisect: jest.fn((array, x) => {
    let lo = 0, hi = array.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (array[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }),
  
  bisectLeft: jest.fn((array, x) => {
    let lo = 0, hi = array.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (array[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }),
  
  bisectRight: jest.fn((array, x) => {
    let lo = 0, hi = array.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (array[mid] <= x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  })
};