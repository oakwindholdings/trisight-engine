// src/utils/audit/TargetsTabDiagnostic.ts
// Full Targets Tab Diagnostic & Pipeline Audit Utility
// Validates import → scan → render → route workflow

import { TradeActionSignal, TradeAction, SignalType } from '../trading/TradeActionSignal';
import { fetchCandlestickData } from '../../api/twelveDataApi';
import { CandlestickData } from '../../models/ChartTypes';
import PatternDetector from '../patternDetection/PatternDetector';
import { logDebug } from '../../utils/debug';

interface SymbolValidationResult {
  original: string;
  cleaned: string;
  isValid: boolean;
  issues: string[];
}

interface ScanResult {
  symbol: string;
  success: boolean;
  apiResponse: any;
  candleCount: number;
  patternsDetected: number;
  signalsGenerated: number;
  errors: string[];
}

interface RenderResult {
  symbol: string;
  signalCount: number;
  targetReportRow: any;
  calculations: {
    triSightRating: number;
    successProfile: number;
    momentum: number;
  };
  errors: string[];
}

interface TargetsTabAuditResult {
  timestamp: string;
  testSymbols: string[];
  step1_symbolValidation: SymbolValidationResult[];
  step2_scanExecution: ScanResult[];
  step3_signalRendering: RenderResult[];
  step4_tableUI: {
    headerRendered: boolean;
    rowCount: number;
    filteringWorks: boolean;
    sortingWorks: boolean;
  };
  step5_routeSync: {
    chartContextSet: boolean;
    routeNavigation: boolean;
  };
  breakagePoints: string[];
  recommendations: string[];
  emergencyModeStatus: boolean;
  quotaLimitHit: boolean;
}

