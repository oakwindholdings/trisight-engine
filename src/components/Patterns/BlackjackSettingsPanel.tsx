import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface BlackjackSettings {
  enabled: boolean;
  lookbackPeriods: number;
  minScore: number;
  showContextTimeframe: boolean;
  contextTimeframeMultiplier: number;
  basePriceChangeThreshold: number;
  baseVolumeChangeThreshold: number;
}

interface BlackjackSettingsPanelProps {
  settings: BlackjackSettings;
  onSettingsChange: (settings: BlackjackSettings) => void;
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
  width: 30px;
  text-align: center;
`;

const SettingsToggle = styled.input`
  margin-right: 8px;
`;

export const BlackjackSettingsPanel: React.FC<BlackjackSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  // Load settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('blackjackSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        onSettingsChange(parsedSettings);
      }
    } catch (error) {
      console.error('Error loading BlackJack settings from localStorage', error);
    }
  }, [onSettingsChange]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('blackjackSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving BlackJack settings to localStorage', error);
    }
  }, [settings]);

  const handleEnableChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, enabled: e.target.checked });
  };
  
  const handleLookbackChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, lookbackPeriods: parseInt(e.target.value, 10) });
  };
  
  const handleMinScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, minScore: parseInt(e.target.value, 10) });
  };
  
  const handleShowContextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, showContextTimeframe: e.target.checked });
  };
  
  const handleContextMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, contextTimeframeMultiplier: parseInt(e.target.value, 10) });
  };

  const handleBasePriceThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, basePriceChangeThreshold: parseFloat(e.target.value) });
  };
  
  const handleBaseVolumeThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, baseVolumeChangeThreshold: parseFloat(e.target.value) });
  };
  
  return (
    <SettingsContainer>
      <SettingsTitle>BlackJack Pattern Settings</SettingsTitle>
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="enableBlackjack"
          checked={settings.enabled}
          onChange={handleEnableChange}
        />
        <SettingsLabel htmlFor="enableBlackjack">Enable BlackJack Detection</SettingsLabel>
      </SettingsRow>
      
      <SettingsRow>
        <SettingsLabel>Lookback Periods</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={3} 
          max={21} 
          step={2}
          value={settings.lookbackPeriods}
          onChange={handleLookbackChange}
        />
        <SettingsValue>{settings.lookbackPeriods}</SettingsValue>
      </SettingsRow>
      
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
      
      <SettingsRow>
        <SettingsToggle 
          type="checkbox" 
          id="showContext"
          checked={settings.showContextTimeframe}
          onChange={handleShowContextChange}
        />
        <SettingsLabel htmlFor="showContext">Show Context Timeframe</SettingsLabel>
      </SettingsRow>
      
      {settings.showContextTimeframe && (
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
        <SettingsLabel>Price Change Threshold (%)</SettingsLabel>
        <SettingsSlider 
          type="range" 
          min={0.05} 
          max={1.0} 
          step={0.05}
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
    </SettingsContainer>
  );
};

export default BlackjackSettingsPanel;
