// test-institutional-pdf-generation.js
// Test the modular institutional API with real PDF generation

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class InstitutionalPDFTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
    this.outputDir = './generated-reports';
    this.downloadedPDFPath = null;
  }

  downloadPDFFromBase64(base64Data, filename) {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Convert Base64 to buffer
      const pdfBuffer = Buffer.from(base64Data, 'base64');

      // Save to file
      const filepath = path.join(this.outputDir, filename);
      fs.writeFileSync(filepath, pdfBuffer);

      console.log(`✅ PDF downloaded successfully: ${filepath}`);
      console.log(`📊 Downloaded file size: ${(pdfBuffer.length / 1024).toFixed(1)} KB`);

      this.downloadedPDFPath = filepath;
      this.downloadedFileSize = pdfBuffer.length;

      return filepath;

    } catch (error) {
      console.log(`❌ Error downloading PDF: ${error.message}`);
      return null;
    }
  }

  async testInstitutionalPDFGeneration() {
    console.log('📄 TESTING INSTITUTIONAL PDF GENERATION');
    console.log('='.repeat(60));
    console.log(`🌐 Production URL: ${this.baseUrl}\n`);
    
    // Test 1: Generate institutional PDF for NVDA
    await this.testNVDAInstitutionalPDF();
    
    // Test 2: Compare with example format
    await this.compareWithExampleFormat();
    
    // Test 3: Verify PDF file creation
    await this.verifyPDFFileCreation();
    
    // Generate final assessment
    this.generateFinalAssessment();
  }

  async testNVDAInstitutionalPDF() {
    console.log('1️⃣ Testing NVDA Institutional PDF Generation...');
    
    try {
      const config = {
        ticker: 'NVDA',
        title: 'NVIDIA Corporation - Institutional Research Report',
        template: 'institutional',
        includeCharts: true,
        includeTables: true,
        institutionalGrade: true
      };

      console.log('📤 Requesting institutional PDF generation...');
      const startTime = Date.now();
      
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-modular-institutional`, config, {
        timeout: 120000, // 2 minutes for PDF generation
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      
      console.log(`📊 Response Status: ${response.status}`);
      console.log(`⏱️ Total Time: ${totalTime}ms`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Institutional API call successful!');
        
        const report = response.data.report;
        console.log(`📋 Report ID: ${response.data.reportId}`);
        console.log(`🏗️ Architecture: ${response.data.metadata.architecture}`);
        console.log(`📑 Sections: ${Object.keys(report.sections || {}).length}`);
        
        // Check PDF generation status
        if (report.pdfGenerated) {
          console.log('✅ PDF Generation: SUCCESS');
          console.log(`📄 PDF Path: ${report.pdfPath || 'In-memory (serverless)'}`);
          console.log(`📁 Filename: ${report.filename}`);
          console.log(`📊 File Size: ${(report.metadata.fileSize / 1024).toFixed(1)} KB`);
          console.log(`📄 Estimated Pages: ${report.metadata.pages}`);
          console.log(`🏛️ Quality: ${report.metadata.quality}`);
          console.log(`🌐 Serverless: ${report.metadata.serverless ? 'Yes' : 'No'}`);

          this.pdfGenerated = true;
          this.pdfPath = report.pdfPath;
          this.filename = report.filename;
          this.fileSize = report.metadata.fileSize;
          this.reportData = report;

          // Download PDF if it's in Base64 format (serverless)
          if (report.pdfData && report.metadata.serverless) {
            console.log('📥 Downloading PDF from Base64 data...');
            this.downloadPDFFromBase64(report.pdfData, report.filename);
          }
          
        } else {
          console.log('❌ PDF Generation: FAILED');
          console.log(`❌ Error: ${report.error || 'Unknown error'}`);
          this.pdfGenerated = false;
          this.pdfError = report.error;
        }
        
        // Analyze content quality
        const contentAnalysis = this.analyzeContentQuality(report);
        console.log(`📝 Content Quality: ${contentAnalysis.score}/100`);
        console.log(`📊 Data Sources: ${contentAnalysis.dataSources}`);
        console.log(`🤖 AI Analysis: ${contentAnalysis.hasAIAnalysis ? 'Yes' : 'No'}`);
        
        this.contentQuality = contentAnalysis;
        
      } else {
        console.log('❌ Institutional API call failed');
        console.log(`❌ Status: ${response.status}`);
        console.log(`❌ Error: ${response.data?.error || 'Unknown error'}`);
        this.pdfGenerated = false;
        this.apiError = response.data?.error || 'Unknown error';
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      this.pdfGenerated = false;
      this.requestError = error.message;
    }
    
    console.log('');
  }

  analyzeContentQuality(report) {
    let score = 0;
    let dataSources = 0;
    let hasAIAnalysis = false;
    
    try {
      // Check sections
      const sections = report.sections || {};
      const sectionCount = Object.keys(sections).length;
      score += Math.min(sectionCount * 10, 50); // Up to 50 points for sections
      
      // Check for AI analysis
      if (sections.executiveSummary?.confidence) {
        hasAIAnalysis = true;
        score += 20;
      }
      
      // Check data sources
      if (report.rawData) {
        const rawData = report.rawData;
        if (rawData.marketData?.success) dataSources++;
        if (rawData.financials?.success) dataSources++;
        if (rawData.companyProfile?.success) dataSources++;
        if (rawData.analystData?.success) dataSources++;
        if (rawData.aiInsights?.success) dataSources++;
        
        score += dataSources * 5; // 5 points per data source
      }
      
      // Check content depth
      const contentLength = JSON.stringify(sections).length;
      if (contentLength > 5000) score += 15;
      if (contentLength > 10000) score += 10;
      
    } catch (error) {
      console.log(`⚠️ Error analyzing content quality: ${error.message}`);
    }
    
    return {
      score: Math.min(score, 100),
      dataSources,
      hasAIAnalysis,
      sectionCount: Object.keys(report.sections || {}).length
    };
  }

  async compareWithExampleFormat() {
    console.log('2️⃣ Comparing with Example Format...');
    
    const examplePath = path.join(this.outputDir, 'NVDA_Report_Example_Format.pdf');
    
    try {
      // Check if example file exists
      if (fs.existsSync(examplePath)) {
        const exampleStats = fs.statSync(examplePath);
        console.log(`📄 Example file size: ${(exampleStats.size / 1024).toFixed(1)} KB`);
        
        if (this.pdfGenerated && this.fileSize) {
          const generatedSizeKB = this.fileSize / 1024;
          const exampleSizeKB = exampleStats.size / 1024;
          const sizeRatio = (generatedSizeKB / exampleSizeKB) * 100;
          
          console.log(`📄 Generated file size: ${generatedSizeKB.toFixed(1)} KB`);
          console.log(`📊 Size comparison: ${sizeRatio.toFixed(1)}% of example`);
          
          if (sizeRatio >= 50 && sizeRatio <= 200) {
            console.log('✅ File size within reasonable range');
            this.sizeComparison = 'good';
          } else if (sizeRatio < 50) {
            console.log('⚠️ Generated file significantly smaller than example');
            this.sizeComparison = 'small';
          } else {
            console.log('⚠️ Generated file significantly larger than example');
            this.sizeComparison = 'large';
          }
          
          this.sizeRatio = sizeRatio;
          
        } else {
          console.log('❌ No generated PDF to compare');
          this.sizeComparison = 'no-pdf';
        }
        
      } else {
        console.log('⚠️ Example format file not found');
        this.sizeComparison = 'no-example';
      }
      
    } catch (error) {
      console.log(`❌ Error comparing with example: ${error.message}`);
      this.sizeComparison = 'error';
    }
    
    console.log('');
  }

  async verifyPDFFileCreation() {
    console.log('3️⃣ Verifying PDF File Creation...');

    if (!this.pdfGenerated || !this.filename) {
      console.log('❌ No PDF generated to verify');
      this.fileVerification = 'no-pdf';
      console.log('');
      return;
    }

    try {
      // Check if file exists in generated-reports directory (downloaded from serverless)
      const expectedPath = this.downloadedPDFPath || path.join(this.outputDir, this.filename);

      console.log(`🔍 Looking for file: ${expectedPath}`);

      if (fs.existsSync(expectedPath)) {
        const stats = fs.statSync(expectedPath);
        console.log('✅ PDF file found on disk!');
        console.log(`📄 File size: ${(stats.size / 1024).toFixed(1)} KB`);
        console.log(`📅 Created: ${stats.birthtime.toISOString()}`);
        console.log(`📝 Modified: ${stats.mtime.toISOString()}`);
        
        // Verify it's a valid PDF (basic check)
        const buffer = fs.readFileSync(expectedPath);
        const isPDF = buffer.toString('ascii', 0, 4) === '%PDF';
        
        if (isPDF) {
          console.log('✅ File is a valid PDF');
          this.fileVerification = 'valid-pdf';
        } else {
          console.log('❌ File is not a valid PDF');
          this.fileVerification = 'invalid-pdf';
        }
        
        this.actualFileSize = stats.size;
        this.fileExists = true;
        
      } else {
        console.log('❌ PDF file not found on disk');
        console.log('🔍 Checking directory contents...');
        
        // List files in generated-reports directory
        if (fs.existsSync(this.outputDir)) {
          const files = fs.readdirSync(this.outputDir);
          const recentFiles = files
            .filter(f => f.includes('institutional') || f.includes('NVDA'))
            .slice(-5);
          
          console.log(`📁 Recent relevant files: ${recentFiles.join(', ')}`);
        }
        
        this.fileVerification = 'not-found';
        this.fileExists = false;
      }
      
    } catch (error) {
      console.log(`❌ Error verifying PDF file: ${error.message}`);
      this.fileVerification = 'error';
    }
    
    console.log('');
  }

  generateFinalAssessment() {
    console.log('📋 INSTITUTIONAL PDF GENERATION ASSESSMENT');
    console.log('='.repeat(60));
    
    // Overall status
    console.log('🎯 OVERALL STATUS:');
    
    if (this.pdfGenerated && this.fileExists && this.fileVerification === 'valid-pdf') {
      console.log('🎉 SUCCESS: Institutional PDF generation working!');
      console.log('✅ API call successful');
      console.log('✅ PDF generated on server');
      console.log('✅ PDF file created on disk');
      console.log('✅ Valid PDF format');
      
      console.log('\n📊 QUALITY METRICS:');
      if (this.contentQuality) {
        console.log(`📝 Content Quality: ${this.contentQuality.score}/100`);
        console.log(`📑 Sections: ${this.contentQuality.sectionCount}`);
        console.log(`📊 Data Sources: ${this.contentQuality.dataSources}`);
        console.log(`🤖 AI Analysis: ${this.contentQuality.hasAIAnalysis ? 'Yes' : 'No'}`);
      }
      
      console.log('\n📄 FILE DETAILS:');
      console.log(`📁 Filename: ${this.filename}`);
      console.log(`📊 File Size: ${(this.actualFileSize / 1024).toFixed(1)} KB`);
      if (this.downloadedPDFPath) {
        console.log(`📥 Downloaded from: Serverless Base64`);
        console.log(`📁 Local Path: ${this.downloadedPDFPath}`);
      }

      if (this.sizeRatio) {
        console.log(`📊 Size vs Example: ${this.sizeRatio.toFixed(1)}%`);
      }
      
      console.log('\n🎯 ACHIEVEMENT:');
      console.log('✅ Modular institutional architecture operational');
      console.log('✅ Real PDF generation working');
      console.log('✅ File system integration successful');
      console.log('✅ Ready for production use');
      
    } else if (this.pdfGenerated && !this.fileExists) {
      console.log('⚠️ PARTIAL SUCCESS: PDF generated but file not accessible');
      console.log('✅ API call successful');
      console.log('✅ PDF generation reported as successful');
      console.log('❌ PDF file not found on disk');
      
      console.log('\n🔧 POSSIBLE ISSUES:');
      console.log('- File path mismatch between server and local');
      console.log('- Vercel serverless environment file system limitations');
      console.log('- PDF saved to different location than expected');
      
    } else if (!this.pdfGenerated) {
      console.log('❌ FAILURE: PDF generation not working');
      
      if (this.apiError) {
        console.log(`❌ API Error: ${this.apiError}`);
      }
      if (this.pdfError) {
        console.log(`❌ PDF Error: ${this.pdfError}`);
      }
      if (this.requestError) {
        console.log(`❌ Request Error: ${this.requestError}`);
      }
      
      console.log('\n🔧 DEBUGGING NEEDED:');
      console.log('- Check PDF generator integration');
      console.log('- Verify file system permissions');
      console.log('- Check enhanced PDF generator dependencies');
      
    } else {
      console.log('❌ UNKNOWN STATUS: Unexpected result');
    }
    
    console.log('\n📍 NEXT STEPS:');
    if (this.pdfGenerated && this.fileExists) {
      console.log('1. ✅ PDF generation working - ready for production');
      console.log('2. Test with multiple tickers');
      console.log('3. Integrate with frontend UI');
      console.log('4. Add PDF download functionality');
    } else {
      console.log('1. Debug PDF generation issues');
      console.log('2. Fix file system integration');
      console.log('3. Test enhanced PDF generator directly');
      console.log('4. Verify Vercel serverless compatibility');
    }
    
    console.log(`\n🌐 Production Endpoint: ${this.baseUrl}/api/reports/generate-modular-institutional`);
    console.log('📁 Expected Output: ./generated-reports/[TICKER]_institutional_[TIMESTAMP].pdf');
  }
}

// Run the institutional PDF test
const tester = new InstitutionalPDFTester();
tester.testInstitutionalPDFGeneration().catch(console.error);
