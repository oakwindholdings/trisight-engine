// src/utils/audit/StopExitTraceAnalyzer.ts
// STOP_EXIT signal render trace analyzer for audit pipeline
// Tracks emission → rendering lifecycle and identifies gaps

import { TradeActionSignal, TradeAction } from '../trading/TradeActionSignal';

interface EmissionTrace {
  patternId: string;
  action: TradeAction;
  price: number;
  timestamp: Date;
  triggeredBy: string;
  emissionId: string;
}

interface RenderTrace {
  signalId: string;
  labelVisible: boolean;
  isRendered: boolean;
  position: { x: number; y: number };
  renderTimestamp: Date;
}

interface DiffAnalysis {
  status: 'MATCHED' | 'EMISSION_ONLY' | 'RENDER_ONLY' | 'TIMING_GAP';
  rootCause: string;
  timestamp: Date;
  emissionId?: string;
  renderSignalId?: string;
}

class StopExitTraceAnalyzer {
  private emissionTraces: EmissionTrace[] = [];
  private renderTraces: RenderTrace[] = [];
  private diffAnalyses: DiffAnalysis[] = [];
  private auditData: any = null;

  constructor() {
    // Initialize audit data structure in memory for browser compatibility
    this.auditData = {
      audit: {
        id: "stoploss.render.trace",
        name: "STOP_EXIT Signal Render Trace",
        timestamp: new Date().toISOString(),
        scope: ["STOP_EXIT"],
        timeframes: ["1m"],
        status: "ACTIVE",
        stages: {
          EMISSION: { traces: [] },
          RENDER: { traces: [] },
          DIFF_ANALYSIS: { traces: [] }
        }
      },
      metrics: {
        totalEmissions: 0,
        totalRenders: 0,
        renderGaps: 0,
        lastUpdate: new Date().toISOString()
      }
    };
  }

  /**
   * Record STOP_EXIT signal emission
   */
  recordEmission(patternId: string, action: TradeAction, price: number, timestamp: Date, triggeredBy: string): void {
    if (action !== TradeAction.SELL && action !== TradeAction.COVER) {
      return; // Only track STOP_EXIT signals (SELL/COVER)
    }

    const emissionId = `${patternId}_${timestamp.getTime()}_${price.toFixed(4)}`;
    
    const trace: EmissionTrace = {
      patternId,
      action,
      price,
      timestamp,
      triggeredBy,
      emissionId
    };

    this.emissionTraces.push(trace);
    
    // 🔍 AUDIT: EMISSION stage logging
    console.log('[STOP_EXIT_TRACE] EMISSION:', {
      patternId,
      action,
      price: price.toFixed(4),
      timestamp: timestamp.toISOString(),
      triggeredBy,
      emissionId
    });

    this.updateAuditData();
  }

  /**
   * Record STOP_EXIT signal rendering
   */
  recordRender(signalId: string, labelVisible: boolean, isRendered: boolean, position: { x: number; y: number }): void {
    const trace: RenderTrace = {
      signalId,
      labelVisible,
      isRendered,
      position,
      renderTimestamp: new Date()
    };

    this.renderTraces.push(trace);
    
    // 🔍 AUDIT: RENDER stage logging
    console.log('[STOP_EXIT_TRACE] RENDER:', {
      signalId,
      labelVisible,
      isRendered,
      position: `(${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
      renderTimestamp: trace.renderTimestamp.toISOString()
    });

    this.updateAuditData();
  }

  /**
   * Perform diff analysis to identify emission/render gaps
   */
  performDiffAnalysis(): DiffAnalysis[] {
    const analyses: DiffAnalysis[] = [];
    const now = new Date();

    // Check for emissions without renders
    this.emissionTraces.forEach(emission => {
      const matchingRender = this.renderTraces.find(render => 
        render.signalId.includes(emission.emissionId) ||
        render.signalId.includes(emission.patternId)
      );

      if (!matchingRender) {
        analyses.push({
          status: 'EMISSION_ONLY',
          rootCause: `STOP_EXIT signal emitted but not rendered: ${emission.emissionId}`,
          timestamp: now,
          emissionId: emission.emissionId
        });
      } else {
        analyses.push({
          status: 'MATCHED',
          rootCause: 'STOP_EXIT signal successfully emitted and rendered',
          timestamp: now,
          emissionId: emission.emissionId,
          renderSignalId: matchingRender.signalId
        });
      }
    });

    // Check for renders without emissions (orphaned renders)
    this.renderTraces.forEach(render => {
      const matchingEmission = this.emissionTraces.find(emission => 
        render.signalId.includes(emission.emissionId) ||
        render.signalId.includes(emission.patternId)
      );

      if (!matchingEmission) {
        analyses.push({
          status: 'RENDER_ONLY',
          rootCause: `Signal rendered without corresponding STOP_EXIT emission: ${render.signalId}`,
          timestamp: now,
          renderSignalId: render.signalId
        });
      }
    });

    this.diffAnalyses = analyses;
    
    // 🔍 AUDIT: DIFF_ANALYSIS stage logging
    analyses.forEach(analysis => {
      console.log('[STOP_EXIT_TRACE] DIFF_ANALYSIS:', {
        status: analysis.status,
        rootCause: analysis.rootCause,
        timestamp: analysis.timestamp.toISOString()
      });
    });

    this.updateAuditData();
    return analyses;
  }

  /**
   * Get comprehensive audit summary
   */
  getAuditSummary() {
    const summary = {
      totalEmissions: this.emissionTraces.length,
      totalRenders: this.renderTraces.length,
      renderGaps: this.diffAnalyses.filter(d => d.status === 'EMISSION_ONLY').length,
      orphanedRenders: this.diffAnalyses.filter(d => d.status === 'RENDER_ONLY').length,
      successfulMatches: this.diffAnalyses.filter(d => d.status === 'MATCHED').length,
      lastUpdate: new Date().toISOString()
    };

    console.log('[STOP_EXIT_TRACE] AUDIT_SUMMARY:', summary);
    return summary;
  }

  /**
   * Update audit data in memory (browser-compatible)
   */
  private updateAuditData(): void {
    try {
      // Update traces in audit data
      this.auditData.audit.stages.EMISSION.traces = this.emissionTraces;
      this.auditData.audit.stages.RENDER.traces = this.renderTraces;
      this.auditData.audit.stages.DIFF_ANALYSIS.traces = this.diffAnalyses;
      
      // Update metrics
      this.auditData.metrics = {
        totalEmissions: this.emissionTraces.length,
        totalRenders: this.renderTraces.length,
        renderGaps: this.diffAnalyses.filter(d => d.status === 'EMISSION_ONLY').length,
        lastUpdate: new Date().toISOString()
      };

      // Store in browser localStorage for persistence
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('stopExitTraceAudit', JSON.stringify(this.auditData));
      }
    } catch (error) {
      console.error('[STOP_EXIT_TRACE] Error updating audit data:', error);
    }
  }

  /**
   * Export audit data as downloadable JSON (browser-compatible)
   */
  exportAuditData(): string {
    return JSON.stringify(this.auditData, null, 2);
  }

  /**
   * Get current audit data
   */
  getAuditData(): any {
    return this.auditData;
  }
}

// Export singleton instance
export const stopExitTraceAnalyzer = new StopExitTraceAnalyzer();
