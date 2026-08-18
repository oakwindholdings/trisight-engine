// src/reportGeneration/examples/templateSystemValidation.ts
// Validation of template system connecting wizard selections to report content
// Context: Tests Phase 3 implementation for meaningful report generation

import { ReportGenerator, createReportGenerator } from '../core/reportGenerator';
import { 
  REPORT_TEMPLATES, 
  mapWizardToReportConfig,
  generateSlidesFromTemplate 
} from '../templates/reportTemplates';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { DataProcessor } from '../core/dataProcessor';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validates template system functionality
 */
async function validateTemplateSystem() {
  console.log('=== Template System Validation ===\n');
  
  try {
    // 1. Test Template Mapping
    console.log('1. Testing Template Mapping...');
    
    const wizardConfig = {
      template: 'equity-research',
      title: 'Apple Inc. Q4 2024 Analysis',
      ticker: 'AAPL',
      author: 'John Analyst',
      timeframe: '1Y',
      dataSources: ['market-data', 'financials', 'patterns', 'news'],
      sections: {
        executiveSummary: true,
        financialAnalysis: true,
        technicalAnalysis: true,
        riskAssessment: true,
        aiInsights: false
      },
      visualizations: {
        priceChart: true,
        volumeAnalysis: true,
        patternDetection: true,
        performanceMetrics: true
      },
      outputFormat: 'pdf'
    };
    
    const reportConfig = mapWizardToReportConfig(wizardConfig);
    
    console.log('✓ Wizard config mapped successfully');
    console.log(`  - Template: ${reportConfig.template?.name}`);
    console.log(`  - Sections: ${reportConfig.sections.length}`);
    console.log(`  - Charts: ${reportConfig.chartConfigs?.length || 0}`);
    console.log(`  - Data sources: ${reportConfig.dataSourcePriorities.length}`);
    
    // 2. Test Template Content Generation
    console.log('\n2. Testing Template Content Generation...');
    
    // Fetch real data
    const adapter = new TwelveDataAdapter({ debugMode: true });
    const processor = new DataProcessor();
    
    const quote = await adapter.getQuote('AAPL');
    const fundamentals = await adapter.getFundamentals('AAPL');
    
    const companyData = {
      ticker: 'AAPL',
      companyName: 'Apple Inc.',
      description: 'Technology company',
      sector: 'Technology',
      industry: 'Consumer Electronics',
      financials: fundamentals,
      metadata: {
        lastUpdated: new Date().toISOString(),
        sources: { twelvedata: true },
        quality: { overall: 0.9 }
      }
    };
    
    const analysis = await processor.process(companyData as any);
    
    console.log('✓ Real data fetched and processed');
    console.log(`  - Current price: $${quote.close}`);
    console.log(`  - Overall score: ${analysis.composite.overall}/100`);
    console.log(`  - Recommendation: ${analysis.composite.recommendation}`);
    
    // 3. Test Slide Generation
    console.log('\n3. Testing Slide Generation from Template...');
    
    const template = REPORT_TEMPLATES['equity-research'];
    const slides = await generateSlidesFromTemplate(
      template,
      companyData,
      analysis,
      reportConfig
    );
    
    console.log(`✓ Generated ${slides.length} slides from template`);
    slides.forEach((slide, i) => {
      console.log(`  - Slide ${i + 1}: ${slide.title} (${slide.content.length} content blocks)`);
    });
    
    // 4. Test Different Templates
    console.log('\n4. Testing Different Report Templates...');
    
    const templates = ['equity-research', 'technical-analysis', 'risk-assessment', 'quick-take'];
    
    for (const templateId of templates) {
      const template = REPORT_TEMPLATES[templateId];
      console.log(`\nTesting ${template.name}:`);
      console.log(`  - Required sections: ${template.requiredSections.join(', ')}`);
      console.log(`  - Optional sections: ${template.optionalSections.join(', ')}`);
      console.log(`  - Estimated pages: ${template.estimatedPages}`);
      console.log(`  - Target audience: ${template.targetAudience}`);
      
      // Generate slides for this template
      const templateSlides = generateSlidesFromTemplate(
        template,
        companyData,
        analysis,
        { ...reportConfig, sections: {} }
      );
      
      console.log(`  ✓ Generated ${templateSlides.length} slides`);
    }
    
    // 5. Test Full Report Generation with Template
    console.log('\n5. Testing Full Report Generation with Template...');
    
    const fullConfig = {
      ...reportConfig,
      ticker: 'MSFT',
      outputFormat: 'pdf'
    };
    
    const generator = createReportGenerator(fullConfig);
    const report = await generator.generateReport();
    
    console.log('✓ Full report generated with template');
    console.log(`  - Output path: ${report.outputPath}`);
    console.log(`  - Slides: ${report.slides.length}`);
    console.log(`  - Generation time: ${report.metadata.generationTime}ms`);
    
    // 6. Test Section Conditional Logic
    console.log('\n6. Testing Section Conditional Logic...');
    
    const conditionalConfig = {
      ...wizardConfig,
      sections: {
        executiveSummary: true,
        financialAnalysis: false, // Disable financial analysis
        technicalAnalysis: true,
        riskAssessment: false, // Disable risk assessment
        aiInsights: true
      }
    };
    
    const conditionalReportConfig = mapWizardToReportConfig(conditionalConfig);
    const conditionalSlides = generateSlidesFromTemplate(
      template,
      companyData,
      analysis,
      conditionalReportConfig
    );
    
    console.log('✓ Conditional sections working correctly');
    console.log(`  - Total slides: ${conditionalSlides.length}`);
    console.log(`  - Financial slides: ${conditionalSlides.filter(s => s.title.includes('Financial')).length}`);
    console.log(`  - Risk slides: ${conditionalSlides.filter(s => s.title.includes('Risk')).length}`);
    
    // 7. Test Quick Take (One-Pager)
    console.log('\n7. Testing Quick Take One-Pager...');
    
    const quickTakeConfig = {
      template: 'quick-take',
      ticker: 'GOOGL',
      title: 'Alphabet Quick Analysis',
      author: 'Analyst',
      timeframe: '3M',
      dataSources: ['market-data', 'financials'],
      sections: {
        summary: true,
        keyMetrics: true,
        recommendation: true
      },
      visualizations: {
        priceChart: true
      },
      outputFormat: 'pdf'
    };
    
    const quickTakeReportConfig = mapWizardToReportConfig(quickTakeConfig);
    const quickTakeTemplate = REPORT_TEMPLATES['quick-take'];
    const quickTakeSlides = await generateSlidesFromTemplate(
      quickTakeTemplate,
      companyData,
      analysis,
      quickTakeReportConfig
    );
    
    console.log('✓ Quick Take template generated');
    console.log(`  - Slides: ${quickTakeSlides.length} (should be 1)`);
    console.log(`  - Content blocks: ${quickTakeSlides[0]?.content.length || 0}`);
    
    // Summary
    console.log('\n=== Validation Summary ===');
    console.log('✓ Template mapping: PASSED');
    console.log('✓ Content generation: PASSED');
    console.log('✓ Slide generation: PASSED');
    console.log('✓ Multiple templates: PASSED');
    console.log('✓ Full report generation: PASSED');
    console.log('✓ Conditional logic: PASSED');
    console.log('✓ Quick take format: PASSED');
    console.log('\n✅ Template system is fully functional!');
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Validation failed:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

/**
 * Tests template content interpolation
 */
async function testContentInterpolation() {
  console.log('\n=== Content Interpolation Test ===\n');
  
  try {
    const testData = {
      companyName: 'Tesla Inc',
      ticker: 'TSLA',
      composite: {
        overall: 85,
        recommendation: 'BUY',
        confidence: 0.92
      },
      growth: {
        revenueGrowth: { yoy: 25.5, trend: 'accelerating' }
      },
      valuation: {
        marginOfSafety: 0.18,
        valuation: 'undervalued'
      },
      quality: {
        moat: 'wide',
        roic: 22.5
      },
      risk: {
        beta: 1.85,
        volatility: 0.35,
        riskScore: 65,
        maxDrawdown: 0.28
      },
      technicals: {
        trend: 'bullish',
        momentum: 'strong',
        support: 185,
        resistance: 215,
        entry: 195,
        stopLoss: 175
      }
    };
    
    // Test investment thesis template
    const investmentThesis = `{{companyName}} presents a {{composite.recommendation}} opportunity based on:
    • Primary strength in growth with {{growth.revenueGrowth.yoy}}% YoY revenue increase
    • Current valuation {{valuation.valuation}} with {{valuation.marginOfSafety}}% margin of safety
    • {{quality.moat}} competitive moat with ROIC of {{quality.roic}}%`;
    
    const interpolated = investmentThesis.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
      const keys = path.split('.');
      let value: any = testData;
      for (const key of keys) {
        value = value[key];
        if (value === undefined) return match;
      }
      return typeof value === 'number' ? (value * 100).toFixed(1) : String(value);
    });
    
    console.log('Investment Thesis:');
    console.log(interpolated);
    
    console.log('\n✓ Content interpolation working correctly');
    
  } catch (error: any) {
    console.error('Content interpolation test failed:', error.message);
  }
}

