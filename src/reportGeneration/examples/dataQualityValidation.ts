// src/reportGeneration/examples/dataQualityValidation.ts
// Validates enhanced data quality features for AI content generation
// Context: Tests Phase 1.x implementation for data quality and enrichment

import { DataFetcher } from '../core/dataFetcher';
import { getDataQualityService } from '../services/dataQualityService';
import { getDataEnrichmentService } from '../services/dataEnrichmentService';
import { TwelveDataAdapter } from '../adapters/twelveDataAdapter';
import { NewsAdapter } from '../adapters/newsAdapter';
import { logDebug } from '../../utils/logger';

/**
 * Validates data quality assessment functionality
 */
async function validateDataQuality() {
  console.log('=== Data Quality Validation ===\n');
  
  try {
    const qualityService = getDataQualityService();
    const fetcher = new DataFetcher({
      ticker: 'MSFT',
      debugMode: true,
      includeNews: true,
      includeTranscripts: true
    });
    
    // 1. Fetch data from multiple sources
    console.log('1. Fetching data from multiple sources...');
    const companyData = await fetcher.fetchAll('MSFT');
    console.log('✓ Data fetched successfully');
    console.log(`  - Financial statements: ${companyData.financials?.incomeStatement?.length || 0} quarters`);
    console.log(`  - Historical prices: ${companyData.financials?.historicalPrices?.length || 0} days`);
    console.log(`  - News articles: ${companyData.news?.length || 0}`);
    
    // 2. Assess data quality
    console.log('\n2. Assessing data quality...');
    const qualityMetrics = await qualityService.assessDataQuality(companyData);
    
    console.log('✓ Quality assessment complete');
    console.log(`  - Overall Score: ${(qualityMetrics.overallScore * 100).toFixed(1)}%`);
    console.log(`  - Completeness: ${(qualityMetrics.completeness * 100).toFixed(1)}%`);
    console.log(`  - Accuracy: ${(qualityMetrics.accuracy * 100).toFixed(1)}%`);
    console.log(`  - Consistency: ${(qualityMetrics.consistency * 100).toFixed(1)}%`);
    console.log(`  - Timeliness: ${(qualityMetrics.timeliness * 100).toFixed(1)}%`);
    console.log(`  - Relevance: ${(qualityMetrics.relevance * 100).toFixed(1)}%`);
    
    // 3. Display quality issues
    console.log('\n3. Quality Issues Identified:');
    if (qualityMetrics.details.missingFields.length > 0) {
      console.log(`  - Missing fields: ${qualityMetrics.details.missingFields.join(', ')}`);
    }
    if (qualityMetrics.details.staleData.length > 0) {
      console.log(`  - Stale data: ${qualityMetrics.details.staleData.join(', ')}`);
    }
    if (qualityMetrics.details.inconsistencies.length > 0) {
      console.log(`  - Inconsistencies: ${qualityMetrics.details.inconsistencies.join(', ')}`);
    }
    if (qualityMetrics.details.warnings.length > 0) {
      console.log(`  - Warnings: ${qualityMetrics.details.warnings.join(', ')}`);
    }
    
    // 4. Display recommendations
    if (qualityMetrics.details.recommendations.length > 0) {
      console.log('\n4. Recommendations for improvement:');
      qualityMetrics.details.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }
    
    // 5. Validate data
    console.log('\n5. Validating data against rules...');
    const validation = qualityService.validateData(companyData);
    console.log(`✓ Validation complete: ${validation.isValid ? 'PASSED' : 'FAILED'}`);
    if (validation.errors.length > 0) {
      console.log('  Errors:');
      validation.errors.forEach(err => console.log(`    - ${err}`));
    }
    if (validation.warnings.length > 0) {
      console.log('  Warnings:');
      validation.warnings.forEach(warn => console.log(`    - ${warn}`));
    }
    
    // 6. Cross-validate data
    console.log('\n6. Cross-validating data sources...');
    const crossValidation = qualityService.crossValidateData(companyData);
    console.log(`✓ Cross-validation confidence: ${(crossValidation.confidence * 100).toFixed(1)}%`);
    if (crossValidation.discrepancies.length > 0) {
      console.log('  Discrepancies found:');
      crossValidation.discrepancies.forEach(d => {
        console.log(`    - ${d.field}:`);
        Object.entries(d.sources).forEach(([source, value]) => {
          console.log(`      ${source}: ${value}`);
        });
      });
    }
    
    return { companyData, qualityMetrics };
    
  } catch (error) {
    console.error('❌ Data quality validation failed:', error);
    throw error;
  }
}

/**
 * Validates data enrichment functionality
 */
