// src/utils/trading/TradeActionSignal.ts
// TriSight Universal TradeAction Signal Framework v1.0.0
// Standardizes actionable BUY/SELL/SHORT/COVER signals across all patterns

/**
 * TradeAction enum defining the four core trading actions
 */
export enum TradeAction {
  BUY = 'BUY',
  SELL = 'SELL', 
  SHORT = 'SHORT',
  COVER = 'COVER',
  TRADE_BIAS = 'TRADE_BIAS'
}

/**
 * SignalType enum defining entry/exit classification
 */
export enum SignalType {
  LONG_ENTRY = 'LONG_ENTRY',
  LONG_EXIT = 'LONG_EXIT',
  SHORT_ENTRY = 'SHORT_ENTRY', 
  SHORT_EXIT = 'SHORT_EXIT',
  BIAS_LONG = 'BIAS_LONG',
  BIAS_SHORT = 'BIAS_SHORT'
}

/**
 * Standardized signal object emitted by all pattern detectors for actionable trading
 */
export interface TradeActionSignal {
  action: TradeAction;
  signalType: SignalType;
  pattern: string;
  ticker?: string; // ← Added for symbol-aware signal tracking
  confidence: number; // 0-1 range
  price: number;
  timestamp: Date;
  reason?: string;
  
  // Additional metadata for enhanced decision making
  candleIndex?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  positionSize?: number;
  stopLoss?: number;
  targetPrice?: number;
  
  // TriSight Calculation Fields (Dick O'Leary Formulas)
  escalatorStepCount?: number;      // Acceleration: Escalator Step Count
  blackjackTrailing5?: number;      // Intrinsic Strength: Blackjack Trailing 5
  blackjackScore?: number;          // Current Blackjack score (+/-)
  blackjackContinuanceScore?: number; // Relative Strength: Blackjack Continuance Score
  fiveDayGain?: number;             // 5-day percentage gain
  tenDayGain?: number;              // 10-day percentage gain
  triSightRating?: number;          // Calculated TriSight Rating (0-100)
  successProfile?: number;          // TriSight Conviction Rating (AI Calculation)
  acceleration?: number;            // Escalator Step Count
  intrinsicStrength?: number;       // Blackjack Trailing 5
  momentum?: number;                // sum(5 Day % Gain + 10 Day % Gain)/2
  relativeStrength?: number;        // Blackjack Continuance Score
  goldenCandle?: number;            // Step Breakout Candle indicator (0/1)
}

/**
 * TradeActionBus - Central collection point for all trade signals
 */
class TradeActionBusClass {
  private signals: TradeActionSignal[] = [];
  private listeners: ((signal: TradeActionSignal) => void)[] = [];

  push(signal: TradeActionSignal): void {
    this.signals.push(signal);
    
    // Debug logging for signal emission validation
    console.log(`[TradeActionBus-Class] Signal pushed:`, {
      action: signal.action,
      pattern: signal.pattern,
      price: signal.price,
      timestamp: signal.timestamp,
      confidence: signal.confidence,
      totalSignals: this.signals.length
    });
    
    this.notifyListeners(signal);
  }

  getSignals(): TradeActionSignal[] {
    console.log(`[TradeActionBus-Class] getSignals() called, returning ${this.signals.length} signals`);
    return [...this.signals];
  }

  getLatestSignal(): TradeActionSignal | null {
    return this.signals.length > 0 ? this.signals[this.signals.length - 1] : null;
  }

  addListener(callback: (signal: TradeActionSignal) => void): void {
    this.listeners.push(callback);
  }

  clear(): void {
    this.signals = [];
  }

  private notifyListeners(signal: TradeActionSignal): void {
    this.listeners.forEach(listener => listener(signal));
  }
}

export const TradeActionBus = new TradeActionBusClass();

/**
 * Debug mode check
 */
const DEBUG_MODE = process.env.NODE_ENV === 'development';

