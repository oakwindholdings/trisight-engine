// src/utils/audit/SignalIntegrityAudit.ts
// Comprehensive Signal Integrity Audit System for TriSight
// Traces pattern detection → signal emission → chart rendering pipeline

import { CandlestickData } from '../../models/ChartTypes';
import { PatternEvent } from '../../hooks/usePatternBus';
import { TradeActionSignal, TradeAction } from '../trading/TradeActionSignal';
import { getTradeActionSignals } from '../../framework/tradeActionEmitter';
import { detectEscalators, detectRocketman, detectPivots, detectGoldmineChannel, detectGoldenCandle, detectBreakoutBoxes } from '../../patternEngine';
import { convertToHeikinAshi } from '../candleTransform';
import { logDebug } from '../debug';

// Audit Stage Interfaces
export interface DetectionAuditResult {
  patternId: string;
  matchStartDatetime: string;
  matchEndDatetime: string;
  detectionConfidence: number;
  detected: boolean;
  engineInvoked: boolean;
}

export interface EmissionAuditResult {
  signalType: string;
  patternId: string;
  action: string;
  price: number;
  candleIndex: number;
  confidence: number;
  emitted: boolean;
  timestamp: string;
}

export interface RenderAuditResult {
  patternId: string;
  action: string;
  isRendered: boolean;
  position: 'topOfCandle' | 'bottomOfCandle' | 'unknown';
  labelVisible: boolean;
  signalId: string;
}

export interface DiffAnalysisResult {
  signalId: string;
  status: 'MISSING_FROM_RENDER' | 'DUPLICATE_RENDER' | 'SUPPRESSED_BY_VIEWPORT' | 'DEBOUNCED' | 'VALID';
  rootCause: string;
  timestamp: string;
}

export interface SignalIntegrityAuditReport {
  auditId: string;
  auditName: string;
  scope: string;
  timeframe: string;
  timestamp: string;
  stages: {
    detection: DetectionAuditResult[];
    emission: EmissionAuditResult[];
    render: RenderAuditResult[];
    diff_analysis: DiffAnalysisResult[];
  };
  summary: {
    totalPatterns: number;
    patternsDetected: number;
    signalsEmitted: number;
    signalsRendered: number;
    mismatches: number;
    integrityScore: number; // 0-100%
  };
  diagnostics: {
    detectionEngineStatus: Record<string, boolean>;
    emissionChainStatus: boolean;
    renderPipelineStatus: boolean;
    suppressionReasons: string[];
  };
}

/**
 * Comprehensive Signal Integrity Audit Class
 * Implements SIGINT audit specification for TriSight pattern detection pipeline
 */
export class SignalIntegrityAudit {
  private auditId: string;
  private timeframe: string;
  private candles: CandlestickData[];
  private patternEvents: PatternEvent[] = [];
  private emittedSignals: TradeActionSignal[] = [];
  private renderedSignals: RenderAuditResult[] = [];

  constructor(candles: CandlestickData[], timeframe: string = '5m') {
    this.auditId = `sigint_${Date.now()}`;
    this.timeframe = timeframe;
    this.candles = candles;
  }

  /**
   * Execute complete SIGINT audit across all 4 stages
   */
  public async executeFullAudit(): Promise<SignalIntegrityAuditReport> {
    logDebug('DEBUG_SIGINT_AUDIT', '[SIGINT] Starting comprehensive signal integrity audit', {
      auditId: this.auditId,
      timeframe: this.timeframe,
      candleCount: this.candles.length
    });

    // Stage 1: DETECTION - Verify pattern engines detect matching windows
    const detectionResults = await this.auditDetectionStage();
    
    // Stage 2: EMISSION - Ensure patterns emit TradeActionSignals
    const emissionResults = await this.auditEmissionStage();
    
    // Stage 3: RENDER - Compare emitted signals with rendered labels
    const renderResults = await this.auditRenderStage();
    
    // Stage 4: DIFF_ANALYSIS - Highlight mismatches and suppressions
    const diffResults = await this.auditDiffAnalysis(emissionResults, renderResults);

    // Generate comprehensive report
    const report = this.generateAuditReport(detectionResults, emissionResults, renderResults, diffResults);
    
    logDebug('DEBUG_SIGINT_AUDIT', '[SIGINT] Audit complete', {
      integrityScore: report.summary.integrityScore,
      mismatches: report.summary.mismatches,
      totalSignals: report.summary.signalsEmitted
    });

    return report;
  }

