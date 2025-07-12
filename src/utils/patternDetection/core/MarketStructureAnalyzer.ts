// src/utils/patternDetection/core/MarketStructureAnalyzer.ts
// Analyzes market structure and provides context for pattern detection
// NOTE: TriSight uses Canvas, not SVG. Supports DEBUG_PATTERN_DETECT channel via logDebug.

import { CandlestickData, Timeframe } from '../../../models/ChartTypes';
import { 
  MarketContext, 
  MarketStructure, 
  MarketPhase, 
  MarketTrend,
  Channel,
  PriceLevel,
  VolumeProfile
} from './MarketContext';
import { logDebug } from '../../debug';

/**
 * Configuration options for market structure analysis
 */
export interface AnalysisOptions {
  timeframe: Timeframe;
  lookbackPeriods: number;
  channelDetectionSensitivity: number; // 0.0 to 1.0, higher = more channels detected
  volatilityWindowSize: number;
  minChannelTouches: number;
  detectVolatilityChannels: boolean;
  detectRegressionChannels: boolean;
  detectSwingChannels: boolean;
}

/**
 * Default analysis options
 */
const DEFAULT_ANALYSIS_OPTIONS: AnalysisOptions = {
  timeframe: '1min',
  lookbackPeriods: 200,
  channelDetectionSensitivity: 0.6,
  volatilityWindowSize: 20,
  minChannelTouches: 2,
  detectVolatilityChannels: true,
  detectRegressionChannels: true,
  detectSwingChannels: true
};

/**
 * Analyzes market data to identify market structure including channels,
 * support/resistance levels, and current market context
 */
export class MarketStructureAnalyzer {
  private currentStructure: MarketStructure | null = null;
  private previousStructure: MarketStructure | null = null;
  private options: AnalysisOptions;
  
  constructor(options: Partial<AnalysisOptions> = {}) {
    this.options = { ...DEFAULT_ANALYSIS_OPTIONS, ...options };
  }
  
  /**
   * Analyzes market data to create a comprehensive market context
   */
  public analyzeContext(data: CandlestickData[]): MarketContext {
    if (data.length === 0) {
      throw new Error('Cannot analyze empty data array');
    }
    
    logDebug('DEBUG_PATTERN_DETECT', `Analyzing market structure on ${data.length} candles`);
    
    // Update market structure
    this.previousStructure = this.currentStructure;
    this.currentStructure = this.analyzeMarketStructure(data);
    
    // Calculate volatility for adaptive thresholds
    const volatility = this.currentStructure.volatility;
    
    // Create the full market context
    return {
      activeChannels: this.currentStructure.channels,
      channelWidthPercentage: this.currentStructure.averageChannelWidth,
      currentPositionInChannel: this.currentStructure.currentPriceLocation.relativeToChannels,
      breakoutPotential: this.calculateBreakoutPotential(data, this.currentStructure),
      
      structure: this.currentStructure,
      
      timeframe: this.options.timeframe,
      volatility,
      volumeProfile: this.analyzeVolumeProfile(data),
      
      phase: this.currentStructure.currentPhase,
      
      detectedPatternDensity: new Map(),
      recentPatterns: [],
      
      // Implement the getVolatilityFactor method for adaptive thresholds
      getVolatilityFactor: function() {
        // Scale volatility to a reasonable factor between 0.5 and 2.0
        // Higher volatility = higher factor = wider thresholds
        const baseVolatility = 0.01; // 1% as a baseline normal volatility
        const volatilityRatio = this.volatility / baseVolatility;
        return Math.max(0.5, Math.min(2.0, volatilityRatio));
      }
    };
  }
  
  /**
   * Analyzes the market structure including channels and price levels
   */
  private analyzeMarketStructure(data: CandlestickData[]): MarketStructure {
    // Detect channels using multiple methods
    const channels: Channel[] = [];
    
    if (this.options.detectRegressionChannels) {
      channels.push(...this.detectRegressionChannels(data));
    }
    
    if (this.options.detectSwingChannels) {
      channels.push(...this.detectSwingChannels(data));
    }
    
    if (this.options.detectVolatilityChannels) {
      channels.push(...this.detectVolatilityChannels(data));
    }
    
    // Merge overlapping channels and sort by significance
    const mergedChannels = this.mergeOverlappingChannels(channels);
    const significantChannels = this.filterSignificantChannels(mergedChannels);
    
    // Extract key price levels
    const priceLevels = this.extractKeyLevels(data, significantChannels);
    
    // Calculate average channel width as percentage
    const currentPrice = data[data.length - 1].close;
    const averageWidth = significantChannels.length > 0 
      ? significantChannels.reduce((sum, ch) => sum + ch.widthPercentage, 0) / significantChannels.length
      : 0;
    
    // Determine current price location relative to primary channel
    const primaryChannel = significantChannels.length > 0 ? significantChannels[0] : null;
    const relativePosition = primaryChannel 
      ? (currentPrice - primaryChannel.lowerBoundary) / (primaryChannel.upperBoundary - primaryChannel.lowerBoundary)
      : 0.5;
    
    // Find nearest price level
    const nearestLevel = this.findNearestPriceLevel(currentPrice, priceLevels);
    const distanceToLevel = nearestLevel 
      ? Math.abs(nearestLevel.price - currentPrice) / currentPrice * 100
      : 100;
    
    return {
      channels: significantChannels,
      priceLevels,
      currentPhase: this.determineMarketPhase(data, significantChannels, this.previousStructure),
      trend: this.determineMarketTrend(data),
      volatility: this.calculateVolatility(data),
      averageChannelWidth: averageWidth,
      currentPriceLocation: {
        relativeToChannels: relativePosition,
        nearestLevel: nearestLevel!,
        distanceToNearestLevel: distanceToLevel
      }
    };
  }
  
