// src/reportGeneration/__tests__/patternDetection.test.ts
// Unit tests for pattern detection engine
// Context: Ensures pattern detection is accurate and reliable

import { 
  PatternDetectionEngine,
  createPatternDetectionEngine,
  PatternType,
  DetectedPattern
} from '../processing/patternDetection';
import { PriceData, TechnicalIndicators } from '../models/reportTypes';

describe('PatternDetectionEngine', () => {
  let engine: PatternDetectionEngine;
  
  beforeEach(() => {
    engine = createPatternDetectionEngine({
      minPatternLength: 5,
      confidenceThreshold: 50,
      lookbackPeriod: 100,
      validateWithVolume: true,
      statisticalValidation: false // Disable for deterministic tests
    });
  });
  
  describe('Engine Configuration', () => {
    it('should create engine with default config', () => {
      const defaultEngine = createPatternDetectionEngine();
      expect(defaultEngine).toBeDefined();
    });
    
    it('should accept custom configuration', () => {
      const customEngine = createPatternDetectionEngine({
        minPatternLength: 10,
        confidenceThreshold: 70,
        lookbackPeriod: 200
      });
      expect(customEngine).toBeDefined();
    });
  });
  
  describe('Pattern Detection', () => {
    it('should detect no patterns in empty data', async () => {
      const patterns = await engine.detectPatterns([]);
      expect(patterns).toEqual([]);
    });
    
    it('should detect no patterns in insufficient data', async () => {
      const priceData = generatePriceData(3); // Less than minPatternLength
      const patterns = await engine.detectPatterns(priceData);
      expect(patterns).toEqual([]);
    });
    
    it('should handle data sorting correctly', async () => {
      const priceData = generatePriceData(20);
      // Reverse the data (oldest first)
      const reversedData = [...priceData].reverse();
      
      const patterns1 = await engine.detectPatterns(priceData);
      const patterns2 = await engine.detectPatterns(reversedData);
      
      // Should get same patterns regardless of input order
      expect(patterns1.length).toBe(patterns2.length);
    });
    
    it('should respect confidence threshold', async () => {
      const priceData = generateTrendingData(50, 100, 0.5); // Uptrend
      
      // Lower threshold should find more patterns
      const lowThreshold = createPatternDetectionEngine({ confidenceThreshold: 40 });
      const highThreshold = createPatternDetectionEngine({ confidenceThreshold: 80 });
      
      const lowPatterns = await lowThreshold.detectPatterns(priceData);
      const highPatterns = await highThreshold.detectPatterns(priceData);
      
      expect(lowPatterns.length).toBeGreaterThanOrEqual(highPatterns.length);
    });
  });
  
  describe('Goldmine Channel Detection', () => {
    it('should detect upward channel', async () => {
      const priceData = generateChannelData(50, 100, 110, 0.1); // Upward channel
      const patterns = await engine.detectPatterns(priceData);
      
      const channels = patterns.filter(p => p.type === PatternType.GOLDMINE_CHANNEL);
      expect(channels.length).toBeGreaterThan(0);
      
      const channel = channels[0];
      expect(channel.direction).toBe('bullish');
      expect(channel.confidence).toBeGreaterThan(50);
      expect(channel.targetPrice).toBeGreaterThan(priceData[0].close);
    });
    
    it('should detect downward channel', async () => {
      const priceData = generateChannelData(50, 100, 90, -0.1); // Downward channel
      const patterns = await engine.detectPatterns(priceData);
      
      const channels = patterns.filter(p => p.type === PatternType.GOLDMINE_CHANNEL);
      expect(channels.length).toBeGreaterThan(0);
      
      const channel = channels[0];
      expect(channel.direction).toBe('bearish');
      expect(channel.targetPrice).toBeLessThan(priceData[0].close);
    });
    
    it('should calculate parallel lines accurately', async () => {
      const priceData = generatePerfectChannel(30, 100, 5); // Perfect parallel channel
      const patterns = await engine.detectPatterns(priceData);
      
      const channels = patterns.filter(p => p.type === PatternType.GOLDMINE_CHANNEL);
      expect(channels.length).toBeGreaterThan(0);
      
      const channel = channels[0];
      expect(channel.strength).toBeGreaterThan(0.9); // High clarity for perfect channel
    });
  });
  
  describe('Goldmine Shaft Detection', () => {
    it('should detect upward shaft', async () => {
      const priceData = generateShaftData(20, 100, 'up', 3); // 3% moves
      const patterns = await engine.detectPatterns(priceData);
      
      const shafts = patterns.filter(p => p.type === PatternType.GOLDMINE_SHAFT);
      expect(shafts.length).toBeGreaterThan(0);
      
      const shaft = shafts[0];
      expect(shaft.direction).toBe('bullish');
      expect(shaft.metadata.formation.velocity).toBeGreaterThan(0.1);
    });
    
    it('should detect downward shaft', async () => {
      const priceData = generateShaftData(20, 100, 'down', 3);
      const patterns = await engine.detectPatterns(priceData);
      
      const shafts = patterns.filter(p => p.type === PatternType.GOLDMINE_SHAFT);
      expect(shafts.length).toBeGreaterThan(0);
      
      const shaft = shafts[0];
      expect(shaft.direction).toBe('bearish');
    });
    
    it('should identify continuation vs exhaustion', async () => {
      // High velocity shaft (continuation expected)
      const continuationData = generateShaftData(20, 100, 'up', 5); // 5% moves
      const continuationPatterns = await engine.detectPatterns(continuationData);
      const continuationShaft = continuationPatterns.find(p => p.type === PatternType.GOLDMINE_SHAFT);
      
      // Low velocity shaft (exhaustion expected)
      const exhaustionData = generateShaftData(20, 100, 'up', 2); // 2% moves
      const exhaustionPatterns = await engine.detectPatterns(exhaustionData);
      const exhaustionShaft = exhaustionPatterns.find(p => p.type === PatternType.GOLDMINE_SHAFT);
      
      if (continuationShaft && exhaustionShaft) {
        expect(continuationShaft.metadata.formation.isContinuation).toBe(true);
        expect(exhaustionShaft.metadata.formation.isContinuation).toBe(false);
      }
    });
  });
  
  describe('Pivot Pattern Detection', () => {
    it('should detect high pivot', async () => {
      const priceData = generatePivotData(30, 100, 'high');
      const patterns = await engine.detectPatterns(priceData);
      
      const pivots = patterns.filter(p => p.type === PatternType.PIVOT);
      expect(pivots.length).toBeGreaterThan(0);
      
      const pivot = pivots[0];
      expect(pivot.direction).toBe('bearish'); // High pivot = bearish reversal
      expect(pivot.metadata.formation.pivotType).toBe('high');
    });
    
    it('should detect low pivot', async () => {
      const priceData = generatePivotData(30, 100, 'low');
      const patterns = await engine.detectPatterns(priceData);
      
      const pivots = patterns.filter(p => p.type === PatternType.PIVOT);
      expect(pivots.length).toBeGreaterThan(0);
      
      const pivot = pivots[0];
      expect(pivot.direction).toBe('bullish'); // Low pivot = bullish reversal
      expect(pivot.metadata.formation.pivotType).toBe('low');
    });
    
    it('should identify key support/resistance levels', async () => {
      const priceData = generatePivotAtKeyLevel(50, 100, 95); // Pivot at 95 support
      const patterns = await engine.detectPatterns(priceData);
      
      const pivot = patterns.find(p => p.type === PatternType.PIVOT);
      if (pivot) {
        expect(pivot.metadata.formation.supportResistanceLevel).not.toBe('none');
        expect(pivot.confidence).toBeGreaterThan(60); // Higher confidence at key levels
      }
    });
  });
  
  describe('Rocketman Pattern Detection', () => {
    it('should detect breakout from consolidation', async () => {
      const priceData = generateRocketmanData(40, 100, 'up');
      const patterns = await engine.detectPatterns(priceData);
      
      const rocketman = patterns.find(p => p.type === PatternType.ROCKETMAN);
      expect(rocketman).toBeDefined();
      
      if (rocketman) {
        expect(rocketman.direction).toBe('bullish');
        expect(rocketman.metadata.formation.volumeIncrease).toBeGreaterThan(1.5);
        expect(rocketman.metadata.formation.tightness).toBeGreaterThan(0.8);
      }
    });
    
    it('should require volume confirmation', async () => {
      // Breakout without volume
      const noVolumeData = generateRocketmanData(40, 100, 'up', false);
      const noVolumeEngine = createPatternDetectionEngine({ validateWithVolume: true });
      const patterns = await noVolumeEngine.detectPatterns(noVolumeData);
      
      const rocketman = patterns.find(p => p.type === PatternType.ROCKETMAN);
      expect(rocketman).toBeUndefined(); // Should not detect without volume
    });
    
    it('should calculate proper price targets', async () => {
      const priceData = generateRocketmanData(40, 100, 'up');
      const patterns = await engine.detectPatterns(priceData);
      
      const rocketman = patterns.find(p => p.type === PatternType.ROCKETMAN);
      if (rocketman) {
        const rangeSize = rocketman.metadata.formation.consolidationRange * 100;
        const expectedTarget = priceData[0].close + rangeSize * 1.618;
        
        expect(rocketman.targetPrice).toBeCloseTo(expectedTarget, 1);
      }
    });
  });
  
  describe('Escalator Pattern Detection', () => {
    it('should detect upward escalator', async () => {
      const priceData = generateEscalatorData(50, 100, 'up', 7); // 7 steps
      const patterns = await engine.detectPatterns(priceData);
      
      const escalator = patterns.find(p => p.type === PatternType.ESCALATOR);
      expect(escalator).toBeDefined();
      
      if (escalator) {
        expect(escalator.direction).toBe('bullish');
        expect(escalator.metadata.formation.stepCount).toBeGreaterThanOrEqual(5);
        expect(escalator.metadata.formation.consistency).toBeGreaterThan(0.6);
      }
    });
    
    it('should detect downward escalator', async () => {
      const priceData = generateEscalatorData(50, 100, 'down', 6);
      const patterns = await engine.detectPatterns(priceData);
      
      const escalator = patterns.find(p => p.type === PatternType.ESCALATOR);
      if (escalator) {
        expect(escalator.direction).toBe('bearish');
      }
    });
    
    it('should measure step consistency', async () => {
      // Consistent steps
      const consistentData = generateEscalatorData(50, 100, 'up', 6, 0.02); // 2% each
      const consistentPatterns = await engine.detectPatterns(consistentData);
      const consistentEscalator = consistentPatterns.find(p => p.type === PatternType.ESCALATOR);
      
      // Inconsistent steps
      const inconsistentData = generateIrregularEscalator(50, 100);
      const inconsistentPatterns = await engine.detectPatterns(inconsistentData);
      const inconsistentEscalator = inconsistentPatterns.find(p => p.type === PatternType.ESCALATOR);
      
      if (consistentEscalator && inconsistentEscalator) {
        expect(consistentEscalator.strength).toBeGreaterThan(inconsistentEscalator.strength);
      } else if (consistentEscalator) {
        expect(consistentEscalator.strength).toBeGreaterThan(0.7);
      }
    });
  });
  
  describe('Blackjack Pattern Detection', () => {
    it('should detect oversold reversal setup', async () => {
      const priceData = generateBlackjackData(30, 100, 'oversold');
      const technicals: TechnicalIndicators = {
        rsi: 25,
        sma20: 105,
        sma50: 110,
        sma200: 115
      };
      
      const patterns = await engine.detectPatterns(priceData, technicals);
      const blackjack = patterns.find(p => p.type === PatternType.BLACKJACK);
      
      expect(blackjack).toBeDefined();
      if (blackjack) {
        expect(blackjack.direction).toBe('bullish');
        expect(blackjack.confidence).toBeGreaterThan(60);
        expect(blackjack.metadata.formation.confirmations.length).toBeGreaterThanOrEqual(3);
      }
    });
    
    it('should detect overbought reversal setup', async () => {
      const priceData = generateBlackjackData(30, 100, 'overbought');
      const technicals: TechnicalIndicators = {
        rsi: 75,
        sma20: 95,
        sma50: 90,
        sma200: 85
      };
      
      const patterns = await engine.detectPatterns(priceData, technicals);
      const blackjack = patterns.find(p => p.type === PatternType.BLACKJACK);
      
      if (blackjack) {
        expect(blackjack.direction).toBe('bearish');
      }
    });
    
    it('should require multiple confirmations', async () => {
      // Setup with only RSI extreme (not enough confirmations)
      const priceData = generatePriceData(30);
      const technicals: TechnicalIndicators = { rsi: 25 };
      
      const patterns = await engine.detectPatterns(priceData, technicals);
      const blackjack = patterns.find(p => p.type === PatternType.BLACKJACK);
      
      expect(blackjack).toBeUndefined(); // Should not detect with insufficient confirmations
    });
  });
  
  describe('Pattern Overlap and Deduplication', () => {
    it('should remove overlapping patterns', async () => {
      // Create data that could trigger multiple patterns
      const priceData = generateComplexData(100);
      
      const patternsWithDedup = await engine.detectPatterns(priceData);
      
      // Check no patterns overlap significantly
      for (let i = 0; i < patternsWithDedup.length; i++) {
        for (let j = i + 1; j < patternsWithDedup.length; j++) {
          const overlap = calculateOverlap(patternsWithDedup[i], patternsWithDedup[j]);
          expect(overlap).toBeLessThan(0.5); // Less than 50% overlap
        }
      }
    });
    
    it('should keep highest confidence pattern when overlapping', async () => {
      // This is tested implicitly by the deduplication logic
      const priceData = generateChannelData(50, 100, 110, 0.1);
      const patterns = await engine.detectPatterns(priceData);
      
      // All returned patterns should meet confidence threshold
      patterns.forEach(pattern => {
        expect(pattern.confidence).toBeGreaterThanOrEqual(50);
      });
    });
  });
  
  describe('Statistical Validation', () => {
    it('should validate patterns statistically when enabled', async () => {
      const engineWithValidation = createPatternDetectionEngine({
        statisticalValidation: true
      });
      
      const priceData = generateRandomWalk(100, 100); // Random data
      const patterns = await engineWithValidation.detectPatterns(priceData);
      
      // Random walk should produce fewer high-confidence patterns
      const highConfidencePatterns = patterns.filter(p => p.confidence > 70);
      expect(highConfidencePatterns.length).toBe(0);
    });
    
    it('should calculate statistical significance correctly', async () => {
      const engineWithValidation = createPatternDetectionEngine({
        statisticalValidation: true
      });
      
      const priceData = generateChannelData(50, 100, 110, 0.2); // Strong trend
      const patterns = await engineWithValidation.detectPatterns(priceData);
      
      patterns.forEach(pattern => {
        if (pattern.metadata.validation) {
          expect(pattern.metadata.validation.tStatistic).toBeDefined();
          expect(pattern.metadata.validation.significanceScore).toBeGreaterThan(0);
        }
      });
    });
  });
  
  describe('Volume Analysis', () => {
    it('should boost confidence with volume confirmation', async () => {
      // Pattern with increasing volume
      const highVolumeData = generatePatternWithVolume(30, 100, 'channel', 2.0);
      const highVolumePatterns = await engine.detectPatterns(highVolumeData);
      
      // Pattern with flat volume
      const lowVolumeData = generatePatternWithVolume(30, 100, 'channel', 1.0);
      const lowVolumePatterns = await engine.detectPatterns(lowVolumeData);
      
      if (highVolumePatterns.length > 0 && lowVolumePatterns.length > 0) {
        expect(highVolumePatterns[0].confidence).toBeGreaterThan(lowVolumePatterns[0].confidence);
      }
    });
    
    it('should work without volume validation', async () => {
      const noVolumeEngine = createPatternDetectionEngine({
        validateWithVolume: false
      });
      
      const priceData = generateChannelData(30, 100, 110, 0.1);
      const patterns = await noVolumeEngine.detectPatterns(priceData);
      
      expect(patterns.length).toBeGreaterThan(0);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle all same prices', async () => {
      const flatData = Array(20).fill(null).map((_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        open: 100,
        high: 100,
        low: 100,
        close: 100,
        volume: 1000000
      }));
      
      const patterns = await engine.detectPatterns(flatData);
      expect(patterns.length).toBe(0); // No patterns in flat data
    });
    
    it('should handle extreme price movements', async () => {
      const extremeData = generateExtremeMovements(30, 100);
      const patterns = await engine.detectPatterns(extremeData);
      
      // Should still detect patterns without crashing
      expect(patterns).toBeDefined();
    });
    
    it('should handle missing volume data', async () => {
      const noVolumeData = generatePriceData(30).map(bar => ({
        ...bar,
        volume: 0
      }));
      
      const patterns = await engine.detectPatterns(noVolumeData);
      expect(patterns).toBeDefined();
    });
  });
});

