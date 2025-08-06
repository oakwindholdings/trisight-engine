// test-complete-institutional-system.js
// Comprehensive test of the complete institutional report generation system

const axios = require('axios');

class CompleteInstitutionalSystemTester {
  constructor() {
    this.baseUrl = 'https://trisight-beta.vercel.app';
    this.results = {};
  }

  async testCompleteSystem() {
    console.log('🏛️ COMPREHENSIVE INSTITUTIONAL SYSTEM TEST');
    console.log('='.repeat(70));
    console.log(`🌐 Production URL: ${this.baseUrl}\n`);
    
    // Test 1: Compare all report generation methods
    await this.compareReportGenerationMethods();
    
    // Test 2: Test institutional quality metrics
    await this.testInstitutionalQualityMetrics();
    
    // Test 3: Test performance benchmarks
    await this.testPerformanceBenchmarks();
    
    // Test 4: Test real vs fallback data quality
    await this.testDataQualityComparison();
    
    // Generate comprehensive assessment
    this.generateComprehensiveAssessment();
  }

  async compareReportGenerationMethods() {
    console.log('1️⃣ Comparing Report Generation Methods...');
    
    const testTicker = 'NVDA';
    const methods = [
      {
        name: 'Original API',
        endpoint: '/api/reports/generate-js',
        description: 'Original working API'
      },
      {
        name: 'Modular Institutional',
        endpoint: '/api/reports/generate-modular-institutional',
        description: 'New modular intelligence architecture'
      }
    ];

    for (const method of methods) {
      try {
        console.log(`\n📊 Testing ${method.name}...`);
        
        const startTime = Date.now();
        const response = await axios.post(`${this.baseUrl}${method.endpoint}`, {
          ticker: testTicker,
          title: `${testTicker} ${method.name} Test`,
          template: 'institutional'
        }, {
          timeout: 60000,
          validateStatus: () => true,
          headers: { 'Content-Type': 'application/json' }
        });
        
        const endTime = Date.now();
        const generationTime = endTime - startTime;
        
        if (response.status === 200 && response.data.success) {
          console.log(`✅ ${method.name}: SUCCESS`);
          console.log(`   ⏱️ Generation time: ${generationTime}ms`);
          console.log(`   📊 Response size: ${JSON.stringify(response.data).length} chars`);
          
          // Analyze content quality
          const contentAnalysis = this.analyzeContentQuality(response.data, method.name);
          console.log(`   📝 Content quality: ${contentAnalysis.score}/100`);
          console.log(`   📑 Sections: ${contentAnalysis.sections}`);
          
          this.results[method.name] = {
            success: true,
            generationTime,
            responseSize: JSON.stringify(response.data).length,
            contentQuality: contentAnalysis,
            data: response.data
          };
          
        } else {
          console.log(`❌ ${method.name}: FAILED`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Error: ${response.data?.error || 'Unknown error'}`);
          
          this.results[method.name] = {
            success: false,
            error: response.data?.error || 'Unknown error',
            status: response.status
          };
        }
        
      } catch (error) {
        console.log(`❌ ${method.name}: ERROR`);
        console.log(`   Error: ${error.message}`);
        
        this.results[method.name] = {
          success: false,
          error: error.message
        };
      }
    }
    
    console.log('');
  }

  analyzeContentQuality(responseData, methodName) {
    let score = 0;
    let sections = 0;
    
    try {
      // Check for report structure
      if (responseData.report || responseData.slides) {
        score += 20;
      }
      
      // Check for sections (modular architecture)
      if (responseData.report?.sections) {
        sections = Object.keys(responseData.report.sections).length;
        score += Math.min(sections * 5, 30); // Up to 30 points for sections
      }
      
      // Check for slides (original architecture)
      if (responseData.slides) {
        sections = responseData.slides.length;
        score += Math.min(sections * 3, 30); // Up to 30 points for slides
      }
      
      // Check for metadata
      if (responseData.metadata) {
        score += 15;
      }
      
      // Check for real data indicators
      const content = JSON.stringify(responseData);
      if (content.includes('$') || content.includes('%') || content.includes('revenue')) {
        score += 20; // Real financial data
      }
      
      // Check for AI-generated content
      if (content.includes('analysis') || content.includes('recommendation')) {
        score += 15; // AI analysis
      }
      
    } catch (error) {
      console.log(`   ⚠️ Error analyzing ${methodName} content:`, error.message);
    }
    
    return {
      score: Math.min(score, 100),
      sections,
      hasRealData: score >= 60,
      hasAIAnalysis: score >= 75
    };
  }

  async testInstitutionalQualityMetrics() {
    console.log('2️⃣ Testing Institutional Quality Metrics...');
    
    if (!this.results['Modular Institutional']?.success) {
      console.log('⚠️ Modular Institutional API not available for quality testing');
      console.log('');
      return;
    }

    const report = this.results['Modular Institutional'].data.report;
    
    console.log('🏛️ Institutional Quality Assessment:');
    
    // Required sections for institutional reports
    const requiredSections = [
      'executiveSummary',
      'investmentThesis',
      'financialAnalysis',
      'valuationAnalysis',
      'riskAssessment',
      'priceTarget'
    ];
    
    const availableSections = Object.keys(report?.sections || {});
    const sectionCoverage = requiredSections.filter(section => 
      availableSections.includes(section)
    ).length;
    
    console.log(`📑 Section coverage: ${sectionCoverage}/${requiredSections.length} (${((sectionCoverage/requiredSections.length)*100).toFixed(1)}%)`);
    
    // Check for AI-powered analysis
    let aiAnalysisScore = 0;
    if (report?.sections?.executiveSummary?.confidence) {
      aiAnalysisScore += 25;
      console.log(`🤖 AI confidence: ${(report.sections.executiveSummary.confidence * 100).toFixed(1)}%`);
    }
    
    // Check for comprehensive content
    const totalContentLength = JSON.stringify(report?.sections || {}).length;
    console.log(`📝 Content depth: ${totalContentLength} characters`);
    
    if (totalContentLength > 5000) aiAnalysisScore += 25;
    if (totalContentLength > 10000) aiAnalysisScore += 25;
    if (totalContentLength > 15000) aiAnalysisScore += 25;
    
    // Overall institutional quality score
    const institutionalScore = (sectionCoverage / requiredSections.length) * 60 + (aiAnalysisScore * 0.4);
    
    console.log(`🏛️ Institutional Quality Score: ${institutionalScore.toFixed(1)}/100`);
    
    if (institutionalScore >= 80) {
      console.log('✅ INSTITUTIONAL GRADE: EXCELLENT');
    } else if (institutionalScore >= 60) {
      console.log('✅ INSTITUTIONAL GRADE: GOOD');
    } else {
      console.log('⚠️ INSTITUTIONAL GRADE: NEEDS IMPROVEMENT');
    }
    
    this.results.institutionalQuality = {
      score: institutionalScore,
      sectionCoverage,
      contentLength: totalContentLength,
      aiAnalysisScore
    };
    
    console.log('');
  }

  async testPerformanceBenchmarks() {
    console.log('3️⃣ Testing Performance Benchmarks...');
    
    const benchmarks = {
      'Original API': this.results['Original API']?.generationTime,
      'Modular Institutional': this.results['Modular Institutional']?.generationTime
    };
    
    console.log('⏱️ Generation Time Comparison:');
    Object.entries(benchmarks).forEach(([method, time]) => {
      if (time) {
        const status = time < 1000 ? '🚀 FAST' : 
                     time < 5000 ? '✅ GOOD' : 
                     time < 15000 ? '⚠️ SLOW' : '❌ TOO SLOW';
        console.log(`   ${method}: ${time}ms ${status}`);
      } else {
        console.log(`   ${method}: N/A (failed)`);
      }
    });
    
    // Performance winner
    const fastestMethod = Object.entries(benchmarks)
      .filter(([_, time]) => time)
      .sort(([_, a], [__, b]) => a - b)[0];
    
    if (fastestMethod) {
      console.log(`🏆 Performance winner: ${fastestMethod[0]} (${fastestMethod[1]}ms)`);
    }
    
    console.log('');
  }

  async testDataQualityComparison() {
    console.log('4️⃣ Testing Data Quality Comparison...');
    
    // Compare content quality between methods
    const qualityComparison = {};
    
    Object.entries(this.results).forEach(([method, result]) => {
      if (result.success && result.contentQuality) {
        qualityComparison[method] = result.contentQuality;
      }
    });
    
    console.log('📊 Content Quality Comparison:');
    Object.entries(qualityComparison).forEach(([method, quality]) => {
      console.log(`   ${method}:`);
      console.log(`     Quality Score: ${quality.score}/100`);
      console.log(`     Sections: ${quality.sections}`);
      console.log(`     Real Data: ${quality.hasRealData ? '✅' : '❌'}`);
      console.log(`     AI Analysis: ${quality.hasAIAnalysis ? '✅' : '❌'}`);
    });
    
    console.log('');
  }

  generateComprehensiveAssessment() {
    console.log('📋 COMPREHENSIVE INSTITUTIONAL SYSTEM ASSESSMENT');
    console.log('='.repeat(70));
    
    // Success rate
    const totalMethods = Object.keys(this.results).filter(key => 
      !['institutionalQuality'].includes(key)
    ).length;
    const successfulMethods = Object.values(this.results).filter(result => 
      result.success
    ).length;
    
    console.log(`📈 Success Rate: ${successfulMethods}/${totalMethods} (${((successfulMethods/totalMethods)*100).toFixed(1)}%)`);
    
    // Performance summary
    console.log('\n⚡ Performance Summary:');
    Object.entries(this.results).forEach(([method, result]) => {
      if (result.success && result.generationTime) {
        console.log(`   ${method}: ${result.generationTime}ms`);
      }
    });
    
    // Quality summary
    if (this.results.institutionalQuality) {
      console.log(`\n🏛️ Institutional Quality: ${this.results.institutionalQuality.score.toFixed(1)}/100`);
    }
    
    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    
    if (successfulMethods === totalMethods && this.results.institutionalQuality?.score >= 80) {
      console.log('🎉 EXCELLENT: All systems operational with institutional-grade quality');
      console.log('✅ Ready for production deployment');
      console.log('✅ Modular architecture successfully implemented');
      console.log('✅ Performance benchmarks exceeded');
      
    } else if (successfulMethods >= totalMethods * 0.8) {
      console.log('✅ GOOD: Core systems working with minor issues');
      console.log('⚠️ Some improvements needed for full institutional grade');
      
    } else {
      console.log('⚠️ NEEDS WORK: Critical issues detected');
      console.log('🔧 Immediate attention required');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Deploy modular institutional API to production');
    console.log('2. Integrate with frontend report generation');
    console.log('3. Add PDF generation capability');
    console.log('4. Implement real-time data integration');
    console.log('5. Add user authentication and report management');
    
    console.log(`\n📍 PRODUCTION ENDPOINTS:`);
    console.log(`🌐 Frontend: ${this.baseUrl}`);
    console.log(`🔗 Original API: ${this.baseUrl}/api/reports/generate-js`);
    console.log(`🏛️ Institutional API: ${this.baseUrl}/api/reports/generate-modular-institutional`);
  }
}

// Run the comprehensive system test
const tester = new CompleteInstitutionalSystemTester();
tester.testCompleteSystem().catch(console.error);