  /**
   * Detects channels using linear regression on local highs and lows
   */
  private detectRegressionChannels(data: CandlestickData[]): Channel[] {
    logDebug('DEBUG_PATTERN_DETECT', 'Detecting regression-based channels');
    
    const channels: Channel[] = [];
    // Implementation of regression-based channel detection
    // This would use linear regression on swing highs and lows
    // For now, return empty array as placeholder
    
    // This implementation would include:
    // 1. Identifying local highs and lows
    // 2. Running linear regression on upper and lower bounds
    // 3. Measuring channel quality and assigning confidence scores
    
    return channels;
  }
  
  /**
   * Detects channels based on swing highs and lows
   */
  private detectSwingChannels(data: CandlestickData[]): Channel[] {
    logDebug('DEBUG_PATTERN_DETECT', 'Detecting swing-based channels');
    
    const channels: Channel[] = [];
    // Implementation of swing-based channel detection
    // This would analyze swing highs and lows to identify parallel structures
    // For now, return empty array as placeholder
    
    // This implementation would include:
    // 1. Finding significant swing highs and lows
    // 2. Identifying parallel structures
    // 3. Validating channel quality with touch points
    
    return channels;
  }
  
  /**
   * Detects channels based on volatility bands (similar to Bollinger Bands)
   */
  private detectVolatilityChannels(data: CandlestickData[]): Channel[] {
    logDebug('DEBUG_PATTERN_DETECT', 'Detecting volatility-based channels');
    
    const channels: Channel[] = [];
    // Implementation of volatility-based channel detection
    // This would use moving averages with standard deviation bands
    // For now, return empty array as placeholder
    
    // This implementation would include:
    // 1. Calculating moving averages
    // 2. Adding standard deviation bands
    // 3. Identifying periods where price respects these bands as channels
    
    return channels;
  }
  
  /**
   * Merges overlapping channels to prevent duplication
   */
  private mergeOverlappingChannels(channels: Channel[]): Channel[] {
    if (channels.length <= 1) return channels;
    
    // Implementation of channel merging logic
    // For now, just return the input channels as placeholder
    
    // This implementation would include:
    // 1. Sorting channels by time period
    // 2. Detecting significant overlap between channels
    // 3. Merging overlapping channels with weighted averaging
    
    return channels;
  }
  
  /**
   * Filters channels by significance, keeping only the most important ones
   */
  private filterSignificantChannels(channels: Channel[]): Channel[] {
    if (channels.length === 0) return [];
    
    // Sort by confidence and significance
    const sortedChannels = [...channels].sort((a, b) => 
      (b.confidence * b.strength) - (a.confidence * a.strength)
    );
    
    // Keep only the top channels based on sensitivity setting
    const numToKeep = Math.max(1, Math.ceil(sortedChannels.length * this.options.channelDetectionSensitivity));
    return sortedChannels.slice(0, numToKeep);
  }
  
  /**
   * Extracts key price levels from channels and price history
   */
  private extractKeyLevels(data: CandlestickData[], channels: Channel[]): PriceLevel[] {
    const levels: PriceLevel[] = [];
    // Implementation of price level extraction
    // For now, return empty array as placeholder
    
    // This implementation would include:
    // 1. Using channel boundaries as potential levels
    // 2. Identifying historical support/resistance zones
    // 3. Clustering and deduplicating similar levels
    
    return levels;
  }
  
  /**
   * Determines the current market phase based on channel analysis
   */
  private determineMarketPhase(
    data: CandlestickData[], 
    channels: Channel[],
    previousStructure: MarketStructure | null
  ): MarketPhase {
    if (channels.length === 0) {
      return MarketPhase.BETWEEN_CHANNELS;
    }
    
    // Default to continuation if we have channels but can't determine phase
    return MarketPhase.CHANNEL_CONTINUATION;
  }
  
