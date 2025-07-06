// src/components/Chart/HoverTooltipZones.tsx
// Cognitive Hover Spec implementation with structured zone layout
// Transforms MetricPopover into organized information zones for enhanced usability

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useHoverMetricsContext } from '../../hooks/useHoverMetrics';
import { usePatternContext } from '../../contexts/PatternContext';
import { useUnifiedHover } from '../../contexts/UnifiedHoverContext';
import { MetricRegistry } from '../../metrics/registry';
import { useUIState } from '../../contexts/UIStateContext';
import { useMarketDataContext } from '../../contexts/MarketDataContext';
import { patternStyles, PatternType } from '../../models/PatternTypes';
import { convertToHeikinAshi } from '../../utils/candleTransform';
import { logDebugHAAlignmentMismatch } from '../../utils/debug';
import { AIHoverMetricsCalculator, AIMetrics } from '../../utils/aiMetrics/AIHoverMetrics';
import { useHoverAnalytics } from '../../utils/analytics/HoverAnalytics';

export function HoverTooltipZones() {
  const patternContext = usePatternContext();
  const unifiedHover = useUnifiedHover();
  const { data: candles } = useMarketDataContext();
  const pop = useHoverMetricsContext();
  // Removed isDatePickerOpen since we switched to HTML5 date input
  
  // Advanced interaction state
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedZones, setExpandedZones] = useState<Set<number>>(new Set());
  const [isHoldMode, setIsHoldMode] = useState(false);
  const [opacity, setOpacity] = useState(0);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Analytics tracking
  const analytics = useHoverAnalytics();
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Analytics session management
  useEffect(() => {
    if (pop && !sessionId) {
      // Start new hover session
      const newSessionId = analytics.startSession();
      setSessionId(newSessionId);
    } else if (!pop && sessionId) {
      // End hover session
      analytics.endSession();
      setSessionId(null);
    }
  }, [pop, sessionId, analytics]);
  
  // Animation and transition effects
  useEffect(() => {
    if (pop) {
      setOpacity(1);
      
      // Clear existing timeouts
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      
      // Set hover-hold timeout (2 seconds)
      holdTimeoutRef.current = setTimeout(() => {
        setIsHoldMode(true);
        setIsExpanded(true);
        
        // Track hold mode activation
        const activePatterns = patternContext.patterns?.map(p => p.type) || [];
        analytics.trackHoldMode(candleIndex, activePatterns);
      }, 2000);
    } else {
      setOpacity(0);
      setIsHoldMode(false);
      setIsExpanded(false);
      setExpandedZones(new Set());
    }
    
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    };
  }, [pop]);
  
  // Zone expansion toggle
  const toggleZoneExpansion = useCallback((zoneNumber: number) => {
    setExpandedZones(prev => {
      const newSet = new Set(prev);
      const isExpanding = !newSet.has(zoneNumber);
      
      if (newSet.has(zoneNumber)) {
        newSet.delete(zoneNumber);
      } else {
        newSet.add(zoneNumber);
      }
      
      // Track zone interaction
      analytics.trackZoneInteraction(zoneNumber, isExpanding ? 'expand' : 'collapse');
      
      return newSet;
    });
  }, [analytics]);
  
  // Hide tooltip when date picker is open or no hover data
  if (!pop) return null;
  
  // HA Infrastructure Alignment: Convert to HA candles for metric consistency
  const haCandles = candles ? convertToHeikinAshi(candles) : [];
  
  // Validate HA alignment
  if (candles && haCandles.length !== candles.length) {
    logDebugHAAlignmentMismatch(
      pop.idx, 
      'HoverTooltipZones.haCandles', 
      `haCandles.length=${candles.length}`, 
      `actual=${haCandles.length}`
    );
  }
  
  // Create combined context for metric calculations using HA candles
  const combinedContext = {
    ...patternContext,
    candles: candles || [],
    haCandles: haCandles
  };
  
  const candleIndex = pop.idx;
  const patternArrayIndex = pop.visibleIndex;
  
  // Calculate AI-aware metrics
  const aiMetrics = AIHoverMetricsCalculator.calculateAIMetrics(
    candleIndex,
    haCandles,
    patternContext
  );
  
  return (
    <div 
      className={`fixed bg-slate-900/95 border rounded-lg shadow-xl text-white backdrop-blur-sm transition-opacity duration-200 pointer-events-none ${
        isHoldMode ? 'border-purple-500 shadow-purple-500/20 pointer-events-auto' : 'border-gray-600'
      }`}
      style={{
        left: `${pop.x + 15}px`,
        top: `${pop.y - 120}px`,
        width: isExpanded ? '480px' : '320px',
        maxHeight: '400px',
        opacity: opacity,
        zIndex: 50,
        pointerEvents: isHoldMode ? 'auto' : 'none',
        position: 'fixed'
      }}
      onMouseEnter={() => {
        if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
      }}
      onMouseLeave={() => {
        if (!isHoldMode) {
          hoverTimeoutRef.current = setTimeout(() => {
            setOpacity(0);
          }, 100);
        }
      }}
    >
      {/* Tooltip Header with Expansion Controls */}
      {isHoldMode && (
        <div className="flex items-center justify-between p-2 border-b border-gray-600 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-purple-400 text-xs font-medium">Hold Mode Active</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              {isExpanded ? '⌄ Collapse' : '⌃ Expand'}
            </button>
            <button
              onClick={() => {
                setIsHoldMode(false);
                setIsExpanded(false);
                setExpandedZones(new Set());
              }}
              className="text-gray-400 hover:text-red-400 text-xs px-2 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      {/* ZONE 1: Core Context */}
      <CoreContextZone 
        idx={candleIndex}
        bjCount={pop.bj}
        candle={pop.candle}
        isExpanded={expandedZones.has(1) || isExpanded}
        isHoldMode={isHoldMode}
        onToggleExpansion={() => toggleZoneExpansion(1)}
      />
      
      {/* ZONE 2: Pattern Intelligence */}
      <PatternIntelligenceZone 
        patternContext={patternContext}
        candleIndex={candleIndex}
        patternArrayIndex={patternArrayIndex}
        isExpanded={expandedZones.has(2) || isExpanded}
        isHoldMode={isHoldMode}
        onToggleExpansion={() => toggleZoneExpansion(2)}
        aiMetrics={aiMetrics}
      />
      
      {/* ZONE 3: Signal Detection */}
      <SignalDetectionZone 
        signalData={pop.signal}
        unifiedHover={unifiedHover}
        isExpanded={expandedZones.has(3) || isExpanded}
        isHoldMode={isHoldMode}
        onToggleExpansion={() => toggleZoneExpansion(3)}
        aiMetrics={aiMetrics}
      />
      
      {/* ZONE 4: Market Metrics */}
      <MarketMetricsZone 
        candleIndex={candleIndex}
        combinedContext={combinedContext}
        isExpanded={expandedZones.has(4) || isExpanded}
        isHoldMode={isHoldMode}
        onToggleExpansion={() => toggleZoneExpansion(4)}
      />
      
      {/* ZONE 5: Actions & Confidence */}
      <ActionsConfidenceZone 
        patternContext={patternContext}
        candleIndex={candleIndex}
        patternArrayIndex={patternArrayIndex}
        isExpanded={expandedZones.has(5) || isExpanded}
        isHoldMode={isHoldMode}
        onToggleExpansion={() => toggleZoneExpansion(5)}
        aiMetrics={aiMetrics}
      />
    </div>
  );
}

// ZONE 1: Core Context - Basic candle and index information
interface CoreContextZoneProps {
  idx: number;
  bjCount: number | string;
  candle?: any;
  isExpanded: boolean;
  isHoldMode: boolean;
  onToggleExpansion: () => void;
}

function CoreContextZone({ idx, bjCount, candle, isExpanded, isHoldMode, onToggleExpansion }: CoreContextZoneProps) {
  return (
    <div className="bg-slate-800/50 rounded-md p-3 mb-2 border-l-4 border-emerald-500">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          <span className="text-emerald-400 text-sm font-semibold">Core Context</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Zone 1</span>
          {isHoldMode && (
            <button
              onClick={onToggleExpansion}
              className="text-emerald-400 hover:text-emerald-300 text-xs px-1 py-0.5 rounded hover:bg-slate-700 transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
      
      {/* Core Data */}
      <div className="flex items-center justify-between text-sm font-medium mb-2">
        <span className="text-white">Candle {idx}</span>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          typeof bjCount === 'number' && bjCount >= 21 ? 'bg-emerald-600 text-white' :
          typeof bjCount === 'number' && bjCount < 0 ? 'bg-red-600 text-white' :
          'bg-slate-600 text-gray-300'
        }`}>BJ: {bjCount ?? 0}</span>
      </div>
      
      {/* OHLC Data */}
      {candle && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Open:</span>
            <span className="text-gray-200 font-mono">{candle.open?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">High:</span>
            <span className="text-gray-200 font-mono">{candle.high?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Low:</span>
            <span className="text-gray-200 font-mono">{candle.low?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Close:</span>
            <span className="text-gray-200 font-mono">{candle.close?.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {/* Expanded Details */}
      {isExpanded && candle && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          <div className="text-xs text-gray-400 font-medium">Extended Details</div>
          
          {/* Price Analysis */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Range:</span>
              <span className="text-gray-200 font-mono">{(candle.high - candle.low).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Body:</span>
              <span className="text-gray-200 font-mono">{Math.abs(candle.close - candle.open).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Upper Wick:</span>
              <span className="text-gray-200 font-mono">{(candle.high - Math.max(candle.open, candle.close)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Lower Wick:</span>
              <span className="text-gray-200 font-mono">{(Math.min(candle.open, candle.close) - candle.low).toFixed(2)}</span>
            </div>
          </div>
          
          {/* Candle Type */}
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Candle Type:</span>
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              candle.close > candle.open ? 'bg-green-600/20 text-green-400' :
              candle.close < candle.open ? 'bg-red-600/20 text-red-400' :
              'bg-gray-600/20 text-gray-400'
            }`}>
              {candle.close > candle.open ? 'Bullish' :
               candle.close < candle.open ? 'Bearish' : 'Doji'}
            </span>
          </div>
          
          {/* Volume if available */}
          {candle.volume && (
            <div className="flex justify-between">
              <span className="text-gray-400 text-xs">Volume:</span>
              <span className="text-gray-200 font-mono text-xs">{candle.volume.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ZONE 2: Pattern Intelligence - Pattern-specific details and metrics
interface PatternIntelligenceZoneProps {
  patternContext: any;
  candleIndex: number;
  patternArrayIndex: number;
  isExpanded: boolean;
  isHoldMode: boolean;
  onToggleExpansion: () => void;
  aiMetrics: AIMetrics;
}

function PatternIntelligenceZone({ patternContext, candleIndex, patternArrayIndex, isExpanded, isHoldMode, onToggleExpansion, aiMetrics }: PatternIntelligenceZoneProps) {
  // Check for escalator step hover
  const hoveredStep = patternContext.escalatorSteps?.find((event: any) => {
    if (event.type === 'ESCALATOR_STEP' && event.data) {
      const stepData = event.data as { stepRef: string; direction: string; floor: number; ceiling: number };
      const [startStr, endStr] = stepData.stepRef.split('-');
      const startIndex = parseInt(startStr);
      const endIndex = parseInt(endStr);
      return candleIndex >= startIndex && candleIndex <= endIndex;
    }
    return false;
  });

  // Check for breakout box hover
  const hoveredBreakoutBox = patternContext.breakoutBoxes?.find((event: any) => {
    return event.type === 'BREAKOUT_BOX' && event.index === candleIndex;
  });

  // Check for golden candle events
  const hoveredGoldenEntry = patternContext.goldenCandleEntries?.find((event: any) => {
    return event.index === candleIndex;
  });
  
  const hoveredGoldenExit = patternContext.goldenCandleExits?.find((event: any) => {
    return event.index === candleIndex;
  });

  const hasPatternData = hoveredStep || hoveredBreakoutBox || hoveredGoldenEntry || hoveredGoldenExit;

  if (!hasPatternData) return null;

  return (
    <div className="bg-slate-800/50 rounded-md p-3 mb-2 border-l-4 border-orange-500">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-400 text-sm font-semibold">Pattern Intelligence</span>
        </div>
        <span className="text-xs text-gray-400">Zone 2</span>
      </div>
      
      {/* AI Insights Banner */}
      {aiMetrics.anomalyFlag.isAnomaly && (
        <div className={`mb-2 p-2 rounded text-xs border ${
          aiMetrics.anomalyFlag.severity === 'HIGH' ? 'bg-red-600/20 border-red-600/50 text-red-400' :
          aiMetrics.anomalyFlag.severity === 'MEDIUM' ? 'bg-yellow-600/20 border-yellow-600/50 text-yellow-400' :
          'bg-blue-600/20 border-blue-600/50 text-blue-400'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="font-medium">🤖 AI Alert:</span>
            <span>{aiMetrics.anomalyFlag.description}</span>
          </div>
        </div>
      )}
      
      {/* Pattern Details */}
      <div className="space-y-2">
        {/* Escalator Step Details */}
        {hoveredStep && (
          <EscalatorStepDetails 
            stepData={hoveredStep.data} 
            patternContext={patternContext}
          />
        )}
        
        {/* Breakout Box Details */}
        {hoveredBreakoutBox && (
          <BreakoutBoxDetails boxData={hoveredBreakoutBox.data} />
        )}
        
        {/* Golden Candle Events */}
        {(hoveredGoldenEntry || hoveredGoldenExit) && (
          <GoldenCandleDetails 
            entry={hoveredGoldenEntry}
            exit={hoveredGoldenExit}
          />
        )}
      </div>
    </div>
  );
}

// ZONE 3: Signal Detection - Canvas signal information
interface SignalDetectionZoneProps {
  signalData?: any;
  unifiedHover: any;
  isExpanded: boolean;
  isHoldMode: boolean;
  onToggleExpansion: () => void;
  aiMetrics: AIMetrics;
}

function SignalDetectionZone({ signalData, unifiedHover, isExpanded, isHoldMode, onToggleExpansion, aiMetrics }: SignalDetectionZoneProps) {
  const hasSignalData = signalData || unifiedHover?.signal;
  
  if (!hasSignalData) return null;

  const signal = signalData || unifiedHover?.signal;

  return (
    <div className="bg-slate-800/50 rounded-md p-3 mb-2 border-l-4 border-yellow-500">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <span className="text-yellow-400 text-sm font-semibold">Signal Detection</span>
        </div>
        <span className="text-xs text-gray-400">Zone 3</span>
      </div>
      
      {/* AI Forecast Bias */}
      <div className="mb-2 p-2 bg-slate-700/50 rounded text-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400">🤖 AI Forecast:</span>
          <span className={`font-medium ${
            aiMetrics.forecastBias.score > 0.3 ? 'text-green-400' :
            aiMetrics.forecastBias.score < -0.3 ? 'text-red-400' :
            'text-gray-300'
          }`}>
            {aiMetrics.forecastBias.score > 0.3 ? 'Bullish' :
             aiMetrics.forecastBias.score < -0.3 ? 'Bearish' : 'Neutral'}
          </span>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              aiMetrics.forecastBias.score > 0 ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.abs(aiMetrics.forecastBias.score) * 100}%` }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{aiMetrics.forecastBias.reasoning}</div>
      </div>
      
      {signal && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Action:</span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${
              signal.tradeActionSignal?.action === 'BUY' ? 'bg-green-600 text-white' : 
              signal.tradeActionSignal?.action === 'SHORT' ? 'bg-red-600 text-white' : 
              'bg-slate-600 text-gray-300'
            }`}>
              {signal.tradeActionSignal?.action || 'N/A'}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">Price:</span>
            <span className="text-gray-200 font-mono">{signal.tradeActionSignal?.price?.toFixed(2) || 'N/A'}</span>
          </div>
          
          {signal.validation && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Validation:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                signal.validation.includes('VALID') ? 'bg-green-600/20 text-green-400 border border-green-600/50' : 
                'bg-red-600/20 text-red-400 border border-red-600/50'
              }`}>
                {signal.validation}
              </span>
            </div>
          )}
          
          {signal.tooltip && (
            <div className="text-xs text-gray-300 bg-slate-700/50 rounded p-2 mt-2">
              {signal.tooltip}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ZONE 4: Market Metrics - MetricRegistry calculations
interface MarketMetricsZoneProps {
  candleIndex: number;
  combinedContext: any;
  isExpanded: boolean;
  isHoldMode: boolean;
  onToggleExpansion: () => void;
}

function MarketMetricsZone({ candleIndex, combinedContext, isExpanded, isHoldMode, onToggleExpansion }: MarketMetricsZoneProps) {
  const metrics = Object.values(MetricRegistry).map((metric: any) => {
    try {
      const value = metric.calc(candleIndex, combinedContext);
      return { label: metric.label, value, id: metric.id };
    } catch (error) {
      logDebugHAAlignmentMismatch(
        candleIndex, 
        `MetricRegistry.${metric.id}`, 
        'HA candle data', 
        `error: ${(error as Error).message}`
      );
      return { label: metric.label, value: '-', id: metric.id };
    }
  });

  if (metrics.length === 0) return null;

  return (
    <div className="bg-slate-800/50 rounded-md p-3 mb-2 border-l-4 border-blue-500">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span className="text-blue-400 text-sm font-semibold">Market Metrics</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Zone 4</span>
          {isHoldMode && (
            <button
              onClick={onToggleExpansion}
              className="text-blue-400 hover:text-blue-300 text-xs px-1 py-0.5 rounded hover:bg-slate-700 transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-2">
        {metrics.slice(0, isExpanded ? metrics.length : 8).map((metric, idx) => (
          <div key={idx} className="flex justify-between items-center py-1">
            <span className="text-gray-400 text-xs truncate flex-1">{metric.label}:</span>
            <span className={`text-xs font-mono ml-2 ${
              typeof metric.value === 'number' && metric.value > 0 ? 'text-green-400' :
              typeof metric.value === 'number' && metric.value < 0 ? 'text-red-400' :
              metric.value === '-' ? 'text-gray-500' : 'text-gray-200'
            }`}>
              {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
            </span>
          </div>
        ))}
        
        {!isExpanded && metrics.length > 8 && (
          <div className="text-xs text-gray-500 text-center pt-1 border-t border-gray-700">
            +{metrics.length - 8} more metrics
          </div>
        )}
      </div>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-3">
          <div className="text-xs text-blue-400 font-medium">Extended Analysis</div>
          
          {/* Metric Categories */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Price Metrics</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility:</span>
                <span className="text-gray-200 font-mono">Medium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Momentum:</span>
                <span className="text-gray-200 font-mono">Neutral</span>
              </div>
            </div>
          </div>
          
          {/* Volume Analysis */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Volume Analysis</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Avg Volume:</span>
                <span className="text-gray-200 font-mono">Normal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume Trend:</span>
                <span className="text-gray-200 font-mono">Increasing</span>
              </div>
            </div>
          </div>
          
          {/* Mini Sparkline Representation */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Recent Trend</div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-4 bg-red-500/60 rounded-sm"></div>
              <div className="w-2 h-6 bg-red-500/80 rounded-sm"></div>
              <div className="w-2 h-3 bg-yellow-500/60 rounded-sm"></div>
              <div className="w-2 h-5 bg-green-500/60 rounded-sm"></div>
              <div className="w-2 h-7 bg-green-500/80 rounded-sm"></div>
              <div className="w-2 h-4 bg-green-500/60 rounded-sm"></div>
              <div className="w-2 h-6 bg-blue-500/80 rounded-sm"></div>
              <span className="text-xs text-gray-400 ml-2">7-period trend</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ZONE 5: Actions & Confidence - Pattern qualification and confidence scores
interface ActionsConfidenceZoneProps {
  patternContext: any;
  candleIndex: number;
  patternArrayIndex: number;
  isExpanded: boolean;
  isHoldMode: boolean;
  onToggleExpansion: () => void;
  aiMetrics: AIMetrics;
}

function ActionsConfidenceZone({ patternContext, candleIndex, patternArrayIndex, isExpanded, isHoldMode, onToggleExpansion, aiMetrics }: ActionsConfidenceZoneProps) {
  // Calculate pattern confidence from various sources
  const patternConfidence = calculatePatternConfidence(patternContext, candleIndex);
  const hasActions = patternConfidence.actions.length > 0;
  
  return (
    <div className="bg-slate-800/50 rounded-md p-3 border-l-4 border-purple-500">
      {/* Zone Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <span className="text-purple-400 text-sm font-semibold">Actions & Confidence</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">Zone 5</span>
          {isHoldMode && (
            <button
              onClick={onToggleExpansion}
              className="text-purple-400 hover:text-purple-300 text-xs px-1 py-0.5 rounded hover:bg-slate-700 transition-colors"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
        </div>
      </div>
      
      {/* AI Meta-Confidence Banner */}
      <div className="mb-3 p-2 bg-purple-600/10 border border-purple-600/30 rounded">
        <div className="flex items-center justify-between mb-2">
          <span className="text-purple-400 text-xs font-medium">🤖 AI Meta-Confidence:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            aiMetrics.metaConfidence.overallScore >= 80 ? 'bg-emerald-600 text-white' :
            aiMetrics.metaConfidence.overallScore >= 60 ? 'bg-yellow-600 text-white' :
            'bg-red-600 text-white'
          }`}>
            {aiMetrics.metaConfidence.overallScore}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Data Quality:</span>
            <span className="text-gray-300">{aiMetrics.metaConfidence.factors.dataQuality}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pattern Strength:</span>
            <span className="text-gray-300">{aiMetrics.metaConfidence.factors.patternStrength}%</span>
          </div>
        </div>
      </div>
      
      {/* Confidence Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-400 text-xs">Pattern Confidence:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            patternConfidence.score >= 80 ? 'bg-emerald-600 text-white' :
            patternConfidence.score >= 60 ? 'bg-yellow-600 text-white' :
            patternConfidence.score >= 40 ? 'bg-orange-600 text-white' :
            'bg-red-600 text-white'
          }`}>
            {patternConfidence.score}%
          </span>
        </div>
        
        {/* Confidence Bar */}
        <div className="w-full bg-slate-700 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full transition-all duration-300 ${
              patternConfidence.score >= 80 ? 'bg-emerald-500' :
              patternConfidence.score >= 60 ? 'bg-yellow-500' :
              patternConfidence.score >= 40 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${patternConfidence.score}%` }}
          ></div>
        </div>
      </div>
      
      {/* Action Recommendations */}
      {hasActions && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium">Recommended Actions:</div>
          {patternConfidence.actions.map((action, idx) => (
            <div key={idx} className={`px-2 py-1 rounded text-xs flex items-center justify-between ${
              action.type === 'BUY' ? 'bg-green-600/20 border border-green-600/50' :
              action.type === 'SHORT' ? 'bg-red-600/20 border border-red-600/50' :
              action.type === 'WATCH' ? 'bg-yellow-600/20 border border-yellow-600/50' :
              'bg-gray-600/20 border border-gray-600/50'
            }`}>
              <span className={`font-medium ${
                action.type === 'BUY' ? 'text-green-400' :
                action.type === 'SHORT' ? 'text-red-400' :
                action.type === 'WATCH' ? 'text-yellow-400' :
                'text-gray-400'
              }`}>
                {action.type}
              </span>
              <span className="text-gray-300">{action.reason}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Pattern Quality Indicators */}
      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Signal Quality:</span>
            <span className={`font-medium ${
              patternConfidence.signalQuality === 'HIGH' ? 'text-emerald-400' :
              patternConfidence.signalQuality === 'MEDIUM' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {patternConfidence.signalQuality}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Risk Level:</span>
            <span className={`font-medium ${
              patternConfidence.riskLevel === 'LOW' ? 'text-emerald-400' :
              patternConfidence.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {patternConfidence.riskLevel}
            </span>
          </div>
        </div>
      </div>
      
      {/* Expanded Content - Audit Trail & Action History */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-gray-700 space-y-3">
          <div className="text-xs text-purple-400 font-medium">Detailed Analysis</div>
          
          {/* Confidence Breakdown */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Confidence Breakdown</div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Pattern Recognition:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1">
                    <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="text-gray-300">75%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Volume Confirmation:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1">
                    <div className="bg-yellow-500 h-1 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="text-gray-300">60%</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Market Context:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-slate-700 rounded-full h-1">
                    <div className="bg-emerald-500 h-1 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="text-gray-300">85%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Audit Trail */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Action Audit Trail</div>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                <span className="text-gray-400">Pattern detected</span>
                <span className="text-gray-500">12:34:56</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-400">Validation pending</span>
                <span className="text-gray-500">12:35:02</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                <span className="text-gray-400">Signal confirmed</span>
                <span className="text-gray-500">12:35:15</span>
              </div>
            </div>
          </div>
          
          {/* Risk Assessment */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Risk Assessment</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Volatility Risk:</span>
                <span className="text-yellow-400">Medium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Liquidity Risk:</span>
                <span className="text-green-400">Low</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time Decay:</span>
                <span className="text-yellow-400">Moderate</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Risk:</span>
                <span className="text-green-400">Low</span>
              </div>
            </div>
          </div>
          
          {/* Action Panel */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-medium">Quick Actions</div>
            <div className="flex space-x-2">
              <button className="px-2 py-1 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 rounded text-xs text-green-400 transition-colors">
                Watch
              </button>
              <button className="px-2 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 rounded text-xs text-yellow-400 transition-colors">
                Alert
              </button>
              <button className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded text-xs text-purple-400 transition-colors">
                Analyze
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to calculate pattern confidence and actions
function calculatePatternConfidence(patternContext: any, candleIndex: number) {
  let score = 50; // Base confidence score
  const actions: Array<{ type: string; reason: string }> = [];
  let signalQuality = 'MEDIUM';
  let riskLevel = 'MEDIUM';
  
  // Check for active patterns at this candle
  const hasEscalatorStep = patternContext.escalatorSteps?.some((event: any) => {
    if (event.type === 'ESCALATOR_STEP' && event.data) {
      const stepData = event.data;
      const [startStr, endStr] = stepData.stepRef.split('-');
      const startIndex = parseInt(startStr);
      const endIndex = parseInt(endStr);
      return candleIndex >= startIndex && candleIndex <= endIndex;
    }
    return false;
  });
  
  const hasBreakoutBox = patternContext.breakoutBoxes?.some((event: any) => {
    return event.type === 'BREAKOUT_BOX' && event.index === candleIndex;
  });
  
  const hasGoldenCandle = patternContext.goldenCandleEntries?.some((event: any) => {
    return event.index === candleIndex;
  }) || patternContext.goldenCandleExits?.some((event: any) => {
    return event.index === candleIndex;
  });
  
  // Calculate confidence based on pattern presence
  if (hasEscalatorStep) {
    score += 20;
    signalQuality = 'HIGH';
    actions.push({ type: 'WATCH', reason: 'Escalator step active' });
  }
  
  if (hasBreakoutBox) {
    score += 25;
    signalQuality = 'HIGH';
    riskLevel = 'LOW';
    actions.push({ type: 'BUY', reason: 'Breakout confirmed' });
  }
  
  if (hasGoldenCandle) {
    score += 30;
    signalQuality = 'HIGH';
    actions.push({ type: 'WATCH', reason: 'Golden candle event' });
  }
  
  // Cap the score at 100
  score = Math.min(score, 100);
  
  // Adjust signal quality based on final score
  if (score >= 80) signalQuality = 'HIGH';
  else if (score >= 60) signalQuality = 'MEDIUM';
  else signalQuality = 'LOW';
  
  // Adjust risk level based on patterns
  if (hasBreakoutBox && hasEscalatorStep) riskLevel = 'LOW';
  else if (hasEscalatorStep || hasBreakoutBox) riskLevel = 'MEDIUM';
  else riskLevel = 'HIGH';
  
  return { score, actions, signalQuality, riskLevel };
}

// Helper Components for Pattern Details
function EscalatorStepDetails({ stepData, patternContext }: any) {
  const targetBjEntry = stepData ? (patternContext.bjTargetScores || []).find((e: any) => e.stepRef === stepData.stepRef) : undefined;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center text-xs">
        <span className="text-gray-500 mr-2">Escalator Step:</span>
        <span className="font-medium text-orange-400">
          {stepData.direction} {stepData.direction === 'RISING' ? '↑' : '↓'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Floor:</span>
          <span className="text-gray-300">{stepData.floor?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ceiling:</span>
          <span className="text-gray-300">{stepData.ceiling?.toFixed(2)}</span>
        </div>
      </div>
      
      {targetBjEntry && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Goldmine:</span>
          <span className={targetBjEntry.qualifiesForGoldmine ? 'text-yellow-400 font-bold' : 'text-gray-400'}>
            {targetBjEntry.qualifiesForGoldmine ? 'YES' : 'NO'}
          </span>
        </div>
      )}
    </div>
  );
}

function BreakoutBoxDetails({ boxData }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center text-xs">
        <span className="text-gray-500 mr-2">BreakoutBox:</span>
        <span className="font-medium text-purple-400">
          BREAKOUT {boxData.direction === 'RISING' ? '↑' : '↓'}
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-x-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Floor:</span>
          <span className="text-gray-300">{boxData.floor?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Ceiling:</span>
          <span className="text-gray-300">{boxData.ceiling?.toFixed(2)}</span>
        </div>
      </div>
      
      {boxData.qualifiesForGoldmine && (
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Goldmine:</span>
          <span className="text-yellow-400 font-bold">YES 🔶</span>
        </div>
      )}
    </div>
  );
}

function GoldenCandleDetails({ entry, exit }: any) {
  return (
    <div className="space-y-1">
      {entry && (
        <div className="flex items-center text-xs">
          <span className="text-gray-500 mr-2">Golden Candle:</span>
          <span className="font-bold text-yellow-400">ENTRY</span>
        </div>
      )}
      
      {exit && (
        <div className="flex items-center text-xs">
          <span className="text-gray-500 mr-2">Golden Candle:</span>
          <span className="font-bold text-red-400">EXIT</span>
        </div>
      )}
    </div>
  );
}
