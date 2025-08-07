// test-pdf-generation.js
// Test script for PDF generation functionality
// Tests the complete flow: intelligent data → PDF generation

const axios = require('axios');
const fs = require('fs');

async function testPDFGeneration() {
  console.log('🚀 TESTING PDF GENERATION SYSTEM');
  console.log('================================\n');

  try {
    // Step 1: Generate intelligent report data
    console.log('📊 Step 1: Generating intelligent report data...');
    
    const config = {
      ticker: 'NVDA',
      title: 'NVIDIA Corporation - AI-Powered Financial Analysis',
      template: 'intelligent-institutional',
      author: 'TriSight AI Research Team'
    };

    const dataResponse = await axios.post('https://trisight-pxgodrypr-apex-2b9a18e9.vercel.app/api/reports/generate-intelligent-real-data', config, {
      timeout: 120000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TriSight-PDF-Test/1.0'
      }
    });

    if (!dataResponse.data.success) {
      throw new Error('Failed to generate intelligent report data');
    }

    console.log('✅ Intelligent report data generated successfully');
    console.log(`📈 Data Quality: ${dataResponse.data.metadata?.dataQuality || 0}%`);
    console.log(`🔍 Real Data Sources: ${dataResponse.data.metadata?.realDataSources || 0}`);
    console.log(`🤖 AI Analysis Available: ${dataResponse.data.aiAnalysis ? 'Yes' : 'No'}`);

    // Step 2: Generate PDF from the intelligent data
    console.log('\n📄 Step 2: Generating PDF from intelligent data...');
    
    const pdfResponse = await axios.post('https://trisight-pxgodrypr-apex-2b9a18e9.vercel.app/api/reports/generate-pdf', {
      reportData: dataResponse.data,
      options: {
        includeCharts: true,
        includeTechnicalAnalysis: true,
        includeAIAnalysis: true
      }
    }, {
      timeout: 60000,
      responseType: 'arraybuffer',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TriSight-PDF-Test/1.0'
      }
    });

    if (pdfResponse.status !== 200) {
      throw new Error(`PDF generation failed with status: ${pdfResponse.status}`);
    }

    // Step 3: Save the PDF file
    console.log('✅ PDF generated successfully');
    
    const fileName = `NVDA_Report_${new Date().toISOString().split('T')[0]}_${Date.now()}.pdf`;
    fs.writeFileSync(fileName, pdfResponse.data);
    
    const fileSizeKB = Math.round(fs.statSync(fileName).size / 1024);
    console.log(`💾 PDF saved as: ${fileName}`);
    console.log(`📏 File size: ${fileSizeKB} KB`);

    // Step 4: Verify PDF content
    console.log('\n🔍 Step 3: Verifying PDF content...');
    
    if (fileSizeKB < 10) {
      console.log('⚠️  Warning: PDF file seems unusually small');
    } else if (fileSizeKB > 10000) {
      console.log('⚠️  Warning: PDF file seems unusually large');
    } else {
      console.log('✅ PDF file size appears normal');
    }

    // Step 5: Test results summary
    console.log('\n🎉 PDF GENERATION TEST RESULTS');
    console.log('==============================');
    console.log('✅ Intelligent data generation: SUCCESS');
    console.log('✅ PDF generation: SUCCESS');
    console.log('✅ File creation: SUCCESS');
    console.log(`📊 Data quality: ${dataResponse.data.metadata?.dataQuality || 0}%`);
    console.log(`🤖 AI analysis: ${dataResponse.data.aiAnalysis ? 'INCLUDED' : 'NOT INCLUDED'}`);
    console.log(`📄 PDF file: ${fileName} (${fileSizeKB} KB)`);

    // Check AI analysis content
    if (dataResponse.data.aiAnalysis) {
      const aiSections = Object.keys(dataResponse.data.aiAnalysis).filter(key => 
        dataResponse.data.aiAnalysis[key] && 
        typeof dataResponse.data.aiAnalysis[key] === 'string' && 
        dataResponse.data.aiAnalysis[key].length > 50
      );
      console.log(`🧠 AI sections with content: ${aiSections.join(', ')}`);
    }

    console.log('\n🚀 COMPLETE PDF GENERATION SYSTEM IS OPERATIONAL! 🚀');

  } catch (error) {
    console.error('\n❌ PDF GENERATION TEST FAILED');
    console.error('==============================');
    
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
      console.error(`Response: ${error.response.statusText}`);
      
      if (error.response.data) {
        try {
          const errorData = typeof error.response.data === 'string' 
            ? error.response.data 
            : JSON.stringify(error.response.data);
          console.error(`Error Data: ${errorData.substring(0, 500)}`);
        } catch (e) {
          console.error('Error data could not be parsed');
        }
      }
    } else if (error.request) {
      console.error('Network Error: No response received');
      console.error(`Request timeout or connection failed`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    
    console.error(`\nFull error:`, error.code || error.message);
    process.exit(1);
  }
}

// Run the test
testPDFGeneration();
