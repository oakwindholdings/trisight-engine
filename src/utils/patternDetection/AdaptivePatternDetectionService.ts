import { CandlestickData, Timeframe } from '../../models/ChartTypes';
import { Pattern, PatternType } from '../../models/PatternTypes';
import { PatternDetectionFactory } from './core/PatternDetectionFactory';
import { PatternDetectionOrchestrator, PatternDetectionResult } from './core/PatternDetectionOrchestrator';
import { DetectionOptions } from './core/BasePatternDetector';
import { MarketContext } from './core/MarketContext';
import { filterTradingHoursData } from '../marketHours';

// Storage keys for pattern detection preferences
const STORAGE_KEY_DETECTION_SETTINGS = 'trisight_detection_settings';
const STORAGE_KEY_PATTERN_FILTERS = 'trisight_pattern_filters';

/**
 * BlackJack pattern detection options
 */
export interface BlackjackDetectionOptions {
  enabled: boolean;
  lookbackPeriods: number;
  minScore: number;
  useContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
}

/**
 * Escalator pattern detection options
 */
export interface EscalatorDetectionOptions {
  enabled: boolean;
  minSteps: number;
  minStepSize: number;
  maxConsolidationVolatility: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
  useContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  minScore: number;
  preferredDirection: string; // 'BULLISH', 'BEARISH', or 'BOTH'
}

/**
 * Pivot pattern detection options
 */
export interface PivotDetectionOptions {
  touchPointThreshold: number;
  priceTolerance: number;
  confidenceThreshold: number;
  volumeReactionThreshold: number;
  minimumTouchGap: number;
  detectSupport: boolean;
  detectResistance: boolean;
}

/**
 * Goldmine Channel pattern detection options
 */
export interface GoldmineChannelDetectionOptions {
  enabled: boolean;
  minTouchPoints: number;
  priceTolerance: number;
  minChannelHeight: number;
  minChannelDuration: number;
  confidenceThreshold: number;
  preferredDirection: string; // 'HORIZONTAL', 'ASCENDING', 'DESCENDING', or 'ALL'
}

/**
 * Goldmine Shaft pattern detection options
 */
export interface GoldmineShaftDetectionOptions {
  enabled: boolean;
  minThrustMagnitude: number;
  minRetracementPercentage: number;
  maxRetracementPercentage: number;
  thrustDurationRange: [number, number];
  preferredDirection: string; // 'BULLISH', 'BEARISH', or 'BOTH'
  confidenceThreshold: number;
}

/**
 * Rocketman pattern detection options
 */
export interface RocketmanDetectionOptions {
  enabled: boolean;
  minAccelerationRate: number;
  minIntensity: number;
  minMomentumScore: number;
  minVolumeConfirmation: number;
  lookbackPeriods: number;
  preferredDirection: string; // 'BULLISH', 'BEARISH', or 'BOTH'
}

/**
 * Additional pattern-specific detection options
 */
export interface AdditionalPatternOptions {
  blackjack?: BlackjackDetectionOptions;
  escalator?: EscalatorDetectionOptions;
  pivot?: PivotDetectionOptions;
  goldmineChannel?: GoldmineChannelDetectionOptions;
  goldmineShaft?: GoldmineShaftDetectionOptions;
  rocketman?: RocketmanDetectionOptions;
}

/**
 * User preferences for pattern detection
 */
export interface PatternDetectionPreferences {
  enabledPatternTypes: PatternType[];
  minimumConfidence: number;
  adaptiveThresholds: boolean;
  showOnlyTradingHours: boolean;
  diagnosticsEnabled: boolean;
  lastSelectedDate?: string;
  additionalOptions?: AdditionalPatternOptions;
}

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: PatternDetectionPreferences = {
  enabledPatternTypes: Object.values(PatternType),
  minimumConfidence: 0.4,
  adaptiveThresholds: true,
  showOnlyTradingHours: true,
  diagnosticsEnabled: false,
  additionalOptions: {
    blackjack: {
      enabled: true,
      lookbackPeriods: 7,
      minScore: 2,
      useContextTimeframe: true,
      contextTimeframeMultiplier: 5,
      basePriceChangeThreshold: 0.1,
      baseVolumeChangeThreshold: 0.5
    },
    escalator: {
      enabled: true,
      minSteps: 3,
      minStepSize: 0.5,
      maxConsolidationVolatility: 1.0,
      basePriceChangeThreshold: 0.01,
      baseVolumeChangeThreshold: 0.05,
      useContextTimeframe: true,
      contextTimeframeMultiplier: 3,
      minScore: 2.0,
      preferredDirection: 'BOTH'
    },
    pivot: {
      touchPointThreshold: 3,
      priceTolerance: 0.3,
      confidenceThreshold: 0.6,
      volumeReactionThreshold: 1.2,
      minimumTouchGap: 3,
      detectSupport: true,
      detectResistance: true
    }
  }
};

/**
 * Service for integrating the adaptive pattern detection system
 * with the TriSight application
 */
export class AdaptivePatternDetectionService {
  private orchestrator: PatternDetectionOrchestrator;
  private preferences: PatternDetectionPreferences;
  private lastDetectionResult: PatternDetectionResult | null = null;
  
  constructor() {
    // Load saved preferences
    this.preferences = this.loadPreferences();
    
    // Create pattern detection orchestrator
    this.orchestrator = PatternDetectionFactory.createOrchestrator({
      enabledPatternTypes: this.preferences.enabledPatternTypes,
      logPerformance: this.preferences.diagnosticsEnabled,
      detectorOptions: this.createDetectorOptions()
    });
    
    console.log('Adaptive Pattern Detection Service initialized');
    console.log('Enabled patterns:', this.preferences.enabledPatternTypes);
  }
  