  /**
   * STAGE 1: DETECTION - Verify pattern detection engines
   */
  private async auditDetectionStage(): Promise<DetectionAuditResult[]> {
    const results: DetectionAuditResult[] = [];
    const haCandles = convertToHeikinAshi(this.candles);

    // Define all pattern detection engines
    const detectionEngines = [
      { name: 'ESCALATOR', detector: detectEscalators },
      { name: 'ROCKETMAN', detector: detectRocketman },
      { name: 'PIVOT', detector: detectPivots },
      { name: 'GOLDMINE_CHANNEL', detector: detectGoldmineChannel },
      { name: 'GOLDEN_CANDLE', detector: detectGoldenCandle },
      { name: 'BREAKOUT_BOX', detector: detectBreakoutBoxes }
    ];

    for (const engine of detectionEngines) {
      try {
        logDebug('DEBUG_SIGINT_AUDIT', `[DETECTION] Testing engine: ${engine.name}`);
        
        // Invoke detection engine
        const detectedPatterns = engine.detector(haCandles);
        const engineInvoked = true;
        const detected = Array.isArray(detectedPatterns) && detectedPatterns.length > 0;

        // Process each detected pattern
        if (detected && detectedPatterns.length > 0) {
          detectedPatterns.forEach((pattern: any, index: number) => {
            const startTime = pattern.startTime || pattern.datetime || haCandles[0]?.datetime;
            const endTime = pattern.endTime || pattern.datetime || haCandles[haCandles.length - 1]?.datetime;
            
            results.push({
              patternId: `${engine.name}_${index}`,
              matchStartDatetime: new Date(startTime).toISOString(),
              matchEndDatetime: new Date(endTime).toISOString(),
              detectionConfidence: pattern.confidence || pattern.strengthScore || 0.5,
              detected: true,
              engineInvoked
            });
          });
        } else {
          // No patterns detected by this engine
          results.push({
            patternId: `${engine.name}_NONE`,
            matchStartDatetime: new Date(haCandles[0]?.datetime || Date.now()).toISOString(),
            matchEndDatetime: new Date(haCandles[haCandles.length - 1]?.datetime || Date.now()).toISOString(),
            detectionConfidence: 0,
            detected: false,
            engineInvoked
          });
        }

      } catch (error) {
        logDebug('DEBUG_SIGINT_AUDIT', `[DETECTION] Engine ${engine.name} failed:`, error);
        
        results.push({
          patternId: `${engine.name}_ERROR`,
          matchStartDatetime: new Date().toISOString(),
          matchEndDatetime: new Date().toISOString(),
          detectionConfidence: 0,
          detected: false,
          engineInvoked: false
        });
      }
    }

    return results;
  }

  /**
   * STAGE 2: EMISSION - Ensure patterns emit TradeActionSignals
   */
  private async auditEmissionStage(): Promise<EmissionAuditResult[]> {
    const results: EmissionAuditResult[] = [];
    
    // Get all emitted signals from TradeActionBus
    this.emittedSignals = [...getTradeActionSignals()];
    
    logDebug('DEBUG_SIGINT_AUDIT', '[EMISSION] Auditing signal emission', {
      totalSignals: this.emittedSignals.length
    });

    this.emittedSignals.forEach((signal, index) => {
      // Find corresponding candle index
      const candleIndex = this.findCandleIndexByTimestamp(signal.timestamp);
      
      results.push({
        signalType: signal.signalType,
        patternId: signal.pattern,
        action: signal.action,
        price: signal.price,
        candleIndex,
        confidence: signal.confidence,
        emitted: true,
        timestamp: signal.timestamp.toISOString()
      });
    });

    return results;
  }

  /**
   * STAGE 3: RENDER - Compare emitted signals with rendered labels
   */
  private async auditRenderStage(): Promise<RenderAuditResult[]> {
    const results: RenderAuditResult[] = [];
    
    // Simulate rendered signal detection (in real implementation, this would inspect canvas)
    // For now, we assume all emitted signals are rendered
    this.emittedSignals.forEach((signal, index) => {
      const signalId = `${signal.pattern}_${signal.timestamp.getTime()}_${signal.price}`;
      
      results.push({
        patternId: signal.pattern,
        action: signal.action,
        isRendered: true, // TODO: Implement actual canvas inspection
        position: this.determineSignalPosition(signal),
        labelVisible: true, // TODO: Implement visibility detection
        signalId
      });
    });

    this.renderedSignals = results;
    return results;
  }

