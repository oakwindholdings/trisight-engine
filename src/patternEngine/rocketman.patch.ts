// src/patternEngine/rocketman.patch.ts
// CRITICAL PATCH: RBR Structure Validation & Rocket Type Classification
// Addresses audit findings: Rally-Base-Rally validation, wick/body ratios, type classification

import { Candle } from '../types/pattern';
import { logDebug } from '../utils/debug';
import { convertToHeikinAshi } from '../utils/candleTransform';

// Rocket type classification based on Dick O'Leary specifications
export type RocketType = 'GOLD' | 'SILVER' | 'BRONZE' | 'RUBY';

export interface RBRStructure {
  rallyPhase: {
    startIndex: number;
    endIndex: number;
    wickToBodyRatio: number;
    isValid: boolean; // Must be >70% body
  };
  basePhase: {
    startIndex: number;
    endIndex: number;
    wickToBodyRatio: number;
    isValid: boolean; // Must be <25% body
  };
  rallyPhase2: {
    startIndex: number;
    endIndex: number;
    wickToBodyRatio: number;
    isValid: boolean; // Must be >70% body
  };
  overallValid: boolean;
}

export interface EnhancedRocketmanDetection {
  startIndex: number;
  endIndex: number;
  direction: 'BULLISH' | 'BEARISH';
  rocketType: RocketType;
  rbrStructure: RBRStructure;
  confidence: number;
  accelerationRate: number;
  wickBodyCompliance: boolean;
  rbrCompliance: boolean;
}

/**
 * Calculate wick-to-body ratio for a candle
 * DICK O'LEARY COMPLIANCE: Uses HA candles for smoother analysis
 */
function calculateWickToBodyRatio(candle: Candle): number {
  const haCandles = convertToHeikinAshi([candle]);
  const ha = haCandles[0];
  
  const bodySize = Math.abs(ha.close - ha.open);
  const totalSize = ha.high - ha.low;
  
  if (totalSize === 0) return 0;
  
  const wickSize = totalSize - bodySize;
  return (wickSize / totalSize) * 100;
}

/**
 * Validate Rally-Base-Rally structure according to Dick O'Leary specs
 * Rally phases must have >70% body, Base phase must have <25% body
 */
function validateRBRStructure(candles: Candle[], startIndex: number, endIndex: number): RBRStructure {
  const haCandles = convertToHeikinAshi(candles);
  const segmentLength = endIndex - startIndex + 1;
  
  // Divide into thirds: Rally-Base-Rally
  const rallyLength = Math.floor(segmentLength / 3);
  const baseLength = segmentLength - (2 * rallyLength);
  
  const rally1Start = startIndex;
  const rally1End = rally1Start + rallyLength - 1;
  const baseStart = rally1End + 1;
  const baseEnd = baseStart + baseLength - 1;
  const rally2Start = baseEnd + 1;
  const rally2End = endIndex;
  
  // Calculate average wick-to-body ratios for each phase
  const rally1Ratio = calculatePhaseWickRatio(haCandles, rally1Start, rally1End);
  const baseRatio = calculatePhaseWickRatio(haCandles, baseStart, baseEnd);
  const rally2Ratio = calculatePhaseWickRatio(haCandles, rally2Start, rally2End);
  
  const rbrStructure: RBRStructure = {
    rallyPhase: {
      startIndex: rally1Start,
      endIndex: rally1End,
      wickToBodyRatio: rally1Ratio,
      isValid: rally1Ratio < 30 // >70% body = <30% wick
    },
    basePhase: {
      startIndex: baseStart,
      endIndex: baseEnd,
      wickToBodyRatio: baseRatio,
      isValid: baseRatio > 75 // <25% body = >75% wick
    },
    rallyPhase2: {
      startIndex: rally2Start,
      endIndex: rally2End,
      wickToBodyRatio: rally2Ratio,
      isValid: rally2Ratio < 30 // >70% body = <30% wick
    },
    overallValid: false
  };
  
  rbrStructure.overallValid = 
    rbrStructure.rallyPhase.isValid && 
    rbrStructure.basePhase.isValid && 
    rbrStructure.rallyPhase2.isValid;
  
  return rbrStructure;
}

/**
 * Calculate average wick-to-body ratio for a phase
 */
function calculatePhaseWickRatio(haCandles: Candle[], startIndex: number, endIndex: number): number {
  let totalRatio = 0;
  let candleCount = 0;
  
  for (let i = startIndex; i <= endIndex && i < haCandles.length; i++) {
    totalRatio += calculateWickToBodyRatio(haCandles[i]);
    candleCount++;
  }
  
  return candleCount > 0 ? totalRatio / candleCount : 0;
}