/**
 * Debug logging utility
 */
function logDebug(channel: string, ...args: any[]): void {
  if (DEBUG_MODE) {
    console.log(`[${channel}]`, ...args);
  }
}

/**
 * Emits a standardized TradeActionSignal for rendering, logging, and execution
 * @param action - The trading action (BUY/SELL/SHORT/COVER)
 * @param signalType - The signal classification (LONG_ENTRY/LONG_EXIT/SHORT_ENTRY/SHORT_EXIT)
 * @param pattern - The pattern name that generated the signal
 * @param confidence - Confidence level (0-1)
 * @param price - Execution price
 * @param timestamp - Signal timestamp
 * @param reason - Optional reason/explanation
 * @param metadata - Additional signal metadata
 */
export function emitTradeSignal(
  action: TradeAction,
  signalType: SignalType,
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  const signal: TradeActionSignal = {
    action,
    signalType,
    pattern,
    confidence: Math.max(0, Math.min(1, confidence)), // Clamp to 0-1
    price,
    timestamp,
    reason,
    ...metadata
  };

  TradeActionBus.push(signal);

  if (DEBUG_MODE) {
    logDebug('TRADE_SIGNAL', `${action} @ ${price.toFixed(2)} (${(confidence * 100).toFixed(1)}%) via ${pattern}${reason ? ` - ${reason}` : ''}`);
  }

  return signal;
}

/**
 * Helper function to create LONG entry signal (BUY)
 */
export function emitBuySignal(
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  return emitTradeSignal(
    TradeAction.BUY,
    SignalType.LONG_ENTRY,
    pattern,
    confidence,
    price,
    timestamp,
    reason,
    metadata
  );
}

/**
 * Helper function to create LONG exit signal (SELL)
 */
export function emitSellSignal(
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  return emitTradeSignal(
    TradeAction.SELL,
    SignalType.LONG_EXIT,
    pattern,
    confidence,
    price,
    timestamp,
    reason,
    metadata
  );
}

/**
 * Helper function to create SHORT entry signal (SHORT)
 */
export function emitShortSignal(
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  return emitTradeSignal(
    TradeAction.SHORT,
    SignalType.SHORT_ENTRY,
    pattern,
    confidence,
    price,
    timestamp,
    reason,
    metadata
  );
}

/**
 * Helper function to create SHORT exit signal (COVER)
 */
export function emitCoverSignal(
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  return emitTradeSignal(
    TradeAction.COVER,
    SignalType.SHORT_EXIT,
    pattern,
    confidence,
    price,
    timestamp,
    reason,
    metadata
  );
}

/**
 * Helper function to create TRADE_BIAS signal (non-executional directional bias)
 */
export function emitTradeBiasSignal(
  pattern: string,
  confidence: number,
  price: number,
  timestamp: Date,
  bias: 'LONG' | 'SHORT',
  reason?: string,
  metadata?: Partial<TradeActionSignal>
): TradeActionSignal {
  return emitTradeSignal(
    TradeAction.TRADE_BIAS,
    bias === 'LONG' ? SignalType.BIAS_LONG : SignalType.BIAS_SHORT,
    pattern,
    confidence,
    price,
    timestamp,
    reason,
    metadata
  );
}

/**
 * Risk assessment helper
 */
export function calculateRiskLevel(confidence: number, volatility?: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  const vol = volatility || 0.5; // Default medium volatility
  
  if (confidence >= 0.8 && vol <= 0.3) return 'LOW';
  if (confidence >= 0.6 && vol <= 0.6) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Position sizing helper based on confidence and risk
 */
export function calculatePositionSize(
  confidence: number,
  accountSize: number,
  riskPerTrade: number = 0.02 // 2% default risk
): number {
  const baseSize = accountSize * riskPerTrade;
  const confidenceMultiplier = Math.max(0.5, confidence); // Minimum 50% of base size
  return baseSize * confidenceMultiplier;
}
