// src/components/Patterns/EscalatorSettingsPanel.tsx
// Settings for Escalator detector
// Configure step thresholds
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ThrustDirection } from '../../models/PatternTypes';
// Info bubble and tooltip styled components (copied from Rocketman panel)
const InfoIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e0eafc;
  color: #0056b3;
  font-size: 13px;
  font-weight: bold;
  margin-left: 8px;
  cursor: pointer;
  border: 1px solid #b3c2e0;
`;

const Tooltip = styled.div`
  position: fixed;
  background: #fff;
  color: #222;
  border: 1px solid #b3c2e0;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  z-index: 10;
  max-width: 260px;
`;
// ...existing code...

interface EscalatorSettings {
  enabled: boolean;
  showLabels: boolean;
  showBreakoutBoxes: boolean;
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

interface EscalatorSettingsPanelProps {
  settings: EscalatorSettings;
  onSettingsChange: (settings: EscalatorSettings) => void;
  // ...existing code...
}

const SettingsContainer = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const SettingsTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  color: #333;
`;

const SettingsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
  position: relative;
`;

const SettingsLabel = styled.label`
  font-size: 14px;
  color: #555;
  flex: 1;
`;

const SettingsSlider = styled.input`
  flex: 2;
`;

const SettingsValue = styled.span`
  font-size: 14px;
  color: #333;
  width: 40px;
  text-align: center;
`;

const SettingsToggle = styled.input`
  margin-right: 8px;
`;

const DirectionSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
`;