/**
 * Classify rocket type based on performance metrics
 * GOLD: High acceleration + RBR compliance + high confidence
 * SILVER: Medium acceleration + RBR compliance
 * BRONZE: Low acceleration + RBR compliance
 * RUBY: High acceleration but no RBR compliance (rare pattern)
 */
function classifyRocketType(
  acceleration: number,
  rbrCompliance: boolean,
  confidence: number
): RocketType {
  if (rbrCompliance) {
    if (acceleration > 0.05 && confidence > 0.8) return 'GOLD';
    if (acceleration > 0.03 && confidence > 0.6) return 'SILVER';
    return 'BRONZE';
  } else {
    // Non-RBR compliant but high acceleration
    if (acceleration > 0.08 && confidence > 0.9) return 'RUBY';
    return 'BRONZE'; // Default for non-compliant
  }
}

/**
 * Enhanced Rocketman detection with RBR structure validation
 * ADDRESSES AUDIT FINDINGS: Implements RBR validation, wick/body ratios, type classification
 */
export function detectEnhancedRocketman(candles: Candle[]): EnhancedRocketmanDetection[] {
  logDebug('DEBUG_PATTERN_DETECT', '[Enhanced Rocketman] Starting RBR-compliant detection');
  
  if (!candles || candles.length < 9) { // Minimum for RBR structure
    return [];
  }
  
  const haCandles = convertToHeikinAshi(candles);
  const detections: EnhancedRocketmanDetection[] = [];
  
  // Scan for acceleration patterns with minimum RBR length
  for (let i = 0; i < haCandles.length - 8; i++) {
    for (let j = i + 8; j < Math.min(i + 20, haCandles.length); j++) {
      const segment = haCandles.slice(i, j + 1);
      
      // Calculate acceleration
      const startPrice = segment[0].close;
      const endPrice = segment[segment.length - 1].close;
      const priceChange = (endPrice - startPrice) / startPrice;
      const timeSpan = j - i + 1;
      const acceleration = Math.abs(priceChange) / timeSpan;
      
      // Validate RBR structure
      const rbrStructure = validateRBRStructure(haCandles, i, j);
      
      // Calculate confidence based on price movement and volume
      const avgVolume = segment.reduce((sum, c) => sum + c.volume, 0) / segment.length;
      const volumeConfirmation = avgVolume > 0 ? 1 : 0;
      const confidence = Math.min(1, acceleration * 10 + volumeConfirmation * 0.2);
      
      // Classify rocket type
      const rocketType = classifyRocketType(acceleration, rbrStructure.overallValid, confidence);
      
      // Only accept patterns with minimum acceleration
      if (acceleration > 0.02) {
        const detection: EnhancedRocketmanDetection = {
          startIndex: i,
          endIndex: j,
          direction: priceChange > 0 ? 'BULLISH' : 'BEARISH',
          rocketType,
          rbrStructure,
          confidence,
          accelerationRate: acceleration,
          wickBodyCompliance: rbrStructure.rallyPhase.isValid && rbrStructure.rallyPhase2.isValid,
          rbrCompliance: rbrStructure.overallValid
        };
        
        detections.push(detection);
        
        logDebug('DEBUG_PATTERN_DETECT', '[Enhanced Rocketman] RBR Pattern detected:', {
          startIndex: i,
          endIndex: j,
          rocketType,
          rbrCompliance: rbrStructure.overallValid,
          wickBodyCompliance: detection.wickBodyCompliance,
          rallyPhase1Ratio: rbrStructure.rallyPhase.wickToBodyRatio.toFixed(1),
          basePhaseRatio: rbrStructure.basePhase.wickToBodyRatio.toFixed(1),
          rallyPhase2Ratio: rbrStructure.rallyPhase2.wickToBodyRatio.toFixed(1),
          acceleration: acceleration.toFixed(4),
          confidence: confidence.toFixed(2)
        });
      }
    }
  }
  
  logDebug('DEBUG_PATTERN_DETECT', '[Enhanced Rocketman] RBR Detection complete:', {
    totalDetections: detections.length,
    rbrCompliant: detections.filter(d => d.rbrCompliance).length,
    goldRockets: detections.filter(d => d.rocketType === 'GOLD').length,
    silverRockets: detections.filter(d => d.rocketType === 'SILVER').length,
    bronzeRockets: detections.filter(d => d.rocketType === 'BRONZE').length,
    rubyRockets: detections.filter(d => d.rocketType === 'RUBY').length
  });
  
  return detections;
}
