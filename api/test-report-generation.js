// Test script for the fixed comprehensive report generator
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Import the fixed generator
const handler = require('./reports/generate-comprehensive-fixed');

// Create mock request and response objects
const mockReq = {
  method: 'POST',
  body: {
    ticker: 'AAPL',
    title: 'Apple Inc. Comprehensive Analysis',
    author: 'TriSight Research Team',
    outputFormat: 'pdf'
  }
};

const mockRes = {
  headers: {},
  statusCode: 200,
  data: null,
  
  setHeader(key, value) {
    this.headers[key] = value;
    return this;
  },
  
  status(code) {
    this.statusCode = code;
    return this;
  },
  
  json(data) {
    this.data = data;
    console.log('\n=== Response Status:', this.statusCode, '===');
    console.log(JSON.stringify(data, null, 2));
    return this;
  },
  
  end() {
    return this;
  }
};

// Run the test
async function testReportGeneration() {
  console.log('Testing comprehensive report generation for AAPL...');
  console.log('Environment variables loaded:');
  console.log('- TwelveData API Key:', process.env.REACT_APP_TWELVE_DATA_API_KEY ? 'Present' : 'Missing');
  console.log('- Anthropic API Key:', process.env.REACT_APP_ANTHROPIC_API_KEY ? 'Present' : 'Missing');
  console.log('- Firecrawl API Key:', process.env.REACT_APP_FIRECRAWL_API_KEY ? 'Present' : 'Missing');
  console.log('\nStarting report generation...\n');
  
  try {
    await handler(mockReq, mockRes);
    
    if (mockRes.statusCode === 200 && mockRes.data?.success) {
      console.log('\n✅ Report generation successful!');
      console.log('Report ID:', mockRes.data.reportId);
      console.log('Slides generated:', mockRes.data.slides?.length);
      console.log('Data completeness:', mockRes.data.metadata?.dataCompleteness + '%');
      console.log('Confidence score:', mockRes.data.metadata?.confidence + '%');
      
      if (mockRes.data.pdfPath) {
        console.log('PDF saved to:', mockRes.data.pdfPath);
      }
      
      // Check if actual content was generated
      const hasContent = mockRes.data.slides?.some(slide => 
        slide.content && 
        Object.keys(slide.content).length > 0 &&
        (typeof slide.content === 'string' ? slide.content.length > 50 : true)
      );
      
      if (hasContent) {
        console.log('\n✅ Report contains actual content!');
        
        // Sample some content
        const summarySlide = mockRes.data.slides?.find(s => s.type === 'trisight_summary');
        if (summarySlide?.content?.companyDescription) {
          console.log('\nCompany Description (first 200 chars):');
          console.log(summarySlide.content.companyDescription.substring(0, 200) + '...');
        }
        
        const aiAnalysis = mockRes.data.aiAnalysis;
        if (aiAnalysis?.executiveSummary) {
          console.log('\nAI Executive Summary (first 200 chars):');
          console.log(aiAnalysis.executiveSummary.substring(0, 200) + '...');
        }
      } else {
        console.log('\n⚠️  Warning: Report structure is present but content appears minimal');
      }
      
    } else {
      console.log('\n❌ Report generation failed!');
      console.log('Error:', mockRes.data?.error || 'Unknown error');
      console.log('Message:', mockRes.data?.message || 'No error message');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testReportGeneration();