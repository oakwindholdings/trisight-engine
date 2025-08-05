// comprehensive-debug.js
// Systematic testing-analysis-remediation approach for report generation

const axios = require('axios');
const fs = require('fs');

class ReportDiagnostic {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stages = {
      validation: 'pending',
      dataFetch: 'pending', 
      analysis: 'pending',
      chartGeneration: 'pending',
      pdfGeneration: 'pending'
    };
  }

  async runComprehensiveDiagnostic() {
    console.log('🔍 COMPREHENSIVE REPORT GENERATION DIAGNOSTIC\n');
    
    // Test 1: Server Health
    await this.testServerHealth();
    
    // Test 2: Data Validation
    await this.testDataValidation();
    
    // Test 3: Analysis Pipeline
    await this.testAnalysisPipeline();
    
    // Test 4: Chart Generation
    await this.testChartGeneration();
    
    // Test 5: PDF Generation
    await this.testPdfGeneration();
    
    // Generate diagnostic report
    this.generateDiagnosticReport();
  }

  async testServerHealth() {
    console.log('1️⃣ Testing Server Health...');
    try {
      const response = await axios.get('http://localhost:3001/api/health');
      if (response.status === 200) {
        console.log('✅ Server is healthy');
        this.stages.validation = 'passed';
      } else {
        this.errors.push('Server health check failed');
        this.stages.validation = 'failed';
      }
    } catch (error) {
      this.errors.push(`Server unreachable: ${error.message}`);
      this.stages.validation = 'failed';
    }
  }

  async testDataValidation() {
    console.log('\n2️⃣ Testing Data Validation...');
    try {
      const config = {
        ticker: 'AAPL', // Use AAPL instead of NVDA to test different data
        title: 'Data Validation Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: false, // Disable charts to isolate data issues
        debugMode: true
      };

      const response = await axios.post('http://localhost:3001/api/reports/generate', config, {
        timeout: 30000
      });

      if (response.data.success) {
        console.log('✅ Data validation passed');
        this.stages.dataFetch = 'passed';
      } else {
        const error = response.data.error || response.data.companyData?.metadata?.error;
        if (error) {
          console.log(`❌ Data validation failed: ${error}`);
          this.errors.push(`Data validation: ${error}`);
          this.stages.dataFetch = 'failed';
        }
      }
    } catch (error) {
      this.errors.push(`Data validation error: ${error.message}`);
      this.stages.dataFetch = 'failed';
    }
  }

  async testAnalysisPipeline() {
    console.log('\n3️⃣ Testing Analysis Pipeline...');
    try {
      const config = {
        ticker: 'MSFT', // Use different ticker
        title: 'Analysis Pipeline Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: false,
        debugMode: true
      };

      const response = await axios.post('http://localhost:3001/api/reports/generate', config, {
        timeout: 45000
      });

      if (response.data.success && response.data.slides && response.data.slides.length > 1) {
        console.log('✅ Analysis pipeline working');
        this.stages.analysis = 'passed';
      } else {
        const error = response.data.metadata?.errors?.[0]?.message || 'Unknown analysis error';
        console.log(`❌ Analysis pipeline failed: ${error}`);
        this.errors.push(`Analysis: ${error}`);
        this.stages.analysis = 'failed';
      }
    } catch (error) {
      this.errors.push(`Analysis pipeline error: ${error.message}`);
      this.stages.analysis = 'failed';
    }
  }

  async testChartGeneration() {
    console.log('\n4️⃣ Testing Chart Generation...');
    try {
      const config = {
        ticker: 'GOOGL',
        title: 'Chart Generation Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true, // Enable charts
        debugMode: true
      };

      const response = await axios.post('http://localhost:3001/api/reports/generate', config, {
        timeout: 60000
      });

      if (response.data.success) {
        // Check if charts were generated
        let chartCount = 0;
        if (response.data.slides) {
          response.data.slides.forEach(slide => {
            if (slide.content) {
              slide.content.forEach(content => {
                if (content.type === 'chart') chartCount++;
              });
            }
          });
        }

        if (chartCount > 0) {
          console.log(`✅ Chart generation working (${chartCount} charts)`);
          this.stages.chartGeneration = 'passed';
        } else {
          console.log('⚠️ No charts found in report');
          this.warnings.push('No charts generated');
          this.stages.chartGeneration = 'warning';
        }
      } else {
        const error = response.data.metadata?.errors?.[0]?.message || 'Chart generation failed';
        console.log(`❌ Chart generation failed: ${error}`);
        this.errors.push(`Charts: ${error}`);
        this.stages.chartGeneration = 'failed';
      }
    } catch (error) {
      this.errors.push(`Chart generation error: ${error.message}`);
      this.stages.chartGeneration = 'failed';
    }
  }

  async testPdfGeneration() {
    console.log('\n5️⃣ Testing PDF Generation...');
    try {
      const config = {
        ticker: 'TSLA',
        title: 'PDF Generation Test',
        template: 'equity-research',
        outputFormat: 'pdf',
        includeCharts: true,
        debugMode: true
      };

      const response = await axios.post('http://localhost:3001/api/reports/generate', config, {
        timeout: 60000
      });

      if (response.data.success && response.data.outputPath) {
        // Check if PDF file exists and has reasonable size
        if (fs.existsSync(response.data.outputPath)) {
          const stats = fs.statSync(response.data.outputPath);
          const sizeKB = Math.round(stats.size / 1024);
          
          if (sizeKB > 50) {
            console.log(`✅ PDF generation working (${sizeKB} KB)`);
            this.stages.pdfGeneration = 'passed';
          } else {
            console.log(`⚠️ PDF generated but small (${sizeKB} KB)`);
            this.warnings.push(`Small PDF size: ${sizeKB} KB`);
            this.stages.pdfGeneration = 'warning';
          }
        } else {
          console.log('❌ PDF file not found');
          this.errors.push('PDF file not created');
          this.stages.pdfGeneration = 'failed';
        }
      } else {
        const error = response.data.metadata?.errors?.[0]?.message || 'PDF generation failed';
        console.log(`❌ PDF generation failed: ${error}`);
        this.errors.push(`PDF: ${error}`);
        this.stages.pdfGeneration = 'failed';
      }
    } catch (error) {
      this.errors.push(`PDF generation error: ${error.message}`);
      this.stages.pdfGeneration = 'failed';
    }
  }

  generateDiagnosticReport() {
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    
    // Stage status
    Object.entries(this.stages).forEach(([stage, status]) => {
      const icon = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`${icon} ${stage.padEnd(20)} ${status.toUpperCase()}`);
    });
    
    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
    }
    
    // Recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    this.generateRecommendations();
    
    // Save diagnostic report
    const report = {
      timestamp: new Date().toISOString(),
      stages: this.stages,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };
    
    fs.writeFileSync('diagnostic-report.json', JSON.stringify(report, null, 2));
    console.log('\n💾 Diagnostic report saved to diagnostic-report.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.stages.validation === 'failed') {
      recommendations.push('Fix server connectivity issues');
    }
    
    if (this.stages.dataFetch === 'failed') {
      recommendations.push('Check TwelveData API integration and data validation logic');
    }
    
    if (this.stages.analysis === 'failed') {
      recommendations.push('Debug financial analysis calculations (intrinsic value, fair value)');
    }
    
    if (this.stages.chartGeneration === 'failed') {
      recommendations.push('Test StandardChartGenerator and Canvas dependencies');
    }
    
    if (this.stages.pdfGeneration === 'failed') {
      recommendations.push('Check jsPDF integration and file system permissions');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All systems operational - investigate specific ticker issues');
    }
    
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    
    return recommendations;
  }
}

// Run diagnostic
const diagnostic = new ReportDiagnostic();
diagnostic.runComprehensiveDiagnostic().catch(console.error);
