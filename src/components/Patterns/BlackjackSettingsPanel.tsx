// src/components/Patterns/BlackjackSettingsPanel.tsx
// Settings for Blackjack detector
// Edit scoring parameters
// ...existing code...
import styled from 'styled-components';
import React, { useState, useEffect } from 'react';
// ...existing code...
// ...existing code...
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

const helpText: Record<string, string> = {
  enabled: 'Enable or disable Blackjack pattern detection. Default: enabled.',
  showLabels: 'Show pattern labels for Blackjack regions. Default: enabled.',
  lookbackPeriods: 'Number of periods to look back for pattern detection. Default: 7. Range: 3–21.',
  minScore: 'Minimum score required for a valid Blackjack pattern. Default: 3. Range: 1–7.',
  showContextTimeframe: 'Show context timeframe for detection. Default: disabled.',
  contextTimeframeMultiplier: 'Multiplier for context timeframe, expands detection window. Default: 2. Range: 2–10.',
  basePriceChangeThreshold: 'Minimum price change (%) for pattern detection. Default: 0.2. Range: 0.05–1.0.',
  baseVolumeChangeThreshold: 'Minimum volume change (%) for pattern detection. Default: 0.5. Range: 0.1–2.0.',
};
// ...existing code...

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

interface BlackjackSettingsPanelProps {
  settings: BlackjackSettings;
  onSettingsChange: (settings: BlackjackSettings) => void;
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
  width: 30px;
  text-align: center;
`;

const SettingsToggle = styled.input`
  margin-right: 8px;
`;

export const BlackjackSettingsPanel: React.FC<BlackjackSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  // Tooltip state for info bubbles
  const [tooltip, setTooltip] = useState<{ key: string; pos: { x: number; y: number } } | null>(null);

  // Helper to show tooltip down and to the left of icon
  function showTooltip(key: string, e: React.MouseEvent | React.FocusEvent) {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const tooltipWidth = 260;
    let x = rect.left - tooltipWidth - 8;
    if (x < 8) x = 8;
    const y = rect.bottom + 8;
    setTooltip({ key, pos: { x, y } });
  }
  function hideTooltip() {
    setTooltip(null);
  }
  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('blackjackSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        onSettingsChange(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading BlackJack settings from localStorage', error);
    }
  }, [onSettingsChange]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('blackjackSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving BlackJack settings to localStorage', error);
    }
  }, [settings]);

  const handleEnableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, enabled: e.target.checked });
  };
  
  const handleLookbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, lookbackPeriods: parseInt(e.target.value, 10) });
  };
  
  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minScore: parseInt(e.target.value, 10) });
  };
  
  const handleShowLabelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, showLabels: e.target.checked });
  };
  
  const handleShowContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, showContextTimeframe: e.target.checked });
  };
  
  const handleContextMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, contextTimeframeMultiplier: parseInt(e.target.value, 10) });
  };

  const handleBasePriceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, basePriceChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleBaseVolumeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, baseVolumeChangeThreshold: parseFloat(e.target.value) });
  };
  
  return (
    <SettingsContainer>
      <SettingsTitle>BlackJack Pattern Settings</SettingsTitle>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="enableBlackjack"
          checked={settings.enabled}
          onChange={handleEnableChange}
          aria-label="Enable BlackJack Detection"
        />
        <SettingsLabel htmlFor="enableBlackjack">Enable BlackJack Detection</SettingsLabel>
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Enable BlackJack Detection"
          onMouseEnter={e => showTooltip('enabled', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('enabled', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="showBlackjackLabels"
          checked={settings.showLabels}
          onChange={handleShowLabelsChange}
          aria-label="Show Labels"
        />
        <SettingsLabel htmlFor="showBlackjackLabels">Show Labels</SettingsLabel>
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Show Labels"
          onMouseEnter={e => showTooltip('showLabels', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('showLabels', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Lookback Periods</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={3} 
          max={21} 
          step={2}
          value={settings.lookbackPeriods}
          onChange={handleLookbackChange}
          aria-label="Lookback Periods"
        />
        <SettingsValue>{settings.lookbackPeriods}</SettingsValue>
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Lookback Periods"
          onMouseEnter={e => showTooltip('lookbackPeriods', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('lookbackPeriods', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      
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
          tabIndex={0}
          aria-label="Info: Minimum Score"
          onMouseEnter={e => showTooltip('minScore', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('minScore', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="showContext"
          checked={settings.showContextTimeframe}
          onChange={handleShowContextChange}
          aria-label="Show Context Timeframe"
        />
        <SettingsLabel htmlFor="showContext">Show Context Timeframe</SettingsLabel>
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Show Context Timeframe"
          onMouseEnter={e => showTooltip('showContextTimeframe', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('showContextTimeframe', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      
      {settings.showContextTimeframe && (
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
            tabIndex={0}
            aria-label="Info: Context Multiplier"
            onMouseEnter={e => showTooltip('contextTimeframeMultiplier', e)}
            onMouseLeave={hideTooltip}
            onFocus={e => showTooltip('contextTimeframeMultiplier', e)}
            onBlur={hideTooltip}
          >i</InfoIcon>
        </SettingsRow>
      )}
      
      <SettingsRow>
        <SettingsLabel>Price Change Threshold (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.05} 
          max={1.0} 
          step={0.05}
          value={settings.basePriceChangeThreshold}
          onChange={handleBasePriceThresholdChange}
          aria-label="Price Change Threshold (%)"
        />
        <SettingsValue>{settings.basePriceChangeThreshold.toFixed(2)}</SettingsValue>
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Price Change Threshold (%)"
          onMouseEnter={e => showTooltip('basePriceChangeThreshold', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('basePriceChangeThreshold', e)}
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
          tabIndex={0}
          aria-label="Info: Volume Change Threshold (%)"
          onMouseEnter={e => showTooltip('baseVolumeChangeThreshold', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('baseVolumeChangeThreshold', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingsRow>
      {tooltip && (
        <Tooltip style={{ left: tooltip.pos.x, top: tooltip.pos.y }}>
          {helpText[tooltip.key]}
        </Tooltip>
      )}
    </SettingsContainer>
  );
};

export default BlackjackSettingsPanel;
