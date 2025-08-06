// test-modular-institutional.js
// Test the new modular institutional report generation

const axios = require('axios');

class ModularInstitutionalTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
  }

  async testModularInstitutional() {
    console.log('🏛️ TESTING MODULAR INSTITUTIONAL REPORT GENERATION');
    console.log('='.repeat(60));
    console.log(`🌐 Testing URL: ${this.baseUrl}\n`);
    
    // Test 1: Test modular architecture
    await this.testModularArchitecture();
    
    // Test 2: Test data gathering module
    await this.testDataGatheringModule();
    
    // Test 3: Test executive summary module
    await this.testExecutiveSummaryModule();
    
    // Test 4: Test full institutional report
    await this.testFullInstitutionalReport();
    
    // Generate final assessment
    this.generateFinalAssessment();
  }

  async testModularArchitecture() {
    console.log('1️⃣ Testing Modular Architecture...');
    
    try {
      const config = {
        ticker: 'NVDA',
        title: 'NVIDIA Corporation - Institutional Analysis',
        template: 'institutional',
        includeCharts: true,
        includeTables: true
      };

      console.log('📤 Testing modular institutional endpoint...');
      const response = await axios.post(`${this.baseUrl}/api/reports/generate-modular-institutional`, config, {
        timeout: 90000, // Longer timeout for comprehensive analysis
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Modular API Status: ${response.status}`);
      
      if (response.status === 200 && response.data.success) {
        console.log('✅ Modular architecture working!');
        console.log(`📊 Report ID: ${response.data.reportId}`);
        console.log(`⏱️ Generation time: ${response.data.generationTime}ms`);
        console.log(`🏗️ Architecture: ${response.data.metadata.architecture}`);
        
        // Analyze modular structure
        if (response.data.report && response.data.report.sections) {
          const sections = Object.keys(response.data.report.sections);
          console.log(`📑 Sections generated: ${sections.length}`);
          console.log(`📋 Section types: ${sections.join(', ')}`);
          
          this.modularArchitectureWorking = true;
          this.sectionsGenerated = sections.length;
          this.reportData = response.data.report;
        } else {
          console.log('⚠️ Report structure incomplete');
          this.modularArchitectureWorking = false;
        }
        
      } else {
        console.log('❌ Modular architecture failed');
        console.log('Response:', response.data);
        this.modularArchitectureWorking = false;
      }
    } catch (error) {
      console.log(`❌ Modular architecture error: ${error.message}`);
      this.modularArchitectureWorking = false;
    }
    console.log('');
  }

  async testDataGatheringModule() {
    console.log('2️⃣ Testing Data Gathering Module...');
    
    if (!this.reportData) {
      console.log('⚠️ No report data available for analysis');
      this.dataGatheringWorking = false;
      console.log('');
      return;
    }

    try {
      // Analyze the raw data collected by the data gathering module
      const rawData = this.reportData.rawData || {};
      
      console.log('📊 Data Sources Analysis:');
      
      const dataSources = {
        marketData: !!rawData.marketData?.success,
        financials: !!rawData.financials?.success,
        companyProfile: !!rawData.companyProfile?.success,
        analystData: !!rawData.analystData?.success,
        newsIntelligence: !!rawData.newsIntelligence?.success,
        webIntelligence: !!rawData.webIntelligence?.success,
        technicalIndicators: !!rawData.technicalIndicators?.success,
        esgData: !!rawData.esgData?.success,
        aiInsights: !!rawData.aiInsights?.success
      };
      
      Object.entries(dataSources).forEach(([source, status]) => {
        console.log(`  ${status ? '✅' : '❌'} ${source}`);
      });
      
      const successfulSources = Object.values(dataSources).filter(status => status).length;
      const totalSources = Object.keys(dataSources).length;
      
      console.log(`📈 Data gathering success rate: ${successfulSources}/${totalSources} (${((successfulSources/totalSources)*100).toFixed(1)}%)`);
      
      if (successfulSources >= totalSources * 0.6) { // 60% success threshold
        console.log('✅ Data gathering module working effectively');
        this.dataGatheringWorking = true;
      } else {
        console.log('⚠️ Data gathering module needs improvement');
        this.dataGatheringWorking = false;
      }
      
      this.dataSourcesSuccess = successfulSources;
      this.totalDataSources = totalSources;
      
    } catch (error) {
      console.log(`❌ Data gathering analysis error: ${error.message}`);
      this.dataGatheringWorking = false;
    }
    console.log('');
  }

  async testExecutiveSummaryModule() {
    console.log('3️⃣ Testing Executive Summary Module...');
    
    if (!this.reportData || !this.reportData.sections) {
      console.log('⚠️ No sections data available for analysis');
      this.executiveSummaryWorking = false;
      console.log('');
      return;
    }

    try {
      const executiveSummary = this.reportData.sections.executiveSummary;
      
      if (!executiveSummary) {
        console.log('❌ Executive summary section not found');
        this.executiveSummaryWorking = false;
        console.log('');
        return;
      }

      console.log('📋 Executive Summary Analysis:');
      
      // Check for key components
      const components = {
        investmentThesis: !!executiveSummary.content?.investmentThesis,
        recommendation: !!executiveSummary.recommendation,
        keyMetrics: !!executiveSummary.keyMetrics,
        keyRisks: !!executiveSummary.content?.keyRisks?.length,
        keyCatalysts: !!executiveSummary.content?.keyCatalysts?.length,
        charts: !!executiveSummary.charts?.length,
        tables: !!executiveSummary.tables?.length
      };
      
      Object.entries(components).forEach(([component, present]) => {
        console.log(`  ${present ? '✅' : '❌'} ${component}`);
      });
      
      // Check content quality
      const contentLength = JSON.stringify(executiveSummary.content || {}).length;
      console.log(`📝 Content length: ${contentLength} characters`);
      
      const confidence = executiveSummary.confidence || 0;
      console.log(`🎯 AI confidence: ${(confidence * 100).toFixed(1)}%`);
      
      if (Object.values(components).filter(Boolean).length >= 5 && contentLength > 500) {
        console.log('✅ Executive summary module generating quality content');
        this.executiveSummaryWorking = true;
      } else {
        console.log('⚠️ Executive summary module needs enhancement');
        this.executiveSummaryWorking = false;
      }
      
      this.executiveSummaryComponents = Object.values(components).filter(Boolean).length;
      this.executiveSummaryContentLength = contentLength;
      
    } catch (error) {
      console.log(`❌ Executive summary analysis error: ${error.message}`);
      this.executiveSummaryWorking = false;
    }
    console.log('');
  }

  async testFullInstitutionalReport() {
    console.log('4️⃣ Testing Full Institutional Report Quality...');
    
    if (!this.reportData) {
      console.log('⚠️ No report data available for quality analysis');
      this.institutionalQuality = false;
      console.log('');
      return;
    }

    try {
      console.log('🏛️ Institutional Quality Assessment:');
      
      // Check report structure
      const sections = this.reportData.sections || {};
      const sectionCount = Object.keys(sections).length;
      console.log(`📑 Sections generated: ${sectionCount}`);
      
      // Check for institutional requirements
      const institutionalRequirements = {
        executiveSummary: !!sections.executiveSummary,
        investmentThesis: !!sections.investmentThesis,
        financialAnalysis: !!sections.financialAnalysis,
        valuationAnalysis: !!sections.valuationAnalysis,
        riskAssessment: !!sections.riskAssessment,
        priceTarget: !!sections.priceTarget
      };
      
      const requirementsMet = Object.values(institutionalRequirements).filter(Boolean).length;
      const totalRequirements = Object.keys(institutionalRequirements).length;
      
      console.log(`📊 Institutional requirements: ${requirementsMet}/${totalRequirements} met`);
      
      Object.entries(institutionalRequirements).forEach(([requirement, met]) => {
        console.log(`  ${met ? '✅' : '❌'} ${requirement}`);
      });
      
      // Check data quality
      const dataQuality = this.reportData.metadata?.dataQuality || 'unknown';
      console.log(`📈 Data quality: ${dataQuality}`);
      
      // Overall assessment
      const qualityScore = (requirementsMet / totalRequirements) * 100;
      console.log(`🎯 Institutional quality score: ${qualityScore.toFixed(1)}%`);
      
      if (qualityScore >= 70 && sectionCount >= 6) {
        console.log('✅ Institutional-quality report generated');
        this.institutionalQuality = true;
      } else {
        console.log('⚠️ Report quality needs improvement for institutional standards');
        this.institutionalQuality = false;
      }
      
      this.institutionalScore = qualityScore;
      this.totalSections = sectionCount;
      
    } catch (error) {
      console.log(`❌ Institutional quality assessment error: ${error.message}`);
      this.institutionalQuality = false;
    }
    console.log('');
  }

  generateFinalAssessment() {
    console.log('📋 MODULAR INSTITUTIONAL REPORT ASSESSMENT');
    console.log('='.repeat(60));
    
    const results = {
      'Modular Architecture': this.modularArchitectureWorking ? '✅ WORKING' : '❌ FAILED',
      'Data Gathering Module': this.dataGatheringWorking ? '✅ WORKING' : '❌ FAILED',
      'Executive Summary Module': this.executiveSummaryWorking ? '✅ WORKING' : '❌ FAILED',
      'Institutional Quality': this.institutionalQuality ? '✅ ACHIEVED' : '❌ NEEDS WORK'
    };
    
    Object.entries(results).forEach(([test, status]) => {
      console.log(`${status.padEnd(15)} ${test}`);
    });
    
    console.log('');
    
    // Detailed metrics
    if (this.sectionsGenerated) {
      console.log('📊 DETAILED METRICS:');
      console.log(`  📑 Sections generated: ${this.sectionsGenerated}`);
      console.log(`  📈 Data sources success: ${this.dataSourcesSuccess}/${this.totalDataSources}`);
      console.log(`  📝 Executive summary components: ${this.executiveSummaryComponents}/7`);
      console.log(`  🏛️ Institutional score: ${this.institutionalScore?.toFixed(1)}%`);
    }
    
    // Overall assessment
    const criticalTestsPassed = this.modularArchitectureWorking && this.dataGatheringWorking;
    
    if (criticalTestsPassed && this.institutionalQuality) {
      console.log('\n🎉 SUCCESS! MODULAR INSTITUTIONAL ARCHITECTURE WORKING!');
      console.log('✅ Modular intelligence modules operational');
      console.log('✅ Comprehensive data gathering functional');
      console.log('✅ AI-powered section generation working');
      console.log('✅ Institutional-quality output achieved');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Deploy to production');
      console.log('2. Implement remaining intelligence modules');
      console.log('3. Add PDF generation capability');
      console.log('4. Integrate with frontend');
      
    } else if (criticalTestsPassed) {
      console.log('\n⚠️ PARTIAL SUCCESS');
      console.log('✅ Core modular architecture working');
      console.log('⚠️ Quality improvements needed for institutional standards');
      
      console.log('\n🔧 RECOMMENDED IMPROVEMENTS:');
      if (!this.institutionalQuality) {
        console.log('1. Enhance section content quality');
        console.log('2. Add more comprehensive analysis');
        console.log('3. Improve AI-generated insights');
      }
      
    } else {
      console.log('\n❌ CRITICAL ISSUES DETECTED');
      
      if (!this.modularArchitectureWorking) {
        console.log('🚨 Modular architecture not functioning');
      }
      if (!this.dataGatheringWorking) {
        console.log('🚨 Data gathering module failing');
      }
      
      console.log('\n🔧 URGENT FIXES NEEDED:');
      console.log('1. Debug modular API endpoint');
      console.log('2. Fix data gathering integration');
      console.log('3. Verify API key configuration');
    }
    
    console.log('\n📍 CURRENT STATUS:');
    console.log(`🌐 Endpoint: ${this.baseUrl}/api/reports/generate-modular-institutional`);
    console.log('🏗️ Architecture: Modular Intelligence');
    console.log('🤖 AI Integration: Anthropic Claude + TwelveData + Firecrawl');
  }
}

// Run the modular institutional test
const tester = new ModularInstitutionalTester();
tester.testModularInstitutional().catch(console.error);