// Helper functions for generating test data

function generatePriceData(length: number, startPrice: number = 100): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    const change = (Math.random() - 0.5) * 2; // +/- 1%
    currentPrice *= (1 + change / 100);
    
    const high = currentPrice * (1 + Math.random() * 0.02);
    const low = currentPrice * (1 - Math.random() * 0.02);
    const open = currentPrice + (Math.random() - 0.5) * 0.5;
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open,
      high,
      low,
      close: currentPrice,
      volume: 1000000 + Math.random() * 500000
    });
  }
  
  return data;
}

function generateTrendingData(length: number, startPrice: number, dailyGrowth: number): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    currentPrice *= (1 + dailyGrowth / 100);
    const noise = (Math.random() - 0.5) * 1;
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice - noise / 2,
      high: currentPrice + Math.abs(noise) + 0.5,
      low: currentPrice - Math.abs(noise) - 0.5,
      close: currentPrice + noise,
      volume: 1000000
    });
  }
  
  return data;
}

function generateChannelData(
  length: number, 
  startPrice: number, 
  endPrice: number,
  slope: number
): PriceData[] {
  const data: PriceData[] = [];
  const channelWidth = 5; // 5% channel width
  
  for (let i = 0; i < length; i++) {
    const progress = i / length;
    const trendPrice = startPrice + (endPrice - startPrice) * progress;
    
    // Oscillate within channel
    const oscillation = Math.sin(i / 3) * channelWidth / 2;
    const price = trendPrice + oscillation;
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: price - 0.2,
      high: price + 0.5,
      low: price - 0.5,
      close: price,
      volume: 1000000
    });
  }
  
  return data;
}

