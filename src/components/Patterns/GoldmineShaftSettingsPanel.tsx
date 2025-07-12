// src/components/Patterns/GoldmineShaftSettingsPanel.tsx
// Settings for Goldmine Shaft
// Adjust thrust and retrace options
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
  const handleChange = (key: keyof GoldmineShaftSettings, value: any) => {
    const newSettings = {
      ...settings,
      [key]: value
    };
    onSettingsChange(newSettings);
    
    // Persist to localStorage
    localStorage.setItem('goldmineShaftSettings', JSON.stringify(newSettings));
  };

  return (
    <Container>
      <Title>Goldmine Shaft Pattern Settings</Title>
      
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
          Enable Goldmine Shaft Detection
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
        <Label>Preferred Thrust Direction</Label>
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
            <Label>Min Thrust Magnitude (%)</Label>
            <Value>{settings.minThrustMagnitude.toFixed(1)}%</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minThrustMagnitude}
              onChange={(e) => handleChange('minThrustMagnitude', parseFloat(e.target.value))}
              step={0.1}
              min={0.5}
              max={5.0}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Retracement (%)</Label>
            <Value>{settings.minRetracementPercentage.toFixed(1)}%</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minRetracementPercentage}
              onChange={(e) => handleChange('minRetracementPercentage', parseFloat(e.target.value))}
              step={0.1}
              min={20}
              max={40}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Max Retracement (%)</Label>
            <Value>{settings.maxRetracementPercentage.toFixed(1)}%</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.maxRetracementPercentage}
              onChange={(e) => handleChange('maxRetracementPercentage', parseFloat(e.target.value))}
              step={0.1}
              min={50}
              max={80}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Confidence Threshold</Label>
            <Value>{settings.confidenceThreshold.toFixed(2)}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.confidenceThreshold}
              onChange={(e) => handleChange('confidenceThreshold', parseFloat(e.target.value))}
              step={0.05}
              min={0.4}
              max={0.9}
            />
          </SliderContainer>
        </SettingItem>
      </SettingsGroup>
    </Container>
  );
};

export default GoldmineShaftSettingsPanel;
