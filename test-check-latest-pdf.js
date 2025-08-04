// Check latest PDF
const fs = require('fs');
const path = require('path');

const pdfFile = path.join(__dirname, 'generated-reports', 'AAPL_report_2025-08-03T18-13-19-567Z.pdf');

if (fs.existsSync(pdfFile)) {
  const stats = fs.statSync(pdfFile);
  console.log('Latest PDF Analysis:');
  console.log('- Size:', (stats.size / 1024).toFixed(1), 'KB');
  
  const pdfData = fs.readFileSync(pdfFile);
  const pdfString = pdfData.toString('binary');
  
  const pageMatches = pdfString.match(/\/Type[\s]*\/Page[^s]/g);
  const pageCount = pageMatches ? pageMatches.length : 0;
  console.log('- Page count:', pageCount);
  console.log('- Status:', pageCount >= 15 ? 'GOOD' : 'ISSUE - Too few pages!');
} else {
  console.log('PDF not found:', pdfFile);
}