  /**
   * STAGE 4: DIFF_ANALYSIS - Highlight mismatches between emission and rendering
   */
  private async auditDiffAnalysis(
    emissionResults: EmissionAuditResult[],
    renderResults: RenderAuditResult[]
  ): Promise<DiffAnalysisResult[]> {
    const results: DiffAnalysisResult[] = [];
    
    // Create maps for efficient lookup
    const emissionMap = new Map<string, EmissionAuditResult>();
    const renderMap = new Map<string, RenderAuditResult>();
    
    emissionResults.forEach(emission => {
      const key = `${emission.patternId}_${emission.timestamp}_${emission.price}`;
      emissionMap.set(key, emission);
    });
    
    renderResults.forEach(render => {
      renderMap.set(render.signalId, render);
    });

    // Check for missing renders
    emissionMap.forEach((emission, key) => {
      const renderKey = `${emission.patternId}_${emission.timestamp}_${emission.price}`;
      const render = renderMap.get(renderKey);
      
      if (!render) {
        results.push({
          signalId: renderKey,
          status: 'MISSING_FROM_RENDER',
          rootCause: 'Signal emitted but not found in render pipeline',
          timestamp: emission.timestamp
        });
      } else if (!render.isRendered) {
        results.push({
          signalId: renderKey,
          status: 'SUPPRESSED_BY_VIEWPORT',
          rootCause: 'Signal exists but not visible in viewport',
          timestamp: emission.timestamp
        });
      } else {
        results.push({
          signalId: renderKey,
          status: 'VALID',
          rootCause: 'Signal properly emitted and rendered',
          timestamp: emission.timestamp
        });
      }
    });

    // Check for duplicate renders
    const renderCounts = new Map<string, number>();
    renderResults.forEach(render => {
      const key = `${render.patternId}_${render.action}`;
      renderCounts.set(key, (renderCounts.get(key) || 0) + 1);
    });

    renderCounts.forEach((count, key) => {
      if (count > 1) {
        results.push({
          signalId: `${key}_DUPLICATE`,
          status: 'DUPLICATE_RENDER',
          rootCause: `Multiple renders detected for same pattern/action: ${count} instances`,
          timestamp: new Date().toISOString()
        });
      }
    });

    return results;
  }

  /**
   * Generate comprehensive audit report
   */
  private generateAuditReport(
    detectionResults: DetectionAuditResult[],
    emissionResults: EmissionAuditResult[],
    renderResults: RenderAuditResult[],
    diffResults: DiffAnalysisResult[]
  ): SignalIntegrityAuditReport {
    const totalPatterns = detectionResults.length;
    const patternsDetected = detectionResults.filter(r => r.detected).length;
    const signalsEmitted = emissionResults.length;
    const signalsRendered = renderResults.filter(r => r.isRendered).length;
    const mismatches = diffResults.filter(r => r.status !== 'VALID').length;
    
    // Calculate integrity score (0-100%)
    const maxPossibleScore = signalsEmitted;
    const actualValidSignals = diffResults.filter(r => r.status === 'VALID').length;
    const integrityScore = maxPossibleScore > 0 ? Math.round((actualValidSignals / maxPossibleScore) * 100) : 100;

    return {
      auditId: this.auditId,
      auditName: "SIGINT Audit: Detection → Emission → Render",
      scope: "ALL_PATTERNS",
      timeframe: this.timeframe,
      timestamp: new Date().toISOString(),
      stages: {
        detection: detectionResults,
        emission: emissionResults,
        render: renderResults,
        diff_analysis: diffResults
      },
      summary: {
        totalPatterns,
        patternsDetected,
        signalsEmitted,
        signalsRendered,
        mismatches,
        integrityScore
      },
      diagnostics: {
        detectionEngineStatus: this.getDetectionEngineStatus(detectionResults),
        emissionChainStatus: signalsEmitted > 0,
        renderPipelineStatus: signalsRendered > 0,
        suppressionReasons: this.getSuppressionReasons(diffResults)
      }
    };
  }

  /**
   * Helper methods
   */
  private findCandleIndexByTimestamp(timestamp: Date): number {
    if (!this.candles?.length) return -1;
    
    const targetTime = new Date(timestamp).getTime();
    return this.candles.findIndex(candle => {
      const candleTime = new Date(candle.datetime).getTime();
      return Math.abs(candleTime - targetTime) < 60000; // 1 minute tolerance
    });
  }

  private determineSignalPosition(signal: TradeActionSignal): 'topOfCandle' | 'bottomOfCandle' | 'unknown' {
    // BUY/COVER signals typically render above candle, SELL/SHORT below
    if (signal.action === TradeAction.BUY || signal.action === TradeAction.COVER) {
      return 'topOfCandle';
    } else if (signal.action === TradeAction.SELL || signal.action === TradeAction.SHORT) {
      return 'bottomOfCandle';
    }
    return 'unknown';
  }

  private getDetectionEngineStatus(detectionResults: DetectionAuditResult[]): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    detectionResults.forEach(result => {
      const engineName = result.patternId.split('_')[0];
      status[engineName] = result.engineInvoked;
    });
    return status;
  }

  private getSuppressionReasons(diffResults: DiffAnalysisResult[]): string[] {
    return diffResults
      .filter(r => r.status !== 'VALID')
      .map(r => r.rootCause);
  }
}

/**
 * Factory function to execute SIGINT audit with specified parameters
 */
export async function executeSignalIntegrityAudit(
  candles: CandlestickData[],
  timeframe: string = '5m'
): Promise<SignalIntegrityAuditReport> {
  const audit = new SignalIntegrityAudit(candles, timeframe);
  return await audit.executeFullAudit();
}