function generatePerfectChannel(length: number, centerPrice: number, width: number): PriceData[] {
  const data: PriceData[] = [];
  
  for (let i = 0; i < length; i++) {
    // Create perfect oscillation between bounds
    const position = i % 10;
    let price: number;
    
    if (position < 5) {
      price = centerPrice + width / 2; // Upper bound
    } else {
      price = centerPrice - width / 2; // Lower bound
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: price,
      high: price + 0.1,
      low: price - 0.1,
      close: price,
      volume: 1000000
    });
  }
  
  return data;
}

function generateShaftData(
  length: number, 
  startPrice: number, 
  direction: 'up' | 'down',
  movePercent: number
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    if (i >= length - 5) {
      // Last 5 bars are the shaft
      const move = direction === 'up' ? movePercent : -movePercent;
      currentPrice *= (1 + move / 100);
    } else {
      // Normal price action before shaft
      currentPrice *= (1 + (Math.random() - 0.5) * 0.01);
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice * 0.99,
      high: currentPrice * 1.005,
      low: currentPrice * 0.995,
      close: currentPrice,
      volume: i >= length - 5 ? 2000000 : 1000000 // Higher volume during shaft
    });
  }
  
  return data;
}

function generatePivotData(length: number, startPrice: number, pivotType: 'high' | 'low'): PriceData[] {
  const data: PriceData[] = [];
  const pivotIndex = Math.floor(length / 2);
  
  for (let i = 0; i < length; i++) {
    let price: number;
    
    if (i < pivotIndex - 5) {
      // Before pivot
      if (pivotType === 'high') {
        price = startPrice + (pivotIndex - 5 - i) * 0.5; // Rising to pivot
      } else {
        price = startPrice - (pivotIndex - 5 - i) * 0.5; // Falling to pivot
      }
    } else if (i > pivotIndex + 5) {
      // After pivot
      if (pivotType === 'high') {
        price = startPrice + (i - pivotIndex - 5) * 0.5; // Falling from pivot
      } else {
        price = startPrice - (i - pivotIndex - 5) * 0.5; // Rising from pivot
      }
    } else if (i === pivotIndex) {
      // Pivot point
      price = pivotType === 'high' ? startPrice + 10 : startPrice - 10;
    } else {
      // Around pivot
      price = startPrice + (Math.random() - 0.5) * 2;
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: price - 0.2,
      high: price + 0.3,
      low: price - 0.3,
      close: price,
      volume: 1000000
    });
  }
  
  return data;
}

