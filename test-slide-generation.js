// Test slide generation
const path = require('path');

// We'll test by generating a report and checking the output
const axios = require('axios');

async function testSlideGeneration() {
  console.log('Testing slide generation through API...\n');

  try {
    // First, let's check if we can access the generated report files
    const fs = require('fs');
    const reportsDir = path.join(__dirname, 'generated-reports');
    
    // Find the latest PDF
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.endsWith('.pdf') && f.includes('AAPL'))
      .sort((a, b) => {
        const statA = fs.statSync(path.join(reportsDir, a));
        const statB = fs.statSync(path.join(reportsDir, b));
        return statB.mtime - statA.mtime;
      });
    
    if (files.length > 0) {
      const latestPDF = files[0];
      const pdfPath = path.join(reportsDir, latestPDF);
      console.log('Latest PDF:', latestPDF);
      
      const stats = fs.statSync(pdfPath);
      console.log('File size:', (stats.size / 1024).toFixed(1), 'KB');
      console.log('Modified:', stats.mtime);
      
      // Read PDF content to estimate pages
      const pdfContent = fs.readFileSync(pdfPath);
      const pageMatches = pdfContent.toString('binary').match(/\/Type[\s]*\/Page[^s]/g);
      const pageCount = pageMatches ? pageMatches.length : 0;
      console.log('Estimated page count:', pageCount);
      
      // Check for specific content patterns
      const contentStr = pdfContent.toString('binary');
      const patterns = [
        'Executive Summary',
        'Investment Thesis',
        'Company Overview',
        'Financial Performance',
        'Revenue Growth',
        'Profitability Analysis',
        'Balance Sheet',
        'Valuation Analysis',
        'Technical Analysis',
        'Risk Assessment',
        'Competitive Positioning',
        'Future Outlook',
        'Investment Recommendation',
        'Key Metrics Dashboard',
        'Appendix'
      ];
      
      console.log('\nContent check:');
      patterns.forEach(pattern => {
        const found = contentStr.includes(pattern);
        console.log(`  ${pattern}: ${found ? '✓' : '✗'}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSlideGeneration();