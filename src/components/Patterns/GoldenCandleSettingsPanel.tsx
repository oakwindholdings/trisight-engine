// src/components/Patterns/GoldenCandleSettingsPanel.tsx
// Settings for Golden Candle patterns
// Adjust golden candle detection options and display settings

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const Title = styled.h3`
  font-size: 16px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
`;

const SettingsGroup = styled.div`
  margin-bottom: 20px;
`;

const SettingItem = styled.div`
  margin-bottom: 16px;
`;

const SettingLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Checkbox = styled.input`
  margin: 0;
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #555;
  cursor: pointer;
  user-select: none;
`;

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Slider = styled.input`
  flex: 1;
  height: 4px;
  background: #ddd;
  outline: none;
  border-radius: 2px;
  cursor: pointer;

  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #10b981;
    cursor: pointer;
    border-radius: 50%;
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    background: #10b981;
    cursor: pointer;
    border-radius: 50%;
    border: none;
  }
`;

const SliderValue = styled.span`
  min-width: 40px;
  text-align: right;
  font-size: 13px;
  color: #666;
`;

const SelectContainer = styled.div`
  position: relative;
`;

const Select = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background: white;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #10b981;
  }
`;

export interface GoldenCandleSettings {
  enabled: boolean;
  showLabels: boolean;
  showForensics: boolean; // Enable forensic near-miss overlay
  showNearMiss: boolean; // Enable Dick O'Leary near-miss highlighting
  showEntryExitLabels: boolean; // TriSight Detection Input Refactor Patch v1.3.3: Toggle ENTRY/EXIT label visibility
  minContinuanceCount: number;
  minCumulativeScore: number;
  confidenceThreshold: number;
  intrinsicScoreRequired: number;
  preferredDirection: 'LONG' | 'SHORT' | 'BOTH';
  trailingStopPercent: number; // TriSight Detection Input Refactor Patch v1.3.1: Trailing stop threshold (%)
  stopLossPercent: number; // TriSight Detection Input Refactor Patch v1.3.2: Stop-Loss % (Exit)
}

interface GoldenCandleSettingsPanelProps {
  settings: GoldenCandleSettings;
  onSettingsChange: (settings: GoldenCandleSettings) => void;
  // Filter functionality
  showOnlyGoldenCandles: boolean;
  onShowOnlyGoldenCandlesChange: (show: boolean) => void;
  goldenCandleCount: number;
  isLoading?: boolean;
}

export const GoldenCandleSettingsPanel: React.FC<GoldenCandleSettingsPanelProps> = ({
  settings,
  onSettingsChange,
  showOnlyGoldenCandles,
  onShowOnlyGoldenCandlesChange,
  goldenCandleCount,
  isLoading = false
}) => {
  const handleSettingChange = (key: keyof GoldenCandleSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Container>
      <Title>Golden Candle Settings</Title>
      
      {/* Filter Section */}
      <SettingsGroup>
        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="show-only-golden-candles"
              checked={showOnlyGoldenCandles}
              onChange={(e) => onShowOnlyGoldenCandlesChange(e.target.checked)}
            />
            <CheckboxLabel htmlFor="show-only-golden-candles">
              Show only Golden Candles
            </CheckboxLabel>
          </CheckboxContainer>
          <div style={{ 
            fontSize: '12px', 
            color: '#666', 
            marginTop: '4px' 
          }}>
            {isLoading ? 'Loading...' : `${goldenCandleCount} Golden Candles detected`}
          </div>
        </SettingItem>
      </SettingsGroup>
      
      {/* Detection Settings */}
      <SettingsGroup>
        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="goldenCandle-enabled"
              checked={settings.enabled}
              onChange={(e) => handleSettingChange('enabled', e.target.checked)}
            />
            <CheckboxLabel htmlFor="goldenCandle-enabled">
              Enable Golden Candle Detection
            </CheckboxLabel>
          </CheckboxContainer>
        </SettingItem>

        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="goldenCandle-showLabels"
              checked={settings.showLabels}
              onChange={(e) => handleSettingChange('showLabels', e.target.checked)}
            />
            <CheckboxLabel htmlFor="goldenCandle-showLabels">
              Show Pattern Labels
            </CheckboxLabel>
          </CheckboxContainer>
        </SettingItem>

        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="goldenCandle-showForensics"
              checked={settings.showForensics}
              onChange={(e) => handleSettingChange('showForensics', e.target.checked)}
            />
            <CheckboxLabel htmlFor="goldenCandle-showForensics">
              Show Forensic Overlay
            </CheckboxLabel>
          </CheckboxContainer>
        </SettingItem>

        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="goldenCandle-showNearMiss"
              checked={settings.showNearMiss}
              onChange={(e) => handleSettingChange('showNearMiss', e.target.checked)}
            />
            <CheckboxLabel htmlFor="goldenCandle-showNearMiss">
              Show Near-Miss Highlighting
            </CheckboxLabel>
          </CheckboxContainer>
        </SettingItem>

        <SettingItem>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              id="goldenCandle-showEntryExitLabels"
              checked={settings.showEntryExitLabels}
              onChange={(e) => handleSettingChange('showEntryExitLabels', e.target.checked)}
            />
            <CheckboxLabel htmlFor="goldenCandle-showEntryExitLabels">
              Show ENTRY/EXIT Labels
            </CheckboxLabel>
          </CheckboxContainer>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Toggle visibility of ENTRY and EXIT labels on Golden Candles
          </div>
        </SettingItem>
      </SettingsGroup>

      <SettingsGroup>
        <SettingItem>
          <SettingLabel>
            <span>Min Continuance Count</span>
            <SliderValue>{settings.minContinuanceCount}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.minContinuanceCount}
              onChange={(e) => handleSettingChange('minContinuanceCount', parseInt(e.target.value))}
            />
          </SliderContainer>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Min Cumulative Score</span>
            <SliderValue>{settings.minCumulativeScore}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.minCumulativeScore}
              onChange={(e) => handleSettingChange('minCumulativeScore', parseInt(e.target.value))}
            />
          </SliderContainer>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Confidence Threshold</span>
            <SliderValue>{settings.confidenceThreshold.toFixed(2)}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={settings.confidenceThreshold}
              onChange={(e) => handleSettingChange('confidenceThreshold', parseFloat(e.target.value))}
            />
          </SliderContainer>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Required Intrinsic Score</span>
            <SliderValue>±{settings.intrinsicScoreRequired}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={1}
              max={3}
              step={1}
              value={settings.intrinsicScoreRequired}
              onChange={(e) => handleSettingChange('intrinsicScoreRequired', parseInt(e.target.value))}
            />
          </SliderContainer>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Trailing Stop Threshold (%)</span>
            <SliderValue>{(settings.trailingStopPercent || 2.0).toFixed(2)}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={0.1}
              max={10.0}
              step={0.1}
              value={settings.trailingStopPercent || 2.0}
              onChange={(e) => handleSettingChange('trailingStopPercent', parseFloat(e.target.value))}
            />
          </SliderContainer>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Stop-Loss % (Exit)</span>
            <SliderValue>{(settings.stopLossPercent || 2.0).toFixed(2)}</SliderValue>
          </SettingLabel>
          <SliderContainer>
            <Slider
              type="range"
              min={0.1}
              max={10.0}
              step={0.1}
              value={settings.stopLossPercent || 2.0}
              onChange={(e) => handleSettingChange('stopLossPercent', parseFloat(e.target.value))}
            />
          </SliderContainer>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            Defines exit risk threshold post-entry. If exceeded, candle is invalidated.
          </div>
        </SettingItem>

        <SettingItem>
          <SettingLabel>
            <span>Preferred Direction</span>
          </SettingLabel>
          <SelectContainer>
            <Select
              value={settings.preferredDirection}
              onChange={(e) => handleSettingChange('preferredDirection', e.target.value as 'LONG' | 'SHORT' | 'BOTH')}
            >
              <option value="BOTH">Both Long & Short</option>
              <option value="LONG">Long Only</option>
              <option value="SHORT">Short Only</option>
            </Select>
          </SelectContainer>
        </SettingItem>
      </SettingsGroup>
    </Container>
  );
};

export default GoldenCandleSettingsPanel;