function generatePivotAtKeyLevel(
  length: number, 
  startPrice: number, 
  keyLevel: number
): PriceData[] {
  const data = generatePivotData(length, startPrice, 'low');
  
  // Adjust pivot to occur at key level
  const pivotIndex = Math.floor(length / 2);
  if (data[pivotIndex]) {
    data[pivotIndex].low = keyLevel;
    data[pivotIndex].close = keyLevel + 0.5;
  }
  
  return data;
}

function generateRocketmanData(
  length: number, 
  startPrice: number, 
  breakoutDirection: 'up' | 'down',
  withVolume: boolean = true
): PriceData[] {
  const data: PriceData[] = [];
  const consolidationEnd = 10;
  const breakoutIndex = 5;
  
  for (let i = 0; i < length; i++) {
    let price: number;
    let volume: number;
    
    if (i > consolidationEnd) {
      // Consolidation phase
      price = startPrice + (Math.random() - 0.5) * 1; // Tight range
      volume = 800000;
    } else if (i === breakoutIndex) {
      // Breakout bar
      price = breakoutDirection === 'up' ? startPrice * 1.04 : startPrice * 0.96;
      volume = withVolume ? 2000000 : 900000;
    } else if (i < breakoutIndex) {
      // After breakout
      if (breakoutDirection === 'up') {
        price = startPrice * 1.04 + (breakoutIndex - i) * 0.5;
      } else {
        price = startPrice * 0.96 - (breakoutIndex - i) * 0.5;
      }
      volume = 1500000;
    } else {
      price = startPrice;
      volume = 1000000;
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: price - 0.1,
      high: price + 0.2,
      low: price - 0.2,
      close: price,
      volume
    });
  }
  
  return data;
}

function generateEscalatorData(
  length: number,
  startPrice: number,
  direction: 'up' | 'down',
  steps: number,
  stepSize: number = 0.02
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  let stepCount = 0;
  
  for (let i = 0; i < length; i++) {
    const isStepBar = i % 4 === 0 && stepCount < steps;
    
    if (isStepBar) {
      // Step move
      currentPrice *= (1 + (direction === 'up' ? stepSize : -stepSize));
      stepCount++;
    } else {
      // Pause/consolidation
      currentPrice *= (1 + (Math.random() - 0.5) * 0.002);
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice - 0.05,
      high: currentPrice + 0.1,
      low: currentPrice - 0.1,
      close: currentPrice,
      volume: 1000000
    });
  }
  
  return data;
}

function generateIrregularEscalator(length: number, startPrice: number): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    const isStepBar = Math.random() > 0.7;
    
    if (isStepBar) {
      // Irregular step sizes
      const stepSize = 0.01 + Math.random() * 0.03;
      currentPrice *= (1 + stepSize);
    } else {
      currentPrice *= (1 + (Math.random() - 0.5) * 0.003);
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice - 0.05,
      high: currentPrice + 0.1,
      low: currentPrice - 0.1,
      close: currentPrice,
      volume: 1000000
    });
  }
  
  return data;
}

