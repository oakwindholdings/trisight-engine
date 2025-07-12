// src/components/Patterns/BreakoutBoxSettingsPanel.tsx
// Independent settings panel for BreakoutBox pattern detection and display
// NOTE: TriSight uses Canvas, not SVG. Pattern rendering follows the lifecycle: detect → emit event → store in context → render.

import React from 'react';
import styled from 'styled-components';

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
        />
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
        />
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
        />
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
        />
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
        />
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
        />
      </SettingRow>
    </SettingsContainer>
  );
};

export default BreakoutBoxSettingsPanel;