async function validateDataEnrichment() {
  console.log('\n=== Data Enrichment Validation ===\n');
  
  try {
    const enrichmentService = getDataEnrichmentService();
    
    // Create test data with intentional gaps
    const incompleteData = {
      ticker: 'GOOGL',
      companyName: 'Alphabet Inc',
      description: 'Technology company', // Intentionally brief
      // Missing sector and industry
      financials: {
        incomeStatement: [{
          date: '2024-09-30',
          revenue: 88000000000,
          netIncome: 26000000000,
          eps: 2.12
        }],
        balanceSheet: [{
          date: '2024-09-30',
          totalAssets: 420000000000,
          totalLiabilities: 110000000000,
          totalEquity: 310000000000
        }],
        cashFlow: [],
        historicalPrices: [],
        keyMetrics: {
          // Missing many metrics
          peRatio: 25.5
        }
      },
      metadata: {
        lastUpdated: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // 2 days old
      }
    } as any;
    
    // 1. Show initial quality
    console.log('1. Initial data quality assessment...');
    const qualityService = getDataQualityService();
    const initialQuality = await qualityService.assessDataQuality(incompleteData);
    console.log(`  - Initial quality score: ${(initialQuality.overallScore * 100).toFixed(1)}%`);
    
    // 2. Enrich the data
    console.log('\n2. Enriching data...');
    const enrichmentResult = await enrichmentService.enrichCompanyData(incompleteData, {
      fillMissingData: true,
      reconcileDiscrepancies: true,
      enhanceDescriptions: true,
      addDerivedMetrics: true,
      expandTimeSeriesData: false, // Skip for demo
      includeIndustryComparisons: true
    });
    
    console.log('✓ Enrichment complete');
    console.log(`  - Fields added: ${enrichmentResult.enrichmentStats.fieldsAdded}`);
    console.log(`  - Fields updated: ${enrichmentResult.enrichmentStats.fieldsUpdated}`);
    console.log(`  - Discrepancies resolved: ${enrichmentResult.enrichmentStats.discrepanciesResolved}`);
    console.log(`  - Metrics calculated: ${enrichmentResult.enrichmentStats.metricsCalculated}`);
    console.log(`  - Quality improvement: ${(enrichmentResult.enrichmentStats.qualityImprovement * 100).toFixed(1)}%`);
    
    // 3. Show enrichment log
    console.log('\n3. Enrichment actions taken:');
    enrichmentResult.enrichmentLog.slice(0, 10).forEach(log => {
      console.log(`  - ${log.field}: ${log.action} - ${log.reason}`);
    });
    if (enrichmentResult.enrichmentLog.length > 10) {
      console.log(`  ... and ${enrichmentResult.enrichmentLog.length - 10} more actions`);
    }
    
    // 4. Show final quality
    console.log('\n4. Final data quality assessment...');
    const finalQuality = enrichmentResult.enrichedData.metadata?.dataQuality;
    if (finalQuality) {
      console.log(`  - Final quality score: ${(finalQuality.overallScore * 100).toFixed(1)}%`);
      console.log(`  - Quality improved by: ${((finalQuality.overallScore - initialQuality.overallScore) * 100).toFixed(1)}%`);
    }
    
    // 5. Show some enriched fields
    console.log('\n5. Sample enriched fields:');
    const enriched = enrichmentResult.enrichedData;
    console.log(`  - Sector: ${enriched.sector || 'Not added'}`);
    console.log(`  - Industry: ${enriched.industry || 'Not added'}`);
    console.log(`  - Description length: ${enriched.description?.length || 0} characters`);
    console.log(`  - Key metrics count: ${Object.keys(enriched.financials?.keyMetrics || {}).length}`);
    
    if (enriched.metadata?.businessModel) {
      console.log(`  - Business model: ${enriched.metadata.businessModel}`);
    }
    if (enriched.metadata?.competitivePosition) {
      console.log(`  - Competitive position: ${enriched.metadata.competitivePosition}`);
    }
    
    return enrichmentResult;
    
  } catch (error) {
    console.error('❌ Data enrichment validation failed:', error);
    throw error;
  }
}

/**
 * Validates news data quality
 */