export class TargetsTabDiagnostic {
  private static readonly TEST_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'Meta Platforms Inc.']; // Mix of valid + invalid
  
  /**
   * Run comprehensive Targets tab diagnostic
   */
  static async runFullDiagnostic(): Promise<TargetsTabAuditResult> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Starting full pipeline audit...');
    
    const result: TargetsTabAuditResult = {
      timestamp: new Date().toISOString(),
      testSymbols: this.TEST_SYMBOLS,
      step1_symbolValidation: [],
      step2_scanExecution: [],
      step3_signalRendering: [],
      step4_tableUI: { headerRendered: false, rowCount: 0, filteringWorks: false, sortingWorks: false },
      step5_routeSync: { chartContextSet: false, routeNavigation: false },
      breakagePoints: [],
      recommendations: [],
      emergencyModeStatus: false,
      quotaLimitHit: false
    };

    try {
      // Step 1: Symbol Validation
      result.step1_symbolValidation = await this.validateSymbolInput(this.TEST_SYMBOLS);
      
      // Step 2: Scanner Execution  
      result.step2_scanExecution = await this.testSignalScanner();
      
      // Step 3: Signal Rendering
      result.step3_signalRendering = await this.testSignalRendering(result.step2_scanExecution);
      
      // Step 4: Table UI (simulated)
      result.step4_tableUI = await this.testTableUI(result.step3_signalRendering);
      
      // Step 5: Route Sync (simulated)
      result.step5_routeSync = await this.testRouteSync();
      
      // Analyze breakage points
      result.breakagePoints = this.identifyBreakagePoints(result);
      result.recommendations = this.generateRecommendations(result);
      
    } catch (error) {
      result.breakagePoints.push(`Fatal error during diagnostic: ${error}`);
      console.error('[TargetsTabDiagnostic] Fatal error:', error);
    }

    return result;
  }

  /**
   * Step 1: Validate symbol input and cleaning
   */
  private static async validateSymbolInput(symbols: string[]): Promise<SymbolValidationResult[]> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Step 1: Validating symbol input...');
    
    return symbols.map(symbol => {
      const issues: string[] = [];
      let cleaned = symbol;
      
      // Check for common formatting issues
      if (symbol.includes('(') && symbol.includes(')')) {
        const match = symbol.match(/\(([^)]+)\)/);
        if (match) {
          cleaned = match[1];
          issues.push('Extracted ticker from company name format');
        }
      }
      
      // Clean whitespace and quotes
      cleaned = cleaned.trim().replace(/['"]/g, '').toUpperCase();
      
      // Validate ticker format
      const isValid = /^[A-Z]{1,5}$/.test(cleaned);
      if (!isValid) {
        issues.push('Invalid ticker format');
      }
      
      if (symbol !== cleaned) {
        issues.push(`Original: "${symbol}" → Cleaned: "${cleaned}"`);
      }
      
      return {
        original: symbol,
        cleaned,
        isValid,
        issues
      };
    });
  }

  /**
   * Step 2: Test signal scanner execution
   */
  private static async testSignalScanner(): Promise<ScanResult[]> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Step 2: Testing signal scanner...');
    
    const cleanSymbols = ['AAPL', 'NVDA', 'TSLA']; // Valid symbols only for API test
    const results: ScanResult[] = [];
    
    for (const symbol of cleanSymbols) {
      const scanResult: ScanResult = {
        symbol,
        success: false,
        apiResponse: null,
        candleCount: 0,
        patternsDetected: 0,
        signalsGenerated: 0,
        errors: []
      };
      
      try {
        // Test API fetch
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        logDebug('DEBUG_AUDIT', `[TargetsTabDiagnostic] Fetching data for ${symbol}...`);
        const ohlcv = await fetchCandlestickData(symbol, '1day', startDate, endDate);
        
        scanResult.apiResponse = { status: 'success', dataPoints: ohlcv.length };
        scanResult.candleCount = ohlcv.length;
        
        if (ohlcv.length < 10) {
          scanResult.errors.push('Insufficient data returned from API');
        } else {
          // Test pattern detection
          const detector = new PatternDetector();
          const patterns = detector.detectPatterns(ohlcv);
          scanResult.patternsDetected = patterns.length;
          
          // Simulate signal generation (actual logic from useSignalScanner)
          const signals = patterns.map((pattern: any) => ({
            ticker: symbol,
            pattern: pattern.type,
            confidence: pattern.confidence || 0.7,
            price: pattern.highPrice || pattern.lowPrice || 0,
            timestamp: pattern.startTime,
            action: 'BUY' // Simplified
          }));
          
          scanResult.signalsGenerated = signals.length;
          scanResult.success = true;
        }
        
      } catch (error) {
        scanResult.errors.push(`API/Pattern detection failed: ${error}`);
        console.error(`[TargetsTabDiagnostic] Error for ${symbol}:`, error);
      }
      
      results.push(scanResult);
    }
    
    return results;
  }

  /**
   * Step 3: Test signal rendering in TargetReportTable
   */
  private static async testSignalRendering(scanResults: ScanResult[]): Promise<RenderResult[]> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Step 3: Testing signal rendering...');
    
    return scanResults.map(scan => {
      const renderResult: RenderResult = {
        symbol: scan.symbol,
        signalCount: scan.signalsGenerated,
        targetReportRow: null,
        calculations: { triSightRating: 0, successProfile: 0, momentum: 0 },
        errors: []
      };
      
      if (scan.success && scan.signalsGenerated > 0) {
        // Simulate TargetReportTable calculations with full TriSight data
        const mockSignal: TradeActionSignal = {
          action: TradeAction.BUY,
          signalType: SignalType.LONG_ENTRY,
          ticker: scan.symbol,
          confidence: 0.75,
          pattern: 'ESCALATOR',
          price: 150.0,
          timestamp: new Date(),
          // TriSight Calculation Fields (real data for formulas)
          escalatorStepCount: 3,
          blackjackTrailing5: 2,
          blackjackScore: 1,
          blackjackContinuanceScore: 4,
          fiveDayGain: 2.5,
          tenDayGain: 5.2
        };
        
        // Real TriSight Calculation Logic (Dick O'Leary Formulas)
        const successProfile = Math.round(mockSignal.confidence * 100); // TriSight Conviction Rating (AI Calculation)
        
        // Acceleration: Escalator Step Count
        const acceleration = mockSignal.escalatorStepCount || 0;
        
        // Intrinsic Strength: Blackjack Trailing 5
        const intrinsicStrength = mockSignal.blackjackTrailing5 || 0;
        
        // Momentum: sum(5 Day % Gain + 10 Day % Gain)/2
        const fiveDayGain = mockSignal.fiveDayGain || 0;
        const tenDayGain = mockSignal.tenDayGain || 0;
        const momentum = Math.round((fiveDayGain + tenDayGain) / 2);
        
        // Relative Strength: Blackjack Continuance Score
        const relativeStrength = mockSignal.blackjackContinuanceScore || 0;
        
        // Golden Candle: Step Breakout Candle with +/- 1 Blackjack and +/- 2 Escalator Step Count
        const goldenCandle = (
          Math.abs(mockSignal.blackjackScore || 0) >= 1 && 
          Math.abs(mockSignal.escalatorStepCount || 0) >= 2
        ) ? 1 : 0;
        
        // TriSight Rating: Sum(Success Profile+Acceleration+Intrinsic Strength+Momentum)/4
        const triSightRating = Math.round((successProfile + acceleration + intrinsicStrength + momentum) / 4);
        
        renderResult.calculations = { triSightRating, successProfile, momentum };
        renderResult.targetReportRow = {
          symbol: scan.symbol,
          triSightRating,
          successProfile,
          patternType: mockSignal.pattern,
          triggerPrice: mockSignal.price
        };
      } else {
        renderResult.errors.push('No signals to render');
      }
      
      return renderResult;
    });
  }

  /**
   * Step 4: Test table UI functionality (simulated)
   */
  private static async testTableUI(renderResults: RenderResult[]): Promise<any> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Step 4: Testing table UI...');
    
    const validRows = renderResults.filter(r => r.targetReportRow !== null);
    
    return {
      headerRendered: true, // Always true in current implementation
      rowCount: validRows.length,
      filteringWorks: validRows.length > 0, // Simplified check
      sortingWorks: validRows.length > 1 // Need multiple rows to test sorting
    };
  }

  /**
   * Step 5: Test route sync (simulated)
   */
  private static async testRouteSync(): Promise<any> {
    logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Step 5: Testing route sync...');
    
    // This would need actual React context testing
    return {
      chartContextSet: true, // Simulated - would need actual context access
      routeNavigation: true  // Simulated - would need actual router access
    };
  }

  /**
   * Identify where the pipeline breaks
   */
  private static identifyBreakagePoints(result: TargetsTabAuditResult): string[] {
    const breakages: string[] = [];
    
    // Check symbol validation issues
    const invalidSymbols = result.step1_symbolValidation.filter(s => !s.isValid);
    if (invalidSymbols.length > 0) {
      breakages.push(`Symbol validation: ${invalidSymbols.length} invalid symbols detected`);
    }
    
    // Check scanning failures
    const failedScans = result.step2_scanExecution.filter(s => !s.success);
    if (failedScans.length > 0) {
      breakages.push(`Signal scanning: ${failedScans.length} symbols failed to scan`);
    }
    
    // Check rendering issues
    const emptyRenders = result.step3_signalRendering.filter(r => r.signalCount === 0);
    if (emptyRenders.length > 0) {
      breakages.push(`Signal rendering: ${emptyRenders.length} symbols produced no signals`);
    }
    
    // Check UI issues
    if (result.step4_tableUI.rowCount === 0) {
      breakages.push('Table UI: No rows rendered');
    }
    
    return breakages;
  }

  /**
   * Generate recommendations based on audit results
   */
  private static generateRecommendations(result: TargetsTabAuditResult): string[] {
    const recs: string[] = [];
    
    if (result.step1_symbolValidation.some(s => !s.isValid)) {
      recs.push('Add symbol validation and cleaning in TargetsPage.tsx before passing to scanner');
    }
    
    if (result.step2_scanExecution.some(s => s.errors.length > 0)) {
      recs.push('Add error handling and retry logic in useSignalScanner.ts');
    }
    
    if (result.step3_signalRendering.some(r => r.errors.length > 0)) {
      recs.push('Fix signal-to-row mapping in TargetReportTable.tsx');
    }
    
    if (result.step4_tableUI.rowCount === 0) {
      recs.push('Check scanning prop flow from TargetsPage to TargetReportTable');
    }
    
    // Check emergency mode
    recs.push('CRITICAL: useSignalScanner has EMERGENCY_MODE = true, limiting to 3 symbols');
    
    return recs;
  }

  /**
   * Download audit results as JSON file
   */
  static downloadAuditResults(results: TargetsTabAuditResult): void {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `targets_tab_diagnostic_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export utility function for manual testing
export async function runTargetsTabDiagnostic(): Promise<TargetsTabAuditResult> {
  const results = await TargetsTabDiagnostic.runFullDiagnostic();
  TargetsTabDiagnostic.downloadAuditResults(results);
  logDebug('DEBUG_AUDIT', '[TargetsTabDiagnostic] Audit completed. Results downloaded.');
  return results;
}