  /**
   * Detect patterns in the provided market data
   */
  public detectPatterns(data: CandlestickData[]): Pattern[] {
    // Apply trading hours filter if enabled
    const filteredData = this.preferences.showOnlyTradingHours 
      ? filterTradingHoursData(data)
      : data;
    
    if (filteredData.length === 0) {
      console.warn('No data available for pattern detection after filtering');
      return [];
    }
    
    // Run the full pattern detection
    console.log(`Detecting patterns in ${filteredData.length} candles`);
    
    // Time the detection process
    const startTime = performance.now();
    this.lastDetectionResult = this.orchestrator.detectPatterns(filteredData);
    const elapsedTime = performance.now() - startTime;
    
    console.log(`Pattern detection completed in ${elapsedTime.toFixed(2)}ms`);
    console.log(`Detected ${this.lastDetectionResult.patterns.length} total patterns`);
    
    // Return the detected patterns
    return this.lastDetectionResult.patterns;
  }
  
  /**
   * Get patterns of a specific type from the last detection result
   */
  public getPatternsByType(type: PatternType): Pattern[] {
    if (!this.lastDetectionResult) {
      return [];
    }
    
    return this.lastDetectionResult.patternsByType[type] || [];
  }
  
  /**
   * Get detection statistics from the last detection run
   */
  public getDetectionStatistics() {
    return this.lastDetectionResult?.statistics || {};
  }
  
  /**
   * Get the market context from the last detection
   */
  public getMarketContext(): MarketContext | null {
    return this.lastDetectionResult?.context || null;
  }
  
  /**
   * Get the current preferences
   */
  public getPreferences(): PatternDetectionPreferences {
    return { ...this.preferences };
  }
  
  /**
   * Update user preferences for pattern detection
   */
  public updatePreferences(preferences: Partial<PatternDetectionPreferences>): void {
    // Update preferences
    this.preferences = { ...this.preferences, ...preferences };
    
    // Save to localStorage
    this.savePreferences();
    
    // Update orchestrator with new settings
    this.orchestrator = PatternDetectionFactory.createOrchestrator({
      enabledPatternTypes: this.preferences.enabledPatternTypes,
      logPerformance: this.preferences.diagnosticsEnabled,
      detectorOptions: this.createDetectorOptions()
    });
    
    console.log('Pattern detection preferences updated', this.preferences);
  }
  
  /**
   * Toggle pattern type visibility
   */
  public togglePatternType(type: PatternType, enabled: boolean): void {
    const enabledTypes = [...this.preferences.enabledPatternTypes];
    
    if (enabled && !enabledTypes.includes(type)) {
      enabledTypes.push(type);
    } else if (!enabled) {
      const index = enabledTypes.indexOf(type);
      if (index >= 0) {
        enabledTypes.splice(index, 1);
      }
    }
    
    this.updatePreferences({ enabledPatternTypes: enabledTypes });
  }
  
  /**
   * Save the selected date
   */
  public saveSelectedDate(date: Date): void {
    this.preferences.lastSelectedDate = date.toISOString();
    this.savePreferences();
  }
  
  /**
   * Get the last selected date
   */
  public getLastSelectedDate(): Date | null {
    if (!this.preferences.lastSelectedDate) {
      return null;
    }
    
    try {
      return new Date(this.preferences.lastSelectedDate);
    } catch (e) {
      console.error('Error parsing saved date:', e);
      return null;
    }
  }
  
  /**
   * Create detector options based on preferences
   */
  private createDetectorOptions(): Record<PatternType, Partial<DetectionOptions>> {
    const options: Partial<Record<PatternType, Partial<DetectionOptions>>> = {};
    
    // Apply common options to all detectors
    Object.values(PatternType).forEach(type => {
      options[type] = {
        minimumConfidence: this.preferences.minimumConfidence,
        adaptiveThresholds: this.preferences.adaptiveThresholds,
        enableLogging: this.preferences.diagnosticsEnabled
      };
    });
    
    // Apply BlackJack specific options if available
    if (this.preferences.additionalOptions?.blackjack && 
        this.preferences.additionalOptions.blackjack.enabled) {
      options[PatternType.BLACKJACK] = {
        ...options[PatternType.BLACKJACK],
        ...this.preferences.additionalOptions.blackjack
      };
    }
    
    // Apply Escalator specific options if available
    if (this.preferences.additionalOptions?.escalator && 
        this.preferences.additionalOptions.escalator.enabled) {
      options[PatternType.ESCALATOR] = {
        ...options[PatternType.ESCALATOR],
        ...this.preferences.additionalOptions.escalator
      };
    }
    
    // Apply Pivot specific options if available
    if (this.preferences.additionalOptions?.pivot) {
      options[PatternType.PIVOT] = {
        ...options[PatternType.PIVOT],
        ...this.preferences.additionalOptions.pivot
      };
    }
    
    return options as Record<PatternType, Partial<DetectionOptions>>;
  }
  
  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): PatternDetectionPreferences {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DETECTION_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (e) {
      console.error('Error loading pattern detection preferences:', e);
    }
    
    return { ...DEFAULT_PREFERENCES };
  }
  
  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY_DETECTION_SETTINGS, 
        JSON.stringify(this.preferences)
      );
    } catch (e) {
      console.error('Error saving pattern detection preferences:', e);
    }
  }
}
