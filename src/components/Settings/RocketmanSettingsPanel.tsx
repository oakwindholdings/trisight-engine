// src/components/Settings/RocketmanSettingsPanel.tsx
// Settings for Rocketman detector
// Edit thrust thresholds
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { RocketmanThresholdConfig } from '../../utils/patternDetection/AdaptiveRocketmanDetector';
import { usePatternDetectionPreferences } from '../../hooks/usePatternDetectionPreferences';
import { ThrustDirection } from '../../models/PatternTypes';

const SettingsContainer = styled.div`
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
`;

const SettingsHeader = styled.h3`
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #212529;
`;

const SettingsForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SettingsRow = styled.div`
  display: flex;
  gap: 16px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const Label = styled.label`
  font-size: 14px;
  color: #495057;
  margin-bottom: 4px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  color: #212529;

  &:focus {
    outline: none;
    border-color: #7952b3;
    box-shadow: 0 0 0 0.2rem rgba(121, 82, 179, 0.25);
  }

  &:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CheckboxInput = styled.input`
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  font-size: 14px;
  color: #495057;
  cursor: pointer;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #7952b3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #6741a2;
  }

  &:disabled {
    background-color: #a991d4;
    cursor: not-allowed;
  }
`;

const DirectionGroup = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 8px;
`;

/**
 * Settings panel for configuring Rocketman pattern detection parameters
 */
const RocketmanSettingsPanel: React.FC = () => {
  const { getPatternOptions, updatePatternOptions } = usePatternDetectionPreferences();
  
  // Default values if not set
  const defaultConfig: RocketmanThresholdConfig = {
    minAcceleration: 1.5,
    minPriceChange: 3.0,
    volumeConfirmationThreshold: 0.6,
    minAccelerationLength: 3,
    detectBullish: true,
    detectBearish: true,
    thrustPercentMin: 1.5,
    retracementMin: 0,
    retracementMax: 0,
    confidenceThreshold: 0.5
  };
  
  // Get current settings or use defaults
  const currentOptions = getPatternOptions('rocketman') as Partial<RocketmanThresholdConfig> || {};
  const initialConfig = { ...defaultConfig, ...currentOptions };
  
  // State for form values
  const [config, setConfig] = useState<RocketmanThresholdConfig>(initialConfig);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  
  // Update state when options change externally
  useEffect(() => {
    const options = getPatternOptions('rocketman') as Partial<RocketmanThresholdConfig> || {};
    setConfig({ ...defaultConfig, ...options });
    setHasChanges(false);
  }, [getPatternOptions]);
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : parseFloat(value)
    }));
    
    setHasChanges(true);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePatternOptions('rocketman', config);
    setHasChanges(false);
  };
  
  // Reset to defaults
  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };
  
  return (
    <SettingsContainer>
      <SettingsHeader>Rocketman Pattern Settings</SettingsHeader>
      
      <SettingsForm onSubmit={handleSubmit}>
        <SettingsRow>
          <FormGroup>
            <Label htmlFor="minAcceleration">Minimum Acceleration Factor</Label>
            <Input
              type="number"
              id="minAcceleration"
              name="minAcceleration"
              min="1.0"
              max="5.0"
              step="0.1"
              value={config.minAcceleration}
              onChange={handleInputChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="minPriceChange">Minimum Price Change (%)</Label>
            <Input
              type="number"
              id="minPriceChange"
              name="minPriceChange"
              min="0.5"
              max="10.0"
              step="0.5"
              value={config.minPriceChange}
              onChange={handleInputChange}
            />
          </FormGroup>
        </SettingsRow>
        
        <SettingsRow>
          <FormGroup>
            <Label htmlFor="volumeConfirmationThreshold">Volume Confirmation Threshold</Label>
            <Input
              type="number"
              id="volumeConfirmationThreshold"
              name="volumeConfirmationThreshold"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.volumeConfirmationThreshold}
              onChange={handleInputChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label htmlFor="minAccelerationLength">Minimum Acceleration Length</Label>
            <Input
              type="number"
              id="minAccelerationLength"
              name="minAccelerationLength"
              min="2"
              max="10"
              step="1"
              value={config.minAccelerationLength}
              onChange={handleInputChange}
            />
          </FormGroup>
        </SettingsRow>
        
        <SettingsRow>
          <FormGroup>
            <Label htmlFor="confidenceThreshold">Confidence Threshold</Label>
            <Input
              type="number"
              id="confidenceThreshold"
              name="confidenceThreshold"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.confidenceThreshold}
              onChange={handleInputChange}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Pattern Direction</Label>
            <DirectionGroup>
              <Checkbox>
                <CheckboxInput
                  type="checkbox"
                  id="detectBullish"
                  name="detectBullish"
                  checked={config.detectBullish}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="detectBullish">Bullish</CheckboxLabel>
              </Checkbox>
              
              <Checkbox>
                <CheckboxInput
                  type="checkbox"
                  id="detectBearish"
                  name="detectBearish"
                  checked={config.detectBearish}
                  onChange={handleInputChange}
                />
                <CheckboxLabel htmlFor="detectBearish">Bearish</CheckboxLabel>
              </Checkbox>
            </DirectionGroup>
          </FormGroup>
        </SettingsRow>
        
        <SettingsRow>
          <Button type="submit" disabled={!hasChanges}>
            Apply Changes
          </Button>
          <Button type="button" onClick={handleReset} disabled={!hasChanges}>
            Reset to Defaults
          </Button>
        </SettingsRow>
      </SettingsForm>
    </SettingsContainer>
  );
};

export default RocketmanSettingsPanel;
