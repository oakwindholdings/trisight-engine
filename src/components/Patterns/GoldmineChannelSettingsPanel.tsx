// src/components/Patterns/GoldmineChannelSettingsPanel.tsx
// Settings for Goldmine Channel
// Adjust channel detection options
import React from 'react';
import styled from 'styled-components';
import { PatternType, ChannelDirection } from '../../models/PatternTypes';

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

interface GoldmineChannelSettings {
  enabled: boolean;
  minTouchPoints: number;
  priceTolerance: number;
  minChannelHeight: number;
  minChannelDuration: number;
  confidenceThreshold: number;
  preferredDirection: ChannelDirection | 'ALL';
  showLabels: boolean;
}

interface GoldmineChannelSettingsPanelProps {
  settings: GoldmineChannelSettings;
  onSettingsChange: (settings: GoldmineChannelSettings) => void;
}

const GoldmineChannelSettingsPanel: React.FC<GoldmineChannelSettingsPanelProps> = ({ 
  settings, 
  onSettingsChange 
}) => {
  const handleChange = (key: keyof GoldmineChannelSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <Container>
      <Title>Goldmine Channel Pattern Settings</Title>
      
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
          />
          Enable Goldmine Channel Detection
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
        <Label>Preferred Channel Direction</Label>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === 'ALL'}
            onChange={() => handleChange('preferredDirection', 'ALL')}
          />
          All Directions
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ChannelDirection.HORIZONTAL}
            onChange={() => handleChange('preferredDirection', ChannelDirection.HORIZONTAL)}
          />
          Horizontal
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ChannelDirection.ASCENDING}
            onChange={() => handleChange('preferredDirection', ChannelDirection.ASCENDING)}
          />
          Ascending
        </RadioLabel>
        <RadioLabel>
          <RadioInput
            type="radio"
            checked={settings.preferredDirection === ChannelDirection.DESCENDING}
            onChange={() => handleChange('preferredDirection', ChannelDirection.DESCENDING)}
          />
          Descending
        </RadioLabel>
      </RadioGroup>
      
      <SettingsGroup>
        <SettingItem>
          <SettingLabel>
            <Label>Minimum Touch Points</Label>
            <Value>{settings.minTouchPoints}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minTouchPoints}
              onChange={(e) => handleChange('minTouchPoints', parseInt(e.target.value))}
              step={1}
              min={3}
              max={7}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Price Tolerance (%)</Label>
            <Value>{settings.priceTolerance.toFixed(2)}%</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.priceTolerance}
              onChange={(e) => handleChange('priceTolerance', parseFloat(e.target.value))}
              step={0.05}
              min={0.1}
              max={0.5}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Channel Height (%)</Label>
            <Value>{settings.minChannelHeight.toFixed(1)}%</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minChannelHeight}
              onChange={(e) => handleChange('minChannelHeight', parseFloat(e.target.value))}
              step={0.1}
              min={0.5}
              max={3.0}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Min Channel Duration</Label>
            <Value>{settings.minChannelDuration} candles</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minChannelDuration}
              onChange={(e) => handleChange('minChannelDuration', parseInt(e.target.value))}
              step={1}
              min={10}
              max={50}
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

export default GoldmineChannelSettingsPanel;