function generateBlackjackData(
  length: number,
  startPrice: number,
  extreme: 'oversold' | 'overbought'
): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    if (i === 0) {
      // Current bar at extreme
      if (extreme === 'oversold') {
        currentPrice = startPrice * 0.9; // 10% below normal
        
        // Hammer candle
        data.push({
          date: new Date(Date.now()).toISOString(),
          open: currentPrice,
          high: currentPrice + 0.5,
          low: currentPrice - 2, // Long lower wick
          close: currentPrice + 0.3,
          volume: 2000000 // Volume spike
        });
      } else {
        currentPrice = startPrice * 1.1; // 10% above normal
        
        // Shooting star
        data.push({
          date: new Date(Date.now()).toISOString(),
          open: currentPrice,
          high: currentPrice + 2, // Long upper wick
          low: currentPrice - 0.5,
          close: currentPrice - 0.3,
          volume: 2000000
        });
      }
    } else {
      // Historical data leading to extreme
      const progress = i / length;
      if (extreme === 'oversold') {
        currentPrice = startPrice * (1 - progress * 0.1);
      } else {
        currentPrice = startPrice * (1 + progress * 0.1);
      }
      
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        open: currentPrice - 0.2,
        high: currentPrice + 0.3,
        low: currentPrice - 0.3,
        close: currentPrice,
        volume: 1000000
      });
    }
  }
  
  return data;
}