export const EscalatorSettingsPanel: React.FC<EscalatorSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  // Tooltip state for each control
  const [tooltip, setTooltip] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  function showTooltip(text: string, e: React.MouseEvent<HTMLElement> | React.FocusEvent<HTMLElement>) {
    setTooltip(text);
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setTooltipPos({ x: rect.left, y: rect.bottom });
  }
  function hideTooltip() {
    setTooltip(null);
    setTooltipPos(null);
  }
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('escalatorSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving Escalator settings to localStorage', error);
    }
  }, [settings]);

  const handleEnableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, enabled: e.target.checked });
  };
  
  const handleShowLabelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, showLabels: e.target.checked });
  };
  
  const handleShowBreakoutBoxesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, showBreakoutBoxes: e.target.checked });
  };
  
  const handleMinStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minSteps: parseInt(e.target.value, 10) });
  };
  
  const handleMinStepSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minStepSize: parseFloat(e.target.value) });
  };
  
  const handleMaxVolatilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, maxConsolidationVolatility: parseFloat(e.target.value) });
  };
  
  const handleBasePriceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, basePriceChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleBaseVolumeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, baseVolumeChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleUseContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, useContextTimeframe: e.target.checked });
  };
  
  const handleContextMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, contextTimeframeMultiplier: parseInt(e.target.value, 10) });
  };
  
  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minScore: parseInt(e.target.value, 10) });
  };
  
  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ 
      ...settings, 
      preferredDirection: e.target.value as ThrustDirection | 'BOTH' 
    });
  };
  
  return (
    <SettingsContainer>
      <SettingsTitle>Escalator Pattern Settings</SettingsTitle>

      <SettingsRow>
        <SettingsToggle
          type="checkbox"
          id="enableEscalator"
          checked={settings.enabled}
          onChange={handleEnableChange}
          aria-label="Enable Escalator Detection"
        />
        <SettingsLabel htmlFor="enableEscalator">Enable Escalator Detection</SettingsLabel>
        <InfoIcon
          aria-label="Info: Enable Escalator Detection"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Enable Escalator Detection: Turns on Escalator pattern detection for the chart.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Enable Escalator Detection: Turns on Escalator pattern detection for the chart.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsToggle
          type="checkbox"
          id="showEscalatorLabels"
          checked={settings.showLabels}
          onChange={handleShowLabelsChange}
          disabled={!settings.enabled}
          aria-label="Show Step Labels"
        />
        <SettingsLabel htmlFor="showEscalatorLabels" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
          Show Step Labels (STEP ↑/↓)
        </SettingsLabel>
        <InfoIcon
          aria-label="Info: Show Step Labels"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Show Step Labels: Displays step up/down labels for each detected Escalator segment.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Show Step Labels: Displays step up/down labels for each detected Escalator segment.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsToggle
          type="checkbox"
          id="showBreakoutBoxes"
          checked={settings.showBreakoutBoxes}
          onChange={handleShowBreakoutBoxesChange}
          disabled={!settings.enabled}
          aria-label="Show Breakout Boxes"
        />
        <SettingsLabel htmlFor="showBreakoutBoxes" style={{ opacity: settings.enabled ? 1 : 0.5 }}>
          Show Breakout Boxes
        </SettingsLabel>
        <InfoIcon
          aria-label="Info: Show Breakout Boxes"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Show Breakout Boxes: Highlights breakout regions for Escalator steps.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Show Breakout Boxes: Highlights breakout regions for Escalator steps.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Preferred Direction</SettingsLabel>
        <DirectionSelect
          value={settings.preferredDirection}
          onChange={handleDirectionChange}
          aria-label="Preferred Direction"
        >
          <option value="BOTH">Both Directions</option>
          <option value="BULLISH">Bullish Only (Up)</option>
          <option value="BEARISH">Bearish Only (Down)</option>
        </DirectionSelect>
        <InfoIcon
          aria-label="Info: Preferred Direction"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Preferred Direction: Choose which direction to detect: bullish, bearish, or both.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Preferred Direction: Choose which direction to detect: bullish, bearish, or both.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Minimum Steps</SettingsLabel>
        <SettingsSlider
          type="range"
          min={2}
          max={10}
          step={1}
          value={settings.minSteps}
          onChange={handleMinStepsChange}
          aria-label="Minimum Steps"
        />
        <SettingsValue>{settings.minSteps}</SettingsValue>
        <InfoIcon
          aria-label="Info: Minimum Steps"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Minimum Steps: Minimum number of steps required to qualify as an Escalator pattern.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Minimum Steps: Minimum number of steps required to qualify as an Escalator pattern.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Min Step Size (%)</SettingsLabel>
        <SettingsSlider
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={settings.minStepSize}
          onChange={handleMinStepSizeChange}
          aria-label="Min Step Size (%)"
        />
        <SettingsValue>{settings.minStepSize.toFixed(1)}</SettingsValue>
        <InfoIcon
          aria-label="Info: Min Step Size"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Min Step Size: Minimum price change per step, as a percent.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Min Step Size: Minimum price change per step, as a percent.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Max Consolidation Vol (%)</SettingsLabel>
        <SettingsSlider
          type="range"
          min={0.2}
          max={3.0}
          step={0.2}
          value={settings.maxConsolidationVolatility}
          onChange={handleMaxVolatilityChange}
          aria-label="Max Consolidation Vol (%)"
        />
        <SettingsValue>{settings.maxConsolidationVolatility.toFixed(1)}</SettingsValue>
        <InfoIcon
          aria-label="Info: Max Consolidation Volatility"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Max Consolidation Volatility: Maximum allowed volatility during consolidation phases.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Max Consolidation Volatility: Maximum allowed volatility during consolidation phases.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Price Change Threshold (%)</SettingsLabel>
        <SettingsSlider
          type="range"
          min={0.01}
          max={0.5}
          step={0.01}
          value={settings.basePriceChangeThreshold}
          onChange={handleBasePriceThresholdChange}
          aria-label="Price Change Threshold (%)"
        />
        <SettingsValue>{settings.basePriceChangeThreshold.toFixed(2)}</SettingsValue>
        <InfoIcon
          aria-label="Info: Price Change Threshold"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Price Change Threshold: Minimum price change to trigger a step.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Price Change Threshold: Minimum price change to trigger a step.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsLabel>Volume Change Threshold (%)</SettingsLabel>
        <SettingsSlider
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={settings.baseVolumeChangeThreshold}
          onChange={handleBaseVolumeThresholdChange}
          aria-label="Volume Change Threshold (%)"
        />
        <SettingsValue>{settings.baseVolumeChangeThreshold.toFixed(1)}</SettingsValue>
        <InfoIcon
          aria-label="Info: Volume Change Threshold"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Volume Change Threshold: Minimum volume change to trigger a step.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Volume Change Threshold: Minimum volume change to trigger a step.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      <SettingsRow>
        <SettingsToggle
          type="checkbox"
          id="useContext"
          checked={settings.useContextTimeframe}
          onChange={handleUseContextChange}
          aria-label="Use Context Timeframe"
        />
        <SettingsLabel htmlFor="useContext">Use Context Timeframe</SettingsLabel>
        <InfoIcon
          aria-label="Info: Use Context Timeframe"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Use Context Timeframe: Enable to use a broader timeframe for context-aware detection.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Use Context Timeframe: Enable to use a broader timeframe for context-aware detection.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      {settings.useContextTimeframe && (
        <SettingsRow>
          <SettingsLabel>Context Multiplier</SettingsLabel>
          <SettingsSlider
            type="range"
            min={2}
            max={10}
            step={1}
            value={settings.contextTimeframeMultiplier}
            onChange={handleContextMultiplierChange}
            aria-label="Context Multiplier"
          />
          <SettingsValue>{settings.contextTimeframeMultiplier}x</SettingsValue>
          <InfoIcon
            aria-label="Info: Context Multiplier"
            tabIndex={0}
            onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Context Multiplier: Multiplier for context timeframe, expands detection window.', e)}
            onMouseLeave={hideTooltip}
            onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Context Multiplier: Multiplier for context timeframe, expands detection window.', e)}
            onBlur={hideTooltip}
          >i</InfoIcon>
        </SettingsRow>
      )}

      <SettingsRow>
        <SettingsLabel>Minimum Score</SettingsLabel>
        <SettingsSlider
          type="range"
          min={1}
          max={7}
          step={1}
          value={settings.minScore}
          onChange={handleMinScoreChange}
          aria-label="Minimum Score"
        />
        <SettingsValue>{settings.minScore}</SettingsValue>
        <InfoIcon
          aria-label="Info: Minimum Score"
          tabIndex={0}
          onMouseEnter={(e: React.MouseEvent<HTMLElement>) => showTooltip('Minimum Score: Minimum score required for a valid Escalator pattern.', e)}
          onMouseLeave={hideTooltip}
          onFocus={(e: React.FocusEvent<HTMLElement>) => showTooltip('Minimum Score: Minimum score required for a valid Escalator pattern.', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>

      {tooltip && tooltipPos && (
        <Tooltip style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          {tooltip}
        </Tooltip>
      )}
    </SettingsContainer>
  );
};

export default EscalatorSettingsPanel;
