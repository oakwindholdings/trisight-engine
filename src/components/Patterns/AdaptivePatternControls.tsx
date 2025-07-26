// src/components/Patterns/AdaptivePatternControls.tsx
// Controls for adaptive detectors
// Enables per-pattern settings
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PatternDetectionPreferences } from '../../utils/patternDetection/AdaptivePatternDetectionService';
import { ThrustDirection, ChannelDirection } from '../../models/PatternTypes';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h3`
  font-size: 14px;
  margin: 0 0 12px 0;
  color: #212121;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`;

const Label = styled.label`
  font-size: 13px;
  color: #424242;
`;

const Slider = styled.input`
  width: 100%;
  margin: 4px 0;
`;

const Toggle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .3s;
    border-radius: 20px;
  }

  span:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
  }

  input:checked + span {
    background-color: #2196F3;
  }

  input:checked + span:before {
    transform: translateX(20px);
  }
`;

const Value = styled.span`
  font-size: 12px;
  color: #757575;
  min-width: 36px;
  text-align: right;
`;

const StatsContainer = styled.div`
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #757575;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
`;

// Define the shape of detection statistics
interface DetectionStats {
  patternsDetected?: number;
  detectionTimeMs?: number;
}

interface DetectionStatistics {
  [key: string]: DetectionStats;
}

interface BlackjackSettings {
  enabled: boolean;
  lookbackPeriods: number;
  minScore: number;
  showContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
  showLabels: boolean;
}

interface EscalatorSettings {
  enabled: boolean;
  showLabels: boolean;
  minSteps: number;
  minStepSize: number;
  maxConsolidationVolatility: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
  useContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  minScore: number;
  preferredDirection: ThrustDirection | 'BOTH';
}

interface PivotSettings {
  touchPointThreshold: number;
  priceTolerance: number;
  confidenceThreshold: number;
  volumeReactionThreshold: number;
  minimumTouchGap: number;
  detectSupport: boolean;
  detectResistance: boolean;
}

interface GoldmineChannelSettings {
  enabled: boolean;
  minTouchPoints: number;
  priceTolerance: number;
  minChannelHeight: number;
  minChannelDuration: number;
  confidenceThreshold: number;
  preferredDirection: ChannelDirection | 'ALL';
}

interface GoldmineShaftSettings {
  enabled: boolean;
  minThrustMagnitude: number;
  minRetracementPercentage: number;
  maxRetracementPercentage: number;
  thrustDurationRange: [number, number];
  preferredDirection: ThrustDirection | 'BOTH';
  confidenceThreshold: number;
}

interface RocketmanSettings {
  enabled: boolean;
  minAccelerationRate: number;
  minIntensity: number;
  minMomentumScore: number;
  minVolumeConfirmation: number;
  lookbackPeriods: number;
  preferredDirection: ThrustDirection | 'BOTH';
}

interface AdaptivePatternControlsProps {
  preferences: Partial<PatternDetectionPreferences>;
  updatePreferences: (prefs: Partial<PatternDetectionPreferences>) => void;
  detectionStats?: DetectionStatistics;
}

const AdaptivePatternControls: React.FC<AdaptivePatternControlsProps> = ({ 
  preferences, 
  updatePreferences,
  detectionStats
}) => {
  // Default BlackJack settings
  const [blackjackSettings, setBlackjackSettings] = useState<BlackjackSettings>({
    enabled: true,
    lookbackPeriods: 7,
    minScore: 2,
    showContextTimeframe: true,
    contextTimeframeMultiplier: 5,
    basePriceChangeThreshold: 0.1,
    baseVolumeChangeThreshold: 0.5,
    showLabels: false
  });
  
  // Default GoldmineChannel settings
  const [goldmineChannelSettings, setGoldmineChannelSettings] = useState<GoldmineChannelSettings>({
    enabled: true,
    minTouchPoints: 4,
    priceTolerance: 0.2,
    minChannelHeight: 1.5,
    minChannelDuration: 20,
    confidenceThreshold: 0.5,
    preferredDirection: 'ALL'
  });
  
  // Default GoldmineShaft settings
  const [goldmineShaftSettings, setGoldmineShaftSettings] = useState<GoldmineShaftSettings>({
    enabled: true,
    minThrustMagnitude: 1.5,
    minRetracementPercentage: 30,
    maxRetracementPercentage: 60,
    thrustDurationRange: [5, 20],
    preferredDirection: 'BOTH',
    confidenceThreshold: 0.5
  });
  
  // Default Rocketman settings
  const [rocketmanSettings, setRocketmanSettings] = useState<RocketmanSettings>({
    enabled: true,
    minAccelerationRate: 0.2,
    minIntensity: 0.5,
    minMomentumScore: 0.6,
    minVolumeConfirmation: 0.5,
    lookbackPeriods: 5,
    preferredDirection: 'BOTH'
  });
  
  // Default Escalator settings
  const [escalatorSettings, setEscalatorSettings] = useState<EscalatorSettings>({
    enabled: true,
    showLabels: true,
    minSteps: 3,
    minStepSize: 0.5,
    maxConsolidationVolatility: 1.0,
    basePriceChangeThreshold: 0.01,
    baseVolumeChangeThreshold: 0.05,
    useContextTimeframe: true,
    contextTimeframeMultiplier: 3,
    minScore: 2,
    preferredDirection: 'BOTH' as 'BOTH'
  });
  
  // Default Pivot settings
  const [pivotSettings, setPivotSettings] = useState<PivotSettings>({
    touchPointThreshold: 3,
    priceTolerance: 0.3,
    confidenceThreshold: 0.6,
    volumeReactionThreshold: 1.2,
    minimumTouchGap: 3,
    detectSupport: true,
    detectResistance: true
  });
  
  // Update pattern detection preferences when settings change
  useEffect(() => {
    // Update parent component whenever settings change
    updatePreferences({
      additionalOptions: {
        blackjack: {
          enabled: blackjackSettings.enabled,
          lookbackPeriods: blackjackSettings.lookbackPeriods,
          minScore: blackjackSettings.minScore,
          useContextTimeframe: blackjackSettings.showContextTimeframe,
          contextTimeframeMultiplier: blackjackSettings.contextTimeframeMultiplier,
          basePriceChangeThreshold: blackjackSettings.basePriceChangeThreshold,
          baseVolumeChangeThreshold: blackjackSettings.baseVolumeChangeThreshold
        },
        escalator: {
          enabled: escalatorSettings.enabled,
          showLabels: escalatorSettings.showLabels,
          minSteps: escalatorSettings.minSteps,
          minStepSize: escalatorSettings.minStepSize,
          maxConsolidationVolatility: escalatorSettings.maxConsolidationVolatility,
          basePriceChangeThreshold: escalatorSettings.basePriceChangeThreshold,
          baseVolumeChangeThreshold: escalatorSettings.baseVolumeChangeThreshold,
          useContextTimeframe: escalatorSettings.useContextTimeframe,
          contextTimeframeMultiplier: escalatorSettings.contextTimeframeMultiplier,
          minScore: escalatorSettings.minScore,
          preferredDirection: escalatorSettings.preferredDirection
        },
        pivot: {
          touchPointThreshold: pivotSettings.touchPointThreshold,
          priceTolerance: pivotSettings.priceTolerance,
          confidenceThreshold: pivotSettings.confidenceThreshold,
          volumeReactionThreshold: pivotSettings.volumeReactionThreshold,
          minimumTouchGap: pivotSettings.minimumTouchGap,
          detectSupport: pivotSettings.detectSupport,
          detectResistance: pivotSettings.detectResistance
        },
        goldmineChannel: {
          enabled: goldmineChannelSettings.enabled,
          minTouchPoints: goldmineChannelSettings.minTouchPoints,
          priceTolerance: goldmineChannelSettings.priceTolerance,
          minChannelHeight: goldmineChannelSettings.minChannelHeight,
          minChannelDuration: goldmineChannelSettings.minChannelDuration,
          confidenceThreshold: goldmineChannelSettings.confidenceThreshold,
          preferredDirection: goldmineChannelSettings.preferredDirection
        },
        goldmineShaft: {
          enabled: goldmineShaftSettings.enabled,
          minThrustMagnitude: goldmineShaftSettings.minThrustMagnitude,
          minRetracementPercentage: goldmineShaftSettings.minRetracementPercentage,
          maxRetracementPercentage: goldmineShaftSettings.maxRetracementPercentage,
          thrustDurationRange: goldmineShaftSettings.thrustDurationRange,
          preferredDirection: goldmineShaftSettings.preferredDirection,
          confidenceThreshold: goldmineShaftSettings.confidenceThreshold
        },
        rocketman: {
          enabled: rocketmanSettings.enabled,
          minAccelerationRate: rocketmanSettings.minAccelerationRate,
          minIntensity: rocketmanSettings.minIntensity,
          minMomentumScore: rocketmanSettings.minMomentumScore,
          minVolumeConfirmation: rocketmanSettings.minVolumeConfirmation,
          lookbackPeriods: rocketmanSettings.lookbackPeriods,
          preferredDirection: rocketmanSettings.preferredDirection
        }
      }
    });
  }, [blackjackSettings, escalatorSettings, pivotSettings, goldmineChannelSettings, goldmineShaftSettings, rocketmanSettings]);
  const handleConfidenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    updatePreferences({ minimumConfidence: value });
  };

  const handleAdaptiveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences({ adaptiveThresholds: e.target.checked });
  };

  const handleTradingHoursToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    updatePreferences({ showOnlyTradingHours: e.target.checked });
  };

  return (
    <Container>
      <ControlGroup>
        <Label>Minimum Confidence</Label>
        <Row>
          <Slider 
            type="range" 
            min="0.1" 
            max="0.9" 
            step="0.05"
            value={preferences.minimumConfidence || 0.4}
            onChange={handleConfidenceChange}
          />
          <Value>{preferences.minimumConfidence?.toFixed(2) || '0.40'}</Value>
        </Row>
        
        <Toggle>
          <Switch>
            <input 
              type="checkbox" 
              checked={preferences.adaptiveThresholds !== false}
              onChange={handleAdaptiveToggle}
            />
            <span></span>
          </Switch>
          <Label>Adaptive Thresholds</Label>
        </Toggle>
        
        <Toggle>
          <Switch>
            <input 
              type="checkbox" 
              checked={preferences.showOnlyTradingHours !== false}
              onChange={handleTradingHoursToggle}
            />
            <span></span>
          </Switch>
          <Label>Trading Hours Only (9:30-4:00)</Label>
        </Toggle>
      </ControlGroup>
      
      {detectionStats && (
        <StatsContainer>
          <StatRow>
            <span>Patterns Detected:</span>
            <b>{Object.values(detectionStats).reduce((sum, stat) => sum + (stat?.patternsDetected || 0), 0)}</b>
          </StatRow>
          <StatRow>
            <span>Processing Time:</span>
            <b>{Object.values(detectionStats).reduce((sum, stat) => sum + (stat?.detectionTimeMs || 0), 0).toFixed(0)} ms</b>
          </StatRow>
        </StatsContainer>
      )}
    </Container>
  );
};

export default AdaptivePatternControls;
