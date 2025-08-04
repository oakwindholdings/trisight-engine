// Detailed PDF generation debugging
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function debugPDFGeneration() {
  console.log('=== DETAILED PDF GENERATION DEBUG ===\n');

  const payload = {
    ticker: 'AAPL',
    reportType: 'comprehensive',
    outputFormat: 'pdf',
    config: {
      includeAI: true,
      includeTechnical: true,
      includeFinancial: true,
      includeRisk: true,
      includeValuation: true,
      includeCompetitive: true
    }
  };

  try {
    // 1. Generate PDF via API
    console.log('1. Generating PDF via API...');
    const response = await axios.post('http://localhost:3001/api/reports/generate', payload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    if (!response.data.success) {
      console.error('Generation failed:', response.data.error);
      return;
    }

    const reportPath = path.join(__dirname, response.data.reportPath);
    console.log('Report path:', reportPath);

    // 2. Check file stats
    if (!fs.existsSync(reportPath)) {
      console.error('Report file not found!');
      return;
    }

    const stats = fs.statSync(reportPath);
    console.log('\n2. File Statistics:');
    console.log('   - Size:', (stats.size / 1024).toFixed(1), 'KB');
    console.log('   - Created:', stats.birthtime);

    // 3. Analyze PDF structure
    console.log('\n3. PDF Structure Analysis:');
    const pdfData = fs.readFileSync(reportPath);
    const pdfString = pdfData.toString('binary');
    
    // Count pages
    const pageMatches = pdfString.match(/\/Type[\s]*\/Page[^s]/g);
    const pageCount = pageMatches ? pageMatches.length : 0;
    console.log('   - Page count:', pageCount);
    
    // Count text objects
    const textMatches = pdfString.match(/BT[\s\S]*?ET/g);
    console.log('   - Text objects:', textMatches ? textMatches.length : 0);
    
    // Count images
    const imageMatches = pdfString.match(/\/Type[\s]*\/XObject[\s]*\/Subtype[\s]*\/Image/g);
    console.log('   - Images:', imageMatches ? imageMatches.length : 0);

    // 4. Search for expected content
    console.log('\n4. Content Search Results:');
    const expectedSections = [
      'Title Slide',
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
      'Key Metrics Dashboard',
      'Appendix',
      'Disclaimer'
    ];

    const foundSections = [];
    const missingSections = [];

    expectedSections.forEach(section => {
      // Check for section in PDF content
      const found = pdfString.includes(section);
      if (found) {
        foundSections.push(section);
      } else {
        missingSections.push(section);
      }
    });

    console.log('\n   Found sections (' + foundSections.length + '):');
    foundSections.forEach(s => console.log('     ✓', s));
    
    console.log('\n   Missing sections (' + missingSections.length + '):');
    missingSections.forEach(s => console.log('     ✗', s));

    // 5. Extract actual text content
    console.log('\n5. Extracted Text Snippets:');
    
    // Extract text between BT and ET markers
    const textBlocks = pdfString.match(/BT[\s\S]*?ET/g) || [];
    const uniqueTexts = new Set();
    
    textBlocks.forEach(block => {
      // Extract text between parentheses (PDF text format)
      const textMatches = block.match(/\((.*?)\)/g) || [];
      textMatches.forEach(match => {
        const text = match.slice(1, -1); // Remove parentheses
        if (text.length > 3 && !text.match(/^[\d\s.]+$/)) { // Skip numbers and short texts
          uniqueTexts.add(text);
        }
      });
    });
    
    // Show first 20 unique text snippets
    const textArray = Array.from(uniqueTexts);
    console.log('   Total unique text snippets:', textArray.length);
    console.log('   First 20 snippets:');
    textArray.slice(0, 20).forEach((text, i) => {
      console.log(`     ${i + 1}. "${text}"`);
    });

    // 6. Check for specific markers
    console.log('\n6. Specific Content Checks:');
    const checks = [
      { name: 'Has Apple company name', found: pdfString.includes('Apple') },
      { name: 'Has AAPL ticker', found: pdfString.includes('AAPL') },
      { name: 'Has TriSight branding', found: pdfString.includes('TriSight') },
      { name: 'Has recommendation (BUY/SELL/HOLD)', found: /\b(BUY|SELL|HOLD|STRONG\s*BUY|STRONG\s*SELL)\b/.test(pdfString) },
      { name: 'Has financial data', found: /\$[\d,]+/.test(pdfString) },
      { name: 'Has percentage values', found: /\d+\.\d+%/.test(pdfString) },
      { name: 'Has dates', found: /\d{4}-\d{2}-\d{2}/.test(pdfString) },
      { name: 'Has page numbers', found: /Page \d+/.test(pdfString) }
    ];

    checks.forEach(check => {
      console.log(`   ${check.found ? '✓' : '✗'} ${check.name}`);
    });

    // 7. Compare with PPTX if available
    console.log('\n7. Comparison with PPTX (if available):');
    const pptxPath = reportPath.replace('.pdf', '.pptx');
    if (fs.existsSync(pptxPath)) {
      const pptxStats = fs.statSync(pptxPath);
      console.log('   - PPTX size:', (pptxStats.size / 1024).toFixed(1), 'KB');
      console.log('   - Size ratio (PPTX/PDF):', (pptxStats.size / stats.size).toFixed(2));
    } else {
      console.log('   - No corresponding PPTX file found');
    }

    // 8. Generate test report with minimal API to isolate issue
    console.log('\n8. Recommendations:');
    console.log('   - Expected pages: 15-20');
    console.log('   - Actual pages:', pageCount);
    console.log('   - Status:', pageCount >= 15 ? 'GOOD' : 'ISSUE DETECTED');
    
    if (pageCount < 15) {
      console.log('\n   PROBLEM: PDF has fewer pages than expected!');
      console.log('   Possible causes:');
      console.log('   1. Slides are not being passed correctly to PDF engine');
      console.log('   2. PDF engine is not processing all slides');
      console.log('   3. Page breaks are not being added properly');
      console.log('   4. Content is being compressed onto fewer pages');
    }

  } catch (error) {
    console.error('\nError during PDF generation:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the debug
debugPDFGeneration();