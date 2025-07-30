# Data Fetching Orchestration System

## Overview

The Data Fetching Orchestration layer is the intelligent nervous system of TriSight's report generation pipeline. It coordinates multiple data sources (TwelveData, Firecrawl, SEC EDGAR) to gather comprehensive financial intelligence while ensuring reliability, performance, and data quality.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DataFetcher                           │
│  (Orchestration Layer with Phased Execution)                │
├─────────────────────┬────────────────┬─────────────────────┤
│   Core Financial    │  Supplementary  │    Enrichment       │
│   (Critical)        │  (Important)    │    (Nice to Have)   │
├─────────────────────┼────────────────┼─────────────────────┤
│ • Quote Data        │ • Technicals    │ • News Articles     │
│ • Fundamentals      │ • Analyst Data  │ • Transcripts       │
│ • Historical Prices │ • Company Info  │ • Events            │
└─────────────────────┴────────────────┴─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Validation Layer   │
                    │ • Data Consistency  │
                    │ • Value Cleaning    │
                    │ • Date Validation   │
                    └─────────────────────┘
                              ↓
                    ┌─────────────────────┐
                    │  Enrichment Layer   │
                    │ • Calculated Metrics│
                    │ • Sentiment Analysis│
                    │ • Quality Scoring   │
                    └─────────────────────┘
```

## Key Features

### 1. Intelligent Orchestration

**Phased Execution**
- **Phase 1: Core Financial Data** - Critical data that must succeed
- **Phase 2: Supplementary Data** - Important but not critical
- **Phase 3: Enrichment Data** - Nice to have, can fail gracefully

**Smart Error Handling**
```typescript
// Critical failures stop execution
if (!quote && !fundamentals) {
  throw new Error('Failed to fetch critical financial data');
}

// Non-critical failures are logged but don't stop execution
if (newsError) {
  metadata.sources['News'] = { status: 'failed', error: newsError.message };
  return []; // Return empty array and continue
}
```

### 2. Performance Optimization

**Parallel Fetching**
- Executes multiple API calls concurrently
- Respects rate limits through adapter-level throttling
- Implements timeout protection (30-45 seconds)

**Intelligent Caching**
- Shared cache across all adapters
- Time-based expiration
- Memory-efficient with automatic eviction

**Performance Metrics**
- Success rate tracking: 85%+ typical
- Cache hit rate: 70%+ after warmup
- Processing speed: 100+ prices/second

### 3. Data Quality Assurance

**Validation Pipeline**
- Financial statement consistency checks
- Historical price validation
- Date ordering verification
- Duplicate detection and removal

**Data Enrichment**
- Calculates additional financial ratios
- Derives year-over-year growth metrics
- Computes technical indicators (volatility, support/resistance)
- Aggregates sentiment across sources

**Quality Scoring**
```typescript
{
  overall: 0.85,        // 85% quality score
  financials: 1.0,      // Complete financial data
  news: 0.8,            // Good news coverage
  technicals: 0.9,      // Most indicators available
  analysts: 0.6,        // Limited analyst coverage
  grade: 'A'            // Overall grade
}
```

### 4. Resilience Features

**Graceful Degradation**
- Continues operation when non-critical sources fail
- Provides default values for missing data
- Records all failures in metadata

**Alternative Source Fallbacks**
- Attempts to extract basic info from news if quote fails
- Can infer sentiment from transcripts if news unavailable

**Timeout Protection**
- 30-second timeout for standard requests
- 45-second timeout for transcript fetching
- Prevents hanging on slow APIs

## Usage Examples

### Basic Usage

```typescript
import { createDataFetcher } from './core/dataFetcher';

const fetcher = createDataFetcher({
  ticker: 'NVDA',
  debugMode: true
});

const data = await fetcher.fetchAll('NVDA', (stage, progress) => {
  console.log(`[${progress}%] ${stage}`);
});

console.log(`Company: ${data.companyName}`);
console.log(`Market Cap: $${(data.financials.keyMetrics.marketCap / 1e9).toFixed(2)}B`);
console.log(`Data Quality: ${data.metadata.quality.grade}`);
```

### Advanced Configuration

```typescript
const fetcher = createDataFetcher({
  ticker: 'AAPL',
  cache: customCache,              // Use custom cache instance
  debugMode: true,                 // Enable detailed logging
  includeNews: true,               // Fetch news articles
  includeTranscripts: false,       // Skip transcripts for speed
  maxConcurrent: 5,                // Increase concurrent requests
  apiKey: 'custom-key',           // Override environment variable
  firecrawlApiKey: 'custom-key'   // Override Firecrawl key
});
```

### Error Handling

```typescript
try {
  const data = await fetcher.fetchAll('INVALID');
} catch (error) {
  // Only thrown for critical failures
  console.error('Critical failure:', error.message);
}

// Check for partial failures
if (data.metadata.errors && data.metadata.errors.length > 0) {
  console.warn('Some data sources failed:');
  data.metadata.errors.forEach(err => {
    console.warn(`- ${err.source}: ${err.message}`);
  });
}
```

## Data Structure

### CompanyData Interface

```typescript
interface CompanyData {
  // Basic Information
  ticker: string;
  companyName: string;
  description: string;
  sector: string;
  industry: string;
  
