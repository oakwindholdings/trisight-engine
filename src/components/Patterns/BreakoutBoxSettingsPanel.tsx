// src/components/Patterns/BreakoutBoxSettingsPanel.tsx
// Independent settings panel for BreakoutBox pattern detection and display
// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.

import React, { useState } from 'react';
import styled from 'styled-components';
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
  enabled: 'Enable or disable BreakoutBox pattern detection. Default: enabled.',
  showBreakoutBoxes: 'Show breakout boxes for detected stalls. Default: enabled.',
  showLabels: 'Show pattern labels for breakout/stall regions. Default: enabled.',
  minStallLength: 'Minimum number of candles required for a stall before breakout. Default: 3. Range: 1–20.',
  breakoutMultiplier: 'Multiplier for breakout strength after a stall. Default: 0.5. Range: 0.1–2.0.',
  stallThreshold: 'Maximum percent change allowed during a stall. Default: 0.1. Range: 0.01–1.0.',
};
// ...existing code...

// BreakoutBox settings interface
export interface BreakoutBoxSettings {
  enabled: boolean;
  showBreakoutBoxes: boolean;
  showLabels: boolean;
  minStallLength: number;
  breakoutMultiplier: number;
  stallThreshold: number;
}

// Component props
interface BreakoutBoxSettingsPanelProps {
  settings: BreakoutBoxSettings;
  onSettingsChange: (newSettings: BreakoutBoxSettings) => void;
}

// Styled components
const SettingsContainer = styled.div`
  padding: 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled.label`
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
`;

const SettingInput = styled.input`
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 14px;
  width: 80px;
  
  &:focus {
    outline: none;
    border-color: #2196F3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
`;

const SettingCheckbox = styled.input`
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const BreakoutBoxSettingsPanel: React.FC<BreakoutBoxSettingsPanelProps> = ({
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
  
  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, enabled: e.target.checked };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
    console.log('[DEBUG_PATTERN_DETECT] BreakoutBox enabled state changed:', e.target.checked);
  };

  const handleShowBreakoutBoxesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, showBreakoutBoxes: e.target.checked };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
    console.log('[DEBUG_PATTERN_DETECT] BreakoutBox visibility changed:', e.target.checked);
  };

  const handleShowLabelsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = { ...settings, showLabels: e.target.checked };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
    console.log('[DEBUG_PATTERN_DETECT] BreakoutBox labels visibility changed:', e.target.checked);
  };

  const handleMinStallLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 3);
    const newSettings = { ...settings, minStallLength: value };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
  };

  const handleBreakoutMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.1, Math.min(2.0, parseFloat(e.target.value) || 0.5));
    const newSettings = { ...settings, breakoutMultiplier: value };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
  };

  const handleStallThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0.01, Math.min(1.0, parseFloat(e.target.value) || 0.1));
    const newSettings = { ...settings, stallThreshold: value };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('patternSettings.breakoutbox', JSON.stringify(newSettings));
  };

  return (
    <SettingsContainer>
      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-enabled">
          Enable BreakoutBox Detection
        </SettingLabel>
        <SettingCheckbox
          id="breakoutbox-enabled"
          type="checkbox"
          checked={settings.enabled}
          onChange={handleEnabledChange}
          aria-label="Enable BreakoutBox Detection"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Enable BreakoutBox Detection"
          onMouseEnter={e => showTooltip('enabled', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('enabled', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-show">
          Show Breakout Boxes
        </SettingLabel>
        <SettingCheckbox
          id="breakoutbox-show"
          type="checkbox"
          checked={settings.showBreakoutBoxes}
          onChange={handleShowBreakoutBoxesChange}
          disabled={!settings.enabled}
          aria-label="Show Breakout Boxes"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Show Breakout Boxes"
          onMouseEnter={e => showTooltip('showBreakoutBoxes', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('showBreakoutBoxes', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-labels">
          Show Labels
        </SettingLabel>
        <SettingCheckbox
          id="breakoutbox-labels"
          type="checkbox"
          checked={settings.showLabels}
          onChange={handleShowLabelsChange}
          disabled={!settings.enabled}
          aria-label="Show Labels"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Show Labels"
          onMouseEnter={e => showTooltip('showLabels', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('showLabels', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-stall-length">
          Min Stall Length (candles)
        </SettingLabel>
        <SettingInput
          id="breakoutbox-stall-length"
          type="number"
          min="1"
          max="20"
          value={settings.minStallLength}
          onChange={handleMinStallLengthChange}
          disabled={!settings.enabled}
          aria-label="Min Stall Length (candles)"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Min Stall Length"
          onMouseEnter={e => showTooltip('minStallLength', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('minStallLength', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-multiplier">
          Breakout Multiplier
        </SettingLabel>
        <SettingInput
          id="breakoutbox-multiplier"
          type="number"
          min="0.1"
          max="2.0"
          step="0.1"
          value={settings.breakoutMultiplier}
          onChange={handleBreakoutMultiplierChange}
          disabled={!settings.enabled}
          aria-label="Breakout Multiplier"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Breakout Multiplier"
          onMouseEnter={e => showTooltip('breakoutMultiplier', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('breakoutMultiplier', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      <SettingRow>
        <SettingLabel htmlFor="breakoutbox-threshold">
          Stall Threshold (%)
        </SettingLabel>
        <SettingInput
          id="breakoutbox-threshold"
          type="number"
          min="0.01"
          max="1.0"
          step="0.01"
          value={settings.stallThreshold}
          onChange={handleStallThresholdChange}
          disabled={!settings.enabled}
          aria-label="Stall Threshold (%)"
        />
        <InfoIcon
          tabIndex={0}
          aria-label="Info: Stall Threshold"
          onMouseEnter={e => showTooltip('stallThreshold', e)}
          onMouseLeave={hideTooltip}
          onFocus={e => showTooltip('stallThreshold', e)}
          onBlur={hideTooltip}
        >i</InfoIcon>
      </SettingRow>

      {tooltip && (
        <Tooltip style={{ left: tooltip.pos.x, top: tooltip.pos.y }}>
          {helpText[tooltip.key]}
        </Tooltip>
      )}
    </SettingsContainer>
  );
};

export default BreakoutBoxSettingsPanel;
