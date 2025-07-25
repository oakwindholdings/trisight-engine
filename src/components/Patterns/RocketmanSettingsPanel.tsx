// src/components/Patterns/RocketmanSettingsPanel.tsx
// Settings for Rocketman detector
// Control thrust phases
import React, { useState } from 'react';
import styled from 'styled-components';
import { PatternType, ThrustDirection } from '../../models/PatternTypes';

const Container = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

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
  position: absolute;
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

// Structured help text for each control
const helpText: Record<string, string> = {
  enabled: 'Enable or disable Rocketman pattern detection. Default: enabled.',
  showLabels: 'Show pattern labels on chart. Default: enabled.',
  preferredDirection: 'Choose which direction to detect: bullish, bearish, or both. Typical: both.',
  minAccelerationRate: 'Sets the minimum acceleration factor required for a Rocketman pattern. Default: 1.5. Range: 0.8–3.0. Higher values reduce false positives but may miss true breakouts.',
  minIntensity: 'Minimum price change percentage for pattern detection. Default: 3.0%. Range: 0.5–10%.',
  minMomentumScore: 'Minimum momentum score for pattern confirmation. Default: 0.5. Range: 0.3–1.0.',
  minVolumeConfirmation: 'Minimum volume confirmation threshold. Default: 0.6. Range: 0.3–1.0. Advanced: Changing this may significantly alter detection results.',
  lookbackPeriods: 'Number of periods to look back for pattern detection. Default: 5. Range: 3–200. Larger values increase detection window but may slow performance.',
  minCandles: 'Minimum number of candles to form a Rocketman pattern. Default: 5. Range: 3–20.',
  minPriceChange: 'Minimum price change (%) for pattern detection. Default: 3.0. Range: 0.5–10.',
  minAcceleration: 'Minimum acceleration factor. Default: 1.5. Range: 0.8–3.0.',
  minConfidence: 'Minimum confidence threshold for pattern emission. Default: 0.5. Range: 0.1–1.0.',
  maxLookbackPeriods: 'Maximum periods to analyze for detection. Default: 200. Range: 20–500. Advanced: Higher values may impact performance.',
};

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
`;

const Label = styled.span`
  font-size: 14px;
  color: #555;
`;

const Value = styled.span`
  font-size: 14px;
  color: #0056b3;
  font-weight: 500;
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
`;

const StyledCheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #555;
`;

const StyledCheckbox = styled.input`
  margin-right: 8px;
`;

const SliderContainer = styled.div`
  width: 100%;
`;

const StyledSlider = styled.input`
  width: 100%;
  height: 4px;
  appearance: none;
  background: #e0e0e0;
  outline: none;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0056b3;
    cursor: pointer;
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0056b3;
    cursor: pointer;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const RadioLabel = styled.label`
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #555;
  cursor: pointer;
`;

const RadioInput = styled.input`
  margin-right: 8px;
