// src/components/Chart/testPatternRendering.js
// Quick test script to verify pattern rendering

const testData = {
  patterns: {
    escalator: {
      count: 0,
      lastDetected: null
    },
    goldmine: {
      count: 0,
      lastSignal: null
    },
    trailingStop: {
      active: false,
      position: null
    }
  },
  
  performance: {
    renderTime: [],
    avgRenderTime: 0
  },
  
  logPattern: (type, data) => {
    console.log(`[Pattern Detected] ${type}:`, data);
    testData.patterns[type].count++;
    testData.patterns[type].lastDetected = new Date();
  },
  
  logPerformance: (renderTime) => {
    testData.performance.renderTime.push(renderTime);
    if (testData.performance.renderTime.length > 100) {
      testData.performance.renderTime.shift();
    }
    testData.performance.avgRenderTime = 
      testData.performance.renderTime.reduce((a, b) => a + b, 0) / 
      testData.performance.renderTime.length;
    
    if (renderTime > 8) {
      console.warn(`[Performance] Render time exceeded 8ms: ${renderTime.toFixed(2)}ms`);
    }
  },
  
  summary: () => {
    console.log('=== Pattern Rendering Test Summary ===');
    console.log(`Escalator patterns detected: ${testData.patterns.escalator.count}`);
    console.log(`Goldmine signals: ${testData.patterns.goldmine.count}`);
    console.log(`Trailing stop active: ${testData.patterns.trailingStop.active}`);
    console.log(`Average render time: ${testData.performance.avgRenderTime.toFixed(2)}ms`);
    console.log(`Performance target: ${testData.performance.avgRenderTime <= 8 ? '✅ PASS' : '❌ FAIL'}`);
  }
};

// Export for use in console
window.patternTest = testData;
console.log('Pattern test utilities loaded. Use window.patternTest.summary() to see results.');
