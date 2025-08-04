// Check PDF content
const fs = require('fs');
const path = require('path');

const pdfFile = path.join(__dirname, 'generated-reports', 'AAPL_report_2025-08-03T16-38-02-110Z.pdf');

if (fs.existsSync(pdfFile)) {
  const stats = fs.statSync(pdfFile);
  console.log('PDF File Analysis:');
  console.log('- Path:', pdfFile);
  console.log('- Size:', (stats.size / 1024).toFixed(1), 'KB');
  console.log('- Created:', stats.birthtime);
  
  // Read and analyze PDF
  const pdfData = fs.readFileSync(pdfFile);
  const pdfString = pdfData.toString('binary');
  
  // Count pages
  const pageMatches = pdfString.match(/\/Type[\s]*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 0;
  console.log('- Page count:', pageCount);
  
  // Check for key sections
  const sections = [
    'Executive Summary',
    'Investment Thesis',
    'Company Overview',
    'Financial Performance',
    'Revenue & Growth Analysis',
    'Profitability Analysis',
    'Balance Sheet Strength',
    'Valuation Analysis',
    'Technical Analysis',
    'Risk Assessment',
    'Competitive Positioning',
    'Future Outlook',
    'Investment Recommendation',
    'Key Metrics Dashboard'
  ];
  
  console.log('\nSection presence:');
  sections.forEach(section => {
    const found = pdfString.includes(section);
    console.log(`  ${found ? '✓' : '✗'} ${section}`);
  });
  
  // Extract some text content
  const textMatches = pdfString.match(/\((.*?)\)/g) || [];
  const texts = textMatches
    .map(m => m.slice(1, -1))
    .filter(t => t.length > 10 && !t.match(/^[\d\s.]+$/))
    .slice(0, 10);
    
  console.log('\nSample text content:');
  texts.forEach((text, i) => {
    console.log(`  ${i + 1}. "${text}"`);
  });
} else {
  console.log('PDF file not found!');
}