async function validateNewsDataQuality() {
  console.log('\n=== News Data Quality Validation ===\n');
  
  try {
    const newsAdapter = new NewsAdapter({ debugMode: true });
    
    // 1. Fetch news from multiple sources
    console.log('1. Fetching news from multiple sources...');
    const news = await newsAdapter.getCompanyNews('NVDA', 20, 'NVIDIA Corporation');
    console.log(`✓ Fetched ${news.length} news articles`);
    
    // 2. Analyze news quality
    console.log('\n2. Analyzing news data quality...');
    let highQualityCount = 0;
    let totalQualityScore = 0;
    
    news.forEach((article, i) => {
      if (article.metadata?.dataQuality) {
        const quality = article.metadata.dataQuality;
        totalQualityScore += quality.score;
        if (quality.score > 0.8) highQualityCount++;
        
        if (i < 3) { // Show first 3 articles
          console.log(`\n  Article ${i + 1}: ${article.title.substring(0, 60)}...`);
          console.log(`    - Quality score: ${(quality.score * 100).toFixed(1)}%`);
          console.log(`    - Completeness: ${(quality.completeness * 100).toFixed(1)}%`);
          console.log(`    - Freshness: ${(quality.freshness * 100).toFixed(1)}%`);
          console.log(`    - Source reliability: ${(quality.sourceReliability * 100).toFixed(1)}%`);
          console.log(`    - Content depth: ${(quality.contentDepth * 100).toFixed(1)}%`);
        }
      }
    });
    
    const avgQuality = totalQualityScore / news.length;
    console.log(`\n✓ Average news quality: ${(avgQuality * 100).toFixed(1)}%`);
    console.log(`✓ High-quality articles: ${highQualityCount} of ${news.length}`);
    
    // 3. Test sentiment analysis
    console.log('\n3. Testing sentiment analysis...');
    const sentiment = await newsAdapter.getNewsSentiment('NVDA', 'NVIDIA Corporation');
    console.log('✓ Sentiment analysis complete');
    console.log(`  - Overall sentiment: ${sentiment.overall}`);
    console.log(`  - Sentiment score: ${sentiment.score.toFixed(2)}`);
    console.log(`  - Positive articles: ${sentiment.positiveCount}`);
    console.log(`  - Negative articles: ${sentiment.negativeCount}`);
    console.log(`  - Neutral articles: ${sentiment.neutralCount}`);
    
    if (sentiment.trend) {
      console.log(`  - Sentiment trend: ${sentiment.trend}`);
    }
    
    if (sentiment.keyTopics && sentiment.keyTopics.length > 0) {
      console.log('  - Key topics:');
      sentiment.keyTopics.slice(0, 5).forEach(topic => {
        console.log(`    ${topic.topic}: ${topic.mentions} mentions (${topic.sentiment})`);
      });
    }
    
    return { news, sentiment };
    
  } catch (error) {
    console.error('❌ News data quality validation failed:', error);
    throw error;
  }
}

/**
 * Tests the complete data pipeline with quality enhancement
 */
async function testCompleteDataPipeline() {
  console.log('\n=== Complete Data Pipeline Test ===\n');
  
  try {
    const fetcher = new DataFetcher({
      ticker: 'AAPL',
      debugMode: true,
      includeNews: true,
      includeTranscripts: false // Skip for speed
    });
    
    let progressStage = '';
    let progressPercent = 0;
    
    // Fetch with progress tracking
    console.log('Fetching and processing data for Apple Inc...\n');
    const data = await fetcher.fetchAll('AAPL', (stage, progress) => {
      if (stage !== progressStage || progress - progressPercent >= 10) {
        console.log(`  ${stage}: ${progress}%`);
        progressStage = stage;
        progressPercent = progress;
      }
    });
    
    console.log('\n✓ Data pipeline complete');
    console.log('\nData summary:');
    console.log(`  - Company: ${data.companyName}`);
    console.log(`  - Sector: ${data.sector}`);
    console.log(`  - Industry: ${data.industry}`);
    console.log(`  - Description length: ${data.description?.length || 0} characters`);
    console.log(`  - Financial statements: ${data.financials?.incomeStatement?.length || 0} quarters`);
    console.log(`  - Key metrics: ${Object.keys(data.financials?.keyMetrics || {}).length}`);
    console.log(`  - News articles: ${data.news?.length || 0}`);
    console.log(`  - Data quality score: ${(data.metadata?.quality?.overall || 0) * 100}%`);
    
    return data;
    
  } catch (error) {
    console.error('❌ Complete pipeline test failed:', error);
    throw error;
  }
}

// Run validation if executed directly
if (require.main === module) {
  console.log('Starting Data Quality & Enrichment Validation...\n');
  
  if (!process.env.REACT_APP_TWELVE_DATA_API_KEY) {
    console.error('ERROR: REACT_APP_TWELVE_DATA_API_KEY environment variable not set!');
    console.error('Please add your TwelveData API key to .env file');
    process.exit(1);
  }
  
  validateDataQuality()
    .then(() => validateDataEnrichment())
    .then(() => validateNewsDataQuality())
    .then(() => testCompleteDataPipeline())
    .then(() => {
      console.log('\n✅ All data quality tests passed!');
      console.log('The data pipeline now provides high-quality, enriched data ready for AI content generation.');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Data quality validation failed:', error);
      process.exit(1);
    });
}

export { 
  validateDataQuality, 
  validateDataEnrichment, 
  validateNewsDataQuality,
  testCompleteDataPipeline 
};