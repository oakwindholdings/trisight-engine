// src/utils/signalFidelityDemo.ts
// Signal Fidelity Mode Demonstration and Verification
// Shows before/after behavior with fidelity mode patches

import { 
  applyFidelityModePatches, 
  FIDELITY_MODE_SETTINGS, 
  patternEngineTracker, 
  dataAnalysisLock, 
  LifecycleInstrumentation,
  SignalFidelityValidator 
} from './signalFidelityPatch';
import { logDebug } from './debug';

/**
 * Demonstrates Signal Fidelity Mode functionality
 */
export class SignalFidelityDemo {
  private isRunning = false;

  /**
   * Run the complete signal fidelity mode demonstration
   */
  async runDemo(): Promise<void> {
    if (this.isRunning) {
      logDebug('DEBUG_TRADE_SIGNALS', '[SignalFidelityDemo] Demo already running');
      return;
    }

    this.isRunning = true;
    logDebug('DEBUG_TRADE_SIGNALS', '\n🎯 SIGNAL FIDELITY MODE DEMONSTRATION STARTED');
    logDebug('DEBUG_TRADE_SIGNALS', '=' .repeat(60));

    try {
      // Step 1: Initialize Fidelity Mode
      await this.initializeFidelityMode();
      
      // Step 2: Demonstrate Pattern Engine Tracking
      await this.demonstratePatternEngineTracking();
      
      // Step 3: Demonstrate Signal Validation
      await this.demonstrateSignalValidation();
      
      // Step 4: Demonstrate Lifecycle Instrumentation
      await this.demonstrateLifecycleInstrumentation();
      
      // Step 5: Show Final Status
      this.showFinalStatus();
      
    } catch (error) {
      logDebug('DEBUG_TRADE_SIGNALS', '[SignalFidelityDemo] Demo failed:', error);
    } finally {
      this.isRunning = false;
      logDebug('DEBUG_TRADE_SIGNALS', '\n✅ SIGNAL FIDELITY MODE DEMONSTRATION COMPLETED');
      logDebug('DEBUG_TRADE_SIGNALS', '=' .repeat(60));
    }
  }

  private async initializeFidelityMode(): Promise<void> {
    logDebug('DEBUG_TRADE_SIGNALS', '\n📋 Step 1: Initializing Fidelity Mode');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    // Apply patches
    applyFidelityModePatches();
    
    // Log settings
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] Current settings:', FIDELITY_MODE_SETTINGS);
    
