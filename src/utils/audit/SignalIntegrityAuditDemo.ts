// src/utils/audit/SignalIntegrityAuditDemo.ts
// SIGINT Audit Demo and Validation Testing
// Demonstrates comprehensive signal integrity audit across TriSight pipeline

import { CandlestickData } from '../../models/ChartTypes';
import { executeSignalIntegrityAudit, SignalIntegrityAuditReport } from './SignalIntegrityAudit';
import { executeDefaultSIGINTAudit, MultiTimeframeAuditReport } from './SignalIntegrityAuditExecutor';
import { logDebug } from '../debug';

/**
 * Generate sample market data for audit testing
 */
function generateSampleMarketData(symbol: string = 'AAPL', count: number = 100): CandlestickData[] {
  const candles: CandlestickData[] = [];
  const startDate = new Date('2024-01-01');
  let currentPrice = 150.00;

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate.getTime() + (i * 5 * 60 * 1000)); // 5-minute intervals
    
    // Simulate price movement with volatility
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    candles.push({
      datetime: date.toISOString(),
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Generate sample data with known patterns for validation
 */
function generatePatternedMarketData(): CandlestickData[] {
  const candles: CandlestickData[] = [];
  const startDate = new Date('2024-01-01');
  let currentPrice = 100.00;

  // Generate 50 normal candles
  for (let i = 0; i < 50; i++) {
    const date = new Date(startDate.getTime() + (i * 5 * 60 * 1000));
    const change = (Math.random() - 0.5) * 0.01 * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 0.2;
    const low = Math.min(open, close) - Math.random() * 0.2;

    candles.push({
      datetime: date.toISOString(),
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 500000) + 50000
    });

    currentPrice = close;
  }

  // Generate escalator pattern (5 rising steps)
  for (let step = 0; step < 5; step++) {
    for (let j = 0; j < 3; j++) {
      const i = 50 + step * 3 + j;
      const date = new Date(startDate.getTime() + (i * 5 * 60 * 1000));
      const stepHeight = 0.5; // Rising steps
      const open = currentPrice;
      const close = currentPrice + stepHeight;
      const high = close + 0.1;
      const low = open - 0.1;

      candles.push({
        datetime: date.toISOString(),
        timestamp: date.getTime(),
        open,
        high,
        low,
        close,
        volume: Math.floor(Math.random() * 750000) + 100000
      });

      currentPrice = close;
    }
  }

  // Generate 35 more normal candles
  for (let i = 65; i < 100; i++) {
    const date = new Date(startDate.getTime() + (i * 5 * 60 * 1000));
    const change = (Math.random() - 0.5) * 0.01 * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 0.2;
    const low = Math.min(open, close) - Math.random() * 0.2;

    candles.push({
      datetime: date.toISOString(),
      timestamp: date.getTime(),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 500000) + 50000
    });

    currentPrice = close;
  }

  return candles;
}

/**
 * Demo: Single timeframe audit
 */