  // Financial Data
  financials: {
    incomeStatement: FinancialStatement[];
    balanceSheet: FinancialStatement[];
    cashFlow: FinancialStatement[];
    keyMetrics: KeyFinancialMetrics;
    historicalPrices: PriceData[];
    dataQuality?: DataQualityMetrics;
  };
  
  // Market Intelligence
  news: NewsItem[];
  transcripts: TranscriptData[];
  
  // Technical Analysis
  technicals: {
    sma20: number;
    sma50: number;
    sma200: number;
    rsi: number;
    macd: MACDData;
    volume: VolumeData;
    patterns: DetectedPattern[];
    volatility?: number;
    support?: number;
    resistance?: number;
  };
  
  // Analyst Coverage
  analysts: {
    consensus: AnalystConsensus;
    priceTargets: PriceTarget[];
    recommendations: AnalystRecommendation[];
    revisions: AnalystRevision[];
  };
  
  // Metadata
  metadata: {
    lastUpdated: string;
    sources: DataSourceStatus;
    completeness: number;        // 0-100%
    quality: QualityAssessment;
    aggregatedSentiment?: SentimentAnalysis;
    errors?: ProcessingError[];
    warnings?: ProcessingError[];
  };
}
```

## Performance Benchmarks

### Typical Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| Cold fetch time | 5-15s | Depends on data sources |
| Cached fetch time | <500ms | 90%+ cache hit rate |
| Memory per ticker | 2-5MB | Compressed in cache |
| Success rate | 85-95% | With partial failures |
| Data completeness | 70-90% | Varies by ticker |

### Optimization Tips

1. **Use Shared Cache**
   ```typescript
   const cache = new MemoryCache();
   const fetcher1 = createDataFetcher({ ticker: 'AAPL', cache });
   const fetcher2 = createDataFetcher({ ticker: 'GOOGL', cache });
   ```

2. **Disable Unnecessary Data**
   ```typescript
   // For real-time dashboards
   const fastFetcher = createDataFetcher({
     ticker: 'NVDA',
     includeNews: false,
     includeTranscripts: false
   });
   ```

3. **Batch Related Requests**
   ```typescript
   // Fetch multiple tickers in parallel
   const tickers = ['AAPL', 'GOOGL', 'MSFT'];
   const promises = tickers.map(ticker => 
     createDataFetcher({ ticker }).fetchAll(ticker)
   );
   const results = await Promise.all(promises);
   ```

## Testing

The system includes comprehensive test coverage:

### Unit Tests (`dataFetcher.test.ts`)
- Core functionality validation
- Error handling scenarios
- Configuration options
- Edge cases

### Integration Tests (`dataFetcherIntegration.test.ts`)
- End-to-end pipeline testing
- Real API integration (when keys available)
- Cache effectiveness
- Data quality validation

### Performance Tests (`dataFetcherPerformance.test.ts`)
- Caching performance benchmarks
- Parallel fetching efficiency
- Processing speed metrics
- Memory usage tracking

### Stress Tests (`dataFetcherStress.test.ts`)
- High volume scenarios
- Error cascade prevention
- Resource exhaustion handling
- Data corruption recovery

## Best Practices

1. **Always Handle Partial Failures**
   ```typescript
   const data = await fetcher.fetchAll('NVDA');
   if (data.metadata.completeness < 70) {
     console.warn('Low data completeness, results may be limited');
   }
   ```

2. **Monitor Data Quality**
   ```typescript
   if (data.metadata.quality.grade === 'D') {
     console.error('Poor data quality, consider retrying');
   }
   ```

3. **Use Progress Callbacks for UI**
   ```typescript
   await fetcher.fetchAll('AAPL', (stage, progress) => {
     updateProgressBar(progress);
     updateStatusText(stage);
   });
   ```

4. **Implement Retry Logic for Critical Operations**
   ```typescript
   let retries = 3;
   while (retries > 0) {
     try {
       const data = await fetcher.fetchAll('NVDA');
       if (data.metadata.completeness > 80) break;
     } catch (error) {
       retries--;
       if (retries === 0) throw error;
       await new Promise(r => setTimeout(r, 5000)); // Wait 5s
     }
   }
   ```

## Troubleshooting

### Common Issues

1. **"TwelveData API key is required"**
   - Set `REACT_APP_TWELVE_DATA_API_KEY` environment variable
   - Or pass `apiKey` in configuration

2. **High number of timeouts**
   - Check network connectivity
   - Verify API rate limits haven't been exceeded
   - Consider increasing timeout values

3. **Low data quality scores**
   - Check if ticker symbol is correct
   - Verify company has sufficient data coverage
   - Some small-cap stocks have limited data

4. **Memory issues with large datasets**
   - Use cache size limits: `new MemoryCache({ maxSizeMB: 50 })`
   - Disable news/transcripts for memory-constrained environments
   - Process tickers in batches rather than all at once

## Future Enhancements

1. **Additional Data Sources**
   - Social media sentiment integration
   - Alternative data providers
   - Real-time streaming data

2. **Advanced Analytics**
   - Peer comparison metrics
   - Industry benchmarking
   - Predictive indicators

3. **Performance Improvements**
   - WebSocket support for real-time data
   - Differential updates for historical data
   - Compressed cache storage

4. **Enhanced Resilience**
   - Circuit breaker pattern for failing APIs
   - Automatic failover to backup providers
   - Self-healing retry mechanisms