`;

interface RocketmanSettings {
  enabled: boolean;
  minAccelerationRate: number;
  minIntensity: number;
  minMomentumScore: number;
  minVolumeConfirmation: number;
  lookbackPeriods: number;
  preferredDirection: ThrustDirection | 'BOTH';
  showLabels: boolean;
  minCandles: number;
  minPriceChange: number;
  minAcceleration: number;
  minConfidence: number;
  maxLookbackPeriods: number;
}

interface RocketmanSettingsPanelProps {
  settings: RocketmanSettings;
  onSettingsChange: (settings: RocketmanSettings) => void;
}


const RocketmanSettingsPanel: React.FC<RocketmanSettingsPanelProps> = ({ settings, onSettingsChange }) => {
  const [tooltip, setTooltip] = useState<{ key: string; pos: { x: number; y: number } } | null>(null);

  const handleChange = (key: keyof RocketmanSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    onSettingsChange(newSettings);
    localStorage.setItem('rocketmanSettings', JSON.stringify(newSettings));
  };

  // Helper to show tooltip down and to the left of icon
  const showTooltip = (key: string, e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    // Tooltip floats down and to the left, with a small offset
    const tooltipWidth = 260; // matches max-width in styled component
    let x = rect.left - tooltipWidth - 8;
    if (x < 8) x = 8; // prevent overflow left
    const y = rect.bottom + 8;
    setTooltip({ key, pos: { x, y } });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <Container>
      <Title>Rocketman Pattern Settings</Title>
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            aria-label="Enable Rocketman Detection"
          />
          Enable Rocketman Detection
          <InfoIcon
            tabIndex={0}
            aria-label="Info: Enable Rocketman Detection"
            onMouseEnter={(e) => showTooltip('enabled', e)}
            onMouseLeave={hideTooltip}
            onFocus={(e) => showTooltip('enabled', e)}
            onBlur={hideTooltip}
          >i</InfoIcon>
        </StyledCheckboxLabel>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.showLabels}
            onChange={(e) => handleChange('showLabels', e.target.checked)}
            aria-label="Show Labels"
          />
          Show Labels
          <InfoIcon
            tabIndex={0}
            aria-label="Info: Show Labels"
            onMouseEnter={(e) => showTooltip('showLabels', e)}
            onMouseLeave={hideTooltip}
            onFocus={(e) => showTooltip('showLabels', e)}
            onBlur={hideTooltip}
          >i</InfoIcon>
        </StyledCheckboxLabel>
      </CheckboxGroup>
      <RadioGroup>
        <Label>Preferred Direction</Label>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === 'BOTH'}
            onChange={() => handleChange('preferredDirection', 'BOTH')}
            aria-label="Both Directions"
          />
          Both Directions
          <InfoIcon
            tabIndex={0}
            aria-label="Info: Preferred Direction"
            onMouseEnter={(e) => showTooltip('preferredDirection', e)}
            onMouseLeave={hideTooltip}
            onFocus={(e) => showTooltip('preferredDirection', e)}
            onBlur={hideTooltip}
          >i</InfoIcon>
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ThrustDirection.BULLISH}
            onChange={() => handleChange('preferredDirection', ThrustDirection.BULLISH)}
            aria-label="Bullish"
          />
          Bullish
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ThrustDirection.BEARISH}
            onChange={() => handleChange('preferredDirection', ThrustDirection.BEARISH)}
            aria-label="Bearish"
          />
          Bearish
        </RadioLabel>
      </RadioGroup>
      <SettingsGroup>
        {/* Existing controls with info bubbles */}
        {[
          { key: 'minAccelerationRate', label: 'Min Acceleration Rate', value: settings.minAccelerationRate, step: 0.01, min: 0.8, max: 3.0 },
          { key: 'minIntensity', label: 'Min Intensity', value: settings.minIntensity, step: 0.05, min: 0.5, max: 10.0 },
          { key: 'minMomentumScore', label: 'Min Momentum Score', value: settings.minMomentumScore, step: 0.05, min: 0.3, max: 1.0 },
          { key: 'minVolumeConfirmation', label: 'Min Volume Confirmation', value: settings.minVolumeConfirmation, step: 0.05, min: 0.3, max: 1.0 },
          { key: 'lookbackPeriods', label: 'Lookback Periods', value: settings.lookbackPeriods, step: 1, min: 3, max: 200 },
          { key: 'minCandles', label: 'Min Candles', value: settings.minCandles, step: 1, min: 3, max: 20 },
          { key: 'minPriceChange', label: 'Min Price Change (%)', value: settings.minPriceChange, step: 0.1, min: 0.5, max: 10 },
          { key: 'minAcceleration', label: 'Min Acceleration', value: settings.minAcceleration, step: 0.01, min: 0.8, max: 3.0 },
          { key: 'minConfidence', label: 'Min Confidence', value: settings.minConfidence, step: 0.01, min: 0.1, max: 1.0 },
          { key: 'maxLookbackPeriods', label: 'Max Lookback Periods', value: settings.maxLookbackPeriods, step: 1, min: 20, max: 500 },
        ].map(({ key, label, value, step, min, max }) => (
          <SettingItem key={key}>
            <SettingLabel>
              <Label>{label}</Label>
              <Value>{typeof value === 'number' ? value.toFixed(2) : value}</Value>
              <InfoIcon
                tabIndex={0}
                aria-label={`Info: ${label}`}
                onMouseEnter={(e) => showTooltip(key, e)}
                onMouseLeave={hideTooltip}
                onFocus={(e) => showTooltip(key, e)}
                onBlur={hideTooltip}
              >i</InfoIcon>
            </SettingLabel>
            <SliderContainer>
              <StyledSlider
                type="range"
                value={value}
                onChange={(e) => handleChange(key as keyof RocketmanSettings, step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
                step={step}
                min={min}
                max={max}
                aria-label={label}
              />
            </SliderContainer>
          </SettingItem>
        ))}
      </SettingsGroup>
      {tooltip && (
        <Tooltip style={{ position: 'fixed', left: tooltip.pos.x, top: tooltip.pos.y }}>
          {helpText[tooltip.key]}
        </Tooltip>
      )}
    </Container>
  );
};

export default RocketmanSettingsPanel;