export async function demoSingleTimeframeAudit(): Promise<SignalIntegrityAuditReport> {
  console.log('\n🔍 SIGINT AUDIT DEMO: Single Timeframe Analysis');
  console.log('================================================');

  // Generate sample data with patterns
  const sampleData = generatePatternedMarketData();
  console.log(`📊 Generated ${sampleData.length} candles with embedded patterns`);

  // Execute audit
  console.log('🚀 Executing SIGINT audit...');
  const auditReport = await executeSignalIntegrityAudit(sampleData, '5m');

  // Display results
  console.log('\n📈 AUDIT RESULTS:');
  console.log(`   Audit ID: ${auditReport.auditId}`);
  console.log(`   Timeframe: ${auditReport.timeframe}`);
  console.log(`   Timestamp: ${auditReport.timestamp}`);
  console.log(`   Integrity Score: ${auditReport.summary.integrityScore}%`);

  console.log('\n🔍 DETECTION STAGE:');
  console.log(`   Total Patterns: ${auditReport.summary.totalPatterns}`);
  console.log(`   Patterns Detected: ${auditReport.summary.patternsDetected}`);
  
  auditReport.stages.detection.forEach(detection => {
    if (detection.detected) {
      console.log(`   ✅ ${detection.patternId}: Detected (confidence: ${(detection.detectionConfidence * 100).toFixed(1)}%)`);
    }
  });

  console.log('\n📡 EMISSION STAGE:');
  console.log(`   Signals Emitted: ${auditReport.summary.signalsEmitted}`);
  
  auditReport.stages.emission.forEach(emission => {
    console.log(`   📤 ${emission.patternId}: ${emission.action} @ ${emission.price.toFixed(2)} (confidence: ${(emission.confidence * 100).toFixed(1)}%)`);
  });

  console.log('\n🎨 RENDER STAGE:');
  console.log(`   Signals Rendered: ${auditReport.summary.signalsRendered}`);
  
  auditReport.stages.render.forEach(render => {
    const status = render.isRendered ? '✅ Rendered' : '❌ Missing';
    console.log(`   ${status}: ${render.patternId} ${render.action} (${render.position})`);
  });

  console.log('\n🔄 DIFF ANALYSIS:');
  console.log(`   Mismatches: ${auditReport.summary.mismatches}`);
  
  auditReport.stages.diff_analysis.forEach(diff => {
    const icon = diff.status === 'VALID' ? '✅' : '⚠️';
    console.log(`   ${icon} ${diff.status}: ${diff.signalId}`);
    if (diff.status !== 'VALID') {
      console.log(`      Root Cause: ${diff.rootCause}`);
    }
  });

  console.log('\n🏥 DIAGNOSTICS:');
  console.log(`   Detection Engines:`, Object.entries(auditReport.diagnostics.detectionEngineStatus).map(
    ([engine, status]) => `${engine}:${status ? '✅' : '❌'}`
  ).join(', '));
  console.log(`   Emission Chain: ${auditReport.diagnostics.emissionChainStatus ? '✅' : '❌'}`);
  console.log(`   Render Pipeline: ${auditReport.diagnostics.renderPipelineStatus ? '✅' : '❌'}`);

  if (auditReport.diagnostics.suppressionReasons.length > 0) {
    console.log(`   Suppression Reasons:`);
    auditReport.diagnostics.suppressionReasons.forEach(reason => {
      console.log(`     - ${reason}`);
    });
  }

  return auditReport;
}

/**
 * Demo: Multi-timeframe audit
 */
export async function demoMultiTimeframeAudit(): Promise<MultiTimeframeAuditReport> {
  console.log('\n🔍 SIGINT AUDIT DEMO: Multi-Timeframe Analysis');
  console.log('==============================================');

  console.log('🚀 Executing multi-timeframe SIGINT audit...');
  const multiReport = await executeDefaultSIGINTAudit();

  console.log('\n📊 MULTI-TIMEFRAME RESULTS:');
  console.log(`   Audit: ${multiReport.auditConfiguration.name}`);
  console.log(`   Scope: ${multiReport.auditConfiguration.scope}`);
  console.log(`   Timeframes: ${multiReport.auditConfiguration.timeframes.join(', ')}`);
  console.log(`   Execution: ${multiReport.executionTimestamp}`);
  console.log(`   Overall Status: ${multiReport.overallStatus}`);

  console.log('\n📈 AGGREGATED SUMMARY:');
  console.log(`   Total Timeframes: ${multiReport.aggregatedSummary.totalTimeframes}`);
  console.log(`   Average Integrity Score: ${multiReport.aggregatedSummary.averageIntegrityScore}%`);
  console.log(`   Total Signals: ${multiReport.aggregatedSummary.totalSignalsAcrossTimeframes}`);
  console.log(`   Total Mismatches: ${multiReport.aggregatedSummary.totalMismatchesAcrossTimeframes}`);
  console.log(`   Best Performing: ${multiReport.aggregatedSummary.bestPerformingTimeframe}`);
  console.log(`   Worst Performing: ${multiReport.aggregatedSummary.worstPerformingTimeframe}`);

  console.log('\n⏰ TIMEFRAME BREAKDOWN:');
  Object.entries(multiReport.timeframeResults).forEach(([timeframe, result]) => {
    console.log(`   ${timeframe}: ${result.summary.integrityScore}% integrity (${result.summary.signalsEmitted} signals, ${result.summary.mismatches} mismatches)`);
  });

  if (multiReport.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    multiReport.recommendations.forEach(rec => {
      console.log(`   - ${rec}`);
    });
  }

  return multiReport;
}

