// src/components/Patterns/GoldmineShaftSettingsPanel.tsx
// Settings for Goldmine Shaft
// Adjust thrust and retrace options
// ...existing code...
import styled from 'styled-components';
import { PatternType, ThrustDirection } from '../../models/PatternTypes';
import React, { useState } from 'react';
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

const helpText: Record<string, string> = {
  enabled: 'Enable or disable Goldmine Shaft pattern detection. Default: enabled.',
  showLabels: 'Show pattern labels on chart. Default: enabled.',
  preferredDirection: 'Choose which direction to detect: bullish, bearish, or both. Typical: both.',
  minThrustMagnitude: 'Minimum thrust magnitude (%). Default: 0.75. Range: 0.5–5.0. Higher values reduce false positives.',
  minRetracementPercentage: 'Minimum retracement percentage. Default: 23.6. Range: 20–40. Typical: Fibonacci 23.6%.',
  maxRetracementPercentage: 'Maximum retracement percentage. Default: 78.6. Range: 50–80. Typical: Fibonacci 78.6%.',
  thrustDurationMin: 'Minimum number of candles for thrust phase. Default: 2. Range: 1–10.',
  thrustDurationMax: 'Maximum number of candles for thrust phase. Default: 10. Range: 2–20.',
  retracementTolerance: 'Tolerance around ideal retracement. Default: 15%. Range: 5–30%.',
  maxVolatilityMultiplier: 'Maximum volatility multiplier during retracement. Default: 1.5. Range: 1.0–3.0. Advanced: Higher values may impact reliability.',
  confidenceThreshold: 'Minimum confidence threshold for pattern emission. Default: 0.35. Range: 0.1–1.0.',
};
// ...existing code...

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
  // ...existing code...
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

interface GoldmineShaftSettings {
  enabled: boolean;
  showLabels: boolean;
  minThrustMagnitude: number;
  minRetracementPercentage: number;
  maxRetracementPercentage: number;
  thrustDurationRange: [number, number];
  preferredDirection: ThrustDirection | 'BOTH';
  confidenceThreshold: number;
}

interface GoldmineShaftSettingsPanelProps {
  settings: GoldmineShaftSettings;
  onSettingsChange: (settings: GoldmineShaftSettings) => void;
}

const GoldmineShaftSettingsPanel: React.FC<GoldmineShaftSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const [tooltip, setTooltip] = useState<{ key: string; pos: { x: number; y: number } } | null>(null);

  const handleChange = (key: keyof GoldmineShaftSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    onSettingsChange(newSettings);
    localStorage.setItem('goldmineShaftSettings', JSON.stringify(newSettings));
  };

  // Helper to show tooltip down and to the left of icon
  const showTooltip = (key: string, e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const tooltipWidth = 260;
    let x = rect.left - tooltipWidth - 8;
    if (x < 8) x = 8;
    const y = rect.bottom + 8;
    setTooltip({ key, pos: { x, y } });
  };
  const hideTooltip = () => setTooltip(null);

  return (
    <Container>
      <Title>Goldmine Shaft Pattern Settings</Title>
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            aria-label="Enable Goldmine Shaft Detection"
          />
          Enable Goldmine Shaft Detection
          <InfoIcon
            tabIndex={0}
            aria-label="Info: Enable Goldmine Shaft Detection"
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
        <Label>Preferred Thrust Direction</Label>
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
        {/* Controls for all detector parameters with info bubbles */}
        {[
          { key: 'minThrustMagnitude', label: 'Min Thrust Magnitude (%)', value: settings.minThrustMagnitude, step: 0.1, min: 0.5, max: 5.0 },
          { key: 'minRetracementPercentage', label: 'Min Retracement (%)', value: settings.minRetracementPercentage, step: 0.1, min: 20, max: 40 },
          { key: 'maxRetracementPercentage', label: 'Max Retracement (%)', value: settings.maxRetracementPercentage, step: 0.1, min: 50, max: 80 },
          { key: 'confidenceThreshold', label: 'Confidence Threshold', value: settings.confidenceThreshold, step: 0.05, min: 0.1, max: 1.0 },
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
                onChange={(e) => handleChange(key as keyof GoldmineShaftSettings, step === 1 ? parseInt(e.target.value) : parseFloat(e.target.value))}
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

export default GoldmineShaftSettingsPanel;
