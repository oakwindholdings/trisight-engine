// api/reports/generate-complete-pdf-endpoint.js
// API endpoint for generating complete professional PDF reports

const { CompletePDFReportGenerator } = require('./generate-complete-pdf');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { reportData } = req.body;
    
    if (!reportData || !reportData.ticker) {
      return res.status(400).json({ error: 'Report data with ticker is required' });
    }

    console.log(`Starting complete PDF generation for ${reportData.ticker}`);
    
    // Create PDF generator instance
    const generator = new CompletePDFReportGenerator(reportData.ticker);
    
    // Generate complete PDF
    const pdfBuffer = await generator.generateFullReport(reportData);
    
    console.log(`Complete PDF generated successfully for ${reportData.ticker}`);
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportData.ticker}-complete-report.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.byteLength);
    
    // Send PDF buffer
    res.send(Buffer.from(pdfBuffer));
    
  } catch (error) {
    console.error('Complete PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate complete PDF report',
      details: error.message 
    });
  }
}