  /**
   * Determines the overall market trend
   */
  private determineMarketTrend(data: CandlestickData[]): MarketTrend {
    if (data.length < 10) {
      return MarketTrend.NEUTRAL;
    }
    
    // Simple trend calculation placeholder
    // Would be replaced with a more sophisticated trend calculation
    return MarketTrend.NEUTRAL;
  }
  
  /**
   * Calculates market volatility over specified period
   */
  private calculateVolatility(data: CandlestickData[]): number {
    if (data.length <= this.options.volatilityWindowSize) {
      return 0;
    }
    
    // Simple volatility calculation - standard deviation of returns
    const window = data.slice(-this.options.volatilityWindowSize);
    const returns: number[] = [];
    
    for (let i = 1; i < window.length; i++) {
      const percentChange = (window[i].close - window[i-1].close) / window[i-1].close * 100;
      returns.push(percentChange);
    }
    
    // Calculate standard deviation
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }
  
  /**
   * Analyzes volume characteristics
   */
  private analyzeVolumeProfile(data: CandlestickData[]): VolumeProfile {
    if (data.length === 0) {
      return {
        averageVolume: 0,
        volumeTrend: 'FLAT',
        relativeVolume: 1.0,
        volumeSpikes: []
      };
    }
    
    // Calculate average volume
    const volumes = data.map(d => d.volume);
    const averageVolume = volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length;
    
    // Determine volume trend
    const recentVolumes = volumes.slice(-10);
    const recentAvg = recentVolumes.reduce((sum, vol) => sum + vol, 0) / recentVolumes.length;
    
    let volumeTrend: 'INCREASING' | 'DECREASING' | 'FLAT' = 'FLAT';
    if (recentAvg > averageVolume * 1.2) {
      volumeTrend = 'INCREASING';
    } else if (recentAvg < averageVolume * 0.8) {
      volumeTrend = 'DECREASING';
    }
    
    // Check for volume spikes
    const spikes: { timestamp: number; volume: number }[] = [];
    for (let i = 0; i < data.length; i++) {
      if (data[i].volume > averageVolume * 2) {
        spikes.push({
          timestamp: data[i].timestamp,
          volume: data[i].volume
        });
      }
    }
    
    return {
      averageVolume,
      volumeTrend,
      relativeVolume: data[data.length - 1].volume / averageVolume,
      volumeSpikes: spikes
    };
  }
  
  /**
   * Finds the nearest price level to the current price
   */
  private findNearestPriceLevel(currentPrice: number, levels: PriceLevel[]): PriceLevel | null {
    if (levels.length === 0) return null;
    
    let nearestLevel = levels[0];
    let minDistance = Math.abs(currentPrice - levels[0].price);
    
    for (let i = 1; i < levels.length; i++) {
      const distance = Math.abs(currentPrice - levels[i].price);
      if (distance < minDistance) {
        minDistance = distance;
        nearestLevel = levels[i];
      }
    }
    
    return nearestLevel;
  }
  
  /**
   * Calculates the potential for a channel breakout
   */
  private calculateBreakoutPotential(data: CandlestickData[], structure: MarketStructure): number {
    if (structure.channels.length === 0) {
      return 0.5; // Neutral when no channels exist
    }
    
    const primaryChannel = structure.channels[0];
    const currentPrice = data[data.length - 1].close;
    
    // Distance from channel boundaries as percentage of channel width
    const channelWidth = primaryChannel.upperBoundary - primaryChannel.lowerBoundary;
    const distanceToUpper = primaryChannel.upperBoundary - currentPrice;
    const distanceToLower = currentPrice - primaryChannel.lowerBoundary;
    
    // Normalize distances as percentage of channel width
    const normalizedDistanceToUpper = distanceToUpper / channelWidth;
    const normalizedDistanceToLower = distanceToLower / channelWidth;
    
    // Higher potential when price is near a boundary
    const minNormalizedDistance = Math.min(normalizedDistanceToUpper, normalizedDistanceToLower);
    
    // Increase potential further if price is near upper boundary and trend is up
    // or near lower boundary and trend is down (i.e., aligned with trend)
    let trendAlignmentBonus = 0;
    if (normalizedDistanceToUpper < normalizedDistanceToLower && 
        [MarketTrend.WEAK_UPTREND, MarketTrend.MODERATE_UPTREND, MarketTrend.STRONG_UPTREND].includes(structure.trend)) {
      trendAlignmentBonus = 0.2;
    } else if (normalizedDistanceToLower < normalizedDistanceToUpper && 
        [MarketTrend.WEAK_DOWNTREND, MarketTrend.MODERATE_DOWNTREND, MarketTrend.STRONG_DOWNTREND].includes(structure.trend)) {
      trendAlignmentBonus = 0.2;
    }
    
    // Scale the result to [0, 1] range, inversely proportional to distance from boundary
    // Closer to boundary = higher breakout potential
    return Math.min(1, Math.max(0, 1 - (minNormalizedDistance * 5) + trendAlignmentBonus));
  }
}
