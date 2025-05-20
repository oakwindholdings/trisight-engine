import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';
import { PatternType } from '../../models/PatternTypes';

const Container = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const SettingsTitle = styled.h3`
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

interface PivotSettingsPanelProps {
  settings: {
    touchPointThreshold: number;
    priceTolerance: number;
    confidenceThreshold: number;
    volumeReactionThreshold: number;
    minimumTouchGap: number;
    detectSupport: boolean;
    detectResistance: boolean;
  };
  onChange: (patternType: PatternType, settings: any) => void;
}

const PivotSettingsPanel: React.FC<PivotSettingsPanelProps> = ({ settings, onChange }) => {
  const handleChange = (key: string, value: any) => {
    onChange(PatternType.PIVOT, {
      ...settings,
      [key]: value,
    });
  };

  return (
    <Container>
      <SettingsTitle>Pivot Detection Settings</SettingsTitle>
      
      <CheckboxGroup>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.detectSupport}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('detectSupport', e.target.checked)}
          />
          Detect Support Pivots
        </StyledCheckboxLabel>
        <StyledCheckboxLabel>
          <StyledCheckbox
            type="checkbox"
            checked={settings.detectResistance}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange('detectResistance', e.target.checked)}
          />
          Detect Resistance Pivots
        </StyledCheckboxLabel>
      </CheckboxGroup>
      
      <SettingsGroup>
        <SettingItem>
          <SettingLabel>
            <Label>Min Touch Points</Label>
            <Value>{settings.touchPointThreshold}</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.touchPointThreshold}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('touchPointThreshold', parseInt(e.target.value))}
              step={1}
              min={2}
              max={5}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('priceTolerance', parseFloat(e.target.value))}
              step={0.05}
              min={0.1}
              max={0.5}
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
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('confidenceThreshold', parseFloat(e.target.value))}
              step={0.05}
              min={0.4}
              max={0.9}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Volume Reaction Threshold</Label>
            <Value>{settings.volumeReactionThreshold.toFixed(1)}x</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.volumeReactionThreshold}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('volumeReactionThreshold', parseFloat(e.target.value))}
              step={0.1}
              min={1.0}
              max={2.0}
            />
          </SliderContainer>
        </SettingItem>
        
        <SettingItem>
          <SettingLabel>
            <Label>Minimum Touch Gap</Label>
            <Value>{settings.minimumTouchGap} candles</Value>
          </SettingLabel>
          <SliderContainer>
            <StyledSlider
              type="range"
              value={settings.minimumTouchGap}
              onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange('minimumTouchGap', parseInt(e.target.value))}
              step={1}
              min={2}
              max={10}
            />
          </SliderContainer>
        </SettingItem>
      </SettingsGroup>
    </Container>
  );
};

export default PivotSettingsPanel;