    // Reset all trackers
    patternEngineTracker.reset();
    dataAnalysisLock.reset();
    
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] ✅ Initialization complete');
    await this.delay(1000);
  }

  private async demonstratePatternEngineTracking(): Promise<void> {
    logDebug('DEBUG_TRADE_SIGNALS', '\n🔧 Step 2: Pattern Engine Readiness Tracking');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    const engines = [
      'ESCALATOR',
      'BLACKJACK', 
      'BREAKOUT_BOX',
      'GOLDMINE',
      'ROCKETMAN',
      'PIVOT',
      'GOLDMINE_CHANNEL',
      'GOLDEN_CANDLE'
    ];

    // Simulate pattern detection sequence
    for (const engine of engines) {
      logDebug('DEBUG_TRADE_SIGNALS', `[Fidelity] Processing ${engine}...`);
      patternEngineTracker.markEngineProcessing(engine);
      
      await this.delay(200); // Simulate processing time
      
      patternEngineTracker.markEngineReady(engine);
      logDebug('DEBUG_TRADE_SIGNALS', `[Fidelity] ✅ ${engine} ready (${patternEngineTracker.getReadyCount()}/${engines.length})`);
    }

    const allReady = patternEngineTracker.areAllEnginesReady();
    logDebug('DEBUG_TRADE_SIGNALS', `[Fidelity] All engines ready: ${allReady ? '✅ YES' : '❌ NO'}`);
    await this.delay(500);
  }

  private async demonstrateSignalValidation(): Promise<void> {
    logDebug('DEBUG_TRADE_SIGNALS', '\n🎯 Step 3: Signal Validation Testing');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    // Test signal rendering validation
    const testSignals = [
      { signalType: 'ENTRY', action: 'BUY', timestamp: new Date() },
      { signalType: 'STOP_EXIT', action: 'SELL', timestamp: new Date() },
      { signalType: 'ENTRY', action: 'SHORT', timestamp: new Date() }
    ];

    testSignals.forEach((signal, index) => {
      const shouldRender = SignalFidelityValidator.shouldRenderSignal(signal, FIDELITY_MODE_SETTINGS);
      logDebug('DEBUG_TRADE_SIGNALS', `[Fidelity] Signal ${index + 1} (${signal.signalType}): ${shouldRender ? '✅ RENDER' : '❌ SKIP'}`);
    });

    // Test debounce bypass
    const patterns = ['ESCALATOR', 'ROCKETMAN', 'PIVOT'];
    patterns.forEach(pattern => {
      const canEmit = SignalFidelityValidator.canEmitSignal(pattern, FIDELITY_MODE_SETTINGS);
      logDebug('DEBUG_TRADE_SIGNALS', `[Fidelity] ${pattern} emission: ${canEmit ? '✅ ALLOWED' : '❌ BLOCKED'}`);
    });

    await this.delay(1000);
  }

  private async demonstrateLifecycleInstrumentation(): Promise<void> {
    logDebug('DEBUG_TRADE_SIGNALS', '\n⏱️ Step 4: Lifecycle Instrumentation');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    // Start data analysis
    dataAnalysisLock.startAnalysis();
    LifecycleInstrumentation.startTimer('Demo Processing');
    
    // Log milestones
    LifecycleInstrumentation.logMilestone('Data fetch started');
    await this.delay(500);
    
    LifecycleInstrumentation.logMilestone('Pattern detection initiated');
    await this.delay(300);
    
    LifecycleInstrumentation.logMilestone('Chart rendering begun');
    await this.delay(200);
    
    // Complete analysis
    dataAnalysisLock.completeAnalysis();
    LifecycleInstrumentation.endTimer('Demo Processing');
    LifecycleInstrumentation.logMilestone('Chart rendered after full signal processing');
    
    await this.delay(500);
  }

  private showFinalStatus(): void {
    logDebug('DEBUG_TRADE_SIGNALS', '\n📊 Final Status Report');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    const engineStatus = patternEngineTracker.getStatus();
    const allReady = patternEngineTracker.areAllEnginesReady();
    const analysisReady = dataAnalysisLock.isAnalysisReady();
    
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] Pattern Engines:', engineStatus);
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] All Engines Ready:', allReady ? '✅' : '❌');
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] Data Analysis Ready:', analysisReady ? '✅' : '❌');
    logDebug('DEBUG_TRADE_SIGNALS', '[Fidelity] Chart Render Allowed:', !SignalFidelityValidator.shouldWaitForEngines(FIDELITY_MODE_SETTINGS) ? '✅' : '❌');
    
    // Verification checklist
    logDebug('DEBUG_TRADE_SIGNALS', '\n✅ Verification Checklist:');
    logDebug('DEBUG_TRADE_SIGNALS', `   • Debounce disabled: ${!FIDELITY_MODE_SETTINGS.debounceSignals ? '✅' : '❌'}`);
    logDebug('DEBUG_TRADE_SIGNALS', `   • Overlap suppression off: ${!FIDELITY_MODE_SETTINGS.suppressOverlaps ? '✅' : '❌'}`);
    logDebug('DEBUG_TRADE_SIGNALS', `   • All patterns rendered: ${FIDELITY_MODE_SETTINGS.renderAllPatterns ? '✅' : '❌'}`);
    logDebug('DEBUG_TRADE_SIGNALS', `   • STOP_EXIT always visible: ${FIDELITY_MODE_SETTINGS.alwaysRenderStopExit ? '✅' : '❌'}`);
    logDebug('DEBUG_TRADE_SIGNALS', `   • Pattern engine tracking: ${allReady ? '✅' : '❌'}`);
    logDebug('DEBUG_TRADE_SIGNALS', `   • Lifecycle instrumentation: ${analysisReady ? '✅' : '❌'}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick verification that fidelity mode is working
   */
  static quickVerify(): boolean {
    logDebug('DEBUG_TRADE_SIGNALS', '\n🔍 QUICK FIDELITY MODE VERIFICATION');
    logDebug('DEBUG_TRADE_SIGNALS', '-' .repeat(40));
    
    const checks = [
      {
        name: 'Debounce disabled',
        result: !FIDELITY_MODE_SETTINGS.debounceSignals
      },
      {
        name: 'Overlap suppression off',
        result: !FIDELITY_MODE_SETTINGS.suppressOverlaps
      },
      {
        name: 'All patterns rendered',
        result: FIDELITY_MODE_SETTINGS.renderAllPatterns
      },
      {
        name: 'STOP_EXIT always visible',
        result: FIDELITY_MODE_SETTINGS.alwaysRenderStopExit
      }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const status = check.result ? '✅ PASS' : '❌ FAIL';
      logDebug('DEBUG_TRADE_SIGNALS', `   ${check.name}: ${status}`);
      if (!check.result) allPassed = false;
    });

    logDebug('DEBUG_TRADE_SIGNALS', `\nOverall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
    return allPassed;
  }
}

// Export demo instance
export const signalFidelityDemo = new SignalFidelityDemo();

// Console commands for easy testing
(window as any).runFidelityDemo = () => signalFidelityDemo.runDemo();
(window as any).verifyFidelityMode = () => SignalFidelityDemo.quickVerify();
(window as any).fidelitySettings = FIDELITY_MODE_SETTINGS;
