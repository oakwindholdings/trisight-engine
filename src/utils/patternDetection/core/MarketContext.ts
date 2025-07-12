// src/utils/patternDetection/core/MarketContext.ts
// Encapsulates market environment info
// Passed to detectors for thresholds
import { Timeframe } from '../../../models/ChartTypes';
import { PatternType } from '../../../models/PatternTypes';

/**
 * Represents the market phase relative to channel structures
 */
export enum MarketPhase {
  CHANNEL_FORMATION = 'CHANNEL_FORMATION',
  CHANNEL_CONTINUATION = 'CHANNEL_CONTINUATION',
  CHANNEL_EXPANSION = 'CHANNEL_EXPANSION',
  CHANNEL_CONTRACTION = 'CHANNEL_CONTRACTION',
  CHANNEL_BREAKOUT = 'CHANNEL_BREAKOUT',
  BETWEEN_CHANNELS = 'BETWEEN_CHANNELS'
}

/**
 * Represents the overall trend conditions of the market
 */
export enum MarketTrend {
  STRONG_UPTREND = 'STRONG_UPTREND',
  MODERATE_UPTREND = 'MODERATE_UPTREND',
  WEAK_UPTREND = 'WEAK_UPTREND',
  NEUTRAL = 'NEUTRAL',
  WEAK_DOWNTREND = 'WEAK_DOWNTREND',
  MODERATE_DOWNTREND = 'MODERATE_DOWNTREND',
  STRONG_DOWNTREND = 'STRONG_DOWNTREND'
}

/**
 * Describes the volume characteristics of the market
 */
export interface VolumeProfile {
  averageVolume: number;
  volumeTrend: 'INCREASING' | 'DECREASING' | 'FLAT';
  relativeVolume: number; // Current volume relative to average (1.0 = average)
  volumeSpikes: { timestamp: number; volume: number }[]; // Recent volume spikes
}

/**
 * Represents a price channel in the market
 */
export interface Channel {
  startTime: Date;
  endTime: Date;
  upperBoundary: number;
  lowerBoundary: number;
  direction: 'ASCENDING' | 'DESCENDING' | 'HORIZONTAL';
  width: number; // Absolute width in price
  widthPercentage: number; // Width as percentage of current price
  confidence: number; // 0.0 to 1.0
  touchPoints: { time: Date; price: number; isUpper: boolean }[];
  strength: number; // 0.0 to 1.0, based on number of touches and adherence
}

/**
 * Represents a key support or resistance level
 */
export interface PriceLevel {
  price: number;
  strength: number; // 0.0 to 1.0
  type: 'SUPPORT' | 'RESISTANCE';
  touchPoints: { time: Date; price: number }[];
  associatedChannels: Channel[];
}

/**
 * Complete representation of the market structure
 */
export interface MarketStructure {
  channels: Channel[];
  priceLevels: PriceLevel[];
  currentPhase: MarketPhase;
  trend: MarketTrend;
  volatility: number; // Historical volatility measure
  averageChannelWidth: number; // Average width of detected channels (%)
  currentPriceLocation: {
    relativeToChannels: number; // 0 = at bottom of primary channel, 1 = at top
    nearestLevel: PriceLevel;
    distanceToNearestLevel: number; // % distance to nearest level
  };
}

/**
 * Complete context information for adaptive pattern detection
 */
export interface MarketContext {
  // Channel-centric context elements
  activeChannels: Channel[];
  channelWidthPercentage: number; // Channel width as % of price
  currentPositionInChannel: number; // 0 = bottom, 1 = top
  breakoutPotential: number; // 0-1 likelihood of channel breakout
  
  // Market structure
  structure: MarketStructure;
  
  // Traditional elements
  timeframe: Timeframe;
  volatility: number;
  volumeProfile: VolumeProfile;
  
  // Market phase classification
  phase: MarketPhase;
  
  // Detection history
  detectedPatternDensity: Map<PatternType, number>; // Patterns detected per unit time
  recentPatterns: { type: PatternType; confidence: number; time: Date }[];
  
  // Get volatility factor for adaptive thresholds
  getVolatilityFactor(): number;
}

/**
 * Configuration for adaptive thresholds in pattern detection
 */
export interface ThresholdConfig {
  thrustPercentMin: number;
  retracementMin: number;
  retracementMax: number;
  confidenceThreshold: number;
  
  // Additional pattern-specific parameters
  minPatternDuration?: number;
  maxPatternDuration?: number;
  minTouchPoints?: number;
  volumeConfirmationThreshold?: number;
}
