// src/components/Patterns/RocketmanSettingsPanel.tsx
// Settings for Rocketman detector
// Control thrust phases
import React from 'react';
import styled from 'styled-components';
import { PatternType, ThrustDirection } from '../../models/PatternTypes';

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
}

interface RocketmanSettingsPanelProps {
  settings: RocketmanSettings;
  onSettingsChange: (settings: RocketmanSettings) => void;
}

const RocketmanSettingsPanel: React.FC<RocketmanSettingsPanelProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const handleChange = (key: keyof RocketmanSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('rocketmanSettings', JSON.stringify(newSettings));
  };

  return (
    <Container>
      <Title>Rocketman Pattern Settings</Title>
      
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
          Enable Rocketman Detection
        </StyledCheckboxLabel>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.showLabels}
            onChange={(e) => handleChange('showLabels', e.target.checked)}
          />
          Show Labels
        </StyledCheckboxLabel>
      </CheckboxGroup>
      
      <RadioGroup>
        <Label>Preferred Direction</Label>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === 'BOTH'}
            onChange={() => handleChange('preferredDirection', 'BOTH')}
          />
          Both Directions
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ThrustDirection.BULLISH}
            onChange={() => handleChange('preferredDirection', ThrustDirection.BULLISH)}
          />
          Bullish
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ThrustDirection.BEARISH}
            onChange={() => handleChange('preferredDirection', ThrustDirection.BEARISH)}
          />
          Bearish
        </RadioLabel>
      </RadioGroup>
      
      <SettingsGroup>
        <SettingItem>
          <SettingLabel>
            <Label>Min Acceleration Rate</Label>
            <Value>{settings.minAccelerationRate.toFixed(2)}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minAccelerationRate}
              onChange={(e) => handleChange('minAccelerationRate', parseFloat(e.target.value))}
              step={0.01}
              min={0.1}
              max={0.5}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Intensity</Label>
            <Value>{settings.minIntensity.toFixed(2)}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minIntensity}
              onChange={(e) => handleChange('minIntensity', parseFloat(e.target.value))}
              step={0.05}
              min={0.3}
              max={0.8}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Momentum Score</Label>
            <Value>{settings.minMomentumScore.toFixed(2)}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minMomentumScore}
              onChange={(e) => handleChange('minMomentumScore', parseFloat(e.target.value))}
              step={0.05}
              min={0.4}
              max={0.9}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Volume Confirmation</Label>
            <Value>{settings.minVolumeConfirmation.toFixed(2)}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minVolumeConfirmation}
              onChange={(e) => handleChange('minVolumeConfirmation', parseFloat(e.target.value))}
              step={0.05}
              min={0.3}
              max={0.8}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Lookback Periods</Label>
            <Value>{settings.lookbackPeriods}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.lookbackPeriods}
              onChange={(e) => handleChange('lookbackPeriods', parseInt(e.target.value))}
              step={1}
              min={3}
              max={15}
            />
          </SliderContainer>
        </SettingItem>
      </SettingsGroup>
    </Container>
  );
};

export default RocketmanSettingsPanel;
