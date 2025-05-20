import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ThrustDirection } from '../../models/PatternTypes';

interface EscalatorSettings {
  enabled: boolean;
  minSteps: number;
  minStepSize: number;
  maxConsolidationVolatility: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
  useContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  minScore: number;
  preferredDirection: ThrustDirection | 'BOTH';
}

interface EscalatorSettingsPanelProps {
  settings: EscalatorSettings;
  onSettingsChange: (settings: EscalatorSettings) => void;
}

const SettingsContainer = styled.div`
  padding: 16px;
  font-family: 'Roboto', sans-serif;
`;

const SettingsTitle = styled.h3`
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 16px;
  color: #333;
`;

const SettingsRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
`;

const SettingsLabel = styled.label`
  font-size: 14px;
  color: #555;
  flex: 1;
`;

const SettingsSlider = styled.input`
  flex: 2;
`;

const SettingsValue = styled.span`
  font-size: 14px;
  color: #333;
  width: 40px;
  text-align: center;
`;

const SettingsToggle = styled.input`
  margin-right: 8px;
`;

const DirectionSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
`;

export const EscalatorSettingsPanel: React.FC<EscalatorSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('escalatorSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        onSettingsChange(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading Escalator settings from localStorage', error);
    }
  }, [onSettingsChange]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('escalatorSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving Escalator settings to localStorage', error);
    }
  }, [settings]);

  const handleEnableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, enabled: e.target.checked });
  };
  
  const handleMinStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minSteps: parseInt(e.target.value, 10) });
  };
  
  const handleMinStepSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minStepSize: parseFloat(e.target.value) });
  };
  
  const handleMaxVolatilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, maxConsolidationVolatility: parseFloat(e.target.value) });
  };
  
  const handleBasePriceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, basePriceChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleBaseVolumeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, baseVolumeChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleUseContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, useContextTimeframe: e.target.checked });
  };
  
  const handleContextMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, contextTimeframeMultiplier: parseInt(e.target.value, 10) });
  };
  
  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minScore: parseInt(e.target.value, 10) });
  };
  
  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSettingsChange({ 
      ...settings, 
      preferredDirection: e.target.value as ThrustDirection | 'BOTH' 
    });
  };
  
  return (
    <SettingsContainer>
      <SettingsTitle>Escalator Pattern Settings</SettingsTitle>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="enableEscalator"
          checked={settings.enabled}
          onChange={handleEnableChange}
        />
        <SettingsLabel htmlFor="enableEscalator">Enable Escalator Detection</SettingsLabel>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Preferred Direction</SettingsLabel>
        <DirectionSelect 
          value={settings.preferredDirection} 
          onChange={handleDirectionChange}
        >
          <option value="BOTH">Both Directions</option>
          <option value="BULLISH">Bullish Only (Up)</option>
          <option value="BEARISH">Bearish Only (Down)</option>
        </DirectionSelect>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Minimum Steps</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={2} 
          max={10} 
          step={1}
          value={settings.minSteps}
          onChange={handleMinStepsChange}
        />
        <SettingsValue>{settings.minSteps}</SettingsValue>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Min Step Size (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.1} 
          max={2.0} 
          step={0.1}
          value={settings.minStepSize}
          onChange={handleMinStepSizeChange}
        />
        <SettingsValue>{settings.minStepSize.toFixed(1)}</SettingsValue>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Max Consolidation Vol (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.2} 
          max={3.0} 
          step={0.2}
          value={settings.maxConsolidationVolatility}
          onChange={handleMaxVolatilityChange}
        />
        <SettingsValue>{settings.maxConsolidationVolatility.toFixed(1)}</SettingsValue>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Price Change Threshold (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.01} 
          max={0.5} 
          step={0.01}
          value={settings.basePriceChangeThreshold}
          onChange={handleBasePriceThresholdChange}
        />
        <SettingsValue>{settings.basePriceChangeThreshold.toFixed(2)}</SettingsValue>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Volume Change Threshold (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.1} 
          max={2.0} 
          step={0.1}
          value={settings.baseVolumeChangeThreshold}
          onChange={handleBaseVolumeThresholdChange}
        />
        <SettingsValue>{settings.baseVolumeChangeThreshold.toFixed(1)}</SettingsValue>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="useContext"
          checked={settings.useContextTimeframe}
          onChange={handleUseContextChange}
        />
        <SettingsLabel htmlFor="useContext">Use Context Timeframe</SettingsLabel>
      </SettingsRow>
      
      {settings.useContextTimeframe && (
        <SettingsRow>
          <SettingsLabel>Context Multiplier</SettingsLabel>
          <SettingsSlider 
            type="range" 
            min={2} 
            max={10} 
            step={1}
            value={settings.contextTimeframeMultiplier}
            onChange={handleContextMultiplierChange}
          />
          <SettingsValue>{settings.contextTimeframeMultiplier}x</SettingsValue>
        </SettingsRow>
      )}
      
      <SettingsRow>
        <SettingsLabel>Minimum Score</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={1} 
          max={7} 
          step={1}
          value={settings.minScore}
          onChange={handleMinScoreChange}
        />
        <SettingsValue>{settings.minScore}</SettingsValue>
      </SettingsRow>
    </SettingsContainer>
  );
};

export default EscalatorSettingsPanel;
