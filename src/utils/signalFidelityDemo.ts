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
      console.warn('[SignalFidelityDemo] Demo already running');
      return;
    }

    this.isRunning = true;
    console.log('\n🎯 SIGNAL FIDELITY MODE DEMONSTRATION STARTED');
    console.log('=' .repeat(60));

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
      console.error('[SignalFidelityDemo] Demo failed:', error);
    } finally {
      this.isRunning = false;
      console.log('\n✅ SIGNAL FIDELITY MODE DEMONSTRATION COMPLETED');
      console.log('=' .repeat(60));
    }
  }

  private async initializeFidelityMode(): Promise<void> {
    console.log('\n📋 Step 1: Initializing Fidelity Mode');
    console.log('-' .repeat(40));
    
    // Apply patches
    applyFidelityModePatches();
    
    // Log settings
    console.log('[Fidelity] Current settings:', FIDELITY_MODE_SETTINGS);
    
    // Reset all trackers
    patternEngineTracker.reset();
    dataAnalysisLock.reset();
    
    console.log('[Fidelity] ✅ Initialization complete');
    await this.delay(1000);
  }

  private async demonstratePatternEngineTracking(): Promise<void> {
    console.log('\n🔧 Step 2: Pattern Engine Readiness Tracking');
    console.log('-' .repeat(40));
    
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
      console.log(`[Fidelity] Processing ${engine}...`);
      patternEngineTracker.markEngineProcessing(engine);
      
      await this.delay(200); // Simulate processing time
      
      patternEngineTracker.markEngineReady(engine);
      console.log(`[Fidelity] ✅ ${engine} ready (${patternEngineTracker.getReadyCount()}/${engines.length})`);
    }

    const allReady = patternEngineTracker.areAllEnginesReady();
    console.log(`[Fidelity] All engines ready: ${allReady ? '✅ YES' : '❌ NO'}`);
    await this.delay(500);
  }

  private async demonstrateSignalValidation(): Promise<void> {
    console.log('\n🎯 Step 3: Signal Validation Testing');
    console.log('-' .repeat(40));
    
    // Test signal rendering validation
    const testSignals = [
      { signalType: 'ENTRY', action: 'BUY', timestamp: new Date() },
      { signalType: 'STOP_EXIT', action: 'SELL', timestamp: new Date() },
      { signalType: 'ENTRY', action: 'SHORT', timestamp: new Date() }
    ];

    testSignals.forEach((signal, index) => {
      const shouldRender = SignalFidelityValidator.shouldRenderSignal(signal, FIDELITY_MODE_SETTINGS);
      console.log(`[Fidelity] Signal ${index + 1} (${signal.signalType}): ${shouldRender ? '✅ RENDER' : '❌ SKIP'}`);
    });

    // Test debounce bypass
    const patterns = ['ESCALATOR', 'ROCKETMAN', 'PIVOT'];
    patterns.forEach(pattern => {
      const canEmit = SignalFidelityValidator.canEmitSignal(pattern, FIDELITY_MODE_SETTINGS);
      console.log(`[Fidelity] ${pattern} emission: ${canEmit ? '✅ ALLOWED' : '❌ BLOCKED'}`);
    });

    await this.delay(1000);
  }

  private async demonstrateLifecycleInstrumentation(): Promise<void> {
    console.log('\n⏱️ Step 4: Lifecycle Instrumentation');
    console.log('-' .repeat(40));
    
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
    console.log('\n📊 Final Status Report');
    console.log('-' .repeat(40));
    
    const engineStatus = patternEngineTracker.getStatus();
    const allReady = patternEngineTracker.areAllEnginesReady();
    const analysisReady = dataAnalysisLock.isAnalysisReady();
    
    console.log('[Fidelity] Pattern Engines:', engineStatus);
    console.log('[Fidelity] All Engines Ready:', allReady ? '✅' : '❌');
    console.log('[Fidelity] Data Analysis Ready:', analysisReady ? '✅' : '❌');
    console.log('[Fidelity] Chart Render Allowed:', !SignalFidelityValidator.shouldWaitForEngines(FIDELITY_MODE_SETTINGS) ? '✅' : '❌');
    
    // Verification checklist
    console.log('\n✅ Verification Checklist:');
    console.log(`   • Debounce disabled: ${!FIDELITY_MODE_SETTINGS.debounceSignals ? '✅' : '❌'}`);
    console.log(`   • Overlap suppression off: ${!FIDELITY_MODE_SETTINGS.suppressOverlaps ? '✅' : '❌'}`);
    console.log(`   • All patterns rendered: ${FIDELITY_MODE_SETTINGS.renderAllPatterns ? '✅' : '❌'}`);
    console.log(`   • STOP_EXIT always visible: ${FIDELITY_MODE_SETTINGS.alwaysRenderStopExit ? '✅' : '❌'}`);
    console.log(`   • Pattern engine tracking: ${allReady ? '✅' : '❌'}`);
    console.log(`   • Lifecycle instrumentation: ${analysisReady ? '✅' : '❌'}`);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick verification that fidelity mode is working
   */
  static quickVerify(): boolean {
    console.log('\n🔍 QUICK FIDELITY MODE VERIFICATION');
    console.log('-' .repeat(40));
    
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
      console.log(`   ${check.name}: ${status}`);
      if (!check.result) allPassed = false;
    });

    console.log(`\nOverall Status: ${allPassed ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`);
    return allPassed;
  }
}

// Export demo instance
export const signalFidelityDemo = new SignalFidelityDemo();

// Console commands for easy testing
(window as any).runFidelityDemo = () => signalFidelityDemo.runDemo();
(window as any).verifyFidelityMode = () => SignalFidelityDemo.quickVerify();
(window as any).fidelitySettings = FIDELITY_MODE_SETTINGS;
