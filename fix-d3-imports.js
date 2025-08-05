// fix-d3-imports.js
// Script to fix D3 import issues in visualizationEngine.ts
// Rule: Simple - Fix all D3 method calls to use correct module references

const fs = require('fs');
const path = require('path');

const filePath = 'src/reportGeneration/visualization/visualizationEngine.ts';

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Define the replacements
const replacements = [
  // Scale methods
  { from: /d3\.scaleLinear\(/g, to: 'd3Scale.scaleLinear(' },
  { from: /d3\.scaleTime\(/g, to: 'd3Time.scaleTime(' },
  { from: /d3\.scaleBand\(/g, to: 'd3Scale.scaleBand(' },
  { from: /d3\.scaleOrdinal\(/g, to: 'd3Scale.scaleOrdinal(' },
  { from: /d3\.scaleSequential\(/g, to: 'd3Scale.scaleSequential(' },
  
  // Array methods
  { from: /d3\.extent\(/g, to: 'd3Array.extent(' },
  { from: /d3\.min\(/g, to: 'd3Array.min(' },
  { from: /d3\.max\(/g, to: 'd3Array.max(' },
  { from: /d3\.sum\(/g, to: 'd3Array.sum(' },
  { from: /d3\.bisector\(/g, to: 'd3Array.bisector(' },
  
  // Shape methods
  { from: /d3\.line\(/g, to: 'd3Shape.line(' },
  { from: /d3\.arc\(/g, to: 'd3Shape.arc(' },
  { from: /d3\.pie\(/g, to: 'd3Shape.pie(' },
  
  // Hierarchy methods
  { from: /d3\.hierarchy\(/g, to: 'd3.hierarchy(' },
  { from: /d3\.treemap\(/g, to: 'd3.treemap(' },
  
  // Interpolation methods
  { from: /d3\.interpolate\(/g, to: 'd3Interpolate.interpolate(' },
  { from: /d3\.interpolateNumber\(/g, to: 'd3Interpolate.interpolateNumber(' },
  { from: /d3\.interpolateRdBu/g, to: 'd3Scale.interpolateRdBu' },
  
  // Time format methods
  { from: /d3\.timeFormat\(/g, to: 'd3TimeFormat.timeFormat(' },
  { from: /d3\.timeParse\(/g, to: 'd3TimeFormat.timeParse(' },
  
  // Axis methods
  { from: /d3\.axisBottom\(/g, to: 'd3Axis.axisBottom(' },
  { from: /d3\.axisLeft\(/g, to: 'd3Axis.axisLeft(' },
  { from: /d3\.axisRight\(/g, to: 'd3Axis.axisRight(' },
  
  // Selection methods
  { from: /d3\.create\(/g, to: 'd3Selection.create(' },
  { from: /d3\.select\(/g, to: 'd3Selection.select(' },
  { from: /d3\.pointer\(/g, to: 'd3Selection.pointer(' },
  
  // Ease methods
  { from: /d3\.easeLinear/g, to: 'd3Ease.easeLinear' }
];

// Apply all replacements
replacements.forEach(({ from, to }) => {
  content = content.replace(from, to);
});

// Write the file back
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed D3 imports in visualizationEngine.ts');
console.log('Applied', replacements.length, 'replacement patterns');