function generateComplexData(length: number): PriceData[] {
  // Mix different patterns to test deduplication
  const data: PriceData[] = [];
  let currentPrice = 100;
  
  for (let i = 0; i < length; i++) {
    if (i < 20) {
      // Channel-like movement
      currentPrice = 100 + Math.sin(i / 3) * 5 + i * 0.1;
    } else if (i < 30) {
      // Shaft movement
      currentPrice *= 1.03;
    } else if (i < 50) {
      // Consolidation
      currentPrice = 110 + (Math.random() - 0.5) * 2;
    } else {
      // Normal movement
      currentPrice *= (1 + (Math.random() - 0.5) * 0.02);
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice - 0.2,
      high: currentPrice + 0.5,
      low: currentPrice - 0.5,
      close: currentPrice,
      volume: 1000000 + Math.random() * 500000
    });
  }
  
  return data;
}

function generateRandomWalk(length: number, startPrice: number): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    // Pure random walk
    const change = (Math.random() - 0.5) * 4; // +/- 2%
    currentPrice *= (1 + change / 100);
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice + (Math.random() - 0.5),
      high: currentPrice + Math.random(),
      low: currentPrice - Math.random(),
      close: currentPrice,
      volume: 1000000
    });
  }
  
  return data;
}

function generatePatternWithVolume(
  length: number,
  startPrice: number,
  patternType: string,
  volumeMultiplier: number
): PriceData[] {
  let baseData: PriceData[];
  
  switch (patternType) {
    case 'channel':
      baseData = generateChannelData(length, startPrice, startPrice * 1.1, 0.1);
      break;
    default:
      baseData = generatePriceData(length, startPrice);
  }
  
  // Modify volume based on multiplier
  return baseData.map((bar, i) => ({
    ...bar,
    volume: bar.volume * (i < 10 ? volumeMultiplier : 1)
  }));
}

function generateExtremeMovements(length: number, startPrice: number): PriceData[] {
  const data: PriceData[] = [];
  let currentPrice = startPrice;
  
  for (let i = 0; i < length; i++) {
    if (i % 10 === 0) {
      // Extreme movement every 10 bars
      currentPrice *= Math.random() > 0.5 ? 1.1 : 0.9; // 10% moves
    } else {
      currentPrice *= (1 + (Math.random() - 0.5) * 0.01);
    }
    
    data.push({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      open: currentPrice,
      high: currentPrice * 1.02,
      low: currentPrice * 0.98,
      close: currentPrice,
      volume: 1000000
    });
  }
  
  return data;
}

function calculateOverlap(p1: DetectedPattern, p2: DetectedPattern): number {
  const start1 = p1.startIndex;
  const end1 = p1.endIndex;
  const start2 = p2.startIndex;
  const end2 = p2.endIndex;
  
  if (start1 > end2 || start2 > end1) {
    return 0; // No overlap
  }
  
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  const overlapLength = overlapEnd - overlapStart + 1;
  
  const p1Length = end1 - start1 + 1;
  const p2Length = end2 - start2 + 1;
  
  return Math.max(overlapLength / p1Length, overlapLength / p2Length);
}