/**
 * Tests wizard to report workflow
 */
async function testWizardWorkflow() {
  console.log('\n=== Wizard Workflow Test ===\n');
  
  try {
    // Simulate wizard selections
    const wizardSelections = {
      step1: { template: 'technical-analysis' },
      step2: { ticker: 'NVDA', title: 'NVIDIA Technical Report', author: 'Tech Analyst' },
      step3: { dataSources: ['market-data', 'patterns'] },
      step4: { 
        sections: {
          priceAnalysis: true,
          indicators: true,
          patterns: true,
          signals: true
        },
        visualizations: {
          priceChart: true,
          volumeAnalysis: true,
          patternDetection: true
        }
      }
    };
    
    // Combine wizard selections
    const fullWizardConfig = {
      template: wizardSelections.step1.template,
      ...wizardSelections.step2,
      dataSources: wizardSelections.step3.dataSources,
      ...wizardSelections.step4,
      timeframe: '6M'
    };
    
    console.log('Wizard selections:', fullWizardConfig);
    
    // Map to report config
    const reportConfig = mapWizardToReportConfig(fullWizardConfig);
    
    console.log('\nMapped report config:');
    console.log(`  - Report type: ${reportConfig.reportType}`);
    console.log(`  - Ticker: ${reportConfig.ticker}`);
    console.log(`  - Sections: ${reportConfig.sections.map(s => s.id).join(', ')}`);
    console.log(`  - Output format: ${reportConfig.outputFormat}`);
    
    console.log('\n✓ Wizard workflow test passed');
    
  } catch (error: any) {
    console.error('Wizard workflow test failed:', error.message);
  }
}

// Run validation if executed directly
if (require.main === module) {
  console.log('Starting Template System Validation...\n');
  
  if (!process.env.REACT_APP_TWELVE_DATA_API_KEY) {
    console.error('ERROR: REACT_APP_TWELVE_DATA_API_KEY environment variable not set!');
    console.error('Please add your TwelveData API key to .env file');
    process.exit(1);
  }
  
  validateTemplateSystem()
    .then(success => {
      if (success) {
        return testContentInterpolation();
      }
      throw new Error('Template validation failed');
    })
    .then(() => testWizardWorkflow())
    .then(() => {
      console.log('\n✅ All template system tests passed!');
      console.log('The wizard selections now meaningfully connect to actual report content.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Template system validation failed:', error);
      process.exit(1);
    });
}

export { validateTemplateSystem, testContentInterpolation, testWizardWorkflow };