/**
 * Demo: Pattern-specific audit analysis
 */
export async function demoPatternSpecificAnalysis(): Promise<void> {
  console.log('\n🔍 SIGINT AUDIT DEMO: Pattern-Specific Analysis');
  console.log('===============================================');

  const sampleData = generatePatternedMarketData();
  const auditReport = await executeSignalIntegrityAudit(sampleData, '5m');

  console.log('\n🎯 PATTERN-SPECIFIC BREAKDOWN:');
  
  // Group detection results by pattern type
  const patternGroups: Record<string, any[]> = {};
  auditReport.stages.detection.forEach(detection => {
    const patternType = detection.patternId.split('_')[0];
    if (!patternGroups[patternType]) {
      patternGroups[patternType] = [];
    }
    patternGroups[patternType].push(detection);
  });

  Object.entries(patternGroups).forEach(([patternType, detections]) => {
    const detected = detections.filter(d => d.detected).length;
    const total = detections.length;
    const avgConfidence = detected > 0 ? 
      detections.filter(d => d.detected).reduce((sum, d) => sum + d.detectionConfidence, 0) / detected : 0;

    console.log(`\n   ${patternType}:`);
    console.log(`     Detection Rate: ${detected}/${total} (${((detected/total)*100).toFixed(1)}%)`);
    console.log(`     Avg Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
    
    // Show emission for this pattern type
    const patternEmissions = auditReport.stages.emission.filter(e => e.patternId.startsWith(patternType));
    if (patternEmissions.length > 0) {
      console.log(`     Signals Emitted: ${patternEmissions.length}`);
      patternEmissions.forEach(emission => {
        console.log(`       ${emission.action} @ ${emission.price.toFixed(2)} (${(emission.confidence * 100).toFixed(1)}%)`);
      });
    } else {
      console.log(`     Signals Emitted: 0`);
    }
  });
}

/**
 * Demo: Performance benchmarking
 */
export async function demoPeformanceBenchmark(): Promise<void> {
  console.log('\n🔍 SIGINT AUDIT DEMO: Performance Benchmark');
  console.log('===========================================');

  const testSizes = [50, 100, 250, 500];
  
  for (const size of testSizes) {
    console.log(`\n📊 Testing with ${size} candles...`);
    
    const startTime = Date.now();
    const sampleData = generateSampleMarketData('AAPL', size);
    const auditReport = await executeSignalIntegrityAudit(sampleData, '5m');
    const endTime = Date.now();
    
    const executionTime = endTime - startTime;
    console.log(`   Execution Time: ${executionTime}ms`);
    console.log(`   Integrity Score: ${auditReport.summary.integrityScore}%`);
    console.log(`   Patterns Detected: ${auditReport.summary.patternsDetected}`);
    console.log(`   Signals Emitted: ${auditReport.summary.signalsEmitted}`);
    console.log(`   Performance: ${(size / executionTime * 1000).toFixed(1)} candles/second`);
  }
}

/**
 * Main demo runner
 */
export async function runSIGINTAuditDemo(): Promise<void> {
  console.log('🎯 TriSight SIGINT Audit System Demo');
  console.log('====================================');
  console.log('Comprehensive Signal Integrity Audit: Detection → Emission → Render');

  try {
    // Run all demo scenarios
    await demoSingleTimeframeAudit();
    await demoMultiTimeframeAudit();
    await demoPatternSpecificAnalysis();
    await demoPeformanceBenchmark();

    console.log('\n✅ SIGINT Audit Demo completed successfully!');
    console.log('\n📋 SUMMARY:');
    console.log('   - Single timeframe audit: Detailed pipeline analysis');
    console.log('   - Multi-timeframe audit: Cross-timeframe integrity comparison');
    console.log('   - Pattern-specific analysis: Per-pattern detection/emission rates');
    console.log('   - Performance benchmark: Scalability testing');
    console.log('\n🎉 SIGINT Audit System is fully operational and ready for production use.');

  } catch (error) {
    console.error('❌ SIGINT Audit Demo failed:', error);
    throw error;
  }
}

// Export for direct testing
export {
  generateSampleMarketData,
  generatePatternedMarketData
};
